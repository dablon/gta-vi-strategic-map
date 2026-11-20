import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Link2,
  MapPin,
  Minus,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { LeonidaMap } from './components/LeonidaMap'
import { CategoryIcon } from './components/icons'
import { CATEGORIES, GROUPS, REGIONS } from './data/meta'
import { LOCATIONS, payoutLabel } from './data/locations'
import { nearestRegion } from './data/resolve.mjs'
import { DiscoveredFileSchema, SuggestionFileSchema } from './data/pinSchema.mjs'
import type { MapLocation, LocationCategory, RegionId, SecurityLevel, Suggestion } from './data/types'

const ALL_REGIONS = REGIONS.map((r) => r.id)
const FOUND_KEY = 'leonida-heist-atlas:found'
const HIDDEN_KEY = 'leonida-heist-atlas:hidden'

/** Único repo público conocido del proyecto; si se muda, actualizar aquí. */
const REPO = 'dablon/gta-vi-strategic-map'

const categoryMeta = (id: LocationCategory) => CATEGORIES.find((c) => c.id === id)!
const regionLabel = (id: RegionId) => REGIONS.find((r) => r.id === id)!.label

function formatStamp(iso: string) {
  return new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))
}

function suggestionToLocation(s: Suggestion): MapLocation {
  return {
    id: `issue-${s.issue}`,
    name: s.name,
    category: s.category,
    region: s.region ?? nearestRegion(s.wx, s.wy),
    area: s.area ?? s.name,
    wx: s.wx,
    wy: s.wy,
    precision: 'exact',
    confidence: 'low',
    suggested: true,
    issueUrl: s.url,
    tip: s.notes || 'Propuesta de la comunidad en GitHub. Sin verificación dentro del juego.',
    source: `sugerencia #${s.issue}`,
  }
}

function loadSet(key: string, fallback: string[] = []): Set<string> {
  try {
    const raw = localStorage.getItem(key)
    return new Set(raw ? (JSON.parse(raw) as string[]) : fallback)
  } catch {
    return new Set(fallback)
  }
}

const PRESETS: { label: string; show: LocationCategory[]; minPayout?: number; security?: SecurityLevel }[] = [
  { label: 'Bóvedas + escape', show: ['bank_vault', 'paynspray', 'police', 'marina'], minPayout: 65000 },
  { label: 'Farm joyería → Yasmani', show: ['jewelry', 'fence', 'paynspray'] },
  { label: 'Compounds + narcóticos', show: ['illegal_op', 'fence', 'ammunation'] },
  { label: 'Stick-ups low risk', show: ['stickup', 'gas', 'store', 'paynspray'], security: 'low' },
]

interface Draft {
  wx: number
  wy: number
}

