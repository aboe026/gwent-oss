import { ObjectId } from 'mongodb'

import createGwentClient, {
  Combat,
  Deck,
  DeckUnit,
  Faction,
  FactionKey,
  Game,
  GameDeck,
  GameUnit,
  GwentClient,
  Leader,
  QueryUnitsArgs,
  Setting,
  SettingType,
  Unit,
  User,
} from '@gwent/node-client'
import E2eUtil from './e2e-util'

export default class ApiClient {
  public client: GwentClient

  constructor({ username, password = 'password' }: { username?: string; password?: string }) {
    this.client = createGwentClient({
      graphqlUrl: E2eUtil.getGraphqlUrl(),
      username,
      password,
    })
  }

  async addUser({ name, password = 'password' }: { name: string; password?: string }): Promise<User> {
    return this.client.addUser({
      name,
      password,
    })
  }

  async currentUser(): Promise<User> {
    const user = await this.client.currentUser({})
    if (!user) {
      throw Error('No user for client')
    }
    return user
  }

  async getFaction({ key }: { key: FactionKey }): Promise<Faction> {
    const factions = await this.client.factions({
      keys: [key],
    })
    const faction = factions.find((faction) => faction.key === key)
    if (!faction) {
      throw Error(`No faction found with key "${key}"`)
    }
    return faction
  }

  async getLeader({ faction, name }: { faction: FactionKey; name: string }): Promise<Leader> {
    const leaders = await this.client.leaders({
      factions: [faction],
    })
    const leader = leaders.find((leader) => leader.name === name)
    if (!leader) {
      throw Error(`No leader found with name "${name}" for faction "${faction}"`)
    }
    return leader
  }

  async getUnits({ deckable, factions }: QueryUnitsArgs): Promise<Unit[]> {
    return this.client.units({
      deckable,
      factions,
    })
  }

  async getUnit({
    factions,
    name,
    deckable,
  }: {
    name: string
    deckable?: boolean
    factions?: FactionKey[]
  }): Promise<Unit> {
    const units = await this.client.units({
      deckable,
      factions,
    })
    const unit = units.find((unit) => unit.name === name)
    if (!unit) {
      throw Error(`Could not find unit with name "${name}" in "${JSON.stringify(units)}"`)
    }
    return unit
  }

  async getGameUnits({
    gameId,
    playerId,
  }: {
    gameId: string | ObjectId
    playerId?: string | ObjectId
  }): Promise<GameUnit[]> {
    const game = await this.client.game({
      id: gameId.toString(),
    })

    const players = playerId ? game.players.filter((player) => player.user.id === playerId.toString()) : game.players
    if (playerId && (!players || players.length === 0)) {
      throw Error(`Could not find player "${playerId}" on game "${gameId}"`)
    }

    const gameUnits: GameUnit[] = []

    for (const player of players) {
      const round = player.rounds[game.round - 1]
      for (const fieldUnit of [...round.close.units, ...round.ranged.units, ...round.siege.units]) {
        gameUnits.push({
          ...fieldUnit,
          __typename: 'FieldUnit',
        })
      }
      for (const modifier of [round.close.modifier, round.ranged.modifier, round.siege.modifier]) {
        if (modifier) {
          gameUnits.push({
            ...modifier,
            __typename: 'FieldUnit',
          })
        }
      }
      for (const weather of round.weathers) {
        gameUnits.push({
          ...weather,
          __typename: 'WeatherUnit',
        })
      }
    }

    return gameUnits
  }

  async getBattlefieldUnit({
    gameId,
    name,
    combat,
    instance = 1,
  }: {
    gameId: string | ObjectId
    name: string
    combat: Combat
    instance?: number
  }): Promise<Unit> {
    const user = await this.client.currentUser({})
    if (!user) {
      throw Error('Could not determine user for client')
    }
    const game = await this.client.game({
      id: gameId.toString(),
    })

    const player = game.players.find((player) => player.user.id === user.id)
    if (!player) {
      throw Error(`Current user "${user.id}" is not a player on game "${gameId}"`)
    }

    const round = player.rounds[game.round - 1]
    const row = combat === Combat.Close ? round.close : combat === Combat.Ranged ? round.ranged : round.siege
    const units = row.units
    if (row.modifier) {
      units.push(row.modifier)
    }
    let unit: Unit | undefined = undefined
    let occurrence = 0
    for (let i = 0; i < units.length && !unit; i++) {
      const fieldUnit = units[i]
      if (fieldUnit.unit.name === name) {
        if (occurrence + 1 === instance) {
          unit = fieldUnit.unit
        } else {
          occurrence++
        }
      }
    }
    if (!unit) {
      throw Error(
        `Could not find instance "${instance}" of unit "${name}" in combat "${combat}" for game "${gameId}" for user "${user.name}"`
      )
    }
    return unit
  }

