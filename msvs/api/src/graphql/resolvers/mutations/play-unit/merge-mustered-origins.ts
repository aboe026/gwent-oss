import { MusteredOrigins } from './effect-muster'

/**
 * Merge multiple Mustered Origins into a single one.
 *
 * @param origins The multiple Origins to merge into a single one.
 * @returns All of the Origins merged into one.
 */
export default function mergeMusteredOrigins(...origins: MusteredOrigins[]): MusteredOrigins {
  const mergedOrigins: MusteredOrigins = {}

  for (const impact of origins) {
    for (const key of Object.keys(impact)) {
      const value = impact[key]
      mergedOrigins[key] = value
    }
  }

  return mergedOrigins
}
