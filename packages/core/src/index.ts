import type { StandardSchemaV1 } from '@standard-schema/spec'
import type { FFNVIssue, FFNVValidateFn } from './ffnv'
import type { FNVIssue, FNVValidateFn } from './fnv'
import z from 'zod'
import { F } from './f'
import { FF } from './ff'
import { FFNV } from './ffnv'
import { FNV } from './fnv'

export { F, FF, FFNV, FNV }
export type { FFNVIssue, FFNVValidateFn, FNVIssue, FNVValidateFn }

export function createFormField<Name extends string = string, T extends StandardSchemaV1 | any = any, U = T extends StandardSchemaV1 ? StandardSchemaV1.InferOutput<T> : T>(
  name: Name,
  options: {
    initialValue?: T extends StandardSchemaV1 ? StandardSchemaV1.InferInput<T> : T
    schema: T extends StandardSchemaV1 ? T : undefined
    validateFn: FFNVValidateFn
  }
): FFNV<Name, T, U>
export function createFormField<Name extends string = string, T extends StandardSchemaV1 | any = any, U = T extends StandardSchemaV1 ? StandardSchemaV1.InferOutput<T> : T>(
  name: Name,
  options: {
    initialValue?: T extends StandardSchemaV1 ? StandardSchemaV1.InferInput<T> : T
    schema: T extends StandardSchemaV1 ? T : undefined
  }
): FFNV<Name, T, U>
export function createFormField<Name extends string = string, T extends StandardSchemaV1 | any = any, U = T extends StandardSchemaV1 ? StandardSchemaV1.InferOutput<T> : T>(
  name: Name,
  options: {
    initialValue?: T extends StandardSchemaV1 ? StandardSchemaV1.InferInput<T> : T
    validateFn: FFNVValidateFn
  }
): FFNV<Name, T, U>
export function createFormField<Name extends string = string, T extends StandardSchemaV1 | any = any, U = T extends StandardSchemaV1 ? StandardSchemaV1.InferOutput<T> : T>(
  name: Name,
  options?: {
    initialValue?: T extends StandardSchemaV1 ? StandardSchemaV1.InferInput<T> : T
  }
): FF<Name, U>
export function createFormField<Name extends string = string, T extends StandardSchemaV1 | any = any, U = T extends StandardSchemaV1 ? StandardSchemaV1.InferOutput<T> : T>(
  name: Name,
  options?: {
    initialValue?: T extends StandardSchemaV1 ? StandardSchemaV1.InferInput<T> : T
    schema?: T extends StandardSchemaV1 ? T : undefined
    validateFn?: FFNVValidateFn
  },
): FFNV<Name, T, U> | FF<Name, U> {
  if (options?.schema || options?.validateFn) {
    return new FFNV(name, options) as FFNV<Name, T, U>
  }
  return new FF(name, options) as FF<Name, U>
}

export function createForm<
  T extends Record<string | number, any> | StandardSchemaV1 = Record<string | number, any>,
  U extends Record<string | number, any> = T extends StandardSchemaV1 ? StandardSchemaV1.InferOutput<T> extends Record<string | number, any> ? StandardSchemaV1.InferOutput<T> : never : T,
>(
  id: string,
  options?: {
    initialValue?: T extends StandardSchemaV1 ? StandardSchemaV1.InferInput<T> : T
    schema: T extends StandardSchemaV1 ? T : undefined
    validateFn: FNVValidateFn<U>
  },
): FNV<T, U>
export function createForm<
  T extends Record<string | number, any> | StandardSchemaV1 = Record<string | number, any>,
  U extends Record<string | number, any> = T extends StandardSchemaV1 ? StandardSchemaV1.InferOutput<T> extends Record<string | number, any> ? StandardSchemaV1.InferOutput<T> : never : T,
>(
  id: string,
  options?: {
    initialValue?: T extends StandardSchemaV1 ? StandardSchemaV1.InferInput<T> : T
    schema: T extends StandardSchemaV1 ? T : undefined
  },
): FNV<T, U>
export function createForm<
  T extends Record<string | number, any> | StandardSchemaV1 = Record<string | number, any>,
  U extends Record<string | number, any> = T extends StandardSchemaV1 ? StandardSchemaV1.InferOutput<T> extends Record<string | number, any> ? StandardSchemaV1.InferOutput<T> : never : T,
