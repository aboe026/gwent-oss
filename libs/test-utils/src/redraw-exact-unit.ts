import { ObjectId } from 'mongodb'

import { GameDbObject } from '@gwent/graphql-schema/database-typings'
import { getGame, updateGame } from './db-util'

export default async function redrawExactUnit({
  gameId,
  mongoConnectionString,
  mongoDatabaseName,
  userId,
  fromId,
  toId,
}: {
  gameId: ObjectId | string
  mongoConnectionString: string
  mongoDatabaseName: string
  userId: ObjectId | string
  fromId: ObjectId | string
  toId: ObjectId | string
}): Promise<GameDbObject> {
  const game = await getGame({
    gameId,
    mongoConnectionString,
    mongoDatabaseName,
  })

  const player = game.players.find((player) => player.user.toString() === userId.toString())
  if (!player) {
    throw Error(`Could not find user "${userId}" on game "${gameId}"`)
  }

  const redrawFrom = player.deck.hand.find((deckUnit) => deckUnit.unit.toString() === fromId.toString())
  if (!redrawFrom) {
    throw Error(`Could not find fromId "${fromId}" in player "${userId}" hand for game "${gameId}"`)
  }

  const redrawTo = player.deck.undrawn.find((deckUnit) => deckUnit.unit.toString() === toId.toString())
  if (!redrawTo) {
    throw Error(`Could not find toId "${toId}" in player "${userId}" hand for game "${gameId}"`)
  }

  player.deck.undrawn = [
    ...player.deck.undrawn.filter((deckUnit) => deckUnit.unit.toString() !== toId.toString()),
    redrawFrom,
  ]
  player.deck.hand = [
    ...player.deck.hand.filter((deckUnit) => deckUnit.unit.toString() !== fromId.toString()), // to break line for nicer formatting
    redrawTo,
  ]
  player.deck.redraws = [
    ...player.deck.redraws,
    {
      from: redrawFrom,
      to: redrawTo,
    },
  ]

  return updateGame({
    game,
    mongoConnectionString,
    mongoDatabaseName,
  })
}
