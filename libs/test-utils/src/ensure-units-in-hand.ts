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

      const unitNamesToAddToHand = [...unitNames]
      const otherUnitNamesInHand = handUnits.map((unit) => unit.name).filter((name) => !unitNames.includes(name))

      for (const handUnit of handUnits) {
        const index = unitNamesToAddToHand.indexOf(handUnit.name)
        if (index >= 0) {
          unitNamesToAddToHand.splice(index, 1)
        }
      }

      for (let i = 0; i < unitNamesToAddToHand.length; i++) {
        const unitNameToAddToHand = unitNamesToAddToHand[i]
        const unitNameToRemoveFromHand = otherUnitNamesInHand[i]
        const positionInUndrawn = undrawnUnits.map((unit) => unit.name).indexOf(unitNameToAddToHand)
        const positionInHand = handUnits.map((unit) => unit.name).indexOf(unitNameToRemoveFromHand)

        if (positionInUndrawn < 0) {
          throw Error(`Could not find position in undrawn for unit "${unitNameToAddToHand}"`)
        }
        if (positionInHand < 0) {
          throw Error(`Could not find position in hand for unit "${unitNameToRemoveFromHand}"`)
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
