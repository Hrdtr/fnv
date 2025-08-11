import { isPlainObject } from './is-plain-object'
import { parseFlattenedObjectKeySegments } from './parse-flattened-object-key-segments'

export function deepSetObjectValue(obj: Record<string, any>, path: string, value: any) {
  if (!isPlainObject(obj)) {
    return
  }

  const keys = parseFlattenedObjectKeySegments(path)
  if (keys.length === 0) {
    obj = value
    return
  }

  let current = obj as Record<string, any>
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    const nextKey = keys[i + 1]
    const nextIsArray = typeof nextKey === 'number'

    if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
      current[key] = nextIsArray ? [] : {}
    }

    current = current[key]
  }

  const lastKey = keys[keys.length - 1]
  current[lastKey] = value
}
