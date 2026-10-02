export type Role = 'model' | 'stylist' | 'makeup'
export type Status = 'planned' | 'confirmed' | 'done'

export interface Person {
  id: string
  name: string
  email: string
  instagram: string
  role: Role
}

export interface Session {
  id: string
  title: string
  /** YYYY-MM-DD */
  date: string
  /** Początek: HH:MM albo pusty string */
  time: string
  /** Koniec: HH:MM albo pusty string */
  endTime: string
  location: string
  description: string
  status: Status
  personIds: string[]
}

export interface Task {
  id: string
  /** null = zadanie ogólne, niepowiązane z żadną sesją */
  sessionId: string | null
  /** null = zadanie główne; inaczej id zadania, którego to jest podzadaniem */
  parentId: string | null
  title: string
  done: boolean
  /** ISO, wyznacza kolejność na liście */
  createdAt: string
}

export interface Data {
  people: Person[]
  sessions: Session[]
  tasks: Task[]
}

export const ROLES: Role[] = ['model', 'stylist', 'makeup']

export const ROLE_LABEL: Record<Role, string> = {
  model: 'Model',
  stylist: 'Stylista',
  makeup: 'Makijażysta',
}

export const ROLE_LABEL_PLURAL: Record<Role, string> = {
  model: 'Modele',
  stylist: 'Styliści',
  makeup: 'Makijażyści',
}

export const STATUSES: Status[] = ['planned', 'confirmed', 'done']

export const STATUS_LABEL: Record<Status, string> = {
  planned: 'Planowana',
  confirmed: 'Potwierdzona',
  done: 'Zakończona',
}
