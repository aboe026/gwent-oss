import { ObjectId } from 'mongodb'

import {
  Combat,
  DlcDbObject,
  DlcKey,
  EffectDbObject,
  EffectKey,
  FactionDbObject,
  FactionKey,
  LeaderDbObject,
  UnitDbObject,
} from '@gwent/graphql-schema/database-typings'
import dlcs from '../../src/database/upgrades/resources/dlcs.json'
import DlcStore, { AddDlcInput } from '../../src/database/stores/dlc-store'
import effects from '../../src/database/upgrades/resources/effects.json'
import EffectStore, { AddEffectInput } from '../../src/database/stores/effect-store'
import factions from '../../src/database/upgrades/resources/factions.json'
import FactionStore, { AddFactionInput } from '../../src/database/stores/faction-store'
import leaders from '../../src/database/upgrades/resources/leaders.json'
import LeaderStore, { AddLeaderInput } from '../../src/database/stores/leader-store'
import units from '../../src/database/upgrades/resources/units.json'
import UnitStore, { AddUnitInput } from '../../src/database/stores/unit-store'
import Upgrade2, {
  DlcJson,
  EffectJson,
  FactionJson,
  FactionUnits,
  ImageType,
  KeyIdMap,
  LeaderJson,
  UnitJson,
} from '../../src/database/upgrades/upgrade-2'
import * as utils from '@gwent/utils'
import * as validators from '@gwent/validators'
import TestUtil from '../util/test-util'

