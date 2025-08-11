/* eslint-disable ts/no-empty-object-type */
import type { IsOptionalProperty, PrimitiveLike, Simplify, UnionToIntersection } from '../types'
import { isPlainObject } from './is-plain-object'
import { isPrimitiveLike } from './is-primitive-like'

// Add depth limit to prevent infinite recursion
type MaxDepth = 10

type FlattenObjectHelper<
  T,
  P extends string = '',
  D extends readonly unknown[] = [],
  IsPathOptional extends boolean = false,
> = D['length'] extends MaxDepth
  ? never
  : T extends PrimitiveLike
    ? P extends ''
      ? {}
      : { [K in P]: IsPathOptional extends true ? T | undefined : T }
    : T extends readonly (infer U)[]
      ? (P extends '' ? {} : { [K in P]: IsPathOptional extends true ? T | undefined : T }) & FlattenObjectHelper<U, `${P}[${number}]`, [...D, unknown], IsPathOptional>
      : T extends Record<string, any>
        ? (P extends '' ? {} : { [K in P]: IsPathOptional extends true ? T | undefined : T }) & UnionToIntersection<{
          [K in keyof T]-?:
          Exclude<T[K], undefined> extends readonly (infer ArrayU)[]
            ? { [Key in P extends '' ? `${K & string}` : `${P}.${K & string}`]: T[K] } & FlattenObjectHelper<ArrayU, P extends '' ? `${K & string}[${number}]` : `${P}.${K & string}[${number}]`, [...D, unknown], (IsOptionalProperty<T, K> extends true ? true : false)>
            : Exclude<T[K], undefined> extends Record<string, any>
              ? { [Key in P extends '' ? `${K & string}` : `${P}.${K & string}`]: T[K] } & FlattenObjectHelper<Exclude<T[K], undefined>, P extends '' ? `${K & string}` : `${P}.${K & string}`, [...D, unknown], (IsOptionalProperty<T, K> extends true ? true : false)>
              : { [Key in P extends '' ? `${K & string}` : `${P}.${K & string}`]: IsOptionalProperty<T, K> extends true ? T[K] | undefined : T[K] }
        }[keyof T]>
        : {}

/**
 * Utility type that recursively flattens ALL nested structures into dot-notation keys
 * Unlike FlattenLeaves, this includes intermediate objects and arrays with their actual types
 */
export type FlattenObject<T> = Simplify<{
  [K in keyof FlattenObjectHelper<T> as FlattenObjectHelper<T>[K] extends never ? never : K]: FlattenObjectHelper<T>[K]
}>

/**
 * Flatten a nested object with arrays, creating entries for ALL levels (objects, arrays, and primitives)
 * @param obj - The object to flatten
 * @returns A flattened object with dot-notation keys including intermediate objects and arrays
 */
export function flattenObject<T extends Record<string, any>>(obj: T): FlattenObject<T> {
  if (!isPlainObject(obj)) {
    throw new TypeError('flattenObject() only accepts plain objects')
  }

  const seen = new Set()
  function flattenObjectHelper(obj: unknown, prefix: string = '', result: Record<string, any> = {}): Record<string, any> {
    // Handle circular references
    if (typeof obj === 'object' && obj !== null) {
      if (seen.has(obj)) {
        throw new TypeError(`flattenObject(): circular structure detected at "${prefix}"`)
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

    // Handle arrays - include the array itself AND flatten each element
    if (Array.isArray(obj)) {
      // Include the array itself if it has a prefix (not root)
      if (prefix !== '') {
        result[prefix] = obj
      }

      // Flatten each array element
      obj.forEach((item, index) => {
        const arrayPrefix = `${prefix}[${index}]`
        flattenObjectHelper(item, arrayPrefix, result)
      })
      return result
    }

    // Handle objects - include the object itself AND flatten its properties
    if (isPlainObject(obj)) {
      // Include the object itself if it has a prefix (not root)
      if (prefix !== '') {
        result[prefix] = obj
      }

      const objRecord = obj
      for (const key in objRecord) {
        if (Object.prototype.hasOwnProperty.call(objRecord, key)) {
          const value = objRecord[key]
          const newPrefix = prefix === '' ? key : `${prefix}.${key}`
          flattenObjectHelper(value, newPrefix, result)
        }
      }
    }

    // Clear the seen set after processing
    if (prefix === '') {
      seen.clear()
    }

    return result
  }

  return flattenObjectHelper(obj) as FlattenObject<T>
}

type _X = FlattenObject<{
  name: string
  age: number
  address: {
    streetLines: string[]
    city: string
  }
  hobbies: { name: string }[]
}>

type _flat = FlattenObject<{
  user?: { address: { streetLines?: { street: string }[], city: string } }
}>
