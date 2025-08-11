/* eslint-disable ts/no-empty-object-type, ts/no-unsafe-function-type */
export type FFNVValue = FFNVPrimitiveValue | FFNVObjectValue | FFNVArrayValue
export type IsFFNVValue<T> = T extends FFNVValue ? true : false

export type FFNVPrimitiveValue = Primitive | Date
export type IsFFNVPrimitiveValue<T> = T extends FFNVPrimitiveValue ? true : false

// eslint-disable-next-line ts/consistent-type-definitions
export type FFNVObjectValue = { [key: string]: FFNVValue | FFNVObjectValue | FFNVArrayValue }
export type IsFFNVObjectValue<T> = T extends FFNVObjectValue ? true : false

export type FFNVArrayValue = FFNVValue[] | FFNVObjectValue[] | FFNVArrayValue[]
export type IsFFNVArrayValue<T> = T extends FFNVArrayValue ? true : false

export type FNVValue = FFNVObjectValue
export type IsFNVValue<T> = T extends FNVValue ? true : false

// Utility types

export type Primitive = string | number | boolean | bigint | symbol | null | undefined
export type IsPrimitive<T> = T extends Primitive ? true : false

export type PrimitiveLike = Primitive | Date | Function
export type IsPrimitiveLike<T> = T extends PrimitiveLike ? true : false

export type PrimitiveOf<T>
  = T extends string ? string
    : T extends number ? number
      : T extends boolean ? boolean
        : T extends bigint ? bigint
          : T extends symbol ? symbol
            : T extends null ? null
              : T extends undefined ? undefined
                : T

export type Loose<T extends { [Key: PropertyKey]: any }> = T & {
  [K in PrimitiveOf<keyof T>]?: any;
}

export type LooseDeep<T extends { [Key: PropertyKey]: any }> = {
  [K in keyof T]: T[K] extends { [Key: PropertyKey]: any }[]
    ? LooseDeep<T[K][number]>[]
    : T[K] extends { [Key: PropertyKey]: any }
      ? LooseDeep<T[K]>
      : T[K]
} & {
  [K in PrimitiveOf<keyof T>]?: any;
}

/**
 * Convert a union type to an intersection type
 * @template T - Union type
 */
export type UnionToIntersection<T>
  = (T extends unknown ? (distributedUnion: T) => void : never) extends ((mergedIntersection: infer Intersection) => void)
    ? Intersection & T
    : never

export type Simplify<T> = { [K in keyof T]: T[K] } & {}

export type ConditionalSimplifyDeep<T, Exclude = never, Include = unknown> = T extends Exclude
  ? T
  : T extends Include
    ? { [K in keyof T]: ConditionalSimplifyDeep<T[K], Exclude, Include> }
    : T

export type BuiltIns = Primitive | void | Date | RegExp

export type NonRecursive = BuiltIns | Function | (new (...arguments_: any[]) => unknown)

export type SimplifyDeep<T, Exclude = never> = ConditionalSimplifyDeep<T, Exclude | NonRecursive | Set<unknown> | Map<unknown, unknown>, object>

/**
 * Detect if property K of T is optional
 * @template Object - Object type
 * @template Key - Property key
 */
export type IsOptionalProperty<T, K extends keyof T> = {} extends Pick<T, K> ? true : false
