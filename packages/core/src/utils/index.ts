import type { FFNVArrayValue, FFNVObjectValue, FFNVPrimitiveValue, FFNVValue, FNVValue } from '../types'
import { isPlainObject } from './is-plain-object'
import { isPrimitiveLike } from './is-primitive-like'

export * from './array-contains'
export * from './deep-get-object-value'
export * from './deep-set-object-value'
export * from './flatten-object'
export * from './flatten-object-leaves'
export * from './is-equal'
export * from './is-plain-object'
export * from './is-primitive-like'
export * from './parse-flattened-object-key-segments'
export * from './serialize'

export function isFNVValue(value: unknown): value is FNVValue {
  return isFFNVObjectValue(value)
}

export function isFFNVValue(value: unknown): value is FFNVValue {
  return isFFNVPrimitiveValue(value) || isFFNVObjectValue(value) || isFFNVArrayValue(value)
}

export function isFFNVPrimitiveValue(value: unknown): value is FFNVPrimitiveValue {
  return isPrimitiveLike(value) && typeof value !== 'function'
}

export function isFFNVObjectValue(value: unknown): value is FFNVObjectValue {
  return isPlainObject(value) && Object.entries(value).every(([key, val]) => typeof key === 'string' && (isFFNVPrimitiveValue(val) || isFFNVObjectValue(val) || isFFNVArrayValue(val)))
}

export function isFFNVArrayValue(value: unknown): value is FFNVArrayValue {
  return Array.isArray(value) && value.every(item => isFFNVPrimitiveValue(item) || isFFNVObjectValue(item) || isFFNVArrayValue(item))
}
