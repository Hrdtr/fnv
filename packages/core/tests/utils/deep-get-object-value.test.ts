import { describe, expect, it } from 'vitest'
import { deepGetObjectValue } from '../../src/utils/deep-get-object-value'

describe('deepGetObjectValue', () => {
  it('should return the value at the specified path', () => {
    const obj = { a: { b: { c: 1 } } }
    expect(deepGetObjectValue(obj, 'a.b.c')).toBe(1)
  })

  it('should return undefined if the path does not exist', () => {
    const obj = { a: { b: { c: 1 } } }
    // @ts-expect-error test invalid path
    expect(deepGetObjectValue(obj, 'a.b.d')).toBe(undefined)
  })

  it('should return undefined if the object is null or undefined', () => {
    // @ts-expect-error test invalid object
    expect(deepGetObjectValue(null, 'a.b.c')).toBe(undefined)
    // @ts-expect-error test invalid object
    expect(deepGetObjectValue(undefined, 'a.b.c')).toBe(undefined)
  })

  it('should handle paths with array indices', () => {
    const obj = { a: [{ b: 1 }, { b: 2 }] }
    expect(deepGetObjectValue(obj, 'a[0].b')).toBe(1)
    expect(deepGetObjectValue(obj, 'a[1].b')).toBe(2)
  })

  it('should handle empty path', () => {
    const obj = { a: { b: { c: 1 } } }
    // @ts-expect-error test empty path
    expect(deepGetObjectValue(obj, '')).toBe(obj)
  })

  it('should handle path with only one key', () => {
    const obj = { a: 1 }
    expect(deepGetObjectValue(obj, 'a')).toBe(1)
  })

  it('should handle a path that leads to null or undefined', () => {
    const obj = { a: { b: null } }
    expect(deepGetObjectValue(obj, 'a.b')).toBe(null)

    const obj2 = { a: { b: undefined } }
    expect(deepGetObjectValue(obj2, 'a.b')).toBe(undefined)
  })
})
