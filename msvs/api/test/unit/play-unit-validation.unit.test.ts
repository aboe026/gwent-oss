import { Combat, MutationPlayUnitArgs } from '@gwent/graphql-schema/resolver-typings'
import { Context } from '@gwent/graphql-schema/context'
import {
  DeckUnitDbObject,
  EffectDbObject,
  EffectKey,
  GameStatus,
  UnitDbObject,
  UserDbObject,
} from '@gwent/graphql-schema/database-typings'
import EffectStore from '../../src/database/stores/effect-store'
import GetBattlefieldUnit, {
  BattlefieldUnit,
} from '../../src/graphql/resolvers/mutations/play-unit/get-battlefield-unit'
import * as getRoundUnits from '../../src/graphql/resolvers/mutations/play-unit/get-round-units'
import Permissions, { GameAndPlayer } from '../../src/graphql/permissions'
import PlayUnitValidation from '../../src/graphql/resolvers/mutations/play-unit/play-unit-validation'
import ResolverUtil from '../../src/graphql/resolvers/resolver-util'
import TestUtil from '../util/test-util'
import UnitStore from '../../src/database/stores/unit-store'

describe('play-unit-validation', () => {
  const user = TestUtil.getDbUser({})
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
    const message = `Found more than 1 unit with ID "${deckUnit.unit}"`
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
  it('throws error if no combats specified and unit has multiple combats', async () => {
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
      combats: [Combat.Close, Combat.Ranged],
    })
    const logPrefix = `playUnit by "${user._id}" for unit "${deckUnit.unit}" on game "${game._id}"`
    const message = `Must specify combat: One of "${JSON.stringify(unit.combats)}".`
    await testPlayUnitValidation({
      isAuthenticatedResponse: user,
      isGamePlayerResponse: {
        game,
        player: game.players[0],
      },
      unitId: deckUnit.unit.toString(),
      units: [unit],
      logPrefix,
      expectedError: Error(message),
      warnCalls: [[`${logPrefix} failed: ${message}`]],
    })
  })
  it('throws error if combat specified does not match unit combats', async () => {
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
      combats: [Combat.Close, Combat.Ranged],
    })
    const logPrefix = `playUnit by "${user._id}" for unit "${deckUnit.unit}" on game "${game._id}"`
    const message = `Combat "${Combat.Siege}" does match unit combats of "${JSON.stringify(unit.combats)}".`
    await testPlayUnitValidation({
      isAuthenticatedResponse: user,
      isGamePlayerResponse: {
        game,
        player: game.players[0],
      },
      unitId: deckUnit.unit.toString(),
      combat: Combat.Siege,
      units: [unit],
      logPrefix,
      expectedError: Error(message),
      warnCalls: [[`${logPrefix} failed: ${message}`]],
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
    const existingModifier = TestUtil.getDbGameUnit({})
    const game = TestUtil.getDbGame({
      round: 1,
      players: [
        TestUtil.getDbGamePlayer({
          deck: TestUtil.getDbGameDeck({
            hand: [deckUnit],
          }),
          rounds: [
            TestUtil.getDbPlayerRound({
              close: {
                score: 0,
                units: [],
                modifier: existingModifier,
              },
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
      combat,
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
    const existingModifier = TestUtil.getDbGameUnit({})
    const game = TestUtil.getDbGame({
      round: 1,
      players: [
        TestUtil.getDbGamePlayer({
          deck: TestUtil.getDbGameDeck({
            hand: [deckUnit],
          }),
          rounds: [
            TestUtil.getDbPlayerRound({
              ranged: {
                score: 0,
                units: [],
                modifier: existingModifier,
              },
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
      combat,
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
    const existingModifier = TestUtil.getDbGameUnit({})
    const game = TestUtil.getDbGame({
      round: 1,
      players: [
        TestUtil.getDbGamePlayer({
          deck: TestUtil.getDbGameDeck({
            hand: [deckUnit],
          }),
          rounds: [
            TestUtil.getDbPlayerRound({
              siege: {
                score: 0,
                units: [],
                modifier: existingModifier,
              },
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
      combat,
      units: [unit],
      logPrefix,
      expectedError: Error(message),
      warnCalls: [[`${logPrefix} failed: ${message}`]],
    })
  })
  it('throws error if decoy without target', async () => {
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
    const logPrefix = `playUnit by "${user._id}" for unit "${deckUnit.unit}" on game "${game._id}"`
    const message = `Argument "target" required for units with "${EffectKey.Decoy}" effect.`
    await testPlayUnitValidation({
      isAuthenticatedResponse: user,
      isGamePlayerResponse: {
        game,
        player: game.players[0],
      },
      unitId: deckUnit.unit.toString(),
      units: [unit],
      logPrefix,
      effects,
      expectedDeckUnit: deckUnit,
      expectedError: Error(message),
      warnCalls: [[`${logPrefix} failed: ${message}`]],
    })
  })
  it('throws error if target id invalid', async () => {
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
    const logPrefix = `playUnit by "${user._id}" for unit "${deckUnit.unit}" on game "${game._id}"`
    const error = Error('verifyMongoIds error')
    await testPlayUnitValidation({
      isAuthenticatedResponse: user,
      isGamePlayerResponse: {
        game,
        player: game.players[0],
      },
      unitId: deckUnit.unit.toString(),
      units: [unit],
      logPrefix,
      targetId: 'invalid',
      effects,
      expectedDeckUnit: deckUnit,
      verifyMongoIdResponses: [undefined, error],
      expectedError: error,
    })
  })
  it('throws error if target not found on battlefield', async () => {
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
    const target = TestUtil.getDbGameUnit({})
    const logPrefix = `playUnit by "${user._id}" for unit "${deckUnit.unit}" on game "${game._id}"`
    const message = `Target "${target.unit}" does not exist on the battlefield for player "${user._id}".`
    await testPlayUnitValidation({
      isAuthenticatedResponse: user,
      isGamePlayerResponse: {
        game,
        player: game.players[0],
      },
      unitId: deckUnit.unit.toString(),
      units: [unit],
      logPrefix,
      targetId: target.unit.toString(),
      effects,
      expectedDeckUnit: deckUnit,
      verifyMongoIdResponses: [undefined, undefined],
      expectedError: Error(message),
      warnCalls: [[`${logPrefix} failed: ${message}`]],
    })
  })
  it('throws error if unit not found for target', async () => {
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
    const target = TestUtil.getDbGameUnit({})
    const logPrefix = `playUnit by "${user._id}" for unit "${deckUnit.unit}" on game "${game._id}"`
    const message = `Could not find Unit for target "${target.unit}".`
    await testPlayUnitValidation({
      isAuthenticatedResponse: user,
      isGamePlayerResponse: {
        game,
        player: game.players[0],
      },
      unitId: deckUnit.unit.toString(),
      units: [unit],
      logPrefix,
      targetId: target.unit.toString(),
      effects,
      expectedDeckUnit: deckUnit,
      verifyMongoIdResponses: [undefined, undefined],
      getBattlefieldUnitResponse: {
        row: Combat.Close,
        unit: target,
      },
      roundUnits: [],
      expectedError: Error(message),
      errorCalls: [[`${logPrefix} failed: ${message}`]],
    })
  })
  it('throws error if target is hero', async () => {
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
    const target = TestUtil.getDbGameUnit({})
    const targetUnit = TestUtil.getDbUnit({
      id: target.unit,
      hero: true,
    })
    const logPrefix = `playUnit by "${user._id}" for unit "${deckUnit.unit}" on game "${game._id}"`
    const message = `Invalid decoy target "${target.unit}": Cannot be hero.`
    await testPlayUnitValidation({
      isAuthenticatedResponse: user,
      isGamePlayerResponse: {
        game,
        player: game.players[0],
      },
      unitId: deckUnit.unit.toString(),
      units: [unit],
      logPrefix,
      targetId: target.unit.toString(),
      effects,
      expectedDeckUnit: deckUnit,
      verifyMongoIdResponses: [undefined, undefined],
      getBattlefieldUnitResponse: {
        row: Combat.Close,
        unit: target,
      },
      roundUnits: [targetUnit],
      expectedError: Error(message),
      warnCalls: [[`${logPrefix} failed: ${message}`]],
    })
  })
  it('throws error if target is special', async () => {
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
    const target = TestUtil.getDbGameUnit({})
    const targetUnit = TestUtil.getDbUnit({
      id: target.unit,
      special: true,
    })
    const logPrefix = `playUnit by "${user._id}" for unit "${deckUnit.unit}" on game "${game._id}"`
    const message = `Invalid decoy target "${target.unit}": Cannot be special.`
    await testPlayUnitValidation({
      isAuthenticatedResponse: user,
      isGamePlayerResponse: {
        game,
        player: game.players[0],
      },
      unitId: deckUnit.unit.toString(),
      units: [unit],
      logPrefix,
      targetId: target.unit.toString(),
      effects,
      expectedDeckUnit: deckUnit,
      verifyMongoIdResponses: [undefined, undefined],
      getBattlefieldUnitResponse: {
        row: Combat.Close,
        unit: target,
      },
      roundUnits: [targetUnit],
      expectedError: Error(message),
      warnCalls: [[`${logPrefix} failed: ${message}`]],
    })
  })
  it('throws error if combat specified does not match target combat', async () => {
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
    const target = TestUtil.getDbGameUnit({})
    const targetUnit = TestUtil.getDbUnit({
      id: target.unit,
      combats: [Combat.Close],
    })
    const logPrefix = `playUnit by "${user._id}" for unit "${deckUnit.unit}" on game "${game._id}"`
    const message = `Invalid combat "${Combat.Ranged}": Target "${target.unit}" is in row "${Combat.Close}".`
    await testPlayUnitValidation({
      isAuthenticatedResponse: user,
      isGamePlayerResponse: {
        game,
        player: game.players[0],
      },
      combat: Combat.Ranged,
      unitId: deckUnit.unit.toString(),
      units: [unit],
      logPrefix,
      targetId: target.unit.toString(),
      effects,
      expectedDeckUnit: deckUnit,
      verifyMongoIdResponses: [undefined, undefined],
      getBattlefieldUnitResponse: {
        row: Combat.Close,
        unit: target,
      },
      roundUnits: [targetUnit],
      expectedError: Error(message),
      warnCalls: [[`${logPrefix} failed: ${message}`]],
    })
  })
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
      expectedCombat: Combat.Ranged,
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
      combat: Combat.Siege,
      units: [unit],
      logPrefix,
      expectedCombat: Combat.Siege,
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
      combat: Combat.Siege,
      units: [unit],
      logPrefix,
      expectedCombat: Combat.Siege,
      expectedDeckUnit: deckUnit,
    })
  })
  it('retrieves effects and roundUnits if valid decoy', async () => {
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
    const target = TestUtil.getDbGameUnit({})
    const targetUnit = TestUtil.getDbUnit({
      id: target.unit,
    })
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
      roundUnits: [targetUnit],
      getBattlefieldUnitResponse: {
        row: Combat.Close,
        unit: target,
      },
      logPrefix,
      expectedDeckUnit: deckUnit,
      expectedCombat: Combat.Close,
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
      expectedCombat: undefined,
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
      expectedCombat: Combat.Ranged,
      expectedDeckUnit: deckUnit,
      traceEnabled: true,
    })
  })
})

async function testPlayUnitValidation({
  targetId,
  roundUnits,
  effects,
  isAuthenticatedResponse,
  isGamePlayerResponse,
  validateGameError,
  unitId = '',
  units,
  combat,
  logPrefix,
  verifyMongoIdResponses = [undefined],
  getBattlefieldUnitResponse,
  expectedError,
  expectedCombat,
  expectedDeckUnit,
  errorCalls = [],
  warnCalls = [],
  traceEnabled,
}: {
  targetId?: string
  roundUnits?: UnitDbObject[]
  effects?: EffectDbObject[]
  isAuthenticatedResponse: UserDbObject | Error
  isGamePlayerResponse?: GameAndPlayer | Error
  validateGameError?: Error
  unitId?: string
  units?: UnitDbObject[]
  combat?: Combat
  logPrefix?: string
  verifyMongoIdResponses?: (Error | undefined)[]
  getBattlefieldUnitResponse?: BattlefieldUnit | undefined
  expectedError?: Error
  expectedCombat?: Combat
  expectedDeckUnit?: DeckUnitDbObject
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
    combat,
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
  const getBattlefieldUnitSpy = jest
    .spyOn(GetBattlefieldUnit, 'getBattlefieldUnit')
    .mockReturnValue(getBattlefieldUnitResponse)
  const roundUnitsGetSpy = jest.spyOn(getRoundUnits, 'default')
  if (roundUnits) {
    roundUnitsGetSpy.mockResolvedValue(roundUnits)
  }
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
      combat: expectedCombat,
      deckUnit: expectedDeckUnit,
      game: isGamePlayerResponse && !(isGamePlayerResponse instanceof Error) ? isGamePlayerResponse.game : undefined,
      logPrefix,
      unit: units && units[0],
      roundUnits: roundUnits,
      effects: units && units[0].effects ? effects : undefined,
      targetId,
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
    if (verifyMongoIdResponses && verifyMongoIdResponses.length > 1) {
      verifyMongoIdCalls.push([
        {
          ids: [targetId],
          label: 'Target ID',
        },
      ])
    }
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
  expect(getBattlefieldUnitSpy.mock.calls).toEqual(
    !(isAuthenticatedResponse instanceof Error) &&
      verifyMongoIdResponses &&
      verifyMongoIdResponses.length === 2 &&
      verifyMongoIdResponses[1] === undefined
      ? [
          [
            {
              game:
                isGamePlayerResponse && !(isGamePlayerResponse instanceof Error)
                  ? isGamePlayerResponse.game
                  : undefined,
              unitId: targetId,
              userId: isAuthenticatedResponse._id,
            },
          ],
        ]
      : []
  )
  expect(roundUnitsGetSpy.mock.calls).toEqual(
    roundUnits
      ? [
          [
            {
              game:
                isGamePlayerResponse && !(isGamePlayerResponse instanceof Error)
                  ? isGamePlayerResponse.game
                  : undefined,
              unitBeingPlayed: units && units[0],
            },
          ],
        ]
      : []
  )
  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(warnSpy.mock.calls).toEqual(warnCalls)
  expect(traceSpy.mock.calls).toEqual(traceEnabled ? [[`${logPrefix} units: "${JSON.stringify(units)}"`]] : [])
}
