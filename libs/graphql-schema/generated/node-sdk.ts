import { GraphQLClient, RequestOptions } from 'graphql-request';
import gql from 'graphql-tag';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
type GraphQLClientRequestHeaders = RequestOptions['requestHeaders'];
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  DateTime: { input: any; output: any; }
  SemVer: { input: any; output: any; }
};

export type Application = {
  __typename?: 'Application';
  /** The current build number of the application running. */
  build: Scalars['Int']['output'];
  /** The current version of the application running. */
  version: Scalars['SemVer']['output'];
};

export enum Combat {
  /** Close */
  Close = 'CLOSE',
  /** Ranged */
  Ranged = 'RANGED',
  /** Siege */
  Siege = 'SIEGE'
}

export type Deck = {
  __typename?: 'Deck';
  created: Scalars['DateTime']['output'];
  faction: Faction;
  id: Scalars['ID']['output'];
  leader: Leader;
  name: Scalars['String']['output'];
  stats: UnitStats;
  units: Array<DeckUnit>;
  user: User;
};

export type DeckUnit = {
  __typename?: 'DeckUnit';
  artStyle: Scalars['Int']['output'];
  unit: Unit;
};

export type DeckUnitInput = {
  /** For units with multiple art styles, the art style to use (1-based indexing). */
  artStyle?: InputMaybe<Scalars['Int']['input']>;
  id: Scalars['ID']['input'];
};

export type Dlc = {
  __typename?: 'Dlc';
  created: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  image: Scalars['String']['output'];
  key: DlcKey;
  name: Scalars['String']['output'];
};

export enum DlcKey {
  /** Blood and Wine */
  BloodAndWine = 'BLOOD_AND_WINE',
  /** Gwent: The Witcher Card Game */
  GwentTheWitcherCardGame = 'GWENT_THE_WITCHER_CARD_GAME',
  /** Hearts of Stone */
  HeartsOfStone = 'HEARTS_OF_STONE'
}

export type Effect = {
  __typename?: 'Effect';
  ability: Scalars['String']['output'];
  created: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  image: Scalars['String']['output'];
  key: EffectKey;
  name: Scalars['String']['output'];
};

export type EffectFromLeader = {
  __typename?: 'EffectFromLeader';
  leader: Leader;
};

export type EffectFromUnit = {
  __typename?: 'EffectFromUnit';
  effect: Effect;
  unit: Unit;
};

export enum EffectKey {
  /** Agile */
  Agile = 'AGILE',
  /** Summon Avenger */
  Avenger = 'AVENGER',
  /** Berserker */
  Berserker = 'BERSERKER',
  /** Tight Bond */
  Bond = 'BOND',
  /** Decoy */
  Decoy = 'DECOY',
  /** Commander's Horn */
  Horn = 'HORN',
  /** Mardroeme */
  Mardroeme = 'MARDROEME',
  /** Medic */
  Medic = 'MEDIC',
  /** Morale Boost */
  Morale = 'MORALE',
  /** Muster */
  Muster = 'MUSTER',
  /** Scorch */
  Scorch = 'SCORCH',
  /** Spy */
  Spy = 'SPY',
  /** Weather */
  Weather = 'WEATHER'
}

export type EffectReason = EffectFromLeader | EffectFromUnit;

export type Faction = {
  __typename?: 'Faction';
  ability?: Maybe<Scalars['String']['output']>;
  created: Scalars['DateTime']['output'];
  dlc?: Maybe<Dlc>;
  id: Scalars['ID']['output'];
  image: Scalars['String']['output'];
  key: FactionKey;
  name: Scalars['String']['output'];
  stats: UnitStats;
};

export enum FactionKey {
  /** Monsters */
  Monsters = 'MONSTERS',
  /** Neutral */
  Neutral = 'NEUTRAL',
  /** Nilfgaardian Empire */
  NilfgaardianEmpire = 'NILFGAARDIAN_EMPIRE',
  /** Northern Realms */
  NorthernRealms = 'NORTHERN_REALMS',
  /** Scoia'tael */
  ScoiaTael = 'SCOIA_TAEL',
  /** Skellige */
  Skellige = 'SKELLIGE'
}

export type Game = {
  __typename?: 'Game';
  config: GameConfig;
  created: Scalars['DateTime']['output'];
  creator: User;
  id: Scalars['ID']['output'];
  players: Array<GamePlayer>;
  /** The current round the game is in. 1-based indexing. A value of zero indicates the game has not yet started. */
  round: Scalars['Int']['output'];
  status: GameStatus;
  /** Whose turn it currently is to make a move. */
  turn?: Maybe<GamePlayer>;
  updated: Scalars['DateTime']['output'];
  victors: Array<User>;
  weather: Array<Combat>;
};

