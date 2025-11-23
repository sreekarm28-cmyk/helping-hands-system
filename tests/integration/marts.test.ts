import { describe, it, expect, vi } from 'vitest'

describe('Marts API', () => {
  it('POST should create a mart with valid payload', async () => {
    const payload = { name: 'Test Mart', type: 'electronics', size: 'small', address: '123 Test St', latitude: 10, longitude: 20 }
    const created = { id: 1, ...payload }
    const fakeDb: any = {
      insert: vi.fn(() => ({ values: vi.fn(() => ({ returning: vi.fn().mockResolvedValue([created]) })) })),
    }
    vi.doMock('@/db', () => ({ db: fakeDb }))
    vi.doMock('@/db/schema', () => ({ marts: {} }))
    vi.resetModules()
    const { POST } = (await import('../../src/app/api/marts/route')) as any
    const resp = await POST({ json: async () => payload } as any)
    const body = await resp.json()
    expect(body.name).toBe('Test Mart')
    expect(body.id).toBe(1)
  })
})
