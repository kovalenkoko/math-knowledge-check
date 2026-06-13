type ClassNameValue = string | false | null | undefined

export function classNames(...values: readonly ClassNameValue[]) {
  return values.filter(Boolean).join(' ')
}
