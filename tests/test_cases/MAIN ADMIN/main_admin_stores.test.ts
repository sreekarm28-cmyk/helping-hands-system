import { describe, it, expect, vi } from 'vitest'

describe('Main Admin - Store Management Tests', () => {
  it('should add a new store', async () => {
    const payload = { name: 'Test Mart', type: 'supermarket', size: 'medium', address: '123 Test St', latitude: 12, longitude: 56 }
    const created = { id: 200, name: 'Test Mart' }
    const fakeDb: any = {
      insert: vi.fn(() => ({ values: vi.fn(() => ({ returning: vi.fn().mockResolvedValue([created]) })) })),
    }
    vi.doMock('@/db', () => ({ db: fakeDb }))
    vi.doMock('@/db/schema', () => ({ marts: {} }))
    vi.resetModules()
    const { POST } = (await import('../../../src/app/api/marts/route')) as any
    const resp = await POST({ json: async () => payload } as any)
    const body = await resp.json()
    expect(body.id).toBe(200)
  })

  it('should remove an existing store', async () => {
    const deleted = { id: 200, name: 'Test Mart' }
    const fakeDb: any = {
      select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(() => ([deleted]) })) })) }))),
      delete: vi.fn(() => ({ where: vi.fn(() => ({ returning: vi.fn().mockResolvedValue([deleted]) })) })),
    }
    vi.doMock('@/db', () => ({ db: fakeDb }))
    vi.doMock('@/db/schema', () => ({ marts: {} }))
    vi.resetModules()
    const { DELETE } = (await import('../../../src/app/api/marts/route')) as any
    const resp = await DELETE({ url: 'http://localhost?id=200' } as any)
    const body = await resp.json()
    expect(body.mart.id).toBe(200)
  })
})
