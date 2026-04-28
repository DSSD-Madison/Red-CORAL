import React, { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Markdown from 'react-markdown'
import { Link } from 'react-router'
import {
  LucideLoader2,
  LucideSend,
  LucideSparkles,
  LucideMessageCircle,
  LucideFilter,
  LucideMapPin,
  LucideBarChart3,
  LucideRotateCcw,
  LucideSquare,
  LucideChevronDown,
  LucideChevronRight,
  LucideSearch,
  LucideAlertCircle,
  LucideCheck,
  LucideX,
} from 'lucide-react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, UIMessage, lastAssistantMessageIsCompleteWithToolCalls } from 'ai'
import { useDB } from '@/context/DBContext'
import { filterType, initialFilterState } from '@/filters/filterReducer'
import { DB, Incident } from 'types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RawFilter = {
  id?: number
  type: filterType['type']
  state?: unknown
}

type RawFilterState = {
  index?: number
  filters: RawFilter[]
}

const FILTER_TYPES: filterType['type'][] = ['category', 'country', 'date', 'desc', 'latlong', 'not', 'or']

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isFilterType(value: unknown): value is filterType['type'] {
  return typeof value === 'string' && FILTER_TYPES.includes(value as filterType['type'])
}

// ---------------------------------------------------------------------------
// Filter normalization (still needed for apply_filters onToolCall handling)
// ---------------------------------------------------------------------------

function parseRawFilterState(value: unknown): RawFilterState | undefined {
  if (!isObject(value) || !Array.isArray(value.filters)) return undefined
  const filters: RawFilter[] = (value.filters as unknown[])
    .map((item) => {
      if (!isObject(item) || !isFilterType(item.type)) return null
      const rawFilter: RawFilter = { type: item.type }
      if (typeof item.id === 'number') rawFilter.id = item.id
      if ('state' in item) rawFilter.state = item.state
      return rawFilter
    })
    .filter((item): item is RawFilter => item !== null)
  if (filters.length === 0) return undefined
  return { index: typeof value.index === 'number' ? value.index : undefined, filters }
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
      filters.push({ id, type: rawFilter.type, state: { ...nestedState, index: hydratedNested.nextId, filters: hydratedNested.filters } })
      continue
    }
    filters.push({ id, type: rawFilter.type, state: rawFilter.state })
  }
  return { filters, nextId }
}

function normalizeFilterState(rawFilterState: unknown): { index: number; filters: filterType[] } {
  const parsed = parseRawFilterState(rawFilterState)
  if (!parsed || parsed.filters.length === 0) return initialFilterState(0)
  const startAt = typeof parsed.index === 'number' && parsed.index > 0 ? parsed.index : 0
  const hydrated = hydrateFilterGroup(parsed.filters, startAt)
  if (hydrated.filters.length === 0) return initialFilterState(0)
  return { index: hydrated.nextId, filters: hydrated.filters }
}

// ---------------------------------------------------------------------------
// Incident proposal helpers
// ---------------------------------------------------------------------------

type IncidentProposal = {
  description?: string | null
  dateString: string
  typeID: string | string[]
  location: { lat: number; lng: number }
  country: string
  department: string
  municipality: string
}

function extractTypeIDs(typeID: Incident['typeID']): string[] {
  return Array.isArray(typeID) ? typeID : [typeID]
}

function normalizeIncidentProposal(proposal: IncidentProposal, db: DB): Incident | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(proposal.dateString)) return null
  const parsedTypeIDs = (Array.isArray(proposal.typeID) ? proposal.typeID : [proposal.typeID]).filter((t) => Boolean(db.Types[t]))
  if (parsedTypeIDs.length === 0) return null
  const lat = Number(proposal.location?.lat), lng = Number(proposal.location?.lng)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  if (!proposal.country?.trim() || !proposal.department?.trim() || !proposal.municipality?.trim()) return null
  return {
    dateString: proposal.dateString,
    typeID: parsedTypeIDs,
    location: { lat, lng },
    country: proposal.country.trim(),
    department: proposal.department.trim(),
    municipality: proposal.municipality.trim(),
    description: proposal.description?.trim() || undefined,
  }
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

const CHAT_STORAGE_KEY = 'aiChatMessagesV2'

function getStoredMessages(): UIMessage[] {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((m) => isObject(m) && typeof (m as Record<string, unknown>).id === 'string' && Array.isArray((m as Record<string, unknown>).parts))
      .map((m) => m as unknown as UIMessage)
  } catch {
    localStorage.removeItem(CHAT_STORAGE_KEY)
    return []
  }
}

// ---------------------------------------------------------------------------
// Tool card component
// ---------------------------------------------------------------------------

