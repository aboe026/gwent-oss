import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
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

export type Subscription = {
  __typename?: 'Subscription';
  deckAdded: Deck;
  gameAdded: Game;
  gameReady: Game;
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
  EffectKey: EffectKey;
  Faction: ResolverTypeWrapper<Faction>;
  FactionKey: FactionKey;
  Float: ResolverTypeWrapper<Scalars['Float']['output']>;
  Game: ResolverTypeWrapper<Game>;
  GameDeck: ResolverTypeWrapper<GameDeck>;
  GameDeckStatus: GameDeckStatus;
  GamePlayer: ResolverTypeWrapper<GamePlayer>;
  GamePlayerInput: GamePlayerInput;
  GamePlayerUnitCounts: ResolverTypeWrapper<GamePlayerUnitCounts>;
  GameRound: ResolverTypeWrapper<GameRound>;
  GameStatus: GameStatus;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  Leader: ResolverTypeWrapper<Leader>;
  Mutation: ResolverTypeWrapper<{}>;
  PlayerRound: ResolverTypeWrapper<PlayerRound>;
  Query: ResolverTypeWrapper<{}>;
  Redraw: ResolverTypeWrapper<Redraw>;
  SemVer: ResolverTypeWrapper<Scalars['SemVer']['output']>;
  Setting: ResolverTypeWrapper<Setting>;
  SettingKey: SettingKey;
  SettingType: SettingType;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  Subscription: ResolverTypeWrapper<{}>;
  Unit: ResolverTypeWrapper<Unit>;
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
  Faction: Faction;
  Float: Scalars['Float']['output'];
  Game: Game;
  GameDeck: GameDeck;
  GamePlayer: GamePlayer;
  GamePlayerInput: GamePlayerInput;
  GamePlayerUnitCounts: GamePlayerUnitCounts;
  GameRound: GameRound;
  ID: Scalars['ID']['output'];
  Int: Scalars['Int']['output'];
  Leader: Leader;
  Mutation: {};
  PlayerRound: PlayerRound;
  Query: {};
  Redraw: Redraw;
  SemVer: Scalars['SemVer']['output'];
  Setting: Setting;
  String: Scalars['String']['output'];
  Subscription: {};
  Unit: Unit;
  UnitStats: UnitStats;
  User: User;
};

