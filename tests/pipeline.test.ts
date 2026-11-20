import { describe, expect, it } from 'vitest'
import {
  classify,
  eachUsable,
  isDead,
  norm,
  parseLandmarks,
  tooClose,
  SAME_NAME_M,
  SAME_SPOT_M,
} from '../scripts/lib/gtadb.mjs'
import { parseIssueBody } from '../scripts/lib/issue-body.mjs'
import { nearestRegion } from '../src/data/resolve.mjs'

const fixtureEntries = [
  ['L1', ['Fleeca Bank, Downtown', [-100, -100], [0, 0], null, null, null, ['#metro']]],
  ['L2', ['?, Swamp', [-9000, -9000], [0, 0], null, null, null, ['industrial']]],
  ['L3', ['Old Lot, Somewhere', [500, 500], [0, 0], null, null, null, ['demolished']]],
  ['L4', ['Meth Lab, Kelly County', [120, 120], [0, 0], null, null, null, ['unconfirmed']]],
  ['L5', ['?', [0, 0], [0, 0], null, null, null, []]],
]

describe('norm', () => {
  it('quita acentos y puntuación', () => {
    expect(norm('Joyería “El” Pezón!')).toBe('joyeria el pezon')
  })
})

describe('isDead', () => {
  it('mata residencial/hotel/demolished y marcadores //', () => {
    expect(isDead('demolished')).toBe(true)
    expect(isDead('residential')).toBe(true)
    expect(isDead('hotel')).toBe(true)
    expect(isDead('//doesnt_exist')).toBe(true)
    expect(isDead('//duplicate-of-823')).toBe(true)
    expect(isDead('//may-not-exist')).toBe(true)
    expect(isDead('enterable')).toBe(false)
  })
})

describe('classify', () => {
  it('hashtag → medium por vía hash', () => {
    expect(classify('Cualquier cosa', ['#bus'])).toEqual({ category: 'transit', confidence: 'medium', via: 'hash' })
  })

  it('nombre con patrón → medium por vía name', () => {
    expect(classify('Lombank Little Havana', [])?.category).toBe('bank_small')
    expect(classify('Lombank Little Havana', [])?.via).toBe('name')
  })

  it('nombre ambiguo + tag industrial → low por vía secondary', () => {
    expect(classify('Almacén ?, X', ['industrial'])).toEqual({ category: 'illegal_op', confidence: 'low', via: 'secondary' })
  })

  it('hash gana a secondary, y el nombre no tapa un tag', () => {
    expect(classify('Pay N Spray, Tequesta', ['#gas'])?.via).toBe('hash')
  })

  it('nombres que no son objetivos se rechazan', () => {
    expect(classify('Veterans Memorial Field', [])).toBeNull()
    expect(classify(' ?, X', [])).toBeNull()
  })

  it('nombre null no explota', () => {
    expect(classify(null, ['#hair'])?.category).toBe('stickup')
    expect(classify(null, ['retail'])?.confidence).toBe('low')
    expect(classify(null, ['landmark'])).toBeNull()
  })
})

describe('parseLandmarks (guardas de esquema)', () => {
  it('acepta fixture con forma correcta', () => {
    const raw = Object.fromEntries(fixtureEntries)
    // El guard exige >2000 entradas reales: construimos un cuerpo grande pero válido.
    const big = { ...raw }
    for (let i = 0; i < 2100; i++) big[`F${i}`] = ['Thing, Area', [1, 1], [0, 0], null, null, null, []]
    expect(parseLandmarks(big).length).toBe(Object.keys(big).length)
  })

  it('aborta si el dataset encoge', () => {
    expect(() => parseLandmarks(Object.fromEntries(fixtureEntries))).toThrow(/esperados/)
  })

  it('aborta si las entradas se malforman', () => {
    const big = {}
    for (let i = 0; i < 2100; i++) big[`F${i}`] = 'not-an-array'
    expect(() => parseLandmarks(big)).toThrow(/malformadas/)
  })

  it('aborta si no es objeto', () => {
    expect(() => parseLandmarks([])).toThrow(/no es un objeto/)
  })
})

