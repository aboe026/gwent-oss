import { ObjectId } from 'mongodb'

import CalculateGameEffectiveStrengths, {
  StrengthImpacts,
} from '../../src/graphql/resolvers/mutations/play-unit/calculate-game-effective-strengths'
import { Combat, EffectKey, PlayerCombatRowDbObject, UnitDbObject } from '@gwent/graphql-schema/database-typings'
import deepClone from '../util/deep-clone'
import EffectBond from '../../src/graphql/resolvers/mutations/play-unit/effect-bond'
import EffectHorn from '../../src/graphql/resolvers/mutations/play-unit/effect-horn'
import EffectWeather from '../../src/graphql/resolvers/mutations/play-unit/effect-weather'
import EffectMorale from '../../src/graphql/resolvers/mutations/play-unit/effect-morale'
import GetEffectWithKey from '../../src/graphql/resolvers/mutations/play-unit/get-effect-with-key'
import * as getUnitIdsWithEffect from '../../src/graphql/resolvers/mutations/play-unit/get-unit-ids-with-effect'
import GetWeatherUnitsForRow, {
  PlayerWeatherUnit,
} from '../../src/graphql/resolvers/mutations/play-unit/get-weather-units-for-row'
import { ImpactsByUnitId } from '../../src/graphql/resolvers/resolver-util'
import TestUtil from '../util/test-util'

