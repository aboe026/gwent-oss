export default function setNestedProperty<T>({
  obj,
  path,
  value,
}: {
  obj: T
  path: string
  value: any // eslint-disable-line @typescript-eslint/no-explicit-any
}): void {
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
