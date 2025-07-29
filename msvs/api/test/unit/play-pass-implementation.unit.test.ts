import * as clearBattlefieldUnits from '../../src/graphql/resolvers/mutations/play-pass/clear-battlefield-units'
import GameStore from '../../src/database/stores/game-store'
import * as initializeNewRound from '../../src/graphql/resolvers/mutations/util/initialize-new-round'
import IsGameOver from '../../src/graphql/resolvers/mutations/play-pass/is-game-over'
import IsRoundOver from '../../src/graphql/resolvers/mutations/play-pass/is-round-over'
import { MoveType } from '@gwent/graphql-schema'
import * as passCurrentPlayer from '../../src/graphql/resolvers/mutations/play-pass/pass-current-player'
import PlayPassImplementation from '../../src/graphql/resolvers/mutations/play-pass/play-pass-implementation'
import SetGameVictors from '../../src/graphql/resolvers/mutations/play-pass/set-game-victors'
import SetNextTurnForCurrentRound from '../../src/graphql/resolvers/mutations/util/set-next-turn-for-current-round'
import SetRoundResults from '../../src/graphql/resolvers/mutations/play-pass/set-round-results'
import SetTurnForNextRound from '../../src/graphql/resolvers/mutations/play-pass/set-turn-for-next-round'
import TestUtil from '../util/test-util'
import UpdateHistory from '../../src/graphql/resolvers/mutations/play-unit/update-history'

describe('play-pass-implementation', () => {
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
  const nextPlayerId = game.players[1].user
  const updatedGame = updatedGameEmpty
    ? undefined
    : {
        ...game,
        turn: nextPlayerId,
        updated: new Date(game.updated.getTime() + 1),
      }
  const passCurrentPlayerSpy = jest.spyOn(passCurrentPlayer, 'default').mockImplementation()
  const moveCreated = new Date()
  const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => moveCreated)
  const addMoveToCurrentPlayerSpy = jest.spyOn(UpdateHistory, 'addMoveToCurrentPlayer').mockImplementation()
  const isRoundOverSpy = jest.spyOn(IsRoundOver, 'isRoundOver').mockReturnValue(roundOver)
  const setRoundResultsSpy = jest.spyOn(SetRoundResults, 'setRoundResults').mockImplementation()
  const clearBattlefieldUnitsSpy = jest.spyOn(clearBattlefieldUnits, 'default').mockImplementation()
  const isGameOverSpy = jest.spyOn(IsGameOver, 'isGameOver').mockReturnValue(gameOver)
  const setGameVictorsSpy = jest.spyOn(SetGameVictors, 'setGameVictors').mockImplementation()
  const setTurnForNextRoundSpy = jest.spyOn(SetTurnForNextRound, 'setTurnForNextRound').mockImplementation()
  const initializeNewRoundSpy = jest.spyOn(initializeNewRound, 'default').mockImplementation()
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
  expect(addMoveToCurrentPlayerSpy.mock.calls).toEqual([
    [
      {
        game,
        move: {
          created: moveCreated,
          type: MoveType.Pass,
        },
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
  expect(clearBattlefieldUnitsSpy.mock.calls).toEqual(roundOver ? [[game]] : [])
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
