import { describe, expect, it } from 'vitest'
import { deepSetObjectValue } from '../../src/utils/deep-set-object-value'

describe('deepSetObjectValue', () => {
  it('should set the value at the specified path', () => {
    const obj = { a: { b: { c: 1 } } }
    deepSetObjectValue(obj, 'a.b.c', 2)
    expect(obj).toEqual({ a: { b: { c: 2 } } })
  })

  it('should create intermediate objects if they do not exist', () => {
    const obj = {}
    deepSetObjectValue(obj, 'a.b.c', 1)
    expect(obj).toEqual({ a: { b: { c: 1 } } })
  })

  it('should handle paths with array indices', () => {
    const obj = { a: [] }
    deepSetObjectValue(obj, 'a[0].b', 1)
    expect(obj).toEqual({ a: [{ b: 1 }] })
  })

  it('should handle empty path', () => {
    const obj = { a: { b: { c: 1 } } }
    deepSetObjectValue(obj, '', 2)
    expect(obj).toEqual({ a: { b: { c: 1 } } }) // Should not modify the object
  })

  it('should handle path with only one key', () => {
    const obj = {}
    deepSetObjectValue(obj, 'a', 1)
    expect(obj).toEqual({ a: 1 })
  })

  it('should not modify the object if it is not a plain object', () => {
    const obj = null
    // @ts-expect-error testing null
    deepSetObjectValue(obj, 'a.b.c', 1)
    expect(obj).toBe(null)
  })

  it('should set value to null or undefined', () => {
    const obj = { a: { b: 1 } }
    deepSetObjectValue(obj, 'a.b', null)
    expect(obj).toEqual({ a: { b: null } })

    const obj2 = { a: { b: 1 } }
    deepSetObjectValue(obj2, 'a.b', undefined)
    expect(obj2).toEqual({ a: { b: undefined } })
  })
})
