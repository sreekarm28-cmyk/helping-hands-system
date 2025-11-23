import { describe, it, expect, vi } from 'vitest'

describe('Cancellations API', () => {
  it('POST should create a cancellation with valid payload', async () => {
    const payload = { userId: '5', bookingId: '10', cancellationDate: '2025-11-23' }
    const created = { id: 100, userId: 5, bookingId: 10 }
    const fakeDb: any = {
      insert: vi.fn(() => ({ values: vi.fn(() => ({ returning: vi.fn().mockResolvedValue([created]) })) })),
    }
    vi.doMock('@/db', () => ({ db: fakeDb }))
    vi.doMock('@/db/schema', () => ({ cancellations: {} }))
    vi.resetModules()
    const { POST } = (await import('../../src/app/api/cancellations/route')) as any
    const resp = await POST({ json: async () => payload } as any)
    const body = await resp.json()
    expect(body.id).toBe(100)
  })
})
