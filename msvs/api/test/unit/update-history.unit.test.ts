import { ObjectId } from 'mongodb'

import {
  Combat,
  DeckUnitDbObject,
  FieldUnitDbObject,
  GameDbObject,
  GameUnitDbObject,
  GameUnitOrigin,
  ImpactDbObject,
  MoveDbObject,
  MoveReasonType,
  MoveUnitDbObject,
  MoveUnitReasonDbObject,
} from '@gwent-oss/graphql-schema/database-typings'
import deepClone from '../util/deep-clone'
import { EffectReasonType, GameUnitType, MoveType } from '@gwent-oss/graphql-schema'
import GetFieldUnits from '../../src/graphql/resolvers/util/get-field-units'
import { ImpactsByUnitId } from '../../src/graphql/resolvers/resolver-util'
import { MusteredOrigins } from '../../src/graphql/resolvers/mutations/play-unit/effect-muster'
import PresentableError from '../../src/util/presentable-error'
import TestUtil from '../util/test-util'
import UpdateHistory from '../../src/graphql/resolvers/mutations/util/update-history'

describe('update-history', () => {
  describe('newUnitDeployed', () => {
    const logPrefix = 'log-prefix'
    it('throws error if musters without origin', () => {
      const deckUnit = TestUtil.getDbDeckUnit({})
      const musters = {
        [deckUnit.unit.toString()]: [],
      }
      const message = 'No origins provided for musters'
      testNewUnitDeployed({
        deckUnit,
        musters,
        logPrefix,
        error: Error(`${message}.`),
        expectedImpacts: [],
        errorCalls: [[`${logPrefix} failed: ${message}, musters: "${JSON.stringify(musters)}"`]],
      })
    })
    it('throws error if muster does not have unit', () => {
      const deckUnit = TestUtil.getDbDeckUnit({})
      const impact: ImpactDbObject = {
        user: new ObjectId(),
      }
      const musters = {
        [deckUnit.unit.toString()]: [impact],
      }
      const message = 'No unit provided for muster'
      testNewUnitDeployed({
        deckUnit,
        musters,
        musteredOrigins: {},
        logPrefix,
        error: Error(`${message}.`),
        expectedImpacts: [impact],
        errorCalls: [[`${logPrefix} failed: ${message}, musters: "${JSON.stringify(musters)}"`]],
      })
    })
    it('throws error if mustered unit does not have origin', () => {
      const musteredUnit = TestUtil.getDbFieldUnit({})
      const deckUnit = TestUtil.getDbDeckUnit({})
      const impact: ImpactDbObject = {
        unit: TestUtil.convertFieldDbUnitToGameDbUnit(musteredUnit),
        user: new ObjectId(),
      }
      const musters = {
        [deckUnit.unit.toString()]: [impact],
      }
      const message = `Could not find origin for mustered unit "${musteredUnit.unit}"`
      testNewUnitDeployed({
        deckUnit,
        musters,
        musteredOrigins: {},
        logPrefix,
        error: Error(`${message}.`),
        expectedImpacts: [impact],
        errorCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('calls addMoveToPlayer once without impacts close', () => {
      testNewUnitDeployed({
        logPrefix,
      })
    })
    it('calls addMoveToPlayer once without impacts ranged', () => {
      testNewUnitDeployed({
        combat: Combat.Ranged,
        logPrefix,
      })
    })
    it('calls addMoveToPlayer once without impacts siege', () => {
      testNewUnitDeployed({
        combat: Combat.Siege,
        logPrefix,
      })
    })
    it('calls addMoveToPlayer once with scorch impact', () => {
      const deckUnit = TestUtil.getDbDeckUnit({})
      const impact: ImpactDbObject = {
        unit: TestUtil.getDbGameUnit({}),
        user: new ObjectId(),
      }
      testNewUnitDeployed({
        deckUnit,
        scorches: {
          [deckUnit.unit.toString()]: [impact],
        },
        logPrefix,
        expectedImpacts: [impact],
      })
    })
    it('calls addMoveToPlayer once with morale impact', () => {
      const deckUnit = TestUtil.getDbDeckUnit({})
      const impact: ImpactDbObject = {
        unit: TestUtil.getDbGameUnit({}),
        user: new ObjectId(),
      }
      testNewUnitDeployed({
        deckUnit,
        morales: {
          [deckUnit.unit.toString()]: [impact],
        },
        logPrefix,
        expectedImpacts: [impact],
      })
    })
    it('calls addMoveToPlayer once with bond impact', () => {
      const deckUnit = TestUtil.getDbDeckUnit({})
      const impact: ImpactDbObject = {
        unit: TestUtil.getDbGameUnit({}),
        user: new ObjectId(),
      }
      testNewUnitDeployed({
        deckUnit,
        bonds: {
          [deckUnit.unit.toString()]: [impact],
        },
        logPrefix,
        expectedImpacts: [impact],
      })
    })
    it('calls addMoveToPlayer once with horn impact', () => {
      const deckUnit = TestUtil.getDbDeckUnit({})
      const impact: ImpactDbObject = {
        unit: TestUtil.getDbGameUnit({}),
        user: new ObjectId(),
      }
      testNewUnitDeployed({
        deckUnit,
        horns: {
          [deckUnit.unit.toString()]: [impact],
        },
        logPrefix,
        expectedImpacts: [impact],
      })
    })
    it('calls addMoveToPlayer once with decoy impact', () => {
      const deckUnit = TestUtil.getDbDeckUnit({})
      const impact: ImpactDbObject = {
        unit: TestUtil.getDbGameUnit({}),
        user: new ObjectId(),
      }
      testNewUnitDeployed({
        deckUnit,
        decoys: {
          [deckUnit.unit.toString()]: [impact],
        },
        logPrefix,
        expectedImpacts: [impact],
      })
    })
    it('calls addMoveToPlayer once with spy impact', () => {
      const deckUnit = TestUtil.getDbDeckUnit({})
      const impact: ImpactDbObject = {
        unit: TestUtil.getDbGameUnit({}),
        user: new ObjectId(),
      }
      testNewUnitDeployed({
        deckUnit,
        spies: {
          [deckUnit.unit.toString()]: [impact],
        },
        logPrefix,
        targetId: new ObjectId().toString(),
        expectedImpacts: [impact],
      })
    })
    it('calls addMoveToPlayer once with medic impact', () => {
      const deckUnit = TestUtil.getDbDeckUnit({})
      const impact: ImpactDbObject = {
        unit: TestUtil.getDbGameUnit({}),
        user: new ObjectId(),
      }
      testNewUnitDeployed({
        deckUnit,
        medics: {
          [deckUnit.unit.toString()]: [impact],
        },
        logPrefix,
        targetId: new ObjectId().toString(),
        expectedImpacts: [impact],
      })
    })
    it('sets move reason unit if medicingUnit', () => {
      const deckUnit = TestUtil.getDbDeckUnit({})
      testNewUnitDeployed({
        deckUnit,
        medicingUnit: TestUtil.getDbGameUnit({}),
        logPrefix,
      })
    })
    it('calls addMoveToPlayer once with weather impact', () => {
      const deckUnit = TestUtil.getDbDeckUnit({})
      const impact: ImpactDbObject = {
        unit: TestUtil.getDbGameUnit({}),
        user: new ObjectId(),
      }
      testNewUnitDeployed({
        deckUnit,
        weathers: {
          [deckUnit.unit.toString()]: [impact],
        },
        logPrefix,
        expectedImpacts: [impact],
      })
    })
    it('calls to addMoveToPlayer for single valid muster without own impact', () => {
      const musteredUnit = TestUtil.getDbFieldUnit({})
      const deckUnit = TestUtil.getDbDeckUnit({})
      const impact: ImpactDbObject = {
        unit: TestUtil.convertFieldDbUnitToGameDbUnit(musteredUnit),
        user: new ObjectId(),
      }
      const musters = {
        [deckUnit.unit.toString()]: [impact],
      }
      testNewUnitDeployed({
        logPrefix,
        deckUnit,
        musters,
        musteredOrigins: {
          [musteredUnit.unit.toString()]: GameUnitOrigin.Hand,
        },
        expectedImpacts: [impact],
      })
    })
    it('calls to addMoveToPlayer for single valid muster with own impact', () => {
      const musteredUnit = TestUtil.getDbFieldUnit({})
      const deckUnit = TestUtil.getDbDeckUnit({})
      const impact1: ImpactDbObject = {
        unit: TestUtil.convertFieldDbUnitToGameDbUnit(musteredUnit),
        user: new ObjectId(),
      }
      const impact2: ImpactDbObject = {
        unit: TestUtil.getDbGameUnit({}),
        user: new ObjectId(),
      }
      const musters = {
        [deckUnit.unit.toString()]: [impact1],
      }
      const bonds = {
        [musteredUnit.unit.toString()]: [impact2],
      }
      testNewUnitDeployed({
        deckUnit,
        musters,
        musteredOrigins: {
          [musteredUnit.unit.toString()]: GameUnitOrigin.Hand,
        },
        bonds,
        expectedImpacts: [impact1],
        logPrefix,
      })
    })
    it('calls to addMoveToPlayer for multiple valid musters', () => {
      const musteredUnit1 = TestUtil.getDbFieldUnit({})
      const musteredUnit2 = TestUtil.getDbFieldUnit({})
      const deckUnit = TestUtil.getDbDeckUnit({})
      const impact1: ImpactDbObject = {
        unit: TestUtil.convertFieldDbUnitToGameDbUnit(musteredUnit1),
        user: new ObjectId(),
      }
      const impact2: ImpactDbObject = {
        unit: TestUtil.convertFieldDbUnitToGameDbUnit(musteredUnit2),
        user: new ObjectId(),
      }
      const musters = {
        [deckUnit.unit.toString()]: [impact1, impact2],
      }
      testNewUnitDeployed({
        deckUnit,
        musters,
        musteredOrigins: {
          [musteredUnit2.unit.toString()]: GameUnitOrigin.Undrawn,
          [musteredUnit1.unit.toString()]: GameUnitOrigin.Hand,
        },
        logPrefix,
        expectedImpacts: [impact1, impact2],
      })
    })
    it('calls to addMoveToPlayer for single mardroeme without mardroemingFieldUnit', () => {
      const mardroeming = TestUtil.getDbFieldUnit({})
      const deckUnit = TestUtil.getDbDeckUnit({})
      const impact: ImpactDbObject = {
        unit: TestUtil.convertFieldDbUnitToGameDbUnit(mardroeming),
        user: new ObjectId(),
      }
      const mardroemes = {
        [deckUnit.unit.toString()]: [impact],
      }
      testNewUnitDeployed({
        logPrefix,
        deckUnit,
        mardroemes,
        transformedFieldUnits: [
          TestUtil.getDbFieldUnit({
            id: impact.unit?.unit,
          }),
        ],
        expectedImpacts: [impact],
      })
    })
    it('calls to addMoveToPlayer for single mardroeme with mardroemingFieldUnit', () => {
      const mardroeming = TestUtil.getDbFieldUnit({})
      const deckUnit = TestUtil.getDbDeckUnit({})
      const impact: ImpactDbObject = {
        unit: TestUtil.convertFieldDbUnitToGameDbUnit(mardroeming),
        user: new ObjectId(),
      }
      const mardroemes = {
        [deckUnit.unit.toString()]: [impact],
      }
      testNewUnitDeployed({
        logPrefix,
        deckUnit,
        mardroemes,
        mardroemingFieldUnit: mardroeming,
        transformedFieldUnits: [
          TestUtil.getDbFieldUnit({
            id: impact.unit?.unit,
          }),
        ],
        expectedImpacts: [impact],
      })
    })
    it('calls to addMoveToPlayer for single valid avenger', () => {
      const avengedUnit = TestUtil.getDbFieldUnit({})
      const deckUnit = TestUtil.getDbDeckUnit({})
      const impact: ImpactDbObject = {
        unit: TestUtil.convertFieldDbUnitToGameDbUnit(avengedUnit),
        user: new ObjectId(),
      }
      const avengers = {
        [deckUnit.unit.toString()]: [impact],
      }
      testNewUnitDeployed({
        logPrefix,
        deckUnit,
        avengers,
        expectedImpacts: [impact],
      })
    })
    it('calls to addMoveToPlayer for multiple valid avengers', () => {
      const avengedUnit1 = TestUtil.getDbFieldUnit({})
      const avengedUnit2 = TestUtil.getDbFieldUnit({})
      const deckUnit = TestUtil.getDbDeckUnit({})
      const impact1: ImpactDbObject = {
        unit: TestUtil.convertFieldDbUnitToGameDbUnit(avengedUnit1),
        user: new ObjectId(),
      }
      const impact2: ImpactDbObject = {
        unit: TestUtil.convertFieldDbUnitToGameDbUnit(avengedUnit2),
        user: new ObjectId(),
      }
      const avengers = {
        [deckUnit.unit.toString()]: [impact1, impact2],
      }
      testNewUnitDeployed({
        deckUnit,
        avengers,
        logPrefix,
        expectedImpacts: [impact1, impact2],
      })
    })
  })
  describe('newUnitIndirect', () => {
    const logPrefix = 'log-prefix'
    it('throws error if unit not found on battlefield', () => {
      const unitId = new ObjectId()
      const message = `Could not find indirect unit "${unitId}" on battlefield`
      testNewUnitIndirect({
        game: TestUtil.getDbGame({}),
        unitId,
        created: new Date(),
        logPrefix,
        origin: GameUnitOrigin.Nondeck,
        playerId: new ObjectId().toString(),
        reason: {
          type: MoveReasonType.Muster,
        },
        getFieldUnitResponse: undefined,
        error: Error(`${message}.`),
        errorCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('calls to addMoveToPlayer without impact', () => {
      const combat = Combat.Close
      const fieldUnit = TestUtil.getDbFieldUnit({
        row: combat,
      })
      const move: MoveUnitDbObject = {
        created: new Date(),
        reason: {
          type: MoveReasonType.Muster,
        },
        source: {
          origin: GameUnitOrigin.Hand,
        },
        type: MoveType.Unit,
        unit: TestUtil.getDbGameUnit({
          artStyle: fieldUnit.artStyle,
          effectiveStrength: fieldUnit.effectiveStrength,
          id: fieldUnit.unit,
          row: fieldUnit.row as Combat,
        }),
      }
      testNewUnitIndirect({
        game: TestUtil.getDbGame({}),
        unitId: move.unit.unit,
        created: move.created,
        logPrefix,
        origin: move.source.origin as GameUnitOrigin,
        playerId: new ObjectId().toString(),
        reason: move.reason,
        getFieldUnitResponse: fieldUnit,
        move,
      })
    })
    it('calls to addMoveToPlayer with turnUserId', () => {
      const turnUserId = new ObjectId()
      const combat = Combat.Close
      const fieldUnit = TestUtil.getDbFieldUnit({
        row: combat,
      })
      const move: MoveUnitDbObject = {
        created: new Date(),
        reason: {
          type: MoveReasonType.Muster,
        },
        source: {
          origin: GameUnitOrigin.Hand,
        },
        type: MoveType.Unit,
        unit: TestUtil.getDbGameUnit({
          artStyle: fieldUnit.artStyle,
          effectiveStrength: fieldUnit.effectiveStrength,
          id: fieldUnit.unit,
          row: fieldUnit.row as Combat,
        }),
        impacts: undefined,
      }
      testNewUnitIndirect({
        game: TestUtil.getDbGame({}),
        unitId: move.unit.unit,
        created: move.created,
        turnUserId,
        logPrefix,
        origin: move.source.origin as GameUnitOrigin,
        playerId: new ObjectId().toString(),
        reason: move.reason,
        getFieldUnitResponse: fieldUnit,
        move,
      })
    })
    it('calls to addMoveToPlayer with avenger impact', () => {
      const combat = Combat.Close
      const fieldUnit = TestUtil.getDbFieldUnit({
        row: combat,
      })
      const impact: ImpactDbObject = {
        unit: TestUtil.getDbGameUnit({}),
        user: new ObjectId(),
      }
      const move: MoveUnitDbObject = {
        created: new Date(),
        reason: {
          type: MoveReasonType.Muster,
        },
        source: {
          origin: GameUnitOrigin.Hand,
        },
        type: MoveType.Unit,
        unit: TestUtil.getDbGameUnit({
          id: fieldUnit.unit,
          row: combat,
        }),
        impacts: [impact],
      }
      testNewUnitIndirect({
        game: TestUtil.getDbGame({}),
        unitId: move.unit.unit,
        created: move.created,
        logPrefix,
        origin: move.source.origin as GameUnitOrigin,
        playerId: new ObjectId().toString(),
        reason: move.reason,
        getFieldUnitResponse: fieldUnit,
        avengers: {
          [move.unit.unit.toString()]: [impact],
        },
        move,
      })
    })
    it('calls to addMoveToPlayer with scorch impact', () => {
      const combat = Combat.Close
      const fieldUnit = TestUtil.getDbFieldUnit({
        row: combat,
      })
      const impact: ImpactDbObject = {
        unit: TestUtil.getDbGameUnit({}),
        user: new ObjectId(),
      }
      const move: MoveUnitDbObject = {
        created: new Date(),
        reason: {
          type: MoveReasonType.Muster,
        },
        source: {
          origin: GameUnitOrigin.Hand,
        },
        type: MoveType.Unit,
        unit: TestUtil.getDbGameUnit({
          id: fieldUnit.unit,
          row: combat,
        }),
        impacts: [impact],
      }
      testNewUnitIndirect({
        game: TestUtil.getDbGame({}),
        unitId: move.unit.unit,
        created: move.created,
        logPrefix,
        origin: move.source.origin as GameUnitOrigin,
        playerId: new ObjectId().toString(),
        reason: move.reason,
        getFieldUnitResponse: fieldUnit,
        scorches: {
          [move.unit.unit.toString()]: [impact],
        },
        move,
      })
    })
    it('calls to addMoveToPlayer with mardroeme impact', () => {
      const combat = Combat.Close
      const fieldUnit = TestUtil.getDbFieldUnit({
        row: combat,
      })
      const impact: ImpactDbObject = {
        unit: TestUtil.getDbGameUnit({}),
        user: new ObjectId(),
      }
      const move: MoveUnitDbObject = {
        created: new Date(),
        reason: {
          type: MoveReasonType.Muster,
        },
        source: {
          origin: GameUnitOrigin.Hand,
        },
        type: MoveType.Unit,
        unit: TestUtil.getDbGameUnit({
          id: fieldUnit.unit,
          row: combat,
        }),
        impacts: [impact],
      }
      testNewUnitIndirect({
        game: TestUtil.getDbGame({}),
        unitId: move.unit.unit,
        created: move.created,
        logPrefix,
        origin: move.source.origin as GameUnitOrigin,
        playerId: new ObjectId().toString(),
        reason: move.reason,
        getFieldUnitResponse: fieldUnit,
        mardroemes: {
          [move.unit.unit.toString()]: [impact],
        },
        move,
      })
    })
    it('calls to addMoveToPlayer with muster impact', () => {
      const combat = Combat.Close
      const fieldUnit = TestUtil.getDbFieldUnit({
        row: combat,
      })
      const impact: ImpactDbObject = {
        unit: TestUtil.getDbGameUnit({}),
        user: new ObjectId(),
      }
      const move: MoveUnitDbObject = {
        created: new Date(),
        reason: {
          type: MoveReasonType.Muster,
        },
        source: {
          origin: GameUnitOrigin.Hand,
        },
        type: MoveType.Unit,
        unit: TestUtil.getDbGameUnit({
          id: fieldUnit.unit,
          row: combat,
        }),
        impacts: [impact],
      }
      testNewUnitIndirect({
        game: TestUtil.getDbGame({}),
        unitId: move.unit.unit,
        created: move.created,
        logPrefix,
        origin: move.source.origin as GameUnitOrigin,
        playerId: new ObjectId().toString(),
        reason: move.reason,
        getFieldUnitResponse: fieldUnit,
        musters: {
          [move.unit.unit.toString()]: [impact],
        },
        move,
      })
    })
    it('calls to addMoveToPlayer with bond impact', () => {
      const combat = Combat.Close
      const fieldUnit = TestUtil.getDbFieldUnit({
        row: combat,
      })
      const impact: ImpactDbObject = {
        unit: TestUtil.getDbGameUnit({}),
        user: new ObjectId(),
      }
      const move: MoveUnitDbObject = {
        created: new Date(),
        reason: {
          type: MoveReasonType.Muster,
        },
        source: {
          origin: GameUnitOrigin.Hand,
        },
        type: MoveType.Unit,
        unit: TestUtil.getDbGameUnit({
          id: fieldUnit.unit,
          row: combat,
        }),
        impacts: [impact],
      }
      testNewUnitIndirect({
        game: TestUtil.getDbGame({}),
        unitId: move.unit.unit,
        created: move.created,
        logPrefix,
        origin: move.source.origin as GameUnitOrigin,
        playerId: new ObjectId().toString(),
        reason: move.reason,
        getFieldUnitResponse: fieldUnit,
        bonds: {
          [move.unit.unit.toString()]: [impact],
        },
        move,
      })
    })
    it('calls to addMoveToPlayer with horn impact', () => {
      const combat = Combat.Close
      const fieldUnit = TestUtil.getDbFieldUnit({
        row: combat,
      })
      const impact: ImpactDbObject = {
        unit: TestUtil.getDbGameUnit({}),
        user: new ObjectId(),
      }
      const move: MoveUnitDbObject = {
        created: new Date(),
        reason: {
          type: MoveReasonType.Muster,
        },
        source: {
          origin: GameUnitOrigin.Hand,
        },
        type: MoveType.Unit,
        unit: TestUtil.getDbGameUnit({
          id: fieldUnit.unit,
          row: combat,
        }),
        impacts: [impact],
      }
      testNewUnitIndirect({
        game: TestUtil.getDbGame({}),
        unitId: move.unit.unit,
        created: move.created,
        logPrefix,
        origin: move.source.origin as GameUnitOrigin,
        playerId: new ObjectId().toString(),
        reason: move.reason,
        getFieldUnitResponse: fieldUnit,
        horns: {
          [move.unit.unit.toString()]: [impact],
        },
        move,
      })
    })
    it('calls to addMoveToPlayer with decoy impact', () => {
      const combat = Combat.Close
      const fieldUnit = TestUtil.getDbFieldUnit({
        row: combat,
      })
      const impact: ImpactDbObject = {
        unit: TestUtil.getDbGameUnit({}),
        user: new ObjectId(),
      }
      const move: MoveUnitDbObject = {
        created: new Date(),
        reason: {
          type: MoveReasonType.Muster,
        },
        source: {
          origin: GameUnitOrigin.Hand,
        },
        type: MoveType.Unit,
        unit: TestUtil.getDbGameUnit({
          id: fieldUnit.unit,
          row: combat,
        }),
        impacts: [impact],
      }
      testNewUnitIndirect({
        game: TestUtil.getDbGame({}),
        unitId: move.unit.unit,
        created: move.created,
        logPrefix,
        origin: move.source.origin as GameUnitOrigin,
        playerId: new ObjectId().toString(),
        reason: move.reason,
        getFieldUnitResponse: fieldUnit,
        decoys: {
          [move.unit.unit.toString()]: [impact],
        },
        move,
      })
    })
    it('calls to addMoveToPlayer with weather impact', () => {
      const combat = Combat.Close
      const fieldUnit = TestUtil.getDbFieldUnit({
        row: combat,
      })
      const impact: ImpactDbObject = {
        unit: TestUtil.getDbGameUnit({}),
        user: new ObjectId(),
      }
      const move: MoveUnitDbObject = {
        created: new Date(),
        reason: {
          type: MoveReasonType.Muster,
        },
        source: {
          origin: GameUnitOrigin.Hand,
        },
        type: MoveType.Unit,
        unit: TestUtil.getDbGameUnit({
          id: fieldUnit.unit,
          row: combat,
        }),
        impacts: [impact],
      }
      testNewUnitIndirect({
        game: TestUtil.getDbGame({}),
        unitId: move.unit.unit,
        created: move.created,
        logPrefix,
        origin: move.source.origin as GameUnitOrigin,
        playerId: new ObjectId().toString(),
        reason: move.reason,
        getFieldUnitResponse: fieldUnit,
        weathers: {
          [move.unit.unit.toString()]: [impact],
        },
        move,
      })
    })
    it('calls to addMoveToPlayer with morale impact', () => {
      const combat = Combat.Close
      const fieldUnit = TestUtil.getDbFieldUnit({
        row: combat,
      })
      const impact: ImpactDbObject = {
        unit: TestUtil.getDbGameUnit({}),
        user: new ObjectId(),
      }
      const move: MoveUnitDbObject = {
        created: new Date(),
        reason: {
          type: MoveReasonType.Muster,
        },
        source: {
          origin: GameUnitOrigin.Hand,
        },
        type: MoveType.Unit,
        unit: TestUtil.getDbGameUnit({
          id: fieldUnit.unit,
          row: combat,
        }),
        impacts: [impact],
      }
      testNewUnitIndirect({
        game: TestUtil.getDbGame({}),
        unitId: move.unit.unit,
        created: move.created,
        logPrefix,
        origin: move.source.origin as GameUnitOrigin,
        playerId: new ObjectId().toString(),
        reason: move.reason,
        getFieldUnitResponse: fieldUnit,
        morales: {
          [move.unit.unit.toString()]: [impact],
        },
        move,
      })
    })
  })
  describe('addMoveToPlayer', () => {
    const logPrefix = 'log-prefix'
    describe('self', () => {
      it('throws error if player not found', () => {
        const userId = new ObjectId()
        const game = TestUtil.getDbGame({
          players: [TestUtil.getDbGamePlayer({})],
          turn: new ObjectId(),
        })
        const move = TestUtil.getDbMove({
          type: MoveType.Unit,
        })
        const message = `Could not find player "${userId}" on game "${game._id}" to add move to`
        testAddMoveToPlayer({
          game,
          move,
          playerId: userId,
          logPrefix,
          error: new PresentableError(`${message}.`),
          errorCalls: [[`${logPrefix} failed: ${message}, game: "${JSON.stringify(game)}"`]],
        })
      })
      it('appends move without other moves in first round', () => {
        const self = TestUtil.getDbGamePlayer({
          deck: TestUtil.getDbGameDeck({
            from: TestUtil.getDbDeck({}),
          }),
          order: 0,
          ready: true,
          rounds: [TestUtil.getDbPlayerRound({})],
          user: new ObjectId(),
        })
        const opponent = TestUtil.getDbGamePlayer({
          deck: TestUtil.getDbGameDeck({
            from: TestUtil.getDbDeck({}),
          }),
          order: 1,
          ready: true,
          rounds: [TestUtil.getDbPlayerRound({})],
          user: new ObjectId(),
        })
        const game = TestUtil.getDbGame({
          players: [self, opponent],
          round: 1,
          turn: new ObjectId(),
        })
        const origGame = deepClone(game)
        const move: MoveUnitDbObject = {
          created: new Date(),
          type: MoveType.Unit,
          unit: TestUtil.getDbGameUnit({}),
          reason: {
            type: MoveReasonType.Deploy,
          },
          source: {
            origin: GameUnitOrigin.Hand,
          },
        }

        testAddMoveToPlayer({
          game,
          move,
          logPrefix,
          playerId: self.user,
          updatedGame: {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                rounds: [
                  {
                    ...origGame.players[0].rounds[0],
                    moves: [move],
                  },
                ],
              },
              origGame.players[1],
            ],
          },
        })
      })
      it('appends move after other moves in first round', () => {
        const oldMove: MoveUnitDbObject = {
          created: new Date(),
          type: MoveType.Unit,
          unit: TestUtil.getDbGameUnit({}),
          reason: {
            type: MoveReasonType.Deploy,
          },
          source: {
            origin: GameUnitOrigin.Hand,
          },
        }
        const self = TestUtil.getDbGamePlayer({
          deck: TestUtil.getDbGameDeck({
            from: TestUtil.getDbDeck({}),
          }),
          order: 0,
          ready: true,
          rounds: [
            TestUtil.getDbPlayerRound({
              moves: [oldMove],
            }),
          ],
          user: new ObjectId(),
        })
        const opponent = TestUtil.getDbGamePlayer({
          deck: TestUtil.getDbGameDeck({
            from: TestUtil.getDbDeck({}),
          }),
          order: 1,
          ready: true,
          rounds: [TestUtil.getDbPlayerRound({})],
          user: new ObjectId(),
        })
        const game = TestUtil.getDbGame({
          players: [self, opponent],
          round: 1,
          turn: new ObjectId(),
        })
        const origGame = deepClone(game)
        const move: MoveUnitDbObject = {
          created: new Date(),
          type: MoveType.Unit,
          unit: TestUtil.getDbGameUnit({}),
          reason: {
            type: MoveReasonType.Deploy,
          },
          source: {
            origin: GameUnitOrigin.Hand,
          },
        }

        testAddMoveToPlayer({
          game,
          move,
          logPrefix,
          playerId: self.user,
          updatedGame: {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                rounds: [
                  {
                    ...origGame.players[0].rounds[0],
                    moves: [oldMove, move],
                  },
                ],
              },
              origGame.players[1],
            ],
          },
        })
      })
      it('appends move without other moves in second round', () => {
        const self = TestUtil.getDbGamePlayer({
          deck: TestUtil.getDbGameDeck({
            from: TestUtil.getDbDeck({}),
          }),
          order: 0,
          ready: true,
          rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          user: new ObjectId(),
        })
        const opponent = TestUtil.getDbGamePlayer({
          deck: TestUtil.getDbGameDeck({
            from: TestUtil.getDbDeck({}),
          }),
          order: 1,
          ready: true,
          rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          user: new ObjectId(),
        })
        const game = TestUtil.getDbGame({
          players: [self, opponent],
          round: 2,
          turn: new ObjectId(),
        })
        const origGame = deepClone(game)
        const move: MoveUnitDbObject = {
          created: new Date(),
          type: MoveType.Unit,
          unit: TestUtil.getDbGameUnit({}),
          reason: {
            type: MoveReasonType.Deploy,
          },
          source: {
            origin: GameUnitOrigin.Hand,
          },
        }

        testAddMoveToPlayer({
          game,
          move,
          logPrefix,
          playerId: self.user,
          updatedGame: {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                rounds: [
                  origGame.players[0].rounds[0],
                  {
                    ...origGame.players[0].rounds[1],
                    moves: [move],
                  },
                ],
              },
              origGame.players[1],
            ],
          },
        })
      })
      it('appends move after other moves in second round', () => {
        const oldMove: MoveUnitDbObject = {
          created: new Date(),
          type: MoveType.Unit,
          unit: TestUtil.getDbGameUnit({}),
          reason: {
            type: MoveReasonType.Deploy,
          },
          source: {
            origin: GameUnitOrigin.Hand,
          },
        }
        const self = TestUtil.getDbGamePlayer({
          deck: TestUtil.getDbGameDeck({
            from: TestUtil.getDbDeck({}),
          }),
          order: 0,
          ready: true,
          rounds: [
            TestUtil.getDbPlayerRound({}),
            TestUtil.getDbPlayerRound({
              moves: [oldMove],
            }),
          ],
          user: new ObjectId(),
        })
        const opponent = TestUtil.getDbGamePlayer({
          deck: TestUtil.getDbGameDeck({
            from: TestUtil.getDbDeck({}),
          }),
          order: 1,
          ready: true,
          rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          user: new ObjectId(),
        })
        const game = TestUtil.getDbGame({
          players: [self, opponent],
          round: 2,
          turn: new ObjectId(),
        })
        const origGame = deepClone(game)
        const move: MoveUnitDbObject = {
          created: new Date(),
          type: MoveType.Unit,
          unit: TestUtil.getDbGameUnit({}),
          reason: {
            type: MoveReasonType.Deploy,
          },
          source: {
            origin: GameUnitOrigin.Hand,
          },
        }

        testAddMoveToPlayer({
          game,
          move,
          logPrefix,
          playerId: self.user,
          updatedGame: {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                rounds: [
                  origGame.players[0].rounds[0],
                  {
                    ...origGame.players[0].rounds[1],
                    moves: [oldMove, move],
                  },
                ],
              },
              origGame.players[1],
            ],
          },
        })
      })
    })
    describe('opponent', () => {
      it('appends move without other moves in first round', () => {
        const self = TestUtil.getDbGamePlayer({
          deck: TestUtil.getDbGameDeck({
            from: TestUtil.getDbDeck({}),
          }),
          order: 0,
          ready: true,
          rounds: [TestUtil.getDbPlayerRound({})],
          user: new ObjectId(),
        })
        const opponent = TestUtil.getDbGamePlayer({
          deck: TestUtil.getDbGameDeck({
            from: TestUtil.getDbDeck({}),
          }),
          order: 1,
          ready: true,
          rounds: [TestUtil.getDbPlayerRound({})],
          user: new ObjectId(),
        })
        const game = TestUtil.getDbGame({
          players: [self, opponent],
          round: 1,
          turn: new ObjectId(),
        })
        const origGame = deepClone(game)
        const move: MoveUnitDbObject = {
          created: new Date(),
          type: MoveType.Unit,
          unit: TestUtil.getDbGameUnit({}),
          reason: {
            type: MoveReasonType.Deploy,
          },
          source: {
            origin: GameUnitOrigin.Hand,
          },
        }

        testAddMoveToPlayer({
          game,
          move,
          logPrefix,
          playerId: opponent.user,
          updatedGame: {
            ...origGame,
            players: [
              origGame.players[0],
              {
                ...origGame.players[1],
                rounds: [
                  {
                    ...origGame.players[1].rounds[0],
                    moves: [move],
                  },
                ],
              },
            ],
          },
        })
      })
      it('appends move after other moves in first round', () => {
        const oldMove: MoveUnitDbObject = {
          created: new Date(),
          type: MoveType.Unit,
          unit: TestUtil.getDbGameUnit({}),
          reason: {
            type: MoveReasonType.Deploy,
          },
          source: {
            origin: GameUnitOrigin.Hand,
          },
        }
        const self = TestUtil.getDbGamePlayer({
          deck: TestUtil.getDbGameDeck({
            from: TestUtil.getDbDeck({}),
          }),
          order: 0,
          ready: true,
          rounds: [TestUtil.getDbPlayerRound({})],
          user: new ObjectId(),
        })
        const opponent = TestUtil.getDbGamePlayer({
          deck: TestUtil.getDbGameDeck({
            from: TestUtil.getDbDeck({}),
          }),
          order: 1,
          ready: true,
          rounds: [
            TestUtil.getDbPlayerRound({
              moves: [oldMove],
            }),
          ],
          user: new ObjectId(),
        })
        const game = TestUtil.getDbGame({
          players: [self, opponent],
          round: 1,
          turn: new ObjectId(),
        })
        const origGame = deepClone(game)
        const move: MoveUnitDbObject = {
          created: new Date(),
          type: MoveType.Unit,
          unit: TestUtil.getDbGameUnit({}),
          reason: {
            type: MoveReasonType.Deploy,
          },
          source: {
            origin: GameUnitOrigin.Hand,
          },
        }

        testAddMoveToPlayer({
          game,
          move,
          logPrefix,
          playerId: opponent.user,
          updatedGame: {
            ...origGame,
            players: [
              origGame.players[0],
              {
                ...origGame.players[1],
                rounds: [
                  {
                    ...origGame.players[1].rounds[0],
                    moves: [oldMove, move],
                  },
                ],
              },
            ],
          },
        })
      })
      it('appends move without other moves in second round', () => {
        const self = TestUtil.getDbGamePlayer({
          deck: TestUtil.getDbGameDeck({
            from: TestUtil.getDbDeck({}),
          }),
          order: 0,
          ready: true,
          rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          user: new ObjectId(),
        })
        const opponent = TestUtil.getDbGamePlayer({
          deck: TestUtil.getDbGameDeck({
            from: TestUtil.getDbDeck({}),
          }),
          order: 1,
          ready: true,
          rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          user: new ObjectId(),
        })
        const game = TestUtil.getDbGame({
          players: [self, opponent],
          round: 2,
          turn: new ObjectId(),
        })
        const origGame = deepClone(game)
        const move: MoveUnitDbObject = {
          created: new Date(),
          type: MoveType.Unit,
          unit: TestUtil.getDbGameUnit({}),
          reason: {
            type: MoveReasonType.Deploy,
          },
          source: {
            origin: GameUnitOrigin.Hand,
          },
        }

        testAddMoveToPlayer({
          game,
          move,
          logPrefix,
          playerId: opponent.user,
          updatedGame: {
            ...origGame,
            players: [
              origGame.players[0],
              {
                ...origGame.players[1],
                rounds: [
                  origGame.players[1].rounds[0],
                  {
                    ...origGame.players[1].rounds[1],
                    moves: [move],
                  },
                ],
              },
            ],
          },
        })
      })
      it('appends move after other moves in second round', () => {
        const oldMove: MoveUnitDbObject = {
          created: new Date(),
          type: MoveType.Unit,
          unit: TestUtil.getDbGameUnit({}),
          reason: {
            type: MoveReasonType.Deploy,
          },
          source: {
            origin: GameUnitOrigin.Hand,
          },
        }
        const self = TestUtil.getDbGamePlayer({
          deck: TestUtil.getDbGameDeck({
            from: TestUtil.getDbDeck({}),
          }),
          order: 0,
          ready: true,
          rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          user: new ObjectId(),
        })
        const opponent = TestUtil.getDbGamePlayer({
          deck: TestUtil.getDbGameDeck({
            from: TestUtil.getDbDeck({}),
          }),
          order: 1,
          ready: true,
          rounds: [
            TestUtil.getDbPlayerRound({}),
            TestUtil.getDbPlayerRound({
              moves: [oldMove],
            }),
          ],
          user: new ObjectId(),
        })
        const game = TestUtil.getDbGame({
          players: [self, opponent],
          round: 2,
          turn: new ObjectId(),
        })
        const origGame = deepClone(game)
        const move: MoveUnitDbObject = {
          created: new Date(),
          type: MoveType.Unit,
          unit: TestUtil.getDbGameUnit({}),
          reason: {
            type: MoveReasonType.Deploy,
          },
          source: {
            origin: GameUnitOrigin.Hand,
          },
        }

        testAddMoveToPlayer({
          game,
          move,
          logPrefix,
          playerId: opponent.user,
          updatedGame: {
            ...origGame,
            players: [
              origGame.players[0],
              {
                ...origGame.players[1],
                rounds: [
                  origGame.players[1].rounds[0],
                  {
                    ...origGame.players[1].rounds[1],
                    moves: [oldMove, move],
                  },
                ],
              },
            ],
          },
        })
      })
    })
  })
  describe('getMoveGameUnit', () => {
    it('returns Deck type if not weather or row', () => {
      const deckUnit = TestUtil.getDbDeckUnit({})
      testGetMoveGameUnit({
        deckUnit,
        expected: {
          ...deckUnit,
          type: GameUnitType.Deck,
        },
      })
    })
    it('returns Weather type if isWeather true', () => {
      const deckUnit = TestUtil.getDbDeckUnit({})
      testGetMoveGameUnit({
        deckUnit,
        isWeather: true,
        expected: {
          ...deckUnit,
          type: GameUnitType.Weather,
        },
      })
    })
    it('returns Field type if combat provided', () => {
      const deckUnit = TestUtil.getDbDeckUnit({})
      const combat = Combat.Close
      testGetMoveGameUnit({
        deckUnit,
        combat,
        expected: {
          ...deckUnit,
          row: combat,
          effectiveStrength: undefined,
          effects: undefined,
          type: GameUnitType.Field,
        },
      })
    })
    it('returns Field type if combat on FieldUnit', () => {
      const deckUnit = TestUtil.getDbDeckUnit({})
      const fieldUnit = TestUtil.getDbFieldUnit({
        effectiveStrength: 2,
        effects: [
          {
            operator: '+1',
            reason: {
              effect: new ObjectId(),
              leader: new ObjectId(),
              type: EffectReasonType.Leader,
              unit: new ObjectId(),
            },
            total: 3,
          },
        ],
      })
      testGetMoveGameUnit({
        deckUnit,
        fieldUnit,
        expected: {
          ...deckUnit,
          row: fieldUnit.row,
          effectiveStrength: fieldUnit.effectiveStrength,
          effects: fieldUnit.effects,
          type: GameUnitType.Field,
        },
      })
    })
  })
  describe('updateImpactFieldUnits', () => {
    it('returns undefined if impacts undefined', () => {
      testUpdateImpactFieldUnits({
        impacts: undefined,
        expected: undefined,
      })
    })
    it('returns empty array if impacts empty array', () => {
      testUpdateImpactFieldUnits({
        impacts: [],
        expected: [],
      })
    })
    it('does not change impact if no unit', () => {
      const impact = TestUtil.getDbImpact({
        unit: null,
      })
      testUpdateImpactFieldUnits({
        impacts: [deepClone(impact)],
        expected: [impact],
      })
    })
    it('does not change impact if not Field type', () => {
      const deckUnit = TestUtil.getDbDeckUnit({})
      const impact = TestUtil.getDbImpact({
        unit: TestUtil.getDbGameUnit({
          id: deckUnit.unit,
          type: GameUnitType.Deck,
        }),
      })
      testUpdateImpactFieldUnits({
        impacts: [deepClone(impact)],
        expected: [impact],
      })
    })
    it('does not change impact if Field type but not on battlefield', () => {
      const fieldUnit = TestUtil.getDbFieldUnit({})
      const impact = TestUtil.getDbImpact({
        unit: TestUtil.getDbGameUnit({
          id: fieldUnit.unit,
          type: GameUnitType.Field,
        }),
      })
      testUpdateImpactFieldUnits({
        impacts: [deepClone(impact)],
        getFieldUnitResponses: [undefined],
        expected: [impact],
        getFieldUnitCalls: [
          {
            unitId: fieldUnit.unit,
            userId: impact.user,
          },
        ],
      })
    })
    it('changes single impact if Field type and on battlefield', () => {
      const fieldUnit = TestUtil.getDbFieldUnit({})
      const impact = TestUtil.getDbImpact({
        unit: TestUtil.getDbGameUnit({
          id: fieldUnit.unit,
          type: GameUnitType.Field,
        }),
      })
      testUpdateImpactFieldUnits({
        impacts: [deepClone(impact)],
        getFieldUnitResponses: [fieldUnit],
        expected: [
          {
            ...impact,
            unit: {
              ...fieldUnit,
              type: GameUnitType.Field,
            },
          },
        ],
        getFieldUnitCalls: [
          {
            unitId: fieldUnit.unit,
            userId: impact.user,
          },
        ],
      })
    })
    it('changes single impact out of multiple if Field type and on battlefield', () => {
      const fieldUnit = TestUtil.getDbFieldUnit({})
      const impact1 = TestUtil.getDbImpact({
        unit: null,
      })
      const impact2 = TestUtil.getDbImpact({
        unit: TestUtil.getDbGameUnit({
          id: fieldUnit.unit,
          type: GameUnitType.Field,
        }),
      })
      const impact3 = TestUtil.getDbImpact({
        unit: null,
      })
      testUpdateImpactFieldUnits({
        impacts: [deepClone(impact1), deepClone(impact2), deepClone(impact3)],
        getFieldUnitResponses: [fieldUnit],
        expected: [
          impact1,
          {
            ...impact2,
            unit: {
              ...fieldUnit,
              type: GameUnitType.Field,
            },
          },
          impact3,
        ],
        getFieldUnitCalls: [
          {
            unitId: fieldUnit.unit,
            userId: impact2.user,
          },
        ],
      })
    })
    it('changes multiple impacts if Field type and on battlefield', () => {
      const fieldUnit1 = TestUtil.getDbFieldUnit({})
      const fieldUnit2 = TestUtil.getDbFieldUnit({})
      const impact1 = TestUtil.getDbImpact({
        unit: TestUtil.getDbGameUnit({
          id: fieldUnit1.unit,
          type: GameUnitType.Field,
        }),
      })
      const impact2 = TestUtil.getDbImpact({
        unit: TestUtil.getDbGameUnit({
          id: fieldUnit2.unit,
          type: GameUnitType.Field,
        }),
      })
      testUpdateImpactFieldUnits({
        impacts: [deepClone(impact1), deepClone(impact2)],
        getFieldUnitResponses: [fieldUnit1, fieldUnit2],
        expected: [
          {
            ...impact1,
            unit: {
              ...fieldUnit1,
              type: GameUnitType.Field,
            },
          },
          {
            ...impact2,
            unit: {
              ...fieldUnit2,
              type: GameUnitType.Field,
            },
          },
        ],
        getFieldUnitCalls: [
          {
            unitId: fieldUnit1.unit,
            userId: impact1.user,
          },
          {
            unitId: fieldUnit2.unit,
            userId: impact2.user,
          },
        ],
      })
    })
  })
})

