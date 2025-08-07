import type {
  DeepMergeUnionObject,
  IsOptionalObjectKey,
  IsPlainObject,
  LooseObject,
  Primitive,
  PrimitiveLike,
  Simplify,
  UnionToIntersection,
} from '../src/types'
import { describe, expectTypeOf, it } from 'vitest'

describe('primitive', () => {
  it('includes all standard primitives', () => {
    expectTypeOf<string>().toMatchTypeOf<Primitive>()
    expectTypeOf<number>().toMatchTypeOf<Primitive>()
    expectTypeOf<boolean>().toMatchTypeOf<Primitive>()
    expectTypeOf<null>().toMatchTypeOf<Primitive>()
    expectTypeOf<undefined>().toMatchTypeOf<Primitive>()
    expectTypeOf<symbol>().toMatchTypeOf<Primitive>()
    expectTypeOf<bigint>().toMatchTypeOf<Primitive>()
  })
})

describe('primitiveLike', () => {
  it('includes Primitive plus Date and Function', () => {
    expectTypeOf<Date>().toMatchTypeOf<PrimitiveLike>()
    expectTypeOf<() => void>().toMatchTypeOf<PrimitiveLike>()
    // eslint-disable-next-line ts/no-unsafe-function-type
    expectTypeOf<Function>().toMatchTypeOf<PrimitiveLike>()
  })
})

describe('unionToIntersection', () => {
  it('converts union to intersection', () => {
    type Input = { a: string } | { b: number }
    type Result = UnionToIntersection<Input>
    expectTypeOf<Result>().toEqualTypeOf<{ a: string } & { b: number }>()
  })
})

describe('isOptionalObjectKey', () => {
  interface Obj { a: string, b?: number }

  it('detects optional keys correctly', () => {
    expectTypeOf<IsOptionalObjectKey<Obj, 'a'>>().toEqualTypeOf<false>()
    expectTypeOf<IsOptionalObjectKey<Obj, 'b'>>().toEqualTypeOf<true>()
  })
})

describe('isPlainObject', () => {
  it('returns true for plain object', () => {
    expectTypeOf<IsPlainObject<{ x: number }>>().toEqualTypeOf<true>()
  })

  it('returns false for arrays and special objects', () => {
    expectTypeOf<IsPlainObject<string[]>>().toEqualTypeOf<false>()
    expectTypeOf<IsPlainObject<Date>>().toEqualTypeOf<false>()
    expectTypeOf<IsPlainObject<Map<any, any>>>().toEqualTypeOf<false>()
    expectTypeOf<IsPlainObject<() => void>>().toEqualTypeOf<false>()
    expectTypeOf<IsPlainObject<Promise<any>>>().toEqualTypeOf<false>()
  })
})

describe('deepMergeUnionObject', () => {
  it('deep merges a union of objects', () => {
    interface A { user: { name: string } }
    interface B { user: { age: number } }
    type Merged = DeepMergeUnionObject<A | B>
    expectTypeOf<Merged>().toEqualTypeOf<{ user: { name: string, age: number } }>()
  })
})

describe('simplify', () => {
  it('flattens type to single-level object', () => {
    type Input = { a: string } & { b: number }
    type Result = Simplify<Input>
    expectTypeOf<Result>().toEqualTypeOf<{ a: string, b: number }>()
  })
})

describe('looseObject', () => {
  it('allows indexing by any key while preserving known properties recursively', () => {
    interface Input {
      a: string
      b: {
        c: number
        d: {
          e: boolean
        }
      }
    }

    type Loose = LooseObject<Input>

    // Should have all known keys
    expectTypeOf<Loose>().toMatchTypeOf<{
      a: string
      b: {
        c: number
        d: {
          e: boolean
        }
      }
    }>()

    // Should allow arbitrary property access
    expectTypeOf<Loose>().toMatchTypeOf<Record<PropertyKey, any>>()

    // Should preserve nested structure
    expectTypeOf<Loose['b']['d']['e']>().toEqualTypeOf<boolean>()
  })

  it('should pass through primitives unchanged', () => {
    expectTypeOf<LooseObject<string>>().toEqualTypeOf<string>()
    expectTypeOf<LooseObject<number>>().toEqualTypeOf<number>()
  })

  it('should allow any keys at any level', () => {
    interface Input {
      foo: {
        bar: number
      }
    }

    type Loose = LooseObject<Input>

    // Known key still required to match correct type
    expectTypeOf<Loose['foo']['bar']>().toEqualTypeOf<number>()

    // Arbitrary keys allowed
    expectTypeOf<Loose['someRandomKey']>().toEqualTypeOf<any>()
    expectTypeOf<Loose['foo']['anotherRandomKey']>().toEqualTypeOf<any>()
  })
})
