import type { StandardSchemaV1 } from '@standard-schema/spec'
import type { FFNVValue } from './types'
import { isEqual } from './utils'

type InferFFNVInputValue<T extends StandardSchemaV1 | FFNVValue> = T extends StandardSchemaV1
  ? StandardSchemaV1.InferInput<T> extends FFNVValue
    ? StandardSchemaV1.InferInput<T>
    : never
  : T

type _InferFFNVOutputValue<T extends StandardSchemaV1 | FFNVValue> = T extends StandardSchemaV1
  ? StandardSchemaV1.InferOutput<T> extends FFNVValue
    ? StandardSchemaV1.InferOutput<T>
    : never
  : T

export type FFNVValidateFn = (value: unknown, issues: Omit<FFNVIssue, 'source'>[]) => void | Promise<void>

export interface FFNVIssue {
  description: string
  source: 'fnv:schema' | 'fnv:validateFn' | 'schema' | 'validateFn'
}

export type FFNVValidationTrigger = 'input' | 'change' | 'blur'

export interface FFNVOptions<T extends StandardSchemaV1 | FFNVValue = FFNVValue> {
  schema?: T extends StandardSchemaV1 ? T : undefined
  initialValue?: T extends StandardSchemaV1 ? StandardSchemaV1.InferInput<T> : T
  defaultValue?: T extends StandardSchemaV1 ? StandardSchemaV1.InferInput<T> : T
  validateFn?: FFNVValidateFn
  validateOn?: FFNVValidationTrigger[]
}

export interface FFNVElementBindings {
  'value': string | boolean | string[]
  'onchange': (event: Event) => void
  'onblur': (event: Event) => void
  'oninput': (event: Event) => void
  'name'?: string
  'checked'?: boolean
  'aria-invalid'?: boolean
  'aria-describedby'?: string
}

interface FFNVEventHandlers<T extends StandardSchemaV1 | FFNVValue = FFNVValue> {
  'value:updated': (value: InferFFNVInputValue<T> | undefined) => void
  'touched:updated': (touched: boolean) => void
  'changed:updated': (changed: boolean) => void
  'pending:updated': (pending: boolean) => void
  'valid:updated': (valid: boolean | undefined) => void
  'issues:updated': (issues: FFNVIssue[] | null) => void
}

export class FFNV<Name extends string = string, T extends StandardSchemaV1 | FFNVValue = FFNVValue> {
  readonly name: Name

  private readonly _schema: (T extends StandardSchemaV1 ? T : undefined) | undefined
  private readonly _initialValue: InferFFNVInputValue<T> | undefined
  private readonly _defaultValue: InferFFNVInputValue<T> | undefined
  private readonly _validateFn: FFNVValidateFn | undefined
  private readonly _validateOn: Set<FFNVValidationTrigger>

  private _isDestroyed = false

  private _value: InferFFNVInputValue<T> | undefined
  private _touched: boolean
  private _changed: boolean
  private _pending: boolean
  private _valid: boolean | undefined
  private _issues: FFNVIssue[] | null

  private _listeners: Map<keyof FFNVEventHandlers<T>, Set<(...args: unknown[]) => void>>

  constructor(name: Name, options?: FFNVOptions<T>) {
    this.name = name

    this._schema = options?.schema
    this._initialValue = options?.initialValue as InferFFNVInputValue<T> | undefined
    this._defaultValue = options?.defaultValue as InferFFNVInputValue<T> | undefined
    this._validateFn = options?.validateFn
    this._validateOn = new Set(options?.validateOn || ['change'])

    this._value = options?.initialValue as InferFFNVInputValue<T> | undefined
    this._touched = false
    this._changed = false
    this._pending = false
    this._valid = undefined
    this._issues = null

    this._listeners = new Map<keyof FFNVEventHandlers<T>, Set<(...args: unknown[]) => void>>()
  }

