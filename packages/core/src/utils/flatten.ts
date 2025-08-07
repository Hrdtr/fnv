import type { IsOptionalObjectKey, PrimitiveLike, Simplify, UnionToIntersection } from '../types'
import { isPlainObject } from './is-plain-object'

// Add depth limit to prevent infinite recursion
type MaxDepth = 10

/**
 * Internal helper that accumulates flattened key/value pairs with depth limiting
 * @template T - current type to flatten
 * @template P - prefix string for nested keys
 * @template D - current depth counter
 */
type FlattenHelper<
  T,
  P extends string = '',
  D extends readonly unknown[] = [],
> = D['length'] extends MaxDepth
  ? never // Stop recursion at max depth
  : T extends PrimitiveLike
    ? P extends ''
      // eslint-disable-next-line ts/no-empty-object-type
      ? {}
      : { [key in P]: T }
    : T extends readonly (infer U)[] // Handle both arrays and readonly arrays
      ? FlattenHelper<U, `${P}[${number}]`, [...D, unknown]>
      : T extends object
        ? FlattenObjectHelper<T, P, D>
        : never

/**
 * Separate helper for object flattening to reduce complexity
 */
type FlattenObjectHelper<
  T extends object,
  P extends string,
  D extends readonly unknown[],
> = {
  [K in keyof T]-?: K extends string | number
    ? T[K] extends readonly (infer U)[]
      ? FlattenHelper<U, P extends '' ? `${K}[${number}]` : `${P}.${K}[${number}]`, [...D, unknown]>
      : T[K] extends PrimitiveLike
        ? {
            [key in P extends '' ? K : `${P}.${K}`]: IsOptionalObjectKey<T, K> extends true
              ? T[K] | undefined
              : T[K]
          }
        : FlattenHelper<T[K], P extends '' ? `${K}` : `${P}.${K}`, [...D, unknown]>
    : never
}[keyof T]

/**
 * Optimized filter that avoids complex conditional checks
 */
type FilterLeafKeys<T> = {
  [K in keyof T as T[K] extends undefined
    ? never
    : K extends `${string}.${string}` | `${string}[${number}]` | `${string}[${number}].${string}`
      ? K
      : T[K] extends PrimitiveLike
        ? K
        : never
  ]: T[K]
}

/**
 * Utility type that recursively flattens a nested object type into dot-notation keys
 *
 * Choose between implementations based on your needs:
 * - Use Flatten for the optimized version of your original approach
 * - Use FlattenV2 for a potentially more performant alternative
 */
export type Flatten<T> = Simplify<FilterLeafKeys<UnionToIntersection<FlattenHelper<T>>>>

/**
 * Check if a value is a primitive type
 */
function isPrimitiveLike(value: unknown): value is PrimitiveLike {
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

/**
 * Flatten a nested object with arrays, creating entries for each array element
 * @param obj - The object to flatten
 * @returns A flattened object with dot-notation keys and actual array indices
 */
export function flatten<T extends Record<string | number, any>>(obj: T): Flatten<T> {
  if (!isPlainObject(obj)) {
    throw new TypeError('flatten() only accepts plain objects')
  }

  const seen = new Set()
  function flattenHelper(obj: unknown, prefix: string = '', result: Record<string | number, any> = {}): Record<string | number, any> {
    // Handle circular references
    if (typeof obj === 'object' && obj !== null) {
      if (seen.has(obj)) {
        throw new TypeError(`flatten(): circular structure detected at "${prefix}"`)
      }
      seen.add(obj)
    }

    // Handle primitives
    if (isPrimitiveLike(obj)) {
      if (prefix !== '') {
        result[prefix] = obj
      }
      return result
    }

    // Handle arrays - flatten each element with its actual index
    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        const arrayPrefix = `${prefix}[${index}]`
        flattenHelper(item, arrayPrefix, result)
      })
      return result
    }

    // Handle objects
    if (isPlainObject(obj)) {
      const objRecord = obj
      for (const key in objRecord) {
        if (Object.prototype.hasOwnProperty.call(objRecord, key)) {
          const value = objRecord[key]
          const newPrefix = prefix === '' ? key : `${prefix}.${key}`
          flattenHelper(value, newPrefix, result)
        }
      }
    }

    // Clear the seen set
    seen.clear()

    return result
  }

  return flattenHelper(obj) as Flatten<T>
}
