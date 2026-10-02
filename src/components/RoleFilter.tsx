import { ROLES, ROLE_LABEL_PLURAL, type Role } from '../types'

export type RoleChoice = Role | 'all'

interface Props {
  query: string
  role: RoleChoice
  onQuery(query: string): void
  onRole(role: RoleChoice): void
}

export function RoleFilter({ query, role, onQuery, onRole }: Props) {
  return (
    <div className="filter">
      <input
        type="search"
        placeholder="Szukaj: imię, mail, IG"
        aria-label="Szukaj osoby"
        value={query}
        onChange={(e) => onQuery(e.target.value)}
      />
      <div className="chips" role="group" aria-label="Rola">
        {(['all', ...ROLES] as RoleChoice[]).map((r) => (
          <button
            key={r}
            type="button"
            className="chip"
            data-role={r === 'all' ? undefined : r}
            aria-pressed={role === r}
            onClick={() => onRole(r)}
          >
            {r === 'all' ? 'Wszyscy' : ROLE_LABEL_PLURAL[r]}
          </button>
        ))}
      </div>
    </div>
  )
}
