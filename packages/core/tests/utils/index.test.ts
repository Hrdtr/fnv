import { describe, expect, it } from 'vitest'
import { isFFNVArrayValue, isFFNVObjectValue, isFFNVPrimitiveValue, isFFNVValue, isFNVValue } from '../../src/utils'

describe('isFNVValue', () => {
  it('should return true for FNVObjectValue', () => {
    expect(isFNVValue({ a: 1 })).toBe(true)
  })

  it('should return false for non-FNVObjectValue', () => {
    expect(isFNVValue(1)).toBe(false)
    expect(isFNVValue('string')).toBe(false)
    expect(isFNVValue([1, 2, 3])).toBe(false)
    expect(isFNVValue(null)).toBe(false)
    expect(isFNVValue(undefined)).toBe(false)
  })
})

describe('isFFNVValue', () => {
  it('should return true for FFNVPrimitiveValue', () => {
    expect(isFFNVValue(1)).toBe(true)
    expect(isFFNVValue('string')).toBe(true)
    expect(isFFNVValue(null)).toBe(true)
    expect(isFFNVValue(undefined)).toBe(true)
  })

  it('should return true for FFNVObjectValue', () => {
    expect(isFFNVValue({ a: 1 })).toBe(true)
  })

  it('should return true for FFNVArrayValue', () => {
    expect(isFFNVValue([1, 2, 3])).toBe(true)
  })

  it('should return false for non-FFNVValue', () => {
    expect(isFFNVValue(() => {})).toBe(false)
    expect(isFFNVValue(new Map())).toBe(false)
    expect(isFFNVValue(new Set())).toBe(false)
  })
})

describe('isFFNVPrimitiveValue', () => {
  it('should return true for primitive values', () => {
    expect(isFFNVPrimitiveValue(1)).toBe(true)
    expect(isFFNVPrimitiveValue('string')).toBe(true)
    expect(isFFNVPrimitiveValue(true)).toBe(true)
    expect(isFFNVPrimitiveValue(Symbol('test'))).toBe(true)
    expect(isFFNVPrimitiveValue(null)).toBe(true)
    expect(isFFNVPrimitiveValue(undefined)).toBe(true)
  })

  it('should return false for non-primitive values', () => {
    expect(isFFNVPrimitiveValue({})).toBe(false)
    expect(isFFNVPrimitiveValue([])).toBe(false)
    expect(isFFNVPrimitiveValue(() => {})).toBe(false)
  })
})

describe('isFFNVObjectValue', () => {
  it('should return true for plain objects with FFNVValues', () => {
    expect(isFFNVObjectValue({ a: 1, b: 'string' })).toBe(true)
    expect(isFFNVObjectValue({})).toBe(true)
  })

  it('should return false for non-plain objects', () => {
    expect(isFFNVObjectValue([])).toBe(false)
    expect(isFFNVObjectValue(null)).toBe(false)
    expect(isFFNVObjectValue(undefined)).toBe(false)
    expect(isFFNVObjectValue(1)).toBe(false)
    expect(isFFNVObjectValue('string')).toBe(false)
  })

  it('should return false for plain objects with non-FFNVValues', () => {
    expect(isFFNVObjectValue({ a: () => {} })).toBe(false)
    expect(isFFNVObjectValue({ a: null })).toBe(true)
    expect(isFFNVObjectValue({ a: undefined })).toBe(true)
  })
})

describe('isFFNVArrayValue', () => {
  it('should return true for arrays with FFNVValues', () => {
    expect(isFFNVArrayValue([1, 'string', { a: 1 }])).toBe(true)
    expect(isFFNVArrayValue([])).toBe(true)
  })

  it('should return false for non-arrays', () => {
    expect(isFFNVArrayValue({})).toBe(false)
    expect(isFFNVArrayValue(null)).toBe(false)
    expect(isFFNVArrayValue(undefined)).toBe(false)
    expect(isFFNVArrayValue(1)).toBe(false)
    expect(isFFNVArrayValue('string')).toBe(false)
  })

  it('should return false for arrays with non-FFNVValues', () => {
    expect(isFFNVArrayValue([() => {}])).toBe(false)
    expect(isFFNVArrayValue([null])).toBe(true)
    expect(isFFNVArrayValue([undefined])).toBe(true)
  })
})