describe('upgrade-2', () => {
  const unitRequired: UnitJson = {
    'Art Styles': 1,
    Deckable: 'Yes',
    Hero: 'No',
    Faction: 'Northern Realms',
    Name: 'Name',
    Occurrences: 1,
    Quote: 'Quote',
  }
  const effectRequired: EffectJson = {
    Ability: 'Ability',
    Name: 'Name',
  }
  describe('run', () => {
    it('calls to other methods to create resources', async () => {
      const upgrade2 = new Upgrade2()
      const dlcMap: KeyIdMap = {
        'dlc-map': new ObjectId(),
      }
      const effectId = new ObjectId()
      const effectMap: KeyIdMap = {
        'effect-map': effectId,
      }
      const effectDocs = [
        TestUtil.getDbEffect({
          id: effectId,
        }),
      ]
      const createDlcsSpy = jest.spyOn(upgrade2, 'createDlcs').mockResolvedValue(dlcMap)
      const createEffectsSpy = jest.spyOn(upgrade2, 'createEffects').mockResolvedValue({
        effectDocs,
        effectMap,
      })
      const factionId = new ObjectId()
      const factionMap: KeyIdMap = {
        'faction-map': factionId,
      }
      const factionDocs: FactionDbObject[] = []
      const createFactionsSpy = jest.spyOn(upgrade2, 'createFactions').mockResolvedValue({
        factionDocs,
        factionMap,
      })
      const createLeadersSpy = jest.spyOn(upgrade2, 'createLeaders').mockImplementation()
      const unit = TestUtil.getDbUnit({
        effects: [effectId],
      })
      const factionUnits: FactionUnits = {
        [factionId.toString()]: [unit],
      }
      const createUnitsSpy = jest.spyOn(upgrade2, 'createUnits').mockResolvedValue(factionUnits)
      const editFactionSpy = jest.spyOn(FactionStore, 'edit').mockImplementation()
      const stats = TestUtil.getStats()
      const getUnitStatsSpy = jest.spyOn(utils, 'getUnitStats').mockReturnValue(stats)

      await expect(upgrade2.run()).resolves.toEqual(undefined)

      expect(createDlcsSpy.mock.calls).toEqual([
        [
          {
            dlcs,
          },
        ],
      ])
      expect(createEffectsSpy.mock.calls).toEqual([
        [
          {
            effects,
          },
        ],
      ])
      expect(createFactionsSpy.mock.calls).toEqual([
        [
          {
            factions,
            dlcMap,
          },
        ],
      ])
      expect(createLeadersSpy.mock.calls).toEqual([
        [
          {
            leaders,
            dlcMap,
            factionMap,
          },
        ],
      ])
      expect(createUnitsSpy.mock.calls).toEqual([
        [
          {
            units,
            dlcMap,
            effectMap,
            factionDocs,
            factionMap,
          },
        ],
      ])
      expect(getUnitStatsSpy.mock.calls).toEqual([
        [
          [
            {
              unit: {
                ...unit,
                effects: effectDocs,
              },
              artStyle: 1,
            },
          ],
        ],
      ])
      expect(editFactionSpy.mock.calls).toEqual([
        [
          {
            id: factionId.toString(),
            stats,
          },
        ],
      ])
    })
  })
  describe('createDlcs', () => {
    const dlcs: DlcJson[] = [
      {
        Name: 'name',
      },
    ]
    it('calls to DlcStore add', async () => {
      await testCreateDlcs({
        dlcs,
      })
    })
    it('logs to trace if enabled', async () => {
      await testCreateDlcs({
        dlcs,
        traceEnabled: true,
      })
    })
  })
  describe('createEffects', () => {
    const effects: EffectJson[] = [
      {
        Ability: 'ability',
        Name: 'name',
      },
    ]
    it('calls to EffectStore add', async () => {
      await testCreateEffects({
        effects,
      })
    })
    it('logs to trace if enabled', async () => {
      await testCreateEffects({
        effects,
        traceEnabled: true,
      })
    })
  })
  describe('createFactions', () => {
    const factions: FactionJson[] = [
      {
        Name: 'Monsters',
        Ability: 'ability',
      },
    ]
    it('calls to FactionStore add', async () => {
      await testCreateFactions({
        factions,
      })
    })
    it('logs to trace if enabled', async () => {
      await testCreateFactions({
        factions,
        traceEnabled: true,
      })
    })
  })
  describe('createLeaders', () => {
    const factionMap: KeyIdMap = {
      Monsters: new ObjectId(),
    }
    const leaders: LeaderJson[] = [
      {
        Ability: 'ability',
        Faction: 'Monsters',
        Name: 'name',
        Quote: 'quote',
      },
    ]
    it('calls to LeaderStore add', async () => {
      await testCreateLeaders({
        factionMap,
        leaders,
      })
    })
    it('logs to trace if enabled', async () => {
      await testCreateLeaders({
        factionMap,
        leaders,
        traceEnabled: true,
      })
    })
  })
  describe('createUnits', () => {
    const factionDocs = [
      TestUtil.getDbFaction({
        key: FactionKey.Monsters,
      }),
      TestUtil.getDbFaction({
        key: FactionKey.NorthernRealms,
      }),
    ]
    const unit1: UnitJson = {
      'Art Styles': 1,
      Deckable: 'Yes',
      Faction: factionDocs[0].name,
      Hero: 'No',
      Name: 'name',
      Occurrences: 1,
      Quote: 'quote',
    }
    it('throws error if validatePositiveInteger throws error', async () => {
      const error = `Invalid positive integer "hello", must contain numeric characters.`
      await testCreateUnits({
        factionDocs,
        units: [unit1],
        validatePositiveIntegerError: error,
        expectedError: `Unit "${unit1.Name}" has invalid "Occurrences": Error: ${error}`,
      })
    })
    it('calls to UnitStore add if single valid', async () => {
      await testCreateUnits({
        factionDocs,
        units: [unit1],
      })
    })
    it('calls to UnitStore add if single with multiple occurrences', async () => {
      await testCreateUnits({
        factionDocs,
        units: [
          {
            ...unit1,
            Occurrences: 2,
          },
        ],
      })
    })
    it('calls to UnitStore add if two in same faction', async () => {
      await testCreateUnits({
        factionDocs,
        units: [
          unit1,
          {
            'Art Styles': 1,
            Deckable: 'Yes',
            Faction: factionDocs[0].name,
            Hero: 'No',
            Name: 'name',
            Occurrences: 1,
            Quote: 'quote',
          },
        ],
      })
    })
    it('calls to UnitStore add if two in different factions', async () => {
      await testCreateUnits({
        factionDocs,
        units: [
          unit1,
          {
            'Art Styles': 1,
            Deckable: 'Yes',
            Faction: factionDocs[1].name,
            Hero: 'No',
            Name: 'name',
            Occurrences: 1,
            Quote: 'quote',
          },
        ],
      })
    })
    it('logs to trace if enabled', async () => {
      await testCreateUnits({
        factionDocs,
        units: [unit1],
        traceEnabled: true,
      })
    })
  })
  describe('normalizeDlc', () => {
    it('throws error if no Name', () => {
      const dlc: DlcJson = {
        Name: '',
      }
      expect(() => new Upgrade2().normalizeDlc(dlc)).toThrow(`Invalid dlc "${JSON.stringify(dlc)}": Must have "Name".`)
    })
    it('returns AddDlcInput if valid', () => {
      const upgrade2 = new Upgrade2()
      const name = 'name'
      const dlc: DlcJson = {
        Name: name,
      }
      const image = 'imags/dlc/name.png'
      const key = DlcKey.BloodAndWine
      const normalizeImageSpy = jest.spyOn(upgrade2, 'normalizeImage').mockReturnValue(image)
      const normalizeDlcKeySpy = jest.spyOn(upgrade2, 'normalizeDlcKey').mockReturnValue(key)

      expect(upgrade2.normalizeDlc(dlc)).toEqual({
        name,
        image,
        key,
      })

      expect(normalizeImageSpy.mock.calls).toEqual([[dlc, ImageType.Dlc]])
      expect(normalizeDlcKeySpy.mock.calls).toEqual([[dlc]])
    })
  })
  describe('normalizeDlcKey', () => {
    it('throws error if Name not valid', () => {
      const dlc = 'invalid'
      expect(() =>
        new Upgrade2().normalizeDlcKey({
          Name: dlc,
        })
      ).toThrow(`Invalid Dlc "${dlc}"`)
    })
    it('returns BLOOD_AND_WINE for Blood and Wine', () => {
      expect(
        new Upgrade2().normalizeDlcKey({
          Name: 'Blood and Wine',
        })
      ).toEqual(DlcKey.BloodAndWine)
    })
    it('returns GWENT_THE_WITCHER_CARD_GAME for Gwent: The Witcher Card Game', () => {
      expect(
        new Upgrade2().normalizeDlcKey({
          Name: 'Gwent: The Witcher Card Game',
        })
      ).toEqual(DlcKey.GwentTheWitcherCardGame)
    })
    it('returns HEARTS_OF_STONE for Hearts of Stone', () => {
      expect(
        new Upgrade2().normalizeDlcKey({
          Name: 'Hearts of Stone',
        })
      ).toEqual(DlcKey.HeartsOfStone)
    })
  })
  describe('normalizeEffect', () => {
    it('throws error if no Name', () => {
      const effect: EffectJson = {
        Name: '',
        Ability: 'ability',
      }
      expect(() => new Upgrade2().normalizeEffect(effect)).toThrow(
        `Invalid effect "${JSON.stringify(effect)}": Must have "Name".`
      )
    })
    it('throws error if no Ability', () => {
      const effect: EffectJson = {
        Name: 'name',
        Ability: '',
      }
      expect(() => new Upgrade2().normalizeEffect(effect)).toThrow(
        `Invalid effect "${effect.Name}": Must have "Ability".`
      )
    })
    it('returns AddEffectInput if valid', () => {
      const upgrade2 = new Upgrade2()
      const name = 'name'
      const ability = 'ability'
      const effect: EffectJson = {
        Name: name,
        Ability: ability,
      }
      const image = 'imags/effect/name.png'
      const key = EffectKey.Agile
      const normalizeImageSpy = jest.spyOn(upgrade2, 'normalizeImage').mockReturnValue(image)
      const normalizeEffectKeySpy = jest.spyOn(upgrade2, 'normalizeEffectKey').mockReturnValue(key)

      expect(upgrade2.normalizeEffect(effect)).toEqual({
        name,
        image,
        key,
        ability,
      })

      expect(normalizeImageSpy.mock.calls).toEqual([[effect, ImageType.Effect]])
      expect(normalizeEffectKeySpy.mock.calls).toEqual([[effect]])
    })
  })
  describe('normalizeFaction', () => {
    it('throws error if no Name', () => {
      const faction: FactionJson = {
        Name: '',
      }
      expect(() =>
        new Upgrade2().normalizeFaction({
          dlcMap: {},
          faction,
        })
      ).toThrow(`Invalid faction "${JSON.stringify(faction)}": Must have "Name".`)
    })
    it('returns AddFactionInput if valid', () => {
      const upgrade2 = new Upgrade2()
      const name = 'name'
      const ability = 'ability'
      const dlcMap = {}
      const faction: FactionJson = {
        Name: name,
        Ability: ability,
      }
      const image = 'imags/faction/name.png'
      const key = FactionKey.Monsters
      const normalizeUnitDlcSpy = jest.spyOn(upgrade2, 'normalizeUnitDlc').mockReturnValue(null)
      const normalizeImageSpy = jest.spyOn(upgrade2, 'normalizeImage').mockReturnValue(image)
      const normalizeFactionKeySpy = jest.spyOn(upgrade2, 'normalizeFactionKey').mockReturnValue(key)

      expect(
        upgrade2.normalizeFaction({
          dlcMap: {},
          faction,
        })
      ).toEqual({
        name,
        ability,
        image,
        key,
        dlc: null,
      })

      expect(normalizeUnitDlcSpy.mock.calls).toEqual([[faction, dlcMap]])
      expect(normalizeImageSpy.mock.calls).toEqual([[faction, ImageType.Faction]])
      expect(normalizeFactionKeySpy.mock.calls).toEqual([[faction]])
    })
    it('returns AddFactionInput with null ability if none specified', () => {
      const upgrade2 = new Upgrade2()
      const name = 'name'
      const dlcMap = {}
      const faction: FactionJson = {
        Name: name,
      }
      const image = 'imags/faction/name.png'
      const key = FactionKey.Monsters
      const normalizeUnitDlcSpy = jest.spyOn(upgrade2, 'normalizeUnitDlc').mockReturnValue(null)
      const normalizeImageSpy = jest.spyOn(upgrade2, 'normalizeImage').mockReturnValue(image)
      const normalizeFactionKeySpy = jest.spyOn(upgrade2, 'normalizeFactionKey').mockReturnValue(key)

      expect(
        upgrade2.normalizeFaction({
          dlcMap: {},
          faction,
        })
      ).toEqual({
        name,
        ability: null,
        image,
        key,
        dlc: null,
      })

      expect(normalizeUnitDlcSpy.mock.calls).toEqual([[faction, dlcMap]])
      expect(normalizeImageSpy.mock.calls).toEqual([[faction, ImageType.Faction]])
      expect(normalizeFactionKeySpy.mock.calls).toEqual([[faction]])
    })
  })
  describe('normalizeFactionKey', () => {
    it('throws error if Name not valid', () => {
      const faction = 'invalid'
      expect(() =>
        new Upgrade2().normalizeFactionKey({
          Name: faction,
        })
      ).toThrow(`Invalid Faction "${faction}"`)
    })
    it('returns MONSTERS for Monsters', () => {
      expect(
        new Upgrade2().normalizeFactionKey({
          Name: 'Monsters',
        })
      ).toEqual(FactionKey.Monsters)
    })
    it('returns NEUTRAL for Neutral', () => {
      expect(
        new Upgrade2().normalizeFactionKey({
          Name: 'Neutral',
        })
      ).toEqual(FactionKey.Neutral)
    })
    it('returns NILFGAARDIAN_EMPIRE for Nilfgaardian Empire', () => {
      expect(
        new Upgrade2().normalizeFactionKey({
          Name: 'Nilfgaardian Empire',
        })
      ).toEqual(FactionKey.NilfgaardianEmpire)
    })
    it('returns NORTHERN_REALMS for Northern Realms', () => {
      expect(
        new Upgrade2().normalizeFactionKey({
          Name: 'Northern Realms',
        })
      ).toEqual(FactionKey.NorthernRealms)
    })
    it("returns SCOIA_TAEL for Scoia'tael", () => {
      expect(
        new Upgrade2().normalizeFactionKey({
          Name: "Scoia'tael",
        })
      ).toEqual(FactionKey.ScoiaTael)
    })
    it('returns SKELLIGE for Skellige', () => {
      expect(
        new Upgrade2().normalizeFactionKey({
          Name: 'Skellige',
        })
      ).toEqual(FactionKey.Skellige)
    })
  })
  describe('normalizeLeader', () => {
    it('calls to other normalize functions', () => {
      const leader: LeaderJson = {
        Ability: 'ability',
        Faction: 'faction-name',
        Name: 'name',
        Quote: 'quote',
      }
      const faction = new ObjectId()
      const upgrade2 = new Upgrade2()
      const image = 'image'
      const dlcMap = {}
      const factionMap = {
        [leader.Faction]: new ObjectId(),
      }
      const normalizeUnitDlcSpy = jest.spyOn(upgrade2, 'normalizeUnitDlc').mockReturnValue(null)
      const normalizeFactionSpy = jest.spyOn(upgrade2, 'normalizeUnitFaction').mockReturnValue(faction)
      const normalizeImageSpy = jest.spyOn(upgrade2, 'normalizeImage').mockReturnValue(image)

      expect(
        upgrade2.normalizeLeader({
          dlcMap,
          factionMap,
          leader,
        })
      ).toEqual({
        ability: leader.Ability,
        dlc: null,
        faction,
        image,
        name: leader.Name,
        quote: leader.Quote,
      })

      expect(normalizeUnitDlcSpy.mock.calls).toEqual([[leader, dlcMap]])
      expect(normalizeFactionSpy.mock.calls).toEqual([[leader, factionMap]])
      expect(normalizeImageSpy.mock.calls).toEqual([[leader, ImageType.Leader]])
    })
  })
  describe('normalizeUnit', () => {
    it('throws error if unit does not have name', () => {
      const unit = {
        'Art Styles': 1,
        Deckable: 'Yes',
        Hero: 'No',
        Faction: 'faction-name',
        Occurrences: 1,
        Quote: 'quote',
      }
      const faction = new ObjectId()
      const dlcMap = {
        'dlc-name': new ObjectId(),
      }
      const effectMap = {
        'effect-name': new ObjectId(),
      }
      const factionMap = {
        [unit.Faction]: faction,
      }
      const upgrade2 = new Upgrade2()

      expect(() =>
        upgrade2.normalizeUnit({
          unit: unit as any,
          dlcMap,
          effectMap,
          factionMap,
        })
      ).toThrow(`Invalid unit "${JSON.stringify(unit)}": Must have "Name".`)
    })
    it('throws error if unit does not have quote', () => {
      const unit = {
        'Art Styles': 1,
        Deckable: 'Yes',
        Hero: 'No',
        Faction: 'faction-name',
        Occurrences: 1,
        Name: 'name',
      }
      const faction = new ObjectId()
      const dlcMap = {
        'dlc-name': new ObjectId(),
      }
      const effectMap = {
        'effect-name': new ObjectId(),
      }
      const factionMap = {
        [unit.Faction]: faction,
      }
      const upgrade2 = new Upgrade2()

      expect(() =>
        upgrade2.normalizeUnit({
          unit: unit as any,
          dlcMap,
          effectMap,
          factionMap,
        })
      ).toThrow(`Invalid unit "${unit.Name}": Must have "Quote".`)
    })
    it('calls to other normalize functions if only required fields', () => {
      const unit: UnitJson = {
        'Art Styles': 1,
        Deckable: 'Yes',
        Hero: 'No',
        Faction: 'faction-name',
        Name: 'name',
        Occurrences: 1,
        Quote: 'quote',
      }
      const combats: Combat[] = []
      const deckable = true
      const dlc = null
      const effects: ObjectId[] = []
      const faction = new ObjectId()
      const hero = false
      const images = ['image']
      const scorchScope = null
      const special = false
      const strength = 1
      const dlcMap = {
        'dlc-name': new ObjectId(),
      }
      const effectMap = {
        'effect-name': new ObjectId(),
      }
      const factionMap = {
        [unit.Faction]: faction,
      }
      const upgrade2 = new Upgrade2()
      const normalizeCombatsSpy = jest.spyOn(upgrade2, 'normalizeCombats').mockReturnValue(combats)
      const normalizeDeckableSpy = jest.spyOn(upgrade2, 'normalizeDeckable').mockReturnValue(deckable)
      const normalizeUnitDlcSpy = jest.spyOn(upgrade2, 'normalizeUnitDlc').mockReturnValue(dlc)
      const normalizeUnitEffectsSpy = jest.spyOn(upgrade2, 'normalizeUnitEffects').mockReturnValue(effects)
      const normalizeFactionSpy = jest.spyOn(upgrade2, 'normalizeUnitFaction').mockReturnValue(faction)
      const normalizeHeroSpy = jest.spyOn(upgrade2, 'normalizeHero').mockReturnValue(hero)
      const normalizeImagesSpy = jest.spyOn(upgrade2, 'normalizeImages').mockReturnValue(images)
      const normalizeScorchScopeSpy = jest.spyOn(upgrade2, 'normalizeScorchScope').mockReturnValue(scorchScope)
      const normalizeSpecialSpy = jest.spyOn(upgrade2, 'normalizeSpecial').mockReturnValue(special)
      const normalizeStrengthSpy = jest.spyOn(upgrade2, 'normalizeStrength').mockReturnValue(strength)

      expect(
        upgrade2.normalizeUnit({
          dlcMap,
          effectMap,
          factionMap,
          unit,
        })
      ).toEqual({
        combats,
        deckable,
        dlc,
        effectPrefix: null,
        effects,
        faction,
        hero,
        images,
        name: unit.Name,
        quote: unit.Quote,
        scorchMin: null,
        scorchScope,
        special,
        strength,
      })

      expect(normalizeCombatsSpy.mock.calls).toEqual([[unit]])
      expect(normalizeDeckableSpy.mock.calls).toEqual([[unit]])
      expect(normalizeUnitDlcSpy.mock.calls).toEqual([[unit, dlcMap]])
      expect(normalizeUnitEffectsSpy.mock.calls).toEqual([[unit, effectMap]])
      expect(normalizeFactionSpy.mock.calls).toEqual([[unit, factionMap]])
      expect(normalizeHeroSpy.mock.calls).toEqual([[unit]])
      expect(normalizeImagesSpy.mock.calls).toEqual([[unit, ImageType.Unit]])
      expect(normalizeScorchScopeSpy.mock.calls).toEqual([[unit]])
      expect(normalizeSpecialSpy.mock.calls).toEqual([[unit]])
      expect(normalizeStrengthSpy.mock.calls).toEqual([[unit]])
    })
    it('calls to other normalize functions if all fields', () => {
      const dlcName = 'dlc-name'
      const effect1Name = 'effect-1-name'
      const effect2Name = 'effect-2-name'
      const unit: UnitJson = {
        'Art Styles': 1,
        DLC: dlcName,
        Faction: 'faction-name',
        Name: 'name',
        Occurrences: 1,
        Quote: 'quote',
        'Combat 1': 'Close',
        'Combat 2': 'Ranged',
        'Effect 1': effect1Name,
        'Effect 2': effect2Name,
        'Effect Prefix': 'Arachas',
        'Scorch Minimum Strength': 10,
        'Scorch Scope': 'Close',
        Deckable: 'Yes',
        Hero: 'Yes',
        Strength: 1,
      }
      const combats = [Combat.Close, Combat.Ranged]
      const deckable = true
      const dlc = new ObjectId()
      const effects = [new ObjectId(), new ObjectId()]
      const faction = new ObjectId()
      const hero = false
      const images = ['image']
      const scorchScope = null
      const special = false
      const strength = 1
      const dlcMap = {
        [dlcName]: dlc,
      }
      const effectMap = {
        [effect1Name]: effects[0],
        [effect2Name]: effects[1],
      }
      const factionMap = {
        [unit.Faction]: faction,
      }
      const upgrade2 = new Upgrade2()
      const normalizeCombatsSpy = jest.spyOn(upgrade2, 'normalizeCombats').mockReturnValue(combats)
      const normalizeDeckableSpy = jest.spyOn(upgrade2, 'normalizeDeckable').mockReturnValue(deckable)
      const normalizeUnitDlcSpy = jest.spyOn(upgrade2, 'normalizeUnitDlc').mockReturnValue(dlc)
      const normalizeUnitEffectsSpy = jest.spyOn(upgrade2, 'normalizeUnitEffects').mockReturnValue(effects)
      const normalizeFactionSpy = jest.spyOn(upgrade2, 'normalizeUnitFaction').mockReturnValue(faction)
      const normalizeHeroSpy = jest.spyOn(upgrade2, 'normalizeHero').mockReturnValue(hero)
      const normalizeImagesSpy = jest.spyOn(upgrade2, 'normalizeImages').mockReturnValue(images)
      const normalizeScorchScopeSpy = jest.spyOn(upgrade2, 'normalizeScorchScope').mockReturnValue(scorchScope)
      const normalizeSpecialSpy = jest.spyOn(upgrade2, 'normalizeSpecial').mockReturnValue(special)
      const normalizeStrengthSpy = jest.spyOn(upgrade2, 'normalizeStrength').mockReturnValue(strength)

      expect(
        upgrade2.normalizeUnit({
          dlcMap,
          effectMap,
          factionMap,
          unit,
        })
      ).toEqual({
        combats,
        deckable,
        dlc,
        effectPrefix: unit['Effect Prefix'],
        effects,
        faction,
        hero,
        images,
        name: unit.Name,
        quote: unit.Quote,
        scorchMin: unit['Scorch Minimum Strength'],
        scorchScope,
        special,
        strength,
      })

      expect(normalizeCombatsSpy.mock.calls).toEqual([[unit]])
      expect(normalizeDeckableSpy.mock.calls).toEqual([[unit]])
      expect(normalizeUnitDlcSpy.mock.calls).toEqual([[unit, dlcMap]])
      expect(normalizeUnitEffectsSpy.mock.calls).toEqual([[unit, effectMap]])
      expect(normalizeFactionSpy.mock.calls).toEqual([[unit, factionMap]])
      expect(normalizeHeroSpy.mock.calls).toEqual([[unit]])
      expect(normalizeImagesSpy.mock.calls).toEqual([[unit, ImageType.Unit]])
      expect(normalizeScorchScopeSpy.mock.calls).toEqual([[unit]])
      expect(normalizeSpecialSpy.mock.calls).toEqual([[unit]])
      expect(normalizeStrengthSpy.mock.calls).toEqual([[unit]])
    })
  })
  describe('normalizeUnitFaction', () => {
    it('throws error if faction not in map for unit', () => {
      expect(() => new Upgrade2().normalizeUnitFaction(unitRequired, {})).toThrow(
        `Invalid Faction "${unitRequired.Faction}" for Unit "${unitRequired.Name}"`
      )
    })
    it('throws error if faction not in map for leader', () => {
      const leader: LeaderJson = {
        Ability: 'ability',
        Faction: 'Northern Realms',
        Name: 'name',
        Quote: 'quote',
      }
      expect(() => new Upgrade2().normalizeUnitFaction(leader, {})).toThrow(
        `Invalid Faction "${leader.Faction}" for Leader "${leader.Name}"`
      )
    })
    it('returns id if faction in map', () => {
      const id = new ObjectId()
      const map = {
        [unitRequired.Faction]: id,
      }
      expect(new Upgrade2().normalizeUnitFaction(unitRequired, map)).toEqual(id)
    })
  })
  describe('normalizeUnitDlc', () => {
    it('returns null if item DLC is undefined', () => {
      expect(new Upgrade2().normalizeUnitDlc(unitRequired, {})).toEqual(null)
    })
    it('throws error if DLC not in map', () => {
      const dlc = 'invalid'
      const unit: UnitJson = {
        ...unitRequired,
        DLC: dlc,
      }
      const map = {}
      expect(() => new Upgrade2().normalizeUnitDlc(unit, map)).toThrow(
        `Invalid DLC "${dlc}" for item "${unitRequired.Name}"`
      )
    })
    it('returns id if dlc in map', () => {
      const id = new ObjectId()
      const dlc = 'valid'
      const unit: UnitJson = {
        ...unitRequired,
        DLC: dlc,
      }
      const map = {
        [dlc]: id,
      }
      expect(new Upgrade2().normalizeUnitDlc(unit, map)).toEqual(id)
    })
  })
  describe('normalizeCombats', () => {
    it('returns empty array if no combats', () => {
      const upgrade2 = new Upgrade2()
      const normalizeCombatSpy = jest.spyOn(upgrade2, 'normalizeCombat')

      expect(upgrade2.normalizeCombats(unitRequired)).toEqual([])

      expect(normalizeCombatSpy.mock.calls).toEqual([])
    })
    it('returns single array if single combats', () => {
      const upgrade2 = new Upgrade2()
      const combat = 'Close'
      const normalizeCombatSpy = jest.spyOn(upgrade2, 'normalizeCombat').mockReturnValue(Combat.Close)

      expect(
        upgrade2.normalizeCombats({
          ...unitRequired,
          'Combat 1': combat,
        })
      ).toEqual([Combat.Close])

      expect(normalizeCombatSpy.mock.calls).toEqual([[combat]])
    })
    it('returns double array if two combats', () => {
      const upgrade2 = new Upgrade2()
      const combat1 = 'Close'
      const combat2 = 'Ranged'
      const normalizeCombatSpy = jest
        .spyOn(upgrade2, 'normalizeCombat')
        .mockReturnValueOnce(Combat.Close)
        .mockReturnValueOnce(Combat.Ranged)

      expect(
        upgrade2.normalizeCombats({
          ...unitRequired,
          'Combat 1': combat1,
          'Combat 2': combat2,
        })
      ).toEqual([Combat.Close, Combat.Ranged])

      expect(normalizeCombatSpy.mock.calls).toEqual([[combat1], [combat2]])
    })
  })
  describe('normalizeCombat', () => {
    it('throws error if undefined', () => {
      const combat = undefined
      expect(() => new Upgrade2().normalizeCombat(combat)).toThrow(`Invalid Combat "${combat}"`)
    })
    it('throws error if invalid', () => {
      const combat = 'close'
      expect(() => new Upgrade2().normalizeCombat(combat)).toThrow(`Invalid Combat "${combat}"`)
    })
    it('returns CLOSE for Close', () => {
      expect(new Upgrade2().normalizeCombat('Close')).toEqual('CLOSE')
    })
    it('returns RANGED for Ranged', () => {
      expect(new Upgrade2().normalizeCombat('Ranged')).toEqual('RANGED')
    })
    it('returns SIEGE for Siege', () => {
      expect(new Upgrade2().normalizeCombat('Siege')).toEqual('SIEGE')
    })
  })
  describe('normalizeUnitEffects', () => {
    it('throws error if Effect 1 does not exist in map', () => {
      const effect = 'invalid'
      const unit: UnitJson = {
        ...unitRequired,
        'Effect 1': effect,
      }
      expect(() => new Upgrade2().normalizeUnitEffects(unit, {})).toThrow(
        `Invalid Effect "${effect}" for unit "${unit.Name}"`
      )
    })
    it('throws error if Effect 2 does not exist in map', () => {
      const effect1 = 'valid'
      const effect2 = 'invalid'
      const unit: UnitJson = {
        ...unitRequired,
        'Effect 1': effect1,
        'Effect 2': effect2,
      }
      const map = {
        [effect1]: new ObjectId(),
      }
      expect(() => new Upgrade2().normalizeUnitEffects(unit, map)).toThrow(
        `Invalid Effect "${effect2}" for unit "${unit.Name}"`
      )
    })
    it('returns empty array if no effects', () => {
      expect(new Upgrade2().normalizeUnitEffects(unitRequired, {})).toEqual([])
    })
    it('returns single id if single effect', () => {
      const effect = 'valid'
      const unit: UnitJson = {
        ...unitRequired,
        'Effect 1': effect,
      }
      const id = new ObjectId()
      const map = {
        [effect]: id,
      }
      expect(new Upgrade2().normalizeUnitEffects(unit, map)).toEqual([id])
    })
    it('returns two ids if double effect', () => {
      const effect1 = 'first'
      const effect2 = 'second'
      const unit: UnitJson = {
        ...unitRequired,
        'Effect 1': effect1,
        'Effect 2': effect2,
      }
      const id1 = new ObjectId()
      const id2 = new ObjectId()
      const map = {
        [effect1]: id1,
        [effect2]: id2,
      }
      expect(new Upgrade2().normalizeUnitEffects(unit, map)).toEqual([id1, id2])
    })
  })
  describe('normalizeEffectKey', () => {
    it('throws error if Name not valid', () => {
      const effect = {
        ...effectRequired,
        Name: 'invalid',
      }
      expect(() => new Upgrade2().normalizeEffectKey(effect)).toThrow(`Invalid Effect "${JSON.stringify(effect)}"`)
    })
    it('returns AGILE if effect Name is Agile', () => {
      expect(
        new Upgrade2().normalizeEffectKey({
          ...effectRequired,
          Name: 'Agile',
        })
      ).toEqual('AGILE')
    })
    it('returns AVENGER if effect Name is Avenger', () => {
      expect(
        new Upgrade2().normalizeEffectKey({
          ...effectRequired,
          Name: 'Avenger',
        })
      ).toEqual('AVENGER')
    })
    it('returns BERSERKER if effect Name is Berserker', () => {
      expect(
        new Upgrade2().normalizeEffectKey({
          ...effectRequired,
          Name: 'Berserker',
        })
      ).toEqual('BERSERKER')
    })
    it('returns BOND if effect Name is Bond', () => {
      expect(
        new Upgrade2().normalizeEffectKey({
          ...effectRequired,
          Name: 'Bond',
        })
      ).toEqual('BOND')
    })
    it('returns DECOY if effect Name is Decoy', () => {
      expect(
        new Upgrade2().normalizeEffectKey({
          ...effectRequired,
          Name: 'Decoy',
        })
      ).toEqual('DECOY')
    })
    it('returns HORN if effect Name is Horn', () => {
      expect(
        new Upgrade2().normalizeEffectKey({
          ...effectRequired,
          Name: 'Horn',
        })
      ).toEqual('HORN')
    })
    it('returns MARDROEME if effect Name is Mardroeme', () => {
      expect(
        new Upgrade2().normalizeEffectKey({
          ...effectRequired,
          Name: 'Mardroeme',
        })
      ).toEqual('MARDROEME')
    })
    it('returns MEDIC if effect Name is Medic', () => {
      expect(
        new Upgrade2().normalizeEffectKey({
          ...effectRequired,
          Name: 'Medic',
        })
      ).toEqual('MEDIC')
    })
    it('returns MORALE if effect Name is Morale', () => {
      expect(
        new Upgrade2().normalizeEffectKey({
          ...effectRequired,
          Name: 'Morale',
        })
      ).toEqual('MORALE')
    })
    it('returns MUSTER if effect Name is Muster', () => {
      expect(
        new Upgrade2().normalizeEffectKey({
          ...effectRequired,
          Name: 'Muster',
        })
      ).toEqual('MUSTER')
    })
    it('returns SCORCH if effect Name is Scorch', () => {
      expect(
        new Upgrade2().normalizeEffectKey({
          ...effectRequired,
          Name: 'Scorch',
        })
      ).toEqual('SCORCH')
    })
    it('returns SPY if effect Name is Spy', () => {
      expect(
        new Upgrade2().normalizeEffectKey({
          ...effectRequired,
          Name: 'Spy',
        })
      ).toEqual('SPY')
    })
    it('returns WEATHER if effect Name is Weather', () => {
      expect(
        new Upgrade2().normalizeEffectKey({
          ...effectRequired,
          Name: 'Weather',
        })
      ).toEqual('WEATHER')
    })
  })
  describe('normalizeScorchScope', () => {
    it('returns null if no Scorch Scope', () => {
      expect(new Upgrade2().normalizeScorchScope(unitRequired)).toEqual(null)
    })
    it('calls to normalizeCombat if present', () => {
      const upgrade2 = new Upgrade2()
      const scorchScope = 'Close'
      const expected = Combat.Close
      const normalizeCombatSpy = jest.spyOn(upgrade2, 'normalizeCombat').mockReturnValue(expected)

      expect(
        upgrade2.normalizeScorchScope({
          ...unitRequired,
          ['Scorch Scope']: scorchScope,
        })
      ).toEqual(expected)

      expect(normalizeCombatSpy.mock.calls).toEqual([[scorchScope]])
    })
  })
  describe('normalizeImage', () => {
    it('calls to normalizeImages and returns first item', () => {
      const type = ImageType.Combat
      const item = { Name: 'name' }
      const expected = `images/${type}/name.png`
      const upgrade2 = new Upgrade2()
      const normalizeImagesSpy = jest.spyOn(upgrade2, 'normalizeImages').mockReturnValue([expected])

      expect(upgrade2.normalizeImage(item, type)).toEqual(expected)

      expect(normalizeImagesSpy.mock.calls).toEqual([[item, type]])
    })
  })
  describe('normalizeImages', () => {
    it('throws error if no Art Styles', () => {
      const unit = {}
      const upgrade2 = new Upgrade2()
      const normalizeImagePathSpy = jest.spyOn(upgrade2, 'normalizeImagePath')

      expect(() => upgrade2.normalizeImages(unit as any, ImageType.Unit)).toThrow(
        `No "Art Styles" found for unit "${JSON.stringify(unit)}"`
      )

      expect(normalizeImagePathSpy.mock.calls).toEqual([])
    })
    it('returns single image array for non Units type', () => {
      const name = 'name'
      const type = ImageType.Combat
      const upgrade2 = new Upgrade2()
      const imagePaths = [`images/${type}/${name}.png`]
      const normalizeImagePathSpy = jest.spyOn(upgrade2, 'normalizeImagePath').mockReturnValue(imagePaths[0])

      expect(upgrade2.normalizeImages({ Name: name }, type)).toEqual(imagePaths)

      expect(normalizeImagePathSpy.mock.calls).toEqual([
        [
          {
            name,
            type,
            suffix: '',
          },
        ],
      ])
    })
    it('returns single image array for Units type', () => {
      const name = 'name'
      const type = ImageType.Unit
      const imagePaths = [`images/${type}/${name}.png`]
      const upgrade2 = new Upgrade2()
      const normalizeImagePathSpy = jest.spyOn(upgrade2, 'normalizeImagePath').mockReturnValue(imagePaths[0])

      expect(upgrade2.normalizeImages({ Name: name, 'Art Styles': 1 }, type)).toEqual(imagePaths)

      expect(normalizeImagePathSpy.mock.calls).toEqual([
        [
          {
            name,
            type,
            suffix: '',
          },
        ],
      ])
    })
    it('returns multiple image array for Units type', () => {
      const name = 'name'
      const type = ImageType.Unit
      const imagePaths = [`images/${type}/${name}--1.png`, `images/${type}/${name}--2.png`]
      const upgrade2 = new Upgrade2()
      const normalizeImagePathSpy = jest
        .spyOn(upgrade2, 'normalizeImagePath')
        .mockReturnValueOnce(imagePaths[0])
        .mockReturnValueOnce(imagePaths[1])

      expect(upgrade2.normalizeImages({ Name: name, 'Art Styles': 2 }, type)).toEqual(imagePaths)

      expect(normalizeImagePathSpy.mock.calls).toEqual([
        [
          {
            name,
            type,
            suffix: '--1',
          },
        ],
        [
          {
            name,
            type,
            suffix: '--2',
          },
        ],
      ])
    })
  })
  describe('normalizeImagePath', () => {
    it('returns path if lowercase without suffix', () => {
      expect(
        new Upgrade2().normalizeImagePath({
          name: 'name',
          type: ImageType.Combat,
        })
      ).toEqual('images/combats/name.png')
    })
    it('returns path if mixed case without suffix', () => {
      expect(
        new Upgrade2().normalizeImagePath({
          name: 'Name',
          type: ImageType.Combat,
        })
      ).toEqual('images/combats/name.png')
    })
    it('returns path if special characters without suffix', () => {
      expect(
        new Upgrade2().normalizeImagePath({
          name: 'name: foo',
          type: ImageType.Combat,
        })
      ).toEqual('images/combats/name_foo.png')
    })
    it('returns path if lowercase with suffix', () => {
      expect(
        new Upgrade2().normalizeImagePath({
          name: 'name',
          type: ImageType.Combat,
          suffix: '--1',
        })
      ).toEqual('images/combats/name--1.png')
    })
    it('returns path if mixed case with specials and suffix', () => {
      expect(
        new Upgrade2().normalizeImagePath({
          name: 'Name: foo',
          type: ImageType.Combat,
          suffix: '--1',
        })
      ).toEqual('images/combats/name_foo--1.png')
    })
  })
  describe('normalizeSpecial', () => {
    it('returns false if name and effect do not match conditions', () => {
      expect(
        new Upgrade2().normalizeSpecial({
          ...unitRequired,
          Name: 'Arachas',
          'Effect 1': 'Decoy',
        })
      ).toEqual(false)
    })
    it('returns true if Name is Commanders Horn', () => {
      expect(
        new Upgrade2().normalizeSpecial({
          ...unitRequired,
          Name: "Commander's Horn",
        })
      ).toEqual(true)
    })
    it('returns true if Name is Decoy', () => {
      expect(
        new Upgrade2().normalizeSpecial({
          ...unitRequired,
          Name: 'Decoy',
        })
      ).toEqual(true)
    })
    it('returns true if Name is Mardroeme', () => {
      expect(
        new Upgrade2().normalizeSpecial({
          ...unitRequired,
          Name: 'Mardroeme',
        })
      ).toEqual(true)
    })
    it('returns true if Name is Scorch', () => {
      expect(
        new Upgrade2().normalizeSpecial({
          ...unitRequired,
          Name: 'Scorch',
        })
      ).toEqual(true)
    })
    it('returns true if Effect 1 is Weather', () => {
      expect(
        new Upgrade2().normalizeSpecial({
          ...unitRequired,
          'Effect 1': 'Weather',
        })
      ).toEqual(true)
    })
    it('returns true if Effect 2 is Weather', () => {
      expect(
        new Upgrade2().normalizeSpecial({
          ...unitRequired,
          'Effect 2': 'Weather',
        })
      ).toEqual(true)
    })
  })
  describe('normalizeStrength', () => {
    it('returns null if Strength is undefined', () => {
      expect(new Upgrade2().normalizeStrength(unitRequired)).toEqual(null)
    })
    it('returns number if Strength is 0', () => {
      expect(
        new Upgrade2().normalizeStrength({
          ...unitRequired,
          Strength: 0,
        })
      ).toEqual(0)
    })
    it('returns number if Strength is 1', () => {
      expect(
        new Upgrade2().normalizeStrength({
          ...unitRequired,
          Strength: 1,
        })
      ).toEqual(1)
    })
  })
  describe('normalizeDeckable', () => {
    it('returns false if Deckable is No', () => {
      expect(
        new Upgrade2().normalizeDeckable({
          ...unitRequired,
          Deckable: 'No',
        })
      ).toEqual(false)
    })
    it('returns true if Deckable not defined', () => {
      expect(new Upgrade2().normalizeDeckable(unitRequired)).toEqual(true)
    })
    it('returns true if Deckable is Yes', () => {
      expect(
        new Upgrade2().normalizeDeckable({
          ...unitRequired,
          Deckable: 'Yes',
        })
      ).toEqual(true)
    })
  })
  describe('normalizeHero', () => {
    it('returns false if Hero not defined', () => {
      expect(new Upgrade2().normalizeHero(unitRequired)).toEqual(false)
    })
    it('returns false if Hero is No', () => {
      expect(
        new Upgrade2().normalizeHero({
          ...unitRequired,
          Hero: 'No',
        })
      ).toEqual(false)
    })
    it('returns true if Hero is Yes', () => {
      expect(
        new Upgrade2().normalizeHero({
          ...unitRequired,
          Hero: 'Yes',
        })
      ).toEqual(true)
    })
  })
})

