import { ObjectId } from 'mongodb'

import CalculateGameEffectiveStrengths from '../../src/graphql/resolvers/mutations/util/calculate-game-effective-strengths'
import DiscardRoundUnits from '../../src/graphql/resolvers/mutations/play-pass/discard-round-units'
import EffectAvenger from '../../src/graphql/resolvers/mutations/play-unit/effect-avenger'
import GameStore from '../../src/database/stores/game-store'
import { GameUnitOrigin, MoveReasonType } from '@gwent-oss/graphql-schema/database-typings'
import * as getRoundUnits from '../../src/graphql/resolvers/mutations/util/get-round-units'
import * as getUnitEffects from '../../src/graphql/resolvers/mutations/util/get-unit-effects'
import { ImpactsByUnitId } from '../../src/graphql/resolvers/resolver-util'
import * as initializeNewRound from '../../src/graphql/resolvers/mutations/util/initialize-new-round'
import IsGameOver from '../../src/graphql/resolvers/mutations/play-pass/is-game-over'
import IsRoundOver from '../../src/graphql/resolvers/mutations/play-pass/is-round-over'
import { GameUnitType, MoveType } from '@gwent-oss/graphql-schema'
import * as passCurrentPlayer from '../../src/graphql/resolvers/mutations/play-pass/pass-current-player'
import PlayPassImplementation from '../../src/graphql/resolvers/mutations/play-pass/play-pass-implementation'
import * as setGameScores from '../../src/graphql/resolvers/mutations/util/set-game-scores'
import SetGameVictors from '../../src/graphql/resolvers/mutations/play-pass/set-game-victors'
import SetNextTurnForCurrentRound from '../../src/graphql/resolvers/mutations/util/set-next-turn-for-current-round'
import SetRoundResults from '../../src/graphql/resolvers/mutations/play-pass/set-round-results'
import SetTurnForNextRound from '../../src/graphql/resolvers/mutations/play-pass/set-turn-for-next-round'
import TestUtil from '../util/test-util'
import UpdateHistory from '../../src/graphql/resolvers/mutations/util/update-history'

