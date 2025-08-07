import { describe, expect, it } from 'vitest'
import { FF } from '../src/ff'

describe('ff', () => {
  it('should initialize with name and no initial value', () => {
    const field = new FF('username')

    expect(field.name).toBe('username')
    expect(field.initialValue).toBeUndefined()
    expect(field.value).toBeUndefined()
    expect(field.touched).toBe(false)
    expect(field.dirty).toBe(false)
  })

  it('should initialize with initial value', () => {
    const field = new FF('email', { initialValue: 'test@example.com' })

    expect(field.name).toBe('email')
    expect(field.initialValue).toBe('test@example.com')
    expect(field.value).toBe('test@example.com')
    expect(field.touched).toBe(false)
    expect(field.dirty).toBe(false)
  })

  it('should set value and mark as dirty', () => {
    const field = new FF('age')

    field.setValue(25)
    expect(field.value).toBe(25)
    expect(field.dirty).toBe(true)
  })

  it('should set touched state', () => {
    const field = new FF('agreement')

    field.setTouched(true)
    expect(field.touched).toBe(true)

    field.setTouched(false)
    expect(field.touched).toBe(false)
  })

  it('should reset value, touched, and dirty state', () => {
    const field = new FF('bio', { initialValue: 'Hello' })

    field.setValue('Updated')
    field.setTouched(true)
    expect(field.dirty).toBe(true)

    field.reset()

    expect(field.value).toBe('Hello')
    expect(field.touched).toBe(false)
    expect(field.dirty).toBe(false)
  })

  it('should reset to undefined if no initialValue', () => {
    const field = new FF('nickname')

    field.setValue('herdi')
    field.setTouched(true)
    expect(field.dirty).toBe(true)

    field.reset()

    expect(field.value).toBeUndefined()
    expect(field.touched).toBe(false)
    expect(field.dirty).toBe(false)
  })
})
