import { useData } from '../data/DataProvider'
import { formatDate } from '../lib/dates'
import { buildPostText, mentions } from '../lib/posts'
import { POST_FORMAT_LABEL, POST_STATUS_LABEL, type Post } from '../types'
import { CopyButton } from './CopyButton'

export function PostCard({ post, onOpen, showSession = true }: { post: Post; onOpen(): void; showSession?: boolean }) {
  const { data } = useData()
  const session = data.sessions.find((s) => s.id === post.sessionId)
  const tags = mentions(post, data.people)

  return (
    <article className="post-card" data-post-status={post.status}>
      <button className="post-card-main" onClick={onOpen}>
        <div className="date-block">
          {post.date ? (
            <>
              <span className="date-day">{formatDate(post.date, { day: 'numeric' })}</span>
              <span className="date-month">{formatDate(post.date, { month: 'short' })}</span>
              <span className="date-weekday">{post.time || formatDate(post.date, { weekday: 'short' })}</span>
            </>
          ) : (
            <span className="date-month">bez daty</span>
          )}
        </div>
        <div className="post-card-body">
          <div className="session-card-head">
            <span className="badge format-badge">{POST_FORMAT_LABEL[post.format]}</span>
            <span className="badge post-status-badge">{POST_STATUS_LABEL[post.status]}</span>
            {showSession && session && <span className="muted post-session">{session.title}</span>}
          </div>
          <p className={post.caption ? 'post-caption' : 'post-caption muted'}>{post.caption || 'Bez opisu'}</p>
          {tags.length > 0 && <p className="muted post-tags">{tags.join(' ')}</p>}
        </div>
      </button>
      <div className="post-card-actions">
        <CopyButton text={buildPostText(post, data.people)} label="Kopiuj" />
      </div>
    </article>
  )
}
