import { Combat, Dlc, Effect, Faction, FactionKey, Unit } from '@gwent/graphql-schema/resolver-typings'
import DlcResolver from '../../src/graphql/resolvers/dlc-resolver'
import EffectResolver from '../../src/graphql/resolvers/effect-resolver'
import FactionResolver from '../../src/graphql/resolvers/faction-resolver'
import UnitResolver from '../../src/graphql/resolvers/unit-resolver'
import {
  DlcDbObject,
  EffectDbObject,
  EffectKey,
  FactionDbObject,
  UnitDbObject,
} from '@gwent/graphql-schema/database-typings'
import { ObjectId } from 'mongodb'
import TestUtil from '../test-util'
import UnitStore from '../../src/database/stores/unit-store'
import DlcStore from '../../src/database/stores/dlc-store'
import EffectStore from '../../src/database/stores/effect-store'
import FactionStore from '../../src/database/stores/faction-store'
import Verifier from '../../src/util/verify-objects'

describe('unit-resolver', () => {
  describe('resolveFromObject', () => {
    it('returns resolved unit if no optional fields', async () => {
      const faction = TestUtil.getFaction({})
      await testResolveFromObject({
        unit: TestUtil.getDbUnit({
          faction: faction.id,
        }),
        resolvedFaction: faction,
        factionResolveIdCalls: [
          [
            {
              id: new ObjectId(faction.id),
              neutrals: undefined,
            },
          ],
        ],
      })
    })
    it('returns resolved unit if optional fields not provided provided', async () => {
      const faction = TestUtil.getFaction({})
      const dlc = TestUtil.getDlc({})
      const effect = TestUtil.getEffect({})
      await testResolveFromObject({
        unit: TestUtil.getDbUnit({
          faction: faction.id,
          dlc: dlc.id,
          effects: [effect.id],
        }),
        resolvedFaction: faction,
        resolvedDlc: dlc,
        resolvedEffects: [effect],
        factionResolveIdCalls: [
          [
            {
              id: new ObjectId(faction.id),
              neutrals: undefined,
            },
          ],
        ],
        dlcResolveIdCalls: [[new ObjectId(dlc.id)]],
        effectResolveIdCalls: [[[new ObjectId(effect.id)]]],
      })
    })
    it('returns resolved unit if optional fields provided', async () => {
      const dlc = TestUtil.getDbDlc()
      const effect = TestUtil.getDbEffect({})
      const faction = TestUtil.getDbFaction({})
      await testResolveFromObject({
        unit: TestUtil.getDbUnit({
          faction: faction._id,
          dlc: dlc._id,
          effects: [effect._id],
        }),
        dlc,
        effects: [effect],
        faction,
        resolvedDlc: TestUtil.getDlcFromDbDlc(dlc),
        resolvedEffects: [TestUtil.getEffectFromDbEffect(effect)],
        resolvedFaction: TestUtil.getFactionFromDbFaction(faction),
        dlcResolveObjectCalls: [[dlc]],
        effectResolveObjectCalls: [[effect]],
        factionResolveObjectCalls: [
          [
            {
              faction,
              neutral: undefined,
              neutralStats: undefined,
            },
          ],
        ],
      })
    })
  })
  describe('resolveFromId', () => {
    it('returns first unit from resolveFromIds', async () => {
      const unit = TestUtil.getUnit({})
      const resolveFromIdsSpy = jest.spyOn(UnitResolver, 'resolveFromIds').mockResolvedValue([unit])

      await expect(
        UnitResolver.resolveFromId({
          id: unit.id,
          neutralStats: undefined,
        })
      ).resolves.toEqual(unit)

      expect(resolveFromIdsSpy.mock.calls).toEqual([
        [
          {
            ids: [unit.id],
            neutralStats: undefined,
          },
        ],
      ])
    })
  })
  describe('resolveFromIds', () => {
    test('throws error if verifyObjects throws error', async () => {
      const unitId1 = new ObjectId()
      const unitId2 = new ObjectId()
      await testResolveFromIds({
        ids: [unitId1, unitId2],
        getUnitsResponse: [
          TestUtil.getDbUnit({
            id: unitId1,
          }),
        ],
        verifyObjectsResponse: Error('Could not find units "["id"]" to resolve.'),
        unitGetCalls: [
          [
            {
              ids: [unitId1, unitId2],
            },
          ],
        ],
      })
    })
    test('returns empty array if ids empty array', async () => {
      await testResolveFromIds({
        ids: [],
      })
    })
    test('returns resolved unit if matches UnitStore get', async () => {
      const unit = TestUtil.getDbUnit({})
      await testResolveFromIds({
        ids: [unit._id],
        getUnitsResponse: [unit],
        resolvedUnits: [
          TestUtil.getUnitFromDbUnit({
            unit,
          }),
        ],
        unitGetCalls: [
          [
            {
              ids: [unit._id],
            },
          ],
        ],
        resolveFromArrayCalls: [
          [
            {
              units: [unit],
              factions: undefined,
              neutralStats: undefined,
            },
          ],
        ],
      })
    })
  })
  describe('resolveFromArray', () => {
    it('throws error if verifyObjects throws error getting neutral faction', async () => {
      const unit = TestUtil.getDbUnit({})
      await testResolveFromArray({
        units: [unit],
        neutralStats: true,
        factionGetResponses: [[], []],
        verifyObjectsResponse: Error(`Could not find factions "${JSON.stringify(FactionKey.Neutral)}" to resolve.`),
        factionGetCalls: [
          [
            {
              ids: [unit.faction],
            },
          ],
          [
            {
              keys: [FactionKey.Neutral],
            },
          ],
        ],
      })
    })
    it('resolves unit if nothing provided', async () => {
      const faction = TestUtil.getDbFaction({})
      const dlc = TestUtil.getDbDlc()
      const unit = TestUtil.getDbUnit({
        faction: faction._id,
        dlc: dlc._id,
      })
      await testResolveFromArray({
        units: [unit],
        factionGetResponses: [[faction]],
        dlcGetResponse: [dlc],
        resolvedUnits: [
          TestUtil.getUnitFromDbUnit({
            unit,
          }),
        ],
        factionGetCalls: [
          [
            {
              ids: [faction._id],
            },
          ],
        ],
        dlcGetCalls: [
          [
            {
              ids: [dlc._id],
            },
          ],
        ],
        resolveFromObjectCalls: [
          [
            {
              unit,
              dlc,
              effects: undefined,
              faction: faction,
              neutral: undefined,
              neutralStats: undefined,
            },
          ],
        ],
      })
    })
    it('resolves unit if faction provided', async () => {
      const faction = TestUtil.getDbFaction({})
      const unit = TestUtil.getDbUnit({
        faction: faction._id,
      })
      await testResolveFromArray({
        units: [unit],
        factions: [faction],
        factionGetResponses: [[]],
        resolvedUnits: [
          TestUtil.getUnitFromDbUnit({
            unit,
          }),
        ],
        resolveFromObjectCalls: [
          [
            {
              unit,
              dlc: undefined,
              effects: undefined,
              faction: faction,
              neutral: undefined,
              neutralStats: undefined,
            },
          ],
        ],
      })
    })
    it('resolves unit if neutrals requested and provided', async () => {
      const faction = TestUtil.getDbFaction({
        key: FactionKey.Neutral,
      })
      const unit = TestUtil.getDbUnit({
        faction: faction._id,
      })
      await testResolveFromArray({
        units: [unit],
        factions: [faction],
        neutralStats: true,
        resolvedUnits: [
          TestUtil.getUnitFromDbUnit({
            unit,
          }),
        ],
        resolveFromObjectCalls: [
          [
            {
              unit,
              dlc: undefined,
              effects: undefined,
              faction: faction,
              neutral: faction,
              neutralStats: true,
            },
          ],
        ],
      })
    })
    it('resolves unit if neutrals requested and not provided', async () => {
      const faction = TestUtil.getDbFaction({})
      const neutralFaction = TestUtil.getDbFaction({
        key: FactionKey.Neutral,
      })
      const unit = TestUtil.getDbUnit({
        faction: faction._id,
      })
      await testResolveFromArray({
        units: [unit],
        factions: [faction],
        neutralStats: true,
        factionGetResponses: [[neutralFaction]],
        resolvedUnits: [
          TestUtil.getUnitFromDbUnit({
            unit,
          }),
        ],
        factionGetCalls: [
          [
            {
              keys: [FactionKey.Neutral],
            },
          ],
        ],
        resolveFromObjectCalls: [
          [
            {
              unit,
              dlc: undefined,
              effects: undefined,
              faction: faction,
              neutral: neutralFaction,
              neutralStats: true,
            },
          ],
        ],
      })
    })
    it('resolves unit with effects', async () => {
      const faction = TestUtil.getDbFaction({})
      const effect = TestUtil.getDbEffect({})
      const unit = TestUtil.getDbUnit({
        faction: faction._id,
        effects: [effect._id],
      })
      await testResolveFromArray({
        units: [unit],
        factionGetResponses: [[faction]],
        effectGetResponse: [effect],
        resolvedUnits: [
          TestUtil.getUnitFromDbUnit({
            unit,
            effects: [effect],
          }),
        ],
        factionGetCalls: [
          [
            {
              ids: [faction._id],
            },
          ],
        ],
        effectGetCalls: [
          [
            {
              ids: [effect._id.toString()],
            },
          ],
        ],
        resolveFromObjectCalls: [
          [
            {
              unit,
              dlc: undefined,
              effects: [effect],
              faction: faction,
              neutral: undefined,
              neutralStats: undefined,
            },
          ],
        ],
      })
    })
  })
  describe('resolveEffectAbilities', () => {
    it('returns null if effects are null', () => {
      expect(UnitResolver.resolveEffectAbilities(TestUtil.getDbUnit({}), null)).toEqual(null)
    })
    it('returns clear weather text if weather effect with no combat rows', () => {
      const effect = TestUtil.getEffect({
        key: EffectKey.Weather,
      })
      expect(UnitResolver.resolveEffectAbilities(TestUtil.getDbUnit({}), [effect])).toEqual([
        {
          ...effect,
          ability: 'Remove all weather effects which are active on the battlefield, including your own.',
        },
      ])
    })
    it('returns row specific ability if weather effect with single combat row', () => {
      const effect = TestUtil.getEffect({
        key: EffectKey.Weather,
        ability: 'Reduce the strength of all cards in the given row(s) on the battlefield, including your own.',
      })
      expect(
        UnitResolver.resolveEffectAbilities(
          TestUtil.getDbUnit({
            combats: [Combat.Close],
          }),
          [effect]
        )
      ).toEqual([
        {
          ...effect,
          ability: 'Reduce the strength of all cards in the Close row on the battlefield, including your own.',
        },
      ])
    })
    it('returns row specific ability if weather effect with multiple combat row', () => {
      const effect = TestUtil.getEffect({
        key: EffectKey.Weather,
        ability: 'Reduce the strength of all cards in the given row(s) on the battlefield, including your own.',
      })
      expect(
        UnitResolver.resolveEffectAbilities(
          TestUtil.getDbUnit({
            combats: [Combat.Close, Combat.Ranged],
          }),
          [effect]
        )
      ).toEqual([
        {
          ...effect,
          ability:
            'Reduce the strength of all cards in the Close and Ranged rows on the battlefield, including your own.',
        },
      ])
    })
    it('returns standard muster text if muster effect with no effectPrefix', () => {
      const effect = TestUtil.getEffect({
        key: EffectKey.Muster,
        ability: 'Find any cards with the same name in your deck and play them instantly.',
      })
      expect(UnitResolver.resolveEffectAbilities(TestUtil.getDbUnit({}), [effect])).toEqual([
        {
          ...effect,
          ability: 'Find any cards with the same name in your deck and play them instantly.',
        },
      ])
    })
    it('returns specific muster text if muster effect with effectPrefix', () => {
      const effect = TestUtil.getEffect({
        key: EffectKey.Muster,
        ability: 'Find any cards with the same name in your deck and play them instantly.',
      })
      expect(
        UnitResolver.resolveEffectAbilities(
          TestUtil.getDbUnit({
            effectPrefix: 'Crone',
          }),
          [effect]
        )
      ).toEqual([
        {
          ...effect,
          ability: 'Find any cards with the "Crone" prefix in your deck and play them instantly.',
        },
      ])
    })
  })
})

