import { describe, it, expect, vi } from 'vitest'

describe('Store Admin - Section Management Tests', () => {
  it('should add a new section', async () => {
    const payload = { martId: '1', name: 'Customer Support' }
    const created = { id: 77, name: 'Customer Support' }
    const fakeDb: any = {
      select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(() => ([{ id: 1 }])) })) })) })),
      insert: vi.fn(() => ({ values: vi.fn(() => ({ returning: vi.fn().mockResolvedValue([created]) })) })),
    }
    vi.doMock('@/db', () => ({ db: fakeDb }))
    vi.doMock('@/db/schema', () => ({ sections: {}, marts: {} }))
    vi.resetModules()
    const { POST } = (await import('../../../src/app/api/sections/route')) as any
    const resp = await POST({ json: async () => payload } as any)
    const body = await resp.json()
    expect(body.id).toBe(77)
  })

  it('should update manpower requirement', async () => {
    const existing = [{ id: 1, name: 'billing' }]
    const updated = { id: 1, manpowerRequired: 5 }
    const fakeDb: any = {
      select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(() => existing) })) })) })),
      update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn(() => ({ returning: vi.fn().mockResolvedValue([updated]) })) })) })),
    }
    vi.doMock('@/db', () => ({ db: fakeDb }))
    vi.doMock('@/db/schema', () => ({ sections: {} }))
    vi.resetModules()
    const { PUT } = (await import('../../../src/app/api/sections/route')) as any
    const resp = await PUT({ url: 'http://localhost?id=1', json: async () => ({ manpowerRequired: 5 }) } as any)
    const body = await resp.json()
    expect(body.manpowerRequired).toBe(5)
  })

  it('should remove a section', async () => {
    const existing = [{ id: 3 }]
    const deleted = { id: 3 }
    const fakeDb: any = {
      select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(() => existing) })) })) })),
      delete: vi.fn(() => ({ where: vi.fn(() => ({ returning: vi.fn().mockResolvedValue([deleted]) })) })),
    }
    vi.doMock('@/db', () => ({ db: fakeDb }))
    vi.doMock('@/db/schema', () => ({ sections: {} }))
    vi.resetModules()
    const { DELETE } = (await import('../../../src/app/api/sections/route')) as any
    const resp = await DELETE({ url: 'http://localhost?id=3' } as any)
    const body = await resp.json()
    expect(body.section.id).toBe(3)
  })
})
