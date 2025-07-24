import { DeckUnitDbObject, EffectDbObject, GameDbObject, UnitDbObject } from '@gwent/graphql-schema/database-typings'
import MusterBattlefield, { Musterings } from '../../src/graphql/resolvers/mutations/play-unit/muster-battlefield'
import TestUtil from '../util/test-util'

describe('muster-battlefield', () => {
  describe('musterBattlefield', () => {
    const logPrefix = 'log-prefix'
    it('throws error if newDeckUnit not apart of battlefieldUnits', async () => {
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const message = `Could not find unit for new deck unit "${newDeckUnit.unit}"`
      await testMusterBattlefield({
        battlefieldUnits: [],
        newDeckUnit,
        logPrefix,
        expected: Error(`${message}.`),
        errorCalls: [[`${logPrefix} failed: ${message}, battlefieldUnits: "[]"`]],
      })
    })
  })
})

async function testMusterBattlefield({
  battlefieldUnits,
  logPrefix,
  newDeckUnit,
  expected,
  errorCalls = [],
}: {
  battlefieldUnits: UnitDbObject[]
  logPrefix: string
  newDeckUnit: DeckUnitDbObject
  expected: Musterings | Error
  errorCalls?: string[][]
}) {
  const effects = [TestUtil.getDbEffect({})]
  const game = TestUtil.getDbGame({})
  const errorSpy = jest.fn().mockImplementation()
  MusterBattlefield['logger'] = {
    error: errorSpy,
  } as any

  const promise = MusterBattlefield.musterBattlefield({
    battlefieldUnits,
    effects,
    game,
    logPrefix,
    newDeckUnit,
  })
  if (expected instanceof Error) {
    await expect(promise).rejects.toThrow(expected)
  } else {
    await expect(promise).resolves.toEqual(expected)
  }

  expect(errorSpy.mock.calls).toEqual(errorCalls)
}
