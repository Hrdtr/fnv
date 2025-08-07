export class FF<Name extends string = string, T = any> {
  readonly name: Name
  readonly initialValue: T | undefined

  private _value: T | undefined
  private _touched: boolean

  constructor(name: Name, options?: { initialValue?: T }) {
    this.name = name
    this.initialValue = options?.initialValue

    this._value = options?.initialValue
    this._touched = false
  }

  get value() {
    return this._value
  }

  setValue(value: T) {
    this._value = value
  }

  get touched() {
    return this._touched
  }

  setTouched(touched: boolean) {
    this._touched = touched
  }

  get dirty() {
    return this._value !== this.initialValue
  }

  reset() {
    this._value = this.initialValue
    this._touched = false
  }
}