  on<K extends keyof FFNVEventHandlers<T>>(event: K, handler: FFNVEventHandlers<T>[K]): () => void {
    if (this._isDestroyed) {
      console.warn('Cannot add event listeners to destroyed FNV instance')
      return () => {}
    }

    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set())
    }
    const eventListeners = this._listeners.get(event)!
    eventListeners.add(handler as (...args: unknown[]) => void)

    return () => {
      eventListeners.delete(handler as (...args: unknown[]) => void)
      if (eventListeners.size === 0) {
        this._listeners.delete(event)
      }
    }
  }

  private _emit<K extends keyof FFNVEventHandlers<T>>(event: K, ...args: Parameters<FFNVEventHandlers<T>[K]>) {
    if (this._isDestroyed) {
      return
    }

    const listeners = this._listeners.get(event)
    if (!listeners) {
      return
    }
    // Create a copy to avoid issues with concurrent modifications
    const listenersCopy = Array.from(listeners)
    listenersCopy.forEach((handler) => {
      try {
        handler(...args)
      }
      catch (error) {
        console.error(`Error occurred while executing "${String(event)}" event handler:`, error)
        // Continue with other handlers instead of re-throwing
      }
    })
  }

  private _elementValue(element: HTMLElement): InferFFNVInputValue<T> {
    if (element instanceof HTMLInputElement) {
      switch (element.type) {
        case 'checkbox':
          return element.checked as InferFFNVInputValue<T>
        case 'radio':
          return element.value as InferFFNVInputValue<T>
        case 'number':
        case 'range':
          return (element.valueAsNumber || 0) as InferFFNVInputValue<T>
        case 'date':
        case 'datetime-local':
        case 'time':
          return element.value as InferFFNVInputValue<T>
        case 'file':
          return Array.from(element.files || []) as InferFFNVInputValue<T>
        default:
          return element.value as InferFFNVInputValue<T>
      }
    }
    if (element instanceof HTMLSelectElement) {
      if (element.multiple) {
        return Array.from(element.selectedOptions, option => option.value) as InferFFNVInputValue<T>
      }
      return element.value as InferFFNVInputValue<T>
    }
    if (element instanceof HTMLTextAreaElement) {
      return element.value as InferFFNVInputValue<T>
    }
    return (element as any).value as InferFFNVInputValue<T>
  }

  get initialValue() {
    return this._initialValue
  }

  get defaultValue() {
    return this._defaultValue
  }

  get value() {
    return this._value
  }

  setValue(value: InferFFNVInputValue<T>) {
    if (this._isDestroyed) {
      console.warn('Cannot set value on destroyed FNV instance')
      return
    }
    if (isEqual(value, this._value)) {
      return
    }
    this._value = value
    this._emit('value:updated', value)

    const changed = !isEqual(value, this._initialValue)
    if (changed !== this._changed) {
      this.setChanged(changed)
    }
  }

  get touched() {
    return this._touched
  }

  setTouched(touched: boolean) {
    if (this._isDestroyed) {
      return
    }
    if (touched === this._touched) {
      return
    }
    this._touched = touched
    this._emit('touched:updated', touched)
  }

  get changed() {
    return this._changed
  }

  setChanged(changed: boolean) {
    if (this._isDestroyed) {
      return
    }
    if (changed === this._changed) {
      return
    }
    this._changed = changed
    this._emit('changed:updated', changed)
  }

  get pending() {
    return this._pending
  }

  setPending(pending: boolean) {
    if (this._isDestroyed) {
      return
    }
    if (pending === this._pending) {
      return
    }
    this._pending = pending
    this._emit('pending:updated', pending)
  }

  get valid() {
    return this._valid
  }

  setValid(valid: boolean | undefined) {
    if (this._isDestroyed) {
      return
    }
    if (valid === this._valid) {
      return
    }
    this._valid = valid
    this._emit('valid:updated', valid)
  }

  get issues() {
    return this._issues
  }

  setIssues(issues: FFNVIssue[] | null) {
    if (this._isDestroyed) {
      return
    }
    if (isEqual(issues, this._issues)) {
      return
    }
    this._issues = issues
    this._emit('issues:updated', issues)

    const valid = issues === null ? undefined : issues.length === 0
    if (valid !== this._valid) {
      this.setValid(valid)
    }
  }

  get schema() {
    if (!this._schema) {
      return undefined
    }

    const issuesFrom = async (value: InferFFNVInputValue<T> | undefined): Promise<FFNVIssue[] | null> => {
      const schemaIssues: FFNVIssue[] = []
      try {
        const result = await this._schema?.['~standard'].validate(value)
        if (result?.issues) {
          schemaIssues.push(...result.issues.map(issue => ({
            description: issue.message,
            source: 'schema' as const,
          })))
        }
      }
      catch (error) {
        schemaIssues.push({
          description: `Schema validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          source: 'schema' as const,
        })
      }
      return schemaIssues.length > 0 ? schemaIssues : null
    }

    return Object.assign(this._schema, { issuesFrom })
  }

  get validateFn() {
    if (!this._validateFn) {
      return undefined
    }

    const issuesFrom = async (value: InferFFNVInputValue<T> | undefined): Promise<FFNVIssue[] | null> => {
      const validateFnIssues: Omit<FFNVIssue, 'source'>[] = []
      try {
        await this._validateFn?.(value, validateFnIssues)
      }
      catch (error) {
        validateFnIssues.push({
          description: `Validation function error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        })
      }
      const issues = validateFnIssues.map(issue => ({ ...issue, source: 'validateFn' } satisfies FFNVIssue))
      return issues.length > 0 ? issues : null
    }

    return Object.assign(this._validateFn, { issuesFrom })
  }

  async issuesFrom(value: InferFFNVInputValue<T> | undefined): Promise<FFNVIssue[] | null> {
    const results = await Promise.allSettled([
      this.schema?.issuesFrom(value),
      this.validateFn?.issuesFrom(value),
    ])

    const issues: FFNVIssue[] = []
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        issues.push(...result.value)
      }
      else if (result.status === 'rejected') {
        console.error('Validation error:', result.reason)
      }
    }
    return issues.length > 0 ? issues : null
  }

  async validate(): Promise<void> {
    if (this._isDestroyed || this._pending) {
      return
    }
    if (!this._schema && !this._validateFn) {
      return
    }
    this.setPending(true)
    try {
      const issues = await this.issuesFrom(this._value !== undefined ? this._value : this._defaultValue)
      this.setIssues(issues || [])
    }
    catch (error) {
      this.setIssues([{
        description: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        source: 'validateFn',
      }])
    }
    finally {
      this.setPending(false)
    }
  }

  handleInput(event: Event) {
    if (this._isDestroyed) {
      return
    }

    const target = event.target as HTMLElement
    const value = this._elementValue(target)

    this.setValue(value)

    if (this._validateOn.has('input')) {
      this.validate().catch(console.error)
    }
  }

  handleChange(event: Event) {
    if (this._isDestroyed) {
      return
    }

    const target = event.target as HTMLElement
    const value = this._elementValue(target)

    this.setValue(value)

    if (this._validateOn.has('change')) {
      this.validate().catch(console.error)
    }
  }

  // eslint-disable-next-line unused-imports/no-unused-vars
  handleBlur(event: Event) {
    if (this._isDestroyed) {
      return
    }

    this.setTouched(true)

    if (this._validateOn.has('blur')) {
      this.validate().catch(console.error)
    }
  }

  /**
   * Get bindings for text inputs, textareas, selects, etc.
   */
  createElementBindings(): FFNVElementBindings {
    // SSR-safe: only return serializable values
    const value = this._value
    const serializedValue = value == null
      ? ''
      : Array.isArray(value)
        ? value
        : typeof value === 'boolean'
          ? value
          : String(value)

    return {
      'value': serializedValue,
      'onchange': this.handleChange,
      'onblur': this.handleBlur,
      'oninput': this.handleInput,
      'name': this.name,
      'aria-invalid': this._valid === false,
      'aria-describedby': this._issues?.length ? `${this.name}-issues` : undefined,
    }
  }

  /**
   * Get bindings for checkbox inputs
   */
  createCheckboxElementBindings(itemValue?: string): FFNVElementBindings {
    const isChecked = itemValue !== undefined
      ? Array.isArray(this._value)
        ? this._value.includes(itemValue as typeof this._value[number])
        : this._value === itemValue
      : Boolean(this._value)

    return {
      'value': itemValue ?? 'on',
      'checked': isChecked,
      'onchange': this.handleChange,
      'onblur': this.handleBlur,
      'oninput': this.handleInput,
      'name': this.name,
      'aria-invalid': this._valid === false,
      'aria-describedby': this._issues?.length ? `${this.name}-error` : undefined,
    }
  }

  /**
   * Get bindings for radio inputs
   */
  createRadioElementBindings(itemValue: string): FFNVElementBindings {
    return {
      'value': itemValue,
      'checked': this._value === itemValue,
      'onchange': this.handleChange,
      'onblur': this.handleBlur,
      'oninput': this.handleInput,
      'name': this.name,
      'aria-invalid': this._valid === false,
      'aria-describedby': this._issues?.length ? `${this.name}-error` : undefined,
    }
  }

  /**
   * Bind to a form element directly
   */
  bind(element: HTMLElement): () => void {
    if (typeof window === 'undefined') {
      // SSR-safe: return no-op cleanup function
      return () => {}
    }

    if (this._isDestroyed) {
      console.warn('Cannot bind to element on destroyed FNV instance')
      return () => {}
    }

    // Set initial value
    const setElementValue = (value: InferFFNVInputValue<T>) => {
      if (element instanceof HTMLInputElement) {
        switch (element.type) {
          case 'checkbox':
            if (Array.isArray(value)) {
              element.checked = value.includes(element.value as typeof value[number])
            }
            else {
              element.checked = Boolean(value)
            }
            break
          case 'radio':
            element.checked = value === element.value
            break
          case 'file':
            // Can't programmatically set file input values
            break
          default:
            element.value = value == null ? '' : String(value)
        }
      }
      else if (element instanceof HTMLSelectElement) {
        if (element.multiple && Array.isArray(value)) {
          Array.from(element.options).forEach((option) => {
            option.selected = value.includes(option.value as typeof value[number])
          })
        }
        else {
          element.value = value == null ? '' : String(value)
        }
      }
      else if (element instanceof HTMLTextAreaElement) {
        element.value = value == null ? '' : String(value)
      }
    }

    // Set initial value
    setElementValue(this._value as InferFFNVInputValue<T>)

    // Add event listeners
    element.addEventListener('change', this.handleChange)
    element.addEventListener('blur', this.handleBlur)
    element.addEventListener('input', this.handleInput)

    // Listen for programmatic value changes
    const unsubscribeValue = this.on('value:updated', setElementValue as (value: InferFFNVInputValue<T> | undefined) => void)

    // Cleanup function
    return () => {
      element.removeEventListener('change', this.handleChange)
      element.removeEventListener('blur', this.handleBlur)
      element.removeEventListener('input', this.handleInput)
      unsubscribeValue()
    }
  }

  reset() {
    if (this._isDestroyed) {
      return
    }
    this.setValue(this._initialValue as InferFFNVInputValue<T>)
    this.setTouched(false)
    this.setChanged(false)
    this.setPending(false)
    this.setIssues(null)
    this.setValid(undefined)
  }

  get snapshot() {
    return structuredClone({
      _schema: this._schema,
      _initialValue: this._initialValue,
      _validateFn: this._validateFn,
      _validateOn: Array.from(this._validateOn),

      _value: this._value,
      _touched: this._touched,
      _changed: this._changed,
      _pending: this._pending,
      _valid: this._valid,
      _issues: this._issues,
    })
  }

  destroy() {
    if (this._isDestroyed) {
      return
    }
    this._listeners.clear()
  }

  get isDestroyed(): boolean {
    return this._isDestroyed
  }
}
