import { ObjectId } from 'mongodb'

import { Dlc, FactionKey } from '@gwent/graphql-schema/resolver-typings'
import DlcResolver from '../../src/graphql/resolvers/types/dlc-resolver'
import { Faction, FactionDbObject } from '@gwent/graphql-schema/database-typings'
import FactionResolver from '../../src/graphql/resolvers/types/faction-resolver'
import FactionStore from '../../src/database/stores/faction-store'
import TestUtil from '../util/test-util'
import Verifier from '../../src/util/verifier'

describe('faction-resolver', () => {
  describe('fromObject', () => {
    const faction = TestUtil.getDbFaction({})
    it('returns faction without dlc if no dlc specified', async () => {
      await testResolveFromObject({
        faction,
      })
    })
    it('returns faction without reaching out to DlcResolver if dlc provided', async () => {
      const dlc = TestUtil.getDlc({})
      await testResolveFromObject({
        faction: {
          ...faction,
          dlc: new ObjectId(dlc.id),
        },
        dlc,
      })
    })
    it('returns faction while reaching out to DlcResolver if dlc not provided', async () => {
      await testResolveFromObject({
        faction: {
          ...faction,
          dlc: new ObjectId(),
        },
      })
    })
  })
  describe('fromId', () => {
    it('returns first item from fromIds', async () => {
      const id = new ObjectId()
      const faction = TestUtil.getFaction({
        id,
      })
      const fromIdsSpy = jest.spyOn(FactionResolver, 'fromIds').mockResolvedValue([faction])

      await expect(
        FactionResolver.fromId({
          id,
        })
      ).resolves.toEqual(faction)

      expect(fromIdsSpy.mock.calls).toEqual([
        [
          {
            ids: [id],
          },
        ],
      ])
    })
  })
  describe('fromIds', () => {
    it('throws error if verifyObjects throws error', async () => {
      await testResolveFromIds({
        ids: [new ObjectId()],
        verifyObjectsResponse: Error(`Could not find factions "["NEUTRAL"]" to resolve.`),
      })
    })
    it('returns empty array if given empty array', async () => {
      await testResolveFromIds({
        ids: [],
      })
    })
    it('calls to faction store and resolver if passed ObjectId', async () => {
      await testResolveFromIds({
        ids: [new ObjectId()],
      })
    })
    it('calls to faction store and resolver if passed string', async () => {
      await testResolveFromIds({
        ids: [new ObjectId().toString()],
      })
    })
  })
  describe('fromArray', () => {
    it('calls to fromObject without dlc', async () => {
      const faction = TestUtil.getDbFaction({})
      await testResolveFromArray({
        factions: [faction],
        factionResolveResponse: {
          created: faction.created,
          id: faction._id.toString(),
          image: faction.image,
          key: faction.key as FactionKey,
          name: faction.name,
          stats: faction.stats,
        },
      })
    })
    it('calls to fromObject with dlc without providing', async () => {
      const dlc = TestUtil.getDlc({})
      const faction = TestUtil.getDbFaction({
        dlc: dlc.id,
      })
      await testResolveFromArray({
        factions: [faction],
        factionResolveResponse: {
          created: faction.created,
          id: faction._id.toString(),
          image: faction.image,
          key: faction.key as FactionKey,
          name: faction.name,
          stats: faction.stats,
          dlc,
        },
        dlcResolveCalls: [[[new ObjectId(dlc.id)]]],
        dlcResolveResponse: [dlc],
      })
    })
  })
})

