/**
 * Checks if a value is a plain object.
 *
 * @template T The type of the value to check.
 * @param {T} o The value to check.
 * @returns {o is PlainObject<T>} A boolean indicating if the value is a plain object.
 */
export function isPlainObject(o: unknown): o is Record<string | number, unknown> {
  if (o === null || typeof o !== 'object') {
    return false
  }

  const proto = Object.getPrototypeOf(o)
  if (proto === null || proto === Object.prototype) {
    const hasOwnCtor = Object.prototype.hasOwnProperty.call(o, 'constructor')
    const ctor = o.constructor
    if (!hasOwnCtor || ctor === Object) {
      return true
    }
  }

  return false
}
