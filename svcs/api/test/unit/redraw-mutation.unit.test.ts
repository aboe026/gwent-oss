import { ObjectId } from 'mongodb'

import { Context } from '@gwent/graphql-schema/context'
import { DeckUnit, GameDeck, MutationRedrawArgs } from '@gwent/graphql-schema/resolver-typings'
import { DeckUnitDbObject, GameDbObject, GameStatus, RedrawDbObject } from '@gwent/graphql-schema/database-typings'
import DeckUnitResolver from '../../src/graphql/resolvers/types/deck-unit-resolver'
import EventManager from '../../src/graphql/event-manager'
import GameDeckResolver from '../../src/graphql/resolvers/types/game-deck-resolver'
import GameResolver from '../../src/graphql/resolvers/types/game-resolver'
import GameStore from '../../src/database/stores/game-store'
import * as gwentUtils from '@gwent/utils'
import { MAX_REDRAWS, PubSubEvents } from '@gwent/constants'
import RedrawMutation from '../../src/graphql/resolvers/mutations/redraw-mutation'
import ResolverUtil, { GamePlayerResponse } from '../../src/graphql/resolvers/resolver-util'
import TestUtil from '../test-util'

describe('redraw-mutation', () => {
  describe('redraw', () => {
    const userId = new ObjectId()
    const gameId = new ObjectId().toString()
    const unit = TestUtil.getDbUnit({})
    const unit2 = TestUtil.getDbUnit({})
    const previousRedraw: RedrawDbObject = {
      from: TestUtil.getDbDeckUnit({}),
      to: TestUtil.getDbDeckUnit({}),
    }
    const gamePlayer = TestUtil.getDbGamePlayer({
      deck: TestUtil.getDbGameDeck({
        from: TestUtil.getDbDeck({}),
        hand: [
          {
            artStyle: 1,
            unit: unit._id,
          },
        ],
        redraws: [previousRedraw],
        undrawn: [
          {
            artStyle: 1,
            unit: unit2._id,
          },
        ],
      }),
      user: userId,
    })
    const game = TestUtil.getDbGame({
      id: gameId,
      players: [gamePlayer, TestUtil.getDbGamePlayer({})],
    })
    const modifiedGame: GameDbObject = {
      ...game,
      players: [
        {
          ...game.players[0],
          deck: {
            ...game.players[0].deck,
            hand: [
              {
                artStyle: 1,
                unit: unit2._id,
              },
            ],
            undrawn: [
              {
                artStyle: 1,
                unit: unit._id,
              },
            ],
            redraws: [
              previousRedraw,
              {
                from: {
                  artStyle: 1,
                  unit: unit._id,
                },
                to: {
                  artStyle: 1,
                  unit: unit2._id,
                },
              },
            ],
          },
        },
        game.players[1],
      ],
      updated: new Date(),
    }
    const logPrefix = `redraw by "${userId}" for unit "${unit._id}" on game "${game._id}"`
    const getGamePlayerCalls = [
      [
        {
          gameId,
          userId,
          status: GameStatus.Redrawing,
          label: 'redraw',
        },
      ],
    ]
    const saveCalls = [
      [
        {
          ...modifiedGame,
          updated: game.updated,
        },
      ],
    ]
    const fromDeckUnit: DeckUnit = {
      artStyle: 1,
      unit: TestUtil.getUnit({
        id: unit._id,
        created: unit.created,
        factionId: unit.faction,
      }),
    }
    const toDeckUnit: DeckUnit = {
      artStyle: 1,
      unit: TestUtil.getUnit({
        id: unit2._id,
        created: unit2.created,
        factionId: unit2.faction,
      }),
    }
    const resolveDeckUnitCalls = [
      [
        {
          deckUnit: {
            artStyle: 1,
            unit: unit2._id,
          },
        },
      ],
      [
        {
          deckUnit: {
            artStyle: 1,
            unit: unit._id,
          },
        },
      ],
    ]
    it('throws error if game marked as ready', async () => {
      const error = 'Redraw not allowed after game marked as ready.'
      await testRedraw({
        userId,
        gameId,
        unitId: unit._id.toString(),
        getGamePlayerResponse: {
          game,
          player: {
            ...gamePlayer,
            ready: true,
          },
        },
        expected: Error(error),
        getGamePlayerCalls,
        warnCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('throws error if max redraws already taken', async () => {
      const error = `Cannot exceed maximum redraw limit of "${MAX_REDRAWS}".`
      await testRedraw({
        userId,
        gameId,
        unitId: unit._id.toString(),
        getGamePlayerResponse: {
          game,
          player: {
            ...gamePlayer,
            deck: {
              ...gamePlayer.deck,
              redraws: [
                {
                  from: TestUtil.getDbDeckUnit({}),
                  to: TestUtil.getDbDeckUnit({}),
                },
                {
                  from: TestUtil.getDbDeckUnit({}),
                  to: TestUtil.getDbDeckUnit({}),
                },
              ],
            },
          },
        },
        expected: Error(error),
        getGamePlayerCalls,
        warnCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('throws error if unit not in hand', async () => {
      const error = 'Unit not in hand.'
      await testRedraw({
        userId,
        gameId,
        unitId: unit._id.toString(),
        getGamePlayerResponse: {
          game,
          player: {
            ...gamePlayer,
            deck: TestUtil.getDbGameDeck({
              from: TestUtil.getDbDeck({}),
            }),
          },
        },
        expected: Error(error),
        getGamePlayerCalls,
        warnCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('throws error if updated game undefined', async () => {
      const error = `Could not redraw unit in probable race condition collision.`
      await testRedraw({
        userId,
        gameId,
        unitId: unit._id.toString(),
        getGamePlayerResponse: {
          game,
          player: gamePlayer,
        },
        saveResponse: undefined,
        expected: Error(error),
        getGamePlayerCalls,
        getRandomSubsetCalled: true,
        saveCalls,
        errorCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('throws error if updated game does not include game player', async () => {
      const error = 'Could not get updated game deck when redrawing unit.'
      await testRedraw({
        userId,
        gameId,
        unitId: unit._id.toString(),
        getGamePlayerResponse: {
          game,
          player: gamePlayer,
        },
        saveResponse: TestUtil.getDbGame({
          created: game.created,
          id: game._id,
          players: [],
        }),
        resolveDeckUnitResponses: [toDeckUnit, fromDeckUnit],
        expected: Error(error),
        getGamePlayerCalls,
        getRandomSubsetCalled: true,
        saveCalls,
        resolveDeckUnitCalls,
        errorCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('returns resolved DeckUnit if no errors', async () => {
      await testRedraw({
        userId,
        gameId,
        unitId: unit._id.toString(),
        getGamePlayerResponse: {
          game,
          player: gamePlayer,
        },
        saveResponse: modifiedGame,
        resolveDeckUnitResponses: [toDeckUnit, fromDeckUnit],
        expected: toDeckUnit,
        getGamePlayerCalls,
        getRandomSubsetCalled: true,
        saveCalls,
        resolveDeckUnitCalls,
        resolveGameDeckCalled: true,
      })
    })
    it('logs to trace if enabled', async () => {
      await testRedraw({
        userId,
        gameId,
        unitId: unit._id.toString(),
        getGamePlayerResponse: {
          game,
          player: gamePlayer,
        },
        saveResponse: modifiedGame,
        resolveDeckUnitResponses: [toDeckUnit, fromDeckUnit],
        expected: toDeckUnit,
        getGamePlayerCalls,
        getRandomSubsetCalled: true,
        saveCalls,
        resolveDeckUnitCalls,
        resolveGameDeckCalled: true,
        logPrefix,
        traceEnabled: true,
      })
    })
  })
})

async function testRedraw({
  userId,
  gameId,
  unitId,
  getGamePlayerResponse,
  saveResponse,
  resolveDeckUnitResponses,
  expected,
  getGamePlayerCalls = [],
  saveCalls = [],
  resolveDeckUnitCalls = [],
  resolveGameDeckCalled,
  getRandomSubsetCalled,
  logPrefix,
  errorCalls = [],
  warnCalls = [],
  traceEnabled,
}: {
  userId?: ObjectId
  gameId: string
  unitId: string
  getGamePlayerResponse: GamePlayerResponse
  saveResponse?: GameDbObject
  resolveDeckUnitResponses?: DeckUnit[]
  expected?: Error | DeckUnit
  getGamePlayerCalls?: any[][]
  saveCalls?: any[][]
  resolveDeckUnitCalls?: any[][]
  resolveGameDeckCalled?: boolean
  getRandomSubsetCalled?: boolean
  logPrefix?: string
  errorCalls?: any[][]
  warnCalls?: any[][]
  traceEnabled?: boolean
}) {
  const context: Context = {
    session: {},
  }
  if (userId && context.session) {
    context.session.user = TestUtil.getDbUser({
      id: userId,
    })
  }
  const args: MutationRedrawArgs = {
    game: gameId,
    unit: unitId,
  }
  const player = getGamePlayerResponse.player
  const redrawnIds = player.deck.redraws.map((redraw) => redraw.from.unit.toString())
  const cardToRedraw = player.deck.hand.find((deckUnit) => deckUnit.unit.toString() === unitId)
  const redrawPool = player.deck.undrawn.filter((deckUnit) => !redrawnIds.includes(deckUnit.unit.toString()))
  const newCard = redrawPool[redrawPool.length - 1]
  const getGamePlayerSpy = jest.spyOn(ResolverUtil.prototype, 'getGamePlayer').mockResolvedValue(getGamePlayerResponse)
  const getRandomSubsetSpy = jest.spyOn(gwentUtils, 'getRandomSubset').mockReturnValue([newCard])
  const saveSpy = jest.spyOn(GameStore, 'save').mockResolvedValue(saveResponse)
  const resolveDeckUnitSpy = jest.spyOn(DeckUnitResolver, 'fromObject')
  if (resolveDeckUnitResponses) {
    for (const resolveDeckUnitResponse of resolveDeckUnitResponses) {
      resolveDeckUnitSpy.mockResolvedValueOnce(resolveDeckUnitResponse)
    }
  }
  const resolvedGame = TestUtil.getGameFromDbGame({
    game: getGamePlayerResponse.game,
  })
  const resolveGameSpy = jest.spyOn(GameResolver, 'fromObject').mockResolvedValue(resolvedGame)
  const updatedGameDeck = saveResponse?.players.find((player) => player.user.toString() === userId?.toString())?.deck
  const resolveGameDeckSpy = jest.spyOn(GameDeckResolver, 'fromObject')

  let resolvedGameDeck: GameDeck | undefined = undefined
  if (getGamePlayerResponse && updatedGameDeck) {
    resolvedGameDeck = TestUtil.getGameDeckFromDbGameDeck(updatedGameDeck)
    resolveGameDeckSpy.mockResolvedValue(resolvedGameDeck)
  }
  const publishSpy = jest.spyOn(EventManager.pubsub, 'publish').mockImplementation()
  const errorSpy = jest.fn().mockImplementation()
  const warnSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  RedrawMutation['logger'] = {
    error: errorSpy,
    warn: warnSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as any

  const promise = RedrawMutation.redraw(args, context, null as any)
  if (expected instanceof Error) {
    await expect(promise).rejects.toThrow(expected)
  } else {
    await expect(promise).resolves.toEqual(expected)
  }

  expect(getGamePlayerSpy.mock.calls).toEqual(getGamePlayerCalls)
  expect(getRandomSubsetSpy.mock.calls).toEqual(
    getRandomSubsetCalled
      ? [
          [
            {
              items: redrawPool,
              size: 1,
            },
          ],
        ]
      : []
  )
  expect(saveSpy.mock.calls).toEqual(saveCalls)
  expect(resolveGameSpy.mock.calls).toEqual(
    saveResponse
      ? [
          [
            {
              game: saveResponse,
            },
          ],
        ]
      : []
  )
  expect(resolveDeckUnitSpy.mock.calls).toEqual(resolveDeckUnitCalls)
  expect(resolveGameDeckSpy.mock.calls).toEqual(
    resolveGameDeckCalled
      ? [
          [
            {
              gameDeck: updatedGameDeck,
            },
          ],
        ]
      : []
  )
  expect(publishSpy.mock.calls).toEqual(
    resolveDeckUnitResponses && !(expected instanceof Error)
      ? [
          [
            PubSubEvents.UnitRedrawn,
            {
              unitRedrawn: {
                from: resolveDeckUnitResponses[1],
                deck: resolvedGameDeck,
                game: resolvedGame,
                to: resolveDeckUnitResponses[0],
              },
            },
          ],
        ]
      : []
  )
  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(warnSpy.mock.calls).toEqual(warnCalls)
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [
            `${logPrefix} args: "${JSON.stringify({
              game: gameId,
              unit: unitId,
            })}"`,
          ],
          [`${logPrefix} requested fields: "[]"`],
          [`${logPrefix} requested arguments: "[]"`],
          [`${logPrefix} cardToRedraw: "${JSON.stringify(cardToRedraw)}"`],
          [
            `${logPrefix} redrawPool: "${JSON.stringify(
              player?.deck.undrawn.filter((deckUnit) => !redrawnIds.includes(deckUnit.unit.toString()))
            )}"`,
          ],
          [
            `${logPrefix} newCard: "${JSON.stringify(
              player?.deck.undrawn.filter((deckUnit) => !redrawnIds.includes(deckUnit.unit.toString()))[0]
            )}"`,
          ],
          [
            `${logPrefix} newHand: "${JSON.stringify([
              ...(player?.deck.hand.filter((deckUnit) => deckUnit.unit.toString() !== unitId) || []),
              newCard,
            ])}"`,
          ],
          [
            `${logPrefix} newRedraws: "${JSON.stringify([
              ...(player?.deck.redraws || []),
              {
                from: cardToRedraw,
                to: newCard,
              },
            ])}"`,
          ],
          [
            `${logPrefix} newUndrawn: "${JSON.stringify([
              ...(player?.deck.undrawn.filter(
                (deckUnit) => deckUnit.unit.toString() !== (newCard as DeckUnitDbObject).unit.toString()
              ) || []),
              cardToRedraw,
            ])}"`,
          ],
          [`${logPrefix} updatedGame: "${JSON.stringify(saveResponse)}"`],
          [`${logPrefix} resolvedTo: "${JSON.stringify(resolveDeckUnitResponses && resolveDeckUnitResponses[0])}"`],
          [`${logPrefix} resolvedGame: "${JSON.stringify(resolvedGame)}"`],
          [`${logPrefix} resolvedFrom: "${JSON.stringify(resolveDeckUnitResponses && resolveDeckUnitResponses[1])}"`],
        ]
      : []
  )
}
