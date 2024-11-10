import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
const defaultOptions = {} as const;
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
  /** Whose turn it currently is to make a move. */
  turn?: Maybe<GamePlayer>;
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
  /** Players are choosing their decks to use for the game. */
  Decking = 'DECKING',
  /** Play has ended. */
  Done = 'DONE',
  /** The order of player turns is being decided. Happens automatically unless there is a single player with a Scoia'tael faction deck who can then choose which player starts. */
  Ordering = 'ORDERING',
  /** Players are playing rounds of the game. */
  Playing = 'PLAYING',
  /** Players are potentially redrawing their hand cards. */
  Redrawing = 'REDRAWING'
}

export type GameUnitRedrawn = {
  __typename?: 'GameUnitRedrawn';
  from: DeckUnit;
  game: Game;
  to: DeckUnit;
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
  order?: InputMaybe<Array<Scalars['ID']['input']>>;
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

export type AddDeckMutationVariables = Exact<{
  name: Scalars['String']['input'];
  faction: FactionKey;
  leader: Scalars['ID']['input'];
  units: Array<DeckUnitInput> | DeckUnitInput;
}>;


export type AddDeckMutation = { __typename?: 'Mutation', addDeck: { __typename?: 'Deck', id: string, created: any, name: string, faction: { __typename?: 'Faction', key: FactionKey, id: string, name: string, image: string, ability?: string | null, dlc?: { __typename?: 'Dlc', name: string, image: string } | null, stats: { __typename?: 'UnitStats', agile: number, avenger: number, berserker: number, bond: number, decoy: number, horn: number, mardroeme: number, medic: number, morale: number, muster: number, scorch: number, spy: number, weather: number, close: number, ranged: number, siege: number, units: number, specials: number, heroes: number, strengthAverage: number, strengthTotal: number, strengths: number } }, leader: { __typename?: 'Leader', name: string, ability: string, image: string }, stats: { __typename?: 'UnitStats', units: number, specials: number, heroes: number, close: number, ranged: number, siege: number, agile: number, strengthTotal: number, strengthAverage: number } } };

export type AddGameMutationVariables = Exact<{
  opponentNames: Array<Scalars['String']['input']> | Scalars['String']['input'];
}>;


export type AddGameMutation = { __typename?: 'Mutation', addGame: { __typename?: 'Game', created: any, id: string, status: GameStatus, updated: any, creator: { __typename?: 'User', id: string, name: string }, players: Array<{ __typename?: 'GamePlayer', ready: boolean, counts?: { __typename?: 'GamePlayerUnitCounts', discard: number, hand: number, undrawn: number } | null, faction?: { __typename?: 'Faction', ability?: string | null, id: string, image: string, key: FactionKey, name: string } | null, leader?: { __typename?: 'Leader', ability: string, image: string, name: string } | null, rounds: Array<{ __typename?: 'PlayerRound', score: number }>, user: { __typename?: 'User', id: string, name: string } }>, round: { __typename?: 'GameRound', current: number, maximum: number }, turn?: { __typename?: 'GamePlayer', user: { __typename?: 'User', id: string, name: string } } | null, victors: Array<{ __typename?: 'User', id: string, name: string }> } };

export type AddUserMutationVariables = Exact<{
  name: Scalars['String']['input'];
  password: Scalars['String']['input'];
}>;


export type AddUserMutation = { __typename?: 'Mutation', addUser: { __typename?: 'User', id: string, name: string } };

export type ApplicationQueryVariables = Exact<{ [key: string]: never; }>;


export type ApplicationQuery = { __typename?: 'Query', application: { __typename?: 'Application', build: number, version: any } };

export type CardUnitFragmentFragment = { __typename?: 'Unit', combats?: Array<Combat> | null, deckable: boolean, hero?: boolean | null, id: string, images: Array<string>, name: string, quote: string, special?: boolean | null, strength?: number | null, dlc?: { __typename?: 'Dlc', name: string, image: string, key: DlcKey } | null, effects?: Array<{ __typename?: 'Effect', ability: string, image: string, key: EffectKey, name: string }> | null, faction: { __typename?: 'Faction', image: string, key: FactionKey, name: string } };

export type CurrentUserQueryVariables = Exact<{ [key: string]: never; }>;


export type CurrentUserQuery = { __typename?: 'Query', currentUser?: { __typename?: 'User', id: string, name: string, created: any } | null };

export type DeckAddedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type DeckAddedSubscription = { __typename?: 'Subscription', deckAdded: { __typename?: 'Deck', id: string, created: any, name: string, faction: { __typename?: 'Faction', key: FactionKey, id: string, name: string, image: string, ability?: string | null, dlc?: { __typename?: 'Dlc', name: string, image: string } | null, stats: { __typename?: 'UnitStats', agile: number, avenger: number, berserker: number, bond: number, decoy: number, horn: number, mardroeme: number, medic: number, morale: number, muster: number, scorch: number, spy: number, weather: number, close: number, ranged: number, siege: number, units: number, specials: number, heroes: number, strengthAverage: number, strengthTotal: number, strengths: number } }, leader: { __typename?: 'Leader', name: string, ability: string, image: string }, stats: { __typename?: 'UnitStats', units: number, specials: number, heroes: number, close: number, ranged: number, siege: number, agile: number, strengthTotal: number, strengthAverage: number } } };

export type DeckFragmentFragment = { __typename?: 'Deck', id: string, created: any, name: string, faction: { __typename?: 'Faction', key: FactionKey, id: string, name: string, image: string, ability?: string | null, dlc?: { __typename?: 'Dlc', name: string, image: string } | null, stats: { __typename?: 'UnitStats', agile: number, avenger: number, berserker: number, bond: number, decoy: number, horn: number, mardroeme: number, medic: number, morale: number, muster: number, scorch: number, spy: number, weather: number, close: number, ranged: number, siege: number, units: number, specials: number, heroes: number, strengthAverage: number, strengthTotal: number, strengths: number } }, leader: { __typename?: 'Leader', name: string, ability: string, image: string }, stats: { __typename?: 'UnitStats', units: number, specials: number, heroes: number, close: number, ranged: number, siege: number, agile: number, strengthTotal: number, strengthAverage: number } };

export type DeckSetSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type DeckSetSubscription = { __typename?: 'Subscription', deckSet: { __typename?: 'GameDeckSet', deck: { __typename?: 'GameDeck', discard: Array<{ __typename?: 'DeckUnit', artStyle: number, unit: { __typename?: 'Unit', combats?: Array<Combat> | null, deckable: boolean, hero?: boolean | null, id: string, images: Array<string>, name: string, quote: string, special?: boolean | null, strength?: number | null, dlc?: { __typename?: 'Dlc', name: string, image: string, key: DlcKey } | null, effects?: Array<{ __typename?: 'Effect', ability: string, image: string, key: EffectKey, name: string }> | null, faction: { __typename?: 'Faction', image: string, key: FactionKey, name: string } } }>, from?: { __typename?: 'Deck', created: any, id: string, name: string, faction: { __typename?: 'Faction', ability?: string | null, id: string, image: string, key: FactionKey, name: string }, leader: { __typename?: 'Leader', ability: string, image: string, name: string } } | null, hand: Array<{ __typename?: 'DeckUnit', artStyle: number, unit: { __typename?: 'Unit', combats?: Array<Combat> | null, deckable: boolean, hero?: boolean | null, id: string, images: Array<string>, name: string, quote: string, special?: boolean | null, strength?: number | null, dlc?: { __typename?: 'Dlc', name: string, image: string, key: DlcKey } | null, effects?: Array<{ __typename?: 'Effect', ability: string, image: string, key: EffectKey, name: string }> | null, faction: { __typename?: 'Faction', image: string, key: FactionKey, name: string } } }>, redraws: Array<{ __typename?: 'Redraw', from: { __typename?: 'DeckUnit', artStyle: number, unit: { __typename?: 'Unit', combats?: Array<Combat> | null, deckable: boolean, hero?: boolean | null, id: string, images: Array<string>, name: string, quote: string, special?: boolean | null, strength?: number | null, dlc?: { __typename?: 'Dlc', name: string, image: string, key: DlcKey } | null, effects?: Array<{ __typename?: 'Effect', ability: string, image: string, key: EffectKey, name: string }> | null, faction: { __typename?: 'Faction', image: string, key: FactionKey, name: string } } }, to: { __typename?: 'DeckUnit', artStyle: number, unit: { __typename?: 'Unit', combats?: Array<Combat> | null, deckable: boolean, hero?: boolean | null, id: string, images: Array<string>, name: string, quote: string, special?: boolean | null, strength?: number | null, dlc?: { __typename?: 'Dlc', name: string, image: string, key: DlcKey } | null, effects?: Array<{ __typename?: 'Effect', ability: string, image: string, key: EffectKey, name: string }> | null, faction: { __typename?: 'Faction', image: string, key: FactionKey, name: string } } } }>, undrawn: Array<{ __typename?: 'DeckUnit', artStyle: number, unit: { __typename?: 'Unit', combats?: Array<Combat> | null, deckable: boolean, hero?: boolean | null, id: string, images: Array<string>, name: string, quote: string, special?: boolean | null, strength?: number | null, dlc?: { __typename?: 'Dlc', name: string, image: string, key: DlcKey } | null, effects?: Array<{ __typename?: 'Effect', ability: string, image: string, key: EffectKey, name: string }> | null, faction: { __typename?: 'Faction', image: string, key: FactionKey, name: string } } }> }, game: { __typename?: 'Game', id: string } } };

export type DeckUnitFragmentFragment = { __typename?: 'DeckUnit', artStyle: number, unit: { __typename?: 'Unit', combats?: Array<Combat> | null, deckable: boolean, hero?: boolean | null, id: string, images: Array<string>, name: string, quote: string, special?: boolean | null, strength?: number | null, dlc?: { __typename?: 'Dlc', name: string, image: string, key: DlcKey } | null, effects?: Array<{ __typename?: 'Effect', ability: string, image: string, key: EffectKey, name: string }> | null, faction: { __typename?: 'Faction', image: string, key: FactionKey, name: string } } };

export type DecksQueryVariables = Exact<{ [key: string]: never; }>;


export type DecksQuery = { __typename?: 'Query', decks: Array<{ __typename?: 'Deck', id: string, created: any, name: string, faction: { __typename?: 'Faction', key: FactionKey, id: string, name: string, image: string, ability?: string | null, dlc?: { __typename?: 'Dlc', name: string, image: string } | null, stats: { __typename?: 'UnitStats', agile: number, avenger: number, berserker: number, bond: number, decoy: number, horn: number, mardroeme: number, medic: number, morale: number, muster: number, scorch: number, spy: number, weather: number, close: number, ranged: number, siege: number, units: number, specials: number, heroes: number, strengthAverage: number, strengthTotal: number, strengths: number } }, leader: { __typename?: 'Leader', name: string, ability: string, image: string }, stats: { __typename?: 'UnitStats', units: number, specials: number, heroes: number, close: number, ranged: number, siege: number, agile: number, strengthTotal: number, strengthAverage: number } }> };

export type FactionFragmentFragment = { __typename?: 'Faction', key: FactionKey, id: string, name: string, image: string, ability?: string | null, dlc?: { __typename?: 'Dlc', name: string, image: string } | null, stats: { __typename?: 'UnitStats', agile: number, avenger: number, berserker: number, bond: number, decoy: number, horn: number, mardroeme: number, medic: number, morale: number, muster: number, scorch: number, spy: number, weather: number, close: number, ranged: number, siege: number, units: number, specials: number, heroes: number, strengthAverage: number, strengthTotal: number, strengths: number } };

export type FactionsQueryVariables = Exact<{ [key: string]: never; }>;


export type FactionsQuery = { __typename?: 'Query', factions: Array<{ __typename?: 'Faction', key: FactionKey, id: string, name: string, image: string, ability?: string | null, dlc?: { __typename?: 'Dlc', name: string, image: string } | null, stats: { __typename?: 'UnitStats', agile: number, avenger: number, berserker: number, bond: number, decoy: number, horn: number, mardroeme: number, medic: number, morale: number, muster: number, scorch: number, spy: number, weather: number, close: number, ranged: number, siege: number, units: number, specials: number, heroes: number, strengthAverage: number, strengthTotal: number, strengths: number } }> };

export type GameQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GameQuery = { __typename?: 'Query', game: { __typename?: 'Game', created: any, id: string, status: GameStatus, updated: any, creator: { __typename?: 'User', id: string, name: string }, players: Array<{ __typename?: 'GamePlayer', ready: boolean, counts?: { __typename?: 'GamePlayerUnitCounts', discard: number, hand: number, undrawn: number } | null, faction?: { __typename?: 'Faction', ability?: string | null, id: string, image: string, key: FactionKey, name: string } | null, leader?: { __typename?: 'Leader', ability: string, image: string, name: string } | null, rounds: Array<{ __typename?: 'PlayerRound', score: number }>, user: { __typename?: 'User', id: string, name: string } }>, round: { __typename?: 'GameRound', current: number, maximum: number }, turn?: { __typename?: 'GamePlayer', user: { __typename?: 'User', id: string, name: string } } | null, victors: Array<{ __typename?: 'User', id: string, name: string }> } };

export type GameAddedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type GameAddedSubscription = { __typename?: 'Subscription', gameAdded: { __typename?: 'Game', created: any, id: string, status: GameStatus, updated: any, creator: { __typename?: 'User', id: string, name: string }, players: Array<{ __typename?: 'GamePlayer', ready: boolean, counts?: { __typename?: 'GamePlayerUnitCounts', discard: number, hand: number, undrawn: number } | null, faction?: { __typename?: 'Faction', ability?: string | null, id: string, image: string, key: FactionKey, name: string } | null, leader?: { __typename?: 'Leader', ability: string, image: string, name: string } | null, rounds: Array<{ __typename?: 'PlayerRound', score: number }>, user: { __typename?: 'User', id: string, name: string } }>, round: { __typename?: 'GameRound', current: number, maximum: number }, turn?: { __typename?: 'GamePlayer', user: { __typename?: 'User', id: string, name: string } } | null, victors: Array<{ __typename?: 'User', id: string, name: string }> } };

export type GameDeckQueryVariables = Exact<{
  game: Scalars['ID']['input'];
}>;


export type GameDeckQuery = { __typename?: 'Query', gameDeck?: { __typename?: 'GameDeck', discard: Array<{ __typename?: 'DeckUnit', artStyle: number, unit: { __typename?: 'Unit', combats?: Array<Combat> | null, deckable: boolean, hero?: boolean | null, id: string, images: Array<string>, name: string, quote: string, special?: boolean | null, strength?: number | null, dlc?: { __typename?: 'Dlc', name: string, image: string, key: DlcKey } | null, effects?: Array<{ __typename?: 'Effect', ability: string, image: string, key: EffectKey, name: string }> | null, faction: { __typename?: 'Faction', image: string, key: FactionKey, name: string } } }>, from?: { __typename?: 'Deck', created: any, id: string, name: string, faction: { __typename?: 'Faction', ability?: string | null, id: string, image: string, key: FactionKey, name: string }, leader: { __typename?: 'Leader', ability: string, image: string, name: string } } | null, hand: Array<{ __typename?: 'DeckUnit', artStyle: number, unit: { __typename?: 'Unit', combats?: Array<Combat> | null, deckable: boolean, hero?: boolean | null, id: string, images: Array<string>, name: string, quote: string, special?: boolean | null, strength?: number | null, dlc?: { __typename?: 'Dlc', name: string, image: string, key: DlcKey } | null, effects?: Array<{ __typename?: 'Effect', ability: string, image: string, key: EffectKey, name: string }> | null, faction: { __typename?: 'Faction', image: string, key: FactionKey, name: string } } }>, redraws: Array<{ __typename?: 'Redraw', from: { __typename?: 'DeckUnit', artStyle: number, unit: { __typename?: 'Unit', combats?: Array<Combat> | null, deckable: boolean, hero?: boolean | null, id: string, images: Array<string>, name: string, quote: string, special?: boolean | null, strength?: number | null, dlc?: { __typename?: 'Dlc', name: string, image: string, key: DlcKey } | null, effects?: Array<{ __typename?: 'Effect', ability: string, image: string, key: EffectKey, name: string }> | null, faction: { __typename?: 'Faction', image: string, key: FactionKey, name: string } } }, to: { __typename?: 'DeckUnit', artStyle: number, unit: { __typename?: 'Unit', combats?: Array<Combat> | null, deckable: boolean, hero?: boolean | null, id: string, images: Array<string>, name: string, quote: string, special?: boolean | null, strength?: number | null, dlc?: { __typename?: 'Dlc', name: string, image: string, key: DlcKey } | null, effects?: Array<{ __typename?: 'Effect', ability: string, image: string, key: EffectKey, name: string }> | null, faction: { __typename?: 'Faction', image: string, key: FactionKey, name: string } } } }>, undrawn: Array<{ __typename?: 'DeckUnit', artStyle: number, unit: { __typename?: 'Unit', combats?: Array<Combat> | null, deckable: boolean, hero?: boolean | null, id: string, images: Array<string>, name: string, quote: string, special?: boolean | null, strength?: number | null, dlc?: { __typename?: 'Dlc', name: string, image: string, key: DlcKey } | null, effects?: Array<{ __typename?: 'Effect', ability: string, image: string, key: EffectKey, name: string }> | null, faction: { __typename?: 'Faction', image: string, key: FactionKey, name: string } } }> } | null };

export type GameDeckFragmentFragment = { __typename?: 'GameDeck', discard: Array<{ __typename?: 'DeckUnit', artStyle: number, unit: { __typename?: 'Unit', combats?: Array<Combat> | null, deckable: boolean, hero?: boolean | null, id: string, images: Array<string>, name: string, quote: string, special?: boolean | null, strength?: number | null, dlc?: { __typename?: 'Dlc', name: string, image: string, key: DlcKey } | null, effects?: Array<{ __typename?: 'Effect', ability: string, image: string, key: EffectKey, name: string }> | null, faction: { __typename?: 'Faction', image: string, key: FactionKey, name: string } } }>, from?: { __typename?: 'Deck', created: any, id: string, name: string, faction: { __typename?: 'Faction', ability?: string | null, id: string, image: string, key: FactionKey, name: string }, leader: { __typename?: 'Leader', ability: string, image: string, name: string } } | null, hand: Array<{ __typename?: 'DeckUnit', artStyle: number, unit: { __typename?: 'Unit', combats?: Array<Combat> | null, deckable: boolean, hero?: boolean | null, id: string, images: Array<string>, name: string, quote: string, special?: boolean | null, strength?: number | null, dlc?: { __typename?: 'Dlc', name: string, image: string, key: DlcKey } | null, effects?: Array<{ __typename?: 'Effect', ability: string, image: string, key: EffectKey, name: string }> | null, faction: { __typename?: 'Faction', image: string, key: FactionKey, name: string } } }>, redraws: Array<{ __typename?: 'Redraw', from: { __typename?: 'DeckUnit', artStyle: number, unit: { __typename?: 'Unit', combats?: Array<Combat> | null, deckable: boolean, hero?: boolean | null, id: string, images: Array<string>, name: string, quote: string, special?: boolean | null, strength?: number | null, dlc?: { __typename?: 'Dlc', name: string, image: string, key: DlcKey } | null, effects?: Array<{ __typename?: 'Effect', ability: string, image: string, key: EffectKey, name: string }> | null, faction: { __typename?: 'Faction', image: string, key: FactionKey, name: string } } }, to: { __typename?: 'DeckUnit', artStyle: number, unit: { __typename?: 'Unit', combats?: Array<Combat> | null, deckable: boolean, hero?: boolean | null, id: string, images: Array<string>, name: string, quote: string, special?: boolean | null, strength?: number | null, dlc?: { __typename?: 'Dlc', name: string, image: string, key: DlcKey } | null, effects?: Array<{ __typename?: 'Effect', ability: string, image: string, key: EffectKey, name: string }> | null, faction: { __typename?: 'Faction', image: string, key: FactionKey, name: string } } } }>, undrawn: Array<{ __typename?: 'DeckUnit', artStyle: number, unit: { __typename?: 'Unit', combats?: Array<Combat> | null, deckable: boolean, hero?: boolean | null, id: string, images: Array<string>, name: string, quote: string, special?: boolean | null, strength?: number | null, dlc?: { __typename?: 'Dlc', name: string, image: string, key: DlcKey } | null, effects?: Array<{ __typename?: 'Effect', ability: string, image: string, key: EffectKey, name: string }> | null, faction: { __typename?: 'Faction', image: string, key: FactionKey, name: string } } }> };

export type GameFactionFragmentFragment = { __typename?: 'Faction', ability?: string | null, id: string, image: string, key: FactionKey, name: string };

export type GameFragmentFragment = { __typename?: 'Game', created: any, id: string, status: GameStatus, updated: any, creator: { __typename?: 'User', id: string, name: string }, players: Array<{ __typename?: 'GamePlayer', ready: boolean, counts?: { __typename?: 'GamePlayerUnitCounts', discard: number, hand: number, undrawn: number } | null, faction?: { __typename?: 'Faction', ability?: string | null, id: string, image: string, key: FactionKey, name: string } | null, leader?: { __typename?: 'Leader', ability: string, image: string, name: string } | null, rounds: Array<{ __typename?: 'PlayerRound', score: number }>, user: { __typename?: 'User', id: string, name: string } }>, round: { __typename?: 'GameRound', current: number, maximum: number }, turn?: { __typename?: 'GamePlayer', user: { __typename?: 'User', id: string, name: string } } | null, victors: Array<{ __typename?: 'User', id: string, name: string }> };

export type GameLeaderFragmentFragment = { __typename?: 'Leader', ability: string, image: string, name: string };

export type GamePlayerFragmentFragment = { __typename?: 'GamePlayer', ready: boolean, counts?: { __typename?: 'GamePlayerUnitCounts', discard: number, hand: number, undrawn: number } | null, faction?: { __typename?: 'Faction', ability?: string | null, id: string, image: string, key: FactionKey, name: string } | null, leader?: { __typename?: 'Leader', ability: string, image: string, name: string } | null, rounds: Array<{ __typename?: 'PlayerRound', score: number }>, user: { __typename?: 'User', id: string, name: string } };

export type GameReadySubscriptionVariables = Exact<{ [key: string]: never; }>;


export type GameReadySubscription = { __typename?: 'Subscription', gameReady: { __typename?: 'Game', created: any, id: string, status: GameStatus, updated: any, creator: { __typename?: 'User', id: string, name: string }, players: Array<{ __typename?: 'GamePlayer', ready: boolean, counts?: { __typename?: 'GamePlayerUnitCounts', discard: number, hand: number, undrawn: number } | null, faction?: { __typename?: 'Faction', ability?: string | null, id: string, image: string, key: FactionKey, name: string } | null, leader?: { __typename?: 'Leader', ability: string, image: string, name: string } | null, rounds: Array<{ __typename?: 'PlayerRound', score: number }>, user: { __typename?: 'User', id: string, name: string } }>, round: { __typename?: 'GameRound', current: number, maximum: number }, turn?: { __typename?: 'GamePlayer', user: { __typename?: 'User', id: string, name: string } } | null, victors: Array<{ __typename?: 'User', id: string, name: string }> } };

export type GameSetSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type GameSetSubscription = { __typename?: 'Subscription', gameSet: { __typename?: 'Game', created: any, id: string, status: GameStatus, updated: any, creator: { __typename?: 'User', id: string, name: string }, players: Array<{ __typename?: 'GamePlayer', ready: boolean, counts?: { __typename?: 'GamePlayerUnitCounts', discard: number, hand: number, undrawn: number } | null, faction?: { __typename?: 'Faction', ability?: string | null, id: string, image: string, key: FactionKey, name: string } | null, leader?: { __typename?: 'Leader', ability: string, image: string, name: string } | null, rounds: Array<{ __typename?: 'PlayerRound', score: number }>, user: { __typename?: 'User', id: string, name: string } }>, round: { __typename?: 'GameRound', current: number, maximum: number }, turn?: { __typename?: 'GamePlayer', user: { __typename?: 'User', id: string, name: string } } | null, victors: Array<{ __typename?: 'User', id: string, name: string }> } };

export type GamesQueryVariables = Exact<{ [key: string]: never; }>;


export type GamesQuery = { __typename?: 'Query', games: Array<{ __typename?: 'Game', created: any, id: string, status: GameStatus, updated: any, creator: { __typename?: 'User', id: string, name: string }, players: Array<{ __typename?: 'GamePlayer', ready: boolean, counts?: { __typename?: 'GamePlayerUnitCounts', discard: number, hand: number, undrawn: number } | null, faction?: { __typename?: 'Faction', ability?: string | null, id: string, image: string, key: FactionKey, name: string } | null, leader?: { __typename?: 'Leader', ability: string, image: string, name: string } | null, rounds: Array<{ __typename?: 'PlayerRound', score: number }>, user: { __typename?: 'User', id: string, name: string } }>, round: { __typename?: 'GameRound', current: number, maximum: number }, turn?: { __typename?: 'GamePlayer', user: { __typename?: 'User', id: string, name: string } } | null, victors: Array<{ __typename?: 'User', id: string, name: string }> }> };

export type LeadersQueryVariables = Exact<{
  factions?: InputMaybe<Array<FactionKey> | FactionKey>;
}>;


export type LeadersQuery = { __typename?: 'Query', leaders: Array<{ __typename?: 'Leader', ability: string, id: string, image: string, name: string, quote: string, dlc?: { __typename?: 'Dlc', name: string, image: string } | null }> };

export type LoginMutationVariables = Exact<{
  name: Scalars['String']['input'];
  password: Scalars['String']['input'];
}>;


export type LoginMutation = { __typename?: 'Mutation', login: { __typename?: 'User', id: string, name: string, created: any } };

export type LogoutMutationVariables = Exact<{ [key: string]: never; }>;


export type LogoutMutation = { __typename?: 'Mutation', logout: boolean };

export type OrderSetSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type OrderSetSubscription = { __typename?: 'Subscription', orderSet: { __typename?: 'Game', created: any, id: string, status: GameStatus, updated: any, creator: { __typename?: 'User', id: string, name: string }, players: Array<{ __typename?: 'GamePlayer', ready: boolean, counts?: { __typename?: 'GamePlayerUnitCounts', discard: number, hand: number, undrawn: number } | null, faction?: { __typename?: 'Faction', ability?: string | null, id: string, image: string, key: FactionKey, name: string } | null, leader?: { __typename?: 'Leader', ability: string, image: string, name: string } | null, rounds: Array<{ __typename?: 'PlayerRound', score: number }>, user: { __typename?: 'User', id: string, name: string } }>, round: { __typename?: 'GameRound', current: number, maximum: number }, turn?: { __typename?: 'GamePlayer', user: { __typename?: 'User', id: string, name: string } } | null, victors: Array<{ __typename?: 'User', id: string, name: string }> } };

export type ReadyMutationVariables = Exact<{
  game: Scalars['ID']['input'];
}>;


export type ReadyMutation = { __typename?: 'Mutation', ready: { __typename?: 'Game', created: any, id: string, status: GameStatus, updated: any, creator: { __typename?: 'User', id: string, name: string }, players: Array<{ __typename?: 'GamePlayer', ready: boolean, counts?: { __typename?: 'GamePlayerUnitCounts', discard: number, hand: number, undrawn: number } | null, faction?: { __typename?: 'Faction', ability?: string | null, id: string, image: string, key: FactionKey, name: string } | null, leader?: { __typename?: 'Leader', ability: string, image: string, name: string } | null, rounds: Array<{ __typename?: 'PlayerRound', score: number }>, user: { __typename?: 'User', id: string, name: string } }>, round: { __typename?: 'GameRound', current: number, maximum: number }, turn?: { __typename?: 'GamePlayer', user: { __typename?: 'User', id: string, name: string } } | null, victors: Array<{ __typename?: 'User', id: string, name: string }> } };

export type RedrawMutationVariables = Exact<{
  game: Scalars['ID']['input'];
  unit: Scalars['ID']['input'];
}>;


export type RedrawMutation = { __typename?: 'Mutation', redraw: { __typename?: 'DeckUnit', artStyle: number, unit: { __typename?: 'Unit', combats?: Array<Combat> | null, deckable: boolean, hero?: boolean | null, id: string, images: Array<string>, name: string, quote: string, special?: boolean | null, strength?: number | null, dlc?: { __typename?: 'Dlc', name: string, image: string, key: DlcKey } | null, effects?: Array<{ __typename?: 'Effect', ability: string, image: string, key: EffectKey, name: string }> | null, faction: { __typename?: 'Faction', image: string, key: FactionKey, name: string } } } };

export type SetDeckMutationVariables = Exact<{
  game: Scalars['ID']['input'];
  deck: Scalars['ID']['input'];
}>;


export type SetDeckMutation = { __typename?: 'Mutation', setDeck: { __typename?: 'GameDeck', discard: Array<{ __typename?: 'DeckUnit', artStyle: number, unit: { __typename?: 'Unit', combats?: Array<Combat> | null, deckable: boolean, hero?: boolean | null, id: string, images: Array<string>, name: string, quote: string, special?: boolean | null, strength?: number | null, dlc?: { __typename?: 'Dlc', name: string, image: string, key: DlcKey } | null, effects?: Array<{ __typename?: 'Effect', ability: string, image: string, key: EffectKey, name: string }> | null, faction: { __typename?: 'Faction', image: string, key: FactionKey, name: string } } }>, from?: { __typename?: 'Deck', created: any, id: string, name: string, faction: { __typename?: 'Faction', ability?: string | null, id: string, image: string, key: FactionKey, name: string }, leader: { __typename?: 'Leader', ability: string, image: string, name: string } } | null, hand: Array<{ __typename?: 'DeckUnit', artStyle: number, unit: { __typename?: 'Unit', combats?: Array<Combat> | null, deckable: boolean, hero?: boolean | null, id: string, images: Array<string>, name: string, quote: string, special?: boolean | null, strength?: number | null, dlc?: { __typename?: 'Dlc', name: string, image: string, key: DlcKey } | null, effects?: Array<{ __typename?: 'Effect', ability: string, image: string, key: EffectKey, name: string }> | null, faction: { __typename?: 'Faction', image: string, key: FactionKey, name: string } } }>, redraws: Array<{ __typename?: 'Redraw', from: { __typename?: 'DeckUnit', artStyle: number, unit: { __typename?: 'Unit', combats?: Array<Combat> | null, deckable: boolean, hero?: boolean | null, id: string, images: Array<string>, name: string, quote: string, special?: boolean | null, strength?: number | null, dlc?: { __typename?: 'Dlc', name: string, image: string, key: DlcKey } | null, effects?: Array<{ __typename?: 'Effect', ability: string, image: string, key: EffectKey, name: string }> | null, faction: { __typename?: 'Faction', image: string, key: FactionKey, name: string } } }, to: { __typename?: 'DeckUnit', artStyle: number, unit: { __typename?: 'Unit', combats?: Array<Combat> | null, deckable: boolean, hero?: boolean | null, id: string, images: Array<string>, name: string, quote: string, special?: boolean | null, strength?: number | null, dlc?: { __typename?: 'Dlc', name: string, image: string, key: DlcKey } | null, effects?: Array<{ __typename?: 'Effect', ability: string, image: string, key: EffectKey, name: string }> | null, faction: { __typename?: 'Faction', image: string, key: FactionKey, name: string } } } }>, undrawn: Array<{ __typename?: 'DeckUnit', artStyle: number, unit: { __typename?: 'Unit', combats?: Array<Combat> | null, deckable: boolean, hero?: boolean | null, id: string, images: Array<string>, name: string, quote: string, special?: boolean | null, strength?: number | null, dlc?: { __typename?: 'Dlc', name: string, image: string, key: DlcKey } | null, effects?: Array<{ __typename?: 'Effect', ability: string, image: string, key: EffectKey, name: string }> | null, faction: { __typename?: 'Faction', image: string, key: FactionKey, name: string } } }> } };

export type SetOrderMutationVariables = Exact<{
  game: Scalars['ID']['input'];
  order?: InputMaybe<Array<Scalars['ID']['input']> | Scalars['ID']['input']>;
}>;


export type SetOrderMutation = { __typename?: 'Mutation', setOrder: { __typename?: 'Game', created: any, id: string, status: GameStatus, updated: any, creator: { __typename?: 'User', id: string, name: string }, players: Array<{ __typename?: 'GamePlayer', ready: boolean, counts?: { __typename?: 'GamePlayerUnitCounts', discard: number, hand: number, undrawn: number } | null, faction?: { __typename?: 'Faction', ability?: string | null, id: string, image: string, key: FactionKey, name: string } | null, leader?: { __typename?: 'Leader', ability: string, image: string, name: string } | null, rounds: Array<{ __typename?: 'PlayerRound', score: number }>, user: { __typename?: 'User', id: string, name: string } }>, round: { __typename?: 'GameRound', current: number, maximum: number }, turn?: { __typename?: 'GamePlayer', user: { __typename?: 'User', id: string, name: string } } | null, victors: Array<{ __typename?: 'User', id: string, name: string }> } };

export type UnitRedrawnSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type UnitRedrawnSubscription = { __typename?: 'Subscription', unitRedrawn: { __typename?: 'GameUnitRedrawn', from: { __typename?: 'DeckUnit', artStyle: number, unit: { __typename?: 'Unit', combats?: Array<Combat> | null, deckable: boolean, hero?: boolean | null, id: string, images: Array<string>, name: string, quote: string, special?: boolean | null, strength?: number | null, dlc?: { __typename?: 'Dlc', name: string, image: string, key: DlcKey } | null, effects?: Array<{ __typename?: 'Effect', ability: string, image: string, key: EffectKey, name: string }> | null, faction: { __typename?: 'Faction', image: string, key: FactionKey, name: string } } }, game: { __typename?: 'Game', id: string }, to: { __typename?: 'DeckUnit', artStyle: number, unit: { __typename?: 'Unit', combats?: Array<Combat> | null, deckable: boolean, hero?: boolean | null, id: string, images: Array<string>, name: string, quote: string, special?: boolean | null, strength?: number | null, dlc?: { __typename?: 'Dlc', name: string, image: string, key: DlcKey } | null, effects?: Array<{ __typename?: 'Effect', ability: string, image: string, key: EffectKey, name: string }> | null, faction: { __typename?: 'Faction', image: string, key: FactionKey, name: string } } } } };

export type UnitsQueryVariables = Exact<{
  deckable?: InputMaybe<Scalars['Boolean']['input']>;
  factions?: InputMaybe<Array<FactionKey> | FactionKey>;
}>;


export type UnitsQuery = { __typename?: 'Query', units: Array<{ __typename?: 'Unit', combats?: Array<Combat> | null, deckable: boolean, hero?: boolean | null, id: string, images: Array<string>, name: string, quote: string, special?: boolean | null, strength?: number | null, dlc?: { __typename?: 'Dlc', name: string, image: string, key: DlcKey } | null, effects?: Array<{ __typename?: 'Effect', ability: string, image: string, key: EffectKey, name: string }> | null, faction: { __typename?: 'Faction', image: string, key: FactionKey, name: string } }> };

export const FactionFragmentFragmentDoc = gql`
    fragment FactionFragment on Faction {
  key
  id
  name
  image
  ability
  dlc {
    name
    image
  }
  stats(neutrals: true) {
    agile
    avenger
    berserker
    bond
    decoy
    horn
    mardroeme
    medic
    morale
    muster
    scorch
    spy
    weather
    close
    ranged
    siege
    units
    specials
    heroes
    strengthAverage
    strengthTotal
    strengths
  }
}
    `;
export const DeckFragmentFragmentDoc = gql`
    fragment DeckFragment on Deck {
  id
  created
  name
  faction {
    ...FactionFragment
  }
  leader {
    name
    ability
    image
  }
  stats(neutrals: true) {
    units
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
    ${FactionFragmentFragmentDoc}`;
export const CardUnitFragmentFragmentDoc = gql`
    fragment CardUnitFragment on Unit {
  combats
  deckable
  dlc {
    name
    image
    key
  }
  effects {
    ability
    image
    key
    name
  }
  faction {
    image
    key
    name
  }
  hero
  id
  images
  name
  quote
  special
  strength
}
    `;
export const DeckUnitFragmentFragmentDoc = gql`
    fragment DeckUnitFragment on DeckUnit {
  artStyle
  unit {
    ...CardUnitFragment
  }
}
    ${CardUnitFragmentFragmentDoc}`;
export const GameFactionFragmentFragmentDoc = gql`
    fragment GameFactionFragment on Faction {
  ability
  id
  image
  key
  name
}
    `;
export const GameLeaderFragmentFragmentDoc = gql`
    fragment GameLeaderFragment on Leader {
  ability
  image
  name
}
    `;
export const GameDeckFragmentFragmentDoc = gql`
    fragment GameDeckFragment on GameDeck {
  discard {
    ...DeckUnitFragment
  }
  from {
    created
    faction {
      ...GameFactionFragment
    }
    id
    leader {
      ...GameLeaderFragment
    }
    name
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
    ${DeckUnitFragmentFragmentDoc}
${GameFactionFragmentFragmentDoc}
${GameLeaderFragmentFragmentDoc}`;
export const GamePlayerFragmentFragmentDoc = gql`
    fragment GamePlayerFragment on GamePlayer {
  counts {
    discard
    hand
    undrawn
  }
  faction {
    ...GameFactionFragment
  }
  leader {
    ...GameLeaderFragment
  }
  ready
  rounds {
    score
  }
  user {
    id
    name
  }
}
    ${GameFactionFragmentFragmentDoc}
${GameLeaderFragmentFragmentDoc}`;
export const GameFragmentFragmentDoc = gql`
    fragment GameFragment on Game {
  created
  creator {
    id
    name
  }
  id
  players {
    ...GamePlayerFragment
  }
  round {
    current
    maximum
  }
  status
  turn {
    user {
      id
      name
    }
  }
  updated
  victors {
    id
    name
  }
}
    ${GamePlayerFragmentFragmentDoc}`;
export const AddDeckDocument = gql`
    mutation AddDeck($name: String!, $faction: FactionKey!, $leader: ID!, $units: [DeckUnitInput!]!) {
  addDeck(name: $name, faction: $faction, leader: $leader, units: $units) {
    ...DeckFragment
  }
}
    ${DeckFragmentFragmentDoc}`;
export type AddDeckMutationFn = Apollo.MutationFunction<AddDeckMutation, AddDeckMutationVariables>;

/**
 * __useAddDeckMutation__
 *
 * To run a mutation, you first call `useAddDeckMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAddDeckMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [addDeckMutation, { data, loading, error }] = useAddDeckMutation({
 *   variables: {
 *      name: // value for 'name'
 *      faction: // value for 'faction'
 *      leader: // value for 'leader'
 *      units: // value for 'units'
 *   },
 * });
 */
export function useAddDeckMutation(baseOptions?: Apollo.MutationHookOptions<AddDeckMutation, AddDeckMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<AddDeckMutation, AddDeckMutationVariables>(AddDeckDocument, options);
      }
export type AddDeckMutationHookResult = ReturnType<typeof useAddDeckMutation>;
export type AddDeckMutationResult = Apollo.MutationResult<AddDeckMutation>;
export type AddDeckMutationOptions = Apollo.BaseMutationOptions<AddDeckMutation, AddDeckMutationVariables>;
export const AddGameDocument = gql`
    mutation AddGame($opponentNames: [String!]!) {
  addGame(opponentNames: $opponentNames) {
    ...GameFragment
  }
}
    ${GameFragmentFragmentDoc}`;
export type AddGameMutationFn = Apollo.MutationFunction<AddGameMutation, AddGameMutationVariables>;

/**
 * __useAddGameMutation__
 *
 * To run a mutation, you first call `useAddGameMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAddGameMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [addGameMutation, { data, loading, error }] = useAddGameMutation({
 *   variables: {
 *      opponentNames: // value for 'opponentNames'
 *   },
 * });
 */
export function useAddGameMutation(baseOptions?: Apollo.MutationHookOptions<AddGameMutation, AddGameMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<AddGameMutation, AddGameMutationVariables>(AddGameDocument, options);
      }
export type AddGameMutationHookResult = ReturnType<typeof useAddGameMutation>;
export type AddGameMutationResult = Apollo.MutationResult<AddGameMutation>;
export type AddGameMutationOptions = Apollo.BaseMutationOptions<AddGameMutation, AddGameMutationVariables>;
export const AddUserDocument = gql`
    mutation AddUser($name: String!, $password: String!) {
  addUser(name: $name, password: $password) {
    id
    name
  }
}
    `;
export type AddUserMutationFn = Apollo.MutationFunction<AddUserMutation, AddUserMutationVariables>;

/**
 * __useAddUserMutation__
 *
 * To run a mutation, you first call `useAddUserMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAddUserMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [addUserMutation, { data, loading, error }] = useAddUserMutation({
 *   variables: {
 *      name: // value for 'name'
 *      password: // value for 'password'
 *   },
 * });
 */
export function useAddUserMutation(baseOptions?: Apollo.MutationHookOptions<AddUserMutation, AddUserMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<AddUserMutation, AddUserMutationVariables>(AddUserDocument, options);
      }
export type AddUserMutationHookResult = ReturnType<typeof useAddUserMutation>;
export type AddUserMutationResult = Apollo.MutationResult<AddUserMutation>;
export type AddUserMutationOptions = Apollo.BaseMutationOptions<AddUserMutation, AddUserMutationVariables>;
export const ApplicationDocument = gql`
    query Application {
  application {
    build
    version
  }
}
    `;

/**
 * __useApplicationQuery__
 *
 * To run a query within a React component, call `useApplicationQuery` and pass it any options that fit your needs.
 * When your component renders, `useApplicationQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useApplicationQuery({
 *   variables: {
 *   },
 * });
 */
export function useApplicationQuery(baseOptions?: Apollo.QueryHookOptions<ApplicationQuery, ApplicationQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ApplicationQuery, ApplicationQueryVariables>(ApplicationDocument, options);
      }
export function useApplicationLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ApplicationQuery, ApplicationQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ApplicationQuery, ApplicationQueryVariables>(ApplicationDocument, options);
        }
