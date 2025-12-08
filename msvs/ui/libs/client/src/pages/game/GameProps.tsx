import { ApolloCache, ApolloClient } from '@apollo/client'
import { RefObject } from 'react'
import type { useMutation } from '@apollo/client/react'

import {
  AddGameMutation,
  Exact,
  SetDeckMutation,
  RedrawMutation,
  GameDeckQuery,
  ReadyMutation,
  Scalars,
  GameQuery,
  SetOrderMutation,
  InputMaybe,
  Combat,
  FragmentType,
  PlayUnitMutation,
  PlayPassMutation,
  DeckUnitFragment,
  GameUnitFragment,
  GameFragment,
  MoveFragment,
  GameDeckFragmentDoc,
} from '@gwent/graphql-schema/apollo-typings'

export interface AddGameProps {
  addGame: useMutation.MutationFunction<
    AddGameMutation,
    {
      opponentNames: Array<Scalars['String']['input']> | Scalars['String']['input']
    },
    ApolloCache
  >
  loading: boolean
  error: unknown
}

export interface GameProps {
  game: GameFragment | undefined
  error: unknown
  loading: boolean
  refetch: (
    variables?:
      | Partial<
          Exact<{
            id: Scalars['ID']['input']
          }>
        >
      | undefined
  ) => Promise<ApolloClient.QueryResult<GameQuery>>
}

export interface GameDeckProps {
  deck: FragmentType<typeof GameDeckFragmentDoc> | null | undefined
  error: unknown
  loading: boolean
  refetch: (
    variables?:
      | Partial<
          Exact<{
            game: Scalars['ID']['input']
          }>
        >
      | undefined
  ) => Promise<ApolloClient.QueryResult<GameDeckQuery>>
}

export interface SetDeckProps {
  setDeck: useMutation.MutationFunction<
    SetDeckMutation,
    {
      game: Scalars['ID']['input']
      deck: Scalars['ID']['input']
    },
    ApolloCache
  >
  loading: boolean
  error: unknown
}

export interface SetOrderProps {
  setOrder: useMutation.MutationFunction<
    SetOrderMutation,
    {
      game: Scalars['ID']['input']
      users?: InputMaybe<Array<Scalars['ID']['input']> | Scalars['ID']['input']> | undefined
    },
    ApolloCache
  >
  loading: boolean
  error: unknown
}

export interface RedrawProps {
  redraw: useMutation.MutationFunction<
    RedrawMutation,
    {
      game: Scalars['ID']['input']
      unit: Scalars['ID']['input']
    },
    ApolloCache
  >
  error: unknown
  loading: boolean
}

export interface ReadyProps {
  ready: useMutation.MutationFunction<
    ReadyMutation,
    {
      game: Scalars['ID']['input']
    },
    ApolloCache
  >
  error: unknown
  loading: boolean
}

export interface PlayUnitProps {
  playUnit: useMutation.MutationFunction<
    PlayUnitMutation,
    {
      game: Scalars['ID']['input']
      unit: Scalars['ID']['input']
      combat?: InputMaybe<Combat> | undefined
      target?: InputMaybe<Scalars['ID']['input']>
    },
    ApolloCache
  >
  error: unknown
  loading: boolean
}

export interface PlayPassProps {
  playPass: useMutation.MutationFunction<
    PlayPassMutation,
    {
      game: Scalars['ID']['input']
    },
    ApolloCache
  >
  error: unknown
  loading: boolean
}

export interface UnitForPlayer {
  unitFragment: DeckUnitFragment | GameUnitFragment
  playerName: string | undefined
}

export interface FullUnitCards {
  units: UnitForPlayer[]
  currentIndex: number
}

export interface PlayerMove {
  move: MoveFragment
  playerIndex: number
  ref: RefObject<HTMLDivElement | null>
}

export interface MoveForRound {
  round: number
  playerMoves: PlayerMove[]
}
