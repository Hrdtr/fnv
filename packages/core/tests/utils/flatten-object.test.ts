import { describe, expect, it } from 'vitest'
import { flattenObject } from '../../src/utils/flatten-object'

describe('flattenObject', () => {
  it('should flatten a simple object', () => {
    const obj = { a: 1, b: { c: 2 } }
    expect(flattenObject(obj)).toEqual({ 'a': 1, 'b': { c: 2 }, 'b.c': 2 })
  })

  it('should handle nested objects', () => {
    const obj = { a: { b: { c: 1, d: 2 } }, e: 3 }
    expect(flattenObject(obj)).toEqual({ 'a': { b: { c: 1, d: 2 } }, 'a.b': { c: 1, d: 2 }, 'a.b.c': 1, 'a.b.d': 2, 'e': 3 })
  })

  it('should handle arrays', () => {
    const obj = { a: [1, 2, { b: 3 }] }
    expect(flattenObject(obj)).toEqual({ 'a': [1, 2, { b: 3 }], 'a[0]': 1, 'a[1]': 2, 'a[2]': { b: 3 }, 'a[2].b': 3 })
  })

  it('should handle nested arrays', () => {
    const obj = { a: [[1, 2], [3, 4]] }
    expect(flattenObject(obj)).toEqual({ 'a': [[1, 2], [3, 4]], 'a[0]': [1, 2], 'a[0][0]': 1, 'a[0][1]': 2, 'a[1]': [3, 4], 'a[1][0]': 3, 'a[1][1]': 4 })
  })

  it('should handle a mix of objects and arrays', () => {
    const obj = { a: { b: [1, { c: 2 }] }, d: 3 }
    expect(flattenObject(obj)).toEqual({ 'a': { b: [1, { c: 2 }] }, 'a.b': [1, { c: 2 }], 'a.b[0]': 1, 'a.b[1]': { c: 2 }, 'a.b[1].c': 2, 'd': 3 })
  })

  it('should handle empty objects and arrays', () => {
    const obj = { a: {}, b: [] }
    expect(flattenObject(obj)).toEqual({ a: {}, b: [] })
  })

  it('should handle null and undefined values', () => {
    const obj = { a: null, b: undefined, c: { d: null } }
    expect(flattenObject(obj)).toEqual({ 'a': null, 'b': undefined, 'c': { d: null }, 'c.d': null })
  })

  it('should throw an error for circular references', () => {
    const obj: any = { a: 1 }
    obj.b = obj
    expect(() => flattenObject(obj)).toThrowError(TypeError)
  })

  it('should throw an error if input is not a plain object', () => {
    expect(() => flattenObject('string' as any)).toThrowError(TypeError)
    expect(() => flattenObject(123 as any)).toThrowError(TypeError)
    expect(() => flattenObject(null as any)).toThrowError(TypeError)
    expect(() => flattenObject(undefined as any)).toThrowError(TypeError)
  })
})
