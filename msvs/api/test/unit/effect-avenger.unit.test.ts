import { ObjectId } from 'mongodb'

import {
  Combat,
  EffectDbObject,
  EffectKey,
  GameDbObject,
  GameUnitOrigin,
  UnitDbObject,
} from '@gwent/graphql-schema/database-typings'
import deepClone from '../util/deep-clone'
import EffectAvenger, {
  Avengings,
  RemovedGameUnit,
} from '../../src/graphql/resolvers/mutations/play-unit/effect-avenger'
import GetEffectWithKey from '../../src/graphql/resolvers/mutations/play-unit/get-effect-with-key'
import * as getRoundUnits from '../../src/graphql/resolvers/mutations/util/get-round-units'
import UnitStore from '../../src/database/stores/unit-store'
import TestUtil from '../util/test-util'

describe('effect-avenger', () => {
  describe('avengeRemovedUnits', () => {
    const logPrefix = 'log-prefix'
    it('throws error if removed unit not found', async () => {
      const game = TestUtil.getDbGame({
        round: 1,
        players: [
          TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          }),
          TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          }),
        ],
      })
      const avengeEffect = TestUtil.getDbEffect({
        key: EffectKey.Avenger,
      })
      const unit = TestUtil.getDbUnit({
        effects: [avengeEffect._id],
        effectPrefix: 'Hemdall',
      })
      const gameUnit = TestUtil.getDbGameUnit({
        id: unit._id,
      })
      const message = `Could not find unit for removed game unit "${unit._id}"`
      await testAvengeRemovedUnits({
        game,
        battlefieldUnits: [],
        logPrefix,
        removedGameUnits: [
          {
            unit: gameUnit,
            user: game.players[0].user,
          },
        ],
        getEffectWithKeyResponse: avengeEffect,
        expected: Error(`${message}.`),
        errorCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('throws error if removed unit with avenger does not have effectPrefix', async () => {
      const game = TestUtil.getDbGame({
        round: 1,
        players: [
          TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          }),
          TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          }),
        ],
      })
      const avengeEffect = TestUtil.getDbEffect({
        key: EffectKey.Avenger,
      })
      const unit = TestUtil.getDbUnit({
        effects: [avengeEffect._id],
      })
      const gameUnit = TestUtil.getDbGameUnit({
        id: unit._id,
      })
      const message = `Could not find name of unit to summon as avenger for removed game unit "${gameUnit.unit}"`
      await testAvengeRemovedUnits({
        game,
        battlefieldUnits: [unit],
        logPrefix,
        removedGameUnits: [
          {
            unit: gameUnit,
            user: game.players[0].user,
          },
        ],
        getEffectWithKeyResponse: avengeEffect,
        expected: Error(`${message}.`),
        errorCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('throws error if no unit found for avenging unit', async () => {
      const game = TestUtil.getDbGame({
        round: 1,
        players: [
          TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          }),
          TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          }),
        ],
      })
      const avengeEffect = TestUtil.getDbEffect({
        key: EffectKey.Avenger,
      })
      const unit = TestUtil.getDbUnit({
        effects: [avengeEffect._id],
        effectPrefix: 'Hemdall',
      })
      const gameUnit = TestUtil.getDbGameUnit({
        id: unit._id,
      })
      const avengerUnit = TestUtil.getDbUnit({
        name: 'Hemdall',
        combats: [Combat.Close],
      })
      const message = `Could not find avenger unit "${avengerUnit.name}" for removed game unit "${unit._id}"`
      await testAvengeRemovedUnits({
        game,
        battlefieldUnits: [unit],
        logPrefix,
        removedGameUnits: [
          {
            unit: gameUnit,
            user: game.players[0].user,
          },
        ],
        getEffectWithKeyResponse: avengeEffect,
        unitStoreGetResponse: [],
        expected: Error(`${message}.`),
        getRoundUnitsCalls: [
          [
            {
              game,
              units: [unit],
              playerId: game.players[0].user,
            },
          ],
        ],
        unitStoreGetCalls: [
          [
            {
              names: [avengerUnit.name],
            },
          ],
        ],
        errorCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('throws error if multiple units found for avenging unit', async () => {
      const game = TestUtil.getDbGame({
        round: 1,
        players: [
          TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          }),
          TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          }),
        ],
      })
      const avengeEffect = TestUtil.getDbEffect({
        key: EffectKey.Avenger,
      })
      const unit = TestUtil.getDbUnit({
        effects: [avengeEffect._id],
        effectPrefix: 'Hemdall',
      })
      const gameUnit = TestUtil.getDbGameUnit({
        id: unit._id,
      })
      const avengerUnit = TestUtil.getDbUnit({
        name: 'Hemdall',
        combats: [Combat.Close],
      })
      const message = `Found more than 1 avenger unit "${avengerUnit.name}" for removed game unit "${unit._id}"`
      await testAvengeRemovedUnits({
        game,
        battlefieldUnits: [unit],
        logPrefix,
        removedGameUnits: [
          {
            unit: gameUnit,
            user: game.players[0].user,
          },
        ],
        getEffectWithKeyResponse: avengeEffect,
        unitStoreGetResponse: [avengerUnit, avengerUnit],
        expected: Error(`${message}.`),
        getRoundUnitsCalls: [
          [
            {
              game,
              units: [unit],
              playerId: game.players[0].user,
            },
          ],
        ],
        unitStoreGetCalls: [
          [
            {
              names: [avengerUnit.name],
            },
          ],
        ],
        errorCalls: [
          [`${logPrefix} failed: ${message}, avengerUnits: "${JSON.stringify([avengerUnit, avengerUnit])}"`],
        ],
      })
    })
    it('throws error if removed game unit user not player on game', async () => {
      const game = TestUtil.getDbGame({
        round: 1,
        players: [
          TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          }),
          TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          }),
        ],
      })
      const avengeEffect = TestUtil.getDbEffect({
        key: EffectKey.Avenger,
      })
      const unit = TestUtil.getDbUnit({
        effects: [avengeEffect._id],
        effectPrefix: 'Hemdall',
      })
      const gameUnit = TestUtil.getDbGameUnit({
        id: unit._id,
      })
      const avengerUnit = TestUtil.getDbUnit({
        name: 'Hemdall',
        combats: [Combat.Close],
      })
      const userId = new ObjectId()
      const message = `Could not find player "${userId}" for removed game unit "${gameUnit.unit}"`
      await testAvengeRemovedUnits({
        game,
        battlefieldUnits: [unit],
        logPrefix,
        removedGameUnits: [
          {
            unit: gameUnit,
            user: userId,
          },
        ],
        getEffectWithKeyResponse: avengeEffect,
        unitStoreGetResponse: [avengerUnit],
        expected: Error(`${message}.`),
        getRoundUnitsCalls: [
          [
            {
              game,
              units: [unit],
              playerId: userId,
            },
          ],
        ],
        unitStoreGetCalls: [
          [
            {
              names: [avengerUnit.name],
            },
          ],
        ],
        errorCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('throws error if avenging unit does not have combat', async () => {
      const game = TestUtil.getDbGame({
        round: 1,
        players: [
          TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          }),
          TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          }),
        ],
      })
      const avengeEffect = TestUtil.getDbEffect({
        key: EffectKey.Avenger,
      })
      const unit = TestUtil.getDbUnit({
        effects: [avengeEffect._id],
        effectPrefix: 'Hemdall',
      })
      const gameUnit = TestUtil.getDbGameUnit({
        id: unit._id,
      })
      const avengerUnit = TestUtil.getDbUnit({
        name: 'Hemdall',
      })
      const message = `Could not determine combat of avenger unit "${avengerUnit.name}" for removed game unit "${gameUnit.unit}"`
      await testAvengeRemovedUnits({
        game,
        battlefieldUnits: [unit],
        logPrefix,
        removedGameUnits: [
          {
            unit: gameUnit,
            user: game.players[0].user,
          },
        ],
        getEffectWithKeyResponse: avengeEffect,
        unitStoreGetResponse: [avengerUnit],
        expected: Error(`${message}.`),
        getRoundUnitsCalls: [
          [
            {
              game,
              units: [unit],
              playerId: game.players[0].user,
            },
          ],
        ],
        unitStoreGetCalls: [
          [
            {
              names: [avengerUnit.name],
            },
          ],
        ],
        errorCalls: [[`${logPrefix} failed: ${message}, avengerUnit: "${JSON.stringify(avengerUnit)}"`]],
        debugCalls: [
          [
            `${logPrefix} removed unit "${unit.name}" has avenger effect, summoning "${avengerUnit.name}" to the battlefield for player "${game.players[0].user}" from "${GameUnitOrigin.Nondeck}"`,
          ],
        ],
      })
    })
    it('does nothing if no avenger effect', async () => {
      const game = TestUtil.getDbGame({
        round: 1,
        players: [
          TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          }),
          TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          }),
        ],
      })
      const avengeEffect = TestUtil.getDbEffect({
        key: EffectKey.Avenger,
      })
      const unit = TestUtil.getDbUnit({
        effects: [avengeEffect._id],
        effectPrefix: 'Hemdall',
      })
      const gameUnit = TestUtil.getDbGameUnit({
        id: unit._id,
      })
      await testAvengeRemovedUnits({
        game,
        battlefieldUnits: [unit],
        logPrefix,
        removedGameUnits: [
          {
            unit: gameUnit,
            user: game.players[0].user,
          },
        ],
        expected: {
          avengedUnits: [],
          impacts: {},
          undiscarded: {},
          unhanded: {},
        },
      })
    })
    it('does nothing if removed game unit does not have unit', async () => {
      const game = TestUtil.getDbGame({
        round: 1,
        players: [
          TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          }),
          TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          }),
        ],
      })
      const avengeEffect = TestUtil.getDbEffect({
        key: EffectKey.Avenger,
      })
      const unit = TestUtil.getDbUnit({
        effects: [avengeEffect._id],
        effectPrefix: 'Hemdall',
      })
      await testAvengeRemovedUnits({
        game,
        battlefieldUnits: [unit],
        logPrefix,
        removedGameUnits: [
          {
            user: game.players[0].user,
          },
        ],
        getEffectWithKeyResponse: avengeEffect,
        expected: {
          avengedUnits: [],
          impacts: {},
          undiscarded: {},
          unhanded: {},
        },
      })
    })
    it('does nothing if removed unit does not have avenger effect', async () => {
      const game = TestUtil.getDbGame({
        round: 1,
        players: [
          TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          }),
          TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          }),
        ],
      })
      const avengeEffect = TestUtil.getDbEffect({
        key: EffectKey.Avenger,
      })
      const unit = TestUtil.getDbUnit({
        effectPrefix: 'Hemdall',
      })
      const gameUnit = TestUtil.getDbGameUnit({
        id: unit._id,
      })
      await testAvengeRemovedUnits({
        game,
        battlefieldUnits: [unit],
        logPrefix,
        removedGameUnits: [
          {
            unit: gameUnit,
            user: game.players[0].user,
          },
        ],
        getEffectWithKeyResponse: avengeEffect,
        expected: {
          avengedUnits: [],
          impacts: {},
          undiscarded: {},
          unhanded: {},
        },
      })
    })
    it('does nothing if avenging unit already on battlefield', async () => {
      const game = TestUtil.getDbGame({
        round: 1,
        players: [
          TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          }),
          TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          }),
        ],
      })
      const avengeEffect = TestUtil.getDbEffect({
        key: EffectKey.Avenger,
      })
      const unit = TestUtil.getDbUnit({
        effects: [avengeEffect._id],
        effectPrefix: 'Hemdall',
      })
      const gameUnit = TestUtil.getDbGameUnit({
        id: unit._id,
      })
      const avengerUnit = TestUtil.getDbUnit({
        name: 'Hemdall',
        combats: [Combat.Close],
      })
      await testAvengeRemovedUnits({
        game,
        battlefieldUnits: [unit],
        logPrefix,
        removedGameUnits: [
          {
            unit: gameUnit,
            user: game.players[0].user,
          },
        ],
        getEffectWithKeyResponse: avengeEffect,
        getRoundUnitsResponse: [avengerUnit],
        expected: {
          avengedUnits: [],
          impacts: {},
          undiscarded: {},
          unhanded: {},
        },
        getRoundUnitsCalls: [
          [
            {
              game,
              units: [unit],
              playerId: game.players[0].user,
            },
          ],
        ],
        debugCalls: [
          [
            `${logPrefix} removed unit "${unit.name}" has avenger effect, but "${avengerUnit.name}" already on the battlefield`,
          ],
        ],
      })
    })
    it('returns impact for single avenging unit from nondeck with close combat', async () => {
      const game = TestUtil.getDbGame({
        round: 1,
        players: [
          TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          }),
          TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          }),
        ],
      })
      const avengeEffect = TestUtil.getDbEffect({
        key: EffectKey.Avenger,
      })
      const unit = TestUtil.getDbUnit({
        effects: [avengeEffect._id],
        effectPrefix: 'Hemdall',
      })
      const gameUnit = TestUtil.getDbGameUnit({
        id: unit._id,
      })
      const avengerUnit = TestUtil.getDbUnit({
        name: 'Hemdall',
        combats: [Combat.Close],
      })
      await testAvengeRemovedUnits({
        game,
        battlefieldUnits: [unit],
        logPrefix,
        removedGameUnits: [
          {
            unit: gameUnit,
            user: game.players[0].user,
          },
        ],
        getEffectWithKeyResponse: avengeEffect,
        unitStoreGetResponse: [avengerUnit],
        expected: {
          avengedUnits: [avengerUnit],
          impacts: {
            [avengerUnit._id.toString()]: [
              TestUtil.getDbImpact({
                unit: gameUnit,
                user: game.players[0].user,
                source: {
                  origin: GameUnitOrigin.Nondeck,
                },
              }),
            ],
          },
          undiscarded: {},
          unhanded: {},
        },
        updatedGame: {
          ...deepClone(game),
          players: [
            {
              ...game.players[0],
              rounds: [
                {
                  ...game.players[0].rounds[0],
                  close: {
                    ...game.players[0].rounds[0].close,
                    units: [
                      TestUtil.getDbFieldUnit({
                        id: avengerUnit._id,
                      }),
                    ],
                  },
                },
              ],
            },
            game.players[1],
          ],
        },
        getRoundUnitsCalls: [
          [
            {
              game,
              units: [unit],
              playerId: game.players[0].user,
            },
          ],
        ],
        unitStoreGetCalls: [
          [
            {
              names: [avengerUnit.name],
            },
          ],
        ],
        debugCalls: [
          [
            `${logPrefix} removed unit "${unit.name}" has avenger effect, summoning "${avengerUnit.name}" to the battlefield for player "${game.players[0].user}" from "${GameUnitOrigin.Nondeck}"`,
          ],
        ],
      })
    })
    it('returns impact for single avenging unit from hand with close combat', async () => {
      const avengeEffect = TestUtil.getDbEffect({
        key: EffectKey.Avenger,
      })
      const unit = TestUtil.getDbUnit({
        effects: [avengeEffect._id],
        effectPrefix: 'Hemdall',
      })
      const gameUnit = TestUtil.getDbGameUnit({
        id: unit._id,
      })
      const avengerUnit = TestUtil.getDbUnit({
        name: 'Hemdall',
        combats: [Combat.Close],
      })
      const handUnit = TestUtil.getDbDeckUnit({
        id: avengerUnit._id,
      })
      const game = TestUtil.getDbGame({
        round: 1,
        players: [
          TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [handUnit],
            }),
            rounds: [TestUtil.getDbPlayerRound({})],
          }),
          TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          }),
        ],
      })
      await testAvengeRemovedUnits({
        game,
        battlefieldUnits: [unit],
        logPrefix,
        removedGameUnits: [
          {
            unit: gameUnit,
            user: game.players[0].user,
          },
        ],
        getEffectWithKeyResponse: avengeEffect,
        unitStoreGetResponse: [avengerUnit],
        expected: {
          avengedUnits: [avengerUnit],
          impacts: {
            [avengerUnit._id.toString()]: [
              TestUtil.getDbImpact({
                unit: gameUnit,
                user: game.players[0].user,
                source: {
                  origin: GameUnitOrigin.Hand,
                },
              }),
            ],
          },
          undiscarded: {},
          unhanded: {
            [game.players[0].user.toString()]: [handUnit],
          },
        },
        updatedGame: {
          ...deepClone(game),
          players: [
            {
              ...game.players[0],
              rounds: [
                {
                  ...game.players[0].rounds[0],
                  close: {
                    ...game.players[0].rounds[0].close,
                    units: [
                      TestUtil.getDbFieldUnit({
                        id: avengerUnit._id,
                      }),
                    ],
                  },
                },
              ],
            },
            game.players[1],
          ],
        },
        getRoundUnitsCalls: [
          [
            {
              game,
              units: [unit],
              playerId: game.players[0].user,
            },
          ],
        ],
        unitStoreGetCalls: [
          [
            {
              names: [avengerUnit.name],
            },
          ],
        ],
        debugCalls: [
          [
            `${logPrefix} removed unit "${unit.name}" has avenger effect, summoning "${avengerUnit.name}" to the battlefield for player "${game.players[0].user}" from "${GameUnitOrigin.Hand}"`,
          ],
        ],
      })
    })
    it('returns impact for single avenging unit from discard with close combat', async () => {
      const avengeEffect = TestUtil.getDbEffect({
        key: EffectKey.Avenger,
      })
      const unit = TestUtil.getDbUnit({
        effects: [avengeEffect._id],
        effectPrefix: 'Hemdall',
      })
      const gameUnit = TestUtil.getDbGameUnit({
        id: unit._id,
      })
      const avengerUnit = TestUtil.getDbUnit({
        name: 'Hemdall',
        combats: [Combat.Close],
      })
      const discardUnit = TestUtil.getDbDeckUnit({
        id: avengerUnit._id,
      })
      const game = TestUtil.getDbGame({
        round: 1,
        players: [
          TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              discard: [discardUnit],
            }),
            rounds: [TestUtil.getDbPlayerRound({})],
          }),
          TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          }),
        ],
      })
      await testAvengeRemovedUnits({
        game,
        battlefieldUnits: [unit],
        logPrefix,
        removedGameUnits: [
          {
            unit: gameUnit,
            user: game.players[0].user,
          },
        ],
        getEffectWithKeyResponse: avengeEffect,
        unitStoreGetResponse: [avengerUnit],
        expected: {
          avengedUnits: [avengerUnit],
          impacts: {
            [avengerUnit._id.toString()]: [
              TestUtil.getDbImpact({
                unit: gameUnit,
                user: game.players[0].user,
                source: {
                  origin: GameUnitOrigin.Discard,
                },
              }),
            ],
          },
          undiscarded: {
            [game.players[0].user.toString()]: [discardUnit],
          },
          unhanded: {},
        },
        updatedGame: {
          ...deepClone(game),
          players: [
            {
              ...game.players[0],
              rounds: [
                {
                  ...game.players[0].rounds[0],
                  close: {
                    ...game.players[0].rounds[0].close,
                    units: [
                      TestUtil.getDbFieldUnit({
                        id: avengerUnit._id,
                      }),
                    ],
                  },
                },
              ],
            },
            game.players[1],
          ],
        },
        getRoundUnitsCalls: [
          [
            {
              game,
              units: [unit],
              playerId: game.players[0].user,
            },
          ],
        ],
        unitStoreGetCalls: [
          [
            {
              names: [avengerUnit.name],
            },
          ],
        ],
        debugCalls: [
          [
            `${logPrefix} removed unit "${unit.name}" has avenger effect, summoning "${avengerUnit.name}" to the battlefield for player "${game.players[0].user}" from "${GameUnitOrigin.Discard}"`,
          ],
        ],
      })
    })
    it('returns impact for single avenging unit from nondeck with ranged combat', async () => {
      const game = TestUtil.getDbGame({
        round: 1,
        players: [
          TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          }),
          TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          }),
        ],
      })
      const avengeEffect = TestUtil.getDbEffect({
        key: EffectKey.Avenger,
      })
      const unit = TestUtil.getDbUnit({
        effects: [avengeEffect._id],
        effectPrefix: 'Hemdall',
      })
      const gameUnit = TestUtil.getDbGameUnit({
        id: unit._id,
      })
      const avengerUnit = TestUtil.getDbUnit({
        name: 'Hemdall',
        combats: [Combat.Ranged],
      })
      await testAvengeRemovedUnits({
        game,
        battlefieldUnits: [unit],
        logPrefix,
        removedGameUnits: [
          {
            unit: gameUnit,
            user: game.players[0].user,
          },
        ],
        getEffectWithKeyResponse: avengeEffect,
        unitStoreGetResponse: [avengerUnit],
        expected: {
          avengedUnits: [avengerUnit],
          impacts: {
            [avengerUnit._id.toString()]: [
              TestUtil.getDbImpact({
                unit: gameUnit,
                user: game.players[0].user,
                source: {
                  origin: GameUnitOrigin.Nondeck,
                },
              }),
            ],
          },
          undiscarded: {},
          unhanded: {},
        },
        updatedGame: {
          ...deepClone(game),
          players: [
            {
              ...game.players[0],
              rounds: [
                {
                  ...game.players[0].rounds[0],
                  ranged: {
                    ...game.players[0].rounds[0].ranged,
                    units: [
                      TestUtil.getDbFieldUnit({
                        id: avengerUnit._id,
                        row: Combat.Ranged,
                      }),
                    ],
                  },
                },
              ],
            },
            game.players[1],
          ],
        },
        getRoundUnitsCalls: [
          [
            {
              game,
              units: [unit],
              playerId: game.players[0].user,
            },
          ],
        ],
        unitStoreGetCalls: [
          [
            {
              names: [avengerUnit.name],
            },
          ],
        ],
        debugCalls: [
          [
            `${logPrefix} removed unit "${unit.name}" has avenger effect, summoning "${avengerUnit.name}" to the battlefield for player "${game.players[0].user}" from "${GameUnitOrigin.Nondeck}"`,
          ],
        ],
      })
    })
    it('returns impact for single avenging unit from hand with ranged combat', async () => {
      const avengeEffect = TestUtil.getDbEffect({
        key: EffectKey.Avenger,
      })
      const unit = TestUtil.getDbUnit({
        effects: [avengeEffect._id],
        effectPrefix: 'Hemdall',
      })
      const gameUnit = TestUtil.getDbGameUnit({
        id: unit._id,
      })
      const avengerUnit = TestUtil.getDbUnit({
        name: 'Hemdall',
        combats: [Combat.Ranged],
      })
      const handUnit = TestUtil.getDbDeckUnit({
        id: avengerUnit._id,
      })
      const game = TestUtil.getDbGame({
        round: 1,
        players: [
          TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [handUnit],
            }),
            rounds: [TestUtil.getDbPlayerRound({})],
          }),
          TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          }),
        ],
      })
      await testAvengeRemovedUnits({
        game,
        battlefieldUnits: [unit],
        logPrefix,
        removedGameUnits: [
          {
            unit: gameUnit,
            user: game.players[0].user,
          },
        ],
        getEffectWithKeyResponse: avengeEffect,
        unitStoreGetResponse: [avengerUnit],
        expected: {
          avengedUnits: [avengerUnit],
          impacts: {
            [avengerUnit._id.toString()]: [
              TestUtil.getDbImpact({
                unit: gameUnit,
                user: game.players[0].user,
                source: {
                  origin: GameUnitOrigin.Hand,
                },
              }),
            ],
          },
          undiscarded: {},
          unhanded: {
            [game.players[0].user.toString()]: [handUnit],
          },
        },
        updatedGame: {
          ...deepClone(game),
          players: [
            {
              ...game.players[0],
              rounds: [
                {
                  ...game.players[0].rounds[0],
                  ranged: {
                    ...game.players[0].rounds[0].ranged,
                    units: [
                      TestUtil.getDbFieldUnit({
                        id: avengerUnit._id,
                        row: Combat.Ranged,
                      }),
                    ],
                  },
                },
              ],
            },
            game.players[1],
          ],
        },
        getRoundUnitsCalls: [
          [
            {
              game,
              units: [unit],
              playerId: game.players[0].user,
            },
          ],
        ],
        unitStoreGetCalls: [
          [
            {
              names: [avengerUnit.name],
            },
          ],
        ],
        debugCalls: [
          [
            `${logPrefix} removed unit "${unit.name}" has avenger effect, summoning "${avengerUnit.name}" to the battlefield for player "${game.players[0].user}" from "${GameUnitOrigin.Hand}"`,
          ],
        ],
      })
    })
    it('returns impact for single avenging unit from discard with ranged combat', async () => {
      const avengeEffect = TestUtil.getDbEffect({
        key: EffectKey.Avenger,
      })
      const unit = TestUtil.getDbUnit({
        effects: [avengeEffect._id],
        effectPrefix: 'Hemdall',
      })
      const gameUnit = TestUtil.getDbGameUnit({
        id: unit._id,
      })
      const avengerUnit = TestUtil.getDbUnit({
        name: 'Hemdall',
        combats: [Combat.Ranged],
      })
      const discardUnit = TestUtil.getDbDeckUnit({
        id: avengerUnit._id,
      })
      const game = TestUtil.getDbGame({
        round: 1,
        players: [
          TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              discard: [discardUnit],
            }),
            rounds: [TestUtil.getDbPlayerRound({})],
          }),
          TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          }),
        ],
      })
      await testAvengeRemovedUnits({
        game,
        battlefieldUnits: [unit],
        logPrefix,
        removedGameUnits: [
          {
            unit: gameUnit,
            user: game.players[0].user,
          },
        ],
        getEffectWithKeyResponse: avengeEffect,
        unitStoreGetResponse: [avengerUnit],
        expected: {
          avengedUnits: [avengerUnit],
          impacts: {
            [avengerUnit._id.toString()]: [
              TestUtil.getDbImpact({
                unit: gameUnit,
                user: game.players[0].user,
                source: {
                  origin: GameUnitOrigin.Discard,
                },
              }),
            ],
          },
          undiscarded: {
            [game.players[0].user.toString()]: [discardUnit],
          },
          unhanded: {},
        },
        updatedGame: {
          ...deepClone(game),
          players: [
            {
              ...game.players[0],
              rounds: [
                {
                  ...game.players[0].rounds[0],
                  ranged: {
                    ...game.players[0].rounds[0].ranged,
                    units: [
                      TestUtil.getDbFieldUnit({
                        id: avengerUnit._id,
                        row: Combat.Ranged,
                      }),
                    ],
                  },
                },
              ],
            },
            game.players[1],
          ],
        },
        getRoundUnitsCalls: [
          [
            {
              game,
              units: [unit],
              playerId: game.players[0].user,
            },
          ],
        ],
        unitStoreGetCalls: [
          [
            {
              names: [avengerUnit.name],
            },
          ],
        ],
        debugCalls: [
          [
            `${logPrefix} removed unit "${unit.name}" has avenger effect, summoning "${avengerUnit.name}" to the battlefield for player "${game.players[0].user}" from "${GameUnitOrigin.Discard}"`,
          ],
        ],
      })
    })
    it('returns impact for single avenging unit from nondeck with siege combat', async () => {
      const game = TestUtil.getDbGame({
        round: 1,
        players: [
          TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          }),
          TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          }),
        ],
      })
      const avengeEffect = TestUtil.getDbEffect({
        key: EffectKey.Avenger,
      })
      const unit = TestUtil.getDbUnit({
        effects: [avengeEffect._id],
        effectPrefix: 'Hemdall',
      })
      const gameUnit = TestUtil.getDbGameUnit({
        id: unit._id,
      })
      const avengerUnit = TestUtil.getDbUnit({
        name: 'Hemdall',
        combats: [Combat.Siege],
      })
      await testAvengeRemovedUnits({
        game,
        battlefieldUnits: [unit],
        logPrefix,
        removedGameUnits: [
          {
            unit: gameUnit,
            user: game.players[0].user,
          },
        ],
        getEffectWithKeyResponse: avengeEffect,
        unitStoreGetResponse: [avengerUnit],
        expected: {
          avengedUnits: [avengerUnit],
          impacts: {
            [avengerUnit._id.toString()]: [
              TestUtil.getDbImpact({
                unit: gameUnit,
                user: game.players[0].user,
                source: {
                  origin: GameUnitOrigin.Nondeck,
                },
              }),
            ],
          },
          undiscarded: {},
          unhanded: {},
        },
        updatedGame: {
          ...deepClone(game),
          players: [
            {
              ...game.players[0],
              rounds: [
                {
                  ...game.players[0].rounds[0],
                  siege: {
                    ...game.players[0].rounds[0].siege,
                    units: [
                      TestUtil.getDbFieldUnit({
                        id: avengerUnit._id,
                        row: Combat.Siege,
                      }),
                    ],
                  },
                },
              ],
            },
            game.players[1],
          ],
        },
        getRoundUnitsCalls: [
          [
            {
              game,
              units: [unit],
              playerId: game.players[0].user,
            },
          ],
        ],
        unitStoreGetCalls: [
          [
            {
              names: [avengerUnit.name],
            },
          ],
        ],
        debugCalls: [
          [
            `${logPrefix} removed unit "${unit.name}" has avenger effect, summoning "${avengerUnit.name}" to the battlefield for player "${game.players[0].user}" from "${GameUnitOrigin.Nondeck}"`,
          ],
        ],
      })
    })
    it('returns impact for single avenging unit from hand with siege combat', async () => {
      const avengeEffect = TestUtil.getDbEffect({
        key: EffectKey.Avenger,
      })
      const unit = TestUtil.getDbUnit({
        effects: [avengeEffect._id],
        effectPrefix: 'Hemdall',
      })
      const gameUnit = TestUtil.getDbGameUnit({
        id: unit._id,
      })
      const avengerUnit = TestUtil.getDbUnit({
        name: 'Hemdall',
        combats: [Combat.Siege],
      })
      const handUnit = TestUtil.getDbDeckUnit({
        id: avengerUnit._id,
      })
      const game = TestUtil.getDbGame({
        round: 1,
        players: [
          TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [handUnit],
            }),
            rounds: [TestUtil.getDbPlayerRound({})],
          }),
          TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          }),
        ],
      })
      await testAvengeRemovedUnits({
        game,
        battlefieldUnits: [unit],
        logPrefix,
        removedGameUnits: [
          {
            unit: gameUnit,
            user: game.players[0].user,
          },
        ],
        getEffectWithKeyResponse: avengeEffect,
        unitStoreGetResponse: [avengerUnit],
        expected: {
          avengedUnits: [avengerUnit],
          impacts: {
            [avengerUnit._id.toString()]: [
              TestUtil.getDbImpact({
                unit: gameUnit,
                user: game.players[0].user,
                source: {
                  origin: GameUnitOrigin.Hand,
                },
              }),
            ],
          },
          undiscarded: {},
          unhanded: {
            [game.players[0].user.toString()]: [handUnit],
          },
        },
        updatedGame: {
          ...deepClone(game),
          players: [
            {
              ...game.players[0],
              rounds: [
                {
                  ...game.players[0].rounds[0],
                  siege: {
                    ...game.players[0].rounds[0].siege,
                    units: [
                      TestUtil.getDbFieldUnit({
                        id: avengerUnit._id,
                        row: Combat.Siege,
                      }),
                    ],
                  },
                },
              ],
            },
            game.players[1],
          ],
        },
        getRoundUnitsCalls: [
          [
            {
              game,
              units: [unit],
              playerId: game.players[0].user,
            },
          ],
        ],
        unitStoreGetCalls: [
          [
            {
              names: [avengerUnit.name],
            },
          ],
        ],
        debugCalls: [
          [
            `${logPrefix} removed unit "${unit.name}" has avenger effect, summoning "${avengerUnit.name}" to the battlefield for player "${game.players[0].user}" from "${GameUnitOrigin.Hand}"`,
          ],
        ],
      })
    })
    it('returns impact for single avenging unit from discard with siege combat', async () => {
      const avengeEffect = TestUtil.getDbEffect({
        key: EffectKey.Avenger,
      })
      const unit = TestUtil.getDbUnit({
        effects: [avengeEffect._id],
        effectPrefix: 'Hemdall',
      })
      const gameUnit = TestUtil.getDbGameUnit({
        id: unit._id,
      })
      const avengerUnit = TestUtil.getDbUnit({
        name: 'Hemdall',
        combats: [Combat.Siege],
      })
      const discardUnit = TestUtil.getDbDeckUnit({
        id: avengerUnit._id,
      })
      const game = TestUtil.getDbGame({
        round: 1,
        players: [
          TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              discard: [discardUnit],
            }),
            rounds: [TestUtil.getDbPlayerRound({})],
          }),
          TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          }),
        ],
      })
      await testAvengeRemovedUnits({
        game,
        battlefieldUnits: [unit],
        logPrefix,
        removedGameUnits: [
          {
            unit: gameUnit,
            user: game.players[0].user,
          },
        ],
        getEffectWithKeyResponse: avengeEffect,
        unitStoreGetResponse: [avengerUnit],
        expected: {
          avengedUnits: [avengerUnit],
          impacts: {
            [avengerUnit._id.toString()]: [
              TestUtil.getDbImpact({
                unit: gameUnit,
                user: game.players[0].user,
                source: {
                  origin: GameUnitOrigin.Discard,
                },
              }),
            ],
          },
          undiscarded: {
            [game.players[0].user.toString()]: [discardUnit],
          },
          unhanded: {},
        },
        updatedGame: {
          ...deepClone(game),
          players: [
            {
              ...game.players[0],
              rounds: [
                {
                  ...game.players[0].rounds[0],
                  siege: {
                    ...game.players[0].rounds[0].siege,
                    units: [
                      TestUtil.getDbFieldUnit({
                        id: avengerUnit._id,
                        row: Combat.Siege,
                      }),
                    ],
                  },
                },
              ],
            },
            game.players[1],
          ],
        },
        getRoundUnitsCalls: [
          [
            {
              game,
              units: [unit],
              playerId: game.players[0].user,
            },
          ],
        ],
        unitStoreGetCalls: [
          [
            {
              names: [avengerUnit.name],
            },
          ],
        ],
        debugCalls: [
          [
            `${logPrefix} removed unit "${unit.name}" has avenger effect, summoning "${avengerUnit.name}" to the battlefield for player "${game.players[0].user}" from "${GameUnitOrigin.Discard}"`,
          ],
        ],
      })
    })
    it('returns impact for multiple avenging units from nondeck', async () => {
      const game = TestUtil.getDbGame({
        round: 1,
        players: [
          TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          }),
          TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          }),
        ],
      })
      const avengeEffect = TestUtil.getDbEffect({
        key: EffectKey.Avenger,
      })
      const unit = TestUtil.getDbUnit({
        effects: [avengeEffect._id],
        effectPrefix: 'Hemdall',
      })
      const gameUnit1 = TestUtil.getDbGameUnit({
        id: unit._id,
      })
      const gameUnit2 = TestUtil.getDbGameUnit({
        id: unit._id,
      })
      const avengerUnit = TestUtil.getDbUnit({
        name: 'Hemdall',
        combats: [Combat.Close],
      })
      await testAvengeRemovedUnits({
        game,
        battlefieldUnits: [unit],
        logPrefix,
        removedGameUnits: [
          {
            unit: gameUnit1,
            user: game.players[0].user,
          },
          {
            unit: gameUnit2,
            user: game.players[1].user,
          },
        ],
        getEffectWithKeyResponse: avengeEffect,
        unitStoreGetResponse: [avengerUnit],
        expected: {
          avengedUnits: [avengerUnit, avengerUnit],
          impacts: {
            [avengerUnit._id.toString()]: [
              TestUtil.getDbImpact({
                unit: gameUnit1,
                user: game.players[0].user,
                source: {
                  origin: GameUnitOrigin.Nondeck,
                },
              }),
              TestUtil.getDbImpact({
                unit: gameUnit2,
                user: game.players[1].user,
                source: {
                  origin: GameUnitOrigin.Nondeck,
                },
              }),
            ],
          },
          undiscarded: {},
          unhanded: {},
        },
        updatedGame: {
          ...deepClone(game),
          players: [
            {
              ...game.players[0],
              rounds: [
                {
                  ...game.players[0].rounds[0],
                  close: {
                    ...game.players[0].rounds[0].close,
                    units: [
                      TestUtil.getDbFieldUnit({
                        id: avengerUnit._id,
                      }),
                    ],
                  },
                },
              ],
            },
            {
              ...game.players[1],
              rounds: [
                {
                  ...game.players[1].rounds[0],
                  close: {
                    ...game.players[1].rounds[0].close,
                    units: [
                      TestUtil.getDbFieldUnit({
                        id: avengerUnit._id,
                      }),
                    ],
                  },
                },
              ],
            },
          ],
        },
        getRoundUnitsCalls: [
          [
            {
              game,
              units: [unit],
              playerId: game.players[0].user,
            },
          ],
          [
            {
              game,
              units: [unit],
              playerId: game.players[1].user,
            },
          ],
        ],
        unitStoreGetCalls: [
          [
            {
              names: [avengerUnit.name],
            },
          ],
          [
            {
              names: [avengerUnit.name],
            },
          ],
        ],
        debugCalls: [
          [
            `${logPrefix} removed unit "${unit.name}" has avenger effect, summoning "${avengerUnit.name}" to the battlefield for player "${game.players[0].user}" from "${GameUnitOrigin.Nondeck}"`,
          ],
          [
            `${logPrefix} removed unit "${unit.name}" has avenger effect, summoning "${avengerUnit.name}" to the battlefield for player "${game.players[1].user}" from "${GameUnitOrigin.Nondeck}"`,
          ],
        ],
      })
    })
    it('logs to trace if enabled', async () => {
      const game = TestUtil.getDbGame({
        round: 1,
        players: [
          TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          }),
          TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          }),
        ],
      })
      const avengeEffect = TestUtil.getDbEffect({
        key: EffectKey.Avenger,
      })
      const unit = TestUtil.getDbUnit({
        effects: [avengeEffect._id],
        effectPrefix: 'Hemdall',
      })
      const gameUnit = TestUtil.getDbGameUnit({
        id: unit._id,
      })
      const avengerUnit = TestUtil.getDbUnit({
        name: 'Hemdall',
        combats: [Combat.Close],
      })
      const removedGameUnits = [
        {
          unit: gameUnit,
          user: game.players[0].user,
        },
      ]
      await testAvengeRemovedUnits({
        game,
        battlefieldUnits: [unit],
        logPrefix,
        removedGameUnits,
        getEffectWithKeyResponse: avengeEffect,
        unitStoreGetResponse: [avengerUnit],
        expected: {
          avengedUnits: [avengerUnit],
          impacts: {
            [avengerUnit._id.toString()]: [
              TestUtil.getDbImpact({
                unit: gameUnit,
                user: game.players[0].user,
                source: {
                  origin: GameUnitOrigin.Nondeck,
                },
              }),
            ],
          },
          undiscarded: {},
          unhanded: {},
        },
        updatedGame: {
          ...deepClone(game),
          players: [
            {
              ...game.players[0],
              rounds: [
                {
                  ...game.players[0].rounds[0],
                  close: {
                    ...game.players[0].rounds[0].close,
                    units: [
                      TestUtil.getDbFieldUnit({
                        id: avengerUnit._id,
                      }),
                    ],
                  },
                },
              ],
            },
            game.players[1],
          ],
        },
        getRoundUnitsCalls: [
          [
            {
              game,
              units: [unit],
              playerId: game.players[0].user,
            },
          ],
        ],
        unitStoreGetCalls: [
          [
            {
              names: [avengerUnit.name],
            },
          ],
        ],
        debugCalls: [
          [
            `${logPrefix} removed unit "${unit.name}" has avenger effect, summoning "${avengerUnit.name}" to the battlefield for player "${game.players[0].user}" from "${GameUnitOrigin.Nondeck}"`,
          ],
        ],
        traceEnabled: true,
        traceCalls: [
          [`${logPrefix} removedGameUnits: "${JSON.stringify(removedGameUnits)}"`],
          [`${logPrefix} removedUnit: "${JSON.stringify(unit)}"`],
          [`${logPrefix} hasAvengerEffect: "true"`],
          [`${logPrefix} existingAvengerUnit: "undefined"`],
        ],
      })
    })
  })
})

