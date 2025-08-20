/**
 * Gets the value of a nested element within an object.
 *
 * @param options The options for getting the nested property.
 * @param options.obj The object to get the nested property for.
 * @param options.nestedProperty The path of deeply nested properties to get in the object, separated by periods.
 * @returns The value of the nested property within the object. Returns undefined if nested path does not exist.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function getNestedProperty({ obj, nestedProperty }: { nestedProperty: string; obj: any }): any {
  let value
  if (obj) {
    const properties = nestedProperty.split('.')
    value = obj[properties[0]]
    for (let i = 1; i < properties.length; i++) {
      if (typeof value === 'object' && value !== null && value !== undefined) {
        value = value[properties[i]]
      }
    }
  }
  return value
}
