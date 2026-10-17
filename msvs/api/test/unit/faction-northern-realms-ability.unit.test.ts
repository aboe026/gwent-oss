import { ObjectId } from 'mongodb'

import deepClone from '../util/deep-clone'
import {
  FactionDbObject,
  FactionKey,
  GameDbObject,
  GameUnitOrigin,
  RoundResult,
} from '@gwent-oss/graphql-schema/database-typings'
import FactionNorthernRealmsAbility from '../../src/graphql/resolvers/mutations/play-pass/faction-northern-realms-ability'
import FactionStore from '../../src/database/stores/faction-store'
import { GameUnitType } from '../../../../libs/graphql-schema/src'
import { MoveType } from '@gwent-oss/graphql-schema'
import TestUtil from '../util/test-util'
import UpdateHistory from '../../src/graphql/resolvers/mutations/util/update-history'
import * as utils from '@gwent-oss/utils'

describe('FactionNorthernRealmsAbility', () => {
  describe('attemptAbility', () => {
    const logPrefix = 'log-prefix'
    describe('invalid', () => {
      it('throws error if multiple round winners', async () => {
        const player1 = TestUtil.getDbGamePlayer({
          rounds: [
            TestUtil.getDbPlayerRound({
              result: RoundResult.Won,
            }),
            TestUtil.getDbPlayerRound({}),
          ],
        })
        const player2 = TestUtil.getDbGamePlayer({
          rounds: [
            TestUtil.getDbPlayerRound({
              result: RoundResult.Won,
            }),
            TestUtil.getDbPlayerRound({}),
          ],
        })
        const message = 'Found more than 1 round winner'
        await testAttemptAbility({
          logPrefix,
          game: TestUtil.getDbGame({
            round: 2,
            players: [player1, player2],
          }),
          error: Error(`${message}.`),
          errorCalls: [[`${logPrefix} failed: ${message}: "${JSON.stringify([player1, player2])}"`]],
        })
      })
      it('throws error if round winner does not have deck set', async () => {
        const userId = new ObjectId()
        const deck = TestUtil.getDbGameDeck({})
        const message = `Could not find deck for round winner "${userId}"`
        await testAttemptAbility({
          logPrefix,
          game: TestUtil.getDbGame({
            round: 2,
            players: [
              TestUtil.getDbGamePlayer({
                user: userId,
                deck,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    result: RoundResult.Won,
                  }),
                  TestUtil.getDbPlayerRound({}),
                ],
              }),
            ],
          }),
          expectedRoundWinnerId: userId,
          error: Error(`${message}.`),
          errorCalls: [[`${logPrefix} failed: ${message}: "${JSON.stringify(deck)}"`]],
        })
      })
      it('throws error if no faction for nothern realms found', async () => {
        const userId = new ObjectId()
        const factionId = new ObjectId()
        const message = `Could not find faction "${FactionKey.NorthernRealms}".`
        await testAttemptAbility({
          logPrefix,
          game: TestUtil.getDbGame({
            round: 2,
            players: [
              TestUtil.getDbGamePlayer({
                user: userId,
                deck: TestUtil.getDbGameDeck({
                  from: TestUtil.getDbDeck({
                    faction: factionId,
                  }),
                  undrawn: [TestUtil.getDbGameUnit({})],
                }),
                rounds: [
                  TestUtil.getDbPlayerRound({
                    result: RoundResult.Won,
                  }),
                  TestUtil.getDbPlayerRound({}),
                ],
              }),
            ],
          }),
          expectedRoundWinnerId: userId,
          factionsGetResponse: [],
          error: Error(`${message}.`),
          errorCalls: [[`${logPrefix} failed: ${message}`]],
        })
      })
      it('throws error if more than one faction for nothern realms found', async () => {
        const userId = new ObjectId()
        const factionId = new ObjectId()
        const factions = [
          TestUtil.getDbFaction({
            id: factionId,
          }),
          TestUtil.getDbFaction({
            id: factionId,
          }),
        ]
        const message = `Found more than 1 faction for "${FactionKey.NorthernRealms}"`
        await testAttemptAbility({
          logPrefix,
          game: TestUtil.getDbGame({
            round: 2,
            players: [
              TestUtil.getDbGamePlayer({
                user: userId,
                deck: TestUtil.getDbGameDeck({
                  from: TestUtil.getDbDeck({
                    faction: factionId,
                  }),
                  undrawn: [TestUtil.getDbGameUnit({})],
                }),
                rounds: [
                  TestUtil.getDbPlayerRound({
                    result: RoundResult.Won,
                  }),
                  TestUtil.getDbPlayerRound({}),
                ],
              }),
            ],
          }),
          expectedRoundWinnerId: userId,
          factionsGetResponse: factions,
          error: Error(`${message}.`),
          errorCalls: [[`${logPrefix} failed: ${message}: "${JSON.stringify(factions)}"`]],
        })
      })
    })
    describe('valid', () => {
      it('does not add move to history if northern realms faction but round not won', async () => {
        const userId = new ObjectId()
        const factionId = new ObjectId()
        await testAttemptAbility({
          logPrefix,
          game: TestUtil.getDbGame({
            round: 2,
            players: [
              TestUtil.getDbGamePlayer({
                user: userId,
                deck: TestUtil.getDbGameDeck({
                  from: TestUtil.getDbDeck({
                    faction: factionId,
                  }),
                }),
                rounds: [
                  TestUtil.getDbPlayerRound({
                    result: RoundResult.Lost,
                  }),
                  TestUtil.getDbPlayerRound({}),
                ],
              }),
            ],
          }),
        })
      })
      it('does not add move to history if not northern realms faction and round won', async () => {
        const userId = new ObjectId()
        const factionId = new ObjectId()
        await testAttemptAbility({
          logPrefix,
          game: TestUtil.getDbGame({
            round: 2,
            players: [
              TestUtil.getDbGamePlayer({
                user: userId,
                deck: TestUtil.getDbGameDeck({
                  from: TestUtil.getDbDeck({
                    faction: factionId,
                  }),
                }),
                rounds: [
                  TestUtil.getDbPlayerRound({
                    result: RoundResult.Won,
                  }),
                  TestUtil.getDbPlayerRound({}),
                ],
              }),
            ],
          }),
          expectedRoundWinnerId: userId,
          factionsGetResponse: [TestUtil.getDbFaction({})],
        })
      })
      it('does not move undrawn if no available but adds move to history without impact if northern realms faction and round won', async () => {
        const userId = new ObjectId()
        const factionId = new ObjectId()
        await testAttemptAbility({
          logPrefix,
          game: TestUtil.getDbGame({
            round: 2,
            players: [
              TestUtil.getDbGamePlayer({
                user: userId,
                deck: TestUtil.getDbGameDeck({
                  from: TestUtil.getDbDeck({
                    faction: factionId,
                  }),
                }),
                rounds: [
                  TestUtil.getDbPlayerRound({
                    result: RoundResult.Won,
                  }),
                  TestUtil.getDbPlayerRound({}),
                ],
              }),
            ],
          }),
          expectedRoundWinnerId: userId,
          factionsGetResponse: [
            TestUtil.getDbFaction({
              id: factionId,
            }),
          ],
          debugCalls: [
            [`${logPrefix} won round with Northern Realms faction, but no units in undrawn to randomly draw`],
          ],
        })
      })
      it('moves undrawn to hand and adds move to history with impact if northern realms faction and round won', async () => {
        const userId = new ObjectId()
        const factionId = new ObjectId()
        const unitId = new ObjectId()
        await testAttemptAbility({
          logPrefix,
          game: TestUtil.getDbGame({
            round: 2,
            players: [
              TestUtil.getDbGamePlayer({
                user: userId,
                deck: TestUtil.getDbGameDeck({
                  from: TestUtil.getDbDeck({
                    faction: factionId,
                  }),
                  undrawn: [
                    TestUtil.getDbGameUnit({
                      id: unitId,
                    }),
                  ],
                }),
                rounds: [
                  TestUtil.getDbPlayerRound({
                    result: RoundResult.Won,
                  }),
                  TestUtil.getDbPlayerRound({}),
                ],
              }),
            ],
          }),
          expectedRoundWinnerId: userId,
          factionsGetResponse: [
            TestUtil.getDbFaction({
              id: factionId,
            }),
          ],
          getRandomNumberExpectedMax: 0,
          getRandomNumberResponse: 0,
          debugCalls: [
            [`${logPrefix} won round with Northern Realms faction, random undrawn "${unitId}" moved to hand.`],
          ],
          traceCalls: [[`${logPrefix} index: "0"`]],
        })
      })
      it('logs to trace if enabled', async () => {
        const factions = [TestUtil.getDbFaction({})]
        const undrawn = TestUtil.getDbGameUnit({})
        const players = [
          TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              from: TestUtil.getDbDeck({
                faction: factions[0]._id,
              }),
              undrawn: [undrawn],
            }),
            rounds: [
              TestUtil.getDbPlayerRound({
                result: RoundResult.Won,
              }),
              TestUtil.getDbPlayerRound({}),
            ],
          }),
        ]
        await testAttemptAbility({
          logPrefix,
          game: TestUtil.getDbGame({
            round: 2,
            players,
          }),
          expectedRoundWinnerId: players[0].user,
          factionsGetResponse: factions,
          getRandomNumberExpectedMax: 0,
          getRandomNumberResponse: 0,
          traceEnabled: true,
          debugCalls: [
            [`${logPrefix} won round with Northern Realms faction, random undrawn "${undrawn.unit}" moved to hand.`],
          ],
          traceCalls: [
            [`${logPrefix} roundWinners: "${JSON.stringify(players)}"`],
            [`${logPrefix} factions: "${JSON.stringify(factions)}"`],
            [`${logPrefix} index: "0"`],
          ],
        })
      })
    })
  })
})

