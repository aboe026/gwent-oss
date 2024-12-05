import { ObjectId } from 'mongodb'

import { Context } from '@gwent/graphql-schema/context'
import { DeckUnit, MutationRedrawArgs } from '@gwent/graphql-schema/resolver-typings'
import {
  DeckUnitDbObject,
  GameDbObject,
  GamePlayerDbObject,
  RedrawDbObject,
} from '@gwent/graphql-schema/database-typings'
import DeckUnitResolver from '../../src/graphql/resolvers/types/deck-unit-resolver'
import EventManager from '../../src/graphql/event-manager'
import GameResolver from '../../src/graphql/resolvers/types/game-resolver'
import GameStore from '../../src/database/stores/game-store'
import * as gwentUtils from '@gwent/utils'
import { MAX_REDRAWS, NOT_AUTHENTICATED_MESSAGE, PubSubEvents } from '@gwent/constants'
import RedrawMutation from '../../src/graphql/resolvers/mutations/redraw-mutation'
import TestUtil from '../test-util'

describe('redraw-mutation', () => {
  describe('redraw', () => {
    const userId = new ObjectId()
    const gameId = new ObjectId().toString()
    const unit = TestUtil.getDbUnit({})
    const logPrefix = `redraw by "${userId}"`
    it('returns error if no user on context', async () => {
      await testRedraw({
        gameId,
        unitId: unit._id.toString(),
        expected: Error(NOT_AUTHENTICATED_MESSAGE),
        errorCalls: [[`No user on context for redraw mutation: "${JSON.stringify({})}".`]],
      })
    })
    it('returns error if game does not exist', async () => {
      const error = `Game with ID "${gameId}" does not exist.`
      await testRedraw({
        userId,
        gameId,
        unitId: unit._id.toString(),
        expected: Error(error),
        gameGetCalls: [
          [
            {
              id: gameId,
            },
          ],
        ],
        errorCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('returns error if not a player on game', async () => {
      const error = `Not a player on game "${gameId}".`
      await testRedraw({
        userId,
        gameId,
        unitId: unit._id.toString(),
        gameGetResponse: TestUtil.getDbGame({}),
        expected: Error(error),
        gameGetCalls: [
          [
            {
              id: gameId,
            },
          ],
        ],
        debugCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('returns error if game marked as ready', async () => {
      const error = `Cannot redraw after game "${gameId}" is marked as ready.`
      await testRedraw({
        userId,
        gameId,
        unitId: unit._id.toString(),
        gameGetResponse: TestUtil.getDbGame({
          players: [
            TestUtil.getDbGamePlayer({
              ready: true,
              user: userId,
            }),
          ],
        }),
        expected: Error(error),
        gameGetCalls: [
          [
            {
              id: gameId,
            },
          ],
        ],
        debugCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('returns error if deck not set', async () => {
      const error = `Cannot redraw before deck is set for game "${gameId}".`
      await testRedraw({
        userId,
        gameId,
        unitId: unit._id.toString(),
        gameGetResponse: TestUtil.getDbGame({
          players: [
            TestUtil.getDbGamePlayer({
              user: userId,
            }),
          ],
        }),
        expected: Error(error),
        gameGetCalls: [
          [
            {
              id: gameId,
            },
          ],
        ],
        debugCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('returns error if max redraws already taken', async () => {
      const error = `Cannot exceed maximum redraw limit of "${MAX_REDRAWS}" for game "${gameId}".`
      await testRedraw({
        userId,
        gameId,
        unitId: unit._id.toString(),
        gameGetResponse: TestUtil.getDbGame({
          players: [
            TestUtil.getDbGamePlayer({
              deck: TestUtil.getDbGameDeck({
                from: TestUtil.getDbDeck({}),
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
              }),
              user: new ObjectId(userId),
            }),
          ],
        }),
        expected: Error(error),
        gameGetCalls: [
          [
            {
              id: gameId,
            },
          ],
        ],
        debugCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('returns error if unit not in hand', async () => {
      const error = `Unit with ID "${unit._id}" does not exist in hand for game "${gameId}".`
      await testRedraw({
        userId,
        gameId,
        unitId: unit._id.toString(),
        gameGetResponse: TestUtil.getDbGame({
          players: [
            TestUtil.getDbGamePlayer({
              deck: TestUtil.getDbGameDeck({
                from: TestUtil.getDbDeck({}),
              }),
              user: userId,
            }),
          ],
        }),
        expected: Error(error),
        gameGetCalls: [
          [
            {
              id: gameId,
            },
          ],
        ],
        debugCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('returns error if updated game undefined', async () => {
      const error = `Could not redraw unit "${unit._id}" on game "${gameId}" in probable race condition collision.`
      const unit2 = TestUtil.getDbUnit({})
      await testRedraw({
        userId,
        gameId,
        unitId: unit._id.toString(),
        gameGetResponse: TestUtil.getDbGame({
          players: [
            TestUtil.getDbGamePlayer({
              deck: TestUtil.getDbGameDeck({
                from: TestUtil.getDbDeck({}),
                hand: [
                  {
                    artStyle: 1,
                    unit: unit._id,
                  },
                ],
                undrawn: [
                  {
                    artStyle: 1,
                    unit: unit2._id,
                  },
                ],
              }),
              user: userId,
            }),
          ],
        }),
        gameRedrawResponse: undefined,
        expected: Error(error),
        gameGetCalls: [
          [
            {
              id: gameId,
            },
          ],
        ],
        getRandomSubsetCalled: true,
        gameRedrawCalls: [
          [
            {
              currentRedraws: [],
              gameId,
              newHand: [
                {
                  artStyle: 1,
                  unit: unit2._id,
                },
              ],
              newRedraws: [
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
              newUndrawn: [
                {
                  artStyle: 1,
                  unit: unit._id,
                },
              ],
              userId,
            },
          ],
        ],
        errorCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('returns resolved DeckUnit if no errors', async () => {
      const unit2 = TestUtil.getDbUnit({})
      const previousRedraw: RedrawDbObject = {
        from: TestUtil.getDbDeckUnit({}),
        to: TestUtil.getDbDeckUnit({}),
      }
      const game = TestUtil.getDbGame({
        players: [
          TestUtil.getDbGamePlayer({
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
          }),
        ],
      })
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

      await testRedraw({
        userId,
        gameId,
        unitId: unit._id.toString(),
        gameGetResponse: game,
        gameRedrawResponse: TestUtil.getDbGame({
          created: game.created,
          id: game._id,
          players: [
            TestUtil.getDbGamePlayer({
              deck: TestUtil.getDbGameDeck({
                from: TestUtil.getDbDeck({}),
                hand: [
                  {
                    artStyle: 1,
                    unit: unit2._id,
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
                undrawn: [
                  {
                    artStyle: 1,
                    unit: unit._id,
                  },
                ],
              }),
              user: userId,
            }),
          ],
        }),
        resolveDeckUnitResponses: [toDeckUnit, fromDeckUnit],
        expected: toDeckUnit,
        gameGetCalls: [
          [
            {
              id: gameId,
            },
          ],
        ],
        getRandomSubsetCalled: true,
        gameRedrawCalls: [
          [
            {
              currentRedraws: [previousRedraw],
              gameId,
              newHand: [
                {
                  artStyle: 1,
                  unit: unit2._id,
                },
              ],
              newRedraws: [
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
              newUndrawn: [
                {
                  artStyle: 1,
                  unit: unit._id,
                },
              ],
              userId,
            },
          ],
        ],
        resolveDeckUnitCalls: [
          [
            {
              deckUnit: {
                artStyle: 1,
                unit: unit2._id,
              },
              neutralStats: undefined,
            },
          ],
          [
            {
              deckUnit: {
                artStyle: 1,
                unit: unit._id,
              },
              neutralStats: undefined,
            },
          ],
        ],
      })
    })
    it('logs to trace if enabled', async () => {
      const unit2 = TestUtil.getDbUnit({})
      const previousRedraw: RedrawDbObject = {
        from: TestUtil.getDbDeckUnit({}),
        to: TestUtil.getDbDeckUnit({}),
      }
      const game = TestUtil.getDbGame({
        players: [
          TestUtil.getDbGamePlayer({
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
          }),
        ],
      })
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

      await testRedraw({
        userId,
        gameId,
        unitId: unit._id.toString(),
        gameGetResponse: game,
        gameRedrawResponse: TestUtil.getDbGame({
          created: game.created,
          id: game._id,
          players: [
            TestUtil.getDbGamePlayer({
              deck: TestUtil.getDbGameDeck({
                from: TestUtil.getDbDeck({}),
                hand: [
                  {
                    artStyle: 1,
                    unit: unit2._id,
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
                undrawn: [
                  {
                    artStyle: 1,
                    unit: unit._id,
                  },
                ],
              }),
              user: userId,
            }),
          ],
        }),
        resolveDeckUnitResponses: [toDeckUnit, fromDeckUnit],
        expected: toDeckUnit,
        gameGetCalls: [
          [
            {
              id: gameId,
            },
          ],
        ],
        getRandomSubsetCalled: true,
        gameRedrawCalls: [
          [
            {
              currentRedraws: [previousRedraw],
              gameId,
              newHand: [
                {
                  artStyle: 1,
                  unit: unit2._id,
                },
              ],
              newRedraws: [
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
              newUndrawn: [
                {
                  artStyle: 1,
                  unit: unit._id,
                },
              ],
              userId,
            },
          ],
        ],
        resolveDeckUnitCalls: [
          [
            {
              deckUnit: {
                artStyle: 1,
                unit: unit2._id,
              },
              neutralStats: undefined,
            },
          ],
          [
            {
              deckUnit: {
                artStyle: 1,
                unit: unit._id,
              },
              neutralStats: undefined,
            },
          ],
        ],
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
  gameGetResponse,
  gameRedrawResponse,
  resolveDeckUnitResponses,
  expected,
  gameGetCalls = [],
  gameRedrawCalls = [],
  resolveDeckUnitCalls = [],
  getRandomSubsetCalled,
  logPrefix,
  traceEnabled,
  debugCalls = [],
  errorCalls = [],
}: {
  userId?: ObjectId
  gameId?: string
  unitId?: string
  gameGetResponse?: GameDbObject
  gameRedrawResponse?: GameDbObject
  resolveDeckUnitResponses?: DeckUnit[]
  expected?: Error | DeckUnit
  gameGetCalls?: any[][]
  gameRedrawCalls?: any[][]
  resolveDeckUnitCalls?: any[][]
  getRandomSubsetCalled?: boolean
  logPrefix?: string
  traceEnabled?: boolean
  debugCalls?: any[][]
  errorCalls?: any[][]
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
    game: gameId || '',
    unit: unitId || '',
  }
  const player = gameGetResponse?.players.find(
    (player) => player.user.toString() === userId?.toString()
  ) as GamePlayerDbObject
  let newCard: DeckUnitDbObject | undefined = undefined
  let cardToRedraw: DeckUnitDbObject | undefined = undefined
  let redrawPool: DeckUnitDbObject[] = []
  let redrawnIds: string[] = []
  if (player) {
    redrawnIds = player.deck.redraws.map((redraw) => redraw.from.unit.toString())
    redrawPool = player.deck.undrawn.filter((deckUnit) => !redrawnIds.includes(deckUnit.unit.toString()))
    cardToRedraw = player.deck.hand.find((deckUnit) => deckUnit.unit.toString() === unitId)
    newCard = redrawPool[redrawPool.length - 1]
  }
  const gameGetSpy = jest.spyOn(GameStore, 'getById').mockResolvedValue(gameGetResponse)
  const getRandomSubsetSpy = jest.spyOn(gwentUtils, 'getRandomSubset').mockReturnValue([newCard])
  const gameRedrawSpy = jest.spyOn(GameStore, 'redraw').mockResolvedValue(gameRedrawResponse)
  const resolveDeckUnitSpy = jest.spyOn(DeckUnitResolver, 'fromObject')
  if (resolveDeckUnitResponses) {
    for (const resolveDeckUnitResponse of resolveDeckUnitResponses) {
      resolveDeckUnitSpy.mockResolvedValueOnce(resolveDeckUnitResponse)
    }
  }
  const resolveGameSpy = jest.spyOn(GameResolver, 'fromObject')
  let resolvedGame
  if (gameGetResponse) {
    resolvedGame = TestUtil.getGameFromDbGame({
      game: gameGetResponse,
    })
    resolveGameSpy.mockResolvedValue(resolvedGame)
  }
  const publishSpy = jest.spyOn(EventManager.pubsub, 'publish').mockImplementation()
  const debugSpy = jest.fn().mockImplementation()
  const errorSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  RedrawMutation['logger'] = {
    debug: debugSpy,
    error: errorSpy,
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  await expect(RedrawMutation.redraw(args, context, null as any)).resolves.toEqual(expected)

  expect(gameGetSpy.mock.calls).toEqual(gameGetCalls)
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
  expect(gameRedrawSpy.mock.calls).toEqual(gameRedrawCalls)
  expect(resolveDeckUnitSpy.mock.calls).toEqual(resolveDeckUnitCalls)
  expect(publishSpy.mock.calls).toEqual(
    resolveDeckUnitResponses
      ? [
          [
            PubSubEvents.UnitRedrawn,
            {
              unitRedrawn: {
                from: resolveDeckUnitResponses[1],
                game: resolvedGame,
                to: resolveDeckUnitResponses[0],
                ownerId: userId,
              },
            },
          ],
        ]
      : []
  )
  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(errorSpy.mock.calls).toEqual(errorCalls)
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
          [`${logPrefix} game: "${JSON.stringify(gameGetResponse)}"`],
          [`${logPrefix} player: "${JSON.stringify(player)}"`],
          [`${logPrefix} cardToRedraw: "${JSON.stringify(cardToRedraw)}"`],
          [
            `${logPrefix} redrawPool: "${JSON.stringify(
              player.deck.undrawn.filter((deckUnit) => !redrawnIds.includes(deckUnit.unit.toString()))
            )}"`,
          ],
          [
            `${logPrefix} newCard: "${JSON.stringify(
              player.deck.undrawn.filter((deckUnit) => !redrawnIds.includes(deckUnit.unit.toString()))[0]
            )}"`,
          ],
          [
            `${logPrefix} newHand: "${JSON.stringify([
              ...player.deck.hand.filter((deckUnit) => deckUnit.unit.toString() !== unitId),
              newCard,
            ])}"`,
          ],
          [
            `${logPrefix} newRedraws: "${JSON.stringify([
              ...player.deck.redraws,
              {
                from: cardToRedraw,
                to: newCard,
              },
            ])}"`,
          ],
          [
            `${logPrefix} newUndrawn: "${JSON.stringify([
              ...player.deck.undrawn.filter(
                (deckUnit) => deckUnit.unit.toString() !== (newCard as DeckUnitDbObject).unit.toString()
              ),
              cardToRedraw,
            ])}"`,
          ],
          [`${logPrefix} updatedGame: "${JSON.stringify(gameRedrawResponse)}"`],
          [`${logPrefix} resolvedTo: "${JSON.stringify(resolveDeckUnitResponses && resolveDeckUnitResponses[0])}"`],
          [`${logPrefix} resolvedGame: "${JSON.stringify(resolvedGame)}"`],
          [`${logPrefix} resolvedFrom: "${JSON.stringify(resolveDeckUnitResponses && resolveDeckUnitResponses[1])}"`],
        ]
      : []
  )
}
