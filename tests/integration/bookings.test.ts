import { describe, it, expect, vi } from 'vitest'

describe('Bookings API', () => {
  it('POST should create a booking when payload is valid', async () => {
    const payload = {
      userId: '5',
      martId: '1',
      sectionId: '1',
      slotDate: '2025-12-01',
      slotStartTime: '10:00',
      slotEndTime: '11:00',
    }

    const created = { id: 10, userId: 5, martId: 1 }
    const fakeDb: any = {
      insert: vi.fn(() => ({ values: vi.fn(() => ({ returning: vi.fn().mockResolvedValue([created]) })) })),
    }
    vi.doMock('@/db', () => ({ db: fakeDb }))
    vi.doMock('@/db/schema', () => ({ bookings: {} }))
    vi.resetModules()
    const { POST } = (await import('../../src/app/api/bookings/route')) as any
    const resp = await POST({ json: async () => payload } as any)
    const body = await resp.json()
    expect(body.id).toBe(10)
  })
})
