import type { Data, Person, Session } from '../types'

export type SessionFields = Omit<Session, 'personIds'>

export interface DataStore {
  /** true = zapis wymaga internetu (chmura); false = dane lokalne. */
  needsNetwork: boolean
  load(): Promise<Data>
  /** Woła onChange, gdy dane zmieniły się poza tą kartą/urządzeniem. Zwraca funkcję odpinającą. */
  subscribe(onChange: () => void): () => void
  savePerson(person: Person): Promise<void>
  deletePerson(id: string): Promise<void>
  saveSession(session: SessionFields): Promise<void>
  deleteSession(id: string): Promise<void>
  pin(sessionId: string, personId: string): Promise<void>
  unpin(sessionId: string, personId: string): Promise<void>
}

export const EMPTY: Data = { people: [], sessions: [] }

// Czyste zmiany stanu — używane do optymistycznych aktualizacji i przez localStore.

export function withPerson(data: Data, person: Person): Data {
  const exists = data.people.some((p) => p.id === person.id)
  return {
    ...data,
    people: exists ? data.people.map((p) => (p.id === person.id ? person : p)) : [...data.people, person],
  }
}

export function withoutPerson(data: Data, id: string): Data {
  return {
    people: data.people.filter((p) => p.id !== id),
    sessions: data.sessions.map((s) => ({ ...s, personIds: s.personIds.filter((pid) => pid !== id) })),
  }
}

export function withSession(data: Data, fields: SessionFields): Data {
  const exists = data.sessions.some((s) => s.id === fields.id)
  return {
    ...data,
    sessions: exists
      ? data.sessions.map((s) => (s.id === fields.id ? { ...s, ...fields } : s))
      : [...data.sessions, { ...fields, personIds: [] }],
  }
}

export function withoutSession(data: Data, id: string): Data {
  return { ...data, sessions: data.sessions.filter((s) => s.id !== id) }
}

export function withPin(data: Data, sessionId: string, personId: string): Data {
  return {
    ...data,
    sessions: data.sessions.map((s) =>
      s.id === sessionId && !s.personIds.includes(personId) ? { ...s, personIds: [...s.personIds, personId] } : s,
    ),
  }
}

export function withoutPin(data: Data, sessionId: string, personId: string): Data {
  return {
    ...data,
    sessions: data.sessions.map((s) =>
      s.id === sessionId ? { ...s, personIds: s.personIds.filter((pid) => pid !== personId) } : s,
    ),
  }
}