function testNewUnitDeployed({
  deckUnit = TestUtil.getDbDeckUnit({}),
  combat = Combat.Close,
  isWeather = false,
  avengers = {},
  scorches = {},
  musters = {},
  morales = {},
  mardroemes = {},
  bonds = {},
  horns = {},
  decoys = {},
  weathers = {},
  spies = {},
  medics = {},
  musteredOrigins,
  transformedFieldUnits,
  mardroemingFieldUnit,
  medicingUnit,
  targetId,
  logPrefix,
  error,
  expectedImpacts,
  errorCalls = [],
}: {
  deckUnit?: DeckUnitDbObject
  combat?: Combat | null | undefined
  isWeather?: boolean
  avengers?: ImpactsByUnitId
  scorches?: ImpactsByUnitId
  musters?: ImpactsByUnitId
  morales?: ImpactsByUnitId
  mardroemes?: ImpactsByUnitId
  bonds?: ImpactsByUnitId
  horns?: ImpactsByUnitId
  decoys?: ImpactsByUnitId
  weathers?: ImpactsByUnitId
  spies?: ImpactsByUnitId
  medics?: ImpactsByUnitId
  musteredOrigins?: MusteredOrigins | undefined
  transformedFieldUnits?: FieldUnitDbObject[]
  mardroemingFieldUnit?: FieldUnitDbObject
  medicingUnit?: GameUnitDbObject | undefined
  targetId?: string
  logPrefix: string
  error?: Error
  expectedImpacts?: ImpactDbObject[]
  errorCalls?: string[][]
}) {
  const playerId = new ObjectId().toString()
  const game = TestUtil.getDbGame({})
  const fieldUnit: FieldUnitDbObject = TestUtil.getDbFieldUnit({
    row: combat || Combat.Close,
  })
  const updatedImpacts = [TestUtil.getDbImpact({})]
  const updateImpactFieldUnitsSpy = jest.spyOn(UpdateHistory, 'updateImpactFieldUnits').mockReturnValue(updatedImpacts)
  const date = new Date()
  const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => date)
  const gameUnit = TestUtil.getDbGameUnit({
    artStyle: deckUnit.artStyle,
    id: deckUnit.unit,
    effectiveStrength: fieldUnit.effectiveStrength,
    effects: fieldUnit.effects,
    row: combat ? combat : (fieldUnit.row as Combat),
    type: combat ? GameUnitType.Field : GameUnitType.Deck,
  })
  const getMoveGameUnitSpy = jest.spyOn(UpdateHistory, 'getMoveGameUnit').mockReturnValue(gameUnit)
  const move: MoveUnitDbObject = {
    created: date,
    unit: gameUnit,
    impacts: updatedImpacts,
    reason: {
      type: medicingUnit ? MoveReasonType.Revive : MoveReasonType.Deploy,
    },
    source: {
      origin: GameUnitOrigin.Hand,
    },
    type: MoveType.Unit,
  }
  if (targetId) {
    move.target = new ObjectId(targetId)
  }
  if (medicingUnit) {
    move.reason.unit = medicingUnit
  }
  const addMoveToPlayerSpy = jest.spyOn(UpdateHistory, 'addMoveToPlayer').mockImplementation()
  const getFieldUnitDbObjectSpy = jest.spyOn(GetFieldUnits, 'getFieldUnit').mockReturnValueOnce(fieldUnit)
  const newUnitIndirectSpy = jest.spyOn(UpdateHistory as any, 'newUnitIndirect').mockImplementation()
  const newUnitIndirectCalls: any[][] = []
  if (musters[deckUnit.unit.toString()]) {
    for (const muster of musters[deckUnit.unit.toString()]) {
      if (musteredOrigins && muster.unit && musteredOrigins[muster.unit.unit.toString()]) {
        newUnitIndirectCalls.push([
          {
            bonds,
            created: move.created,
            game,
            avengers,
            horns,
            decoys,
            weathers,
            logPrefix,
            mardroemes,
            morales,
            musters,
            spies,
            medics,
            origin: musteredOrigins && musteredOrigins[muster.unit.unit.toString()],
            playerId,
            reason: {
              type: MoveReasonType.Muster,
              unit: gameUnit,
            },
            scorches,
            unitId: muster.unit.unit,
          },
        ])
      }
    }
  }
  if (transformedFieldUnits) {
    for (const transformedFieldUnit of transformedFieldUnits) {
      newUnitIndirectCalls.push([
        {
          bonds,
          created: move.created,
          game,
          avengers,
          horns,
          decoys,
          weathers,
          logPrefix,
          mardroemes,
          morales,
          musters,
          spies,
          medics,
          origin: GameUnitOrigin.Nondeck,
          playerId,
          reason: {
            type: MoveReasonType.Transform,
            unit: mardroemingFieldUnit
              ? {
                  ...mardroemingFieldUnit,
                  type: GameUnitType.Field,
                }
              : gameUnit,
          },
          scorches,
          unitId: transformedFieldUnit.unit,
        },
      ])
    }
  }
  for (const avengerUnitId of Object.keys(avengers)) {
    const avengees = avengers[avengerUnitId]
    for (const avengee of avengees) {
      newUnitIndirectCalls.push([
        {
          bonds,
          created: move.created,
          game,
          horns,
          decoys,
          spies,
          medics,
          logPrefix,
          mardroemes,
          morales,
          musters,
          avengers: {
            [avengerUnitId]: [avengee],
          },
          weathers,
          origin: GameUnitOrigin.Nondeck,
          playerId: avengee.user.toString(),
          turnUserId: playerId,
          reason: {
            type: MoveReasonType.Summon,
            unit: avengee.unit,
          },
          scorches,
          unitId: avengerUnitId,
          targetId: avengee.user,
        },
      ])
    }
  }

  const errorSpy = jest.fn().mockImplementation()
  UpdateHistory['logger'] = {
    error: errorSpy,
  } as any

  if (error) {
    expect(() =>
      UpdateHistory.newUnitDeployed({
        combat,
        deckUnit,
        game,
        avengers,
        decoys,
        weathers,
        musteredOrigins,
        musters,
        playerId,
        logPrefix,
        scorches,
        morales,
        bonds,
        horns,
        mardroemes,
        spies,
        medics,
        transformedFieldUnits,
        mardroemingFieldUnit,
        medicingUnit,
        targetId,
        isWeather,
      })
    ).toThrow(error)
  } else {
    expect(
      UpdateHistory.newUnitDeployed({
        combat,
        deckUnit,
        game,
        avengers,
        musteredOrigins,
        musters,
        playerId,
        decoys,
        weathers,
        logPrefix,
        scorches,
        morales,
        bonds,
        horns,
        mardroemes,
        spies,
        medics,
        transformedFieldUnits,
        mardroemingFieldUnit,
        medicingUnit,
        targetId,
        isWeather,
      })
    ).toEqual(undefined)
  }

  expect(updateImpactFieldUnitsSpy.mock.calls).toEqual([
    [
      {
        game,
        impacts: expectedImpacts,
      },
    ],
  ])
  expect(getFieldUnitDbObjectSpy.mock.calls).toEqual([
    [
      {
        game,
        unitId: deckUnit.unit,
        userId: targetId || playerId,
      },
    ],
  ])
  expect(dateSpy.mock.calls).toEqual([[]])
  expect(getMoveGameUnitSpy.mock.calls).toEqual([
    [
      {
        fieldUnit,
        deckUnit,
        isWeather,
        combat,
      },
    ],
  ])
  expect(addMoveToPlayerSpy.mock.calls).toEqual([
    [
      {
        game,
        move,
        logPrefix,
        playerId,
      },
    ],
  ])
  expect(newUnitIndirectSpy.mock.calls).toEqual(newUnitIndirectCalls)
  expect(errorSpy.mock.calls).toEqual(errorCalls)
}

