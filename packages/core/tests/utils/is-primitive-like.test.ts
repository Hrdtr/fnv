import { describe, expect, it } from 'vitest'
import { isPrimitiveLike } from '../../src/utils'

describe('isPrimitiveLike', () => {
  it('should return true for primitive values', () => {
    expect(isPrimitiveLike(1)).toBe(true)
    expect(isPrimitiveLike('hello')).toBe(true)
    expect(isPrimitiveLike(true)).toBe(true)
    expect(isPrimitiveLike(null)).toBe(true)
    expect(isPrimitiveLike(undefined)).toBe(true)
    expect(isPrimitiveLike(12345678901234567890n)).toBe(true)
    expect(isPrimitiveLike(Symbol('test'))).toBe(true)
    expect(isPrimitiveLike(() => {})).toBe(true)
    expect(isPrimitiveLike(new Date())).toBe(true)
  })

  it('should return false for non-primitive values', () => {
    expect(isPrimitiveLike({})).toBe(false)
    expect(isPrimitiveLike([])).toBe(false)
    class MyClass {}
    expect(isPrimitiveLike(new MyClass())).toBe(false)
  })
})
