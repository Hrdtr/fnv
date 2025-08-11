import type { StandardSchemaV1 } from '@standard-schema/spec'
import type { FFNVIssue, FFNVOptions, FFNVValidationTrigger } from './ffnv'
import type { FFNVArrayValue, FFNVObjectValue, FFNVValue, FNVValue, LooseDeep } from './types'
import type { FlattenObject } from './utils'
import { FFNV } from './ffnv'
import { deepSetObjectValue, flattenObject, isEqual, isFFNVArrayValue, isFFNVObjectValue } from './utils'

type InferFNVValue<T extends StandardSchemaV1 | FNVValue> = T extends StandardSchemaV1
  ? StandardSchemaV1.InferInput<T> extends FNVValue
    ? StandardSchemaV1.InferInput<T>
    : never
  : T

export type FNVValidateFn<T extends StandardSchemaV1 | FNVValue = FNVValue> = (
  value: unknown,
  issues: Partial<Record<keyof FlattenObject<InferFNVValue<T>> | (string & {}), Omit<FFNVIssue, 'source'>[] | null>>
) => void | Promise<void>

export type FNVIssue<T extends StandardSchemaV1 | FNVValue = FNVValue>
  = Partial<Record<keyof FlattenObject<InferFNVValue<T>> | (string & {}), FFNVIssue[] | null>>

export interface FNVOptions<T extends StandardSchemaV1 | FNVValue = FNVValue> {
  schema?: T extends StandardSchemaV1 ? T : undefined
  initialValue?: T extends StandardSchemaV1
    ? StandardSchemaV1.InferInput<T> extends FNVValue
      ? StandardSchemaV1.InferInput<T>
      : never
    : T
  validateFn?: FNVValidateFn<InferFNVValue<T>>
  validateFieldOn?: FFNVValidationTrigger[]
}

interface FNVEventHandlers<T extends StandardSchemaV1 | FNVValue = FNVValue> {
  'value:updated': (value: Partial<LooseDeep<InferFNVValue<T>>>) => void
  'pending:updated': (pending: boolean) => void
  'touched:updated': (touched: boolean) => void
  'changed:updated': (changed: boolean) => void
  'valid:updated': (valid: boolean | undefined) => void
  'issues:updated': (issues: FNVIssue<InferFNVValue<T>>) => void
}

export class FNV<T extends StandardSchemaV1 | FNVValue = FNVValue> {
  readonly id: string

  private readonly _schema?: T extends StandardSchemaV1 ? T : undefined
  private readonly _initialValue?: Partial<LooseDeep<InferFNVValue<T>>>
  private readonly _validateFn?: FNVValidateFn<T>
  private readonly _validateFieldOn: FFNVValidationTrigger[]

  private _fields = new Map<string, FFNV<string, any>>()
  private _listeners = new Map<keyof FNVEventHandlers<T>, Set<(...args: unknown[]) => void>>()
  private _syncingField?: string
  private _isDestroyed = false

  private _value: Partial<LooseDeep<InferFNVValue<T>>>
  private _pending: boolean
  private _touched: boolean
  private _changed: boolean
  private _valid: boolean | undefined
  private _issues: FNVIssue<InferFNVValue<T>>

  constructor(id: string, options?: FNVOptions<T>) {
    this.id = id

    this._schema = options?.schema
    this._initialValue = options?.initialValue as Partial<LooseDeep<InferFNVValue<T>>> | undefined
    this._validateFn = options?.validateFn
    this._validateFieldOn = options?.validateFieldOn || ['change']

    if (options?.initialValue) {
      const flattened = flattenObject(options.initialValue)
      for (const [path, fieldValue] of Object.entries(flattened)) {
        this._registerField(path, { initialValue: fieldValue })
      }
    }

    const value: Partial<LooseDeep<InferFNVValue<T>>> = {}
    if (options?.initialValue) {
      for (const [name, field] of this._fields) {
        deepSetObjectValue(value, name, field.value)
      }
    }
    this._value = value
    this._pending = false
    this._touched = false
    this._changed = false
    this._valid = undefined
    this._issues = {}
  }

