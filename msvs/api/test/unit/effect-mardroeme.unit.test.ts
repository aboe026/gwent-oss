import { ObjectId } from 'mongodb'

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
import EffectMardroeme, {
  Transformations,
  TransformPairs,
} from '../../src/graphql/resolvers/mutations/play-unit/effect-mardroeme'
import deepClone from '../util/deep-clone'
import GetEffectWithKey from '../../src/graphql/resolvers/mutations/play-unit/get-effect-with-key'
import * as getGameUnits from '../../src/graphql/resolvers/mutations/play-unit/get-game-units'
import TestUtil from '../util/test-util'
import UnitStore from '../../src/database/stores/unit-store'

describe('effect-mardroeme', () => {
  describe('transformBerserkers', () => {
    const logPrefix = 'log-prefix'
    it('does nothing if game turn is not player', async () => {
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      await testTransformBerserkers({
        logPrefix,
        game: TestUtil.getDbGame({}),
        newDeckUnit,
        battlefieldUnits: [
          TestUtil.getDbUnit({
            id: newDeckUnit.unit,
          }),
        ],
        expected: {
          impacts: {},
          mardroemingGameUnit: undefined,
          transformedGameUnits: [],
          transformedUnits: [],
        },
      })
    })
    it('does nothing if mardroeme effect not present', async () => {
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const player = TestUtil.getDbGamePlayer({
        rounds: [TestUtil.getDbPlayerRound({})],
      })
      await testTransformBerserkers({
        logPrefix,
        game: TestUtil.getDbGame({
          players: [player],
          turn: player.user,
          round: 1,
        }),
        newDeckUnit,
        battlefieldUnits: [
          TestUtil.getDbUnit({
            id: newDeckUnit.unit,
          }),
        ],
        getEffectWithKeyResponses: [
          undefined,
          TestUtil.getDbEffect({
            key: EffectKey.Berserker,
          }),
        ],
        expected: {
          impacts: {},
          mardroemingGameUnit: undefined,
          transformedGameUnits: [],
          transformedUnits: [],
        },
      })
    })
    it('does nothing if berserker effect not present', async () => {
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const player = TestUtil.getDbGamePlayer({
        rounds: [TestUtil.getDbPlayerRound({})],
      })
      await testTransformBerserkers({
        logPrefix,
        game: TestUtil.getDbGame({
          players: [player],
          turn: player.user,
          round: 1,
        }),
        newDeckUnit,
        battlefieldUnits: [
          TestUtil.getDbUnit({
            id: newDeckUnit.unit,
          }),
        ],
        getEffectWithKeyResponses: [
          TestUtil.getDbEffect({
            key: EffectKey.Mardroeme,
          }),
        ],
        expected: {
          impacts: {},
          mardroemingGameUnit: undefined,
          transformedGameUnits: [],
          transformedUnits: [],
        },
      })
    })
    it('does nothing if no mardroeme units', async () => {
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const player = TestUtil.getDbGamePlayer({
        rounds: [TestUtil.getDbPlayerRound({})],
      })
      const unit = TestUtil.getDbUnit({})
      await testTransformBerserkers({
        logPrefix,
        game: TestUtil.getDbGame({
          players: [player],
          turn: player.user,
          round: 1,
        }),
        newDeckUnit,
        battlefieldUnits: [
          TestUtil.getDbUnit({
            id: newDeckUnit.unit,
          }),
        ],
        getEffectWithKeyResponses: [
          TestUtil.getDbEffect({
            key: EffectKey.Mardroeme,
          }),
          TestUtil.getDbEffect({
            key: EffectKey.Berserker,
          }),
        ],
        getGameUnitsResponse: [
          TestUtil.getDbGameUnit({
            id: unit._id,
          }),
        ],
        getUnitsWithEffectResponses: [[], [unit]],
        expected: {
          impacts: {},
          mardroemingGameUnit: undefined,
          transformedGameUnits: [],
          transformedUnits: [],
        },
      })
    })
    it('does nothing if no berserker units', async () => {
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const player = TestUtil.getDbGamePlayer({
        rounds: [TestUtil.getDbPlayerRound({})],
      })
      const unit = TestUtil.getDbUnit({})
      await testTransformBerserkers({
        logPrefix,
        game: TestUtil.getDbGame({
          players: [player],
          turn: player.user,
          round: 1,
        }),
        newDeckUnit,
        battlefieldUnits: [
          TestUtil.getDbUnit({
            id: newDeckUnit.unit,
          }),
        ],
        getEffectWithKeyResponses: [
          TestUtil.getDbEffect({
            key: EffectKey.Mardroeme,
          }),
          TestUtil.getDbEffect({
            key: EffectKey.Berserker,
          }),
        ],
        getGameUnitsResponse: [
          TestUtil.getDbGameUnit({
            id: unit._id,
          }),
        ],
        getUnitsWithEffectResponses: [[unit], []],
        expected: {
          impacts: {},
          mardroemingGameUnit: undefined,
          transformedGameUnits: [],
          transformedUnits: [],
        },
      })
    })
    it('returns nothing if no transformedPairs', async () => {
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const player = TestUtil.getDbGamePlayer({
        rounds: [TestUtil.getDbPlayerRound({})],
      })
      const mardroemeUnit = TestUtil.getDbUnit({})
      const berserkerUnit = TestUtil.getDbUnit({})
      await testTransformBerserkers({
        logPrefix,
        game: TestUtil.getDbGame({
          players: [player],
          turn: player.user,
          round: 1,
        }),
        newDeckUnit,
        combat: Combat.Close,
        battlefieldUnits: [
          TestUtil.getDbUnit({
            id: newDeckUnit.unit,
          }),
        ],
        getEffectWithKeyResponses: [
          TestUtil.getDbEffect({
            key: EffectKey.Mardroeme,
          }),
          TestUtil.getDbEffect({
            key: EffectKey.Berserker,
          }),
        ],
        getGameUnitsResponse: [
          TestUtil.getDbGameUnit({
            id: mardroemeUnit._id,
          }),
        ],
        getUnitsWithEffectResponses: [[mardroemeUnit], [berserkerUnit]],
        replaceBerserkersWithVildkaarlResponse: [],
        expected: {
          impacts: {},
          mardroemingGameUnit: undefined,
          transformedGameUnits: [],
          transformedUnits: [],
        },
      })
    })
    describe('close', () => {
      const combat = Combat.Close
      it('returns single transformed unit if transformedPairs without impacts', async () => {
        const newDeckUnit = TestUtil.getDbDeckUnit({})
        const player = TestUtil.getDbGamePlayer({
          rounds: [TestUtil.getDbPlayerRound({})],
        })
        const mardroemeUnit = TestUtil.getDbUnit({})
        const berserkerUnit = TestUtil.getDbUnit({})
        const mardroemingGameUnit = TestUtil.getDbGameUnit({})
        const from = TestUtil.getDbGameUnit({})
        const unit = TestUtil.getDbUnit({})
        const to = TestUtil.getDbGameUnit({
          id: unit._id,
        })
        await testTransformBerserkers({
          logPrefix,
          game: TestUtil.getDbGame({
            players: [player],
            turn: player.user,
            round: 1,
          }),
          newDeckUnit,
          combat,
          battlefieldUnits: [
            TestUtil.getDbUnit({
              id: newDeckUnit.unit,
            }),
          ],
          getEffectWithKeyResponses: [
            TestUtil.getDbEffect({
              key: EffectKey.Mardroeme,
            }),
            TestUtil.getDbEffect({
              key: EffectKey.Berserker,
            }),
          ],
          getGameUnitsResponse: [
            TestUtil.getDbGameUnit({
              id: mardroemeUnit._id,
            }),
          ],
          getUnitsWithEffectResponses: [[mardroemeUnit], [berserkerUnit]],
          getMardroemingGameUnitResponse: mardroemingGameUnit,
          replaceBerserkersWithVildkaarlResponse: [
            {
              from,
              to,
              unit,
            },
          ],
          expected: {
            impacts: {},
            mardroemingGameUnit,
            transformedGameUnits: [to],
            transformedUnits: [unit],
          },
          debugCalls: [[`${logPrefix} transformed "${JSON.stringify([unit._id])}" berserkers into vildkaarls`]],
        })
      })
      it('returns multiple transformed units if transformedPairs without impacts', async () => {
        const newDeckUnit = TestUtil.getDbDeckUnit({})
        const player = TestUtil.getDbGamePlayer({
          rounds: [TestUtil.getDbPlayerRound({})],
        })
        const mardroemeUnit = TestUtil.getDbUnit({})
        const berserkerUnit = TestUtil.getDbUnit({})
        const mardroemingGameUnit = TestUtil.getDbGameUnit({})
        const from1 = TestUtil.getDbGameUnit({})
        const unit1 = TestUtil.getDbUnit({})
        const to1 = TestUtil.getDbGameUnit({
          id: unit1._id,
        })
        const from2 = TestUtil.getDbGameUnit({})
        const unit2 = TestUtil.getDbUnit({})
        const to2 = TestUtil.getDbGameUnit({
          id: unit2._id,
        })
        await testTransformBerserkers({
          logPrefix,
          game: TestUtil.getDbGame({
            players: [player],
            turn: player.user,
            round: 1,
          }),
          newDeckUnit,
          combat,
          battlefieldUnits: [
            TestUtil.getDbUnit({
              id: newDeckUnit.unit,
            }),
          ],
          getEffectWithKeyResponses: [
            TestUtil.getDbEffect({
              key: EffectKey.Mardroeme,
            }),
            TestUtil.getDbEffect({
              key: EffectKey.Berserker,
            }),
          ],
          getGameUnitsResponse: [
            TestUtil.getDbGameUnit({
              id: mardroemeUnit._id,
            }),
          ],
          getUnitsWithEffectResponses: [[mardroemeUnit], [berserkerUnit]],
          getMardroemingGameUnitResponse: mardroemingGameUnit,
          replaceBerserkersWithVildkaarlResponse: [
            {
              from: from1,
              to: to1,
              unit: unit1,
            },
            {
              from: from2,
              to: to2,
              unit: unit2,
            },
          ],
          expected: {
            impacts: {},
            mardroemingGameUnit,
            transformedGameUnits: [to1, to2],
            transformedUnits: [unit1, unit2],
          },
          debugCalls: [
            [`${logPrefix} transformed "${JSON.stringify([unit1._id, unit2._id])}" berserkers into vildkaarls`],
          ],
        })
      })
      it('returns single transformed unit if transformedPairs with impacts', async () => {
        const newDeckUnit = TestUtil.getDbDeckUnit({})
        const player = TestUtil.getDbGamePlayer({
          rounds: [TestUtil.getDbPlayerRound({})],
        })
        const mardroemeUnit = TestUtil.getDbUnit({
          id: newDeckUnit.unit,
        })
        const berserkerUnit = TestUtil.getDbUnit({})
        const mardroemingGameUnit = TestUtil.getDbGameUnit({})
        const from = TestUtil.getDbGameUnit({})
        const unit = TestUtil.getDbUnit({})
        const to = TestUtil.getDbGameUnit({
          id: unit._id,
        })
        await testTransformBerserkers({
          logPrefix,
          game: TestUtil.getDbGame({
            players: [player],
            turn: player.user,
            round: 1,
          }),
          newDeckUnit,
          combat,
          battlefieldUnits: [
            TestUtil.getDbUnit({
              id: newDeckUnit.unit,
            }),
          ],
          getEffectWithKeyResponses: [
            TestUtil.getDbEffect({
              key: EffectKey.Mardroeme,
            }),
            TestUtil.getDbEffect({
              key: EffectKey.Berserker,
            }),
          ],
          getGameUnitsResponse: [
            TestUtil.getDbGameUnit({
              id: mardroemeUnit._id,
            }),
          ],
          getUnitsWithEffectResponses: [[mardroemeUnit], [berserkerUnit]],
          getMardroemingGameUnitResponse: mardroemingGameUnit,
          replaceBerserkersWithVildkaarlResponse: [
            {
              from,
              to,
              unit,
            },
          ],
          expected: {
            impacts: {
              [newDeckUnit.unit.toString()]: [
                {
                  unit: from,
                  user: player.user,
                },
              ],
            },
            mardroemingGameUnit,
            transformedGameUnits: [to],
            transformedUnits: [unit],
          },
          debugCalls: [[`${logPrefix} transformed "${JSON.stringify([unit._id])}" berserkers into vildkaarls`]],
        })
      })
      it('returns multiple transformed units if transformedPairs with impacts', async () => {
        const newDeckUnit = TestUtil.getDbDeckUnit({})
        const player = TestUtil.getDbGamePlayer({
          rounds: [TestUtil.getDbPlayerRound({})],
        })
        const mardroemeUnit = TestUtil.getDbUnit({
          id: newDeckUnit.unit,
        })
        const berserkerUnit = TestUtil.getDbUnit({})
        const mardroemingGameUnit = TestUtil.getDbGameUnit({})
        const from1 = TestUtil.getDbGameUnit({})
        const unit1 = TestUtil.getDbUnit({})
        const to1 = TestUtil.getDbGameUnit({
          id: unit1._id,
        })
        const from2 = TestUtil.getDbGameUnit({})
        const unit2 = TestUtil.getDbUnit({})
        const to2 = TestUtil.getDbGameUnit({
          id: unit2._id,
        })
        await testTransformBerserkers({
          logPrefix,
          game: TestUtil.getDbGame({
            players: [player],
            turn: player.user,
            round: 1,
          }),
          newDeckUnit,
          combat,
          battlefieldUnits: [
            TestUtil.getDbUnit({
              id: newDeckUnit.unit,
            }),
          ],
          getEffectWithKeyResponses: [
            TestUtil.getDbEffect({
              key: EffectKey.Mardroeme,
            }),
            TestUtil.getDbEffect({
              key: EffectKey.Berserker,
            }),
          ],
          getGameUnitsResponse: [
            TestUtil.getDbGameUnit({
              id: mardroemeUnit._id,
            }),
          ],
          getUnitsWithEffectResponses: [[mardroemeUnit], [berserkerUnit]],
          getMardroemingGameUnitResponse: mardroemingGameUnit,
          replaceBerserkersWithVildkaarlResponse: [
            {
              from: from1,
              to: to1,
              unit: unit1,
            },
            {
              from: from2,
              to: to2,
              unit: unit2,
            },
          ],
          expected: {
            impacts: {
              [newDeckUnit.unit.toString()]: [
                {
                  unit: from1,
                  user: player.user,
                },
                {
                  unit: from2,
                  user: player.user,
                },
              ],
            },
            mardroemingGameUnit,
            transformedGameUnits: [to1, to2],
            transformedUnits: [unit1, unit2],
          },
          debugCalls: [
            [`${logPrefix} transformed "${JSON.stringify([unit1._id, unit2._id])}" berserkers into vildkaarls`],
          ],
        })
      })
    })
    describe('ranged', () => {
      const combat = Combat.Ranged
      it('returns single transformed unit if transformedPairs without impacts', async () => {
        const newDeckUnit = TestUtil.getDbDeckUnit({})
        const player = TestUtil.getDbGamePlayer({
          rounds: [TestUtil.getDbPlayerRound({})],
        })
        const mardroemeUnit = TestUtil.getDbUnit({})
        const berserkerUnit = TestUtil.getDbUnit({})
        const mardroemingGameUnit = TestUtil.getDbGameUnit({})
        const from = TestUtil.getDbGameUnit({})
        const unit = TestUtil.getDbUnit({})
        const to = TestUtil.getDbGameUnit({
          id: unit._id,
        })
        await testTransformBerserkers({
          logPrefix,
          game: TestUtil.getDbGame({
            players: [player],
            turn: player.user,
            round: 1,
          }),
          newDeckUnit,
          combat,
          battlefieldUnits: [
            TestUtil.getDbUnit({
              id: newDeckUnit.unit,
            }),
          ],
          getEffectWithKeyResponses: [
            TestUtil.getDbEffect({
              key: EffectKey.Mardroeme,
            }),
            TestUtil.getDbEffect({
              key: EffectKey.Berserker,
            }),
          ],
          getGameUnitsResponse: [
            TestUtil.getDbGameUnit({
              id: mardroemeUnit._id,
            }),
          ],
          getUnitsWithEffectResponses: [[mardroemeUnit], [berserkerUnit]],
          getMardroemingGameUnitResponse: mardroemingGameUnit,
          replaceBerserkersWithVildkaarlResponse: [
            {
              from,
              to,
              unit,
            },
          ],
          expected: {
            impacts: {},
            mardroemingGameUnit,
            transformedGameUnits: [to],
            transformedUnits: [unit],
          },
          debugCalls: [[`${logPrefix} transformed "${JSON.stringify([unit._id])}" berserkers into vildkaarls`]],
        })
      })
      it('returns multiple transformed units if transformedPairs without impacts', async () => {
        const newDeckUnit = TestUtil.getDbDeckUnit({})
        const player = TestUtil.getDbGamePlayer({
          rounds: [TestUtil.getDbPlayerRound({})],
        })
        const mardroemeUnit = TestUtil.getDbUnit({})
        const berserkerUnit = TestUtil.getDbUnit({})
        const mardroemingGameUnit = TestUtil.getDbGameUnit({})
        const from1 = TestUtil.getDbGameUnit({})
        const unit1 = TestUtil.getDbUnit({})
        const to1 = TestUtil.getDbGameUnit({
          id: unit1._id,
        })
        const from2 = TestUtil.getDbGameUnit({})
        const unit2 = TestUtil.getDbUnit({})
        const to2 = TestUtil.getDbGameUnit({
          id: unit2._id,
        })
        await testTransformBerserkers({
          logPrefix,
          game: TestUtil.getDbGame({
            players: [player],
            turn: player.user,
            round: 1,
          }),
          newDeckUnit,
          combat,
          battlefieldUnits: [
            TestUtil.getDbUnit({
              id: newDeckUnit.unit,
            }),
          ],
          getEffectWithKeyResponses: [
            TestUtil.getDbEffect({
              key: EffectKey.Mardroeme,
            }),
            TestUtil.getDbEffect({
              key: EffectKey.Berserker,
            }),
          ],
          getGameUnitsResponse: [
            TestUtil.getDbGameUnit({
              id: mardroemeUnit._id,
            }),
          ],
          getUnitsWithEffectResponses: [[mardroemeUnit], [berserkerUnit]],
          getMardroemingGameUnitResponse: mardroemingGameUnit,
          replaceBerserkersWithVildkaarlResponse: [
            {
              from: from1,
              to: to1,
              unit: unit1,
            },
            {
              from: from2,
              to: to2,
              unit: unit2,
            },
          ],
          expected: {
            impacts: {},
            mardroemingGameUnit,
            transformedGameUnits: [to1, to2],
            transformedUnits: [unit1, unit2],
          },
          debugCalls: [
            [`${logPrefix} transformed "${JSON.stringify([unit1._id, unit2._id])}" berserkers into vildkaarls`],
          ],
        })
      })
      it('returns single transformed unit if transformedPairs with impacts', async () => {
        const newDeckUnit = TestUtil.getDbDeckUnit({})
        const player = TestUtil.getDbGamePlayer({
          rounds: [TestUtil.getDbPlayerRound({})],
        })
        const mardroemeUnit = TestUtil.getDbUnit({
          id: newDeckUnit.unit,
        })
        const berserkerUnit = TestUtil.getDbUnit({})
        const mardroemingGameUnit = TestUtil.getDbGameUnit({})
        const from = TestUtil.getDbGameUnit({})
        const unit = TestUtil.getDbUnit({})
        const to = TestUtil.getDbGameUnit({
          id: unit._id,
        })
        await testTransformBerserkers({
          logPrefix,
          game: TestUtil.getDbGame({
            players: [player],
            turn: player.user,
            round: 1,
          }),
          newDeckUnit,
          combat,
          battlefieldUnits: [
            TestUtil.getDbUnit({
              id: newDeckUnit.unit,
            }),
          ],
          getEffectWithKeyResponses: [
            TestUtil.getDbEffect({
              key: EffectKey.Mardroeme,
            }),
            TestUtil.getDbEffect({
              key: EffectKey.Berserker,
            }),
          ],
          getGameUnitsResponse: [
            TestUtil.getDbGameUnit({
              id: mardroemeUnit._id,
            }),
          ],
          getUnitsWithEffectResponses: [[mardroemeUnit], [berserkerUnit]],
          getMardroemingGameUnitResponse: mardroemingGameUnit,
          replaceBerserkersWithVildkaarlResponse: [
            {
              from,
              to,
              unit,
            },
          ],
          expected: {
            impacts: {
              [newDeckUnit.unit.toString()]: [
                {
                  unit: from,
                  user: player.user,
                },
              ],
            },
            mardroemingGameUnit,
            transformedGameUnits: [to],
            transformedUnits: [unit],
          },
          debugCalls: [[`${logPrefix} transformed "${JSON.stringify([unit._id])}" berserkers into vildkaarls`]],
        })
      })
      it('returns multiple transformed units if transformedPairs with impacts', async () => {
        const newDeckUnit = TestUtil.getDbDeckUnit({})
        const player = TestUtil.getDbGamePlayer({
          rounds: [TestUtil.getDbPlayerRound({})],
        })
        const mardroemeUnit = TestUtil.getDbUnit({
          id: newDeckUnit.unit,
        })
        const berserkerUnit = TestUtil.getDbUnit({})
        const mardroemingGameUnit = TestUtil.getDbGameUnit({})
        const from1 = TestUtil.getDbGameUnit({})
        const unit1 = TestUtil.getDbUnit({})
        const to1 = TestUtil.getDbGameUnit({
          id: unit1._id,
        })
        const from2 = TestUtil.getDbGameUnit({})
        const unit2 = TestUtil.getDbUnit({})
        const to2 = TestUtil.getDbGameUnit({
          id: unit2._id,
        })
        await testTransformBerserkers({
          logPrefix,
          game: TestUtil.getDbGame({
            players: [player],
            turn: player.user,
            round: 1,
          }),
          newDeckUnit,
          combat,
          battlefieldUnits: [
            TestUtil.getDbUnit({
              id: newDeckUnit.unit,
            }),
          ],
          getEffectWithKeyResponses: [
            TestUtil.getDbEffect({
              key: EffectKey.Mardroeme,
            }),
            TestUtil.getDbEffect({
              key: EffectKey.Berserker,
            }),
          ],
          getGameUnitsResponse: [
            TestUtil.getDbGameUnit({
              id: mardroemeUnit._id,
            }),
          ],
          getUnitsWithEffectResponses: [[mardroemeUnit], [berserkerUnit]],
          getMardroemingGameUnitResponse: mardroemingGameUnit,
          replaceBerserkersWithVildkaarlResponse: [
            {
              from: from1,
              to: to1,
              unit: unit1,
            },
            {
              from: from2,
              to: to2,
              unit: unit2,
            },
          ],
          expected: {
            impacts: {
              [newDeckUnit.unit.toString()]: [
                {
                  unit: from1,
                  user: player.user,
                },
                {
                  unit: from2,
                  user: player.user,
                },
              ],
            },
            mardroemingGameUnit,
            transformedGameUnits: [to1, to2],
            transformedUnits: [unit1, unit2],
          },
          debugCalls: [
            [`${logPrefix} transformed "${JSON.stringify([unit1._id, unit2._id])}" berserkers into vildkaarls`],
          ],
        })
      })
    })
    describe('siege', () => {
      const combat = Combat.Siege
      it('returns single transformed unit if transformedPairs without impacts', async () => {
        const newDeckUnit = TestUtil.getDbDeckUnit({})
        const player = TestUtil.getDbGamePlayer({
          rounds: [TestUtil.getDbPlayerRound({})],
        })
        const mardroemeUnit = TestUtil.getDbUnit({})
        const berserkerUnit = TestUtil.getDbUnit({})
        const mardroemingGameUnit = TestUtil.getDbGameUnit({})
        const from = TestUtil.getDbGameUnit({})
        const unit = TestUtil.getDbUnit({})
        const to = TestUtil.getDbGameUnit({
          id: unit._id,
        })
        await testTransformBerserkers({
          logPrefix,
          game: TestUtil.getDbGame({
            players: [player],
            turn: player.user,
            round: 1,
          }),
          newDeckUnit,
          combat,
          battlefieldUnits: [
            TestUtil.getDbUnit({
              id: newDeckUnit.unit,
            }),
          ],
          getEffectWithKeyResponses: [
            TestUtil.getDbEffect({
              key: EffectKey.Mardroeme,
            }),
            TestUtil.getDbEffect({
              key: EffectKey.Berserker,
            }),
          ],
          getGameUnitsResponse: [
            TestUtil.getDbGameUnit({
              id: mardroemeUnit._id,
            }),
          ],
          getUnitsWithEffectResponses: [[mardroemeUnit], [berserkerUnit]],
          getMardroemingGameUnitResponse: mardroemingGameUnit,
          replaceBerserkersWithVildkaarlResponse: [
            {
              from,
              to,
              unit,
            },
          ],
          expected: {
            impacts: {},
            mardroemingGameUnit,
            transformedGameUnits: [to],
            transformedUnits: [unit],
          },
          debugCalls: [[`${logPrefix} transformed "${JSON.stringify([unit._id])}" berserkers into vildkaarls`]],
        })
      })
      it('returns multiple transformed units if transformedPairs without impacts', async () => {
        const newDeckUnit = TestUtil.getDbDeckUnit({})
        const player = TestUtil.getDbGamePlayer({
          rounds: [TestUtil.getDbPlayerRound({})],
        })
        const mardroemeUnit = TestUtil.getDbUnit({})
        const berserkerUnit = TestUtil.getDbUnit({})
        const mardroemingGameUnit = TestUtil.getDbGameUnit({})
        const from1 = TestUtil.getDbGameUnit({})
        const unit1 = TestUtil.getDbUnit({})
        const to1 = TestUtil.getDbGameUnit({
          id: unit1._id,
        })
        const from2 = TestUtil.getDbGameUnit({})
        const unit2 = TestUtil.getDbUnit({})
        const to2 = TestUtil.getDbGameUnit({
          id: unit2._id,
        })
        await testTransformBerserkers({
          logPrefix,
          game: TestUtil.getDbGame({
            players: [player],
            turn: player.user,
            round: 1,
          }),
          newDeckUnit,
          combat,
          battlefieldUnits: [
            TestUtil.getDbUnit({
              id: newDeckUnit.unit,
            }),
          ],
          getEffectWithKeyResponses: [
            TestUtil.getDbEffect({
              key: EffectKey.Mardroeme,
            }),
            TestUtil.getDbEffect({
              key: EffectKey.Berserker,
            }),
          ],
          getGameUnitsResponse: [
            TestUtil.getDbGameUnit({
              id: mardroemeUnit._id,
            }),
          ],
          getUnitsWithEffectResponses: [[mardroemeUnit], [berserkerUnit]],
          getMardroemingGameUnitResponse: mardroemingGameUnit,
          replaceBerserkersWithVildkaarlResponse: [
            {
              from: from1,
              to: to1,
              unit: unit1,
            },
            {
              from: from2,
              to: to2,
              unit: unit2,
            },
          ],
          expected: {
            impacts: {},
            mardroemingGameUnit,
            transformedGameUnits: [to1, to2],
            transformedUnits: [unit1, unit2],
          },
          debugCalls: [
            [`${logPrefix} transformed "${JSON.stringify([unit1._id, unit2._id])}" berserkers into vildkaarls`],
          ],
        })
      })
      it('returns single transformed unit if transformedPairs with impacts', async () => {
        const newDeckUnit = TestUtil.getDbDeckUnit({})
        const player = TestUtil.getDbGamePlayer({
          rounds: [TestUtil.getDbPlayerRound({})],
        })
        const mardroemeUnit = TestUtil.getDbUnit({
          id: newDeckUnit.unit,
        })
        const berserkerUnit = TestUtil.getDbUnit({})
        const mardroemingGameUnit = TestUtil.getDbGameUnit({})
        const from = TestUtil.getDbGameUnit({})
        const unit = TestUtil.getDbUnit({})
        const to = TestUtil.getDbGameUnit({
          id: unit._id,
        })
        await testTransformBerserkers({
          logPrefix,
          game: TestUtil.getDbGame({
            players: [player],
            turn: player.user,
            round: 1,
          }),
          newDeckUnit,
          combat,
          battlefieldUnits: [
            TestUtil.getDbUnit({
              id: newDeckUnit.unit,
            }),
          ],
          getEffectWithKeyResponses: [
            TestUtil.getDbEffect({
              key: EffectKey.Mardroeme,
            }),
            TestUtil.getDbEffect({
              key: EffectKey.Berserker,
            }),
          ],
          getGameUnitsResponse: [
            TestUtil.getDbGameUnit({
              id: mardroemeUnit._id,
            }),
          ],
          getUnitsWithEffectResponses: [[mardroemeUnit], [berserkerUnit]],
          getMardroemingGameUnitResponse: mardroemingGameUnit,
          replaceBerserkersWithVildkaarlResponse: [
            {
              from,
              to,
              unit,
            },
          ],
          expected: {
            impacts: {
              [newDeckUnit.unit.toString()]: [
                {
                  unit: from,
                  user: player.user,
                },
              ],
            },
            mardroemingGameUnit,
            transformedGameUnits: [to],
            transformedUnits: [unit],
          },
          debugCalls: [[`${logPrefix} transformed "${JSON.stringify([unit._id])}" berserkers into vildkaarls`]],
        })
      })
      it('returns multiple transformed units if transformedPairs with impacts', async () => {
        const newDeckUnit = TestUtil.getDbDeckUnit({})
        const player = TestUtil.getDbGamePlayer({
          rounds: [TestUtil.getDbPlayerRound({})],
        })
        const mardroemeUnit = TestUtil.getDbUnit({
          id: newDeckUnit.unit,
        })
        const berserkerUnit = TestUtil.getDbUnit({})
        const mardroemingGameUnit = TestUtil.getDbGameUnit({})
        const from1 = TestUtil.getDbGameUnit({})
        const unit1 = TestUtil.getDbUnit({})
        const to1 = TestUtil.getDbGameUnit({
          id: unit1._id,
        })
        const from2 = TestUtil.getDbGameUnit({})
        const unit2 = TestUtil.getDbUnit({})
        const to2 = TestUtil.getDbGameUnit({
          id: unit2._id,
        })
        await testTransformBerserkers({
          logPrefix,
          game: TestUtil.getDbGame({
            players: [player],
            turn: player.user,
            round: 1,
          }),
          newDeckUnit,
          combat,
          battlefieldUnits: [
            TestUtil.getDbUnit({
              id: newDeckUnit.unit,
            }),
          ],
          getEffectWithKeyResponses: [
            TestUtil.getDbEffect({
              key: EffectKey.Mardroeme,
            }),
            TestUtil.getDbEffect({
              key: EffectKey.Berserker,
            }),
          ],
          getGameUnitsResponse: [
            TestUtil.getDbGameUnit({
              id: mardroemeUnit._id,
            }),
          ],
          getUnitsWithEffectResponses: [[mardroemeUnit], [berserkerUnit]],
          getMardroemingGameUnitResponse: mardroemingGameUnit,
          replaceBerserkersWithVildkaarlResponse: [
            {
              from: from1,
              to: to1,
              unit: unit1,
            },
            {
              from: from2,
              to: to2,
              unit: unit2,
            },
          ],
          expected: {
            impacts: {
              [newDeckUnit.unit.toString()]: [
                {
                  unit: from1,
                  user: player.user,
                },
                {
                  unit: from2,
                  user: player.user,
                },
              ],
            },
            mardroemingGameUnit,
            transformedGameUnits: [to1, to2],
            transformedUnits: [unit1, unit2],
          },
          debugCalls: [
            [`${logPrefix} transformed "${JSON.stringify([unit1._id, unit2._id])}" berserkers into vildkaarls`],
          ],
        })
      })
    })
    it('logs to trace if enabled', async () => {
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const player = TestUtil.getDbGamePlayer({
        rounds: [TestUtil.getDbPlayerRound({})],
      })
      const mardroemeUnit = TestUtil.getDbUnit({})
      const berserkerUnit = TestUtil.getDbUnit({})
      const mardroemingGameUnit = TestUtil.getDbGameUnit({})
      const from = TestUtil.getDbGameUnit({})
      const unit = TestUtil.getDbUnit({})
      const to = TestUtil.getDbGameUnit({
        id: unit._id,
      })
      await testTransformBerserkers({
        logPrefix,
        game: TestUtil.getDbGame({
          players: [player],
          turn: player.user,
          round: 1,
        }),
        newDeckUnit,
        combat: Combat.Close,
        battlefieldUnits: [
          TestUtil.getDbUnit({
            id: newDeckUnit.unit,
          }),
        ],
        getEffectWithKeyResponses: [
          TestUtil.getDbEffect({
            key: EffectKey.Mardroeme,
          }),
          TestUtil.getDbEffect({
            key: EffectKey.Berserker,
          }),
        ],
        getGameUnitsResponse: [
          TestUtil.getDbGameUnit({
            id: mardroemeUnit._id,
          }),
        ],
        getUnitsWithEffectResponses: [[mardroemeUnit], [berserkerUnit]],
        getMardroemingGameUnitResponse: mardroemingGameUnit,
        replaceBerserkersWithVildkaarlResponse: [
          {
            from,
            to,
            unit,
          },
        ],
        expected: {
          impacts: {},
          mardroemingGameUnit,
          transformedGameUnits: [to],
          transformedUnits: [unit],
        },
        debugCalls: [[`${logPrefix} transformed "${JSON.stringify([unit._id])}" berserkers into vildkaarls`]],
        traceEnabled: true,
      })
    })
  })
  describe('getUnitsWithEffect', () => {
    it('throws error if battlefield unit does not exist', () => {
      const gameUnit = TestUtil.getDbGameUnit({})
      testGetUnitsWithEffect({
        battlefieldUnits: [],
        effect: TestUtil.getDbEffect({
          key: EffectKey.Berserker,
        }),
        gameUnits: [gameUnit],
        expected: Error(`Could not find battlefield unit for game unit "${gameUnit.unit}"`),
      })
    })
    it('returns empty array if no units have effect', () => {
      const unit = TestUtil.getDbUnit({})
      const gameUnit = TestUtil.getDbGameUnit({
        id: unit._id,
      })
      testGetUnitsWithEffect({
        battlefieldUnits: [unit],
        effect: TestUtil.getDbEffect({
          key: EffectKey.Berserker,
        }),
        gameUnits: [gameUnit],
        expected: [],
      })
    })
    it('returns single item if single match', () => {
      const effect = TestUtil.getDbEffect({
        key: EffectKey.Berserker,
      })
      const unit = TestUtil.getDbUnit({
        effects: [effect._id],
      })
      const gameUnit = TestUtil.getDbGameUnit({
        id: unit._id,
      })
      testGetUnitsWithEffect({
        battlefieldUnits: [unit],
        effect,
        gameUnits: [gameUnit],
        expected: [unit],
      })
    })
    it('returns single item if first out of many match', () => {
      const effect = TestUtil.getDbEffect({
        key: EffectKey.Berserker,
      })
      const unit1 = TestUtil.getDbUnit({
        effects: [effect._id],
      })
      const unit2 = TestUtil.getDbUnit({})
      const gameUnit1 = TestUtil.getDbGameUnit({
        id: unit1._id,
      })
      const gameUnit2 = TestUtil.getDbGameUnit({
        id: unit2._id,
      })
      testGetUnitsWithEffect({
        battlefieldUnits: [unit1, unit2],
        effect,
        gameUnits: [gameUnit1, gameUnit2],
        expected: [unit1],
      })
    })
    it('returns single item if last out of many match', () => {
      const effect = TestUtil.getDbEffect({
        key: EffectKey.Berserker,
      })
      const unit1 = TestUtil.getDbUnit({})
      const unit2 = TestUtil.getDbUnit({
        effects: [effect._id],
      })
      const gameUnit1 = TestUtil.getDbGameUnit({
        id: unit1._id,
      })
      const gameUnit2 = TestUtil.getDbGameUnit({
        id: unit2._id,
      })
      testGetUnitsWithEffect({
        battlefieldUnits: [unit1, unit2],
        effect,
        gameUnits: [gameUnit1, gameUnit2],
        expected: [unit2],
      })
    })
    it('returns multiple items if many match', () => {
      const effect = TestUtil.getDbEffect({
        key: EffectKey.Berserker,
      })
      const unit1 = TestUtil.getDbUnit({
        effects: [effect._id],
      })
      const unit2 = TestUtil.getDbUnit({
        effects: [effect._id],
      })
      const gameUnit1 = TestUtil.getDbGameUnit({
        id: unit1._id,
      })
      const gameUnit2 = TestUtil.getDbGameUnit({
        id: unit2._id,
      })
      testGetUnitsWithEffect({
        battlefieldUnits: [unit1, unit2],
        effect,
        gameUnits: [gameUnit1, gameUnit2],
        expected: [unit1, unit2],
      })
    })
  })
  describe('getMardroemingGameUnit', () => {
    it('throws error if mardroeming game unit not found', () => {
      const gameUnits: GameUnitDbObject[] = []
      testGetMardroemingGameUnit({
        gameUnits,
        mardroemes: [],
        expected: Error(`Could not find mardroeming game unit in "${JSON.stringify(gameUnits)}"`),
      })
    })
    it('returns mardroeming game unit if only gameUnit', () => {
      const mardroeme = TestUtil.getDbUnit({})
      const gameUnit = TestUtil.getDbGameUnit({
        id: mardroeme._id,
      })
      testGetMardroemingGameUnit({
        gameUnits: [gameUnit],
        mardroemes: [mardroeme],
        expected: gameUnit,
      })
    })
    it('returns mardroeming game unit if first of many gameUnit', () => {
      const mardroeme = TestUtil.getDbUnit({})
      const gameUnit1 = TestUtil.getDbGameUnit({
        id: mardroeme._id,
      })
      testGetMardroemingGameUnit({
        gameUnits: [gameUnit1, TestUtil.getDbGameUnit({})],
        mardroemes: [mardroeme],
        expected: gameUnit1,
      })
    })
    it('returns mardroeming game unit if last of many gameUnit', () => {
      const mardroeme = TestUtil.getDbUnit({})
      const gameUnit1 = TestUtil.getDbGameUnit({
        id: mardroeme._id,
      })
      testGetMardroemingGameUnit({
        gameUnits: [TestUtil.getDbGameUnit({}), gameUnit1],
        mardroemes: [mardroeme],
        expected: gameUnit1,
      })
    })
    it('returns last mardroeming game unit if many match mardroemes', () => {
      const mardroeme1 = TestUtil.getDbUnit({})
      const mardroeme2 = TestUtil.getDbUnit({})
      const gameUnit1 = TestUtil.getDbGameUnit({
        id: mardroeme1._id,
      })
      const gameUnit2 = TestUtil.getDbGameUnit({
        id: mardroeme2._id,
      })
      testGetMardroemingGameUnit({
        gameUnits: [gameUnit1, gameUnit2],
        mardroemes: [mardroeme1, mardroeme2],
        expected: gameUnit2,
      })
    })
  })
  describe('getExistingVildkaarlIds', () => {
    it('throws error if game unit not found on battlefield', () => {
      const gameUnit = TestUtil.getDbGameUnit({})
      testGetExistingVildkaarlIds({
        battlefieldUnits: [],
        gameUnits: [gameUnit],
        expected: Error(`Could not find game unit "${gameUnit.unit}" on battlefield`),
      })
    })
    it('returns empty array if no units', () => {
      testGetExistingVildkaarlIds({
        battlefieldUnits: [],
        gameUnits: [],
        expected: [],
      })
    })
    it('returns empty array if unit is not vildkaarl', () => {
      const unit = TestUtil.getDbUnit({
        name: 'Blueboy Lugos',
      })
      const gameUnit = TestUtil.getDbGameUnit({
        id: unit._id,
      })
      testGetExistingVildkaarlIds({
        battlefieldUnits: [unit],
        gameUnits: [gameUnit],
        expected: [],
      })
    })
    it('returns single item if single old vildkaarl', () => {
      const unit = TestUtil.getDbUnit({
        name: 'Transformed Vildkaarl',
      })
      const gameUnit = TestUtil.getDbGameUnit({
        id: unit._id,
      })
      testGetExistingVildkaarlIds({
        battlefieldUnits: [unit],
        gameUnits: [gameUnit],
        expected: [unit._id.toString()],
      })
    })
    it('returns single item if single young vildkaarl', () => {
      const unit = TestUtil.getDbUnit({
        name: 'Transformed Young Vildkaarl',
      })
      const gameUnit = TestUtil.getDbGameUnit({
        id: unit._id,
      })
      testGetExistingVildkaarlIds({
        battlefieldUnits: [unit],
        gameUnits: [gameUnit],
        expected: [unit._id.toString()],
      })
    })
    it('returns multiple items if multiple vildkaarls', () => {
      const unit1 = TestUtil.getDbUnit({
        name: 'Transformed Vildkaarl',
      })
      const gameUnit1 = TestUtil.getDbGameUnit({
        id: unit1._id,
      })
      const unit2 = TestUtil.getDbUnit({
        name: 'Transformed Young Vildkaarl',
      })
      const gameUnit2 = TestUtil.getDbGameUnit({
        id: unit2._id,
      })
      testGetExistingVildkaarlIds({
        battlefieldUnits: [unit1, unit2],
        gameUnits: [gameUnit1, gameUnit2],
        expected: [unit1._id.toString(), unit2._id.toString()],
      })
    })
  })
  describe('getVildkaarlsForTransformation', () => {
    it('calls to unit store with empty names if empty berserkers', async () => {
      await testGetVildkaarlsForTransformation({
        berserkers: [],
        limit: 1,
        existingVildkaarlIds: [],
        unitGetCalls: [
          [
            {
              names: [],
              ignoreIds: [],
              limit: 1,
            },
          ],
        ],
      })
    })
    it('calls to unit store with Transformed Vildkaarl if Berserker', async () => {
      await testGetVildkaarlsForTransformation({
        berserkers: [
          TestUtil.getDbUnit({
            name: 'Berserker',
          }),
        ],
        limit: 1,
        existingVildkaarlIds: [],
        unitGetCalls: [
          [
            {
              names: ['Transformed Vildkaarl'],
              ignoreIds: [],
              limit: 1,
            },
          ],
        ],
      })
    })
    it('calls to unit store with Transformed Young Vildkaarl if Young Berserker', async () => {
      await testGetVildkaarlsForTransformation({
        berserkers: [
          TestUtil.getDbUnit({
            name: 'Young Berserker',
          }),
        ],
        limit: 1,
        existingVildkaarlIds: [],
        unitGetCalls: [
          [
            {
              names: ['Transformed Young Vildkaarl'],
              ignoreIds: [],
              limit: 1,
            },
          ],
        ],
      })
    })
    it('calls to unit store with both if both provided', async () => {
      await testGetVildkaarlsForTransformation({
        berserkers: [
          TestUtil.getDbUnit({
            name: 'Berserker',
          }),
          TestUtil.getDbUnit({
            name: 'Young Berserker',
          }),
        ],
        limit: 2,
        existingVildkaarlIds: [],
        unitGetCalls: [
          [
            {
              names: ['Transformed Vildkaarl', 'Transformed Young Vildkaarl'],
              ignoreIds: [],
              limit: 2,
            },
          ],
        ],
      })
    })
    it('calls to unit store with ignoreIds if provided', async () => {
      const id = new ObjectId().toString()
      await testGetVildkaarlsForTransformation({
        berserkers: [
          TestUtil.getDbUnit({
            name: 'Berserker',
          }),
        ],
        limit: 1,
        existingVildkaarlIds: [id],
        unitGetCalls: [
          [
            {
              names: ['Transformed Vildkaarl'],
              ignoreIds: [id],
              limit: 1,
            },
          ],
        ],
      })
    })
  })
  describe('replaceBerserkersWithVildkaarl', () => {
    it('throws error if old vildkaarl not found', () => {
      const berserker = TestUtil.getDbUnit({
        name: 'Berserker',
      })
      testReplaceBerserkersWithVildkaarl({
        berserkers: [berserker],
        vildkaarls: [],
        row: {
          score: 0,
          units: [
            TestUtil.getDbGameUnit({
              id: berserker._id,
            }),
          ],
        },
        expected: Error(
          `Could not find instance "1" of "Transformed Vildkaarl" to transform berseker "${berserker._id}" into`
        ),
      })
    })
    it('throws error if young vildkaarl not found', () => {
      const berserker = TestUtil.getDbUnit({
        name: 'Young Berserker',
      })
      testReplaceBerserkersWithVildkaarl({
        berserkers: [berserker],
        vildkaarls: [],
        row: {
          score: 0,
          units: [
            TestUtil.getDbGameUnit({
              id: berserker._id,
            }),
          ],
        },
        expected: Error(
          `Could not find instance "1" of "Transformed Young Vildkaarl" to transform berseker "${berserker._id}" into`
        ),
      })
    })
    it('does nothing if no units in row', () => {
      testReplaceBerserkersWithVildkaarl({
        berserkers: [],
        vildkaarls: [],
        row: {
          score: 0,
          units: [],
        },
        expected: [],
      })
    })
    it('does nothing if no berserkers in row', () => {
      testReplaceBerserkersWithVildkaarl({
        berserkers: [],
        vildkaarls: [],
        row: {
          score: 0,
          units: [TestUtil.getDbGameUnit({})],
        },
        expected: [],
      })
    })
    it('returns single transformed pair for single old berserker', () => {
      const berserker = TestUtil.getDbUnit({
        name: 'Berserker',
      })
      const vildkaarl = TestUtil.getDbUnit({
        name: 'Transformed Vildkaarl',
      })
      const gameUnit = TestUtil.getDbGameUnit({
        id: berserker._id,
      })
      testReplaceBerserkersWithVildkaarl({
        berserkers: [berserker],
        vildkaarls: [vildkaarl],
        row: {
          score: 0,
          units: [deepClone(gameUnit)],
        },
        expected: [
          {
            from: {
              ...gameUnit,
              unit: berserker._id,
            },
            to: {
              ...gameUnit,
              unit: vildkaarl._id,
            },
            unit: vildkaarl,
          },
        ],
        updatedRow: {
          score: 0,
          units: [
            {
              ...gameUnit,
              unit: vildkaarl._id,
            },
          ],
        },
      })
    })
    it('returns single transformed pair for single young berserker', () => {
      const berserker = TestUtil.getDbUnit({
        name: 'Young Berserker',
      })
      const vildkaarl = TestUtil.getDbUnit({
        name: 'Transformed Young Vildkaarl',
      })
      const gameUnit = TestUtil.getDbGameUnit({
        id: berserker._id,
      })
      testReplaceBerserkersWithVildkaarl({
        berserkers: [berserker],
        vildkaarls: [vildkaarl],
        row: {
          score: 0,
          units: [deepClone(gameUnit)],
        },
        expected: [
          {
            from: {
              ...gameUnit,
              unit: berserker._id,
            },
            to: {
              ...gameUnit,
              unit: vildkaarl._id,
            },
            unit: vildkaarl,
          },
        ],
        updatedRow: {
          score: 0,
          units: [
            {
              ...gameUnit,
              unit: vildkaarl._id,
            },
          ],
        },
      })
    })
    it('returns multiple transformed pairs for multiple old berserkers', () => {
      const berserker1 = TestUtil.getDbUnit({
        name: 'Berserker',
      })
      const vildkaarl1 = TestUtil.getDbUnit({
        name: 'Transformed Vildkaarl',
      })
      const berserker2 = TestUtil.getDbUnit({
        name: 'Berserker',
      })
      const vildkaarl2 = TestUtil.getDbUnit({
        name: 'Transformed Vildkaarl',
      })
      const gameUnit1 = TestUtil.getDbGameUnit({
        id: berserker1._id,
      })
      const gameUnit2 = TestUtil.getDbGameUnit({
        id: berserker2._id,
      })
      testReplaceBerserkersWithVildkaarl({
        berserkers: [berserker1, berserker2],
        vildkaarls: [vildkaarl1, vildkaarl2],
        row: {
          score: 0,
          units: [deepClone(gameUnit1), deepClone(gameUnit2)],
        },
        expected: [
          {
            from: {
              ...gameUnit1,
              unit: berserker1._id,
            },
            to: {
              ...gameUnit1,
              unit: vildkaarl1._id,
            },
            unit: vildkaarl1,
          },
          {
            from: {
              ...gameUnit2,
              unit: berserker2._id,
            },
            to: {
              ...gameUnit2,
              unit: vildkaarl2._id,
            },
            unit: vildkaarl2,
          },
        ],
        updatedRow: {
          score: 0,
          units: [
            {
              ...gameUnit1,
              unit: vildkaarl1._id,
            },
            {
              ...gameUnit2,
              unit: vildkaarl2._id,
            },
          ],
        },
      })
    })
    it('returns multiple transformed pairs for multiple young berserkers', () => {
      const berserker1 = TestUtil.getDbUnit({
        name: 'Young Berserker',
      })
      const vildkaarl1 = TestUtil.getDbUnit({
        name: 'Transformed Young Vildkaarl',
      })
      const berserker2 = TestUtil.getDbUnit({
        name: 'Young Berserker',
      })
      const vildkaarl2 = TestUtil.getDbUnit({
        name: 'Transformed Young Vildkaarl',
      })
      const gameUnit1 = TestUtil.getDbGameUnit({
        id: berserker1._id,
      })
      const gameUnit2 = TestUtil.getDbGameUnit({
        id: berserker2._id,
      })
      testReplaceBerserkersWithVildkaarl({
        berserkers: [berserker1, berserker2],
        vildkaarls: [vildkaarl1, vildkaarl2],
        row: {
          score: 0,
          units: [deepClone(gameUnit1), deepClone(gameUnit2)],
        },
        expected: [
          {
            from: {
              ...gameUnit1,
              unit: berserker1._id,
            },
            to: {
              ...gameUnit1,
              unit: vildkaarl1._id,
            },
            unit: vildkaarl1,
          },
          {
            from: {
              ...gameUnit2,
              unit: berserker2._id,
            },
            to: {
              ...gameUnit2,
              unit: vildkaarl2._id,
            },
            unit: vildkaarl2,
          },
        ],
        updatedRow: {
          score: 0,
          units: [
            {
              ...gameUnit1,
              unit: vildkaarl1._id,
            },
            {
              ...gameUnit2,
              unit: vildkaarl2._id,
            },
          ],
        },
      })
    })
    it('returns multiple transformed pairs for multiple mixed berserkers', () => {
      const berserker1 = TestUtil.getDbUnit({
        name: 'Berserker',
      })
      const vildkaarl1 = TestUtil.getDbUnit({
        name: 'Transformed Vildkaarl',
      })
      const berserker2 = TestUtil.getDbUnit({
        name: 'Young Berserker',
      })
      const vildkaarl2 = TestUtil.getDbUnit({
        name: 'Transformed Young Vildkaarl',
      })
      const gameUnit1 = TestUtil.getDbGameUnit({
        id: berserker1._id,
      })
      const gameUnit2 = TestUtil.getDbGameUnit({
        id: berserker2._id,
      })
      testReplaceBerserkersWithVildkaarl({
        berserkers: [berserker1, berserker2],
        vildkaarls: [vildkaarl1, vildkaarl2],
        row: {
          score: 0,
          units: [deepClone(gameUnit1), deepClone(gameUnit2)],
        },
        expected: [
          {
            from: {
              ...gameUnit1,
              unit: berserker1._id,
            },
            to: {
              ...gameUnit1,
              unit: vildkaarl1._id,
            },
            unit: vildkaarl1,
          },
          {
            from: {
              ...gameUnit2,
              unit: berserker2._id,
            },
            to: {
              ...gameUnit2,
              unit: vildkaarl2._id,
            },
            unit: vildkaarl2,
          },
        ],
        updatedRow: {
          score: 0,
          units: [
            {
              ...gameUnit1,
              unit: vildkaarl1._id,
            },
            {
              ...gameUnit2,
              unit: vildkaarl2._id,
            },
          ],
        },
      })
    })
  })
})

