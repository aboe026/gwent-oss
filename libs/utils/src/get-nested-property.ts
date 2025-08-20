/**
 * Gets a nested element within an object.
 *
 * @param options The options for getting the nested property.
 * @param options.obj The object to get the nested property for.
 * @param options.nestedProperty The path of deeply nested properties to get in the object, separated by periods.
 * @returns The nested property within the object.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function getNestedProperty({ obj, nestedProperty }: { nestedProperty: string; obj: any }): any {
  let value
  let first = true
  if (obj) {
    for (const property of nestedProperty.split('.')) {
      if (first) {
        value = obj[property]
        first = false
      } else {
        if (value === undefined || value === null) {
          return undefined
        }
        value = value[property]
      }
    }
  }
  return value
}
