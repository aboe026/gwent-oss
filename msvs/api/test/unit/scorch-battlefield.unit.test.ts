import { ObjectId } from 'mongodb'

import {
  Combat,
  DeckUnitDbObject,
  EffectDbObject,
  EffectKey,
  GameDbObject,
  GamePlayerDbObject,
  GameUnitDbObject,
  PlayerCombatRowDbObject,
  UnitDbObject,
} from '@gwent/graphql-schema/database-typings'
import deepClone from '../util/deep-clone'
import GetEffectWithKey from '../../src/graphql/resolvers/mutations/play-unit/get-effect-with-key'
import * as getGameUnits from '../../src/graphql/resolvers/mutations/play-unit/get-game-units'
import GetStrongestNonHeroUnits from '../../src/graphql/resolvers/mutations/play-unit/get-strongest-non-hero-units'
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
  describe('scorchUnitsForPlayer', () => {
    const logPrefix = 'log-prefix'
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
      const origPlayer = deepClone(player)

      testScorchUnitsForPlayer({
        player,
        round: 1,
        turn: new ObjectId(),
        logPrefix,
        scorchingDeckUnit,
        scorchingUnit,
        strongestUnitIds: [],
        expected: origPlayer,
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

      testScorchUnitsForPlayer({
        player,
        round: 1,
        turn: player.user,
        logPrefix,
        scorchingDeckUnit,
        scorchingUnit,
        strongestUnitIds: [],
        expected: {
          ...origPlayer,
          deck: {
            ...origPlayer.deck,
            discard: [scorchingDeckUnit],
          },
        },
      })
    })
    it('does not move anything to discard if scorchUnitsInRow returns nothing', () => {
      const scorchedUnit = TestUtil.getDbDeckUnit({})
      const player = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            close: {
              score: 0,
              units: [scorchedUnit],
            },
          }),
        ],
      })
      const scorchingUnit = TestUtil.getDbUnit({})
      const scorchingDeckUnit = TestUtil.getDbDeckUnit({
        id: scorchingUnit._id,
      })
      const strongestUnitIds = [new ObjectId().toString()]
      const origPlayer = deepClone(player)

      testScorchUnitsForPlayer({
        player,
        round: 1,
        turn: player.user,
        logPrefix,
        scorchingDeckUnit,
        scorchingUnit,
        strongestUnitIds,
        scorchUnitsInRowResponses: [[], [], []],
        expected: origPlayer,
        scorchUnitsInRowCalls: getScorchUnitsInRowCalls({
          player,
          round: 1,
          strongestUnitIds,
        }),
      })
    })
    it('moves unitsScorched to discards if no scorch scope and turn', () => {
      const scorchedUnit = TestUtil.getDbDeckUnit({})
      const player = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            close: {
              score: 0,
              units: [scorchedUnit],
            },
          }),
        ],
      })
      const scorchingUnit = TestUtil.getDbUnit({
        combats: [Combat.Ranged],
      })
      const scorchingDeckUnit = TestUtil.getDbDeckUnit({
        id: scorchingUnit._id,
      })
      const strongestUnitIds = [scorchedUnit.unit.toString()]
      const origPlayer = deepClone(player)

      testScorchUnitsForPlayer({
        player,
        round: 1,
        turn: player.user,
        logPrefix,
        scorchingDeckUnit,
        scorchingUnit,
        strongestUnitIds,
        scorchUnitsInRowResponses: [[], [scorchedUnit], []],
        expected: {
          ...origPlayer,
          deck: {
            ...origPlayer.deck,
            discard: [scorchedUnit],
          },
        },
        scorchUnitsInRowCalls: getScorchUnitsInRowCalls({
          player,
          round: 1,
          strongestUnitIds,
        }),
        debugCalls: [
          [
            `${logPrefix} unit "${scorchingUnit.name}" scorched units "${JSON.stringify([
              scorchedUnit.unit,
            ])}" for player "${player.user}"`,
          ],
        ],
      })
    })
    it('moves unitsScorched to discards if no scorch scope and not turn', () => {
      const scorchedUnit = TestUtil.getDbDeckUnit({})
      const player = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            close: {
              score: 0,
              units: [scorchedUnit],
            },
          }),
        ],
      })
      const scorchingUnit = TestUtil.getDbUnit({
        combats: [Combat.Siege],
      })
      const scorchingDeckUnit = TestUtil.getDbDeckUnit({
        id: scorchingUnit._id,
      })
      const strongestUnitIds = [scorchedUnit.unit.toString()]
      const origPlayer = deepClone(player)

      testScorchUnitsForPlayer({
        player,
        round: 1,
        turn: new ObjectId(),
        logPrefix,
        scorchingDeckUnit,
        scorchingUnit,
        strongestUnitIds,
        scorchUnitsInRowResponses: [[], [], [scorchedUnit]],
        expected: {
          ...origPlayer,
          deck: {
            ...origPlayer.deck,
            discard: [scorchedUnit],
          },
        },
        scorchUnitsInRowCalls: getScorchUnitsInRowCalls({
          player,
          round: 1,
          strongestUnitIds,
        }),
        debugCalls: [
          [
            `${logPrefix} unit "${scorchingUnit.name}" scorched units "${JSON.stringify([
              scorchedUnit.unit,
            ])}" for player "${player.user}"`,
          ],
        ],
      })
    })
    it('does not move unitsScorched to discards if scorch scope and turn', () => {
      const scorchedUnit = TestUtil.getDbDeckUnit({})
      const player = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            close: {
              score: 0,
              units: [scorchedUnit],
            },
          }),
        ],
      })
      const scorchingUnit = TestUtil.getDbUnit({
        scorchScope: Combat.Close,
      })
      const scorchingDeckUnit = TestUtil.getDbDeckUnit({
        id: scorchingUnit._id,
      })
      const strongestUnitIds = [scorchedUnit.unit.toString()]
      const origPlayer = deepClone(player)

      testScorchUnitsForPlayer({
        player,
        round: 1,
        turn: player.user,
        logPrefix,
        scorchingDeckUnit,
        scorchingUnit,
        strongestUnitIds,
        expected: {
          ...origPlayer,
        },
      })
    })
    it('moves unitsScorched to discards if scorch scope and not turn', () => {
      const scorchedUnit = TestUtil.getDbDeckUnit({})
      const nonScorchedUnit = TestUtil.getDbDeckUnit({})
      const player = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            close: {
              score: 0,
              units: [scorchedUnit, nonScorchedUnit],
            },
          }),
        ],
      })
      const scorchingUnit = TestUtil.getDbUnit({
        scorchScope: Combat.Close,
      })
      const scorchingDeckUnit = TestUtil.getDbDeckUnit({
        id: scorchingUnit._id,
      })
      const strongestUnitIds = [scorchedUnit.unit.toString()]
      const origPlayer = deepClone(player)

      testScorchUnitsForPlayer({
        player,
        round: 1,
        turn: new ObjectId(),
        logPrefix,
        scorchingDeckUnit,
        scorchingUnit,
        strongestUnitIds,
        scorchUnitsInRowResponses: [[scorchedUnit], [], []],
        expected: {
          ...origPlayer,
          deck: {
            ...origPlayer.deck,
            discard: [scorchedUnit],
          },
        },
        scorchUnitsInRowCalls: getScorchUnitsInRowCalls({
          player,
          round: 1,
          strongestUnitIds,
        }),
        debugCalls: [
          [
            `${logPrefix} unit "${scorchingUnit.name}" scorched units "${JSON.stringify([
              scorchedUnit.unit,
            ])}" for player "${player.user}"`,
          ],
        ],
      })
    })
    it('moves unitsScorched to discards if multiple units scorched in same combat', () => {
      const scorchedUnit1 = TestUtil.getDbDeckUnit({})
      const scorchedUnit2 = TestUtil.getDbDeckUnit({})
      const player = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            close: {
              score: 0,
              units: [scorchedUnit1, scorchedUnit2],
            },
          }),
        ],
      })
      const scorchingUnit = TestUtil.getDbUnit({
        combats: [Combat.Close],
      })
      const scorchingDeckUnit = TestUtil.getDbDeckUnit({
        id: scorchingUnit._id,
      })
      const strongestUnitIds = [scorchedUnit1.unit.toString(), scorchedUnit2.unit.toString()]
      const origPlayer = deepClone(player)

      testScorchUnitsForPlayer({
        player,
        round: 1,
        turn: player.user,
        logPrefix,
        scorchingDeckUnit,
        scorchingUnit,
        strongestUnitIds,
        scorchUnitsInRowResponses: [[scorchedUnit1, scorchedUnit2], [], []],
        expected: {
          ...origPlayer,
          deck: {
            ...origPlayer.deck,
            discard: [scorchedUnit1, scorchedUnit2],
          },
        },
        scorchUnitsInRowCalls: getScorchUnitsInRowCalls({
          player,
          round: 1,
          strongestUnitIds,
        }),
        debugCalls: [
          [
            `${logPrefix} unit "${scorchingUnit.name}" scorched units "${JSON.stringify([
              scorchedUnit1.unit,
              scorchedUnit2.unit,
            ])}" for player "${player.user}"`,
          ],
        ],
      })
    })
    it('moves unitsScorched to discards if multiple units scorched in different combats', () => {
      const scorchedUnit1 = TestUtil.getDbDeckUnit({})
      const scorchedUnit2 = TestUtil.getDbDeckUnit({})
      const player = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            close: {
              score: 0,
              units: [scorchedUnit1, scorchedUnit2],
            },
          }),
        ],
      })
      const scorchingUnit = TestUtil.getDbUnit({
        name: 'Scorch',
      })
      const scorchingDeckUnit = TestUtil.getDbDeckUnit({
        id: scorchingUnit._id,
      })
      const strongestUnitIds = [scorchedUnit1.unit.toString(), scorchedUnit2.unit.toString()]
      const origPlayer = deepClone(player)

      testScorchUnitsForPlayer({
        player,
        round: 1,
        turn: player.user,
        logPrefix,
        scorchingDeckUnit,
        scorchingUnit,
        strongestUnitIds,
        scorchUnitsInRowResponses: [[scorchedUnit1], [scorchedUnit2], []],
        expected: {
          ...origPlayer,
          deck: {
            ...origPlayer.deck,
            discard: [scorchingDeckUnit, scorchedUnit1, scorchedUnit2],
          },
        },
        scorchUnitsInRowCalls: getScorchUnitsInRowCalls({
          player,
          round: 1,
          strongestUnitIds,
        }),
        debugCalls: [
          [
            `${logPrefix} unit "${scorchingUnit.name}" scorched units "${JSON.stringify([
              scorchedUnit1.unit,
              scorchedUnit2.unit,
            ])}" for player "${player.user}"`,
          ],
        ],
      })
    })
    it('scorch works in round 2', () => {
      const scorchedUnit = TestUtil.getDbDeckUnit({})
      const player = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            close: {
              score: 0,
              units: [scorchedUnit],
            },
          }),
        ],
      })
      const scorchingUnit = TestUtil.getDbUnit({})
      const scorchingDeckUnit = TestUtil.getDbDeckUnit({
        id: scorchingUnit._id,
      })
      const strongestUnitIds = [scorchedUnit.unit.toString()]
      const origPlayer = deepClone(player)

      testScorchUnitsForPlayer({
        player,
        round: 2,
        turn: player.user,
        logPrefix,
        scorchingDeckUnit,
        scorchingUnit,
        strongestUnitIds,
        scorchUnitsInRowResponses: [[scorchedUnit], [], []],
        expected: {
          ...origPlayer,
          deck: {
            ...origPlayer.deck,
            discard: [scorchedUnit],
          },
        },
        scorchUnitsInRowCalls: getScorchUnitsInRowCalls({
          player,
          round: 2,
          strongestUnitIds,
        }),
        debugCalls: [
          [
            `${logPrefix} unit "${scorchingUnit.name}" scorched units "${JSON.stringify([
              scorchedUnit.unit,
            ])}" for player "${player.user}"`,
          ],
        ],
        traceEnabled: true,
        traceCalls: [
          [`${logPrefix} scorchablePlayer "true" for player "${player.user}"`],
          [`${logPrefix} unitsLost: "${JSON.stringify([scorchedUnit])}"`],
        ],
      })
    })
    it('scorch works in round 3', () => {
      const scorchedUnit = TestUtil.getDbDeckUnit({})
      const player = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            close: {
              score: 0,
              units: [scorchedUnit],
            },
          }),
        ],
      })
      const scorchingUnit = TestUtil.getDbUnit({})
      const scorchingDeckUnit = TestUtil.getDbDeckUnit({
        id: scorchingUnit._id,
      })
      const strongestUnitIds = [scorchedUnit.unit.toString()]
      const origPlayer = deepClone(player)

      testScorchUnitsForPlayer({
        player,
        round: 3,
        turn: player.user,
        logPrefix,
        scorchingDeckUnit,
        scorchingUnit,
        strongestUnitIds,
        scorchUnitsInRowResponses: [[scorchedUnit], [], []],
        expected: {
          ...origPlayer,
          deck: {
            ...origPlayer.deck,
            discard: [scorchedUnit],
          },
        },
        scorchUnitsInRowCalls: getScorchUnitsInRowCalls({
          player,
          round: 3,
          strongestUnitIds,
        }),
        debugCalls: [
          [
            `${logPrefix} unit "${scorchingUnit.name}" scorched units "${JSON.stringify([
              scorchedUnit.unit,
            ])}" for player "${player.user}"`,
          ],
        ],
        traceEnabled: true,
        traceCalls: [
          [`${logPrefix} scorchablePlayer "true" for player "${player.user}"`],
          [`${logPrefix} unitsLost: "${JSON.stringify([scorchedUnit])}"`],
        ],
      })
    })
    it('logs to trace if enabled', () => {
      const scorchedUnit = TestUtil.getDbDeckUnit({})
      const player = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            close: {
              score: 0,
              units: [scorchedUnit],
            },
          }),
        ],
      })
      const scorchingUnit = TestUtil.getDbUnit({
        name: 'Scorch',
      })
      const scorchingDeckUnit = TestUtil.getDbDeckUnit({
        id: scorchingUnit._id,
      })
      const strongestUnitIds = [scorchedUnit.unit.toString()]
      const origPlayer = deepClone(player)

      testScorchUnitsForPlayer({
        player,
        round: 1,
        turn: player.user,
        logPrefix,
        scorchingDeckUnit,
        scorchingUnit,
        strongestUnitIds,
        scorchUnitsInRowResponses: [[scorchedUnit], [], []],
        expected: {
          ...origPlayer,
          deck: {
            ...origPlayer.deck,
            discard: [scorchingDeckUnit, scorchedUnit],
          },
        },
        scorchUnitsInRowCalls: getScorchUnitsInRowCalls({
          player,
          round: 1,
          strongestUnitIds,
        }),
        debugCalls: [
          [
            `${logPrefix} unit "${scorchingUnit.name}" scorched units "${JSON.stringify([
              scorchedUnit.unit,
            ])}" for player "${player.user}"`,
          ],
        ],
        traceEnabled: true,
        traceCalls: [
          [
            `${logPrefix} newUnit "${scorchingUnit._id}" has name "Scorch" and played by current player "${player.user}", so discarding it`,
          ],
          [`${logPrefix} scorchablePlayer "true" for player "${player.user}"`],
          [`${logPrefix} unitsLost: "${JSON.stringify([scorchedUnit])}"`],
        ],
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
  const getEffectWithKeySpy = jest.spyOn(GetEffectWithKey, 'getEffectWithKey').mockReturnValue(scorchEffect)
  const getGameUnitsSpy = jest.spyOn(getGameUnits, 'default').mockReturnValue(gameUnits)
  const getStrongestNonHeroUnitsSpy = jest.spyOn(GetStrongestNonHeroUnits, 'getStrongestNonHeroUnits')
  if (getGameUnitsCalls.length > 0) {
    getStrongestNonHeroUnitsSpy.mockReturnValue(strongestGameUnits)
  }
  const scorchUnitsForPlayersSpy = jest.spyOn(ScorchBattelfield as any, 'scorchUnitsForPlayer').mockImplementation()
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
              logPrefix,
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
              logPrefix,
              units: battlefieldUnits,
              minimumStrength: newUnit?.scorchMin,
            },
          ],
        ]
      : []
  )
  expect(scorchUnitsForPlayersSpy.mock.calls).toEqual(
    getGameUnitsCalls.length > 0
      ? game.players.map((player) => [
          {
            player,
            round: game.round,
            turn: game.turn,
            logPrefix,
            scorchingDeckUnit: newDeckUnit,
            scorchingUnit: newUnit,
            strongestUnitIds: strongestGameUnits.map((gameUnit) => gameUnit.unit.toString()),
          },
        ])
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

function getScorchUnitsInRowCalls({
  player,
  round,
  strongestUnitIds,
}: {
  player: GamePlayerDbObject
  round: number
  strongestUnitIds: string[]
}): any[][] {
  const calls: any[][] = []

  const playerRound = player.rounds[round - 1]
  for (const roundRow of [playerRound.close, playerRound.ranged, playerRound.siege]) {
    calls.push([
      {
        row: roundRow,
        strongestUnitIds,
      },
    ])
  }

  return calls
}

function testScorchUnitsForPlayer({
  player,
  round,
  turn,
  logPrefix,
  scorchingUnit,
  scorchingDeckUnit,
  strongestUnitIds,
  scorchUnitsInRowResponses,
  expected,
  scorchUnitsInRowCalls = [],
  debugCalls = [],
  traceCalls = [],
  traceEnabled,
}: {
  player: GamePlayerDbObject
  round: number
  turn: ObjectId
  logPrefix: string
  scorchingUnit: UnitDbObject
  scorchingDeckUnit: DeckUnitDbObject
  strongestUnitIds: string[]
  scorchUnitsInRowResponses?: GameUnitDbObject[][]
  expected: GamePlayerDbObject
  scorchUnitsInRowCalls?: any[][]
  debugCalls?: string[][]
  traceCalls?: string[][]
  traceEnabled?: boolean
}) {
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

  expect(
    ScorchBattelfield['scorchUnitsForPlayer']({
      player,
      round,
      turn,
      logPrefix,
      scorchingDeckUnit,
      scorchingUnit,
      strongestUnitIds,
    })
  ).toEqual(undefined)
  expect(player).toEqual(expected)

  expect(scorchUnitsInRowSpy.mock.calls).toEqual(scorchUnitsInRowCalls)
  expect(debugSpy.mock.calls).toEqual(debugCalls)
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
