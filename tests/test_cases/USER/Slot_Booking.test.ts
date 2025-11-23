import { describe, it, expect, vi } from 'vitest'

describe('Slot Booking Tests', () => {
  it('should book a slot successfully when available', async () => {
    const payload = { userId: '1', martId: '1', sectionId: '1', slotDate: '2025-12-01', slotStartTime: '10:00', slotEndTime: '11:00' }
    const created = { id: 11, userId: 1, martId: 1 }
    const fakeDb: any = {
      insert: vi.fn(() => ({ values: vi.fn(() => ({ returning: vi.fn().mockResolvedValue([created]) })) })),
    }
    vi.doMock('@/db', () => ({ db: fakeDb }))
    vi.doMock('@/db/schema', () => ({ bookings: {} }))
    vi.resetModules()
    const { POST } = (await import('../../../src/app/api/bookings/route')) as any
    const resp = await POST({ json: async () => payload } as any)
    const body = await resp.json()
    expect(body.id).toBe(11)
  })

  it('should not book a slot when invalid sectionId provided', async () => {
    const payload = { userId: '1', martId: '1', sectionId: 'not-a-number', slotDate: '2025-12-01', slotStartTime: '10:00', slotEndTime: '11:00' }
    vi.doMock('@/db', () => ({ db: {} }))
    vi.doMock('@/db/schema', () => ({ bookings: {} }))
    vi.resetModules()
    const { POST } = (await import('../../../src/app/api/bookings/route')) as any
    const resp = await POST({ json: async () => payload } as any)
    const body = await resp.json()
    expect(body.code).toBe('INVALID_SECTION_ID')
  })
})
