import { useState, type FormEvent } from 'react'
import { useData } from '../data/DataProvider'
import type { SessionFields } from '../data/store'
import { todayISO } from '../lib/dates'
import { STATUSES, STATUS_LABEL, type Session, type Status } from '../types'
import { Modal } from './Modal'

interface Props {
  initial?: Session
  defaultDate?: string
  onClose(): void
  onSaved?(session: SessionFields): void
  onDeleted?(): void
}

export function SessionForm({ initial, defaultDate, onClose, onSaved, onDeleted }: Props) {
  const { saveSession, deleteSession } = useData()
  const [title, setTitle] = useState(initial?.title ?? '')
  const [date, setDate] = useState(initial?.date ?? defaultDate ?? todayISO())
  const [time, setTime] = useState(initial?.time ?? '')
  const [endTime, setEndTime] = useState(initial?.endTime ?? '')
  const [location, setLocation] = useState(initial?.location ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [status, setStatus] = useState<Status>(initial?.status ?? 'planned')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const session: SessionFields = {
      id: initial?.id ?? crypto.randomUUID(),
      title: title.trim(),
      date,
      time,
      endTime,
      location: location.trim(),
      description: description.trim(),
      status,
    }
    void saveSession(session)
    onClose()
    onSaved?.(session)
  }

  const remove = () => {
    if (!initial) return
    if (!confirm(`Usunąć sesję „${initial.title}"?`)) return
    void deleteSession(initial.id)
    onClose()
    onDeleted?.()
  }

  return (
    <Modal title={initial ? 'Edytuj sesję' : 'Nowa sesja'} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <label>
          Nazwa
          <input value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus />
        </label>
        <label>
          Data
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </label>
        <div className="form-row">
          <label>
            Od godziny
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </label>
          <label>
            Do godziny
            <input type="time" value={endTime} min={time || undefined} onChange={(e) => setEndTime(e.target.value)} />
          </label>
        </div>
        <label>
          Miejsce
          <input value={location} onChange={(e) => setLocation(e.target.value)} />
        </label>
        <label>
          Opis
          <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <label>
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value as Status)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
        <div className="form-actions">
          {initial && (
            <button type="button" className="btn danger" onClick={remove}>
              Usuń
            </button>
          )}
          <span className="spacer" />
          <button type="button" className="btn" onClick={onClose}>
            Anuluj
          </button>
          <button type="submit" className="btn primary">
            Zapisz
          </button>
        </div>
      </form>
    </Modal>
  )
}
