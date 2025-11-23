import { describe, it, expect, vi } from 'vitest'

describe('Store Admin - Manage Bookings Tests', () => {
  it('should show bookings for mart', async () => {
    const fakeResults = [{ id: 1, martId: 1, userId: 5 }]
    const fakeDb: any = {
      select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(() => ({ offset: vi.fn(() => fakeResults) })) })) })) })),
    }
    vi.doMock('@/db', () => ({ db: fakeDb }))
    vi.doMock('@/db/schema', () => ({ bookings: {} }))
    vi.resetModules()
    const { GET } = (await import('../../../src/app/api/bookings/route')) as any
    const resp = await GET({ url: 'http://localhost?martId=1' } as any)
    const body = await resp.json()
    expect(Array.isArray(body)).toBe(true)
  })

  it('should mark user attendance', async () => {
    const existing = [{ id: 10, userId: 1 }]
    const updated = { id: 10, attendanceMarked: 1 }
    const fakeDb: any = {
      select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(() => existing) })) })) })),
      update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn(() => ({ returning: vi.fn().mockResolvedValue([updated]) })) })) })),
    }
    vi.doMock('@/db', () => ({ db: fakeDb }))
    vi.doMock('@/db/schema', () => ({ bookings: {} }))
    vi.resetModules()
    const { PUT } = (await import('../../../src/app/api/bookings/route')) as any
    const resp = await PUT({ url: 'http://localhost?id=10', json: async () => ({ attendanceMarked: true }) } as any)
    const body = await resp.json()
    expect(body.attendanceMarked).toBe(1)
  })
})
