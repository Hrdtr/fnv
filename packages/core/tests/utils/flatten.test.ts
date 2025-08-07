import { describe, expect, it } from 'vitest'
import { flatten } from '../../src/utils/flatten'

describe('flatten()', () => {
  it('flattens a basic object with primitives', () => {
    const input = {
      name: 'Alice',
      age: 30,
      active: true,
    }

    const result = flatten(input)

    expect(result).toEqual({
      name: 'Alice',
      age: 30,
      active: true,
    })
  })

  it('flattens nested objects', () => {
    const input = {
      user: {
        name: 'Bob',
        address: {
          city: 'NYC',
          zip: 10001,
        },
      },
    }

    const result = flatten(input)

    expect(result).toEqual({
      'user.name': 'Bob',
      'user.address.city': 'NYC',
      'user.address.zip': 10001,
    })
  })

  it('flattens arrays with index notation', () => {
    const input = {
      items: [1, 2, 3],
    }

    const result = flatten(input)

    expect(result).toEqual({
      'items[0]': 1,
      'items[1]': 2,
      'items[2]': 3,
    })
  })

  it('flattens nested arrays inside objects', () => {
    const input = {
      user: {
        name: 'Carol',
        tags: ['a', 'b'],
      },
    }

    const result = flatten(input)

    expect(result).toEqual({
      'user.name': 'Carol',
      'user.tags[0]': 'a',
      'user.tags[1]': 'b',
    })
  })

  it('flattens array of objects', () => {
    const input = {
      users: [
        { name: 'A' },
        { name: 'B' },
      ],
    }

    const result = flatten(input)

    expect(result).toEqual({
      'users[0].name': 'A',
      'users[1].name': 'B',
    })
  })

  it('handles Date and Function as leaf values', () => {
    const fn = () => {}
    const input = {
      created: new Date('2020-01-01'),
      callback: fn,
    }

    const result = flatten(input)

    expect(result).toEqual({
      created: input.created,
      callback: fn,
    })
  })

  it('handles null and undefined', () => {
    const input = {
      name: null,
      value: undefined,
    }

    const result = flatten(input)

    expect(result).toEqual({
      name: null,
      value: undefined,
    })
  })

  it('flattens deeply nested mix of arrays and objects', () => {
    const input = {
      settings: {
        themes: [
          { name: 'dark', active: true },
          { name: 'light', active: false },
        ],
      },
    }

    const result = flatten(input)

    expect(result).toEqual({
      'settings.themes[0].name': 'dark',
      'settings.themes[0].active': true,
      'settings.themes[1].name': 'light',
      'settings.themes[1].active': false,
    })
  })

  it('throws on non-plain-object inputs', () => {
    expect(() => flatten(new (class Test {})())).toThrow(TypeError)

    expect(() => (flatten as any)(null)).toThrow(TypeError)
    expect(() => (flatten as any)([])).toThrow(TypeError)
    expect(() => (flatten as any)('str')).toThrow(TypeError)
    expect(() => (flatten as any)(123)).toThrow(TypeError)
  })

  it('throws on circular references', () => {
    const obj: any = { name: 'circular' }
    obj.self = obj

    expect(() => (flatten as any)(obj)).toThrow(/circular structure detected/)
  })

  it('handles optional object keys', () => {
    const input: {
      name?: string
      details?: {
        age?: number
      }
    } = {
      name: 'John',
    }

    const result = flatten(input)

    expect(result).toEqual({
      name: 'John',
    })
  })

  it('resets seen set per invocation', () => {
    const a = { value: 1 }
    const b = { value: 2 }

    flatten(a)
    expect(() => flatten({ b, self: b })).not.toThrow()
  })
})
