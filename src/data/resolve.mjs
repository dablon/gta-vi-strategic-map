// Resolución pura de pins: la usan App (navegador), extract-landmarks y
// discover-locations. Un solo lugar donde se calculan coordenadas y regiones;
// así el bot y la app no pueden disentir nunca.
// Fuente de los centroides: landmarks de gtadb.org (CC BY 4.0).

/** Centroides de barrio en metros de mundo, promediados de los landmarks de gtadb.org. */
export const AREA_CENTROIDS = {
  Downtown: [-662, -102],
  'Ocean Beach': [1743, 702],
  'Washington Beach': [1702, 2183],
  'Key Lento': [-2510, -5919],
  'Port Gellhorn': [-6575, 3729],
  Belville: [-1375, 2897],
  Hamlet: [-2691, -3193],
  Capri: [-6896, 210],
  'Watson Bay': [-4987, -3272],
  'Little Cuba': [-1200, 75],
  'La Perle': [-968, 1430],
  Tequesta: [-752, -1102],
  'Peacock Bay': [-1195, -1903],
  Bayside: [-349, 1041],
  Rockridge: [-1264, 860],
  Southside: [-1791, -2071],
  Salton: [-1463, -501],
  Southwind: [-6388, -6463],
  Ambrosia: [-2796, 3954],
  'Waning Sands': [-23, 3987],
  Crosstown: [-636, 1157],
  VCIA: [-2296, -714],
  Grassrivers: [-3068, -4544],
  'Leonard County': [-845, 3721],
  'Lummox County': [-3536, 7046],
  'Vice City': [-800, 200],
  Stockyard: [-380, 1760],
  Balsero: [-1850, 650],
  Millport: [-1075, 6490],
}

/** Centros de región en metros de mundo (para clasificar landmarks sin región explícita). */
export const REGION_CENTERS = {
  vice_city: [-800, 300],
  vice_beach: [1600, 1300],
  leonida_keys: [-2510, -5919],
  grassrivers: [-4000, -3800],
  capri: [-6896, 210],
  port_gellhorn: [-6575, 3729],
  ambrosia: [-2796, 3954],
  leonard: [-600, 3400],
  mount_kalaga: [-3536, 7046],
  hamlet: [-2691, -3193],
}

export function nearestRegion(wx, wy) {
  return Object.entries(REGION_CENTERS).sort(
    ([, a], [, b]) => (a[0] - wx) ** 2 + (a[1] - wy) ** 2 - ((b[0] - wx) ** 2 + (b[1] - wy) ** 2),
  )[0][0]
}

/** Barrio más cercano. Sirve para etiquetar un pin que llega sin zona (IGN). */
export function nearestArea(wx, wy) {
  return Object.entries(AREA_CENTROIDS).sort(
    ([, a], [, b]) => (a[0] - wx) ** 2 + (a[1] - wy) ** 2 - ((b[0] - wx) ** 2 + (b[1] - wy) ** 2),
  )[0][0]
}

function hash(s) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Desplazamiento determinista para que los pins de un mismo barrio no se encimen. */
function jitter(id, radius = 160) {
  const h = hash(id)
  const angle = ((h % 3600) / 3600) * Math.PI * 2
  const r = radius * (0.35 + ((h >>> 12) % 100) / 154)
  return [Math.cos(angle) * r, Math.sin(angle) * r]
}

/**
 * Convierte un seed curado (src/data/seeds.json) en pin resuelto con wx/wy.
 * Lanza si el seed pide un centroide que no existe: mejor ruido en CI que un
 * pin silenciosamente mal puesto.
 */
export function build(seed) {
  const { at, centroid, spread, ...rest } = seed
  if (at) return { ...rest, wx: at[0], wy: at[1], precision: 'exact' }
  const key = centroid ?? seed.area
  const c = AREA_CENTROIDS[key]
  if (!c) throw new Error(`Sin centroide para "${key}" (${seed.id})`)
  const [dx, dy] = jitter(seed.id, spread ?? 160)
  return { ...rest, wx: Math.round(c[0] + dx), wy: Math.round(c[1] + dy), precision: 'area' }
}
