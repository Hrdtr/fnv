import { beforeEach, describe, expect, it } from 'vitest'
import { z } from 'zod'
import { FFNV } from '../src/ffnv'

describe('ffnv', () => {
  let field: FFNV<'email', z.ZodString>

  beforeEach(() => {
    field = new FFNV('email', {
      initialValue: '',
      schema: z.string().email({ message: 'Invalid email format' }),
    })
  })

  it('validates against schema', async () => {
    field.setValue('not-an-email')
    await field.validate()
    expect(field.valid).toBe(false)
    expect(field.issues).toEqual([
      expect.objectContaining({
        description: 'Invalid email format',
        source: 'schema',
      }),
    ])
  })

  it('validates with custom validateFn', async () => {
    const field = new FFNV('age', {
      initialValue: 12,
      schema: z.number(),
      validateFn: (value, issues) => {
        if ((value as number) < 18) {
          issues.push({ description: 'Must be 18 or older' })
        }
      },
    })

    await field.validate()
    expect(field.valid).toBe(false)
    expect(field.issues).toEqual([
      expect.objectContaining({
        description: 'Must be 18 or older',
        source: 'validateFn',
      }),
    ])
  })

  it('validates with async validateFn', async () => {
    const field = new FFNV('username', {
      initialValue: 'admin',
      schema: z.string(),
      validateFn: async (value, issues) => {
        await new Promise(r => setTimeout(r, 5))
        if (value === 'admin') {
          issues.push({ description: 'Username is reserved' })
        }
      },
    })

    await field.validate()
    expect(field.valid).toBe(false)
    expect(field.issues).toEqual([
      expect.objectContaining({
        description: 'Username is reserved',
        source: 'validateFn',
      }),
    ])
  })

  it('runs both schema and validateFn (both fail)', async () => {
    const field = new FFNV('test', {
      initialValue: 'x',
      schema: z.string().min(5, { message: 'Too short' }),
      validateFn: (value, issues) => {
        issues.push({ description: 'Custom fail' })
      },
    })

    await field.validate()
    expect(field.valid).toBe(false)
    expect(field.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ description: 'Too short', source: 'schema' }),
      expect.objectContaining({ description: 'Custom fail', source: 'validateFn' }),
    ]))
  })

  it('returns no issues when valid', async () => {
    const field = new FFNV('name', {
      initialValue: 'John Doe',
      schema: z.string().min(3),
      validateFn: () => {},
    })

    await field.validate()
    expect(field.valid).toBe(true)
    expect(field.issues).toEqual([])
  })

  it('handles undefined value safely', async () => {
    const field = new FFNV('bio', {
      schema: z.string().optional(),
    })

    await field.validate()
    expect(field.valid).toBe(true)
    expect(field.issues).toEqual([])
  })

  it('returns no issues without schema or validateFn', async () => {
    const field = new FFNV('raw')
    field.setValue('anything')
    await field.validate()
    expect(field.valid).toBe(true)
    expect(field.issues).toEqual([])
  })

  it('reset clears validation state', async () => {
    field.setValue('not-an-email')
    await field.validate()

    expect(field.valid).toBe(false)
    expect(field.issues?.length).toBeGreaterThan(0)

    field.reset()
    expect(field.valid).toBeUndefined()
    expect(field.issues).toBeNull()
    expect(field.value).toBe('')
  })

  it('allows updating value before validation', async () => {
    field.setValue('test@example.com')
    await field.validate()
    expect(field.valid).toBe(true)
    expect(field.issues).toEqual([])
  })

  it('does not validate if value is valid and no validators present', async () => {
    const field = new FFNV('noop', { initialValue: 123 })
    await field.validate()
    expect(field.valid).toBe(true)
  })

  it('works with nested schema', async () => {
    const schema = z.object({
      profile: z.object({
        name: z.string().min(1),
      }),
    })

    const field = new FFNV('profile', {
      initialValue: { profile: { name: '' } },
      schema,
    })

    await field.validate()
    expect(field.valid).toBe(false)
    expect(field.issues?.[0]).toEqual(expect.objectContaining({
      source: 'schema',
    }))
  })
})
