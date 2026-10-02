import type { Session as AuthSession, SupabaseClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { HashRouter, NavLink, Route, Routes } from 'react-router-dom'
import { DataProvider, useData } from './data/DataProvider'
import { localStore } from './data/localStore'
import { clearCache, createSupabaseStore, supabase } from './data/supabaseStore'
import { CalendarView } from './views/CalendarView'
import { LoginView } from './views/LoginView'
import { PeopleView } from './views/PeopleView'
import { SessionDetailView } from './views/SessionDetailView'
import { SessionsView } from './views/SessionsView'

const cloudStore = supabase ? createSupabaseStore(supabase) : null

function Shell({ account, onSignOut }: { account?: string; onSignOut?(): void }) {
  const { loading, online, cloud, error, clearError } = useData()
  return (
    <HashRouter>
      <header className="topbar">
        <span className="brand">Sesje</span>
        <nav>
          <NavLink to="/" end>
            Sesje
          </NavLink>
          <NavLink to="/kalendarz">Kalendarz</NavLink>
          <NavLink to="/ludzie">Ludzie</NavLink>
        </nav>
        <div className="account">
          {account ? (
            <>
              <span className="muted account-name">{account}</span>
              <button className="btn small" onClick={onSignOut}>
                Wyloguj
              </button>
            </>
          ) : (
            <span className="muted" title="Dane są zapisane tylko na tym urządzeniu">
              Tryb lokalny
            </span>
          )}
        </div>
      </header>

      {cloud && !online && (
        <div className="banner" role="status">
          Brak połączenia — widzisz ostatnio pobrane dane, zmiany będą możliwe po powrocie internetu.
        </div>
      )}

      <main className="content">
        {loading ? (
          <p className="empty">Wczytywanie…</p>
        ) : (
          <Routes>
            <Route path="/" element={<SessionsView />} />
            <Route path="/sesja/:id" element={<SessionDetailView />} />
            <Route path="/kalendarz" element={<CalendarView />} />
            <Route path="/ludzie" element={<PeopleView />} />
          </Routes>
        )}
      </main>

      {error && (
        <div className="toast" role="alert">
          <span>{error}</span>
          <button className="btn small" onClick={clearError}>
            OK
          </button>
        </div>
      )}
    </HashRouter>
  )
}

function CloudApp({ db }: { db: SupabaseClient }) {
  // undefined = jeszcze sprawdzamy, null = niezalogowany
  const [auth, setAuth] = useState<AuthSession | null | undefined>(undefined)

  useEffect(() => {
    void db.auth.getSession().then(({ data }) => setAuth(data.session))
    const { data } = db.auth.onAuthStateChange((_event, session) => setAuth(session))
    return () => data.subscription.unsubscribe()
  }, [db])

  if (auth === undefined) return <p className="empty">Wczytywanie…</p>
  if (auth === null) return <LoginView db={db} />

  const signOut = () => {
    clearCache()
    void db.auth.signOut()
  }
  return (
    <DataProvider key={auth.user.id} store={cloudStore!}>
      <Shell account={auth.user.email} onSignOut={signOut} />
    </DataProvider>
  )
}

export default function App() {
  if (supabase) return <CloudApp db={supabase} />
  return (
    <DataProvider store={localStore}>
      <Shell />
    </DataProvider>
  )
}
