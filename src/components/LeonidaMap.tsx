import type { MapLocation } from '../data/types'
import { CATEGORIES } from '../data/meta'

const colorFor = (category: MapLocation['category']) =>
  CATEGORIES.find((c) => c.id === category)?.color ?? '#fff'

interface Props {
  locations: MapLocation[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export function LeonidaMap({ locations, selectedId, onSelect }: Props) {
  return (
    <svg
      viewBox="0 0 1000 1400"
      className="h-full w-full"
      role="img"
      aria-label="Mapa estilizado de Leonida con puntos estratégicos"
    >
      <defs>
        <linearGradient id="sea" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#03485a" />
          <stop offset="55%" stopColor="#02303c" />
          <stop offset="100%" stopColor="#011820" />
        </linearGradient>
        <linearGradient id="land" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a6b5a" />
          <stop offset="40%" stopColor="#1f7a4f" />
          <stop offset="100%" stopColor="#2a8f55" />
        </linearGradient>
        <linearGradient id="city" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2a4d5c" />
          <stop offset="100%" stopColor="#1a3542" />
        </linearGradient>
        <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#0d3a46" strokeWidth="1" />
        </pattern>
      </defs>

      <rect width="1000" height="1400" fill="url(#sea)" />
      <rect width="1000" height="1400" fill="url(#grid)" opacity="0.35" />

      {/* Gulf / Atlantic labels */}
      <text x="70" y="700" fill="#5f9eaa" fontSize="18" fontFamily="Sora" opacity="0.55" transform="rotate(-90 70 700)">
        THE GULF
      </text>
      <text x="960" y="620" fill="#5f9eaa" fontSize="18" fontFamily="Sora" opacity="0.55" transform="rotate(90 960 620)">
        ATLANTIC
      </text>

      {/* Mount Kalaga */}
      <path
        d="M280 60 C360 40 520 35 640 70 C720 100 740 180 700 240 C640 300 420 310 320 260 C250 210 220 100 280 60Z"
        fill="url(#land)"
        opacity="0.85"
      />
      <text x="460" y="160" textAnchor="middle" fill="#d7ece8" fontSize="22" fontFamily="Bricolage Grotesque" fontWeight="700">
        Mount Kalaga
      </text>

      {/* Port Gellhorn */}
      <path
        d="M60 220 C120 190 200 200 250 260 C280 320 260 400 200 440 C130 470 70 430 50 360 C35 300 40 250 60 220Z"
        fill="#2f6d5a"
      />
      <text x="140" y="330" textAnchor="middle" fill="#d7ece8" fontSize="18" fontFamily="Bricolage Grotesque" fontWeight="700">
        Port Gellhorn
      </text>

      {/* Ambrosia */}
      <path
        d="M300 340 C380 310 480 320 520 380 C540 430 500 500 420 520 C340 540 280 480 270 420 C260 370 270 355 300 340Z"
        fill="#3a7d52"
      />
      <text x="390" y="430" textAnchor="middle" fill="#d7ece8" fontSize="20" fontFamily="Bricolage Grotesque" fontWeight="700">
        Ambrosia
      </text>

      {/* Lake hint */}
      <ellipse cx="450" cy="380" rx="55" ry="28" fill="#05607a" opacity="0.7" />

      {/* Grassrivers */}
      <path
        d="M180 820 C280 760 420 780 480 880 C520 960 460 1060 340 1080 C220 1100 140 1000 150 920 C155 870 160 840 180 820Z"
        fill="#246b4a"
      />
      <text x="320" y="940" textAnchor="middle" fill="#d7ece8" fontSize="20" fontFamily="Bricolage Grotesque" fontWeight="700">
        Grassrivers
      </text>

      {/* Hamlet band */}
      <path
        d="M500 820 C560 800 620 820 640 880 C650 920 610 960 540 950 C480 940 470 860 500 820Z"
        fill="#2d6a58"
      />
      <text x="560" y="900" textAnchor="middle" fill="#d7ece8" fontSize="16" fontFamily="Bricolage Grotesque" fontWeight="700">
        Hamlet
      </text>

      {/* Vice City metro */}
      <path
        d="M620 480 C700 450 820 470 900 560 C960 640 940 780 880 860 C800 960 680 940 640 840 C600 740 580 560 620 480Z"
        fill="url(#city)"
      />
      <path
        d="M780 560 C820 540 880 560 910 620 C930 670 910 740 870 780 C820 830 760 810 740 750 C720 680 740 590 780 560Z"
        fill="#355868"
        opacity="0.9"
      />
      <text x="760" y="680" textAnchor="middle" fill="#ffd7c8" fontSize="28" fontFamily="Bricolage Grotesque" fontWeight="800">
        Vice City
      </text>
      <text x="860" y="760" textAnchor="middle" fill="#9ed7d0" fontSize="14" fontFamily="Sora">
        Ocean Beach
      </text>

      {/* Keys chain */}
      <ellipse cx="420" y="1140" rx="70" ry="28" fill="#2f7a5e" />
      <ellipse cx="500" y="1185" rx="90" ry="34" fill="#348564" />
      <ellipse cx="580" y="1240" rx="55" ry="22" fill="#2f7a5e" />
      <ellipse cx="460" y="1285" rx="40" ry="16" fill="#2a7058" />
      <path d="M450 1160 L520 1195 L560 1230" stroke="#f0c75e" strokeWidth="3" fill="none" strokeDasharray="6 6" opacity="0.7" />
      <text x="500" y="1190" textAnchor="middle" fill="#d7ece8" fontSize="18" fontFamily="Bricolage Grotesque" fontWeight="700">
        Leonida Keys
      </text>
      <text x="500" y="1212" textAnchor="middle" fill="#9ed7d0" fontSize="12" fontFamily="Sora">
        Key Lento
      </text>

      {/* Highways */}
      <path
        d="M160 360 C280 420 360 520 420 620 C500 760 520 900 500 1120"
        stroke="#f0c75e"
        strokeWidth="2.5"
        fill="none"
        opacity="0.35"
      />
      <path
        d="M400 420 C520 460 620 520 720 600"
        stroke="#f0c75e"
        strokeWidth="2"
        fill="none"
        opacity="0.3"
      />

      {/* Region glow accents */}
      <circle cx="760" cy="680" r="90" fill="#ff5c39" opacity="0.05" />
      <circle cx="500" cy="1185" r="70" fill="#2ec4b6" opacity="0.06" />

      {/* Pins */}
      {locations.map((loc) => {
        const selected = loc.id === selectedId
        const color = colorFor(loc.category)
        return (
          <g
            key={loc.id}
            transform={`translate(${loc.x}, ${loc.y})`}
            className="cursor-pointer"
            onClick={(e) => {
              e.stopPropagation()
              onSelect(loc.id)
            }}
          >
            {selected && (
              <circle r="16" fill="none" stroke={color} strokeWidth="2" className="animate-pulse-ring" />
            )}
            <circle
              r={selected ? 9 : 6.5}
              fill={color}
              stroke="#041218"
              strokeWidth="2"
              filter={selected ? 'url(#softGlow)' : undefined}
            />
            {selected && (
              <text
                y="-16"
                textAnchor="middle"
                fill="#fff"
                fontSize="13"
                fontFamily="Sora"
                fontWeight="600"
              >
                {loc.name.length > 28 ? `${loc.name.slice(0, 26)}…` : loc.name}
              </text>
            )}
          </g>
        )
      })}

      <text x="500" y="1365" textAnchor="middle" fill="#5f9eaa" fontSize="12" fontFamily="Sora">
        Mapa estilizado · posiciones aproximadas · solo uso in-game
      </text>
    </svg>
  )
}
