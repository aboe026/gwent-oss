import gql from 'graphql-tag'

export default gql`
  scalar DateTime
  scalar SemVer

  enum FactionKey {
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

  enum EffectKey {
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

  enum DlcKey {
    BLOOD_AND_WINE
    GWENT_THE_WITCHER_CARD_GAME
    HEARTS_OF_STONE
  }

  type Dlc @entity {
    created: DateTime! @column
    id: ID! @id @map(path: "_id")
    image: String! @column
    key: DlcKey! @column
    name: String! @column
  }

  type Effect @entity {
    ability: String! @column
    created: DateTime! @column
    id: ID! @id @map(path: "_id")
    image: String! @column
    key: EffectKey! @column
    name: String! @column
  }

  type Faction @entity {
    ability: String @column
    created: DateTime! @column
    dlc: Dlc @column(overrideType: "ObjectId")
    id: ID! @id @map(path: "_id")
    image: String! @column
    key: FactionKey! @column
    name: String! @column
    stats(neutrals: Boolean = false): UnitStats! @column
  }

  type Leader @entity {
    ability: String! @column
    created: DateTime! @column
    dlc: Dlc @column(overrideType: "ObjectId")
    faction: Faction! @column(overrideType: "ObjectId")
    id: ID! @id @map(path: "_id")
    image: String! @column
    name: String! @column
    quote: String! @column
  }

  type Unit @entity {
    combats: [Combat!] @column
    created: DateTime! @column
    deckable: Boolean! @column
    dlc: Dlc @column(overrideType: "ObjectId")
    effectPrefix: String @column
    effects: [Effect!] @column(overrideType: "ObjectId[]")
    faction: Faction! @column(overrideType: "ObjectId")
    hero: Boolean @column
    id: ID! @id @map(path: "_id")
    images: [String!]! @column
    name: String! @column
    quote: String! @column
    scorchMin: Int @column
    scorchScope: Combat @column
    special: Boolean @column
    strength: Int @column
  }

  type DeckCard {
    artStyle: Int!
    unit: Unit!
  }

  type UnitStats {
    agile: Int!
    avenger: Int!
    berserker: Int!
    bond: Int!
    close: Int!
    decoy: Int!
    heroes: Int!
    horn: Int!
    mardroeme: Int!
    medic: Int!
    morale: Int!
    muster: Int!
    ranged: Int!
    strengths: Int!
    scorch: Int!
    siege: Int!
    specials: Int!
    spy: Int!
    strengthAverage: Float!
    strengthTotal: Int!
    units: Int!
    weather: Int!
  }

  type Deck @entity {
    created: DateTime! @column
    faction: Faction! @column(overrideType: "ObjectId")
    id: ID! @id @map(path: "_id")
    leader: Leader! @column(overrideType: "ObjectId")
    name: String! @column
    stats: UnitStats! @column
    units: [DeckCard!]! @column
    user: User! @column(overrideType: "ObjectId")
  }

  type User @entity {
    created: DateTime! @column
    id: ID! @id
    name: String! @column
  }

  input DeckCardInput {
    "For units with multiple art styles, the art style to use (1-based indexing)."
    artStyle: Int = 1
    id: ID!
  }

  enum SettingKey {
    SESSION_TIMEOUT_SECONDS
  }

  enum SettingType {
    NUMBER
  }

  type Setting {
    key: SettingKey!
    label: String!
    type: SettingType!
    value: String!
  }

  type Application {
    "The current build number of the application running."
    build: Int!
    "The current version of the application running."
    version: SemVer!
  }

  type Query {
    "Information about the application running."
    application: Application!

    "All decks created by the authenticated user."
    decks: [Deck!]

    "The current user on the session if they are authenticated."
    currentUser: User

    "All factions which a leader, unit or deck can belong to."
    factions: [Faction!]!

    "All leaders available to build decks with."
    leaders(factions: [FactionKey!]): [Leader!]!

    "The settings configured for the application."
    settings: [Setting!]!

    "All units available to build decks with."
    units(factions: [FactionKey!], deckable: Boolean): [Unit!]!
  }

  type Mutation {
    "Create a user-defined deck."
    addDeck(name: String!, faction: FactionKey!, leader: ID!, units: [DeckCardInput!]!): Deck

    "Create a user."
    addUser(name: String!, password: String!): User

    "Authenticate a user."
    login(name: String!, password: String!): User

    "De-authenticate a user."
    logout: Boolean
  }
`
