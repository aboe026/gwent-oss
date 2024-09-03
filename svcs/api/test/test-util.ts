import { MAX_ROUNDS, STARTING_HAND_SIZE } from '@gwent/constants'
import {
  DeckDbObject,
  DlcDbObject,
  EffectDbObject,
  EffectKey,
  FactionDbObject,
  GameDbObject,
  GamePlayerDbObject,
  UnitDbObject,
  UserDbObject,
} from '@gwent/graphql-schema/database-typings'
import {
  Deck,
  Dlc,
  DlcKey,
  Effect,
  Faction,
  FactionKey,
  Game,
  GamePlayer,
  GameStatus,
  Leader,
  Unit,
  UnitStats,
  User,
} from '@gwent/graphql-schema/resolver-typings'
import { ObjectId } from 'mongodb'

export default class TestUtil {
  static getDbUnit({
    id,
    dlc,
    faction,
    effects,
    combats,
    effectPrefix,
  }: {
    id?: ObjectId | string
    dlc?: ObjectId | string
    faction?: ObjectId | string
    effects?: (ObjectId | string)[]
    combats?: string[]
    effectPrefix?: string
  }): UnitDbObject {
    return {
      _id: id ? new ObjectId(id) : new ObjectId(),
      created: new Date(),
      deckable: true,
      faction: faction ? new ObjectId(faction) : new ObjectId(),
      images: ['unit-image'],
      name: 'unit-name',
      quote: 'unit-quote',
      dlc: dlc ? new ObjectId(dlc) : undefined,
      effects: effects ? effects.map((effect) => new ObjectId(effect)) : undefined,
      combats,
      effectPrefix,
    }
  }

  static getUnitFromDbUnit({ unit, effects }: { unit: UnitDbObject; effects?: EffectDbObject[] }): Unit {
    return {
      created: unit.created,
      deckable: unit.deckable,
      faction: TestUtil.getFaction({
        id: unit.faction,
      }),
      id: unit._id.toString(),
      images: unit.images,
      name: unit.name,
      quote: unit.quote,
      effects: unit.effects
        ? effects
          ? effects.map((effect) => TestUtil.getEffectFromDbEffect(effect))
          : unit.effects.map((effectId) =>
              TestUtil.getEffect({
                id: effectId,
              })
            )
        : undefined,
    }
  }

  static getUnit({
    id,
    created,
    faction,
  }: {
    id?: ObjectId | string
    created?: Date
    faction?: ObjectId | string
  }): Unit {
    return {
      created: created || new Date(),
      deckable: true,
      faction: TestUtil.getFaction({
        id: faction,
      }),
      id: (id || new ObjectId()).toString(),
      images: ['unit-image'],
      name: 'unit-name',
      quote: 'unit-quote',
    }
  }

  static getDbEffect({ id }: { id?: ObjectId | string }): EffectDbObject {
    return {
      _id: id ? new ObjectId(id) : new ObjectId(),
      ability: 'effect-ability',
      created: new Date(),
      image: 'effect-image',
      key: EffectKey.Agile,
      name: 'effect-name',
    }
  }

  static getEffect({
    ability = 'effect-ability',
    id,
    key = EffectKey.Agile,
  }: {
    ability?: string
    id?: ObjectId | string
    key?: EffectKey
  }): Effect {
    return {
      ability,
      created: new Date(),
      id: (id || new ObjectId()).toString(),
      image: 'effect-image',
      key,
      name: 'effect-name',
    }
  }

  static getEffectFromDbEffect(dbEffect: EffectDbObject): Effect {
    return {
      ability: dbEffect.ability,
      created: dbEffect.created,
      id: dbEffect._id.toString(),
      image: dbEffect.image,
      key: dbEffect.key as EffectKey,
      name: dbEffect.name,
    }
  }

  static getDbFaction({ key = FactionKey.Monsters }: { key?: FactionKey }): FactionDbObject {
    return {
      _id: new ObjectId(),
      created: new Date(),
      image: 'faction-image',
      key,
      name: 'facion-name',
      stats: TestUtil.getStats(),
    }
  }

  static getFaction({ id }: { id?: ObjectId | string }): Faction {
    return {
      created: new Date(),
      id: id ? id.toString() : new ObjectId().toString(),
      image: 'faction-image',
      key: FactionKey.Monsters,
      name: 'faction-name',
      stats: TestUtil.getStats(),
    }
  }

  static getLeader({ id }: { id?: ObjectId | string }): Leader {
    return {
      ability: 'leader-ability',
      created: new Date(),
      faction: TestUtil.getFaction({}),
      id: (id || new ObjectId()).toString(),
      image: 'leader-image',
      name: 'leader-name',
      quote: 'leader-quote',
    }
  }

