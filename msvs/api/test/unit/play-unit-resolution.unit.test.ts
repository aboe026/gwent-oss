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
  const game = TestUtil.getDbGame({})
  const deckUnit = TestUtil.getDbDeckUnit({})
  const gameDeck = TestUtil.getDbGameDeck({})
  const resolvedGame = TestUtil.getGameFromDbGame({
    game,
  })
  const resolvedDeckUnit = TestUtil.getDeckUnitFromDbDeckUnit({
    deckUnit,
  })
  const resolvedGameDeck = TestUtil.getGameDeckFromDbGameDeck(gameDeck)
  const gameResolverFromObjectSpy = jest.spyOn(GameResolver, 'fromObject').mockResolvedValue(resolvedGame)
  const deckUnitResolverFromObjectSpy = jest.spyOn(DeckUnitResolver, 'fromObject').mockResolvedValue(resolvedDeckUnit)
  const gameDeckResolverFromObjectSpy = jest.spyOn(GameDeckResolver, 'fromObject').mockResolvedValue(resolvedGameDeck)
  const publishSpy = jest.spyOn(EventManager.pubsub, 'publish').mockImplementation()
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
    })
  ).resolves.toEqual(resolvedGame)

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
        },
      },
    ],
  ])
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [`${logPrefix} resolvedGame: "${JSON.stringify(resolvedGame)}"`],
          [`${logPrefix} resolvedUnit: "${JSON.stringify(resolvedDeckUnit)}"`],
          [`${logPrefix} resolvedGameDeck: "${JSON.stringify(resolvedGameDeck)}"`],
        ]
      : []
  )
}
