import * as addMoveToCurrentPlayer from '../../src/graphql/resolvers/mutations/util/add-move-to-current-player'
import CalculateGameEffectiveStrengths from '../../src/graphql/resolvers/mutations/play-unit/calculate-game-effective-strengths'
import { Combat } from '@gwent/graphql-schema/resolver-typings'
import { GameDbObject, GameDeckDbObject } from '@gwent/graphql-schema/database-typings'
import GameStore from '../../src/database/stores/game-store'
import * as getRoundUnits from '../../src/graphql/resolvers/mutations/play-unit/get-round-units'
import * as getUnitEffects from '../../src/graphql/resolvers/mutations/play-unit/get-unit-effects'
import * as modifyBattlefieldWithNewUnit from '../../src/graphql/resolvers/mutations/play-unit/modify-battlefield-with-new-unit'
import { MoveType } from '@gwent/graphql-schema'
import PlayUnitImplementation from '../../src/graphql/resolvers/mutations/play-unit/play-unit-implementation'
import * as setGameScores from '../../src/graphql/resolvers/mutations/play-unit/set-game-scores'
import SetNextTurnForCurrentRound from '../../src/graphql/resolvers/mutations/util/set-next-turn-for-current-round'
import TestUtil from '../util/test-util'

describe('play-unit-implementation', () => {
  const logPrefix = 'log-prefix'
  it('throws error if no updated game from save', async () => {
    const message = 'Could not play unit in probable race condition collision.'
    await testPlayUnitImplementation({
      game: TestUtil.getDbGame({}),
      logPrefix,
      error: Error(message),
      errorCalls: [[`${logPrefix} failed: ${message}`]],
    })
  })
  it('throws error if player not found on updated game', async () => {
    const player = TestUtil.getDbGamePlayer({})
    const game = TestUtil.getDbGame({
      players: [player],
      turn: player.user,
    })
    const message = `Could not find player "${player.user}" in updated game.`
    await testPlayUnitImplementation({
      game,
      updatedGame: {
        ...game,
        players: [],
        updated: new Date(),
      },
      logPrefix,
      error: Error(message),
      errorCalls: [[`${logPrefix} failed: ${message}`]],
    })
  })
  it('returns objects if no error', async () => {
    const player = TestUtil.getDbGamePlayer({
      deck: TestUtil.getDbGameDeck({}),
    })
    const game = TestUtil.getDbGame({
      players: [player],
      turn: player.user,
    })
    await testPlayUnitImplementation({
      game,
      updatedGame: {
        ...game,
        updated: new Date(),
      },
      logPrefix,
      expectedGameDeck: player.deck,
    })
  })
  it('logs to trace if enabled', async () => {
    const player = TestUtil.getDbGamePlayer({
      deck: TestUtil.getDbGameDeck({}),
    })
    const game = TestUtil.getDbGame({
      players: [player],
      turn: player.user,
    })
    await testPlayUnitImplementation({
      game,
      updatedGame: {
        ...game,
        updated: new Date(),
      },
      logPrefix,
      expectedGameDeck: player.deck,
      traceEnabled: true,
    })
  })
})

async function testPlayUnitImplementation({
  game,
  updatedGame,
  logPrefix,
  error,
  expectedGameDeck,
  errorCalls = [],
  traceEnabled,
}: {
  game: GameDbObject
  updatedGame?: GameDbObject
  logPrefix: string
  error?: Error
  expectedGameDeck?: GameDeckDbObject
  errorCalls?: string[][]
  traceEnabled?: boolean
}) {
  const combat = Combat.Ranged
  const deckUnit = TestUtil.getDbDeckUnit({})
  const unit = TestUtil.getDbUnit({
    id: deckUnit.unit,
  })
  const units = [
    TestUtil.getDbUnit({
      id: unit._id,
    }),
  ]
  const effects = [TestUtil.getDbEffect({})]
  const created = new Date()
  const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => created)
  const getRoundUnitsSpy = jest.spyOn(getRoundUnits, 'default').mockResolvedValue(units)
  const getUnitEffectsSpy = jest.spyOn(getUnitEffects, 'default').mockResolvedValue(effects)
  const modifyBattlefieldWithNewUnitSpy = jest.spyOn(modifyBattlefieldWithNewUnit, 'default').mockImplementation()
  const calculateEffectiveStrengthsSpy = jest
    .spyOn(CalculateGameEffectiveStrengths, 'calculateEffectiveStrengths')
    .mockImplementation()
  const setGameScoresSpy = jest.spyOn(setGameScores, 'default').mockImplementation()
  const addMoveToCurrentPlayerSpy = jest.spyOn(addMoveToCurrentPlayer, 'default').mockImplementation()
  const setNextTurnForCurrentRoundSpy = jest
    .spyOn(SetNextTurnForCurrentRound, 'setNextTurnForCurrentRound')
    .mockImplementation()
  const gameStoreSaveSpy = jest.spyOn(GameStore, 'save').mockResolvedValue(updatedGame)
  const errorSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  PlayUnitImplementation['logger'] = {
    error: errorSpy,
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  const promise = PlayUnitImplementation.playUnitImplementation({
    combat,
    deckUnit,
    game,
    logPrefix,
    unit,
  })
  if (error) {
    await expect(promise).rejects.toThrow(error)
  } else {
    await expect(promise).resolves.toEqual({
      game: updatedGame,
      gameDeck: expectedGameDeck,
    })
  }

  expect(getRoundUnitsSpy.mock.calls).toEqual([
    [
      {
        game,
        unitBeingPlayed: unit,
      },
    ],
  ])
  expect(getUnitEffectsSpy.mock.calls).toEqual([[units]])
  expect(modifyBattlefieldWithNewUnitSpy.mock.calls).toEqual([
    [
      {
        battlefieldUnits: units,
        combat,
        effects,
        game,
        logPrefix,
        newDeckUnit: deckUnit,
      },
    ],
  ])
  expect(calculateEffectiveStrengthsSpy.mock.calls).toEqual([
    [
      {
        game,
        units: [unit, ...units],
        effects: effects,
      },
    ],
  ])
  expect(setGameScoresSpy.mock.calls).toEqual([[game]])
  expect(addMoveToCurrentPlayerSpy.mock.calls).toEqual([
    [
      {
        game,
        move: {
          created,
          row: combat,
          unit: {
            artStyle: deckUnit.artStyle,
            unit: deckUnit.unit,
          },
          type: MoveType.Unit,
        },
      },
    ],
  ])
  expect(dateSpy.mock.calls).toEqual([[]])
  expect(setNextTurnForCurrentRoundSpy.mock.calls).toEqual([
    [
      {
        game,
        logPrefix,
      },
    ],
  ])
  expect(gameStoreSaveSpy.mock.calls).toEqual([[game]])
  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled ? [[`${logPrefix} updatedGame: "${JSON.stringify(updatedGame)}"`]] : []
  )
}
