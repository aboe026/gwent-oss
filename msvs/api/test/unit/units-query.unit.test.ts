import { ObjectId } from 'mongodb'

import { Context } from '@gwent/graphql-schema/context'
import { FactionDbObject } from '@gwent/graphql-schema/database-typings'
import { FactionKey, QueryUnitsArgs } from '@gwent/graphql-schema/resolver-typings'
import FactionStore from '../../src/database/stores/faction-store'
import TestUtil from '../util/test-util'
import UnitResolver from '../../src/graphql/resolvers/types/unit-resolver'
import UnitsQuery from '../../src/graphql/resolvers/queries/units-query'
import UnitStore from '../../src/database/stores/unit-store'

describe('units-query', () => {
  describe('units', () => {
    it('does not call out to FactionStore if no factions in args', async () => {
      await testUnits({
        factionKeys: undefined,
        factionGetCalls: [],
        factionGetResponse: undefined,
        unitGetCalls: [
          [
            {
              deckable: undefined,
              factionIds: undefined,
            },
          ],
        ],
      })
    })
    it('calls out to FactionStore if factions in args', async () => {
      const factionKey = FactionKey.Monsters
      const factionId = new ObjectId()
      await testUnits({
        factionKeys: [factionKey],
        factionGetCalls: [
          [
            {
              keys: [factionKey],
            },
          ],
        ],
        factionGetResponse: [
          TestUtil.getDbFaction({
            id: factionId,
            key: factionKey,
          }),
        ],
        unitGetCalls: [
          [
            {
              deckable: undefined,
              factionIds: [factionId.toString()],
            },
          ],
        ],
      })
    })
    it('passes deckable false to UnitStore if explicitly defined in args', async () => {
      await testUnits({
        deckable: false,
        unitGetCalls: [
          [
            {
              deckable: false,
              factionIds: undefined,
            },
          ],
        ],
      })
    })
    it('passes deckable true to UnitStore if explicitly defined in args', async () => {
      await testUnits({
        deckable: true,
        unitGetCalls: [
          [
            {
              deckable: true,
              factionIds: undefined,
            },
          ],
        ],
      })
    })
    it('logs to trace if enabled', async () => {
      const factionKey = FactionKey.Monsters
      const factionId = new ObjectId()
      await testUnits({
        factionKeys: [factionKey],
        factionGetCalls: [
          [
            {
              keys: [factionKey],
            },
          ],
        ],
        factionGetResponse: [
          TestUtil.getDbFaction({
            id: factionId,
            key: factionKey,
          }),
        ],
        unitGetCalls: [
          [
            {
              deckable: undefined,
              factionIds: [factionId.toString()],
            },
          ],
        ],
        traceEnabled: true,
      })
    })
  })
})

async function testUnits({
  factionKeys,
  deckable,
  factionGetResponse,
  factionGetCalls = [],
  unitGetCalls,
  traceEnabled,
}: {
  factionKeys?: FactionKey[]
  deckable?: boolean
  factionGetResponse?: FactionDbObject[]
  factionGetCalls?: any[][]
  unitGetCalls: any[][]
  traceEnabled?: boolean
}) {
  const context: Context = {
    session: {
      user: TestUtil.getDbUser({}),
    },
  }
  const logPrefix = `units by "${context.session?.user?._id}"`
  const args: QueryUnitsArgs = {
    factions: factionKeys,
    deckable,
  }
  const unit = TestUtil.getDbUnit({
    faction: factionGetResponse && factionGetResponse[0]._id,
  })
  const resolvedUnit = TestUtil.getUnitFromDbUnit({
    unit,
  })
  const factionGetSpy = jest.spyOn(FactionStore, 'get').mockResolvedValue(factionGetResponse || [])
  const unitGetSpy = jest.spyOn(UnitStore, 'get').mockResolvedValue([unit])
  const unitResolverSpy = jest.spyOn(UnitResolver, 'fromArray').mockResolvedValue([resolvedUnit])
  const traceSpy = jest.fn().mockImplementation()
  UnitsQuery['logger'] = {
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  await expect(UnitsQuery.units(args, context, null as any)).resolves.toEqual([resolvedUnit])

  expect(factionGetSpy.mock.calls).toEqual(factionGetCalls)
  expect(unitGetSpy.mock.calls).toEqual(unitGetCalls)
  expect(unitResolverSpy.mock.calls).toEqual([
    [
      {
        factions: factionGetResponse,
        units: [unit],
      },
    ],
  ])
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [`${logPrefix} args: "${JSON.stringify({ factions: factionKeys, deckable })}"`],
          [`${logPrefix} requested fields: "[]"`],
          [`${logPrefix} requested arguments: "[]"`],
          [`${logPrefix} factions: "${JSON.stringify(factionGetResponse)}"`],
          [`${logPrefix} factionIds: "${JSON.stringify(factionGetResponse?.map((faction) => faction._id))}"`],
          [`${logPrefix} units: "${JSON.stringify([unit])}"`],
        ]
      : []
  )
}
