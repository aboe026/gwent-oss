import { ImpactsByUnitId } from '../../resolver-util'

/**
 * Merge multiple Impacts into a single one.
 *
 * @param impacts The multiple Impacts to merge into a single one.
 * @returns All of the Impacts merged into one.
 */
export default function mergeImpacts(...impacts: ImpactsByUnitId[]): ImpactsByUnitId {
  const mergedImpacts: ImpactsByUnitId = {}

  for (const impact of impacts) {
    for (const key of Object.keys(impact)) {
      const value = impact[key]
      if (mergedImpacts[key]) {
        mergedImpacts[key].push(...value)
      } else {
        mergedImpacts[key] = value
      }
    }
  }

  return mergedImpacts
}
