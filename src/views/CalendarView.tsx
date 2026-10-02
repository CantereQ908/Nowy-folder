import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { SessionForm } from '../components/SessionForm'
import { useData } from '../data/DataProvider'
import { formatDate, monthGrid, monthLabel, todayISO } from '../lib/dates'

const WEEKDAYS = ['pon', 'wt', 'śr', 'czw', 'pt', 'sob', 'niedz']

export function CalendarView() {
  const { data } = useData()
  const navigate = useNavigate()
  const today = todayISO()
  const [year, setYear] = useState(() => Number(today.slice(0, 4)))
  const [month, setMonth] = useState(() => Number(today.slice(5, 7)))
  const [addingOn, setAddingOn] = useState<string | null>(null)

  const shift = (delta: number) => {
    const d = new Date(year, month - 1 + delta, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth() + 1)
  }
  const goToday = () => {
    setYear(Number(today.slice(0, 4)))
    setMonth(Number(today.slice(5, 7)))
  }

  return (
    <>
      <div className="view-head">
        <h1 className="month-title">{monthLabel(year, month)}</h1>
        <div className="head-actions">
          <button className="btn" onClick={() => shift(-1)} aria-label="Poprzedni miesiąc">
            ←
          </button>
          <button className="btn" onClick={goToday}>
            Dziś
          </button>
          <button className="btn" onClick={() => shift(1)} aria-label="Następny miesiąc">
            →
          </button>
        </div>
      </div>

      <div className="calendar">
        {WEEKDAYS.map((w) => (
          <div key={w} className="weekday">
            {w}
          </div>
        ))}
        {monthGrid(year, month).map((cell) => {
          const sessions = data.sessions
            .filter((s) => s.date === cell.iso)
            .sort((a, b) => a.time.localeCompare(b.time))
          const classes = ['day', !cell.inMonth && 'outside', cell.iso === today && 'today'].filter(Boolean).join(' ')
          return (
            <div key={cell.iso} className={classes}>
              <button
                className="day-number"
                onClick={() => setAddingOn(cell.iso)}
                aria-label={`Dodaj sesję: ${formatDate(cell.iso, { day: 'numeric', month: 'long' })}`}
              >
                {cell.day}
              </button>
              {sessions.map((s) => (
                <Link key={s.id} to={`/sesja/${s.id}`} className="day-session" data-status={s.status}>
                  {s.time && <span className="day-session-time">{s.time} </span>}
                  {s.title}
                </Link>
              ))}
            </div>
          )
        })}
      </div>
      <p className="muted hint">Kliknij numer dnia, żeby dodać sesję w tym terminie.</p>

      {addingOn && (
        <SessionForm
          defaultDate={addingOn}
          onClose={() => setAddingOn(null)}
          onSaved={(s) => navigate(`/sesja/${s.id}`)}
        />
      )}
    </>
  )
}