export type GameConfig = {
  __typename?: 'GameConfig';
  /** The number of lives each player starts with at the beginning of the game. */
  lives: Scalars['Int']['output'];
};

export type GameDeck = {
  __typename?: 'GameDeck';
  /** The units which have been sent to the graveyard */
  discard: Array<DeckUnit>;
  /** A snapshot of the user deck when it was selected for the game */
  from?: Maybe<Deck>;
  /** The currently playable units */
  hand: Array<DeckUnit>;
  /** Units which the player has chosen to redraw to be replaced by a different random undrawn unit. */
  redraws: Array<Redraw>;
  /** The units which have not yet been drawn */
  undrawn: Array<DeckUnit>;
};

export type GameDeckSet = {
  __typename?: 'GameDeckSet';
  deck: GameDeck;
  game: Game;
};

export enum GameDeckStatus {
  /** Player is choosing their deck to use for the game. */
  Choosing = 'CHOOSING',
  /** Player is optionally selecting units to redraw from their selected deck. */
  Redrawing = 'REDRAWING',
  /** Player game deck is finalized and ready to play. */
  Set = 'SET'
}

export type GamePlayer = {
  __typename?: 'GamePlayer';
  /** The number of cards in the game deck of the player. Only visible once all players are ready. */
  counts?: Maybe<GamePlayerUnitCounts>;
  /** The faction the player chose for the game. Only visible once all players are ready. */
  faction?: Maybe<Faction>;
  /** The leader the player chose for the game. Only visible once all players are ready. */
  leader?: Maybe<Leader>;
  /** The precedence of order the player takes their turn relative to other players. Zero based indexing. */
  order?: Maybe<Scalars['Int']['output']>;
  /** Whether or not a user has their game deck set to play the game. */
  ready: Scalars['Boolean']['output'];
  rounds: Array<PlayerRound>;
  user: User;
};

export type GamePlayerUnitCounts = {
  __typename?: 'GamePlayerUnitCounts';
  discard: Scalars['Int']['output'];
  hand: Scalars['Int']['output'];
  undrawn: Scalars['Int']['output'];
};

export enum GameStatus {
  /** Players are choosing their decks to use for the game. */
  Decking = 'DECKING',
  /** Play has ended. */
  Done = 'DONE',
  /** The order of player turns is being decided. Happens automatically unless there is a single player with a Scoia'tael faction deck who can then choose which player starts. */
  Ordering = 'ORDERING',
  /** Players are playing rounds of the game. */
  Playing = 'PLAYING',
  /** Players are potentially redrawing the cards in their hand. */
  Redrawing = 'REDRAWING'
}

export type GameUnit = {
  __typename?: 'GameUnit';
  artStyle: Scalars['Int']['output'];
  effectiveStrength?: Maybe<Scalars['Int']['output']>;
  effects?: Maybe<Array<GameUnitEffect>>;
  row?: Maybe<Combat>;
  unit: Unit;
};

export type GameUnitEffect = {
  __typename?: 'GameUnitEffect';
  operator: Scalars['String']['output'];
  reason: EffectReason;
  total: Scalars['Int']['output'];
};

export enum GameUnitOrigin {
  /** Unit came from the users Lost pile. */
  Discard = 'Discard',
  /** Unit came from the users Hand. */
  Hand = 'HAND',
  /** Unit came from a non-deckable source. */
  Nondeck = 'NONDECK',
  /** Unit came from an opponent placing it on their battlefield. */
  Opponent = 'OPPONENT',
  /** Unit came from the users Draw pile. */
  Undrawn = 'UNDRAWN'
}

export type GameUnitRedrawn = {
  __typename?: 'GameUnitRedrawn';
  deck: GameDeck;
  from: DeckUnit;
  game: Game;
  to: DeckUnit;
};

export type GameUnitSource = {
  __typename?: 'GameUnitSource';
  origin: GameUnitOrigin;
  user?: Maybe<User>;
};

/** A unit which was impacted by another unit. */
export type Impact = {
  __typename?: 'Impact';
  source?: Maybe<GameUnitSource>;
  unit: GameUnit;
  user: User;
};

export type Leader = {
  __typename?: 'Leader';
  ability: Scalars['String']['output'];
  created: Scalars['DateTime']['output'];
  dlc?: Maybe<Dlc>;
  faction: Faction;
  id: Scalars['ID']['output'];
  image: Scalars['String']['output'];
  name: Scalars['String']['output'];
  quote: Scalars['String']['output'];
};

export type Move = MoveLeader | MovePass | MoveUnit;

export type MoveLeader = {
  __typename?: 'MoveLeader';
  created: Scalars['DateTime']['output'];
  leader: Leader;
};

export type MovePass = {
  __typename?: 'MovePass';
  created: Scalars['DateTime']['output'];
};

