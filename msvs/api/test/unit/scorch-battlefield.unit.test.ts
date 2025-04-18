import {
  Combat,
  DeckUnitDbObject,
  EffectDbObject,
  EffectKey,
  GameDbObject,
  GameUnitDbObject,
  PlayerCombatRowDbObject,
  UnitDbObject,
} from '@gwent/graphql-schema/database-typings'
import * as getEffectWithKey from '../../src/graphql/resolvers/mutations/play-unit/get-effect-with-key'
import * as getGameUnits from '../../src/graphql/resolvers/mutations/play-unit/get-game-units'
import * as getStrongestNonHeroUnits from '../../src/graphql/resolvers/mutations/play-unit/get-strongest-non-hero-units'
import ScorchBattelfield from '../../src/graphql/resolvers/mutations/play-unit/scorch-battlefield'
import TestUtil from '../util/test-util'

describe('scorch-battlefield', () => {
  describe('scorchBattlefield', () => {
    const logPrefix = 'log-prefix'
    const self = TestUtil.getDbGamePlayer({
      rounds: [TestUtil.getDbPlayerRound({})],
    })
    it('throws error if newDeckUnit not in battlefieldUnits', () => {
      const scorchEffect = TestUtil.getDbEffect({
        key: EffectKey.Scorch,
      })
      const unit = TestUtil.getDbUnit({})
      const game = TestUtil.getDbGame({
        players: [self, TestUtil.getDbGamePlayer({})],
        turn: self.user,
        round: 1,
      })
      const message = `Could not find unit for new deck unit "${unit._id}".`

      testScorchBattlefield({
        logPrefix,
        battlefieldUnits: [
          TestUtil.getDbUnit({
            effects: [scorchEffect._id],
          }),
        ],
        newDeckUnit: TestUtil.getDbDeckUnit({
          id: unit._id,
        }),
        scorchEffect,
        game,
        error: Error(message),
        errorCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('does not call to scorchUnitsForPlayers if newDeckUnit does not have scorch effect', () => {
      const scorchEffect = TestUtil.getDbEffect({
        key: EffectKey.Scorch,
      })
      const unit = TestUtil.getDbUnit({})
      const game = TestUtil.getDbGame({
        players: [self, TestUtil.getDbGamePlayer({})],
        turn: self.user,
        round: 1,
      })

      testScorchBattlefield({
        logPrefix,
        battlefieldUnits: [
          unit,
          TestUtil.getDbUnit({
            effects: [scorchEffect._id],
          }),
        ],
        newDeckUnit: TestUtil.getDbDeckUnit({
          id: unit._id,
        }),
        scorchEffect,
        game,
      })
    })
    it('calls to scorchUnitsForPlayers if newDeckUnit has scorch effect with no scorchScope and first player', () => {
      const scorchEffect = TestUtil.getDbEffect({
        key: EffectKey.Scorch,
      })
      const unit = TestUtil.getDbUnit({
        effects: [scorchEffect._id],
      })
      const game = TestUtil.getDbGame({
        players: [self, TestUtil.getDbGamePlayer({})],
        turn: self.user,
        round: 1,
      })

      testScorchBattlefield({
        logPrefix,
        battlefieldUnits: [unit],
        newDeckUnit: TestUtil.getDbDeckUnit({
          id: unit._id,
        }),
        scorchEffect,
        game,
        getGameUnitsCalls: [
          [
            {
              combat: undefined,
              players: game.players,
              round: game.round,
            },
          ],
        ],
      })
    })
    it('calls to scorchUnitsForPlayers if newDeckUnit has scorch effect with no scorchScope and second player', () => {
      const scorchEffect = TestUtil.getDbEffect({
        key: EffectKey.Scorch,
      })
      const unit = TestUtil.getDbUnit({
        effects: [scorchEffect._id],
      })
      const game = TestUtil.getDbGame({
        players: [TestUtil.getDbGamePlayer({}), self],
        turn: self.user,
        round: 1,
      })

      testScorchBattlefield({
        logPrefix,
        battlefieldUnits: [unit],
        newDeckUnit: TestUtil.getDbDeckUnit({
          id: unit._id,
        }),
        scorchEffect,
        game,
        getGameUnitsCalls: [
          [
            {
              combat: undefined,
              players: game.players,
              round: game.round,
            },
          ],
        ],
      })
    })
    it('calls to scorchUnitsForPlayers if newDeckUnit has scorch effect with scorchScope and first player', () => {
      const scorchEffect = TestUtil.getDbEffect({
        key: EffectKey.Scorch,
      })
      const unit = TestUtil.getDbUnit({
        effects: [scorchEffect._id],
        scorchScope: Combat.Close,
      })
      const game = TestUtil.getDbGame({
        players: [self, TestUtil.getDbGamePlayer({})],
        turn: self.user,
        round: 1,
      })

      testScorchBattlefield({
        logPrefix,
        battlefieldUnits: [unit],
        newDeckUnit: TestUtil.getDbDeckUnit({
          id: unit._id,
        }),
        scorchEffect,
        game,
        getGameUnitsCalls: [
          [
            {
              combat: Combat.Close,
              players: [game.players[1]],
              round: game.round,
            },
          ],
        ],
      })
    })
    it('calls to scorchUnitsForPlayers if newDeckUnit has scorch effect with scorchScope and first player', () => {
      const scorchEffect = TestUtil.getDbEffect({
        key: EffectKey.Scorch,
      })
      const unit = TestUtil.getDbUnit({
        effects: [scorchEffect._id],
        scorchScope: Combat.Close,
      })
      const game = TestUtil.getDbGame({
        players: [TestUtil.getDbGamePlayer({}), self],
        turn: self.user,
        round: 1,
      })

      testScorchBattlefield({
        logPrefix,
        battlefieldUnits: [unit],
        newDeckUnit: TestUtil.getDbDeckUnit({
          id: unit._id,
        }),
        scorchEffect,
        game,
        getGameUnitsCalls: [
          [
            {
              combat: Combat.Close,
              players: [game.players[0]],
              round: game.round,
            },
          ],
        ],
      })
    })
    it('logs to trace if enabled', () => {
      const scorchEffect = TestUtil.getDbEffect({
        key: EffectKey.Scorch,
      })
      const unit = TestUtil.getDbUnit({
        effects: [scorchEffect._id],
      })
      const game = TestUtil.getDbGame({
        players: [self, TestUtil.getDbGamePlayer({})],
        turn: self.user,
        round: 1,
      })

      testScorchBattlefield({
        logPrefix,
        battlefieldUnits: [unit],
        newDeckUnit: TestUtil.getDbDeckUnit({
          id: unit._id,
        }),
        scorchEffect,
        game,
        getGameUnitsCalls: [
          [
            {
              combat: undefined,
              players: game.players,
              round: game.round,
            },
          ],
        ],
        traceEnabled: true,
      })
    })
  })
  describe('scorchUnitsInRow', () => {
    const unit1 = TestUtil.getDbGameUnit({})
    const unit2 = TestUtil.getDbGameUnit({})
    const unit3 = TestUtil.getDbGameUnit({})
    describe('empty strongestUnitIds', () => {
      it('does nothing if no units in row', () => {
        testScorchUnitsInRow({
          units: [],
          strongestUnitIds: [],
          left: [],
          scorched: [],
        })
      })
      it('does not remove single unit if not in strongestUnitIds', () => {
        testScorchUnitsInRow({
          units: [unit1],
          strongestUnitIds: [],
          left: [unit1],
          scorched: [],
        })
      })
      it('does not remove multiple units if none in strongestUnitIds', () => {
        testScorchUnitsInRow({
          units: [unit1, unit2, unit3],
          strongestUnitIds: [],
          left: [unit1, unit2, unit3],
          scorched: [],
        })
      })
    })
    describe('single strongestUnitIds', () => {
      it('does nothing if no units in row', () => {
        testScorchUnitsInRow({
          units: [],
          strongestUnitIds: [unit1.unit.toString()],
          left: [],
          scorched: [],
        })
      })
      it('does not remove single unit if not in strongestUnitIds', () => {
        testScorchUnitsInRow({
          units: [unit1],
          strongestUnitIds: [unit2.unit.toString()],
          left: [unit1],
          scorched: [],
        })
      })
      it('does not remove multiple units if none in strongestUnitIds', () => {
        testScorchUnitsInRow({
          units: [unit1, unit2],
          strongestUnitIds: [unit3.unit.toString()],
          left: [unit1, unit2],
          scorched: [],
        })
      })
      it('removes single unit if in strongestUnitIds', () => {
        testScorchUnitsInRow({
          units: [unit1],
          strongestUnitIds: [unit1.unit.toString()],
          left: [],
          scorched: [unit1],
        })
      })
      it('remove first unit if first in strongestUnitIds', () => {
        testScorchUnitsInRow({
          units: [unit1, unit2, unit3],
          strongestUnitIds: [unit1.unit.toString()],
          left: [unit2, unit3],
          scorched: [unit1],
        })
      })
      it('remove middle unit if middle in strongestUnitIds', () => {
        testScorchUnitsInRow({
          units: [unit1, unit2, unit3],
          strongestUnitIds: [unit2.unit.toString()],
          left: [unit1, unit3],
          scorched: [unit2],
        })
      })
      it('remove last unit if last in strongestUnitIds', () => {
        testScorchUnitsInRow({
          units: [unit1, unit2, unit3],
          strongestUnitIds: [unit3.unit.toString()],
          left: [unit1, unit2],
          scorched: [unit3],
        })
      })
      it('removes first two unit if first two in strongestUnitIds', () => {
        testScorchUnitsInRow({
          units: [unit1, unit2, unit3],
          strongestUnitIds: [unit1.unit.toString(), unit2.unit.toString()],
          left: [unit3],
          scorched: [unit1, unit2],
        })
      })
      it('removes last two unit if last two in strongestUnitIds', () => {
        testScorchUnitsInRow({
          units: [unit1, unit2, unit3],
          strongestUnitIds: [unit2.unit.toString(), unit3.unit.toString()],
          left: [unit1],
          scorched: [unit2, unit3],
        })
      })
      it('removes all units if all in strongestUnitIds', () => {
        testScorchUnitsInRow({
          units: [unit1, unit2, unit3],
          strongestUnitIds: [unit1.unit.toString(), unit2.unit.toString(), unit3.unit.toString()],
          left: [],
          scorched: [unit1, unit2, unit3],
        })
      })
    })
  })
})

function testScorchBattlefield({
  logPrefix,
  battlefieldUnits,
  scorchEffect,
  game,
  newDeckUnit,
  error,
  getGameUnitsCalls = [],
  errorCalls = [],
  traceEnabled,
}: {
  logPrefix: string
  battlefieldUnits: UnitDbObject[]
  scorchEffect: EffectDbObject | undefined
  game: GameDbObject
  newDeckUnit: DeckUnitDbObject
  error?: Error
  getGameUnitsCalls?: any[][]
  errorCalls?: string[][]
  traceEnabled?: boolean
}) {
  const newUnit = battlefieldUnits.find((unit) => unit._id.toString() === newDeckUnit.unit.toString())
  const effects = [TestUtil.getDbEffect({}), TestUtil.getDbEffect({})]
  const gameUnits = [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})]
  const strongestGameUnits = [gameUnits[1]]
  const getEffectWithKeySpy = jest.spyOn(getEffectWithKey, 'default').mockReturnValue(scorchEffect)
  const getGameUnitsSpy = jest.spyOn(getGameUnits, 'default').mockReturnValue(gameUnits)
  const getStrongestNonHeroUnitsSpy = jest.spyOn(getStrongestNonHeroUnits, 'default')
  if (getGameUnitsCalls.length > 0) {
    getStrongestNonHeroUnitsSpy.mockReturnValue(strongestGameUnits)
  }
  const scorchUnitsForPlayersSpy = jest.spyOn(ScorchBattelfield as any, 'scorchUnitsForPlayers').mockImplementation()
  const errorSpy = jest.fn().mockImplementation()
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  ScorchBattelfield['logger'] = {
    error: errorSpy,
    debug: debugSpy,
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  if (error instanceof Error) {
    expect(() =>
      ScorchBattelfield.scorchBattlefield({
        battlefieldUnits,
        effects,
        logPrefix,
        game,
        newDeckUnit,
      })
    ).toThrow(error)
  } else {
    expect(
      ScorchBattelfield.scorchBattlefield({
        battlefieldUnits,
        effects,
        logPrefix,
        game,
        newDeckUnit,
      })
    ).toEqual(undefined)
  }

  expect(getEffectWithKeySpy.mock.calls).toEqual(
    error
      ? []
      : [
          [
            {
              effectKey: EffectKey.Scorch,
              effects,
            },
          ],
        ]
  )
  expect(getGameUnitsSpy.mock.calls).toEqual(getGameUnitsCalls)
  expect(getStrongestNonHeroUnitsSpy.mock.calls).toEqual(
    getGameUnitsCalls.length > 0
      ? [
          [
            {
              gameUnits,
              units: battlefieldUnits,
              minimumStrength: newUnit?.scorchMin,
            },
          ],
        ]
      : []
  )
  expect(scorchUnitsForPlayersSpy.mock.calls).toEqual(
    getGameUnitsCalls.length > 0
      ? [
          [
            {
              game,
              logPrefix,
              scorchingDeckUnit: newDeckUnit,
              scorchingUnit: newUnit,
              strongestUnitIds: strongestGameUnits.map((gameUnit) => gameUnit.unit.toString()),
            },
          ],
        ]
      : []
  )
  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(debugSpy.mock.calls).toEqual(
    getGameUnitsCalls.length > 0 ? [[`${logPrefix} unit "${newUnit?.name}" has scorch effect, applying it`]] : []
  )
  const traceCalls: string[][] = []
  if (traceEnabled) {
    traceCalls.push(
      ...[
        [`${logPrefix} newUnit: "${JSON.stringify(newUnit)}"`],
        [`${logPrefix} scorchEffect: "${JSON.stringify(scorchEffect)}"`],
        [`${logPrefix} hasScorchEffect: "${getGameUnitsCalls.length > 0}"`],
      ]
    )
    if (getGameUnitsCalls.length > 0) {
      traceCalls.push(
        ...[
          [`${logPrefix} gameUnits: "${JSON.stringify(gameUnits)}"`],
          [`${logPrefix} strongestGameUnits: "${JSON.stringify(strongestGameUnits)}"`],
          [
            `${logPrefix} strongestUnitIds: "${JSON.stringify(
              strongestGameUnits.map((gameUnit) => gameUnit.unit.toString())
            )}"`,
          ],
        ]
      )
    }
  }
  expect(traceSpy.mock.calls).toEqual(traceCalls)
}

function testScorchUnitsInRow({
  units,
  strongestUnitIds,
  scorched,
  left,
}: {
  units: GameUnitDbObject[]
  strongestUnitIds: string[]
  scorched: GameUnitDbObject[]
  left: GameUnitDbObject[]
}) {
  const row: PlayerCombatRowDbObject = {
    score: 0,
    units,
  }

  expect(
    ScorchBattelfield['scorchUnitsInRow']({
      row: {
        score: 0,
        units,
      },
      strongestUnitIds,
    })
  ).toEqual(scorched)

  expect(row).toEqual({
    score: 0,
    units: left,
  })
}
