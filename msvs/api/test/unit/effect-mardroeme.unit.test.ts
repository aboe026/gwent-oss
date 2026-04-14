import { ObjectId } from 'mongodb'

import {
  Combat,
  DeckUnitDbObject,
  EffectDbObject,
  EffectKey,
  FieldUnitDbObject,
  GameDbObject,
  PlayerCombatRowDbObject,
  UnitDbObject,
} from '@gwent/graphql-schema/database-typings'
import deepClone from '../util/deep-clone'
import EffectMardroeme, {
  Transformations,
  TransformPairs,
} from '../../src/graphql/resolvers/mutations/play-unit/effect-mardroeme'
import GetEffectWithKey from '../../src/graphql/resolvers/mutations/play-unit/get-effect-with-key'
import GetFieldUnits from '../../src/graphql/resolvers/util/get-field-units'
import * as getUnitIdsWithEffect from '../../src/graphql/resolvers/mutations/play-unit/get-unit-ids-with-effect'
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
          mardroemingFieldUnit: undefined,
          transformedFieldUnits: [],
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
          mardroemingFieldUnit: undefined,
          transformedFieldUnits: [],
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
          mardroemingFieldUnit: undefined,
          transformedFieldUnits: [],
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
        getFieldUnitsResponse: [
          TestUtil.getDbFieldUnit({
            id: unit._id,
          }),
        ],
        getUnitsIdsWithEffectResponses: [[], [unit._id.toString()]],
        expected: {
          impacts: {},
          mardroemingFieldUnit: undefined,
          transformedFieldUnits: [],
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
        getFieldUnitsResponse: [
          TestUtil.getDbFieldUnit({
            id: unit._id,
          }),
        ],
        getUnitsIdsWithEffectResponses: [[unit._id.toString()], []],
        expected: {
          impacts: {},
          mardroemingFieldUnit: undefined,
          transformedFieldUnits: [],
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
          mardroemeUnit,
          berserkerUnit,
        ],
        getEffectWithKeyResponses: [
          TestUtil.getDbEffect({
            key: EffectKey.Mardroeme,
          }),
          TestUtil.getDbEffect({
            key: EffectKey.Berserker,
          }),
        ],
        getFieldUnitsResponse: [
          TestUtil.getDbFieldUnit({
            id: mardroemeUnit._id,
          }),
          TestUtil.getDbFieldUnit({
            id: berserkerUnit._id,
          }),
        ],
        getUnitsIdsWithEffectResponses: [[mardroemeUnit._id.toString()], [berserkerUnit._id.toString()]],
        replaceBerserkersWithVildkaarlResponse: [],
        expected: {
          impacts: {},
          mardroemingFieldUnit: undefined,
          transformedFieldUnits: [],
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
        const mardroemingFieldUnit = TestUtil.getDbFieldUnit({})
        const from = TestUtil.getDbFieldUnit({})
        const unit = TestUtil.getDbUnit({})
        const to = TestUtil.getDbFieldUnit({
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
            mardroemeUnit,
            berserkerUnit,
          ],
          getEffectWithKeyResponses: [
            TestUtil.getDbEffect({
              key: EffectKey.Mardroeme,
            }),
            TestUtil.getDbEffect({
              key: EffectKey.Berserker,
            }),
          ],
          getFieldUnitsResponse: [
            mardroemingFieldUnit,
            TestUtil.getDbFieldUnit({
              id: berserkerUnit._id,
            }),
          ],
          getUnitsIdsWithEffectResponses: [[mardroemeUnit._id.toString()], [berserkerUnit._id.toString()]],
          getmardroemingFieldUnitResponse: mardroemingFieldUnit,
          replaceBerserkersWithVildkaarlResponse: [
            {
              from,
              to,
              unit,
            },
          ],
          expected: {
            impacts: {},
            mardroemingFieldUnit,
            transformedFieldUnits: [to],
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
        const mardroemingFieldUnit = TestUtil.getDbFieldUnit({})
        const from1 = TestUtil.getDbFieldUnit({})
        const unit1 = TestUtil.getDbUnit({})
        const to1 = TestUtil.getDbFieldUnit({
          id: unit1._id,
        })
        const from2 = TestUtil.getDbFieldUnit({})
        const unit2 = TestUtil.getDbUnit({})
        const to2 = TestUtil.getDbFieldUnit({
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
            mardroemeUnit,
            berserkerUnit,
          ],
          getEffectWithKeyResponses: [
            TestUtil.getDbEffect({
              key: EffectKey.Mardroeme,
            }),
            TestUtil.getDbEffect({
              key: EffectKey.Berserker,
            }),
          ],
          getFieldUnitsResponse: [
            mardroemingFieldUnit,
            TestUtil.getDbFieldUnit({
              id: berserkerUnit._id,
            }),
          ],
          getUnitsIdsWithEffectResponses: [[mardroemeUnit._id.toString()], [berserkerUnit._id.toString()]],
          getmardroemingFieldUnitResponse: mardroemingFieldUnit,
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
            mardroemingFieldUnit,
            transformedFieldUnits: [to1, to2],
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
        const mardroemingFieldUnit = TestUtil.getDbFieldUnit({})
        const from = TestUtil.getDbFieldUnit({})
        const unit = TestUtil.getDbUnit({})
        const to = TestUtil.getDbFieldUnit({
          id: unit._id,
        })
        const gameUnit = TestUtil.getDbGameUnit({
          id: from.unit,
          artStyle: from.artStyle,
          row: from.row as Combat,
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
            mardroemeUnit,
            berserkerUnit,
          ],
          getEffectWithKeyResponses: [
            TestUtil.getDbEffect({
              key: EffectKey.Mardroeme,
            }),
            TestUtil.getDbEffect({
              key: EffectKey.Berserker,
            }),
          ],
          getFieldUnitsResponse: [
            mardroemingFieldUnit,
            TestUtil.getDbFieldUnit({
              id: berserkerUnit._id,
            }),
          ],
          getUnitsIdsWithEffectResponses: [[mardroemeUnit._id.toString()], [berserkerUnit._id.toString()]],
          getmardroemingFieldUnitResponse: mardroemingFieldUnit,
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
                  unit: gameUnit,
                  user: player.user,
                },
              ],
            },
            mardroemingFieldUnit,
            transformedFieldUnits: [to],
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
        const mardroemingFieldUnit = TestUtil.getDbFieldUnit({})
        const from1 = TestUtil.getDbFieldUnit({})
        const unit1 = TestUtil.getDbUnit({})
        const to1 = TestUtil.getDbFieldUnit({
          id: unit1._id,
        })
        const from2 = TestUtil.getDbFieldUnit({})
        const unit2 = TestUtil.getDbUnit({})
        const to2 = TestUtil.getDbFieldUnit({
          id: unit2._id,
        })
        const gameUnit1 = TestUtil.getDbGameUnit({
          id: from1.unit,
          artStyle: from1.artStyle,
          row: from1.row as Combat,
        })
        const gameUnit2 = TestUtil.getDbGameUnit({
          id: from2.unit,
          artStyle: from2.artStyle,
          row: from2.row as Combat,
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
            mardroemeUnit,
            berserkerUnit,
          ],
          getEffectWithKeyResponses: [
            TestUtil.getDbEffect({
              key: EffectKey.Mardroeme,
            }),
            TestUtil.getDbEffect({
              key: EffectKey.Berserker,
            }),
          ],
          getFieldUnitsResponse: [
            mardroemingFieldUnit,
            TestUtil.getDbFieldUnit({
              id: berserkerUnit._id,
            }),
          ],
          getUnitsIdsWithEffectResponses: [[mardroemeUnit._id.toString()], [berserkerUnit._id.toString()]],
          getmardroemingFieldUnitResponse: mardroemingFieldUnit,
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
                  unit: gameUnit1,
                  user: player.user,
                },
                {
                  unit: gameUnit2,
                  user: player.user,
                },
              ],
            },
            mardroemingFieldUnit,
            transformedFieldUnits: [to1, to2],
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
        const mardroemingFieldUnit = TestUtil.getDbFieldUnit({})
        const from = TestUtil.getDbFieldUnit({})
        const unit = TestUtil.getDbUnit({})
        const to = TestUtil.getDbFieldUnit({
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
            mardroemeUnit,
            berserkerUnit,
          ],
          getEffectWithKeyResponses: [
            TestUtil.getDbEffect({
              key: EffectKey.Mardroeme,
            }),
            TestUtil.getDbEffect({
              key: EffectKey.Berserker,
            }),
          ],
          getFieldUnitsResponse: [
            mardroemingFieldUnit,
            TestUtil.getDbFieldUnit({
              id: berserkerUnit._id,
            }),
          ],
          getUnitsIdsWithEffectResponses: [[mardroemeUnit._id.toString()], [berserkerUnit._id.toString()]],
          getmardroemingFieldUnitResponse: mardroemingFieldUnit,
          replaceBerserkersWithVildkaarlResponse: [
            {
              from,
              to,
              unit,
            },
          ],
          expected: {
            impacts: {},
            mardroemingFieldUnit,
            transformedFieldUnits: [to],
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
        const mardroemingFieldUnit = TestUtil.getDbFieldUnit({})
        const from1 = TestUtil.getDbFieldUnit({})
        const unit1 = TestUtil.getDbUnit({})
        const to1 = TestUtil.getDbFieldUnit({
          id: unit1._id,
        })
        const from2 = TestUtil.getDbFieldUnit({})
        const unit2 = TestUtil.getDbUnit({})
        const to2 = TestUtil.getDbFieldUnit({
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
            mardroemeUnit,
            berserkerUnit,
          ],
          getEffectWithKeyResponses: [
            TestUtil.getDbEffect({
              key: EffectKey.Mardroeme,
            }),
            TestUtil.getDbEffect({
              key: EffectKey.Berserker,
            }),
          ],
          getFieldUnitsResponse: [
            mardroemingFieldUnit,
            TestUtil.getDbFieldUnit({
              id: berserkerUnit._id,
            }),
          ],
          getUnitsIdsWithEffectResponses: [[mardroemeUnit._id.toString()], [berserkerUnit._id.toString()]],
          getmardroemingFieldUnitResponse: mardroemingFieldUnit,
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
            mardroemingFieldUnit,
            transformedFieldUnits: [to1, to2],
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
        const mardroemingFieldUnit = TestUtil.getDbFieldUnit({})
        const from = TestUtil.getDbFieldUnit({})
        const unit = TestUtil.getDbUnit({})
        const to = TestUtil.getDbFieldUnit({
          id: unit._id,
        })
        const gameUnit = TestUtil.getDbGameUnit({
          id: from.unit,
          artStyle: from.artStyle,
          row: from.row as Combat,
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
            mardroemeUnit,
            berserkerUnit,
          ],
          getEffectWithKeyResponses: [
            TestUtil.getDbEffect({
              key: EffectKey.Mardroeme,
            }),
            TestUtil.getDbEffect({
              key: EffectKey.Berserker,
            }),
          ],
          getFieldUnitsResponse: [
            mardroemingFieldUnit,
            TestUtil.getDbFieldUnit({
              id: berserkerUnit._id,
            }),
          ],
          getUnitsIdsWithEffectResponses: [[mardroemeUnit._id.toString()], [berserkerUnit._id.toString()]],
          getmardroemingFieldUnitResponse: mardroemingFieldUnit,
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
                  unit: gameUnit,
                  user: player.user,
                },
              ],
            },
            mardroemingFieldUnit,
            transformedFieldUnits: [to],
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
        const mardroemingFieldUnit = TestUtil.getDbFieldUnit({})
        const from1 = TestUtil.getDbFieldUnit({})
        const unit1 = TestUtil.getDbUnit({})
        const to1 = TestUtil.getDbFieldUnit({
          id: unit1._id,
        })
        const from2 = TestUtil.getDbFieldUnit({})
        const unit2 = TestUtil.getDbUnit({})
        const to2 = TestUtil.getDbFieldUnit({
          id: unit2._id,
        })
        const gameUnit1 = TestUtil.getDbGameUnit({
          id: from1.unit,
          artStyle: from1.artStyle,
          row: from1.row as Combat,
        })
        const gameUnit2 = TestUtil.getDbGameUnit({
          id: from2.unit,
          artStyle: from2.artStyle,
          row: from2.row as Combat,
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
            mardroemeUnit,
            berserkerUnit,
          ],
          getEffectWithKeyResponses: [
            TestUtil.getDbEffect({
              key: EffectKey.Mardroeme,
            }),
            TestUtil.getDbEffect({
              key: EffectKey.Berserker,
            }),
          ],
          getFieldUnitsResponse: [
            mardroemingFieldUnit,
            TestUtil.getDbFieldUnit({
              id: berserkerUnit._id,
            }),
          ],
          getUnitsIdsWithEffectResponses: [[mardroemeUnit._id.toString()], [berserkerUnit._id.toString()]],
          getmardroemingFieldUnitResponse: mardroemingFieldUnit,
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
                  unit: gameUnit1,
                  user: player.user,
                },
                {
                  unit: gameUnit2,
                  user: player.user,
                },
              ],
            },
            mardroemingFieldUnit,
            transformedFieldUnits: [to1, to2],
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
        const mardroemingFieldUnit = TestUtil.getDbFieldUnit({})
        const from = TestUtil.getDbFieldUnit({})
        const unit = TestUtil.getDbUnit({})
        const to = TestUtil.getDbFieldUnit({
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
            mardroemeUnit,
            berserkerUnit,
          ],
          getEffectWithKeyResponses: [
            TestUtil.getDbEffect({
              key: EffectKey.Mardroeme,
            }),
            TestUtil.getDbEffect({
              key: EffectKey.Berserker,
            }),
          ],
          getFieldUnitsResponse: [
            mardroemingFieldUnit,
            TestUtil.getDbFieldUnit({
              id: berserkerUnit._id,
            }),
          ],
          getUnitsIdsWithEffectResponses: [[mardroemeUnit._id.toString()], [berserkerUnit._id.toString()]],
          getmardroemingFieldUnitResponse: mardroemingFieldUnit,
          replaceBerserkersWithVildkaarlResponse: [
            {
              from,
              to,
              unit,
            },
          ],
          expected: {
            impacts: {},
            mardroemingFieldUnit,
            transformedFieldUnits: [to],
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
        const mardroemingFieldUnit = TestUtil.getDbFieldUnit({})
        const from1 = TestUtil.getDbFieldUnit({})
        const unit1 = TestUtil.getDbUnit({})
        const to1 = TestUtil.getDbFieldUnit({
          id: unit1._id,
        })
        const from2 = TestUtil.getDbFieldUnit({})
        const unit2 = TestUtil.getDbUnit({})
        const to2 = TestUtil.getDbFieldUnit({
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
            mardroemeUnit,
            berserkerUnit,
          ],
          getEffectWithKeyResponses: [
            TestUtil.getDbEffect({
              key: EffectKey.Mardroeme,
            }),
            TestUtil.getDbEffect({
              key: EffectKey.Berserker,
            }),
          ],
          getFieldUnitsResponse: [
            mardroemingFieldUnit,
            TestUtil.getDbFieldUnit({
              id: berserkerUnit._id,
            }),
          ],
          getUnitsIdsWithEffectResponses: [[mardroemeUnit._id.toString()], [berserkerUnit._id.toString()]],
          getmardroemingFieldUnitResponse: mardroemingFieldUnit,
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
            mardroemingFieldUnit,
            transformedFieldUnits: [to1, to2],
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
        const mardroemingFieldUnit = TestUtil.getDbFieldUnit({})
        const from = TestUtil.getDbFieldUnit({})
        const unit = TestUtil.getDbUnit({})
        const to = TestUtil.getDbFieldUnit({
          id: unit._id,
        })
        const gameUnit = TestUtil.getDbGameUnit({
          id: from.unit,
          artStyle: from.artStyle,
          row: from.row as Combat,
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
            mardroemeUnit,
            berserkerUnit,
          ],
          getEffectWithKeyResponses: [
            TestUtil.getDbEffect({
              key: EffectKey.Mardroeme,
            }),
            TestUtil.getDbEffect({
              key: EffectKey.Berserker,
            }),
          ],
          getFieldUnitsResponse: [
            mardroemingFieldUnit,
            TestUtil.getDbFieldUnit({
              id: berserkerUnit._id,
            }),
          ],
          getUnitsIdsWithEffectResponses: [[mardroemeUnit._id.toString()], [berserkerUnit._id.toString()]],
          getmardroemingFieldUnitResponse: mardroemingFieldUnit,
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
                  unit: gameUnit,
                  user: player.user,
                },
              ],
            },
            mardroemingFieldUnit,
            transformedFieldUnits: [to],
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
        const mardroemingFieldUnit = TestUtil.getDbFieldUnit({})
        const from1 = TestUtil.getDbFieldUnit({})
        const unit1 = TestUtil.getDbUnit({})
        const to1 = TestUtil.getDbFieldUnit({
          id: unit1._id,
        })
        const from2 = TestUtil.getDbFieldUnit({})
        const unit2 = TestUtil.getDbUnit({})
        const to2 = TestUtil.getDbFieldUnit({
          id: unit2._id,
        })
        const gameUnit1 = TestUtil.getDbGameUnit({
          id: from1.unit,
          artStyle: from1.artStyle,
          row: from1.row as Combat,
        })
        const gameUnit2 = TestUtil.getDbGameUnit({
          id: from2.unit,
          artStyle: from2.artStyle,
          row: from2.row as Combat,
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
            mardroemeUnit,
            berserkerUnit,
          ],
          getEffectWithKeyResponses: [
            TestUtil.getDbEffect({
              key: EffectKey.Mardroeme,
            }),
            TestUtil.getDbEffect({
              key: EffectKey.Berserker,
            }),
          ],
          getFieldUnitsResponse: [
            mardroemingFieldUnit,
            TestUtil.getDbFieldUnit({
              id: berserkerUnit._id,
            }),
          ],
          getUnitsIdsWithEffectResponses: [[mardroemeUnit._id.toString()], [berserkerUnit._id.toString()]],
          getmardroemingFieldUnitResponse: mardroemingFieldUnit,
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
                  unit: gameUnit1,
                  user: player.user,
                },
                {
                  unit: gameUnit2,
                  user: player.user,
                },
              ],
            },
            mardroemingFieldUnit,
            transformedFieldUnits: [to1, to2],
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
      const mardroemingFieldUnit = TestUtil.getDbFieldUnit({})
      const from = TestUtil.getDbFieldUnit({})
      const unit = TestUtil.getDbUnit({})
      const to = TestUtil.getDbFieldUnit({
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
          mardroemeUnit,
          berserkerUnit,
        ],
        getEffectWithKeyResponses: [
          TestUtil.getDbEffect({
            key: EffectKey.Mardroeme,
          }),
          TestUtil.getDbEffect({
            key: EffectKey.Berserker,
          }),
        ],
        getFieldUnitsResponse: [
          mardroemingFieldUnit,
          TestUtil.getDbFieldUnit({
            id: berserkerUnit._id,
          }),
        ],
        getUnitsIdsWithEffectResponses: [[mardroemeUnit._id.toString()], [berserkerUnit._id.toString()]],
        getmardroemingFieldUnitResponse: mardroemingFieldUnit,
        replaceBerserkersWithVildkaarlResponse: [
          {
            from,
            to,
            unit,
          },
        ],
        expected: {
          impacts: {},
          mardroemingFieldUnit,
          transformedFieldUnits: [to],
          transformedUnits: [unit],
        },
        debugCalls: [[`${logPrefix} transformed "${JSON.stringify([unit._id])}" berserkers into vildkaarls`]],
        traceEnabled: true,
      })
    })
  })
  describe('getmardroemingFieldUnit', () => {
    it('throws error if mardroeming game unit not found', () => {
      const fieldUnits: FieldUnitDbObject[] = []
      testGetmardroemingFieldUnit({
        fieldUnits: fieldUnits,
        mardroemeUnitIds: [],
        expected: Error(`Could not find mardroeming game unit in "${JSON.stringify(fieldUnits)}"`),
      })
    })
    it('returns mardroeming game unit if only fieldUnit', () => {
      const mardroeme = TestUtil.getDbUnit({})
      const fieldUnit = TestUtil.getDbFieldUnit({
        id: mardroeme._id,
      })
      testGetmardroemingFieldUnit({
        fieldUnits: [fieldUnit],
        mardroemeUnitIds: [mardroeme._id.toString()],
        expected: fieldUnit,
      })
    })
    it('returns mardroeming game unit if first of many fieldUnit', () => {
      const mardroeme = TestUtil.getDbUnit({})
      const fieldUnit1 = TestUtil.getDbFieldUnit({
        id: mardroeme._id,
      })
      testGetmardroemingFieldUnit({
        fieldUnits: [fieldUnit1, TestUtil.getDbFieldUnit({})],
        mardroemeUnitIds: [mardroeme._id.toString()],
        expected: fieldUnit1,
      })
    })
    it('returns mardroeming game unit if last of many fieldUnit', () => {
      const mardroeme = TestUtil.getDbUnit({})
      const fieldUnit1 = TestUtil.getDbFieldUnit({
        id: mardroeme._id,
      })
      testGetmardroemingFieldUnit({
        fieldUnits: [TestUtil.getDbFieldUnit({}), fieldUnit1],
        mardroemeUnitIds: [mardroeme._id.toString()],
        expected: fieldUnit1,
      })
    })
    it('returns last mardroeming game unit if many match mardroemes', () => {
      const mardroeme1 = TestUtil.getDbUnit({})
      const mardroeme2 = TestUtil.getDbUnit({})
      const fieldUnit1 = TestUtil.getDbFieldUnit({
        id: mardroeme1._id,
      })
      const fieldUnit2 = TestUtil.getDbFieldUnit({
        id: mardroeme2._id,
      })
      testGetmardroemingFieldUnit({
        fieldUnits: [fieldUnit1, fieldUnit2],
        mardroemeUnitIds: [mardroeme1._id.toString(), mardroeme2._id.toString()],
        expected: fieldUnit2,
      })
    })
  })
  describe('getExistingVildkaarlIds', () => {
    it('throws error if game unit not found on battlefield', () => {
      const fieldUnit = TestUtil.getDbFieldUnit({})
      testGetExistingVildkaarlIds({
        battlefieldUnits: [],
        fieldUnits: [fieldUnit],
        expected: Error(`Could not find game unit "${fieldUnit.unit}" on battlefield`),
      })
    })
    it('returns empty array if no units', () => {
      testGetExistingVildkaarlIds({
        battlefieldUnits: [],
        fieldUnits: [],
        expected: [],
      })
    })
    it('returns empty array if unit is not vildkaarl', () => {
      const unit = TestUtil.getDbUnit({
        name: 'Blueboy Lugos',
      })
      const fieldUnit = TestUtil.getDbFieldUnit({
        id: unit._id,
      })
      testGetExistingVildkaarlIds({
        battlefieldUnits: [unit],
        fieldUnits: [fieldUnit],
        expected: [],
      })
    })
    it('returns single item if single old vildkaarl', () => {
      const unit = TestUtil.getDbUnit({
        name: 'Transformed Vildkaarl',
      })
      const fieldUnit = TestUtil.getDbFieldUnit({
        id: unit._id,
      })
      testGetExistingVildkaarlIds({
        battlefieldUnits: [unit],
        fieldUnits: [fieldUnit],
        expected: [unit._id.toString()],
      })
    })
    it('returns single item if single young vildkaarl', () => {
      const unit = TestUtil.getDbUnit({
        name: 'Transformed Young Vildkaarl',
      })
      const fieldUnit = TestUtil.getDbFieldUnit({
        id: unit._id,
      })
      testGetExistingVildkaarlIds({
        battlefieldUnits: [unit],
        fieldUnits: [fieldUnit],
        expected: [unit._id.toString()],
      })
    })
    it('returns multiple items if multiple vildkaarls', () => {
      const unit1 = TestUtil.getDbUnit({
        name: 'Transformed Vildkaarl',
      })
      const fieldUnit1 = TestUtil.getDbFieldUnit({
        id: unit1._id,
      })
      const unit2 = TestUtil.getDbUnit({
        name: 'Transformed Young Vildkaarl',
      })
      const fieldUnit2 = TestUtil.getDbFieldUnit({
        id: unit2._id,
      })
      testGetExistingVildkaarlIds({
        battlefieldUnits: [unit1, unit2],
        fieldUnits: [fieldUnit1, fieldUnit2],
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
            TestUtil.getDbFieldUnit({
              id: berserker._id,
            }),
          ],
        },
        expected: Error(
          `Could not find instance "1" of "Transformed Vildkaarl" to transform berserker "${berserker._id}" into`
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
            TestUtil.getDbFieldUnit({
              id: berserker._id,
            }),
          ],
        },
        expected: Error(
          `Could not find instance "1" of "Transformed Young Vildkaarl" to transform berserker "${berserker._id}" into`
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
          units: [TestUtil.getDbFieldUnit({})],
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
      const fieldUnit = TestUtil.getDbFieldUnit({
        id: berserker._id,
      })
      testReplaceBerserkersWithVildkaarl({
        berserkers: [berserker],
        vildkaarls: [vildkaarl],
        row: {
          score: 0,
          units: [deepClone(fieldUnit)],
        },
        expected: [
          {
            from: {
              ...fieldUnit,
              unit: berserker._id,
            },
            to: {
              ...fieldUnit,
              unit: vildkaarl._id,
            },
            unit: vildkaarl,
          },
        ],
        updatedRow: {
          score: 0,
          units: [
            {
              ...fieldUnit,
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
      const fieldUnit = TestUtil.getDbFieldUnit({
        id: berserker._id,
      })
      testReplaceBerserkersWithVildkaarl({
        berserkers: [berserker],
        vildkaarls: [vildkaarl],
        row: {
          score: 0,
          units: [deepClone(fieldUnit)],
        },
        expected: [
          {
            from: {
              ...fieldUnit,
              unit: berserker._id,
            },
            to: {
              ...fieldUnit,
              unit: vildkaarl._id,
            },
            unit: vildkaarl,
          },
        ],
        updatedRow: {
          score: 0,
          units: [
            {
              ...fieldUnit,
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
      const fieldUnit1 = TestUtil.getDbFieldUnit({
        id: berserker1._id,
      })
      const fieldUnit2 = TestUtil.getDbFieldUnit({
        id: berserker2._id,
      })
      testReplaceBerserkersWithVildkaarl({
        berserkers: [berserker1, berserker2],
        vildkaarls: [vildkaarl1, vildkaarl2],
        row: {
          score: 0,
          units: [deepClone(fieldUnit1), deepClone(fieldUnit2)],
        },
        expected: [
          {
            from: {
              ...fieldUnit1,
              unit: berserker1._id,
            },
            to: {
              ...fieldUnit1,
              unit: vildkaarl1._id,
            },
            unit: vildkaarl1,
          },
          {
            from: {
              ...fieldUnit2,
              unit: berserker2._id,
            },
            to: {
              ...fieldUnit2,
              unit: vildkaarl2._id,
            },
            unit: vildkaarl2,
          },
        ],
        updatedRow: {
          score: 0,
          units: [
            {
              ...fieldUnit1,
              unit: vildkaarl1._id,
            },
            {
              ...fieldUnit2,
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
      const fieldUnit1 = TestUtil.getDbFieldUnit({
        id: berserker1._id,
      })
      const fieldUnit2 = TestUtil.getDbFieldUnit({
        id: berserker2._id,
      })
      testReplaceBerserkersWithVildkaarl({
        berserkers: [berserker1, berserker2],
        vildkaarls: [vildkaarl1, vildkaarl2],
        row: {
          score: 0,
          units: [deepClone(fieldUnit1), deepClone(fieldUnit2)],
        },
        expected: [
          {
            from: {
              ...fieldUnit1,
              unit: berserker1._id,
            },
            to: {
              ...fieldUnit1,
              unit: vildkaarl1._id,
            },
            unit: vildkaarl1,
          },
          {
            from: {
              ...fieldUnit2,
              unit: berserker2._id,
            },
            to: {
              ...fieldUnit2,
              unit: vildkaarl2._id,
            },
            unit: vildkaarl2,
          },
        ],
        updatedRow: {
          score: 0,
          units: [
            {
              ...fieldUnit1,
              unit: vildkaarl1._id,
            },
            {
              ...fieldUnit2,
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
      const fieldUnit1 = TestUtil.getDbFieldUnit({
        id: berserker1._id,
      })
      const fieldUnit2 = TestUtil.getDbFieldUnit({
        id: berserker2._id,
      })
      testReplaceBerserkersWithVildkaarl({
        berserkers: [berserker1, berserker2],
        vildkaarls: [vildkaarl1, vildkaarl2],
        row: {
          score: 0,
          units: [deepClone(fieldUnit1), deepClone(fieldUnit2)],
        },
        expected: [
          {
            from: {
              ...fieldUnit1,
              unit: berserker1._id,
            },
            to: {
              ...fieldUnit1,
              unit: vildkaarl1._id,
            },
            unit: vildkaarl1,
          },
          {
            from: {
              ...fieldUnit2,
              unit: berserker2._id,
            },
            to: {
              ...fieldUnit2,
              unit: vildkaarl2._id,
            },
            unit: vildkaarl2,
          },
        ],
        updatedRow: {
          score: 0,
          units: [
            {
              ...fieldUnit1,
              unit: vildkaarl1._id,
            },
            {
              ...fieldUnit2,
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
  getUnitsIdsWithEffectResponses,
  getFieldUnitsResponse,
  getmardroemingFieldUnitResponse,
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
  getUnitsIdsWithEffectResponses?: string[][]
  getFieldUnitsResponse?: FieldUnitDbObject[]
  getmardroemingFieldUnitResponse?: FieldUnitDbObject
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
  const getFieldUnitsSpy = jest.spyOn(GetFieldUnits, 'fromRounds')
  if (getFieldUnitsResponse) {
    getFieldUnitsSpy.mockReturnValue(getFieldUnitsResponse)
  }

  const getUnitIdsWithEffectSpy = jest.spyOn(getUnitIdsWithEffect, 'default')
  if (getUnitsIdsWithEffectResponses) {
    for (const getUnitsWithEffectResponse of getUnitsIdsWithEffectResponses) {
      getUnitIdsWithEffectSpy.mockReturnValueOnce(getUnitsWithEffectResponse)
    }
  }
  const getmardroemingFieldUnitSpy = jest
    .spyOn(EffectMardroeme as any, 'getMardroemingFieldUnit')
    .mockReturnValue(getmardroemingFieldUnitResponse)
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
  expect(getFieldUnitsSpy.mock.calls).toEqual(
    getFieldUnitsResponse
      ? [
          [
            {
              combat,
              rounds: game.players
                .filter((player) => player.user.toString() === game.turn?.toString())
                .map((player) => player.rounds[game.round - 1]),
            },
          ],
        ]
      : []
  )
  const fieldUnitIds = getFieldUnitsResponse?.map((fieldUnit) => fieldUnit.unit.toString())
  const units = battlefieldUnits.filter((battlefieldUnit) => fieldUnitIds?.includes(battlefieldUnit._id.toString()))
  expect(getUnitIdsWithEffectSpy.mock.calls).toEqual(
    getUnitsIdsWithEffectResponses
      ? [
          [
            {
              effect: getEffectWithKeyResponses ? getEffectWithKeyResponses[0] : undefined,
              units,
            },
          ],
          [
            {
              effect: getEffectWithKeyResponses ? getEffectWithKeyResponses[1] : undefined,
              units,
            },
          ],
        ]
      : []
  )
  expect(getmardroemingFieldUnitSpy.mock.calls).toEqual(
    replaceBerserkersWithVildkaarlResponse
      ? [
          [
            {
              fieldUnits: getFieldUnitsResponse,
              mardroemeUnitIds: getUnitsIdsWithEffectResponses ? getUnitsIdsWithEffectResponses[0] : undefined,
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
              fieldUnits: getFieldUnitsResponse,
            },
          ],
        ]
      : []
  )
  const berserkers = getUnitsIdsWithEffectResponses
    ? battlefieldUnits.filter((battlefieldUnit) =>
        getUnitsIdsWithEffectResponses[1].includes(battlefieldUnit._id.toString())
      )
    : undefined
  expect(getVildkaarlsForTransformationSpy.mock.calls).toEqual(
    replaceBerserkersWithVildkaarlResponse
      ? [
          [
            {
              berserkers,
              existingVildkaarlIds,
              limit: getUnitsIdsWithEffectResponses ? getUnitsIdsWithEffectResponses[1].length : undefined,
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
              berserkers,
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
          [`${logPrefix} fieldUnits: "${JSON.stringify(getFieldUnitsResponse)}"`],
          [
            `${logPrefix} mardroemeUnitIds: "${JSON.stringify(getUnitsIdsWithEffectResponses && getUnitsIdsWithEffectResponses[0])}"`,
          ],
          [
            `${logPrefix} berserkerUnitIds: "${JSON.stringify(getUnitsIdsWithEffectResponses && getUnitsIdsWithEffectResponses[1])}"`,
          ],
        ]
      : []
  )
}

function testGetmardroemingFieldUnit({
  fieldUnits,
  mardroemeUnitIds,
  expected,
}: {
  fieldUnits: FieldUnitDbObject[]
  mardroemeUnitIds: string[]
  expected: FieldUnitDbObject | Error
}) {
  if (expected instanceof Error) {
    expect(() =>
      EffectMardroeme['getMardroemingFieldUnit']({
        fieldUnits,
        mardroemeUnitIds,
      })
    ).toThrow(expected)
  } else {
    expect(
      EffectMardroeme['getMardroemingFieldUnit']({
        fieldUnits,
        mardroemeUnitIds,
      })
    ).toEqual(expected)
  }
}

function testGetExistingVildkaarlIds({
  fieldUnits,
  battlefieldUnits,
  expected,
}: {
  fieldUnits: FieldUnitDbObject[]
  battlefieldUnits: UnitDbObject[]
  expected: string[] | Error
}) {
  if (expected instanceof Error) {
    expect(() =>
      EffectMardroeme['getExistingVildkaarlIds']({
        battlefieldUnits,
        fieldUnits,
      })
    ).toThrow(expected)
  } else {
    expect(
      EffectMardroeme['getExistingVildkaarlIds']({
        battlefieldUnits,
        fieldUnits,
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