  static getDbDlc(): DlcDbObject {
    return {
      _id: new ObjectId(),
      created: new Date(),
      image: 'dlc-image',
      key: DlcKey.BloodAndWine,
      name: 'dlc-name',
    }
  }

  static getDlc(): Dlc {
    return {
      created: new Date(),
      id: new ObjectId().toString(),
      image: 'dlc-image',
      key: DlcKey.BloodAndWine,
      name: 'dlc-name',
    }
  }

  static getDbDeck(): DeckDbObject {
    return {
      _id: new ObjectId(),
      created: new Date(),
      faction: new ObjectId(),
      leader: new ObjectId(),
      name: 'deck-name',
      stats: TestUtil.getStats(),
      units: Array(STARTING_HAND_SIZE).fill({
        artStyle: 1,
        unit: new ObjectId(),
      }),
      user: new ObjectId(),
    }
  }

  static getDeckFromDbDeck(dbDeck: DeckDbObject): Deck {
    return {
      created: dbDeck.created,
      faction: TestUtil.getFaction({
        id: dbDeck.faction,
      }),
      id: dbDeck._id.toString(),
      leader: TestUtil.getLeader({
        id: dbDeck.leader,
      }),
      name: dbDeck.name,
      stats: dbDeck.stats,
      units: dbDeck.units.map((dbUnit) => {
        return {
          artStyle: dbUnit.artStyle,
          unit: TestUtil.getUnit({
            id: dbUnit.unit,
          }),
        }
      }),
      user: TestUtil.getUser({
        id: dbDeck.user,
      }),
    }
  }

  static getDbGame({
    id,
    created,
    creator,
    players,
  }: {
    id?: ObjectId | string
    created?: Date
    creator?: ObjectId | string
    players?: GamePlayerDbObject[]
  }): GameDbObject {
    return {
      _id: id ? new ObjectId(id) : new ObjectId(),
      created: created || new Date(),
      creator: creator ? new ObjectId(creator) : new ObjectId(),
      players: players || [
        {
          deck: {
            discard: [],
            hand: [],
            redraws: [],
            undrawn: [],
          },
          ready: false,
          rounds: [],
          user: creator ? new ObjectId(creator) : new ObjectId(),
        },
        {
          deck: {
            discard: [],
            hand: [],
            redraws: [],
            undrawn: [],
          },
          ready: false,
          rounds: [],
          user: new ObjectId(),
        },
      ],
      round: {
        current: 0,
        maximum: MAX_ROUNDS,
      },
      updated: new Date(),
      victors: [],
    }
  }

  static getGame({ id, players }: { id?: ObjectId | string; players?: GamePlayer[] }): Game {
    return {
      created: new Date(),
      creator: TestUtil.getUser({}),
      id: (id || new ObjectId()).toString(),
      players: players || [
        {
          ready: false,
          rounds: [],
          user: TestUtil.getUser({}),
        },
      ],
      round: {
        current: 0,
        maximum: MAX_ROUNDS,
      },
      status: GameStatus.Decking,
      updated: new Date(),
      victors: [],
    }
  }

  static getStats(offset = 0): UnitStats {
    return {
      agile: 1 + offset,
      avenger: 2 + offset,
      berserker: 3 + offset,
      bond: 4 + offset,
      close: 5 + offset,
      decoy: 6 + offset,
      heroes: 7 + offset,
      horn: 8 + offset,
      mardroeme: 9 + offset,
      medic: 10 + offset,
      morale: 11 + offset,
      muster: 12 + offset,
      ranged: 13 + offset,
      scorch: 14 + offset,
      siege: 15 + offset,
      specials: 16 + offset,
      spy: 17 + offset,
      strengthAverage: 18 + offset,
      strengths: 19 + offset,
      strengthTotal: 20 + offset,
      units: 21 + offset,
      weather: 22 + offset,
    }
  }

  static getDbUser({ name = 'user-name' }: { name?: string }): UserDbObject {
    return {
      _id: new ObjectId(),
      created: new Date(),
      name,
      password: 'user-password',
    }
  }

  static getUserFromDbUser(dbUser: UserDbObject): User {
    return {
      created: dbUser.created,
      id: dbUser._id.toString(),
      name: dbUser.name,
    }
  }

  static getUser({ id }: { id?: ObjectId | string }): User {
    return {
      created: new Date(),
      id: (id || new ObjectId()).toString(),
      name: 'user-name',
    }
  }
}
