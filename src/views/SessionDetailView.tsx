import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PersonTile } from '../components/PersonTile'
import { RoleFilter, type RoleChoice } from '../components/RoleFilter'
import { SessionForm } from '../components/SessionForm'
import { useData } from '../data/DataProvider'
import { mailtoAll, matchesPerson } from '../lib/contact'
import { formatLong } from '../lib/dates'
import { ROLES, ROLE_LABEL_PLURAL, STATUS_LABEL, type Person } from '../types'

const PINNED = 'pinned'
const AVAILABLE = 'available'

function DraggableTile({ person, action }: { person: Person; action: ReactNode }) {
  const { setNodeRef, listeners, isDragging } = useDraggable({ id: person.id })
  return (
    <div ref={setNodeRef} {...listeners} className={isDragging ? 'draggable dragging' : 'draggable'}>
      <PersonTile person={person} action={action} />
    </div>
  )
}

function DropZone({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <section ref={setNodeRef} className={isOver ? 'dropzone over' : 'dropzone'}>
      <h2>{title}</h2>
      {children}
    </section>
  )
}

export function SessionDetailView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, loading, pin, unpin } = useData()
  const [editing, setEditing] = useState(false)
  const [query, setQuery] = useState('')
  const [role, setRole] = useState<RoleChoice>('all')
  const [draggedId, setDraggedId] = useState<string | null>(null)

  // Mysz: przeciągnięcie po 8 px, żeby kliknięcia w linki działały.
  // Dotyk: przytrzymanie, żeby zwykłe przewijanie listy nie porywało kafelków.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  )

  const session = data.sessions.find((s) => s.id === id)
  if (!session) {
    return (
      <p className="empty">
        {loading ? 'Wczytywanie…' : 'Nie ma takiej sesji.'} <Link to="/">Wróć do listy</Link>
      </p>
    )
  }

  const byName = (a: Person, b: Person) => a.name.localeCompare(b.name, 'pl')
  const pinned = data.people.filter((p) => session.personIds.includes(p.id)).sort(byName)
  const available = data.people
    .filter((p) => !session.personIds.includes(p.id) && matchesPerson(p, query, role))
    .sort(byName)
  const mailto = mailtoAll(
    pinned.map((p) => p.email),
    session.title,
  )
  const dragged = data.people.find((p) => p.id === draggedId)

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setDraggedId(null)
    const personId = String(active.id)
    const isPinned = session.personIds.includes(personId)
    if (over?.id === PINNED && !isPinned) void pin(session.id, personId)
    if (over?.id === AVAILABLE && isPinned) void unpin(session.id, personId)
  }

  return (
    <>
      <Link to="/" className="back">
        ← Sesje
      </Link>
      <div className="view-head">
        <div>
          <h1>{session.title}</h1>
          <p className="session-meta">
            {[formatLong(session.date), session.time, session.location].filter(Boolean).join(' · ')}{' '}
            <span className="badge status-badge" data-status={session.status}>
              {STATUS_LABEL[session.status]}
            </span>
          </p>
        </div>
        <div className="head-actions">
          {mailto && (
            <a className="btn" href={mailto}>
              Napisz do wszystkich
            </a>
          )}
          <button className="btn" onClick={() => setEditing(true)}>
            Edytuj
          </button>
        </div>
      </div>
      {session.description && <p className="description">{session.description}</p>}

      <DndContext
        sensors={sensors}
        onDragStart={(e) => setDraggedId(String(e.active.id))}
        onDragEnd={onDragEnd}
        onDragCancel={() => setDraggedId(null)}
      >
        <div className="board">
          <DropZone id={PINNED} title={`W sesji (${pinned.length})`}>
            {pinned.length === 0 && (
              <p className="empty">Przeciągnij tu kafelek albo kliknij „Przypnij" przy osobie.</p>
            )}
            {ROLES.map((r) => {
              const group = pinned.filter((p) => p.role === r)
              if (group.length === 0) return null
              return (
                <div key={r} className="role-group">
                  <h3>{ROLE_LABEL_PLURAL[r]}</h3>
                  <div className="tiles">
                    {group.map((p) => (
                      <DraggableTile
                        key={p.id}
                        person={p}
                        action={
                          <button className="btn small" onClick={() => void unpin(session.id, p.id)}>
                            Odepnij
                          </button>
                        }
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </DropZone>

          <DropZone id={AVAILABLE} title="Dostępne osoby">
            <RoleFilter query={query} role={role} onQuery={setQuery} onRole={setRole} />
            {data.people.length === 0 && (
              <p className="empty">
                Nie masz jeszcze żadnych kafelków. <Link to="/ludzie">Dodaj osoby</Link>
              </p>
            )}
            <div className="tiles">
              {available.map((p) => (
                <DraggableTile
                  key={p.id}
                  person={p}
                  action={
                    <button className="btn small primary" onClick={() => void pin(session.id, p.id)}>
                      Przypnij
                    </button>
                  }
                />
              ))}
            </div>
          </DropZone>
        </div>
        <DragOverlay>{dragged && <PersonTile person={dragged} />}</DragOverlay>
      </DndContext>

      {editing && <SessionForm initial={session} onClose={() => setEditing(false)} onDeleted={() => navigate('/')} />}
    </>
  )
}
