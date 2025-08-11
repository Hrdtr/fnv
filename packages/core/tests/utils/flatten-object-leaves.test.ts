import { describe, expect, it } from 'vitest'
import { flattenObjectLeaves } from '../../src/utils/flatten-object-leaves'

describe('flattenObjectLeaves', () => {
  it('should flatten a simple object', () => {
    const obj = { a: 1, b: { c: 2 } }
    expect(flattenObjectLeaves(obj)).toEqual({ 'a': 1, 'b.c': 2 })
  })

  it('should handle nested objects', () => {
    const obj = { a: { b: { c: 1, d: 2 } }, e: 3 }
    expect(flattenObjectLeaves(obj)).toEqual({ 'a.b.c': 1, 'a.b.d': 2, 'e': 3 })
  })

  it('should handle arrays', () => {
    const obj = { a: [1, 2, { b: 3 }] }
    expect(flattenObjectLeaves(obj)).toEqual({ 'a[0]': 1, 'a[1]': 2, 'a[2].b': 3 })
  })

  it('should handle nested arrays', () => {
    const obj = { a: [[1, 2], [3, 4]] }
    expect(flattenObjectLeaves(obj)).toEqual({ 'a[0][0]': 1, 'a[0][1]': 2, 'a[1][0]': 3, 'a[1][1]': 4 })
  })

  it('should handle a mix of objects and arrays', () => {
    const obj = { a: { b: [1, { c: 2 }] }, d: 3 }
    expect(flattenObjectLeaves(obj)).toEqual({ 'a.b[0]': 1, 'a.b[1].c': 2, 'd': 3 })
  })

  it('should handle empty objects and arrays', () => {
    const obj = { a: {}, b: [] }
    expect(flattenObjectLeaves(obj)).toEqual({})
  })

  it('should handle null and undefined values', () => {
    const obj = { a: null, b: undefined, c: { d: null } }
    expect(flattenObjectLeaves(obj)).toEqual({ 'a': null, 'b': undefined, 'c.d': null })
  })

  it('should throw an error for circular references', () => {
    const obj: any = { a: 1 }
    obj.b = obj
    expect(() => flattenObjectLeaves(obj)).toThrowError(TypeError)
  })

  it('should throw an error if input is not a plain object', () => {
    // @ts-expect-error passing invalid object
    expect(() => flattenObjectLeaves('string')).toThrowError(TypeError)
    // @ts-expect-error passing invalid object
    expect(() => flattenObjectLeaves(123)).toThrowError(TypeError)
    // @ts-expect-error passing invalid object
    expect(() => flattenObjectLeaves(null)).toThrowError(TypeError)
    // @ts-expect-error passing invalid object
    expect(() => flattenObjectLeaves(undefined)).toThrowError(TypeError)
  })
})
