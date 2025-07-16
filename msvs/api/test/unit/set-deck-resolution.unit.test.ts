import EventManager from '../../src/graphql/event-manager'
import { FactionKey, GameDbObject, GameStatus } from '@gwent/graphql-schema/database-typings'
import GameDeckResolver from '../../src/graphql/resolvers/types/game-deck-resolver'
import GameResolver from '../../src/graphql/resolvers/types/game-resolver'
import PresentableError from '../../src/util/presentable-error'
import { PubSubEvents } from '@gwent/constants'
import SetDeckResolution from '../../src/graphql/resolvers/mutations/set-deck/set-deck-resolution'
import SetGameTurnOrder from '../../src/graphql/resolvers/mutations/util/set-game-turn-order'
import TestUtil from '../util/test-util'

describe('set-deck-resolution', () => {
  const logPrefix = 'log-prefix'
  it('throws error if cannot set game turn order automatically', async () => {
    const error = new PresentableError('setGameTurnOrder error')
    const message = 'Could not set game turn order automatically'
    await testSetDeckResolution({
      logPrefix,
      game: TestUtil.getDbGame({
        status: GameStatus.Ordering,
      }),
      setGameTurnOrderError: error,
      error: Error(`${message}.`),
      errorCalls: [[`${logPrefix} failed: ${message}: ${error}`]],
    })
  })
  it('returns resolved game deck if setGameTurnOrder throws error about another player having a ScoiaTael deck', async () => {
    const error = new PresentableError(
      `Random order not allowed when another player has deck faction of "${FactionKey.ScoiaTael}".`
    )
    await testSetDeckResolution({
      game: TestUtil.getDbGame({
        status: GameStatus.Ordering,
      }),
      setGameTurnOrderError: error,
    })
  })
  it('returns resolved game deck if no errors thrown and game status is decking', async () => {
    await testSetDeckResolution({
      game: TestUtil.getDbGame({
        status: GameStatus.Decking,
      }),
    })
  })
  it('returns resolved game deck if no errors thrown and game status is ordering', async () => {
    await testSetDeckResolution({
      game: TestUtil.getDbGame({
        status: GameStatus.Ordering,
      }),
    })
  })
  it('logs to trace if enabled', async () => {
    await testSetDeckResolution({
      game: TestUtil.getDbGame({
        status: GameStatus.Ordering,
      }),
      traceEnabled: true,
    })
  })
})

async function testSetDeckResolution({
  game,
  logPrefix = '',
  setGameTurnOrderError,
  error,
  errorCalls = [],
  traceEnabled,
}: {
  game: GameDbObject
  logPrefix?: string
  setGameTurnOrderError?: Error
  error?: Error
  errorCalls?: string[][]
  traceEnabled?: boolean
}) {
  const gameDeck = TestUtil.getDbGameDeck({})
  const resolvedGame = TestUtil.getGameFromDbGame({ game })
  const resolvedGameDeck = TestUtil.getGameDeckFromDbGameDeck(gameDeck)
  const gameDeckFromObjectSpy = jest.spyOn(GameDeckResolver, 'fromObject').mockResolvedValue(resolvedGameDeck)
  const gameFromObjectSpy = jest.spyOn(GameResolver, 'fromObject').mockResolvedValue(resolvedGame)
  const publishSpy = jest.spyOn(EventManager.pubsub, 'publish').mockImplementation()
  const setGameTurnOrderSpy = jest.spyOn(SetGameTurnOrder, 'setGameTurnOrder')
  if (setGameTurnOrderError) {
    setGameTurnOrderSpy.mockRejectedValue(setGameTurnOrderError)
  } else {
    setGameTurnOrderSpy.mockResolvedValue(TestUtil.getGame({}))
  }
  const errorSpy = jest.fn().mockImplementation()
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  SetDeckResolution['logger'] = {
    error: errorSpy,
    debug: debugSpy,
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  const promise = SetDeckResolution.setDeckResolution({
    game,
    gameDeck,
    logPrefix,
  })
  if (error) {
    await expect(promise).rejects.toThrow(error)
  } else {
    await expect(promise).resolves.toEqual(resolvedGameDeck)
  }

  expect(gameDeckFromObjectSpy.mock.calls).toEqual([
    [
      {
        gameDeck,
      },
    ],
  ])
  expect(gameFromObjectSpy.mock.calls).toEqual([
    [
      {
        game,
      },
    ],
  ])
  const publishCalls: any[][] = [
    [
      PubSubEvents.DeckSet,
      {
        deckSet: {
          deck: resolvedGameDeck,
          game: resolvedGame,
        },
      },
    ],
  ]
  if (game.status === GameStatus.Ordering) {
    publishCalls.push([
      PubSubEvents.GameSet,
      {
        gameSet: resolvedGame,
      },
    ])
  }
  expect(publishSpy.mock.calls).toEqual(publishCalls)
  expect(setGameTurnOrderSpy.mock.calls).toEqual(
    game.status === GameStatus.Ordering
      ? [
          [
            {
              game,
              gameDeck,
              logPrefix: `setOrder via ${logPrefix}`,
              allowImplicit: false,
            },
          ],
        ]
      : []
  )
  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(debugSpy.mock.calls).toEqual(
    game.status === GameStatus.Ordering ? [[`${logPrefix} All decks set, attempting to set order automatically.`]] : []
  )
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [`${logPrefix} resolvedGameDeck: "${JSON.stringify(resolvedGameDeck)}"`],
          [`${logPrefix} resolvedGame: "${JSON.stringify(resolvedGame)}"`],
        ]
      : []
  )
}
