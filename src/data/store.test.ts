import { describe, expect, it } from 'vitest'
import type { Data, Post, Task } from '../types'
import { EMPTY, normalize, withPost, withTask, withoutPerson, withoutPost, withoutSession, withoutTask } from './store'

const post = (id: string, extra: Partial<Post> = {}): Post => ({
  id,
  sessionId: null,
  date: '',
  time: '',
  format: 'post',
  status: 'idea',
  caption: '',
  hashtags: '',
  personIds: [],
  notes: '',
  ...extra,
})

const task = (id: string, extra: Partial<Task> = {}): Task => ({
  id,
  sessionId: null,
  parentId: null,
  title: id,
  done: false,
  dueDate: '',
  dueTime: '',
  createdAt: '2026-10-02T12:00:00.000Z',
  ...extra,
})

describe('store', () => {
  it('fills in fields missing from data saved by older versions', () => {
    expect(normalize({ people: [], sessions: [] })).toEqual(EMPTY)
  })

  it('adds a new task and replaces an existing one', () => {
    const added = withTask(EMPTY, task('a'))
    expect(added.tasks).toHaveLength(1)
    const updated = withTask(added, task('a', { done: true }))
    expect(updated.tasks).toEqual([task('a', { done: true })])
  })

  it('removes a task together with its subtasks only', () => {
    const data: Data = {
      ...EMPTY,
      tasks: [task('a'), task('a1', { parentId: 'a' }), task('b'), task('b1', { parentId: 'b' })],
    }
    expect(withoutTask(data, 'a').tasks.map((t) => t.id)).toEqual(['b', 'b1'])
    expect(withoutTask(data, 'b1').tasks.map((t) => t.id)).toEqual(['a', 'a1', 'b'])
  })

  it('removes a session together with its tasks, keeping general ones and its posts', () => {
    const data: Data = {
      people: [],
      sessions: [
        { id: 's', title: 'S', date: '2026-10-17', time: '', endTime: '', location: '', description: '', status: 'planned', personIds: [] },
      ],
      tasks: [task('general'), task('for-s', { sessionId: 's' })],
      posts: [post('from-s', { sessionId: 's' })],
    }
    const result = withoutSession(data, 's')
    expect(result.sessions).toEqual([])
    expect(result.tasks.map((t) => t.id)).toEqual(['general'])
    expect(result.posts).toEqual([post('from-s', { sessionId: null })])
  })

  it('adds, replaces and removes posts', () => {
    const added = withPost(EMPTY, post('p'))
    expect(withPost(added, post('p', { status: 'ready' })).posts).toEqual([post('p', { status: 'ready' })])
    expect(withoutPost(added, 'p').posts).toEqual([])
  })

  it('removing a person untags them from posts', () => {
    const data: Data = { ...EMPTY, posts: [post('p', { personIds: ['a', 'b'] })] }
    expect(withoutPerson(data, 'a').posts[0].personIds).toEqual(['b'])
  })
})
