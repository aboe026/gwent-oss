import { ObjectId } from 'mongodb'

import {
  Deck,
  DeckUnit,
  Dlc,
  DlcKey,
  Effect,
  Faction,
  FactionKey,
  Game,
  GameDeck,
  GamePlayer,
  GameStatus,
  Leader,
  PlayerRound,
  Redraw,
  Unit,
  UnitStats,
  User,
} from '@gwent/graphql-schema/resolver-typings'
import {
  DeckDbObject,
  DeckUnitDbObject,
  DlcDbObject,
  EffectDbObject,
  EffectKey,
  FactionDbObject,
  GameDbObject,
  GameDeckDbObject,
  GamePlayerDbObject,
  LeaderDbObject,
  RedrawDbObject,
  UnitDbObject,
  UserDbObject,
} from '@gwent/graphql-schema/database-typings'
import { MAX_ROUNDS, STARTING_HAND_SIZE } from '@gwent/constants'

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
    factionId,
    faction,
  }: {
    id?: ObjectId | string
    created?: Date
    factionId?: ObjectId | string
    faction?: Faction
  }): Unit {
    return {
      created: created || new Date(),
      deckable: true,
      faction:
        faction ||
        TestUtil.getFaction({
          id: factionId,
        }),
      id: (id || new ObjectId()).toString(),
      images: ['unit-image'],
      name: 'unit-name',
      quote: 'unit-quote',
    }
  }

  static getDbDeckUnit({ artStyle = 1, id }: { artStyle?: number; id?: ObjectId | string }): DeckUnitDbObject {
    return {
      artStyle,
      unit: id ? new ObjectId(id) : new ObjectId(),
    }
  }

  static getDeckUnitFromDbDeckUnit(deckUnit: DeckUnitDbObject): DeckUnit {
    return {
      artStyle: deckUnit.artStyle,
      unit: TestUtil.getUnit({
        id: deckUnit.unit,
      }),
    }
  }

  static getDeckUnit({ id }: { id?: ObjectId | string }): DeckUnit {
    return {
      artStyle: 1,
      unit: TestUtil.getUnit({
        id,
      }),
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

  static getDbFaction({
    id,
    key = FactionKey.Monsters,
    dlc = undefined,
  }: {
    id?: ObjectId | string
    key?: FactionKey
    dlc?: ObjectId | string
  }): FactionDbObject {
    return {
      _id: id ? new ObjectId(id) : new ObjectId(),
      created: new Date(),
      image: 'faction-image',
      key,
      name: 'facion-name',
      stats: TestUtil.getStats(),
      dlc: dlc ? new ObjectId(dlc) : undefined,
    }
  }

  static getFactionFromDbFaction(dbFaction: FactionDbObject): Faction {
    return {
      created: dbFaction.created,
      id: dbFaction._id.toString(),
      image: dbFaction.image,
      key: dbFaction.key as FactionKey,
      name: dbFaction.name,
      stats: dbFaction.stats,
      ability: dbFaction.ability,
      dlc: dbFaction.dlc
        ? TestUtil.getDlc({
            id: dbFaction.dlc,
          })
        : undefined,
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

  static getDbLeader({
    id,
    faction,
    dlc = undefined,
  }: {
    id?: ObjectId | string
    faction?: ObjectId | string
    dlc?: ObjectId | string
  }): LeaderDbObject {
    return {
      _id: id ? new ObjectId(id) : new ObjectId(),
      ability: 'leader-ability',
      created: new Date(),
      faction: faction ? new ObjectId(faction) : new ObjectId(),
      image: 'leader-image',
      name: 'leader-name',
      quote: 'leader-quote',
      dlc: dlc ? new ObjectId(dlc) : undefined,
    }
  }

  static getLeaderFromDbLeader(dbLeader: LeaderDbObject, faction?: Faction): Leader {
    return {
      ability: dbLeader.ability,
      created: dbLeader.created,
      faction:
        faction ||
        TestUtil.getFaction({
          id: dbLeader.faction,
        }),
      id: dbLeader._id.toString(),
      image: dbLeader.image,
      name: dbLeader.name,
      quote: dbLeader.quote,
      dlc: dbLeader.dlc
        ? TestUtil.getDlc({
            id: dbLeader.dlc,
          })
        : undefined,
    }
  }

  static getLeader({ id, faction }: { id?: ObjectId | string; faction?: Faction }): Leader {
    return {
      ability: 'leader-ability',
      created: new Date(),
      faction: faction || TestUtil.getFaction({}),
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

  static getDlcFromDbDlc(dlc: DlcDbObject): Dlc {
    return {
      created: dlc.created,
      id: dlc._id.toString(),
      image: dlc.image,
      key: dlc.key as DlcKey,
      name: dlc.name,
    }
  }

  static getDlc({ id }: { id?: ObjectId | string }): Dlc {
    return {
      created: new Date(),
      id: (id || new ObjectId()).toString(),
      image: 'dlc-image',
      key: DlcKey.BloodAndWine,
      name: 'dlc-name',
    }
  }

  static getDbDeck({
    id,
    faction,
    leader,
    name = 'deck-name',
    user,
    units,
  }: {
    id?: ObjectId | string
    faction?: ObjectId | string
    leader?: ObjectId | string
    name?: string
    user?: ObjectId | string
    units?: DeckUnitDbObject[]
  }): DeckDbObject {
    return {
      _id: id ? new ObjectId(id) : new ObjectId(),
      created: new Date(),
      faction: faction ? new ObjectId(faction) : new ObjectId(),
      leader: leader ? new ObjectId(leader) : new ObjectId(),
      name,
      stats: TestUtil.getStats(),
      units:
        units ||
        Array(STARTING_HAND_SIZE).fill({
          artStyle: 1,
          unit: new ObjectId(),
        }),
      user: user ? new ObjectId(user) : new ObjectId(),
    }
  }

  static getDeckFromDbDeck({
    deck,
    faction,
    leader,
    units,
    user,
  }: {
    deck: DeckDbObject
    faction?: Faction
    leader?: Leader
    units?: DeckUnit[]
    user?: User
  }): Deck {
    return {
      created: deck.created,
      faction:
        faction ||
        TestUtil.getFaction({
          id: deck.faction,
        }),
      id: deck._id.toString(),
      leader:
        leader ||
        TestUtil.getLeader({
          id: deck.leader,
        }),
      name: deck.name,
      stats: deck.stats,
      units:
        units ||
        deck.units.map((dbUnit) => {
          return {
            artStyle: dbUnit.artStyle,
            unit: TestUtil.getUnit({
              id: dbUnit.unit,
            }),
          }
        }),
      user:
        user ||
        TestUtil.getUser({
          id: deck.user,
        }),
    }
  }

  static getDeck({ id, user }: { id?: string | ObjectId; user?: User }): Deck {
    return {
      created: new Date(),
      faction: TestUtil.getFaction({}),
      id: (id || new ObjectId()).toString(),
      leader: TestUtil.getLeader({}),
      name: 'deck-name',
      stats: TestUtil.getStats(),
      units: Array(STARTING_HAND_SIZE).fill({
        artStyle: 1,
        unit: TestUtil.getUnit({}),
      }),
      user: user || TestUtil.getUser({}),
    }
  }

  static getDbGame({
    id,
    created,
    creator,
    players,
    turn,
    victors = [],
  }: {
    id?: ObjectId | string
    created?: Date
    creator?: ObjectId | string
    players?: GamePlayerDbObject[]
    turn?: ObjectId | string
    victors?: (ObjectId | string)[]
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
      turn: turn ? new ObjectId(turn) : undefined,
      updated: new Date(),
      victors: victors.map((victor) => new ObjectId(victor)),
    }
  }

  static getGameFromDbGame({ game, creator }: { game: GameDbObject; creator?: User }): Game {
    return {
      created: game.created,
      creator:
        creator ||
        TestUtil.getUser({
          id: game.creator,
        }),
      id: game._id.toString(),
      players: game.players.map((player) => {
        return {
          ready: player.ready,
          rounds: player.rounds,
          user: TestUtil.getUser({
            id: player.user,
          }),
        }
      }),
      round: game.round,
      status: GameStatus.Decking,
      updated: game.updated,
      victors: game.victors.map((victorId) =>
        TestUtil.getUser({
          id: victorId,
        })
      ),
    }
  }

  static getGame({ id, creator, players }: { id?: ObjectId | string; creator?: User; players?: GamePlayer[] }): Game {
    return {
      created: new Date(),
      creator: creator || TestUtil.getUser({}),
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

  static getDbGameDeck({
    discard,
    from,
    hand,
    redraws,
    undrawn,
  }: {
    discard?: DeckUnitDbObject[]
    from?: DeckDbObject
    hand?: DeckUnitDbObject[]
    redraws?: RedrawDbObject[]
    undrawn?: DeckUnitDbObject[]
  }): GameDeckDbObject {
    return {
      discard: discard || [],
      from,
      hand: hand || [],
      redraws: redraws || [],
      undrawn: undrawn || [],
    }
  }

  static getGameDeck({
    discard,
    from,
    hand,
    redraws,
    undrawn,
  }: {
    discard?: DeckUnit[]
    from?: Deck
    hand?: DeckUnit[]
    redraws?: Redraw[]
    undrawn?: DeckUnit[]
  }): GameDeck {
    return {
      discard: discard || [],
      from,
      hand: hand || [],
      redraws: redraws || [],
      undrawn: undrawn || [],
    }
  }

  static getDbGamePlayer({
    deck = TestUtil.getDbGameDeck({}),
    ready = false,
    rounds = [],
    order,
    user,
  }: {
    deck?: GameDeckDbObject
    ready?: boolean
    rounds?: PlayerRound[]
    order?: number
    user?: ObjectId | string
  }): GamePlayerDbObject {
    return {
      deck,
      ready,
      rounds,
      order,
      user: user ? new ObjectId(user) : new ObjectId(),
    }
  }

  static getGamePlayer({
    ready = false,
    user,
    faction,
    leader,
  }: {
    ready?: boolean
    user?: User
    faction?: Faction
    leader?: Leader
  }): GamePlayer {
    return {
      ready,
      rounds: [],
      user: user || TestUtil.getUser({}),
      faction,
      leader,
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

  static getDbUser({
    id,
    name = 'user-name',
    password = 'user-password',
  }: {
    id?: ObjectId | string
    name?: string
    password?: string
  }): UserDbObject {
    return {
      _id: id ? new ObjectId(id) : new ObjectId(),
      created: new Date(),
      name,
      password,
    }
  }

  static getUserFromDbUser(dbUser: UserDbObject): User {
    return {
      created: dbUser.created,
      id: dbUser._id.toString(),
      name: dbUser.name,
    }
  }

  static getDbUserFromUser(user: User): UserDbObject {
    return {
      _id: new ObjectId(user.id),
      created: user.created,
      name: user.name,
      password: '',
    }
  }

  static getUser({ id, name = 'user-name' }: { id?: ObjectId | string; name?: string }): User {
    return {
      created: new Date(),
      id: (id || new ObjectId()).toString(),
      name,
    }
  }
}
