import { describe, it, expect, vi } from 'vitest'

describe('Store Admin - Store Details Tests', () => {
  it('should update store details successfully', async () => {
    const existing = [{ id: 5, name: 'Old Name' }]
    const updated = { id: 5, name: 'Mega Mart', size: 'Large' }
    const fakeDb: any = {
      select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(() => existing) })) })) })),
      update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn(() => ({ returning: vi.fn().mockResolvedValue([updated]) })) })) })),
    }
    vi.doMock('@/db', () => ({ db: fakeDb }))
    vi.doMock('@/db/schema', () => ({ marts: {} }))
    vi.resetModules()
    const { PUT } = (await import('../../../src/app/api/marts/route')) as any
    const resp = await PUT({ url: 'http://localhost?id=5', json: async () => ({ name: 'Mega Mart', size: 'Large' }) } as any)
    const body = await resp.json()
    expect(body.name).toBe('Mega Mart')
  })

  it('should fail for missing fields', async () => {
    vi.doMock('@/db', () => ({ db: {} }))
    vi.doMock('@/db/schema', () => ({ marts: {} }))
    vi.resetModules()
    const { POST } = (await import('../../../src/app/api/marts/route')) as any
    const resp = await POST({ json: async () => ({ name: '' }) } as any)
    const body = await resp.json()
    expect(body.code).toBeDefined()
  })
})
