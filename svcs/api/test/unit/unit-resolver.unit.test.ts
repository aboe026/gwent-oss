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

describe('unit-resolver', () => {
  describe('resolveFromObject', () => {
    it('throws error if faction not resolveable', async () => {
      const unitId = new ObjectId()
      const factionId = new ObjectId()
      await testResolveFromObject({
        unit: TestUtil.getDbUnit({
          id: unitId,
          faction: factionId,
        }),
        error: `Could not resolve faction "${factionId}" on unit "${unitId}".`,
        dlcResolveIdCalls: [[undefined]],
        effectResolveIdCalls: [[undefined]],
        factionResolveIdCalls: [
          [
            {
              id: factionId,
              neutrals: undefined,
            },
          ],
        ],
      })
    })
    it('returns resolved unit if no db objects provided', async () => {
      const faction = TestUtil.getFaction({})
      await testResolveFromObject({
        unit: {
          _id: new ObjectId(),
          created: new Date(),
          deckable: true,
          faction: new ObjectId(faction.id),
          images: ['unit-image'],
          name: 'unit-name',
          quote: 'unit-quote',
        },
        resolvedFaction: faction,
        dlcResolveIdCalls: [[undefined]],
        effectResolveIdCalls: [[undefined]],
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
    it('returns resolved unit if all db objects provided', async () => {
      const dlc = TestUtil.getDbDlc()
      const effect = TestUtil.getDbEffect({})
      const faction = TestUtil.getDbFaction({})
      await testResolveFromObject({
        unit: {
          _id: new ObjectId(),
          created: new Date(),
          deckable: true,
          faction: faction._id,
          images: ['unit-image'],
          name: 'unit-name',
          quote: 'unit-quote',
          dlc: dlc._id,
          effects: [effect._id],
        },
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
    it('throws error if more than 1 unit resolved', async () => {
      const unitId = new ObjectId()
      await testResolveFromId({
        id: unitId,
        resolvedUnits: [TestUtil.getUnit({}), TestUtil.getUnit({})],
        error: `More than one unit resolved for "${unitId}".`,
      })
    })
    it('returns undefined if unit not found', async () => {
      const unitId = new ObjectId()
      await testResolveFromId({
        id: unitId,
        resolvedUnits: [],
      })
    })
    it('returns unit if found', async () => {
      const unitId = new ObjectId()
      await testResolveFromId({
        id: unitId,
        resolvedUnits: [
          TestUtil.getUnit({
            id: unitId,
          }),
        ],
      })
    })
  })
  describe('resolveFromIds', () => {
    test('throws error if unit not returned from UnitStore get', async () => {
      const unitId1 = new ObjectId()
      const unitId2 = new ObjectId()
      await testResolveFromIds({
        ids: [unitId1, unitId2],
        getUnitsResponse: [
          TestUtil.getDbUnit({
            id: unitId1,
          }),
        ],
        error: `Could not resolved units "${unitId2}".`,
        unitGetCalls: [
          [
            {
              ids: [unitId1, unitId2],
            },
          ],
        ],
      })
    })
    test('throws error if extra unit returned from UnitStore get', async () => {
      const unitId1 = new ObjectId()
      const unitId2 = new ObjectId()
      await testResolveFromIds({
        ids: [unitId1],
        getUnitsResponse: [
          TestUtil.getDbUnit({
            id: unitId1,
          }),
          TestUtil.getDbUnit({
            id: unitId2,
          }),
        ],
        error: `Received more units "${unitId2}" than ids to resolve: "${unitId1}".`,
        unitGetCalls: [
          [
            {
              ids: [unitId1],
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
    it('throws error if neutral faction not found', async () => {
      const unit = TestUtil.getDbUnit({})
      await testResolveFromArray({
        units: [unit],
        neutralStats: true,
        factionGetResponses: [[], []],
        error: `Could not resolve neutral faction "${FactionKey.Neutral}" for units in array.`,
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
    it('throws error if more than 1 neutral faction found', async () => {
      const unit = TestUtil.getDbUnit({})
      const neutralFactions = [
        TestUtil.getDbFaction({
          key: FactionKey.Neutral,
        }),
        TestUtil.getDbFaction({
          key: FactionKey.Neutral,
        }),
      ]
      await testResolveFromArray({
        units: [unit],
        neutralStats: true,
        factionGetResponses: [[], neutralFactions],
        error: `More than 1 neutral faction for units in array: "${JSON.stringify(neutralFactions)}".`,
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
    it('throws error if faction not found', async () => {
      const unit = TestUtil.getDbUnit({})
      await testResolveFromArray({
        units: [unit],
        error: `Could not resolve faction "${unit.faction}" for unit "${unit._id}" in array.`,
        factionGetCalls: [
          [
            {
              ids: [unit.faction],
            },
          ],
        ],
      })
    })
    it('throws error if dlc not found', async () => {
      const faction = TestUtil.getDbFaction({})
      const dlc = TestUtil.getDbDlc()
      const unit = TestUtil.getDbUnit({
        faction: faction._id,
        dlc: dlc._id,
      })
      await testResolveFromArray({
        units: [unit],
        factionGetResponses: [[faction]],
        error: `Could not resolve dlc "${dlc._id}" for unit "${unit._id}" in array.`,
        factionGetCalls: [
          [
            {
              ids: [unit.faction],
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
      })
    })
    it('throws error if effect not found', async () => {
      const faction = TestUtil.getDbFaction({})
      const dlc = TestUtil.getDbDlc()
      const effect = TestUtil.getDbEffect({})
      const unit = TestUtil.getDbUnit({
        faction: faction._id,
        dlc: dlc._id,
        effects: [effect._id],
      })
      await testResolveFromArray({
        units: [unit],
        factionGetResponses: [[faction]],
        dlcGetResponse: [dlc],
        error: `Could not resolve effect "${effect._id}" for unit "${unit._id}" in array.`,
        factionGetCalls: [
          [
            {
              ids: [unit.faction],
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
        effectGetCalls: [
          [
            {
              ids: [effect._id.toString()],
            },
          ],
        ],
      })
    })
    it('resolves unit if nothing provided', async () => {
      const faction = TestUtil.getDbFaction({})
      const unit = TestUtil.getDbUnit({
        faction: faction._id,
      })
      await testResolveFromArray({
        units: [unit],
        factionGetResponses: [[faction]],
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
        resolveFromObjectCalls: [
          [
            {
              unit,
              dlc: undefined,
              effects: [],
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
              effects: [],
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
              effects: [],
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
              effects: [],
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
  resolvedDlc = null,
  resolvedEffects = [],
  resolvedFaction,
  error,
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
  resolvedDlc?: Dlc | null
  resolvedEffects?: Effect[]
  resolvedFaction?: Faction
  error?: string
  dlcResolveObjectCalls?: any[][]
  dlcResolveIdCalls?: any[][]
  effectResolveObjectCalls?: any[][]
  effectResolveIdCalls?: any[][]
  factionResolveObjectCalls?: any[][]
  factionResolveIdCalls?: any[][]
}) {
  const dlcResolveObjectSpy = jest.spyOn(DlcResolver, 'resolveFromObject').mockReturnValue(resolvedDlc)
  const dlcResolveIdSpy = jest.spyOn(DlcResolver, 'resolveFromId').mockResolvedValue(resolvedDlc)
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
  const factionResolveIdSpy = jest.spyOn(FactionResolver, 'resolveFromId').mockResolvedValue(resolvedFaction)

  const promise = UnitResolver.resolveFromObject({
    unit,
    dlc,
    effects,
    faction,
    neutral,
    neutralStats,
  })
  if (error) {
    await expect(promise).rejects.toThrow(Error(error))
  } else {
    await expect(promise).resolves.toEqual({
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
  }

  expect(dlcResolveObjectSpy.mock.calls).toEqual(dlcResolveObjectCalls)
  expect(dlcResolveIdSpy.mock.calls).toEqual(dlcResolveIdCalls)
  expect(effectResolveObjectSpy.mock.calls).toEqual(effectResolveObjectCalls)
  expect(effectResolveIdSpy.mock.calls).toEqual(effectResolveIdCalls)
  expect(factionResolveObjectSpy.mock.calls).toEqual(factionResolveObjectCalls)
  expect(factionResolveIdSpy.mock.calls).toEqual(factionResolveIdCalls)
}

async function testResolveFromId({
  id,
  neutralStats,
  resolvedUnits = [],
  error,
}: {
  id: ObjectId | string
  neutralStats?: boolean
  resolvedUnits?: Unit[]
  error?: string
}) {
  const resolveFromIdsSpy = jest.spyOn(UnitResolver, 'resolveFromIds').mockResolvedValue(resolvedUnits)

  const promise = UnitResolver.resolveFromId({
    id,
    neutralStats,
  })
  if (error) {
    await expect(promise).rejects.toThrow(Error(error))
  } else {
    await expect(promise).resolves.toEqual(resolvedUnits[0])
  }

  expect(resolveFromIdsSpy.mock.calls).toEqual([
    [
      {
        ids: [id],
        neutralStats,
      },
    ],
  ])
}

async function testResolveFromIds({
  ids,
  factions,
  neutralStats,
  getUnitsResponse = [],
  resolvedUnits = [],
  error,
  unitGetCalls = [],
  resolveFromArrayCalls = [],
}: {
  ids: (ObjectId | string)[]
  factions?: FactionDbObject[]
  neutralStats?: boolean
  getUnitsResponse?: UnitDbObject[]
  resolvedUnits?: Unit[]
  error?: string
  unitGetCalls?: any[][]
  resolveFromArrayCalls?: any[][]
}) {
  const unitGetSpy = jest.spyOn(UnitStore, 'get').mockResolvedValue(getUnitsResponse)
  const resolveFromArraySpy = jest.spyOn(UnitResolver, 'resolveFromArray').mockResolvedValue(resolvedUnits)

  const promise = UnitResolver.resolveFromIds({
    ids,
    factions,
    neutralStats,
  })
  if (error) {
    await expect(promise).rejects.toThrow(Error(error))
  } else {
    await expect(promise).resolves.toEqual(resolvedUnits)
  }

  expect(unitGetSpy.mock.calls).toEqual(unitGetCalls)
  expect(resolveFromArraySpy.mock.calls).toEqual(resolveFromArrayCalls)
}

async function testResolveFromArray({
  factions,
  units,
  neutralStats,
  dlcGetResponse = [],
  effectGetResponse = [],
  factionGetResponses = [[]],
  error,
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
  error?: string
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
  if (error) {
    await expect(promise).rejects.toThrow(Error(error))
  } else {
    await expect(promise).resolves.toEqual(resolvedUnits)
  }

  expect(dlcGetSpy.mock.calls).toEqual(dlcGetCalls)
  expect(effectGetSpy.mock.calls).toEqual(effectGetCalls)
  expect(factionGetSpy.mock.calls).toEqual(factionGetCalls)
  expect(resolveFromObjectSpy.mock.calls).toEqual(resolveFromObjectCalls)
}
