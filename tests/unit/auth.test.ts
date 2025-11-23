import { describe, it, expect, vi } from 'vitest'

vi.mock('@/db', () => ({ db: {} }))
vi.mock('@/db/schema', () => ({ users: {}, sessions: {} }))
import { requireRole } from '../../src/lib/auth'

describe('requireRole helper', () => {
  it('should return true for allowed roles', () => {
    expect(requireRole('main_admin', ['main_admin', 'store_admin'])).toBe(true)
  })

  it('should return false for not allowed roles', () => {
    expect(requireRole('end_user', ['store_admin'])).toBe(false)
  })
})
