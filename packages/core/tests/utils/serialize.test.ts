import { describe, expect, it } from 'vitest'
import { serialize } from '../../src/utils'

describe('serialize', () => {
  it('should serialize null', () => {
    expect(serialize(null)).toBe('null')
  })

  it('should serialize undefined', () => {
    expect(serialize(undefined)).toBe('undefined')
  })

  it('should serialize string', () => {
    expect(serialize('hello')).toBe('\'hello\'')
  })

  it('should serialize number', () => {
    expect(serialize(123)).toBe('123')
  })

  it('should serialize boolean', () => {
    expect(serialize(true)).toBe('true')
  })

  it('should serialize bigint', () => {
    expect(serialize(123n)).toBe('123n')
  })

  it('should serialize symbol', () => {
    expect(serialize(Symbol('test'))).toBe('Symbol(test)')
  })

  it('should serialize function', () => {
    const fn = () => {}
    expect(serialize(fn)).toBe('fn(0)() => {}')
  })

  it('should serialize object', () => {
    expect(serialize({ a: 1, b: 'hello' })).toBe('{a:1,b:\'hello\'}')
  })

  it('should serialize array', () => {
    expect(serialize([1, 'hello', { a: 1 }])).toBe('[1,\'hello\',{a:1}]')
  })

  it('should serialize Date', () => {
    const date = new Date('2024-01-01T00:00:00.000Z')
    expect(serialize(date)).toBe('Date(2024-01-01T00:00:00.000Z)')
  })

  it('should serialize ArrayBuffer', () => {
    const buffer = new ArrayBuffer(3)
    const view = new Uint8Array(buffer)
    view[0] = 1
    view[1] = 2
    view[2] = 3
    expect(serialize(buffer)).toBe('ArrayBuffer[1,2,3]')
  })

  it('should serialize Set', () => {
    const set = new Set([1, 'hello', { a: 1 }])
    expect(serialize(set)).toBe('Set[{a:1},1,\'hello\']')
  })

  it('should serialize Map', () => {
    const map = new Map<any, any>([[1, 'hello'], ['a', { a: 1 }]])
    expect(serialize(map)).toBe('Map{1:\'hello\',a:{a:1}}')
  })

  it('should serialize Error', () => {
    expect(serialize(new Error('test'))).toBe('Error(Error: test)')
  })

  it('should serialize RegExp', () => {
    expect(serialize(/abc/g)).toBe('RegExp(/abc/g)')
  })

  it('should serialize URL', () => {
    expect(serialize(new URL('https://example.com'))).toBe('URL(https://example.com/)')
  })

  it('should serialize Uint8Array', () => {
    const arr = new Uint8Array([1, 2, 3])
    expect(serialize(arr)).toBe('Uint8Array[1,2,3]')
  })

  it('should serialize BigInt64Array', () => {
    const arr = new BigInt64Array([1n, 2n, 3n])
    expect(serialize(arr)).toBe('BigInt64Array[1n,2n,3n]')
  })
})