export function useApplicationSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ApplicationQuery, ApplicationQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ApplicationQuery, ApplicationQueryVariables>(ApplicationDocument, options);
        }
export type ApplicationQueryHookResult = ReturnType<typeof useApplicationQuery>;
export type ApplicationLazyQueryHookResult = ReturnType<typeof useApplicationLazyQuery>;
export type ApplicationSuspenseQueryHookResult = ReturnType<typeof useApplicationSuspenseQuery>;
export type ApplicationQueryResult = Apollo.QueryResult<ApplicationQuery, ApplicationQueryVariables>;
export const CurrentUserDocument = gql`
    query CurrentUser {
  currentUser {
    id
    name
    created
  }
}
    `;

/**
 * __useCurrentUserQuery__
 *
 * To run a query within a React component, call `useCurrentUserQuery` and pass it any options that fit your needs.
 * When your component renders, `useCurrentUserQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useCurrentUserQuery({
 *   variables: {
 *   },
 * });
 */
export function useCurrentUserQuery(baseOptions?: Apollo.QueryHookOptions<CurrentUserQuery, CurrentUserQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<CurrentUserQuery, CurrentUserQueryVariables>(CurrentUserDocument, options);
      }
export function useCurrentUserLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<CurrentUserQuery, CurrentUserQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<CurrentUserQuery, CurrentUserQueryVariables>(CurrentUserDocument, options);
        }
