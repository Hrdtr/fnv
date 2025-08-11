import { describe, expect, it } from 'vitest'
import { isPlainObject } from '../../src/utils'

describe('isPlainObject', () => {
  it('should return true for plain objects', () => {
    expect(isPlainObject({})).toBe(true)
    expect(isPlainObject({ a: 1, b: 'hello' })).toBe(true)
    expect(isPlainObject(Object.create(null))).toBe(true)
  })

  it('should return false for non-objects', () => {
    expect(isPlainObject(1)).toBe(false)
    expect(isPlainObject('hello')).toBe(false)
    expect(isPlainObject(true)).toBe(false)
    expect(isPlainObject(null)).toBe(false)
    expect(isPlainObject(undefined)).toBe(false)
  })

  it('should return false for instances of classes', () => {
    class MyClass {}
    expect(isPlainObject(new MyClass())).toBe(false)
  })

  it('should return false for arrays', () => {
    expect(isPlainObject([])).toBe(false)
  })

  it('should return false for functions', () => {
    expect(isPlainObject(() => {})).toBe(false)
  })

  it('should return false for objects with a Symbol.toStringTag', () => {
    const obj = { [Symbol.toStringTag]: 'Custom' }
    expect(isPlainObject(obj)).toBe(false)
  })

  it('should return false for objects with a Symbol.iterator', () => {
    const obj = { [Symbol.iterator]: () => {} }
    expect(isPlainObject(obj)).toBe(false)
  })

  it('should return false for objects with a custom prototype', () => {
    const proto = { custom: true }
    const obj = Object.create(proto)
    expect(isPlainObject(obj)).toBe(false)
  })
})
