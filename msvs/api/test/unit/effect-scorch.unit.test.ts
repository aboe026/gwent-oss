import { ObjectId } from 'mongodb'

import {
  Combat,
  DeckUnitDbObject,
  EffectDbObject,
  EffectKey,
  FieldUnitDbObject,
  GameDbObject,
  GamePlayerDbObject,
  ImpactDbObject,
  PlayerCombatRowDbObject,
  PlayerRoundDbObject,
  UnitDbObject,
} from '@gwent/graphql-schema/database-typings'
import deepClone from '../util/deep-clone'
import GetEffectWithKey from '../../src/graphql/resolvers/mutations/play-unit/get-effect-with-key'
import GetFieldUnits from '../../src/graphql/resolvers/util/get-field-units'
import GetStrongestNonHeroUnitIds from '../../src/graphql/resolvers/mutations/play-unit/get-strongest-non-hero-unit-ids'
import ScorchBattelfield from '../../src/graphql/resolvers/mutations/play-unit/effect-scorch'
import TestUtil from '../util/test-util'

describe('effect-scorch', () => {
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
    it('does not call to scorchPlayer if newDeckUnit does not have scorch effect', () => {
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
    it('calls to scorchPlayer if newDeckUnit has scorch effect with no scorchScope and first player', () => {
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
        getFieldUnitsCalls: [
          [
            {
              rounds: game.players.map((player) => player.rounds[game.round - 1]),
            },
          ],
        ],
      })
    })
    it('calls to scorchPlayer if newDeckUnit has scorch effect with no scorchScope and second player', () => {
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
        getFieldUnitsCalls: [
          [
            {
              rounds: game.players.map((player) => player.rounds[game.round - 1]),
            },
          ],
        ],
      })
    })
    it('calls to scorchPlayer if newDeckUnit has scorch effect with scorchScope and first player', () => {
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
        getFieldUnitsCalls: [
          [
            {
              combat: Combat.Close,
              rounds: [game.players[1].rounds[game.round - 1]],
            },
          ],
        ],
      })
    })
    it('calls to scorchPlayer if newDeckUnit has scorch effect with scorchScope and second player', () => {
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
        getFieldUnitsCalls: [
          [
            {
              combat: Combat.Close,
              rounds: [game.players[0].rounds[game.round - 1]],
            },
          ],
        ],
      })
    })
    it('returns single scorch from single player', () => {
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
        scorchPlayerResponses: [
          [
            {
              unit: TestUtil.getDbGameUnit({}),
              user: self.user,
            },
          ],
          [],
        ],
        getFieldUnitsCalls: [
          [
            {
              combat: Combat.Close,
              rounds: [game.players[1].rounds[game.round - 1]],
            },
          ],
        ],
      })
    })
    it('returns multiple scorchs from single player', () => {
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
        scorchPlayerResponses: [
          [
            {
              unit: TestUtil.getDbGameUnit({}),
              user: self.user,
            },
            {
              unit: TestUtil.getDbGameUnit({}),
              user: self.user,
            },
          ],
          [],
        ],
        getFieldUnitsCalls: [
          [
            {
              combat: Combat.Close,
              rounds: [game.players[1].rounds[game.round - 1]],
            },
          ],
        ],
      })
    })
    it('returns single scorch from multiple players', () => {
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
        scorchPlayerResponses: [
          [
            {
              unit: TestUtil.getDbGameUnit({}),
              user: self.user,
            },
          ],
          [
            {
              unit: TestUtil.getDbGameUnit({}),
              user: self.user,
            },
          ],
        ],
        getFieldUnitsCalls: [
          [
            {
              combat: Combat.Close,
              rounds: [game.players[1].rounds[game.round - 1]],
            },
          ],
        ],
      })
    })
    it('returns multiple scorches from multiple players', () => {
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
        scorchPlayerResponses: [
          [
            {
              unit: TestUtil.getDbGameUnit({}),
              user: self.user,
            },
            {
              unit: TestUtil.getDbGameUnit({}),
              user: self.user,
            },
          ],
          [
            {
              unit: TestUtil.getDbGameUnit({}),
              user: self.user,
            },
            {
              unit: TestUtil.getDbGameUnit({}),
              user: self.user,
            },
          ],
        ],
        getFieldUnitsCalls: [
          [
            {
              combat: Combat.Close,
              rounds: [game.players[1].rounds[game.round - 1]],
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
        getFieldUnitsCalls: [
          [
            {
              rounds: game.players.map((player) => player.rounds[game.round - 1]),
            },
          ],
        ],
        traceEnabled: true,
      })
    })
  })
  describe('scorchPlayer', () => {
    const logPrefix = 'log-prefix'
    describe('scorchingUnit', () => {
      it('does not move scorchingDeckUnit to discard if name is Scorch and not turn', () => {
        const player = TestUtil.getDbGamePlayer({
          rounds: [TestUtil.getDbPlayerRound({})],
        })
        const scorchingUnit = TestUtil.getDbUnit({
          name: 'Scorch',
        })
        const scorchingDeckUnit = TestUtil.getDbDeckUnit({
          id: scorchingUnit._id,
        })
        testScorchPlayer({
          logPrefix,
          player,
          scorchingDeckUnit,
          scorchingUnit,
          turn: new ObjectId(),
          callScorchUnitsForPlayer: true,
        })
      })
      it('does not move scorchingDeckUnit to discard if name is not Scorch and turn', () => {
        const player = TestUtil.getDbGamePlayer({
          rounds: [TestUtil.getDbPlayerRound({})],
        })
        const scorchingUnit = TestUtil.getDbUnit({})
        const scorchingDeckUnit = TestUtil.getDbDeckUnit({
          id: scorchingUnit._id,
        })
        testScorchPlayer({
          logPrefix,
          player,
          scorchingDeckUnit,
          scorchingUnit,
          turn: player.user,
          callScorchUnitsForPlayer: true,
        })
      })
      it('moves scorchingDeckUnit to discard if name is Scorch and turn', () => {
        const player = TestUtil.getDbGamePlayer({
          rounds: [TestUtil.getDbPlayerRound({})],
        })
        const scorchingUnit = TestUtil.getDbUnit({
          name: 'Scorch',
        })
        const scorchingDeckUnit = TestUtil.getDbDeckUnit({
          id: scorchingUnit._id,
        })
        const origPlayer = deepClone(player)
        testScorchPlayer({
          logPrefix,
          player,
          scorchingDeckUnit,
          scorchingUnit,
          turn: player.user,
          callScorchUnitsForPlayer: true,
          changedPlayer: {
            ...origPlayer,
            deck: {
              ...origPlayer.deck,
              discard: [scorchingDeckUnit],
            },
          },
        })
      })
    })
    describe('scorchablePlayer', () => {
      it('calls to scorchUnitsForPlayer if scorchingUnit has no scorchScope and turn', () => {
        const player = TestUtil.getDbGamePlayer({
          rounds: [TestUtil.getDbPlayerRound({})],
        })
        const scorchingUnit = TestUtil.getDbUnit({})
        const scorchingDeckUnit = TestUtil.getDbDeckUnit({
          id: scorchingUnit._id,
        })
        testScorchPlayer({
          logPrefix,
          player,
          scorchingDeckUnit,
          scorchingUnit,
          turn: player.user,
          impacts: [
            {
              unit: TestUtil.getDbGameUnit({}),
              user: new ObjectId(),
            },
          ],
          callScorchUnitsForPlayer: true,
        })
      })
      it('calls to scorchUnitsForPlayer if scorchingUnit has no scorchScope and not turn', () => {
        const player = TestUtil.getDbGamePlayer({
          rounds: [TestUtil.getDbPlayerRound({})],
        })
        const scorchingUnit = TestUtil.getDbUnit({})
        const scorchingDeckUnit = TestUtil.getDbDeckUnit({
          id: scorchingUnit._id,
        })
        testScorchPlayer({
          logPrefix,
          player,
          scorchingDeckUnit,
          scorchingUnit,
          turn: new ObjectId(),
          impacts: [
            {
              unit: TestUtil.getDbGameUnit({}),
              user: new ObjectId(),
            },
          ],
          callScorchUnitsForPlayer: true,
        })
      })
      it('calls to scorchUnitsForPlayer if scorchingUnit has scorchScope and not turn', () => {
        const player = TestUtil.getDbGamePlayer({
          rounds: [TestUtil.getDbPlayerRound({})],
        })
        const scorchingUnit = TestUtil.getDbUnit({
          scorchScope: Combat.Close,
        })
        const scorchingDeckUnit = TestUtil.getDbDeckUnit({
          id: scorchingUnit._id,
        })
        testScorchPlayer({
          logPrefix,
          player,
          scorchingDeckUnit,
          scorchingUnit,
          turn: new ObjectId(),
          impacts: [
            {
              unit: TestUtil.getDbGameUnit({}),
              user: new ObjectId(),
            },
          ],
          callScorchUnitsForPlayer: true,
        })
      })
      it('does not call to scorchUnitsForPlayer if scorchingUnit has scorchScope and turn', () => {
        const player = TestUtil.getDbGamePlayer({
          rounds: [TestUtil.getDbPlayerRound({})],
        })
        const scorchingUnit = TestUtil.getDbUnit({
          scorchScope: Combat.Close,
        })
        const scorchingDeckUnit = TestUtil.getDbDeckUnit({
          id: scorchingUnit._id,
        })
        testScorchPlayer({
          logPrefix,
          player,
          scorchingDeckUnit,
          scorchingUnit,
          turn: player.user,
          callScorchUnitsForPlayer: false,
        })
      })
    })
  })
  describe('scorchUnitsForPlayer', () => {
    const logPrefix = 'log-prefix'
    it('does not move anything to discard if getRowsToScorch is empty', () => {
      const scorchedUnit = TestUtil.getDbDeckUnit({})
      const player = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              units: [
                TestUtil.getDbFieldUnit({
                  artStyle: scorchedUnit.artStyle,
                  id: scorchedUnit.unit,
                  row: Combat.Close,
                }),
              ],
            }),
          }),
        ],
      })
      const scorchingUnit = TestUtil.getDbUnit({})

      testScorchUnitsForPlayer({
        player,
        round: 1,
        logPrefix,
        rowsToScorch: [],
        scorchingUnit,
        expected: [],
      })
    })
    it('does not move anything to discard if scorchUnitsInRow is empty', () => {
      const player = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
            ranged: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
            siege: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
          }),
        ],
      })
      const scorchingUnit = TestUtil.getDbUnit({})

      testScorchUnitsForPlayer({
        player,
        round: 1,
        logPrefix,
        rowsToScorch: [player.rounds[0].close, player.rounds[0].ranged, player.rounds[0].siege],
        scorchingUnit,
        expected: [],
      })
    })
    it('uses scoped strongest unit ids if scorchingUnit has scorchScope', () => {
      const player = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
            ranged: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
            siege: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
            }),
          }),
        ],
      })
      const scorchingUnit = TestUtil.getDbUnit({
        scorchScope: Combat.Close,
      })

      testScorchUnitsForPlayer({
        player,
        round: 1,
        logPrefix,
        rowsToScorch: [player.rounds[0].close],
        scorchingUnit,
        debugCalls: [
          [
            `${logPrefix} scorchingUnit "${scorchingUnit.name}" has scorchScope of "${scorchingUnit.scorchScope}" so getting strongest units in just that row to scorch`,
          ],
        ],
        expected: [],
      })
    })
    it('discards units if scorchUnitsInRow returns only 1 in Close row', () => {
      const unitToScorch = TestUtil.getDbDeckUnit({})
      const fieldUnitToScorch = TestUtil.getDbFieldUnit({
        id: unitToScorch.unit,
      })
      const player = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              units: [fieldUnitToScorch],
            }),
          }),
        ],
      })
      const scorchingUnit = TestUtil.getDbUnit({})
      const origPlayer = deepClone(player)

      testScorchUnitsForPlayer({
        player,
        round: 1,
        logPrefix,
        rowsToScorch: [player.rounds[0].close],
        scorchingUnit,
        scorchUnitsInRowResponses: [[fieldUnitToScorch]],
        changedPlayer: {
          ...origPlayer,
          deck: {
            ...origPlayer.deck,
            discard: [fieldUnitToScorch],
          },
        },
        expected: [
          {
            unit: TestUtil.convertFieldDbUnitToGameDbUnit(fieldUnitToScorch),
            user: origPlayer.user,
          },
        ],
        debugCalls: [
          [`${logPrefix} unit "${scorchingUnit.name}" scorched units "${JSON.stringify([unitToScorch.unit])}"`],
        ],
      })
    })
    it('discards units if scorchUnitsInRow returns only 1 in Ranged row', () => {
      const unitToScorch = TestUtil.getDbDeckUnit({})
      const fieldUnitToScorch = TestUtil.getDbFieldUnit({
        id: unitToScorch.unit,
      })
      const player = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            ranged: TestUtil.getDbPlayerCombatRow({
              units: [fieldUnitToScorch],
            }),
          }),
        ],
      })
      const scorchingUnit = TestUtil.getDbUnit({})
      const origPlayer = deepClone(player)

      testScorchUnitsForPlayer({
        player,
        round: 1,
        logPrefix,
        rowsToScorch: [player.rounds[0].ranged],
        scorchingUnit,
        scorchUnitsInRowResponses: [[fieldUnitToScorch]],
        changedPlayer: {
          ...origPlayer,
          deck: {
            ...origPlayer.deck,
            discard: [fieldUnitToScorch],
          },
        },
        expected: [
          {
            unit: TestUtil.convertFieldDbUnitToGameDbUnit(fieldUnitToScorch),
            user: origPlayer.user,
          },
        ],
        debugCalls: [
          [`${logPrefix} unit "${scorchingUnit.name}" scorched units "${JSON.stringify([unitToScorch.unit])}"`],
        ],
      })
    })
    it('discards units if scorchUnitsInRow returns only 1 in Siege row', () => {
      const unitToScorch = TestUtil.getDbDeckUnit({})
      const fieldUnitToScorch = TestUtil.getDbFieldUnit({
        id: unitToScorch.unit,
      })
      const player = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            siege: TestUtil.getDbPlayerCombatRow({
              units: [fieldUnitToScorch],
            }),
          }),
        ],
      })
      const scorchingUnit = TestUtil.getDbUnit({})
      const origPlayer = deepClone(player)

      testScorchUnitsForPlayer({
        player,
        round: 1,
        logPrefix,
        rowsToScorch: [player.rounds[0].siege],
        scorchingUnit,
        scorchUnitsInRowResponses: [[fieldUnitToScorch]],
        changedPlayer: {
          ...origPlayer,
          deck: {
            ...origPlayer.deck,
            discard: [fieldUnitToScorch],
          },
        },
        expected: [
          {
            unit: TestUtil.convertFieldDbUnitToGameDbUnit(fieldUnitToScorch),
            user: origPlayer.user,
          },
        ],
        debugCalls: [
          [`${logPrefix} unit "${scorchingUnit.name}" scorched units "${JSON.stringify([unitToScorch.unit])}"`],
        ],
      })
    })
    it('discards units if scorchUnitsInRow returns multiple in Close row', () => {
      const unitToScorch1 = TestUtil.getDbDeckUnit({})
      const unitToScorch2 = TestUtil.getDbDeckUnit({})
      const fieldUnitToScorch1 = TestUtil.getDbFieldUnit({
        id: unitToScorch1.unit,
      })
      const fieldUnitToScorch2 = TestUtil.getDbFieldUnit({
        id: unitToScorch2.unit,
      })
      const player = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              units: [fieldUnitToScorch1, fieldUnitToScorch2],
            }),
          }),
        ],
      })
      const scorchingUnit = TestUtil.getDbUnit({})
      const origPlayer = deepClone(player)

      testScorchUnitsForPlayer({
        player,
        round: 1,
        logPrefix,
        rowsToScorch: [player.rounds[0].close],
        scorchingUnit,
        scorchUnitsInRowResponses: [[fieldUnitToScorch1, fieldUnitToScorch2]],
        changedPlayer: {
          ...origPlayer,
          deck: {
            ...origPlayer.deck,
            discard: [fieldUnitToScorch1, fieldUnitToScorch2],
          },
        },
        expected: [
          {
            unit: TestUtil.convertFieldDbUnitToGameDbUnit(fieldUnitToScorch1),
            user: origPlayer.user,
          },
          {
            unit: TestUtil.convertFieldDbUnitToGameDbUnit(fieldUnitToScorch2),
            user: origPlayer.user,
          },
        ],
        debugCalls: [
          [
            `${logPrefix} unit "${scorchingUnit.name}" scorched units "${JSON.stringify([
              unitToScorch1.unit,
              unitToScorch2.unit,
            ])}"`,
          ],
        ],
      })
    })
    it('discards units if scorchUnitsInRow returns multiple in Ranged row', () => {
      const unitToScorch1 = TestUtil.getDbDeckUnit({})
      const unitToScorch2 = TestUtil.getDbDeckUnit({})
      const fieldUnitToScorch1 = TestUtil.getDbFieldUnit({
        id: unitToScorch1.unit,
      })
      const fieldUnitToScorch2 = TestUtil.getDbFieldUnit({
        id: unitToScorch2.unit,
      })
      const player = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            ranged: TestUtil.getDbPlayerCombatRow({
              units: [fieldUnitToScorch1, fieldUnitToScorch2],
            }),
          }),
        ],
      })
      const scorchingUnit = TestUtil.getDbUnit({})
      const origPlayer = deepClone(player)

      testScorchUnitsForPlayer({
        player,
        round: 1,
        logPrefix,
        rowsToScorch: [player.rounds[0].ranged],
        scorchingUnit,
        scorchUnitsInRowResponses: [[fieldUnitToScorch1, fieldUnitToScorch2]],
        changedPlayer: {
          ...origPlayer,
          deck: {
            ...origPlayer.deck,
            discard: [fieldUnitToScorch1, fieldUnitToScorch2],
          },
        },
        expected: [
          {
            unit: TestUtil.convertFieldDbUnitToGameDbUnit(fieldUnitToScorch1),
            user: origPlayer.user,
          },
          {
            unit: TestUtil.convertFieldDbUnitToGameDbUnit(fieldUnitToScorch2),
            user: origPlayer.user,
          },
        ],
        debugCalls: [
          [
            `${logPrefix} unit "${scorchingUnit.name}" scorched units "${JSON.stringify([
              unitToScorch1.unit,
              unitToScorch2.unit,
            ])}"`,
          ],
        ],
      })
    })
    it('discards units if scorchUnitsInRow returns multiple in Siege row', () => {
      const unitToScorch1 = TestUtil.getDbDeckUnit({})
      const unitToScorch2 = TestUtil.getDbDeckUnit({})
      const fieldUnitToScorch1 = TestUtil.getDbFieldUnit({
        id: unitToScorch1.unit,
      })
      const fieldUnitToScorch2 = TestUtil.getDbFieldUnit({
        id: unitToScorch2.unit,
      })
      const player = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            siege: TestUtil.getDbPlayerCombatRow({
              units: [fieldUnitToScorch1, fieldUnitToScorch2],
            }),
          }),
        ],
      })
      const scorchingUnit = TestUtil.getDbUnit({})
      const origPlayer = deepClone(player)

      testScorchUnitsForPlayer({
        player,
        round: 1,
        logPrefix,
        rowsToScorch: [player.rounds[0].siege],
        scorchingUnit,
        scorchUnitsInRowResponses: [[fieldUnitToScorch1, fieldUnitToScorch2]],
        changedPlayer: {
          ...origPlayer,
          deck: {
            ...origPlayer.deck,
            discard: [fieldUnitToScorch1, fieldUnitToScorch2],
          },
        },
        expected: [
          {
            unit: TestUtil.convertFieldDbUnitToGameDbUnit(fieldUnitToScorch1),
            user: origPlayer.user,
          },
          {
            unit: TestUtil.convertFieldDbUnitToGameDbUnit(fieldUnitToScorch2),
            user: origPlayer.user,
          },
        ],
        debugCalls: [
          [
            `${logPrefix} unit "${scorchingUnit.name}" scorched units "${JSON.stringify([
              unitToScorch1.unit,
              unitToScorch2.unit,
            ])}"`,
          ],
        ],
      })
    })
    it('discards units if scorchUnitsInRow returns 1 in all rows', () => {
      const unitToScorch1 = TestUtil.getDbDeckUnit({})
      const unitToScorch2 = TestUtil.getDbDeckUnit({})
      const unitToScorch3 = TestUtil.getDbDeckUnit({})
      const fieldUnitToScorch1 = TestUtil.getDbFieldUnit({
        id: unitToScorch1.unit,
      })
      const fieldUnitToScorch2 = TestUtil.getDbFieldUnit({
        id: unitToScorch2.unit,
      })
      const fieldUnitToScorch3 = TestUtil.getDbFieldUnit({
        id: unitToScorch3.unit,
      })
      const player = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              units: [fieldUnitToScorch1],
            }),
            ranged: TestUtil.getDbPlayerCombatRow({
              units: [fieldUnitToScorch2],
            }),
            siege: TestUtil.getDbPlayerCombatRow({
              units: [fieldUnitToScorch3],
            }),
          }),
        ],
      })
      const scorchingUnit = TestUtil.getDbUnit({})
      const origPlayer = deepClone(player)

      testScorchUnitsForPlayer({
        player,
        round: 1,
        logPrefix,
        rowsToScorch: [player.rounds[0].close, player.rounds[0].ranged, player.rounds[0].siege],
        scorchingUnit,
        scorchUnitsInRowResponses: [[fieldUnitToScorch1], [fieldUnitToScorch2], [fieldUnitToScorch3]],
        changedPlayer: {
          ...origPlayer,
          deck: {
            ...origPlayer.deck,
            discard: [fieldUnitToScorch1, fieldUnitToScorch2, fieldUnitToScorch3],
          },
        },
        expected: [
          {
            unit: TestUtil.convertFieldDbUnitToGameDbUnit(fieldUnitToScorch1),
            user: origPlayer.user,
          },
          {
            unit: TestUtil.convertFieldDbUnitToGameDbUnit(fieldUnitToScorch2),
            user: origPlayer.user,
          },
          {
            unit: TestUtil.convertFieldDbUnitToGameDbUnit(fieldUnitToScorch3),
            user: origPlayer.user,
          },
        ],
        debugCalls: [
          [
            `${logPrefix} unit "${scorchingUnit.name}" scorched units "${JSON.stringify([
              unitToScorch1.unit,
              unitToScorch2.unit,
              unitToScorch3.unit,
            ])}"`,
          ],
        ],
      })
    })
    it('logs to trace if enabled', () => {
      const unitToScorch = TestUtil.getDbDeckUnit({})
      const fieldUnitToScorch = TestUtil.getDbFieldUnit({
        id: unitToScorch.unit,
      })
      const player = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              units: [fieldUnitToScorch],
            }),
          }),
        ],
      })
      const scorchingUnit = TestUtil.getDbUnit({})
      const origPlayer = deepClone(player)

      testScorchUnitsForPlayer({
        player,
        round: 1,
        logPrefix,
        rowsToScorch: [player.rounds[0].close],
        scorchingUnit,
        scorchUnitsInRowResponses: [[fieldUnitToScorch]],
        changedPlayer: {
          ...origPlayer,
          deck: {
            ...origPlayer.deck,
            discard: [fieldUnitToScorch],
          },
        },
        expected: [
          {
            unit: TestUtil.convertFieldDbUnitToGameDbUnit(fieldUnitToScorch),
            user: origPlayer.user,
          },
        ],
        debugCalls: [
          [`${logPrefix} unit "${scorchingUnit.name}" scorched units "${JSON.stringify([unitToScorch.unit])}"`],
        ],
        traceCalls: [[`${logPrefix} unitsLost: "${JSON.stringify([fieldUnitToScorch])}"`]],
        traceEnabled: true,
      })
    })
  })
  describe('getRowsToScorch', () => {
    it('does not call to addRowToScorchIfEligible if no scorchScope for scorchingUnit', () => {
      const playerRound = TestUtil.getDbPlayerRound({})
      testGetRowsToScorch({
        playerRound,
        scorchingUnit: TestUtil.getDbUnit({}),
        expected: [playerRound.close, playerRound.ranged, playerRound.siege],
      })
    })
    it('calls to addRowToScorchIfEligible if scorchScope for scorchingUnit', () => {
      const playerRound = TestUtil.getDbPlayerRound({})
      testGetRowsToScorch({
        playerRound,
        scorchingUnit: TestUtil.getDbUnit({
          scorchScope: Combat.Close,
        }),
        expected: [],
      })
    })
  })
  describe('addRowToScorchIfEligible', () => {
    const logPrefix = 'log-prefix'
    it('does not add row if scorchScope does not equal combat', () => {
      const scorchingUnit = TestUtil.getDbUnit({
        scorchScope: Combat.Ranged,
      })
      testAddRowToScorchIfEligible({
        combat: Combat.Close,
        logPrefix,
        playerCombatRow: {
          score: 0,
          units: [],
        },
        rows: [],
        scorchingUnit,
        expected: [],
        traceCalls: [
          [
            `${logPrefix} not including combat row "${Combat.Close}" as it does not match scorchScope of "${scorchingUnit.scorchScope}" for scorchingUnit "${scorchingUnit.name}"`,
          ],
        ],
      })
    })
    it('does not add row if scorchScope equals combat but score less than scorchMin', () => {
      const combat = Combat.Close
      const scorchingUnit = TestUtil.getDbUnit({
        scorchScope: combat,
        scorchMin: 10,
      })
      testAddRowToScorchIfEligible({
        combat,
        logPrefix,
        playerCombatRow: {
          score: 9,
          units: [],
        },
        rows: [],
        scorchingUnit,
        expected: [],
        traceCalls: [
          [
            `${logPrefix} not including combat row "${combat}" as strength of "9" is less than scorchMin of "${scorchingUnit.scorchMin}" for scorchingUnit "${scorchingUnit}"`,
          ],
        ],
      })
    })
    it('adds to row if scorchScope equals combat and no scorchMin with empty rows', () => {
      const combat = Combat.Close
      const scorchingUnit = TestUtil.getDbUnit({
        scorchScope: combat,
      })
      const fieldUnit = TestUtil.getDbFieldUnit({})
      testAddRowToScorchIfEligible({
        combat,
        logPrefix,
        playerCombatRow: {
          score: 0,
          units: [fieldUnit],
        },
        rows: [],
        scorchingUnit,
        expected: [
          {
            score: 0,
            units: [fieldUnit],
          },
        ],
        traceCalls: [
          [
            `${logPrefix} including combat row "${combat}" as it matches scorchScope of "${scorchingUnit.scorchScope}" for scorchingUnit "${scorchingUnit.name}"`,
          ],
        ],
      })
    })
    it('adds to row if scorchScope equals combat and no scorchMin with existing rows', () => {
      const combat = Combat.Close
      const scorchingUnit = TestUtil.getDbUnit({
        scorchScope: combat,
      })
      const fieldUnit = TestUtil.getDbFieldUnit({})
      testAddRowToScorchIfEligible({
        combat,
        logPrefix,
        playerCombatRow: {
          score: 0,
          units: [fieldUnit],
        },
        rows: [
          {
            score: 0,
            units: [],
          },
        ],
        scorchingUnit,
        expected: [
          {
            score: 0,
            units: [],
          },
          {
            score: 0,
            units: [fieldUnit],
          },
        ],
        traceCalls: [
          [
            `${logPrefix} including combat row "${combat}" as it matches scorchScope of "${scorchingUnit.scorchScope}" for scorchingUnit "${scorchingUnit.name}"`,
          ],
        ],
      })
    })
    it('adds to row if scorchScope equals combat and scorchMin equals row score with empty rows', () => {
      const combat = Combat.Close
      const scorchingUnit = TestUtil.getDbUnit({
        scorchScope: combat,
        scorchMin: 10,
      })
      const fieldUnit = TestUtil.getDbFieldUnit({})
      testAddRowToScorchIfEligible({
        combat,
        logPrefix,
        playerCombatRow: {
          score: 10,
          units: [fieldUnit],
        },
        rows: [],
        scorchingUnit,
        expected: [
          {
            score: 10,
            units: [fieldUnit],
          },
        ],
        traceCalls: [
          [
            `${logPrefix} including combat row "${combat}" as strength of "10" is greater than or equal to scorchMin of "${scorchingUnit.scorchMin}" for scorchingUnit "${scorchingUnit}"`,
          ],
        ],
      })
    })
    it('adds to row if scorchScope equals combat and scorchMin equals row score with empty rows', () => {
      const combat = Combat.Close
      const scorchingUnit = TestUtil.getDbUnit({
        scorchScope: combat,
        scorchMin: 10,
      })
      const fieldUnit = TestUtil.getDbFieldUnit({})
      testAddRowToScorchIfEligible({
        combat,
        logPrefix,
        playerCombatRow: {
          score: 10,
          units: [fieldUnit],
        },
        rows: [
          {
            score: 0,
            units: [],
          },
        ],
        scorchingUnit,
        expected: [
          {
            score: 0,
            units: [],
          },
          {
            score: 10,
            units: [fieldUnit],
          },
        ],
        traceCalls: [
          [
            `${logPrefix} including combat row "${combat}" as strength of "10" is greater than or equal to scorchMin of "${scorchingUnit.scorchMin}" for scorchingUnit "${scorchingUnit}"`,
          ],
        ],
      })
    })
    it('adds to row if scorchScope equals combat and scorchMin is greater than row score with empty rows', () => {
      const combat = Combat.Close
      const scorchingUnit = TestUtil.getDbUnit({
        scorchScope: combat,
        scorchMin: 10,
      })
      const fieldUnit = TestUtil.getDbFieldUnit({})
      testAddRowToScorchIfEligible({
        combat,
        logPrefix,
        playerCombatRow: {
          score: 11,
          units: [fieldUnit],
        },
        rows: [],
        scorchingUnit,
        expected: [
          {
            score: 11,
            units: [fieldUnit],
          },
        ],
        traceCalls: [
          [
            `${logPrefix} including combat row "${combat}" as strength of "11" is greater than or equal to scorchMin of "${scorchingUnit.scorchMin}" for scorchingUnit "${scorchingUnit}"`,
          ],
        ],
      })
    })
    it('adds to row if scorchScope equals combat and scorchMin is greater than row score with empty rows', () => {
      const combat = Combat.Close
      const scorchingUnit = TestUtil.getDbUnit({
        scorchScope: combat,
        scorchMin: 10,
      })
      const fieldUnit = TestUtil.getDbFieldUnit({})
      testAddRowToScorchIfEligible({
        combat,
        logPrefix,
        playerCombatRow: {
          score: 11,
          units: [fieldUnit],
        },
        rows: [
          {
            score: 0,
            units: [],
          },
        ],
        scorchingUnit,
        expected: [
          {
            score: 0,
            units: [],
          },
          {
            score: 11,
            units: [fieldUnit],
          },
        ],
        traceCalls: [
          [
            `${logPrefix} including combat row "${combat}" as strength of "11" is greater than or equal to scorchMin of "${scorchingUnit.scorchMin}" for scorchingUnit "${scorchingUnit}"`,
          ],
        ],
      })
    })
  })
  describe('scorchUnitsInRow', () => {
    const unit1 = TestUtil.getDbFieldUnit({})
    const unit2 = TestUtil.getDbFieldUnit({})
    const unit3 = TestUtil.getDbFieldUnit({})
    describe('empty strongestUnitIds', () => {
      it('does nothing if no units in row', () => {
        testScorchUnitsInRow({
          units: [],
          unitIdsToScorch: [],
          left: [],
          scorched: [],
        })
      })
      it('does not remove single unit if not in strongestUnitIds', () => {
        testScorchUnitsInRow({
          units: [unit1],
          unitIdsToScorch: [],
          left: [unit1],
          scorched: [],
        })
      })
      it('does not remove multiple units if none in strongestUnitIds', () => {
        testScorchUnitsInRow({
          units: [unit1, unit2, unit3],
          unitIdsToScorch: [],
          left: [unit1, unit2, unit3],
          scorched: [],
        })
      })
    })
    describe('single strongestUnitIds', () => {
      it('does nothing if no units in row', () => {
        testScorchUnitsInRow({
          units: [],
          unitIdsToScorch: [unit1.unit.toString()],
          left: [],
          scorched: [],
        })
      })
      it('does not remove single unit if not in strongestUnitIds', () => {
        testScorchUnitsInRow({
          units: [unit1],
          unitIdsToScorch: [unit2.unit.toString()],
          left: [unit1],
          scorched: [],
        })
      })
      it('does not remove multiple units if none in strongestUnitIds', () => {
        testScorchUnitsInRow({
          units: [unit1, unit2],
          unitIdsToScorch: [unit3.unit.toString()],
          left: [unit1, unit2],
          scorched: [],
        })
      })
      it('removes single unit if in strongestUnitIds', () => {
        testScorchUnitsInRow({
          units: [unit1],
          unitIdsToScorch: [unit1.unit.toString()],
          left: [],
          scorched: [unit1],
        })
      })
      it('remove first unit if first in strongestUnitIds', () => {
        testScorchUnitsInRow({
          units: [unit1, unit2, unit3],
          unitIdsToScorch: [unit1.unit.toString()],
          left: [unit2, unit3],
          scorched: [unit1],
        })
      })
      it('remove middle unit if middle in strongestUnitIds', () => {
        testScorchUnitsInRow({
          units: [unit1, unit2, unit3],
          unitIdsToScorch: [unit2.unit.toString()],
          left: [unit1, unit3],
          scorched: [unit2],
        })
      })
      it('remove last unit if last in strongestUnitIds', () => {
        testScorchUnitsInRow({
          units: [unit1, unit2, unit3],
          unitIdsToScorch: [unit3.unit.toString()],
          left: [unit1, unit2],
          scorched: [unit3],
        })
      })
      it('removes first two unit if first two in strongestUnitIds', () => {
        testScorchUnitsInRow({
          units: [unit1, unit2, unit3],
          unitIdsToScorch: [unit1.unit.toString(), unit2.unit.toString()],
          left: [unit3],
          scorched: [unit1, unit2],
        })
      })
      it('removes last two unit if last two in strongestUnitIds', () => {
        testScorchUnitsInRow({
          units: [unit1, unit2, unit3],
          unitIdsToScorch: [unit2.unit.toString(), unit3.unit.toString()],
          left: [unit1],
          scorched: [unit2, unit3],
        })
      })
      it('removes all units if all in strongestUnitIds', () => {
        testScorchUnitsInRow({
          units: [unit1, unit2, unit3],
          unitIdsToScorch: [unit1.unit.toString(), unit2.unit.toString(), unit3.unit.toString()],
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
  scorchPlayerResponses,
  error,
  getFieldUnitsCalls = [],
  errorCalls = [],
  traceEnabled,
}: {
  logPrefix: string
  battlefieldUnits: UnitDbObject[]
  scorchEffect: EffectDbObject | undefined
  game: GameDbObject
  newDeckUnit: DeckUnitDbObject
  scorchPlayerResponses?: ImpactDbObject[][]
  error?: Error
  getFieldUnitsCalls?: any[][]
  errorCalls?: string[][]
  traceEnabled?: boolean
}) {
  const newUnit = battlefieldUnits.find((unit) => unit._id.toString() === newDeckUnit.unit.toString())
  const effects = [TestUtil.getDbEffect({}), TestUtil.getDbEffect({})]
  const fieldUnits = [TestUtil.getDbFieldUnit({}), TestUtil.getDbFieldUnit({})]
  const strongestFieldUnits = [fieldUnits[1]]
  const getEffectWithKeySpy = jest.spyOn(GetEffectWithKey, 'getEffectWithKey').mockReturnValue(scorchEffect)
  const getFieldUnitsSpy = jest.spyOn(GetFieldUnits, 'fromRounds').mockReturnValue(fieldUnits)
  const getStrongestNonHeroUnitIdsSpy = jest.spyOn(GetStrongestNonHeroUnitIds, 'getStrongestNonHeroUnitIds')
  if (getFieldUnitsCalls.length > 0) {
    getStrongestNonHeroUnitIdsSpy.mockReturnValue(strongestFieldUnits.map((fieldUnit) => fieldUnit.unit.toString()))
  }
  const scorchPlayerSpy = jest.spyOn(ScorchBattelfield as any, 'scorchPlayer')
  if (scorchPlayerResponses) {
    for (const scorchPlayerResponse of scorchPlayerResponses) {
      scorchPlayerSpy.mockReturnValueOnce(scorchPlayerResponse)
    }
  } else {
    scorchPlayerSpy.mockReturnValue([])
  }
  const errorSpy = jest.fn().mockImplementation()
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  ScorchBattelfield['logger'] = {
    error: errorSpy,
    debug: debugSpy,
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any
  const impacts: ImpactDbObject[] = []
  if (scorchPlayerResponses) {
    for (const scorchPlayerResponse of scorchPlayerResponses) {
      for (const impact of scorchPlayerResponse) {
        impacts.push(impact)
      }
    }
  }

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
    ).toEqual(
      impacts.length > 0
        ? {
            [newDeckUnit.unit.toString()]: impacts,
          }
        : {}
    )
  }

  expect(getEffectWithKeySpy.mock.calls).toEqual(
    error
      ? []
      : [
          [
            {
              effectKey: EffectKey.Scorch,
              effects,
              logPrefix,
            },
          ],
        ]
  )
  expect(getFieldUnitsSpy.mock.calls).toEqual(getFieldUnitsCalls)
  expect(getStrongestNonHeroUnitIdsSpy.mock.calls).toEqual(
    getFieldUnitsCalls.length > 0
      ? [
          [
            {
              fieldUnits,
              logPrefix,
              units: battlefieldUnits,
              minimumStrength: newUnit?.scorchMin,
            },
          ],
        ]
      : []
  )
  expect(scorchPlayerSpy.mock.calls).toEqual(
    getFieldUnitsCalls.length > 0
      ? game.players.map((player) => [
          {
            battlefieldUnits,
            player,
            round: game.round,
            turn: game.turn,
            logPrefix: `${logPrefix} player "${player.user}"`,
            scorchingUnit: newUnit,
            scorchingDeckUnit: newDeckUnit,
            strongestUnitIdsOnBattlefield: strongestFieldUnits.map((fieldUnit) => fieldUnit.unit.toString()),
          },
        ])
      : []
  )
  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(debugSpy.mock.calls).toEqual(
    getFieldUnitsCalls.length > 0 ? [[`${logPrefix} unit "${newUnit?.name}" has scorch effect, applying it`]] : []
  )
  const traceCalls: string[][] = []
  if (traceEnabled) {
    traceCalls.push(
      ...[
        [`${logPrefix} newUnit: "${JSON.stringify(newUnit)}"`],
        [`${logPrefix} scorchEffect: "${JSON.stringify(scorchEffect)}"`],
        [`${logPrefix} hasScorchEffect: "${getFieldUnitsCalls.length > 0}"`],
      ]
    )
    if (getFieldUnitsCalls.length > 0) {
      traceCalls.push(
        ...[
          [`${logPrefix} fieldUnits: "${JSON.stringify(fieldUnits)}"`],
          [
            `${logPrefix} strongestUnitIds: "${JSON.stringify(
              strongestFieldUnits.map((fieldUnit) => fieldUnit.unit.toString())
            )}"`,
          ],
        ]
      )
    }
  }
  expect(traceSpy.mock.calls).toEqual(traceCalls)
}

function testScorchPlayer({
  player,
  turn,
  logPrefix,
  scorchingUnit,
  scorchingDeckUnit,
  changedPlayer,
  impacts = [],
  callScorchUnitsForPlayer,
}: {
  player: GamePlayerDbObject
  turn: ObjectId | undefined
  logPrefix: string
  scorchingUnit: UnitDbObject
  scorchingDeckUnit: DeckUnitDbObject
  changedPlayer?: GamePlayerDbObject
  impacts?: ImpactDbObject[]
  callScorchUnitsForPlayer: boolean
}) {
  const origPlayer = deepClone(player)
  const battlefieldUnits = [TestUtil.getDbUnit({})]
  const strongestUnitIdsOnBattlefield = battlefieldUnits.map((unit) => unit._id.toString())
  const round = 1
  const scorchPlayerpy = jest.spyOn(ScorchBattelfield as any, 'scorchUnitsForPlayer').mockReturnValue(impacts)
  const traceSpy = jest.fn().mockImplementation()
  ScorchBattelfield['logger'] = {
    trace: traceSpy,
  } as any

  expect(
    ScorchBattelfield['scorchPlayer']({
      battlefieldUnits,
      logPrefix,
      player,
      round,
      scorchingDeckUnit,
      scorchingUnit,
      strongestUnitIdsOnBattlefield,
      turn,
    })
  ).toEqual(impacts)

  expect(player).toEqual(changedPlayer || origPlayer)
  expect(scorchPlayerpy.mock.calls).toEqual(
    callScorchUnitsForPlayer
      ? [
          [
            {
              battlefieldUnits,
              logPrefix,
              player,
              round,
              scorchingUnit,
              strongestUnitIdsOnBattlefield,
            },
          ],
        ]
      : []
  )
  const traceCalls: string[][] = []
  if (changedPlayer) {
    traceCalls.push([
      `${logPrefix} newUnit "${scorchingUnit._id}" has name "Scorch" and current player, so discarding it`,
    ])
  }
  traceCalls.push([`${logPrefix} scorchablePlayer: "${callScorchUnitsForPlayer}"`])
  expect(traceSpy.mock.calls).toEqual(traceCalls)
}

function testScorchUnitsForPlayer({
  player,
  round,
  logPrefix,
  scorchingUnit,
  scorchUnitsInRowResponses,
  rowsToScorch,
  changedPlayer,
  expected,
  debugCalls = [],
  traceCalls = [],
  traceEnabled,
}: {
  player: GamePlayerDbObject
  round: number
  logPrefix: string
  scorchingUnit: UnitDbObject
  scorchUnitsInRowResponses?: FieldUnitDbObject[][]
  rowsToScorch: PlayerCombatRowDbObject[]
  changedPlayer?: GamePlayerDbObject
  expected: ImpactDbObject[]
  debugCalls?: string[][]
  traceCalls?: string[][]
  traceEnabled?: boolean
}) {
  const strongestUnitIdsOnBattlefield = [new ObjectId().toString()]
  const battlefieldUnits = [TestUtil.getDbUnit({})]
  const getRowsToScorchSpy = jest.spyOn(ScorchBattelfield as any, 'getRowsToScorch')
  if (rowsToScorch) {
    getRowsToScorchSpy.mockReturnValue(rowsToScorch)
  }
  const scopedStrongestNonHeroUnitIds = [new ObjectId().toString()]
  const getStrongestNonHeroUnitIdsSpy = jest
    .spyOn(GetStrongestNonHeroUnitIds, 'getStrongestNonHeroUnitIds')
    .mockReturnValue(scopedStrongestNonHeroUnitIds)
  const scorchUnitsInRowSpy = jest.spyOn(ScorchBattelfield as any, 'scorchUnitsInRow')
  if (scorchUnitsInRowResponses) {
    for (const scorchUnitsInRowResponse of scorchUnitsInRowResponses) {
      scorchUnitsInRowSpy.mockReturnValueOnce(scorchUnitsInRowResponse)
    }
  }
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  ScorchBattelfield['logger'] = {
    debug: debugSpy,
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any
  const origPlayer = deepClone(player)

  expect(
    ScorchBattelfield['scorchUnitsForPlayer']({
      battlefieldUnits,
      player,
      round,
      logPrefix,
      scorchingUnit,
      strongestUnitIdsOnBattlefield,
    })
  ).toEqual(expected)
  expect(player).toEqual(changedPlayer || origPlayer)

  expect(getRowsToScorchSpy.mock.calls).toEqual(
    rowsToScorch
      ? [
          [
            {
              logPrefix,
              playerRound: player.rounds[round - 1],
              scorchingUnit,
            },
          ],
        ]
      : []
  )
  expect(getStrongestNonHeroUnitIdsSpy.mock.calls).toEqual(
    scorchingUnit.scorchScope
      ? rowsToScorch.map((rowToScorch) => [
          {
            fieldUnits: rowToScorch.units,
            logPrefix,
            units: battlefieldUnits,
          },
        ])
      : []
  )
  expect(scorchUnitsInRowSpy.mock.calls).toEqual(
    rowsToScorch.map((rowToScorch) => [
      {
        row: rowToScorch,
        unitIdsToScorch: scorchingUnit.scorchScope ? scopedStrongestNonHeroUnitIds : strongestUnitIdsOnBattlefield,
      },
    ])
  )
  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(traceSpy.mock.calls).toEqual(traceCalls)
}

function testGetRowsToScorch({
  playerRound,
  scorchingUnit,
  expected,
}: {
  playerRound: PlayerRoundDbObject
  scorchingUnit: UnitDbObject
  expected: PlayerCombatRowDbObject[]
}) {
  const logPrefix = 'log-prefix'
  const addRowToScorchIfEligibleSpy = jest
    .spyOn(ScorchBattelfield as any, 'addRowToScorchIfEligible')
    .mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  ScorchBattelfield['logger'] = {
    trace: traceSpy,
  } as any

  expect(
    ScorchBattelfield['getRowsToScorch']({
      logPrefix,
      playerRound,
      scorchingUnit,
    })
  ).toEqual(expected)

  expect(addRowToScorchIfEligibleSpy.mock.calls).toEqual(
    scorchingUnit.scorchScope
      ? [
          [
            {
              combat: Combat.Close,
              logPrefix,
              playerCombatRow: playerRound.close,
              rows: [],
              scorchingUnit,
            },
          ],
          [
            {
              combat: Combat.Ranged,
              logPrefix,
              playerCombatRow: playerRound.ranged,
              rows: [],
              scorchingUnit,
            },
          ],
          [
            {
              combat: Combat.Siege,
              logPrefix,
              playerCombatRow: playerRound.siege,
              rows: [],
              scorchingUnit,
            },
          ],
        ]
      : []
  )
  expect(traceSpy.mock.calls).toEqual(
    scorchingUnit.scorchScope
      ? []
      : [
          [
            `${logPrefix} no scorchScope for scorchingUnit "${scorchingUnit.name}", all combat rows eligible for scorching`,
          ],
        ]
  )
}

function testAddRowToScorchIfEligible({
  combat,
  logPrefix,
  playerCombatRow,
  rows,
  scorchingUnit,
  expected,
  traceCalls,
}: {
  combat: Combat
  logPrefix: string
  playerCombatRow: PlayerCombatRowDbObject
  rows: PlayerCombatRowDbObject[]
  scorchingUnit: UnitDbObject
  expected: PlayerCombatRowDbObject[]
  traceCalls: string[][]
}) {
  const traceSpy = jest.fn().mockImplementation()
  ScorchBattelfield['logger'] = {
    trace: traceSpy,
  } as any

  expect(
    ScorchBattelfield['addRowToScorchIfEligible']({
      combat,
      logPrefix,
      playerCombatRow,
      rows,
      scorchingUnit,
    })
  ).toEqual(undefined)

  expect(rows).toEqual(expected)
  expect(traceSpy.mock.calls).toEqual(traceCalls)
}

function testScorchUnitsInRow({
  units,
  unitIdsToScorch,
  scorched,
  left,
}: {
  units: FieldUnitDbObject[]
  unitIdsToScorch: string[]
  scorched: FieldUnitDbObject[]
  left: FieldUnitDbObject[]
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
      unitIdsToScorch,
    })
  ).toEqual(scorched)

  expect(row).toEqual({
    score: 0,
    units: left,
  })
}
