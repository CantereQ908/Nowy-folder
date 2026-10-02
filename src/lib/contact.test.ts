import { describe, expect, it } from 'vitest'
import { instagramHandle, instagramUrl, mailtoAll, matchesPerson } from './contact'
import type { Person } from '../types'

describe('contact', () => {
  it('normalizes instagram handles', () => {
    expect(instagramHandle('@ania.foto')).toBe('ania.foto')
    expect(instagramHandle(' ania.foto ')).toBe('ania.foto')
    expect(instagramHandle('https://www.instagram.com/ania.foto/?hl=pl')).toBe('ania.foto')
    expect(instagramUrl('@ania.foto')).toBe('https://instagram.com/ania.foto')
  })

  it('builds a mailto for all unique addresses', () => {
    expect(mailtoAll(['a@x.pl', '', 'b@x.pl', 'a@x.pl'], 'Sesja & plener')).toBe(
      'mailto:a@x.pl,b@x.pl?subject=Sesja%20%26%20plener',
    )
    expect(mailtoAll(['', ' '], 'x')).toBeNull()
  })

  it('filters people by role and text', () => {
    const p: Person = { id: '1', name: 'Ania Nowak', email: 'ania@x.pl', instagram: 'ania.foto', role: 'model' }
    expect(matchesPerson(p, '', 'all')).toBe(true)
    expect(matchesPerson(p, 'NOWAK', 'model')).toBe(true)
    expect(matchesPerson(p, 'foto', 'stylist')).toBe(false)
    expect(matchesPerson(p, 'kasia', 'all')).toBe(false)
  })
})
