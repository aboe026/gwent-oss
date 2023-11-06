import { applyMiddleware } from 'graphql-middleware'
import { DIRECTIVES } from '@graphql-codegen/typescript-mongodb'
import gql from 'graphql-tag'
import { makeExecutableSchema } from '@graphql-tools/schema'

import permissions from './permissions'
import resolvers from './resolvers'

const schema = gql`
  scalar SemVer

  enum Faction {
    MONSTERS
    NEUTRAL
    NILFGAARDIAN_EMPIRE
    NORTHERN_REALMS
    SCOIA_TAEL
    SKELLIGE
  }

  enum Combat {
    CLOSE
    RANGED
    SIEGE
  }

  enum Effect {
    AGILE
    AVENGER
    BERSERKER
    BOND
    DECOY
    HORN
    MARDROEME
    MEDIC
    MORALE
    MUSTER
    SCORCH
    SPY
    WEATHER
  }

  enum DLC {
    BLOOD_AND_WINE
    GWENT_THE_WITCHER_CARD_GAME
    HEARTS_OF_STONE
  }

  type Leader @entity {
    id: ID! @id @map(path: "_id")
    name: String! @column
    faction: Faction! @column
    dlc: DLC @column
  }

  type Unit @entity {
    id: ID! @id @map(path: "_id")
    name: String! @column
    faction: Faction! @column
    occurrences: Int! @column
    dlc: DLC @column
    hero: Boolean @column
    combats: [Combat!] @column
    strength: Int @column
    effects: [Effect!] @column
    scorchScope: Combat @column
    scorchMin: Int @column
    musterPrefix: String @column
  }

  type User @entity {
    id: ID! @id
    name: String! @column
  }

  type Query {
    "Returns all non-leader cards available to build decks with."
    units: [Unit!]!

    "Returns all leader cards available to build decks with."
    leaders: [Leader!]!

    getCurrentUser: User

    "The current version of the application running."
    version: SemVer!

    "The current build number of the application running."
    build: Int!
  }

  type Mutation {
    addUser(name: String!, password: String!): User
    login(name: String!, password: String!): User
    logout: Boolean
  }
`

export default applyMiddleware(
  makeExecutableSchema({
    typeDefs: [DIRECTIVES, schema],
    resolvers,
  }),
  permissions
)