async function testResolveFromObject({
  dlc,
  effects,
  faction,
  unit,
  neutral,
  neutralStats,
  resolvedDlc = undefined,
  resolvedEffects = [],
  resolvedFaction,
  dlcResolveIdCalls = [],
  dlcResolveObjectCalls = [],
  effectResolveIdCalls = [],
  effectResolveObjectCalls = [],
  factionResolveIdCalls = [],
  factionResolveObjectCalls = [],
}: {
  unit: UnitDbObject
  dlc?: DlcDbObject
  effects?: EffectDbObject[]
  faction?: FactionDbObject
  neutral?: FactionDbObject
  neutralStats?: boolean
  resolvedDlc?: Dlc
  resolvedEffects?: Effect[]
  resolvedFaction?: Faction
  dlcResolveObjectCalls?: any[][]
  dlcResolveIdCalls?: any[][]
  effectResolveObjectCalls?: any[][]
  effectResolveIdCalls?: any[][]
  factionResolveObjectCalls?: any[][]
  factionResolveIdCalls?: any[][]
}) {
  const dlcResolveObjectSpy = jest.spyOn(DlcResolver, 'resolveFromObject')
  const dlcResolveIdSpy = jest.spyOn(DlcResolver, 'resolveFromId')
  if (resolvedDlc) {
    dlcResolveObjectSpy.mockReturnValue(resolvedDlc)
    dlcResolveIdSpy.mockResolvedValue(resolvedDlc)
  }
  const effectResolveObjectSpy = jest.spyOn(EffectResolver, 'resolveFromObject')
  if (resolvedEffects) {
    for (const effect of resolvedEffects) {
      effectResolveObjectSpy.mockReturnValueOnce(effect)
    }
  }
  const effectResolveIdSpy = jest.spyOn(EffectResolver, 'resolveFromIds').mockResolvedValue(resolvedEffects)
  const factionResolveObjectSpy = jest.spyOn(FactionResolver, 'resolveFromObject')
  if (resolvedFaction) {
    factionResolveObjectSpy.mockResolvedValue(resolvedFaction)
  }
  const factionResolveIdSpy = jest.spyOn(FactionResolver, 'resolveFromId')
  if (resolvedFaction) {
    factionResolveIdSpy.mockResolvedValue(resolvedFaction)
  }

  await expect(
    UnitResolver.resolveFromObject({
      unit,
      dlc,
      effects,
      faction,
      neutral,
      neutralStats,
    })
  ).resolves.toEqual({
    combats: unit.combats,
    created: unit.created,
    deckable: unit.deckable,
    dlc: resolvedDlc,
    effectPrefix: unit.effectPrefix,
    effects: resolvedEffects,
    faction: resolvedFaction,
    hero: unit.hero,
    id: unit._id.toString(),
    images: unit.images,
    name: unit.name,
    quote: unit.quote,
    scorchMin: unit.scorchMin,
    scorchScope: unit.scorchScope,
    special: unit.special,
    strength: unit.strength,
  })

  expect(dlcResolveObjectSpy.mock.calls).toEqual(dlcResolveObjectCalls)
  expect(dlcResolveIdSpy.mock.calls).toEqual(dlcResolveIdCalls)
  expect(effectResolveObjectSpy.mock.calls).toEqual(effectResolveObjectCalls)
  expect(effectResolveIdSpy.mock.calls).toEqual(effectResolveIdCalls)
  expect(factionResolveObjectSpy.mock.calls).toEqual(factionResolveObjectCalls)
  expect(factionResolveIdSpy.mock.calls).toEqual(factionResolveIdCalls)
}

