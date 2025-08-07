import { describe, expect, it } from 'vitest'
import { set } from '../../src/utils/set'

describe('set', () => {
  it('sets a top-level property', () => {
    const obj: any = {}
    set(obj, 'foo', 'bar')
    expect(obj).toEqual({ foo: 'bar' })
  })

  it('sets a nested property using dot notation', () => {
    const obj: any = {}
    set(obj, 'foo.bar.baz', 42)
    expect(obj).toEqual({ foo: { bar: { baz: 42 } } })
  })

  it('creates arrays when path includes numeric keys', () => {
    const obj: any = {}
    set(obj, 'items[0].value', 'x')
    expect(obj).toEqual({ items: [{ value: 'x' }] })
  })

  it('handles mixed dot and bracket notation', () => {
    const obj: any = {}
    set(obj, 'a[0].b.c[1]', true)
    // eslint-disable-next-line no-sparse-arrays
    expect(obj).toEqual({ a: [{ b: { c: [, true] } }] }) // note: [ , true ] means first item is empty
  })

  it('overwrites existing primitive with nested object', () => {
    const obj: any = { foo: 'string' }
    set(obj, 'foo.bar', 123)
    expect(obj).toEqual({ foo: { bar: 123 } })
  })

  it('sets value at deeply nested object with existing structure', () => {
    const obj: any = { foo: { bar: { baz: 1 } } }
    set(obj, 'foo.bar.qux', 'test')
    expect(obj).toEqual({ foo: { bar: { baz: 1, qux: 'test' } } })
  })

  it('handles setting empty string as value', () => {
    const obj: any = {}
    set(obj, 'x.y', '')
    expect(obj).toEqual({ x: { y: '' } })
  })

  it('can override array index directly', () => {
    const obj: any = { list: ['a'] }
    set(obj, 'list[0]', 'z')
    expect(obj).toEqual({ list: ['z'] })
  })

  it('does not modify input when path is empty', () => {
    const obj = { unchanged: true }
    set(obj, '', 'value')
    expect(obj).toEqual({ unchanged: true }) // nothing should change
  })

  it('supports setting numeric keys as object properties', () => {
    const obj: any = {}
    set(obj, '1.2.3', 'value')
    expect(obj).toEqual({ 1: { 2: { 3: 'value' } } }) // not treated as array
  })
})
