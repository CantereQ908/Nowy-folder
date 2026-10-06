import {
  POST_FORMATS,
  POST_STATUSES,
  ROLES,
  STATUSES,
  type Data,
  type Person,
  type Post,
  type Session,
  type Task,
} from '../types'

const FORMAT = 'sesje-backup'
const VERSION = 1

export function createBackup(data: Data, now = new Date()): string {
  return JSON.stringify({ format: FORMAT, version: VERSION, exportedAt: now.toISOString(), data }, null, 2)
}

export function backupFileName(now = new Date()): string {
  return `sesje-kopia-${now.toLocaleDateString('sv-SE')}.json`
}

type Raw = Record<string, unknown>

const str = (v: unknown): string => (typeof v === 'string' ? v : '')
const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
  allowed.includes(v as T) ? (v as T) : fallback
const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [])
const list = (v: unknown, what: string): Raw[] => {
  if (v === undefined) return []
  if (!Array.isArray(v)) throw new Error(`Uszkodzona kopia: „${what}" nie jest listą.`)
  return v.filter((x): x is Raw => typeof x === 'object' && x !== null && typeof (x as Raw).id === 'string')
}

/**
 * Odczytuje plik kopii. Uzupełnia pola, których nie miały starsze wersje aplikacji,
 * i usuwa odwołania do rzeczy, których w kopii nie ma — tak, żeby baza przyjęła całość.
 */
export function parseBackup(text: string): Data {
  let file: Raw
  try {
    file = JSON.parse(text)
  } catch {
    throw new Error('To nie jest plik kopii — nie da się go odczytać.')
  }
  if (typeof file !== 'object' || file === null || file.format !== FORMAT) {
    throw new Error('To nie jest kopia z aplikacji Sesje.')
  }
  if (typeof file.version !== 'number' || file.version > VERSION) {
    throw new Error('Ta kopia pochodzi z nowszej wersji aplikacji. Odśwież aplikację i spróbuj ponownie.')
  }
  const raw = (file.data ?? {}) as Raw

  const people: Person[] = list(raw.people, 'people').map((p) => ({
    id: p.id as string,
    name: str(p.name),
    email: str(p.email),
    instagram: str(p.instagram),
    role: oneOf(p.role, ROLES, 'model'),
    note: str(p.note),
  }))
  const personIds = new Set(people.map((p) => p.id))

  const sessions: Session[] = list(raw.sessions, 'sessions')
    .filter((s) => typeof s.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s.date))
    .map((s) => ({
      id: s.id as string,
      title: str(s.title),
      date: s.date as string,
      time: str(s.time),
      endTime: str(s.endTime),
      location: str(s.location),
      description: str(s.description),
      status: oneOf(s.status, STATUSES, 'planned'),
      personIds: strings(s.personIds).filter((id) => personIds.has(id)),
    }))
  const sessionIds = new Set(sessions.map((s) => s.id))
  const sessionOrNull = (v: unknown) => (typeof v === 'string' && sessionIds.has(v) ? v : null)

  const rawTasks = list(raw.tasks, 'tasks')
  const taskIds = new Set(rawTasks.map((t) => t.id as string))
  const tasks: Task[] = rawTasks.map((t) => ({
    id: t.id as string,
    sessionId: sessionOrNull(t.sessionId),
    parentId: typeof t.parentId === 'string' && taskIds.has(t.parentId) ? t.parentId : null,
    title: str(t.title),
    done: t.done === true,
    dueDate: str(t.dueDate),
    dueTime: str(t.dueTime),
    createdAt: str(t.createdAt) || new Date(0).toISOString(),
  }))

  const posts: Post[] = list(raw.posts, 'posts').map((p) => ({
    id: p.id as string,
    sessionId: sessionOrNull(p.sessionId),
    date: str(p.date),
    time: str(p.time),
    format: oneOf(p.format, POST_FORMATS, 'post'),
    status: oneOf(p.status, POST_STATUSES, 'idea'),
    caption: str(p.caption),
    hashtags: str(p.hashtags),
    personIds: strings(p.personIds).filter((id) => personIds.has(id)),
    notes: str(p.notes),
  }))

  return { people, sessions, tasks, posts }
}

/** Np. „3 sesje · 12 osób · 8 zadań · 2 posty". */
export function summarize(data: Data): string {
  const plural = (n: number, one: string, few: string, many: string) => {
    const last = n % 10
    const lastTwo = n % 100
    const word = n === 1 ? one : last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14) ? few : many
    return `${n} ${word}`
  }
  return [
    plural(data.sessions.length, 'sesja', 'sesje', 'sesji'),
    plural(data.people.length, 'osoba', 'osoby', 'osób'),
    plural(data.tasks.length, 'zadanie', 'zadania', 'zadań'),
    plural(data.posts.length, 'post', 'posty', 'postów'),
  ].join(' · ')
}
