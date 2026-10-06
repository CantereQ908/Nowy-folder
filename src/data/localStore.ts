import type { Data } from '../types'
import {
  EMPTY,
  normalize,
  withPerson,
  withPin,
  withSession,
  withPost,
  withTask,
  withoutPerson,
  withoutPin,
  withoutSession,
  withoutPost,
  withoutTask,
  type DataStore,
} from './store'

const KEY = 'sesje.local'

function read(): Data {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? normalize(JSON.parse(raw)) : EMPTY
  } catch {
    return EMPTY
  }
}

async function update(change: (data: Data) => Data): Promise<void> {
  localStorage.setItem(KEY, JSON.stringify(change(read())))
}

/** Dane tylko na tym urządzeniu — używane, gdy Supabase nie jest skonfigurowane. */
export const localStore: DataStore = {
  needsNetwork: false,
  load: async () => read(),
  subscribe(onChange) {
    const handler = (e: StorageEvent) => {
      if (e.key === KEY) onChange()
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  },
  savePerson: (person) => update((d) => withPerson(d, person)),
  deletePerson: (id) => update((d) => withoutPerson(d, id)),
  saveSession: (session) => update((d) => withSession(d, session)),
  deleteSession: (id) => update((d) => withoutSession(d, id)),
  pin: (sessionId, personId) => update((d) => withPin(d, sessionId, personId)),
  unpin: (sessionId, personId) => update((d) => withoutPin(d, sessionId, personId)),
  saveTask: (task) => update((d) => withTask(d, task)),
  deleteTask: (id) => update((d) => withoutTask(d, id)),
  savePost: (post) => update((d) => withPost(d, post)),
  deletePost: (id) => update((d) => withoutPost(d, id)),
}
