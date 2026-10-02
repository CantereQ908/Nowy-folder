import { ROLE_LABEL, type Role } from '../types'

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span className="badge role-badge" data-role={role}>
      {ROLE_LABEL[role]}
    </span>
  )
}