export enum MoveReasonType {
  /** Deployment by a game player to the battlefield. */
  Deploy = 'DEPLOY',
  /** Mustered when matching Muster unit added to battlefield. */
  Muster = 'MUSTER',
  /** Revived by Medic added to battlefield. */
  Revive = 'REVIVE',
  /** Summoned when matching Avenger unit removed from battlefield. */
  Summon = 'SUMMON',
  /** Transformed when Mardroeme unit added to battlefield row. */
  Transform = 'TRANSFORM'
}

export type MoveUnit = {
  __typename?: 'MoveUnit';
  created: Scalars['DateTime']['output'];
  impacts?: Maybe<Array<Impact>>;
  reason: MoveUnitReason;
  source: GameUnitSource;
  unit: GameUnit;
};

export type MoveUnitReason = {
  __typename?: 'MoveUnitReason';
  type: MoveReasonType;
  unit?: Maybe<DeckUnit>;
};

export type Mutation = {
  __typename?: 'Mutation';
  /** Create a user-defined deck. */
  addDeck: Deck;
  /** Create a game of Gwent between the authenticated user and another player. */
  addGame: Game;
  /** Create a user. */
  addUser: User;
  /** Authenticate a user. */
  login: User;
  /** De-authenticate a user. */
  logout: Scalars['Boolean']['output'];
  /** Pass for the rest of the round in a game. */
  playPass: Game;
  /** Play a Unit card in a game. If a unit is eligible for multiple different types of Combat, one must be specified. */
  playUnit: Game;
  /** Mark player as ready to play the game, no more deck modifications allowed. */
  ready: Game;
  /** Replace a card in hand with a random one from the deck, before a game starts. */
  redraw: DeckUnit;
  /** Choose which deck will be used for the game. */
  setDeck: GameDeck;
  /** Set the order in which players will take turns during a game. */
  setOrder: Game;
};


export type MutationAddDeckArgs = {
  faction: FactionKey;
  leader: Scalars['ID']['input'];
  name: Scalars['String']['input'];
  units: Array<DeckUnitInput>;
};


export type MutationAddGameArgs = {
  opponentNames: Array<Scalars['String']['input']>;
};


export type MutationAddUserArgs = {
  name: Scalars['String']['input'];
  password: Scalars['String']['input'];
};


export type MutationLoginArgs = {
  name: Scalars['String']['input'];
  password: Scalars['String']['input'];
};


export type MutationPlayPassArgs = {
  game: Scalars['ID']['input'];
};


export type MutationPlayUnitArgs = {
  combat?: InputMaybe<Combat>;
  game: Scalars['ID']['input'];
  unit: Scalars['ID']['input'];
};


export type MutationReadyArgs = {
  game: Scalars['ID']['input'];
};


export type MutationRedrawArgs = {
  game: Scalars['ID']['input'];
  unit: Scalars['ID']['input'];
};


export type MutationSetDeckArgs = {
  deck: Scalars['ID']['input'];
  game: Scalars['ID']['input'];
};


export type MutationSetOrderArgs = {
  game: Scalars['ID']['input'];
  users?: InputMaybe<Array<Scalars['ID']['input']>>;
};

export type PlayerCombatRow = {
  __typename?: 'PlayerCombatRow';
  modifier?: Maybe<GameUnit>;
  score: Scalars['Int']['output'];
  units: Array<GameUnit>;
};

export type PlayerRound = {
  __typename?: 'PlayerRound';
  close: PlayerCombatRow;
  moves: Array<Move>;
  passed: Scalars['Boolean']['output'];
  ranged: PlayerCombatRow;
  result?: Maybe<RoundResult>;
  score: Scalars['Int']['output'];
  siege: PlayerCombatRow;
};

export type Query = {
  __typename?: 'Query';
  /** Information about the application running. */
  application: Application;
  /** The current user on the session if they are authenticated. */
  currentUser?: Maybe<User>;
  /** All decks created by the authenticated user. */
  decks: Array<Deck>;
  /** All factions which a leader, unit or deck can belong to. */
  factions: Array<Faction>;
  /** A game by its ID. */
  game: Game;
  /** The deck selected to be played for the given game. */
  gameDeck?: Maybe<GameDeck>;
  /** All games which a user created or is part of. */
  games: Array<Game>;
  /** All leaders available to build decks with. */
  leaders: Array<Leader>;
  /** The settings configured for the application. */
  settings: Array<Setting>;
  /** All units available to build decks with. */
  units: Array<Unit>;
};


export type QueryFactionsArgs = {
  keys?: InputMaybe<Array<FactionKey>>;
};


export type QueryGameArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGameDeckArgs = {
  game: Scalars['ID']['input'];
};


export type QueryLeadersArgs = {
  factions?: InputMaybe<Array<FactionKey>>;
};


