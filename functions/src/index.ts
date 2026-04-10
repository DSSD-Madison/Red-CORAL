import { onRequest } from 'firebase-functions/v2/https'
import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'

initializeApp()

const auth = getAuth()
const firestore = getFirestore()
const storage = getStorage()

// Leaf filter schemas (non-recursive, one per filter type).
// No .optional() or .default() — OpenAI structured outputs require every property in `required`.
const leafFilterSchema = z.union([
  z.object({
    type: z.literal('category'),
    state: z.object({ hiddenCategories: z.array(z.string()), hiddenTypes: z.array(z.string()) }),
  }),
  z.object({
    type: z.literal('country'),
    state: z.object({
      hiddenCountries: z.array(z.string()),
      hiddenDepartments: z.array(z.string()),
      hiddenMunicipalities: z.array(z.string()),
    }),
  }),
  z.object({
    type: z.literal('date'),
    state: z.object({
      date1: z.string(),
      date2: z.string(),
      selectedDateFilter: z.enum(['es', 'es anterior', 'es posterior', 'es entre', 'es entre años']),
    }),
  }),
  z.object({
    type: z.literal('desc'),
    state: z.object({ search: z.string() }),
  }),
  z.object({
    type: z.literal('latlong'),
    state: z.object({ latitude: z.string(), longitude: z.string(), radius: z.string() }),
  }),
])

// not/or state contains only leaf filters (no recursion — OpenAI structured outputs don't support recursive schemas)
const compositeFilterStateSchema = z.object({
  filters: z.array(leafFilterSchema),
})

const filterSchema = z.union([
  z.object({ type: z.literal('category'), state: z.object({ hiddenCategories: z.array(z.string()), hiddenTypes: z.array(z.string()) }) }),
  z.object({
    type: z.literal('country'),
    state: z.object({ hiddenCountries: z.array(z.string()), hiddenDepartments: z.array(z.string()), hiddenMunicipalities: z.array(z.string()) }),
  }),
  z.object({
    type: z.literal('date'),
    state: z.object({
      date1: z.string(),
      date2: z.string(),
      selectedDateFilter: z.enum(['es', 'es anterior', 'es posterior', 'es entre', 'es entre años']),
    }),
  }),
  z.object({ type: z.literal('desc'), state: z.object({ search: z.string() }) }),
  z.object({ type: z.literal('latlong'), state: z.object({ latitude: z.string(), longitude: z.string(), radius: z.string() }) }),
  z.object({ type: z.literal('not'), state: compositeFilterStateSchema }),
  z.object({ type: z.literal('or'), state: compositeFilterStateSchema }),
])

const filterStateSchema = z.object({
  filters: z.array(filterSchema),
})

const incidentProposalSchema = z.object({
  description: z.string().trim().max(4000).nullable(),
  dateString: z.string(),
  typeID: z.union([z.string(), z.array(z.string())]),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  country: z.string(),
  department: z.string(),
  municipality: z.string(),
})

const actionSchema = z.union([
  z.object({ type: z.literal('none') }),
  z.object({
    type: z.literal('apply_filters'),
    filterState: filterStateSchema,
  }),
  z.object({
    type: z.literal('query_incidents'),
    mode: z.enum(['count', 'list', 'summary']),
    filterState: filterStateSchema.nullable(),
    limit: z.number().int().nullable(),
  }),
  z.object({
    type: z.literal('propose_incident'),
    incident: incidentProposalSchema,
  }),
])

const chatResponseSchema = z.object({
  reply: z.string().trim().min(1),
  action: actionSchema,
})

const chatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().trim().min(1).max(2000),
      })
    )
    .max(30),
})

function getBearerToken(authorizationHeader: string | undefined): string | null {
  if (!authorizationHeader) return null
  if (!authorizationHeader.startsWith('Bearer ')) return null
  return authorizationHeader.slice(7).trim() || null
}

type DbMeta = {
  minYear?: number
  maxYear?: number
  countries: string[]
  categories: Array<{ id: string; name: string }>
  types: Array<{ id: string; name: string; categoryID: string }>
}

