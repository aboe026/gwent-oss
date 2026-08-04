import { ObjectId } from 'mongodb'

import { DeckDbObject, GameDbObject, UnitDbObject } from '@gwent-oss/graphql-schema/database-typings'
import { getGame, getUnits, updateGame } from './db-util'

/**
 * Ensures all the desired units are in the game hand for the user, swapping out with units in their draw pile if necessary.
 *
 * @param config The configuration used to ensure the units are in the players game hand.
 * @param config.gameId The ID of the game to set the hand for.
 * @param config.mongoConnectionString The MongoDB Connection String used to communicate with the database.
 * @param config.mongoDatabaseName The name of the MongoDB Database containing the game to modify.
 * @param config.unitNames The names of the units to put in the players hand for the game.
 * @param config.userId The ID of the user on the game to set the hand for.
 * @param config.excludeNames A list of unit names which should be replaced in hand before unitNames added to hand.
 * @returns The Game with updated hand for the user.
 */
export default async function ensureUnitsInHand({
  gameId,
  mongoConnectionString,
  mongoDatabaseName,
  unitNames,
  excludeNames,
  userId,
}: {
  gameId: string | ObjectId
  mongoConnectionString: string
  mongoDatabaseName: string
  unitNames: string[]
  excludeNames?: string[]
  userId: string | ObjectId
}): Promise<GameDbObject> {
  const game = await getGame({
    gameId,
    mongoConnectionString,
    mongoDatabaseName,
  })

  let deck: DeckDbObject | undefined = undefined

  game.players.map((player) => {
    if (player.user.toString() === userId.toString()) {
      if (!player.deck.from) {
        throw Error(`Player "${player.user.toString()}" does not have deck set`)
      }
      deck = player.deck.from
    }
  })

  if (!deck) {
    throw Error(`Could not find deck for player "${userId}"`)
  }

  const deckUnits = await getUnits({
    mongoConnectionString,
    mongoDatabaseName,
    unitIds: (deck as DeckDbObject).units.map((unit) => unit.unit),
  })

  if (excludeNames) {
    game.players = game.players.map((player) => {
      if (player.user.toString() === userId.toString()) {
        if (!player.deck.from) {
          throw Error(`Player "${player.user.toString()}" does not have deck set`)
        }

        const handUnits = player.deck.hand.map((handUnit) => {
          const matchingUnit = deckUnits.find((deckUnit) => deckUnit._id.toString() === handUnit.unit.toString())
          if (!matchingUnit) {
            throw Error(`Could not find deck unit for hand unit "${handUnit.unit}"`)
          }
          return matchingUnit
        })
        const undrawnUnits = player.deck.undrawn.map((undrawnUnit) => {
          const matchingUnit = deckUnits.find((deckUnit) => deckUnit._id.toString() === undrawnUnit.unit.toString())
          if (!matchingUnit) {
            throw Error(`Could not find deck unit for undrawn unit "${undrawnUnit.unit}"`)
          }
          return matchingUnit
        })

        const unitsToRemoveFromHand: UnitDbObject[] = []
        const eligibleUndrawns: UnitDbObject[] = []

        for (const excludeName of excludeNames) {
          for (const handUnit of handUnits) {
            if (handUnit.name === excludeName) {
              unitsToRemoveFromHand.push(handUnit)
              let eligibleFound = false
              for (let i = 0; i < undrawnUnits.length && !eligibleFound; i++) {
                const potentialUndrawn = undrawnUnits[i]
                if (!excludeNames.includes(potentialUndrawn.name)) {
                  eligibleFound = true
                  eligibleUndrawns.push(potentialUndrawn)
                }
              }
            }
          }
        }

        for (let i = 0; i < unitsToRemoveFromHand.length; i++) {
          const unitToRemoveFromHand = unitsToRemoveFromHand[i]
          const undrawnToAddToHand = eligibleUndrawns[i]

          const positionInHand = handUnits
            .map((unit) => unit._id.toString())
            .indexOf(unitToRemoveFromHand._id.toString())
          const positionInUndrawn = undrawnUnits
            .map((unit) => unit._id.toString())
            .indexOf(undrawnToAddToHand._id.toString())

          const handUnitToMoveToUndrawn = player.deck.hand[positionInHand]
          const undrawnUnitToMoveToHand = player.deck.undrawn[positionInUndrawn]

          player.deck.hand[positionInHand] = undrawnUnitToMoveToHand
          player.deck.undrawn[positionInUndrawn] = handUnitToMoveToUndrawn
        }
      }

      return player
    })
  }

  game.players = game.players.map((player) => {
    if (player.user.toString() === userId.toString()) {
      if (!player.deck.from) {
        throw Error(`Player "${player.user.toString()}" does not have deck set`)
      }

      const handUnits = player.deck.hand.map((handUnit) => {
        const matchingUnit = deckUnits.find((deckUnit) => deckUnit._id.toString() === handUnit.unit.toString())
        if (!matchingUnit) {
          throw Error(`Could not find deck unit for hand unit "${handUnit.unit}"`)
        }
        return matchingUnit
      })
      const undrawnUnits = player.deck.undrawn.map((undrawnUnit) => {
        const matchingUnit = deckUnits.find((deckUnit) => deckUnit._id.toString() === undrawnUnit.unit.toString())
        if (!matchingUnit) {
          throw Error(`Could not find deck unit for undrawn unit "${undrawnUnit.unit}"`)
        }
        return matchingUnit
      })

      const undrawnToAddToHand: UnitDbObject[] = []
      const unitsAlreadyInHandMap: {
        [name: string]: UnitDbObject[]
      } = {}

      for (const unitName of unitNames) {
        const numRequired = unitNames.filter((name) => name === unitName).length
        const numHanded = handUnits.filter((handUnit) => handUnit.name === unitName).length
        const numUndrawn = undrawnUnits.filter((undrawnUnit) => undrawnUnit.name === unitName).length
        const numAdding = undrawnToAddToHand.map((unit) => unit.name).filter((name) => name === unitName).length

        if (numRequired > numHanded + numUndrawn) {
          throw Error(
            `Cannot set "${numRequired}" instances of "${unitName}" in hand for "${
              player.user
            }", maximum available in deck is "${numHanded + numUndrawn}"`
          )
        }

        const alreadyCountedInHand = unitsAlreadyInHandMap[unitName] ? unitsAlreadyInHandMap[unitName].length : 0
        const canClaimFromHand = numHanded - alreadyCountedInHand
        if (canClaimFromHand > 0) {
          // unit already in hand, add to unitsAlreadyInHandMap
          if (!unitsAlreadyInHandMap[unitName]) {
            unitsAlreadyInHandMap[unitName] = []
          }
          unitsAlreadyInHandMap[unitName].push(
            handUnits.filter((handUnit) => handUnit.name === unitName)[alreadyCountedInHand]
          )
        } else {
          // unit not in hand, designate undrawn unit to move to hand
          const undrawnIndex = numUndrawn - numAdding - 1
          undrawnToAddToHand.push(undrawnUnits.filter((undrawnUnit) => undrawnUnit.name === unitName)[undrawnIndex])
        }
      }

      const unitsAlreadyInHandIds: string[] = []
      for (const name of Object.keys(unitsAlreadyInHandMap)) {
        for (const unit of unitsAlreadyInHandMap[name]) {
          unitsAlreadyInHandIds.push(unit._id.toString())
        }
      }

      const unitIdsEligibleToRemoveFromHand = handUnits
        .filter((unit) => !unitsAlreadyInHandIds.includes(unit._id.toString()))
        .map((unit) => unit._id.toString())
      const undrawnIdsToMoveToHand = undrawnToAddToHand.map((unit) => unit._id.toString())

      for (let i = 0; i < undrawnToAddToHand.length; i++) {
        const unitToAddToHand = undrawnIdsToMoveToHand[i]
        const unitToRemoveFromHand = unitIdsEligibleToRemoveFromHand[i]
        const positionInUndrawn = undrawnUnits.map((unit) => unit._id.toString()).indexOf(unitToAddToHand)
        const positionInHand = handUnits.map((unit) => unit._id.toString()).indexOf(unitToRemoveFromHand)

        if (positionInUndrawn < 0) {
          throw Error(`Could not find position in undrawn for unit "${unitToAddToHand}"`)
        }
        if (positionInHand < 0) {
          throw Error(`Could not find position in hand for unit "${unitToRemoveFromHand}"`)
        }

        const undrawnUnitToMoveToHand = player.deck.undrawn[positionInUndrawn]
        const handUnitToMoveToUndrawn = player.deck.hand[positionInHand]
        player.deck.hand[positionInHand] = undrawnUnitToMoveToHand
        player.deck.undrawn[positionInUndrawn] = handUnitToMoveToUndrawn
      }
    }
    return player
  })
  return updateGame({
    game,
    mongoConnectionString,
    mongoDatabaseName,
  })
}
