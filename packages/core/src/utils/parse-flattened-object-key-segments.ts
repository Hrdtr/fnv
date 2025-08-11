export function parseFlattenedObjectKeySegments(path: string): Array<string | number> {
  const parts: Array<string | number> = []
  let current = ''
  let isInsideArray = false

  for (let i = 0; i < path.length; i++) {
    const char = path[i]

    if (char === '[') {
      isInsideArray = true
      if (current !== '') {
        parts.push(current)
        current = ''
      }
    }
    else if (char === ']') {
      isInsideArray = false
      if (current !== '') {
        parts.push(Number(current))
        current = ''
      }
    }
    else if (char === '.' && !isInsideArray) {
      if (current !== '') {
        parts.push(current)
        current = ''
      }
    }
    else if (char === '\\' && i < path.length - 1) {
      i++
      current += path[i]
    }
    else {
      current += char
    }
  }

  if (current !== '') {
    parts.push(current)
  }

  return parts
}
