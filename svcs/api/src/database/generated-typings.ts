export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  DateTime: any;
  SemVer: any;
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
  created: Scalars['DateTime'];
  dlc?: Maybe<Dlc>;
  faction: Faction;
  id: Scalars['ID'];
  name: Scalars['String'];
};

export type Mutation = {
  __typename?: 'Mutation';
  addUser?: Maybe<User>;
  login?: Maybe<User>;
  logout?: Maybe<Scalars['Boolean']>;
};


export type MutationAddUserArgs = {
  name: Scalars['String'];
  password: Scalars['String'];
};


export type MutationLoginArgs = {
  name: Scalars['String'];
  password: Scalars['String'];
};

export type Query = {
  __typename?: 'Query';
  /** The current build number of the application running. */
  build: Scalars['Int'];
  getCurrentUser?: Maybe<User>;
  /** Returns all leader cards available to build decks with. */
  leaders: Array<Leader>;
  /** Returns all non-leader cards available to build decks with. */
  units: Array<Unit>;
  /** The current version of the application running. */
  version: Scalars['SemVer'];
};

export type Unit = {
  __typename?: 'Unit';
  combats?: Maybe<Array<Combat>>;
  created: Scalars['DateTime'];
  dlc?: Maybe<Dlc>;
  effects?: Maybe<Array<Effect>>;
  faction: Faction;
  hero?: Maybe<Scalars['Boolean']>;
  id: Scalars['ID'];
  musterPrefix?: Maybe<Scalars['String']>;
  name: Scalars['String'];
  occurrences: Scalars['Int'];
  scorchMin?: Maybe<Scalars['Int']>;
  scorchScope?: Maybe<Combat>;
  strength?: Maybe<Scalars['Int']>;
};

export type User = {
  __typename?: 'User';
  created: Scalars['DateTime'];
  id: Scalars['ID'];
  name: Scalars['String'];
};

export type AdditionalEntityFields = {
  path?: InputMaybe<Scalars['String']>;
  type?: InputMaybe<Scalars['String']>;
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
