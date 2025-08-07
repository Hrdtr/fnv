import type { StandardSchemaV1 } from '@standard-schema/spec'
import type { FFNVIssue } from './ffnv'
import type { LooseObject } from './types'
import type { Flatten } from './utils'
import { _dirty, _getField, _setValue, _touched, _value } from './f'
import { FFNV } from './ffnv'
import { flatten } from './utils'

export type FNVIssue<T extends Record<string | number, any> = Record<string | number, any>> = Partial<{
  [K in keyof Flatten<T> | (string & {})]: FFNVIssue[] | null
}>

export type FNVValidateFn<T extends Record<string | number, any> = Record<string | number, any>> = (
  value: unknown,
  issue: Partial<{ [K in keyof Flatten<T>]: Omit<FFNVIssue, 'source'>[] | null }>
) => void | Promise<void>

export class FNV<
  T extends Record<string | number, any> | StandardSchemaV1 = Record<string | number, any>,
  U extends Record<string | number, any> = T extends StandardSchemaV1 ? StandardSchemaV1.InferOutput<T> extends Record<string | number, any> ? StandardSchemaV1.InferOutput<T> : never : T,
> {
  readonly id: string
  readonly fields: Map<string, FFNV>
  readonly schema?: T extends StandardSchemaV1 ? T : undefined
  readonly validateFn?: FNVValidateFn

  private _pending: boolean

  constructor(
    id: string,
    options?: {
      initialValue?: T extends StandardSchemaV1 ? StandardSchemaV1.InferInput<T> : T
      schema?: T extends StandardSchemaV1 ? T : undefined
      validateFn?: FNVValidateFn<U>
    },
  ) {
    this.id = id
    this.fields = new Map(
      // Initialize fields with initial values
      Object
        .entries(flatten(options?.initialValue || {}))
        .map(([key, value]) => [key, new FFNV(key, { initialValue: value })]),
    )
    this.schema = options?.schema
    this.validateFn = options?.validateFn

    this._pending = false
  }

  get value(): Partial<LooseObject<U>> {
    return _value<Partial<LooseObject<U>>>(this.fields)
  }

  get touched(): boolean {
    return _touched(this.fields)
  }

  get dirty(): boolean {
    return _dirty(this.fields)
  }

  getField<Name extends keyof Flatten<U> | (string & {})>(name: Name) {
    return _getField<Name, U>(this.fields, name)
  }

  setValue(value: Partial<LooseObject<U>>) {
    return _setValue(this.fields, value)
  }

  get pending() {
    return this._pending
  }

  get issue(): FNVIssue<U> {
    const result: FNVIssue<U> = {}
    for (const [name, field] of this.fields) {
      result[name as keyof typeof result] = field.issues
    }
    return result
  }

  get valid() {
    const states = Array.from(this.fields.values().map(field => field.valid))
    return states.includes(undefined) ? undefined : states.every(valid => valid === true)
  }

  private async getSchemaValidationIssue(value?: Partial<LooseObject<U>>): Promise<FNVIssue<U>> {
    const schemaIssues: FNVIssue<U> = {}
    if (!this.schema) {
      return schemaIssues
    }
    const result = await this.schema['~standard'].validate(value || this.value)
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
          schemaIssues[key as keyof typeof schemaIssues] = schemaIssues[key] || []
          schemaIssues[key as keyof typeof schemaIssues]!.push({
            description: item.message,
            source: 'schema',
          } satisfies FFNVIssue)
        }
      }
    }
    return schemaIssues
  }

  private async getValidateFnValidationIssue(value?: Partial<LooseObject<U>>): Promise<FNVIssue<U>> {
    const validateFnIssues: Partial<Omit<FNVIssue<U>, 'source'>> = {}
    await this.validateFn?.(value || this.value, validateFnIssues)
    return Object.fromEntries(
      Object.entries(validateFnIssues)
        .filter(([_, issues]) => issues && issues.length > 0)
        .map(([key, issues]) => [
          key,
          issues!.map(issue => ({ ...issue, source: 'validateFn' } satisfies FFNVIssue)),
        ]),
    ) as FNVIssue<U>
  }

  async getValidationIssue(valueArg?: Partial<LooseObject<U>>): Promise<FNVIssue<U>> {
    const value = arguments.length === 0 ? this.value : valueArg
    const getFieldValidationIssues = async () => {
      const issues = await Promise.all(this.fields.entries().map(([name, field]) => field.getValidationIssues(value?.[name]).then(issues => [name, issues] as const)))
      return Object.fromEntries(issues)
    }
    const [fieldValidationResults, schemaValidationResult, validateFnValidationResult] = await Promise.all([
      getFieldValidationIssues(),
      this.getSchemaValidationIssue(value),
      this.getValidateFnValidationIssue(value),
    ])
    const validationIssues: FNVIssue<U> = {}
    for (const [key, issues] of [
      ...Object.entries(fieldValidationResults),
      ...Object.entries(schemaValidationResult),
      ...Object.entries(validateFnValidationResult),
    ]
    ) {
      if (!issues || issues.length === 0) {
        continue
      }
      validationIssues[key as keyof typeof validationIssues] = [
        ...(validationIssues[key as keyof typeof validationIssues] || []),
        ...issues,
      ]
    }
    return validationIssues
  }

  async validate(): Promise<void> {
    if (this._pending) {
      return
    }
    this._pending = true

    for (const field of this.fields.values()) {
      field.reset()
      await field.validate()
    }
    const issue = await this.getValidationIssue()
    for (const [key, issues] of Object.entries(issue)) {
      if (!this.fields.has(key)) {
        this.fields.set(key, new FFNV(key, { initialValue: undefined }))
      }
      if (issues && issues.length > 0) {
        const field = this.fields.get(key)!
        field.setIssues([...(field.issues || []), ...issues])
      }
    }

    this._pending = false
  }

  async validateField<Name extends keyof Flatten<U> | (string & {})>(name: Name): Promise<void> {
    const field = this.fields.get(name as string)
    if (!field) {
      return
    }
    await field.validate()
  }

  reset() {
    for (const field of this.fields.values()) {
      field.reset()
    }
    this._pending = false
  }

  createSubmitHandler(handler: (value: LooseObject<U>) => void | Promise<void>) {
    return async (event?: Event) => {
      event?.preventDefault()
      await handler(this.value as LooseObject<U>)
    }
  }
}
