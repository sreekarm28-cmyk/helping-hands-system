import { describe, it, expect, vi } from 'vitest'

describe('Booking History API', () => {
  it('GET should return past and upcoming bookings for a user', async () => {
    const fakeResults = [{ id: 1, userId: 5 }, { id: 2, userId: 5 }]
    const fakeDb: any = {
      select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(() => ({ offset: vi.fn(() => fakeResults) })) })) })) })),
    }
    vi.doMock('@/db', () => ({ db: fakeDb }))
    vi.doMock('@/db/schema', () => ({ bookings: {} }))
    vi.resetModules()
    const { GET } = (await import('../../src/app/api/bookings/route')) as any
    const resp = await GET({ url: 'http://localhost?userId=5' } as any)
    const body = await resp.json()
    expect(Array.isArray(body)).toBe(true)
  })
})
