import type { StandardSchemaV1 } from '@standard-schema/spec'

async function standardValidate<T extends StandardSchemaV1>(
  schema: T,
  input: StandardSchemaV1.InferInput<T>,
) {
  let result = schema['~standard'].validate(input)
  if (result instanceof Promise) {
    result = await result
  }

  return result
}

function isStandardSchema(schema: any): schema is StandardSchemaV1 {
  return schema
    && typeof schema === 'object'
    && '~standard' in schema
    && typeof schema['~standard'] === 'object'
    && typeof schema['~standard'].validate === 'function'
}

interface FieldState {
  valid?: boolean
  dirty: boolean
  touched: boolean
  value: any
  pending?: boolean
  errors: string[]
}

type ValidationMode = 'onInput' | 'onBlur' | 'onSubmit'

export type FormValidationSuccessResult<Output> = StandardSchemaV1.SuccessResult<Output>
export type FormValidationFailureResult = StandardSchemaV1.FailureResult

type CreateFormValidator = <Schema extends StandardSchemaV1>(
  schema: Schema,
  options?: {
    onSuccess?: (result: FormValidationSuccessResult<StandardSchemaV1.InferOutput<Schema>>) => void
    onError?: (result: FormValidationFailureResult) => void
    validationMode?: ValidationMode
  }
) => {
  validate: () => Promise<void>
  validateField: (name: string, valueOverride?: any) => Promise<void>
  register: (
    name: string,
    options?: {
      initialValue?: any
      getValue?: (event: Event | any) => any
    }
  ) => {
    name: string
    onInput: (event: Event) => void
    onBlur: (event: Event) => void
  }
  getFieldState: (name: string) => FieldState
}

export const createFormValidator: CreateFormValidator = (schema, options) => {
  if (!isStandardSchema(schema)) {
    console.warn('Provided schema is not a valid StandardSchemaV1. Validation may not work as expected.')
  }

  const validationMode = options?.validationMode || 'onSubmit'
  const fieldStates = new Map<string, FieldState>()

  const getFieldState = (name: string): FieldState => {
    return fieldStates.get(name) || { dirty: false, touched: false, value: undefined, errors: [], valid: undefined, pending: false }
  }

  const updateFieldState = (name: string, updates: Partial<FieldState>) => {
    const currentState = getFieldState(name)
    fieldStates.set(name, { ...currentState, ...updates })
  }

  const validateField = async (name: string, valueOverride?: any) => { // Renamed and made optional
    updateFieldState(name, { pending: true, valid: undefined, errors: [] })
    const value = valueOverride !== undefined ? valueOverride : getFieldState(name).value // Use override or current state value
    const formData = { [name]: value }
    let issues: StandardSchemaV1.Issue[] = []

    const result = await standardValidate(schema, formData as StandardSchemaV1.InferInput<typeof schema>)
    if (result.issues) {
      issues = result.issues.filter(issue => issue.path && issue.path[0] === name)
      updateFieldState(name, { pending: false, valid: false, errors: issues.map(issue => issue.message) })
    }
    else {
      updateFieldState(name, { pending: false, valid: true, errors: [] })
    }
  }

  const validate = async () => { // Removed _formEl parameter
    const formData: Record<string | number, any> = {}

    for (const name of fieldStates.keys()) {
      const fieldState = getFieldState(name)
      formData[name] = fieldState.value
      updateFieldState(name, { touched: true, pending: true, valid: undefined, errors: [] })
    }

    const result = await standardValidate(schema, formData as StandardSchemaV1.InferInput<typeof schema>)

    if (result.issues) {
      options?.onError?.(result as FormValidationFailureResult)

      for (const issue of result.issues) {
        if (issue.path && issue.path.length > 0 && typeof issue.path[0] === 'string') {
          const fieldName = issue.path[0] as string
          const currentState = getFieldState(fieldName)
          updateFieldState(fieldName, { pending: false, valid: false, errors: [...currentState.errors, issue.message] })
        }
      }
      for (const name of fieldStates.keys()) {
        const currentState = getFieldState(name)
        if (currentState.valid === undefined) {
          updateFieldState(name, { pending: false, valid: false })
        }
      }
    }
    else {
      options?.onSuccess?.(result as FormValidationSuccessResult<StandardSchemaV1.InferOutput<typeof schema>>)
      for (const name of fieldStates.keys()) {
        updateFieldState(name, { pending: false, valid: true, errors: [] })
      }
    }
  }

  const register = (name: string, registerOptions?: { initialValue?: any, getValue?: (event: Event | any) => any }) => {
    if (!fieldStates.has(name)) {
      fieldStates.set(name, {
        dirty: false,
        touched: false,
        value: registerOptions?.initialValue,
        errors: [],
        valid: undefined,
        pending: false,
      })
    }

    const getValueFn = registerOptions?.getValue || ((event: Event) => {
      const input = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      if (!input) {
        console.warn(`Input element for field '${name}' not found in event target. Falling back to undefined value.`)
        return undefined
      }
      // Handle different input types for standard HTML elements
      if (input instanceof HTMLInputElement) {
        if (input.type === 'checkbox') {
          return input.checked
        }
        if (input.type === 'radio') {
          const form = input.form
          if (form) {
            const checkedRadio = form.querySelector(`input[name="${input.name}"]:checked`) as HTMLInputElement
            return checkedRadio ? checkedRadio.value : undefined
          }
          return input.checked ? input.value : undefined
        }
      }
      return input.value
    })

    return {
      name,
      onInput: async (event: Event) => {
        const value = getValueFn(event)
        updateFieldState(name, { dirty: true, value })
        if (validationMode === 'onInput') {
          await validateField(name, value)
        }
      },
      onBlur: async (event: Event) => {
        const value = getValueFn(event)
        updateFieldState(name, { touched: true, value })
        if (validationMode === 'onBlur') {
          await validateField(name, value)
        }
      },
    }
  }

  return {
    validate,
    validateField,
    register,
    getFieldState,
  }
}
