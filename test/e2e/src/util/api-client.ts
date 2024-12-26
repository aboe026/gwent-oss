import { GraphQLClient, gql } from 'graphql-request'
import { ObjectId } from 'mongodb'
import urljoin from 'url-join'

import {
  Combat,
  Deck,
  DeckUnit,
  Faction,
  FactionKey,
  Game,
  GameDeck,
  Leader,
  QueryUnitsArgs,
  Setting,
  SettingType,
  Unit,
  User,
} from '@gwent/graphql-schema/resolver-typings'
import env from './env'
import { GraphQLClientRequestHeaders } from 'graphql-request/build/esm/types'

export default class ApiClient {
  private _client = new GraphQLClient(urljoin(env.API_BASE_URL, 'graphql'))

  constructor({ username, password = 'password' }: { username?: string; password?: string }) {
    const headers: GraphQLClientRequestHeaders = {}
    if (username && password) {
      headers.authorization = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
    }
    this._client = new GraphQLClient(urljoin(env.API_BASE_URL, 'graphql'), {
      headers,
    })
  }

  async addUser({ name, password = 'password' }: { name: string; password?: string }): Promise<User> {
    const response: any = await this._client.request(
      gql`
        mutation AddUser($name: String!, $password: String!) {
          addUser(name: $name, password: $password) {
            ${this.fieldsOnUser()}
          }
        }
      `,
      {
        name,
        password,
      }
    )
    return response.addUser
  }

  async getFactions(): Promise<Faction[]> {
    const response: any = await this._client.request(
      gql`
        query Factions {
          factions {
            ${this.fieldsOnFaction()}
          }
        }
      `
    )
    return response.factions
  }

  async getFaction({ key }: { key: FactionKey }): Promise<Faction> {
    const factions = await this.getFactions()
    const faction = factions.find((faction) => faction.key === key)
    if (!faction) {
      throw Error(`No faction found with key "${key}"`)
    }
    return faction
  }

  async getLeaders({ factions }: { factions: FactionKey[] }): Promise<Leader[]> {
    const response: any = await this._client.request(
      gql`
        query Leaders($factions: [FactionKey!]) {
          leaders(factions: $factions) {
            ${this.fieldsOnLeader()}
          }
        }
      `,
      {
        factions,
      }
    )
    return response.leaders
  }

  async getLeader({ faction, name }: { faction: FactionKey; name: string }): Promise<Leader> {
    const leaders = await this.getLeaders({ factions: [faction] })
    const leader = leaders.find((leader) => leader.name === name)
    if (!leader) {
      throw Error(`No leader found with name "${name}" for faction "${faction}"`)
    }
    return leader
  }

  async getUnits({ deckable, factions }: QueryUnitsArgs): Promise<Unit[]> {
    const response: any = await this._client.request(
      gql`
        query Units($factions: [FactionKey!], $deckable: Boolean) {
          units(factions: $factions, deckable: $deckable) {
            ${this.fieldsOnUnit()}
          }
        }
      `,
      {
        deckable,
        factions,
      }
    )
    return response.units
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
    const units = await this.getUnits({
      deckable,
      factions,
    })
    const unit = units.find((unit) => unit.name === name)
    if (!unit) {
      throw Error(`Could not find unit with name "${name}" in "${JSON.stringify(units)}"`)
    }
    return unit
  }

