import type { SupabaseClient } from '@supabase/supabase-js'
import { useState, type FormEvent } from 'react'

export function LoginView({ db }: { db: SupabaseClient }) {
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setNote(null)
    if (mode === 'in') {
      const { error } = await db.auth.signInWithPassword({ email, password })
      if (error) setNote(`Nie udało się zalogować: ${error.message}`)
    } else {
      const { data, error } = await db.auth.signUp({ email, password })
      if (error) setNote(`Nie udało się założyć konta: ${error.message}`)
      // Bez sesji = Supabase czeka na potwierdzenie adresu e-mail.
      else if (!data.session) {
        setNote('Konto założone. Potwierdź adres linkiem z maila, a potem zaloguj się.')
        setMode('in')
      }
    }
    setBusy(false)
  }

  return (
    <main className="login">
      <h1>Sesje</h1>
      <p className="muted">Zaloguj się, żeby mieć te same sesje na laptopie i iPadzie.</p>
      <form className="form" onSubmit={submit}>
        <label>
          E-mail
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </label>
        <label>
          Hasło
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
          />
        </label>
        {note && <p role="alert">{note}</p>}
        <button type="submit" className="btn primary" disabled={busy}>
          {mode === 'in' ? 'Zaloguj' : 'Załóż konto'}
        </button>
        <button type="button" className="btn link" onClick={() => setMode(mode === 'in' ? 'up' : 'in')}>
          {mode === 'in' ? 'Nie mam konta — załóż' : 'Mam już konto — zaloguj'}
        </button>
      </form>
    </main>
  )
}
