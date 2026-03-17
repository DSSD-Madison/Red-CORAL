import React, { FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { LucideLoader2, LucideSend, LucideSparkles, LucideMessageCircle, LucideFilter, LucideMapPin, LucideBarChart3, LucideRotateCcw } from 'lucide-react'
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
    const mode = value.action.mode === 'count' || value.action.mode === 'list' || value.action.mode === 'summary' ? value.action.mode : 'summary'
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

const SUGGESTIONS = [
  { icon: LucideFilter, label: 'Filtrar por país', message: 'Quiero filtrar incidentes por país' },
  { icon: LucideMapPin, label: 'Buscar por ubicación', message: 'Muéstrame incidentes cerca de una ubicación' },
  { icon: LucideBarChart3, label: 'Resumen de datos', message: 'Dame un resumen de todos los incidentes' },
]

const Chat: React.FC = () => {
  const { auth, db, isAdmin, addIncident } = useDB()
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const stored = getStoredMessages()
    if (stored.length > 0) return stored
    return []
  })
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [pendingIncident, setPendingIncident] = useState<Incident | null>(null)
  const [isConfirmingIncident, setIsConfirmingIncident] = useState(false)
  const [hasAppliedFilters, setHasAppliedFilters] = useState(false)

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    })
  }, [])

  useEffect(() => {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-80)))
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

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

  function handleSuggestion(message: string) {
    if (isSending) return
    const userMessage: ChatMessage = { id: createId(), role: 'user', content: message }
    const nextConversation = [...messages, userMessage]
    setMessages(nextConversation)
    requestAssistant(nextConversation)
  }

  const isEmptyState = messages.length === 0

  return (
    <div className="flex h-full flex-col bg-slate-200 font-proxima-nova">
      <div className="flex min-h-0 flex-1 flex-col">
        {/* Header */}
          <div className="flex items-center justify-between border-b border-stone-200/60 bg-white/80 px-5 py-3 backdrop-blur-sm">
            {hasAppliedFilters ? (
              <Link
                to="/stats"
                className="flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-200/30 px-3 py-1 text-xs font-semibold text-red-700 transition-colors hover:bg-rose-200/50"
              >
                <LucideFilter className="h-3 w-3" />
                Ver filtros aplicados
              </Link>
            ) : (
              <div />
            )}
            <button
              onClick={() => {
                setMessages([])
                setInput('')
                localStorage.removeItem(CHAT_STORAGE_KEY)
                setHasAppliedFilters(false)
              }}
              className="flex items-center gap-1.5 rounded-full border border-stone-200/60 bg-slate-50/50 px-3 py-1 text-xs font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-100"
              title="Limpiar historial de chat"
            >
              <LucideRotateCcw className="h-3 w-3" />
              Limpiar
            </button>
          </div>

        {/* Messages area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {isEmptyState ? (
            /* Empty / welcome state */
            <div className="flex h-full flex-col items-center justify-center px-6 py-12">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-200/60 to-stone-200/40 shadow-sm">
                <LucideMessageCircle className="h-8 w-8 text-red-700" />
              </div>
              <h2 className="mb-2 font-merriweather text-xl font-bold text-slate-900">Bienvenido al Asistente</h2>
              <p className="mb-8 max-w-sm text-center text-sm leading-relaxed text-slate-600">
                Puedo ayudarte a crear filtros, consultar incidentes
                {isAdmin ? ', y proponer nuevos registros' : ''} en la base de datos de Red-CORAL.
              </p>

              <div className="grid w-full max-w-md gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion.message}
                    onClick={() => handleSuggestion(suggestion.message)}
                    disabled={isSending}
                    className="group flex items-center gap-3 rounded-xl border border-stone-200/70 bg-white px-4 py-3 text-left text-sm text-slate-800 shadow-sm transition-all hover:border-red-600/40 hover:bg-rose-200/10 hover:shadow-md disabled:opacity-50"
                  >
                    <suggestion.icon className="h-4 w-4 shrink-0 text-slate-400 transition-colors group-hover:text-red-700" />
                    {suggestion.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Conversation */
            <div className="mx-auto max-w-2xl space-y-1 px-4 py-4">
              {messages.map((message, index) => {
                const isUser = message.role === 'user'
                const isFirst = index === 0 || messages[index - 1].role !== message.role
                return (
                  <div
                    key={message.id}
                    className={`flex animate-[fadeSlideIn_0.25s_ease-out_both] ${isUser ? 'justify-end' : 'justify-start'} ${isFirst ? 'mt-3' : ''}`}
                  >
                    {!isUser && isFirst && (
                      <div className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-600/10">
                        <LucideSparkles className="h-3.5 w-3.5 text-red-700" />
                      </div>
                    )}
                    {!isUser && !isFirst && <div className="mr-2 w-7 shrink-0" />}
                    <div
                      className={`max-w-[80%] whitespace-pre-wrap px-4 py-2.5 text-sm leading-relaxed ${
                        isUser
                          ? 'rounded-2xl rounded-br-md bg-red-700 text-white shadow-sm'
                          : 'rounded-2xl rounded-bl-md bg-white text-slate-900 shadow-sm ring-1 ring-stone-200/40'
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                )
              })}

              {isSending && (
                <div className="flex animate-[fadeSlideIn_0.2s_ease-out_both] items-start gap-2 pt-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-600/10">
                    <LucideSparkles className="h-3.5 w-3.5 text-red-700" />
                  </div>
                  <div className="rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm ring-1 ring-stone-200/40">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 animate-[bounce_1.4s_ease-in-out_infinite] rounded-full bg-slate-400/50" />
                      <span className="h-2 w-2 animate-[bounce_1.4s_ease-in-out_0.2s_infinite] rounded-full bg-slate-400/50" />
                      <span className="h-2 w-2 animate-[bounce_1.4s_ease-in-out_0.4s_infinite] rounded-full bg-slate-400/50" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pending incident confirmation */}
        {pendingIncident && (
          <div className="border-t border-stone-200/40 bg-white px-5 py-4">
            <div className="mx-auto max-w-2xl">
              <p className="mb-2.5 font-merriweather text-sm font-bold text-slate-900">Confirmar incidente propuesto</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 rounded-lg border border-stone-200/50 bg-slate-50/60 p-3 text-sm">
                <p>
                  <span className="font-semibold text-slate-600">Fecha:</span> <span className="text-slate-900">{pendingIncident.dateString}</span>
                </p>
                <p>
                  <span className="font-semibold text-slate-600">País:</span> <span className="text-slate-900">{pendingIncident.country}</span>
                </p>
                <p>
                  <span className="font-semibold text-slate-600">Departamento:</span>{' '}
                  <span className="text-slate-900">{pendingIncident.department}</span>
                </p>
                <p>
                  <span className="font-semibold text-slate-600">Municipio:</span>{' '}
                  <span className="text-slate-900">{pendingIncident.municipality}</span>
                </p>
                <p>
                  <span className="font-semibold text-slate-600">Ubicación:</span>{' '}
                  <span className="text-slate-900">
                    {pendingIncident.location.lat}, {pendingIncident.location.lng}
                  </span>
                </p>
                <p>
                  <span className="font-semibold text-slate-600">Tipos:</span>{' '}
                  <span className="text-slate-900">
                    {extractTypeIDs(pendingIncident.typeID)
                      .map((typeID) => db.Types[typeID]?.name ?? typeID)
                      .join(', ')}
                  </span>
                </p>
                {pendingIncident.description && (
                  <p className="col-span-2">
                    <span className="font-semibold text-slate-600">Descripción:</span>{' '}
                    <span className="text-slate-900">{pendingIncident.description}</span>
                  </p>
                )}
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={confirmPendingIncident}
                  disabled={isConfirmingIncident}
                  className="flex items-center gap-1.5 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isConfirmingIncident && <LucideLoader2 className="h-3.5 w-3.5 animate-spin" />}
                  {isConfirmingIncident ? 'Guardando...' : 'Confirmar'}
                </button>
                <button
                  onClick={cancelPendingIncident}
                  className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Input bar */}
        <div className="border-t border-stone-200/40 bg-white px-4 py-3">
          <form onSubmit={handleSubmit} className="mx-auto flex max-w-2xl items-center gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Escribe un mensaje..."
              className="flex-1 resize-none rounded-xl border border-stone-200/60 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400/70 transition-colors [field-sizing:content] focus:border-red-600/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-200/50"
            />
            <button
              type="submit"
              disabled={isSending || input.trim().length === 0}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-700 text-white shadow-sm transition-all hover:bg-slate-900 hover:shadow-md disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-slate-400 disabled:shadow-none"
            >
              {isSending ? <LucideLoader2 className="h-4 w-4 animate-spin" /> : <LucideSend className="h-4 w-4" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Chat
