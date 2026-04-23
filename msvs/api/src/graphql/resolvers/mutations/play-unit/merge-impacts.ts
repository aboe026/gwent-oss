import { ImpactsByUnitId } from '../../resolver-util'

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
