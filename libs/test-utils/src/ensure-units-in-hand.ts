import { DeckDbObject, GameDbObject, UnitDbObject } from '@gwent/graphql-schema/database-typings'
import { MongoClient, ObjectId } from 'mongodb'

export async function ensureUnitsInHand({
  gameId,
  mongoConnectionString,
  mongoDatabaseName,
  unitNames,
  userId,
}: {
  gameId: string | ObjectId
  mongoConnectionString: string
  mongoDatabaseName: string
  unitNames: string[]
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
        const handUnitToMoveToUndranw = player.deck.hand[positionInHand]
        player.deck.hand[positionInHand] = undrawnUnitToMoveToHand
        player.deck.undrawn[positionInUndrawn] = handUnitToMoveToUndranw
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

export async function getGame({
  gameId,
  mongoConnectionString,
  mongoDatabaseName,
}: {
  gameId: string | ObjectId
  mongoConnectionString: string
  mongoDatabaseName: string
}): Promise<GameDbObject> {
  const mongoClient = await MongoClient.connect(mongoConnectionString)
  try {
    const db = await mongoClient.db(mongoDatabaseName)
    const collection = await db.collection('games')
    const game: GameDbObject | null = await collection.findOne<GameDbObject>({
      _id: new ObjectId(gameId),
    })
    if (!game) {
      throw Error(`Could not find game with ID "${gameId}"`)
    }
    return game
  } finally {
    await mongoClient.close()
  }
}

export async function getUnits({
  mongoConnectionString,
  mongoDatabaseName,
  unitIds,
}: {
  mongoConnectionString: string
  mongoDatabaseName: string
  unitIds: (string | ObjectId)[]
}): Promise<UnitDbObject[]> {
  const mongoClient = await MongoClient.connect(mongoConnectionString)
  try {
    const db = await mongoClient.db(mongoDatabaseName)
    const collection = await db.collection('units')
    const units = await collection
      .find<UnitDbObject>({
        _id: {
          $in: unitIds.map((unitId) => new ObjectId(unitId)),
        },
      })
      .toArray()
    return units
  } finally {
    await mongoClient.close()
  }
}

export async function updateGame({
  game,
  mongoConnectionString,
  mongoDatabaseName,
}: {
  game: GameDbObject
  mongoConnectionString: string
  mongoDatabaseName: string
}): Promise<GameDbObject> {
  const mongoClient = await MongoClient.connect(mongoConnectionString)
  try {
    const db = await mongoClient.db(mongoDatabaseName)
    const collection = await db.collection('games')
    const updatedGame = await collection.findOneAndUpdate(
      {
        _id: new ObjectId(game._id),
      },
      {
        $set: game,
      }
    )
    return updatedGame as GameDbObject
  } finally {
    await mongoClient.close()
  }
}
