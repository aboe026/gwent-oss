export default function getEnumFromString<T extends Record<string | number, string | number>>({
  enumerative,
  value,
}: {
  enumerative: T
  value: string
}): T[keyof T] | undefined {
  const enumValues = Object.values(enumerative)

  // For numeric enums, Object.values includes both keys and values, so we filter out the keys
  const filteredValues = enumValues.filter((enumValue) => typeof enumValue === typeof enumValues[0])

  const match = filteredValues.find((enumValue) => enumValue === value)

  return match ? (match as T[keyof T]) : undefined
}
