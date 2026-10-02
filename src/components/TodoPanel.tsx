import { useState, type FormEvent } from 'react'
import { useData } from '../data/DataProvider'
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

function TaskRow({ task, subtasks, onAddSubtask }: { task: Task; subtasks?: Task[]; onAddSubtask?(): void }) {
  const { saveTask, deleteTask } = useData()
  const [editing, setEditing] = useState(false)

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
        <button className="todo-title" title="Kliknij, żeby zmienić treść" onClick={() => setEditing(true)}>
          {task.title}
        </button>
      )}
      {subtasks && subtasks.length > 0 && (
        <span className="muted todo-count">
          {subtasks.filter((s) => s.done).length}/{subtasks.length}
        </span>
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
