import { ApolloCache, ApolloClient } from '@apollo/client'
import { RefObject } from 'react'
import type { useMutation } from '@apollo/client/react'

import {
  AddGameMutation,
  DeckUnit,
  Exact,
  SetDeckMutation,
  RedrawMutation,
  Game,
  GameDeck,
  GameDeckQuery,
  ReadyMutation,
  Scalars,
  GameQuery,
  SetOrderMutation,
  InputMaybe,
  Combat,
  PlayUnitMutation,
  PlayPassMutation,
  GameUnit,
  Move,
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
  game: Game | undefined
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
  deck: GameDeck | undefined
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
  unit: DeckUnit | GameUnit
  playerId: string | undefined
}

export interface FullUnitCards {
  units: UnitForPlayer[]
  currentIndex: number
}

export interface PlayerMove {
  move: Move
  playerIndex: number
  ref: RefObject<HTMLDivElement | null>
}

export interface MoveForRound {
  round: number
  playerMoves: PlayerMove[]
}
