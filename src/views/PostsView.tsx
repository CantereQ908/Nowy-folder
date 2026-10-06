import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PostCard } from '../components/PostCard'
import { PostForm } from '../components/PostForm'
import { useData } from '../data/DataProvider'
import { todayISO } from '../lib/dates'
import { postSections } from '../lib/posts'
import type { Post } from '../types'

function Section({ title, posts, className }: { title: string; posts: Post[]; className?: string }) {
  const navigate = useNavigate()
  if (posts.length === 0) return null
  return (
    <section className={className}>
      <h2>
        {title} <span className="muted">({posts.length})</span>
      </h2>
      <div className="session-list">
        {posts.map((p) => (
          <PostCard key={p.id} post={p} onOpen={() => navigate(`/posty/${p.id}`)} />
        ))}
      </div>
    </section>
  )
}

export function PostsView() {
  const { data } = useData()
  const { postId } = useParams()
  const navigate = useNavigate()
  const [adding, setAdding] = useState(false)

  const s = postSections(data.posts, todayISO())
  // Post otwierany z adresu, np. z kalendarza
  const editing = data.posts.find((p) => p.id === postId)

  return (
    <>
      <div className="view-head">
        <h1>Posty</h1>
        <button className="btn primary" onClick={() => setAdding(true)}>
          Nowy post
        </button>
      </div>

      {data.posts.length === 0 && (
        <p className="empty">
          Tu planujesz posty na Instagram: datę, opis, hashtagi i osoby do oznaczenia. Post możesz powiązać z sesją —
          albo zaplanować go prosto ze szczegółów sesji.
        </p>
      )}

      <Section title="Zaległe" posts={s.overdue} className="overdue" />
      <Section title="Zaplanowane" posts={s.upcoming} />
      <Section title="Bez daty" posts={s.undated} />
      <Section title="Opublikowane" posts={s.published} className="published" />

      {adding && <PostForm onClose={() => setAdding(false)} />}
      {editing && <PostForm key={editing.id} initial={editing} onClose={() => navigate('/posty')} />}
    </>
  )
}
