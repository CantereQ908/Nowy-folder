import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Data, Person } from '../types'
import {
  EMPTY,
  withPerson,
  withPin,
  withSession,
  withoutPerson,
  withoutPin,
  withoutSession,
  type DataStore,
  type SessionFields,
} from './store'

interface DataContext {
  data: Data
  loading: boolean
  online: boolean
  /** true, gdy zapis wymaga internetu (tryb chmury). */
  cloud: boolean
  error: string | null
  clearError(): void
  savePerson(person: Person): Promise<void>
  deletePerson(id: string): Promise<void>
  saveSession(session: SessionFields): Promise<void>
  deleteSession(id: string): Promise<void>
  pin(sessionId: string, personId: string): Promise<void>
  unpin(sessionId: string, personId: string): Promise<void>
}

const Ctx = createContext<DataContext | null>(null)

export function useData(): DataContext {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useData poza DataProvider')
  return ctx
}

const message = (e: unknown) => (e instanceof Error ? e.message : String(e))

export function DataProvider({ store, children }: { store: DataStore; children: ReactNode }) {
  const [data, setData] = useState<Data>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [online, setOnline] = useState(navigator.onLine)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setData(await store.load())
    } catch (e) {
      setError(`Nie udało się wczytać danych: ${message(e)}`)
    } finally {
      setLoading(false)
    }
  }, [store])

  useEffect(() => {
    void refresh()

    // Realtime potrafi wysłać kilka zdarzeń naraz — jedno odświeżenie wystarczy.
    let timer: ReturnType<typeof setTimeout> | undefined
    const scheduleRefresh = () => {
      clearTimeout(timer)
      timer = setTimeout(() => void refresh(), 150)
    }
    const unsubscribe = store.subscribe(scheduleRefresh)

    const onOnline = () => {
      setOnline(true)
      scheduleRefresh()
    }
    const onOffline = () => setOnline(false)
    const onVisible = () => {
      if (document.visibilityState === 'visible') scheduleRefresh()
    }
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearTimeout(timer)
      unsubscribe()
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [store, refresh])

  const value = useMemo<DataContext>(() => {
    // Zmiana od razu w UI, potem zapis; przy błędzie wracamy do stanu z bazy.
    const mutate = async (apply: (d: Data) => Data, remote: () => Promise<void>) => {
      if (store.needsNetwork && !navigator.onLine) {
        setError('Brak połączenia — zmiany wymagają internetu.')
        return
      }
      setData(apply)
      try {
        await remote()
      } catch (e) {
        setError(`Nie udało się zapisać: ${message(e)}`)
        await refresh()
      }
    }
    return {
      data,
      loading,
      online,
      cloud: store.needsNetwork,
      error,
      clearError: () => setError(null),
      savePerson: (p) => mutate((d) => withPerson(d, p), () => store.savePerson(p)),
      deletePerson: (id) => mutate((d) => withoutPerson(d, id), () => store.deletePerson(id)),
      saveSession: (s) => mutate((d) => withSession(d, s), () => store.saveSession(s)),
      deleteSession: (id) => mutate((d) => withoutSession(d, id), () => store.deleteSession(id)),
      pin: (sid, pid) => mutate((d) => withPin(d, sid, pid), () => store.pin(sid, pid)),
      unpin: (sid, pid) => mutate((d) => withoutPin(d, sid, pid), () => store.unpin(sid, pid)),
    }
  }, [data, loading, online, error, store, refresh])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
