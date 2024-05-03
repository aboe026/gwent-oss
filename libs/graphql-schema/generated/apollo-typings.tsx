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
  units: Array<DeckUnitInput>;
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

export type AddDeckMutationVariables = Exact<{
  name: Scalars['String']['input'];
  faction: FactionKey;
  leader: Scalars['ID']['input'];
  units: Array<DeckUnitInput> | DeckUnitInput;
}>;


export type AddDeckMutation = { __typename?: 'Mutation', addDeck?: { __typename?: 'Deck', id: string } | null };

export type AddUserMutationVariables = Exact<{
  name: Scalars['String']['input'];
  password: Scalars['String']['input'];
}>;


export type AddUserMutation = { __typename?: 'Mutation', addUser?: { __typename?: 'User', id: string, name: string } | null };

export type ApplicationQueryVariables = Exact<{ [key: string]: never; }>;


export type ApplicationQuery = { __typename?: 'Query', application: { __typename?: 'Application', build: number, version: any } };

export type CurrentUserQueryVariables = Exact<{ [key: string]: never; }>;


export type CurrentUserQuery = { __typename?: 'Query', currentUser?: { __typename?: 'User', id: string, name: string, created: any } | null };

export type DecksQueryVariables = Exact<{ [key: string]: never; }>;


export type DecksQuery = { __typename?: 'Query', decks?: Array<{ __typename?: 'Deck', id: string, created: any, name: string, faction: { __typename?: 'Faction', key: FactionKey, name: string, image: string, ability?: string | null, stats: { __typename?: 'UnitStats', units: number, specials: number, heroes: number, close: number, ranged: number, siege: number, agile: number, strengthTotal: number } }, leader: { __typename?: 'Leader', name: string, ability: string, image: string }, stats: { __typename?: 'UnitStats', units: number, specials: number, heroes: number, close: number, ranged: number, siege: number, agile: number, strengthTotal: number, strengthAverage: number } }> | null };

export type FactionsQueryVariables = Exact<{ [key: string]: never; }>;


export type FactionsQuery = { __typename?: 'Query', factions: Array<{ __typename?: 'Faction', key: FactionKey, id: string, name: string, image: string, ability?: string | null, dlc?: { __typename?: 'Dlc', name: string, image: string } | null, stats: { __typename?: 'UnitStats', agile: number, avenger: number, berserker: number, bond: number, decoy: number, horn: number, mardroeme: number, medic: number, morale: number, muster: number, scorch: number, spy: number, weather: number, close: number, ranged: number, siege: number, units: number, specials: number, heroes: number, strengthAverage: number, strengthTotal: number, strengths: number } }> };

export type LeadersQueryVariables = Exact<{
  factions?: InputMaybe<Array<FactionKey> | FactionKey>;
}>;


export type LeadersQuery = { __typename?: 'Query', leaders: Array<{ __typename?: 'Leader', ability: string, id: string, image: string, name: string, quote: string, dlc?: { __typename?: 'Dlc', name: string, image: string } | null }> };

export type LoginMutationVariables = Exact<{
  name: Scalars['String']['input'];
  password: Scalars['String']['input'];
}>;


export type LoginMutation = { __typename?: 'Mutation', login?: { __typename?: 'User', id: string, name: string, created: any } | null };

export type LogoutMutationVariables = Exact<{ [key: string]: never; }>;


export type LogoutMutation = { __typename?: 'Mutation', logout?: boolean | null };

export type UnitsQueryVariables = Exact<{
  deckable?: InputMaybe<Scalars['Boolean']['input']>;
  factions?: InputMaybe<Array<FactionKey> | FactionKey>;
}>;


export type UnitsQuery = { __typename?: 'Query', units: Array<{ __typename?: 'Unit', combats?: Array<Combat> | null, deckable: boolean, hero?: boolean | null, id: string, images: Array<string>, name: string, quote: string, special?: boolean | null, strength?: number | null, dlc?: { __typename?: 'Dlc', name: string, image: string, key: DlcKey } | null, effects?: Array<{ __typename?: 'Effect', key: EffectKey, name: string, ability: string }> | null, faction: { __typename?: 'Faction', key: FactionKey } }> };


export const AddDeckDocument = gql`
    mutation AddDeck($name: String!, $faction: FactionKey!, $leader: ID!, $units: [DeckUnitInput!]!) {
  addDeck(name: $name, faction: $faction, leader: $leader, units: $units) {
    id
  }
}
    `;
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
export function useApplicationSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ApplicationQuery, ApplicationQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
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
export function useCurrentUserSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<CurrentUserQuery, CurrentUserQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<CurrentUserQuery, CurrentUserQueryVariables>(CurrentUserDocument, options);
        }
export type CurrentUserQueryHookResult = ReturnType<typeof useCurrentUserQuery>;
export type CurrentUserLazyQueryHookResult = ReturnType<typeof useCurrentUserLazyQuery>;
export type CurrentUserSuspenseQueryHookResult = ReturnType<typeof useCurrentUserSuspenseQuery>;
export type CurrentUserQueryResult = Apollo.QueryResult<CurrentUserQuery, CurrentUserQueryVariables>;
export const DecksDocument = gql`
    query Decks {
  decks {
    id
    created
    name
    faction {
      key
      name
      image
      ability
      stats(neutrals: true) {
        units
        specials
        heroes
        close
        ranged
        siege
        agile
        strengthTotal
      }
    }
    leader {
      name
      ability
      image
    }
    stats {
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
}
    `;

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
export function useDecksSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<DecksQuery, DecksQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<DecksQuery, DecksQueryVariables>(DecksDocument, options);
        }
export type DecksQueryHookResult = ReturnType<typeof useDecksQuery>;
export type DecksLazyQueryHookResult = ReturnType<typeof useDecksLazyQuery>;
export type DecksSuspenseQueryHookResult = ReturnType<typeof useDecksSuspenseQuery>;
export type DecksQueryResult = Apollo.QueryResult<DecksQuery, DecksQueryVariables>;
export const FactionsDocument = gql`
    query Factions {
  factions {
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
}
    `;

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
export function useFactionsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<FactionsQuery, FactionsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<FactionsQuery, FactionsQueryVariables>(FactionsDocument, options);
        }
export type FactionsQueryHookResult = ReturnType<typeof useFactionsQuery>;
export type FactionsLazyQueryHookResult = ReturnType<typeof useFactionsLazyQuery>;
export type FactionsSuspenseQueryHookResult = ReturnType<typeof useFactionsSuspenseQuery>;
export type FactionsQueryResult = Apollo.QueryResult<FactionsQuery, FactionsQueryVariables>;
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
export function useLeadersSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<LeadersQuery, LeadersQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
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
export const UnitsDocument = gql`
    query Units($deckable: Boolean, $factions: [FactionKey!]) {
  units(deckable: $deckable, factions: $factions) {
    combats
    deckable
    dlc {
      name
      image
      key
    }
    effects {
      key
      name
      ability
    }
    faction {
      key
    }
    hero
    id
    images
    name
    quote
    special
    strength
  }
}
    `;

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
export function useUnitsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<UnitsQuery, UnitsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<UnitsQuery, UnitsQueryVariables>(UnitsDocument, options);
        }
export type UnitsQueryHookResult = ReturnType<typeof useUnitsQuery>;
export type UnitsLazyQueryHookResult = ReturnType<typeof useUnitsLazyQuery>;
export type UnitsSuspenseQueryHookResult = ReturnType<typeof useUnitsSuspenseQuery>;
export type UnitsQueryResult = Apollo.QueryResult<UnitsQuery, UnitsQueryVariables>;