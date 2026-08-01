import { ObjectId } from 'mongodb'

import DeckUnitResolver from '../../src/graphql/resolvers/types/deck-unit-resolver'
import EventManager from '../../src/graphql/event-manager'
import GameDeckResolver from '../../src/graphql/resolvers/types/game-deck-resolver'
import GameResolver from '../../src/graphql/resolvers/types/game-resolver'
import {
  PlayersToDeckUnitDbObjects,
  PlayersToDeckUnits,
} from '../../src/graphql/resolvers/mutations/util/players-to-deck-units'
import PlayersToDeckUnitsResolver from '../../src/graphql/resolvers/types/players-to-deck-units-resolver'
import PlayUnitResolution from '../../src/graphql/resolvers/mutations/play-unit/play-unit-resolution'
import { PubSubEvents } from '@gwent/constants'
import TestUtil from '../util/test-util'

describe('play-unit-resolution', () => {
  it('returns objects', async () => {
    await testPlayUnitResolution({})
  })
  it('resolves discarded and undiscards for user', async () => {
    const userId = new ObjectId()
    await testPlayUnitResolution({
      userId,
      discards: {
        [userId.toString()]: [TestUtil.getDbDeckUnit({})],
      },
      undiscards: {
        [userId.toString()]: [TestUtil.getDbDeckUnit({})],
      },
    })
  })
  it('logs to trace if enabled', async () => {
    await testPlayUnitResolution({
      traceEnabled: true,
    })
  })
})

async function testPlayUnitResolution({
  userId = new ObjectId(),
  discards = {},
  undiscards = {},
  unhands = {},
  traceEnabled,
}: {
  userId?: ObjectId
  discards?: PlayersToDeckUnitDbObjects
  undiscards?: PlayersToDeckUnitDbObjects
  unhands?: PlayersToDeckUnitDbObjects
  traceEnabled?: boolean
}) {
  const logPrefix = 'log-prefix'
  const game = TestUtil.getDbGame({})
  const deckUnit = TestUtil.getDbDeckUnit({})
  const gameDeck = TestUtil.getDbGameDeck({})
  const handed = [TestUtil.getDbDeckUnit({})]
  const resolvedGame = TestUtil.getGameFromDbGame({
    game,
  })
  const maskedGame = TestUtil.getGame({})
  const resolvedDeckUnit = TestUtil.getDeckUnitFromDbDeckUnit({
    deckUnit,
  })
  const resolvedHanded = [TestUtil.getDeckUnit({})]
  const resolvedDiscarded = [TestUtil.getDeckUnit({})]
  const resolvedUndiscarded = [TestUtil.getDeckUnit({})]
  const resolvedGameDeck = TestUtil.getGameDeckFromDbGameDeck(gameDeck)
  const resolvedDiscards: PlayersToDeckUnits = {
    [new ObjectId().toString()]: [TestUtil.getDeckUnit({})],
  }
  const resolvedUndiscards: PlayersToDeckUnits = {
    [new ObjectId().toString()]: [TestUtil.getDeckUnit({})],
  }
  const resolvedUnhands: PlayersToDeckUnits = {
    [new ObjectId().toString()]: [TestUtil.getDeckUnit({})],
  }
  const gameResolverFromObjectSpy = jest.spyOn(GameResolver, 'fromObject').mockResolvedValue(resolvedGame)
  const deckUnitResolverFromObjectSpy = jest.spyOn(DeckUnitResolver, 'fromObject').mockResolvedValue(resolvedDeckUnit)
  const gameDeckResolverFromObjectSpy = jest.spyOn(GameDeckResolver, 'fromObject').mockResolvedValue(resolvedGameDeck)
  const playersToDeckUnitsSpy = jest
    .spyOn(PlayersToDeckUnitsResolver, 'fromObject')
    .mockResolvedValueOnce(resolvedDiscards)
    .mockResolvedValueOnce(resolvedUndiscards)
    .mockResolvedValueOnce(resolvedUnhands)
  const deckUnitFromArraySpy = jest
    .spyOn(DeckUnitResolver, 'fromArray')
    .mockResolvedValueOnce(resolvedHanded)
    .mockResolvedValueOnce(resolvedDiscarded)
    .mockResolvedValueOnce(resolvedUndiscarded)
  const publishSpy = jest.spyOn(EventManager.pubsub, 'publish').mockImplementation()
  const maskSpiedHandUnitsSpy = jest.spyOn(GameResolver, 'maskSpiedHandUnits').mockReturnValue(maskedGame)
  const traceSpy = jest.fn().mockImplementation()
  PlayUnitResolution['logger'] = {
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  await expect(
    PlayUnitResolution.playUnitResolution({
      deckUnit,
      game,
      gameDeck,
      logPrefix,
      handDeckUnitsAdded: handed,
      userId,
      discards,
      undiscards,
      unhands,
    })
  ).resolves.toEqual(maskedGame)

  expect(gameResolverFromObjectSpy.mock.calls).toEqual([
    [
      {
        game,
      },
    ],
  ])
  expect(deckUnitResolverFromObjectSpy.mock.calls).toEqual([
    [
      {
        deckUnit,
      },
    ],
  ])
  expect(gameDeckResolverFromObjectSpy.mock.calls).toEqual([
    [
      {
        gameDeck,
      },
    ],
  ])
  expect(playersToDeckUnitsSpy.mock.calls).toEqual([[discards], [undiscards], [unhands]])
  expect(deckUnitFromArraySpy.mock.calls).toEqual([
    [
      {
        deckUnits: handed,
      },
    ],
    [
      {
        deckUnits: discards[userId.toString()] || [],
      },
    ],
    [
      {
        deckUnits: undiscards[userId.toString()] || [],
      },
    ],
  ])
  expect(publishSpy.mock.calls).toEqual([
    [
      PubSubEvents.UnitPlayedOnGame,
      {
        unitPlayedOnGame: {
          game: resolvedGame,
          unit: resolvedDeckUnit,
          discarded: resolvedDiscards,
          undiscarded: resolvedUndiscards,
          unhanded: resolvedUnhands,
        },
      },
    ],
    [
      PubSubEvents.UnitPlayedFromDeck,
      {
        unitPlayedFromDeck: {
          deck: resolvedGameDeck,
          game: resolvedGame,
          unit: resolvedDeckUnit,
          handed: resolvedHanded,
          discarded: resolvedDiscarded,
          undiscarded: resolvedUndiscarded,
        },
      },
    ],
  ])
  expect(maskSpiedHandUnitsSpy.mock.calls).toEqual([
    [
      {
        game: resolvedGame,
        userId,
      },
    ],
  ])
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [`${logPrefix} resolvedGame: "${JSON.stringify(resolvedGame)}"`],
          [`${logPrefix} resolvedUnit: "${JSON.stringify(resolvedDeckUnit)}"`],
          [`${logPrefix} resolvedGameDeck: "${JSON.stringify(resolvedGameDeck)}"`],
          [`${logPrefix} handed: "${JSON.stringify(resolvedHanded)}"`],
          [`${logPrefix} discarded: "${JSON.stringify(resolvedDiscarded)}"`],
          [`${logPrefix} undiscarded: "${JSON.stringify(resolvedUndiscarded)}"`],
        ]
      : []
  )
}
