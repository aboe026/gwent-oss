import { Db, ObjectId } from 'mongodb'

import {
  Deck,
  DeckUnit,
  Faction,
  FactionKey,
  GameDeck,
  GamePlayer,
  GamePlayerUnitCounts,
  GameStatus,
  Leader,
  Move,
  PlayerCombatRow,
  PlayerRound,
  RoundResult,
  Unit,
  UnitStats,
  User,
} from '@gwent/graphql-schema/resolver-typings'
import dlcs from '../../../src/database/upgrades/resources/dlcs.json'
import effects from '../../../src/database/upgrades/resources/effects.json'
import factions from '../../../src/database/upgrades/resources/factions.json'
import { getDeckStats, sortObjectArray } from '@gwent/utils'
import leaders from '../../../src/database/upgrades/resources/leaders.json'
import { STARTING_HAND_SIZE } from '@gwent/constants'
import UnitResolver from '../../../src/graphql/resolvers/types/unit-resolver'
import units from '../../../src/database/upgrades/resources/units.json'
import Upgrade2, { ImageType } from '../../../src/database/upgrades/upgrade-2'

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

export function verifyGameDeckSet(gameDeck: GameDeck, deck: Deck) {
  expect(gameDeck.hand).toHaveLength(STARTING_HAND_SIZE)
  expect(gameDeck.undrawn).toHaveLength(deck.units.length - STARTING_HAND_SIZE)
  for (const handUnit of gameDeck.hand) {
    expect(gameDeck.undrawn.find((deckUnit) => deckUnit.unit.id === handUnit.unit.id)).toEqual(undefined)
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

export function expectizeFactions() {
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
      stats: getFactionUnitStats(key),
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

export function expectizeLeaders() {
  const expectedFactions = expectizeFactions()
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

export function expectizeUnits(): Unit[] {
  const expectedFactions = expectizeFactions()
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
        effects: UnitResolver.effectAbilities(expectedUnit as any, unitEffects),
      })
    }
  }
  return sortObjectArray({
    sortProperties: ['name'],
    array: expectedUnits,
  })
}

export function expectizeDeck({ factionKey, leaderName, name, unitNames, user, maxArtStyle }: ExpectizeDeckInput) {
  const allUnits = expectizeUnits()
  const expectedUnits: DeckUnit[] = []
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
    faction: expectizeFactions().find((faction) => faction.key === factionKey),
    id: expect.any(String),
    leader: expectizeLeaders().find((leader) => leader.name === leaderName),
    name,
    stats: getDeckStats(expectedUnits),
    units: expectizeDeckUnits({
      unitNames,
      maxArtStyle,
    }),
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

export function getFactionUnitStats(factionKey: FactionKey): UnitStats {
  if (factionKey === FactionKey.Monsters) {
    return {
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
  } else if (factionKey === FactionKey.Neutral) {
    return {
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
  } else if (factionKey === FactionKey.NilfgaardianEmpire) {
    return {
      agile: 0,
      avenger: 0,
      berserker: 0,
      bond: 9,
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
  } else if (factionKey === FactionKey.NorthernRealms) {
    return {
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
  } else if (factionKey === FactionKey.ScoiaTael) {
    return {
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
  } else {
    return {
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
  }
}

export function expectizeGame({
  creator,
  players,
  status = GameStatus.Decking,
  turn = null,
  round = 0,
}: {
  creator: User
  players: {
    counts?: GamePlayerUnitCounts | null
    faction?: Faction | null
    leader?: Leader | null
    ready?: boolean
    rounds?: PlayerRound[]
    user: User
    order?: number | null
  }[]
  status?: GameStatus
  turn?: GamePlayer | null
  round?: number
}) {
  return {
    config: {
      lives: 2,
    },
    created: expect.any(Date),
    creator,
    id: expect.any(String),
    players: players.map((player) => {
      if (!player.counts) {
        player.counts = null
      }
      if (!player.faction) {
        player.faction = null
      }
      if (!player.leader) {
        player.leader = null
      }
      if (!player.rounds) {
        player.rounds = []
      }
      if (!player.ready) {
        player.ready = false
      }
      if (player.order === undefined) {
        player.order = null
      }
      if (status === GameStatus.Playing && player.order === undefined) {
        player.order = expect.any(Number)
      }
      return player
    }),
    round,
    status,
    turn,
    updated: expect.any(Date),
    victors: [],
  }
}

export function expectizeGameDeck({
  deck,
  discards,
  hand,
  redraws,
  undrawn,
}: {
  deck: ExpectizeDeckInput
  discards?: string[]
  hand?: string[]
  redraws?: string[]
  undrawn?: string[]
}) {
  return {
    discard: expectizeDeckUnits({
      unitNames: discards,
      maxArtStyle: deck.maxArtStyle,
    }),
    from: expectizeDeck(deck),
    hand: expectizeDeckUnits({
      unitNames: hand,
      maxArtStyle: deck.maxArtStyle,
    }),
    redraws: expectizeDeckUnits({
      unitNames: redraws,
      maxArtStyle: deck.maxArtStyle,
    }),
    undrawn: expectizeDeckUnits({
      unitNames: undrawn,
      maxArtStyle: deck.maxArtStyle,
    }),
  }
}

export function expectizePlayerRound({
  close = {
    score: 0,
    units: [],
  },
  moves = [],
  ranged = {
    score: 0,
    units: [],
  },
  passed = false,
  result = null,
  score = 0,
  siege = {
    score: 0,
    units: [],
  },
}: {
  close?: PlayerCombatRow
  moves?: Move[]
  passed?: boolean
  ranged?: PlayerCombatRow
  result?: RoundResult | null
  score?: number
  siege?: PlayerCombatRow
}): PlayerRound {
  return {
    close,
    moves,
    passed,
    ranged,
    score,
    siege,
    result,
  }
}

export function expectizeGamePlayer({
  user,
  gameDeck,
  order = null,
  ready = false,
  rounds = [],
}: {
  user: User
  gameDeck: GameDeck
  order?: number | null
  ready?: boolean
  rounds?: PlayerRound[]
}): GamePlayer {
  return {
    ready,
    rounds,
    user,
    counts: {
      discard: gameDeck.discard.length,
      hand: gameDeck.hand.length,
      undrawn: gameDeck.undrawn.length,
    },
    faction: gameDeck.from?.faction,
    leader: gameDeck.from?.leader,
    order,
  }
}

export function expectizeDeckUnits({ unitNames, maxArtStyle }: { unitNames?: string[]; maxArtStyle?: boolean }) {
  if (unitNames) {
    const allUnits = expectizeUnits()
    const expectedUnits: DeckUnit[] = []
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
    return expectedUnits
  } else {
    return expect.arrayContaining([
      expect.objectContaining({
        artStyle: expect.any(Number),
        unit: expect.any(Object),
      }),
    ])
  }
}

interface ExpectizeDeckInput {
  factionKey: FactionKey
  leaderName: string
  name: string
  unitNames: string[]
  user: User
  maxArtStyle?: boolean
}
