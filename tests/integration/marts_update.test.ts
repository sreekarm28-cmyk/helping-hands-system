import { describe, it, expect, vi } from 'vitest'

describe('Marts API update', () => {
  it('PUT should update store details', async () => {
    const existing = [{ id: 2, name: 'Old' }]
    const updated = { id: 2, name: 'Mega Mart', size: 'large' }
    const fakeDb: any = {
      select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(() => existing) })) })) })),
      update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn(() => ({ returning: vi.fn().mockResolvedValue([updated]) })) })) })),
    }
    vi.doMock('@/db', () => ({ db: fakeDb }))
    vi.doMock('@/db/schema', () => ({ marts: {} }))
    vi.resetModules()
    const { PUT } = (await import('../../src/app/api/marts/route')) as any
    const resp = await PUT({ url: 'http://localhost?id=2', json: async () => ({ name: 'Mega Mart', size: 'large' }) } as any)
    const body = await resp.json()
    expect(body.name).toBe('Mega Mart')
  })
})