async function testResolveFromObject({ faction, dlc }: { faction: FactionDbObject; dlc?: Dlc | undefined }) {
  let resolvedDlc: Dlc | undefined = undefined
  if (faction.dlc) {
    resolvedDlc =
      dlc ||
      TestUtil.getDlc({
        id: faction.dlc,
      })
  }
  const resolvedFaction = TestUtil.getFactionFromDbFaction(faction)
  if (resolvedDlc) {
    resolvedFaction.dlc = resolvedDlc
  }
  const dlcResolveSpy = jest.spyOn(DlcResolver, 'fromId')
  if (resolvedDlc && !dlc) {
    dlcResolveSpy.mockResolvedValue(resolvedDlc)
  }

  await expect(
    FactionResolver.fromObject({
      faction,
      dlc,
    })
  ).resolves.toEqual(resolvedFaction)

  expect(dlcResolveSpy.mock.calls).toEqual(faction.dlc && !dlc ? [[faction.dlc]] : [])
}

async function testResolveFromIds({
  ids,
  verifyObjectsResponse,
}: {
  ids: (ObjectId | string)[]
  verifyObjectsResponse?: Error
}) {
  const factions = ids.map((id) =>
    TestUtil.getDbFaction({
      id,
    })
  )
  const resolvedFactions: Faction[] = factions.map((faction) => TestUtil.getFactionFromDbFaction(faction))
  const getSpy = jest.spyOn(FactionStore, 'get').mockResolvedValue(factions)
  const verifyObjectsSpy = jest.spyOn(Verifier, 'checkObjects')
  if (verifyObjectsResponse) {
    verifyObjectsSpy.mockImplementation(() => {
      throw verifyObjectsResponse
    })
  } else {
    verifyObjectsSpy.mockReturnValue()
  }
  const resolveSpy = jest.spyOn(FactionResolver, 'fromArray').mockResolvedValue(resolvedFactions)

  const promise = FactionResolver.fromIds({
    ids,
  })
  if (verifyObjectsResponse) {
    await expect(promise).rejects.toThrow(verifyObjectsResponse)
  } else {
    await expect(promise).resolves.toEqual(resolvedFactions)
  }

  expect(getSpy.mock.calls).toEqual(
    ids.length > 0
      ? [
          [
            {
              ids,
            },
          ],
        ]
      : []
  )
  expect(verifyObjectsSpy.mock.calls).toEqual(
    ids.length === 0
      ? []
      : [
          [
            {
              expectedKeys: ids,
              objects: factions,
              field: '_id',
              logger: FactionResolver['logger'],
              label: 'factions',
            },
          ],
        ]
  )
  expect(resolveSpy.mock.calls).toEqual(
    verifyObjectsResponse || ids.length === 0
      ? []
      : [
          [
            {
              factions,
            },
          ],
        ]
  )
}

async function testResolveFromArray({
  factions,
  dlcResolveResponse = [],
  factionGetResponse = [],
  factionResolveResponse,
  dlcResolveCalls = [[[]]],
  factionGetCalls = [],
}: {
  factions: FactionDbObject[]
  dlcResolveResponse?: Dlc[]
  factionGetResponse?: FactionDbObject[]
  factionResolveResponse?: Faction
  dlcResolveCalls?: any[][]
  factionGetCalls?: any[][]
}) {
  const dlcResolveSpy = jest.spyOn(DlcResolver, 'fromIds').mockResolvedValue(dlcResolveResponse)
  const factionGetSpy = jest.spyOn(FactionStore, 'get').mockResolvedValue(factionGetResponse)
  const fromObjectSpy = jest.spyOn(FactionResolver, 'fromObject')
  if (factionResolveResponse) {
    fromObjectSpy.mockResolvedValue(factionResolveResponse)
  }

  await expect(
    FactionResolver.fromArray({
      factions,
    })
  ).resolves.toEqual([factionResolveResponse])

  expect(dlcResolveSpy.mock.calls).toEqual(dlcResolveCalls)
  expect(factionGetSpy.mock.calls).toEqual(factionGetCalls)
  expect(fromObjectSpy.mock.calls).toEqual([
    factions.map((faction) => {
      return {
        faction,
        dlc: faction.dlc ? dlcResolveResponse[0] : undefined,
      }
    }),
  ])
}
