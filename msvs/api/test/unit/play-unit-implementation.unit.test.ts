import { ObjectId } from 'mongodb'

import BattlefieldUpdates from '../../src/graphql/resolvers/mutations/play-unit/battlefield-updates'
import CalculateGameEffectiveStrengths from '../../src/graphql/resolvers/mutations/util/calculate-game-effective-strengths'
import { Combat } from '@gwent/graphql-schema/resolver-typings'
import {
  DeckUnitDbObject,
  EffectDbObject,
  EffectKey,
  FieldUnitDbObject,
  GameDbObject,
  GameDeckDbObject,
  ImpactDbObject,
  UnitDbObject,
} from '@gwent/graphql-schema/database-typings'
import GameStore from '../../src/database/stores/game-store'
import * as getRoundUnits from '../../src/graphql/resolvers/mutations/util/get-round-units'
import * as getUnitEffects from '../../src/graphql/resolvers/mutations/util/get-unit-effects'
import { ImpactsByUnitId } from '../../src/graphql/resolvers/resolver-util'
import { MusteredOrigins } from '../../src/graphql/resolvers/mutations/play-unit/effect-muster'
import PlayUnitImplementation from '../../src/graphql/resolvers/mutations/play-unit/play-unit-implementation'
import * as setGameScores from '../../src/graphql/resolvers/mutations/util/set-game-scores'
import SetNextTurnForCurrentRound from '../../src/graphql/resolvers/mutations/util/set-next-turn-for-current-round'
import TestUtil from '../util/test-util'
import UpdateHistory from '../../src/graphql/resolvers/mutations/util/update-history'

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
  it('returns objects if no error with required only', async () => {
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
  it('returns objects if no error with optional', async () => {
    const player = TestUtil.getDbGamePlayer({
      deck: TestUtil.getDbGameDeck({}),
    })
    const game = TestUtil.getDbGame({
      players: [player],
      turn: player.user,
    })
    await testPlayUnitImplementation({
      effects: [],
      roundUnits: [],
      game,
      updatedGame: {
        ...game,
        updated: new Date(),
      },
      logPrefix,
      expectedGameDeck: player.deck,
    })
  })
  it('passes avenger impacts to move', async () => {
    const player = TestUtil.getDbGamePlayer({
      deck: TestUtil.getDbGameDeck({}),
    })
    const game = TestUtil.getDbGame({
      players: [player],
      turn: player.user,
    })
    const fieldUnit = TestUtil.getDbFieldUnit({})
    const impacts: ImpactDbObject[] = [
      {
        unit: TestUtil.convertFieldDbUnitToGameDbUnit(fieldUnit),
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
      avengers: {
        [fieldUnit.unit.toString()]: impacts,
      },
      avengedUnits: [
        TestUtil.getDbUnit({
          id: fieldUnit.unit,
        }),
      ],
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
    const fieldUnit = TestUtil.getDbFieldUnit({})
    const impacts: ImpactDbObject[] = [
      {
        unit: TestUtil.convertFieldDbUnitToGameDbUnit(fieldUnit),
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
        [fieldUnit.unit.toString()]: impacts,
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
    const fieldUnit = TestUtil.getDbFieldUnit({
      id: musteredUnit._id,
    })
    const impacts: ImpactDbObject[] = [
      {
        unit: TestUtil.convertFieldDbUnitToGameDbUnit(fieldUnit),
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
        [fieldUnit.unit.toString()]: impacts,
      },
      expectedGameDeck: player.deck,
    })
  })
  it('passes mardroeme impacts to move', async () => {
    const player = TestUtil.getDbGamePlayer({
      deck: TestUtil.getDbGameDeck({}),
    })
    const game = TestUtil.getDbGame({
      players: [player],
      turn: player.user,
    })
    const mardroemeUnit = TestUtil.getDbUnit({})
    const fieldUnit = TestUtil.getDbFieldUnit({
      id: mardroemeUnit._id,
    })
    const impacts: ImpactDbObject[] = [
      {
        unit: TestUtil.convertFieldDbUnitToGameDbUnit(fieldUnit),
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
      transformedUnits: [mardroemeUnit],
      transformedFieldUnits: [fieldUnit],
      mardroemingFieldUnit: TestUtil.getDbFieldUnit({
        id: mardroemeUnit._id,
      }),
      mardroemes: {
        [fieldUnit.unit.toString()]: impacts,
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
    const fieldUnit = TestUtil.getDbFieldUnit({})
    const impacts: ImpactDbObject[] = [
      {
        unit: TestUtil.convertFieldDbUnitToGameDbUnit(fieldUnit),
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
        [fieldUnit.unit.toString()]: impacts,
      },
      expectedGameDeck: player.deck,
    })
  })
  it('passes horn impacts to move', async () => {
    const player = TestUtil.getDbGamePlayer({
      deck: TestUtil.getDbGameDeck({}),
    })
    const game = TestUtil.getDbGame({
      players: [player],
      turn: player.user,
    })
    const fieldUnit = TestUtil.getDbFieldUnit({})
    const impacts: ImpactDbObject[] = [
      {
        unit: TestUtil.convertFieldDbUnitToGameDbUnit(fieldUnit),
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
      horns: {
        [fieldUnit.unit.toString()]: impacts,
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
    const fieldUnit = TestUtil.getDbFieldUnit({})
    const impacts: ImpactDbObject[] = [
      {
        unit: TestUtil.convertFieldDbUnitToGameDbUnit(fieldUnit),
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
        [fieldUnit.unit.toString()]: impacts,
      },
      expectedGameDeck: player.deck,
    })
  })
  it('passes decoy impacts to move', async () => {
    const player = TestUtil.getDbGamePlayer({
      deck: TestUtil.getDbGameDeck({}),
    })
    const game = TestUtil.getDbGame({
      players: [player],
      turn: player.user,
    })
    const fieldUnit = TestUtil.getDbFieldUnit({})
    const impacts: ImpactDbObject[] = [
      {
        unit: TestUtil.convertFieldDbUnitToGameDbUnit(fieldUnit),
        user: new ObjectId(),
      },
    ]
    await testPlayUnitImplementation({
      game,
      updatedGame: {
        ...game,
        updated: new Date(),
      },
      targetId: fieldUnit.unit.toString(),
      logPrefix,
      decoys: {
        [fieldUnit.unit.toString()]: impacts,
      },
      deckUnitsAddedToHand: [fieldUnit],
      expectedGameDeck: player.deck,
      isDecoy: true,
    })
  })
  it('passes spy impacts to move', async () => {
    const player = TestUtil.getDbGamePlayer({
      deck: TestUtil.getDbGameDeck({}),
    })
    const game = TestUtil.getDbGame({
      players: [player],
      turn: player.user,
    })
    const fieldUnit = TestUtil.getDbFieldUnit({})
    const impacts: ImpactDbObject[] = [
      {
        unit: TestUtil.convertFieldDbUnitToGameDbUnit(fieldUnit),
        user: new ObjectId(),
      },
    ]
    await testPlayUnitImplementation({
      game,
      updatedGame: {
        ...game,
        updated: new Date(),
      },
      targetId: fieldUnit.unit.toString(),
      logPrefix,
      spies: {
        [fieldUnit.unit.toString()]: impacts,
      },
      deckUnitsAddedToHand: [fieldUnit],
      expectedGameDeck: player.deck,
      isSpy: true,
    })
  })
  it('passes weather battlefield impacts to move', async () => {
    const player = TestUtil.getDbGamePlayer({
      deck: TestUtil.getDbGameDeck({}),
    })
    const game = TestUtil.getDbGame({
      players: [player],
      turn: player.user,
    })
    const fieldUnit = TestUtil.getDbFieldUnit({})
    const impacts: ImpactDbObject[] = [
      {
        unit: TestUtil.convertFieldDbUnitToGameDbUnit(fieldUnit),
        user: new ObjectId(),
      },
    ]
    await testPlayUnitImplementation({
      game,
      updatedGame: {
        ...game,
        updated: new Date(),
      },
      targetId: fieldUnit.unit.toString(),
      logPrefix,
      battlefieldWeathers: {
        [fieldUnit.unit.toString()]: impacts,
      },
      deckUnitsAddedToHand: [fieldUnit],
      expectedGameDeck: player.deck,
    })
  })
  it('passes weather score impacts to move', async () => {
    const player = TestUtil.getDbGamePlayer({
      deck: TestUtil.getDbGameDeck({}),
    })
    const game = TestUtil.getDbGame({
      players: [player],
      turn: player.user,
    })
    const fieldUnit = TestUtil.getDbFieldUnit({})
    const impacts: ImpactDbObject[] = [
      {
        unit: TestUtil.convertFieldDbUnitToGameDbUnit(fieldUnit),
        user: new ObjectId(),
      },
    ]
    await testPlayUnitImplementation({
      game,
      updatedGame: {
        ...game,
        updated: new Date(),
      },
      targetId: fieldUnit.unit.toString(),
      logPrefix,
      scoreWeathers: {
        [fieldUnit.unit.toString()]: impacts,
      },
      deckUnitsAddedToHand: [fieldUnit],
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
  effects,
  roundUnits,
  logPrefix,
  isDecoy = false,
  isSpy = false,
  isWeather = false,
  avengers = {},
  avengedUnits = [],
  scorches = {},
  musters = {},
  musteredUnits = [],
  musteredOrigins = {},
  mardroemes = {},
  battlefieldWeathers = {},
  scoreWeathers = {},
  transformedUnits = [],
  transformedFieldUnits = [],
  mardroemingFieldUnit,
  bonds = {},
  horns = {},
  morales = {},
  decoys = {},
  spies = {},
  deckUnitsAddedToHand = [],
  targetId,
  error,
  expectedGameDeck,
  getRoundUnitsCalls,
  errorCalls = [],
  traceEnabled,
}: {
  game: GameDbObject
  updatedGame?: GameDbObject
  effects?: EffectDbObject[]
  roundUnits?: UnitDbObject[]
  logPrefix: string
  isDecoy?: boolean
  isSpy?: boolean
  isWeather?: boolean
  avengers?: ImpactsByUnitId
  avengedUnits?: UnitDbObject[]
  scorches?: ImpactsByUnitId
  musters?: ImpactsByUnitId
  musteredUnits?: UnitDbObject[]
  musteredOrigins?: MusteredOrigins
  mardroemes?: ImpactsByUnitId
  battlefieldWeathers?: ImpactsByUnitId
  scoreWeathers?: ImpactsByUnitId
  transformedUnits?: UnitDbObject[]
  transformedFieldUnits?: FieldUnitDbObject[]
  mardroemingFieldUnit?: FieldUnitDbObject
  bonds?: ImpactsByUnitId
  horns?: ImpactsByUnitId
  morales?: ImpactsByUnitId
  decoys?: ImpactsByUnitId
  spies?: ImpactsByUnitId
  deckUnitsAddedToHand?: DeckUnitDbObject[]
  targetId?: string
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
    key: EffectKey.Bond,
  })
  const musterEffect = TestUtil.getDbEffect({
    key: EffectKey.Muster,
  })
  const mardroemeEffect = TestUtil.getDbEffect({
    key: EffectKey.Mardroeme,
  })
  const getRoundUnitsSpy = jest.spyOn(getRoundUnits, 'default').mockResolvedValue(units)
  const getUnitEffectsSpy = jest
    .spyOn(getUnitEffects, 'default')
    .mockResolvedValueOnce([unitEffect])
    .mockResolvedValueOnce([musterEffect])
    .mockResolvedValueOnce([mardroemeEffect])
  const modifyBattlefieldWithNewUnitSpy = jest
    .spyOn(BattlefieldUpdates, 'modifyBattlefieldWithNewUnit')
    .mockResolvedValue({
      avengers,
      avengedUnits,
      scorches,
      musters,
      musteredUnits,
      musteredOrigins,
      mardroemes,
      weathers: battlefieldWeathers,
      transformedUnits,
      transformedFieldUnits,
      mardroemingFieldUnit,
      decoys,
      deckUnitsAddedToHand,
      spies,
    })
  const calculateEffectiveStrengthsSpy = jest
    .spyOn(CalculateGameEffectiveStrengths, 'calculateEffectiveStrengths')
    .mockReturnValue({
      bonds,
      horns,
      morales,
      weathers: scoreWeathers,
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
    effects,
    roundUnits,
    targetId,
    isDecoy,
    isSpy,
    isWeather,
    userId: new ObjectId(),
  })
  if (error) {
    await expect(promise).rejects.toThrow(error)
  } else {
    await expect(promise).resolves.toEqual({
      game: updatedGame,
      gameDeck: expectedGameDeck,
      handDeckUnitsAdded: deckUnitsAddedToHand,
    })
  }

  expect(getRoundUnitsSpy.mock.calls).toEqual(
    getRoundUnitsCalls || [
      [
        {
          game,
          unitBeingPlayed: unit,
          units: roundUnits || [],
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
              effects: effects || [],
              units: [unit, ...(roundUnits || []), ...units],
            },
          ],
          [
            {
              units: musteredUnits,
              effects: [...(effects || []), unitEffect],
            },
          ],
          [
            {
              units: transformedUnits,
              effects: [...(effects || []), unitEffect],
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
              battlefieldUnits: [unit, ...(roundUnits || []), ...units],
              combat,
              effects: [...(effects || []), unitEffect],
              game,
              logPrefix,
              newDeckUnit: deckUnit,
              newUnit: unit,
              targetId,
              isDecoy,
              isSpy,
              isWeather,
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
              units: [unit, ...units, ...musteredUnits, ...transformedUnits, ...avengedUnits],
              effects: [...(effects || []), unitEffect, musterEffect, mardroemeEffect],
              logPrefix,
              newDeckUnit: deckUnit,
              musteredUnitIds: musteredUnits.map((unit) => unit._id.toString()),
              transformedUnitIds: transformedUnits.map((unit) => unit._id.toString()),
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
              avengers,
              scorches,
              bonds,
              horns,
              morales,
              mardroemes,
              decoys,
              spies,
              targetId: isSpy ? targetId : undefined,
              transformedFieldUnits,
              mardroemingFieldUnit,
              weathers: Object.keys(battlefieldWeathers).length > 0 ? battlefieldWeathers : scoreWeathers,
              isWeather,
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