function testNewUnitIndirect({
  game,
  unitId,
  created,
  turnUserId,
  playerId,
  logPrefix,
  origin,
  avengers,
  scorches,
  mardroemes,
  musters,
  bonds,
  horns,
  morales,
  decoys,
  weathers,
  spies,
  reason,
  getFieldUnitResponse,
  move,
  error,
  errorCalls = [],
}: {
  game: GameDbObject
  unitId: ObjectId
  created: Date
  playerId: string
  turnUserId?: ObjectId
  logPrefix: string
  origin: GameUnitOrigin
  avengers?: ImpactsByUnitId
  scorches?: ImpactsByUnitId
  mardroemes?: ImpactsByUnitId
  musters?: ImpactsByUnitId
  bonds?: ImpactsByUnitId
  horns?: ImpactsByUnitId
  morales?: ImpactsByUnitId
  decoys?: ImpactsByUnitId
  weathers?: ImpactsByUnitId
  spies?: ImpactsByUnitId
  reason: MoveUnitReasonDbObject
  getFieldUnitResponse: FieldUnitDbObject | undefined
  move?: MoveUnitDbObject
  error?: Error
  errorCalls?: string[][]
}) {
  const getFieldUnitDbObjectSpy = jest.spyOn(GetFieldUnits, 'getFieldUnit').mockReturnValue(getFieldUnitResponse)
  const addMoveToPlayerSpy = jest.spyOn(UpdateHistory as any, 'addMoveToPlayer').mockImplementation()
  const errorSpy = jest.fn().mockImplementation()
  UpdateHistory['logger'] = {
    error: errorSpy,
  } as any

  if (error) {
    expect(() =>
      UpdateHistory['newUnitIndirect']({
        bonds,
        created,
        game,
        horns,
        logPrefix,
        avengers,
        mardroemes,
        morales,
        musters,
        decoys,
        weathers,
        spies,
        origin,
        playerId,
        reason,
        scorches,
        unitId,
        turnUserId,
      })
    ).toThrow(error)
  } else {
    expect(
      UpdateHistory['newUnitIndirect']({
        bonds,
        created,
        game,
        avengers,
        horns,
        logPrefix,
        mardroemes,
        morales,
        musters,
        decoys,
        weathers,
        spies,
        origin,
        playerId,
        reason,
        scorches,
        unitId,
        turnUserId,
      })
    ).toEqual(undefined)
  }

  expect(getFieldUnitDbObjectSpy.mock.calls).toEqual([
    [
      {
        game,
        unitId,
        userId: playerId,
      },
    ],
  ])
  expect(addMoveToPlayerSpy.mock.calls).toEqual(
    error
      ? []
      : [
          [
            {
              game,
              move,
              playerId: turnUserId || playerId,
              logPrefix,
            },
          ],
        ]
  )
  expect(errorSpy.mock.calls).toEqual(errorCalls)
}