export type QueryUnitsArgs = {
  deckable?: InputMaybe<Scalars['Boolean']['input']>;
  factions?: InputMaybe<Array<FactionKey>>;
};

export type Redraw = {
  __typename?: 'Redraw';
  from: DeckUnit;
  to: DeckUnit;
};

export type RoundEndedForDeck = {
  __typename?: 'RoundEndedForDeck';
  deck: GameDeck;
  game: Game;
};

export enum RoundResult {
  /** Tied for the win with another player in the round. */
  Drew = 'DREW',
  /** Beaten by another player in the round. */
  Lost = 'LOST',
  /** Beat all other players in the round. */
  Won = 'WON'
}

export type Setting = {
  __typename?: 'Setting';
  key: SettingKey;
  label: Scalars['String']['output'];
  type: SettingType;
  value: Scalars['String']['output'];
};

export enum SettingKey {
  SessionTimeoutSeconds = 'SESSION_TIMEOUT_SECONDS'
}

export enum SettingType {
  Number = 'NUMBER'
}

export type Subscription = {
  __typename?: 'Subscription';
  /** A deck has been added for a user. */
  deckAdded: Deck;
  /** A deck has been set for a game the user is a player on. */
  deckSet: GameDeckSet;
  /** A game has been added that the user is player on. */
  gameAdded: Game;
  /** A game the user is a player on has been marked as ready by a player. */
  gameReady: Game;
  /** All decks have been set for a game the user is a player on. */
  gameSet: Game;
  /** The order has been set for a game the user is a player on. */
  orderSet: Game;
  /** A user has passed the rest of the round for a game. */
  passPlayed: Game;
  /** A round has finished which triggers updates to the GameDeck for each player on the game. */
  roundEndedForDeck: RoundEndedForDeck;
  /** The unit card played from a deck and the updated GameDeck. */
  unitPlayedFromDeck: UnitPlayedFromDeck;
  /** The unit card played on a game and the updated Game. */
  unitPlayedOnGame: UnitPlayedOnGame;
  /** A unit was redrawn for a game deck the user owns. */
  unitRedrawn: GameUnitRedrawn;
};

export type Unit = {
  __typename?: 'Unit';
  combats?: Maybe<Array<Combat>>;
  created: Scalars['DateTime']['output'];
  deckable: Scalars['Boolean']['output'];
  dlc?: Maybe<Dlc>;
  effectPrefix?: Maybe<Scalars['String']['output']>;
  effects?: Maybe<Array<Effect>>;
  faction: Faction;
  hero?: Maybe<Scalars['Boolean']['output']>;
  id: Scalars['ID']['output'];
  images: Array<Scalars['String']['output']>;
  modifier: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  quote: Scalars['String']['output'];
  scorchMin?: Maybe<Scalars['Int']['output']>;
  scorchScope?: Maybe<Combat>;
  special?: Maybe<Scalars['Boolean']['output']>;
  strength?: Maybe<Scalars['Int']['output']>;
};

export type UnitPlayedFromDeck = {
  __typename?: 'UnitPlayedFromDeck';
  deck: GameDeck;
  game: Game;
  unit: DeckUnit;
};

export type UnitPlayedOnGame = {
  __typename?: 'UnitPlayedOnGame';
  game: Game;
  unit: DeckUnit;
};

export type UnitStats = {
  __typename?: 'UnitStats';
  agile: Scalars['Int']['output'];
  avenger: Scalars['Int']['output'];
  berserker: Scalars['Int']['output'];
  bond: Scalars['Int']['output'];
  close: Scalars['Int']['output'];
  decoy: Scalars['Int']['output'];
  heroes: Scalars['Int']['output'];
  horn: Scalars['Int']['output'];
  mardroeme: Scalars['Int']['output'];
  medic: Scalars['Int']['output'];
  morale: Scalars['Int']['output'];
  muster: Scalars['Int']['output'];
  ranged: Scalars['Int']['output'];
  scorch: Scalars['Int']['output'];
  siege: Scalars['Int']['output'];
  specials: Scalars['Int']['output'];
  spy: Scalars['Int']['output'];
  strengthAverage: Scalars['Float']['output'];
  strengthTotal: Scalars['Int']['output'];
  strengths: Scalars['Int']['output'];
  units: Scalars['Int']['output'];
  weather: Scalars['Int']['output'];
};

export type User = {
  __typename?: 'User';
  created: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};



export type SdkFunctionWrapper = <T>(action: (requestHeaders?:Record<string, string>) => Promise<T>, operationName: string, operationType?: string, variables?: any) => Promise<T>;


const defaultWrapper: SdkFunctionWrapper = (action, _operationName, _operationType, _variables) => action();

export function getSdk(client: GraphQLClient, withWrapper: SdkFunctionWrapper = defaultWrapper) {
  return {

  };
}
export type Sdk = ReturnType<typeof getSdk>;