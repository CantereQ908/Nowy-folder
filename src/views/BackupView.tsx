import { useState, type ChangeEvent } from 'react'
import { useData } from '../data/DataProvider'
import { backupFileName, createBackup, parseBackup, summarize } from '../lib/backup'
import type { Data } from '../types'

const LAST_KEY = 'sesje.lastBackup'

function readLast(): Date | null {
  try {
    const raw = localStorage.getItem(LAST_KEY)
    return raw ? new Date(raw) : null
  } catch {
    return null
  }
}

/** Np. „ostatnia: 6 paź 2026" — liczona osobno na każdym urządzeniu. */
export function lastBackupLabel(): string {
  const last = readLast()
  if (!last) return 'jeszcze nie pobrana na tym urządzeniu'
  return `ostatnia: ${last.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' })}`
}

const message = (e: unknown) => (e instanceof Error ? e.message : String(e))

export function BackupView() {
  const { data, cloud, online, restore } = useData()
  const [last, setLast] = useState(readLast)
  const [pending, setPending] = useState<{ name: string; data: Data } | null>(null)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null)

  const backupFile = () => new File([createBackup(data)], backupFileName(), { type: 'application/json' })
  const canShare = typeof navigator.canShare === 'function' && navigator.canShare({ files: [backupFile()] })

  const markDone = () => {
    const now = new Date()
    try {
      localStorage.setItem(LAST_KEY, now.toISOString())
    } catch {
      // brak dostępu do pamięci przeglądarki — data ostatniej kopii po prostu się nie zapisze
    }
    setLast(now)
  }

  const download = () => {
    const url = URL.createObjectURL(backupFile())
    const a = document.createElement('a')
    a.href = url
    a.download = backupFileName()
    document.body.append(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    markDone()
  }

  const share = async () => {
    try {
      await navigator.share({ files: [backupFile()], title: 'Kopia danych — Sesje' })
      markDone()
    } catch {
      // anulowane w arkuszu udostępniania
    }
  }

  const choose = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    setResult(null)
    if (!file) return
    try {
      setPending({ name: file.name, data: parseBackup(await file.text()) })
    } catch (err) {
      setPending(null)
      setResult({ ok: false, text: message(err) })
    }
  }

  const confirmRestore = async () => {
    if (!pending) return
    setBusy(true)
    try {
      await restore(pending.data)
      setResult({ ok: true, text: `Przywrócono: ${summarize(pending.data)}.` })
      setPending(null)
    } catch (err) {
      setResult({ ok: false, text: `Nie udało się przywrócić wszystkiego: ${message(err)}. Spróbuj ponownie — powtórzenie niczego nie zdubluje.` })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="backup">
      <h1>Kopia zapasowa</h1>

      <section className="todo-panel">
        <h2>Pobierz kopię</h2>
        <p>
          Zapisuje w jednym pliku wszystko: sesje, osoby, przypięcia, zadania i posty. Trzymaj go w bezpiecznym miejscu
          (np. na Dysku Google albo w iCloud) — z niego odtworzysz dane nawet na zupełnie nowym koncie.
        </p>
        <p className="muted">
          W kopii: {summarize(data)}.{' '}
          {last
            ? `Ostatnio pobrana na tym urządzeniu: ${last.toLocaleString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}.`
            : 'Na tym urządzeniu kopia nie była jeszcze pobierana.'}
        </p>
        {cloud && !online && (
          <p className="notice">Brak internetu — kopia będzie zawierać dane z ostatniego pobrania.</p>
        )}
        <div className="backup-actions">
          <button className="btn primary" onClick={download}>
            Pobierz kopię
          </button>
          {canShare && (
            <button className="btn" onClick={() => void share()}>
              Zapisz w Plikach / udostępnij
            </button>
          )}
        </div>
      </section>

      <section className="todo-panel">
        <h2>Przywróć z kopii</h2>
        <p>
          Dopisuje dane z pliku do aplikacji: brakujące rzeczy zostaną dodane, a te, które już są, wrócą do wersji z
          kopii. Nic nie zostanie usunięte, więc przywracanie można bezpiecznie powtórzyć.
        </p>
        <label className="btn file-btn">
          Wybierz plik kopii…
          <input type="file" accept=".json,application/json" onChange={(e) => void choose(e)} />
        </label>

        {pending && (
          <div className="notice">
            <p>
              <strong>{pending.name}</strong>: {summarize(pending.data)}.
            </p>
            <div className="backup-actions">
              <button className="btn primary" disabled={busy} onClick={() => void confirmRestore()}>
                {busy ? 'Przywracanie…' : 'Przywróć te dane'}
              </button>
              <button className="btn" disabled={busy} onClick={() => setPending(null)}>
                Anuluj
              </button>
            </div>
          </div>
        )}
        {result && (
          <p className={result.ok ? 'notice ok' : 'notice error'} role="status">
            {result.text}
          </p>
        )}
      </section>
    </div>
  )
}
