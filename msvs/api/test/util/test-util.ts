import { ObjectId } from 'mongodb'

import {
  Combat,
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
  GameUnit,
  GameUnitEffect,
  GameUnitOrigin,
  GameUnitSource,
  Impact,
  Leader,
  PlayerCombatRow,
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
  GameUnitDbObject,
  GameUnitEffectDbObject,
  GameUnitSourceDbObject,
  ImpactDbObject,
  LeaderDbObject,
  MoveDbObject,
  MoveLeaderDbObject,
  MovePassDbObject,
  MoveReasonType,
  MoveUnitDbObject,
  MoveUnitReasonDbObject,
  PlayerCombatRowDbObject,
  PlayerRoundDbObject,
  RedrawDbObject,
  RoundResult,
  UnitDbObject,
  UserDbObject,
} from '@gwent/graphql-schema/database-typings'
import { MoveType } from '@gwent/graphql-schema'
import { STARTING_HAND_SIZE, STARTING_LIVES } from '@gwent/constants'

export default class TestUtil {
  static getDbUnit({
    combats,
    dlc,
    effectPrefix,
    effects,
    faction,
    hero = false,
    id,
    images = ['unit-image'],
    modifier = false,
    name = 'unit-name',
    scorchMin,
    scorchScope,
    strength,
    special,
  }: {
    combats?: string[]
    dlc?: ObjectId | string
    effectPrefix?: string
    effects?: (ObjectId | string)[]
    faction?: ObjectId | string
    hero?: boolean
    id?: ObjectId | string
    images?: string[]
    modifier?: boolean
    name?: string
    scorchMin?: number
    scorchScope?: Combat
    special?: boolean
    strength?: number
  }): UnitDbObject {
    return {
      _id: id ? new ObjectId(id) : new ObjectId(),
      combats,
      created: new Date(),
      deckable: true,
      dlc: dlc ? new ObjectId(dlc) : undefined,
      effectPrefix,
      effects: effects ? effects.map((effect) => new ObjectId(effect)) : undefined,
      faction: faction ? new ObjectId(faction) : new ObjectId(),
      hero,
      images,
      modifier,
      name,
      quote: 'unit-quote',
      scorchMin,
      scorchScope,
      special,
      strength,
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
      modifier: unit.modifier,
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
    combats,
    strength,
  }: {
    id?: ObjectId | string
    created?: Date
    factionId?: ObjectId | string
    faction?: Faction
    combats?: Combat[]
    strength?: number
  }): Unit {
    return {
      created: created || new Date(),
      combats,
      deckable: true,
      faction:
        faction ||
        TestUtil.getFaction({
          id: factionId,
        }),
      id: (id || new ObjectId()).toString(),
      images: ['unit-image'],
      modifier: false,
      name: 'unit-name',
      quote: 'unit-quote',
      strength,
    }
  }

  static getDbDeckUnit({ artStyle = 1, id }: { artStyle?: number; id?: ObjectId | string }): DeckUnitDbObject {
    return {
      artStyle,
      unit: id ? new ObjectId(id) : new ObjectId(),
    }
  }

  static getDbGameUnit({
    artStyle = 1,
    id,
    effectiveStrength,
    effects = [],
    row,
  }: {
    artStyle?: number
    id?: ObjectId | string
    effectiveStrength?: number | null
    effects?: GameUnitEffectDbObject[]
    row?: Combat
  }): GameUnitDbObject {
    return {
      artStyle,
      unit: id ? new ObjectId(id) : new ObjectId(),
      effectiveStrength,
      effects,
      row,
    }
  }

  static getGameUnitFromDbGameUnit({ gameUnit, unit }: { gameUnit: GameUnitDbObject; unit?: Unit }): GameUnit {
    return {
      artStyle: gameUnit.artStyle,
      unit:
        unit ||
        TestUtil.getUnit({
          id: gameUnit.unit,
        }),
      effectiveStrength: gameUnit.effectiveStrength !== undefined ? gameUnit.effectiveStrength : null,
      effects: [],
      row: gameUnit.row ? (gameUnit.row as Combat) : null,
    }
  }

  static getDeckUnitFromDbDeckUnit({ deckUnit, unit }: { deckUnit: DeckUnitDbObject; unit?: Unit }): DeckUnit {
    return {
      artStyle: deckUnit.artStyle,
      unit:
        unit ||
        TestUtil.getUnit({
          id: deckUnit.unit,
        }),
    }
  }