async function fetchDbMeta(): Promise<DbMeta> {
  const bucket = storage.bucket()
  const file = bucket.file('adminCheckpointState.json') //todo: admins get admin data, public gets public data
  const [contents] = await file.download()
  const data = JSON.parse(contents.toString('utf-8'))

  const categories: DbMeta['categories'] = []
  if (data.Categories && typeof data.Categories === 'object') {
    for (const [id, cat] of Object.entries(data.Categories)) {
      if (cat && typeof cat === 'object' && 'name' in cat && !(cat as { deleted?: boolean }).deleted) {
        categories.push({ id, name: String((cat as { name: string }).name) })
      }
    }
  }

  const types: DbMeta['types'] = []
  if (data.Types && typeof data.Types === 'object') {
    for (const [id, typ] of Object.entries(data.Types)) {
      if (typ && typeof typ === 'object' && 'name' in typ && !(typ as { deleted?: boolean }).deleted) {
        const t = typ as { name: string; categoryID?: string }
        types.push({ id, name: String(t.name), categoryID: String(t.categoryID ?? '') })
      }
    }
  }

  const years = new Set<number>()
  const countrySet = new Set<string>()
  if (data.Incidents && typeof data.Incidents === 'object') {
    for (const incident of Object.values(data.Incidents)) {
      if (incident && typeof incident === 'object' && !(incident as { deleted?: boolean }).deleted) {
        const inc = incident as { dateString?: string; country?: string }
        if (inc.dateString) {
          const year = new Date(inc.dateString).getFullYear()
          if (Number.isFinite(year)) years.add(year)
        }
        if (inc.country) countrySet.add(inc.country)
      }
    }
  }

  return {
    minYear: years.size > 0 ? Math.min(...years) : undefined,
    maxYear: years.size > 0 ? Math.max(...years) : undefined,
    countries: Array.from(countrySet).sort(),
    categories,
    types,
  }
}

function buildSystemPrompt(input: {
  isAdmin: boolean
  dbMeta: DbMeta
}): string {
  const dbMetaJson = JSON.stringify(input.dbMeta, null, 2)

  return [
    'Eres un asistente de Red-CORAL. Responde en español o inglés, según el idioma en que te pregunten.',
    'Objetivos:',
    '1) Ayudar a filtrar incidentes devolviendo JSON compatible con el motor de filtros.',
    '2) Pedir consultas sobre incidentes para que el cliente las ejecute localmente.',
    input.isAdmin
      ? '3) Puedes proponer incidentes nuevos para que una persona administradora confirme el guardado.'
      : '3) No propongas crear incidentes porque la persona no es administradora.',
    'Nunca inventes IDs de tipos/categorías fuera de dbMeta.',
    'Usa acción type="apply_filters" cuando la persona pida filtrar.',
    'Usa acción type="query_incidents" cuando pida conteos/listas/resúmenes basados en la base local.',
    input.isAdmin
      ? 'Usa acción type="propose_incident" solo cuando te pidan crear/agregar incidente y tengas campos suficientes.'
      : 'Si te piden crear/agregar incidente, explica que solo una cuenta admin puede hacerlo.',
    'Si faltan datos críticos para una acción, responde con preguntas de aclaración y action type="none".',
    'Formato de filtro esperado: objeto { index, filters } con filtros de tipos: category, country, date, desc, latlong, not, or.',
    'Estados por tipo:',
    '- category: { hiddenCategories: string[], hiddenTypes: string[] }',
    '- country: { hiddenCountries: string[], hiddenDepartments: string[], hiddenMunicipalities: string[] }',
    '- date: { date1: "YYYY-MM-DD", date2: "YYYY-MM-DD", selectedDateFilter: "es"|"es anterior"|"es posterior"|"es entre"|"es entre años" }',
    '- desc: { search: string }',
    '- latlong: { latitude: string, longitude: string, radius: string }',
    '- not/or: { index: number, filters: Filter[] }',
    'Metadatos de base disponibles (dbMeta):',
    dbMetaJson,
  ].join('\n')
}

export const chat = onRequest(
  {
    cors: [
      'https://redcoralmap.web.app',
      'https://red-coral-map.web.app',
      'https://redcoralmap.firebaseapp.com',
      'https://red-coral-map.firebaseapp.com',
    ],
    secrets: ['OPENAI_API_KEY'],
    timeoutSeconds: 60,
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
      const permissionsSnapshot = await firestore.collection('Permissions').doc(decoded.uid).get()
      const permissions = permissionsSnapshot.exists ? permissionsSnapshot.data() : undefined
      const isAdmin = Boolean(permissions?.isAdmin)

      const parsedRequest = chatRequestSchema.safeParse(request.body)
      if (!parsedRequest.success) {
        response.status(400).json({ error: 'Solicitud inválida' })
        return
      }

      const dbMeta = await fetchDbMeta()

      const model = openai(process.env.OPENAI_MODEL ?? 'gpt-4o-mini')
      const systemPrompt = buildSystemPrompt({ isAdmin, dbMeta })

      const { object } = await generateObject({
        model,
        schema: chatResponseSchema,
        temperature: 0.2,
        system: systemPrompt,
        messages: parsedRequest.data.messages.slice(-14).map((message) => ({
          role: message.role,
          content: message.content,
        })),
      })

      const action = !isAdmin && object.action.type === 'propose_incident' ? { type: 'none' as const } : object.action

      response.status(200).json({
        reply: object.reply,
        action,
      })
    } catch (error) {
      console.error('Error en chat function:', error)
      response.status(500).json({ error: 'No se pudo procesar la solicitud' })
    }
  }
)
