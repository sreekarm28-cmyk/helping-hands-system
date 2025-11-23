import { describe, it, expect, vi } from 'vitest'

describe('Cancellation Tests', () => {
  it('should allow cancellation if payload valid', async () => {
    const payload = { userId: '1', bookingId: '10', cancellationDate: '2025-11-23' }
    const created = { id: 50 }
    const fakeDb: any = {
      insert: vi.fn(() => ({ values: vi.fn(() => ({ returning: vi.fn().mockResolvedValue([created]) })) })),
    }
    vi.doMock('@/db', () => ({ db: fakeDb }))
    vi.doMock('@/db/schema', () => ({ cancellations: {} }))
    vi.resetModules()
    const { POST } = (await import('../../../src/app/api/cancellations/route')) as any
    const resp = await POST({ json: async () => payload } as any)
    const body = await resp.json()
    expect(body.id).toBe(50)
  })

  it('should fail for invalid booking id', async () => {
    const payload = { userId: '1', bookingId: 'not-a-number', cancellationDate: '2025-11-23' }
    vi.doMock('@/db', () => ({ db: {} }))
    vi.doMock('@/db/schema', () => ({ cancellations: {} }))
    vi.resetModules()
    const { POST } = (await import('../../../src/app/api/cancellations/route')) as any
    const resp = await POST({ json: async () => payload } as any)
    const body = await resp.json()
    expect(body.code).toBe('INVALID_BOOKING_ID')
  })
})
