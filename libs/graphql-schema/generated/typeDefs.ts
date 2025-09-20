import gql from 'graphql-tag';
export const typeDefs = gql`
# Scalar definitions defined in ./scalars.ts
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
  "Players are choosing their decks to use for the game."
  DECKING
  "The order of player turns is being decided. Happens automatically unless there is a single player with a Scoia'tael faction deck who can then choose which player starts."
  ORDERING
  "Players are potentially redrawing the cards in their hand."
  REDRAWING
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

enum MoveReasonType {
  "Deployment by a game player to the battlefield."
  DEPLOY
  "Mustered when matching Muster unit added to battlefield."
  MUSTER
  "Revived by Medic added to battlefield."
  REVIVE
  "Summoned when matching Avenger unit removed from battlefield."
  SUMMON
  "Transformed when Mardroeme unit added to battlefield row."
  TRANSFORM
}

enum GameUnitOrigin {
  "Unit came from the users Hand."
  HAND
  "Unit came from the users Lost pile."
  Discard
  "Unit came from an opponent placing it on their battlefield."
  OPPONENT
  "Unit came from the users Draw pile."
  UNDRAWN
  "Unit came from a non-deckable source."
  NONDECK
}

enum RoundResult {
  "Beat all other players in the round."
  WON
  "Beaten by another player in the round."
  LOST
  "Tied for the win with another player in the round."
  DREW
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

type Deck {
  created: DateTime! 
  faction: Faction! 
  id: ID! 
  leader: Leader! 
  name: String! 
  stats: UnitStats! 
  units: [DeckUnit!]! 
  user: User! 
}

type DeckUnit {
  artStyle: Int! 
  unit: Unit! 
}

type Dlc {
  created: DateTime! 
  id: ID! 
  image: String! 
  key: DlcKey! 
  name: String! 
}

type Effect {
  ability: String! 
  created: DateTime! 
  id: ID! 
  image: String! 
  key: EffectKey! 
  name: String! 
}

type Faction {
  ability: String 
  created: DateTime! 
  dlc: Dlc 
  id: ID! 
  image: String! 
  key: FactionKey! 
  name: String! 
  stats: UnitStats! 
}

type Game {
  config: GameConfig! 
  created: DateTime! 
  creator: User! 
  id: ID! 
  players: [GamePlayer!]! 
  "The current round the game is in. 1-based indexing. A value of zero indicates the game has not yet started."
  round: Int! 
  status: GameStatus! 
  "Whose turn it currently is to make a move."
  turn: GamePlayer 
  updated: DateTime! 
  victors: [User!]! 
  weather: [Combat!]! 
}

type GameConfig {
  "The number of lives each player starts with at the beginning of the game."
  lives: Int! 
}

type GameDeck {
  "The units which have been sent to the graveyard"
  discard: [DeckUnit!]! 
  "A snapshot of the user deck when it was selected for the game"
  from: Deck 
  "The currently playable units"
  hand: [DeckUnit!]! 
  "Units which the player has chosen to redraw to be replaced by a different random undrawn unit."
  redraws: [Redraw!]! 
  "The units which have not yet been drawn"
  undrawn: [DeckUnit!]! 
}

type GamePlayer {
  "The number of cards in the game deck of the player. Only visible once all players are ready."
  counts: GamePlayerUnitCounts
  "The faction the player chose for the game. Only visible once all players are ready."
  faction: Faction
  "The leader the player chose for the game. Only visible once all players are ready."
  leader: Leader
  "The precedence of order the player takes their turn relative to other players. Zero based indexing."
  order: Int 
  "Whether or not a user has their game deck set to play the game."
  ready: Boolean! 
  rounds: [PlayerRound!]! 
  user: User! 
}

type GamePlayerUnitCounts {
  discard: Int!
  hand: Int!
  undrawn: Int!
}

type GameUnit {
  artStyle: Int! 
  effectiveStrength: Int 
  effects: [GameUnitEffect!] 
  row: Combat 
  unit: Unit! 
}

type GameUnitEffect {
  operator: String! 
  reason: EffectReason! 
  total: Int! 
}

type EffectFromUnit {
  effect: Effect! 
  unit: Unit! 
}

type EffectFromLeader {
  leader: Leader! 
}

union EffectReason  = EffectFromUnit | EffectFromLeader

type Leader {
  ability: String! 
  created: DateTime! 
  dlc: Dlc 
  faction: Faction! 
  id: ID! 
  image: String! 
  name: String! 
  quote: String! 
}

"A unit which was impacted by another unit."
type Impact {
  unit: GameUnit! 
  user: User! 
  source: GameUnitSource 
}

type MoveLeader {
  created: DateTime! 
  leader: Leader! 
}

type MovePass {
  created: DateTime! 
}

type MoveUnit {
  created: DateTime! 
  unit: GameUnit! 
  impacts: [Impact!] 
  reason: MoveUnitReason! 
  source: GameUnitSource! 
}

type MoveUnitReason {
  type: MoveReasonType! 
  unit: DeckUnit 
}

type GameUnitSource {
  origin: GameUnitOrigin! 
  user: User 
}

union Move  = MoveLeader | MovePass | MoveUnit

type PlayerRound {
  close: PlayerCombatRow! 
  moves: [Move!]! 
  passed: Boolean! 
  ranged: PlayerCombatRow! 
  result: RoundResult 
  score: Int! 
  siege: PlayerCombatRow! 
}

type PlayerCombatRow {
  score: Int! 
  units: [GameUnit!]! 
}

type Redraw {
  from: DeckUnit! 
  to: DeckUnit! 
}

type Setting {
  key: SettingKey!
  label: String!
  type: SettingType!
  value: String!
}

type Unit {
  combats: [Combat!] 
  created: DateTime! 
  deckable: Boolean! 
  dlc: Dlc 
  effectPrefix: String 
  effects: [Effect!] 
  faction: Faction! 
  hero: Boolean 
  id: ID! 
  images: [String!]! 
  name: String! 
  quote: String! 
  scorchMin: Int 
  scorchScope: Combat 
  special: Boolean 
  strength: Int 
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

type User {
  created: DateTime! 
  id: ID! 
  name: String! 
}

type GameDeckSet {
  deck: GameDeck!
  game: Game!
}

type GameUnitRedrawn {
  from: DeckUnit!
  deck: GameDeck!
  game: Game!
  to: DeckUnit!
}

type RoundEndedForDeck {
  deck: GameDeck!
  game: Game!
}

type UnitPlayedFromDeck {
  deck: GameDeck!
  game: Game!
  unit: DeckUnit!
}

type UnitPlayedOnGame {
  game: Game!
  unit: DeckUnit!
}

input DeckUnitInput {
  "For units with multiple art styles, the art style to use (1-based indexing)."
  artStyle: Int = 1
  id: ID!
}

type Query {
  "Information about the application running."
  application: Application!

  "All decks created by the authenticated user."
  decks: [Deck!]!

  "The current user on the session if they are authenticated."
  currentUser: User

  "All factions which a leader, unit or deck can belong to."
  factions(keys: [FactionKey!]): [Faction!]!

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

  "Pass for the rest of the round in a game."
  playPass(game: ID!): Game!

  "Play a Unit card in a game. If a unit is eligible for multiple different types of Combat, one must be specified."
  playUnit(game: ID!, unit: ID!, combat: Combat): Game!

  "Mark player as ready to play the game, no more deck modifications allowed."
  ready(game: ID!): Game!

  "Replace a card in hand with a random one from the deck, before a game starts."
  redraw(game: ID!, unit: ID!): DeckUnit!

  "Choose which deck will be used for the game."
  setDeck(game: ID!, deck: ID!): GameDeck!

  "Set the order in which players will take turns during a game."
  setOrder(game: ID!, users: [ID!]): Game!
}

type Subscription {
  "A deck has been added for a user."
  deckAdded: Deck!
  "A deck has been set for a game the user is a player on."
  deckSet: GameDeckSet!
  "A game has been added that the user is player on."
  gameAdded: Game!
  "A game the user is a player on has been marked as ready by a player."
  gameReady: Game!
  "All decks have been set for a game the user is a player on."
  gameSet: Game!
  "The order has been set for a game the user is a player on."
  orderSet: Game!
  "A user has passed the rest of the round for a game."
  passPlayed: Game!
  "A round has finished which triggers updates to the GameDeck for each player on the game."
  roundEndedForDeck: RoundEndedForDeck!
  "The unit card played from a deck and the updated GameDeck."
  unitPlayedFromDeck: UnitPlayedFromDeck!
  "The unit card played on a game and the updated Game."
  unitPlayedOnGame: UnitPlayedOnGame!
  "A unit was redrawn for a game deck the user owns."
  unitRedrawn: GameUnitRedrawn!
}

`;