import { describe, it, expect, vi } from 'vitest'

describe('Store Admin Bookings - API', () => {
  it('GET should list bookings for a mart', async () => {
    const fakeResults = [{ id: 1, martId: 1, userId: 5 }]
    const fakeDb: any = {
      select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(() => ({ offset: vi.fn(() => fakeResults) })) })) })) })),
    }
    vi.doMock('@/db', () => ({ db: fakeDb }))
    vi.doMock('@/db/schema', () => ({ bookings: {} }))
    vi.resetModules()
    const { GET } = (await import('../../src/app/api/bookings/route')) as any
    const req = { url: 'http://localhost?martId=1' } as any
    const resp = await GET(req)
    const body = await resp.json()
    expect(Array.isArray(body)).toBe(true)
  })

  it('PUT should mark attendance successfully for an existing booking', async () => {
    const existing = [{ id: 5, userId: 1 }]
    const updated = { id: 5, attendanceMarked: 1 }
    const fakeDb: any = {
      select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(() => existing) })) })) })),
      update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn(() => ({ returning: vi.fn().mockResolvedValue([updated]) })) })) }))
    }
    vi.doMock('@/db', () => ({ db: fakeDb }))
    vi.doMock('@/db/schema', () => ({ bookings: {} }))
    vi.resetModules()
    const { PUT } = (await import('../../src/app/api/bookings/route')) as any
    const req = { url: 'http://localhost?id=5', json: async () => ({ attendanceMarked: true }) } as any
    const resp = await PUT(req)
    const body = await resp.json()
    expect(body.attendanceMarked).toBe(1)
  })
})