export type ApplicationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Application'] = ResolversParentTypes['Application']> = {
  build?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  version?: Resolver<ResolversTypes['SemVer'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface DateTimeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['DateTime'], any> {
  name: 'DateTime';
}

export type DeckResolvers<ContextType = any, ParentType extends ResolversParentTypes['Deck'] = ResolversParentTypes['Deck']> = {
  created?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  faction?: Resolver<ResolversTypes['Faction'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  leader?: Resolver<ResolversTypes['Leader'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  stats?: Resolver<ResolversTypes['UnitStats'], ParentType, ContextType, RequireFields<DeckStatsArgs, 'neutrals'>>;
  units?: Resolver<Array<ResolversTypes['DeckUnit']>, ParentType, ContextType>;
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type DeckUnitResolvers<ContextType = any, ParentType extends ResolversParentTypes['DeckUnit'] = ResolversParentTypes['DeckUnit']> = {
  artStyle?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  unit?: Resolver<ResolversTypes['Unit'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type DlcResolvers<ContextType = any, ParentType extends ResolversParentTypes['Dlc'] = ResolversParentTypes['Dlc']> = {
  created?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  image?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  key?: Resolver<ResolversTypes['DlcKey'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type EffectResolvers<ContextType = any, ParentType extends ResolversParentTypes['Effect'] = ResolversParentTypes['Effect']> = {
  ability?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  created?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  image?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  key?: Resolver<ResolversTypes['EffectKey'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type FactionResolvers<ContextType = any, ParentType extends ResolversParentTypes['Faction'] = ResolversParentTypes['Faction']> = {
  ability?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  created?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  dlc?: Resolver<Maybe<ResolversTypes['Dlc']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  image?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  key?: Resolver<ResolversTypes['FactionKey'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  stats?: Resolver<ResolversTypes['UnitStats'], ParentType, ContextType, RequireFields<FactionStatsArgs, 'neutrals'>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type GameResolvers<ContextType = any, ParentType extends ResolversParentTypes['Game'] = ResolversParentTypes['Game']> = {
  created?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  creator?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  players?: Resolver<Array<ResolversTypes['GamePlayer']>, ParentType, ContextType>;
  round?: Resolver<ResolversTypes['GameRound'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['GameStatus'], ParentType, ContextType>;
  updated?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  victors?: Resolver<Array<ResolversTypes['User']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type GameDeckResolvers<ContextType = any, ParentType extends ResolversParentTypes['GameDeck'] = ResolversParentTypes['GameDeck']> = {
  discard?: Resolver<Array<ResolversTypes['DeckUnit']>, ParentType, ContextType>;
  from?: Resolver<Maybe<ResolversTypes['Deck']>, ParentType, ContextType>;
  hand?: Resolver<Array<ResolversTypes['DeckUnit']>, ParentType, ContextType>;
  redraws?: Resolver<Array<ResolversTypes['Redraw']>, ParentType, ContextType>;
  undrawn?: Resolver<Array<ResolversTypes['DeckUnit']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type GamePlayerResolvers<ContextType = any, ParentType extends ResolversParentTypes['GamePlayer'] = ResolversParentTypes['GamePlayer']> = {
  counts?: Resolver<Maybe<ResolversTypes['GamePlayerUnitCounts']>, ParentType, ContextType>;
  faction?: Resolver<Maybe<ResolversTypes['Faction']>, ParentType, ContextType>;
  leader?: Resolver<Maybe<ResolversTypes['Leader']>, ParentType, ContextType>;
  ready?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  rounds?: Resolver<Array<ResolversTypes['PlayerRound']>, ParentType, ContextType>;
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type GamePlayerUnitCountsResolvers<ContextType = any, ParentType extends ResolversParentTypes['GamePlayerUnitCounts'] = ResolversParentTypes['GamePlayerUnitCounts']> = {
  discard?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  hand?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  undrawn?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type GameRoundResolvers<ContextType = any, ParentType extends ResolversParentTypes['GameRound'] = ResolversParentTypes['GameRound']> = {
  current?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  maximum?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type LeaderResolvers<ContextType = any, ParentType extends ResolversParentTypes['Leader'] = ResolversParentTypes['Leader']> = {
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

export type MutationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  addDeck?: Resolver<ResolversTypes['Deck'], ParentType, ContextType, RequireFields<MutationAddDeckArgs, 'faction' | 'leader' | 'name' | 'units'>>;
  addGame?: Resolver<ResolversTypes['Game'], ParentType, ContextType, RequireFields<MutationAddGameArgs, 'opponentNames'>>;
  addUser?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<MutationAddUserArgs, 'name' | 'password'>>;
  login?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<MutationLoginArgs, 'name' | 'password'>>;
  logout?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  ready?: Resolver<ResolversTypes['Game'], ParentType, ContextType, RequireFields<MutationReadyArgs, 'game'>>;
  redraw?: Resolver<ResolversTypes['DeckUnit'], ParentType, ContextType, RequireFields<MutationRedrawArgs, 'game' | 'unit'>>;
  setDeck?: Resolver<ResolversTypes['GameDeck'], ParentType, ContextType, RequireFields<MutationSetDeckArgs, 'deck' | 'game'>>;
};

export type PlayerRoundResolvers<ContextType = any, ParentType extends ResolversParentTypes['PlayerRound'] = ResolversParentTypes['PlayerRound']> = {
  score?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  won?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  application?: Resolver<ResolversTypes['Application'], ParentType, ContextType>;
  currentUser?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  decks?: Resolver<Array<ResolversTypes['Deck']>, ParentType, ContextType>;
  factions?: Resolver<Array<ResolversTypes['Faction']>, ParentType, ContextType>;
  game?: Resolver<ResolversTypes['Game'], ParentType, ContextType, RequireFields<QueryGameArgs, 'id'>>;
  gameDeck?: Resolver<Maybe<ResolversTypes['GameDeck']>, ParentType, ContextType, RequireFields<QueryGameDeckArgs, 'game'>>;
  games?: Resolver<Array<ResolversTypes['Game']>, ParentType, ContextType>;
  leaders?: Resolver<Array<ResolversTypes['Leader']>, ParentType, ContextType, Partial<QueryLeadersArgs>>;
  settings?: Resolver<Array<ResolversTypes['Setting']>, ParentType, ContextType>;
  units?: Resolver<Array<ResolversTypes['Unit']>, ParentType, ContextType, Partial<QueryUnitsArgs>>;
};

export type RedrawResolvers<ContextType = any, ParentType extends ResolversParentTypes['Redraw'] = ResolversParentTypes['Redraw']> = {
  from?: Resolver<ResolversTypes['DeckUnit'], ParentType, ContextType>;
  to?: Resolver<ResolversTypes['DeckUnit'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface SemVerScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['SemVer'], any> {
  name: 'SemVer';
}

export type SettingResolvers<ContextType = any, ParentType extends ResolversParentTypes['Setting'] = ResolversParentTypes['Setting']> = {
  key?: Resolver<ResolversTypes['SettingKey'], ParentType, ContextType>;
  label?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['SettingType'], ParentType, ContextType>;
  value?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SubscriptionResolvers<ContextType = any, ParentType extends ResolversParentTypes['Subscription'] = ResolversParentTypes['Subscription']> = {
  deckAdded?: SubscriptionResolver<ResolversTypes['Deck'], "deckAdded", ParentType, ContextType>;
  gameAdded?: SubscriptionResolver<ResolversTypes['Game'], "gameAdded", ParentType, ContextType>;
  gameReady?: SubscriptionResolver<ResolversTypes['Game'], "gameReady", ParentType, ContextType>;
};

export type UnitResolvers<ContextType = any, ParentType extends ResolversParentTypes['Unit'] = ResolversParentTypes['Unit']> = {
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
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  quote?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  scorchMin?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  scorchScope?: Resolver<Maybe<ResolversTypes['Combat']>, ParentType, ContextType>;
  special?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  strength?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UnitStatsResolvers<ContextType = any, ParentType extends ResolversParentTypes['UnitStats'] = ResolversParentTypes['UnitStats']> = {
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

export type UserResolvers<ContextType = any, ParentType extends ResolversParentTypes['User'] = ResolversParentTypes['User']> = {
  created?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type Resolvers<ContextType = any> = {
  Application?: ApplicationResolvers<ContextType>;
  DateTime?: GraphQLScalarType;
  Deck?: DeckResolvers<ContextType>;
  DeckUnit?: DeckUnitResolvers<ContextType>;
  Dlc?: DlcResolvers<ContextType>;
  Effect?: EffectResolvers<ContextType>;
  Faction?: FactionResolvers<ContextType>;
  Game?: GameResolvers<ContextType>;
  GameDeck?: GameDeckResolvers<ContextType>;
  GamePlayer?: GamePlayerResolvers<ContextType>;
  GamePlayerUnitCounts?: GamePlayerUnitCountsResolvers<ContextType>;
  GameRound?: GameRoundResolvers<ContextType>;
  Leader?: LeaderResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  PlayerRound?: PlayerRoundResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Redraw?: RedrawResolvers<ContextType>;
  SemVer?: GraphQLScalarType;
  Setting?: SettingResolvers<ContextType>;
  Subscription?: SubscriptionResolvers<ContextType>;
  Unit?: UnitResolvers<ContextType>;
  UnitStats?: UnitStatsResolvers<ContextType>;
  User?: UserResolvers<ContextType>;
};