export function useCurrentUserSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<CurrentUserQuery, CurrentUserQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<CurrentUserQuery, CurrentUserQueryVariables>(CurrentUserDocument, options);
        }
export type CurrentUserQueryHookResult = ReturnType<typeof useCurrentUserQuery>;
export type CurrentUserLazyQueryHookResult = ReturnType<typeof useCurrentUserLazyQuery>;
export type CurrentUserSuspenseQueryHookResult = ReturnType<typeof useCurrentUserSuspenseQuery>;
export type CurrentUserQueryResult = Apollo.QueryResult<CurrentUserQuery, CurrentUserQueryVariables>;
export const DeckAddedDocument = gql`
    subscription DeckAdded {
  deckAdded {
    ...DeckFragment
  }
}
    ${DeckFragmentFragmentDoc}`;

/**
 * __useDeckAddedSubscription__
 *
 * To run a query within a React component, call `useDeckAddedSubscription` and pass it any options that fit your needs.
 * When your component renders, `useDeckAddedSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useDeckAddedSubscription({
 *   variables: {
 *   },
 * });
 */
export function useDeckAddedSubscription(baseOptions?: Apollo.SubscriptionHookOptions<DeckAddedSubscription, DeckAddedSubscriptionVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useSubscription<DeckAddedSubscription, DeckAddedSubscriptionVariables>(DeckAddedDocument, options);
      }
