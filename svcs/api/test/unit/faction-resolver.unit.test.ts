import { Faction, FactionDbObject } from '@gwent/graphql-schema/database-typings'
import FactionStore from '../../src/database/stores/faction-store'
import DlcResolver from '../../src/graphql/resolvers/dlc-resolver'
import FactionResolver from '../../src/graphql/resolvers/faction-resolver'
import { Dlc, FactionKey } from '@gwent/graphql-schema/resolver-typings'
import TestUtil from '../test-util'
import { ObjectId } from 'mongodb'

describe('faction-resolver', () => {
  describe('resolveFromObject', () => {
    const faction = TestUtil.getDbFaction({})
    it('throws error if request neutral stats and neutral faction not found', async () => {
      await testResolveFromObject({
        faction,
        neutralStats: true,
        neutralFactions: [],
        error: `Could not resolve faction "${FactionKey.Neutral}" on faction "${faction._id}".`,
      })
    })
    it('throws error if dlc unresolveable', async () => {
      const dlcId = new ObjectId()
      await testResolveFromObject({
        faction: {
          ...faction,
          dlc: dlcId,
        },
        resolveDlc: false,
        error: `Could not resolve dlc "${dlcId}" on faction "${faction._id}".`,
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
  })
  describe('resolveFromId', () => {
    it('returns undefined if FactionResolver resolveFromIds returns empty array', async () => {
      const id = new ObjectId()
      const resolveFromIdsSpy = jest.spyOn(FactionResolver, 'resolveFromIds').mockResolvedValue([])

      await expect(
        FactionResolver.resolveFromId({
          id,
        })
      ).resolves.toEqual(undefined)

      expect(resolveFromIdsSpy.mock.calls).toEqual([
        [
          {
            ids: [id],
            neutralStats: undefined,
          },
        ],
      ])
    })
    it('returns faction if found', async () => {
      const id = new ObjectId()
      const faction = TestUtil.getFaction({
        id,
      })
      const resolveFromIdsSpy = jest.spyOn(FactionResolver, 'resolveFromIds').mockResolvedValue([faction])

      await expect(
        FactionResolver.resolveFromId({
          id,
        })
      ).resolves.toEqual(faction)

      expect(resolveFromIdsSpy.mock.calls).toEqual([
        [
          {
            ids: [id],
            neutralStats: undefined,
          },
        ],
      ])
    })
  })
  describe('resolveFromIds', () => {
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
  describe('resolveFromArray', () => {
    it('throws error if neutral faction not found', async () => {
      await testResolveFromArray({
        factions: [TestUtil.getDbFaction({})],
        neutralStats: true,
        factionGetResponse: [],
        error: `Could not resolve neutral faction "${FactionKey.Neutral}" for factions array: None found.`,
        factionGetCalls: [
          [
            {
              keys: [FactionKey.Neutral],
            },
          ],
        ],
      })
    })
    it('throws error if multiple neutral factions found', async () => {
      const neutralFactions: FactionDbObject[] = [
        TestUtil.getDbFaction({
          key: FactionKey.Neutral,
        }),
        TestUtil.getDbFaction({
          key: FactionKey.Neutral,
        }),
      ]
      await testResolveFromArray({
        factions: [TestUtil.getDbFaction({})],
        neutralStats: true,
        factionGetResponse: neutralFactions,
        error: `Could not resolve neutral faction "${
          FactionKey.Neutral
        }" for factions array: Found more than one: "${JSON.stringify(neutralFactions)}".`,
        factionGetCalls: [
          [
            {
              keys: [FactionKey.Neutral],
            },
          ],
        ],
      })
    })
    it('throws error if dlc not found', async () => {
      const factionId = new ObjectId()
      const dlcId = new ObjectId()
      await testResolveFromArray({
        factions: [
          TestUtil.getDbFaction({
            id: factionId,
            dlc: dlcId,
          }),
        ],
        error: `Could not resolve dlc "${dlcId}" for faction ${factionId} in array.`,
        dlcResolveCalls: [[[dlcId]]],
      })
    })
    it('calls to resolveFromObject without neutrals or dlc', async () => {
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
    it('calls to resolveFromObject requesting neutrals without providing', async () => {
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
    it('calls to resolveFromObject with dlc without providing', async () => {
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
  resolveDlc = true,
  error,
}: {
  faction: FactionDbObject
  dlc?: Dlc | null
  neutral?: FactionDbObject
  neutralStats?: boolean
  neutralFactions?: FactionDbObject[]
  resolveDlc?: boolean
  error?: string
}) {
  let resolvedDlc: Dlc | null = null
  if (faction.dlc) {
    resolvedDlc =
      dlc ||
      TestUtil.getDlc({
        id: faction.dlc,
      })
  }
  const resolvedStats = TestUtil.getStats(1)
  const resolvedFaction: Faction = {
    created: faction.created,
    id: faction._id.toString(),
    image: faction.image,
    key: faction.key as FactionKey,
    name: faction.name,
    stats: resolvedStats,
    dlc: resolvedDlc,
  }
  const factionGetSpy = jest.spyOn(FactionStore, 'get').mockResolvedValue(neutralFactions)
  const dlcResolveSpy = jest.spyOn(DlcResolver, 'resolveFromId').mockResolvedValue(resolveDlc ? resolvedDlc : null)
  const resolveStatsSpy = jest.spyOn(FactionResolver, 'resolveStats').mockReturnValue(resolvedStats)

  const promise = FactionResolver.resolveFromObject({
    faction,
    dlc,
    neutral,
    neutralStats,
  })

  if (error) {
    await expect(promise).rejects.toThrow(Error(error))
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
  expect(dlcResolveSpy.mock.calls).toEqual(faction.dlc ? [[faction.dlc]] : [])
  expect(resolveStatsSpy.mock.calls).toEqual(
    error
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

async function testResolveFromIds({ ids }: { ids: (ObjectId | string)[] }) {
  const factions = ids.map((id) =>
    TestUtil.getDbFaction({
      id,
    })
  )
  const resolvedFactions: Faction[] = factions.map((faction) => TestUtil.getFactionFromDbFaction(faction))
  const getSpy = jest.spyOn(FactionStore, 'get').mockResolvedValue(factions)
  const resolveSpy = jest.spyOn(FactionResolver, 'resolveFromArray').mockResolvedValue(resolvedFactions)

  await expect(
    FactionResolver.resolveFromIds({
      ids,
    })
  ).resolves.toEqual(resolvedFactions)

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
  expect(resolveSpy.mock.calls).toEqual(
    ids.length > 0
      ? [
          [
            {
              factions,
              neutralStats: undefined,
            },
          ],
        ]
      : []
  )
}

async function testResolveFromArray({
  factions,
  neutralStats,
  dlcResolveResponse = [],
  factionGetResponse = [],
  factionResolveResponse,
  error,
  dlcResolveCalls = [[[]]],
  factionGetCalls = [],
}: {
  factions: FactionDbObject[]
  neutralStats?: boolean
  dlcResolveResponse?: Dlc[]
  factionGetResponse?: FactionDbObject[]
  factionResolveResponse?: Faction
  error?: string
  dlcResolveCalls?: any[][]
  factionGetCalls?: any[][]
}) {
  const dlcResolveSpy = jest.spyOn(DlcResolver, 'resolveFromIds').mockResolvedValue(dlcResolveResponse)
  const factionGetSpy = jest.spyOn(FactionStore, 'get').mockResolvedValue(factionGetResponse)
  const resolveFromObjectSpy = jest.spyOn(FactionResolver, 'resolveFromObject')
  if (factionResolveResponse) {
    resolveFromObjectSpy.mockResolvedValue(factionResolveResponse)
  }

  const promise = FactionResolver.resolveFromArray({
    factions,
    neutralStats,
  })
  if (error) {
    await expect(promise).rejects.toThrow(Error(error))
  } else {
    await expect(promise).resolves.toEqual([factionResolveResponse])
  }

  expect(dlcResolveSpy.mock.calls).toEqual(dlcResolveCalls)
  expect(factionGetSpy.mock.calls).toEqual(factionGetCalls)
}