function testAddMoveToPlayer({
  game,
  move,
  logPrefix,
  playerId,
  updatedGame,
  error,
  errorCalls = [],
}: {
  game: GameDbObject
  move: MoveDbObject
  logPrefix: string
  playerId: ObjectId
  updatedGame?: GameDbObject
  error?: Error
  errorCalls?: string[][]
}) {
  const errorSpy = jest.fn().mockImplementation()
  UpdateHistory['logger'] = {
    error: errorSpy,
  } as any

  if (error) {
    expect(() =>
      UpdateHistory.addMoveToPlayer({
        game,
        logPrefix,
        move,
        playerId,
      })
    ).toThrow(error)
  } else {
    expect(
      UpdateHistory.addMoveToPlayer({
        game,
        logPrefix,
        move,
        playerId: playerId,
      })
    ).toEqual(undefined)
  }
  if (updatedGame) {
    expect(game).toEqual(updatedGame)
  }

  expect(errorSpy.mock.calls).toEqual(errorCalls)
}

function testGetMoveGameUnit({
  deckUnit,
  fieldUnit,
  isWeather,
  combat,
  expected,
}: {
  deckUnit: DeckUnitDbObject
  fieldUnit?: FieldUnitDbObject | undefined
  isWeather?: boolean
  combat?: Combat | null | undefined
  expected: GameUnitDbObject
}) {
  expect(
    UpdateHistory.getMoveGameUnit({
      deckUnit,
      fieldUnit,
      combat,
      isWeather,
    })
  ).toEqual(expected)
}

function testUpdateImpactFieldUnits({
  impacts,
  getFieldUnitResponses,
  expected,
  getFieldUnitCalls = [],
}: {
  impacts: ImpactDbObject[] | undefined
  getFieldUnitResponses?: (FieldUnitDbObject | undefined)[]
  expected: ImpactDbObject[] | undefined
  getFieldUnitCalls?: any[]
}) {
  const game = TestUtil.getDbGame({})
  const getFieldUnitSpy = jest.spyOn(GetFieldUnits, 'getFieldUnit')
  if (getFieldUnitResponses) {
    for (const getFieldUnitResponse of getFieldUnitResponses) {
      getFieldUnitSpy.mockReturnValueOnce(getFieldUnitResponse)
    }
  }

  expect(
    UpdateHistory.updateImpactFieldUnits({
      game,
      impacts,
    })
  ).toEqual(expected)

  expect(getFieldUnitSpy.mock.calls).toEqual(
    getFieldUnitCalls
      ? getFieldUnitCalls.map((getFieldUnitCall) => {
          return [
            {
              ...getFieldUnitCall,
              game,
            },
          ]
        })
      : getFieldUnitCalls
  )
}
