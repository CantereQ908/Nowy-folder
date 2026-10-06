import { describe, expect, it } from 'vitest'
import type { Person, Post } from '../types'
import { buildPostText, countHashtags, postSections } from './posts'

const person = (id: string, instagram: string): Person => ({
  id,
  name: id,
  email: '',
  instagram,
  role: 'model',
  note: '',
})

const post = (id: string, extra: Partial<Post> = {}): Post => ({
  id,
  sessionId: null,
  date: '',
  time: '',
  format: 'post',
  status: 'idea',
  caption: '',
  hashtags: '',
  personIds: [],
  notes: '',
  ...extra,
})

describe('posts', () => {
  it('counts hashtags, including Polish letters', () => {
    expect(countHashtags('#sesja #jesień #foto_2026 bez # i #')).toBe(3)
    expect(countHashtags('')).toBe(0)
  })

  it('builds caption, mentions and hashtags separated by blank lines', () => {
    const people = [person('a', '@ania.foto'), person('b', ''), person('k', 'https://instagram.com/kuba.styl/')]
    const text = buildPostText(
      { caption: '  Jesienny plener  ', hashtags: '#plener #jesień', personIds: ['a', 'b', 'k', 'deleted'] },
      people,
    )
    expect(text).toBe('Jesienny plener\n\n@ania.foto @kuba.styl\n\n#plener #jesień')
  })

  it('skips empty parts', () => {
    expect(buildPostText({ caption: '', hashtags: '#x', personIds: [] }, [])).toBe('#x')
  })

  it('groups posts into overdue, upcoming, undated and published', () => {
    const posts = [
      post('late', { date: '2026-10-01' }),
      post('soon2', { date: '2026-10-09', time: '18:00' }),
      post('soon1', { date: '2026-10-09', time: '09:00' }),
      post('today', { date: '2026-10-06' }),
      post('idea'),
      post('old', { date: '2026-09-01', status: 'published' }),
      post('new', { date: '2026-10-05', status: 'published' }),
    ]
    const s = postSections(posts, '2026-10-06')
    expect(s.overdue.map((p) => p.id)).toEqual(['late'])
    expect(s.upcoming.map((p) => p.id)).toEqual(['today', 'soon1', 'soon2'])
    expect(s.undated.map((p) => p.id)).toEqual(['idea'])
    expect(s.published.map((p) => p.id)).toEqual(['new', 'old'])
  })
})
