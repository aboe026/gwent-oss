import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import { Context } from '../src/context';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
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



export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

/** Mapping of union types */
export type ResolversUnionTypes<_RefType extends Record<string, unknown>> = {
  EffectReason: ( EffectFromLeader ) | ( EffectFromUnit );
  Move: ( MoveLeader ) | ( MovePass ) | ( Omit<MoveUnit, 'impacts' | 'unit'> & { impacts?: Maybe<Array<_RefType['Impact']>>, unit: _RefType['GameUnit'] } );
};


/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  Application: ResolverTypeWrapper<Application>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  Combat: Combat;
  DateTime: ResolverTypeWrapper<Scalars['DateTime']['output']>;
  Deck: ResolverTypeWrapper<Deck>;
  DeckUnit: ResolverTypeWrapper<DeckUnit>;
  DeckUnitInput: DeckUnitInput;
  Dlc: ResolverTypeWrapper<Dlc>;
  DlcKey: DlcKey;
  Effect: ResolverTypeWrapper<Effect>;
  EffectFromLeader: ResolverTypeWrapper<EffectFromLeader>;
  EffectFromUnit: ResolverTypeWrapper<EffectFromUnit>;
  EffectKey: EffectKey;
  EffectReason: ResolverTypeWrapper<ResolversUnionTypes<ResolversTypes>['EffectReason']>;
  Faction: ResolverTypeWrapper<Faction>;
  FactionKey: FactionKey;
  Float: ResolverTypeWrapper<Scalars['Float']['output']>;
  Game: ResolverTypeWrapper<Omit<Game, 'players' | 'turn'> & { players: Array<ResolversTypes['GamePlayer']>, turn?: Maybe<ResolversTypes['GamePlayer']> }>;
  GameConfig: ResolverTypeWrapper<GameConfig>;
  GameDeck: ResolverTypeWrapper<GameDeck>;
  GameDeckSet: ResolverTypeWrapper<Omit<GameDeckSet, 'game'> & { game: ResolversTypes['Game'] }>;
  GameDeckStatus: GameDeckStatus;
  GamePlayer: ResolverTypeWrapper<Omit<GamePlayer, 'counts' | 'rounds'> & { counts?: Maybe<ResolversTypes['GamePlayerUnitCounts']>, rounds: Array<ResolversTypes['PlayerRound']> }>;
  GamePlayerUnitCounts: ResolverTypeWrapper<GamePlayerUnitCounts>;
  GameStatus: GameStatus;
  GameUnit: ResolverTypeWrapper<Omit<GameUnit, 'effects'> & { effects?: Maybe<Array<ResolversTypes['GameUnitEffect']>> }>;
  GameUnitEffect: ResolverTypeWrapper<Omit<GameUnitEffect, 'reason'> & { reason: ResolversTypes['EffectReason'] }>;
  GameUnitOrigin: GameUnitOrigin;
  GameUnitRedrawn: ResolverTypeWrapper<Omit<GameUnitRedrawn, 'game'> & { game: ResolversTypes['Game'] }>;
  GameUnitSource: ResolverTypeWrapper<GameUnitSource>;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  Impact: ResolverTypeWrapper<Omit<Impact, 'unit'> & { unit: ResolversTypes['GameUnit'] }>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  Leader: ResolverTypeWrapper<Leader>;
  Move: ResolverTypeWrapper<ResolversUnionTypes<ResolversTypes>['Move']>;
  MoveLeader: ResolverTypeWrapper<MoveLeader>;
  MovePass: ResolverTypeWrapper<MovePass>;
  MoveReasonType: MoveReasonType;
  MoveUnit: ResolverTypeWrapper<Omit<MoveUnit, 'impacts' | 'unit'> & { impacts?: Maybe<Array<ResolversTypes['Impact']>>, unit: ResolversTypes['GameUnit'] }>;
  MoveUnitReason: ResolverTypeWrapper<MoveUnitReason>;
  Mutation: ResolverTypeWrapper<{}>;
  PlayerCombatRow: ResolverTypeWrapper<Omit<PlayerCombatRow, 'modifier' | 'units'> & { modifier?: Maybe<ResolversTypes['GameUnit']>, units: Array<ResolversTypes['GameUnit']> }>;
  PlayerRound: ResolverTypeWrapper<Omit<PlayerRound, 'close' | 'moves' | 'ranged' | 'siege'> & { close: ResolversTypes['PlayerCombatRow'], moves: Array<ResolversTypes['Move']>, ranged: ResolversTypes['PlayerCombatRow'], siege: ResolversTypes['PlayerCombatRow'] }>;
  Query: ResolverTypeWrapper<{}>;
  Redraw: ResolverTypeWrapper<Redraw>;
  RoundEndedForDeck: ResolverTypeWrapper<Omit<RoundEndedForDeck, 'game'> & { game: ResolversTypes['Game'] }>;
  RoundResult: RoundResult;
  SemVer: ResolverTypeWrapper<Scalars['SemVer']['output']>;
  Setting: ResolverTypeWrapper<Setting>;
  SettingKey: SettingKey;
  SettingType: SettingType;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  Subscription: ResolverTypeWrapper<{}>;
  Unit: ResolverTypeWrapper<Unit>;
  UnitPlayedFromDeck: ResolverTypeWrapper<Omit<UnitPlayedFromDeck, 'game'> & { game: ResolversTypes['Game'] }>;
  UnitPlayedOnGame: ResolverTypeWrapper<Omit<UnitPlayedOnGame, 'game'> & { game: ResolversTypes['Game'] }>;
  UnitStats: ResolverTypeWrapper<UnitStats>;
  User: ResolverTypeWrapper<User>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Application: Application;
  Boolean: Scalars['Boolean']['output'];
  DateTime: Scalars['DateTime']['output'];
  Deck: Deck;
  DeckUnit: DeckUnit;
  DeckUnitInput: DeckUnitInput;
  Dlc: Dlc;
  Effect: Effect;
  EffectFromLeader: EffectFromLeader;
  EffectFromUnit: EffectFromUnit;
  EffectReason: ResolversUnionTypes<ResolversParentTypes>['EffectReason'];
  Faction: Faction;
  Float: Scalars['Float']['output'];
  Game: Omit<Game, 'players' | 'turn'> & { players: Array<ResolversParentTypes['GamePlayer']>, turn?: Maybe<ResolversParentTypes['GamePlayer']> };
  GameConfig: GameConfig;
  GameDeck: GameDeck;
  GameDeckSet: Omit<GameDeckSet, 'game'> & { game: ResolversParentTypes['Game'] };
  GamePlayer: Omit<GamePlayer, 'counts' | 'rounds'> & { counts?: Maybe<ResolversParentTypes['GamePlayerUnitCounts']>, rounds: Array<ResolversParentTypes['PlayerRound']> };
  GamePlayerUnitCounts: GamePlayerUnitCounts;
  GameUnit: Omit<GameUnit, 'effects'> & { effects?: Maybe<Array<ResolversParentTypes['GameUnitEffect']>> };
  GameUnitEffect: Omit<GameUnitEffect, 'reason'> & { reason: ResolversParentTypes['EffectReason'] };
  GameUnitRedrawn: Omit<GameUnitRedrawn, 'game'> & { game: ResolversParentTypes['Game'] };
  GameUnitSource: GameUnitSource;
  ID: Scalars['ID']['output'];
  Impact: Omit<Impact, 'unit'> & { unit: ResolversParentTypes['GameUnit'] };
  Int: Scalars['Int']['output'];
  Leader: Leader;
  Move: ResolversUnionTypes<ResolversParentTypes>['Move'];
  MoveLeader: MoveLeader;
  MovePass: MovePass;
  MoveUnit: Omit<MoveUnit, 'impacts' | 'unit'> & { impacts?: Maybe<Array<ResolversParentTypes['Impact']>>, unit: ResolversParentTypes['GameUnit'] };
  MoveUnitReason: MoveUnitReason;
  Mutation: {};
  PlayerCombatRow: Omit<PlayerCombatRow, 'modifier' | 'units'> & { modifier?: Maybe<ResolversParentTypes['GameUnit']>, units: Array<ResolversParentTypes['GameUnit']> };
  PlayerRound: Omit<PlayerRound, 'close' | 'moves' | 'ranged' | 'siege'> & { close: ResolversParentTypes['PlayerCombatRow'], moves: Array<ResolversParentTypes['Move']>, ranged: ResolversParentTypes['PlayerCombatRow'], siege: ResolversParentTypes['PlayerCombatRow'] };
  Query: {};
  Redraw: Redraw;
  RoundEndedForDeck: Omit<RoundEndedForDeck, 'game'> & { game: ResolversParentTypes['Game'] };
  SemVer: Scalars['SemVer']['output'];
  Setting: Setting;
  String: Scalars['String']['output'];
  Subscription: {};
  Unit: Unit;
  UnitPlayedFromDeck: Omit<UnitPlayedFromDeck, 'game'> & { game: ResolversParentTypes['Game'] };
  UnitPlayedOnGame: Omit<UnitPlayedOnGame, 'game'> & { game: ResolversParentTypes['Game'] };
  UnitStats: UnitStats;
  User: User;
};

