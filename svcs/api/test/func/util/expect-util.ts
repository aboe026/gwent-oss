import { Db, ObjectId } from 'mongodb'

import { DeckCard, FactionKey, Unit, UnitStats, User } from '@gwent/graphql-schema/resolver-typings'
import dlcs from '../../../src/database/upgrades/resources/dlcs.json'
import effects from '../../../src/database/upgrades/resources/effects.json'
import EffectStore from '../../../src/database/stores/effect-store'
import factions from '../../../src/database/upgrades/resources/factions.json'
import getUnitStats from '@gwent/utils/build/src/get-unit-stats'
import leaders from '../../../src/database/upgrades/resources/leaders.json'
import Upgrade2, { ImageType } from '../../../src/database/upgrades/upgrade-2'
import { sortObjectArray } from '@gwent/utils'
import units from '../../../src/database/upgrades/resources/units.json'

export async function verifyCollectionNames({
  db,
  names,
  shouldExist = true,
}: {
  db: Db
  names: string[]
  shouldExist?: boolean
}) {
  const collections = await db.listCollections().toArray()
  const collectionNames = collections.map((collection) => collection.name)
  if (names.length === collectionNames.length) {
    if (shouldExist) {
      expect(collectionNames).toEqual(names)
    } else {
      expect(collectionNames).not.toEqual(names)
    }
  } else {
    if (shouldExist) {
      expect(collectionNames).toEqual(expect.arrayContaining(names))
    } else {
      expect(collectionNames).not.toContain(names)
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function verifyMongoIds(item: any, idKey = 'id') {
  if (item) {
    if (Array.isArray(item)) {
      for (const element of item) {
        verifyMongoIds(element)
      }
    } else if (typeof item === 'object') {
      for (const key of Object.keys(item)) {
        if (key === idKey) {
          expect(ObjectId.isValid(item[key])).toEqual(true)
        } else {
          verifyMongoIds(item[key])
        }
      }
    }
  }
}

export function expectizeDlcs() {
  return dlcs.map((dlc) => {
    return {
      created: expect.any(Date),
      image: new Upgrade2().normalizeImage(dlc, ImageType.Dlc),
      key: new Upgrade2().normalizeDlcKey(dlc),
      name: dlc.Name,
      id: expect.any(String),
    }
  })
}

export function expectizeFactions({ neutrals = false }: { neutrals?: boolean }) {
  return factions.map((faction) => {
    const key = new Upgrade2().normalizeFactionKey(faction)
    return {
      ability: faction.Ability || null,
      created: expect.any(Date),
      dlc: getDlc(faction),
      id: expect.any(String),
      image: new Upgrade2().normalizeImage(faction, ImageType.Faction),
      key,
      name: faction.Name,
      stats: getFactionUnitStats(key, neutrals),
    }
  })
}

export function expectizeEffects() {
  return effects.map((effect) => {
    return {
      ability: effect.Ability,
      created: expect.any(Date),
      id: expect.any(String),
      image: new Upgrade2().normalizeImage(effect, ImageType.Effect),
      key: new Upgrade2().normalizeEffectKey(effect),
      name: effect.Name,
    }
  })
}

export function expectizeLeaders({ neutrals = false }: { neutrals?: boolean }) {
  const expectedFactions = expectizeFactions({ neutrals })
  return sortObjectArray({
    sortProperties: ['name'],
    array: leaders.map((leader) => {
      return {
        ability: leader.Ability,
        created: expect.any(Date),
        dlc: getDlc(leader),
        faction: expectedFactions.find((faction) => faction.name === leader.Faction),
        id: expect.any(String),
        image: new Upgrade2().normalizeImage(leader, ImageType.Leader),
        name: leader.Name,
        quote: leader.Quote,
      }
    }),
  })
}

export function expectizeUnits({ neutrals = false }: { neutrals?: boolean }): Unit[] {
  const expectedFactions = expectizeFactions({ neutrals })
  const expectedUnits: any[] = [] // eslint-disable-line @typescript-eslint/no-explicit-any
  for (const unit of units) {
    for (let i = 0; i < unit.Occurrences; i++) {
      const expectedEffects = expectizeEffects() // NOTE: needs to be inside for loop so effects from different units do not effect each other (get overwritten)
      const unitEffects: any[] = [] // eslint-disable-line @typescript-eslint/no-explicit-any
      for (const effect of [unit['Effect 1'], unit['Effect 2']]) {
        if (effect) {
          const unitEffect = expectedEffects.find((expectedEffect) => expectedEffect.name === effect)
          if (unitEffect) {
            unitEffects.push(unitEffect)
          }
        }
      }
      const expectedUnit = {
        combats: new Upgrade2().normalizeCombats(unit),
        created: expect.any(Date),
        deckable: new Upgrade2().normalizeDeckable(unit),
        dlc: getDlc(unit),
        effectPrefix: unit['Effect Prefix'] || null,
        faction: expectedFactions.find((faction) => faction.name === unit.Faction),
        hero: new Upgrade2().normalizeHero(unit),
        id: expect.any(String),
        images: new Upgrade2().normalizeImages(unit, ImageType.Unit),
        name: unit.Name,
        quote: unit.Quote,
        scorchMin: unit['Scorch Minimum Strength'] || null,
        scorchScope: new Upgrade2().normalizeScorchScope(unit),
        special: new Upgrade2().normalizeSpecial(unit),
        strength: new Upgrade2().normalizeStrength(unit),
      }
      expectedUnits.push({
        ...expectedUnit,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        effects: EffectStore.resolveAbilitiesForUnit(expectedUnit as any, unitEffects),
      })
    }
  }
  return sortObjectArray({
    sortProperties: ['name'],
    array: expectedUnits,
  })
}

export function expectizeDeck({
  factionKey,
  leaderName,
  name,
  neutrals = false,
  unitNames,
  user,
  maxArtStyle,
}: {
  factionKey: FactionKey
  leaderName: string
  name: string
  neutrals?: boolean
  unitNames: string[]
  user: User
  maxArtStyle?: boolean
}) {
  const allUnits = expectizeUnits({ neutrals })
  const expectedUnits: DeckCard[] = []
  for (const unitName of unitNames) {
    const unit = allUnits.find((expectedUnit) => expectedUnit.name === unitName)
    if (!unit) {
      throw Error(`Could not find unit with name "${unitName}"`)
    }
    expectedUnits.push({
      artStyle: maxArtStyle ? unit.images.length : 1,
      unit,
    })
  }
  return {
    created: expect.any(Date),
    faction: expectizeFactions({ neutrals }).find((faction) => faction.key === factionKey),
    id: expect.any(String),
    leader: expectizeLeaders({ neutrals }).find((leader) => leader.name === leaderName),
    name,
    stats: getUnitStats(expectedUnits),
    units: expectedUnits,
    user,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getDlc(item: any) {
  const expectedDlcs = expectizeDlcs()
  let dlc: any = null // eslint-disable-line @typescript-eslint/no-explicit-any
  if (item.DLC) {
    dlc = expectedDlcs.find((dlc) => dlc.name === item.DLC)
  }
  return dlc
}

export function getFactionUnitStats(factionKey: FactionKey, neutrals = false): UnitStats {
  const montsers: UnitStats = {
    agile: 3,
    avenger: 0,
    berserker: 0,
    bond: 0,
    close: 30,
    decoy: 0,
    heroes: 4,
    horn: 0,
    mardroeme: 0,
    medic: 0,
    morale: 1,
    muster: 18,
    ranged: 10,
    scorch: 1,
    siege: 4,
    specials: 0,
    spy: 0,
    strengthAverage: 182 / 41,
    strengths: 41,
    strengthTotal: 182,
    units: 41,
    weather: 0,
  }
  const neutral: UnitStats = {
    agile: 1,
    avenger: 1,
    berserker: 0,
    bond: 0,
    close: 11,
    decoy: 3,
    heroes: 5,
    horn: 4,
    mardroeme: 0,
    medic: 1,
    morale: 1,
    muster: 6,
    ranged: 6,
    scorch: 4,
    siege: 1,
    specials: 22,
    spy: 1,
    strengthAverage: 92 / 39,
    strengths: 17,
    strengthTotal: 92,
    units: 39,
    weather: 13,
  }
  const nilfgaard: UnitStats = {
    agile: 0,
    avenger: 0,
    berserker: 0,
    bond: 6,
    close: 18,
    decoy: 0,
    heroes: 4,
    horn: 0,
    mardroeme: 0,
    medic: 4,
    morale: 0,
    muster: 0,
    ranged: 13,
    scorch: 0,
    siege: 6,
    specials: 0,
    spy: 3,
    strengthAverage: 181 / 37,
    strengths: 37,
    strengthTotal: 181,
    units: 37,
    weather: 0,
  }
  const northern: UnitStats = {
    agile: 0,
    avenger: 0,
    berserker: 0,
    bond: 11,
    close: 17,
    decoy: 0,
    heroes: 4,
    horn: 0,
    mardroeme: 0,
    medic: 1,
    morale: 1,
    muster: 0,
    ranged: 8,
    scorch: 0,
    siege: 9,
    specials: 0,
    spy: 3,
    strengthAverage: 163 / 34,
    strengths: 34,
    strengthTotal: 163,
    units: 34,
    weather: 0,
  }
  const scoiatael: UnitStats = {
    agile: 9,
    avenger: 0,
    berserker: 0,
    bond: 0,
    close: 22,
    decoy: 0,
    heroes: 4,
    horn: 0,
    mardroeme: 0,
    medic: 3,
    morale: 2,
    muster: 9,
    ranged: 24,
    scorch: 1,
    siege: 1,
    specials: 0,
    spy: 0,
    strengthAverage: 185 / 38,
    strengths: 38,
    strengthTotal: 185,
    units: 38,
    weather: 0,
  }
  const skellige: UnitStats = {
    agile: 1,
    avenger: 1,
    berserker: 4,
    bond: 9,
    close: 18,
    decoy: 0,
    heroes: 4,
    horn: 1,
    mardroeme: 4,
    medic: 1,
    morale: 1,
    muster: 4,
    ranged: 13,
    scorch: 1,
    siege: 5,
    specials: 3,
    spy: 0,
    strengthAverage: 174 / 38,
    strengths: 35,
    strengthTotal: 174,
    units: 38,
    weather: 0,
  }
  let factionStats: UnitStats | undefined = undefined
  if (factionKey === FactionKey.Monsters) {
    factionStats = montsers
  } else if (factionKey === FactionKey.Neutral) {
    factionStats = neutral
  } else if (factionKey === FactionKey.NilfgaardianEmpire) {
    factionStats = nilfgaard
  } else if (factionKey === FactionKey.NorthernRealms) {
    factionStats = northern
  } else if (factionKey === FactionKey.ScoiaTael) {
    factionStats = scoiatael
  } else if (factionKey === FactionKey.Skellige) {
    factionStats = skellige
  }
  if (!factionStats) {
    throw Error(`Invalid faction "${factionKey}"`)
  }
  const addNeutrals = neutrals && factionKey !== FactionKey.Neutral
  let strengthAverage = factionStats.strengthAverage
  if (addNeutrals) {
    strengthAverage = (factionStats.strengthTotal + neutral.strengthTotal) / (factionStats.units + neutral.units)
  }
  return {
    agile: factionStats.agile + (addNeutrals ? neutral.agile : 0),
    avenger: factionStats.avenger + (addNeutrals ? neutral.avenger : 0),
    berserker: factionStats.berserker + (addNeutrals ? neutral.berserker : 0),
    bond: factionStats.bond + (addNeutrals ? neutral.bond : 0),
    close: factionStats.close + (addNeutrals ? neutral.close : 0),
    decoy: factionStats.decoy + (addNeutrals ? neutral.decoy : 0),
    heroes: factionStats.heroes + (addNeutrals ? neutral.heroes : 0),
    horn: factionStats.horn + (addNeutrals ? neutral.horn : 0),
    mardroeme: factionStats.mardroeme + (addNeutrals ? neutral.mardroeme : 0),
    medic: factionStats.medic + (addNeutrals ? neutral.medic : 0),
    morale: factionStats.morale + (addNeutrals ? neutral.morale : 0),
    muster: factionStats.muster + (addNeutrals ? neutral.muster : 0),
    ranged: factionStats.ranged + (addNeutrals ? neutral.ranged : 0),
    scorch: factionStats.scorch + (addNeutrals ? neutral.scorch : 0),
    siege: factionStats.siege + (addNeutrals ? neutral.siege : 0),
    specials: factionStats.specials + (addNeutrals ? neutral.specials : 0),
    spy: factionStats.spy + (addNeutrals ? neutral.spy : 0),
    strengthAverage,
    strengths: factionStats.strengths + (addNeutrals ? neutral.strengths : 0),
    strengthTotal: factionStats.strengthTotal + (addNeutrals ? neutral.strengthTotal : 0),
    units: factionStats.units + (addNeutrals ? neutral.units : 0),
    weather: factionStats.weather + (addNeutrals ? neutral.weather : 0),
  }
}
