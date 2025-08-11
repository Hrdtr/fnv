import { describe, expect, it } from 'vitest'
import { arrayContains } from '../../src/utils/array-contains'

describe('arrayContains', () => {
  it('should return true if the array contains the element', () => {
    const base = [1, 2, 3]
    const current = 2
    expect(arrayContains(base, current)).toBe(true)
  })

  it('should return false if the array does not contain the element', () => {
    const base = [1, 2, 3]
    const current = 4
    expect(arrayContains(base, current)).toBe(false)
  })

  it('should handle an empty array', () => {
    const base: number[] = []
    const current = 1
    expect(arrayContains(base, current)).toBe(false)
  })

  it('should handle different data types', () => {
    const base = [{ a: 1 }, { b: 2 }]
    const current = { a: 1 }
    expect(arrayContains(base, current)).toBe(true)
  })

  it('should handle objects with different properties', () => {
    const base = [{ a: 1, b: 2 }, { c: 3 }]
    const current = { a: 1, b: 3 }
    expect(arrayContains(base, current)).toBe(false)
  })

  it('should handle null and undefined values', () => {
    const base = [null, undefined, 1]
    expect(arrayContains(base, null)).toBe(true)
    expect(arrayContains(base, undefined)).toBe(true)
    expect(arrayContains(base, 1)).toBe(true)
    expect(arrayContains(base, 2)).toBe(false)
  })

  it('should handle nested objects', () => {
    const base = [{ a: { b: 1 } }, { c: 2 }]
    const current = { a: { b: 1 } }
    expect(arrayContains(base, current)).toBe(true)
  })

  it('should handle arrays of objects', () => {
    const base = [[{ a: 1 }]]
    const current = [{ a: 1 }]
    expect(arrayContains(base, current)).toBe(true)
  })
})
