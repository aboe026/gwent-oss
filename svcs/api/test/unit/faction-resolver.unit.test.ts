import { Faction, FactionDbObject } from '@gwent/graphql-schema/database-typings'
import FactionStore from '../../src/database/stores/faction-store'
import DlcResolver from '../../src/graphql/resolvers/dlc-resolver'
import FactionResolver from '../../src/graphql/resolvers/faction-resolver'
import { Dlc, FactionKey } from '@gwent/graphql-schema/resolver-typings'
import TestUtil from '../test-util'
import { ObjectId } from 'mongodb'
import Verifier from '../../src/util/verifier'

describe('faction-resolver', () => {
  describe('fromObject', () => {
    const faction = TestUtil.getDbFaction({})
    it('throws error if verifyObjects throws error', async () => {
      await testResolveFromObject({
        faction,
        neutralStats: true,
        neutralFactions: [],
        verifyObjectsResponse: Error(`Could not find factions "["NEUTRAL"]" to resolve.`),
      })
    })
    it('returns resolved faction without neutral stats', async () => {
      await testResolveFromObject({
        faction,
      })
    })
    it('returns resolved faction with neutral stats without providing them', async () => {
      await testResolveFromObject({
        faction,
        neutralStats: true,
      })
    })
    it('returns resolved faction with neutral stats while providing them', async () => {
      await testResolveFromObject({
        faction,
        neutralStats: true,
        neutral: TestUtil.getDbFaction({
          key: FactionKey.Neutral,
        }),
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
            neutralStats: undefined,
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
    it('returns empty array if passed one', async () => {
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
    it('throws error verifyObjects throws error on neutral faction', async () => {
      await testResolveFromArray({
        factions: [TestUtil.getDbFaction({})],
        neutralStats: true,
        factionGetResponse: [],
        verifyObjectsResponse: Error(`Could not find factions "["NEUTRAL"]" to resolve.`),
        factionGetCalls: [
          [
            {
              keys: [FactionKey.Neutral],
            },
          ],
        ],
      })
    })
    it('calls to fromObject without neutrals or dlc', async () => {
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
    it('calls to fromObject requesting neutrals without providing', async () => {
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
        neutralStats: true,
        factionGetResponse: [
          {
            _id: new ObjectId(),
            created: new Date(),
            image: 'faction-neutral-image',
            key: FactionKey.Neutral,
            name: 'faction-neutral-name',
            stats: TestUtil.getStats(1),
          },
        ],
        factionGetCalls: [
          [
            {
              keys: [FactionKey.Neutral],
            },
          ],
        ],
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
  describe('resolveStats', () => {
    it('returns faction stats if not neutral and no neutral requested', () => {
      expect(
        FactionResolver.resolveStats({
          faction: TestUtil.getDbFaction({}),
        })
      ).toEqual(TestUtil.getStats())
    })
    it('returns faction stats if neutral and no neutral requested', () => {
      expect(
        FactionResolver.resolveStats({
          faction: TestUtil.getDbFaction({
            key: FactionKey.Neutral,
          }),
        })
      ).toEqual(TestUtil.getStats())
    })
    it('returns faction stats if neutral and neutral requested', () => {
      expect(
        FactionResolver.resolveStats({
          faction: TestUtil.getDbFaction({
            key: FactionKey.Neutral,
          }),
          neutral: TestUtil.getDbFaction({
            key: FactionKey.Neutral,
          }),
        })
      ).toEqual(TestUtil.getStats())
    })
    it('returns combined faction stats if not neutral and neutral requested', () => {
      expect(
        FactionResolver.resolveStats({
          faction: TestUtil.getDbFaction({}),
          neutral: TestUtil.getDbFaction({
            key: FactionKey.Neutral,
          }),
        })
      ).toEqual({
        agile: 2,
        avenger: 4,
        berserker: 6,
        bond: 8,
        close: 10,
        decoy: 12,
        heroes: 14,
        horn: 16,
        mardroeme: 18,
        medic: 20,
        morale: 22,
        muster: 24,
        ranged: 26,
        scorch: 28,
        siege: 30,
        specials: 32,
        spy: 34,
        strengthAverage: 18,
        strengthTotal: 40,
        strengths: 38,
        units: 42,
        weather: 44,
      })
    })
  })
})

async function testResolveFromObject({
  faction,
  dlc,
  neutral,
  neutralStats,
  neutralFactions = [
    TestUtil.getDbFaction({
      key: FactionKey.Neutral,
    }),
  ],
  verifyObjectsResponse,
}: {
  faction: FactionDbObject
  dlc?: Dlc | undefined
  neutral?: FactionDbObject
  neutralStats?: boolean
  neutralFactions?: FactionDbObject[]
  verifyObjectsResponse?: Error
}) {
  let resolvedDlc: Dlc | undefined = undefined
  if (faction.dlc) {
    resolvedDlc =
      dlc ||
      TestUtil.getDlc({
        id: faction.dlc,
      })
  }
  const resolvedStats = TestUtil.getStats(1)
  const resolvedFaction = TestUtil.getFactionFromDbFaction({
    ...faction,
    stats: resolvedStats,
  })
  if (resolvedDlc) {
    resolvedFaction.dlc = resolvedDlc
  }
  const factionGetSpy = jest.spyOn(FactionStore, 'get').mockResolvedValue(neutralFactions)
  const verifyObjectsSpy = jest.spyOn(Verifier, 'checkObjects')
  if (verifyObjectsResponse) {
    verifyObjectsSpy.mockImplementation(() => {
      throw verifyObjectsResponse
    })
  } else {
    verifyObjectsSpy.mockReturnValue(undefined)
  }
  const dlcResolveSpy = jest.spyOn(DlcResolver, 'fromId')
  if (resolvedDlc && !dlc) {
    dlcResolveSpy.mockResolvedValue(resolvedDlc)
  }
  const resolveStatsSpy = jest.spyOn(FactionResolver, 'resolveStats').mockReturnValue(resolvedStats)

  const promise = FactionResolver.fromObject({
    faction,
    dlc,
    neutral,
    neutralStats,
  })

  if (verifyObjectsResponse) {
    await expect(promise).rejects.toThrow(verifyObjectsResponse)
  } else {
    await expect(promise).resolves.toEqual(resolvedFaction)
  }

  expect(factionGetSpy.mock.calls).toEqual(
    neutralStats && !neutral
      ? [
          [
            {
              keys: [FactionKey.Neutral],
            },
          ],
        ]
      : []
  )
  expect(verifyObjectsSpy.mock.calls).toEqual(
    neutralStats && !neutral
      ? [
          [
            {
              expectedKeys: [FactionKey.Neutral],
              objects: neutralFactions,
              field: 'key',
              logger: FactionResolver['logger'],
              label: 'factions',
            },
          ],
        ]
      : []
  )
  expect(dlcResolveSpy.mock.calls).toEqual(faction.dlc && !dlc ? [[faction.dlc]] : [])
  expect(resolveStatsSpy.mock.calls).toEqual(
    verifyObjectsResponse
      ? []
      : [
          [
            {
              faction,
              neutral: neutralStats ? neutral || neutralFactions[0] : undefined,
            },
          ],
        ]
  )
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
  expect(verifyObjectsSpy.mock.calls).toEqual([
    [
      {
        expectedKeys: ids,
        objects: factions,
        field: '_id',
        logger: FactionResolver['logger'],
        label: 'factions',
      },
    ],
  ])
  expect(resolveSpy.mock.calls).toEqual(
    verifyObjectsResponse
      ? []
      : [
          [
            {
              factions,
              neutralStats: undefined,
            },
          ],
        ]
  )
}

async function testResolveFromArray({
  factions,
  neutralStats,
  dlcResolveResponse = [],
  factionGetResponse = [],
  verifyObjectsResponse,
  factionResolveResponse,
  dlcResolveCalls = [[[]]],
  factionGetCalls = [],
}: {
  factions: FactionDbObject[]
  neutralStats?: boolean
  dlcResolveResponse?: Dlc[]
  factionGetResponse?: FactionDbObject[]
  verifyObjectsResponse?: Error
  factionResolveResponse?: Faction
  dlcResolveCalls?: any[][]
  factionGetCalls?: any[][]
}) {
  const dlcResolveSpy = jest.spyOn(DlcResolver, 'fromIds').mockResolvedValue(dlcResolveResponse)
  const factionGetSpy = jest.spyOn(FactionStore, 'get').mockResolvedValue(factionGetResponse)
  const verifyObjectsSpy = jest.spyOn(Verifier, 'checkObjects')
  if (verifyObjectsResponse) {
    verifyObjectsSpy.mockImplementation(() => {
      throw verifyObjectsResponse
    })
  } else {
    verifyObjectsSpy.mockReturnValue()
  }
  const fromObjectSpy = jest.spyOn(FactionResolver, 'fromObject')
  if (factionResolveResponse) {
    fromObjectSpy.mockResolvedValue(factionResolveResponse)
  }

  const promise = FactionResolver.fromArray({
    factions,
    neutralStats,
  })
  if (verifyObjectsResponse) {
    await expect(promise).rejects.toThrow(verifyObjectsResponse)
  } else {
    await expect(promise).resolves.toEqual([factionResolveResponse])
  }

  expect(dlcResolveSpy.mock.calls).toEqual(dlcResolveCalls)
  expect(factionGetSpy.mock.calls).toEqual(factionGetCalls)
  expect(verifyObjectsSpy.mock.calls).toEqual(
    neutralStats && factionGetResponse
      ? [
          [
            {
              expectedKeys: [FactionKey.Neutral],
              objects: factionGetResponse,
              field: 'key',
              logger: FactionResolver['logger'],
              label: 'factions',
            },
          ],
        ]
      : []
  )
  expect(fromObjectSpy.mock.calls).toEqual(
    verifyObjectsResponse
      ? []
      : [
          factions.map((faction) => {
            return {
              faction,
              dlc: faction.dlc ? dlcResolveResponse[0] : undefined,
              neutral: neutralStats ? factionGetResponse[0] : undefined,
              neutralStats,
            }
          }),
          ,
        ]
  )
}