async function testAttemptAbility({
  game,
  logPrefix,
  factionsGetResponse,
  getRandomNumberResponse,
  error,
  getRandomNumberExpectedMax,
  expectedRoundWinnerId,
  errorCalls = [],
  debugCalls = [],
  traceCalls = [],
  traceEnabled,
}: {
  game: GameDbObject
  logPrefix: string
  factionsGetResponse?: FactionDbObject[] | null
  getRandomNumberResponse?: number
  error?: Error
  getRandomNumberExpectedMax?: number
  expectedRoundWinnerId?: ObjectId
  errorCalls?: string[][]
  debugCalls?: string[][]
  traceCalls?: string[][]
  traceEnabled?: boolean
}) {
  const ogGame = deepClone(game)
  const factionsGetSpy = jest.spyOn(FactionStore, 'get')
  if (factionsGetResponse) {
    factionsGetSpy.mockResolvedValue(factionsGetResponse)
  }
  const getRandomNumberSpy = jest.spyOn(utils, 'getRandomNumber')
  if (getRandomNumberResponse) {
    getRandomNumberSpy.mockReturnValue(getRandomNumberResponse)
  }
  const addMoveToPlayerSpy = jest.spyOn(UpdateHistory, 'addMoveToPlayer').mockReturnValue()
  const created = new Date()
  const dateSpy = jest.spyOn(global, 'Date').mockReturnValue(created)
  const errorSpy = jest.fn().mockImplementation()
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  FactionNorthernRealmsAbility['logger'] = {
    error: errorSpy,
    debug: debugSpy,
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  const promise = FactionNorthernRealmsAbility.attemptAbility({
    game,
    logPrefix,
  })
  if (error) {
    await expect(promise).rejects.toThrow(error)
  } else {
    await expect(promise).resolves.toEqual(undefined)
  }

  expect(factionsGetSpy.mock.calls).toEqual(
    factionsGetResponse
      ? [
          [
            {
              keys: [FactionKey.NorthernRealms],
            },
          ],
        ]
      : []
  )
  expect(getRandomNumberSpy.mock.calls).toEqual(
    getRandomNumberResponse === undefined
      ? []
      : [
          [
            {
              min: 0,
              max: getRandomNumberExpectedMax,
            },
          ],
        ]
  )
  const roundWinner = ogGame.players.find(
    (player) => player.user.toString() === (expectedRoundWinnerId || '').toString()
  )
  const factionAbilityTriggered =
    expectedRoundWinnerId &&
    factionsGetResponse &&
    factionsGetResponse.length > 0 &&
    factionsGetResponse[0]._id.toString() === roundWinner?.deck.from?.faction.toString()
  expect(dateSpy.mock.calls).toEqual(factionAbilityTriggered && !error ? [[]] : [])
  const undrawnMovedToHand = roundWinner?.deck.undrawn[getRandomNumberResponse || 0]
  expect(addMoveToPlayerSpy.mock.calls).toEqual(
    factionAbilityTriggered && !error
      ? [
          [
            {
              game:
                getRandomNumberResponse === undefined
                  ? ogGame
                  : {
                      ...ogGame,
                      players: ogGame.players.map((player) => {
                        const undrawn = player.deck.undrawn
                        const hand = player.deck.hand
                        if (player.user.toString() === expectedRoundWinnerId.toString()) {
                          hand.push(undrawn[getRandomNumberResponse])
                          undrawn.splice(getRandomNumberResponse, 1)
                        }
                        return {
                          ...player,
                          deck: {
                            ...player.deck,
                            undrawn,
                            hand,
                          },
                        }
                      }),
                    },
              logPrefix,
              playerId: expectedRoundWinnerId,
              move: {
                created,
                faction: factionsGetResponse && factionsGetResponse[0]._id,
                type: MoveType.Faction,
                impacts:
                  getRandomNumberResponse === undefined
                    ? []
                    : [
                        {
                          user: expectedRoundWinnerId,
                          unit: {
                            ...undrawnMovedToHand,
                            type: GameUnitType.Deck,
                          },
                          source: {
                            origin: GameUnitOrigin.Undrawn,
                          },
                          scope: expectedRoundWinnerId,
                        },
                      ],
              },
            },
          ],
        ]
      : []
  )
  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(traceSpy.mock.calls).toEqual(traceCalls)
}
