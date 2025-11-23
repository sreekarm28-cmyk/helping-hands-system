import { describe, it, expect, vi } from 'vitest'

describe('Users API (integration unit)', () => {
  it('POST should create a user when payload is valid', async () => {
    const sampleUser = { email: 'newuser@example.com', password: 'password', name: 'New User', role: 'end_user' }

    // Mock db.insert(...).values(...).returning()
    const fakeCreated = { id: 123, email: sampleUser.email, name: sampleUser.name, role: sampleUser.role }
    const fakeDb: any = {
      insert: vi.fn(() => ({ values: vi.fn(() => ({ returning: vi.fn().mockResolvedValue([fakeCreated]) })) })),
      select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(() => []) })) })) })),
    }

    // Replace the db module before importing the route
    vi.doMock('@/db', () => ({ db: fakeDb }))
    vi.doMock('@/db/schema', () => ({ users: {}, sessions: {} }))
    vi.resetModules()
    const { POST } = (await import('../../src/app/api/users/route')) as any

    const fakeReq = { json: async () => sampleUser } as any
    const resp = await POST(fakeReq)
    // NextResponse object has `status` in a private field; instead, parse JSON by calling resp.json if available
    const body = await resp.json()
    expect(body.email).toBe(sampleUser.email)
    expect(body.id).toBe(fakeCreated.id)
  })
})
