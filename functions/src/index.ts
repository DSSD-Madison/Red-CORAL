import { onRequest } from 'firebase-functions/v2/https'
import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import { streamText, convertToModelMessages, stepCountIs } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'

initializeApp()

const auth = getAuth()
const firestore = getFirestore()
const storage = getStorage()

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type BackendIncident = {
  description?: string
  dateString: string
  typeID: string | string[]
  location: { lat: number; lng: number }
  country: string
  department: string
  municipality: string
  deleted?: boolean
}

type BackendDB = {
  incidents: Record<string, BackendIncident>
  types: Record<string, { name: string; categoryID: string }>
  categories: Record<string, { name: string }>
}

type DbMeta = {
  minYear?: number
  maxYear?: number
  countries: string[]
  categories: Array<{ id: string; name: string }>
  types: Array<{ id: string; name: string; categoryID: string }>
}

type CachedData = { db: BackendDB; dbMeta: DbMeta; loadedAt: number }

// ---------------------------------------------------------------------------
// DB cache (60-second TTL — Cloud Function instances are reused)
// ---------------------------------------------------------------------------

let _cache: CachedData | null = null

async function getCachedData(): Promise<CachedData> {
  if (_cache && Date.now() - _cache.loadedAt < 60_000) return _cache

  const bucket = storage.bucket()
  const [contents] = await bucket.file('adminCheckpointState.json').download()
  const raw = JSON.parse(contents.toString('utf-8'))

  const incidents: BackendDB['incidents'] = {}
  const types: BackendDB['types'] = {}
  const categories: BackendDB['categories'] = {}
  const years = new Set<number>()
  const countrySet = new Set<string>()

  if (raw.Categories && typeof raw.Categories === 'object') {
    for (const [id, cat] of Object.entries(raw.Categories)) {
      const c = cat as { name?: string; deleted?: boolean }
      if (c.name && !c.deleted) categories[id] = { name: c.name }
    }
  }

  if (raw.Types && typeof raw.Types === 'object') {
    for (const [id, typ] of Object.entries(raw.Types)) {
      const t = typ as { name?: string; categoryID?: string; deleted?: boolean }
      if (t.name && !t.deleted) types[id] = { name: t.name, categoryID: t.categoryID ?? '' }
    }
  }

  if (raw.Incidents && typeof raw.Incidents === 'object') {
    for (const [id, inc] of Object.entries(raw.Incidents)) {
      const i = inc as BackendIncident
      if (!i.deleted) {
        incidents[id] = i
        if (i.dateString) {
          const year = new Date(i.dateString).getFullYear()
          if (Number.isFinite(year)) years.add(year)
        }
        if (i.country) countrySet.add(i.country)
      }
    }
  }

  const db: BackendDB = { incidents, types, categories }
  const dbMeta: DbMeta = {
    minYear: years.size > 0 ? Math.min(...years) : undefined,
    maxYear: years.size > 0 ? Math.max(...years) : undefined,
    countries: Array.from(countrySet).sort(),
    categories: Object.entries(categories).map(([id, c]) => ({ id, name: c.name })),
    types: Object.entries(types).map(([id, t]) => ({ id, name: t.name, categoryID: t.categoryID })),
  }

  _cache = { db, dbMeta, loadedAt: Date.now() }
  return _cache
}

