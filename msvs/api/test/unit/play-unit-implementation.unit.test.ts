import { ObjectId } from 'mongodb'

import CalculateGameEffectiveStrengths from '../../src/graphql/resolvers/mutations/play-unit/calculate-game-effective-strengths'
import { Combat } from '@gwent/graphql-schema/resolver-typings'
import {
  EffectKey,
  GameDbObject,
  GameDeckDbObject,
  ImpactDbObject,
  UnitDbObject,
} from '@gwent/graphql-schema/database-typings'
import GameStore from '../../src/database/stores/game-store'
import * as getRoundUnits from '../../src/graphql/resolvers/mutations/play-unit/get-round-units'
import * as getUnitEffects from '../../src/graphql/resolvers/mutations/play-unit/get-unit-effects'
import { ImpactsByUnitId } from '../../src/graphql/resolvers/resolver-util'
import * as modifyBattlefieldWithNewUnit from '../../src/graphql/resolvers/mutations/play-unit/modify-battlefield-with-new-unit'
import { MusteredOrigins } from '../../src/graphql/resolvers/mutations/play-unit/muster-battlefield'
import PlayUnitImplementation from '../../src/graphql/resolvers/mutations/play-unit/play-unit-implementation'
import * as setGameScores from '../../src/graphql/resolvers/mutations/play-unit/set-game-scores'
import SetNextTurnForCurrentRound from '../../src/graphql/resolvers/mutations/util/set-next-turn-for-current-round'
import TestUtil from '../util/test-util'
import UpdateHistory from '../../src/graphql/resolvers/mutations/play-unit/update-history'

