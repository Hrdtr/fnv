import type { FlattenObject } from './flatten-object'
import { isPlainObject } from './is-plain-object'
import { parseFlattenedObjectKeySegments } from './parse-flattened-object-key-segments'

export function deepGetObjectValue<T extends Record<string, any>, U extends keyof FlattenObject<T>>(obj: T, path: U): FlattenObject<T>[U] {
  if (!isPlainObject(obj)) {
    return undefined as FlattenObject<T>[U]
  }

  const keys = parseFlattenedObjectKeySegments(path as string)

  let current: any = obj
  for (const key of keys) {
    if (!current) {
      return current as FlattenObject<T>[U]
    }
    current = current[key]
  }

  return current as FlattenObject<T>[U]
}