// ---------------------------------------------------------------------------
// Filter engine (mirrors src/filters/filterReducer.ts — pure logic only)
// ---------------------------------------------------------------------------

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = (deg: number) => deg * (Math.PI / 180)
  const dLat = R(lat2 - lat1)
  const dLon = R(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(R(lat1)) * Math.cos(R(lat2)) * Math.sin(dLon / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

type FilterState = { filters: Array<{ type: string; state?: unknown }> }

const filterOps: Record<string, (inc: BackendIncident, state: unknown, db: BackendDB) => boolean | undefined> = {
  category: (inc, state, db) => {
    if (!state) return undefined
    const { hiddenCategories, hiddenTypes } = state as { hiddenCategories: string[]; hiddenTypes: string[] }
    const ids = Array.isArray(inc.typeID) ? inc.typeID : [inc.typeID]
    return ids.some((t) => !hiddenCategories.includes(db.types[t]?.categoryID ?? '')) &&
           ids.some((t) => !hiddenTypes.includes(t))
  },
  country: (inc, state) => {
    if (!state) return undefined
    const { hiddenCountries, hiddenDepartments, hiddenMunicipalities } = state as { hiddenCountries: string[]; hiddenDepartments: string[]; hiddenMunicipalities: string[] }
    return (
      !hiddenCountries.includes(inc.country) &&
      !hiddenDepartments.includes(`${inc.country} - ${inc.department}`) &&
      !hiddenMunicipalities.includes(`${inc.country} - ${inc.department} - ${inc.municipality}`)
    )
  },
  date: (inc, state) => {
    if (!state) return undefined
    const { date1, date2, selectedDateFilter } = state as { date1: string; date2: string; selectedDateFilter: string }
    if (!date1) return true
    switch (selectedDateFilter) {
      case 'es': return inc.dateString === date1
      case 'es anterior': return inc.dateString < date1
      case 'es posterior': return inc.dateString > date1
      case 'es entre':
      case 'es entre años': return date2 ? date1 <= inc.dateString && inc.dateString <= date2 : true
      default: return true
    }
  },
  desc: (inc, state) => {
    if (!state || !inc.description) return undefined
    const { search } = state as { search: string }
    return inc.description.toLowerCase().includes(search.toLowerCase())
  },
  latlong: (inc, state) => {
    if (!state) return undefined
    const { latitude, longitude, radius } = state as { latitude: string; longitude: string; radius: string }
    const lat = parseFloat(latitude), lon = parseFloat(longitude), rad = parseFloat(radius)
    if (!isNaN(lat) && !isNaN(lon) && !isNaN(rad)) {
      if (!inc.location) return undefined
      return calculateDistance(lat, lon, inc.location.lat, inc.location.lng) <= rad
    }
    return true
  },
  not: (inc, state, db) => {
    const s = state as FilterState | undefined
    if (!s || s.filters.length === 0) return undefined
    return s.filters.some((f) => (filterOps[f.type]?.(inc, f.state, db)) !== true)
  },
  or: (inc, state, db) => {
    const s = state as FilterState | undefined
    if (!s || s.filters.length === 0) return undefined
    return s.filters.some((f) => (filterOps[f.type]?.(inc, f.state, db)) !== false)
  },
}

function applyFilterState(incidents: BackendDB['incidents'], db: BackendDB, filterState: FilterState): [string, BackendIncident][] {
  return Object.entries(incidents).filter(([, inc]) =>
    filterState.filters.every((f) => (filterOps[f.type]?.(inc, f.state, db)) !== false)
  )
}

// ---------------------------------------------------------------------------
// Aggregations
// ---------------------------------------------------------------------------

type AggregationResult = {
  count: number
  dateRange: { earliest: string; latest: string } | null
  byCategory: { name: string; count: number }[]
  byType: { name: string; count: number }[]
  byCountry: { name: string; count: number }[]
  byYear: { year: number; count: number }[]
}

function computeAggregations(incidents: [string, BackendIncident][], db: BackendDB): AggregationResult {
  if (incidents.length === 0) return { count: 0, dateRange: null, byCategory: [], byType: [], byCountry: [], byYear: [] }

  const typeCounts = new Map<string, number>()
  const catCounts = new Map<string, number>()
  const countryCounts = new Map<string, number>()
  const yearCounts = new Map<number, number>()
  let earliest = '9999-99-99', latest = '0000-00-00'

  for (const [, inc] of incidents) {
    if (inc.dateString < earliest) earliest = inc.dateString
    if (inc.dateString > latest) latest = inc.dateString
    countryCounts.set(inc.country, (countryCounts.get(inc.country) ?? 0) + 1)
    const year = Number(inc.dateString.slice(0, 4))
    if (!isNaN(year)) yearCounts.set(year, (yearCounts.get(year) ?? 0) + 1)
    const ids = Array.isArray(inc.typeID) ? inc.typeID : [inc.typeID]
    for (const id of ids) {
      typeCounts.set(id, (typeCounts.get(id) ?? 0) + 1)
      const catID = db.types[id]?.categoryID
      if (catID) catCounts.set(catID, (catCounts.get(catID) ?? 0) + 1)
    }
  }

  const top10 = <K>(map: Map<K, number>, nameOf: (k: K) => string) =>
    Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, count]) => ({ name: nameOf(k), count }))

  return {
    count: incidents.length,
    dateRange: { earliest, latest },
    byType: top10(typeCounts, (id) => db.types[id]?.name ?? String(id)),
    byCategory: top10(catCounts, (id) => db.categories[id]?.name ?? String(id)),
    byCountry: top10(countryCounts, (id) => String(id)),
    byYear: Array.from(yearCounts.entries()).sort((a, b) => a[0] - b[0]).map(([year, count]) => ({ year, count })),
  }
}