type ToolPartLike = {
  type: string
  toolCallId: string
  state: string
  input?: unknown
  output?: unknown
  errorText?: string
  toolName?: string
}

const TOOL_LABELS: Record<string, { label: string; icon: React.FC<{ className?: string }> }> = {
  'tool-query_incidents': { label: 'Buscar incidentes', icon: LucideSearch },
  'tool-get_incident_descriptions': { label: 'Obtener descripciones', icon: LucideBarChart3 },
  'tool-apply_filters': { label: 'Aplicar filtros', icon: LucideFilter },
  'tool-propose_incident': { label: 'Proponer incidente', icon: LucideMapPin },
}

function toolLabel(type: string, toolName?: string): { label: string; Icon: React.FC<{ className?: string }> } {
  const meta = TOOL_LABELS[type] ?? TOOL_LABELS[`tool-${toolName}`]
  return { label: meta?.label ?? (toolName ?? type), Icon: meta?.icon ?? LucideSearch }
}

function summarizeTool(type: string, input: unknown, output: unknown): string {
  if (!isObject(input) && !isObject(output)) return ''

  if (type === 'tool-query_incidents' || (type === 'dynamic-tool')) {
    if (isObject(output) && typeof output.count === 'number') {
      const agg = output as { count: number; dateRange?: { earliest?: string; latest?: string } }
      const range = agg.dateRange ? ` · ${agg.dateRange.earliest?.slice(0,4)}–${agg.dateRange.latest?.slice(0,4)}` : ''
      return `${agg.count} incidentes${range}`
    }
  }
  if (type === 'tool-apply_filters') return 'Filtros aplicados'
  if (type === 'tool-get_incident_descriptions') {
    if (Array.isArray(output)) return `${output.length} descripción(es) obtenida(s)`
  }
  return ''
}

