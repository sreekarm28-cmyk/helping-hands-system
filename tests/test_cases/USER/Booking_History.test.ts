import { describe, it, expect, vi } from 'vitest'

describe('Booking History Tests', () => {
  it('should return past and upcoming bookings', async () => {
    const fakeResults = [{ id: 1, userId: 5, slotDate: '2025-11-22' }, { id: 2, userId: 5, slotDate: '2025-12-01' }]
    const fakeDb: any = {
      select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(() => ({ offset: vi.fn(() => fakeResults) })) })) })) })),
    }
    vi.doMock('@/db', () => ({ db: fakeDb }))
    vi.doMock('@/db/schema', () => ({ bookings: {} }))
    vi.resetModules()
    const { GET } = (await import('../../../src/app/api/bookings/route')) as any
    const resp = await GET({ url: 'http://localhost?userId=5' } as any)
    const body = await resp.json()
    expect(Array.isArray(body)).toBe(true)
  })
  it('should return empty lists if user has no history', async () => {
    const fakeResults: any[] = []
    const fakeDb: any = {
      select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(() => ({ offset: vi.fn(() => fakeResults) })) })) })) })),
    }
    vi.doMock('@/db', () => ({ db: fakeDb }))
    vi.doMock('@/db/schema', () => ({ bookings: {} }))
    vi.resetModules()
    const { GET } = (await import('../../../src/app/api/bookings/route')) as any
    const resp = await GET({ url: 'http://localhost?userId=9999' } as any)
    const body = await resp.json()
    expect(Array.isArray(body)).toBe(true)
    expect(body.length).toBe(0)
  })
})
