import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import { DeckDbObject, DlcDbObject, EffectDbObject, FactionDbObject, LeaderDbObject, UnitDbObject, UserDbObject } from './database-typings';
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
  Close = 'CLOSE',
  Ranged = 'RANGED',
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
  units: Array<DeckCard>;
  user: User;
};

export type DeckCard = {
  __typename?: 'DeckCard';
  artStyle: Scalars['Int']['output'];
  unit: Unit;
};

export type DeckCardInput = {
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
  BloodAndWine = 'BLOOD_AND_WINE',
  GwentTheWitcherCardGame = 'GWENT_THE_WITCHER_CARD_GAME',
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
  Agile = 'AGILE',
  Avenger = 'AVENGER',
  Berserker = 'BERSERKER',
  Bond = 'BOND',
  Decoy = 'DECOY',
  Horn = 'HORN',
  Mardroeme = 'MARDROEME',
  Medic = 'MEDIC',
  Morale = 'MORALE',
  Muster = 'MUSTER',
  Scorch = 'SCORCH',
  Spy = 'SPY',
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
  Monsters = 'MONSTERS',
  Neutral = 'NEUTRAL',
  NilfgaardianEmpire = 'NILFGAARDIAN_EMPIRE',
  NorthernRealms = 'NORTHERN_REALMS',
  ScoiaTael = 'SCOIA_TAEL',
  Skellige = 'SKELLIGE'
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
  addDeck?: Maybe<Deck>;
  /** Create a user. */
  addUser?: Maybe<User>;
  /** Authenticate a user. */
  login?: Maybe<User>;
  /** De-authenticate a user. */
  logout?: Maybe<Scalars['Boolean']['output']>;
};


export type MutationAddDeckArgs = {
  faction: FactionKey;
  leader: Scalars['ID']['input'];
  name: Scalars['String']['input'];
  units: Array<DeckCardInput>;
};


export type MutationAddUserArgs = {
  name: Scalars['String']['input'];
  password: Scalars['String']['input'];
};


export type MutationLoginArgs = {
  name: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export type Query = {
  __typename?: 'Query';
  /** Information about the application running. */
  application: Application;
  /** The current user on the session if they are authenticated. */
  currentUser?: Maybe<User>;
  /** All decks created by the authenticated user. */
  decks?: Maybe<Array<Deck>>;
  /** All factions which a leader, unit or deck can belong to. */
  factions: Array<Faction>;
  /** All leaders available to build decks with. */
  leaders: Array<Leader>;
  /** The settings configured for the application. */
  settings: Array<Setting>;
  /** All units available to build decks with. */
  units: Array<Unit>;
};


export type QueryLeadersArgs = {
  factions?: InputMaybe<Array<FactionKey>>;
};


export type QueryUnitsArgs = {
  deckable?: InputMaybe<Scalars['Boolean']['input']>;
  factions?: InputMaybe<Array<FactionKey>>;
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
  Deck: ResolverTypeWrapper<DeckDbObject>;
  DeckCard: ResolverTypeWrapper<Omit<DeckCard, 'unit'> & { unit: ResolversTypes['Unit'] }>;
  DeckCardInput: DeckCardInput;
  Dlc: ResolverTypeWrapper<DlcDbObject>;
  DlcKey: DlcKey;
  Effect: ResolverTypeWrapper<EffectDbObject>;
  EffectKey: EffectKey;
  Faction: ResolverTypeWrapper<FactionDbObject>;
  FactionKey: FactionKey;
  Float: ResolverTypeWrapper<Scalars['Float']['output']>;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  Leader: ResolverTypeWrapper<LeaderDbObject>;
  Mutation: ResolverTypeWrapper<{}>;
  Query: ResolverTypeWrapper<{}>;
  SemVer: ResolverTypeWrapper<Scalars['SemVer']['output']>;
  Setting: ResolverTypeWrapper<Setting>;
  SettingKey: SettingKey;
  SettingType: SettingType;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  Unit: ResolverTypeWrapper<UnitDbObject>;
  UnitStats: ResolverTypeWrapper<UnitStats>;
  User: ResolverTypeWrapper<UserDbObject>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Application: Application;
  Boolean: Scalars['Boolean']['output'];
  DateTime: Scalars['DateTime']['output'];
  Deck: DeckDbObject;
  DeckCard: Omit<DeckCard, 'unit'> & { unit: ResolversParentTypes['Unit'] };
  DeckCardInput: DeckCardInput;
  Dlc: DlcDbObject;
  Effect: EffectDbObject;
  Faction: FactionDbObject;
  Float: Scalars['Float']['output'];
  ID: Scalars['ID']['output'];
  Int: Scalars['Int']['output'];
  Leader: LeaderDbObject;
  Mutation: {};
  Query: {};
  SemVer: Scalars['SemVer']['output'];
  Setting: Setting;
  String: Scalars['String']['output'];
  Unit: UnitDbObject;
  UnitStats: UnitStats;
  User: UserDbObject;
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
  stats?: Resolver<ResolversTypes['UnitStats'], ParentType, ContextType>;
  units?: Resolver<Array<ResolversTypes['DeckCard']>, ParentType, ContextType>;
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type DeckCardResolvers<ContextType = any, ParentType extends ResolversParentTypes['DeckCard'] = ResolversParentTypes['DeckCard']> = {
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
  addDeck?: Resolver<Maybe<ResolversTypes['Deck']>, ParentType, ContextType, RequireFields<MutationAddDeckArgs, 'faction' | 'leader' | 'name' | 'units'>>;
  addUser?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, RequireFields<MutationAddUserArgs, 'name' | 'password'>>;
  login?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, RequireFields<MutationLoginArgs, 'name' | 'password'>>;
  logout?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
};

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  application?: Resolver<ResolversTypes['Application'], ParentType, ContextType>;
  currentUser?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  decks?: Resolver<Maybe<Array<ResolversTypes['Deck']>>, ParentType, ContextType>;
  factions?: Resolver<Array<ResolversTypes['Faction']>, ParentType, ContextType>;
  leaders?: Resolver<Array<ResolversTypes['Leader']>, ParentType, ContextType, Partial<QueryLeadersArgs>>;
  settings?: Resolver<Array<ResolversTypes['Setting']>, ParentType, ContextType>;
  units?: Resolver<Array<ResolversTypes['Unit']>, ParentType, ContextType, Partial<QueryUnitsArgs>>;
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
  DeckCard?: DeckCardResolvers<ContextType>;
  Dlc?: DlcResolvers<ContextType>;
  Effect?: EffectResolvers<ContextType>;
  Faction?: FactionResolvers<ContextType>;
  Leader?: LeaderResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  SemVer?: GraphQLScalarType;
  Setting?: SettingResolvers<ContextType>;
  Unit?: UnitResolvers<ContextType>;
  UnitStats?: UnitStatsResolvers<ContextType>;
  User?: UserResolvers<ContextType>;
};