// ---------------------------------------------------------------------------
// Zod schemas shared across tools
// ---------------------------------------------------------------------------

const leafFilterSchema = z.union([
  z.object({ type: z.literal('category'), state: z.object({ hiddenCategories: z.array(z.string()), hiddenTypes: z.array(z.string()) }) }),
  z.object({ type: z.literal('country'), state: z.object({ hiddenCountries: z.array(z.string()), hiddenDepartments: z.array(z.string()), hiddenMunicipalities: z.array(z.string()) }) }),
  z.object({ type: z.literal('date'), state: z.object({ date1: z.string(), date2: z.string(), selectedDateFilter: z.enum(['es', 'es anterior', 'es posterior', 'es entre', 'es entre años']) }) }),
  z.object({ type: z.literal('desc'), state: z.object({ search: z.string() }) }),
  z.object({ type: z.literal('latlong'), state: z.object({ latitude: z.string(), longitude: z.string(), radius: z.string() }) }),
])

const compositeFilterStateSchema = z.object({ filters: z.array(leafFilterSchema) })

const filterSchema = z.union([
  z.object({ type: z.literal('category'), state: z.object({ hiddenCategories: z.array(z.string()), hiddenTypes: z.array(z.string()) }) }),
  z.object({ type: z.literal('country'), state: z.object({ hiddenCountries: z.array(z.string()), hiddenDepartments: z.array(z.string()), hiddenMunicipalities: z.array(z.string()) }) }),
  z.object({ type: z.literal('date'), state: z.object({ date1: z.string(), date2: z.string(), selectedDateFilter: z.enum(['es', 'es anterior', 'es posterior', 'es entre', 'es entre años']) }) }),
  z.object({ type: z.literal('desc'), state: z.object({ search: z.string() }) }),
  z.object({ type: z.literal('latlong'), state: z.object({ latitude: z.string(), longitude: z.string(), radius: z.string() }) }),
  z.object({ type: z.literal('not'), state: compositeFilterStateSchema }),
  z.object({ type: z.literal('or'), state: compositeFilterStateSchema }),
])

const filterStateSchema = z.object({ filters: z.array(filterSchema) })

const incidentProposalSchema = z.object({
  description: z.string().trim().max(4000).nullable(),
  dateString: z.string(),
  typeID: z.union([z.string(), z.array(z.string())]),
  location: z.object({ lat: z.number(), lng: z.number() }),
  country: z.string(),
  department: z.string(),
  municipality: z.string(),
})

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

function getBearerToken(authorizationHeader: string | undefined): string | null {
  if (!authorizationHeader?.startsWith('Bearer ')) return null
  return authorizationHeader.slice(7).trim() || null
}

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

function buildSystemPrompt(input: { isAdmin: boolean; dbMeta: DbMeta }): string {
  return [
    'Eres un asistente de Red-CORAL. Responde en el mismo idioma que use el usuario (español o inglés).',
    '',
    'Capacidades:',
    '- query_incidents: SIEMPRE llama esta herramienta antes de responder preguntas sobre datos de incidentes. Nunca inventes cifras.',
    '- get_incident_descriptions: Para obtener texto de descripción de IDs específicos que ya devolvió query_incidents.',
    '- apply_filters: Cuando el usuario pida filtrar el mapa. No llames esta herramienta para consultas, solo para actualizar la vista del mapa.',
    input.isAdmin
      ? '- propose_incident: Propón incidentes nuevos cuando el usuario lo solicite y tengas suficientes campos (fecha YYYY-MM-DD, tipo, ubicación, país, departamento, municipio).'
      : '- propose_incident: No disponible — el usuario no es administrador.',
    '',
    'Reglas:',
    '- Nunca inventes IDs de tipos/categorías que no estén en los metadatos.',
    '- Cuando el recuento supere el límite, usa los agregados para responder; no pidas más registros a menos que el usuario los necesite.',
    '- Si faltan datos para una acción, haz preguntas de aclaración primero.',
    '',
    'Metadatos de la base de datos:',
    JSON.stringify(input.dbMeta, null, 2),
  ].join('\n')
}

// ---------------------------------------------------------------------------
// Request schema (accepts AI SDK UIMessage[] format)
// ---------------------------------------------------------------------------

const chatRequestSchema = z.object({
  messages: z.array(z.unknown()).min(1).max(40),
})

