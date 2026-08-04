import { ObjectId } from 'mongodb'

import { Combat, Dlc, Effect, Faction, Unit } from '@gwent-oss/graphql-schema/resolver-typings'
import {
  DlcDbObject,
  EffectDbObject,
  EffectKey,
  FactionDbObject,
  UnitDbObject,
} from '@gwent-oss/graphql-schema/database-typings'
import DlcResolver from '../../src/graphql/resolvers/types/dlc-resolver'
import DlcStore from '../../src/database/stores/dlc-store'
import EffectResolver from '../../src/graphql/resolvers/types/effect-resolver'
import EffectStore from '../../src/database/stores/effect-store'
import FactionResolver from '../../src/graphql/resolvers/types/faction-resolver'
import FactionStore from '../../src/database/stores/faction-store'
import TestUtil from '../util/test-util'
import UnitResolver from '../../src/graphql/resolvers/types/unit-resolver'
import UnitStore from '../../src/database/stores/unit-store'
import Verifier from '../../src/util/verifier'

describe('unit-resolver', () => {
  describe('fromObject', () => {
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
            },
          ],
        ],
      })
    })
    it('returns resolved unit if optional fields not provided', async () => {
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
          modifier: true,
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
            },
          ],
        ],
      })
    })
  })
  describe('fromId', () => {
    it('returns first unit from fromIds', async () => {
      const unit = TestUtil.getUnit({})
      const fromIdsSpy = jest.spyOn(UnitResolver, 'fromIds').mockResolvedValue([unit])

      await expect(
        UnitResolver.fromId({
          id: unit.id,
        })
      ).resolves.toEqual(unit)

      expect(fromIdsSpy.mock.calls).toEqual([
        [
          {
            ids: [unit.id],
          },
        ],
      ])
    })
  })
  describe('fromIds', () => {
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
        fromArrayCalls: [
          [
            {
              units: [unit],
              factions: undefined,
            },
          ],
        ],
      })
    })
  })
  describe('fromArray', () => {
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
        fromObjectCalls: [
          [
            {
              unit,
              dlc,
              effects: undefined,
              faction: faction,
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
        fromObjectCalls: [
          [
            {
              unit,
              dlc: undefined,
              effects: undefined,
              faction: faction,
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
        fromObjectCalls: [
          [
            {
              unit,
              dlc: undefined,
              effects: [effect],
              faction: faction,
            },
          ],
        ],
      })
    })
    it('resolves multiple units with same effects', async () => {
      const faction = TestUtil.getDbFaction({})
      const effect = TestUtil.getDbEffect({})
      const unit1 = TestUtil.getDbUnit({
        faction: faction._id,
        effects: [effect._id],
      })
      const unit2 = TestUtil.getDbUnit({
        faction: faction._id,
        effects: [effect._id],
      })
      await testResolveFromArray({
        units: [unit1, unit2],
        factionGetResponses: [[faction]],
        effectGetResponse: [effect],
        resolvedUnits: [
          TestUtil.getUnitFromDbUnit({
            unit: unit1,
            effects: [effect],
          }),
          TestUtil.getUnitFromDbUnit({
            unit: unit2,
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
        fromObjectCalls: [
          [
            {
              unit: unit1,
              dlc: undefined,
              effects: [effect],
              faction: faction,
            },
          ],
          [
            {
              unit: unit2,
              dlc: undefined,
              effects: [effect],
              faction: faction,
            },
          ],
        ],
      })
    })
  })
  describe('effectAbilities', () => {
    it('returns null if effects are null', () => {
      expect(UnitResolver.effectAbilities(TestUtil.getDbUnit({}), null)).toEqual(null)
    })
    describe('weather', () => {
      it('returns clear weather text if weather effect with no combat rows', () => {
        const effect = TestUtil.getEffect({
          key: EffectKey.Weather,
        })
        expect(UnitResolver.effectAbilities(TestUtil.getDbUnit({}), [effect])).toEqual([
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
          UnitResolver.effectAbilities(
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
          UnitResolver.effectAbilities(
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
    })
    describe('muster', () => {
      it('returns standard muster text if muster effect with no effectPrefix', () => {
        const effect = TestUtil.getEffect({
          key: EffectKey.Muster,
          ability: 'Find any cards with the same name in your deck and play them instantly.',
        })
        expect(UnitResolver.effectAbilities(TestUtil.getDbUnit({}), [effect])).toEqual([
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
          UnitResolver.effectAbilities(
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
    describe('scorch', () => {
      it('returns standard scorch text if no scorchScope', () => {
        const effect = TestUtil.getEffect({
          key: EffectKey.Scorch,
          ability: 'Kills the strongest card(s) on the battlefield.',
        })
        expect(UnitResolver.effectAbilities(TestUtil.getDbUnit({}), [effect])).toEqual([
          {
            ...effect,
            ability: 'Kills the strongest card(s) on the battlefield.',
          },
        ])
      })
      it('returns specific scorch text if scorchScope CLOSE but no scorchMin', () => {
        const effect = TestUtil.getEffect({
          key: EffectKey.Scorch,
          ability: 'Kills the strongest card(s) on the battlefield.',
        })
        expect(
          UnitResolver.effectAbilities(
            TestUtil.getDbUnit({
              scorchScope: Combat.Close,
            }),
            [effect]
          )
        ).toEqual([
          {
            ...effect,
            ability: `Destroys your enemy's strongest Close Combat unit(s).`,
          },
        ])
      })
      it('returns specific scorch text if scorchScope RANGED but no scorchMin', () => {
        const effect = TestUtil.getEffect({
          key: EffectKey.Scorch,
          ability: 'Kills the strongest card(s) on the battlefield.',
        })
        expect(
          UnitResolver.effectAbilities(
            TestUtil.getDbUnit({
              scorchScope: Combat.Ranged,
            }),
            [effect]
          )
        ).toEqual([
          {
            ...effect,
            ability: `Destroys your enemy's strongest Ranged Combat unit(s).`,
          },
        ])
      })
      it('returns specific scorch text if scorchScope SIEGE but no scorchMin', () => {
        const effect = TestUtil.getEffect({
          key: EffectKey.Scorch,
          ability: 'Kills the strongest card(s) on the battlefield.',
        })
        expect(
          UnitResolver.effectAbilities(
            TestUtil.getDbUnit({
              scorchScope: Combat.Siege,
            }),
            [effect]
          )
        ).toEqual([
          {
            ...effect,
            ability: `Destroys your enemy's strongest Siege Combat unit(s).`,
          },
        ])
      })
      it('returns specific scorch text if scorchScope CLOSE and scorchMin', () => {
        const effect = TestUtil.getEffect({
          key: EffectKey.Scorch,
          ability: 'Kills the strongest card(s) on the battlefield.',
        })
        expect(
          UnitResolver.effectAbilities(
            TestUtil.getDbUnit({
              scorchScope: Combat.Close,
              scorchMin: 10,
            }),
            [effect]
          )
        ).toEqual([
          {
            ...effect,
            ability: `Destroys your enemy's strongest Close Combat unit(s) if the combined strength of all their Close Combat units is 10 or more.`,
          },
        ])
      })
      it('returns specific scorch text if scorchScope RANGED and scorchMin', () => {
        const effect = TestUtil.getEffect({
          key: EffectKey.Scorch,
          ability: 'Kills the strongest card(s) on the battlefield.',
        })
        expect(
          UnitResolver.effectAbilities(
            TestUtil.getDbUnit({
              scorchScope: Combat.Ranged,
              scorchMin: 10,
            }),
            [effect]
          )
        ).toEqual([
          {
            ...effect,
            ability: `Destroys your enemy's strongest Ranged Combat unit(s) if the combined strength of all their Ranged Combat units is 10 or more.`,
          },
        ])
      })
      it('returns specific scorch text if scorchScope SIEGE and scorchMin', () => {
        const effect = TestUtil.getEffect({
          key: EffectKey.Scorch,
          ability: 'Kills the strongest card(s) on the battlefield.',
        })
        expect(
          UnitResolver.effectAbilities(
            TestUtil.getDbUnit({
              scorchScope: Combat.Siege,
              scorchMin: 10,
            }),
            [effect]
          )
        ).toEqual([
          {
            ...effect,
            ability: `Destroys your enemy's strongest Siege Combat unit(s) if the combined strength of all their Siege Combat units is 10 or more.`,
          },
        ])
      })
    })
  })
})

async function testResolveFromObject({
  dlc,
  effects,
  faction,
  unit,
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
  const dlcResolveObjectSpy = jest.spyOn(DlcResolver, 'fromObject')
  const dlcResolveIdSpy = jest.spyOn(DlcResolver, 'fromId')
  if (resolvedDlc) {
    dlcResolveObjectSpy.mockReturnValue(resolvedDlc)
    dlcResolveIdSpy.mockResolvedValue(resolvedDlc)
  }
  const effectResolveObjectSpy = jest.spyOn(EffectResolver, 'fromObject')
  if (resolvedEffects) {
    for (const effect of resolvedEffects) {
      effectResolveObjectSpy.mockReturnValueOnce(effect)
    }
  }
  const effectResolveIdSpy = jest.spyOn(EffectResolver, 'fromIds').mockResolvedValue(resolvedEffects)
  const factionResolveObjectSpy = jest.spyOn(FactionResolver, 'fromObject')
  if (resolvedFaction) {
    factionResolveObjectSpy.mockResolvedValue(resolvedFaction)
  }
  const factionResolveIdSpy = jest.spyOn(FactionResolver, 'fromId')
  if (resolvedFaction) {
    factionResolveIdSpy.mockResolvedValue(resolvedFaction)
  }

  await expect(
    UnitResolver.fromObject({
      unit,
      dlc,
      effects,
      faction,
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
    modifier: unit.modifier,
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
  getUnitsResponse = [],
  resolvedUnits = [],
  verifyObjectsResponse,
  unitGetCalls = [],
  fromArrayCalls = [],
}: {
  ids: (ObjectId | string)[]
  factions?: FactionDbObject[]
  getUnitsResponse?: UnitDbObject[]
  verifyObjectsResponse?: Error
  resolvedUnits?: Unit[]
  unitGetCalls?: any[][]
  fromArrayCalls?: any[][]
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
  const fromArraySpy = jest.spyOn(UnitResolver, 'fromArray').mockResolvedValue(resolvedUnits)

  const promise = UnitResolver.fromIds({
    ids,
    factions,
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
              label: 'units',
            },
          ],
        ]
  )
  expect(fromArraySpy.mock.calls).toEqual(fromArrayCalls)
}

async function testResolveFromArray({
  factions,
  units,
  dlcGetResponse = [],
  effectGetResponse = [],
  factionGetResponses = [],
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
  fromObjectCalls = [],
}: {
  factions?: FactionDbObject[]
  units: UnitDbObject[]
  dlcGetResponse?: DlcDbObject[]
  effectGetResponse?: EffectDbObject[]
  factionGetResponses?: FactionDbObject[][]
  resolvedUnits?: Unit[]
  dlcGetCalls?: any[][]
  effectGetCalls?: any[][]
  factionGetCalls?: any[][]
  fromObjectCalls?: any[][]
}) {
  const dlcGetSpy = jest.spyOn(DlcStore, 'get').mockResolvedValue(dlcGetResponse)
  const effectGetSpy = jest.spyOn(EffectStore, 'get').mockResolvedValue(effectGetResponse)
  const factionGetSpy = jest.spyOn(FactionStore, 'get')
  if (factionGetResponses) {
    for (const factionGetResponse of factionGetResponses) {
      factionGetSpy.mockResolvedValueOnce(factionGetResponse)
    }
  }
  const fromObjectSpy = jest.spyOn(UnitResolver, 'fromObject')
  if (resolvedUnits) {
    for (const resolvedUnit of resolvedUnits) {
      fromObjectSpy.mockResolvedValueOnce(resolvedUnit)
    }
  }

  await expect(
    UnitResolver.fromArray({
      units,
      factions,
    })
  ).resolves.toEqual(resolvedUnits)

  expect(dlcGetSpy.mock.calls).toEqual(dlcGetCalls)
  expect(effectGetSpy.mock.calls).toEqual(effectGetCalls)
  expect(factionGetSpy.mock.calls).toEqual(factionGetCalls)
  expect(fromObjectSpy.mock.calls).toEqual(fromObjectCalls)
}