export type DeckAddedSubscriptionHookResult = ReturnType<typeof useDeckAddedSubscription>;
export type DeckAddedSubscriptionResult = Apollo.SubscriptionResult<DeckAddedSubscription>;
export const DeckSetDocument = gql`
    subscription DeckSet {
  deckSet {
    deck {
      ...GameDeckFragment
    }
    game {
      id
    }
  }
}
    ${GameDeckFragmentFragmentDoc}`;

/**
 * __useDeckSetSubscription__
 *
 * To run a query within a React component, call `useDeckSetSubscription` and pass it any options that fit your needs.
 * When your component renders, `useDeckSetSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useDeckSetSubscription({
 *   variables: {
 *   },
 * });
 */
export function useDeckSetSubscription(baseOptions?: Apollo.SubscriptionHookOptions<DeckSetSubscription, DeckSetSubscriptionVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useSubscription<DeckSetSubscription, DeckSetSubscriptionVariables>(DeckSetDocument, options);
      }
export type DeckSetSubscriptionHookResult = ReturnType<typeof useDeckSetSubscription>;
export type DeckSetSubscriptionResult = Apollo.SubscriptionResult<DeckSetSubscription>;
export const DecksDocument = gql`
    query Decks {
  decks {
    ...DeckFragment
  }
}
    ${DeckFragmentFragmentDoc}`;

