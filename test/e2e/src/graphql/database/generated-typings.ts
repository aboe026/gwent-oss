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

export enum Combat {
  Close = 'CLOSE',
  Ranged = 'RANGED',
  Siege = 'SIEGE'
}

export enum Dlc {
  BloodAndWine = 'BLOOD_AND_WINE',
  GwentTheWitcherCardGame = 'GWENT_THE_WITCHER_CARD_GAME',
  HeartsOfStone = 'HEARTS_OF_STONE'
}

export enum Effect {
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

export enum Faction {
  Monsters = 'MONSTERS',
  Neutral = 'NEUTRAL',
  NilfgaardianEmpire = 'NILFGAARDIAN_EMPIRE',
  NorthernRealms = 'NORTHERN_REALMS',
  ScoiaTael = 'SCOIA_TAEL',
  Skellige = 'SKELLIGE'
}

export type Leader = {
  __typename?: 'Leader';
  created: Scalars['DateTime']['output'];
  dlc?: Maybe<Dlc>;
  faction: Faction;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  addUser?: Maybe<User>;
  login?: Maybe<User>;
  logout?: Maybe<Scalars['Boolean']['output']>;
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
  /** The current build number of the application running. */
  build: Scalars['Int']['output'];
  getCurrentUser?: Maybe<User>;
  /** Returns all leader cards available to build decks with. */
  leaders: Array<Leader>;
  /** Returns all non-leader cards available to build decks with. */
  units: Array<Unit>;
  /** The current version of the application running. */
  version: Scalars['SemVer']['output'];
};

export type Unit = {
  __typename?: 'Unit';
  combats?: Maybe<Array<Combat>>;
  created: Scalars['DateTime']['output'];
  dlc?: Maybe<Dlc>;
  effects?: Maybe<Array<Effect>>;
  faction: Faction;
  hero?: Maybe<Scalars['Boolean']['output']>;
  id: Scalars['ID']['output'];
  musterPrefix?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  occurrences: Scalars['Int']['output'];
  scorchMin?: Maybe<Scalars['Int']['output']>;
  scorchScope?: Maybe<Combat>;
  strength?: Maybe<Scalars['Int']['output']>;
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
export type LeaderDbObject = {
  created: any,
  dlc?: Maybe<string>,
  faction: string,
  _id: ObjectId,
  name: string,
};

export type UnitDbObject = {
  combats?: Maybe<Array<string>>,
  created: any,
  dlc?: Maybe<string>,
  effects?: Maybe<Array<string>>,
  faction: string,
  hero?: Maybe<boolean>,
  _id: ObjectId,
  musterPrefix?: Maybe<string>,
  name: string,
  occurrences: number,
  scorchMin?: Maybe<number>,
  scorchScope?: Maybe<string>,
  strength?: Maybe<number>,
};

export type UserDbObject = {
  created: any,
  _id: ObjectId,
  name: string,
};