  on<K extends keyof FNVEventHandlers<T>>(event: K, handler: FNVEventHandlers<T>[K]): () => void {
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

  private _emit<K extends keyof FNVEventHandlers<T>>(event: K, ...args: Parameters<FNVEventHandlers<T>[K]>) {
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
      }
    })
  }

  private _registerField(name: string, options?: FFNVOptions<any>) {
    if (this._fields.has(name)) {
      return
    }

    const validateOn = options?.validateOn || this._validateFieldOn
    const field = new FFNV(name, { ...options, validateOn })
    this._fields.set(name, field)

    // Set up field event listeners for value synchronization
    field.on('value:updated', value => this._onFieldValueChange(name, value))
    field.on('pending:updated', () => this._updatePending())
    field.on('valid:updated', () => this._updateValid())
    field.on('issues:updated', () => this._updateIssues())
    field.on('touched:updated', () => this._updateTouched())
    field.on('changed:updated', () => this._updateChanged())

    // Handle object/array field registration
    if (isFFNVObjectValue(field.value)) {
      this._registerFieldObjectChildren(name, field.value, (_, childValue) => ({
        initialValue: childValue,
        validateOn,
      }))
    }
    else if (isFFNVArrayValue(field.value)) {
      this._registerFieldArrayChildren(name, field.value, (_, childValue) => ({
        initialValue: childValue,
        validateOn,
      }))
    }
  }

  private _updatePending() {
    const newPending = this.pending
    if (this._pending !== newPending) {
      this._pending = newPending
      this._emit('pending:updated', newPending)
    }
  }

  private _updateTouched() {
    const newTouched = this.touched
    if (this._touched !== newTouched) {
      this._touched = newTouched
      this._emit('touched:updated', newTouched)
    }
  }

  private _updateChanged() {
    const newChanged = this.changed
    if (this._changed !== newChanged) {
      this._changed = newChanged
      this._emit('changed:updated', newChanged)
    }
  }

  private _updateValid() {
    const newValid = this.valid
    if (this._valid !== newValid) {
      this._valid = newValid
      this._emit('valid:updated', newValid)
    }
  }

  private _updateIssues() {
    if (this._pending) {
      return
    }
    const newIssues = this.issues
    if (!isEqual(this._issues, newIssues)) {
      this._issues = newIssues
      this._emit('issues:updated', newIssues)
    }
  }

  private _registerFieldObjectChildren(
    parentName: string,
    object: FFNVObjectValue,
    childFieldOptions?: (childName: string, childValue?: unknown) => FFNVOptions<any> | undefined,
  ) {
    for (const [key, childValue] of Object.entries(object)) {
      const childName = `${parentName}.${key}`
      const options = childFieldOptions ? childFieldOptions(childName, childValue) : undefined
      this._registerField(childName, options)
      if (childValue !== options?.initialValue) {
        this._fields.get(childName)!.setValue(childValue)
      }
    }
  }

  private _registerFieldArrayChildren(
    parentName: string,
    array: FFNVArrayValue,
    childFieldOptions?: (childName: string, childValue?: unknown) => FFNVOptions<any> | undefined,
  ) {
    for (let i = 0; i < array.length; i++) {
      const childName = `${parentName}[${i}]`
      const options = childFieldOptions ? childFieldOptions(childName, array[i]) : undefined
      this._registerField(childName, options)
      if (array[i] !== options?.initialValue) {
        this._fields.get(childName)!.setValue(array[i])
      }
    }
  }

  private _onFieldValueChange(fieldName: string, fieldValue: unknown) {
    if (this._syncingField === fieldName) {
      return
    }

    const previousValue = structuredClone(this.value)
    this._syncingField = fieldName

    try {
      this._syncFieldChildrenOnValueChange(fieldName, fieldValue)
      this._syncFieldParentOnValueChange(fieldName, fieldValue)

      const newValue = this.value
      if (!isEqual(this._value, newValue)) {
        this._value = newValue
        this._emit('value:updated', newValue)
      }
    }
    catch (error) {
      console.error(`Error syncing field value for ${fieldName}:`, error)
      this.setValue(previousValue)
    }
    finally {
      this._syncingField = undefined
    }
  }

  private _syncFieldChildrenOnValueChange(fieldName: string, fieldValue: unknown) {
    const currentValue = this.value
    const currentFieldChildrenSnapshotMap = new Map(
      this._fieldChildrenOf(fieldName).map(field => [field.name, field.snapshot]),
    )
    this._clearFieldChildrenOf(fieldName)

    // Add new children based on new value
    if (isFFNVObjectValue(fieldValue)) {
      this._registerFieldObjectChildren(fieldName, fieldValue, (childName) => {
        const snapshot = currentFieldChildrenSnapshotMap.get(childName)
        if (!snapshot) {
          return
        }
        return {
          schema: snapshot._schema,
          initialValue: snapshot._initialValue,
          validateFn: snapshot._validateFn,
          validateOn: snapshot._validateOn,
        }
      })
    }
    else if (isFFNVArrayValue(fieldValue)) {
      this._registerFieldArrayChildren(fieldName, fieldValue, (childName) => {
        const snapshot = currentFieldChildrenSnapshotMap.get(childName)
        if (!snapshot) {
          return
        }
        return {
          schema: snapshot._schema,
          initialValue: snapshot._initialValue,
          validateFn: snapshot._validateFn,
          validateOn: snapshot._validateOn,
        }
      })
    }

    const newValue = this.value
    if (!isEqual(currentValue, newValue)) {
      this._emit('value:updated', newValue)
    }
  }

  private _syncFieldParentOnValueChange(fieldName: string, fieldValue: unknown) {
    const parentName = this._parentNameOf(fieldName)
    if (!parentName) {
      return
    }

    const parentField = this._fields.get(parentName)
    if (!parentField) {
      return
    }

    const currentParentValue = parentField.value || {}
    const isArray = Array.isArray(currentParentValue)
    const relativePath = fieldName.substring(parentName.length + 1) // Remove parent path prefix

    try {
      const result = isArray ? { value: [...currentParentValue] } : { ...currentParentValue }
      deepSetObjectValue(result, isArray ? `value.${relativePath}` : relativePath, fieldValue)

      const updatedParentValue = isArray ? result.value : result
      if (!isEqual(parentField.value, updatedParentValue)) {
        parentField.setValue(updatedParentValue)
      }
    }
    catch (error) {
      console.error(`Error updating parent field ${parentName}:`, error)
    }
  }

  private _parentNameOf(childName: string): string | undefined {
    // Handle array index: "parent[0]" -> "parent"
    const arrayMatch = childName.match(/^(.+)\[\d+\]$/)
    if (arrayMatch) {
      return arrayMatch[1]
    }

    // Handle object property: "parent.child" -> "parent"
    const dotIndex = childName.lastIndexOf('.')
    if (dotIndex > 0) {
      return childName.substring(0, dotIndex)
    }

    return undefined
  }

  private _fieldChildrenOf(parentName: string): FFNV[] {
    const childPrefix = `${parentName}.`
    const arrayPrefix = `${parentName}[`

    return Array.from(this._fields.values()).filter(field =>
      field.name.startsWith(childPrefix) || field.name.startsWith(arrayPrefix),
    )
  }

  private _clearFieldChildrenOf(parentName: string) {
    for (const childField of this._fieldChildrenOf(parentName)) {
      this._fields.delete(childField.name)
      childField.destroy()
    }
  }

  // Register a field and automatically register all its leaves if it's an object/array
  register<
    Name extends keyof FlattenObject<InferFNVValue<T>> | (string & {}),
    FieldType extends StandardSchemaV1 | FFNVValue = Name extends keyof FlattenObject<InferFNVValue<T>>
      ? FlattenObject<InferFNVValue<T>>[Name] extends FNVValue
        ? FlattenObject<InferFNVValue<T>>[Name]
        : never
      : FFNVValue,
  >(
    name: Name,
    options?: FFNVOptions<FieldType>,
  ): void {
    if (this._isDestroyed) {
      console.warn('Cannot register fields on destroyed FNV instance')
      return
    }
    this._registerField(name as string, options)
  }

  // Unregister a field and all its children
  unregister<Name extends keyof FlattenObject<InferFNVValue<T>> | (string & {})>(name: Name): void {
    if (this._isDestroyed) {
      console.warn('Cannot unregister fields on destroyed FNV instance')
      return
    }

    const fieldName = name as string
    const field = this._fields.get(fieldName)
    if (!field) {
      return
    }

    // Remove the field itself
    field.destroy()
    this._fields.delete(fieldName)

    // Remove all children (fields that start with this field's path)
    this._clearFieldChildrenOf(fieldName)

    // Update form state
    const newValue = this.value
    if (!isEqual(this._value, newValue)) {
      this._value = newValue
      this._emit('value:updated', newValue)
    }
  }

  // Get a field by name
  field<Name extends keyof FlattenObject<InferFNVValue<T>> | (string & {})>(name: Name): FFNV | undefined {
    return this._fields.get(name as string)
  }

  // Get all registered field names
  get fieldNames(): string[] {
    return Array.from(this._fields.keys())
  }

  get value(): Partial<LooseDeep<InferFNVValue<T>>> {
    const value: Partial<LooseDeep<InferFNVValue<T>>> = {}
    for (const [path, field] of this._fields) {
      if (field.value !== undefined) {
        deepSetObjectValue(value, path, field.value)
      }
    }
    return value
  }

  setValue(value: Partial<LooseDeep<InferFNVValue<T>>>) {
    if (this._isDestroyed) {
      console.warn('Cannot set value on destroyed FNV instance')
      return
    }

    const flattened = flattenObject(value)

    // Batch updates to minimize events
    const fieldsToUpdate: Array<[string, unknown]> = []
    const fieldsToRegister: Array<[string, unknown]> = []

    for (const [path, fieldValue] of Object.entries(flattened)) {
      const field = this._fields.get(path)
      if (field) {
        fieldsToUpdate.push([path, fieldValue])
      }
      else {
        fieldsToRegister.push([path, fieldValue])
      }
    }

    // Register new fields first
    for (const [path, fieldValue] of fieldsToRegister) {
      this._registerField(path)
      this._fields.get(path)!.setValue(fieldValue)
    }

    // Update existing fields
    for (const [path, fieldValue] of fieldsToUpdate) {
      this._fields.get(path)!.setValue(fieldValue)
    }

    // Remove fields that no longer exist in the value
    const pathsToRemove = Array.from(this._fields.keys()).filter(path => !(path in flattened))
    for (const path of pathsToRemove) {
      this.unregister(path)
    }

    if (!isEqual(this._value, value)) {
      this._value = value
      this._emit('value:updated', value)
    }
  }

  get pending(): boolean {
    return Array.from(this._fields.values()).some(field => field.pending)
  }

  get touched(): boolean {
    return Array.from(this._fields.values()).some(field => field.touched)
  }

  get changed(): boolean {
    return Array.from(this._fields.values()).some(field => field.changed)
  }

  get valid(): boolean | undefined {
    const fieldValues = Array.from(this._fields.values())
    if (fieldValues.some(field => field.valid === undefined)) {
      return undefined
    }
    if (fieldValues.some(field => field.valid === false)) {
      return false
    }
    return true
  }

  get issues(): FNVIssue<InferFNVValue<T>> {
    const result: FNVIssue<InferFNVValue<T>> = {}
    for (const [path, field] of this._fields) {
      if (field.issues && field.issues.length > 0) {
        result[path as keyof typeof result] = field.issues
      }
    }
    return result
  }

  setIssues(issues: FNVIssue<InferFNVValue<T>>) {
    if (this._isDestroyed) {
      return
    }

    for (const [path, fieldIssues] of Object.entries(issues)) {
      const field = this._fields.get(path)
      if (field) {
        field.setIssues(fieldIssues || null)
      }
    }
    if (!isEqual(this._issues, issues)) {
      this._issues = issues
      this._emit('issues:updated', issues)
    }
  }

  get schema() {
    if (!this._schema) {
      return undefined
    }

    const issuesFrom = async (value: Partial<LooseDeep<InferFNVValue<T>>>) => {
      const schemaIssue: FNVIssue<InferFNVValue<T>> = {}
      if (!this._schema) {
        return schemaIssue
      }
      try {
        const result = await this._schema['~standard'].validate(value)
        if (result?.issues) {
          const parsePath = (schemaPath: StandardSchemaV1.Issue['path']): string | undefined => {
            if (!schemaPath || schemaPath.length === 0) {
              return undefined
            }
            let path = String(schemaPath[0])
            for (let i = 1; i < schemaPath.length; i++) {
              const key = schemaPath[i]
              if (typeof key === 'number') {
                path += `[${key}]`
              }
              else {
                path += `.${String(key)}`
              }
            }
            return path
          }
          for (const item of result.issues) {
            const key = parsePath(item.path)
            if (key) {
              const typedKey = key as keyof typeof schemaIssue
              schemaIssue[typedKey] = schemaIssue[typedKey] || []
              schemaIssue[typedKey]!.push({
                description: item.message,
                source: 'fnv:schema',
              } satisfies FFNVIssue)
            }
          }
        }
      }
      catch (error) {
        console.error('Schema validation error:', error)
      }
      return schemaIssue
    }

    return Object.assign(this._schema, { issuesFrom })
  }

  get validateFn() {
    if (!this._validateFn) {
      return undefined
    }

    const issuesFrom = async (value: Partial<LooseDeep<InferFNVValue<T>>>) => {
      const validateFnIssue: Partial<Record<keyof FlattenObject<InferFNVValue<T>> | (string & {}), Omit<FFNVIssue, 'source'>[] | null>> = {}
      try {
        await this._validateFn?.(value || this.value, validateFnIssue)
      }
      catch (error) {
        console.error('Validation function error:', error)
      }
      return Object.fromEntries(
        Object.entries(validateFnIssue)
          .filter(([_, issues]) => issues && issues.length > 0)
          .map(([key, issues]) => [
            key,
            issues!.map(issue => ({ ...issue, source: 'fnv:validateFn' } satisfies FFNVIssue)),
          ]),
      ) as FNVIssue<InferFNVValue<T>>
    }

    return Object.assign(this._validateFn, { issuesFrom })
  }

  async issuesFrom(value: Partial<LooseDeep<InferFNVValue<T>>>, { recursive } = { recursive: true }): Promise<FNVIssue<InferFNVValue<T>>> {
    const valueOf = (name: string) => {
      const paths = name.replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean)
      let current: any = value
      for (const key of paths) {
        current = current?.[key]
        if (current === undefined)
          break
      }
      return current
    }

    const fieldsValidationIssuesFrom = recursive
      ? async () => {
        const entries = await Promise.allSettled(
          Array.from(this._fields).map(async ([name, field]) => {
            const fieldValue = valueOf(name)
            const issues = await field.issuesFrom(fieldValue)
            return [name, issues] as const
          }),
        )

        return Object.fromEntries(
          entries
            .filter((result): result is PromiseFulfilledResult<readonly [string, FFNVIssue[] | null]> =>
              result.status === 'fulfilled')
            .map(result => result.value)
            .filter(([_, issues]) => issues && issues.length > 0),
        ) as FNVIssue<InferFNVValue<T>>
      }
      : undefined

    const results = await Promise.allSettled([
      fieldsValidationIssuesFrom?.(),
      this.schema?.issuesFrom(value),
      this.validateFn?.issuesFrom(value),
    ])

    const validationIssue: FNVIssue<InferFNVValue<T>> = {}

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        for (const [key, issues] of Object.entries(result.value)) {
          if (issues && issues.length > 0) {
            const typedKey = key as keyof typeof validationIssue
            validationIssue[typedKey] = [
              ...(validationIssue[typedKey] || []),
              ...issues,
            ]
          }
        }
      }
      else if (result.status === 'rejected') {
        console.error('Validation error:', result.reason)
      }
    }

    return validationIssue
  }

  async validate(): Promise<void> {
    if (this._isDestroyed || this.pending) {
      return
    }

    // Use a more atomic approach to pending state
    const previousPending = this._pending
    this._pending = true
    this._emit('pending:updated', true)

    try {
      const fieldValidations = Array.from(this._fields.values()).map(field => field.validate())
      await Promise.allSettled(fieldValidations)

      // Get issues without recursive field validation to avoid double validation
      const issues = await this.issuesFrom(this.value, { recursive: false })
      this.setIssues(issues)
    }
    catch (error) {
      console.error('Form validation error:', error)
    }
    finally {
      this._pending = previousPending
      this._emit('pending:updated', previousPending)
    }
  }

  /**
   * Creates a submit handler that validates the form before executing the callback
   * Prevents form submission if validation fails
   */
  createSubmitHandler(
    callback: <V extends boolean>(
      data: {
        value: V extends true ? InferFNVValue<T> : Partial<LooseDeep<InferFNVValue<T>>>
        valid: V
        issues: FNVIssue<InferFNVValue<T>>
      }
    ) => void | Promise<void>,
  ) {
    return async (event: SubmitEvent) => {
      // Always prevent default form submission initially
      event.preventDefault()

      if (this._isDestroyed) {
        console.warn('Cannot submit destroyed FNV instance')
        return
      }

      try {
        await this.validate()
        await callback({
          value: this.value,
          valid: this.valid || false,
          issues: this.issues,
        })
      }
      catch (error) {
        console.error('Form submission error:', error)
        // Don't re-throw to prevent unhandled promise rejection
      }
    }
  }

  reset() {
    if (this._isDestroyed) {
      return
    }

    // Reset all fields first
    this._fields.forEach(field => field.reset())

    // Reset form-level state
    if (this._initialValue) {
      this.setValue(this._initialValue)
    }
    else {
      this.setValue({})
    }

    // Reset other form state
    this._pending = false
    this._touched = false
    this._changed = false
    this._valid = undefined
    this._issues = {}

    // Emit events for all state changes
    this._emit('pending:updated', false)
    this._emit('touched:updated', false)
    this._emit('changed:updated', false)
    this._emit('valid:updated', undefined)
    this._emit('issues:updated', {})
  }

  destroy() {
    if (this._isDestroyed) {
      return
    }

    this._isDestroyed = true
    this._fields.forEach(field => field.destroy())
    this._fields.clear()
    this._listeners.clear()
  }

  get isDestroyed(): boolean {
    return this._isDestroyed
  }
}
