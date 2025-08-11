import { isEqual } from './is-equal'

export function arrayContains<T>(base: T[], current: T) {
  return base.some(val => isEqual(val, current))
}
