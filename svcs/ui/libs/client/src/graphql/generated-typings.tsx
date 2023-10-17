import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
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
  dlc?: Maybe<Dlc>;
  faction: Faction;
  id: Scalars['ID'];
  name: Scalars['String'];
};

export type Query = {
  __typename?: 'Query';
  /** The current build number of the application running. */
  build: Scalars['Int'];
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

export type GetLeadersQueryVariables = Exact<{ [key: string]: never; }>;


export type GetLeadersQuery = { __typename?: 'Query', leaders: Array<{ __typename?: 'Leader', id: string, name: string, faction: Faction, dlc?: Dlc | null }> };


export const GetLeadersDocument = gql`
    query GetLeaders {
  leaders {
    id
    name
    faction
    dlc
  }
}
    `;

/**
 * __useGetLeadersQuery__
 *
 * To run a query within a React component, call `useGetLeadersQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetLeadersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetLeadersQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetLeadersQuery(baseOptions?: Apollo.QueryHookOptions<GetLeadersQuery, GetLeadersQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetLeadersQuery, GetLeadersQueryVariables>(GetLeadersDocument, options);
      }
export function useGetLeadersLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetLeadersQuery, GetLeadersQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetLeadersQuery, GetLeadersQueryVariables>(GetLeadersDocument, options);
        }
export type GetLeadersQueryHookResult = ReturnType<typeof useGetLeadersQuery>;
export type GetLeadersLazyQueryHookResult = ReturnType<typeof useGetLeadersLazyQuery>;
export type GetLeadersQueryResult = Apollo.QueryResult<GetLeadersQuery, GetLeadersQueryVariables>;