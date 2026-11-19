import type { CategoryMeta, RegionMeta } from './types'

export const CATEGORIES: CategoryMeta[] = [
  {
    id: 'bank_vault',
    label: 'Bóvedas bancarias',
    short: 'Bóvedas',
    color: '#ff5c39',
    mapUse:
      'Mapa de alto botín: 8 vaults late-game ($65k–$205k). Ideal para planear rutas de escape con 4 estrellas desde el minuto 1.',
  },
  {
    id: 'bank_small',
    label: 'Bancos pequeños',
    short: 'Bancos',
    color: '#f0c75e',
    mapUse:
      'Mapa mid-game (Cap. 3): 14 sucursales ($5k–$45k). Menos calor que una bóveda; combina con Pay ’n’ Spray cercanos.',
  },
  {
    id: 'jewelry',
    label: 'Joyerías / pawn',
    short: 'Joyería',
    color: '#7dd3fc',
    mapUse:
      'Mapa de farm en cadena: ~38 locales ($10k–$25k). Desarma CCTV, saquea caja fuerte trasera, vende a Yasmani.',
  },
  {
    id: 'stickup',
    label: 'Stick-ups (tiendas)',
    short: 'Stick-ups',
    color: '#a3e635',
    mapUse:
      'Mapa de cash rápido y bajo riesgo: 37 Stick Ups oficiales ($100–$3k). Entra por atrás, cámaras y caja.',
  },
  {
    id: 'illegal_op',
    label: 'Operaciones ilegales',
    short: 'Ops ilegales',
    color: '#c084fc',
    mapUse:
      'Mapa de narcóticos y compounds: ~33–39 hideouts de pandillas. Botín en droga + cash; cerca de fences de narcóticos.',
  },
  {
    id: 'fence',
    label: 'Fences (compradores)',
    short: 'Fences',
    color: '#2ec4b6',
    mapUse:
      'Mapa de liquidez: sin fence el loot no vale nada. Filtra por Yasmani (joyas/billetes) o Tyrone (narcóticos).',
  },
  {
    id: 'payday',
    label: 'Payday loans',
    short: 'Payday',
    color: '#fb923c',
    mapUse:
      'Mapa de billetes marcados mid-tier. Complemento a bancos pequeños cuando quieres cash sin bóveda.',
  },
  {
    id: 'paynspray',
    label: 'Pay ’n’ Spray',
    short: 'PnS',
    color: '#94a3b8',
    mapUse:
      'Mapa de escape: 19 talleres. Pierde wanted, repara y revende coches robados (~$4k+ con tracker).',
  },
  {
    id: 'police',
    label: 'Comisarías',
    short: 'Policía',
    color: '#38bdf8',
    mapUse:
      'Mapa de calor: 5 PD. Úsalo para evitar zonas calientes o planear desvíos lejos de respuesta policial.',
  },
  {
    id: 'ammunation',
    label: 'Armerías',
    short: 'Armas',
    color: '#f87171',
    mapUse:
      'Mapa de prep: 24 Ammu-Nation / gun shops. Stockea chaleco y armas antes de vaults o compounds.',
  },
  {
    id: 'safehouse',
    label: 'Safehouses',
    short: 'Safehouse',
    color: '#e879f9',
    mapUse:
      'Mapa de staging: casas seguras y garajes para guardar loot, cambiar ropa y resetear descripción.',
  },
]

export const REGIONS: RegionMeta[] = [
  {
    id: 'vice_city',
    label: 'Vice City',
    blurb: 'Mayor densidad de bóvedas, joyerías y fences. Alto riesgo, alto payout.',
  },
  {
    id: 'vice_beach',
    label: 'Vice Beach / Ocean Beach',
    blurb: 'Lombank y Shorefront vaults + Pay ’n’ Spray de playa. Escape costero.',
  },
  {
    id: 'leonida_keys',
    label: 'Leonida Keys',
    blurb: 'Arranque de historia. Stick-ups, fences tempranos (Brian/Donnie) y ops Kingfishers.',
  },
  {
    id: 'grassrivers',
    label: 'Grassrivers',
    blurb: 'Humedales. Escapes en airboat; pocos bancos, buen terreno para perder perseguidores.',
  },
  {
    id: 'port_gellhorn',
    label: 'Port Gellhorn',
    blurb: 'Pawn shops, Kolts & Associates, stick-ups de motel. Economía de costa olvidada.',
  },
  {
    id: 'ambrosia',
    label: 'Ambrosia',
    blurb: 'Pueblo industrial / bikers. Shorefront small bank + PD local.',
  },
  {
    id: 'mount_kalaga',
    label: 'Mount Kalaga',
    blurb: 'Norte forestal. Compounds remotos y rutas off-road para perder heat.',
  },
  {
    id: 'hamlet',
    label: 'Hamlet',
    blurb: 'Sur Vice-Dale: prisión, M7, pawn y Pay ’n’ Spray.',
  },
]

export const MAP_TYPES = [
  {
    title: 'Mapa de botín (targets)',
    items: ['Bóvedas', 'Bancos pequeños', 'Joyerías', 'Stick-ups', 'Ops ilegales', 'Payday'],
    why: 'Identifica qué robar según capítulo y riesgo/recompensa.',
  },
  {
    title: 'Mapa de liquidez (fences)',
    items: ['Fences', 'Pawn shops', 'Pay ’n’ Spray (coches)'],
    why: 'El loot en la bolsa no paga. Necesitas comprador antes de morir.',
  },
  {
    title: 'Mapa de escape / heat',
    items: ['Pay ’n’ Spray', 'Comisarías', 'Safehouses', 'Mod shops'],
    why: 'Ruta de salida: cambiar auto, ropa y alejarte de PD.',
  },
  {
    title: 'Mapa de preparación',
    items: ['Ammu-Nation', 'Garajes', 'Safehouses'],
    why: 'Carga, armadura y punto de staging antes del golpe.',
  },
]
