import { useEffect, useRef, useState, type ReactNode } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Maximize, Minimize, Minus, Plus } from 'lucide-react'
import type { MapLocation } from '../data/types'
import { CATEGORIES, MAP_LABELS } from '../data/meta'
import { categorySvg } from './icons'

/**
 * gtadb.org tile pyramid: at zoom 0 the 32768 m world spans 1024 px with the
 * origin at pixel (512, 512) and y pointing north.
 */
const GTADB_CRS = L.extend({}, L.CRS.Simple, {
  transformation: new L.Transformation(1 / 32, 512, -1 / 32, 512),
})

const TILE_URL =
  'https://cdn.jsdelivr.net/gh/rolux/gtadb.org@main/maps/tiles/6/day/{z}/{z},{y},{x}.jpg'

const LEONIDA_BOUNDS = L.latLngBounds([-9000, -10500], [10800, 4500])
const ISLAND_BOUNDS = L.latLngBounds([-7400, -8300], [8600, 3300])
/** Extent covered by the "day" tileset (zoom-0 tiles x 0–2, y 0–3). */
const TILESET_BOUNDS = L.latLngBounds([-16384, -16384], [16384, 8192])

const ATTRIBUTION =
  'Map tiles &amp; landmarks: <a href="https://map.gtadb.org" target="_blank" rel="noreferrer">gtadb.org</a> ' +
  '(<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>), pins añadidos'

const PIN_W = 28
const PIN_H = 34

const metaFor = (category: MapLocation['category']) => CATEGORIES.find((c) => c.id === category)!

function pinIcon(loc: MapLocation, selected: boolean, found: boolean) {
  const classes = ['pin']
  if (selected) classes.push('pin--selected')
  if (found) classes.push('pin--found')
  if (loc.precision === 'area') classes.push('pin--area')
  if (loc.suggested) classes.push('pin--suggested')
  else if (loc.confidence === 'low') classes.push('pin--low')
  return L.divIcon({
    className: '',
    iconSize: [PIN_W, PIN_H],
    iconAnchor: [PIN_W / 2, PIN_H],
    html: `<div class="${classes.join(' ')}" style="--pin:${metaFor(loc.category).color}"><div class="pin__head">${categorySvg(loc.category)}</div></div>`,
  })
}

function zoomTier(z: number) {
  if (z < 1.25) return 'far'
  if (z < 3) return 'mid'
  return 'near'
}

interface Props {
  locations: MapLocation[]
  selectedId: string | null
  foundIds: Set<string>
  onSelect: (id: string | null) => void
  popup: ReactNode
  /** Modo "proponer pin": el clic en el mapa captura coordenadas en vez de deseleccionar. */
  pickMode?: boolean
  onPick?: (wx: number, wy: number) => void
}

