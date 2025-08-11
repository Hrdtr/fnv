/* eslint-disable ts/no-empty-object-type */
import type { IsOptionalProperty, PrimitiveLike, Simplify, UnionToIntersection } from '../types'
import { isPlainObject } from './is-plain-object'
import { isPrimitiveLike } from './is-primitive-like'

// Add depth limit to prevent infinite recursion
type MaxDepth = 10

/**
 * Internal helper that accumulates flattened key/value pairs with depth limiting
 * @template T - current type to flatten
 * @template P - prefix string for nested keys
 * @template D - current depth counter
 */
type FlattenObjectLeavesHelper<
  T,
  P extends string = '',
  D extends readonly unknown[] = [],
> = D['length'] extends MaxDepth
  ? never // Stop recursion at max depth
  : T extends PrimitiveLike
    ? P extends ''
      ? {}
      : { [key in P]: T }
    : T extends readonly (infer U)[] // Handle both arrays and readonly arrays
      ? FlattenObjectLeavesHelper<U, `${P}[${number}]`, [...D, unknown]>
      : T extends object
        ? FlattenObjectLeavesObjectHelper<T, P, D>
        : never

/**
 * Separate helper for object flattening to reduce complexity
 */
type FlattenObjectLeavesObjectHelper<
  T extends object,
  P extends string,
  D extends readonly unknown[],
> = {
  [K in keyof T]-?: K extends string | number
    ? T[K] extends readonly (infer U)[]
      ? FlattenObjectLeavesHelper<U, P extends '' ? `${K}[${number}]` : `${P}.${K}[${number}]`, [...D, unknown]>
      : T[K] extends PrimitiveLike
        ? {
            [key in P extends '' ? K : `${P}.${K}`]: IsOptionalProperty<T, K> extends true
              ? T[K] | undefined
              : T[K]
          }
        : FlattenObjectLeavesHelper<T[K], P extends '' ? `${K}` : `${P}.${K}`, [...D, unknown]>
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
 * Utility type that recursively flattens a nested object leaves type into dot-notation keys
 */
export type FlattenObjectLeaves<T> = Simplify<FilterLeafKeys<UnionToIntersection<FlattenObjectLeavesHelper<T>>>>

/**
 * Flatten a nested object & arrays leaves, creating entries for each child and array element
 * @param obj - The object to flatten
 * @returns A flattened object leaves with dot-notation keys and actual array indices
 */
export function flattenObjectLeaves<T extends Record<string | number, any>>(obj: T): FlattenObjectLeaves<T> {
  if (!isPlainObject(obj)) {
    throw new TypeError('flattenObjectLeaves() only accepts plain objects')
  }

  const seen = new Set()
  function flattenObjectLeavesHelper(obj: unknown, prefix: string = '', result: Record<string | number, any> = {}): Record<string | number, any> {
    // Handle circular references
    if (typeof obj === 'object' && obj !== null) {
      if (seen.has(obj)) {
        throw new TypeError(`flattenObjectLeaves(): circular structure detected at "${prefix}"`)
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
        flattenObjectLeavesHelper(item, arrayPrefix, result)
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
          flattenObjectLeavesHelper(value, newPrefix, result)
        }
      }
    }
    // Clear the seen set
    seen.clear()

    return result
  }

  return flattenObjectLeavesHelper(obj) as FlattenObjectLeaves<T>
}