describe('calculate-game-effective-strengths', () => {
  describe('calculateEffectiveStrengths', () => {
    const empty: StrengthImpacts = {
      bonds: {},
      morales: {},
      horns: {},
      weathers: {},
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
            ...empty,
            morales: {
              [impact.unit.unit.toString()]: [impact],
            },
          },
          empty,
          empty,
        ],
        expected: {
          ...empty,
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
            ...empty,
            bonds: {
              [impact.unit.unit.toString()]: [impact],
            },
          },
          empty,
          empty,
        ],
        expected: {
          ...empty,
          bonds: {
            [impact.unit.unit.toString()]: [impact],
          },
        },
      })
    })
    it('returns single horn impact', () => {
      const impact = TestUtil.getDbImpact({})
      testCalculateEffectiveStrengths({
        rowResults: [
          empty,
          empty,
          empty,
          {
            ...empty,
            horns: {
              [impact.unit.unit.toString()]: [impact],
            },
          },
          empty,
          empty,
        ],
        expected: {
          ...empty,
          horns: {
            [impact.unit.unit.toString()]: [impact],
          },
        },
      })
    })
    it('returns single weather impact', () => {
      const impact = TestUtil.getDbImpact({})
      testCalculateEffectiveStrengths({
        rowResults: [
          empty,
          empty,
          empty,
          {
            ...empty,
            weathers: {
              [impact.unit.unit.toString()]: [impact],
            },
          },
          empty,
          empty,
        ],
        expected: {
          ...empty,
          weathers: {
            [impact.unit.unit.toString()]: [impact],
          },
        },
      })
    })
    it('returns single of each impact', () => {
      const impact1 = TestUtil.getDbImpact({})
      const impact2 = TestUtil.getDbImpact({})
      const impact3 = TestUtil.getDbImpact({})
      const impact4 = TestUtil.getDbImpact({})
      testCalculateEffectiveStrengths({
        rowResults: [
          empty,
          empty,
          {
            ...empty,
            bonds: {
              [impact1.unit.unit.toString()]: [impact1],
            },
          },
          {
            ...empty,
            horns: {
              [impact2.unit.unit.toString()]: [impact2],
            },
          },
          {
            ...empty,
            morales: {
              [impact3.unit.unit.toString()]: [impact3],
            },
          },
          {
            ...empty,
            weathers: {
              [impact4.unit.unit.toString()]: [impact4],
            },
          },
        ],
        expected: {
          ...empty,
          bonds: {
            [impact1.unit.unit.toString()]: [impact1],
          },
          horns: {
            [impact2.unit.unit.toString()]: [impact2],
          },
          morales: {
            [impact3.unit.unit.toString()]: [impact3],
          },
          weathers: {
            [impact4.unit.unit.toString()]: [impact4],
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
            ...empty,
            morales: {
              [impact1.unit.unit.toString()]: [impact1],
              [impact2.unit.unit.toString()]: [impact2],
            },
          },
          empty,
          empty,
        ],
        expected: {
          ...empty,
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
            ...empty,
            bonds: {
              [impact1.unit.unit.toString()]: [impact1],
              [impact2.unit.unit.toString()]: [impact2],
            },
          },
          empty,
          empty,
        ],
        expected: {
          ...empty,
          bonds: {
            [impact1.unit.unit.toString()]: [impact1],
            [impact2.unit.unit.toString()]: [impact2],
          },
          morales: {},
        },
      })
    })
    it('returns multiple horn impacts from single row result', () => {
      const impact1 = TestUtil.getDbImpact({})
      const impact2 = TestUtil.getDbImpact({})
      testCalculateEffectiveStrengths({
        rowResults: [
          empty,
          empty,
          empty,
          {
            ...empty,
            horns: {
              [impact1.unit.unit.toString()]: [impact1],
              [impact2.unit.unit.toString()]: [impact2],
            },
          },
          empty,
          empty,
        ],
        expected: {
          ...empty,
          horns: {
            [impact1.unit.unit.toString()]: [impact1],
            [impact2.unit.unit.toString()]: [impact2],
          },
          morales: {},
        },
      })
    })
    it('returns multiple weather impacts from single row result', () => {
      const impact1 = TestUtil.getDbImpact({})
      const impact2 = TestUtil.getDbImpact({})
      testCalculateEffectiveStrengths({
        rowResults: [
          empty,
          empty,
          empty,
          {
            ...empty,
            weathers: {
              [impact1.unit.unit.toString()]: [impact1],
              [impact2.unit.unit.toString()]: [impact2],
            },
          },
          empty,
          empty,
        ],
        expected: {
          ...empty,
          weathers: {
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
            ...empty,
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
          ...empty,
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
    it('returns multiple of each impacts from single row result', () => {
      const impact1 = TestUtil.getDbImpact({})
      const impact2 = TestUtil.getDbImpact({})
      const impact3 = TestUtil.getDbImpact({})
      const impact4 = TestUtil.getDbImpact({})
      const impact5 = TestUtil.getDbImpact({})
      const impact6 = TestUtil.getDbImpact({})
      const impact7 = TestUtil.getDbImpact({})
      const impact8 = TestUtil.getDbImpact({})
      testCalculateEffectiveStrengths({
        rowResults: [
          empty,
          empty,
          empty,
          {
            ...empty,
            bonds: {
              [impact1.unit.unit.toString()]: [impact1],
              [impact2.unit.unit.toString()]: [impact2],
            },
            morales: {
              [impact3.unit.unit.toString()]: [impact3],
              [impact4.unit.unit.toString()]: [impact4],
            },
            horns: {
              [impact5.unit.unit.toString()]: [impact5],
              [impact6.unit.unit.toString()]: [impact6],
            },
            weathers: {
              [impact7.unit.unit.toString()]: [impact7],
              [impact8.unit.unit.toString()]: [impact8],
            },
          },
          empty,
          empty,
        ],
        expected: {
          ...empty,
          bonds: {
            [impact1.unit.unit.toString()]: [impact1],
            [impact2.unit.unit.toString()]: [impact2],
          },
          morales: {
            [impact3.unit.unit.toString()]: [impact3],
            [impact4.unit.unit.toString()]: [impact4],
          },
          horns: {
            [impact5.unit.unit.toString()]: [impact5],
            [impact6.unit.unit.toString()]: [impact6],
          },
          weathers: {
            [impact7.unit.unit.toString()]: [impact7],
            [impact8.unit.unit.toString()]: [impact8],
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
            ...empty,
            morales: {
              [impact1.unit.unit.toString()]: [impact1],
            },
            bonds: {
              [impact2.unit.unit.toString()]: [impact2],
            },
          },
          {
            ...empty,
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
          ...empty,
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
        applyWeatherCalls: [],
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
          horns: {},
          morales: {},
          weathers: {},
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
          horns: {},
          morales: {},
          weathers: {},
        },
        modifiedRow: {
          score: 0,
          units: [deepClone(rowUnit)],
        },
        applyMoralesCalls: [],
        applyBondsCalls: [],
        applyWeatherCalls: [],
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
          horns: {},
          morales: {},
          weathers: {},
        },
        modifiedRow: {
          score: 0,
          units: [deepClone(rowUnit)],
        },
        applyMoralesCalls: [],
        applyBondsCalls: [],
        applyWeatherCalls: [],
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
          horns: {},
          morales: {},
          weathers: {},
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
          horns: {},
          morales: {},
          weathers: {},
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
    it('sets effectiveStrength for row with modifier', () => {
      const rowGameUnit1 = TestUtil.getDbGameUnit({})
      const rowGameUnit2 = TestUtil.getDbGameUnit({})
      const rowUnit1 = TestUtil.getDbUnit({
        id: rowGameUnit1.unit,
        strength: 1,
      })
      const rowUnit2 = TestUtil.getDbUnit({
        id: rowGameUnit2.unit,
        strength: 1,
      })
      testCalculateEffectiveStrengthsForRow({
        row: {
          score: 0,
          units: [rowGameUnit1],
          modifier: rowGameUnit2,
        },
        units: [rowUnit1, rowUnit2],
        expected: {
          bonds: {},
          horns: {},
          morales: {},
          weathers: {},
        },
        modifiedRow: {
          score: 0,
          units: [
            {
              ...deepClone(rowGameUnit1),
              effectiveStrength: 1,
              effects: [],
            },
          ],
          modifier: rowGameUnit2,
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
          horns: {},
          morales: {
            [rowGameUnit.unit.toString()]: [impact],
          },
          weathers: {},
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
          horns: {},
          morales: {},
          weathers: {},
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
    it('adds single impact from horn for single unit', () => {
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
        applyHornsResponses: [
          {
            [rowGameUnit.unit.toString()]: [impact],
          },
        ],
        expected: {
          horns: {
            [rowGameUnit.unit.toString()]: [impact],
          },
          bonds: {},
          morales: {},
          weathers: {},
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
    it('adds single impact from weather for single unit', () => {
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
        applyWeatherResponses: [
          {
            [rowGameUnit.unit.toString()]: [impact],
          },
        ],
        expected: {
          horns: {},
          bonds: {},
          morales: {},
          weathers: {
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
    it('adds single impact from every for single unit', () => {
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
            [rowGameUnit.unit.toString()]: [impact1],
          },
        ],
        applyMoralesResponses: [
          {
            [rowGameUnit.unit.toString()]: [impact2],
          },
        ],
        applyHornsResponses: [
          {
            [rowGameUnit.unit.toString()]: [impact3],
          },
        ],
        applyWeatherResponses: [
          {
            [rowGameUnit.unit.toString()]: [impact4],
          },
        ],
        expected: {
          bonds: {
            [rowGameUnit.unit.toString()]: [impact1],
          },
          morales: {
            [rowGameUnit.unit.toString()]: [impact2],
          },
          horns: {
            [rowGameUnit.unit.toString()]: [impact3],
          },
          weathers: {
            [rowGameUnit.unit.toString()]: [impact4],
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
          horns: {},
          morales: {
            [rowGameUnit.unit.toString()]: [impact1, impact2],
          },
          weathers: {},
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
          horns: {},
          morales: {},
          weathers: {},
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
    it('adds multiple impacts from horn for single unit', () => {
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
        applyHornsResponses: [
          {
            [rowGameUnit.unit.toString()]: [impact1, impact2],
          },
        ],
        expected: {
          horns: {
            [rowGameUnit.unit.toString()]: [impact1, impact2],
          },
          bonds: {},
          morales: {},
          weathers: {},
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
    it('adds multiple impacts from weather for single unit', () => {
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
        applyWeatherResponses: [
          {
            [rowGameUnit.unit.toString()]: [impact1, impact2],
          },
        ],
        expected: {
          horns: {},
          bonds: {},
          morales: {},
          weathers: {
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
    it('adds multiple impacts from every for single unit', () => {
      const rowGameUnit = TestUtil.getDbGameUnit({})
      const rowUnit = TestUtil.getDbUnit({
        id: rowGameUnit.unit,
        strength: 1,
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
        applyHornsResponses: [
          {
            [rowGameUnit.unit.toString()]: [impact5, impact6],
          },
        ],
        applyWeatherResponses: [
          {
            [rowGameUnit.unit.toString()]: [impact7, impact8],
          },
        ],
        expected: {
          bonds: {
            [rowGameUnit.unit.toString()]: [impact1, impact2],
          },
          morales: {
            [rowGameUnit.unit.toString()]: [impact3, impact4],
          },
          horns: {
            [rowGameUnit.unit.toString()]: [impact5, impact6],
          },
          weathers: {
            [rowGameUnit.unit.toString()]: [impact7, impact8],
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
          horns: {},
          morales: {
            [rowGameUnit2.unit.toString()]: [impact],
          },
          weathers: {},
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
          horns: {},
          morales: {},
          weathers: {},
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
    it('adds single impact from horn for one of many', () => {
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
        applyHornsResponses: [
          {},
          {
            [rowGameUnit2.unit.toString()]: [impact],
          },
        ],
        expected: {
          horns: {
            [rowGameUnit2.unit.toString()]: [impact],
          },
          bonds: {},
          morales: {},
          weathers: {},
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
    it('adds single impact from weather for one of many', () => {
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
        applyWeatherResponses: [
          {},
          {
            [rowGameUnit2.unit.toString()]: [impact],
          },
        ],
        expected: {
          horns: {},
          bonds: {},
          morales: {},
          weathers: {
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
    it('adds single impact from every for one of many', () => {
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
        applyHornsResponses: [
          {},
          {
            [rowGameUnit2.unit.toString()]: [impact3],
          },
        ],
        applyWeatherResponses: [
          {},
          {
            [rowGameUnit2.unit.toString()]: [impact4],
          },
        ],
        expected: {
          bonds: {
            [rowGameUnit2.unit.toString()]: [impact1],
          },
          morales: {
            [rowGameUnit2.unit.toString()]: [impact2],
          },
          horns: {
            [rowGameUnit2.unit.toString()]: [impact3],
          },
          weathers: {
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
          horns: {},
          morales: {
            [rowGameUnit1.unit.toString()]: [impact1],
            [rowGameUnit2.unit.toString()]: [impact2],
          },
          weathers: {},
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
          horns: {},
          morales: {},
          weathers: {},
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
    it('adds single impact from horn for each of many', () => {
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
        applyHornsResponses: [
          {
            [rowGameUnit1.unit.toString()]: [impact1],
          },
          {
            [rowGameUnit2.unit.toString()]: [impact2],
          },
        ],
        expected: {
          horns: {
            [rowGameUnit1.unit.toString()]: [impact1],
            [rowGameUnit2.unit.toString()]: [impact2],
          },
          bonds: {},
          morales: {},
          weathers: {},
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
    it('adds single impact from weather for each of many', () => {
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
        applyWeatherResponses: [
          {
            [rowGameUnit1.unit.toString()]: [impact1],
          },
          {
            [rowGameUnit2.unit.toString()]: [impact2],
          },
        ],
        expected: {
          horns: {},
          bonds: {},
          morales: {},
          weathers: {
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
    it('adds single impact from every for each of many', () => {
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
        applyHornsResponses: [
          {
            [rowGameUnit1.unit.toString()]: [impact5],
          },
          {
            [rowGameUnit2.unit.toString()]: [impact6],
          },
        ],
        applyWeatherResponses: [
          {
            [rowGameUnit1.unit.toString()]: [impact7],
          },
          {
            [rowGameUnit2.unit.toString()]: [impact8],
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
          horns: {
            [rowGameUnit1.unit.toString()]: [impact5],
            [rowGameUnit2.unit.toString()]: [impact6],
          },
          weathers: {
            [rowGameUnit1.unit.toString()]: [impact7],
            [rowGameUnit2.unit.toString()]: [impact8],
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
          horns: {},
          morales: {
            [rowGameUnit1.unit.toString()]: [impact1, impact2],
            [rowGameUnit2.unit.toString()]: [impact3, impact4],
          },
          weathers: {},
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
          horns: {},
          morales: {},
          weathers: {},
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
    it('adds multiple impacts from horn for each of many', () => {
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
        applyHornsResponses: [
          {
            [rowGameUnit1.unit.toString()]: [impact1, impact2],
          },
          {
            [rowGameUnit2.unit.toString()]: [impact3, impact4],
          },
        ],
        expected: {
          horns: {
            [rowGameUnit1.unit.toString()]: [impact1, impact2],
            [rowGameUnit2.unit.toString()]: [impact3, impact4],
          },
          bonds: {},
          morales: {},
          weathers: {},
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
    it('adds multiple impacts from weather for each of many', () => {
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
        applyWeatherResponses: [
          {
            [rowGameUnit1.unit.toString()]: [impact1, impact2],
          },
          {
            [rowGameUnit2.unit.toString()]: [impact3, impact4],
          },
        ],
        expected: {
          horns: {},
          bonds: {},
          morales: {},
          weathers: {
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
    it('adds multiple impacts from every effect for each of many', () => {
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
      const impact9 = TestUtil.getDbImpact({})
      const impact10 = TestUtil.getDbImpact({})
      const impact11 = TestUtil.getDbImpact({})
      const impact12 = TestUtil.getDbImpact({})
      const impact13 = TestUtil.getDbImpact({})
      const impact14 = TestUtil.getDbImpact({})
      const impact15 = TestUtil.getDbImpact({})
      const impact16 = TestUtil.getDbImpact({})
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
        applyHornsResponses: [
          {
            [rowGameUnit1.unit.toString()]: [impact9, impact10],
          },
          {
            [rowGameUnit2.unit.toString()]: [impact11, impact12],
          },
        ],
        applyWeatherResponses: [
          {
            [rowGameUnit1.unit.toString()]: [impact13, impact14],
          },
          {
            [rowGameUnit2.unit.toString()]: [impact15, impact16],
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
          horns: {
            [rowGameUnit1.unit.toString()]: [impact9, impact10],
            [rowGameUnit2.unit.toString()]: [impact11, impact12],
          },
          weathers: {
            [rowGameUnit1.unit.toString()]: [impact13, impact14],
            [rowGameUnit2.unit.toString()]: [impact15, impact16],
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
  const weatherEffect = TestUtil.getDbEffect({})
  const moraleEffect = TestUtil.getDbEffect({})
  const bondEffect = TestUtil.getDbEffect({})
  const hornEffect = TestUtil.getDbEffect({})
  const musteredUnitIds = [new ObjectId().toString()]
  const transformedUnitIds = [new ObjectId().toString()]
  const getEffectWithKeySpy = jest
    .spyOn(GetEffectWithKey, 'getEffectWithKey')
    .mockReturnValueOnce(weatherEffect)
    .mockReturnValueOnce(moraleEffect)
    .mockReturnValueOnce(bondEffect)
    .mockReturnValueOnce(hornEffect)
  const closeWeathers: PlayerWeatherUnit[] = [
    {
      userId: new ObjectId(),
      unit: TestUtil.getDbUnit({}),
    },
  ]
  const rangedWeathers: PlayerWeatherUnit[] = [
    {
      userId: new ObjectId(),
      unit: TestUtil.getDbUnit({}),
    },
  ]
  const siegeWeathers: PlayerWeatherUnit[] = [
    {
      userId: new ObjectId(),
      unit: TestUtil.getDbUnit({}),
    },
  ]
  const getWeatherUnitsForRowSpy = jest
    .spyOn(GetWeatherUnitsForRow, 'getWeatherUnitsForRow')
    .mockReturnValueOnce(closeWeathers)
    .mockReturnValueOnce(rangedWeathers)
    .mockReturnValueOnce(siegeWeathers)
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
        close: TestUtil.getDbPlayerCombatRow({
          units: [TestUtil.getDbGameUnit({})],
        }),
        ranged: TestUtil.getDbPlayerCombatRow({
          units: [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})],
        }),
        siege: TestUtil.getDbPlayerCombatRow({
          units: [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})],
        }),
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
            close: TestUtil.getDbPlayerCombatRow({
              units: [
                TestUtil.getDbGameUnit({}),
                TestUtil.getDbGameUnit({}),
                TestUtil.getDbGameUnit({}),
                TestUtil.getDbGameUnit({}),
              ],
            }),
            ranged: TestUtil.getDbPlayerCombatRow({
              units: [
                TestUtil.getDbGameUnit({}),
                TestUtil.getDbGameUnit({}),
                TestUtil.getDbGameUnit({}),
                TestUtil.getDbGameUnit({}),
                TestUtil.getDbGameUnit({}),
              ],
            }),
            siege: TestUtil.getDbPlayerCombatRow({
              units: [
                TestUtil.getDbGameUnit({}),
                TestUtil.getDbGameUnit({}),
                TestUtil.getDbGameUnit({}),
                TestUtil.getDbGameUnit({}),
                TestUtil.getDbGameUnit({}),
                TestUtil.getDbGameUnit({}),
              ],
            }),
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
      transformedUnitIds,
    })
  ).toEqual(expected)

  expect(getEffectWithKeySpy.mock.calls).toEqual([
    [
      {
        effectKey: EffectKey.Weather,
        effects,
        logPrefix,
      },
    ],
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
    [
      {
        effectKey: EffectKey.Horn,
        effects,
        logPrefix,
      },
    ],
  ])
  expect(getWeatherUnitsForRowSpy.mock.calls).toEqual([
    [
      {
        logPrefix,
        game,
        combat: Combat.Close,
        units,
      },
    ],
    [
      {
        logPrefix,
        game,
        combat: Combat.Ranged,
        units,
      },
    ],
    [
      {
        logPrefix,
        game,
        combat: Combat.Siege,
        units,
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
    transformedUnitIds,
    hornEffect,
    weatherEffect,
  }
  expect(calculateEffectiveStrengthsForRowSpy.mock.calls).toEqual([
    [
      {
        ...calculateEffectiveStrengthsForRowCall,
        userId: game.players[0].user,
        row: game.players[0].rounds[1].close,
        weatherUnits: closeWeathers,
      },
    ],
    [
      {
        ...calculateEffectiveStrengthsForRowCall,
        userId: game.players[0].user,
        row: game.players[0].rounds[1].ranged,
        weatherUnits: rangedWeathers,
      },
    ],
    [
      {
        ...calculateEffectiveStrengthsForRowCall,
        userId: game.players[0].user,
        row: game.players[0].rounds[1].siege,
        weatherUnits: siegeWeathers,
      },
    ],
    [
      {
        ...calculateEffectiveStrengthsForRowCall,
        userId: game.players[1].user,
        row: game.players[1].rounds[1].close,
        weatherUnits: closeWeathers,
      },
    ],
    [
      {
        ...calculateEffectiveStrengthsForRowCall,
        userId: game.players[1].user,
        row: game.players[1].rounds[1].ranged,
        weatherUnits: rangedWeathers,
      },
    ],
    [
      {
        ...calculateEffectiveStrengthsForRowCall,
        userId: game.players[1].user,
        row: game.players[1].rounds[1].siege,
        weatherUnits: siegeWeathers,
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
  applyHornsResponses,
  applyWeatherResponses = [],
  modifiedRow,
  applyBondsCalls,
  applyMoralesCalls,
  applyWeatherCalls,
  errorCalls = [],
}: {
  row: PlayerCombatRowDbObject
  units: UnitDbObject[]
  logPrefix?: string
  expected: StrengthImpacts | Error
  applyMoralesResponses?: ImpactsByUnitId[]
  applyBondsResponses?: ImpactsByUnitId[]
  applyHornsResponses?: ImpactsByUnitId[]
  applyWeatherResponses?: ImpactsByUnitId[]
  modifiedRow: PlayerCombatRowDbObject
  applyMoralesCalls?: any[][]
  applyBondsCalls?: any[][]
  applyWeatherCalls?: any[][]
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
  const hornEffect = TestUtil.getDbEffect({
    key: EffectKey.Horn,
  })
  const weatherEffect = TestUtil.getDbEffect({
    key: EffectKey.Weather,
  })
  const moraleIdsInRow = [moraleEffect._id.toString()]
  const hornIdsInRow = [hornEffect._id.toString()]
  const bondIdsInRow = [bondEffect._id.toString()]
  const weatherUnits: PlayerWeatherUnit[] = [
    {
      userId,
      unit: TestUtil.getDbUnit({}),
    },
  ]
  const newDeckUnit = TestUtil.getDbDeckUnit({})
  const musteredUnitIds = [new ObjectId().toString()]
  const transformedUnitIds = [new ObjectId().toString()]

  const getUnitIdsWithEffectSpy = jest
    .spyOn(getUnitIdsWithEffect, 'default')
    .mockReturnValueOnce(moraleIdsInRow)
    .mockReturnValueOnce(hornIdsInRow)
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
  const applyHornsSpy = jest.spyOn(EffectHorn, 'applyHorn')
  if (applyHornsResponses) {
    for (const applyHornsResponse of applyHornsResponses) {
      applyHornsSpy.mockReturnValueOnce(applyHornsResponse)
    }
  }
  const applyWeathersSpy = jest.spyOn(EffectWeather, 'weatherScores')
  if (applyWeatherResponses.length > 0) {
    for (const applyWeatherResponse of applyWeatherResponses) {
      applyWeathersSpy.mockReturnValueOnce(applyWeatherResponse)
    }
  } else {
    applyWeathersSpy.mockReturnValue({})
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
        hornEffect,
        weatherEffect,
        newDeckUnit,
        weatherUnits,
        row,
        units,
        userId,
        musteredUnitIds,
        transformedUnitIds,
        bondEffect,
      })
    ).toThrow(expected)
  } else {
    expect(
      CalculateGameEffectiveStrengths['calculateEffectiveStrengthsForRow']({
        currentPlayerId,
        logPrefix,
        moraleEffect,
        hornEffect,
        weatherEffect,
        weatherUnits,
        newDeckUnit,
        row,
        units,
        userId,
        musteredUnitIds,
        transformedUnitIds,
        bondEffect,
      })
    ).toEqual(expected)
  }

  expect(getUnitIdsWithEffectSpy.mock.calls).toEqual(
    expected instanceof Error
      ? []
      : [
          [
            {
              effect: moraleEffect,
              units,
            },
          ],
          [
            {
              effect: hornEffect,
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
  const rowUnits = [...row.units, row.modifier].filter((rowGameUnit) => !!rowGameUnit)
  expect(applyMoralesSpy.mock.calls).toEqual(
    applyMoralesCalls ||
      rowUnits.map((rowGameUnit, index) => {
        return [
          {
            rowGameUnit,
            rowUnit: units[index],
            logPrefix,
            moraleEffect,
            newDeckUnit,
            units,
            userId,
            currentPlayerId,
            transformedUnitIds,
            unitIdsWithMoraleInRow: moraleIdsInRow,
          },
        ]
      })
  )
  expect(applyBondsSpy.mock.calls).toEqual(
    applyBondsCalls ||
      rowUnits.map((rowGameUnit, index) => {
        return [
          {
            rowGameUnit,
            rowUnit: units[index],
            logPrefix,
            bondEffect,
            newDeckUnit,
            musteredUnitIds,
            transformedUnitIds,
            units,
            userId,
            currentPlayerId,
            unitIdsWithBondInRow: bondIdsInRow,
          },
        ]
      })
  )
  expect(applyWeathersSpy.mock.calls).toEqual(
    applyWeatherCalls ||
      rowUnits.map((rowGameUnit, index) => [
        {
          rowGameUnit,
          rowUnit: units[index],
          logPrefix,
          newDeckUnit,
          userId,
          currentPlayerId,
          weatherEffect,
          weatherUnits,
        },
      ])
  )
  expect(errorSpy.mock.calls).toEqual(errorCalls)
}
