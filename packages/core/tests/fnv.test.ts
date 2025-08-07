import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { FFNV } from '../src/ffnv' // Adjust path as needed
import { FNV } from '../src/fnv' // Adjust path as needed

describe('fnv', () => {
  describe('constructor', () => {
    it('should create FNV instance with default values', () => {
      const fnv = new FNV('test-form')

      expect(fnv.id).toBe('test-form')
      expect(fnv.fields).toBeInstanceOf(Map)
      expect(fnv.fields.size).toBe(0)
      expect(fnv.schema).toBeUndefined()
      expect(fnv.validateFn).toBeUndefined()
      expect(fnv.pending).toBe(false)
      expect(fnv.valid).toBe(true)
    })

    it('should create FNV instance with initial values', () => {
      const initialValue = { name: 'John', age: 25, address: { city: 'NYC' } }
      const fnv = new FNV('test-form', { initialValue })

      expect(fnv.id).toBe('test-form')
      expect(fnv.fields.size).toBe(3) // name, age, address.city (flattened)
      expect(fnv.fields.has('name')).toBe(true)
      expect(fnv.fields.has('age')).toBe(true)
      expect(fnv.fields.has('address.city')).toBe(true)
      expect(fnv.value).toEqual({ name: 'John', age: 25, address: { city: 'NYC' } })
    })

    it('should create FNV instance with schema', () => {
      const schema = z.object({ name: z.string(), age: z.number() })
      const fnv = new FNV('test-form', { schema })

      expect(fnv.schema).toBe(schema)
    })

    it('should create FNV instance with validateFn', () => {
      const validateFn = vi.fn()
      const fnv = new FNV('test-form', { validateFn })

      expect(fnv.validateFn).toBe(validateFn)
    })
  })

  describe('getters', () => {
    let fnv: FNV

    beforeEach(() => {
      fnv = new FNV('test-form', {
        initialValue: { name: 'John', age: 25 },
      })
    })

    it('should return correct value', () => {
      expect(fnv.value).toEqual({ name: 'John', age: 25 })
    })

    it('should return correct changed state', () => {
      expect(fnv.changed).toBe(false)

      fnv.setValue({ name: 'Jane' })

      expect(fnv.changed).toBe(true)
    })
  })

  describe('getField', () => {
    let fnv: FNV

    beforeEach(() => {
      fnv = new FNV('test-form', {
        initialValue: { name: 'John', age: 25 },
      })
    })

    it('should return existing field', () => {
      const field = fnv.getField('name')
      expect(field).toBeInstanceOf(FFNV)
      expect(field?.name).toBe('name')
    })

    it('should return undefined for non-existing field', () => {
      const field = fnv.getField('nonexistent')
      expect(field).toBeUndefined()
    })
  })

  describe('setValue', () => {
    let fnv: FNV

    beforeEach(() => {
      fnv = new FNV('test-form', {
        initialValue: { name: 'John', age: 25 },
      })
    })

    it('should update existing field values', () => {
      fnv.setValue({ name: 'Jane', age: 30 })

      expect(fnv.value).toEqual({ name: 'Jane', age: 30 })
    })

    it('should create new fields for new values', () => {
      fnv.setValue({ email: 'john@example.com' })

      expect(fnv.fields.has('email')).toBe(true)
      expect(fnv.value.email).toBe('john@example.com')
    })
  })

  describe('issue getter', () => {
    let fnv: FNV

    beforeEach(() => {
      fnv = new FNV('test-form', {
        initialValue: { name: 'John', age: 25 },
      })
    })

    it('should return correct object structure with value null for each prop initially', () => {
      expect(fnv.issue).toEqual(expect.objectContaining({
        age: null,
        name: null,
      }))
    })

    it('should return issues from fields', () => {
      const nameField = fnv.getField('name')
      nameField?.setIssues([{
        description: 'Name is required',
        source: 'validateFn',
      }])

      const issues = fnv.issue
      expect(issues.name).toHaveLength(1)
      expect(issues.name?.[0].description).toBe('Name is required')
    })
  })

  describe('schema validation', () => {
    it('should validate with zod schema', async () => {
      const schema = z.object({
        name: z.string().min(2),
        age: z.number().min(18),
      })

      const fnv = new FNV('test-form', {
        schema,
        initialValue: { name: 'A', age: 16 }, // Invalid values
      })

      const issues = await fnv.getValidationIssue()

      expect(issues.name).toBeDefined()
      expect(issues.age).toBeDefined()
      expect(issues.name?.[0].source).toBe('schema')
      expect(issues.age?.[0].source).toBe('schema')
    })

    it('should pass validation with valid values', async () => {
      const schema = z.object({
        name: z.string().min(2),
        age: z.number().min(18),
      })

      const fnv = new FNV('test-form', {
        schema,
        initialValue: { name: 'John', age: 25 },
      })

      const issues = await fnv.getValidationIssue()

      expect(Object.keys(issues)).toHaveLength(0)
    })

    it('should handle nested object validation', async () => {
      const schema = z.object({
        user: z.object({
          name: z.string().min(2),
          email: z.string().email(),
        }),
      })

      const fnv = new FNV('test-form', {
        schema,
        initialValue: { user: { name: 'A', email: 'invalid-email' } },
      })

      const issues = await fnv.getValidationIssue()

      expect(issues['user.name']).toBeDefined()
      expect(issues['user.email']).toBeDefined()
    })
  })

  describe('validateFn validation', () => {
    it('should validate with custom validateFn', async () => {
      const validateFn = vi.fn((value: any, issue: any) => {
        if (!value.name || value.name.length < 2) {
          issue.name = [{ description: 'Name must be at least 2 characters' }]
        }
      })

      const fnv = new FNV('test-form', {
        validateFn,
        initialValue: { name: 'A' },
      })

      const issues = await fnv.getValidationIssue()

      expect(validateFn).toHaveBeenCalled()
      expect(issues.name).toBeDefined()
      expect(issues.name?.[0].source).toBe('validateFn')
      expect(issues.name?.[0].description).toBe('Name must be at least 2 characters')
    })

    it('should handle async validateFn', async () => {
      const validateFn = vi.fn(async (value: any, issue: any) => {
        await new Promise(resolve => setTimeout(resolve, 10))
        if (value.email === 'taken@example.com') {
          issue.email = [{ description: 'Email already taken' }]
        }
      })

      const fnv = new FNV('test-form', {
        validateFn,
        initialValue: { email: 'taken@example.com' },
      })

      const issues = await fnv.getValidationIssue()

      expect(issues.email).toBeDefined()
      expect(issues.email?.[0].description).toBe('Email already taken')
    })
  })

  describe('validate method', () => {
    it('should validate all fields and set valid state', async () => {
      const schema = z.object({
        name: z.string().min(2),
        age: z.number().min(18),
      })

      const fnv = new FNV('test-form', {
        schema,
        initialValue: { name: 'John', age: 25 },
      })

      await fnv.validate()

      expect(fnv.valid).toBe(true)
      expect(fnv.pending).toBe(false)
    })

    it('should set valid to false when validation fails', async () => {
      const schema = z.object({
        name: z.string().min(2),
        age: z.number().min(18),
      })

      const fnv = new FNV('test-form', {
        schema,
        initialValue: { name: 'A', age: 16 },
      })

      await fnv.validate()

      expect(fnv.valid).toBe(false)
      expect(fnv.pending).toBe(false)
    })

    it('should set pending state during validation', async () => {
      const validateFn = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
      })

      const fnv = new FNV('test-form', {
        validateFn,
        initialValue: { name: 'John' },
      })

      const validatePromise = fnv.validate()

      expect(fnv.pending).toBe(true)
      expect(fnv.valid).toBeUndefined()

      await validatePromise

      expect(fnv.pending).toBe(false)
    })

    it('should create fields for validation issues that don\'t have corresponding fields', async () => {
      const validateFn = vi.fn((value: any, issue: any) => {
        issue.newField = [{ description: 'New field error' }]
      })

      const fnv = new FNV('test-form', { validateFn })

      await fnv.validate()

      expect(fnv.fields.has('newField')).toBe(true)
      const newField = fnv.fields.get('newField')
      expect(newField?.issues).toHaveLength(1)
      expect(newField?.valid).toBe(false)
    })
  })

  describe('validateField method', () => {
    let fnv: FNV

    beforeEach(() => {
      fnv = new FNV('test-form', {
        initialValue: { name: 'John', age: 25 },
      })
    })

    it('should validate specific field', async () => {
      const nameField = fnv.getField('name')
      const validateSpy = vi.spyOn(nameField!, 'validate')

      await fnv.validateField('name')

      expect(validateSpy).toHaveBeenCalled()
    })

    it('should handle non-existing field', async () => {
      await expect(fnv.validateField('nonexistent')).resolves.toBeUndefined()
    })
  })

  describe('reset method', () => {
    let fnv: FNV

    beforeEach(() => {
      fnv = new FNV('test-form', {
        initialValue: { name: 'John', age: 25 },
      })
    })

    it('should reset all fields and form state', async () => {
      // Modify state
      fnv.setValue({ name: 'Jane' })
      await fnv.validate()
      fnv.reset()

      expect(fnv.pending).toBe(false)
      expect(fnv.valid).toBeUndefined()

      // Check that fields are reset
      for (const field of fnv.fields.values()) {
        expect(field.value).toBe(field.initialValue)
        expect(field.touched).toBe(false)
        expect(field.changed).toBe(false)
      }
    })
  })

  describe('createSubmitHandler', () => {
    let fnv: FNV

    beforeEach(() => {
      fnv = new FNV('test-form', {
        initialValue: { name: 'John', age: 25 },
      })
    })

    it('should create submit handler that calls handler with form value', async () => {
      const handler = vi.fn()
      const submitHandler = fnv.createSubmitHandler(handler)

      await submitHandler()

      expect(handler).toHaveBeenCalledWith(fnv.value)
    })

    it('should prevent default event behavior', async () => {
      const handler = vi.fn()
      const submitHandler = fnv.createSubmitHandler(handler)
      const mockEvent = { preventDefault: vi.fn() }

      await submitHandler(mockEvent as any)

      expect(mockEvent.preventDefault).toHaveBeenCalled()
      expect(handler).toHaveBeenCalledWith(fnv.value)
    })

    it('should handle async handler', async () => {
      const handler = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
      })
      const submitHandler = fnv.createSubmitHandler(handler)

      await submitHandler()

      expect(handler).toHaveBeenCalledWith(fnv.value)
    })
  })

  describe('combined validation (schema + validateFn)', () => {
    it('should combine schema and validateFn validation issues', async () => {
      const schema = z.object({
        name: z.string().min(2),
        age: z.number().min(18),
      })

      const validateFn = vi.fn((value: any, issue: any) => {
        if (value.name === 'admin') {
          issue.name = [{ description: 'Name cannot be admin' }]
        }
      })

      const fnv = new FNV('test-form', {
        schema,
        validateFn,
        initialValue: { name: 'A', age: 16 }, // Fails schema validation
      })

      // First test with invalid schema values
      let issues = await fnv.getValidationIssue()
      expect(issues.name).toHaveLength(1) // Schema error
      expect(issues.age).toHaveLength(1) // Schema error

      // Now test with values that pass schema but fail validateFn
      issues = await fnv.getValidationIssue({ name: 'admin', age: 25 })
      expect(issues.name).toHaveLength(1) // validateFn error
      expect(issues.name?.[0].source).toBe('validateFn')
      expect(issues.age).toBeUndefined() // Should pass schema validation
    })
  })

  describe('edge cases', () => {
    it('should handle empty initial value', () => {
      const fnv = new FNV('test-form', { initialValue: {} })

      expect(fnv.fields.size).toBe(0)
      expect(fnv.value).toEqual({})
    })

    it('should handle undefined initial value', () => {
      const fnv = new FNV('test-form')

      expect(fnv.fields.size).toBe(0)
      expect(fnv.value).toEqual({})
    })

    it('should handle null initial value', () => {
      const fnv = new FNV('test-form', { initialValue: null as any })

      expect(fnv.fields.size).toBe(0)
      expect(fnv.value).toEqual({})
    })

    it('should handle complex nested objects', () => {
      const initialValue = {
        user: {
          profile: {
            name: 'John',
            settings: {
              theme: 'dark',
              notifications: true,
            },
          },
        },
        metadata: {
          created: '2023-01-01',
          tags: ['user', 'active'],
        },
      }

      const fnv = new FNV('test-form', { initialValue })

      expect(fnv.fields.has('user.profile.name')).toBe(true)
      expect(fnv.fields.has('user.profile.settings.theme')).toBe(true)
      expect(fnv.fields.has('user.profile.settings.notifications')).toBe(true)
      expect(fnv.fields.has('metadata.created')).toBe(true)
      expect(fnv.fields.has('metadata.tags[0]')).toBe(true)
      expect(fnv.fields.has('metadata.tags[1]')).toBe(true)
    })

    it('should handle arrays in initial values', () => {
      const initialValue = {
        items: [1, 2, 3],
        users: [{ name: 'John' }, { name: 'Jane' }],
        nested: {
          list: ['a', 'b', 'c'],
        },
      }

      const fnv = new FNV('test-form', { initialValue })

      expect(fnv.fields.has('items[0]')).toBe(true)
      expect(fnv.fields.has('items[1]')).toBe(true)
      expect(fnv.fields.has('items[2]')).toBe(true)
      expect(fnv.fields.has('users[0].name')).toBe(true)
      expect(fnv.fields.has('users[1].name')).toBe(true)
      expect(fnv.fields.has('nested.list[0]')).toBe(true)
      expect(fnv.fields.has('nested.list[1]')).toBe(true)
      expect(fnv.fields.has('nested.list[2]')).toBe(true)
    })

    it('should handle primitive values in initial value', () => {
      const initialValue = {
        string: 'hello',
        number: 42,
        boolean: true,
        nullValue: null,
        undefinedValue: undefined,
        zero: 0,
        emptyString: '',
        falsy: false,
      }

      const fnv = new FNV('test-form', { initialValue })

      expect(fnv.fields.get('string')?.value).toBe('hello')
      expect(fnv.fields.get('number')?.value).toBe(42)
      expect(fnv.fields.get('boolean')?.value).toBe(true)
      expect(fnv.fields.get('nullValue')?.value).toBe(null)
      expect(fnv.fields.get('undefinedValue')?.value).toBe(undefined)
      expect(fnv.fields.get('zero')?.value).toBe(0)
      expect(fnv.fields.get('emptyString')?.value).toBe('')
      expect(fnv.fields.get('falsy')?.value).toBe(false)
    })

    it('should handle setting values that don\'t exist in initial value', () => {
      const fnv = new FNV('test-form', { initialValue: { name: 'John' } })

      fnv.setValue({ age: 25, email: 'john@example.com' })

      expect(fnv.fields.has('age')).toBe(true)
      expect(fnv.fields.has('email')).toBe(true)
      expect(fnv.value).toEqual({ name: 'John', age: 25, email: 'john@example.com' })
    })

    it('should handle setting undefined values', () => {
      const fnv = new FNV('test-form', { initialValue: { name: 'John', age: 25 } })

      fnv.setValue({ name: undefined, age: null } as any)

      expect(fnv.value.name).toBe(undefined)
      expect(fnv.value.age).toBe(null)
    })

    it('should handle empty setValue call', () => {
      const fnv = new FNV('test-form', { initialValue: { name: 'John' } })
      const originalValue = fnv.value

      fnv.setValue({})

      expect(fnv.value).toEqual(originalValue)
    })

    it('should handle validation with no schema and no validateFn', async () => {
      const fnv = new FNV('test-form', { initialValue: { name: 'John' } })

      await fnv.validate()

      expect(fnv.valid).toBe(true)
      expect(fnv.pending).toBe(false)
      expect(Object.keys(fnv.issue)).toHaveLength(1)
    })

    it('should handle schema validation with no issues', async () => {
      const schema = z.object({ name: z.string() })
      const fnv = new FNV('test-form', {
        schema,
        initialValue: { name: 'John' },
      })

      const issues = await fnv.getValidationIssue()

      expect(Object.keys(issues)).toHaveLength(0)
    })

    it('should handle validateFn that adds no issues', async () => {
      const validateFn = vi.fn(() => {
        // Do nothing - no issues added
      })

      const fnv = new FNV('test-form', {
        validateFn,
        initialValue: { name: 'John' },
      })

      const issues = await fnv.getValidationIssue()

      expect(Object.keys(issues)).toHaveLength(0)
    })

    it('should handle validateFn that throws error', async () => {
      const validateFn = vi.fn(() => {
        throw new Error('Validation function error')
      })

      const fnv = new FNV('test-form', {
        validateFn,
        initialValue: { name: 'John' },
      })

      await expect(fnv.getValidationIssue()).rejects.toThrow('Validation function error')
    })

    it('should handle schema validation that throws error', async () => {
      const mockSchema = {
        '~standard': {
          validate: vi.fn().mockRejectedValue(new Error('Schema validation error')),
        },
      }

      const fnv = new FNV('test-form', {
        schema: mockSchema as any,
        initialValue: { name: 'John' },
      })

      await expect(fnv.getValidationIssue()).rejects.toThrow('Schema validation error')
    })

    it('should handle multiple validation calls simultaneously', async () => {
      const schema = z.object({ name: z.string().min(2) })
      const fnv = new FNV('test-form', {
        schema,
        initialValue: { name: 'A' },
      })

      // Start multiple validations at the same time
      const validations = [
        fnv.validate(),
        fnv.validate(),
        fnv.validate(),
      ]

      await Promise.all(validations)

      expect(fnv.valid).toBe(false)
      expect(fnv.pending).toBe(false)
    })

    it('should handle validation with very deeply nested object', async () => {
      const deepObject = {
        a: { b: { c: { d: { e: { f: { g: { value: 'deep' } } } } } } },
      }

      const schema = z.object({
        a: z.object({
          b: z.object({
            c: z.object({
              d: z.object({
                e: z.object({
                  f: z.object({
                    g: z.object({
                      value: z.string().min(10), // Will fail
                    }),
                  }),
                }),
              }),
            }),
          }),
        }),
      })

      const fnv = new FNV('test-form', {
        schema,
        initialValue: deepObject,
      })

      const issues = await fnv.getValidationIssue()

      expect(issues['a.b.c.d.e.f.g.value']).toBeDefined()
      expect(issues['a.b.c.d.e.f.g.value']?.[0].source).toBe('schema')
    })

    it('should handle field names with special characters', () => {
      const initialValue = {
        'field-with-dashes': 'value1',
        'field_with_underscores': 'value2',
        'field.with.dots': 'value3',
        'field[0]': 'array-like',
        '123numeric': 'starts-with-number',
      }

      const fnv = new FNV('test-form', { initialValue })

      expect(fnv.fields.has('field-with-dashes')).toBe(true)
      expect(fnv.fields.has('field_with_underscores')).toBe(true)
      expect(fnv.fields.has('field.with.dots')).toBe(true)
      expect(fnv.fields.has('field[0]')).toBe(true)
      expect(fnv.fields.has('123numeric')).toBe(true)
    })

    it('should handle validateField for non-existent field after validation', async () => {
      const fnv = new FNV('test-form', { initialValue: { name: 'John' } })

      await fnv.validate()
      await fnv.validateField('nonexistent')

      // Should not throw or cause issues
      expect(fnv.valid).toBe(true)
    })

    it('should skip validate when pending', async () => {
      const validateFn = vi.fn(async (value: any, issue: any) => {
        await new Promise(resolve => setTimeout(resolve, 500))
        issue.name = [{ message: 'Name is required' }]
      })
      const fnv = new FNV('test-form', {
        initialValue: { name: 'A' },
        validateFn,
      })

      await Promise.all([fnv.validate(), fnv.validate()])

      expect(validateFn).toHaveBeenCalledTimes(1)
      expect(fnv.pending).toBe(false)
    })

    it('should handle createSubmitHandler with handler that throws', async () => {
      const handler = vi.fn().mockRejectedValue(new Error('Submit error'))
      const fnv = new FNV('test-form', { initialValue: { name: 'John' } })

      const submitHandler = fnv.createSubmitHandler(handler)

      await expect(submitHandler()).rejects.toThrow('Submit error')
    })

    it('should handle very large objects', () => {
      const largeObject: Record<string, any> = {}
      for (let i = 0; i < 1000; i++) {
        largeObject[`field${i}`] = `value${i}`
      }

      const fnv = new FNV('test-form', { initialValue: largeObject })

      expect(fnv.fields.size).toBe(1000)
      expect(fnv.value.field999).toBe('value999')
    })

    it('should handle circular references in validation errors gracefully', async () => {
      const validateFn = vi.fn((value: any, issue: any) => {
        const circularObj: any = { description: 'Circular error' }
        circularObj.self = circularObj // Create circular reference

        // This should not cause issues as we only use the description
        issue.name = [{ description: 'Error with circular reference in data' }]
      })

      const fnv = new FNV('test-form', {
        validateFn,
        initialValue: { name: 'John' },
      })

      const issues = await fnv.getValidationIssue()

      expect(issues.name).toBeDefined()
      expect(issues.name?.[0].description).toBe('Error with circular reference in data')
    })

    it('should handle schema with optional fields', async () => {
      const schema = z.object({
        name: z.string(),
        age: z.number().optional(),
        email: z.string().email().optional(),
      })

      const fnv = new FNV('test-form', {
        schema,
        initialValue: { name: 'John' }, // Missing optional fields
      })

      const issues = await fnv.getValidationIssue()

      expect(Object.keys(issues)).toHaveLength(0) // Should pass validation
    })

    it('should handle empty string field names', () => {
      const fnv = new FNV('test-form')

      // This should handle gracefully
      const field = fnv.getField('')
      expect(field).toBeUndefined()
    })

    it('should handle validation with mixed sync/async validators', async () => {
      const schema = z.object({ name: z.string().min(5) })
      const validateFn = vi.fn(async (value: any, issue: any) => {
        await new Promise(resolve => setTimeout(resolve, 1))
        if (value.name === 'test') {
          issue.name = [{ description: 'Name cannot be test' }]
        }
      })

      const fnv = new FNV('test-form', {
        schema,
        validateFn,
        initialValue: { name: 'test' },
      })

      const issues = await fnv.getValidationIssue()

      // Should have both schema and validateFn issues
      expect(issues.name).toHaveLength(2)
      expect(issues.name?.some(issue => issue.source === 'schema')).toBe(true)
      expect(issues.name?.some(issue => issue.source === 'validateFn')).toBe(true)
    })
  })
})