async function testTransformBerserkers({
  battlefieldUnits = [],
  combat,
  effects = [],
  game,
  logPrefix,
  newDeckUnit,
  getEffectWithKeyResponses,
  getUnitsWithEffectResponses,
  getGameUnitsResponse,
  getMardroemingGameUnitResponse,
  replaceBerserkersWithVildkaarlResponse,
  expected,
  errorCalls = [],
  debugCalls = [],
  traceEnabled,
}: {
  battlefieldUnits?: UnitDbObject[]
  combat?: Combat | null
  effects?: EffectDbObject[]
  game: GameDbObject
  logPrefix: string
  newDeckUnit: DeckUnitDbObject
  getEffectWithKeyResponses?: (EffectDbObject | undefined)[]
  getUnitsWithEffectResponses?: UnitDbObject[][]
  getGameUnitsResponse?: GameUnitDbObject[]
  getMardroemingGameUnitResponse?: GameUnitDbObject
  replaceBerserkersWithVildkaarlResponse?: TransformPairs[]
  expected: Transformations
  traceEnabled?: boolean
  errorCalls?: string[][]
  debugCalls?: string[][]
}) {
  const existingVildkaarlIds = [new ObjectId().toString()]
  const vildkaarls = [TestUtil.getDbUnit({})]
  const getEffectWithKeySpy = jest.spyOn(GetEffectWithKey, 'getEffectWithKey')
  if (getEffectWithKeyResponses) {
    for (const getEffectWithKeyResponse of getEffectWithKeyResponses) {
      getEffectWithKeySpy.mockReturnValueOnce(getEffectWithKeyResponse)
    }
  }
  const getGameUnitsSpy = jest.spyOn(getGameUnits, 'default')
  if (getGameUnitsResponse) {
    getGameUnitsSpy.mockReturnValue(getGameUnitsResponse)
  }
  const getUnitsWithEffectSpy = jest.spyOn(EffectMardroeme as any, 'getUnitsWithEffect')
  if (getUnitsWithEffectResponses) {
    for (const getUnitsWithEffectResponse of getUnitsWithEffectResponses) {
      getUnitsWithEffectSpy.mockReturnValueOnce(getUnitsWithEffectResponse)
    }
  }
  const getMardroemingGameUnitSpy = jest
    .spyOn(EffectMardroeme as any, 'getMardroemingGameUnit')
    .mockReturnValue(getMardroemingGameUnitResponse)
  const getExistingVildkaarlIdsSpy = jest
    .spyOn(EffectMardroeme as any, 'getExistingVildkaarlIds')
    .mockReturnValue(existingVildkaarlIds)
  const getVildkaarlsForTransformationSpy = jest
    .spyOn(EffectMardroeme as any, 'getVildkaarlsForTransformation')
    .mockResolvedValue(vildkaarls)
  const replaceBerserkersWithVildkaarlSpy = jest.spyOn(EffectMardroeme as any, 'replaceBerserkersWithVildkaarl')
  if (replaceBerserkersWithVildkaarlResponse) {
    replaceBerserkersWithVildkaarlSpy.mockReturnValue(replaceBerserkersWithVildkaarlResponse)
  }
  const errorSpy = jest.fn().mockImplementation()
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  EffectMardroeme['logger'] = {
    error: errorSpy,
    debug: debugSpy,
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  await expect(
    EffectMardroeme.transformBerserkers({
      battlefieldUnits,
      effects,
      game,
      logPrefix,
      newDeckUnit,
      combat,
    })
  ).resolves.toEqual(expected)

  expect(getEffectWithKeySpy.mock.calls).toEqual([
    [
      {
        effectKey: EffectKey.Mardroeme,
        effects,
        logPrefix,
      },
    ],
    [
      {
        effectKey: EffectKey.Berserker,
        effects,
        logPrefix,
      },
    ],
  ])
  expect(getGameUnitsSpy.mock.calls).toEqual(
    getGameUnitsResponse
      ? [
          [
            {
              combat,
              players: game.players.filter((player) => player.user.toString() === game.turn?.toString()),
              round: game.round,
            },
          ],
        ]
      : []
  )
  expect(getUnitsWithEffectSpy.mock.calls).toEqual(
    getUnitsWithEffectResponses
      ? [
          [
            {
              gameUnits: getGameUnitsResponse,
              battlefieldUnits,
              effect: getEffectWithKeyResponses ? getEffectWithKeyResponses[0] : undefined,
            },
          ],
          [
            {
              gameUnits: getGameUnitsResponse,
              battlefieldUnits,
              effect: getEffectWithKeyResponses ? getEffectWithKeyResponses[1] : undefined,
            },
          ],
        ]
      : []
  )
  expect(getMardroemingGameUnitSpy.mock.calls).toEqual(
    replaceBerserkersWithVildkaarlResponse
      ? [
          [
            {
              gameUnits: getGameUnitsResponse,
              mardroemes: getUnitsWithEffectResponses ? getUnitsWithEffectResponses[0] : undefined,
            },
          ],
        ]
      : []
  )
  expect(getExistingVildkaarlIdsSpy.mock.calls).toEqual(
    replaceBerserkersWithVildkaarlResponse
      ? [
          [
            {
              battlefieldUnits,
              gameUnits: getGameUnitsResponse,
            },
          ],
        ]
      : []
  )
  expect(getVildkaarlsForTransformationSpy.mock.calls).toEqual(
    replaceBerserkersWithVildkaarlResponse
      ? [
          [
            {
              berserkers: getUnitsWithEffectResponses ? getUnitsWithEffectResponses[1] : undefined,
              existingVildkaarlIds,
              limit: getUnitsWithEffectResponses ? getUnitsWithEffectResponses[1].length : undefined,
            },
          ],
        ]
      : []
  )
  const round = game.players.find((player) => player.user.toString() === game.turn?.toString())?.rounds[game.round - 1]
  expect(replaceBerserkersWithVildkaarlSpy.mock.calls).toEqual(
    replaceBerserkersWithVildkaarlResponse
      ? [
          [
            {
              berserkers: getUnitsWithEffectResponses ? getUnitsWithEffectResponses[1] : undefined,
              row: combat === Combat.Close ? round?.close : combat === Combat.Ranged ? round?.ranged : round?.siege,
              vildkaarls,
            },
          ],
        ]
      : []
  )
  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [
            `${logPrefix} mardroemeEffect: "${JSON.stringify(getEffectWithKeyResponses && getEffectWithKeyResponses[0])}"`,
          ],
          [
            `${logPrefix} berserkerEffect: "${JSON.stringify(getEffectWithKeyResponses && getEffectWithKeyResponses[1])}"`,
          ],
          [`${logPrefix} gameUnits: "${JSON.stringify(getGameUnitsResponse)}"`],
          [
            `${logPrefix} mardroemes: "${JSON.stringify(getUnitsWithEffectResponses && getUnitsWithEffectResponses[0])}"`,
          ],
          [
            `${logPrefix} berserkers: "${JSON.stringify(getUnitsWithEffectResponses && getUnitsWithEffectResponses[1])}"`,
          ],
        ]
      : []
  )
}

