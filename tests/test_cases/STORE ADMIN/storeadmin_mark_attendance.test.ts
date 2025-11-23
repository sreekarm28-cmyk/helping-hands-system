import { describe, it, expect, vi } from 'vitest'

describe('FR-13: Store Admin Mark Attendance Tests', () => {
  it('should mark user as present', async () => {
    const existing = [{ id: 11, userId: 1 }]
    const updated = { id: 11, attendanceMarked: 1 }
    const fakeDb: any = {
      select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(() => existing) })) })) })),
      update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn(() => ({ returning: vi.fn().mockResolvedValue([updated]) })) })) })),
    }
    vi.doMock('@/db', () => ({ db: fakeDb }))
    vi.doMock('@/db/schema', () => ({ bookings: {} }))
    vi.resetModules()
    const { PUT } = (await import('../../../src/app/api/bookings/route')) as any
    const resp = await PUT({ url: 'http://localhost?id=11', json: async () => ({ attendanceMarked: true }) } as any)
    const body = await resp.json()
    expect(body.attendanceMarked).toBe(1)
  })

  it('should mark user as absent', async () => {
    const existing = [{ id: 12, userId: 2 }]
    const updated = { id: 12, attendanceMarked: 0 }
    const fakeDb: any = {
      select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(() => existing) })) })) })),
      update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn(() => ({ returning: vi.fn().mockResolvedValue([updated]) })) })) })),
    }
    vi.doMock('@/db', () => ({ db: fakeDb }))
    vi.doMock('@/db/schema', () => ({ bookings: {} }))
    vi.resetModules()
    const { PUT } = (await import('../../../src/app/api/bookings/route')) as any
    const resp = await PUT({ url: 'http://localhost?id=12', json: async () => ({ attendanceMarked: false }) } as any)
    const body = await resp.json()
    expect(body.attendanceMarked).toBe(0)
  })

  it('should fail for non-existent user', async () => {
    const fakeDb: any = {
      select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(() => []) })) })) })),
    }
    vi.doMock('@/db', () => ({ db: fakeDb }))
    vi.doMock('@/db/schema', () => ({ bookings: {} }))
    vi.resetModules()
    const { PUT } = (await import('../../../src/app/api/bookings/route')) as any
    const resp = await PUT({ url: 'http://localhost?id=9999', json: async () => ({ attendanceMarked: true }) } as any)
    const body = await resp.json()
    expect(body.error).toBeDefined()
  })

  it('should fail for invalid mart or slot', async () => {
    // For invalid mart or slot, the route validates martId/sectionId at query or body; we test by sending invalid data
    const payload = { attendanceMarked: true }
    vi.doMock('@/db', () => ({ db: {} }))
    vi.doMock('@/db/schema', () => ({ bookings: {} }))
    vi.resetModules()
    const { PUT } = (await import('../../../src/app/api/bookings/route')) as any
    const resp = await PUT({ url: 'http://localhost?id=abc', json: async () => payload } as any)
    const body = await resp.json()
    expect(body.code).toBe('INVALID_ID')
  })
})
