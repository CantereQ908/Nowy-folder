import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Data, Person, Session, Task } from '../types'
import { normalize, type DataStore } from './store'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_KEY

/** null = brak konfiguracji, aplikacja działa w trybie lokalnym. */
export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null

const CACHE_KEY = 'sesje.cache'

export function clearCache(): void {
  localStorage.removeItem(CACHE_KEY)
}

function readCache(): Data | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? normalize(JSON.parse(raw)) : null
  } catch {
    return null
  }
}

function check(result: { error: { message: string } | null }): void {
  if (result.error) throw new Error(result.error.message)
}

export function createSupabaseStore(db: SupabaseClient): DataStore {
  return {
    needsNetwork: true,

    async load() {
      const [people, sessions, links, tasks] = await Promise.all([
        db.from('people').select('id, name, email, instagram, role'),
        db.from('sessions').select('id, title, session_date, start_time, end_time, location, description, status'),
        db.from('session_people').select('session_id, person_id'),
        db.from('tasks').select('id, session_id, parent_id, title, done, created_at'),
      ])
      const error = people.error ?? sessions.error ?? links.error ?? tasks.error
      if (error) {
        // Offline albo chwilowy błąd: pokaż ostatnio pobrane dane.
        const cached = readCache()
        if (cached) return cached
        throw new Error(error.message)
      }
      const data: Data = {
        people: people.data as Person[],
        sessions: sessions.data!.map(
          (row): Session => ({
            id: row.id,
            title: row.title,
            date: row.session_date,
            time: row.start_time,
            endTime: row.end_time,
            location: row.location,
            description: row.description,
            status: row.status,
            personIds: links.data!.filter((l) => l.session_id === row.id).map((l) => l.person_id),
          }),
        ),
        tasks: tasks.data!.map(
          (row): Task => ({
            id: row.id,
            sessionId: row.session_id,
            parentId: row.parent_id,
            title: row.title,
            done: row.done,
            createdAt: row.created_at,
          }),
        ),
      }
      localStorage.setItem(CACHE_KEY, JSON.stringify(data))
      return data
    },

    subscribe(onChange) {
      const channel = db
        .channel('sesje-db')
        .on('postgres_changes', { event: '*', schema: 'public' }, onChange)
        .subscribe()
      return () => {
        void db.removeChannel(channel)
      }
    },

    async savePerson(person) {
      check(await db.from('people').upsert(person))
    },
    async deletePerson(id) {
      check(await db.from('people').delete().eq('id', id))
    },
    async saveSession(s) {
      check(
        await db.from('sessions').upsert({
          id: s.id,
          title: s.title,
          session_date: s.date,
          start_time: s.time,
          end_time: s.endTime,
          location: s.location,
          description: s.description,
          status: s.status,
        }),
      )
    },
    async deleteSession(id) {
      check(await db.from('sessions').delete().eq('id', id))
    },
    async pin(sessionId, personId) {
      check(
        await db
          .from('session_people')
          .upsert({ session_id: sessionId, person_id: personId }, { ignoreDuplicates: true }),
      )
    },
    async unpin(sessionId, personId) {
      check(await db.from('session_people').delete().eq('session_id', sessionId).eq('person_id', personId))
    },
    async saveTask(t) {
      check(
        await db.from('tasks').upsert({
          id: t.id,
          session_id: t.sessionId,
          parent_id: t.parentId,
          title: t.title,
          done: t.done,
          created_at: t.createdAt,
        }),
      )
    },
    async deleteTask(id) {
      // Podzadania usuwa baza (on delete cascade).
      check(await db.from('tasks').delete().eq('id', id))
    },
  }
}
