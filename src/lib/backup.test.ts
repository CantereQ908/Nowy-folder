import { describe, expect, it } from 'vitest'
import type { Data } from '../types'
import { backupFileName, createBackup, parseBackup, summarize } from './backup'

const data: Data = {
  people: [{ id: 'a', name: 'Ania', email: 'a@x.pl', instagram: 'ania', role: 'model', note: 'notka' }],
  sessions: [
    { id: 's', title: 'Plener', date: '2026-10-17', time: '15:00', endTime: '18:00', location: 'Bulwary', description: '', status: 'confirmed', personIds: ['a'] },
  ],
  tasks: [
    { id: 't', sessionId: 's', parentId: null, title: 'Tło', done: false, dueDate: '2026-10-16', dueTime: '20:00', createdAt: '2026-10-01T10:00:00.000Z' },
    { id: 't1', sessionId: 's', parentId: 't', title: 'Białe', done: true, dueDate: '', dueTime: '', createdAt: '2026-10-01T10:01:00.000Z' },
  ],
  posts: [
    { id: 'p', sessionId: 's', date: '2026-10-20', time: '18:00', format: 'carousel', status: 'ready', caption: 'Opis', hashtags: '#x', personIds: ['a'], notes: '' },
  ],
}

describe('backup', () => {
  it('round-trips all data', () => {
    expect(parseBackup(createBackup(data))).toEqual(data)
  })

  it('names the file after the date', () => {
    expect(backupFileName(new Date(2026, 9, 6, 23, 30))).toBe('sesje-kopia-2026-10-06.json')
  })

  it('rejects files that are not backups', () => {
    expect(() => parseBackup('nie json')).toThrow('nie da się go odczytać')
    expect(() => parseBackup('{"people":[]}')).toThrow('nie jest kopia z aplikacji Sesje')
    expect(() => parseBackup('{"format":"sesje-backup","version":99,"data":{}}')).toThrow('nowszej wersji')
    expect(() => parseBackup('{"format":"sesje-backup","version":1,"data":{"people":"x"}}')).toThrow('nie jest listą')
  })

  it('fills fields missing in older versions and drops dangling references', () => {
    const old = JSON.stringify({
      format: 'sesje-backup',
      version: 1,
      data: {
        people: [{ id: 'a', name: 'Ania', role: 'nieznana' }],
        sessions: [
          { id: 's', title: 'S', date: '2026-10-17', personIds: ['a', 'deleted'] },
          { id: 'bad', title: 'Bez daty' },
        ],
        tasks: [{ id: 't', sessionId: 'gone', parentId: 'gone', title: 'T' }],
        posts: [{ id: 'p', sessionId: 'bad', personIds: ['a', 'gone'] }],
      },
    })
    const result = parseBackup(old)
    expect(result.people[0]).toEqual({ id: 'a', name: 'Ania', email: '', instagram: '', role: 'model', note: '' })
    expect(result.sessions.map((s) => s.id)).toEqual(['s'])
    expect(result.sessions[0].personIds).toEqual(['a'])
    expect(result.sessions[0].endTime).toBe('')
    expect(result.tasks[0]).toMatchObject({ sessionId: null, parentId: null, dueDate: '', done: false })
    expect(result.posts[0]).toMatchObject({ sessionId: null, personIds: ['a'], format: 'post', status: 'idea' })
  })

  it('summarizes counts with Polish plurals', () => {
    expect(summarize(data)).toBe('1 sesja · 1 osoba · 2 zadania · 1 post')
    const many = { ...data, people: Array(12).fill(data.people[0]), posts: Array(22).fill(data.posts[0]) }
    expect(summarize(many)).toBe('1 sesja · 12 osób · 2 zadania · 22 posty')
  })
})