/**
 * __useDecksQuery__
 *
 * To run a query within a React component, call `useDecksQuery` and pass it any options that fit your needs.
 * When your component renders, `useDecksQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useDecksQuery({
 *   variables: {
 *   },
 * });
 */
export function useDecksQuery(baseOptions?: Apollo.QueryHookOptions<DecksQuery, DecksQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<DecksQuery, DecksQueryVariables>(DecksDocument, options);
      }
export function useDecksLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<DecksQuery, DecksQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<DecksQuery, DecksQueryVariables>(DecksDocument, options);
        }
export function useDecksSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<DecksQuery, DecksQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<DecksQuery, DecksQueryVariables>(DecksDocument, options);
        }
export type DecksQueryHookResult = ReturnType<typeof useDecksQuery>;
export type DecksLazyQueryHookResult = ReturnType<typeof useDecksLazyQuery>;
export type DecksSuspenseQueryHookResult = ReturnType<typeof useDecksSuspenseQuery>;
export type DecksQueryResult = Apollo.QueryResult<DecksQuery, DecksQueryVariables>;
export const FactionsDocument = gql`
    query Factions {
  factions {
    ...FactionFragment
  }
}
    ${FactionFragmentFragmentDoc}`;

/**
 * __useFactionsQuery__
 *
 * To run a query within a React component, call `useFactionsQuery` and pass it any options that fit your needs.
 * When your component renders, `useFactionsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useFactionsQuery({
 *   variables: {
 *   },
 * });
 */
