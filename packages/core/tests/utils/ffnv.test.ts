import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { FFNV } from '../../src/ffnv'

describe('fFNV', () => {
  describe('constructor', () => {
    it('should initialize with default options', () => {
      const ffnv = new FFNV('test')
      expect(ffnv.name).toBe('test')
      expect(ffnv.value).toBeUndefined()
      expect(ffnv.touched).toBe(false)
      expect(ffnv.changed).toBe(false)
      expect(ffnv.pending).toBe(false)
      expect(ffnv.valid).toBeUndefined()
      expect(ffnv.issues).toBeNull()
    })

    it('should initialize with provided options', () => {
      const ffnv = new FFNV('test', {
        schema: z.string(),
        initialValue: 'hello',
        defaultValue: 'default value',
        validateFn: () => {},
        validateOn: ['input', 'blur'],
      })
      expect(ffnv.name).toBe('test')
      expect(ffnv.value).toBe('hello')
      expect(ffnv.touched).toBe(false)
      expect(ffnv.changed).toBe(false)
      expect(ffnv.pending).toBe(false)
      expect(ffnv.valid).toBeUndefined()
      expect(ffnv.issues).toBeNull()
      expect((ffnv as any)._schema).toBeDefined()
      expect((ffnv as any)._initialValue).toBe('hello')
      expect((ffnv as any)._defaultValue).toBe('default value')
      expect((ffnv as any)._validateFn).toBeDefined()
      expect((ffnv as any)._validateOn).toBeInstanceOf(Set)
    })

    it('should initialize validateOn with a Set', () => {
      const ffnv = new FFNV('test', {
        validateOn: ['input', 'blur'],
      })
      expect((ffnv as any)._validateOn).toBeInstanceOf(Set)
      expect((ffnv as any)._validateOn.has('input')).toBe(true)
      expect((ffnv as any)._validateOn.has('blur')).toBe(true)
    })

    it('should use the schema to infer the type of initialValue', () => {
      const ffnv1 = new FFNV('test1', {
        schema: z.number(),
        initialValue: 123,
      })
      expect(ffnv1.value).toBe(123)

      const ffnv2 = new FFNV('test2', {
        initialValue: 123,
      })
      expect(ffnv2.value).toBe(123)
    })

    it('should allow initialValue to be undefined if the schema is optional', () => {
      const ffnv = new FFNV('test', {
        schema: z.string().optional(),
        initialValue: undefined,
      })
      expect(ffnv.value).toBeUndefined()
    })

    it('should allow initialValue to be null if the schema is nullable', () => {
      const fnv = new FFNV('test', {
        schema: z.string().nullable(),
        initialValue: null,
      })
      expect(fnv.value).toBeNull()
    })

    it('should allow initialValue to be inferred from schema', () => {
      const fnv = new FFNV('test', {
        schema: z.string(),
      })
      expect(fnv.value).toBeUndefined()
    })
  })

  describe('event listeners', () => {
    it('should call the value:updated listener when the value is set', () => {
      const fnv = new FFNV('test')
      const listener = vi.fn()
      fnv.on('value:updated', listener)
      fnv.setValue('new value')
      expect(listener).toHaveBeenCalledTimes(1)
      expect(listener).toHaveBeenCalledWith('new value')
    })

    it('should call the touched:updated listener when touched is set', () => {
      const fnv = new FFNV('test')
      const listener = vi.fn()
      fnv.on('touched:updated', listener)
      fnv.setTouched(true)
      expect(listener).toHaveBeenCalledTimes(1)
      expect(listener).toHaveBeenCalledWith(true)
    })

    it('should call the changed:updated listener when changed is set', () => {
      const fnv = new FFNV('test')
      const listener = vi.fn()
      fnv.on('changed:updated', listener)
      fnv.setChanged(true)
      expect(listener).toHaveBeenCalledTimes(1)
      expect(listener).toHaveBeenCalledWith(true)
    })

    it('should call the pending:updated listener when pending is set', () => {
      const fnv = new FFNV('test')
      const listener = vi.fn()
      fnv.on('pending:updated', listener)
      fnv.setPending(true)
      expect(listener).toHaveBeenCalledTimes(1)
      expect(listener).toHaveBeenCalledWith(true)
    })

    it('should call the valid:updated listener when valid is set', () => {
      const fnv = new FFNV('test')
      const listener = vi.fn()
      fnv.on('valid:updated', listener)
      fnv.setValid(true)
      expect(listener).toHaveBeenCalledTimes(1)
      expect(listener).toHaveBeenCalledWith(true)
    })

    it('should call the issues:updated listener when issues is set', () => {
      const fnv = new FFNV('test')
      const listener = vi.fn()
      fnv.on('issues:updated', listener)
      const issues = [{ description: 'test', source: 'schema' as const }]
      fnv.setIssues(issues)
      expect(listener).toHaveBeenCalledTimes(1)
      expect(listener).toHaveBeenCalledWith(issues)
    })

    it('should unsubscribe the listener', () => {
      const fnv = new FFNV('test')
      const listener = vi.fn()
      const unsubscribe = fnv.on('value:updated', listener)
      fnv.setValue('new value')
      expect(listener).toHaveBeenCalledTimes(1)
      unsubscribe()
      fnv.setValue('another value')
      expect(listener).toHaveBeenCalledTimes(1)
    })
  })

  describe('getters and setters', () => {
    it('should get and set value', () => {
      const fnv = new FFNV('test')
      fnv.setValue('new value')
      expect(fnv.value).toBe('new value')
    })

    it('should get and set touched', () => {
      const fnv = new FFNV('test')
      fnv.setTouched(true)
      expect(fnv.touched).toBe(true)
    })

    it('should get and set changed', () => {
      const fnv = new FFNV('test')
      fnv.setChanged(true)
      expect(fnv.changed).toBe(true)
    })

    it('should get and set pending', () => {
      const fnv = new FFNV('test')
      fnv.setPending(true)
      expect(fnv.pending).toBe(true)
    })

    it('should get and set valid', () => {
      const fnv = new FFNV('test')
      fnv.setValid(true)
      expect(fnv.valid).toBe(true)
    })

    it('should get and set issues', () => {
      const fnv = new FFNV('test')
      const issues = [{ description: 'test', source: 'schema' as const }]
      fnv.setIssues(issues)
      expect(fnv.issues).toEqual(issues)
    })
  })

  describe('validation', () => {
    it('should validate using the schema', async () => {
      const ffnv = new FFNV('test', {
        schema: z.string().min(5),
      })
      expect(ffnv.valid).toBeUndefined()
      expect(ffnv.issues).toBeNull()

      ffnv.setValue('abc')
      await ffnv.validate()
      expect(ffnv.valid).toBe(false)
      expect(ffnv.issues).toEqual([{ description: 'Too small: expected string to have >=5 characters', source: 'schema' }])

      ffnv.setValue('abcdef')
      await ffnv.validate()
      expect(ffnv.valid).toBe(true)
      expect(ffnv.issues).toEqual([])
    })

    it('should validate using the validateFn', async () => {
      const ffnv = new FFNV('test', {
        validateFn: async (value, issues) => {
          if (typeof value === 'string' && value.length < 5) {
            issues.push({ description: 'String must contain at least 5 characters' })
          }
        },
      })
      expect(ffnv.valid).toBeUndefined()
      expect(ffnv.issues).toBeNull()

      ffnv.setValue('abc')
      await ffnv.validate()
      expect(ffnv.valid).toBe(false)
      expect(ffnv.issues).toEqual([{ description: 'String must contain at least 5 characters', source: 'validateFn' }])

      ffnv.setValue('abcdef')
      await ffnv.validate()
      expect(ffnv.valid).toBe(true)
      expect(ffnv.issues).toEqual([])
    })

    it('should combine schema and validateFn issues', async () => {
      const ffnv = new FFNV('test', {
        schema: z.string().min(8),
        validateFn: async (value, issues) => {
          if (typeof value === 'string' && value.includes(' ')) {
            issues.push({ description: 'String cannot contain spaces' })
          }
        },
      })

      ffnv.setValue('abc ')
      await ffnv.validate()
      expect(ffnv.valid).toBe(false)
      expect(ffnv.issues).toEqual([
        { description: 'Too small: expected string to have >=8 characters', source: 'schema' },
        { description: 'String cannot contain spaces', source: 'validateFn' },
      ])

      ffnv.setValue('abc def')
      await ffnv.validate()
      expect(ffnv.valid).toBe(false)
      expect(ffnv.issues).toEqual([
        { description: 'Too small: expected string to have >=8 characters', source: 'schema' },
        { description: 'String cannot contain spaces', source: 'validateFn' },
      ])

      ffnv.setValue('abcdef')
      await ffnv.validate()
      expect(ffnv.valid).toBe(false)
      expect(ffnv.issues).toEqual([{ description: 'Too small: expected string to have >=8 characters', source: 'schema' }])

      ffnv.setValue('abcdefgh')
      await ffnv.validate()
      expect(ffnv.issues).toEqual([])
      expect(ffnv.valid).toBe(true)
    })

    it('should set valid to undefined if no schema or validateFn is provided', async () => {
      const ffnv = new FFNV('test')
      await ffnv.validate()
      expect(ffnv.valid).toBeUndefined()
      expect(ffnv.issues).toBeNull()
    })

    it('should handle async validateFn', async () => {
      const ffnv = new FFNV('test', {
        validateFn: async (value, issues) => {
          await new Promise(resolve => setTimeout(resolve, 50))
          if (typeof value === 'string' && value.length < 5) {
            issues.push({ description: 'String must contain at least 5 characters' })
          }
        },
      })
      ffnv.setValue('abc')
      await ffnv.validate()
      expect(ffnv.valid).toBe(false)
      expect(ffnv.pending).toBe(false)
      expect(ffnv.issues).toEqual([{ description: 'String must contain at least 5 characters', source: 'validateFn' }])
    })

    it('should handle schema and validateFn returning no issues', async () => {
      const ffnv = new FFNV('test', {
        schema: z.string().min(1),
        validateFn: async () => {},
      })
      ffnv.setValue('abc')
      await ffnv.validate()
      expect(ffnv.valid).toBe(true)
      expect(ffnv.issues).toHaveLength(0)
    })

    it('should handle schema and validateFn errors', async () => {
      const ffnv = new FFNV('test', {
        schema: z.string().min(1),
        validateFn: async () => {
          throw new Error('validateFn error')
        },
      })
      ffnv.setValue('abc')
      await ffnv.validate()
      expect(ffnv.issues).toEqual([{ description: 'Validation function error: validateFn error', source: 'validateFn' }])
    })

    it('should allow a schema that allows undefined and validate without error', async () => {
      const ffnv = new FFNV('test', {
        schema: z.string().optional(),
      })
      ffnv.setValue(undefined)
      await ffnv.validate()
      expect(ffnv.valid).toBe(true)
      expect(ffnv.issues).toHaveLength(0)
    })

    it('should allow a schema that allows null and validate without error', async () => {
      const ffnv = new FFNV('test', {
        schema: z.string().nullable(),
      })
      ffnv.setValue(null)
      await ffnv.validate()
      expect(ffnv.valid).toBe(true)
      expect(ffnv.issues).toHaveLength(0)
    })

    // Currently not possible.
    // See: https://github.com/standard-schema/standard-schema/issues/11
    // it('should handle a schema with default value', async () => {
    //   const ffnv = new FFNV('test', {
    //     schema: z.string().default('default value'),
    //   })
    //   expect(ffnv.value).toBe('default value')
    //   await ffnv.validate()
    //   expect(ffnv.valid).toBe(true)
    //   expect(ffnv.issues).toHaveLength(0)
    // })

    it('should handle a validation with default value from options', async () => {
      const ffnv = new FFNV('test', {
        schema: z.string(),
        defaultValue: 'default value',
      })
      expect(ffnv.value).toBe(undefined)
      expect(ffnv.defaultValue).toBe('default value')
      await ffnv.validate()
      expect(ffnv.valid).toBe(true)
      expect(ffnv.issues).toHaveLength(0)
    })

    // Currently not possible.
    // See: https://github.com/standard-schema/standard-schema/issues/24
    // it('should validate with a transformed schema', async () => {
    //   const ffnv = new FFNV('test', {
    //     schema: z.string().transform(val => val.length),
    //   })
    //   ffnv.setValue('test')
    //   await ffnv.validate()
    //   expect(ffnv.valid).toBe(true)
    //   expect(ffnv.issues).toHaveLength(0)
    //   expect(ffnv.value).toBe(4)
    // })

    it('should validate with a refine schema', async () => {
      const ffnv = new FFNV('test', {
        schema: z.number().refine(val => val > 0, {
          error: 'Value must be greater than 0',
        }),
      })
      ffnv.setValue(-1)
      await ffnv.validate()
      expect(ffnv.valid).toBe(false)
      expect(ffnv.issues).toEqual([{ description: 'Value must be greater than 0', source: 'schema' }])

      ffnv.setValue(1)
      await ffnv.validate()
      expect(ffnv.valid).toBe(true)
      expect(ffnv.issues).toHaveLength(0)
    })

    it('should validate with a superRefine schema', async () => {
      const ffnv = new FFNV('test', {
        schema: z.number().superRefine((val, ctx) => {
          if (val <= 0) {
            ctx.addIssue({
              code: 'too_small',
              minimum: 1,
              type: 'number',
              inclusive: true,
              message: 'Value must be greater than 0',
              origin: 'number',
            })
          }
        }),
      })
      ffnv.setValue(-1)
      await ffnv.validate()
      expect(ffnv.valid).toBe(false)
      expect(ffnv.issues).toEqual([{ description: 'Value must be greater than 0', source: 'schema' }])

      ffnv.setValue(1)
      await ffnv.validate()
      expect(ffnv.valid).toBe(true)
      expect(ffnv.issues).toHaveLength(0)
    })

    it('should validate with a schema that uses transform and refine together', async () => {
      const ffnv = new FFNV('test', {
        schema: z.string().transform(val => val.length).refine(val => val > 0, {
          message: 'Value must be greater than 0',
        }),
      })
      ffnv.setValue('')
      await ffnv.validate()
      expect(ffnv.valid).toBe(false)
      expect(ffnv.issues).toEqual([{ description: 'Value must be greater than 0', source: 'schema' }])

      ffnv.setValue('test')
      await ffnv.validate()
      expect(ffnv.valid).toBe(true)
      expect(ffnv.issues).toHaveLength(0)
    })

    it('should validate with a schema that uses default and optional together', async () => {
      const ffnv = new FFNV('test', {
        schema: z.string().default('default value').optional(),
      })
      expect(ffnv.value).toBe('default value')
      await ffnv.validate()
      expect(ffnv.valid).toBe(true)
      expect(ffnv.issues).toHaveLength(0)

      const ffnv2 = new FFNV('test2', {
        schema: z.string().optional().default('default value'),
      })
      expect(ffnv2.value).toBe('default value')
      await ffnv2.validate()
      expect(ffnv2.valid).toBe(true)
      expect(ffnv2.issues).toBeNull()
    })

    // Currently not possible.
    // it('should validate with a schema that uses catch', async () => {
    //   const ffnv = new FFNV('test', {
    //     schema: z.string().catch('caught value'),
    //   })
    //   ffnv.setValue(123 as any)
    //   await ffnv.validate()
    //   expect(ffnv.valid).toBe(true)
    //   expect(ffnv.issues).toHaveLength(0)
    //   expect(ffnv.value).toBe('caught value')
    // })

    it('should validate with a schema that uses readonly', async () => {
      const ffnv = new FFNV('test', {
        schema: z.string().readonly(),
        initialValue: 'initial value',
      })
      expect(ffnv.value).toBe('initial value')
      ffnv.setValue('new value')
      expect(ffnv.value).toBe('initial value')
      await ffnv.validate()
      expect(ffnv.valid).toBe(true)
      expect(ffnv.issues).toHaveLength(0)
    })
  })
})
