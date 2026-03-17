import React, { FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { LucideLoader2 } from 'lucide-react'
import { useDB } from '@/context/DBContext'
import { filterOperations, filterType, initialFilterState } from '@/filters/filterReducer'
import { DB, Incident } from 'types'

type ChatRole = 'user' | 'assistant'

type ChatMessage = {
  id: string
  role: ChatRole
  content: string
}

type RawFilter = {
  id?: number
  type: filterType['type']
  state?: unknown
}

type RawFilterState = {
  index?: number
  filters: RawFilter[]
}

type ChatAction =
  | { type: 'none' }
  | { type: 'apply_filters'; filterState: RawFilterState }
  | { type: 'query_incidents'; mode?: 'count' | 'list' | 'summary'; filterState?: RawFilterState; limit?: number }
  | { type: 'propose_incident'; incident: IncidentProposal }

type ChatResponse = {
  reply: string
  action: ChatAction
}

type IncidentProposal = {
  description?: string
  dateString: string
  typeID: string | string[]
  location: { lat: number; lng: number }
  country: string
  department: string
  municipality: string
}

const CHAT_STORAGE_KEY = 'aiChatMessagesV1'

const FILTER_TYPES: filterType['type'][] = ['category', 'country', 'date', 'desc', 'latlong', 'not', 'or']

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random()}`
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isFilterType(value: unknown): value is filterType['type'] {
  return typeof value === 'string' && FILTER_TYPES.includes(value as filterType['type'])
}

function parseRawFilterState(value: unknown): RawFilterState | undefined {
  if (!isObject(value) || !Array.isArray(value.filters)) return undefined

  const filters: RawFilter[] = value.filters
    .map((item) => {
      if (!isObject(item) || !isFilterType(item.type)) return null
      const rawFilter: RawFilter = {
        type: item.type,
      }
      if (typeof item.id === 'number') rawFilter.id = item.id
      if ('state' in item) rawFilter.state = item.state
      return rawFilter
    })
    .filter((item): item is RawFilter => item !== null)

  if (filters.length === 0) return undefined

  return {
    index: typeof value.index === 'number' ? value.index : undefined,
    filters,
  }
}

function hydrateFilterGroup(rawFilters: RawFilter[], startAt: number): { filters: filterType[]; nextId: number } {
  let nextId = startAt
  const filters: filterType[] = []

  for (const rawFilter of rawFilters) {
    const id = typeof rawFilter.id === 'number' ? rawFilter.id : nextId
    nextId = Math.max(nextId, id + 1)

    if (rawFilter.type === 'not' || rawFilter.type === 'or') {
      const nestedState = isObject(rawFilter.state) ? rawFilter.state : {}
      const nestedRawState = parseRawFilterState(nestedState)
      const hydratedNested = hydrateFilterGroup(nestedRawState?.filters ?? [], nextId)
      nextId = hydratedNested.nextId
      filters.push({
        id,
        type: rawFilter.type,
        state: {
          ...nestedState,
          index: hydratedNested.nextId,
          filters: hydratedNested.filters,
        },
      })
      continue
    }

    filters.push({
      id,
      type: rawFilter.type,
      state: rawFilter.state,
    })
  }

  return { filters, nextId }
}

function normalizeFilterState(rawFilterState: RawFilterState | undefined): { index: number; filters: filterType[] } {
  if (!rawFilterState || rawFilterState.filters.length === 0) {
    return initialFilterState(0)
  }

  const startAt = typeof rawFilterState.index === 'number' && rawFilterState.index > 0 ? rawFilterState.index : 0
  const hydrated = hydrateFilterGroup(rawFilterState.filters, startAt)

  if (hydrated.filters.length === 0) {
    return initialFilterState(0)
  }

  return {
    index: hydrated.nextId,
    filters: hydrated.filters,
  }
}

function extractTypeIDs(typeID: Incident['typeID']): string[] {
  return Array.isArray(typeID) ? typeID : [typeID]
}

function typeNamesForIncident(db: DB, incident: Incident): string {
  return extractTypeIDs(incident.typeID)
    .map((id) => db.Types[id]?.name)
    .filter((name): name is string => Boolean(name))
    .join(', ')
}

function applyFilterStateOnIncidents(db: DB, filterState: { index: number; filters: filterType[] }): [string, Incident][] {
  return Object.entries(db.Incidents).filter(([, incident]) =>
    filterState.filters.every((filter) => filterOperations[filter.type](incident, filter.state, db) !== false)
  )
}

function summarizeQueryResult(db: DB, incidents: [string, Incident][], mode: 'count' | 'list' | 'summary', limit: number): string {
  if (mode === 'count') {
    return `Hay ${incidents.length} incidentes que cumplen los criterios.`
  }

  if (mode === 'list') {
    if (incidents.length === 0) {
      return 'No encontré incidentes con esos criterios.'
    }

    const lines = incidents.slice(0, limit).map(([id, incident], index) => {
      const types = typeNamesForIncident(db, incident)
      return `${index + 1}. ${incident.dateString} · ${incident.country} / ${incident.department} / ${incident.municipality} · ${types || 'Tipo no disponible'} · ID ${id}`
    })

    return `Lista de incidentes (${Math.min(limit, incidents.length)} de ${incidents.length}):\n${lines.join('\n')}`
  }

  if (incidents.length === 0) {
    return 'No encontré incidentes para resumir con esos criterios.'
  }

  const countryCounts = new Map<string, number>()
  const typeCounts = new Map<string, number>()

  for (const [, incident] of incidents) {
    countryCounts.set(incident.country, (countryCounts.get(incident.country) ?? 0) + 1)

    for (const typeID of extractTypeIDs(incident.typeID)) {
      const name = db.Types[typeID]?.name ?? typeID
      typeCounts.set(name, (typeCounts.get(name) ?? 0) + 1)
    }
  }

  const topCountries = Array.from(countryCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([country, count]) => `${country}: ${count}`)
    .join(' · ')

  const topTypes = Array.from(typeCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => `${name}: ${count}`)
    .join(' · ')

  return `Resumen de ${incidents.length} incidentes. Países principales: ${topCountries || 'sin datos'}. Tipos principales: ${topTypes || 'sin datos'}.`
}

function normalizeIncidentProposal(proposal: IncidentProposal, db: DB): Incident | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(proposal.dateString)) return null

  const parsedTypeIDs = (Array.isArray(proposal.typeID) ? proposal.typeID : [proposal.typeID]).filter((typeID) => Boolean(db.Types[typeID]))
  if (parsedTypeIDs.length === 0) return null

  const lat = Number(proposal.location?.lat)
  const lng = Number(proposal.location?.lng)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

  if (!proposal.country?.trim() || !proposal.department?.trim() || !proposal.municipality?.trim()) return null

  const description = proposal.description?.trim() || undefined

  return {
    dateString: proposal.dateString,
    typeID: parsedTypeIDs,
    location: { lat, lng },
    country: proposal.country.trim(),
    department: proposal.department.trim(),
    municipality: proposal.municipality.trim(),
    description,
  }
}

function parseChatResponse(value: unknown): ChatResponse | null {
  if (!isObject(value) || typeof value.reply !== 'string' || !isObject(value.action) || typeof value.action.type !== 'string') {
    return null
  }

  if (value.action.type === 'none') {
    return {
      reply: value.reply,
      action: { type: 'none' },
    }
  }

  if (value.action.type === 'apply_filters') {
    const filterState = parseRawFilterState(value.action.filterState)
    if (!filterState) return null
    return {
      reply: value.reply,
      action: {
        type: 'apply_filters',
        filterState,
      },
    }
  }

  if (value.action.type === 'query_incidents') {
    const mode =
      value.action.mode === 'count' || value.action.mode === 'list' || value.action.mode === 'summary' ? value.action.mode : 'summary'
    const filterState = parseRawFilterState(value.action.filterState)
    const limit = typeof value.action.limit === 'number' ? value.action.limit : undefined
    return {
      reply: value.reply,
      action: {
        type: 'query_incidents',
        mode,
        filterState,
        limit,
      },
    }
  }

  if (value.action.type === 'propose_incident') {
    const incident = value.action.incident
    if (!isObject(incident)) return null
    if (
      typeof incident.dateString !== 'string' ||
      !isObject(incident.location) ||
      typeof incident.location.lat !== 'number' ||
      typeof incident.location.lng !== 'number' ||
      typeof incident.country !== 'string' ||
      typeof incident.department !== 'string' ||
      typeof incident.municipality !== 'string'
    ) {
      return null
    }

    const proposal: IncidentProposal = {
      dateString: incident.dateString,
      typeID: Array.isArray(incident.typeID) ? incident.typeID.map((entry) => String(entry)) : String(incident.typeID ?? ''),
      location: {
        lat: incident.location.lat,
        lng: incident.location.lng,
      },
      country: incident.country,
      department: incident.department,
      municipality: incident.municipality,
      description: typeof incident.description === 'string' ? incident.description : undefined,
    }

    return {
      reply: value.reply,
      action: {
        type: 'propose_incident',
        incident: proposal,
      },
    }
  }

  return null
}

function getStoredMessages(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []

    return parsed
      .map((item) => {
        if (!isObject(item) || typeof item.id !== 'string' || typeof item.content !== 'string') return null
        if (item.role !== 'user' && item.role !== 'assistant') return null
        return {
          id: item.id,
          role: item.role,
          content: item.content,
        } satisfies ChatMessage
      })
      .filter((item): item is ChatMessage => item !== null)
      .slice(-80)
  } catch {
    localStorage.removeItem(CHAT_STORAGE_KEY)
    return []
  }
}

const Chat: React.FC = () => {
  const { auth, db, isAdmin, addIncident } = useDB()
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const stored = getStoredMessages()
    if (stored.length > 0) return stored

    return [
      {
        id: createId(),
        role: 'assistant',
        content:
          'Hola. Soy el asistente de Red-CORAL. Puedo ayudarte a crear filtros, consultar incidentes y, si eres admin, proponer nuevos incidentes con confirmación.',
      },
    ]
  })
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [pendingIncident, setPendingIncident] = useState<Incident | null>(null)
  const [isConfirmingIncident, setIsConfirmingIncident] = useState(false)
  const [hasAppliedFilters, setHasAppliedFilters] = useState(false)

  useEffect(() => {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-80)))
  }, [messages])

  function appendAssistant(content: string) {
    setMessages((previous) => [...previous, { id: createId(), role: 'assistant', content }])
  }

  async function handleAction(action: ChatAction) {
    if (action.type === 'none') {
      return
    }

    if (action.type === 'apply_filters') {
      const normalized = normalizeFilterState(action.filterState)
      localStorage.setItem('filterState', JSON.stringify(normalized))
      setHasAppliedFilters(true)
      appendAssistant('Apliqué los filtros al motor. Puedes revisarlos en la sección de Estadísticas.')
      return
    }

    if (action.type === 'query_incidents') {
      const normalized = normalizeFilterState(action.filterState)
      const filtered = applyFilterStateOnIncidents(db, normalized)
      const queryMode = action.mode ?? 'summary'
      const queryLimit = action.limit && action.limit > 0 ? Math.min(action.limit, 50) : 10
      const result = summarizeQueryResult(db, filtered, queryMode, queryLimit)
      appendAssistant(result)
      return
    }

    if (!isAdmin) {
      appendAssistant('No tienes permisos de administrador para proponer incidentes nuevos.')
      return
    }

    const normalizedIncident = normalizeIncidentProposal(action.incident, db)
    if (!normalizedIncident) {
      appendAssistant('No pude construir un incidente válido con esos datos. Intenta incluir fecha, tipo, ubicación y división territorial.')
      return
    }

    setPendingIncident(normalizedIncident)
    appendAssistant('Preparé una propuesta de incidente. Revísala y confirma si deseas guardarla.')
  }

  async function requestAssistant(conversation: ChatMessage[]) {
    const currentUser = auth.currentUser

    if (!currentUser) {
      appendAssistant('Necesitas iniciar sesión para usar el asistente.')
      return
    }

    setIsSending(true)

    try {
      const token = await currentUser.getIdToken()
      const apiUrl = import.meta.env.VITE_CHAT_API_URL || '/api/chat'

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: conversation.slice(-30).map((message) => ({ role: message.role, content: message.content })),
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Error de red')
      }

      const payload = (await response.json()) as unknown
      const parsed = parseChatResponse(payload)

      if (!parsed) {
        appendAssistant('La respuesta del asistente no tuvo un formato válido. Inténtalo nuevamente.')
        return
      }

      appendAssistant(parsed.reply)
      await handleAction(parsed.action)
    } catch (error) {
      console.error(error)
      appendAssistant('No pude procesar tu solicitud ahora mismo. Inténtalo nuevamente en unos segundos.')
    } finally {
      setIsSending(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmed = input.trim()
    if (!trimmed || isSending) return

    const userMessage: ChatMessage = {
      id: createId(),
      role: 'user',
      content: trimmed,
    }

    const nextConversation = [...messages, userMessage]
    setMessages(nextConversation)
    setInput('')
    await requestAssistant(nextConversation)
  }

  async function confirmPendingIncident() {
    if (!pendingIncident || isConfirmingIncident) return

    setIsConfirmingIncident(true)
    try {
      const result = await addIncident(pendingIncident)
      if (result) {
        appendAssistant('Incidente creado con éxito.')
        setPendingIncident(null)
      } else {
        appendAssistant('No se pudo crear el incidente. Verifica la información e intenta nuevamente.')
      }
    } catch (error) {
      console.error(error)
      appendAssistant('Ocurrió un error al guardar el incidente.')
    } finally {
      setIsConfirmingIncident(false)
    }
  }

  function cancelPendingIncident() {
    setPendingIncident(null)
    appendAssistant('Cancelé la creación del incidente propuesto.')
  }

  return (
    <div className="flex h-full flex-col bg-slate-200 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Asistente IA</h1>
        {hasAppliedFilters && (
          <Link to="/stats" className="rounded-full border border-blue-500 bg-blue-100 px-3 py-1 text-sm text-blue-700 hover:bg-blue-200">
            Ver filtros en Estadísticas
          </Link>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col rounded-lg bg-white shadow">
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${
                  message.role === 'user' ? 'bg-harvard-crimson text-white' : 'bg-slate-100 text-slate-800'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}

          {isSending && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <LucideLoader2 className="h-4 w-4 animate-spin" />
              Generando respuesta...
            </div>
          )}
        </div>

        {pendingIncident && (
          <div className="border-t border-slate-200 bg-slate-50 p-4">
            <p className="mb-2 text-sm font-semibold">Confirmación de incidente propuesto</p>
            <div className="grid gap-1 text-sm text-slate-700">
              <p>
                <span className="font-medium">Fecha:</span> {pendingIncident.dateString}
              </p>
              <p>
                <span className="font-medium">País:</span> {pendingIncident.country}
              </p>
              <p>
                <span className="font-medium">Departamento:</span> {pendingIncident.department}
              </p>
              <p>
                <span className="font-medium">Municipio:</span> {pendingIncident.municipality}
              </p>
              <p>
                <span className="font-medium">Ubicación:</span> {pendingIncident.location.lat}, {pendingIncident.location.lng}
              </p>
              <p>
                <span className="font-medium">Tipos:</span>{' '}
                {extractTypeIDs(pendingIncident.typeID)
                  .map((typeID) => db.Types[typeID]?.name ?? typeID)
                  .join(', ')}
              </p>
              {pendingIncident.description && (
                <p>
                  <span className="font-medium">Descripción:</span> {pendingIncident.description}
                </p>
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={confirmPendingIncident}
                disabled={isConfirmingIncident}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isConfirmingIncident ? 'Guardando...' : 'Confirmar'}
              </button>
              <button onClick={cancelPendingIncident} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100">
                Cancelar
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2 border-t border-slate-200 p-3">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Escribe un mensaje"
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isSending || input.trim().length === 0}
            className="rounded-md bg-harvard-crimson px-4 py-2 text-sm text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  )
}

export default Chat