export function useFactionsQuery(baseOptions?: Apollo.QueryHookOptions<FactionsQuery, FactionsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<FactionsQuery, FactionsQueryVariables>(FactionsDocument, options);
      }
export function useFactionsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<FactionsQuery, FactionsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<FactionsQuery, FactionsQueryVariables>(FactionsDocument, options);
        }
export function useFactionsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<FactionsQuery, FactionsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<FactionsQuery, FactionsQueryVariables>(FactionsDocument, options);
        }
export type FactionsQueryHookResult = ReturnType<typeof useFactionsQuery>;
export type FactionsLazyQueryHookResult = ReturnType<typeof useFactionsLazyQuery>;
export type FactionsSuspenseQueryHookResult = ReturnType<typeof useFactionsSuspenseQuery>;
export type FactionsQueryResult = Apollo.QueryResult<FactionsQuery, FactionsQueryVariables>;
export const GameDocument = gql`
    query Game($id: ID!) {
  game(id: $id) {
    ...GameFragment
  }
}
    ${GameFragmentFragmentDoc}`;

/**
 * __useGameQuery__
 *
 * To run a query within a React component, call `useGameQuery` and pass it any options that fit your needs.
 * When your component renders, `useGameQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGameQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGameQuery(baseOptions: Apollo.QueryHookOptions<GameQuery, GameQueryVariables> & ({ variables: GameQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GameQuery, GameQueryVariables>(GameDocument, options);
      }
export function useGameLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GameQuery, GameQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GameQuery, GameQueryVariables>(GameDocument, options);
        }
export function useGameSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GameQuery, GameQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GameQuery, GameQueryVariables>(GameDocument, options);
        }
export type GameQueryHookResult = ReturnType<typeof useGameQuery>;
export type GameLazyQueryHookResult = ReturnType<typeof useGameLazyQuery>;
export type GameSuspenseQueryHookResult = ReturnType<typeof useGameSuspenseQuery>;
export type GameQueryResult = Apollo.QueryResult<GameQuery, GameQueryVariables>;
export const GameAddedDocument = gql`
    subscription GameAdded {
  gameAdded {
    ...GameFragment
  }
}
    ${GameFragmentFragmentDoc}`;

/**
 * __useGameAddedSubscription__
 *
 * To run a query within a React component, call `useGameAddedSubscription` and pass it any options that fit your needs.
 * When your component renders, `useGameAddedSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGameAddedSubscription({
 *   variables: {
 *   },
 * });
 */
