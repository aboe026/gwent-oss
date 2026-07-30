import { ObjectId } from 'mongodb'

import { Combat, MutationPlayUnitArgs } from '@gwent/graphql-schema/resolver-typings'
import { Context } from '@gwent/graphql-schema/context'
import {
  DeckUnitDbObject,
  EffectDbObject,
  EffectKey,
  FieldUnitDbObject,
  GameDbObject,
  GamePlayerDbObject,
  GameStatus,
  UnitDbObject,
  UserDbObject,
} from '@gwent/graphql-schema/database-typings'
import EffectStore from '../../src/database/stores/effect-store'
import GetFieldUnits from '../../src/graphql/resolvers/util/get-field-units'
import * as getRoundUnits from '../../src/graphql/resolvers/mutations/util/get-round-units'
import Permissions, { GameAndPlayer } from '../../src/graphql/permissions'
import PlayUnitValidation, {
  ValidatedDecoy,
} from '../../src/graphql/resolvers/mutations/play-unit/play-unit-validation'
import ResolverUtil from '../../src/graphql/resolvers/resolver-util'
import TestUtil from '../util/test-util'
import UnitStore from '../../src/database/stores/unit-store'

describe('play-unit-validation', () => {
  describe('playUnitValidation', () => {
    const user = TestUtil.getDbUser({})
    describe('invalid', () => {
      it('throws error if isAuthenticated throws error', async () => {
        const error = Error('isAuthenticated error')
        await testPlayUnitValidation({
          isAuthenticatedResponse: error,
          expectedError: error,
        })
      })
      it('throws error if isGamePlayer throws error', async () => {
        const error = Error('isGamePlayer error')
        await testPlayUnitValidation({
          isAuthenticatedResponse: user,
          isGamePlayerResponse: error,
          expectedError: error,
        })
      })
      it('throws error if verifyMongoIds throws error', async () => {
        const game = TestUtil.getDbGame({
          players: [
            TestUtil.getDbGamePlayer({
              user: user._id,
            }),
            TestUtil.getDbGamePlayer({}),
          ],
        })
        const error = Error('verifyMongoIds error')
        await testPlayUnitValidation({
          isAuthenticatedResponse: user,
          isGamePlayerResponse: {
            game,
            player: game.players[0],
          },
          verifyMongoIdResponses: [error],
          expectedError: error,
        })
      })
      it('throws error if validateGame throws error', async () => {
        const game = TestUtil.getDbGame({
          players: [
            TestUtil.getDbGamePlayer({
              user: user._id,
            }),
            TestUtil.getDbGamePlayer({}),
          ],
        })
        const error = Error('validateGame error')
        await testPlayUnitValidation({
          isAuthenticatedResponse: user,
          isGamePlayerResponse: {
            game,
            player: game.players[0],
          },
          validateGameError: error,
          expectedError: error,
        })
      })
      it('throws error if unit is not in hand', async () => {
        const deckUnit = TestUtil.getDbDeckUnit({})
        const game = TestUtil.getDbGame({
          players: [
            TestUtil.getDbGamePlayer({
              deck: TestUtil.getDbGameDeck({}),
            }),
          ],
        })
        const logPrefix = `playUnit by "${user._id}" for unit "${deckUnit.unit}" on game "${game._id}"`
        const message = 'Unit not in hand.'
        await testPlayUnitValidation({
          isAuthenticatedResponse: user,
          isGamePlayerResponse: {
            game,
            player: game.players[0],
          },
          unitId: deckUnit.unit.toString(),
          logPrefix,
          expectedError: Error(message),
          warnCalls: [[`${logPrefix} failed: ${message}`]],
        })
      })
      it('throws error if unit is not in discard for revival', async () => {
        const deckUnit = TestUtil.getDbDeckUnit({})
        const game = TestUtil.getDbGame({
          players: [
            TestUtil.getDbGamePlayer({
              deck: TestUtil.getDbGameDeck({}),
              reviving: true,
            }),
          ],
        })
        const logPrefix = `playUnit by "${user._id}" for unit "${deckUnit.unit}" on game "${game._id}"`
        const message = 'Unit not in discard.'
        await testPlayUnitValidation({
          isAuthenticatedResponse: user,
          isGamePlayerResponse: {
            game,
            player: game.players[0],
          },
          unitId: deckUnit.unit.toString(),
          logPrefix,
          expectedError: Error(message),
          warnCalls: [[`${logPrefix} failed: ${message}`]],
        })
      })
      it('throws error if unit is in hand more than once', async () => {
        const deckUnit = TestUtil.getDbDeckUnit({})
        const game = TestUtil.getDbGame({
          players: [
            TestUtil.getDbGamePlayer({
              deck: TestUtil.getDbGameDeck({
                hand: [deckUnit, deckUnit],
              }),
            }),
          ],
        })
        const logPrefix = `playUnit by "${user._id}" for unit "${deckUnit.unit}" on game "${game._id}"`
        const message = `Found more than 1 unit with ID "${deckUnit.unit}" in hand`
        await testPlayUnitValidation({
          isAuthenticatedResponse: user,
          isGamePlayerResponse: {
            game,
            player: game.players[0],
          },
          unitId: deckUnit.unit.toString(),
          logPrefix,
          expectedError: Error(`${message}.`),
          errorCalls: [[`${logPrefix} failed: ${message}: "${JSON.stringify([deckUnit, deckUnit])}"`]],
        })
      })
      it('throws error if unit is in discard more than once', async () => {
        const deckUnit = TestUtil.getDbDeckUnit({})
        const game = TestUtil.getDbGame({
          players: [
            TestUtil.getDbGamePlayer({
              deck: TestUtil.getDbGameDeck({
                discard: [deckUnit, deckUnit],
              }),
              reviving: true,
            }),
          ],
        })
        const logPrefix = `playUnit by "${user._id}" for unit "${deckUnit.unit}" on game "${game._id}"`
        const message = `Found more than 1 unit with ID "${deckUnit.unit}" in discard`
        await testPlayUnitValidation({
          isAuthenticatedResponse: user,
          isGamePlayerResponse: {
            game,
            player: game.players[0],
          },
          unitId: deckUnit.unit.toString(),
          logPrefix,
          expectedError: Error(`${message}.`),
          errorCalls: [[`${logPrefix} failed: ${message}: "${JSON.stringify([deckUnit, deckUnit])}"`]],
        })
      })
      it('throws error if unit does not exist', async () => {
        const deckUnit = TestUtil.getDbDeckUnit({})
        const game = TestUtil.getDbGame({
          players: [
            TestUtil.getDbGamePlayer({
              deck: TestUtil.getDbGameDeck({
                hand: [deckUnit],
              }),
            }),
          ],
        })
        const logPrefix = `playUnit by "${user._id}" for unit "${deckUnit.unit}" on game "${game._id}"`
        const message = 'Unit does not exist.'
        await testPlayUnitValidation({
          isAuthenticatedResponse: user,
          isGamePlayerResponse: {
            game,
            player: game.players[0],
          },
          unitId: deckUnit.unit.toString(),
          units: [],
          logPrefix,
          expectedError: Error(message),
          errorCalls: [[`${logPrefix} failed: ${message}`]],
        })
      })
      it('throws error if unit exists more than once', async () => {
        const deckUnit = TestUtil.getDbDeckUnit({})
        const game = TestUtil.getDbGame({
          players: [
            TestUtil.getDbGamePlayer({
              deck: TestUtil.getDbGameDeck({
                hand: [deckUnit],
              }),
            }),
          ],
        })
        const unit = TestUtil.getDbUnit({
          id: deckUnit.unit,
        })
        const logPrefix = `playUnit by "${user._id}" for unit "${deckUnit.unit}" on game "${game._id}"`
        const message = `Found multiple units with ID "${deckUnit.unit}"`
        await testPlayUnitValidation({
          isAuthenticatedResponse: user,
          isGamePlayerResponse: {
            game,
            player: game.players[0],
          },
          unitId: deckUnit.unit.toString(),
          units: [unit, unit],
          logPrefix,
          expectedError: Error(`${message}.`),
          errorCalls: [[`${logPrefix} failed: ${message}: "${JSON.stringify([unit, unit])}"`]],
        })
      })
      it('throws error if modifier already set for close', async () => {
        const combat = Combat.Close
        const deckUnit = TestUtil.getDbDeckUnit({})
        const unit = TestUtil.getDbUnit({
          id: deckUnit.unit,
          combats: [combat],
          modifier: true,
        })
        const existingModifier = TestUtil.getDbFieldUnit({})
        const game = TestUtil.getDbGame({
          round: 1,
          players: [
            TestUtil.getDbGamePlayer({
              deck: TestUtil.getDbGameDeck({
                hand: [deckUnit],
              }),
              rounds: [
                TestUtil.getDbPlayerRound({
                  close: TestUtil.getDbPlayerCombatRow({
                    modifier: existingModifier,
                  }),
                }),
              ],
            }),
          ],
        })
        const logPrefix = `playUnit by "${user._id}" for unit "${deckUnit.unit}" on game "${game._id}"`
        const message = `Modifier for row "${combat}" already set as unit "${existingModifier.unit}".`
        await testPlayUnitValidation({
          isAuthenticatedResponse: user,
          isGamePlayerResponse: {
            game,
            player: game.players[0],
          },
          unitId: deckUnit.unit.toString(),
          validateCombatResponse: combat,
          units: [unit],
          logPrefix,
          expectedError: Error(message),
          warnCalls: [[`${logPrefix} failed: ${message}`]],
        })
      })
      it('throws error if modifier already set for ranged', async () => {
        const combat = Combat.Ranged
        const deckUnit = TestUtil.getDbDeckUnit({})
        const unit = TestUtil.getDbUnit({
          id: deckUnit.unit,
          combats: [combat],
          modifier: true,
        })
        const existingModifier = TestUtil.getDbFieldUnit({})
        const game = TestUtil.getDbGame({
          round: 1,
          players: [
            TestUtil.getDbGamePlayer({
              deck: TestUtil.getDbGameDeck({
                hand: [deckUnit],
              }),
              rounds: [
                TestUtil.getDbPlayerRound({
                  ranged: TestUtil.getDbPlayerCombatRow({
                    modifier: existingModifier,
                  }),
                }),
              ],
            }),
          ],
        })
        const logPrefix = `playUnit by "${user._id}" for unit "${deckUnit.unit}" on game "${game._id}"`
        const message = `Modifier for row "${combat}" already set as unit "${existingModifier.unit}".`
        await testPlayUnitValidation({
          isAuthenticatedResponse: user,
          isGamePlayerResponse: {
            game,
            player: game.players[0],
          },
          unitId: deckUnit.unit.toString(),
          validateCombatResponse: combat,
          units: [unit],
          logPrefix,
          expectedError: Error(message),
          warnCalls: [[`${logPrefix} failed: ${message}`]],
        })
      })
      it('throws error if modifier already set for siege', async () => {
        const combat = Combat.Siege
        const deckUnit = TestUtil.getDbDeckUnit({})
        const unit = TestUtil.getDbUnit({
          id: deckUnit.unit,
          combats: [combat],
          modifier: true,
        })
        const existingModifier = TestUtil.getDbFieldUnit({})
        const game = TestUtil.getDbGame({
          round: 1,
          players: [
            TestUtil.getDbGamePlayer({
              deck: TestUtil.getDbGameDeck({
                hand: [deckUnit],
              }),
              rounds: [
                TestUtil.getDbPlayerRound({
                  siege: TestUtil.getDbPlayerCombatRow({
                    modifier: existingModifier,
                  }),
                }),
              ],
            }),
          ],
        })
        const logPrefix = `playUnit by "${user._id}" for unit "${deckUnit.unit}" on game "${game._id}"`
        const message = `Modifier for row "${combat}" already set as unit "${existingModifier.unit}".`
        await testPlayUnitValidation({
          isAuthenticatedResponse: user,
          isGamePlayerResponse: {
            game,
            player: game.players[0],
          },
          unitId: deckUnit.unit.toString(),
          validateCombatResponse: combat,
          units: [unit],
          logPrefix,
          expectedError: Error(message),
          warnCalls: [[`${logPrefix} failed: ${message}`]],
        })
      })
    })
    describe('valid', () => {
      it('returns objects if no errors and no combat specified for unit with no combat', async () => {
        const deckUnit = TestUtil.getDbDeckUnit({})
        const game = TestUtil.getDbGame({
          players: [
            TestUtil.getDbGamePlayer({
              deck: TestUtil.getDbGameDeck({
                hand: [deckUnit],
              }),
            }),
          ],
        })
        const unit = TestUtil.getDbUnit({
          id: deckUnit.unit,
        })
        const logPrefix = `playUnit by "${user._id}" for unit "${deckUnit.unit}" on game "${game._id}"`
        await testPlayUnitValidation({
          isAuthenticatedResponse: user,
          isGamePlayerResponse: {
            game,
            player: game.players[0],
          },
          unitId: deckUnit.unit.toString(),
          units: [unit],
          logPrefix,
          expectedDeckUnit: deckUnit,
          validateCombatResponse: Combat.Close,
        })
      })
      it('returns objects if no errors and no combat specified for unit with single combat', async () => {
        const deckUnit = TestUtil.getDbDeckUnit({})
        const game = TestUtil.getDbGame({
          players: [
            TestUtil.getDbGamePlayer({
              deck: TestUtil.getDbGameDeck({
                hand: [deckUnit],
              }),
            }),
          ],
        })
        const unit = TestUtil.getDbUnit({
          id: deckUnit.unit,
          combats: [Combat.Ranged],
        })
        const logPrefix = `playUnit by "${user._id}" for unit "${deckUnit.unit}" on game "${game._id}"`
        await testPlayUnitValidation({
          isAuthenticatedResponse: user,
          isGamePlayerResponse: {
            game,
            player: game.players[0],
          },
          unitId: deckUnit.unit.toString(),
          units: [unit],
          logPrefix,
          validateCombatResponse: Combat.Ranged,
          expectedDeckUnit: deckUnit,
        })
      })
      it('returns objects if no errors and combat specified for unit with multiple combats', async () => {
        const deckUnit = TestUtil.getDbDeckUnit({})
        const game = TestUtil.getDbGame({
          players: [
            TestUtil.getDbGamePlayer({
              deck: TestUtil.getDbGameDeck({
                hand: [deckUnit],
              }),
            }),
          ],
        })
        const unit = TestUtil.getDbUnit({
          id: deckUnit.unit,
          combats: [Combat.Ranged, Combat.Siege],
        })
        const logPrefix = `playUnit by "${user._id}" for unit "${deckUnit.unit}" on game "${game._id}"`
        await testPlayUnitValidation({
          isAuthenticatedResponse: user,
          isGamePlayerResponse: {
            game,
            player: game.players[0],
          },
          unitId: deckUnit.unit.toString(),
          validateCombatResponse: Combat.Siege,
          units: [unit],
          logPrefix,
          expectedDeckUnit: deckUnit,
        })
      })
      it('returns objects if no errors and combat specified for modifier with multiple combats', async () => {
        const deckUnit = TestUtil.getDbDeckUnit({})
        const game = TestUtil.getDbGame({
          round: 1,
          players: [
            TestUtil.getDbGamePlayer({
              deck: TestUtil.getDbGameDeck({
                hand: [deckUnit],
              }),
              rounds: [TestUtil.getDbPlayerRound({})],
            }),
          ],
        })
        const unit = TestUtil.getDbUnit({
          id: deckUnit.unit,
          combats: [Combat.Close, Combat.Ranged, Combat.Siege],
          modifier: true,
        })
        const logPrefix = `playUnit by "${user._id}" for unit "${deckUnit.unit}" on game "${game._id}"`
        await testPlayUnitValidation({
          isAuthenticatedResponse: user,
          isGamePlayerResponse: {
            game,
            player: game.players[0],
          },
          unitId: deckUnit.unit.toString(),
          validateCombatResponse: Combat.Siege,
          units: [unit],
          logPrefix,
          expectedDeckUnit: deckUnit,
        })
      })
      it('overwrites combat and sets roundUnits if valid decoy', async () => {
        const deckUnit = TestUtil.getDbDeckUnit({})
        const game = TestUtil.getDbGame({
          players: [
            TestUtil.getDbGamePlayer({
              deck: TestUtil.getDbGameDeck({
                hand: [deckUnit],
              }),
            }),
          ],
        })
        const effects = [
          TestUtil.getDbEffect({
            key: EffectKey.Decoy,
          }),
        ]
        const unit = TestUtil.getDbUnit({
          id: deckUnit.unit,
          effects: effects.map((effect) => effect._id),
        })
        const target = TestUtil.getDbFieldUnit({})
        const targetUnit = TestUtil.getDbUnit({
          id: target.unit,
        })
        const combat = Combat.Ranged
        const logPrefix = `playUnit by "${user._id}" for unit "${deckUnit.unit}" on game "${game._id}"`
        await testPlayUnitValidation({
          isAuthenticatedResponse: user,
          isGamePlayerResponse: {
            game,
            player: game.players[0],
          },
          effects,
          targetId: target.unit.toString(),
          unitId: deckUnit.unit.toString(),
          verifyMongoIdResponses: [undefined, undefined],
          units: [unit],
          validateDecoyCombat: combat,
          validateDecoyRoundUnits: [targetUnit],
          logPrefix,
          expectedDeckUnit: deckUnit,
          validateCombatResponse: Combat.Ranged,
          isDecoy: true,
        })
      })
      it('overwrites target id if valid spy', async () => {
        const deckUnit = TestUtil.getDbDeckUnit({})
        const game = TestUtil.getDbGame({
          players: [
            TestUtil.getDbGamePlayer({
              deck: TestUtil.getDbGameDeck({
                hand: [deckUnit],
              }),
            }),
            TestUtil.getDbGamePlayer({}),
          ],
        })
        const effects = [
          TestUtil.getDbEffect({
            key: EffectKey.Spy,
          }),
        ]
        const unit = TestUtil.getDbUnit({
          id: deckUnit.unit,
          effects: effects.map((effect) => effect._id),
        })
        const targetId = new ObjectId().toString()
        const logPrefix = `playUnit by "${user._id}" for unit "${deckUnit.unit}" on game "${game._id}"`
        await testPlayUnitValidation({
          isAuthenticatedResponse: user,
          isGamePlayerResponse: {
            game,
            player: game.players[0],
          },
          effects,
          targetId: game.players[0].user.toString(),
          unitId: deckUnit.unit.toString(),
          verifyMongoIdResponses: [undefined, undefined],
          validateCombatResponse: Combat.Close,
          validateSpyTargetId: targetId,
          units: [unit],
          logPrefix,
          expectedDeckUnit: deckUnit,
          isSpy: true,
        })
      })
      it('sets combat to undefined if weather', async () => {
        const deckUnit = TestUtil.getDbDeckUnit({})
        const game = TestUtil.getDbGame({
          players: [
            TestUtil.getDbGamePlayer({
              deck: TestUtil.getDbGameDeck({
                hand: [deckUnit],
              }),
            }),
          ],
        })
        const effects = [
          TestUtil.getDbEffect({
            key: EffectKey.Weather,
          }),
        ]
        const unit = TestUtil.getDbUnit({
          id: deckUnit.unit,
          effects: effects.map((effect) => effect._id),
        })
        const logPrefix = `playUnit by "${user._id}" for unit "${deckUnit.unit}" on game "${game._id}"`
        await testPlayUnitValidation({
          isAuthenticatedResponse: user,
          isGamePlayerResponse: {
            game,
            player: game.players[0],
          },
          effects,
          unitId: deckUnit.unit.toString(),
          verifyMongoIdResponses: [undefined],
          units: [unit],
          logPrefix,
          expectedDeckUnit: deckUnit,
          validateCombatResponse: Combat.Close,
          isWeather: true,
        })
      })
      it('logs to trace if enabled', async () => {
        const deckUnit = TestUtil.getDbDeckUnit({})
        const game = TestUtil.getDbGame({
          players: [
            TestUtil.getDbGamePlayer({
              deck: TestUtil.getDbGameDeck({
                hand: [deckUnit],
              }),
            }),
          ],
        })
        const unit = TestUtil.getDbUnit({
          id: deckUnit.unit,
          combats: [Combat.Ranged],
        })
        const logPrefix = `playUnit by "${user._id}" for unit "${deckUnit.unit}" on game "${game._id}"`
        await testPlayUnitValidation({
          isAuthenticatedResponse: user,
          isGamePlayerResponse: {
            game,
            player: game.players[0],
          },
          unitId: deckUnit.unit.toString(),
          units: [unit],
          logPrefix,
          expectedDeckUnit: deckUnit,
          validateCombatResponse: Combat.Close,
          traceEnabled: true,
        })
      })
    })
  })
  describe('validateCombat', () => {
    const logPrefix = 'log-prefix'
    it('throws error if unit has multiple and none specified', () => {
      const message = `Must specify combat: One of "${JSON.stringify([Combat.Close, Combat.Ranged])}".`
      testValidateCombat({
        logPrefix,
        unit: TestUtil.getDbUnit({
          combats: [Combat.Close, Combat.Ranged],
        }),
        expected: Error(message),
        warnCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('throws error if unit has single combat and specified combat does not match', () => {
      const message = `Combat "${Combat.Ranged}" does match unit combats of "${JSON.stringify([Combat.Close])}".`
      testValidateCombat({
        logPrefix,
        unit: TestUtil.getDbUnit({
          combats: [Combat.Close],
        }),
        combat: Combat.Ranged,
        expected: Error(message),
        warnCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('throws error if unit has multiple combats and specified combat does not match', () => {
      const message = `Combat "${Combat.Ranged}" does match unit combats of "${JSON.stringify([Combat.Close, Combat.Siege])}".`
      testValidateCombat({
        logPrefix,
        unit: TestUtil.getDbUnit({
          combats: [Combat.Close, Combat.Siege],
        }),
        combat: Combat.Ranged,
        expected: Error(message),
        warnCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('returns only combat if not specified', () => {
      testValidateCombat({
        logPrefix,
        unit: TestUtil.getDbUnit({
          combats: [Combat.Ranged],
        }),
        expected: Combat.Ranged,
      })
    })
    it('returns only combat if specified', () => {
      testValidateCombat({
        logPrefix,
        unit: TestUtil.getDbUnit({
          combats: [Combat.Ranged],
        }),
        combat: Combat.Ranged,
        expected: Combat.Ranged,
      })
    })
    it('returns specified combat if unit has none', () => {
      testValidateCombat({
        logPrefix,
        unit: TestUtil.getDbUnit({
          combats: [],
        }),
        combat: Combat.Siege,
        expected: Combat.Siege,
      })
    })
    it('returns undefined if no combat and none specified', () => {
      testValidateCombat({
        logPrefix,
        unit: TestUtil.getDbUnit({
          combats: [],
        }),
        expected: undefined,
      })
    })
    it('does not throw error if unit is decoy', () => {
      testValidateCombat({
        logPrefix,
        unit: TestUtil.getDbUnit({
          combats: [Combat.Close],
        }),
        isDecoy: true,
        combat: Combat.Ranged,
        expected: Combat.Ranged,
      })
    })
    it('does not throw error if unit is weather', () => {
      testValidateCombat({
        logPrefix,
        unit: TestUtil.getDbUnit({
          combats: [Combat.Close],
        }),
        isWeather: true,
        combat: Combat.Ranged,
        expected: Combat.Ranged,
      })
    })
  })
  describe('validateDecoy', () => {
    const logPrefix = 'log-prefix'
    it('throws error if no targetId', async () => {
      const message = `Argument "target" required for units with "${EffectKey.Decoy}" effect.`
      await testValidateDecoy({
        logPrefix,
        expected: Error(message),
        warnCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('throws error if cannot find field unit with targetId', async () => {
      const targetId = new ObjectId().toString()
      const userId = new ObjectId()
      const message = `Target "${targetId}" does not exist on the battlefield for player "${userId}".`
      await testValidateDecoy({
        logPrefix,
        targetId,
        userId,
        getFieldUnitResponse: null,
        expected: Error(message),
        warnCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('throws error if cannot find target in round units', async () => {
      const targetId = new ObjectId().toString()
      const message = `Could not find Unit for target "${targetId}".`
      await testValidateDecoy({
        targetId,
        logPrefix,
        getFieldUnitResponse: TestUtil.getDbFieldUnit({
          row: Combat.Close,
        }),
        getRoundUnitsResponse: [],
        expected: Error(message),
        errorCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('throws error if target is hero', async () => {
      const targetId = new ObjectId().toString()
      const roundUnits = [
        TestUtil.getDbUnit({
          id: targetId,
          hero: true,
        }),
      ]
      const message = `Invalid decoy target "${targetId}": Cannot be hero.`
      await testValidateDecoy({
        targetId,
        logPrefix,
        getFieldUnitResponse: TestUtil.getDbFieldUnit({
          row: Combat.Close,
        }),
        getRoundUnitsResponse: roundUnits,
        expected: Error(message),
        warnCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('throws error if target is special', async () => {
      const targetId = new ObjectId().toString()
      const roundUnits = [
        TestUtil.getDbUnit({
          id: targetId,
          special: true,
        }),
      ]
      const message = `Invalid decoy target "${targetId}": Cannot be special.`
      await testValidateDecoy({
        targetId,
        logPrefix,
        getFieldUnitResponse: TestUtil.getDbFieldUnit({
          row: Combat.Close,
        }),
        getRoundUnitsResponse: roundUnits,
        expected: Error(message),
        warnCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('throws error if combat does not match field unit row', async () => {
      const targetId = new ObjectId().toString()
      const roundUnits = [
        TestUtil.getDbUnit({
          id: targetId,
        }),
      ]
      const message = `Invalid combat "${Combat.Close}": Target "${targetId}" is in row "${Combat.Ranged}".`
      await testValidateDecoy({
        targetId,
        logPrefix,
        combat: Combat.Close,
        getFieldUnitResponse: TestUtil.getDbFieldUnit({
          row: Combat.Ranged,
        }),
        getRoundUnitsResponse: roundUnits,
        expected: Error(message),
        warnCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('returns nothing if not decoy', async () => {
      await testValidateDecoy({
        isDecoy: false,
        logPrefix,
        expected: {
          combat: undefined,
          roundUnits: undefined,
        },
      })
    })
    it('returns roundUnits and row as combat if none specified and decoy', async () => {
      const targetId = new ObjectId().toString()
      const roundUnits = [
        TestUtil.getDbUnit({
          id: targetId,
        }),
      ]
      await testValidateDecoy({
        targetId,
        logPrefix,
        getFieldUnitResponse: TestUtil.getDbFieldUnit({
          row: Combat.Close,
        }),
        getRoundUnitsResponse: roundUnits,
        expected: {
          combat: Combat.Close,
          roundUnits,
        },
      })
    })
  })
  describe('validateSpy', () => {
    const logPrefix = 'log-prefix'
    it('throws error if multiple opponents and targetId not specified', () => {
      const userId = new ObjectId()
      const message = `Argument "target" required for units with "${EffectKey.Spy}" effect and game with multiple opponents.`
      testValidateSpy({
        logPrefix,
        game: TestUtil.getDbGame({
          players: [
            TestUtil.getDbGamePlayer({
              user: userId,
            }),
            TestUtil.getDbGamePlayer({}),
            TestUtil.getDbGamePlayer({}),
          ],
        }),
        userId,
        expected: Error(message),
        warnCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('throws error targetId is same as userId', () => {
      const userId = new ObjectId()
      const targetId = new ObjectId().toString()
      const message = `Invalid spy target "${userId}": Cannot be self, must be an opponent.`
      testValidateSpy({
        logPrefix,
        game: TestUtil.getDbGame({
          players: [
            TestUtil.getDbGamePlayer({
              user: userId,
            }),
            TestUtil.getDbGamePlayer({
              user: targetId,
            }),
          ],
        }),
        userId,
        targetId: userId.toString(),
        expected: Error(message),
        warnCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('throws error targetId is not a player on the game', () => {
      const userId = new ObjectId()
      const targetId = new ObjectId().toString()
      const message = `Invalid spy target "${targetId}": Could not find that opponent on game.`
      testValidateSpy({
        logPrefix,
        game: TestUtil.getDbGame({
          players: [
            TestUtil.getDbGamePlayer({
              user: userId,
            }),
            TestUtil.getDbGamePlayer({}),
          ],
        }),
        userId,
        targetId,
        expected: Error(message),
        warnCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('returns targetId if not spy', () => {
      const userId = new ObjectId()
      testValidateSpy({
        logPrefix,
        game: TestUtil.getDbGame({
          players: [
            TestUtil.getDbGamePlayer({
              user: userId,
            }),
            TestUtil.getDbGamePlayer({}),
            TestUtil.getDbGamePlayer({}),
          ],
        }),
        userId,
        isSpy: false,
        expected: undefined,
      })
    })
    it('returns targetId if none specified and only one opponent', () => {
      const userId = new ObjectId()
      const targetId = new ObjectId().toString()
      testValidateSpy({
        logPrefix,
        game: TestUtil.getDbGame({
          players: [
            TestUtil.getDbGamePlayer({
              user: userId,
            }),
            TestUtil.getDbGamePlayer({
              user: targetId,
            }),
          ],
        }),
        userId,
        expected: targetId,
      })
    })
    it('returns targetId if specified and only one opponent', () => {
      const userId = new ObjectId()
      const targetId = new ObjectId().toString()
      testValidateSpy({
        logPrefix,
        game: TestUtil.getDbGame({
          players: [
            TestUtil.getDbGamePlayer({
              user: userId,
            }),
            TestUtil.getDbGamePlayer({
              user: targetId,
            }),
          ],
        }),
        userId,
        targetId,
        expected: targetId,
      })
    })
    it('returns targetId if specified and more than one opponent', () => {
      const userId = new ObjectId()
      const targetId = new ObjectId().toString()
      testValidateSpy({
        logPrefix,
        game: TestUtil.getDbGame({
          players: [
            TestUtil.getDbGamePlayer({
              user: userId,
            }),
            TestUtil.getDbGamePlayer({
              user: targetId,
            }),
            TestUtil.getDbGamePlayer({}),
          ],
        }),
        userId,
        targetId,
        expected: targetId,
      })
    })
  })
  describe('validateMedic', () => {
    const logPrefix = 'log-prefix'
    it('throws error if unit is hero', () => {
      const unit = TestUtil.getDbUnit({
        hero: true,
      })
      const message = `Invalid unit "${unit._id}": Cannot revive hero units.`
      testValidateMedic({
        logPrefix,
        player: TestUtil.getDbGamePlayer({
          reviving: true,
          deck: TestUtil.getDbGameDeck({
            discard: [
              TestUtil.getDbDeckUnit({
                id: unit._id,
              }),
            ],
          }),
        }),
        unit,
        error: Error(message),
        warnCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('throws error if unit is special', () => {
      const unit = TestUtil.getDbUnit({
        special: true,
      })
      const message = `Invalid unit "${unit._id}": Cannot revive special units.`
      testValidateMedic({
        logPrefix,
        player: TestUtil.getDbGamePlayer({
          reviving: true,
          deck: TestUtil.getDbGameDeck({
            discard: [
              TestUtil.getDbDeckUnit({
                id: unit._id,
              }),
            ],
          }),
        }),
        unit,
        error: Error(message),
        warnCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('throws error if unit not in discard', () => {
      const unit = TestUtil.getDbUnit({})
      const message = `Invalid unit "${unit._id}": Can only revive from the discard pile.`
      testValidateMedic({
        logPrefix,
        player: TestUtil.getDbGamePlayer({
          reviving: true,
        }),
        unit,
        error: Error(message),
        warnCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('does nothing if player not reviving', () => {
      const unit = TestUtil.getDbUnit({})
      testValidateMedic({
        logPrefix,
        player: TestUtil.getDbGamePlayer({
          deck: TestUtil.getDbGameDeck({
            discard: [
              TestUtil.getDbDeckUnit({
                id: unit._id,
              }),
            ],
          }),
        }),
        unit,
      })
    })
    it('does not throw error if valid revival', () => {
      const unit = TestUtil.getDbUnit({})
      testValidateMedic({
        logPrefix,
        player: TestUtil.getDbGamePlayer({
          reviving: true,
          deck: TestUtil.getDbGameDeck({
            discard: [
              TestUtil.getDbDeckUnit({
                id: unit._id,
              }),
            ],
          }),
        }),
        unit,
      })
    })
  })
})

async function testPlayUnitValidation({
  targetId,
  effects,
  isAuthenticatedResponse,
  isGamePlayerResponse,
  validateCombatResponse,
  validateDecoyCombat,
  validateDecoyRoundUnits,
  validateSpyTargetId,
  validateGameError,
  unitId = '',
  units,
  logPrefix,
  verifyMongoIdResponses = [undefined],
  expectedError,
  expectedDeckUnit,
  isDecoy = false,
  isSpy = false,
  isWeather = false,
  isMedic = false,
  errorCalls = [],
  warnCalls = [],
  traceEnabled,
}: {
  targetId?: string
  effects?: EffectDbObject[]
  isAuthenticatedResponse: UserDbObject | Error
  isGamePlayerResponse?: GameAndPlayer | Error
  validateCombatResponse?: Combat
  validateDecoyCombat?: Combat | undefined | null
  validateDecoyRoundUnits?: UnitDbObject[] | undefined
  validateSpyTargetId?: string | undefined | null
  validateGameError?: Error
  unitId?: string
  units?: UnitDbObject[]
  logPrefix?: string
  verifyMongoIdResponses?: (Error | undefined)[]
  expectedError?: Error
  expectedDeckUnit?: DeckUnitDbObject
  isDecoy?: boolean
  isSpy?: boolean
  isWeather?: boolean
  isMedic?: boolean
  errorCalls?: string[][]
  warnCalls?: string[][]
  traceEnabled?: boolean
}) {
  const context: Context = {
    session: {
      user: isAuthenticatedResponse instanceof Error ? undefined : isAuthenticatedResponse,
    },
  }
  const gameId = isGamePlayerResponse
    ? isGamePlayerResponse instanceof Error
      ? ''
      : isGamePlayerResponse.game._id.toString()
    : ''
  const args: MutationPlayUnitArgs = {
    game: gameId,
    unit: unitId,
    combat: Combat.Siege,
    target: targetId,
  }
  const isAuthenticatedSpy = jest.spyOn(Permissions, 'isAuthenticated').mockImplementation(() => {
    if (isAuthenticatedResponse instanceof Error) {
      throw isAuthenticatedResponse
    } else {
      return isAuthenticatedResponse
    }
  })
  const isGamePlayerSpy = jest.spyOn(Permissions, 'isGamePlayer')
  if (isGamePlayerResponse) {
    if (isGamePlayerResponse instanceof Error) {
      isGamePlayerSpy.mockRejectedValue(isGamePlayerResponse)
    } else {
      isGamePlayerSpy.mockResolvedValue(isGamePlayerResponse)
    }
  }
  const validateGameSpy = jest.spyOn(ResolverUtil.prototype, 'validateGame').mockImplementation(() => {
    if (validateGameError) {
      throw validateGameError
    }
  })
  const logRequestInfoSpy = jest.spyOn(ResolverUtil.prototype, 'logRequestInfo').mockImplementation()
  const verifyMongoIdsSpy = jest.spyOn(ResolverUtil.prototype, 'verifyMongoIds')
  if (verifyMongoIdResponses) {
    for (const verifyMongoIdResponse of verifyMongoIdResponses) {
      verifyMongoIdsSpy.mockImplementationOnce(() => {
        if (verifyMongoIdResponse) {
          throw verifyMongoIdResponse
        }
      })
    }
  }
  const unitStoreGetSpy = jest.spyOn(UnitStore, 'get')
  if (units) {
    unitStoreGetSpy.mockResolvedValue(units)
  }
  const effectsGetSpy = jest.spyOn(EffectStore, 'get')
  if (effects) {
    effectsGetSpy.mockResolvedValue(effects)
  }
  const validateCombatSpy = jest
    .spyOn(PlayUnitValidation as any, 'validateCombat')
    .mockReturnValue(validateCombatResponse)
  const validateDecoySpy = jest.spyOn(PlayUnitValidation as any, 'validateDecoy').mockResolvedValue({
    combat: validateDecoyCombat || validateCombatResponse,
    roundUnits: validateDecoyRoundUnits,
  })
  const validateSpySpy = jest.spyOn(PlayUnitValidation as any, 'validateSpy').mockReturnValue(validateSpyTargetId)
  const validateMedicSpy = jest.spyOn(PlayUnitValidation as any, 'validateMedic').mockImplementation()
  const errorSpy = jest.fn().mockImplementation()
  const warnSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  PlayUnitValidation['logger'] = {
    error: errorSpy,
    warn: warnSpy,
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  const promise = PlayUnitValidation.playUnitValidation(args, context, null as any)
  if (expectedError) {
    await expect(promise).rejects.toThrow(expectedError)
  } else {
    await expect(promise).resolves.toEqual({
      combat: isWeather ? undefined : validateDecoyCombat || validateCombatResponse,
      deckUnit: expectedDeckUnit,
      game: isGamePlayerResponse && !(isGamePlayerResponse instanceof Error) ? isGamePlayerResponse.game : undefined,
      logPrefix,
      unit: units && units[0],
      roundUnits: validateDecoyRoundUnits,
      effects: units && units[0].effects ? effects : undefined,
      targetId: validateSpyTargetId,
      isDecoy,
      isSpy,
      isWeather,
      isMedic,
      userId: isAuthenticatedResponse instanceof Error ? undefined : isAuthenticatedResponse._id,
    })
  }

  expect(isAuthenticatedSpy.mock.calls).toEqual([
    [
      {
        context,
        label: 'playUnit mutation',
      },
    ],
  ])
  expect(isGamePlayerSpy.mock.calls).toEqual(
    isAuthenticatedResponse instanceof Error
      ? []
      : [
          [
            {
              gameId,
              userId: isAuthenticatedResponse?._id,
              label: 'playUnit mutation',
            },
          ],
        ]
  )
  expect(logRequestInfoSpy.mock.calls).toEqual(
    isAuthenticatedResponse instanceof Error || isGamePlayerResponse instanceof Error
      ? []
      : [
          [
            {
              args,
              info: null,
            },
          ],
        ]
  )
  const verifyMongoIdCalls: any[][] = []
  if (!(isAuthenticatedResponse instanceof Error) && !(isGamePlayerResponse instanceof Error)) {
    verifyMongoIdCalls.push([
      {
        ids: [unitId],
        label: 'Unit ID',
      },
    ])
  }
  expect(verifyMongoIdsSpy.mock.calls).toEqual(verifyMongoIdCalls)
  expect(validateGameSpy.mock.calls).toEqual(
    isAuthenticatedResponse instanceof Error ||
      isGamePlayerResponse instanceof Error ||
      (verifyMongoIdResponses && verifyMongoIdResponses[0] instanceof Error)
      ? []
      : [
          [
            {
              game: isGamePlayerResponse?.game,
              userId: isAuthenticatedResponse._id,
              status: GameStatus.Playing,
              turn: true,
              label: 'play units',
            },
          ],
        ]
  )
  expect(unitStoreGetSpy.mock.calls).toEqual(
    units
      ? [
          [
            {
              ids: [unitId],
            },
          ],
        ]
      : []
  )
  expect(effectsGetSpy.mock.calls).toEqual(
    units && units[0] && units[0].effects
      ? [
          [
            {
              ids: units[0].effects,
            },
          ],
        ]
      : []
  )
  expect(validateCombatSpy.mock.calls).toEqual(
    validateCombatResponse
      ? [
          [
            {
              combat: Combat.Siege,
              isDecoy,
              isWeather,
              logPrefix,
              unit: units && units[0],
            },
          ],
        ]
      : []
  )
  expect(validateDecoySpy.mock.calls).toEqual(
    expectedError
      ? []
      : [
          [
            {
              combat: validateCombatResponse,
              game:
                isGamePlayerResponse && !(isGamePlayerResponse instanceof Error)
                  ? isGamePlayerResponse.game
                  : undefined,
              isDecoy,
              logPrefix,
              resolverUtil: expect.any(Object),
              targetId,
              unit: units && units[0],
              userId: isAuthenticatedResponse instanceof Error ? undefined : isAuthenticatedResponse?._id,
            },
          ],
        ]
  )
  expect(validateSpySpy.mock.calls).toEqual(
    expectedError
      ? []
      : [
          [
            {
              game:
                isGamePlayerResponse && !(isGamePlayerResponse instanceof Error)
                  ? isGamePlayerResponse.game
                  : undefined,
              isSpy,
              logPrefix,
              resolverUtil: expect.any(Object),
              targetId,
              userId: isAuthenticatedResponse instanceof Error ? undefined : isAuthenticatedResponse?._id,
            },
          ],
        ]
  )
  expect(validateMedicSpy.mock.calls).toEqual(
    expectedError
      ? []
      : [
          [
            {
              player:
                isGamePlayerResponse && !(isGamePlayerResponse instanceof Error)
                  ? isGamePlayerResponse.player
                  : undefined,
              logPrefix,
              unit: units && units[0],
            },
          ],
        ]
  )
  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(warnSpy.mock.calls).toEqual(warnCalls)
  expect(traceSpy.mock.calls).toEqual(traceEnabled ? [[`${logPrefix} units: "${JSON.stringify(units)}"`]] : [])
}

function testValidateCombat({
  isDecoy,
  isWeather,
  unit,
  combat,
  logPrefix,
  expected,
  warnCalls = [],
}: {
  isDecoy?: boolean
  isWeather?: boolean
  unit: UnitDbObject
  combat?: Combat | null | undefined
  logPrefix: string
  expected: Combat | undefined | null | Error
  warnCalls?: string[][]
}) {
  const warnSpy = jest.fn().mockImplementation()
  PlayUnitValidation['logger'] = {
    warn: warnSpy,
  } as any

  if (expected instanceof Error) {
    expect(() =>
      PlayUnitValidation['validateCombat']({
        combat,
        isDecoy: Boolean(isDecoy),
        isWeather: Boolean(isWeather),
        logPrefix,
        unit,
      })
    ).toThrow(expected)
  } else {
    expect(
      PlayUnitValidation['validateCombat']({
        combat,
        isDecoy: Boolean(isDecoy),
        isWeather: Boolean(isWeather),
        logPrefix,
        unit,
      })
    ).toEqual(expected)
  }

  expect(warnSpy.mock.calls).toEqual(warnCalls)
}

async function testValidateDecoy({
  combat,
  isDecoy = true,
  targetId,
  logPrefix,
  userId = new ObjectId(),
  getFieldUnitResponse = undefined,
  getRoundUnitsResponse,
  expected,
  warnCalls = [],
  errorCalls = [],
}: {
  combat?: Combat | undefined | null
  isDecoy?: boolean
  targetId?: string | undefined | null
  logPrefix: string
  userId?: ObjectId
  getFieldUnitResponse?: FieldUnitDbObject | undefined | null
  getRoundUnitsResponse?: UnitDbObject[]
  expected: ValidatedDecoy | Error
  warnCalls?: string[][]
  errorCalls?: string[][]
}) {
  const game = TestUtil.getDbGame({})
  const unit = TestUtil.getDbUnit({})
  const resolverUtil = new ResolverUtil({
    logger: PlayUnitValidation['logger'],
    logPrefix,
  })

  const getFieldUnitSpy = jest.spyOn(GetFieldUnits, 'getFieldUnit')
  if (getFieldUnitResponse !== undefined) {
    getFieldUnitSpy.mockReturnValue(getFieldUnitResponse === null ? undefined : getFieldUnitResponse)
  }
  const getRoundUnitsSpy = jest.spyOn(getRoundUnits, 'default')
  if (getRoundUnitsResponse) {
    getRoundUnitsSpy.mockResolvedValue(getRoundUnitsResponse)
  }
  const warnSpy = jest.fn().mockImplementation()
  const errorSpy = jest.fn().mockImplementation()
  PlayUnitValidation['logger'] = {
    warn: warnSpy,
    error: errorSpy,
  } as any

  const promise = PlayUnitValidation['validateDecoy']({
    combat,
    game,
    isDecoy,
    logPrefix,
    resolverUtil,
    targetId,
    unit,
    userId,
  })
  if (expected instanceof Error) {
    await expect(promise).rejects.toThrow(expected)
  } else {
    await expect(promise).resolves.toEqual(expected)
  }

  expect(getFieldUnitSpy.mock.calls).toEqual(
    getFieldUnitResponse === undefined
      ? []
      : [
          [
            {
              game,
              unitId: targetId,
              userId,
            },
          ],
        ]
  )
  expect(getRoundUnitsSpy.mock.calls).toEqual(
    getRoundUnitsResponse
      ? [
          [
            {
              game,
              unitBeingPlayed: unit,
            },
          ],
        ]
      : []
  )
  expect(warnSpy.mock.calls).toEqual(warnCalls)
  expect(errorSpy.mock.calls).toEqual(errorCalls)
}

function testValidateSpy({
  game,
  isSpy = true,
  logPrefix,
  targetId,
  userId,
  expected,
  warnCalls = [],
}: {
  game: GameDbObject
  isSpy?: boolean
  logPrefix: string
  targetId?: string | undefined | null
  userId: ObjectId
  expected: string | undefined | null | Error
  warnCalls?: string[][]
}) {
  const resolverUtil = new ResolverUtil({
    logger: PlayUnitValidation['logger'],
    logPrefix,
  })
  const warnSpy = jest.fn().mockImplementation()
  PlayUnitValidation['logger'] = {
    warn: warnSpy,
  } as any

  if (expected instanceof Error) {
    expect(() =>
      PlayUnitValidation['validateSpy']({
        game,
        isSpy,
        logPrefix,
        resolverUtil,
        targetId,
        userId,
      })
    ).toThrow(expected)
  } else {
    expect(
      PlayUnitValidation['validateSpy']({
        game,
        isSpy,
        logPrefix,
        resolverUtil,
        targetId,
        userId,
      })
    ).toEqual(expected)
  }

  expect(warnSpy.mock.calls).toEqual(warnCalls)
}

function testValidateMedic({
  player,
  unit,
  logPrefix,
  error,
  warnCalls = [],
}: {
  player: GamePlayerDbObject
  unit: UnitDbObject
  logPrefix: string
  error?: Error
  warnCalls?: string[][]
}) {
  const warnSpy = jest.fn().mockImplementation()
  PlayUnitValidation['logger'] = {
    warn: warnSpy,
  } as any

  if (error) {
    expect(() =>
      PlayUnitValidation['validateMedic']({
        logPrefix,
        player,
        unit,
      })
    ).toThrow(error)
  } else {
    expect(
      PlayUnitValidation['validateMedic']({
        logPrefix,
        player,
        unit,
      })
    ).toEqual(undefined)
  }

  expect(warnSpy.mock.calls).toEqual(warnCalls)
}
