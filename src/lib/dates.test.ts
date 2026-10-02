import { describe, expect, it } from 'vitest'
import { formatTimeRange, monthGrid, parseISO, todayISO, toISO } from './dates'

describe('dates', () => {
  it('formats ISO dates with padding', () => {
    expect(toISO(2026, 3, 7)).toBe('2026-03-07')
    expect(todayISO(new Date(2026, 9, 2, 23, 59))).toBe('2026-10-02')
  })

  it('parses ISO as a local date', () => {
    const d = parseISO('2026-10-02')
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 9, 2])
  })

  it('builds a Monday-first grid with leading and trailing days', () => {
    // 1 października 2026 to czwartek
    const grid = monthGrid(2026, 10)
    expect(grid).toHaveLength(35)
    expect(grid[0]).toEqual({ iso: '2026-09-28', day: 28, inMonth: false })
    expect(grid[3]).toEqual({ iso: '2026-10-01', day: 1, inMonth: true })
    expect(grid[34]).toEqual({ iso: '2026-11-01', day: 1, inMonth: false })
  })

  it('formats a time range', () => {
    expect(formatTimeRange('15:30', '18:00')).toBe('15:30–18:00')
    expect(formatTimeRange('15:30', '')).toBe('15:30')
    expect(formatTimeRange('', '18:00')).toBe('do 18:00')
    // sesje zapisane przed dodaniem godziny końca nie mają tego pola
    expect(formatTimeRange('15:30', undefined)).toBe('15:30')
    expect(formatTimeRange('', '')).toBe('')
  })

  it('handles months starting on Monday and needing six weeks', () => {
    expect(monthGrid(2026, 6)[0].iso).toBe('2026-06-01')
    // sierpień 2026 zaczyna się w sobotę i ma 31 dni → 6 tygodni
    expect(monthGrid(2026, 8)).toHaveLength(42)
  })
})