export function useGameAddedSubscription(baseOptions?: Apollo.SubscriptionHookOptions<GameAddedSubscription, GameAddedSubscriptionVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useSubscription<GameAddedSubscription, GameAddedSubscriptionVariables>(GameAddedDocument, options);
      }
export type GameAddedSubscriptionHookResult = ReturnType<typeof useGameAddedSubscription>;
export type GameAddedSubscriptionResult = Apollo.SubscriptionResult<GameAddedSubscription>;
export const GameDeckDocument = gql`
    query GameDeck($game: ID!) {
  gameDeck(game: $game) {
    ...GameDeckFragment
  }
}
    ${GameDeckFragmentFragmentDoc}`;

/**
 * __useGameDeckQuery__
 *
 * To run a query within a React component, call `useGameDeckQuery` and pass it any options that fit your needs.
 * When your component renders, `useGameDeckQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGameDeckQuery({
 *   variables: {
 *      game: // value for 'game'
 *   },
 * });
 */
export function useGameDeckQuery(baseOptions: Apollo.QueryHookOptions<GameDeckQuery, GameDeckQueryVariables> & ({ variables: GameDeckQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GameDeckQuery, GameDeckQueryVariables>(GameDeckDocument, options);
      }
export function useGameDeckLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GameDeckQuery, GameDeckQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GameDeckQuery, GameDeckQueryVariables>(GameDeckDocument, options);
        }
export function useGameDeckSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GameDeckQuery, GameDeckQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GameDeckQuery, GameDeckQueryVariables>(GameDeckDocument, options);
        }
export type GameDeckQueryHookResult = ReturnType<typeof useGameDeckQuery>;
export type GameDeckLazyQueryHookResult = ReturnType<typeof useGameDeckLazyQuery>;
export type GameDeckSuspenseQueryHookResult = ReturnType<typeof useGameDeckSuspenseQuery>;
export type GameDeckQueryResult = Apollo.QueryResult<GameDeckQuery, GameDeckQueryVariables>;
export const GameReadyDocument = gql`
    subscription GameReady {
  gameReady {
    ...GameFragment
  }
}
    ${GameFragmentFragmentDoc}`;

/**
 * __useGameReadySubscription__
 *
 * To run a query within a React component, call `useGameReadySubscription` and pass it any options that fit your needs.
 * When your component renders, `useGameReadySubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGameReadySubscription({
 *   variables: {
 *   },
 * });
 */
export function useGameReadySubscription(baseOptions?: Apollo.SubscriptionHookOptions<GameReadySubscription, GameReadySubscriptionVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useSubscription<GameReadySubscription, GameReadySubscriptionVariables>(GameReadyDocument, options);
      }
export type GameReadySubscriptionHookResult = ReturnType<typeof useGameReadySubscription>;
export type GameReadySubscriptionResult = Apollo.SubscriptionResult<GameReadySubscription>;
export const GameSetDocument = gql`
    subscription GameSet {
  gameSet {
    ...GameFragment
  }
}
    ${GameFragmentFragmentDoc}`;

/**
 * __useGameSetSubscription__
 *
 * To run a query within a React component, call `useGameSetSubscription` and pass it any options that fit your needs.
 * When your component renders, `useGameSetSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGameSetSubscription({
 *   variables: {
 *   },
 * });
 */
export function useGameSetSubscription(baseOptions?: Apollo.SubscriptionHookOptions<GameSetSubscription, GameSetSubscriptionVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useSubscription<GameSetSubscription, GameSetSubscriptionVariables>(GameSetDocument, options);
      }
export type GameSetSubscriptionHookResult = ReturnType<typeof useGameSetSubscription>;
export type GameSetSubscriptionResult = Apollo.SubscriptionResult<GameSetSubscription>;
export const GamesDocument = gql`
    query Games {
  games {
    ...GameFragment
  }
}
    ${GameFragmentFragmentDoc}`;

/**
 * __useGamesQuery__
 *
 * To run a query within a React component, call `useGamesQuery` and pass it any options that fit your needs.
 * When your component renders, `useGamesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGamesQuery({
 *   variables: {
 *   },
 * });
 */
export function useGamesQuery(baseOptions?: Apollo.QueryHookOptions<GamesQuery, GamesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GamesQuery, GamesQueryVariables>(GamesDocument, options);
      }
export function useGamesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GamesQuery, GamesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GamesQuery, GamesQueryVariables>(GamesDocument, options);
        }
export function useGamesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GamesQuery, GamesQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GamesQuery, GamesQueryVariables>(GamesDocument, options);
        }
export type GamesQueryHookResult = ReturnType<typeof useGamesQuery>;
export type GamesLazyQueryHookResult = ReturnType<typeof useGamesLazyQuery>;
export type GamesSuspenseQueryHookResult = ReturnType<typeof useGamesSuspenseQuery>;
export type GamesQueryResult = Apollo.QueryResult<GamesQuery, GamesQueryVariables>;
export const LeadersDocument = gql`
    query Leaders($factions: [FactionKey!]) {
  leaders(factions: $factions) {
    ability
    dlc {
      name
      image
    }
    id
    image
    name
    quote
  }
}
    `;

/**
 * __useLeadersQuery__
 *
 * To run a query within a React component, call `useLeadersQuery` and pass it any options that fit your needs.
 * When your component renders, `useLeadersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useLeadersQuery({
 *   variables: {
 *      factions: // value for 'factions'
 *   },
 * });
 */
export function useLeadersQuery(baseOptions?: Apollo.QueryHookOptions<LeadersQuery, LeadersQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<LeadersQuery, LeadersQueryVariables>(LeadersDocument, options);
      }
export function useLeadersLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<LeadersQuery, LeadersQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<LeadersQuery, LeadersQueryVariables>(LeadersDocument, options);
        }
export function useLeadersSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<LeadersQuery, LeadersQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<LeadersQuery, LeadersQueryVariables>(LeadersDocument, options);
        }
export type LeadersQueryHookResult = ReturnType<typeof useLeadersQuery>;
export type LeadersLazyQueryHookResult = ReturnType<typeof useLeadersLazyQuery>;
export type LeadersSuspenseQueryHookResult = ReturnType<typeof useLeadersSuspenseQuery>;
export type LeadersQueryResult = Apollo.QueryResult<LeadersQuery, LeadersQueryVariables>;
export const LoginDocument = gql`
    mutation Login($name: String!, $password: String!) {
  login(name: $name, password: $password) {
    id
    name
    created
  }
}
    `;
export type LoginMutationFn = Apollo.MutationFunction<LoginMutation, LoginMutationVariables>;

/**
 * __useLoginMutation__
 *
 * To run a mutation, you first call `useLoginMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useLoginMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [loginMutation, { data, loading, error }] = useLoginMutation({
 *   variables: {
 *      name: // value for 'name'
 *      password: // value for 'password'
 *   },
 * });
 */
export function useLoginMutation(baseOptions?: Apollo.MutationHookOptions<LoginMutation, LoginMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<LoginMutation, LoginMutationVariables>(LoginDocument, options);
      }
export type LoginMutationHookResult = ReturnType<typeof useLoginMutation>;
export type LoginMutationResult = Apollo.MutationResult<LoginMutation>;
export type LoginMutationOptions = Apollo.BaseMutationOptions<LoginMutation, LoginMutationVariables>;
export const LogoutDocument = gql`
    mutation Logout {
  logout
}
    `;
export type LogoutMutationFn = Apollo.MutationFunction<LogoutMutation, LogoutMutationVariables>;

/**
 * __useLogoutMutation__
 *
 * To run a mutation, you first call `useLogoutMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useLogoutMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [logoutMutation, { data, loading, error }] = useLogoutMutation({
 *   variables: {
 *   },
 * });
 */
export function useLogoutMutation(baseOptions?: Apollo.MutationHookOptions<LogoutMutation, LogoutMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<LogoutMutation, LogoutMutationVariables>(LogoutDocument, options);
      }
