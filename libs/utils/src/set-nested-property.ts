/**
 * Sets a property/field on an object at a nested depth.
 *
 * @param config The configuration used to set the nested property.
 * @param config.obj The object containing the nested path to set the value of.
 * @param config.path The path within the object to set the value of.
 * @param config.value The value to set on the nested path within the object.
 */
export default function setNestedProperty<T>({
  obj,
  path,
  value,
}: {
  obj: T
  path: string
  value: any // eslint-disable-line @typescript-eslint/no-explicit-any
}) {
  const keys = path.split('.')
  let current: any = obj // eslint-disable-line @typescript-eslint/no-explicit-any

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]

    // If we're at the last key, assign the value
    if (i === keys.length - 1) {
      current[key] = value
      return
    }

    // If the next level doesn't exist, create an object
    if (current[key] === undefined || current[key] === null) {
      current[key] = {}
    }

    current = current[key]
  }
}
