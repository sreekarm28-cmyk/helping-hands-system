import { describe, it, expect, vi } from 'vitest'

describe('Main Admin - User Management Tests', () => {
  it('should register a new user', async () => {
    const sampleUser = { email: 'user10@example.com', password: 'user123', name: 'Test User', role: 'end_user' }
    const fakeCreated = { id: 10, email: sampleUser.email, name: sampleUser.name }
    const fakeDb: any = {
      insert: vi.fn(() => ({ values: vi.fn(() => ({ returning: vi.fn().mockResolvedValue([fakeCreated]) })) })),
      select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(() => []) })) })) })),
    }
    vi.doMock('@/db', () => ({ db: fakeDb }))
    vi.doMock('@/db/schema', () => ({ users: {} }))
    vi.resetModules()
    const { POST } = (await import('../../../src/app/api/users/route')) as any
    const resp = await POST({ json: async () => sampleUser } as any)
    const body = await resp.json()
    expect(body.email).toBe(sampleUser.email)
  })

  it('should remove an existing user', async () => {
    const deleted = { id: 10, email: 'user10@example.com', name: 'Test User' }
    const fakeDb: any = {
      select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(() => ([deleted]) })) })) }))),
      delete: vi.fn(() => ({ where: vi.fn(() => ({ returning: vi.fn().mockResolvedValue([deleted]) })) })),
    }
    vi.doMock('@/db', () => ({ db: fakeDb }))
    vi.doMock('@/db/schema', () => ({ users: {} }))
    vi.resetModules()
    const { DELETE } = (await import('../../../src/app/api/users/route')) as any
    const resp = await DELETE({ url: 'http://localhost?id=10' } as any)
    const body = await resp.json()
    expect(body.user.email).toBe('user10@example.com')
  })
})
