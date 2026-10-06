import type { Person, Post } from '../types'
import { instagramHandle } from './contact'

/** Limity Instagrama dla opisu posta. */
export const CAPTION_LIMIT = 2200
export const HASHTAG_LIMIT = 30

export function countHashtags(text: string): number {
  return text.match(/#[\p{L}\p{N}_]+/gu)?.length ?? 0
}

/** Oznaczenia @nick osób z posta, które mają podany Instagram. */
export function mentions(post: Pick<Post, 'personIds'>, people: Person[]): string[] {
  return post.personIds
    .map((id) => people.find((p) => p.id === id))
    .map((p) => (p ? instagramHandle(p.instagram) : ''))
    .filter(Boolean)
    .map((handle) => `@${handle}`)
}

/** Tekst do wklejenia na Instagram: opis, oznaczenia, hashtagi — rozdzielone pustą linią. */
export function buildPostText(post: Pick<Post, 'caption' | 'hashtags' | 'personIds'>, people: Person[]): string {
  return [post.caption.trim(), mentions(post, people).join(' '), post.hashtags.trim()].filter(Boolean).join('\n\n')
}

const byWhen = (a: Post, b: Post) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)

export interface PostSections {
  /** Termin minął, a post nie jest opublikowany */
  overdue: Post[]
  upcoming: Post[]
  undated: Post[]
  published: Post[]
}

export function postSections(posts: Post[], today: string): PostSections {
  const open = posts.filter((p) => p.status !== 'published')
  return {
    overdue: open.filter((p) => p.date && p.date < today).sort(byWhen),
    upcoming: open.filter((p) => p.date && p.date >= today).sort(byWhen),
    undated: open.filter((p) => !p.date),
    published: posts.filter((p) => p.status === 'published').sort((a, b) => byWhen(b, a)),
  }
}
