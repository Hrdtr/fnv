export function set(obj: Record<string | number, any>, path: string, value: any): void {
  const keys = parsePath(path)
  if (keys.length === 0) {
    return // nothing to set
  }

  let current = obj
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    const nextKey = keys[i + 1]

    const isArrayIndex = typeof nextKey === 'number'

    if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
      current[key] = isArrayIndex ? [] : {}
    }

    current = current[key]
  }

  const lastKey = keys[keys.length - 1]
  current[lastKey] = value
}

function parsePath(path: string): Array<string | number> {
  const parts: Array<string | number> = []
  const regex = /[^.[\]]+|\[(\d+)\]/g

  let match: RegExpExecArray | null
  // eslint-disable-next-line no-cond-assign
  while ((match = regex.exec(path))) {
    if (match[1] !== undefined) {
      // It's a number inside brackets: [0]
      parts.push(Number(match[1]))
    }
    else {
      // It's a key: a, b, c
      parts.push(match[0])
    }
  }

  return parts
}
