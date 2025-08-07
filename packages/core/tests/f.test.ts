import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { _getField, F } from '../src/f'
import { FF } from '../src/ff'
import { FFNV } from '../src/ffnv'

describe('f', () => {
  it('should initialize with flattened fields', () => {
    const form = new F('form1', {
      initialValue: {
        name: 'Herdi',
        profile: {
          age: 28,
          skills: ['ts', 'vue'],
        },
      },
    })

    expect(form.fields.size).toBe(4)
    expect(form.getField('name')?.value).toBe('Herdi')
    expect(form.getField('profile.age')?.value).toBe(28)
    expect(form.getField('profile.skills[0]')?.value).toBe('ts')
    expect(form.getField('profile.skills[1]')?.value).toBe('vue')
  })

  it('should get correct nested value', () => {
    const form = new F('test', {
      initialValue: {
        user: {
          email: 'a@a.com',
        },
      },
    })

    expect(form.value).toEqual({ user: { email: 'a@a.com' } })
  })

  it('should set new values and create new fields if missing', () => {
    const form = new F('test')
    form.setValue({
      address: {
        street: 'Jl Malioboro',
        city: 'Yogyakarta',
      },
    })

    expect(form.getField('address.street')?.value).toBe('Jl Malioboro')
    expect(form.getField('address.city')?.value).toBe('Yogyakarta')
  })

  it('should correctly flatten and reconstruct arrays', () => {
    const form = new F('test', {
      initialValue: {
        items: ['one', 'two'],
      },
    })

    expect(form.getField('items[0]')?.value).toBe('one')
    expect(form.getField('items[1]')?.value).toBe('two')
    expect(form.value).toEqual({ items: ['one', 'two'] })
  })

  it('should handle touched and dirty flags correctly', () => {
    const form = new F('test', {
      initialValue: {
        foo: 'bar',
      },
    })

    expect(form.touched).toBe(false)
    expect(form.dirty).toBe(false)

    const field = form.getField('foo')!
    field.setTouched(true)
    field.setValue('baz')

    expect(form.touched).toBe(true)
    expect(form.dirty).toBe(true)
  })

  it('should reset all fields to initial value', () => {
    const form = new F('test', {
      initialValue: {
        name: 'Herdi',
      },
    })

    const field = form.getField('name')!
    field.setValue('Budi')
    field.setTouched(true)

    form.reset()

    expect(field.value).toBe('Herdi')
    expect(field.touched).toBe(false)
    expect(field.dirty).toBe(false)
  })

  it('should handle deeply nested structures with arrays', () => {
    const form = new F('test', {
      initialValue: {
        sections: [
          { title: 'A', count: 1 },
          { title: 'B', count: 2 },
        ],
      },
    })

    expect(form.getField('sections[0].title')?.value).toBe('A')
    expect(form.getField('sections[1].count')?.value).toBe(2)

    expect(form.value).toEqual({
      sections: [
        { title: 'A', count: 1 },
        { title: 'B', count: 2 },
      ],
    })
  })

  it('should call handler with correct form value on submit', async () => {
    const mock = vi.fn()
    const form = new F('test', {
      initialValue: {
        email: 'a@a.com',
      },
    })

    const handler = form.createSubmitHandler(mock)

    const fakeEvent = { preventDefault: vi.fn() } as unknown as Event
    await handler(fakeEvent)

    expect(fakeEvent.preventDefault).toHaveBeenCalled()
    expect(mock).toHaveBeenCalledWith({ email: 'a@a.com' })
  })

  it('getField should return undefined for missing keys', () => {
    const form = new F('test')
    expect(form.getField('non.existent')).toBeUndefined()
  })

  it('setValue should handle empty input gracefully', () => {
    const form = new F('test', {
      initialValue: { foo: 'bar' },
    })

    form.setValue({})
    expect(form.getField('foo')?.value).toBe('bar') // unchanged
  })

  it('reset should keep structure consistent after setValue with new keys', () => {
    const form = new F('test', {
      initialValue: { user: { name: 'herdi' } },
    })

    form.setValue({ user: { name: 'budi', age: 99 } })
    expect(form.getField('user.age')?.value).toBe(99)

    form.reset()
    expect(form.getField('user.age')?.value).toBe(undefined)
    expect(form.getField('user.name')?.value).toBe('herdi')
  })

  it('should allow creating form without initialValue', () => {
    const form = new F('test')

    expect(form.fields.size).toBe(0)
    expect(form.value).toEqual({})
  })

  it('should allow setting value after construction without initialValue', () => {
    const form = new F('dynamicForm')

    form.setValue({
      username: 'herdi',
      password: 'secret',
    })

    expect(form.getField('username')?.value).toBe('herdi')
    expect(form.getField('password')?.value).toBe('secret')
    expect(form.value).toEqual({
      username: 'herdi',
      password: 'secret',
    })
  })

  it('should maintain type safety with inferred value type', () => {
    const form = new F('typedForm', {
      initialValue: {
        email: '',
        age: 0,
      },
    })

    const email = form.getField('email')?.value
    const age = form.getField('age')?.value

    // Just type assertions to catch regressions via TS
    expect(typeof email).toBe('string')
    expect(typeof age).toBe('number')
  })
})

