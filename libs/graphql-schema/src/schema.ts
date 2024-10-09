import gql from 'graphql-tag'

// Note: scalar descriptions defined in scalars.ts
export default gql`
  scalar DateTime
  scalar SemVer

  enum Combat {
    "Close"
    CLOSE
    "Ranged"
    RANGED
    "Siege"
    SIEGE
  }

  enum DlcKey {
    "Blood and Wine"
    BLOOD_AND_WINE
    "Gwent: The Witcher Card Game"
    GWENT_THE_WITCHER_CARD_GAME
    "Hearts of Stone"
    HEARTS_OF_STONE
  }

  enum EffectKey {
    "Agile"
    AGILE
    "Summon Avenger"
    AVENGER
    "Berserker"
    BERSERKER
    "Tight Bond"
    BOND
    "Decoy"
    DECOY
    "Commander's Horn"
    HORN
    "Mardroeme"
    MARDROEME
    "Medic"
    MEDIC
    "Morale Boost"
    MORALE
    "Muster"
    MUSTER
    "Scorch"
    SCORCH
    "Spy"
    SPY
    "Weather"
    WEATHER
  }

  enum FactionKey {
    "Monsters"
    MONSTERS
    "Neutral"
    NEUTRAL
    "Nilfgaardian Empire"
    NILFGAARDIAN_EMPIRE
    "Northern Realms"
    NORTHERN_REALMS
    "Scoia'tael"
    SCOIA_TAEL
    "Skellige"
    SKELLIGE
  }

  enum GameStatus {
    "Players are choosing the decks and hand to use for the game."
    DECKING
    "Players are playing rounds of the game."
    PLAYING
    "Play has ended."
    DONE
  }

  enum GameDeckStatus {
    "Player is choosing their deck to use for the game."
    CHOOSING
    "Player is optionally selecting units to redraw from their selected deck."
    REDRAWING
    "Player game deck is finalized and ready to play."
    SET
  }

  enum SettingKey {
    SESSION_TIMEOUT_SECONDS
  }

  enum SettingType {
    NUMBER
  }

  type Application {
    "The current build number of the application running."
    build: Int!
    "The current version of the application running."
    version: SemVer!
  }

  type Deck @entity {
    created: DateTime! @column
    faction: Faction! @column(overrideType: "ObjectId")
    id: ID! @id @map(path: "_id")
    leader: Leader! @column(overrideType: "ObjectId")
    name: String! @column
    stats(neutrals: Boolean = false): UnitStats! @column
    units: [DeckUnit!]! @column(overrideType: "Array<DeckUnitDbObject>")
    user: User! @column(overrideType: "ObjectId")
  }

  type DeckUnit @entity {
    artStyle: Int! @column
    unit: Unit! @column(overrideType: "ObjectId")
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

  type Game @entity {
    created: DateTime! @column
    creator: User! @column(overrideType: "ObjectId")
    id: ID! @id @map(path: "_id")
    players: [GamePlayer!]! @column(overrideType: "Array<GamePlayerDbObject>")
    round: GameRound! @column
    status: GameStatus!
    updated: DateTime! @column
    victors: [User!]! @column(overrideType: "Array<ObjectId>")
  }

  type GameDeck @entity {
    "The units which have been sent to the graveyard"
    discard: [DeckUnit!]! @column(overrideType: "Array<DeckUnitDbObject>")
    "A snapshot of the user deck when it was selected for the game"
    from: Deck @column(overrideType: "DeckDbObject")
    "The currently playable units"
    hand: [DeckUnit!]! @column(overrideType: "Array<DeckUnitDbObject>")
    "Units which the player has chosen to redraw to be replaced by a different random undrawn unit."
    redraws: [Redraw!]! @column(overrideType: "Array<RedrawDbObject>")
    "The units which have not yet been drawn"
    undrawn: [DeckUnit!]! @column(overrideType: "Array<DeckUnitDbObject>")
  }

  type GameRound {
    current: Int! @column
    maximum: Int! @column
  }

  type Redraw @entity {
    from: DeckUnit! @column(overrideType: "DeckUnitDbObject")
    to: DeckUnit! @column(overrideType: "DeckUnitDbObject")
  }

  type GamePlayer @entity(additionalFields: [{ path: "deck", type: "GameDeckDbObject" }]) {
    "The number of cards in the game deck of the player. Only visible once all players are ready."
    counts: GamePlayerUnitCounts
    "The faction the player chose for the game. Only visible once all players are ready."
    faction: Faction
    "The leader the player chose for the game. Only visible once all players are ready."
    leader: Leader
    "Whether or not a user has their game deck set to play the game."
    ready: Boolean! @column
    rounds: [PlayerRound!]! @column
    user: User! @column(overrideType: "ObjectId")
  }

  type GamePlayerUnitCounts {
    discard: Int!
    hand: Int!
    undrawn: Int!
  }

  type PlayerRound {
    score: Int!
    won: Boolean!
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

  type Setting {
    key: SettingKey!
    label: String!
    type: SettingType!
    value: String!
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

  type User @entity(additionalFields: [{ path: "password", type: "string" }]) {
    created: DateTime! @column(overrideType: "Date")
    id: ID! @id
    name: String! @column
  }

  input DeckUnitInput {
    "For units with multiple art styles, the art style to use (1-based indexing)."
    artStyle: Int = 1
    id: ID!
  }

  input GamePlayerInput {
    user: ID!
    deck: ID!
  }

  type Query {
    "Information about the application running."
    application: Application!

    "All decks created by the authenticated user."
    decks: [Deck!]!

    "The current user on the session if they are authenticated."
    currentUser: User

    "All factions which a leader, unit or deck can belong to."
    factions: [Faction!]!

    "A game by its ID."
    game(id: ID!): Game!

    "The deck selected to be played for the given game."
    gameDeck(game: ID!): GameDeck

    "All games which a user created or is part of."
    games: [Game!]!

    "All leaders available to build decks with."
    leaders(factions: [FactionKey!]): [Leader!]!

    "The settings configured for the application."
    settings: [Setting!]!

    "All units available to build decks with."
    units(factions: [FactionKey!], deckable: Boolean): [Unit!]!
  }

  type Mutation {
    "Create a user-defined deck."
    addDeck(name: String!, faction: FactionKey!, leader: ID!, units: [DeckUnitInput!]!): Deck!

    "Create a game of Gwent between the authenticated user and another player."
    addGame(opponentNames: [String!]!): Game!

    "Create a user."
    addUser(name: String!, password: String!): User!

    "Authenticate a user."
    login(name: String!, password: String!): User!

    "De-authenticate a user."
    logout: Boolean!

    "Mark player as ready to play the game, no more deck modifications allowed."
    ready(game: ID!): Game!

    "Replace a card in hand with a random one from the deck, before a game starts."
    redraw(game: ID!, unit: ID!): DeckUnit!

    "Choose which deck will be used for the game."
    setDeck(game: ID!, deck: ID!): GameDeck!
  }

  type Subscription {
    deckAdded: Deck!
    gameAdded: Game!
  }
`
