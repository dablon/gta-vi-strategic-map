import { useDeferredValue, useMemo, useState } from 'react'
import { LeonidaMap } from './components/LeonidaMap'
import { CATEGORIES, MAP_TYPES, REGIONS } from './data/meta'
import { LOCATIONS, payoutLabel } from './data/locations'
import type { LocationCategory, RegionId, SecurityLevel } from './data/types'

const ALL_CATEGORIES = CATEGORIES.map((c) => c.id)
const ALL_REGIONS = REGIONS.map((r) => r.id)

function categoryMeta(id: LocationCategory) {
  return CATEGORIES.find((c) => c.id === id)!
}

function regionMeta(id: RegionId) {
  return REGIONS.find((r) => r.id === id)!
}

export default function App() {
  const [activeCategories, setActiveCategories] = useState<LocationCategory[]>([
    'bank_vault',
    'bank_small',
    'jewelry',
    'fence',
    'paynspray',
  ])
  const [activeRegions, setActiveRegions] = useState<RegionId[]>([...ALL_REGIONS])
  const [securityFilter, setSecurityFilter] = useState<SecurityLevel | 'all'>('all')
  const [minPayout, setMinPayout] = useState(0)
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [selectedId, setSelectedId] = useState<string | null>('vault-lombank-downtown')
  const [showMapTypes, setShowMapTypes] = useState(false)
  const [mobileTab, setMobileTab] = useState<'map' | 'filters' | 'detail'>('map')

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase()
    return LOCATIONS.filter((loc) => {
      if (!activeCategories.includes(loc.category)) return false
      if (!activeRegions.includes(loc.region)) return false
      if (securityFilter !== 'all' && loc.security && loc.security !== securityFilter) return false
      if (securityFilter !== 'all' && !loc.security) return false
      if (minPayout > 0) {
        const hasPayout = loc.payoutMax != null || loc.payoutMin != null
        if (hasPayout) {
          const max = loc.payoutMax ?? loc.payoutMin ?? 0
          if (max < minPayout) return false
        }
      }
      if (q) {
        const hay = `${loc.name} ${loc.area} ${loc.tip} ${loc.lootType ?? ''} ${loc.bestFor ?? ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [activeCategories, activeRegions, securityFilter, minPayout, deferredQuery])

  const selected = useMemo(
    () => LOCATIONS.find((l) => l.id === selectedId) ?? null,
    [selectedId],
  )

  const selectedVisible = selected && filtered.some((l) => l.id === selected.id)

  function toggleCategory(id: LocationCategory) {
    setActiveCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    )
  }

  function toggleRegion(id: RegionId) {
    setActiveRegions((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id],
    )
  }

  function selectLocation(id: string) {
    setSelectedId(id)
    setMobileTab('detail')
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--color-lagoon)] text-[var(--color-mist)]">
      <header className="relative z-20 border-b border-[var(--color-line)] bg-[linear-gradient(120deg,#061820_0%,#0a2f3a_55%,#123038_100%)] px-4 py-3 md:px-6">
        <div className="pointer-events-none absolute inset-0 opacity-40 [background:radial-gradient(circle_at_15%_20%,#ff5c3922,transparent_35%),radial-gradient(circle_at_85%_0%,#2ec4b622,transparent_40%)]" />
        <div className="relative flex flex-wrap items-end justify-between gap-3">
          <div className="animate-fade-up">
            <p className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-white md:text-4xl">
              Leonida <span className="text-[var(--color-coral)]">Heist Atlas</span>
            </p>
            <p className="mt-1 max-w-xl text-sm text-[var(--color-mute)]">
              Mapa filtrable de puntos estratégicos para robos in-game en GTA VI — bóvedas, joyerías,
              fences, escapes y más.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowMapTypes((v) => !v)}
              className="rounded-md border border-[var(--color-line)] bg-[var(--color-panel)] px-3 py-2 text-sm font-medium text-[var(--color-mist)] transition hover:border-[var(--color-teal)]"
            >
              {showMapTypes ? 'Cerrar tipos de mapa' : 'Tipos de mapa útiles'}
            </button>
            <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-deep)] px-3 py-2 text-xs text-[var(--color-mute)]">
              {filtered.length} / {LOCATIONS.length} pins
            </div>
          </div>
        </div>

        {showMapTypes && (
          <div className="relative mt-4 grid gap-3 animate-fade-up md:grid-cols-2 xl:grid-cols-4">
            {MAP_TYPES.map((t) => (
              <article
                key={t.title}
                className="rounded-lg border border-[var(--color-line)] bg-[var(--color-deep)]/90 p-3"
              >
                <h2 className="font-[family-name:var(--font-display)] text-lg text-white">{t.title}</h2>
                <p className="mt-1 text-xs text-[var(--color-mute)]">{t.why}</p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {t.items.map((item) => (
                    <li
                      key={item}
                      className="rounded bg-[var(--color-panel)] px-2 py-0.5 text-[11px] text-[var(--color-teal)]"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        )}
      </header>

      <div className="flex gap-1 border-b border-[var(--color-line)] bg-[var(--color-deep)] p-1 md:hidden">
        {(
          [
            ['map', 'Mapa'],
            ['filters', 'Filtros'],
            ['detail', 'Detalle'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setMobileTab(id)}
            className={`flex-1 rounded px-2 py-2 text-sm font-medium ${
              mobileTab === id
                ? 'bg-[var(--color-coral)] text-white'
                : 'text-[var(--color-mute)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 md:grid-cols-[300px_minmax(0,1fr)_320px]">
        {/* Filters */}
        <aside
          className={`map-scroll min-h-0 overflow-y-auto border-r border-[var(--color-line)] bg-[var(--color-deep)] p-4 ${
            mobileTab === 'filters' ? 'block' : 'hidden md:block'
          }`}
        >
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-mute)]">
              Buscar
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Lombank, Yasmani, Ocean Beach…"
              className="mt-1 w-full rounded-md border border-[var(--color-line)] bg-[var(--color-lagoon)] px-3 py-2 text-sm outline-none ring-[var(--color-teal)] placeholder:text-[var(--color-mute)]/60 focus:ring-1"
            />
          </label>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-mute)]">
                Categorías
              </span>
              <button
                type="button"
                className="text-[11px] text-[var(--color-teal)]"
                onClick={() =>
                  setActiveCategories(
                    activeCategories.length === ALL_CATEGORIES.length ? [] : [...ALL_CATEGORIES],
                  )
                }
              >
                {activeCategories.length === ALL_CATEGORIES.length ? 'Ninguna' : 'Todas'}
              </button>
            </div>
            <div className="space-y-1.5">
              {CATEGORIES.map((cat) => {
                const on = activeCategories.includes(cat.id)
                const count = LOCATIONS.filter((l) => l.category === cat.id).length
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={`flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left text-sm transition ${
                      on
                        ? 'border-[var(--color-line)] bg-[var(--color-panel)]'
                        : 'border-transparent opacity-45 hover:opacity-70'
                    }`}
                    title={cat.mapUse}
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: cat.color }}
                    />
                    <span className="flex-1">{cat.short}</span>
                    <span className="text-[11px] text-[var(--color-mute)]">{count}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-mute)]">
                Regiones
              </span>
              <button
                type="button"
                className="text-[11px] text-[var(--color-teal)]"
                onClick={() =>
                  setActiveRegions(
                    activeRegions.length === ALL_REGIONS.length ? [] : [...ALL_REGIONS],
                  )
                }
              >
                {activeRegions.length === ALL_REGIONS.length ? 'Ninguna' : 'Todas'}
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {REGIONS.map((r) => {
                const on = activeRegions.includes(r.id)
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => toggleRegion(r.id)}
                    className={`rounded-md border px-2 py-1 text-[11px] ${
                      on
                        ? 'border-[var(--color-teal)]/50 bg-[var(--color-panel)] text-[var(--color-mist)]'
                        : 'border-transparent bg-transparent text-[var(--color-mute)] opacity-50'
                    }`}
                  >
                    {r.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-5">
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-mute)]">
              Seguridad
            </span>
            <div className="mt-2 grid grid-cols-4 gap-1">
              {(['all', 'low', 'medium', 'high'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSecurityFilter(s)}
                  className={`rounded-md px-1 py-1.5 text-[11px] capitalize ${
                    securityFilter === s
                      ? 'bg-[var(--color-coral)] text-white'
                      : 'bg-[var(--color-panel)] text-[var(--color-mute)]'
                  }`}
                >
                  {s === 'all' ? 'Todas' : s}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold uppercase tracking-wide text-[var(--color-mute)]">
                Payout mín.
              </span>
              <span className="text-[var(--color-gold)]">
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
              className="mt-2 w-full accent-[var(--color-coral)]"
            />
          </div>

          <div className="mt-6 rounded-lg border border-[var(--color-line)] bg-[var(--color-lagoon)] p-3">
            <p className="text-xs font-semibold text-[var(--color-gold)]">Preset rápido</p>
            <div className="mt-2 flex flex-col gap-1.5">
              <button
                type="button"
                className="rounded bg-[var(--color-panel)] px-2 py-1.5 text-left text-xs hover:text-[var(--color-teal)]"
                onClick={() => {
                  setActiveCategories(['bank_vault', 'paynspray', 'police', 'ammunation'])
                  setMinPayout(65000)
                  setSecurityFilter('all')
                }}
              >
                Solo bóvedas + escape
              </button>
              <button
                type="button"
                className="rounded bg-[var(--color-panel)] px-2 py-1.5 text-left text-xs hover:text-[var(--color-teal)]"
                onClick={() => {
                  setActiveCategories(['jewelry', 'fence', 'paynspray'])
                  setMinPayout(0)
                  setSecurityFilter('all')
                }}
              >
                Farm joyería → Yasmani
              </button>
              <button
                type="button"
                className="rounded bg-[var(--color-panel)] px-2 py-1.5 text-left text-xs hover:text-[var(--color-teal)]"
                onClick={() => {
                  setActiveCategories(['illegal_op', 'fence', 'ammunation'])
                  setMinPayout(0)
                  setSecurityFilter('all')
                }}
              >
                Compounds + narcóticos
              </button>
              <button
                type="button"
                className="rounded bg-[var(--color-panel)] px-2 py-1.5 text-left text-xs hover:text-[var(--color-teal)]"
                onClick={() => {
                  setActiveCategories(['stickup', 'paynspray'])
                  setMinPayout(0)
                  setSecurityFilter('low')
                }}
              >
                Stick-ups low risk
              </button>
            </div>
          </div>

          <p className="mt-4 text-[10px] leading-relaxed text-[var(--color-mute)]">
            Fuentes: PowerPyx, gta6activities.com, thegta6map.com, Mobalytics, sixthstar.net (guías
            post-lanzamiento Nov 2026). Pins aproximados sobre mapa estilizado — no es el mapa
            oficial de Rockstar.
          </p>
        </aside>

        {/* Map */}
        <main
          className={`relative min-h-0 overflow-hidden bg-[#02303c] ${
            mobileTab === 'map' ? 'block' : 'hidden md:block'
          }`}
        >
          <div className="absolute inset-0 map-scroll overflow-auto">
            <div className="mx-auto h-full min-h-[640px] w-full max-w-[900px] p-2 md:p-4">
              {filtered.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                  <p className="font-[family-name:var(--font-display)] text-2xl text-white">
                    Cero pins. Felicidades, genio.
                  </p>
                  <p className="max-w-sm text-sm text-[var(--color-mute)]">
                    Afloja filtros o busca otra cosa. El mapa no inventa Lombanks donde no hay.
                  </p>
                  <button
                    type="button"
                    className="rounded-md bg-[var(--color-coral)] px-4 py-2 text-sm font-medium text-white"
                    onClick={() => {
                      setActiveCategories([...ALL_CATEGORIES])
                      setActiveRegions([...ALL_REGIONS])
                      setSecurityFilter('all')
                      setMinPayout(0)
                      setQuery('')
                    }}
                  >
                    Resetear filtros
                  </button>
                </div>
              ) : (
                <LeonidaMap
                  locations={filtered}
                  selectedId={selectedVisible ? selectedId : null}
                  onSelect={selectLocation}
                />
              )}
            </div>
          </div>
          <div className="pointer-events-none absolute bottom-3 left-3 right-3 flex justify-center md:justify-start">
            <div className="pointer-events-auto max-w-lg rounded-md border border-[var(--color-line)] bg-[var(--color-ink)]/85 px-3 py-2 text-[11px] text-[var(--color-mute)] backdrop-blur">
              Click un pin para tip de ruta. Usa presets para cadenas de farm. Solo contenido de
              videojuego.
            </div>
          </div>
        </main>

        {/* Detail + list */}
        <aside
          className={`map-scroll flex min-h-0 flex-col overflow-y-auto border-l border-[var(--color-line)] bg-[var(--color-deep)] ${
            mobileTab === 'detail' ? 'flex' : 'hidden md:flex'
          }`}
        >
          {selected ? (
            <div className="border-b border-[var(--color-line)] p-4 animate-fade-up">
              <div className="flex items-start gap-2">
                <span
                  className="mt-1.5 h-3 w-3 shrink-0 rounded-full"
                  style={{ background: categoryMeta(selected.category).color }}
                />
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-[var(--color-mute)]">
                    {categoryMeta(selected.category).label}
                  </p>
                  <h2 className="font-[family-name:var(--font-display)] text-2xl leading-tight text-white">
                    {selected.name}
                  </h2>
                </div>
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-md bg-[var(--color-panel)] p-2">
                  <dt className="text-[10px] uppercase text-[var(--color-mute)]">Región</dt>
                  <dd>{regionMeta(selected.region).label}</dd>
                </div>
                <div className="rounded-md bg-[var(--color-panel)] p-2">
                  <dt className="text-[10px] uppercase text-[var(--color-mute)]">Zona</dt>
                  <dd>{selected.area}</dd>
                </div>
                {payoutLabel(selected) && (
                  <div className="rounded-md bg-[var(--color-panel)] p-2">
                    <dt className="text-[10px] uppercase text-[var(--color-mute)]">Payout</dt>
                    <dd className="text-[var(--color-gold)]">{payoutLabel(selected)}</dd>
                  </div>
                )}
                {selected.security && (
                  <div className="rounded-md bg-[var(--color-panel)] p-2">
                    <dt className="text-[10px] uppercase text-[var(--color-mute)]">Seguridad</dt>
                    <dd className="capitalize">{selected.security}</dd>
                  </div>
                )}
                {selected.unlock && (
                  <div className="col-span-2 rounded-md bg-[var(--color-panel)] p-2">
                    <dt className="text-[10px] uppercase text-[var(--color-mute)]">Unlock</dt>
                    <dd>{selected.unlock}</dd>
                  </div>
                )}
                {selected.bestFor && (
                  <div className="col-span-2 rounded-md bg-[var(--color-panel)] p-2">
                    <dt className="text-[10px] uppercase text-[var(--color-mute)]">Mejor para</dt>
                    <dd>{selected.bestFor}</dd>
                  </div>
                )}
                {selected.lootType && (
                  <div className="col-span-2 rounded-md bg-[var(--color-panel)] p-2">
                    <dt className="text-[10px] uppercase text-[var(--color-mute)]">Loot</dt>
                    <dd>{selected.lootType}</dd>
                  </div>
                )}
              </dl>

              <p className="mt-3 text-sm leading-relaxed text-[var(--color-mist)]">{selected.tip}</p>
              <p className="mt-2 text-[10px] text-[var(--color-mute)]">Fuente: {selected.source}</p>
              <p className="mt-3 text-xs leading-relaxed text-[var(--color-teal)]">
                {categoryMeta(selected.category).mapUse}
              </p>
            </div>
          ) : (
            <div className="border-b border-[var(--color-line)] p-4 text-sm text-[var(--color-mute)]">
              Selecciona un pin en el mapa.
            </div>
          )}

          <div className="flex-1 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-mute)]">
              Lista filtrada
            </p>
            {filtered.length === 0 ? (
              <p className="text-sm text-[var(--color-mute)]">Sin resultados.</p>
            ) : (
              <ul className="space-y-1">
                {[...filtered]
                  .sort((a, b) => (b.payoutMax ?? 0) - (a.payoutMax ?? 0))
                  .map((loc) => (
                    <li key={loc.id}>
                      <button
                        type="button"
                        onClick={() => selectLocation(loc.id)}
                        className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition ${
                          loc.id === selectedId
                            ? 'bg-[var(--color-panel)] ring-1 ring-[var(--color-coral)]/60'
                            : 'hover:bg-[var(--color-panel)]/60'
                        }`}
                      >
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ background: categoryMeta(loc.category).color }}
                        />
                        <span className="min-w-0 flex-1 truncate">{loc.name}</span>
                        {payoutLabel(loc) && (
                          <span className="shrink-0 text-[11px] text-[var(--color-gold)]">
                            {payoutLabel(loc)}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
