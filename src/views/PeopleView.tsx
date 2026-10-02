import { useState } from 'react'
import { PersonForm } from '../components/PersonForm'
import { PersonTile } from '../components/PersonTile'
import { RoleFilter, type RoleChoice } from '../components/RoleFilter'
import { useData } from '../data/DataProvider'
import { matchesPerson } from '../lib/contact'
import { ROLES, ROLE_LABEL_PLURAL, type Person } from '../types'

export function PeopleView() {
  const { data } = useData()
  const [query, setQuery] = useState('')
  const [role, setRole] = useState<RoleChoice>('all')
  // 'new' = formularz dodawania, Person = edycja
  const [form, setForm] = useState<Person | 'new' | null>(null)

  const visible = data.people
    .filter((p) => matchesPerson(p, query, role))
    .sort((a, b) => a.name.localeCompare(b.name, 'pl'))

  return (
    <>
      <div className="view-head">
        <h1>Ludzie</h1>
        <button className="btn primary" onClick={() => setForm('new')}>
          Dodaj osobę
        </button>
      </div>

      {data.people.length === 0 ? (
        <p className="empty">
          Tu będą kafelki modeli, stylistów i makijażystów. Dodaj pierwszą osobę, żeby móc przypinać ją do sesji.
        </p>
      ) : (
        <>
          <RoleFilter query={query} role={role} onQuery={setQuery} onRole={setRole} />
          {visible.length === 0 && <p className="empty">Nikt nie pasuje do filtra.</p>}
          {ROLES.map((r) => {
            const group = visible.filter((p) => p.role === r)
            if (group.length === 0) return null
            return (
              <section key={r} className="role-group">
                <h2>
                  {ROLE_LABEL_PLURAL[r]} <span className="muted">({group.length})</span>
                </h2>
                <div className="tiles grid">
                  {group.map((p) => (
                    <PersonTile
                      key={p.id}
                      person={p}
                      action={
                        <button className="btn small" onClick={() => setForm(p)}>
                          Edytuj
                        </button>
                      }
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </>
      )}

      {form && <PersonForm initial={form === 'new' ? undefined : form} onClose={() => setForm(null)} />}
    </>
  )
}
