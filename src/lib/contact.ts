import type { Person, Role } from '../types'

/** Akceptuje „@nick", „nick" i pełny link do profilu. */
export function instagramHandle(raw: string): string {
  return raw
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .replace(/[/?#].*$/, '')
    .replace(/^@/, '')
}

export function instagramUrl(raw: string): string {
  return `https://instagram.com/${encodeURIComponent(instagramHandle(raw))}`
}

/** mailto: do wszystkich podanych adresów; null, gdy nie ma żadnego. */
export function mailtoAll(emails: string[], subject: string): string | null {
  const unique = [...new Set(emails.map((e) => e.trim()).filter(Boolean))]
  if (unique.length === 0) return null
  return `mailto:${unique.join(',')}?subject=${encodeURIComponent(subject)}`
}

export function matchesPerson(person: Person, query: string, role: Role | 'all'): boolean {
  if (role !== 'all' && person.role !== role) return false
  const q = query.trim().toLowerCase()
  if (!q) return true
  return [person.name, person.email, person.instagram].some((v) => v.toLowerCase().includes(q))
}
