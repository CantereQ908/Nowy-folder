import { useState, type FormEvent } from 'react'
import { useData } from '../data/DataProvider'
import { ROLES, ROLE_LABEL, type Person, type Role } from '../types'
import { Modal } from './Modal'

export function PersonForm({ initial, onClose }: { initial?: Person; onClose(): void }) {
  const { savePerson, deletePerson } = useData()
  const [name, setName] = useState(initial?.name ?? '')
  const [email, setEmail] = useState(initial?.email ?? '')
  const [instagram, setInstagram] = useState(initial?.instagram ?? '')
  const [role, setRole] = useState<Role>(initial?.role ?? 'model')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    void savePerson({
      id: initial?.id ?? crypto.randomUUID(),
      name: name.trim(),
      email: email.trim(),
      instagram: instagram.trim(),
      role,
    })
    onClose()
  }

  const remove = () => {
    if (!initial) return
    if (!confirm(`Usunąć kafelek „${initial.name}"? Zniknie też ze wszystkich sesji.`)) return
    void deletePerson(initial.id)
    onClose()
  }

  return (
    <Modal title={initial ? 'Edytuj osobę' : 'Nowa osoba'} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <label>
          Imię
          <input value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
        </label>
        <fieldset className="segmented" data-role={role}>
          <legend>Rola</legend>
          {ROLES.map((r) => (
            <label key={r}>
              <input type="radio" name="role" checked={role === r} onChange={() => setRole(r)} />
              <span>{ROLE_LABEL[r]}</span>
            </label>
          ))}
        </fieldset>
        <label>
          E-mail
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Instagram
          <input
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            placeholder="@nazwa"
            autoCapitalize="none"
            autoCorrect="off"
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