describe('eachUsable', () => {
  it('filtra muertos, sin coords y sin nombre usable', () => {
    const usable = [...eachUsable([
      ['U1', fixtureEntries[0][1]],
      ['U2', fixtureEntries[1][1]],
      ['U3', fixtureEntries[2][1]],
      ['U4', fixtureEntries[3][1]],
    ])]
    expect(usable.map((u) => u.id)).toEqual(['U1', 'U2', 'U4'])
    const u1 = usable[0]
    expect(u1).toMatchObject({ id: 'U1', name: 'Fleeca Bank', area: 'Downtown', x: -100, y: -100 })
    expect(usable[1].name).toBeNull()
  })
})

describe('tooClose (regresión del bug de dedupe por nombre)', () => {
  // El bug viejo: los puntos de nombre viajaban con wx/wy null, así que
  // SAME_NAME_M nunca se aplicaba. Ahora nombre y coordenada viajan juntos.
  const points = [{ wx: 0, wy: 0, name: norm('Lombank Downtown') }]

  it('mismo nombre a menos de SAME_NAME_M → demasiado cerca', () => {
    expect(tooClose({ wx: 0, wy: SAME_NAME_M - 1, name: 'Lombank  Downtown' }, points)).toBe(true)
  })

  it('mismo nombre lejos → no', () => {
    expect(tooClose({ wx: 0, wy: SAME_NAME_M + 50, name: 'Lombank Downtown' }, points)).toBe(false)
  })

  it('cualquier nombre a menos de SAME_SPOT_M → demasiado cerca', () => {
    expect(tooClose({ wx: SAME_SPOT_M - 1, wy: 0, name: 'Cosas Del Todo Distintas' }, points)).toBe(true)
  })
})

describe('nearestRegion', () => {
  it('clasifica por cercanía al centro de región', () => {
    expect(nearestRegion(-800, 300)).toBe('vice_city')
    expect(nearestRegion(1600, 1300)).toBe('vice_beach')
    expect(nearestRegion(-2510, -5919)).toBe('leonida_keys')
    expect(nearestRegion(-6896, 210)).toBe('capri')
  })
})

describe('parseIssueBody', () => {
  it('lee el bloque json que genera la app', () => {
    const body = [
      'Propuesta enviada desde el mapa.',
      '',
      '```json',
      '{"name":"Lombank Little Havana","category":"bank_small","wx":-123,"wy":45,"area":"Little Havana","notes":"caja trasera"}',
      '```',
      '',
      '- Región calculada: vice_city',
    ].join('\n')
    expect(parseIssueBody(body)).toMatchObject({
      name: 'Lombank Little Havana',
      category: 'bank_small',
      wx: -123,
      wy: 45,
      notes: 'caja trasera',
    })
  })

  it('lee el formulario del template de issue', () => {
    const body = [
      '### Nombre',
      '',
      'Lombank Little Havana',
      '',
      '### Categoría (category)',
      '',
      'bank_small',
      '',
      '### Barrio / zona (opcional)',
      '',
      'Little Havana',
      '',
      '### Coordenada wx (metros del mundo)',
      '',
      '-123',
      '',
      '### Coordenada wy (metros del mundo)',
      '',
      '45',
      '',
      '### Notas',
      '',
      'Entra por atrás',
    ].join('\r\n')
    expect(parseIssueBody(body)).toMatchObject({ name: 'Lombank Little Havana', category: 'bank_small', wx: -123, wy: 45 })
  })

  it('devuelve null con datos insuficientes', () => {
    expect(parseIssueBody('hola, puse un banco cerca del mar')).toBeNull()
    expect(parseIssueBody('')).toBeNull()
    expect(parseIssueBody('```json\n{"name":"x"}\n```')).toBeNull()
  })

  it('ignora el bloque json corrupto y prueba el formulario', () => {
    const body = ['```json', '{no-json', '```', '### Nombre', '', 'Repo', '### Categoría (category)', '', 'gas', '### wx', '', '1', '### wy', '', '2'].join('\r\n')
    expect(parseIssueBody(body)).toMatchObject({ name: 'Repo', category: 'gas' })
  })
})
