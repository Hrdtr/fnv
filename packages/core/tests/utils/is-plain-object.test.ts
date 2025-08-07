import { describe, expect, it } from 'vitest'
import { isPlainObject } from '../../src/utils/is-plain-object'

describe('isPlainObject', () => {
  it('returns true for plain object literals', () => {
    expect(isPlainObject({})).toBe(true)
    expect(isPlainObject({ a: 1, b: 'test' })).toBe(true)
  })

  it('returns true for Object.create(null)', () => {
    const obj = Object.create(null)
    obj.a = 1
    expect(isPlainObject(obj)).toBe(true)
  })

  it('returns false for arrays', () => {
    expect(isPlainObject([])).toBe(false)
    expect(isPlainObject([1, 2, 3])).toBe(false)
  })

  it('returns false for null', () => {
    expect(isPlainObject(null)).toBe(false)
  })

  it('returns false for functions', () => {
    expect(isPlainObject(() => {})).toBe(false)
    expect(isPlainObject(() => {})).toBe(false)
  })

  it('returns false for class instances', () => {
    class MyClass {
      x = 1
    }
    expect(isPlainObject(new MyClass())).toBe(false)
  })

  it('returns false for built-in objects like Date, RegExp, Map, Set', () => {
    expect(isPlainObject(new Date())).toBe(false)
    expect(isPlainObject(/abc/)).toBe(false)
    expect(isPlainObject(new Map())).toBe(false)
    expect(isPlainObject(new Set())).toBe(false)
  })

  it('returns false for primitive types', () => {
    expect(isPlainObject(123)).toBe(false)
    expect(isPlainObject('string')).toBe(false)
    expect(isPlainObject(true)).toBe(false)
    expect(isPlainObject(undefined)).toBe(false)
    expect(isPlainObject(Symbol('s'))).toBe(false)
    expect(isPlainObject(BigInt(123))).toBe(false)
  })

  it('returns false for objects with custom constructors', () => {
    function Custom() {
      // @ts-expect-error test
      this.x = 1
    }
    const instance = new (Custom as any)()
    expect(isPlainObject(instance)).toBe(false)
  })

  it('returns true for plain object with no constructor property', () => {
    const obj = { a: 1 }
    delete (obj as any).constructor
    expect(isPlainObject(obj)).toBe(true)
  })

  // There's no safe, complete, runtime way to distinguish a Proxy from a plain object
  // it('returns false for proxy objects', () => {
  //   const target = {}
  //   const proxy = new Proxy(target, {})
  //   expect(isPlainObject(proxy)).toBe(false)
  // })
})