async function testResolveFromIds({
  ids,
  factions,
  neutralStats,
  getUnitsResponse = [],
  resolvedUnits = [],
  verifyObjectsResponse,
  unitGetCalls = [],
  resolveFromArrayCalls = [],
}: {
  ids: (ObjectId | string)[]
  factions?: FactionDbObject[]
  neutralStats?: boolean
  getUnitsResponse?: UnitDbObject[]
  verifyObjectsResponse?: Error
  resolvedUnits?: Unit[]
  unitGetCalls?: any[][]
  resolveFromArrayCalls?: any[][]
}) {
  const unitGetSpy = jest.spyOn(UnitStore, 'get').mockResolvedValue(getUnitsResponse)
  const verifyObjectsSpy = jest.spyOn(Verifier, 'checkObjects')
  if (verifyObjectsResponse) {
    verifyObjectsSpy.mockImplementation(() => {
      throw verifyObjectsResponse
    })
  } else {
    verifyObjectsSpy.mockReturnValue()
  }
  const resolveFromArraySpy = jest.spyOn(UnitResolver, 'resolveFromArray').mockResolvedValue(resolvedUnits)

  const promise = UnitResolver.resolveFromIds({
    ids,
    factions,
    neutralStats,
  })
  if (verifyObjectsResponse) {
    await expect(promise).rejects.toThrow(verifyObjectsResponse)
  } else {
    await expect(promise).resolves.toEqual(resolvedUnits)
  }

  expect(unitGetSpy.mock.calls).toEqual(unitGetCalls)
  expect(verifyObjectsSpy.mock.calls).toEqual(
    ids.length === 0
      ? []
      : [
          [
            {
              expectedKeys: ids,
              objects: getUnitsResponse,
              field: '_id',
              logger: UnitResolver['logger'],
              resourceLabelPlural: 'units',
            },
          ],
        ]
  )
  expect(resolveFromArraySpy.mock.calls).toEqual(resolveFromArrayCalls)
}