// ---------------------------------------------------------------------------
// Cloud Function
// ---------------------------------------------------------------------------

export const chat = onRequest(
  {
    cors: [
      'https://redcoralmap.web.app',
      'https://red-coral-map.web.app',
      'https://redcoralmap.firebaseapp.com',
      'https://red-coral-map.firebaseapp.com',
    ],
    secrets: ['OPENAI_API_KEY'],
    timeoutSeconds: 120,
    maxInstances: 10,
    region: 'us-central1',
    invoker: 'public',
  },
  async (request, response) => {
    if (request.method !== 'POST') {
      response.status(405).json({ error: 'Método no permitido' })
      return
    }

    const token = getBearerToken(request.get('Authorization'))
    if (!token) {
      response.status(401).json({ error: 'No autorizado' })
      return
    }

    try {
      const decoded = await auth.verifyIdToken(token)
      const permissionsSnap = await firestore.collection('Permissions').doc(decoded.uid).get()
      const permissions = permissionsSnap.exists ? permissionsSnap.data() : undefined
      const isAdmin = Boolean(permissions?.isAdmin)

      const parsedRequest = chatRequestSchema.safeParse(request.body)
      if (!parsedRequest.success) {
        response.status(400).json({ error: 'Solicitud inválida' })
        return
      }

      const { db, dbMeta } = await getCachedData()

      const model = openai(process.env.OPENAI_MODEL ?? 'gpt-4o-mini')
      const systemPrompt = buildSystemPrompt({ isAdmin, dbMeta })

      // Convert UIMessage[] → ModelMessage[] for the AI SDK
      const modelMessages = await convertToModelMessages(
        parsedRequest.data.messages as Parameters<typeof convertToModelMessages>[0]
      )

      const result = streamText({
        model,
        system: systemPrompt,
        messages: modelMessages,
        stopWhen: stepCountIs(6),
        abortSignal: request.socket?.destroyed ? AbortSignal.abort() : undefined,
        tools: {
          query_incidents: {
            description:
              'Filter incidents and return aggregations. When the result count is within the limit, full records (without descriptions) are included inline. Use this for ANY question about incident data.',
            inputSchema: z.object({
              filterState: filterStateSchema.nullable().describe('Filter spec. null = all incidents.'),
              limit: z.number().int().min(1).max(50).default(50).describe('Max records to return inline. Aggregations are always returned.'),
            }),
            execute: async ({ filterState, limit }) => {
              const fs: FilterState = filterState ?? { filters: [] }
              const matched = applyFilterState(db.incidents, db, fs)
              const aggs = computeAggregations(matched, db)

              const records =
                matched.length <= limit
                  ? matched.map(([id, inc]) => ({
                      id,
                      dateString: inc.dateString,
                      country: inc.country,
                      department: inc.department,
                      municipality: inc.municipality,
                      location: inc.location,
                      typeNames: (Array.isArray(inc.typeID) ? inc.typeID : [inc.typeID])
                        .map((t) => db.types[t]?.name)
                        .filter((n): n is string => Boolean(n)),
                    }))
                  : null

              return { ...aggs, records, truncated: matched.length > limit }
            },
          },

          get_incident_descriptions: {
            description: 'Fetch description text for specific incident IDs previously returned by query_incidents. Only use when the user asks for details on specific incidents.',
            inputSchema: z.object({
              ids: z.array(z.string()).min(1).max(20),
            }),
            execute: async ({ ids }) => {
              return ids.map((id: string) => ({
                id,
                description: db.incidents[id]?.description ?? null,
                found: id in db.incidents,
              }))
            },
          },

          apply_filters: {
            description:
              "Apply a filter to the user's map and statistics view. Use ONLY when the user explicitly asks to filter what they see on the map. The filter will be saved and applied immediately.",
            inputSchema: z.object({
              filterState: filterStateSchema,
            }),
            // No execute — handled client-side via onToolCall
          },

          ...(isAdmin
            ? {
                propose_incident: {
                  description:
                    'Propose a new incident for admin review. Only use when the user asks to create/add an incident and you have all required fields.',
                  inputSchema: incidentProposalSchema,
                  // No execute — handled client-side via confirmation panel
                },
              }
            : {}),
        },
      })

      result.pipeUIMessageStreamToResponse(response)
    } catch (error) {
      console.error({ event: 'chat_error', error: error instanceof Error ? error.message : String(error) })
      if (!response.headersSent) {
        response.status(500).json({ error: 'No se pudo procesar la solicitud' })
      }
    }
  }
)
