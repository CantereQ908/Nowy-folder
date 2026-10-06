import { useState, type FormEvent } from 'react'
import { useData } from '../data/DataProvider'
import { formatDate } from '../lib/dates'
import { CAPTION_LIMIT, HASHTAG_LIMIT, buildPostText, countHashtags } from '../lib/posts'
import {
  POST_FORMATS,
  POST_FORMAT_LABEL,
  POST_STATUSES,
  POST_STATUS_LABEL,
  type Post,
  type PostFormat,
  type PostStatus,
} from '../types'
import { CopyButton } from './CopyButton'
import { Modal } from './Modal'

interface Props {
  initial?: Post
  /** Wartości startowe nowego posta, np. sesja i jej ekipa. */
  defaults?: Partial<Post>
  onClose(): void
}

export function PostForm({ initial, defaults, onClose }: Props) {
  const { data, savePost, deletePost } = useData()
  const start = { ...defaults, ...initial }
  const [sessionId, setSessionId] = useState(start.sessionId ?? null)
  const [date, setDate] = useState(start.date ?? '')
  const [time, setTime] = useState(start.time ?? '')
  const [format, setFormat] = useState<PostFormat>(start.format ?? 'post')
  const [status, setStatus] = useState<PostStatus>(start.status ?? 'idea')
  const [caption, setCaption] = useState(start.caption ?? '')
  const [hashtags, setHashtags] = useState(start.hashtags ?? '')
  const [personIds, setPersonIds] = useState<string[]>(start.personIds ?? [])
  const [notes, setNotes] = useState(start.notes ?? '')

  const sessions = [...data.sessions].sort((a, b) => b.date.localeCompare(a.date))
  const session = data.sessions.find((s) => s.id === sessionId)
  const people = [...data.people].sort((a, b) => a.name.localeCompare(b.name, 'pl'))
  const text = buildPostText({ caption, hashtags, personIds }, data.people)
  const tagCount = countHashtags(text)

  const toggle = (id: string) =>
    setPersonIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))
  const tagCrew = () => setPersonIds((ids) => [...new Set([...ids, ...(session?.personIds ?? [])])])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    void savePost({
      id: initial?.id ?? crypto.randomUUID(),
      sessionId,
      date,
      time: date ? time : '',
      format,
      status,
      caption: caption.trim(),
      hashtags: hashtags.trim(),
      personIds: personIds.filter((id) => data.people.some((p) => p.id === id)),
      notes: notes.trim(),
    })
    onClose()
  }

  const remove = () => {
    if (!initial || !confirm('Usunąć ten post z planera?')) return
    void deletePost(initial.id)
    onClose()
  }

  return (
    <Modal title={initial ? 'Edytuj post' : 'Nowy post'} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <label>
          Sesja
          <select value={sessionId ?? ''} onChange={(e) => setSessionId(e.target.value || null)}>
            <option value="">— bez sesji —</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title} · {formatDate(s.date, { day: 'numeric', month: 'short', year: 'numeric' })}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="segmented">
          <legend>Format</legend>
          {POST_FORMATS.map((f) => (
            <label key={f}>
              <input type="radio" name="format" checked={format === f} onChange={() => setFormat(f)} />
              <span>{POST_FORMAT_LABEL[f]}</span>
            </label>
          ))}
        </fieldset>

        <div className="form-row">
          <label>
            Data publikacji
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label>
            Godzina
            <input type="time" value={time} disabled={!date} onChange={(e) => setTime(e.target.value)} />
          </label>
        </div>

        <label>
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value as PostStatus)}>
            {POST_STATUSES.map((s) => (
              <option key={s} value={s}>
                {POST_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </label>

        <label>
          Opis
          <textarea rows={5} value={caption} onChange={(e) => setCaption(e.target.value)} />
        </label>
        <label>
          Hashtagi
          <textarea
            rows={2}
            value={hashtags}
            onChange={(e) => setHashtags(e.target.value)}
            placeholder="#sesja #portret"
            autoCapitalize="none"
          />
        </label>

        <div className="field">
          <div className="field-head">
            <span>Osoby do oznaczenia</span>
            {session && session.personIds.length > 0 && (
              <button type="button" className="btn small" onClick={tagCrew}>
                Oznacz ekipę sesji
              </button>
            )}
          </div>
          {people.length === 0 ? (
            <p className="muted">Najpierw dodaj osoby w zakładce Ludzie.</p>
          ) : (
            <div className="chips">
              {people.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="chip"
                  data-role={p.role}
                  aria-pressed={personIds.includes(p.id)}
                  title={p.instagram ? undefined : 'Brak Instagrama — nie trafi do oznaczeń w tekście'}
                  onClick={() => toggle(p.id)}
                >
                  {p.name}
                  {!p.instagram && ' *'}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="post-preview">
          <div className="field-head">
            <span>Tekst do wklejenia</span>
            <CopyButton text={text} />
          </div>
          <pre>{text || 'Tu pojawi się opis z oznaczeniami i hashtagami.'}</pre>
          <p className={text.length > CAPTION_LIMIT || tagCount > HASHTAG_LIMIT ? 'counts over' : 'counts muted'}>
            {text.length}/{CAPTION_LIMIT} znaków · {tagCount}/{HASHTAG_LIMIT} hashtagów
          </p>
        </div>

        <label>
          Uwagi
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Np. które zdjęcia, kolejność w karuzeli, muzyka"
          />
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