function ToolCard({ part, db, onProposalConfirm, onProposalCancel, isAdmin }: {
  part: ToolPartLike
  db: DB
  onProposalConfirm: (callId: string, incident: Incident) => void
  onProposalCancel: (callId: string) => void
  isAdmin: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const { label, Icon } = toolLabel(part.type, part.toolName)
  const isLoading = part.state === 'input-streaming' || part.state === 'input-available'
  const isError = part.state === 'output-error'
  const isDone = part.state === 'output-available'
  const summary = isDone ? summarizeTool(part.type, part.input, part.output) : ''

  // Inline proposal card for propose_incident
  if (part.type === 'tool-propose_incident' || part.toolName === 'propose_incident') {
    if (part.state === 'input-available' && isAdmin && isObject(part.input)) {
      const proposal = part.input as IncidentProposal
      const normalized = normalizeIncidentProposal(proposal, db)
      if (!normalized) {
        return (
          <div className="my-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            Propuesta de incidente inválida — faltan campos requeridos.
          </div>
        )
      }
      return (
        <div className="my-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs">
          <p className="mb-2 font-semibold text-slate-700">Confirmar incidente propuesto</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-700">
            <p><span className="font-medium">Fecha:</span> {normalized.dateString}</p>
            <p><span className="font-medium">País:</span> {normalized.country}</p>
            <p><span className="font-medium">Departamento:</span> {normalized.department}</p>
            <p><span className="font-medium">Municipio:</span> {normalized.municipality}</p>
            <p><span className="font-medium">Ubicación:</span> {normalized.location.lat.toFixed(4)}, {normalized.location.lng.toFixed(4)}</p>
            <p><span className="font-medium">Tipos:</span> {extractTypeIDs(normalized.typeID).map((t) => db.Types[t]?.name ?? t).join(', ')}</p>
            {normalized.description && <p className="col-span-2"><span className="font-medium">Descripción:</span> {normalized.description}</p>}
          </div>
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => onProposalConfirm(part.toolCallId, normalized)}
              className="flex items-center gap-1 rounded-md bg-red-700 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-900"
            >
              <LucideCheck className="h-3 w-3" /> Confirmar
            </button>
            <button
              onClick={() => onProposalCancel(part.toolCallId)}
              className="flex items-center gap-1 rounded-md border border-stone-200 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <LucideX className="h-3 w-3" /> Cancelar
            </button>
          </div>
        </div>
      )
    }
    if (part.state === 'output-available' && isObject(part.output)) {
      const out = part.output as { confirmed?: boolean; error?: string }
      if (out.error === 'not_admin') return null
      return (
        <div className="my-1 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-800">
          {out.confirmed ? 'Incidente guardado exitosamente.' : 'Propuesta de incidente cancelada.'}
        </div>
      )
    }
    if (part.state === 'input-streaming') return (
      <div className="my-1 rounded-lg border border-stone-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-500 italic">Preparando propuesta de incidente...</div>
    )
    return null
  }

  return (
    <button
      onClick={() => setExpanded((e) => !e)}
      className="my-1 flex w-full items-start gap-2 rounded-lg border border-stone-200/60 bg-slate-50/60 px-3 py-2 text-left text-xs transition-colors hover:bg-slate-100/70"
    >
      <div className="mt-0.5 shrink-0">
        {isLoading ? (
          <LucideLoader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
        ) : isError ? (
          <LucideAlertCircle className="h-3.5 w-3.5 text-red-500" />
        ) : (
          <Icon className="h-3.5 w-3.5 text-slate-400" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-slate-700">{label}</span>
          {summary && <span className="text-slate-500">— {summary}</span>}
          {isError && <span className="text-red-500">{part.errorText ?? 'Error'}</span>}
        </div>
        {expanded && (
          <div className="mt-2 space-y-1">
            {part.input !== undefined && (
              <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded bg-slate-100 p-2 text-slate-600">
                {JSON.stringify(part.input, null, 2)}
              </pre>
            )}
            {isDone && part.output !== undefined && (
              <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded bg-slate-100 p-2 text-slate-600">part.output</pre>
            )}
          </div>
        )}
      </div>
      <div className="mt-0.5 shrink-0 text-slate-400">
        {expanded ? <LucideChevronDown className="h-3 w-3" /> : <LucideChevronRight className="h-3 w-3" />}
      </div>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Suggestion prompts
// ---------------------------------------------------------------------------

const SUGGESTIONS = [
  { icon: LucideFilter, label: 'Filtrar por país', message: 'Quiero filtrar incidentes por país' },
  { icon: LucideMapPin, label: 'Buscar por ubicación', message: 'Muéstrame incidentes cerca de una ubicación' },
  { icon: LucideBarChart3, label: 'Resumen de datos', message: 'Dame un resumen de todos los incidentes' },
]

// ---------------------------------------------------------------------------
// Main Chat component
// ---------------------------------------------------------------------------

const Chat: React.FC = () => {
  const { auth, db, isAdmin, addIncident } = useDB()
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [input, setInput] = useState('')
  const [hasAppliedFilters, setHasAppliedFilters] = useState(false)
  const [confirmingCallId, setConfirmingCallId] = useState<string | null>(null)

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: import.meta.env.VITE_CHAT_API_URL || '/api/chat',
        headers: async () => {
          if (!auth.currentUser) throw new Error('No autenticado')
          const token = await auth.currentUser.getIdToken()
          return { Authorization: `Bearer ${token}` }
        },
      }),
    [auth]
  )

  const { messages, setMessages, sendMessage, status, stop, error, addToolOutput } = useChat({
    transport,
    messages: getStoredMessages(),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    onToolCall: ({ toolCall }) => {
      if (toolCall.dynamic) return
      if (toolCall.toolName === 'apply_filters') {
        const normalized = normalizeFilterState(isObject(toolCall.input) ? toolCall.input.filterState : undefined)
        localStorage.setItem('filterState', JSON.stringify(normalized))
        setHasAppliedFilters(true)
        addToolOutput({ tool: 'apply_filters', toolCallId: toolCall.toolCallId, output: { ok: true } })
      }
      if (toolCall.toolName === 'propose_incident' && !isAdmin) {
        addToolOutput({ tool: 'propose_incident', toolCallId: toolCall.toolCallId, output: { error: 'not_admin' } })
      }
    },
    onError: (err) => {
      console.error('Chat error:', err)
    },
  })

  // Persist messages
  useEffect(() => {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-60)))
  }, [messages])

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, status, scrollToBottom])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  async function handleProposalConfirm(callId: string, incident: Incident) {
    if (confirmingCallId) return
    setConfirmingCallId(callId)
    try {
      const result = await addIncident(incident)
      addToolOutput({
        tool: 'propose_incident',
        toolCallId: callId,
        output: { confirmed: Boolean(result) },
      })
    } catch {
      addToolOutput({
        tool: 'propose_incident',
        toolCallId: callId,
        state: 'output-error',
        errorText: 'No se pudo guardar el incidente',
      })
    } finally {
      setConfirmingCallId(null)
    }
  }

  function handleProposalCancel(callId: string) {
    addToolOutput({ tool: 'propose_incident', toolCallId: callId, output: { confirmed: false } })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || status === 'streaming' || status === 'submitted') return
    setInput('')
    sendMessage({ text: trimmed })
  }

  function handleSuggestion(message: string) {
    if (status === 'streaming' || status === 'submitted') return
    sendMessage({ text: message })
  }

  const isBusy = status === 'streaming' || status === 'submitted'
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
            <div className="flex h-full flex-col items-center justify-center px-6 py-12">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-200/60 to-stone-200/40 shadow-sm">
                <LucideMessageCircle className="h-8 w-8 text-red-700" />
              </div>
              <h2 className="mb-2 font-merriweather text-xl font-bold text-slate-900">Bienvenido al Asistente</h2>
              <p className="mb-8 max-w-sm text-center text-sm leading-relaxed text-slate-600">
                Puedo ayudarte a consultar incidentes, crear filtros{isAdmin ? ' y proponer nuevos registros' : ''} en la base de datos de Red-CORAL.
              </p>
              <div className="grid w-full max-w-md gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion.message}
                    onClick={() => handleSuggestion(suggestion.message)}
                    disabled={isBusy}
                    className="group flex items-center gap-3 rounded-xl border border-stone-200/70 bg-white px-4 py-3 text-left text-sm text-slate-800 shadow-sm transition-all hover:border-red-600/40 hover:bg-rose-200/10 hover:shadow-md disabled:opacity-50"
                  >
                    <suggestion.icon className="h-4 w-4 shrink-0 text-slate-400 transition-colors group-hover:text-red-700" />
                    {suggestion.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-2xl space-y-1 px-4 py-4">
              {messages.map((message, msgIndex) => {
                const isUser = message.role === 'user'
                const isFirst = msgIndex === 0 || messages[msgIndex - 1].role !== message.role
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
                    <div className={`min-w-0 max-w-[85%] ${isUser ? '' : 'flex-1'}`}>
                      {isUser ? (
                        <div className="max-w-fit whitespace-pre-wrap rounded-2xl rounded-br-md bg-red-700 px-4 py-2.5 text-sm leading-relaxed text-white shadow-sm">
                          {message.parts.map((part, i) =>
                            part.type === 'text' ? <span key={i}>{part.text}</span> : null
                          )}
                        </div>
                      ) : (
                        <div>
                          {message.parts.map((part, partIndex) => {
                            if (part.type === 'text' && part.text) {
                              return (
                                <div
                                  key={partIndex}
                                  className="rounded-2xl rounded-bl-md bg-white px-4 py-2.5 text-sm leading-relaxed text-slate-900 shadow-sm ring-1 ring-stone-200/40 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:my-0.5 [&_p]:my-1 first:[&_p]:mt-0 last:[&_p]:mb-0 [&_strong]:font-semibold [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs"
                                >
                                  <Markdown>{part.text}</Markdown>
                                </div>
                              )
                            }
                            if (part.type === 'step-start') {
                              return partIndex > 0 ? (
                                <hr key={partIndex} className="my-1.5 border-stone-200/60" />
                              ) : null
                            }
                            // tool parts: typed (tool-${name}) or dynamic
                            const asPart = part as ToolPartLike
                            if (asPart.type?.startsWith('tool-') || asPart.type === 'dynamic-tool') {
                              return (
                                <ToolCard
                                  key={partIndex}
                                  part={asPart}
                                  db={db}
                                  onProposalConfirm={handleProposalConfirm}
                                  onProposalCancel={handleProposalCancel}
                                  isAdmin={isAdmin}
                                />
                              )
                            }
                            return null
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Loading indicator */}
              {status === 'submitted' && (
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

              {/* Error */}
              {error && (
                <div className="flex animate-[fadeSlideIn_0.2s_ease-out_both] items-start gap-2 pt-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-100">
                    <LucideAlertCircle className="h-3.5 w-3.5 text-red-600" />
                  </div>
                  <div className="rounded-2xl rounded-bl-md bg-red-50 px-4 py-2.5 text-sm text-red-700 shadow-sm ring-1 ring-red-200/60">
                    No pude procesar la solicitud. Inténtalo nuevamente.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input bar */}
        <div className="border-t border-stone-200/40 bg-white px-4 py-3">
          <form onSubmit={handleSubmit} className="mx-auto flex max-w-2xl items-center gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  if (input.trim() && !isBusy) {
                    handleSubmit(event as unknown as FormEvent<HTMLFormElement>)
                  }
                }
              }}
              placeholder="Escribe un mensaje..."
              className="flex-1 resize-none rounded-xl border border-stone-200/60 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400/70 transition-colors [field-sizing:content] focus:border-red-600/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-200/50"
            />
            {isBusy ? (
              <button
                type="button"
                onClick={stop}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-700 text-white shadow-sm transition-all hover:bg-slate-900 hover:shadow-md"
                title="Detener"
              >
                <LucideSquare className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={input.trim().length === 0}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-700 text-white shadow-sm transition-all hover:bg-slate-900 hover:shadow-md disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-slate-400 disabled:shadow-none"
              >
                <LucideSend className="h-4 w-4" />
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

export default Chat
