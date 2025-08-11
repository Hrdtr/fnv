import { describe, expect, it } from 'vitest'
import { isEqual } from '../../src/utils'

describe('isEqual', () => {
  it('should return true for identical primitives', () => {
    expect(isEqual(1, 1)).toBe(true)
    expect(isEqual('hello', 'hello')).toBe(true)
    expect(isEqual(true, true)).toBe(true)
    expect(isEqual(null, null)).toBe(true)
    expect(isEqual(undefined, undefined)).toBe(true)
    const sym = Symbol('test')
    expect(isEqual(sym, sym)).toBe(true)
  })

  it('should return true for deeply equal objects', () => {
    const obj1 = { a: 1, b: { c: 'hello' } }
    const obj2 = { a: 1, b: { c: 'hello' } }
    expect(isEqual(obj1, obj2)).toBe(true)
  })

  it('should return true for deeply equal arrays', () => {
    const arr1 = [1, 'hello', { a: 1 }]
    const arr2 = [1, 'hello', { a: 1 }]
    expect(isEqual(arr1, arr2)).toBe(true)
  })

  it('should return false for different primitives', () => {
    expect(isEqual(1, 2)).toBe(false)
    expect(isEqual('hello', 'world')).toBe(false)
    expect(isEqual(true, false)).toBe(false)
    expect(isEqual(null, undefined)).toBe(false)
  })

  it('should return false for different objects', () => {
    const obj1 = { a: 1, b: { c: 'hello' } }
    const obj2 = { a: 1, b: { c: 'world' } }
    expect(isEqual(obj1, obj2)).toBe(false)
  })

  it('should return false for different arrays', () => {
    const arr1 = [1, 'hello', { a: 1 }]
    const arr2 = [1, 'world', { a: 1 }]
    expect(isEqual(arr1, arr2)).toBe(false)
  })

  it('should return false for objects with different keys', () => {
    const obj1 = { a: 1, b: 2 }
    const obj2 = { a: 1, c: 2 }
    expect(isEqual(obj1, obj2)).toBe(false)
  })

  it('should return false for different types', () => {
    expect(isEqual(1, '1')).toBe(false)
    expect(isEqual({}, [])).toBe(false)
    expect(isEqual(null, 0)).toBe(false)
  })

  it('should handle circular references', () => {
    const obj1: any = { a: 1 }
    obj1.b = obj1
    const obj2: any = { a: 1 }
    obj2.b = obj2
    expect(isEqual(obj1, obj2)).toBe(true)

    const obj3: any = { a: 1 }
    obj3.b = obj3
    const obj4 = { a: 1 }
    expect(isEqual(obj3, obj4)).toBe(false)
  })
})
