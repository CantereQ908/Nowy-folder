import type { Data, Person, Post, Session, Task } from '../types'

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
  saveTask(task: Task): Promise<void>
  /** Usuwa też podzadania. */
  deleteTask(id: string): Promise<void>
  savePost(post: Post): Promise<void>
  deletePost(id: string): Promise<void>
}

export const EMPTY: Data = { people: [], sessions: [], tasks: [], posts: [] }

/** Dane zapisane starszą wersją aplikacji mogą nie mieć nowszych pól. */
export function normalize(data: Partial<Data>): Data {
  return { ...EMPTY, ...data }
}

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
    ...data,
    people: data.people.filter((p) => p.id !== id),
    sessions: data.sessions.map((s) => ({ ...s, personIds: s.personIds.filter((pid) => pid !== id) })),
    posts: data.posts.map((p) => ({ ...p, personIds: p.personIds.filter((pid) => pid !== id) })),
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
  return {
    ...data,
    sessions: data.sessions.filter((s) => s.id !== id),
    tasks: data.tasks.filter((t) => t.sessionId !== id),
    // Posty zostają, tracą tylko powiązanie (jak on delete set null w bazie).
    posts: data.posts.map((p) => (p.sessionId === id ? { ...p, sessionId: null } : p)),
  }
}

export function withTask(data: Data, task: Task): Data {
  const exists = data.tasks.some((t) => t.id === task.id)
  return {
    ...data,
    tasks: exists ? data.tasks.map((t) => (t.id === task.id ? task : t)) : [...data.tasks, task],
  }
}

export function withoutTask(data: Data, id: string): Data {
  return { ...data, tasks: data.tasks.filter((t) => t.id !== id && t.parentId !== id) }
}

export function withPost(data: Data, post: Post): Data {
  const exists = data.posts.some((p) => p.id === post.id)
  return {
    ...data,
    posts: exists ? data.posts.map((p) => (p.id === post.id ? post : p)) : [...data.posts, post],
  }
}

export function withoutPost(data: Data, id: string): Data {
  return { ...data, posts: data.posts.filter((p) => p.id !== id) }
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