async function testCreateUnits({
  factionDocs,
  units,
  validatePositiveIntegerError,
  traceEnabled,
  expectedError,
}: {
  factionDocs: FactionDbObject[]
  units: UnitJson[]
  validatePositiveIntegerError?: string
  traceEnabled?: boolean
  expectedError?: string
}) {
  const upgrade2 = new Upgrade2()
  const dlcMap: KeyIdMap = {
    'dlc-map': new ObjectId(),
  }
  const effectMap: KeyIdMap = {
    'effect-map': new ObjectId(),
  }
  const factionMap: KeyIdMap = {}
  const expected: FactionUnits = {}
  for (const factionDoc of factionDocs) {
    factionMap[factionDoc.name] = factionDoc._id
    expected[factionDoc._id.toString()] = []
  }
  const validatePositiveIntegerCalls: any[][] = []
  const validatePositiveIntegerSpy = jest.spyOn(validators, 'validatePositiveInteger')
  if (validatePositiveIntegerError) {
    validatePositiveIntegerSpy.mockImplementation(() => {
      throw Error(validatePositiveIntegerError)
    })
  }
  const normalizeUnitSpy = jest.spyOn(upgrade2, 'normalizeUnit')
  const normalizeUnitCalls: any[][] = []
  const addSpy = jest.spyOn(UnitStore, 'add')
  const addCalls: any[][] = []
  const traceSpy = jest.fn().mockImplementation()
  const debugSpy = jest.fn().mockImplementation()
  Upgrade2.logger = {
    trace: traceSpy,
    debug: debugSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any
  const debugCalls: string[][] = [['Adding units']]
  for (const unit of units) {
    validatePositiveIntegerCalls.push([
      unit.Occurrences,
      {
        allowZero: false,
      },
    ])
    if (!validatePositiveIntegerError) {
      validatePositiveIntegerSpy.mockReturnValueOnce(Number(unit.Occurrences))
      for (let i = 0; i < unit.Occurrences; i++) {
        const normalizedUnit: AddUnitInput = {
          combats: [],
          dlc: null,
          effectPrefix: '',
          effects: [],
          faction: factionMap[unit.Faction],
          images: [],
          name: unit.Name,
          quote: unit.Quote,
          scorchMin: null,
          scorchScope: null,
          strength: 1,
        }
        normalizeUnitCalls.push([
          {
            unit,
            dlcMap,
            effectMap,
            factionMap,
          },
        ])
        normalizeUnitSpy.mockReturnValueOnce(normalizedUnit)
        const dbUnit: UnitDbObject = {
          _id: new ObjectId(),
          created: new Date(),
          combats: [],
          dlc: undefined,
          deckable: true,
          effectPrefix: '',
          effects: [],
          faction: factionMap[unit.Faction],
          images: [],
          name: unit.Name,
          quote: unit.Quote,
          scorchMin: null,
          scorchScope: null,
          strength: 1,
        }
        addCalls.push([normalizedUnit])
        addSpy.mockResolvedValueOnce(dbUnit)
        expected[factionMap[unit.Faction].toString()].push(dbUnit)
        debugCalls.push([`Adding unit "${unit.Name}" ${i + 1}/${unit.Occurrences}`])
      }
    }
  }

  const promise = upgrade2.createUnits({
    dlcMap,
    effectMap,
    factionDocs,
    factionMap,
    units,
  })
  if (expectedError) {
    await expect(promise).rejects.toThrow(expectedError)
  } else {
    await expect(promise).resolves.toEqual(expected)
  }

  expect(validatePositiveIntegerSpy.mock.calls).toEqual(validatePositiveIntegerCalls)
  expect(normalizeUnitSpy.mock.calls).toEqual(normalizeUnitCalls)
  expect(addSpy.mock.calls).toEqual(addCalls)
  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(traceSpy.mock.calls).toEqual(traceEnabled ? [[`units: "${JSON.stringify(units)}"`]] : [])
}

async function testCreateLeaders({
  leaders,
  factionMap,
  traceEnabled,
}: {
  leaders: LeaderJson[]
  factionMap: KeyIdMap
  traceEnabled?: boolean
}) {
  const upgrade2 = new Upgrade2()
  const dlcMap: KeyIdMap = {
    dlc: new ObjectId(),
  }
  const normalizeLeaderSpy = jest.spyOn(upgrade2, 'normalizeLeader')
  const normalizeLeaderCalls: any[][] = []
  const addSpy = jest.spyOn(LeaderStore, 'add')
  const addCalls: any[][] = []
  const traceSpy = jest.fn().mockImplementation()
  const debugSpy = jest.fn().mockImplementation()
  Upgrade2.logger = {
    trace: traceSpy,
    debug: debugSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any
  const debugCalls: string[][] = [['Adding leaders']]

  for (const leader of leaders) {
    debugCalls.push([`Adding leader "${leader.Name}"`])
    const normalizedLeader: AddLeaderInput = {
      ability: leader.Ability,
      dlc: null,
      faction: factionMap[leader.Faction],
      image: 'image',
      name: leader.Name,
      quote: leader.Quote,
    }
    normalizeLeaderCalls.push([
      {
        leader,
        dlcMap,
        factionMap,
      },
    ])
    normalizeLeaderSpy.mockReturnValueOnce(normalizedLeader)
    const dbLeader: LeaderDbObject = {
      _id: new ObjectId(),
      ability: leader.Ability,
      created: new Date(),
      faction: factionMap[leader.Faction],
      image: 'image',
      name: leader.Name,
      quote: leader.Quote,
      dlc: undefined,
    }
    addCalls.push([normalizedLeader])
    addSpy.mockResolvedValueOnce(dbLeader)
  }

  await expect(
    upgrade2.createLeaders({
      leaders,
      dlcMap,
      factionMap,
    })
  ).resolves.toEqual(undefined)

  expect(normalizeLeaderSpy.mock.calls).toEqual(normalizeLeaderCalls)
  expect(addSpy.mock.calls).toEqual(addCalls)
  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(traceSpy.mock.calls).toEqual(traceEnabled ? [[`leaders: "${JSON.stringify(leaders)}"`]] : [])
}

async function testCreateFactions({ factions, traceEnabled }: { factions: FactionJson[]; traceEnabled?: boolean }) {
  const upgrade2 = new Upgrade2()
  const image = 'image'
  const key = FactionKey.Monsters
  const dlcMap: KeyIdMap = {
    dlc: new ObjectId(),
  }
  const normalizeFactionSpy = jest.spyOn(upgrade2, 'normalizeFaction')
  const normalizeFactionCalls: any[][] = []
  const addSpy = jest.spyOn(FactionStore, 'add')
  const addCalls: any[][] = []
  const factionDocs: FactionDbObject[] = []
  const factionMap: KeyIdMap = {}
  const traceSpy = jest.fn().mockImplementation()
  const debugSpy = jest.fn().mockImplementation()
  Upgrade2.logger = {
    trace: traceSpy,
    debug: debugSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any
  const debugCalls: string[][] = [['Adding factions']]

  for (const faction of factions) {
    normalizeFactionCalls.push([
      {
        dlcMap,
        faction,
      },
    ])
    const normalizedFaction: AddFactionInput = {
      ability: faction.Ability || null,
      dlc: null,
      image,
      key,
      name: faction.Name,
    }
    normalizeFactionSpy.mockReturnValueOnce(normalizedFaction)
    addCalls.push([normalizedFaction])
    const dbFaction: FactionDbObject = {
      _id: new ObjectId(),
      created: new Date(),
      image,
      key,
      name: faction.Name,
      stats: {} as any,
      ability: faction.Ability,
      dlc: undefined,
    }
    addSpy.mockResolvedValueOnce(dbFaction)
    factionDocs.push(dbFaction)
    factionMap[dbFaction.name] = dbFaction._id
  }

  await expect(
    upgrade2.createFactions({
      dlcMap,
      factions,
    })
  ).resolves.toEqual({
    factionDocs,
    factionMap,
  })

  expect(normalizeFactionSpy.mock.calls).toEqual(normalizeFactionCalls)
  expect(addSpy.mock.calls).toEqual(addCalls)
  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [`factions: "${JSON.stringify(factions)}"`],
          [`factionDocs: "${JSON.stringify(factionDocs)}"`],
          [`factionMap: "${JSON.stringify(factionMap)}"`],
        ]
      : []
  )
}

async function testCreateEffects({ effects, traceEnabled }: { effects: EffectJson[]; traceEnabled?: boolean }) {
  const upgrade2 = new Upgrade2()
  const image = 'image'
  const key = EffectKey.Agile
  const normalizeEffectSpy = jest.spyOn(upgrade2, 'normalizeEffect')
  const normalizeEffectCalls: any[][] = []
  const addSpy = jest.spyOn(EffectStore, 'add')
  const addCalls: any[][] = []
  const effectDocs: EffectDbObject[] = []
  const effectMap: KeyIdMap = {}
  const traceSpy = jest.fn().mockImplementation()
  const debugSpy = jest.fn().mockImplementation()
  Upgrade2.logger = {
    trace: traceSpy,
    debug: debugSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any
  const debugCalls: string[][] = [['Adding effects']]

  for (const effect of effects) {
    normalizeEffectCalls.push([effect])
    const normalizedEffect: AddEffectInput = {
      ability: effect.Ability,
      image,
      key,
      name: effect.Name,
    }
    normalizeEffectSpy.mockReturnValueOnce(normalizedEffect)
    addCalls.push([normalizedEffect])
    const dbEffect: EffectDbObject = {
      _id: new ObjectId(),
      created: new Date(),
      image,
      key,
      name: effect.Name,
      ability: effect.Ability,
    }
    addSpy.mockResolvedValueOnce(dbEffect)
    effectDocs.push(dbEffect)
    effectMap[dbEffect.name] = dbEffect._id
  }

  await expect(
    upgrade2.createEffects({
      effects,
    })
  ).resolves.toEqual({
    effectDocs,
    effectMap,
  })

  expect(normalizeEffectSpy.mock.calls).toEqual(normalizeEffectCalls)
  expect(addSpy.mock.calls).toEqual(addCalls)
  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [`effects: "${JSON.stringify(effects)}"`],
          [`effectDocs: "${JSON.stringify(effectDocs)}"`],
          [`effectMap: "${JSON.stringify(effectMap)}"`],
        ]
      : []
  )
}

