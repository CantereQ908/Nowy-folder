import { useState, type FormEvent } from 'react'
import { useData } from '../data/DataProvider'
import { formatDue, todayISO } from '../lib/dates'
import type { Task } from '../types'

const byCreated = (a: Task, b: Task) =>
  Date.parse(a.createdAt) - Date.parse(b.createdAt) || a.id.localeCompare(b.id)

interface AddTaskProps {
  placeholder: string
  autoFocus?: boolean
  onAdd(title: string): void
  /** Esc albo wyjście z pustego pola. */
  onCancel?(): void
}

function AddTask({ placeholder, autoFocus, onAdd, onCancel }: AddTaskProps) {
  const [title, setTitle] = useState('')
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onAdd(title.trim())
    setTitle('')
  }
  return (
    <form className="todo-add" onSubmit={submit}>
      <input
        value={title}
        placeholder={placeholder}
        aria-label={placeholder}
        autoFocus={autoFocus}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onCancel?.()
        }}
        onBlur={() => {
          if (!title.trim()) onCancel?.()
        }}
      />
      <button type="submit" className="btn small" disabled={!title.trim()}>
        Dodaj
      </button>
    </form>
  )
}

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  )
}

function DueEditor({ task, onClose }: { task: Task; onClose(): void }) {
  const { saveTask } = useData()
  const [date, setDate] = useState(task.dueDate ?? '')
  const [time, setTime] = useState(task.dueTime ?? '')

  const save = (dueDate: string, dueTime: string) => {
    void saveTask({ ...task, dueDate, dueTime: dueDate ? dueTime : '' })
    onClose()
  }

  return (
    <div className="todo-due-edit">
      <input type="date" value={date} aria-label={`Termin: ${task.title}`} autoFocus onChange={(e) => setDate(e.target.value)} />
      <input type="time" value={time} aria-label="Godzina" disabled={!date} onChange={(e) => setTime(e.target.value)} />
      <div className="todo-due-actions">
        {task.dueDate && (
          <button type="button" className="btn small danger" onClick={() => save('', '')}>
            Usuń termin
          </button>
        )}
        <button type="button" className="btn small" onClick={onClose}>
          Anuluj
        </button>
        <button type="button" className="btn small primary" disabled={!date} onClick={() => save(date, time)}>
          Zapisz
        </button>
      </div>
    </div>
  )
}

function TaskRow({ task, subtasks, onAddSubtask }: { task: Task; subtasks?: Task[]; onAddSubtask?(): void }) {
  const { saveTask, deleteTask } = useData()
  const [editing, setEditing] = useState(false)
  const [editingDue, setEditingDue] = useState(false)

  const today = todayISO()
  const dueClass = !task.dueDate
    ? ''
    : task.done
      ? ''
      : task.dueDate < today
        ? ' overdue'
        : task.dueDate === today
          ? ' today'
          : ''

  const rename = (value: string) => {
    setEditing(false)
    const title = value.trim()
    if (title && title !== task.title) void saveTask({ ...task, title })
  }
  const remove = () => {
    if (subtasks?.length && !confirm(`Usunąć zadanie „${task.title}" razem z podzadaniami?`)) return
    void deleteTask(task.id)
  }

  return (
    <>
    <div className={task.done ? 'todo-row done' : 'todo-row'}>
      <input
        type="checkbox"
        checked={task.done}
        aria-label={`Wykonane: ${task.title}`}
        onChange={() => void saveTask({ ...task, done: !task.done })}
      />
      {editing ? (
        <input
          className="todo-edit"
          defaultValue={task.title}
          aria-label="Treść zadania"
          autoFocus
          onBlur={(e) => rename(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur()
            if (e.key === 'Escape') setEditing(false)
          }}
        />
      ) : (
        <div className="todo-main">
          <button className="todo-title" title="Kliknij, żeby zmienić treść" onClick={() => setEditing(true)}>
            {task.title}
          </button>
          {task.dueDate && (
            <button
              className={`todo-due${dueClass}`}
              aria-label={`Zmień termin: ${formatDue(task.dueDate, task.dueTime)}`}
              onClick={() => setEditingDue(true)}
            >
              <CalendarIcon />
              {formatDue(task.dueDate, task.dueTime)}
            </button>
          )}
        </div>
      )}
      {subtasks && subtasks.length > 0 && (
        <span className="muted todo-count">
          {subtasks.filter((s) => s.done).length}/{subtasks.length}
        </span>
      )}
      {!task.dueDate && !editing && (
        <button className="todo-icon" aria-label={`Ustaw termin: ${task.title}`} title="Ustaw termin" onClick={() => setEditingDue(true)}>
          <CalendarIcon />
        </button>
      )}
      {onAddSubtask && (
        <button className="btn small" aria-label={`Dodaj podzadanie: ${task.title}`} onClick={onAddSubtask}>
          +<span className="wide-only">&nbsp;Podzadanie</span>
        </button>
      )}
      <button className="todo-remove" aria-label={`Usuń: ${task.title}`} onClick={remove}>
        ×
      </button>
    </div>
    {editingDue && <DueEditor task={task} onClose={() => setEditingDue(false)} />}
    </>
  )
}

/** Lista zadań z podzadaniami; sessionId = null oznacza zadania ogólne. */
export function TodoPanel({ sessionId, title }: { sessionId: string | null; title: string }) {
  const { data, saveTask } = useData()
  // id zadania, pod którym otwarte jest pole nowego podzadania
  const [addingUnder, setAddingUnder] = useState<string | null>(null)

  const tasks = data.tasks.filter((t) => t.sessionId === sessionId).sort(byCreated)
  const roots = tasks.filter((t) => t.parentId === null)

  const add = (taskTitle: string, parentId: string | null) =>
    void saveTask({
      id: crypto.randomUUID(),
      sessionId,
      parentId,
      title: taskTitle,
      done: false,
      dueDate: '',
      dueTime: '',
      createdAt: new Date().toISOString(),
    })

  return (
    <section className="todo-panel">
      <h2>
        {title}{' '}
        {tasks.length > 0 && (
          <span className="muted">
            ({tasks.filter((t) => t.done).length}/{tasks.length})
          </span>
        )}
      </h2>
      {roots.length > 0 && (
        <ul className="todo">
          {roots.map((task) => {
            const subtasks = tasks.filter((t) => t.parentId === task.id)
            return (
              <li key={task.id}>
                <TaskRow task={task} subtasks={subtasks} onAddSubtask={() => setAddingUnder(task.id)} />
                {(subtasks.length > 0 || addingUnder === task.id) && (
                  <ul className="todo sub">
                    {subtasks.map((sub) => (
                      <li key={sub.id}>
                        <TaskRow task={sub} />
                      </li>
                    ))}
                    {addingUnder === task.id && (
                      <li>
                        <AddTask
                          placeholder="Nowe podzadanie"
                          autoFocus
                          onAdd={(t) => add(t, task.id)}
                          onCancel={() => setAddingUnder(null)}
                        />
                      </li>
                    )}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      )}
      <AddTask placeholder="Nowe zadanie" onAdd={(t) => add(t, null)} />
    </section>
  )
}
