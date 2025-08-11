import type { PrimitiveLike } from '../types'

/**
 * Check if a value is a primitive type
 */
export function isPrimitiveLike(value: unknown): value is PrimitiveLike {
  return (
    value === null
    || value === undefined
    || typeof value === 'string'
    || typeof value === 'number'
    || typeof value === 'boolean'
    || typeof value === 'bigint'
    || typeof value === 'symbol'
    || typeof value === 'function'
    || value instanceof Date
  )
}
