import EventManager from '../../src/graphql/event-manager'
import GameDeckResolver from '../../src/graphql/resolvers/types/game-deck-resolver'
import GameResolver from '../../src/graphql/resolvers/types/game-resolver'
import PlayPassResolution from '../../src/graphql/resolvers/mutations/play-pass/play-pass-resolution'
import { PubSubEvents } from '@gwent/constants'
import TestUtil from '../util/test-util'

describe('play-pass-resolution', () => {
  it('returns resolved game if round not over', async () => {
    await testPlayPassResolution({
      roundOver: false,
    })
  })
  it('returns resolved game if round over', async () => {
    await testPlayPassResolution({
      roundOver: true,
    })
  })
  it('logs to trace if enabled and round not over', async () => {
    await testPlayPassResolution({
      roundOver: false,
      traceEnabled: true,
    })
  })
  it('logs to trace if enabled and round over', async () => {
    await testPlayPassResolution({
      roundOver: true,
      traceEnabled: true,
    })
  })
})

async function testPlayPassResolution({ roundOver, traceEnabled }: { roundOver: boolean; traceEnabled?: boolean }) {
  const logPrefix = 'log-prefix'
  const game = TestUtil.getDbGame({})
  const resolvedGame = TestUtil.getGameFromDbGame({
    game,
  })
  const resolvedGameDeck1 = TestUtil.getGameDeckFromDbGameDeck(game.players[0].deck)
  const resolvedGameDeck2 = TestUtil.getGameDeckFromDbGameDeck(game.players[1].deck)
  const gameResolverFromObjectSpy = jest.spyOn(GameResolver, 'fromObject').mockResolvedValue(resolvedGame)
  const publishSpy = jest.spyOn(EventManager.pubsub, 'publish').mockImplementation()
  const gameDeckResolverFromObjectSpy = jest
    .spyOn(GameDeckResolver, 'fromObject')
    .mockResolvedValueOnce(resolvedGameDeck1)
    .mockResolvedValueOnce(resolvedGameDeck2)
  const traceSpy = jest.fn().mockImplementation()
  PlayPassResolution['logger'] = {
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  await expect(
    PlayPassResolution.playPassResolution({
      game,
      logPrefix,
      roundOver,
    })
  ).resolves.toEqual(resolvedGame)

  expect(gameResolverFromObjectSpy.mock.calls).toEqual([
    [
      {
        game,
      },
    ],
  ])
  const publishCalls: any = [
    [
      PubSubEvents.PassPlayed,
      {
        passPlayed: resolvedGame,
      },
    ],
  ]
  if (roundOver) {
    publishCalls.push([
      PubSubEvents.RoundEndedForDeck,
      {
        roundEndedForDeck: {
          deck: resolvedGameDeck1,
          game: resolvedGame,
        },
      },
    ])
    publishCalls.push([
      PubSubEvents.RoundEndedForDeck,
      {
        roundEndedForDeck: {
          deck: resolvedGameDeck2,
          game: resolvedGame,
        },
      },
    ])
  }
  expect(publishSpy.mock.calls).toEqual(publishCalls)
  expect(gameDeckResolverFromObjectSpy.mock.calls).toEqual(
    roundOver
      ? [
          [
            {
              gameDeck: game.players[0].deck,
            },
          ],
          [
            {
              gameDeck: game.players[1].deck,
            },
          ],
        ]
      : []
  )
  const traceCalls: string[][] = []
  if (traceEnabled) {
    traceCalls.push([`${logPrefix} resolvedGame: "${JSON.stringify(resolvedGame)}"`])
    if (roundOver) {
      traceCalls.push([
        `${logPrefix} resolvedGameDeck for "${game.players[0].user}": "${JSON.stringify(resolvedGameDeck1)}"`,
      ])
      traceCalls.push([
        `${logPrefix} resolvedGameDeck for "${game.players[1].user}": "${JSON.stringify(resolvedGameDeck2)}"`,
      ])
    }
  }
  expect(traceSpy.mock.calls).toEqual(traceCalls)
}