export function LeonidaMap({ locations, selectedId, foundIds, onSelect, popup, pickMode = false, onPick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layerRef = useRef<L.LayerGroup | null>(null)
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect
  const pickRef = useRef(pickMode)
  pickRef.current = pickMode
  const onPickRef = useRef(onPick)
  onPickRef.current = onPick
  const [night, setNight] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [popupPoint, setPopupPoint] = useState<L.Point | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const el = containerRef.current
    const map = L.map(el, {
      crs: GTADB_CRS,
      minZoom: -1,
      maxZoom: 7,
      zoomSnap: 0.25,
      zoomDelta: 0.5,
      wheelPxPerZoomLevel: 90,
      maxBounds: LEONIDA_BOUNDS.pad(0.15),
      maxBoundsViscosity: 0.8,
      attributionControl: true,
      zoomControl: false,
    })
    L.tileLayer(TILE_URL, {
      minZoom: -1,
      maxZoom: 7,
      minNativeZoom: 0,
      maxNativeZoom: 6,
      tileSize: 256,
      noWrap: true,
      bounds: TILESET_BOUNDS,
      attribution: ATTRIBUTION,
    }).addTo(map)
    map.attributionControl.setPrefix(false)

    const labels = L.layerGroup().addTo(map)
    for (const label of MAP_LABELS) {
      L.marker([label.at[1], label.at[0]], {
        interactive: false,
        keyboard: false,
        zIndexOffset: -10000,
        icon: L.divIcon({
          className: '',
          iconSize: [0, 0],
          html: `<div class="map-label map-label--${label.tier}">${label.text}</div>`,
        }),
      }).addTo(labels)
    }

    const syncTier = () => {
      el.dataset.ztier = zoomTier(map.getZoom())
    }
    map.on('zoomend', syncTier)
    map.on('click', (e) => {
      if (pickRef.current && onPickRef.current) {
        // CRS.Simple: lat = wy (y del mundo), lng = wx (x del mundo).
        onPickRef.current(Math.round(e.latlng.lng), Math.round(e.latlng.lat))
        return
      }
      onSelectRef.current(null)
    })
    const wide = el.clientWidth >= 1024
    map.fitBounds(ISLAND_BOUNDS, {
      paddingTopLeft: [wide ? 330 : 0, 0],
      paddingBottomRight: [wide ? 270 : 0, 0],
    })
    syncTier()
    layerRef.current = L.layerGroup().addTo(map)
    mapRef.current = map

    const ro = new ResizeObserver(() => map.invalidateSize())
    ro.observe(el)
    return () => {
      ro.disconnect()
      map.remove()
      mapRef.current = null
      layerRef.current = null
    }
  }, [])

  useEffect(() => {
    const layer = layerRef.current
    if (!layer) return
    layer.clearLayers()
    const ordered = [...locations].sort((a, b) => Number(a.id === selectedId) - Number(b.id === selectedId))
    for (const loc of ordered) {
      const selected = loc.id === selectedId
      const marker = L.marker([loc.wy, loc.wx], {
        icon: pinIcon(loc, selected, foundIds.has(loc.id)),
        zIndexOffset: selected ? 1000 : 0,
        keyboard: true,
        title: loc.name,
        riseOnHover: true,
      })
      if (!selected) {
        marker.bindTooltip(loc.name, {
          direction: 'right',
          offset: [10, -PIN_H / 2],
          className: 'pin-tooltip',
        })
      }
      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e)
        onSelectRef.current(loc.id)
      })
      layer.addLayer(marker)
    }
  }, [locations, selectedId, foundIds])

  const selectedLoc = selectedId ? locations.find((l) => l.id === selectedId) ?? null : null

  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedLoc) {
      setPopupPoint(null)
      return
    }
    const latlng = L.latLng(selectedLoc.wy, selectedLoc.wx)
    const update = () => setPopupPoint(map.latLngToContainerPoint(latlng))
    update()
    map.on('move zoom viewreset resize', update)
    return () => {
      map.off('move zoom viewreset resize', update)
    }
  }, [selectedLoc])

  const prevSelectedRef = useRef(selectedId)
  useEffect(() => {
    const map = mapRef.current
    if (prevSelectedRef.current === selectedId) return
    prevSelectedRef.current = selectedId
    if (!map || !selectedLoc) return
    const target = L.latLng(selectedLoc.wy, selectedLoc.wx)
    if (!map.getBounds().pad(-0.25).contains(target) || map.getZoom() < 2) {
      map.flyTo(target, Math.max(map.getZoom(), 3), { duration: 0.8 })
    }
    // Only react to selection changes, not to filter changes.
  }, [selectedId])

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement != null)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  function toggleFullscreen() {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void document.documentElement.requestFullscreen()
  }

  const ctrl =
    'grid h-10 w-10 place-items-center rounded-full bg-[var(--color-genie)]/95 text-white shadow-lg shadow-black/30 transition hover:bg-[var(--color-genie-hi)]'

  return (
    <div className={`relative h-full w-full ${night ? 'map-night' : ''} ${pickMode ? 'map-pick' : ''}`}>
      <div ref={containerRef} className="h-full w-full" />

      {popupPoint && popup && (
        <div
          className="pointer-events-none absolute z-[700]"
          style={{ left: popupPoint.x, top: popupPoint.y - PIN_H - 10 }}
        >
          <div className="pointer-events-auto -translate-x-1/2 -translate-y-full">{popup}</div>
        </div>
      )}

      <div className="absolute bottom-8 right-4 z-[600] flex flex-col items-end gap-2">
        <button type="button" className={ctrl} onClick={toggleFullscreen} title="Pantalla completa">
          {fullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
        </button>
        <button type="button" className={ctrl} onClick={() => mapRef.current?.zoomIn()} title="Acercar">
          <Plus size={18} />
        </button>
        <button type="button" className={ctrl} onClick={() => mapRef.current?.zoomOut()} title="Alejar">
          <Minus size={18} />
        </button>
      </div>

      <div className="absolute bottom-8 right-20 z-[600] flex rounded-full bg-[var(--color-genie)]/95 p-1 text-sm font-semibold shadow-lg shadow-black/30">
        {(
          [
            [false, 'Día'],
            [true, 'Noche'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={label}
            type="button"
            onClick={() => setNight(value)}
            className={`rounded-full px-4 py-1.5 transition ${
              night === value ? 'bg-white text-[var(--color-genie-ink)]' : 'text-white/85 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
