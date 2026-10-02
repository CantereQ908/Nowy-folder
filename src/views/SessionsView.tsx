import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { SessionForm } from '../components/SessionForm'
import { useData } from '../data/DataProvider'
import { formatDate, formatTimeRange, todayISO } from '../lib/dates'
import { STATUS_LABEL, type Person, type Session } from '../types'

const byDateTime = (a: Session, b: Session) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)

function SessionCard({ session, people }: { session: Session; people: Person[] }) {
  const crew = people.filter((p) => session.personIds.includes(p.id))
  return (
    <Link to={`/sesja/${session.id}`} className="session-card">
      <div className="date-block">
        <span className="date-day">{formatDate(session.date, { day: 'numeric' })}</span>
        <span className="date-month">{formatDate(session.date, { month: 'short' })}</span>
        <span className="date-weekday">{formatDate(session.date, { weekday: 'short' })}</span>
      </div>
      <div className="session-card-main">
        <div className="session-card-head">
          <strong>{session.title}</strong>
          <span className="badge status-badge" data-status={session.status}>
            {STATUS_LABEL[session.status]}
          </span>
        </div>
        <div className="muted">{[formatTimeRange(session.time, session.endTime), session.location].filter(Boolean).join(' · ') || 'Bez godziny i miejsca'}</div>
        <div className="crew">
          {crew.length === 0 && <span className="muted">Nikt jeszcze nie przypięty</span>}
          {crew.map((p) => (
            <span key={p.id} className="badge role-badge" data-role={p.role}>
              {p.name}
            </span>
          ))}
        </div>
      </div>
    </Link>
  )
}

export function SessionsView() {
  const { data } = useData()
  const navigate = useNavigate()
  const [adding, setAdding] = useState(false)

  const today = todayISO()
  const upcoming = data.sessions.filter((s) => s.date >= today).sort(byDateTime)
  const past = data.sessions.filter((s) => s.date < today).sort((a, b) => byDateTime(b, a))

  return (
    <>
      <div className="view-head">
        <h1>Sesje</h1>
        <button className="btn primary" onClick={() => setAdding(true)}>
          Nowa sesja
        </button>
      </div>

      {data.sessions.length === 0 && (
        <p className="empty">Nie ma jeszcze żadnej sesji. Dodaj pierwszą, a potem przypnij do niej ekipę.</p>
      )}

      {upcoming.length > 0 && (
        <section>
          <h2>Nadchodzące</h2>
          <div className="session-list">
            {upcoming.map((s) => (
              <SessionCard key={s.id} session={s} people={data.people} />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2>Minione</h2>
          <div className="session-list past">
            {past.map((s) => (
              <SessionCard key={s.id} session={s} people={data.people} />
            ))}
          </div>
        </section>
      )}

      {adding && <SessionForm onClose={() => setAdding(false)} onSaved={(s) => navigate(`/sesja/${s.id}`)} />}
    </>
  )
}