  static getDeckUnit({ id, artStyle = 1, unit }: { id?: ObjectId | string; artStyle?: number; unit?: Unit }): DeckUnit {
    return {
      artStyle,
      unit:
        unit ||
        TestUtil.getUnit({
          id,
        }),
    }
  }

  static getDbEffect({ id, key = EffectKey.Agile }: { id?: ObjectId | string; key?: EffectKey }): EffectDbObject {
    return {
      _id: id ? new ObjectId(id) : new ObjectId(),
      ability: 'effect-ability',
      created: new Date(),
      image: 'effect-image',
      key,
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
    dlc = undefined,
    faction,
    id,
    name = 'leader-name',
  }: {
    dlc?: ObjectId | string
    faction?: ObjectId | string
    id?: ObjectId | string
    name?: string
  }): LeaderDbObject {
    return {
      _id: id ? new ObjectId(id) : new ObjectId(),
      ability: 'leader-ability',
      created: new Date(),
      faction: faction ? new ObjectId(faction) : new ObjectId(),
      image: 'leader-image',
      name,
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

  static getDeck({ faction, id, user }: { faction?: Faction; id?: string | ObjectId; user?: User }): Deck {
    return {
      created: new Date(),
      faction: faction || TestUtil.getFaction({}),
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
    updated = new Date(),
    round = 0,
    status = GameStatus.Decking,
  }: {
    id?: ObjectId | string
    created?: Date
    creator?: ObjectId | string
    players?: GamePlayerDbObject[]
    turn?: ObjectId | string
    victors?: (ObjectId | string)[]
    updated?: Date
    round?: number
    status?: GameStatus
  }): GameDbObject {
    return {
      config: {
        lives: STARTING_LIVES,
      },
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
      round,
      status,
      turn: turn ? new ObjectId(turn) : undefined,
      updated,
      victors: victors.map((victor) => new ObjectId(victor)),
    }
  }

  static getGameFromDbGame({ game, creator }: { game: GameDbObject; creator?: User }): Game {
    return {
      config: game.config,
      created: game.created,
      creator:
        creator ||
        TestUtil.getUser({
          id: game.creator,
        }),
      id: game._id.toString(),
      players: game.players.map((player) => {
        const faction = TestUtil.getFaction({
          id: player.deck.from?.faction,
        })
        return TestUtil.getGamePlayer({
          faction,
          leader: TestUtil.getLeader({
            id: player.deck.from?.leader,
            faction,
          }),
          ready: player.ready,
          user: TestUtil.getUser({
            id: player.user,
          }),
        })
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

  static getGame({
    id,
    creator,
    players,
    round = 0,
  }: {
    id?: ObjectId | string
    creator?: User
    players?: GamePlayer[]
    round?: number
  }): Game {
    return {
      config: {
        lives: 2,
      },
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
      round,
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

  static getGameDeckFromDbGameDeck(gameDeck: GameDeckDbObject): GameDeck {
    return {
      discard: gameDeck.discard.map((deckUnit) =>
        TestUtil.getDeckUnitFromDbDeckUnit({
          deckUnit,
        })
      ),
      hand: gameDeck.hand.map((deckUnit) =>
        TestUtil.getDeckUnitFromDbDeckUnit({
          deckUnit,
        })
      ),
      redraws: gameDeck.redraws.map((redraw) => {
        return {
          from: TestUtil.getDeckUnitFromDbDeckUnit({
            deckUnit: redraw.from,
          }),
          to: TestUtil.getDeckUnitFromDbDeckUnit({
            deckUnit: redraw.to,
          }),
        }
      }),
      undrawn: gameDeck.undrawn.map((deckUnit) =>
        TestUtil.getDeckUnitFromDbDeckUnit({
          deckUnit,
        })
      ),
      from: gameDeck.from
        ? TestUtil.getDeckFromDbDeck({
            deck: gameDeck.from,
          })
        : undefined,
    }
  }

  static getPlayerCombatRow({ score = 0, units = [] }: { score?: number; units?: GameUnit[] }): PlayerCombatRow {
    return {
      score,
      units,
    }
  }

  static getDbMove({
    type,
    reason = {
      type: MoveReasonType.Deploy,
    },
    source = {
      origin: GameUnitOrigin.Hand,
    },
    unit = TestUtil.getDbGameUnit({}),
    leaderId = new ObjectId(),
    impacts,
    target,
  }: {
    type: MoveType
    reason?: MoveUnitReasonDbObject
    source?: GameUnitSourceDbObject
    unit?: GameUnitDbObject
    leaderId?: ObjectId
    impacts?: ImpactDbObject[]
    target?: ObjectId
  }): MoveDbObject {
    if (type === MoveType.Unit) {
      const unitMove: MoveUnitDbObject = {
        created: new Date(),
        reason,
        source,
        type: MoveType.Unit,
        unit,
        impacts,
        target,
      }
      return unitMove
    } else if (type === MoveType.Leader) {
      const leaderMove: MoveLeaderDbObject = {
        created: new Date(),
        leader: leaderId,
        type: MoveType.Leader,
      }
      return leaderMove
    } else {
      const passMove: MovePassDbObject = {
        created: new Date(),
        type: MoveType.Pass,
      }
      return passMove
    }
  }

  static getDbPlayerCombatRow({
    score = 0,
    units = [],
    modifier,
  }: {
    score?: number
    units?: GameUnitDbObject[]
    modifier?: GameUnitDbObject
  }): PlayerCombatRowDbObject {
    return {
      score,
      units,
      modifier,
    }
  }

  static getDbPlayerRound({
    close,
    ranged,
    siege,
    moves = [],
    score = 0,
    passed = false,
    result,
    weathers = [],
  }: {
    close?: PlayerCombatRowDbObjectWithDefaults
    ranged?: PlayerCombatRowDbObjectWithDefaults
    siege?: PlayerCombatRowDbObjectWithDefaults
    moves?: MoveDbObject[]
    score?: number
    passed?: boolean
    result?: RoundResult
    weathers?: GameUnitDbObject[]
  }): PlayerRoundDbObject {
    const round: PlayerRoundDbObject = {
      close: TestUtil.getDbPlayerCombatRow({
        modifier: close?.modifier,
        score: close?.score,
        units: close?.units,
      }),
      moves,
      ranged: TestUtil.getDbPlayerCombatRow({
        modifier: ranged?.modifier,
        score: ranged?.score,
        units: ranged?.units,
      }),
      siege: TestUtil.getDbPlayerCombatRow({
        modifier: siege?.modifier,
        score: siege?.score,
        units: siege?.units,
      }),
      score,
      passed,
      weathers,
    }
    if (result) {
      round.result = result
    }
    return round
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
    rounds?: PlayerRoundDbObject[]
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
    created = new Date(),
  }: {
    id?: ObjectId | string
    name?: string
    password?: string
    created?: Date
  }): UserDbObject {
    return {
      _id: id ? new ObjectId(id) : new ObjectId(),
      created,
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

  static getGameUnit({
    unit,
    artStyle = 1,
    effectiveStrength,
    effects = [],
    row = null,
  }: {
    unit: Unit
    artStyle?: number
    effectiveStrength?: number | null
    effects?: GameUnitEffect[]
    row?: Combat | null
  }): GameUnit {
    return {
      artStyle,
      unit,
      effectiveStrength:
        effectiveStrength || effectiveStrength === null
          ? effectiveStrength
          : unit.strength === undefined
            ? null
            : unit.strength,
      effects,
      row,
    }
  }

  static getDbImpact({
    unit = TestUtil.getDbGameUnit({}),
    user = new ObjectId(),
    source,
  }: {
    unit?: GameUnitDbObject
    user?: ObjectId
    source?: GameUnitSourceDbObject
  }): ImpactDbObject {
    return {
      unit,
      user,
      source,
    }
  }

  static getImpact({
    unit,
    user,
    source = null,
  }: {
    unit: GameUnit
    user: User
    source?: GameUnitSource | null
  }): Impact {
    return {
      unit,
      user,
      source,
    }
  }

  static getSource({
    origin = GameUnitOrigin.Hand,
    user = null,
  }: {
    origin?: GameUnitOrigin
    user?: User | null
  }): GameUnitSource {
    return {
      origin,
      user,
    }
  }
}

interface PlayerCombatRowDbObjectWithDefaults {
  modifier?: GameUnitDbObject
  score?: number
  units?: Array<GameUnitDbObject>
}
