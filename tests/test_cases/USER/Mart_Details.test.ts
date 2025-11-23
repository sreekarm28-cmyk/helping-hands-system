import { describe, it, expect, vi } from 'vitest'

describe('Mart Details Tests', () => {
  it('should show mart details correctly', async () => {
    const mart = { id: 1, name: 'Test Mart', sections: [{ id: 1, name: 'electronics' }] }
    const fakeDb: any = {
      select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(() => ([mart]) })) })) }))),
    }
    vi.doMock('@/db', () => ({ db: fakeDb }))
    vi.doMock('@/db/schema', () => ({ marts: {} }))
    vi.resetModules()
    const { GET } = (await import('../../../src/app/api/marts/route')) as any
    const resp = await GET({ url: 'http://localhost?id=1' } as any)
    const body = await resp.json()
    expect(body.id).toBe(1)
    expect(body.sections).toBeTruthy()
  })

  it('should return error for invalid mart', async () => {
    const fakeDb: any = { select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(() => []) })) })) })), }
    vi.doMock('@/db', () => ({ db: fakeDb }))
    vi.doMock('@/db/schema', () => ({ marts: {} }))
    vi.resetModules()
    const { GET } = (await import('../../../src/app/api/marts/route')) as any
    const resp = await GET({ url: 'http://localhost?id=9999' } as any)
    const body = await resp.json()
    expect(body.error).toBeDefined()
  })
})