function testGetUnitsWithEffect({
  gameUnits,
  battlefieldUnits,
  effect,
  expected,
}: {
  gameUnits: GameUnitDbObject[]
  battlefieldUnits: UnitDbObject[]
  effect: EffectDbObject
  expected: UnitDbObject[] | Error
}) {
  if (expected instanceof Error) {
    expect(() =>
      EffectMardroeme['getUnitsWithEffect']({
        battlefieldUnits,
        effect,
        gameUnits,
      })
    ).toThrow(expected)
  } else {
    expect(
      EffectMardroeme['getUnitsWithEffect']({
        battlefieldUnits,
        effect,
        gameUnits,
      })
    ).toEqual(expected)
  }
}

function testGetMardroemingGameUnit({
  gameUnits,
  mardroemes,
  expected,
}: {
  gameUnits: GameUnitDbObject[]
  mardroemes: UnitDbObject[]
  expected: GameUnitDbObject | Error
}) {
  if (expected instanceof Error) {
    expect(() =>
      EffectMardroeme['getMardroemingGameUnit']({
        gameUnits,
        mardroemes,
      })
    ).toThrow(expected)
  } else {
    expect(
      EffectMardroeme['getMardroemingGameUnit']({
        gameUnits,
        mardroemes,
      })
    ).toEqual(expected)
  }
}