describe('_getField', () => {
  it('should return undefined for non-existent fields', () => {
    const fields = new Map<string, FF | FFNV>()
    expect(_getField(fields, 'nonExistentField')).toBeUndefined()
  })

  it('should return the correct FF field for direct access', () => {
    const fields = new Map<string, FF | FFNV>()
    const ffField = new FF('name', { initialValue: 'Test Name' })
    fields.set('name', ffField)

    expect(_getField(fields, 'name')).toBe(ffField)
    expect(_getField(fields, 'name')?.value).toBe('Test Name')
  })

  it('should return the correct FFNV field for direct access', () => {
    const fields = new Map<string, FF | FFNV>()
    const ffnvField = new FFNV('email', { initialValue: 'test@example.com' })
    fields.set('email', ffnvField)

    expect(_getField(fields, 'email')).toBe(ffnvField)
    expect(_getField(fields, 'email')?.value).toBe('test@example.com')
  })

  it('should return a proxy for nested object fields', () => {
    const fields = new Map<string, FF | FFNV>()
    const nestedFF = new FF('profile.age', { initialValue: 30 })
    fields.set('profile.age', nestedFF)

    const proxyField = _getField(fields, 'profile') as FF

    expect(proxyField).toBeDefined()
    expect(proxyField.name).toBe('profile')
    expect(proxyField.value).toEqual({ age: 30 })
  })

  it('should return a proxy for array fields', () => {
    const fields = new Map<string, FF | FFNV>()
    const arrayItemFF1 = new FF('items[0]', { initialValue: 'apple' })
    const arrayItemFF2 = new FF('items[1]', { initialValue: 'banana' })
    fields.set('items[0]', arrayItemFF1)
    fields.set('items[1]', arrayItemFF2)

    const proxyField = _getField(fields, 'items') as FF

    expect(proxyField).toBeDefined()
    expect(proxyField.name).toBe('items')
    expect(proxyField.value).toEqual(['apple', 'banana'])
  })

  it('should return undefined for deeply nested non-existent fields', () => {
    const fields = new Map<string, FF | FFNV>()
    fields.set('profile.age', new FF('profile.age', { initialValue: 30 }))

    expect(_getField(fields, 'profile.address')).toBeUndefined()
    expect(_getField(fields, 'profile.age.street')).toBeUndefined()
  })

  it('should handle mixed FF and FFNV in nested structures', () => {
    const fields = new Map<string, FF | FFNV>()
    const ffField = new FF('user.name', { initialValue: 'Alice' })
    const ffnvField = new FFNV('user.email', { initialValue: 'alice@example.com' })
    fields.set('user.name', ffField)
    fields.set('user.email', ffnvField)

    const proxyField = _getField(fields, 'user') as FFNV

    expect(proxyField).toBeDefined()
    expect(proxyField.value).toEqual({ name: 'Alice', email: 'alice@example.com' })
  })

  it('should handle FFNV proxy properties correctly', async () => {
    const fields = new Map<string, FF | FFNV>()
    const ffnvField1 = new FFNV('data[0].value', { initialValue: 100, schema: z.number() })
    const ffnvField2 = new FFNV('data[1].value', { initialValue: '200' as any, schema: z.number() })
    fields.set('data[0].value', ffnvField1)
    fields.set('data[1].value', ffnvField2)
    await ffnvField1.validate()
    await ffnvField2.validate()

    const proxyField = _getField(fields, 'data') as FFNV

    expect(proxyField).toBeDefined()
    expect(proxyField.value).toEqual([{ value: 100 }, { value: '200' }])
    expect(proxyField.valid).toBe(false) // Should be false if any nested FFNV is invalid
    expect(proxyField.issues?.[0].source).toEqual('schema')
    expect(proxyField.pending).toBe(false) // Assuming no pending calls for simplicity here

    // Test setting touched on proxy
    expect(ffnvField1.touched).toEqual(false)
    expect(ffnvField2.touched).toEqual(false)
    proxyField.setTouched(true)
    expect(ffnvField1.touched).toEqual(true)
    expect(ffnvField2.touched).toEqual(true)
  })

  it('should handle setValue on a proxy field', () => {
    const fields = new Map<string, FF | FFNV>()
    const ffField = new FF('nested.value')
    fields.set('nested.value', ffField)

    const proxyField = _getField(fields, 'nested') as FF
    proxyField.setValue({ newValue: 'updated' })

    // Expecting the underlying FF to be updated or new fields created
    // The setValue logic in _getField handles this by deleting old children and setting new ones.
    // For this test, we'll check if the underlying fields map is updated as expected.
    expect(fields.has('nested.newValue')).toBe(true)
    expect(fields.get('nested.newValue')?.value).toBe('updated')
    expect(fields.size).toBe(1) // Only the new field should exist
  })

  it('should handle setValue on a proxy array field', () => {
    const fields = new Map<string, FF | FFNV>()
    fields.set('list[0]', new FF('list[0]'))

    const proxyField = _getField(fields, 'list') as FF
    proxyField.setValue(['a', 'b'])

    expect(fields.has('list[0]')).toBe(true)
    expect(fields.get('list[0]')?.value).toBe('a')
    expect(fields.has('list[1]')).toBe(true)
    expect(fields.get('list[1]')?.value).toBe('b')
    expect(fields.size).toBe(2)
  })

  it('should correctly get nested FFNV properties like valid and issues', () => {
    const fields = new Map<string, FF | FFNV>()
    const ffnvField = new FFNV('config.setting', { initialValue: 'default' })
    ffnvField.setIssues([{ description: 'Error', source: 'schema' }])
    fields.set('config.setting', ffnvField)

    const proxyField = _getField(fields, 'config') as FFNV

    expect(proxyField.valid).toBe(false)
    expect(proxyField.issues).toEqual([{ description: 'Error', source: 'schema' }])
  })

  it('should correctly aggregate valid status from multiple nested FFNVs', async () => {
    const fields = new Map<string, FF | FFNV>()
    const ffnvField1 = new FFNV('settings.option1', { initialValue: true, schema: z.literal(true) })
    const ffnvField2 = new FFNV('settings.option2', { initialValue: false as any, schema: z.literal(true) })
    fields.set('settings.option1', ffnvField1)
    fields.set('settings.option2', ffnvField2)

    const proxyField = _getField(fields, 'settings') as FFNV
    await proxyField.validate()

    expect(proxyField.valid).toBe(false) // Should be false because one of the nested fields is invalid
  })

  it('should correctly aggregate issues from multiple nested FFNVs', () => {
    const fields = new Map<string, FF | FFNV>()
    const ffnvField1 = new FFNV('errors.code1')
    ffnvField1.setIssues([{ description: 'Issue A', source: 'schema' }])
    const ffnvField2 = new FFNV('errors.code2')
    ffnvField2.setIssues([{ description: 'Issue B', source: 'validateFn' }])
    fields.set('errors.code1', ffnvField1)
    fields.set('errors.code2', ffnvField2)

    const proxyField = _getField(fields, 'errors') as FFNV

    expect(proxyField.issues).toEqual([
      { description: 'Issue A', source: 'schema' },
      { description: 'Issue B', source: 'validateFn' },
    ])
  })

  it('should return undefined for valid if no nested FFNVs have a defined valid status', () => {
    const fields = new Map<string, FF | FFNV>()
    const ffField1 = new FFNV('misc.a')
    const ffField2 = new FFNV('misc.b')
    fields.set('misc.a', ffField1)
    fields.set('misc.b', ffField2)

    const proxyField = _getField(fields, 'misc') as FFNV

    expect(proxyField.valid).toBeUndefined()
  })

  it('should correctly handle empty arrays when getting fields', () => {
    const fields = new Map<string, FF | FFNV>()
    const ffField = new FF('emptyArray', { initialValue: [] })
    fields.set('emptyArray', ffField)
    const proxyField = _getField(fields, 'emptyArray') as FF

    expect(proxyField).toBeDefined()
    expect(proxyField.value).toEqual([])
  })

  it('should correctly handle empty objects when getting fields', () => {
    const fields = new Map<string, FF | FFNV>()
    const ffField = new FF('emptyArray', { initialValue: {} })
    fields.set('emptyArray', ffField)
    const proxyField = _getField(fields, 'emptyArray') as FF

    expect(proxyField).toBeDefined()
    expect(proxyField.value).toEqual({})
  })

  it('should correctly handle fields with null values', () => {
    const fields = new Map<string, FF | FFNV>()
    const nullField = new FF('nullableField', { initialValue: null })
    fields.set('nullableField', nullField)

    const proxyField = _getField(fields, 'nullableField') as FF
    expect(proxyField.value).toBeNull()
  })

  it('should correctly handle fields with undefined values', () => {
    const fields = new Map<string, FF | FFNV>()
    const undefinedField = new FF('undefinedField', { initialValue: undefined })
    fields.set('undefinedField', undefinedField)

    const proxyField = _getField(fields, 'undefinedField') as FF
    expect(proxyField.value).toBeUndefined()
  })

  it('should correctly handle fields with zero values', () => {
    const fields = new Map<string, FF | FFNV>()
    const zeroField = new FF('zeroField', { initialValue: 0 })
    fields.set('zeroField', zeroField)

    const proxyField = _getField(fields, 'zeroField') as FF
    expect(proxyField.value).toBe(0)
  })

  it('should correctly handle fields with empty string values', () => {
    const fields = new Map<string, FF | FFNV>()
    const emptyStringField = new FF('emptyStringField', { initialValue: '' })
    fields.set('emptyStringField', emptyStringField)

    const proxyField = _getField(fields, 'emptyStringField') as FF
    expect(proxyField.value).toBe('')
  })

  it('should correctly handle complex nested array structures', () => {
    const fields = new Map<string, FF | FFNV>()
    fields.set('matrix[0][0]', new FF('matrix[0][0]', { initialValue: 1 }))
    fields.set('matrix[0][1]', new FF('matrix[0][1]', { initialValue: 2 }))
    fields.set('matrix[1][0]', new FF('matrix[1][0]', { initialValue: 3 }))
    fields.set('matrix[1][1]', new FF('matrix[1][1]', { initialValue: 4 }))

    const proxyField = _getField(fields, 'matrix') as FF

    expect(proxyField.value).toEqual([[1, 2], [3, 4]])
  })

  it('should correctly handle mixed types in arrays', () => {
    const fields = new Map<string, FF | FFNV>()
    fields.set('mixedArray[0]', new FF('mixedArray[0]', { initialValue: 'string' }))
    fields.set('mixedArray[1]', new FF('mixedArray[1]', { initialValue: 123 }))
    fields.set('mixedArray[2]', new FF('mixedArray[2]', { initialValue: true }))

    const proxyField = _getField(fields, 'mixedArray') as FF

    expect(proxyField.value).toEqual(['string', 123, true])
  })

  it('should correctly handle FFNV with schema and validateFn', () => {
    const fields = new Map<string, FF | FFNV>()
    const mockSchema = z.string()
    const mockValidateFn = vi.fn()
    const ffnvField = new FFNV('validatedField', { initialValue: 'valid', schema: mockSchema, validateFn: mockValidateFn })
    fields.set('validatedField', ffnvField)

    const proxyField = _getField(fields, 'validatedField') as FFNV

    expect(proxyField.schema).toBe(mockSchema)
    expect(proxyField.validateFn).toBe(mockValidateFn)
    expect(proxyField.getValidationIssues).toBeDefined()
    expect(proxyField.validate).toBeDefined()
  })

  it('should correctly call getValidationIssues on nested FFNVs', async () => {
    const fields = new Map<string, FF | FFNV>()
    const mockValidateFn = vi.fn()
    const ffnvField = new FFNV('nestedValidation.field', { schema: z.string(), validateFn: mockValidateFn })
    fields.set('nestedValidation.field', ffnvField)

    const proxyField = _getField(fields, 'nestedValidation') as FFNV

    await proxyField.getValidationIssues() // Call on the proxy

    expect(mockValidateFn).toHaveBeenCalled()
  })

  it('should correctly call validate on nested FFNVs', async () => {
    const fields = new Map<string, FF | FFNV>()
    const mockValidateFn = vi.fn()
    const ffnvField = new FFNV('nestedValidation.field', { schema: z.string(), validateFn: mockValidateFn })
    fields.set('nestedValidation.field', ffnvField)

    const proxyField = _getField(fields, 'nestedValidation') as FFNV

    await proxyField.validate() // Call on the proxy

    expect(mockValidateFn).toHaveBeenCalled()
  })

  it('should correctly call setIssues on nested FFNVs', () => {
    const fields = new Map<string, FFNV>()
    const ffnvField = new FFNV('nestedIssues.field')
    fields.set('nestedIssues.field', ffnvField)

    const proxyField = _getField(fields, 'nestedIssues') as FFNV
    expect(fields.get('nestedIssues.field')?.issues).toBeNull()
    const mockIssues = [{ description: 'Test Issue', source: 'schema' as const }]
    proxyField.setIssues(mockIssues)
    expect(fields.get('nestedIssues.field')?.issues).toEqual(mockIssues)
  })
})
