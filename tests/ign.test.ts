import { describe, expect, it } from 'vitest'
import {
  coreKey,
  fitIgnProjection,
  ignMarkerToPin,
  markerTitle,
  matchControlPairs,
} from '../scripts/lib/ign.mjs'

describe('coreKey', () => {
  it('iguala el nombre de IGN con el del pin curado', () => {
    expect(coreKey("Pay 'N' Spray - La Perle")).toBe(coreKey("Pay 'n' Spray La Perle"))
    expect(coreKey('Arrow Gas - Belville')).toBe(coreKey('Arrow Gas Station Belville'))
  })

  it('no funde la sucursal con la bóveda', () => {
    expect(coreKey('Ocean Beach Fleeca Bank')).not.toBe(coreKey('Fleeca Ocean Beach (bóveda)'))
  })
})

describe('markerTitle', () => {
  it('prefija paradas cuyo nombre es solo la calle', () => {
    expect(markerTitle('29036', 'Basin Dr')).toBe('Bus Stop — Basin Dr')
    expect(markerTitle('29023', 'Downtown Fleeca Big Bank')).toBe('Downtown Fleeca Big Bank')
  })
})

describe('fitIgnProjection', () => {
  it('recupera una escala lineal y tira el outlier', () => {
    const pairs = []
    for (let i = 0; i < 8; i++) {
      pairs.push({ lng: i, lat: i * 0.5, wx: i * 1000 + 10, wy: i * 500 - 20 })
    }
    pairs.push({ lng: 50, lat: 50, wx: 0, wy: 0 })
    const fit = fitIgnProjection(pairs)
    expect(fit).not.toBeNull()
    expect(fit.inliers).toBe(8)
    expect(fit.project(3, 1.5)).toEqual([3010, 1480])
  })

  it('se niega si no hay anclas', () => {
    expect(fitIgnProjection([{ lng: 1, lat: 1, wx: 1, wy: 1 }])).toBeNull()
  })
})

describe('matchControlPairs', () => {
  it('exige un único pin conocido con el mismo nombre', () => {
    const markers = [
      { markerName: "Pay 'N' Spray - La Perle", lng: -0.5, lat: 0.7 },
      { markerName: 'Downtown', lng: -0.1, lat: 0.2 },
    ]
    const controls = [
      { name: "Pay 'n' Spray La Perle", wx: -1249, wy: 1187 },
      { name: "Pay 'n' Spray La Perle", wx: -100, wy: 100 },
      { name: 'Downtown', wx: 1, wy: 2 },
    ]
    expect(matchControlPairs(markers, controls)).toEqual([])
  })
})

describe('ignMarkerToPin', () => {
  it('proyecta un big bank a un pin medium', () => {
    const pin = ignMarkerToPin(
      {
        typeSlug: '29023',
        markerName: 'Downtown Fleeca Big Bank',
        mapGenieLocationId: 1090133,
        lng: -0.57,
        lat: 0.66,
      },
      () => [-662, -102],
    )
    expect(pin).toMatchObject({
      id: 'ign-1090133',
      category: 'bank_vault',
      confidence: 'medium',
      precision: 'exact',
      wx: -662,
      wy: -102,
      region: 'vice_city',
      area: 'Downtown',
    })
    expect(pin.source).toContain('ign 1090133')
  })

  it('ignora tipos que el atlas no tiene', () => {
    expect(ignMarkerToPin({ typeSlug: '29021', markerName: 'ATM', mapGenieLocationId: 1, lng: 0, lat: 0 }, () => [0, 0])).toBeNull()
  })
})
