import { F } from './f'
import { FF } from './ff'

export function createFormField<Name extends string, ValueType>(
  name: Name,
  options?: { initialValue?: ValueType },
): FF<Name, ValueType> {
  return new FF(name, options)
}

export function createForm<FieldsObject extends Record<string, { initialValue?: any }>>(id: string, fields: FieldsObject): F<{ [K in keyof FieldsObject]: FF<K & string, FieldsObject[K]['initialValue']> }[keyof FieldsObject][]>
export function createForm<Fields extends FF<string, any>[]>(id: string, fields: Fields): F<Fields>
export function createForm(id: string): F<FF<string, any>[]>
export function createForm(id: string, fields?: Record<string, { initialValue?: any }> | FF<string, any>[]) {
  if (Array.isArray(fields)) {
    return new F(id, fields)
  }
  if (fields && typeof fields === 'object') {
    const fieldsTuple = Object.entries(fields).map(([name, options]) => new FF(name, options))
    return new F(id, fieldsTuple)
  }
  return new F(id)
}
