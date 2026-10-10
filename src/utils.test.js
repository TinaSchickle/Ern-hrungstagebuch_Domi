import { describe, expect, it } from 'vitest'
import { appendPreset, berlinNow } from './utils.js'

describe('appendPreset', () => {
  it('hängt an und vermeidet Doppelungen', () => {
    expect(appendPreset('', 'Blähung stark')).toBe('Blähung stark')
    expect(appendPreset('Blähung stark', 'Schleim im Hals schwach')).toBe(
      'Blähung stark, Schleim im Hals schwach'
    )
    expect(appendPreset('Blähung stark', 'Blähung stark')).toBe('Blähung stark')
  })
})

describe('berlinNow', () => {
  it('liefert Berliner Ortszeit', () => {
    expect(berlinNow(new Date('2026-07-01T22:30:00Z'))).toEqual({ date: '2026-07-02', time: '00:30' })
    expect(berlinNow(new Date('2026-12-01T22:30:00Z'))).toEqual({ date: '2026-12-01', time: '23:30' })
  })
})