export type LogoutMutationHookResult = ReturnType<typeof useLogoutMutation>;
export type LogoutMutationResult = Apollo.MutationResult<LogoutMutation>;
export type LogoutMutationOptions = Apollo.BaseMutationOptions<LogoutMutation, LogoutMutationVariables>;
export const OrderSetDocument = gql`
    subscription OrderSet {
  orderSet {
    ...GameFragment
  }
}
    ${GameFragmentFragmentDoc}`;

/**
 * __useOrderSetSubscription__
 *
 * To run a query within a React component, call `useOrderSetSubscription` and pass it any options that fit your needs.
 * When your component renders, `useOrderSetSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useOrderSetSubscription({
 *   variables: {
 *   },
 * });
 */
export function useOrderSetSubscription(baseOptions?: Apollo.SubscriptionHookOptions<OrderSetSubscription, OrderSetSubscriptionVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useSubscription<OrderSetSubscription, OrderSetSubscriptionVariables>(OrderSetDocument, options);
      }
export type OrderSetSubscriptionHookResult = ReturnType<typeof useOrderSetSubscription>;
export type OrderSetSubscriptionResult = Apollo.SubscriptionResult<OrderSetSubscription>;
export const ReadyDocument = gql`
    mutation Ready($game: ID!) {
  ready(game: $game) {
    ...GameFragment
  }
}
    ${GameFragmentFragmentDoc}`;
export type ReadyMutationFn = Apollo.MutationFunction<ReadyMutation, ReadyMutationVariables>;

/**
 * __useReadyMutation__
 *
 * To run a mutation, you first call `useReadyMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useReadyMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [readyMutation, { data, loading, error }] = useReadyMutation({
 *   variables: {
 *      game: // value for 'game'
 *   },
 * });
 */
export function useReadyMutation(baseOptions?: Apollo.MutationHookOptions<ReadyMutation, ReadyMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ReadyMutation, ReadyMutationVariables>(ReadyDocument, options);
      }
export type ReadyMutationHookResult = ReturnType<typeof useReadyMutation>;
export type ReadyMutationResult = Apollo.MutationResult<ReadyMutation>;
export type ReadyMutationOptions = Apollo.BaseMutationOptions<ReadyMutation, ReadyMutationVariables>;
export const RedrawDocument = gql`
    mutation Redraw($game: ID!, $unit: ID!) {
  redraw(game: $game, unit: $unit) {
    ...DeckUnitFragment
  }
}
    ${DeckUnitFragmentFragmentDoc}`;
export type RedrawMutationFn = Apollo.MutationFunction<RedrawMutation, RedrawMutationVariables>;

/**
 * __useRedrawMutation__
 *
 * To run a mutation, you first call `useRedrawMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRedrawMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [redrawMutation, { data, loading, error }] = useRedrawMutation({
 *   variables: {
 *      game: // value for 'game'
 *      unit: // value for 'unit'
 *   },
 * });
 */
export function useRedrawMutation(baseOptions?: Apollo.MutationHookOptions<RedrawMutation, RedrawMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RedrawMutation, RedrawMutationVariables>(RedrawDocument, options);
      }
export type RedrawMutationHookResult = ReturnType<typeof useRedrawMutation>;
export type RedrawMutationResult = Apollo.MutationResult<RedrawMutation>;
export type RedrawMutationOptions = Apollo.BaseMutationOptions<RedrawMutation, RedrawMutationVariables>;
export const SetDeckDocument = gql`
    mutation SetDeck($game: ID!, $deck: ID!) {
  setDeck(game: $game, deck: $deck) {
    ...GameDeckFragment
  }
}
    ${GameDeckFragmentFragmentDoc}`;
export type SetDeckMutationFn = Apollo.MutationFunction<SetDeckMutation, SetDeckMutationVariables>;

/**
 * __useSetDeckMutation__
 *
 * To run a mutation, you first call `useSetDeckMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSetDeckMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [setDeckMutation, { data, loading, error }] = useSetDeckMutation({
 *   variables: {
 *      game: // value for 'game'
 *      deck: // value for 'deck'
 *   },
 * });
 */
export function useSetDeckMutation(baseOptions?: Apollo.MutationHookOptions<SetDeckMutation, SetDeckMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<SetDeckMutation, SetDeckMutationVariables>(SetDeckDocument, options);
      }
export type SetDeckMutationHookResult = ReturnType<typeof useSetDeckMutation>;
export type SetDeckMutationResult = Apollo.MutationResult<SetDeckMutation>;
export type SetDeckMutationOptions = Apollo.BaseMutationOptions<SetDeckMutation, SetDeckMutationVariables>;
export const SetOrderDocument = gql`
    mutation SetOrder($game: ID!, $order: [ID!]) {
  setOrder(game: $game, order: $order) {
    ...GameFragment
  }
}
    ${GameFragmentFragmentDoc}`;
export type SetOrderMutationFn = Apollo.MutationFunction<SetOrderMutation, SetOrderMutationVariables>;

/**
 * __useSetOrderMutation__
 *
 * To run a mutation, you first call `useSetOrderMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSetOrderMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [setOrderMutation, { data, loading, error }] = useSetOrderMutation({
 *   variables: {
 *      game: // value for 'game'
 *      order: // value for 'order'
 *   },
 * });
 */
export function useSetOrderMutation(baseOptions?: Apollo.MutationHookOptions<SetOrderMutation, SetOrderMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<SetOrderMutation, SetOrderMutationVariables>(SetOrderDocument, options);
      }
export type SetOrderMutationHookResult = ReturnType<typeof useSetOrderMutation>;
export type SetOrderMutationResult = Apollo.MutationResult<SetOrderMutation>;
export type SetOrderMutationOptions = Apollo.BaseMutationOptions<SetOrderMutation, SetOrderMutationVariables>;
export const UnitRedrawnDocument = gql`
    subscription UnitRedrawn {
  unitRedrawn {
    from {
      ...DeckUnitFragment
    }
    game {
      id
    }
    to {
      ...DeckUnitFragment
    }
  }
}
    ${DeckUnitFragmentFragmentDoc}`;

/**
 * __useUnitRedrawnSubscription__
 *
 * To run a query within a React component, call `useUnitRedrawnSubscription` and pass it any options that fit your needs.
 * When your component renders, `useUnitRedrawnSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useUnitRedrawnSubscription({
 *   variables: {
 *   },
 * });
 */
export function useUnitRedrawnSubscription(baseOptions?: Apollo.SubscriptionHookOptions<UnitRedrawnSubscription, UnitRedrawnSubscriptionVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useSubscription<UnitRedrawnSubscription, UnitRedrawnSubscriptionVariables>(UnitRedrawnDocument, options);
      }
export type UnitRedrawnSubscriptionHookResult = ReturnType<typeof useUnitRedrawnSubscription>;
export type UnitRedrawnSubscriptionResult = Apollo.SubscriptionResult<UnitRedrawnSubscription>;
export const UnitsDocument = gql`
    query Units($deckable: Boolean, $factions: [FactionKey!]) {
  units(deckable: $deckable, factions: $factions) {
    ...CardUnitFragment
  }
}
    ${CardUnitFragmentFragmentDoc}`;

/**
 * __useUnitsQuery__
 *
 * To run a query within a React component, call `useUnitsQuery` and pass it any options that fit your needs.
 * When your component renders, `useUnitsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useUnitsQuery({
 *   variables: {
 *      deckable: // value for 'deckable'
 *      factions: // value for 'factions'
 *   },
 * });
 */
export function useUnitsQuery(baseOptions?: Apollo.QueryHookOptions<UnitsQuery, UnitsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<UnitsQuery, UnitsQueryVariables>(UnitsDocument, options);
      }
export function useUnitsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<UnitsQuery, UnitsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<UnitsQuery, UnitsQueryVariables>(UnitsDocument, options);
        }
export function useUnitsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<UnitsQuery, UnitsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<UnitsQuery, UnitsQueryVariables>(UnitsDocument, options);
        }
export type UnitsQueryHookResult = ReturnType<typeof useUnitsQuery>;
export type UnitsLazyQueryHookResult = ReturnType<typeof useUnitsLazyQuery>;
export type UnitsSuspenseQueryHookResult = ReturnType<typeof useUnitsSuspenseQuery>;
export type UnitsQueryResult = Apollo.QueryResult<UnitsQuery, UnitsQueryVariables>;