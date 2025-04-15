import { GameUnitDbObject, UnitDbObject } from '@gwent/graphql-schema/database-typings'

export default function getStrongestNonHeroUnits({
  gameUnits,
  units,
  minimumStrength,
}: {
  gameUnits: GameUnitDbObject[]
  units: UnitDbObject[]
  minimumStrength: number | undefined | null
}): GameUnitDbObject[] {
  let highestStrength = 0
  for (const gameUnit of gameUnits) {
    const unit = units.find((unit) => unit._id.toString() === gameUnit.unit.toString())
    if (!unit) {
      throw Error(`Could not find matching unit for game unit "${gameUnit.unit}".`)
    }
    const strength =
      gameUnit.effectiveStrength === undefined || gameUnit.effectiveStrength === null
        ? unit.strength
        : gameUnit.effectiveStrength
    if (
      strength &&
      strength > highestStrength &&
      !unit.hero &&
      (minimumStrength === undefined || minimumStrength === null || strength >= minimumStrength)
    ) {
      highestStrength = strength
    }
  }

  // TODO: add debug and traces

  const strongestGameUnits: GameUnitDbObject[] = []
  for (const gameUnit of gameUnits) {
    const unit = units.find((unit) => unit._id.toString() === gameUnit.unit.toString())
    if (!unit) {
      throw Error(`Could not find matching unit for game unit "${gameUnit.unit}".`)
    }
    const strength =
      gameUnit.effectiveStrength === undefined || gameUnit.effectiveStrength === null
        ? unit.strength
        : gameUnit.effectiveStrength
    if (strength && strength === highestStrength) {
      strongestGameUnits.push(gameUnit)
    }
  }

  return strongestGameUnits
}
