import type { Data } from '../types'
import {
  EMPTY,
  withPerson,
  withPin,
  withSession,
  withoutPerson,
  withoutPin,
  withoutSession,
  type DataStore,
} from './store'

const KEY = 'sesje.local'

function read(): Data {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Data) : EMPTY
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
}