async function testCreateDlcs({ dlcs, traceEnabled }: { dlcs: DlcJson[]; traceEnabled?: boolean }) {
  const upgrade2 = new Upgrade2()
  const image = 'image'
  const key = DlcKey.BloodAndWine
  const normalizeDlcSpy = jest.spyOn(upgrade2, 'normalizeDlc')
  const normalizeDlcCalls: any[][] = []
  const addSpy = jest.spyOn(DlcStore, 'add')
  const addCalls: any[][] = []
  const dlcDocs: DlcDbObject[] = []
  const dlcMap: KeyIdMap = {}
  const traceSpy = jest.fn().mockImplementation()
  const debugSpy = jest.fn().mockImplementation()
  Upgrade2.logger = {
    trace: traceSpy,
    debug: debugSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any
  const debugCalls: string[][] = [['Adding dlcs']]

  for (const dlc of dlcs) {
    normalizeDlcCalls.push([dlc])
    const normalizedDlc: AddDlcInput = {
      image,
      key,
      name: dlc.Name,
    }
    normalizeDlcSpy.mockReturnValueOnce(normalizedDlc)
    addCalls.push([normalizedDlc])
    const dbDlc: DlcDbObject = {
      _id: new ObjectId(),
      created: new Date(),
      image,
      key,
      name: dlc.Name,
    }
    addSpy.mockResolvedValueOnce(dbDlc)
    dlcDocs.push(dbDlc)
    dlcMap[dbDlc.name] = dbDlc._id
  }

  await expect(
    upgrade2.createDlcs({
      dlcs,
    })
  ).resolves.toEqual(dlcMap)

  expect(normalizeDlcSpy.mock.calls).toEqual(normalizeDlcCalls)
  expect(addSpy.mock.calls).toEqual(addCalls)
  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [`dlcs: "${JSON.stringify(dlcs)}"`],
          [`dlcDocs: "${JSON.stringify(dlcDocs)}"`],
          [`dlcMap: "${JSON.stringify(dlcMap)}"`],
        ]
      : []
  )
}
