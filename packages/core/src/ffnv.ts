import type { StandardSchemaV1 } from '@standard-schema/spec'

export interface FFNVIssue {
  description: string
  source: 'form.schema' | 'form.validateFn' | 'schema' | 'validateFn'
}

export type FFNVValidateFn = (value: unknown, issues: Omit<FFNVIssue, 'source'>[]) => void | Promise<void>
export type FFNVValueGetter = () => unknown
export type FFNVValueSetter = (value: unknown) => void

export interface FFNVOptions<T extends StandardSchemaV1 | any> {
  value?: {
    get: FFNVValueGetter
    set: FFNVValueSetter
  }
  initialValue?: T extends StandardSchemaV1 ? StandardSchemaV1.InferInput<T> : T
  schema?: T extends StandardSchemaV1 ? T : undefined
  validateFn?: FFNVValidateFn
}

export class FFNV<Name extends string = string, T extends StandardSchemaV1 | any = any, U = T extends StandardSchemaV1 ? StandardSchemaV1.InferOutput<T> : T> {
  readonly name: Name
  readonly initialValue: U | undefined
  readonly schema: (T extends StandardSchemaV1 ? T : undefined) | undefined
  readonly validateFn: FFNVValidateFn | undefined

  private _getValue: FFNVValueGetter | undefined
  private _setValue: FFNVValueSetter | undefined
  private _value: U | undefined
  private _touched: boolean
  private _pending: boolean
  private _issues: FFNVIssue[] | null

  constructor(name: Name, options?: FFNVOptions<T>) {
    this.name = name
    this.initialValue = options?.initialValue as U
    this.schema = options?.schema
    this.validateFn = options?.validateFn

    this._getValue = options?.value?.get
    this._setValue = options?.value?.set
    this._value = options?.initialValue as U
    this._touched = false
    this._pending = false
    this._issues = null
  }

  get value() {
    return this._getValue?.() || this._value
  }

  setValue(value: U) {
    this._value = value
  }

  get touched() {
    return this._touched
  }

  setTouched(touched: boolean) {
    this._touched = touched
  }

  get changed() {
    return this._value !== this.initialValue
  }

  get pending(): boolean {
    return this._pending
  }

  get issues() {
    return this._issues
  }

  setIssues(issues: FFNVIssue[] | null) {
    this._issues = issues
  }

  get valid() {
    return this.issues === null ? undefined : this.issues.length === 0
  }

  private async _getSchemaValidationIssues(value: U | undefined): Promise<FFNVIssue[] | null> {
    const schemaIssues: FFNVIssue[] = []
    if (!this.schema) {
      return schemaIssues
    }
    const result = await this.schema['~standard'].validate(value)
    if (result?.issues) {
      schemaIssues.push(...result.issues.map(issue => ({ description: issue.message, source: 'schema' } satisfies FFNVIssue)))
    }
    return schemaIssues.length > 0 ? schemaIssues : null
  }

  private async _getValidateFnValidationIssues(value: U | undefined): Promise<FFNVIssue[] | null> {
    const validateFnIssues: Omit<FFNVIssue, 'source'>[] = []
    await this.validateFn?.(value, validateFnIssues)
    const issues = validateFnIssues.map(issue => ({ ...issue, source: 'validateFn' } satisfies FFNVIssue))
    return issues.length > 0 ? issues : null
  }

  async getValidationIssues(valueArg?: U | undefined): Promise<FFNVIssue[] | null> {
    const value = arguments.length === 0 ? this.value : valueArg
    const [schemaValidationResult, validateFnValidationResult] = await Promise.all([
      this._getSchemaValidationIssues(value),
      this._getValidateFnValidationIssues(value),
    ])
    const issues = [...(schemaValidationResult || []), ...(validateFnValidationResult || [])]
    return issues.length > 0 ? issues : null
  }

  async validate(): Promise<void> {
    if (this._pending) {
      return
    }
    this._pending = true
    this._issues = await this.getValidationIssues() || []
    this._pending = false
  }

  reset() {
    this._value = this.initialValue
    this._touched = false
    this._pending = false
    this._issues = null
  }
}