export type ApplicationResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Application'] = ResolversParentTypes['Application']> = {
  build?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  version?: Resolver<ResolversTypes['SemVer'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface DateTimeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['DateTime'], any> {
  name: 'DateTime';
}

export type DeckResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Deck'] = ResolversParentTypes['Deck']> = {
  created?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  faction?: Resolver<ResolversTypes['Faction'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  leader?: Resolver<ResolversTypes['Leader'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  stats?: Resolver<ResolversTypes['UnitStats'], ParentType, ContextType>;
  units?: Resolver<Array<ResolversTypes['DeckUnit']>, ParentType, ContextType>;
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type DeckUnitResolvers<ContextType = Context, ParentType extends ResolversParentTypes['DeckUnit'] = ResolversParentTypes['DeckUnit']> = {
  artStyle?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  unit?: Resolver<ResolversTypes['Unit'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type DlcResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Dlc'] = ResolversParentTypes['Dlc']> = {
  created?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  image?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  key?: Resolver<ResolversTypes['DlcKey'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type EffectResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Effect'] = ResolversParentTypes['Effect']> = {
  ability?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  created?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  image?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  key?: Resolver<ResolversTypes['EffectKey'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type EffectFromLeaderResolvers<ContextType = Context, ParentType extends ResolversParentTypes['EffectFromLeader'] = ResolversParentTypes['EffectFromLeader']> = {
  leader?: Resolver<ResolversTypes['Leader'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type EffectFromUnitResolvers<ContextType = Context, ParentType extends ResolversParentTypes['EffectFromUnit'] = ResolversParentTypes['EffectFromUnit']> = {
  effect?: Resolver<ResolversTypes['Effect'], ParentType, ContextType>;
  unit?: Resolver<ResolversTypes['Unit'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type EffectReasonResolvers<ContextType = Context, ParentType extends ResolversParentTypes['EffectReason'] = ResolversParentTypes['EffectReason']> = {
  __resolveType: TypeResolveFn<'EffectFromLeader' | 'EffectFromUnit', ParentType, ContextType>;
};

export type FactionResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Faction'] = ResolversParentTypes['Faction']> = {
  ability?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  created?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  dlc?: Resolver<Maybe<ResolversTypes['Dlc']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  image?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  key?: Resolver<ResolversTypes['FactionKey'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  stats?: Resolver<ResolversTypes['UnitStats'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type GameResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Game'] = ResolversParentTypes['Game']> = {
  config?: Resolver<ResolversTypes['GameConfig'], ParentType, ContextType>;
  created?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  creator?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  players?: Resolver<Array<ResolversTypes['GamePlayer']>, ParentType, ContextType>;
  round?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['GameStatus'], ParentType, ContextType>;
  turn?: Resolver<Maybe<ResolversTypes['GamePlayer']>, ParentType, ContextType>;
  updated?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  victors?: Resolver<Array<ResolversTypes['User']>, ParentType, ContextType>;
  weather?: Resolver<Array<ResolversTypes['Combat']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type GameConfigResolvers<ContextType = Context, ParentType extends ResolversParentTypes['GameConfig'] = ResolversParentTypes['GameConfig']> = {
  lives?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type GameDeckResolvers<ContextType = Context, ParentType extends ResolversParentTypes['GameDeck'] = ResolversParentTypes['GameDeck']> = {
  discard?: Resolver<Array<ResolversTypes['DeckUnit']>, ParentType, ContextType>;
  from?: Resolver<Maybe<ResolversTypes['Deck']>, ParentType, ContextType>;
  hand?: Resolver<Array<ResolversTypes['DeckUnit']>, ParentType, ContextType>;
  redraws?: Resolver<Array<ResolversTypes['Redraw']>, ParentType, ContextType>;
  undrawn?: Resolver<Array<ResolversTypes['DeckUnit']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type GameDeckSetResolvers<ContextType = Context, ParentType extends ResolversParentTypes['GameDeckSet'] = ResolversParentTypes['GameDeckSet']> = {
  deck?: Resolver<ResolversTypes['GameDeck'], ParentType, ContextType>;
  game?: Resolver<ResolversTypes['Game'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type GamePlayerResolvers<ContextType = Context, ParentType extends ResolversParentTypes['GamePlayer'] = ResolversParentTypes['GamePlayer']> = {
  counts?: Resolver<Maybe<ResolversTypes['GamePlayerUnitCounts']>, ParentType, ContextType>;
  faction?: Resolver<Maybe<ResolversTypes['Faction']>, ParentType, ContextType>;
  leader?: Resolver<Maybe<ResolversTypes['Leader']>, ParentType, ContextType>;
  order?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  ready?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  rounds?: Resolver<Array<ResolversTypes['PlayerRound']>, ParentType, ContextType>;
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type GamePlayerUnitCountsResolvers<ContextType = Context, ParentType extends ResolversParentTypes['GamePlayerUnitCounts'] = ResolversParentTypes['GamePlayerUnitCounts']> = {
  discard?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  hand?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  undrawn?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type GameUnitResolvers<ContextType = Context, ParentType extends ResolversParentTypes['GameUnit'] = ResolversParentTypes['GameUnit']> = {
  artStyle?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  effectiveStrength?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  effects?: Resolver<Maybe<Array<ResolversTypes['GameUnitEffect']>>, ParentType, ContextType>;
  row?: Resolver<Maybe<ResolversTypes['Combat']>, ParentType, ContextType>;
  unit?: Resolver<ResolversTypes['Unit'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type GameUnitEffectResolvers<ContextType = Context, ParentType extends ResolversParentTypes['GameUnitEffect'] = ResolversParentTypes['GameUnitEffect']> = {
  operator?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  reason?: Resolver<ResolversTypes['EffectReason'], ParentType, ContextType>;
  total?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type GameUnitRedrawnResolvers<ContextType = Context, ParentType extends ResolversParentTypes['GameUnitRedrawn'] = ResolversParentTypes['GameUnitRedrawn']> = {
  deck?: Resolver<ResolversTypes['GameDeck'], ParentType, ContextType>;
  from?: Resolver<ResolversTypes['DeckUnit'], ParentType, ContextType>;
  game?: Resolver<ResolversTypes['Game'], ParentType, ContextType>;
  to?: Resolver<ResolversTypes['DeckUnit'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type GameUnitSourceResolvers<ContextType = Context, ParentType extends ResolversParentTypes['GameUnitSource'] = ResolversParentTypes['GameUnitSource']> = {
  origin?: Resolver<ResolversTypes['GameUnitOrigin'], ParentType, ContextType>;
  user?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ImpactResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Impact'] = ResolversParentTypes['Impact']> = {
  source?: Resolver<Maybe<ResolversTypes['GameUnitSource']>, ParentType, ContextType>;
  unit?: Resolver<ResolversTypes['GameUnit'], ParentType, ContextType>;
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type LeaderResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Leader'] = ResolversParentTypes['Leader']> = {
  ability?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  created?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  dlc?: Resolver<Maybe<ResolversTypes['Dlc']>, ParentType, ContextType>;
  faction?: Resolver<ResolversTypes['Faction'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  image?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  quote?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MoveResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Move'] = ResolversParentTypes['Move']> = {
  __resolveType: TypeResolveFn<'MoveLeader' | 'MovePass' | 'MoveUnit', ParentType, ContextType>;
};

export type MoveLeaderResolvers<ContextType = Context, ParentType extends ResolversParentTypes['MoveLeader'] = ResolversParentTypes['MoveLeader']> = {
  created?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  leader?: Resolver<ResolversTypes['Leader'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MovePassResolvers<ContextType = Context, ParentType extends ResolversParentTypes['MovePass'] = ResolversParentTypes['MovePass']> = {
  created?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MoveUnitResolvers<ContextType = Context, ParentType extends ResolversParentTypes['MoveUnit'] = ResolversParentTypes['MoveUnit']> = {
  created?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  impacts?: Resolver<Maybe<Array<ResolversTypes['Impact']>>, ParentType, ContextType>;
  reason?: Resolver<ResolversTypes['MoveUnitReason'], ParentType, ContextType>;
  source?: Resolver<ResolversTypes['GameUnitSource'], ParentType, ContextType>;
  unit?: Resolver<ResolversTypes['GameUnit'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MoveUnitReasonResolvers<ContextType = Context, ParentType extends ResolversParentTypes['MoveUnitReason'] = ResolversParentTypes['MoveUnitReason']> = {
  type?: Resolver<ResolversTypes['MoveReasonType'], ParentType, ContextType>;
  unit?: Resolver<Maybe<ResolversTypes['DeckUnit']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MutationResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  addDeck?: Resolver<ResolversTypes['Deck'], ParentType, ContextType, RequireFields<MutationAddDeckArgs, 'faction' | 'leader' | 'name' | 'units'>>;
  addGame?: Resolver<ResolversTypes['Game'], ParentType, ContextType, RequireFields<MutationAddGameArgs, 'opponentNames'>>;
  addUser?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<MutationAddUserArgs, 'name' | 'password'>>;
  login?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<MutationLoginArgs, 'name' | 'password'>>;
  logout?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  playPass?: Resolver<ResolversTypes['Game'], ParentType, ContextType, RequireFields<MutationPlayPassArgs, 'game'>>;
  playUnit?: Resolver<ResolversTypes['Game'], ParentType, ContextType, RequireFields<MutationPlayUnitArgs, 'game' | 'unit'>>;
  ready?: Resolver<ResolversTypes['Game'], ParentType, ContextType, RequireFields<MutationReadyArgs, 'game'>>;
  redraw?: Resolver<ResolversTypes['DeckUnit'], ParentType, ContextType, RequireFields<MutationRedrawArgs, 'game' | 'unit'>>;
  setDeck?: Resolver<ResolversTypes['GameDeck'], ParentType, ContextType, RequireFields<MutationSetDeckArgs, 'deck' | 'game'>>;
  setOrder?: Resolver<ResolversTypes['Game'], ParentType, ContextType, RequireFields<MutationSetOrderArgs, 'game'>>;
};

export type PlayerCombatRowResolvers<ContextType = Context, ParentType extends ResolversParentTypes['PlayerCombatRow'] = ResolversParentTypes['PlayerCombatRow']> = {
  modifier?: Resolver<Maybe<ResolversTypes['GameUnit']>, ParentType, ContextType>;
  score?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  units?: Resolver<Array<ResolversTypes['GameUnit']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PlayerRoundResolvers<ContextType = Context, ParentType extends ResolversParentTypes['PlayerRound'] = ResolversParentTypes['PlayerRound']> = {
  close?: Resolver<ResolversTypes['PlayerCombatRow'], ParentType, ContextType>;
  moves?: Resolver<Array<ResolversTypes['Move']>, ParentType, ContextType>;
  passed?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  ranged?: Resolver<ResolversTypes['PlayerCombatRow'], ParentType, ContextType>;
  result?: Resolver<Maybe<ResolversTypes['RoundResult']>, ParentType, ContextType>;
  score?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  siege?: Resolver<ResolversTypes['PlayerCombatRow'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type QueryResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  application?: Resolver<ResolversTypes['Application'], ParentType, ContextType>;
  currentUser?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  decks?: Resolver<Array<ResolversTypes['Deck']>, ParentType, ContextType>;
  factions?: Resolver<Array<ResolversTypes['Faction']>, ParentType, ContextType, Partial<QueryFactionsArgs>>;
  game?: Resolver<ResolversTypes['Game'], ParentType, ContextType, RequireFields<QueryGameArgs, 'id'>>;
  gameDeck?: Resolver<Maybe<ResolversTypes['GameDeck']>, ParentType, ContextType, RequireFields<QueryGameDeckArgs, 'game'>>;
  games?: Resolver<Array<ResolversTypes['Game']>, ParentType, ContextType>;
  leaders?: Resolver<Array<ResolversTypes['Leader']>, ParentType, ContextType, Partial<QueryLeadersArgs>>;
  settings?: Resolver<Array<ResolversTypes['Setting']>, ParentType, ContextType>;
  units?: Resolver<Array<ResolversTypes['Unit']>, ParentType, ContextType, Partial<QueryUnitsArgs>>;
};

export type RedrawResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Redraw'] = ResolversParentTypes['Redraw']> = {
  from?: Resolver<ResolversTypes['DeckUnit'], ParentType, ContextType>;
  to?: Resolver<ResolversTypes['DeckUnit'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type RoundEndedForDeckResolvers<ContextType = Context, ParentType extends ResolversParentTypes['RoundEndedForDeck'] = ResolversParentTypes['RoundEndedForDeck']> = {
  deck?: Resolver<ResolversTypes['GameDeck'], ParentType, ContextType>;
  game?: Resolver<ResolversTypes['Game'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface SemVerScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['SemVer'], any> {
  name: 'SemVer';
}

export type SettingResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Setting'] = ResolversParentTypes['Setting']> = {
  key?: Resolver<ResolversTypes['SettingKey'], ParentType, ContextType>;
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['SettingType'], ParentType, ContextType>;
  value?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SubscriptionResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Subscription'] = ResolversParentTypes['Subscription']> = {
  deckAdded?: SubscriptionResolver<ResolversTypes['Deck'], "deckAdded", ParentType, ContextType>;
  deckSet?: SubscriptionResolver<ResolversTypes['GameDeckSet'], "deckSet", ParentType, ContextType>;
  gameAdded?: SubscriptionResolver<ResolversTypes['Game'], "gameAdded", ParentType, ContextType>;
  gameReady?: SubscriptionResolver<ResolversTypes['Game'], "gameReady", ParentType, ContextType>;
  gameSet?: SubscriptionResolver<ResolversTypes['Game'], "gameSet", ParentType, ContextType>;
  orderSet?: SubscriptionResolver<ResolversTypes['Game'], "orderSet", ParentType, ContextType>;
  passPlayed?: SubscriptionResolver<ResolversTypes['Game'], "passPlayed", ParentType, ContextType>;
  roundEndedForDeck?: SubscriptionResolver<ResolversTypes['RoundEndedForDeck'], "roundEndedForDeck", ParentType, ContextType>;
  unitPlayedFromDeck?: SubscriptionResolver<ResolversTypes['UnitPlayedFromDeck'], "unitPlayedFromDeck", ParentType, ContextType>;
  unitPlayedOnGame?: SubscriptionResolver<ResolversTypes['UnitPlayedOnGame'], "unitPlayedOnGame", ParentType, ContextType>;
  unitRedrawn?: SubscriptionResolver<ResolversTypes['GameUnitRedrawn'], "unitRedrawn", ParentType, ContextType>;
};

export type UnitResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Unit'] = ResolversParentTypes['Unit']> = {
  combats?: Resolver<Maybe<Array<ResolversTypes['Combat']>>, ParentType, ContextType>;
  created?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  deckable?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  dlc?: Resolver<Maybe<ResolversTypes['Dlc']>, ParentType, ContextType>;
  effectPrefix?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  effects?: Resolver<Maybe<Array<ResolversTypes['Effect']>>, ParentType, ContextType>;
  faction?: Resolver<ResolversTypes['Faction'], ParentType, ContextType>;
  hero?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  images?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  modifier?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  quote?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  scorchMin?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  scorchScope?: Resolver<Maybe<ResolversTypes['Combat']>, ParentType, ContextType>;
  special?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  strength?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UnitPlayedFromDeckResolvers<ContextType = Context, ParentType extends ResolversParentTypes['UnitPlayedFromDeck'] = ResolversParentTypes['UnitPlayedFromDeck']> = {
  deck?: Resolver<ResolversTypes['GameDeck'], ParentType, ContextType>;
  game?: Resolver<ResolversTypes['Game'], ParentType, ContextType>;
  unit?: Resolver<ResolversTypes['DeckUnit'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UnitPlayedOnGameResolvers<ContextType = Context, ParentType extends ResolversParentTypes['UnitPlayedOnGame'] = ResolversParentTypes['UnitPlayedOnGame']> = {
  game?: Resolver<ResolversTypes['Game'], ParentType, ContextType>;
  unit?: Resolver<ResolversTypes['DeckUnit'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UnitStatsResolvers<ContextType = Context, ParentType extends ResolversParentTypes['UnitStats'] = ResolversParentTypes['UnitStats']> = {
  agile?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  avenger?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  berserker?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  bond?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  close?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  decoy?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  heroes?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  horn?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  mardroeme?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  medic?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  morale?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  muster?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  ranged?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  scorch?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  siege?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  specials?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  spy?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  strengthAverage?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  strengthTotal?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  strengths?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  units?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  weather?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UserResolvers<ContextType = Context, ParentType extends ResolversParentTypes['User'] = ResolversParentTypes['User']> = {
  created?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type Resolvers<ContextType = Context> = {
  Application?: ApplicationResolvers<ContextType>;
  DateTime?: GraphQLScalarType;
  Deck?: DeckResolvers<ContextType>;
  DeckUnit?: DeckUnitResolvers<ContextType>;
  Dlc?: DlcResolvers<ContextType>;
  Effect?: EffectResolvers<ContextType>;
  EffectFromLeader?: EffectFromLeaderResolvers<ContextType>;
  EffectFromUnit?: EffectFromUnitResolvers<ContextType>;
  EffectReason?: EffectReasonResolvers<ContextType>;
  Faction?: FactionResolvers<ContextType>;
  Game?: GameResolvers<ContextType>;
  GameConfig?: GameConfigResolvers<ContextType>;
  GameDeck?: GameDeckResolvers<ContextType>;
  GameDeckSet?: GameDeckSetResolvers<ContextType>;
  GamePlayer?: GamePlayerResolvers<ContextType>;
  GamePlayerUnitCounts?: GamePlayerUnitCountsResolvers<ContextType>;
  GameUnit?: GameUnitResolvers<ContextType>;
  GameUnitEffect?: GameUnitEffectResolvers<ContextType>;
  GameUnitRedrawn?: GameUnitRedrawnResolvers<ContextType>;
  GameUnitSource?: GameUnitSourceResolvers<ContextType>;
  Impact?: ImpactResolvers<ContextType>;
  Leader?: LeaderResolvers<ContextType>;
  Move?: MoveResolvers<ContextType>;
  MoveLeader?: MoveLeaderResolvers<ContextType>;
  MovePass?: MovePassResolvers<ContextType>;
  MoveUnit?: MoveUnitResolvers<ContextType>;
  MoveUnitReason?: MoveUnitReasonResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  PlayerCombatRow?: PlayerCombatRowResolvers<ContextType>;
  PlayerRound?: PlayerRoundResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Redraw?: RedrawResolvers<ContextType>;
  RoundEndedForDeck?: RoundEndedForDeckResolvers<ContextType>;
  SemVer?: GraphQLScalarType;
  Setting?: SettingResolvers<ContextType>;
  Subscription?: SubscriptionResolvers<ContextType>;
  Unit?: UnitResolvers<ContextType>;
  UnitPlayedFromDeck?: UnitPlayedFromDeckResolvers<ContextType>;
  UnitPlayedOnGame?: UnitPlayedOnGameResolvers<ContextType>;
  UnitStats?: UnitStatsResolvers<ContextType>;
  User?: UserResolvers<ContextType>;
};