describe('play-pass-implementation', () => {
  describe('playPassImplementation', () => {
    const logPrefix = 'log-prefix'
    it('throws error if updated game empty', async () => {
      const message = 'Could not play pass in probable race condition collision.'
      await testPlayPassImplementation({
        logPrefix,
        updatedGameEmpty: true,
        error: Error(message),
        errorCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('returns objects if no error and round not over', async () => {
      await testPlayPassImplementation({
        logPrefix,
      })
    })
    it('returns objects if no error and round over but game not over', async () => {
      await testPlayPassImplementation({
        logPrefix,
        roundOver: true,
      })
    })
    it('returns objects if no error and round and game over', async () => {
      await testPlayPassImplementation({
        logPrefix,
        roundOver: true,
        gameOver: true,
      })
    })
  })
  describe('summonAvengers', () => {
    it('does not call newUnitIndirect if avengers is empty object', async () => {
      testSummonAvengers({
        avengers: {},
      })
    })
    it('calls to newUnitIndirect once if avengers is single object with single avengee', async () => {
      testSummonAvengers({
        avengers: {
          [new ObjectId().toString()]: [
            {
              user: new ObjectId(),
              unit: TestUtil.getDbGameUnit({}),
            },
          ],
        },
      })
    })
    it('calls to newUnitIndirect once if avengers is multiple objects with single avengee', async () => {
      testSummonAvengers({
        avengers: {
          [new ObjectId().toString()]: [
            {
              user: new ObjectId(),
              unit: TestUtil.getDbGameUnit({}),
            },
          ],
          [new ObjectId().toString()]: [
            {
              user: new ObjectId(),
              unit: TestUtil.getDbGameUnit({}),
            },
          ],
        },
      })
    })
  })
})

async function testPlayPassImplementation({
  logPrefix = 'log-prefix',
  roundOver = false,
  gameOver = false,
  updatedGameEmpty,
  error,
  errorCalls = [],
}: {
  logPrefix?: string
  roundOver?: boolean
  gameOver?: boolean
  updatedGameEmpty?: boolean
  error?: Error
  errorCalls?: string[][]
}) {
  const game = TestUtil.getDbGame({})
  const userId = new ObjectId()
  const nextPlayerId = game.players[1].user
  const updatedGame = updatedGameEmpty
    ? undefined
    : {
        ...game,
        turn: nextPlayerId,
        updated: new Date(game.updated.getTime() + 1),
      }
  const passCurrentPlayerSpy = jest.spyOn(passCurrentPlayer, 'default').mockImplementation()
  const passingDate = new Date()
  const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => passingDate)
  const addMoveToPlayerSpy = jest.spyOn(UpdateHistory, 'addMoveToPlayer').mockImplementation()
  const isRoundOverSpy = jest.spyOn(IsRoundOver, 'isRoundOver').mockReturnValue(roundOver)
  const setRoundResultsSpy = jest.spyOn(SetRoundResults, 'setRoundResults').mockImplementation()
  const discardRoundUnitsSpy = jest.spyOn(DiscardRoundUnits, 'discardRoundUnits').mockImplementation()
  const isGameOverSpy = jest.spyOn(IsGameOver, 'isGameOver').mockReturnValue(gameOver)
  const setGameVictorsSpy = jest.spyOn(SetGameVictors, 'setGameVictors').mockImplementation()
  const setTurnForNextRoundSpy = jest.spyOn(SetTurnForNextRound, 'setTurnForNextRound').mockImplementation()
  const initializeNewRoundSpy = jest.spyOn(initializeNewRound, 'default').mockImplementation()
  const summonAvengersSpy = jest.spyOn(PlayPassImplementation as any, 'summonAvengers').mockImplementation()
  const setNextTurnForCurrentRoundSpy = jest
    .spyOn(SetNextTurnForCurrentRound, 'setNextTurnForCurrentRound')
    .mockImplementation()
  const gameStoreSaveSpy = jest.spyOn(GameStore, 'save').mockResolvedValue(updatedGame)
  const errorSpy = jest.fn().mockImplementation()
  PlayPassImplementation['logger'] = {
    error: errorSpy,
  } as any

  const promise = PlayPassImplementation.playPassImplementation({
    game,
    logPrefix,
    userId,
  })
  if (error) {
    await expect(promise).rejects.toThrow(error)
  } else {
    await expect(promise).resolves.toEqual({
      game: updatedGame,
      roundOver,
    })
  }

  expect(passCurrentPlayerSpy.mock.calls).toEqual([[game]])
  expect(dateSpy.mock.calls).toEqual([[]])
  expect(addMoveToPlayerSpy.mock.calls).toEqual([
    [
      {
        game,
        move: {
          created: passingDate,
          type: MoveType.Pass,
        },
        logPrefix,
        playerId: userId,
      },
    ],
  ])
  expect(isRoundOverSpy.mock.calls).toEqual([
    [
      {
        game,
        logPrefix,
      },
    ],
  ])
  expect(setRoundResultsSpy.mock.calls).toEqual(
    roundOver
      ? [
          [
            {
              game,
              logPrefix,
            },
          ],
        ]
      : []
  )
  expect(discardRoundUnitsSpy.mock.calls).toEqual(roundOver ? [[game]] : [])
  expect(isGameOverSpy.mock.calls).toEqual(
    roundOver
      ? [
          [
            {
              game,
              logPrefix,
            },
          ],
        ]
      : []
  )
  expect(setGameVictorsSpy.mock.calls).toEqual(
    gameOver
      ? [
          [
            {
              game,
              logPrefix,
            },
          ],
        ]
      : []
  )
  expect(setTurnForNextRoundSpy.mock.calls).toEqual(
    roundOver && !gameOver
      ? [
          [
            {
              game,
              logPrefix,
            },
          ],
        ]
      : []
  )
  expect(initializeNewRoundSpy.mock.calls).toEqual(
    roundOver && !gameOver
      ? [
          [
            {
              game,
            },
          ],
        ]
      : []
  )
  expect(summonAvengersSpy.mock.calls).toEqual(
    roundOver && !gameOver
      ? [
          [
            {
              game,
              logPrefix,
              passingDate,
              passingPlayerId: userId,
            },
          ],
        ]
      : []
  )
  expect(setNextTurnForCurrentRoundSpy.mock.calls).toEqual(
    roundOver
      ? []
      : [
          [
            {
              game,
              logPrefix,
            },
          ],
        ]
  )
  expect(gameStoreSaveSpy.mock.calls).toEqual([[game]])
  expect(errorSpy.mock.calls).toEqual(errorCalls)
}

async function testSummonAvengers({ avengers }: { avengers?: ImpactsByUnitId }) {
  const passingPlayerId = new ObjectId()
  const game = TestUtil.getDbGame({
    players: [
      TestUtil.getDbGamePlayer({
        user: passingPlayerId,
        rounds: [
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
          }),
        ],
      }),
      TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            ranged: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
          }),
        ],
      }),
    ],
    round: 2,
  })
  const logPrefix = 'log-prefix'
  const passingDate = new Date()
  const previousRoundUnits = [TestUtil.getDbUnit({})]
  const unitEffects = [TestUtil.getDbEffect({})]
  const avengedUnits = [TestUtil.getDbUnit({})]
  const getRoundUnitsSpy = jest.spyOn(getRoundUnits, 'default').mockResolvedValue(previousRoundUnits)
  const getUnitEffectsSpy = jest.spyOn(getUnitEffects, 'default').mockResolvedValue(unitEffects)
  const avengeRemovedUnitsSpy = jest.spyOn(EffectAvenger, 'avengeRemovedUnits')
  if (avengers) {
    avengeRemovedUnitsSpy.mockResolvedValue({
      avengedUnits,
      impacts: avengers,
      undiscarded: {},
      unhanded: {},
    })
  }
  const newUnitIndirectSpy = jest.spyOn(UpdateHistory, 'newUnitIndirect').mockImplementation()
  const calculateEffectiveStrengthsSpy = jest
    .spyOn(CalculateGameEffectiveStrengths, 'calculateEffectiveStrengths')
    .mockImplementation()
  const setGameScoresSpy = jest.spyOn(setGameScores, 'default').mockImplementation()

  await expect(
    PlayPassImplementation['summonAvengers']({
      game,
      logPrefix,
      passingDate,
      passingPlayerId,
    })
  ).resolves.toEqual(undefined)

  expect(getRoundUnitsSpy.mock.calls).toEqual([
    [
      {
        game,
        round: game.round - 2,
      },
    ],
  ])
  expect(getUnitEffectsSpy.mock.calls).toEqual([
    [
      {
        units: previousRoundUnits,
      },
    ],
  ])
  expect(avengeRemovedUnitsSpy.mock.calls).toEqual([
    [
      {
        battlefieldUnits: previousRoundUnits,
        effects: unitEffects,
        game,
        logPrefix,
        removedGameUnits: game.players
          .map((player) => {
            const round = player.rounds[game.round - 2]
            return [...round.close.units, ...round.ranged.units, ...round.siege.units].map((unit) => {
              return {
                unit: {
                  ...unit,
                  type: GameUnitType.Field,
                },
                user: player.user,
              }
            })
          })
          .flat(),
      },
    ],
  ])
  const newUnitIndirectCalls = []
  if (avengers) {
    for (const avengerUnitId of Object.keys(avengers)) {
      const avengees = avengers[avengerUnitId]
      for (const avengee of avengees) {
        newUnitIndirectCalls.push([
          {
            created: passingDate,
            game,
            logPrefix,
            avengers: {
              [avengerUnitId]: [avengee],
            },
            origin: GameUnitOrigin.Nondeck,
            playerId: avengee.user.toString(),
            turnUserId: passingPlayerId,
            reason: {
              type: MoveReasonType.Summon,
              unit: avengee.unit,
            },
            unitId: avengerUnitId,
            targetId: avengee.user,
          },
        ])
      }
    }
  }
  expect(newUnitIndirectSpy.mock.calls).toEqual(newUnitIndirectCalls)
  expect(calculateEffectiveStrengthsSpy.mock.calls).toEqual([
    [
      {
        game,
        units: [...previousRoundUnits, ...avengedUnits],
        effects: unitEffects,
        logPrefix,
      },
    ],
  ])
  expect(setGameScoresSpy.mock.calls).toEqual([[game]])
}