>(
  id: string,
  options?: {
    initialValue?: T extends StandardSchemaV1 ? StandardSchemaV1.InferInput<T> : T
    validateFn: FNVValidateFn<U>
  },
): FNV<T, U>
export function createForm<
  T extends Record<string | number, any> | StandardSchemaV1 = Record<string | number, any>,
  U extends Record<string | number, any> = T extends StandardSchemaV1 ? StandardSchemaV1.InferOutput<T> extends Record<string | number, any> ? StandardSchemaV1.InferOutput<T> : never : T,
>(
  id: string,
  options?: {
    initialValue?: T extends StandardSchemaV1 ? StandardSchemaV1.InferInput<T> : T
  },
): F<U>
export function createForm<
  T extends Record<string | number, any> | StandardSchemaV1 = Record<string | number, any>,
  U extends Record<string | number, any> = T extends StandardSchemaV1 ? StandardSchemaV1.InferOutput<T> extends Record<string | number, any> ? StandardSchemaV1.InferOutput<T> : never : T,
>(
  id: string,
  options?: {
    initialValue?: T extends StandardSchemaV1 ? StandardSchemaV1.InferInput<T> : T
    schema?: T extends StandardSchemaV1 ? T : undefined
    validateFn?: FNVValidateFn<U>
  },
) {
  if (options?.schema || options?.validateFn) {
    return new FNV(id, options) as FNV<T, U>
  }
  return new F(id, options as any) as F<U>
}

const myForm = createForm('myComplexForm', {
  initialValue: {
    test: 'string',
  },
  schema: z.object({
    test: z.string(),
  }),
  validateFn: () => {},
})

// Accessing fields (still flat, by their full path string)
myForm.field['user.name'].setValue('Bob')
myForm.field['items[0].name'].setValue('Keyboard')

console.log('--- Initial Value ---')
console.dir(myForm.value, { depth: null })
/* Expected output (approximately):
{
  user: {
    name: 'Bob',
    age: 30,
    address: {
      street: '123 Main St',
      city: 'Anytown'
    }
  },
  items: [
    { id: 101, name: 'Keyboard' },
    { id: 102, name: 'Mouse' }
  ],
  tags: [ 'electronic', 'gadget' ],
  description: 'A demo form'
}
*/

// Setting a new nested value
console.log('\n--- Setting new value ---')
myForm.setValue({
  user: {
    name: 'Charlie',
    address: {
      city: 'Newplace',
    },
  },
  items: [
    { id: 200, name: 'Monitor' },
  ],
  description: 'Updated form',
})

console.dir(myForm.value, { depth: null })
/* Expected output (approximately):
{
  user: {
    name: 'Charlie',       // Updated
    age: 30,               // Unchanged (not in setValue)
    address: {
      street: '123 Main St', // Unchanged
      city: 'Newplace'     // Updated
    }
  },
  items: [
    { id: 200, name: 'Monitor' }, // Updated (only first item provided)
    { id: 102, name: 'Mouse' }    // Existing items[1] value (if not cleared by _set logic)
                                   // NOTE: This might require careful consideration if you want
                                   // setValue to fully replace arrays/objects vs merge.
                                   // Current _set will merge/overwrite.
  ],
  tags: [ 'electronic', 'gadget' ], // Unchanged
  description: 'Updated form' // Updated
}
*/

// Demonstrate dynamically adding a field via proxy and accessing its value
myForm.field['new.dynamic.path'].setValue('Hello world')
console.log('\n--- After adding dynamic field ---')
console.dir(myForm.value, { depth: null })
/* Expected output will include:
  new: {
    dynamic: {
      path: 'Hello world'
    }
  }
*/

// Demonstrate array with new index
myForm.field[''].setValue(50)
console.log('\n--- After adding new array item field ---')
console.dir(myForm.value, { depth: null })
/* Expected output will include:
  items: [
    ...,
    { price: 50 } // or merged into existing if index matches
  ]
*/

// Reset the form
myForm.reset()
console.log('\n--- After reset ---')
console.dir(myForm.value, { depth: null })
/* Expected output:
  Will revert to initial values, potentially with some empty objects/arrays
  if the initialValue for a nested field was undefined.
*/