function testGetExistingVildkaarlIds({
  gameUnits,
  battlefieldUnits,
  expected,
}: {
  gameUnits: GameUnitDbObject[]
  battlefieldUnits: UnitDbObject[]
  expected: string[] | Error
}) {
  if (expected instanceof Error) {
    expect(() =>
      EffectMardroeme['getExistingVildkaarlIds']({
        battlefieldUnits,
        gameUnits,
      })
    ).toThrow(expected)
  } else {
    expect(
      EffectMardroeme['getExistingVildkaarlIds']({
        battlefieldUnits,
        gameUnits,
      })
    ).toEqual(expected)
  }
}

async function testGetVildkaarlsForTransformation({
  berserkers,
  existingVildkaarlIds,
  limit,
  unitGetCalls,
}: {
  berserkers: UnitDbObject[]
  existingVildkaarlIds: string[]
  limit: number
  unitGetCalls: any[][]
}) {
  const unitGetSpy = jest.spyOn(UnitStore, 'get').mockResolvedValue([])

  await expect(
    EffectMardroeme['getVildkaarlsForTransformation']({
      berserkers,
      existingVildkaarlIds,
      limit,
    })
  ).resolves.toEqual([])

  expect(unitGetSpy.mock.calls).toEqual(unitGetCalls)
}

function testReplaceBerserkersWithVildkaarl({
  row,
  berserkers,
  vildkaarls,
  expected,
  updatedRow,
}: {
  row: PlayerCombatRowDbObject
  berserkers: UnitDbObject[]
  vildkaarls: UnitDbObject[]
  expected: TransformPairs[] | Error
  updatedRow?: PlayerCombatRowDbObject
}) {
  if (expected instanceof Error) {
    expect(() =>
      EffectMardroeme['replaceBerserkersWithVildkaarl']({
        berserkers,
        row,
        vildkaarls,
      })
    ).toThrow(expected)
  } else {
    expect(
      EffectMardroeme['replaceBerserkersWithVildkaarl']({
        berserkers,
        row,
        vildkaarls,
      })
    ).toEqual(expected)
  }

  expect(row).toEqual(updatedRow || row)
}