async function testAvengeRemovedUnits({
  battlefieldUnits,
  game,
  logPrefix,
  removedGameUnits,
  getEffectWithKeyResponse,
  getRoundUnitsResponse = [],
  unitStoreGetResponse = [],
  expected,
  updatedGame,
  getRoundUnitsCalls = [],
  unitStoreGetCalls = [],
  errorCalls = [],
  debugCalls = [],
  traceCalls = [],
  traceEnabled,
}: {
  battlefieldUnits: UnitDbObject[]
  game: GameDbObject
  logPrefix: string
  removedGameUnits: RemovedGameUnit[]
  getRoundUnitsResponse?: UnitDbObject[]
  getEffectWithKeyResponse?: EffectDbObject
  unitStoreGetResponse?: UnitDbObject[]
  expected: Avengings | Error
  updatedGame?: GameDbObject
  getRoundUnitsCalls?: any[][]
  unitStoreGetCalls?: any[][]
  errorCalls?: any[][]
  debugCalls?: any[][]
  traceCalls?: any[][]
  traceEnabled?: boolean
}) {
  const effects = [
    TestUtil.getDbEffect({
      key: EffectKey.Avenger,
    }),
  ]
  const getEffectWithKeySpy = jest.spyOn(GetEffectWithKey, 'getEffectWithKey').mockReturnValue(getEffectWithKeyResponse)
  const getRoundUnitsSpy = jest.spyOn(getRoundUnits, 'default').mockResolvedValue(getRoundUnitsResponse)
  const unitStoreGetSpy = jest.spyOn(UnitStore, 'get').mockResolvedValue(unitStoreGetResponse)
  const errorSpy = jest.fn().mockImplementation()
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  EffectAvenger['logger'] = {
    error: errorSpy,
    debug: debugSpy,
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  const promise = EffectAvenger.avengeRemovedUnits({
    battlefieldUnits,
    effects,
    game,
    logPrefix,
    removedGameUnits,
  })
  if (expected instanceof Error) {
    await expect(promise).rejects.toThrow(expected)
  } else {
    await expect(promise).resolves.toEqual(expected)
  }
  expect(game).toEqual(updatedGame || game)

  expect(getEffectWithKeySpy.mock.calls).toEqual([
    [
      {
        effectKey: EffectKey.Avenger,
        effects,
        logPrefix,
      },
    ],
  ])
  expect(getRoundUnitsSpy.mock.calls).toEqual(getRoundUnitsCalls)
  expect(unitStoreGetSpy.mock.calls).toEqual(unitStoreGetCalls)
  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(traceSpy.mock.calls).toEqual(traceCalls)
}
