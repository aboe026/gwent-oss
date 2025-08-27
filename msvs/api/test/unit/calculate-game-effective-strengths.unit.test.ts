import { ObjectId } from 'mongodb'

import CalculateGameEffectiveStrengths, {
  StrengthImpacts,
} from '../../src/graphql/resolvers/mutations/play-unit/calculate-game-effective-strengths'
import deepClone from '../util/deep-clone'
import EffectBond from '../../src/graphql/resolvers/mutations/play-unit/effect-bond'
import { EffectKey, PlayerCombatRowDbObject, UnitDbObject } from '@gwent/graphql-schema/database-typings'
import EffectMorale from '../../src/graphql/resolvers/mutations/play-unit/effect-morale'
import GetEffectWithKey from '../../src/graphql/resolvers/mutations/play-unit/get-effect-with-key'
import { ImpactsByUnitId } from '../../src/graphql/resolvers/resolver-util'
import TestUtil from '../util/test-util'

describe('calculate-game-effective-strengths', () => {
  describe('calculateEffectiveStrengths', () => {
    const empty = {
      bonds: {},
      morales: {},
    }
    it('returns undefined if no impacts on any row', () => {
      testCalculateEffectiveStrengths({
        rowResults: [empty, empty, empty, empty, empty, empty],
        expected: empty,
      })
    })
    it('returns single morale impact', () => {
      const impact = TestUtil.getDbImpact({})
      testCalculateEffectiveStrengths({
        rowResults: [
          empty,
          empty,
          empty,
          {
            morales: {
              [impact.unit.unit.toString()]: [impact],
            },
            bonds: {},
          },
          empty,
          empty,
        ],
        expected: {
          bonds: {},
          morales: {
            [impact.unit.unit.toString()]: [impact],
          },
        },
      })
    })
    it('returns single bond impact', () => {
      const impact = TestUtil.getDbImpact({})
      testCalculateEffectiveStrengths({
        rowResults: [
          empty,
          empty,
          empty,
          {
            morales: {},
            bonds: {
              [impact.unit.unit.toString()]: [impact],
            },
          },
          empty,
          empty,
        ],
        expected: {
          bonds: {
            [impact.unit.unit.toString()]: [impact],
          },
          morales: {},
        },
      })
    })
    it('returns single of each impact', () => {
      const impact1 = TestUtil.getDbImpact({})
      const impact2 = TestUtil.getDbImpact({})
      testCalculateEffectiveStrengths({
        rowResults: [
          empty,
          empty,
          empty,
          {
            morales: {},
            bonds: {
              [impact1.unit.unit.toString()]: [impact1],
            },
          },
          {
            morales: {
              [impact2.unit.unit.toString()]: [impact2],
            },
            bonds: {},
          },
          empty,
        ],
        expected: {
          bonds: {
            [impact1.unit.unit.toString()]: [impact1],
          },
          morales: {
            [impact2.unit.unit.toString()]: [impact2],
          },
        },
      })
    })
    it('returns multiple morale impacts from single row result', () => {
      const impact1 = TestUtil.getDbImpact({})
      const impact2 = TestUtil.getDbImpact({})
      testCalculateEffectiveStrengths({
        rowResults: [
          empty,
          empty,
          empty,
          {
            morales: {
              [impact1.unit.unit.toString()]: [impact1],
              [impact2.unit.unit.toString()]: [impact2],
            },
            bonds: {},
          },
          empty,
          empty,
        ],
        expected: {
          bonds: {},
          morales: {
            [impact1.unit.unit.toString()]: [impact1],
            [impact2.unit.unit.toString()]: [impact2],
          },
        },
      })
    })
    it('returns multiple bond impacts from single row result', () => {
      const impact1 = TestUtil.getDbImpact({})
      const impact2 = TestUtil.getDbImpact({})
      testCalculateEffectiveStrengths({
        rowResults: [
          empty,
          empty,
          empty,
          {
            morales: {},
            bonds: {
              [impact1.unit.unit.toString()]: [impact1],
              [impact2.unit.unit.toString()]: [impact2],
            },
          },
          empty,
          empty,
        ],
        expected: {
          bonds: {
            [impact1.unit.unit.toString()]: [impact1],
            [impact2.unit.unit.toString()]: [impact2],
          },
          morales: {},
        },
      })
    })
    it('returns multiple of each impacts from single row result', () => {
      const impact1 = TestUtil.getDbImpact({})
      const impact2 = TestUtil.getDbImpact({})
      const impact3 = TestUtil.getDbImpact({})
      const impact4 = TestUtil.getDbImpact({})
      testCalculateEffectiveStrengths({
        rowResults: [
          empty,
          empty,
          empty,
          {
            bonds: {
              [impact1.unit.unit.toString()]: [impact1],
              [impact2.unit.unit.toString()]: [impact2],
            },
            morales: {
              [impact3.unit.unit.toString()]: [impact3],
              [impact4.unit.unit.toString()]: [impact4],
            },
          },
          empty,
          empty,
        ],
        expected: {
          bonds: {
            [impact1.unit.unit.toString()]: [impact1],
            [impact2.unit.unit.toString()]: [impact2],
          },
          morales: {
            [impact3.unit.unit.toString()]: [impact3],
            [impact4.unit.unit.toString()]: [impact4],
          },
        },
      })
    })
    it('returns multiple impacts from multiple row results', () => {
      const impact1 = TestUtil.getDbImpact({})
      const impact2 = TestUtil.getDbImpact({})
      const impact3 = TestUtil.getDbImpact({})
      const impact4 = TestUtil.getDbImpact({})
      testCalculateEffectiveStrengths({
        rowResults: [
          empty,
          empty,
          empty,
          {
            morales: {
              [impact1.unit.unit.toString()]: [impact1],
            },
            bonds: {
              [impact2.unit.unit.toString()]: [impact2],
            },
          },
          {
            morales: {
              [impact3.unit.unit.toString()]: [impact3],
            },
            bonds: {
              [impact4.unit.unit.toString()]: [impact4],
            },
          },
          empty,
        ],
        expected: {
          bonds: {
            [impact2.unit.unit.toString()]: [impact2],
            [impact4.unit.unit.toString()]: [impact4],
          },
          morales: {
            [impact1.unit.unit.toString()]: [impact1],
            [impact3.unit.unit.toString()]: [impact3],
          },
        },
      })
    })
  })
  describe('calculateEffectiveStrengthsForRow', () => {
    it('throws error if matching unit not found', () => {
      const logPrefix = 'log-prefix'
      const rowUnit = TestUtil.getDbGameUnit({})
      const message = `Could not find Unit with ID "${rowUnit.unit}"`
      testCalculateEffectiveStrengthsForRow({
        row: {
          score: 0,
          units: [rowUnit],
        },
        units: [],
        logPrefix,
        expected: Error(`${message}.`),
        modifiedRow: {
          score: 0,
          units: [deepClone(rowUnit)],
        },
        applyMoralesCalls: [],
        applyBondsCalls: [],
        errorCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('returns empty maps if no units', () => {
      testCalculateEffectiveStrengthsForRow({
        row: {
          score: 0,
          units: [],
        },
        units: [],
        expected: {
          bonds: {},
          morales: {},
        },
        modifiedRow: {
          score: 0,
          units: [],
        },
      })
    })
    it('does not set effectiveStrength for unit with undefined strength', () => {
      const rowUnit = TestUtil.getDbGameUnit({})
      testCalculateEffectiveStrengthsForRow({
        row: {
          score: 0,
          units: [rowUnit],
        },
        units: [
          TestUtil.getDbUnit({
            id: rowUnit.unit,
          }),
        ],
        expected: {
          bonds: {},
          morales: {},
        },
        modifiedRow: {
          score: 0,
          units: [deepClone(rowUnit)],
        },
        applyMoralesCalls: [],
        applyBondsCalls: [],
      })
    })
    it('does not set effectiveStrength for unit with null strength', () => {
      const rowUnit = TestUtil.getDbGameUnit({})
      testCalculateEffectiveStrengthsForRow({
        row: {
          score: 0,
          units: [rowUnit],
        },
        units: [
          TestUtil.getDbUnit({
            id: rowUnit.unit,
            strength: null as any,
          }),
        ],
        expected: {
          bonds: {},
          morales: {},
        },
        modifiedRow: {
          score: 0,
          units: [deepClone(rowUnit)],
        },
        applyMoralesCalls: [],
        applyBondsCalls: [],
      })
    })
    it('sets effectiveStrength for unit with strength zero', () => {
      const rowGameUnit = TestUtil.getDbGameUnit({})
      const rowUnit = TestUtil.getDbUnit({
        id: rowGameUnit.unit,
        strength: 0,
      })
      testCalculateEffectiveStrengthsForRow({
        row: {
          score: 0,
          units: [rowGameUnit],
        },
        units: [rowUnit],
        expected: {
          bonds: {},
          morales: {},
        },
        modifiedRow: {
          score: 0,
          units: [
            {
              ...deepClone(rowGameUnit),
              effectiveStrength: 0,
              effects: [],
            },
          ],
        },
      })
    })
    it('sets effectiveStrength for unit with strength non zero', () => {
      const rowGameUnit = TestUtil.getDbGameUnit({})
      const rowUnit = TestUtil.getDbUnit({
        id: rowGameUnit.unit,
        strength: 1,
      })
      testCalculateEffectiveStrengthsForRow({
        row: {
          score: 0,
          units: [rowGameUnit],
        },
        units: [rowUnit],
        expected: {
          bonds: {},
          morales: {},
        },
        modifiedRow: {
          score: 0,
          units: [
            {
              ...deepClone(rowGameUnit),
              effectiveStrength: 1,
              effects: [],
            },
          ],
        },
      })
    })
    it('adds single impact from morale for single unit', () => {
      const rowGameUnit = TestUtil.getDbGameUnit({})
      const rowUnit = TestUtil.getDbUnit({
        id: rowGameUnit.unit,
        strength: 1,
      })
      const impact = TestUtil.getDbImpact({})
      testCalculateEffectiveStrengthsForRow({
        row: {
          score: 0,
          units: [rowGameUnit],
        },
        units: [rowUnit],
        applyMoralesResponses: [
          {
            [rowGameUnit.unit.toString()]: [impact],
          },
        ],
        expected: {
          bonds: {},
          morales: {
            [rowGameUnit.unit.toString()]: [impact],
          },
        },
        modifiedRow: {
          score: 0,
          units: [
            {
              ...deepClone(rowGameUnit),
              effectiveStrength: 1,
              effects: [],
            },
          ],
        },
      })
    })
    it('adds single impact from bond for single unit', () => {
      const rowGameUnit = TestUtil.getDbGameUnit({})
      const rowUnit = TestUtil.getDbUnit({
        id: rowGameUnit.unit,
        strength: 1,
      })
      const impact = TestUtil.getDbImpact({})
      testCalculateEffectiveStrengthsForRow({
        row: {
          score: 0,
          units: [rowGameUnit],
        },
        units: [rowUnit],
        applyBondsResponses: [
          {
            [rowGameUnit.unit.toString()]: [impact],
          },
        ],
        expected: {
          bonds: {
            [rowGameUnit.unit.toString()]: [impact],
          },
          morales: {},
        },
        modifiedRow: {
          score: 0,
          units: [
            {
              ...deepClone(rowGameUnit),
              effectiveStrength: 1,
              effects: [],
            },
          ],
        },
      })
    })
    it('adds single impact from bond and morale for single unit', () => {
      const rowGameUnit = TestUtil.getDbGameUnit({})
      const rowUnit = TestUtil.getDbUnit({
        id: rowGameUnit.unit,
        strength: 1,
      })
      const impact1 = TestUtil.getDbImpact({})
      const impact2 = TestUtil.getDbImpact({})
      testCalculateEffectiveStrengthsForRow({
        row: {
          score: 0,
          units: [rowGameUnit],
        },
        units: [rowUnit],
        applyBondsResponses: [
          {
            [rowGameUnit.unit.toString()]: [impact1],
          },
        ],
        applyMoralesResponses: [
          {
            [rowGameUnit.unit.toString()]: [impact2],
          },
        ],
        expected: {
          bonds: {
            [rowGameUnit.unit.toString()]: [impact1],
          },
          morales: {
            [rowGameUnit.unit.toString()]: [impact2],
          },
        },
        modifiedRow: {
          score: 0,
          units: [
            {
              ...deepClone(rowGameUnit),
              effectiveStrength: 1,
              effects: [],
            },
          ],
        },
      })
    })
    it('adds multiple impacts from morale for single unit', () => {
      const rowGameUnit = TestUtil.getDbGameUnit({})
      const rowUnit = TestUtil.getDbUnit({
        id: rowGameUnit.unit,
        strength: 1,
      })
      const impact1 = TestUtil.getDbImpact({})
      const impact2 = TestUtil.getDbImpact({})
      testCalculateEffectiveStrengthsForRow({
        row: {
          score: 0,
          units: [rowGameUnit],
        },
        units: [rowUnit],
        applyMoralesResponses: [
          {
            [rowGameUnit.unit.toString()]: [impact1, impact2],
          },
        ],
        expected: {
          bonds: {},
          morales: {
            [rowGameUnit.unit.toString()]: [impact1, impact2],
          },
        },
        modifiedRow: {
          score: 0,
          units: [
            {
              ...deepClone(rowGameUnit),
              effectiveStrength: 1,
              effects: [],
            },
          ],
        },
      })
    })
    it('adds multiple impacts from bond for single unit', () => {
      const rowGameUnit = TestUtil.getDbGameUnit({})
      const rowUnit = TestUtil.getDbUnit({
        id: rowGameUnit.unit,
        strength: 1,
      })
      const impact1 = TestUtil.getDbImpact({})
      const impact2 = TestUtil.getDbImpact({})
      testCalculateEffectiveStrengthsForRow({
        row: {
          score: 0,
          units: [rowGameUnit],
        },
        units: [rowUnit],
        applyBondsResponses: [
          {
            [rowGameUnit.unit.toString()]: [impact1, impact2],
          },
        ],
        expected: {
          bonds: {
            [rowGameUnit.unit.toString()]: [impact1, impact2],
          },
          morales: {},
        },
        modifiedRow: {
          score: 0,
          units: [
            {
              ...deepClone(rowGameUnit),
              effectiveStrength: 1,
              effects: [],
            },
          ],
        },
      })
    })
    it('adds multiple impacts from bond and morale for single unit', () => {
      const rowGameUnit = TestUtil.getDbGameUnit({})
      const rowUnit = TestUtil.getDbUnit({
        id: rowGameUnit.unit,
        strength: 1,
      })
      const impact1 = TestUtil.getDbImpact({})
      const impact2 = TestUtil.getDbImpact({})
      const impact3 = TestUtil.getDbImpact({})
      const impact4 = TestUtil.getDbImpact({})
      testCalculateEffectiveStrengthsForRow({
        row: {
          score: 0,
          units: [rowGameUnit],
        },
        units: [rowUnit],
        applyBondsResponses: [
          {
            [rowGameUnit.unit.toString()]: [impact1, impact2],
          },
        ],
        applyMoralesResponses: [
          {
            [rowGameUnit.unit.toString()]: [impact3, impact4],
          },
        ],
        expected: {
          bonds: {
            [rowGameUnit.unit.toString()]: [impact1, impact2],
          },
          morales: {
            [rowGameUnit.unit.toString()]: [impact3, impact4],
          },
        },
        modifiedRow: {
          score: 0,
          units: [
            {
              ...deepClone(rowGameUnit),
              effectiveStrength: 1,
              effects: [],
            },
          ],
        },
      })
    })
    it('adds single impact from morale for one of many', () => {
      const rowGameUnit1 = TestUtil.getDbGameUnit({})
      const rowGameUnit2 = TestUtil.getDbGameUnit({})
      const rowUnit1 = TestUtil.getDbUnit({
        id: rowGameUnit1.unit,
        strength: 1,
      })
      const rowUnit2 = TestUtil.getDbUnit({
        id: rowGameUnit2.unit,
        strength: 2,
      })
      const impact = TestUtil.getDbImpact({})
      testCalculateEffectiveStrengthsForRow({
        row: {
          score: 0,
          units: [rowGameUnit1, rowGameUnit2],
        },
        units: [rowUnit1, rowUnit2],
        applyMoralesResponses: [
          {},
          {
            [rowGameUnit2.unit.toString()]: [impact],
          },
        ],
        expected: {
          bonds: {},
          morales: {
            [rowGameUnit2.unit.toString()]: [impact],
          },
        },
        modifiedRow: {
          score: 0,
          units: [
            {
              ...deepClone(rowGameUnit1),
              effectiveStrength: 1,
              effects: [],
            },
            {
              ...deepClone(rowGameUnit2),
              effectiveStrength: 2,
              effects: [],
            },
          ],
        },
      })
    })
    it('adds single impact from bond for one of many', () => {
      const rowGameUnit1 = TestUtil.getDbGameUnit({})
      const rowGameUnit2 = TestUtil.getDbGameUnit({})
      const rowUnit1 = TestUtil.getDbUnit({
        id: rowGameUnit1.unit,
        strength: 1,
      })
      const rowUnit2 = TestUtil.getDbUnit({
        id: rowGameUnit2.unit,
        strength: 2,
      })
      const impact = TestUtil.getDbImpact({})
      testCalculateEffectiveStrengthsForRow({
        row: {
          score: 0,
          units: [rowGameUnit1, rowGameUnit2],
        },
        units: [rowUnit1, rowUnit2],
        applyBondsResponses: [
          {},
          {
            [rowGameUnit2.unit.toString()]: [impact],
          },
        ],
        expected: {
          bonds: {
            [rowGameUnit2.unit.toString()]: [impact],
          },
          morales: {},
        },
        modifiedRow: {
          score: 0,
          units: [
            {
              ...deepClone(rowGameUnit1),
              effectiveStrength: 1,
              effects: [],
            },
            {
              ...deepClone(rowGameUnit2),
              effectiveStrength: 2,
              effects: [],
            },
          ],
        },
      })
    })
    it('adds single impact from bond and morale for one of many', () => {
      const rowGameUnit1 = TestUtil.getDbGameUnit({})
      const rowGameUnit2 = TestUtil.getDbGameUnit({})
      const rowUnit1 = TestUtil.getDbUnit({
        id: rowGameUnit1.unit,
        strength: 1,
      })
      const rowUnit2 = TestUtil.getDbUnit({
        id: rowGameUnit2.unit,
        strength: 2,
      })
      const impact1 = TestUtil.getDbImpact({})
      const impact2 = TestUtil.getDbImpact({})
      testCalculateEffectiveStrengthsForRow({
        row: {
          score: 0,
          units: [rowGameUnit1, rowGameUnit2],
        },
        units: [rowUnit1, rowUnit2],
        applyBondsResponses: [
          {},
          {
            [rowGameUnit2.unit.toString()]: [impact1],
          },
        ],
        applyMoralesResponses: [
          {},
          {
            [rowGameUnit2.unit.toString()]: [impact2],
          },
        ],
        expected: {
          bonds: {
            [rowGameUnit2.unit.toString()]: [impact1],
          },
          morales: {
            [rowGameUnit2.unit.toString()]: [impact2],
          },
        },
        modifiedRow: {
          score: 0,
          units: [
            {
              ...deepClone(rowGameUnit1),
              effectiveStrength: 1,
              effects: [],
            },
            {
              ...deepClone(rowGameUnit2),
              effectiveStrength: 2,
              effects: [],
            },
          ],
        },
      })
    })
    it('adds single impact from morale for each of many', () => {
      const rowGameUnit1 = TestUtil.getDbGameUnit({})
      const rowGameUnit2 = TestUtil.getDbGameUnit({})
      const rowUnit1 = TestUtil.getDbUnit({
        id: rowGameUnit1.unit,
        strength: 1,
      })
      const rowUnit2 = TestUtil.getDbUnit({
        id: rowGameUnit2.unit,
        strength: 2,
      })
      const impact1 = TestUtil.getDbImpact({})
      const impact2 = TestUtil.getDbImpact({})
      testCalculateEffectiveStrengthsForRow({
        row: {
          score: 0,
          units: [rowGameUnit1, rowGameUnit2],
        },
        units: [rowUnit1, rowUnit2],
        applyMoralesResponses: [
          {
            [rowGameUnit1.unit.toString()]: [impact1],
          },
          {
            [rowGameUnit2.unit.toString()]: [impact2],
          },
        ],
        expected: {
          bonds: {},
          morales: {
            [rowGameUnit1.unit.toString()]: [impact1],
            [rowGameUnit2.unit.toString()]: [impact2],
          },
        },
        modifiedRow: {
          score: 0,
          units: [
            {
              ...deepClone(rowGameUnit1),
              effectiveStrength: 1,
              effects: [],
            },
            {
              ...deepClone(rowGameUnit2),
              effectiveStrength: 2,
              effects: [],
            },
          ],
        },
      })
    })
    it('adds single impact from bond for each of many', () => {
      const rowGameUnit1 = TestUtil.getDbGameUnit({})
      const rowGameUnit2 = TestUtil.getDbGameUnit({})
      const rowUnit1 = TestUtil.getDbUnit({
        id: rowGameUnit1.unit,
        strength: 1,
      })
      const rowUnit2 = TestUtil.getDbUnit({
        id: rowGameUnit2.unit,
        strength: 2,
      })
      const impact1 = TestUtil.getDbImpact({})
      const impact2 = TestUtil.getDbImpact({})
      testCalculateEffectiveStrengthsForRow({
        row: {
          score: 0,
          units: [rowGameUnit1, rowGameUnit2],
        },
        units: [rowUnit1, rowUnit2],
        applyBondsResponses: [
          {
            [rowGameUnit1.unit.toString()]: [impact1],
          },
          {
            [rowGameUnit2.unit.toString()]: [impact2],
          },
        ],
        expected: {
          bonds: {
            [rowGameUnit1.unit.toString()]: [impact1],
            [rowGameUnit2.unit.toString()]: [impact2],
          },
          morales: {},
        },
        modifiedRow: {
          score: 0,
          units: [
            {
              ...deepClone(rowGameUnit1),
              effectiveStrength: 1,
              effects: [],
            },
            {
              ...deepClone(rowGameUnit2),
              effectiveStrength: 2,
              effects: [],
            },
          ],
        },
      })
    })
    it('adds single impact from bond and morale for each of many', () => {
      const rowGameUnit1 = TestUtil.getDbGameUnit({})
      const rowGameUnit2 = TestUtil.getDbGameUnit({})
      const rowUnit1 = TestUtil.getDbUnit({
        id: rowGameUnit1.unit,
        strength: 1,
      })
      const rowUnit2 = TestUtil.getDbUnit({
        id: rowGameUnit2.unit,
        strength: 2,
      })
      const impact1 = TestUtil.getDbImpact({})
      const impact2 = TestUtil.getDbImpact({})
      const impact3 = TestUtil.getDbImpact({})
      const impact4 = TestUtil.getDbImpact({})
      testCalculateEffectiveStrengthsForRow({
        row: {
          score: 0,
          units: [rowGameUnit1, rowGameUnit2],
        },
        units: [rowUnit1, rowUnit2],
        applyBondsResponses: [
          {
            [rowGameUnit1.unit.toString()]: [impact1],
          },
          {
            [rowGameUnit2.unit.toString()]: [impact2],
          },
        ],
        applyMoralesResponses: [
          {
            [rowGameUnit1.unit.toString()]: [impact3],
          },
          {
            [rowGameUnit2.unit.toString()]: [impact4],
          },
        ],
        expected: {
          bonds: {
            [rowGameUnit1.unit.toString()]: [impact1],
            [rowGameUnit2.unit.toString()]: [impact2],
          },
          morales: {
            [rowGameUnit1.unit.toString()]: [impact3],
            [rowGameUnit2.unit.toString()]: [impact4],
          },
        },
        modifiedRow: {
          score: 0,
          units: [
            {
              ...deepClone(rowGameUnit1),
              effectiveStrength: 1,
              effects: [],
            },
            {
              ...deepClone(rowGameUnit2),
              effectiveStrength: 2,
              effects: [],
            },
          ],
        },
      })
    })
    it('adds multiple impacts from morale for each of many', () => {
      const rowGameUnit1 = TestUtil.getDbGameUnit({})
      const rowGameUnit2 = TestUtil.getDbGameUnit({})
      const rowUnit1 = TestUtil.getDbUnit({
        id: rowGameUnit1.unit,
        strength: 1,
      })
      const rowUnit2 = TestUtil.getDbUnit({
        id: rowGameUnit2.unit,
        strength: 2,
      })
      const impact1 = TestUtil.getDbImpact({})
      const impact2 = TestUtil.getDbImpact({})
      const impact3 = TestUtil.getDbImpact({})
      const impact4 = TestUtil.getDbImpact({})
      testCalculateEffectiveStrengthsForRow({
        row: {
          score: 0,
          units: [rowGameUnit1, rowGameUnit2],
        },
        units: [rowUnit1, rowUnit2],
        applyMoralesResponses: [
          {
            [rowGameUnit1.unit.toString()]: [impact1, impact2],
          },
          {
            [rowGameUnit2.unit.toString()]: [impact3, impact4],
          },
        ],
        expected: {
          bonds: {},
          morales: {
            [rowGameUnit1.unit.toString()]: [impact1, impact2],
            [rowGameUnit2.unit.toString()]: [impact3, impact4],
          },
        },
        modifiedRow: {
          score: 0,
          units: [
            {
              ...deepClone(rowGameUnit1),
              effectiveStrength: 1,
              effects: [],
            },
            {
              ...deepClone(rowGameUnit2),
              effectiveStrength: 2,
              effects: [],
            },
          ],
        },
      })
    })
    it('adds multiple impacts from bond for each of many', () => {
      const rowGameUnit1 = TestUtil.getDbGameUnit({})
      const rowGameUnit2 = TestUtil.getDbGameUnit({})
      const rowUnit1 = TestUtil.getDbUnit({
        id: rowGameUnit1.unit,
        strength: 1,
      })
      const rowUnit2 = TestUtil.getDbUnit({
        id: rowGameUnit2.unit,
        strength: 2,
      })
      const impact1 = TestUtil.getDbImpact({})
      const impact2 = TestUtil.getDbImpact({})
      const impact3 = TestUtil.getDbImpact({})
      const impact4 = TestUtil.getDbImpact({})
      testCalculateEffectiveStrengthsForRow({
        row: {
          score: 0,
          units: [rowGameUnit1, rowGameUnit2],
        },
        units: [rowUnit1, rowUnit2],
        applyBondsResponses: [
          {
            [rowGameUnit1.unit.toString()]: [impact1, impact2],
          },
          {
            [rowGameUnit2.unit.toString()]: [impact3, impact4],
          },
        ],
        expected: {
          bonds: {
            [rowGameUnit1.unit.toString()]: [impact1, impact2],
            [rowGameUnit2.unit.toString()]: [impact3, impact4],
          },
          morales: {},
        },
        modifiedRow: {
          score: 0,
          units: [
            {
              ...deepClone(rowGameUnit1),
              effectiveStrength: 1,
              effects: [],
            },
            {
              ...deepClone(rowGameUnit2),
              effectiveStrength: 2,
              effects: [],
            },
          ],
        },
      })
    })
    it('adds multiple impacts from bond and morale for each of many', () => {
      const rowGameUnit1 = TestUtil.getDbGameUnit({})
      const rowGameUnit2 = TestUtil.getDbGameUnit({})
      const rowUnit1 = TestUtil.getDbUnit({
        id: rowGameUnit1.unit,
        strength: 1,
      })
      const rowUnit2 = TestUtil.getDbUnit({
        id: rowGameUnit2.unit,
        strength: 2,
      })
      const impact1 = TestUtil.getDbImpact({})
      const impact2 = TestUtil.getDbImpact({})
      const impact3 = TestUtil.getDbImpact({})
      const impact4 = TestUtil.getDbImpact({})
      const impact5 = TestUtil.getDbImpact({})
      const impact6 = TestUtil.getDbImpact({})
      const impact7 = TestUtil.getDbImpact({})
      const impact8 = TestUtil.getDbImpact({})
      testCalculateEffectiveStrengthsForRow({
        row: {
          score: 0,
          units: [rowGameUnit1, rowGameUnit2],
        },
        units: [rowUnit1, rowUnit2],
        applyBondsResponses: [
          {
            [rowGameUnit1.unit.toString()]: [impact1, impact2],
          },
          {
            [rowGameUnit2.unit.toString()]: [impact3, impact4],
          },
        ],
        applyMoralesResponses: [
          {
            [rowGameUnit1.unit.toString()]: [impact5, impact6],
          },
          {
            [rowGameUnit2.unit.toString()]: [impact7, impact8],
          },
        ],
        expected: {
          bonds: {
            [rowGameUnit1.unit.toString()]: [impact1, impact2],
            [rowGameUnit2.unit.toString()]: [impact3, impact4],
          },
          morales: {
            [rowGameUnit1.unit.toString()]: [impact5, impact6],
            [rowGameUnit2.unit.toString()]: [impact7, impact8],
          },
        },
        modifiedRow: {
          score: 0,
          units: [
            {
              ...deepClone(rowGameUnit1),
              effectiveStrength: 1,
              effects: [],
            },
            {
              ...deepClone(rowGameUnit2),
              effectiveStrength: 2,
              effects: [],
            },
          ],
        },
      })
    })
  })
})

function testCalculateEffectiveStrengths({
  rowResults,
  expected,
}: {
  rowResults: StrengthImpacts[]
  expected: StrengthImpacts
}) {
  const logPrefix = 'log-prefix'
  const moraleEffect = TestUtil.getDbEffect({})
  const bondEffect = TestUtil.getDbEffect({})
  const musteredUnitIds = [new ObjectId().toString()]
  const getEffectWithKeySpy = jest
    .spyOn(GetEffectWithKey, 'getEffectWithKey')
    .mockReturnValueOnce(moraleEffect)
    .mockReturnValueOnce(bondEffect)
  const calculateEffectiveStrengthsForRowSpy = jest
    .spyOn(CalculateGameEffectiveStrengths as any, 'calculateEffectiveStrengthsForRow')
    .mockImplementation()

  const effects = [TestUtil.getDbEffect({})]
  const units = [TestUtil.getDbUnit({})]
  const newDeckUnit = TestUtil.getDbDeckUnit({})
  const gamePlayer1 = TestUtil.getDbGamePlayer({
    rounds: [
      TestUtil.getDbPlayerRound({}),
      TestUtil.getDbPlayerRound({
        close: {
          score: 0,
          units: [TestUtil.getDbGameUnit({})],
        },
        ranged: {
          score: 0,
          units: [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})],
        },
        siege: {
          score: 0,
          units: [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})],
        },
      }),
    ],
  })
  const game = TestUtil.getDbGame({
    round: 2,
    players: [
      gamePlayer1,
      TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({}),
          TestUtil.getDbPlayerRound({
            close: {
              score: 0,
              units: [
                TestUtil.getDbGameUnit({}),
                TestUtil.getDbGameUnit({}),
                TestUtil.getDbGameUnit({}),
                TestUtil.getDbGameUnit({}),
              ],
            },
            ranged: {
              score: 0,
              units: [
                TestUtil.getDbGameUnit({}),
                TestUtil.getDbGameUnit({}),
                TestUtil.getDbGameUnit({}),
                TestUtil.getDbGameUnit({}),
                TestUtil.getDbGameUnit({}),
              ],
            },
            siege: {
              score: 0,
              units: [
                TestUtil.getDbGameUnit({}),
                TestUtil.getDbGameUnit({}),
                TestUtil.getDbGameUnit({}),
                TestUtil.getDbGameUnit({}),
                TestUtil.getDbGameUnit({}),
                TestUtil.getDbGameUnit({}),
              ],
            },
          }),
        ],
      }),
    ],
    turn: gamePlayer1.user,
  })
  for (const rowResult of rowResults) {
    jest
      .spyOn(CalculateGameEffectiveStrengths as any, 'calculateEffectiveStrengthsForRow')
      .mockReturnValueOnce(rowResult)
  }

  expect(
    CalculateGameEffectiveStrengths.calculateEffectiveStrengths({
      logPrefix,
      effects,
      game,
      units,
      newDeckUnit,
      musteredUnitIds,
    })
  ).toEqual(expected)

  expect(getEffectWithKeySpy.mock.calls).toEqual([
    [
      {
        effectKey: EffectKey.Morale,
        effects,
        logPrefix,
      },
    ],
    [
      {
        effectKey: EffectKey.Bond,
        effects,
        logPrefix,
      },
    ],
  ])
  const calculateEffectiveStrengthsForRowCall = {
    units,
    logPrefix,
    newDeckUnit,
    moraleEffect,
    bondEffect,
    currentPlayerId: game.turn,
    musteredUnitIds,
  }
  expect(calculateEffectiveStrengthsForRowSpy.mock.calls).toEqual([
    [
      {
        ...calculateEffectiveStrengthsForRowCall,
        userId: game.players[0].user,
        row: game.players[0].rounds[1].close,
      },
    ],
    [
      {
        ...calculateEffectiveStrengthsForRowCall,
        userId: game.players[0].user,
        row: game.players[0].rounds[1].ranged,
      },
    ],
    [
      {
        ...calculateEffectiveStrengthsForRowCall,
        userId: game.players[0].user,
        row: game.players[0].rounds[1].siege,
      },
    ],
    [
      {
        ...calculateEffectiveStrengthsForRowCall,
        userId: game.players[1].user,
        row: game.players[1].rounds[1].close,
      },
    ],
    [
      {
        ...calculateEffectiveStrengthsForRowCall,
        userId: game.players[1].user,
        row: game.players[1].rounds[1].ranged,
      },
    ],
    [
      {
        ...calculateEffectiveStrengthsForRowCall,
        userId: game.players[1].user,
        row: game.players[1].rounds[1].siege,
      },
    ],
  ])
}