async function testResolveFromArray({
  factions,
  units,
  neutralStats,
  dlcGetResponse = [],
  effectGetResponse = [],
  factionGetResponses = [],
  verifyObjectsResponse,
  resolvedUnits = [],
  dlcGetCalls = [
    [
      {
        ids: [],
      },
    ],
  ],
  effectGetCalls = [
    [
      {
        ids: [],
      },
    ],
  ],
  factionGetCalls = [],
  resolveFromObjectCalls = [],
}: {
  factions?: FactionDbObject[]
  units: UnitDbObject[]
  neutralStats?: boolean
  dlcGetResponse?: DlcDbObject[]
  effectGetResponse?: EffectDbObject[]
  factionGetResponses?: FactionDbObject[][]
  verifyObjectsResponse?: Error
  resolvedUnits?: Unit[]
  dlcGetCalls?: any[][]
  effectGetCalls?: any[][]
  factionGetCalls?: any[][]
  resolveFromObjectCalls?: any[][]
}) {
  const dlcGetSpy = jest.spyOn(DlcStore, 'get').mockResolvedValue(dlcGetResponse)
  const effectGetSpy = jest.spyOn(EffectStore, 'get').mockResolvedValue(effectGetResponse)
  const factionGetSpy = jest.spyOn(FactionStore, 'get')
  if (factionGetResponses) {
    for (const factionGetResponse of factionGetResponses) {
      factionGetSpy.mockResolvedValueOnce(factionGetResponse)
    }
  }
  const verifyObjectsSpy = jest.spyOn(Verifier, 'checkObjects')
  if (verifyObjectsResponse) {
    verifyObjectsSpy.mockImplementation(() => {
      throw verifyObjectsResponse
    })
  } else {
    verifyObjectsSpy.mockReturnValue()
  }
  const resolveFromObjectSpy = jest.spyOn(UnitResolver, 'resolveFromObject')
  if (resolvedUnits) {
    for (const resolvedUnit of resolvedUnits) {
      resolveFromObjectSpy.mockResolvedValueOnce(resolvedUnit)
    }
  }

  const promise = UnitResolver.resolveFromArray({
    units,
    factions,
    neutralStats,
  })
  if (verifyObjectsResponse) {
    await expect(promise).rejects.toThrow(verifyObjectsResponse)
  } else {
    await expect(promise).resolves.toEqual(resolvedUnits)
  }

  expect(dlcGetSpy.mock.calls).toEqual(dlcGetCalls)
  expect(effectGetSpy.mock.calls).toEqual(effectGetCalls)
  expect(factionGetSpy.mock.calls).toEqual(factionGetCalls)
  expect(verifyObjectsSpy.mock.calls).toEqual(
    neutralStats && factionGetResponses.length > 0
      ? [
          [
            {
              expectedKeys: [FactionKey.Neutral],
              objects: factionGetResponses.at(-1),
              field: 'key',
              logger: UnitResolver['logger'],
              resourceLabelPlural: 'factions',
            },
          ],
        ]
      : []
  )
  expect(resolveFromObjectSpy.mock.calls).toEqual(resolveFromObjectCalls)
}