  async addDeck({ faction, leaderName, name, unitNames }: AddDeckInput): Promise<Deck> {
    const leader = await this.getLeader({
      faction,
      name: leaderName,
    })
    const allUnits = await this.getUnits({
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
    const response: any = await this._client.request(
      gql`
        mutation AddDeck($name: String!, $faction: FactionKey!, $leader: ID!, $units: [DeckUnitInput!]!) {
          addDeck(name: $name, faction: $faction, leader: $leader, units: $units) {
            ${this.fieldsOnDeck()}
          }
        }
      `,
      {
        name,
        faction,
        leader: leader.id,
        units: units.map((unit) => {
          return {
            id: unit.id,
            artStyle: unit.images.length > 1 ? 1 : undefined,
          }
        }),
      }
    )
    return response.addDeck
  }

  async getDeck(name: string): Promise<Deck> {
    const response: any = await this._client.request(
      gql`
        query Decks {
          decks {
            ${this.fieldsOnDeck()}
          }
        }
      `
    )
    const deck = response.decks.find((deck: Deck) => deck.name === name)
    if (!deck) {
      throw Error(`Could not find deck "${name}"`)
    }
    return deck
  }

  async addGame(opponentNames: string[]): Promise<Game> {
    const response: any = await this._client.request(
      gql`
        mutation AddGame($opponentNames: [String!]!) {
          addGame(opponentNames: $opponentNames) {
            ${this.fieldsOnGame()}
          }
        }
      `,
      {
        opponentNames,
      }
    )
    return response.addGame
  }

  async getGames(): Promise<Game[]> {
    const response: any = await this._client.request(
      gql`
        query Games {
          games {
            ${this.fieldsOnGame()}
          }
        }
      `
    )
    return response.games
  }

  async getGame(gameId: string | ObjectId): Promise<Game> {
    const games = await this.getGames()
    const game = games.find((game) => game.id === gameId)
    if (!game) {
      throw Error(`Could not find game with ID "${gameId}"`)
    }
    return game
  }

  async setDeck({ deckId, gameId }: { gameId: string | ObjectId; deckId: string | ObjectId }): Promise<GameDeck> {
    const response: any = await this._client.request(
      gql`
        mutation SetDeck($game: ID!, $deck: ID!) {
          setDeck(game: $game, deck: $deck) {
            ${this.fieldsOnGameDeck()}
          }
        }
      `,
      {
        game: gameId.toString(),
        deck: deckId.toString(),
      }
    )
    return response.setDeck
  }

  async getGameDeck(gameId: string | ObjectId): Promise<GameDeck> {
    const response: any = await this._client.request(
      gql`
        query GameDeck($game: ID!) {
          gameDeck(game: $game) {
            ${this.fieldsOnGameDeck()}
          }
        }
      `,
      {
        game: gameId.toString(),
      }
    )
    return response.gameDeck
  }

  async playUnit({
    gameId,
    unitId,
    combat,
  }: {
    gameId: string | ObjectId
    unitId: string | ObjectId
    combat: Combat
  }): Promise<Game> {
    const response: any = await this._client.request(
      gql`
        mutation PlayUnit($game: ID!, $unit: ID!, $combat: Combat!) {
          playUnit(game: $game, unit: $unit, combat: $combat) {
            ${this.fieldsOnGame()}
          }
        }
      `,
      {
        game: gameId.toString(),
        unit: unitId.toString(),
        combat,
      }
    )
    return response.playUnit
  }

  async setOrder({ gameId, userIds }: { gameId: string | ObjectId; userIds: (string | ObjectId)[] }): Promise<Game> {
    const response: any = await this._client.request(
      gql`
        mutation SetOrder($game: ID!, $users: [ID!]) {
          setOrder(game: $game, users: $users) {
            ${this.fieldsOnGame()}
          }
        }
      `,
      {
        game: gameId.toString(),
        users: userIds.map((userId) => userId.toString()),
      }
    )
    return response.setOrder
  }

  async redraw({ gameId, unitId }: { gameId: string | ObjectId; unitId: string | ObjectId }): Promise<DeckUnit> {
    const response: any = await this._client.request(
      gql`
        mutation Redraw($game: ID!, $unit: ID!) {
          redraw(game: $game, unit: $unit) {
            ${this.fieldsOnDeckUnit()}
          }
        }
      `,
      {
        game: gameId.toString(),
        unit: unitId.toString(),
      }
    )
    return response.redraw
  }

  async ready(gameId: string | ObjectId): Promise<Game> {
    const response: any = await this._client.request(
      gql`
        mutation Ready($game: ID!) {
          ready(game: $game) {
            ${this.fieldsOnGame()}
          }
        }
      `,
      {
        game: gameId.toString(),
      }
    )
    return response.ready
  }

  async getSetting<T>(key: string): Promise<T> {
    const response: any = await this._client.request(
      gql`
        query Settings {
          settings {
            ${this.fieldsOnSetting()}
          }
        }
      `
    )
    const setting: Setting | undefined = response.settings.find((setting: Setting) => setting.key === key)
    if (!setting) {
      throw Error(`Could not find setting with key "${key}"`)
    }
    if (setting.type === SettingType.Number) {
      return Number(setting.value) as T
    }
    return setting.value as T
  }

  private fieldsOnDeck(): string {
    return gql`
      created
      faction {
        ${this.fieldsOnFaction()}
      }
      id
      leader {
        ${this.fieldsOnLeader()}
      }
      name
      stats {
        ${this.fieldsOnStats()}
      }
      units {
        ${this.fieldsOnDeckUnit()}
      }
      user {
        ${this.fieldsOnUser()}
      }
    `
  }

  private fieldsOnDeckUnit(): string {
    return gql`
      artStyle
      unit {
        ${this.fieldsOnUnit()}
      }
    `
  }

  private fieldsOnDlc(): string {
    return gql`
      created
      id
      image
      key
      name
    `
  }

  private fieldsOnEffect(): string {
    return gql`
      ability
      created
      id
      image
      key
      name
    `
  }

  private fieldsOnFaction(): string {
    return gql`
      ability
      created
      dlc {
        ${this.fieldsOnDlc()}
      }
      id
      image
      key
      name
      stats {
        ${this.fieldsOnStats()}
      }
    `
  }

  private fieldsOnGameDeck(): string {
    return gql`
      discard {
        ${this.fieldsOnDeckUnit()}
      }
      from {
        ${this.fieldsOnDeck()}
      }
      hand {
        ${this.fieldsOnDeckUnit()}
      }
      redraws {
        ${this.fieldsOnRedraw()}
      }
      undrawn {
        ${this.fieldsOnDeckUnit()}
      }
    `
  }

  private fieldsOnGamePlayer(): string {
    return gql`
      counts {
        discard
        hand
        undrawn
      }
      faction {
        ${this.fieldsOnFaction()}
      }
      leader {
        ${this.fieldsOnLeader()}
      }
      order
      ready
      rounds {
        ${this.fieldsOnPlayerRound()}
      }
      user {
        ${this.fieldsOnUser()}
      }
    `
  }

  private fieldsOnLeader(): string {
    return gql`
      ability
      created
      dlc {
        ${this.fieldsOnDlc()}
      }
      faction {
        ${this.fieldsOnFaction()}
      }
      id
      image
      name
      quote
    `
  }

  private fieldsOnMove(): string {
    return gql`
      ... on MoveLeader {
        created
        leader {
          ${this.fieldsOnLeader()}
        }
      }
      ... on MovePass {
        created
      }
      ... on MoveUnit {
        created
        row
        unit {
          ${this.fieldsOnDeckUnit()}
        }
      }
    `
  }

  private fieldsOnPlayerCombatRow(): string {
    return gql`
      score
      units {
        artStyle
        effectiveStrength
        unit {
          ${this.fieldsOnUnit()}
        }
      }
    `
  }

  private fieldsOnPlayerRound(): string {
    return gql`
      close {
        ${this.fieldsOnPlayerCombatRow()}
      }
      moves {
        ${this.fieldsOnMove()}
      }
      passed
      ranged {
        ${this.fieldsOnPlayerCombatRow()}
      }
      result
      score
      siege {
        ${this.fieldsOnPlayerCombatRow()}
      }
    `
  }

  private fieldsOnRedraw(): string {
    return gql`
      from {
        ${this.fieldsOnDeckUnit()}
      }
      to {
        ${this.fieldsOnDeckUnit()}
      }
    `
  }

  private fieldsOnSetting(): string {
    return gql`
      key
      label
      type
      value
    `
  }

  private fieldsOnStats(): string {
    return gql`
      agile
      avenger
      berserker
      bond
      close
      decoy
      heroes
      horn
      mardroeme
      medic
      morale
      muster
      ranged
      scorch
      siege
      specials
      spy
      strengthAverage
      strengths
      strengthTotal
      units
      weather
    `
  }

  private fieldsOnUnit(): string {
    return gql`
      combats
      created
      deckable
      dlc {
        ${this.fieldsOnDlc()}
      }
      effectPrefix
      effects {
        ${this.fieldsOnEffect()}
      }
      faction {
        ${this.fieldsOnFaction()}
      }
      hero
      id
      images
      name
      quote
      scorchMin
      scorchScope
      special
      strength
    `
  }

  private fieldsOnUser(): string {
    return gql`
      created
      id
      name
    `
  }

  private fieldsOnGame(): string {
    return gql`
      config {
        lives
      }
      created
      creator {
        ${this.fieldsOnUser()}
      }
      id
      players {
        ${this.fieldsOnGamePlayer()}
      }
      round
      status
      turn {
        ${this.fieldsOnGamePlayer()}
      }
      updated
      victors {
        ${this.fieldsOnUser()}
      }
      weather
    `
  }
}

export interface AddDeckInput {
  faction: FactionKey
  leaderName: string
  name: string
  unitNames: string[]
}
