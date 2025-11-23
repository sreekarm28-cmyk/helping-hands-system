import { describe, it, expect, vi } from 'vitest'

describe('Sections API', () => {
  it('POST should create a section for valid mart', async () => {
    const payload = { martId: '1', name: 'Customer Support', manpowerRequired: 3 }
    const created = { id: 55, martId: 1, name: 'Customer Support' }
    const fakeDb: any = {
      select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(() => ([{ id: 1 }])) })) })) })),
      insert: vi.fn(() => ({ values: vi.fn(() => ({ returning: vi.fn().mockResolvedValue([created]) })) })),
    }
    vi.doMock('@/db', () => ({ db: fakeDb }))
    vi.doMock('@/db/schema', () => ({ sections: {}, marts: {} }))
    vi.resetModules()
    const { POST } = (await import('../../src/app/api/sections/route')) as any
    const resp = await POST({ json: async () => payload } as any)
    const body = await resp.json()
    expect(body.id).toBe(55)
  })

  it('PUT should update manpower requirement', async () => {
    const existing = [{ id: 1, name: 'electronics' }]
    const updated = { id: 1, manpowerRequired: 5 }
    const fakeDb: any = {
      select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(() => existing) })) })) })),
      update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn(() => ({ returning: vi.fn().mockResolvedValue([updated]) })) })) })),
    }
    vi.doMock('@/db', () => ({ db: fakeDb }))
    vi.doMock('@/db/schema', () => ({ sections: {} }))
    vi.resetModules()
    const { PUT } = (await import('../../src/app/api/sections/route')) as any
    const resp = await PUT({ url: 'http://localhost?id=1', json: async () => ({ manpowerRequired: 5 }) } as any)
    const body = await resp.json()
    expect(body.manpowerRequired).toBe(5)
  })

  it('DELETE should remove section', async () => {
    const existing = [{ id: 3 }]
    const deleted = { id: 3 }
    const fakeDb: any = {
      select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(() => existing) })) })) })),
      delete: vi.fn(() => ({ where: vi.fn(() => ({ returning: vi.fn().mockResolvedValue([deleted]) })) })),
    }
    vi.doMock('@/db', () => ({ db: fakeDb }))
    vi.doMock('@/db/schema', () => ({ sections: {} }))
    vi.resetModules()
    const { DELETE } = (await import('../../src/app/api/sections/route')) as any
    const resp = await DELETE({ url: 'http://localhost?id=3' } as any)
    const body = await resp.json()
    expect(body.section.id).toBe(3)
  })
})
