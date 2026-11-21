import { renderToStaticMarkup } from 'react-dom/server'
import {
  Anchor,
  Banknote,
  Crosshair,
  Fuel,
  Gem,
  HandCoins,
  Hospital,
  House,
  Landmark,
  Plane,
  ShoppingCart,
  Siren,
  Skull,
  SprayCan,
  Store,
  CarFront,
  CreditCard,
  Disc3,
  Dumbbell,
  Flag,
  Gamepad2,
  Gauge,
  Lock,
  Martini,
  PawPrint,
  Plug,
  Shirt,
  Sparkles,
  TrainFront,
  Trophy,
  Utensils,
  Vault,
  Warehouse,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import type { LocationCategory } from '../data/types'

export const CATEGORY_ICONS: Record<LocationCategory, LucideIcon> = {
  bank_vault: Vault,
  bank_small: Landmark,
  jewelry: Gem,
  payday: Banknote,
  stickup: Store,
  store: ShoppingCart,
  gas: Fuel,
  illegal_op: Skull,
  fence: HandCoins,
  paynspray: SprayCan,
  marina: Anchor,
  airport: Plane,
  transit: TrainFront,
  police: Siren,
  ammunation: Crosshair,
  modshop: Wrench,
  safehouse: House,
  hospital: Hospital,
  vehicle: CarFront,
  atm: CreditCard,
  clothing: Shirt,
  bar: Martini,
  collectible: Sparkles,
  stunt: Flag,
  animal: PawPrint,
  gym: Dumbbell,
  club: Disc3,
  safe: Lock,
  charger: Plug,
  garage: Warehouse,
  rare_vehicle: CarFront,
  food: Utensils,
  sport: Trophy,
  activity: Gamepad2,
  race: Gauge,
}

const svgCache = new Map<LocationCategory, string>()

/** SVG en string para iconos de Leaflet (divIcon no acepta React). */
export function categorySvg(id: LocationCategory): string {
  let svg = svgCache.get(id)
  if (!svg) {
    const Icon = CATEGORY_ICONS[id]
    svg = renderToStaticMarkup(<Icon size={15} strokeWidth={2.4} />)
    svgCache.set(id, svg)
  }
  return svg
}

export function CategoryIcon({ id, size = 14 }: { id: LocationCategory; size?: number }) {
  const Icon = CATEGORY_ICONS[id]
  return <Icon size={size} strokeWidth={2.4} />
}
