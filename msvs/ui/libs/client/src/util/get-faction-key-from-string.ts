/**
 * Gets the enum value a string represents.
 *
 * @param config The configuration used to get the enum value.
 * @param config.enumerative The Enum object for which the input value matches one of its values.
 * @param config.value The string value that matches one of the enumerative values.
 * @returns The Enum value if the string matches one, otherwise undefined.
 */
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
