import DeckUnitResolver from '../../src/graphql/resolvers/types/deck-unit-resolver'
import EventManager from '../../src/graphql/event-manager'
import { GameDeckDbObject } from '@gwent/graphql-schema/database-typings'
import GameDeckResolver from '../../src/graphql/resolvers/types/game-deck-resolver'
import GameResolver from '../../src/graphql/resolvers/types/game-resolver'
import { PubSubEvents } from '@gwent/constants'
import RedrawResolution from '../../src/graphql/resolvers/mutations/redraw/redraw-resolution'
import TestUtil from '../util/test-util'

describe('redraw-resolution', () => {
  const logPrefix = 'log-prefix'
  it('throws error if gameDeck undefined', async () => {
    const message = 'Could not get updated game deck when redrawing unit.'
    await testRedrawResolution({
      logPrefix,
      gameDeck: undefined,
      error: Error(message),
      errorCalls: [[`${logPrefix} failed: ${message}`]],
    })
  })
  it('returns resolved to if no errors', async () => {
    await testRedrawResolution({
      logPrefix,
      gameDeck: TestUtil.getDbGameDeck({}),
    })
  })
  it('logs to trace if enabled', async () => {
    await testRedrawResolution({
      logPrefix,
      gameDeck: TestUtil.getDbGameDeck({}),
      traceEnabled: true,
    })
  })
})

async function testRedrawResolution({
  logPrefix = '',
  gameDeck,
  error,
  errorCalls = [],
  traceEnabled,
}: {
  logPrefix?: string
  gameDeck: GameDeckDbObject | undefined
  error?: Error
  errorCalls?: string[][]
  traceEnabled?: boolean
}) {
  const to = TestUtil.getDbDeckUnit({})
  const from = TestUtil.getDbDeckUnit({})
  const game = TestUtil.getDbGame({})
  const resolvedTo = TestUtil.getDeckUnitFromDbDeckUnit(to)
  const resolvedFrom = TestUtil.getDeckUnitFromDbDeckUnit(from)
  const resolvedGame = TestUtil.getGameFromDbGame({
    game,
  })
  const resolvedGameDeck = gameDeck ? TestUtil.getGameDeckFromDbGameDeck(gameDeck) : undefined
  const deckUnitFromObjectSpy = jest
    .spyOn(DeckUnitResolver, 'fromObject')
    .mockResolvedValueOnce(resolvedTo)
    .mockResolvedValueOnce(resolvedFrom)
  const gameFromObjectSpy = jest.spyOn(GameResolver, 'fromObject').mockResolvedValue(resolvedGame)
  const gameDeckFromObjectSpy = jest.spyOn(GameDeckResolver, 'fromObject')
  if (resolvedGameDeck) {
    gameDeckFromObjectSpy.mockResolvedValue(resolvedGameDeck)
  }
  const publishSpy = jest.spyOn(EventManager.pubsub, 'publish').mockImplementation()
  const errorSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  RedrawResolution['logger'] = {
    error: errorSpy,
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  const promise = RedrawResolution.redrawResolution({
    from,
    game,
    gameDeck,
    logPrefix,
    to,
  })
  if (error) {
    await expect(promise).rejects.toThrow(error)
  } else {
    await expect(promise).resolves.toEqual(resolvedTo)
  }

  expect(deckUnitFromObjectSpy.mock.calls).toEqual([
    [
      {
        deckUnit: to,
      },
    ],
    [
      {
        deckUnit: from,
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
  expect(gameDeckFromObjectSpy.mock.calls).toEqual(
    gameDeck
      ? [
          [
            {
              gameDeck,
            },
          ],
        ]
      : []
  )
  expect(publishSpy.mock.calls).toEqual(
    gameDeck
      ? [
          [
            PubSubEvents.UnitRedrawn,
            {
              unitRedrawn: {
                from: resolvedFrom,
                deck: resolvedGameDeck,
                game: resolvedGame,
                to: resolvedTo,
              },
            },
          ],
        ]
      : []
  )
  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [`${logPrefix} resolvedTo: "${JSON.stringify(resolvedTo)}"`],
          [`${logPrefix} resolvedGame: "${JSON.stringify(resolvedGame)}"`],
          [`${logPrefix} resolvedFrom: "${JSON.stringify(resolvedFrom)}"`],
          [`${logPrefix} resolvedGameDeck: "${JSON.stringify(resolvedGameDeck)}"`],
        ]
      : []
  )
}
