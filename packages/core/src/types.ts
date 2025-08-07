/* eslint-disable ts/no-empty-object-type, ts/no-unsafe-function-type */

/**
 * Standard primitive types
 */
export type Primitive = string | number | boolean | bigint | symbol | null | undefined

/**
 * Primitive types, including Date and Function
 */
export type PrimitiveLike = Primitive | Date | Function

/**
 * Convert a union type to an intersection type
 * @template U - Union type
 */
export type UnionToIntersection<U> = (U extends any ? (arg: U) => void : never) extends (arg: infer I) => void ? I : never

/**
 * Detect if property K of T is optional
 * @template T - Object type
 * @template K - Property key
 */
export type IsOptionalObjectKey<T, K extends keyof T> = {} extends Pick<T, K> ? true : false

/**
 * Check if a value is a plain object
 * @template T - Object type
 */
export type IsPlainObject<T> = T extends object
  ? T extends any[] | Function | Date | RegExp | Map<any, any> | Set<any> | WeakMap<any, any> | WeakSet<any> | Promise<any>
    ? false
    : T extends Record<string | number, any>
      ? true
      : false
  : false

/**
 * Deep merge a union of objects
 * @template T - Union of objects
 */
export type DeepMergeUnionObject<T> = DeepMergeUnionObjectHelper<UnionToIntersection<T>>
type DeepMergeUnionObjectHelper<T> = Simplify<{
  [K in keyof T]: IsPlainObject<T[K]> extends true
    ? DeepMergeUnionObjectHelper<T[K]>
    : T[K];
}>

export type LooseObject<T> = T extends object
  ? {
    [K in keyof T]: T[K] extends object
      ? LooseObject<T[K]>
      : T[K];
  } & { [K: PropertyKey]: any }
  : T

export type Simplify<T> = { [KeyType in keyof T]: T[KeyType] } & {}
