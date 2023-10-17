import gql from 'graphql-tag'

// TODO: change to schema.gql?
export default gql`
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

  type Query {
    "Returns all non-leader cards available to build decks with."
    units: [Unit!]!

    "Returns all leader cards available to build decks with."
    leaders: [Leader!]!

    "The current version of the application running."
    version: SemVer!

    "The current build number of the application running."
    build: Int!
  }
`
