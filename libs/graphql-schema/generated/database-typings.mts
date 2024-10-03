export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
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


export type DeckStatsArgs = {
  neutrals?: InputMaybe<Scalars['Boolean']['input']>;
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


export type FactionStatsArgs = {
  neutrals?: InputMaybe<Scalars['Boolean']['input']>;
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
  created: Scalars['DateTime']['output'];
  creator: User;
  id: Scalars['ID']['output'];
  players: Array<GamePlayer>;
  round: GameRound;
  status: GameStatus;
  updated: Scalars['DateTime']['output'];
  victors: Array<User>;
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
  /** Whether or not a user has their game deck set to play the game. */
  ready: Scalars['Boolean']['output'];
  rounds: Array<PlayerRound>;
  user: User;
};

export type GamePlayerInput = {
  deck: Scalars['ID']['input'];
  user: Scalars['ID']['input'];
};

export type GamePlayerUnitCounts = {
  __typename?: 'GamePlayerUnitCounts';
  discard: Scalars['Int']['output'];
  hand: Scalars['Int']['output'];
  undrawn: Scalars['Int']['output'];
};

export type GameRound = {
  __typename?: 'GameRound';
  current: Scalars['Int']['output'];
  maximum: Scalars['Int']['output'];
};

export enum GameStatus {
  /** Players are choosing the decks and hand to use for the game. */
  Decking = 'DECKING',
  /** Play has ended. */
  Done = 'DONE',
  /** Players are playing rounds of the game. */
  Playing = 'PLAYING'
}

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
  /** Mark player as ready to play the game, no more deck modifications allowed. */
  ready: Game;
  /** Replace a card in hand with a random one from the deck, before a game starts. */
  redraw: DeckUnit;
  /** Choose which deck will be used for the game. */
  setDeck: GameDeck;
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

export type PlayerRound = {
  __typename?: 'PlayerRound';
  score: Scalars['Int']['output'];
  won: Scalars['Boolean']['output'];
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
  name: Scalars['String']['output'];
  quote: Scalars['String']['output'];
  scorchMin?: Maybe<Scalars['Int']['output']>;
  scorchScope?: Maybe<Combat>;
  special?: Maybe<Scalars['Boolean']['output']>;
  strength?: Maybe<Scalars['Int']['output']>;
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

export type AdditionalEntityFields = {
  path?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
};

import { ObjectId } from 'mongodb';
export type DeckDbObject = {
  created: any,
  faction: ObjectId,
  _id: ObjectId,
  leader: ObjectId,
  name: string,
  stats: UnitStats,
  units: Array<DeckUnitDbObject>,
  user: ObjectId,
};

export type DeckUnitDbObject = {
  artStyle: number,
  unit: ObjectId,
};

export type DlcDbObject = {
  created: any,
  _id: ObjectId,
  image: string,
  key: string,
  name: string,
};

export type EffectDbObject = {
  ability: string,
  created: any,
  _id: ObjectId,
  image: string,
  key: string,
  name: string,
};

export type FactionDbObject = {
  ability?: Maybe<string>,
  created: any,
  dlc?: ObjectId,
  _id: ObjectId,
  image: string,
  key: string,
  name: string,
  stats: UnitStats,
};

export type GameDbObject = {
  created: any,
  creator: ObjectId,
  _id: ObjectId,
  players: Array<GamePlayerDbObject>,
  round: GameRound,
  updated: any,
  victors: Array<ObjectId>,
};

export type GameDeckDbObject = {
  discard: Array<DeckUnitDbObject>,
  from?: DeckDbObject,
  hand: Array<DeckUnitDbObject>,
  redraws: Array<RedrawDbObject>,
  undrawn: Array<DeckUnitDbObject>,
};

export type GamePlayerDbObject = {
  ready: boolean,
  rounds: Array<PlayerRound>,
  user: ObjectId,
  deck: GameDeckDbObject,
};

export type LeaderDbObject = {
  ability: string,
  created: any,
  dlc?: ObjectId,
  faction: ObjectId,
  _id: ObjectId,
  image: string,
  name: string,
  quote: string,
};

export type RedrawDbObject = {
  from: DeckUnitDbObject,
  to: DeckUnitDbObject,
};

export type UnitDbObject = {
  combats?: Maybe<Array<string>>,
  created: any,
  deckable: boolean,
  dlc?: ObjectId,
  effectPrefix?: Maybe<string>,
  effects?: ObjectId[],
  faction: ObjectId,
  hero?: Maybe<boolean>,
  _id: ObjectId,
  images: Array<string>,
  name: string,
  quote: string,
  scorchMin?: Maybe<number>,
  scorchScope?: Maybe<string>,
  special?: Maybe<boolean>,
  strength?: Maybe<number>,
};

export type UserDbObject = {
  created: Date,
  _id: ObjectId,
  name: string,
  password: string,
};
