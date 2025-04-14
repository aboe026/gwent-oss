import { GameUnitDbObject, UnitDbObject } from '@gwent/graphql-schema/database-typings'

// TODO: support player/row and minimum strength for non-"Scorch" units with scorch effect
export default function getStrongestNonHeroUnits({
  gameUnits,
  units,
}: {
  gameUnits: GameUnitDbObject[]
  units: UnitDbObject[]
}): GameUnitDbObject[] {
  let highestStrength = 0
  for (const gameUnit of gameUnits) {
    const unit = units.find((unit) => unit._id.toString() === gameUnit.unit.toString())
    if (!unit) {
      throw Error(`Could not find matching unit for game unit "${gameUnit.unit}".`)
    }
    if (
      gameUnit.effectiveStrength !== undefined &&
      gameUnit.effectiveStrength !== null &&
      gameUnit.effectiveStrength > highestStrength &&
      !unit.hero
    ) {
      highestStrength = gameUnit.effectiveStrength
    }
  }

  // TODO: add debug and traces

  const strongestGameUnits: GameUnitDbObject[] = []
  for (const gameUnit of gameUnits) {
    if (gameUnit.effectiveStrength === highestStrength) {
      strongestGameUnits.push(gameUnit)
    }
  }

  return strongestGameUnits
}
