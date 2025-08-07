import type { FFNV, FFNVIssue } from './ffnv'
import type { LooseObject } from './types'
import type { Flatten } from './utils'
import { FF } from './ff'
import { flatten, isPlainObject, set } from './utils'

export class F<T extends Record<string | number, any> = Record<string | number, any>> {
  readonly id: string
  readonly fields: Map<string, FF>

  constructor(id: string, options?: { initialValue?: T }) {
    this.id = id
    this.fields = new Map(
      // Initialize fields with initial values
      Object
        .entries(flatten(options?.initialValue || {}))
        .map(([key, value]) => [key, new FF(key, { initialValue: value })]),
    )
  }

  get value(): Partial<LooseObject<T>> {
    return _value<Partial<LooseObject<T>>>(this.fields)
  }

  get touched(): boolean {
    return _touched(this.fields)
  }

  get dirty(): boolean {
    return _dirty(this.fields)
  }

  getField<Name extends keyof Flatten<T> | (string & {})>(name: Name) {
    return _getField<Name, T>(this.fields, name)
  }

  setValue(value: Partial<LooseObject<T>>) {
    return _setValue(this.fields, value)
  }

  reset() {
    for (const field of this.fields.values()) {
      field.reset()
    }
  }

  createSubmitHandler(handler: (value: Partial<LooseObject<T>>) => void | Promise<void>) {
    return async (event?: Event) => {
      event?.preventDefault()
      await handler(this.value)
    }
  }
}

export function _value<T extends Record<string | number, any>>(fields: Map<string, FF | FFNV>): any {
  const result: Partial<LooseObject<T>> = {}
  fields.forEach((field, path) => set(result, String(path), field.value))

  return result as Partial<LooseObject<T>>
}

export function _touched(fields: Map<string, FF | FFNV>): boolean {
  return Array.from(fields.values()).some(field => field.touched)
}

export function _dirty(fields: Map<string, FF | FFNV>): boolean {
  return Array.from(fields.values()).some(field => field.dirty)
}

export function _getField<Name extends keyof Flatten<ReferenceType> | (string & {}), ReferenceType extends Record<string | number, any>>(
  fields: Map<string, FFNV>,
  name: Name
): Name extends keyof Flatten<ReferenceType>
  ? FFNV<Name, any, Flatten<ReferenceType>[Name]>
  : FFNV<Name, any> | undefined
export function _getField<Name extends keyof Flatten<ReferenceType> | (string & {}), ReferenceType extends Record<string | number, any>>(
  fields: Map<string, FF>,
  name: Name
): Name extends keyof Flatten<ReferenceType>
  ? FF<Name, Flatten<ReferenceType>[Name]>
  : FF<Name, any> | undefined