describe('play-unit-implementation', () => {
  const logPrefix = 'log-prefix'
  it('throws error if no turn on game', async () => {
    const game = TestUtil.getDbGame({})
    const message = `No current player for turn on game "${game._id}".`
    await testPlayUnitImplementation({
      game,
      logPrefix,
      error: Error(message),
      getRoundUnitsCalls: [],
      errorCalls: [[`${logPrefix} failed: ${message}`]],
    })
  })
  it('throws error if no updated game from save', async () => {
    const message = 'Could not play unit in probable race condition collision.'
    await testPlayUnitImplementation({
      game: TestUtil.getDbGame({
        turn: new ObjectId(),
      }),
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
  it('passes scorch impacts to move', async () => {
    const player = TestUtil.getDbGamePlayer({
      deck: TestUtil.getDbGameDeck({}),
    })
    const game = TestUtil.getDbGame({
      players: [player],
      turn: player.user,
    })
    const impacts: ImpactDbObject[] = [
      {
        unit: TestUtil.getDbGameUnit({}),
        user: new ObjectId(),
      },
    ]
    await testPlayUnitImplementation({
      game,
      updatedGame: {
        ...game,
        updated: new Date(),
      },
      logPrefix,
      scorches: {
        [impacts[0].unit.unit.toString()]: impacts,
      },
      expectedGameDeck: player.deck,
    })
  })
  it('passes muster impacts to move', async () => {
    const player = TestUtil.getDbGamePlayer({
      deck: TestUtil.getDbGameDeck({}),
    })
    const game = TestUtil.getDbGame({
      players: [player],
      turn: player.user,
    })
    const musteredUnit = TestUtil.getDbUnit({})
    const impacts: ImpactDbObject[] = [
      {
        unit: TestUtil.getDbGameUnit({
          id: musteredUnit._id,
        }),
        user: new ObjectId(),
      },
    ]
    await testPlayUnitImplementation({
      game,
      updatedGame: {
        ...game,
        updated: new Date(),
      },
      logPrefix,
      musteredUnits: [musteredUnit],
      musters: {
        [impacts[0].unit.unit.toString()]: impacts,
      },
      expectedGameDeck: player.deck,
    })
  })
  it('passes bond impacts to move', async () => {
    const player = TestUtil.getDbGamePlayer({
      deck: TestUtil.getDbGameDeck({}),
    })
    const game = TestUtil.getDbGame({
      players: [player],
      turn: player.user,
    })
    const impacts: ImpactDbObject[] = [
      {
        unit: TestUtil.getDbGameUnit({}),
        user: new ObjectId(),
      },
    ]
    await testPlayUnitImplementation({
      game,
      updatedGame: {
        ...game,
        updated: new Date(),
      },
      logPrefix,
      bonds: {
        [impacts[0].unit.unit.toString()]: impacts,
      },
      expectedGameDeck: player.deck,
    })
  })
  it('passes morale impacts to move', async () => {
    const player = TestUtil.getDbGamePlayer({
      deck: TestUtil.getDbGameDeck({}),
    })
    const game = TestUtil.getDbGame({
      players: [player],
      turn: player.user,
    })
    const impacts: ImpactDbObject[] = [
      {
        unit: TestUtil.getDbGameUnit({}),
        user: new ObjectId(),
      },
    ]
    await testPlayUnitImplementation({
      game,
      updatedGame: {
        ...game,
        updated: new Date(),
      },
      logPrefix,
      morales: {
        [impacts[0].unit.unit.toString()]: impacts,
      },
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
  scorches = {},
  musters = {},
  musteredUnits = [],
  musteredOrigins = {},
  bonds = {},
  morales = {},
  error,
  expectedGameDeck,
  getRoundUnitsCalls,
  errorCalls = [],
  traceEnabled,
}: {
  game: GameDbObject
  updatedGame?: GameDbObject
  logPrefix: string
  scorches?: ImpactsByUnitId
  musters?: ImpactsByUnitId
  musteredUnits?: UnitDbObject[]
  musteredOrigins?: MusteredOrigins
  bonds?: ImpactsByUnitId
  morales?: ImpactsByUnitId
  error?: Error
  expectedGameDeck?: GameDeckDbObject
  getRoundUnitsCalls?: any[][]
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
  const unitEffect = TestUtil.getDbEffect({
    key: EffectKey.Muster,
  })
  const musterEffect = TestUtil.getDbEffect({
    key: EffectKey.Bond,
  })
  const getRoundUnitsSpy = jest.spyOn(getRoundUnits, 'default').mockResolvedValue(units)
  const getUnitEffectsSpy = jest
    .spyOn(getUnitEffects, 'default')
    .mockResolvedValueOnce([unitEffect])
    .mockResolvedValueOnce([musterEffect])
  const modifyBattlefieldWithNewUnitSpy = jest.spyOn(modifyBattlefieldWithNewUnit, 'default').mockResolvedValue({
    scorches,
    musters,
    musteredUnits,
    musteredOrigins,
  })
  const calculateEffectiveStrengthsSpy = jest
    .spyOn(CalculateGameEffectiveStrengths, 'calculateEffectiveStrengths')
    .mockReturnValue({
      bonds,
      morales,
    })
  const setGameScoresSpy = jest.spyOn(setGameScores, 'default').mockImplementation()
  const updateHistorySpy = jest.spyOn(UpdateHistory, 'newUnitDeployed').mockImplementation()
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

  expect(getRoundUnitsSpy.mock.calls).toEqual(
    getRoundUnitsCalls || [
      [
        {
          game,
          unitBeingPlayed: unit,
        },
      ],
    ]
  )
  expect(getUnitEffectsSpy.mock.calls).toEqual(
    getRoundUnitsCalls
      ? []
      : [
          [
            {
              units,
            },
          ],
          [
            {
              units: musteredUnits,
              effects: [unitEffect],
            },
          ],
        ]
  )
  expect(modifyBattlefieldWithNewUnitSpy.mock.calls).toEqual(
    getRoundUnitsCalls
      ? []
      : [
          [
            {
              battlefieldUnits: units,
              combat,
              effects: [unitEffect],
              game,
              logPrefix,
              newDeckUnit: deckUnit,
            },
          ],
        ]
  )
  expect(calculateEffectiveStrengthsSpy.mock.calls).toEqual(
    getRoundUnitsCalls
      ? []
      : [
          [
            {
              game,
              units: [unit, ...units, ...musteredUnits],
              effects: [unitEffect, musterEffect],
              logPrefix,
              newDeckUnit: deckUnit,
              musteredUnitIds: musteredUnits.map((unit) => unit._id.toString()),
            },
          ],
        ]
  )
  expect(setGameScoresSpy.mock.calls).toEqual(getRoundUnitsCalls ? [] : [[game]])
  expect(updateHistorySpy.mock.calls).toEqual(
    getRoundUnitsCalls
      ? []
      : [
          [
            {
              combat,
              deckUnit,
              game,
              musters,
              musteredOrigins,
              playerId: game.turn?.toString(),
              logPrefix,
              scorches,
              bonds,
              morales,
            },
          ],
        ]
  )
  expect(setNextTurnForCurrentRoundSpy.mock.calls).toEqual(
    getRoundUnitsCalls
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
  expect(gameStoreSaveSpy.mock.calls).toEqual(getRoundUnitsCalls ? [] : [[game]])
  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled ? [[`${logPrefix} updatedGame: "${JSON.stringify(updatedGame)}"`]] : []
  )
}
