import { ObjectId } from 'mongodb'

import DeckUnitResolver from '../../src/graphql/resolvers/types/deck-unit-resolver'
import EventManager from '../../src/graphql/event-manager'
import GameDeckResolver from '../../src/graphql/resolvers/types/game-deck-resolver'
import GameResolver from '../../src/graphql/resolvers/types/game-resolver'
import PlayUnitResolution from '../../src/graphql/resolvers/mutations/play-unit/play-unit-resolution'
import { PubSubEvents } from '@gwent/constants'
import TestUtil from '../util/test-util'

describe('play-unit-resolution', () => {
  it('returns objects', async () => {
    await testPlayUnitResolution({})
  })
  it('logs to trace if enabled', async () => {
    await testPlayUnitResolution({
      traceEnabled: true,
    })
  })
})

async function testPlayUnitResolution({ traceEnabled }: { traceEnabled?: boolean }) {
  const logPrefix = 'log-prefix'
  const userId = new ObjectId()
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
  const resolvedGameDeck = TestUtil.getGameDeckFromDbGameDeck(gameDeck)
  const gameResolverFromObjectSpy = jest.spyOn(GameResolver, 'fromObject').mockResolvedValue(resolvedGame)
  const deckUnitResolverFromObjectSpy = jest.spyOn(DeckUnitResolver, 'fromObject').mockResolvedValue(resolvedDeckUnit)
  const gameDeckResolverFromObjectSpy = jest.spyOn(GameDeckResolver, 'fromObject').mockResolvedValue(resolvedGameDeck)
  const deckUnitFromArraySpy = jest.spyOn(DeckUnitResolver, 'fromArray').mockResolvedValue(resolvedHanded)
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
  expect(deckUnitFromArraySpy.mock.calls).toEqual([
    [
      {
        deckUnits: handed,
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
        ]
      : []
  )
}