export default function App() {
  const [hidden, setHidden] = useState<Set<string>>(() => loadSet(HIDDEN_KEY, ['hospital', 'transit']))
  const [found, setFound] = useState<Set<string>>(() => loadSet(FOUND_KEY))
  const [hideFound, setHideFound] = useState(false)
  const [hideUnverified, setHideUnverified] = useState(true)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [activeRegions, setActiveRegions] = useState<RegionId[]>([...ALL_REGIONS])
  const [securityFilter, setSecurityFilter] = useState<SecurityLevel | 'all'>('all')
  const [minPayout, setMinPayout] = useState(0)
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    const id = decodeURIComponent(location.hash.slice(1))
    return LOCATIONS.some((l) => l.id === id) ? id : null
  })
  const [leftOpen, setLeftOpen] = useState(() => matchMedia('(min-width: 768px)').matches)
  const [rightOpen, setRightOpen] = useState(() => matchMedia('(min-width: 1024px)').matches)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [extra, setExtra] = useState<MapLocation[]>([])
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [pickMode, setPickMode] = useState(false)
  const [draft, setDraft] = useState<Draft | null>(null)

  const suggestionLocations = useMemo(() => suggestions.map(suggestionToLocation), [suggestions])

  const catalog = useMemo(
    () => [...LOCATIONS, ...extra, ...(showSuggestions ? suggestionLocations : [])],
    [extra, suggestionLocations, showSuggestions],
  )

  const countByCategory = useMemo(() => {
    const counts = Object.fromEntries(CATEGORIES.map((c) => [c.id, 0])) as Record<LocationCategory, number>
    for (const loc of catalog) counts[loc.category] += 1
    return counts
  }, [catalog])

  useEffect(() => {
    let cancelled = false
    fetch(`${import.meta.env.BASE_URL}discovered.json`, { cache: 'no-cache' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: unknown) => {
        if (cancelled || !data) return
        const parsed = DiscoveredFileSchema.safeParse(data)
        if (!parsed.success) {
          console.warn('discovered.json inválido; se ignora.', parsed.error.issues[0]?.message)
          return
        }
        const known = new Set(LOCATIONS.map((l) => l.id))
        const fresh = parsed.data.locations.filter((loc) => !known.has(loc.id))
        setExtra(fresh)
        setUpdatedAt(parsed.data.updatedAt ?? null)
        const hash = decodeURIComponent(location.hash.slice(1))
        if (hash && fresh.some((loc) => loc.id === hash)) {
          setSelectedId(hash)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    fetch(`${import.meta.env.BASE_URL}suggestions.json`, { cache: 'no-cache' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: unknown) => {
        if (cancelled || !data) return
        const parsed = SuggestionFileSchema.safeParse(data)
        if (!parsed.success) {
          console.warn('suggestions.json inválido; se ignora.')
          return
        }
        setSuggestions(parsed.data.suggestions)
        const hash = decodeURIComponent(location.hash.slice(1))
        if (hash && parsed.data.suggestions.some((s) => `issue-${s.issue}` === hash)) {
          setSelectedId(hash)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => localStorage.setItem(FOUND_KEY, JSON.stringify([...found])), [found])
  useEffect(() => localStorage.setItem(HIDDEN_KEY, JSON.stringify([...hidden])), [hidden])
  useEffect(() => {
    history.replaceState(null, '', selectedId ? `#${encodeURIComponent(selectedId)}` : location.pathname)
  }, [selectedId])

  useEffect(() => {
    if (!pickMode) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPickMode(false)
        setDraft(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pickMode])

  const q = deferredQuery.trim().toLowerCase()

  const filtered = useMemo(() => {
    return catalog.filter((loc) => {
      if (hidden.has(loc.category)) return false
      if (!activeRegions.includes(loc.region)) return false
      if (securityFilter !== 'all' && loc.security !== securityFilter) return false
      if (minPayout > 0 && (loc.payoutMax != null || loc.payoutMin != null)) {
        if ((loc.payoutMax ?? loc.payoutMin ?? 0) < minPayout) return false
      }
      if (hideFound && found.has(loc.id) && loc.id !== selectedId) return false
      if (hideUnverified && loc.confidence === 'low' && !loc.suggested) return false
      if (q) {
        const hay = `${loc.name} ${loc.area} ${loc.tip} ${loc.lootType ?? ''} ${loc.bestFor ?? ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [catalog, hidden, activeRegions, securityFilter, minPayout, hideFound, hideUnverified, found, selectedId, q])

  const searchResults = useMemo(
    () =>
      q
        ? catalog.filter((l) => `${l.name} ${l.area}`.toLowerCase().includes(q)).slice(0, 40)
        : [],
    [catalog, q],
  )

  const selected = catalog.find((l) => l.id === selectedId) ?? null
  const selectedVisible = selected != null && filtered.some((l) => l.id === selected.id)

  const topLoot = useMemo(
    () =>
      filtered
        .filter((l) => l.payoutMax != null)
        .sort((a, b) => (b.payoutMax ?? 0) - (a.payoutMax ?? 0))
        .slice(0, 8),
    [filtered],
  )

  const unverifiedCount = useMemo(
    () => catalog.filter((l) => l.confidence === 'low' && !l.suggested).length,
    [catalog],
  )

  function toggleCategory(id: LocationCategory) {
    setHidden((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleFound(id: string) {
    setFound((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectFromList(id: string) {
    const loc = catalog.find((l) => l.id === id)!
    setHidden((prev) => {
      if (!prev.has(loc.category)) return prev
      const next = new Set(prev)
      next.delete(loc.category)
      return next
    })
    if (!activeRegions.includes(loc.region)) setActiveRegions((r) => [...r, loc.region])
    // Que buscarlo no sea un callejón sin salida: si estaba filtrado por confianza, mostrarlo.
    if (loc.confidence === 'low' && !loc.suggested) setHideUnverified(false)
    if (loc.suggested) setShowSuggestions(true)
    setQuery('')
    setSelectedId(id)
    if (!matchMedia('(min-width: 768px)').matches) setLeftOpen(false)
  }

  function applyPreset(p: (typeof PRESETS)[number]) {
    setHidden(new Set(CATEGORIES.map((c) => c.id).filter((id) => !p.show.includes(id))))
    setMinPayout(p.minPayout ?? 0)
    setSecurityFilter(p.security ?? 'all')
  }

  function resetFilters() {
    setHidden(new Set())
    setActiveRegions([...ALL_REGIONS])
    setSecurityFilter('all')
    setMinPayout(0)
    setQuery('')
    setHideFound(false)
  }

  async function copyLink(id: string) {
    await navigator.clipboard.writeText(`${location.origin}${location.pathname}#${encodeURIComponent(id)}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  function openSuggestionIssue(form: { name: string; category: LocationCategory; area: string; notes: string }) {
    if (!draft) return
    const payload = {
      name: form.name.trim(),
      category: form.category,
      wx: draft.wx,
      wy: draft.wy,
      area: form.area.trim() || undefined,
      notes: form.notes.trim() || undefined,
    }
    const body = [
      'Propuesta enviada desde el mapa Leonida Heist Atlas.',
      '',
      '```json',
      JSON.stringify(payload),
      '```',
      '',
      `- Región calculada: ${nearestRegion(draft.wx, draft.wy)}`,
      `- Mapa: ${location.origin}${location.pathname}`,
      '',
      '_Un humano revisa las propuestas antes de que lleguen al mapa._',
    ].join('\n')
    const url =
      `https://github.com/${REPO}/issues/new` +
      `?labels=${encodeURIComponent('pin-suggestion')}` +
      `&title=${encodeURIComponent(`Pin: ${payload.name}`)}` +
      `&body=${encodeURIComponent(body)}`
    window.open(url, '_blank', 'noopener')
    setDraft(null)
    setPickMode(false)
  }

  const visibleTotal = catalog.filter((l) => !hidden.has(l.category)).length
  const visibleFound = catalog.filter((l) => !hidden.has(l.category) && found.has(l.id)).length

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#3f9ab6] text-[var(--color-cream)]">
      <LeonidaMap
        locations={filtered}
        selectedId={selectedVisible ? selectedId : null}
        foundIds={found}
        onSelect={setSelectedId}
        pickMode={pickMode && draft == null}
        onPick={(wx, wy) => setDraft({ wx, wy })}
        popup={
          selected && (
            <LocationPopup
              loc={selected}
              found={found.has(selected.id)}
              copied={copied}
              onClose={() => setSelectedId(null)}
              onToggleFound={() => toggleFound(selected.id)}
              onCopy={() => void copyLink(selected.id)}
            />
          )
        }
      />

      {pickMode && draft == null && (
        <div className="pointer-events-none absolute left-1/2 top-6 z-[750] -translate-x-1/2">
          <div className="genie-panel rounded-full px-5 py-2 text-sm font-semibold text-[var(--color-gold)]">
            Haz clic en el mapa donde va el pin · Esc cancela
          </div>
        </div>
      )}

      {draft && (
        <SuggestFormModal
          draft={draft}
          onCancel={() => setDraft(null)}
          onSubmit={(form) => openSuggestionIssue(form)}
        />
      )}

      <div className="pointer-events-none absolute bottom-3 left-1/2 z-[650] max-w-[min(440px,calc(100vw-24px))] -translate-x-1/2 rounded-full bg-[var(--color-genie)]/95 px-4 py-1.5 text-center text-[11px] text-white shadow-lg shadow-black/30">
        <span className="font-semibold uppercase tracking-wide text-[var(--color-gold)]">Último cambio </span>
        {updatedAt ? formatStamp(updatedAt) : 'todavía no hay uno'}
        {extra.length > 0 ? ` · ${extra.length} autodescubiertos` : ''}
        {suggestions.length > 0 ? ` · ${suggestions.length} propuestas` : ''}
      </div>

      {/* Panel izquierdo */}
      <aside
        className={`genie-panel absolute bottom-3 left-3 top-3 z-[800] flex w-[min(320px,calc(100vw-24px))] flex-col rounded-2xl transition-transform duration-300 ${
          leftOpen ? 'translate-x-0' : '-translate-x-[calc(100%+12px)]'
        }`}
      >
        <button
          type="button"
          onClick={() => setLeftOpen((v) => !v)}
          className="absolute -right-7 top-4 grid h-10 w-7 place-items-center rounded-r-lg bg-[var(--color-genie)] text-white shadow-md"
          title={leftOpen ? 'Ocultar panel' : 'Mostrar panel'}
        >
          {leftOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>

        <div className="map-scroll flex-1 overflow-y-auto px-4 pb-4">
          <header className="pt-5 text-center">
            <p className="font-[family-name:var(--font-heading)] text-[38px] font-bold leading-none tracking-wide text-white drop-shadow">
              LEONIDA
            </p>
            <p className="font-[family-name:var(--font-heading)] text-lg font-semibold uppercase leading-tight tracking-[0.12em] text-[var(--color-gold)]">
              Heist Atlas
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-wider text-white/70">
              Mapa interactivo de robos · GTA VI
            </p>
          </header>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button type="button" className="genie-btn" onClick={() => setHidden(new Set())}>
              Mostrar todo
            </button>
            <button
              type="button"
              className="genie-btn"
              onClick={() => setHidden(new Set(CATEGORIES.map((c) => c.id)))}
            >
              Ocultar todo
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setDraft(null)
              setPickMode((v) => !v)
            }}
            className={`mt-2 flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold uppercase tracking-wider transition ${
              pickMode
                ? 'bg-[var(--color-gold)] text-[var(--color-genie-ink)]'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <MapPin size={14} />
            {pickMode ? 'Cancelando… clic fuera o Esc' : 'Proponer un pin'}
          </button>

          <label className="relative mt-3 block">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar…"
              className="w-full rounded-full bg-[var(--color-genie-ink)]/55 py-2 pl-4 pr-9 text-sm text-white outline-none placeholder:text-white/55 focus:ring-2 focus:ring-[var(--color-gold)]/60"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
                title="Limpiar"
              >
                <X size={15} />
              </button>
            ) : (
              <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70" />
            )}
          </label>

          {q ? (
            <div className="mt-3">
              <p className="mb-1 text-[11px] uppercase tracking-wider text-white/60">
                {searchResults.length} resultados
              </p>
              {searchResults.length === 0 ? (
                <p className="text-sm text-white/70">Nada. Ni el FIB lo encuentra.</p>
              ) : (
                <ul className="space-y-0.5">
                  {searchResults.map((loc) => (
                    <li key={loc.id}>
                      <button
                        type="button"
                        onClick={() => selectFromList(loc.id)}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-white/10"
                      >
                        <IconBadge id={loc.category} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-white">{loc.name}</span>
                          <span className="block truncate text-[11px] text-white/60">
                            {categoryMeta(loc.category).short} · {loc.area}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <>
              <h2 className="mt-5 flex items-center gap-2 font-[family-name:var(--font-heading)] text-lg font-semibold text-white">
                <Minus size={14} /> Ubicaciones
              </h2>
              {GROUPS.map((group) => (
                <section key={group.id} className="mt-2" title={group.why}>
                  <h3 className="font-[family-name:var(--font-heading)] text-[13px] font-semibold uppercase tracking-wider text-[var(--color-gold)]">
                    {group.label}
                  </h3>
                  <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5">
                    {CATEGORIES.filter((c) => c.group === group.id).map((cat) => {
                      const on = !hidden.has(cat.id)
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => toggleCategory(cat.id)}
                          title={cat.mapUse}
                          className={`flex items-center gap-1.5 rounded px-1 py-1 text-left transition hover:bg-white/10 ${
                            on ? '' : 'opacity-40'
                          }`}
                        >
                          <IconBadge id={cat.id} />
                          <span className="min-w-0 flex-1 truncate font-[family-name:var(--font-heading)] text-[12px] font-medium uppercase tracking-wide text-white">
                            {cat.short}
                          </span>
                          <span className="text-[11px] tabular-nums text-white/75">
                            {countByCategory[cat.id]}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </section>
              ))}

              <button
                type="button"
                onClick={() => setAdvancedOpen((v) => !v)}
                className="mt-5 flex w-full items-center gap-2 font-[family-name:var(--font-heading)] text-lg font-semibold text-white"
              >
                {advancedOpen ? <Minus size={14} /> : <Plus size={14} />}
                <SlidersHorizontal size={15} /> Filtros y presets
              </button>
              {advancedOpen && (
                <div className="mt-2 space-y-4">
                  <div>
                    <h3 className="genie-subhead">Presets</h3>
                    <div className="mt-1 grid gap-1">
                      {PRESETS.map((p) => (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => applyPreset(p)}
                          className="rounded-lg bg-white/10 px-3 py-1.5 text-left text-xs text-white hover:bg-white/20"
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="genie-subhead">Regiones</h3>
                      <button
                        type="button"
                        className="text-[11px] text-white/75 hover:text-white"
                        onClick={() =>
                          setActiveRegions(activeRegions.length === ALL_REGIONS.length ? [] : [...ALL_REGIONS])
                        }
                      >
                        {activeRegions.length === ALL_REGIONS.length ? 'Ninguna' : 'Todas'}
                      </button>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {REGIONS.map((r) => {
                        const on = activeRegions.includes(r.id)
                        return (
                          <button
                            key={r.id}
                            type="button"
                            title={r.blurb}
                            onClick={() =>
                              setActiveRegions((prev) =>
                                prev.includes(r.id) ? prev.filter((x) => x !== r.id) : [...prev, r.id],
                              )
                            }
                            className={`rounded-full px-2.5 py-1 text-[11px] transition ${
                              on ? 'bg-white text-[var(--color-genie-ink)]' : 'bg-white/10 text-white/60'
                            }`}
                          >
                            {r.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <div>
                    <h3 className="genie-subhead">Seguridad</h3>
                    <div className="mt-1 grid grid-cols-4 gap-1">
                      {(['all', 'low', 'medium', 'high'] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSecurityFilter(s)}
                          className={`rounded-full py-1 text-[11px] capitalize ${
                            securityFilter === s
                              ? 'bg-white text-[var(--color-genie-ink)]'
                              : 'bg-white/10 text-white/75'
                          }`}
                        >
                          {s === 'all' ? 'Todas' : s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="genie-subhead">Payout mínimo</h3>
                      <span className="text-xs text-[var(--color-gold)]">
                        {minPayout === 0 ? 'Cualquiera' : `≥ $${(minPayout / 1000).toFixed(0)}k`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={150000}
                      step={5000}
                      value={minPayout}
                      onChange={(e) => setMinPayout(Number(e.target.value))}
                      className="mt-1 w-full accent-[var(--color-gold)]"
                    />
                  </div>
                  <div className="space-y-1.5 rounded-lg bg-black/20 p-3">
                    <h3 className="genie-subhead">Capas de datos</h3>
                    <label className="flex cursor-pointer items-center justify-between text-xs text-white">
                      Ocultar sin confirmar ({unverifiedCount})
                      <input
                        type="checkbox"
                        checked={hideUnverified}
                        onChange={(e) => setHideUnverified(e.target.checked)}
                        className="h-4 w-4 accent-[var(--color-gold)]"
                      />
                    </label>
                    <label className="flex cursor-pointer items-center justify-between text-xs text-white">
                      Mostrar propuestas ({suggestions.length})
                      <input
                        type="checkbox"
                        checked={showSuggestions}
                        onChange={(e) => setShowSuggestions(e.target.checked)}
                        className="h-4 w-4 accent-[var(--color-gold)]"
                      />
                    </label>
                    <p className="text-[10px] leading-relaxed text-white/55">
                      "Sin confirmar" = inferido de gtadb por el bot, nunca verificado dentro del juego.
                    </p>
                  </div>
                  <button type="button" className="genie-btn w-full" onClick={resetFilters}>
                    Resetear filtros
                  </button>
                </div>
              )}
            </>
          )}

          <p className="mt-6 text-[11px] leading-relaxed text-[var(--color-gold)]">
            Último cambio: {updatedAt ? formatStamp(updatedAt) : 'todavía no hay uno'}
            {extra.length > 0 ? ` · ${extra.length} autodescubiertos` : ''}
          </p>
          <p className="text-[10px] leading-relaxed text-white/55">
            El bot de gtadb revisa la fuente cada 5 horas en{' '}
            <a
              className="text-[var(--color-gold)] underline-offset-2 hover:underline"
              href={`https://github.com/${REPO}/actions/workflows/discover.yml`}
              target="_blank"
              rel="noreferrer"
            >
              GitHub Actions
            </a>
            . La fecha de arriba solo cambia si entran pines nuevos.
          </p>
          <p className="mt-2 text-[10px] leading-relaxed text-white/55">
            Mapa y coordenadas: gtadb.org (CC BY 4.0). Payouts y tips: PowerPyx, gta6activities.com,
            thegta6map.com, Mobalytics, sixthstar.net. Borde punteado en un pin = posición aproximada al
            barrio. No es el mapa oficial de Rockstar ni de MapGenie.
          </p>
        </div>
      </aside>

      {/* Panel derecho: progreso */}
      <aside
        className={`genie-panel absolute right-3 top-3 z-[800] w-[min(260px,calc(100vw-24px))] rounded-2xl transition-transform duration-300 ${
          rightOpen ? 'translate-x-0' : 'translate-x-[calc(100%+12px)]'
        }`}
      >
        <button
          type="button"
          onClick={() => setRightOpen((v) => !v)}
          className="absolute -left-7 top-4 grid h-10 w-7 place-items-center rounded-l-lg bg-[var(--color-genie)] text-white shadow-md"
          title={rightOpen ? 'Ocultar progreso' : 'Mostrar progreso'}
        >
          {rightOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
        <div className="map-scroll max-h-[calc(100vh-140px)] overflow-y-auto p-4">
          <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-white">
            Progreso de golpes
          </h2>
          <div className="mt-2 flex items-baseline justify-between text-sm">
            <span className="text-white/75">Visitados</span>
            <span className="font-semibold tabular-nums text-white">
              {visibleFound} / {visibleTotal}
            </span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-black/25">
            <div
              className="h-full rounded-full bg-[var(--color-gold)] transition-[width]"
              style={{ width: `${visibleTotal ? (visibleFound / visibleTotal) * 100 : 0}%` }}
            />
          </div>
          <div className="mt-3 space-y-1.5">
            {GROUPS.map((g) => {
              const ids = catalog.filter((l) => categoryMeta(l.category).group === g.id)
              const done = ids.filter((l) => found.has(l.id)).length
              return (
                <div key={g.id} className="flex items-center gap-2 text-xs">
                  <span className="w-24 shrink-0 uppercase tracking-wide text-[var(--color-gold)]">
                    {g.label}
                  </span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/25">
                    <div
                      className="h-full rounded-full bg-white/85"
                      style={{ width: `${(done / ids.length) * 100}%` }}
                    />
                  </div>
                  <span className="w-12 text-right tabular-nums text-white/75">
                    {done}/{ids.length}
                  </span>
                </div>
              )
            })}
          </div>
          <label className="mt-3 flex cursor-pointer items-center justify-between text-sm text-white">
            Ocultar visitados
            <input
              type="checkbox"
              checked={hideFound}
              onChange={(e) => setHideFound(e.target.checked)}
              className="h-4 w-4 accent-[var(--color-gold)]"
            />
          </label>
          {found.size > 0 && (
            <button
              type="button"
              onClick={() => setFound(new Set())}
              className="mt-2 flex items-center gap-1.5 text-xs text-white/70 hover:text-white"
            >
              <RotateCcw size={12} /> Reiniciar progreso
            </button>
          )}

          {topLoot.length > 0 && (
            <>
              <h3 className="genie-subhead mt-4">Top botín visible</h3>
              <ul className="mt-1 space-y-0.5">
                {topLoot.map((loc) => (
                  <li key={loc.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(loc.id)}
                      className={`flex w-full items-center gap-2 rounded-lg px-1.5 py-1 text-left text-xs hover:bg-white/10 ${
                        loc.id === selectedId ? 'bg-white/15' : ''
                      } ${found.has(loc.id) ? 'opacity-50' : ''}`}
                    >
                      <IconBadge id={loc.category} small />
                      <span className="min-w-0 flex-1 truncate text-white">{loc.name}</span>
                      <span className="shrink-0 tabular-nums text-[var(--color-gold)]">
                        {payoutLabel(loc)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </aside>

      {filtered.length === 0 && (
        <div className="absolute left-1/2 top-6 z-[750] -translate-x-1/2">
          <div className="genie-panel rounded-2xl px-5 py-4 text-center">
            <p className="font-[family-name:var(--font-heading)] text-xl font-semibold text-white">
              Cero pins. Felicidades, genio.
            </p>
            <p className="mt-1 text-sm text-white/75">El mapa no inventa Lombanks donde no hay.</p>
            <button type="button" className="genie-btn mt-3 px-4" onClick={resetFilters}>
              Resetear filtros
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function IconBadge({ id, small = false }: { id: LocationCategory; small?: boolean }) {
  const size = small ? 'h-5 w-5' : 'h-6 w-6'
  return (
    <span
      className={`grid ${size} shrink-0 place-items-center rounded-md bg-white shadow-sm`}
      style={{ color: '#1f1320', boxShadow: `inset 0 -2px 0 ${categoryMeta(id).color}` }}
    >
      <CategoryIcon id={id} size={small ? 12 : 14} />
    </span>
  )
}

function SuggestFormModal({
  draft,
  onCancel,
  onSubmit,
}: {
  draft: Draft
  onCancel: () => void
  onSubmit: (form: { name: string; category: LocationCategory; area: string; notes: string }) => void
}) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<LocationCategory>('stickup')
  const [area, setArea] = useState('')
  const [notes, setNotes] = useState('')

  return (
    <div className="absolute inset-0 z-[900] grid place-items-center bg-black/50 p-4" onClick={onCancel}>
      <div className="genie-panel w-[min(420px,100%)] rounded-2xl p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <h3 className="font-[family-name:var(--font-heading)] text-xl font-semibold text-white">
            Proponer pin
          </h3>
          <button
            type="button"
            onClick={onCancel}
            className="grid h-7 w-7 place-items-center rounded-full bg-black/30 text-white hover:bg-black/50"
            title="Cancelar"
          >
            <X size={15} />
          </button>
        </div>
        <p className="mt-1 text-[11px] text-white/70">
          Posición: ({draft.wx}, {draft.wy}) m · región {regionLabel(nearestRegion(draft.wx, draft.wy))}.
          Se abre como propuesta en GitHub; un humano la verifica antes de que aparezca en el mapa.
        </p>
        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            if (name.trim().length < 3) return
            onSubmit({ name, category, area, notes })
          }}
        >
          <label className="block">
            <span className="genie-subhead">Nombre</span>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej.: Lombank Little Havana"
              className="mt-1 w-full rounded-lg bg-[var(--color-genie-ink)]/55 px-3 py-2 text-sm text-white outline-none placeholder:text-white/45 focus:ring-2 focus:ring-[var(--color-gold)]/60"
            />
          </label>
          <label className="block">
            <span className="genie-subhead">Categoría</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as LocationCategory)}
              className="mt-1 w-full rounded-lg bg-[var(--color-genie-ink)]/55 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-[var(--color-gold)]/60"
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#2a1728]">
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="genie-subhead">Barrio / zona (opcional)</span>
            <input
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="Ej.: Little Havana"
              className="mt-1 w-full rounded-lg bg-[var(--color-genie-ink)]/55 px-3 py-2 text-sm text-white outline-none placeholder:text-white/45 focus:ring-2 focus:ring-[var(--color-gold)]/60"
            />
          </label>
          <label className="block">
            <span className="genie-subhead">Notas (opcional)</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Entrada por atrás, 2 Guards, caja tras el mostrador…"
              className="mt-1 w-full resize-none rounded-lg bg-[var(--color-genie-ink)]/55 px-3 py-2 text-sm text-white outline-none placeholder:text-white/45 focus:ring-2 focus:ring-[var(--color-gold)]/60"
            />
          </label>
          <button
            type="submit"
            disabled={name.trim().length < 3}
            className="genie-btn w-full disabled:cursor-not-allowed disabled:opacity-40"
          >
            Abrir propuesta en GitHub
          </button>
        </form>
      </div>
    </div>
  )
}

interface PopupProps {
  loc: MapLocation
  found: boolean
  copied: boolean
  onClose: () => void
  onToggleFound: () => void
  onCopy: () => void
}

function LocationPopup({ loc, found, copied, onClose, onToggleFound, onCopy }: PopupProps) {
  const cat = categoryMeta(loc.category)
  const stats: [string, string][] = []
  const payout = payoutLabel(loc)
  if (payout) stats.push(['Payout', payout])
  if (loc.security) stats.push(['Seguridad', loc.security])
  if (loc.unlock) stats.push(['Unlock', loc.unlock])
  if (loc.lootType) stats.push(['Loot', loc.lootType])
  if (loc.bestFor) stats.push(['Mejor para', loc.bestFor])

  return (
    <div className="genie-panel genie-popup w-[300px] overflow-hidden rounded-2xl text-left">
      <div className="relative h-16" style={{ background: `linear-gradient(135deg, ${cat.color}, #3b1f38)` }}>
        <span className="absolute bottom-[-18px] left-4 grid h-11 w-11 place-items-center rounded-xl bg-white text-[#1f1320] shadow-lg">
          <CategoryIcon id={loc.category} size={22} />
        </span>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/30 text-white hover:bg-black/50"
          title="Cerrar"
        >
          <X size={15} />
        </button>
      </div>
      <div className="px-4 pb-4 pt-6">
        <div className="flex items-start gap-2">
          <h3 className="flex-1 font-[family-name:var(--font-heading)] text-lg font-semibold leading-tight text-white">
            {loc.name}
          </h3>
          <button
            type="button"
            onClick={onCopy}
            className="mt-0.5 text-white/70 hover:text-white"
            title="Copiar enlace"
          >
            {copied ? <Check size={15} /> : <Link2 size={15} />}
          </button>
        </div>
        <p className="mt-1 font-[family-name:var(--font-heading)] text-[12px] font-semibold uppercase tracking-wider text-[var(--color-gold)]">
          {cat.label}
        </p>
        <p className="text-[11px] text-white/65">
          {loc.area} · {regionLabel(loc.region)}
        </p>

        {loc.suggested ? (
          <p className="mt-2 rounded-lg bg-[var(--color-gold)]/15 px-2.5 py-1.5 text-[11px] text-[var(--color-gold)]">
            Propuesta de la comunidad · sin moderar
            {loc.issueUrl && (
              <>
                {' · '}
                <a
                  className="inline-flex items-center gap-1 underline underline-offset-2"
                  href={loc.issueUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  verlo <ExternalLink size={11} />
                </a>
              </>
            )}
          </p>
        ) : (
          loc.confidence === 'low' && (
            <p className="mt-2 rounded-lg bg-[var(--color-gold)]/15 px-2.5 py-1.5 text-[11px] text-[var(--color-gold)]">
              Sin confirmar: inferido automáticamente de gtadb, no verificado dentro del juego.
            </p>
          )
        )}

        {stats.length > 0 && (
          <dl className="mt-2 grid grid-cols-2 gap-1.5 text-xs">
            {stats.map(([k, v]) => (
              <div
                key={k}
                className={`rounded-lg bg-black/20 px-2 py-1 ${v.length > 14 ? 'col-span-2' : ''}`}
              >
                <dt className="text-[9px] uppercase tracking-wider text-white/55">{k}</dt>
                <dd className={`capitalize ${k === 'Payout' ? 'text-[var(--color-gold)]' : 'text-white'}`}>{v}</dd>
              </div>
            ))}
          </dl>
        )}

        {loc.tip && <p className="mt-2 text-[13px] leading-snug text-white/90">{loc.tip}</p>}
        <p className="mt-2 text-[10px] text-white/50">
          {loc.precision === 'exact' ? 'Posición exacta' : `Aprox. barrio ${loc.area}`} · {loc.source}
        </p>

        <button
          type="button"
          onClick={onToggleFound}
          className={`mt-3 flex w-full items-center justify-center gap-1.5 rounded-full py-2 text-xs font-semibold uppercase tracking-wider transition ${
            found
              ? 'bg-[var(--color-gold)] text-[var(--color-genie-ink)]'
              : 'bg-white/15 text-white hover:bg-white/25'
          }`}
        >
          {found && <Check size={14} />}
          {found ? 'Visitado' : 'Marcar como visitado'}
        </button>
      </div>
    </div>
  )
}