export function _getField<Name extends keyof Flatten<ReferenceType> | (string & {}), ReferenceType extends Record<string | number, any>>(
  fields: Map<string, FF | FFNV>,
  name: Name,
) {
  const path = name as string

  if (fields.has(path)) {
    return fields.get(path)
  }

  const childNames = Array.from(fields.keys()).filter(key => key.startsWith(path) && key !== path)
  if (childNames.length === 0) {
    return undefined
  }

  const isArray = childNames.some(key => key.includes('['))
  const FieldConstructor = fields.values().next().value?.constructor as any
  if (!FieldConstructor) {
    return undefined
  }

  const proxyField = new FieldConstructor(path) as FF | FFNV
  const getFieldChildren = () => childNames.map(key => fields.get(key)).filter(Boolean) as (FF | FFNV)[]

  // Override value getter
  Object.defineProperty(proxyField, 'value', {
    get: () => {
      if (isArray) {
        const result: any[] = []
        const processedIndex: number[] = []
        childNames.forEach((childPath) => {
          const match = childPath.match(/\[(\d+)\]/)
          if (match) {
            const index = Number.parseInt(match[1], 10)
            if (processedIndex.includes(index)) {
              return
            }
            if (childPath.startsWith(`${path}[${index}][`)) {
              const nestedArrayFieldNames = childNames.filter(key => key.startsWith(`${path}[${index}][`))
              const nestedArrayWrapper: Record<string | number, any> = { value: [] }
              nestedArrayFieldNames.forEach((childPath) => {
                const relativePath = childPath.replace(`${path}[${index}]`, 'value.')
                set(nestedArrayWrapper, relativePath, fields.get(childPath)!.value)
              })
              result[index] = nestedArrayWrapper.value
            }
            else if (!childPath.endsWith(']')) {
              const nestedObjectFieldNames = childNames.filter(key => key.startsWith(`${path}[${index}]`))
              const nestedObject: Record<string | number, any> = {}
              nestedObjectFieldNames.forEach((childPath) => {
                const relativePath = childPath.replace(`${path}[${index}]`, '')
                set(nestedObject, relativePath, fields.get(childPath)!.value)
              })
              result[index] = nestedObject
            }
            else {
              result[index] = fields.get(childPath)!.value
            }
            processedIndex.push(index)
          }
        })
        return result
      }
      else {
        const result: Record<string | number, any> = {}
        childNames.forEach((childPath) => {
          const relativePath = childPath.replace(`${path}.`, '')
          set(result, relativePath, fields.get(childPath)!.value)
        })
        return result
      }
    },
    configurable: true,
  })

  proxyField.setValue = (value: any) => {
    childNames.forEach(childPath => fields.delete(childPath))
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        const fullPath = `${path}[${index}]`
        if (!fields.has(fullPath)) {
          fields.set(fullPath, new FieldConstructor(fullPath))
        }
        fields.get(fullPath)!.setValue(item)
      })
    }
    else if (isPlainObject(value)) {
      const flattened = flatten(value)
      Object.entries(flattened).forEach(([key, val]) => {
        const fullPath = `${path}.${key}`
        if (!fields.has(fullPath)) {
          fields.set(fullPath, new FieldConstructor(fullPath))
        }
        fields.get(fullPath)!.setValue(val)
      })
    }
  }

  Object.defineProperty(proxyField, 'touched', {
    get: () => {
      const children = getFieldChildren()
      return children.some(child => child.touched) satisfies FF['touched'] | FFNV['touched']
    },
    configurable: true,
  })

  proxyField.setTouched = function (touched: boolean) {
    const children = getFieldChildren()
    children.forEach(child => child.setTouched(touched))
  }

  Object.defineProperty(proxyField, 'dirty', {
    get: () => {
      const children = getFieldChildren()
      return children.some(child => child.dirty)
    },
    configurable: true,
  })

  // FFNV-specific overrides
  if ('validate' in proxyField) {
    const ffnvProxy = proxyField as FFNV

    Object.defineProperty(proxyField, 'pending', {
      get: () => getFieldChildren().some(child => 'pending' in child && child.pending),
      configurable: true,
    })

    // Override issues getter
    Object.defineProperty(proxyField, 'issues', {
      get: () => {
        const children = getFieldChildren().filter(child => 'issues' in child) as FFNV[]
        const childIssues = children.flatMap(child => child.issues)
        return childIssues.every(issue => issue === null) ? null : childIssues
      },
      configurable: true,
    })

    proxyField.setIssues = function (issues: FFNVIssue[] | null) {
      const children = getFieldChildren().filter(child => 'setIssues' in child) as FFNV[]
      children.forEach(child => child.setIssues(issues))
    }

    // Override valid getter
    Object.defineProperty(proxyField, 'valid', {
      get: () => {
        const children = getFieldChildren().filter(child => 'valid' in child) as FFNV[]
        if (children.some(child => child.valid === false)) {
          return false
        }
        if (children.every(child => child.valid === true)) {
          return true
        }
        return undefined
      },
      configurable: true,
    })

    ffnvProxy.getValidationIssues = async function (valueArg?: any | undefined): Promise<FFNVIssue[] | null> {
      const children = getFieldChildren().filter(child => 'getValidationIssues' in child) as FFNV[]
      const flattenedValue = flatten(valueArg || {})
      const childIssues = await Promise.all(children.map(child => arguments.length === 0 ? child.getValidationIssues() : child.getValidationIssues(flattenedValue[child.name])))
      const issues = childIssues.filter(issues => issues !== null).flatMap(issues => issues)
      return issues.length > 0 ? issues : null
    }

    // Override validate
    ffnvProxy.validate = async () => {
      const children = getFieldChildren().filter(child => 'validate' in child) as FFNV[]
      await Promise.all(children.map(child => child.validate()))
    }
  }

  return proxyField
}

export function _setValue<T extends Record<string | number, any>>(fields: Map<string, FF | FFNV>, value: Partial<LooseObject<T>>) {
  const flattenedValue: Record<string | number, any> = {}
  const traverse = (obj: any, currentPath: string = '') => {
    if (isPlainObject(obj)) {
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const newPath = currentPath ? `${currentPath}.${key}` : key
          traverse(obj[key], newPath)
        }
      }
    }
    else if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        const newPath = currentPath ? `${currentPath}[${index}]` : `[${index}]`
        traverse(item, newPath)
      })
    }
    else {
      flattenedValue[currentPath] = obj
    }
  }
  traverse(value)
  for (const [key, val] of Object.entries(flattenedValue)) {
    if (!fields.has(key)) {
      fields.set(key, new FF(key))
    }
    fields.get(key)?.setValue(val)
  }
}
