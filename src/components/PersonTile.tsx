import type { ReactNode } from 'react'
import { instagramHandle, instagramUrl } from '../lib/contact'
import type { Person } from '../types'
import { RoleBadge } from './RoleBadge'

export function PersonTile({ person, action }: { person: Person; action?: ReactNode }) {
  const handle = instagramHandle(person.instagram)
  return (
    <article className="tile" data-role={person.role}>
      <div className="tile-main">
        <div className="tile-head">
          <strong>{person.name}</strong>
          <RoleBadge role={person.role} />
        </div>
        <div className="tile-links">
          {person.email && <a href={`mailto:${person.email}`}>{person.email}</a>}
          {handle && (
            <a href={instagramUrl(person.instagram)} target="_blank" rel="noreferrer">
              @{handle}
            </a>
          )}
        </div>
        {person.note && <p className="tile-note">{person.note}</p>}
      </div>
      {action && <div className="tile-action">{action}</div>}
    </article>
  )
}
