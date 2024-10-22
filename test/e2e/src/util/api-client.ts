import { GraphQLClient, gql } from 'graphql-request'
import { ObjectId } from 'mongodb'
import urljoin from 'url-join'

import {
  Deck,
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
            id
            name
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

  async getFactions({ neutrals = true }: { neutrals?: boolean }): Promise<Faction[]> {
    const response: any = await this._client.request(
      gql`
        query Factions($neutrals: Boolean) {
          factions {
            id
            created
            name
            key
            image
            dlc {
              id
              name
              key
              image
            }
            ability
            stats(neutrals: $neutrals) {
              units
              strengths
              specials
              heroes
              close
              ranged
              siege
              agile
              strengthTotal
              strengthAverage
            }
          }
        }
      `,
      {
        neutrals,
      }
    )
    return response.factions
  }

  async getFaction({ key, neutrals = false }: { key: FactionKey; neutrals?: boolean }): Promise<Faction> {
    const factions = await this.getFactions({
      neutrals,
    })
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
            id
            created
            name
            faction {
              id
              created
              name
              key
              image
              dlc {
                id
                name
                key
                image
              }
              ability
              stats(neutrals: false) {
                units
                strengths
                specials
                heroes
                close
                ranged
                siege
                agile
                strengthTotal
                strengthAverage
              }
            }
            ability
            quote
            image
            dlc {
              id
              name
              key
              image
            }
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
            combats
            created
            deckable
            dlc {
              id
              image
              key
              name
            }
            effectPrefix
            effects {
              ability
              id
              image
              key
              name
            }
            faction {
              ability
              created
              dlc {
                id
                image
                key
                name
              }
              id
              image
              key
              name
              stats(neutrals: true) {
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
              }
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
        fragment FactionFragment on Faction {
          ability
          created
          dlc {
            id
            image
            key
            name
          }
          id
          image
          key
          name
          stats(neutrals: true) {
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
          }
        }
        mutation AddDeck($name: String!, $faction: FactionKey!, $leader: ID!, $units: [DeckUnitInput!]!) {
          addDeck(name: $name, faction: $faction, leader: $leader, units: $units) {
            created
            faction {
              ...FactionFragment
            }
            id
            leader {
              ability
              created
              dlc {
                id
                image
                key
                name
              }
              faction {
                ...FactionFragment
              }
              id
              image
              name
              quote
            }
            name
            stats {
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
            }
            units {
              artStyle
              unit {
                combats
                created
                deckable
                dlc {
                  id
                  image
                  key
                  name
                }
                effectPrefix
                effects {
                  ability
                  created
                  id
                  image
                  key
                  name
                }
                faction {
                  ...FactionFragment
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
              }
            }
            user {
              created
              id
              name
            }
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
            created
            faction {
              ability
              created
              dlc {
                id
                image
                key
                name
              }
              id
              image
              key
              name
              stats(neutrals: true) {
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
              }
            }
            id
            leader {
              ability
              created
              dlc {
                id
                image
                key
                name
              }
              id
              image
              name
              quote
            }
            name
            stats {
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
            }
            units {
              artStyle
              unit {
                combats
                created
                deckable
                dlc {
                  id
                  image
                  key
                  name
                }
                effectPrefix
                effects {
                  ability
                  created
                  id
                  image
                  key
                  name
                }
                faction {
                  ability
                  created
                  dlc {
                    id
                    image
                    key
                    name
                  }
                  id
                  image
                  key
                  name
                  stats(neutrals: true) {
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
                  }
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
              }
            }
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
        fragment UserFragment on User {
          created
          id
          name
        }
        mutation AddGame($opponentNames: [String!]!) {
          addGame(opponentNames: $opponentNames) {
            created
            creator {
              ...UserFragment
            }
            id
            players {
              counts {
                discard
                hand
                undrawn
              }
              faction {
                ability
                created
                dlc {
                  id
                  image
                  key
                  name
                }
                id
                image
                key
                name
                stats(neutrals: true) {
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
                }
              }
              leader {
                ability
                created
                dlc {
                  id
                  image
                  key
                  name
                }
              }
              ready
              rounds {
                score
                won
              }
              user {
                ...UserFragment
              }
            }
            round {
              current
              maximum
            }
            status
            updated
            victors {
              ...UserFragment
            }
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
            created
            creator {
              created
              id
              name
            }
            id
            players {
              counts {
                discard
                hand
                undrawn
              }
              faction {
                ability
                created
                dlc {
                  id
                  image
                  key
                  name
                }
                id
                image
                key
                name
                stats(neutrals: true) {
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
                }
              }
              leader {
                ability
                created
                dlc {
                  id
                  image
                  key
                  name
                }
              }
              ready
              rounds {
                score
                won
              }
              user {
                created
                id
                name
              }
            }
            round {
              current
              maximum
            }
            status
            updated
            victors {
              created
              id
              name
            }
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
        fragment DeckUnitFragment on DeckUnit {
          artStyle
          unit {
            combats
            created
            deckable
            dlc {
              id
              image
              key
              name
            }
            effectPrefix
            effects {
              ability
              created
              id
              image
              key
              name
            }
            faction {
              ability
              created
              dlc {
                id
                image
                key
                name
              }
              id
              image
              key
              name
              stats(neutrals: true) {
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
              }
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
          }
        }
        mutation SetDeck($game: ID!, $deck: ID!) {
          setDeck(game: $game, deck: $deck) {
            discard {
              ...DeckUnitFragment
            }
            from {
              created
              faction {
                ability
                created
                dlc {
                  id
                  image
                  key
                  name
                }
                id
                image
                key
                name
                stats(neutrals: true) {
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
                }
              }
              id
              leader {
                ability
                created
                dlc {
                  id
                  image
                  key
                  name
                }
              }
              name
              stats {
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
              }
              units {
                ...DeckUnitFragment
              }
            }
            hand {
              ...DeckUnitFragment
            }
            redraws {
              from {
                ...DeckUnitFragment
              }
              to {
                ...DeckUnitFragment
              }
            }
            undrawn {
              ...DeckUnitFragment
            }
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
        fragment FactionFragment on Faction {
          ability
          created
          dlc {
            id
            image
            key
            name
          }
          id
          image
          key
          name
          stats(neutrals: true) {
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
          }
        }
        fragment DeckUnitFragment on DeckUnit {
          artStyle
          unit {
            combats
            created
            deckable
            dlc {
              id
              image
              key
              name
            }
            effectPrefix
            effects {
              ability
              created
              id
              image
              key
              name
            }
            faction {
              ...FactionFragment
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
          }
        }
        query GameDeck($game: ID!) {
          gameDeck(game: $game) {
            discard {
              ...DeckUnitFragment
            }
            from {
              created
              faction {
                ...FactionFragment
              }
              id
              leader {
                ability
                created
                dlc {
                  id
                  image
                  key
                  name
                }
                faction {
                  ...FactionFragment
                }
                id
                image
                name
                quote
              }
              name
              stats {
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
              }
              units {
                ...DeckUnitFragment
              }
            }
            hand {
              ...DeckUnitFragment
            }
            redraws {
              from {
                ...DeckUnitFragment
              }
              to {
                ...DeckUnitFragment
              }
            }
            undrawn {
              ...DeckUnitFragment
            }
          }
        }
      `,
      {
        game: gameId.toString(),
      }
    )
    return response.gameDeck
  }

  async ready(gameId: string | ObjectId): Promise<Game> {
    const response: any = await this._client.request(
      gql`
        fragment UserFragment on User {
          created
          id
          name
        }
        mutation Ready($game: ID!) {
          ready(game: $game) {
            created
            creator {
              ...UserFragment
            }
            id
            players {
              counts {
                discard
                hand
                undrawn
              }
              faction {
                ability
                created
                dlc {
                  id
                  image
                  key
                  name
                }
                id
                image
                key
                name
                stats(neutrals: true) {
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
                }
              }
              leader {
                ability
                created
                dlc {
                  id
                  image
                  key
                  name
                }
              }
              ready
              rounds {
                score
                won
              }
              user {
                ...UserFragment
              }
            }
            round {
              current
              maximum
            }
            status
            updated
            victors {
              ...UserFragment
            }
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
            key
            label
            type
            value
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
}

export interface AddDeckInput {
  faction: FactionKey
  leaderName: string
  name: string
  unitNames: string[]
}