function testCalculateEffectiveStrengthsForRow({
  row,
  units,
  logPrefix = 'log-prefix',
  expected,
  applyMoralesResponses,
  applyBondsResponses,
  modifiedRow,
  applyBondsCalls,
  applyMoralesCalls,
  errorCalls = [],
}: {
  row: PlayerCombatRowDbObject
  units: UnitDbObject[]
  logPrefix?: string
  expected: StrengthImpacts | Error
  applyMoralesResponses?: ImpactsByUnitId[]
  applyBondsResponses?: ImpactsByUnitId[]
  modifiedRow: PlayerCombatRowDbObject
  applyMoralesCalls?: any[][]
  applyBondsCalls?: any[][]
  errorCalls?: string[][]
}) {
  const currentPlayerId = new ObjectId()
  const userId = new ObjectId()
  const moraleEffect = TestUtil.getDbEffect({
    key: EffectKey.Morale,
  })
  const bondEffect = TestUtil.getDbEffect({
    key: EffectKey.Bond,
  })
  const moraleIdsInRow = [moraleEffect._id.toString()]
  const bondIdsInRow = [bondEffect._id.toString()]
  const newDeckUnit = TestUtil.getDbDeckUnit({})
  const musteredUnitIds = [new ObjectId().toString()]

  const getUnitsWithMoraleSpy = jest.spyOn(EffectMorale, 'getUnitsWithMorale').mockReturnValue(moraleIdsInRow)
  const getUnitsWithBondSpy = jest.spyOn(EffectBond, 'getUnitsWithBond').mockReturnValue(bondIdsInRow)
  const applyMoralesSpy = jest.spyOn(EffectMorale, 'applyMorales')
  if (applyMoralesResponses) {
    for (const applyMoralesResponse of applyMoralesResponses) {
      applyMoralesSpy.mockReturnValueOnce(applyMoralesResponse)
    }
  }
  const applyBondsSpy = jest.spyOn(EffectBond, 'applyBonds')
  if (applyBondsResponses) {
    for (const applyBondsResponse of applyBondsResponses) {
      applyBondsSpy.mockReturnValueOnce(applyBondsResponse)
    }
  }
  const errorSpy = jest.fn().mockImplementation()
  CalculateGameEffectiveStrengths['logger'] = {
    error: errorSpy,
  } as any

  if (expected instanceof Error) {
    expect(() =>
      CalculateGameEffectiveStrengths['calculateEffectiveStrengthsForRow']({
        currentPlayerId,
        logPrefix,
        moraleEffect,
        newDeckUnit,
        row,
        units,
        userId,
        musteredUnitIds,
        bondEffect,
      })
    ).toThrow(expected)
  } else {
    expect(
      CalculateGameEffectiveStrengths['calculateEffectiveStrengthsForRow']({
        currentPlayerId,
        logPrefix,
        moraleEffect,
        newDeckUnit,
        row,
        units,
        userId,
        musteredUnitIds,
        bondEffect,
      })
    ).toEqual(expected)
  }

  expect(getUnitsWithMoraleSpy.mock.calls).toEqual(
    expected instanceof Error
      ? []
      : [
          [
            {
              logPrefix,
              moraleEffect,
              units,
            },
          ],
        ]
  )
  expect(getUnitsWithBondSpy.mock.calls).toEqual(
    applyBondsCalls?.length === 0
      ? []
      : units.map((unit) => {
          return [
            {
              bondEffect,
              logPrefix,
              units,
              unitName: unit.name,
            },
          ]
        })
  )
  expect(row).toEqual(modifiedRow)
  expect(applyMoralesSpy.mock.calls).toEqual(
    applyMoralesCalls ||
      row.units.map((rowGameUnit, index) => {
        return [
          {
            rowGameUnit: rowGameUnit,
            rowUnit: units[index],
            logPrefix,
            moraleEffect,
            newDeckUnit,
            units,
            userId,
            currentPlayerId,
            unitIdsWithMoraleInRow: moraleIdsInRow,
          },
        ]
      })
  )
  expect(applyBondsSpy.mock.calls).toEqual(
    applyBondsCalls ||
      row.units.map((rowGameUnit, index) => {
        return [
          {
            rowGameUnit: rowGameUnit,
            rowUnit: units[index],
            logPrefix,
            bondEffect,
            newDeckUnit,
            musteredUnitIds,
            units,
            userId,
            currentPlayerId,
            unitIdsWithBondInRow: bondIdsInRow,
          },
        ]
      })
  )
  expect(errorSpy.mock.calls).toEqual(errorCalls)
}
