import { describe, it, expect } from 'vitest'
import { cn } from '../../src/lib/utils'

describe('cn utility', () => {
  it('should join classes with truthy values', () => {
    expect(cn('a', false && 'b', 'c', undefined)).toBe('a c')
  })
})