  async addDeck({ faction, leaderName, name, unitNames }: AddDeckInput): Promise<Deck> {
    const leader = await this.getLeader({
      faction,
      name: leaderName,
    })
    const allUnits = await this.client.units({
      deckable: true,
      factions: [faction, FactionKey.Neutral],
    })
    const units: Unit[] = []
    for (const unitName of unitNames) {
      const index = allUnits.findIndex((unit) => unit.name === unitName)
      if (index < 0) {
        throw Error(`Could not find unit with name "${unitName}"`)
      }
      units.push(allUnits[index])
      allUnits.splice(index, 1) // remove from units so duplicate names work properly
    }
    return this.client.addDeck({
      faction,
      leader: leader.id,
      name,
      units: units.map((unit) => {
        return {
          id: unit.id,
          artStyle: unit.images.length > 1 ? 1 : undefined,
        }
      }),
    })
  }

  async getDeck(name: string): Promise<Deck> {
    const decks = await this.client.decks({})
    const deck = decks.find((deck: Deck) => deck.name === name)
    if (!deck) {
      throw Error(`Could not find deck "${name}"`)
    }
    return deck
  }

  async addGame(opponentNames: string[]): Promise<Game> {
    return this.client.addGame({
      opponentNames,
    })
  }

  async getGames(): Promise<Game[]> {
    return this.client.games({})
  }

  async getGame(gameId: string | ObjectId): Promise<Game> {
    const game = await this.client.game({
      id: gameId.toString(),
    })
    if (!game) {
      throw Error(`Could not find game with ID "${gameId}"`)
    }
    return game
  }

  async setDeck({ deckId, gameId }: { gameId: string | ObjectId; deckId: string | ObjectId }): Promise<GameDeck> {
    return this.client.setDeck({
      deck: deckId.toString(),
      game: gameId.toString(),
    })
  }

  async getGameDeck(gameId: string | ObjectId): Promise<GameDeck> {
    const gameDeck = await this.client.gameDeck({
      game: gameId.toString(),
    })
    if (!gameDeck) {
      throw Error(`Could not find deck for game "${gameId}"`)
    }
    return gameDeck
  }

  async playPass({ gameId }: { gameId: string | ObjectId }): Promise<Game> {
    return this.client.playPass({
      game: gameId.toString(),
    })
  }

  async playUnit({
    gameId,
    unitId,
    combat,
    target,
  }: {
    gameId: string | ObjectId
    unitId: string | ObjectId
    combat: Combat
    target?: string | ObjectId
  }): Promise<Game> {
    return this.client.playUnit({
      game: gameId.toString(),
      unit: unitId.toString(),
      combat,
      target: target ? target.toString() : undefined,
    })
  }

  async setOrder({ gameId, userIds }: { gameId: string | ObjectId; userIds: (string | ObjectId)[] }): Promise<Game> {
    return this.client.setOrder({
      game: gameId.toString(),
      users: userIds.map((userId) => userId.toString()),
    })
  }

  async redraw({ gameId, unitId }: { gameId: string | ObjectId; unitId: string | ObjectId }): Promise<DeckUnit> {
    return this.client.redraw({
      game: gameId.toString(),
      unit: unitId.toString(),
    })
  }

  async ready(gameId: string | ObjectId): Promise<Game> {
    return this.client.ready({
      game: gameId.toString(),
    })
  }

  async getSetting<T>(key: string): Promise<T> {
    const settings = await this.client.settings({})
    const setting = settings.find((setting: Setting) => setting.key === key)
    if (!setting) {
      throw Error(`Could not find setting with key "${key}"`)
    }
    if (setting.type === SettingType.Number) {
      return Number(setting.value) as T
    }
    return setting.value as T
  }
}

export interface AddDeckInput {
  faction: FactionKey
  leaderName: string
  name: string
  unitNames: string[]
}
