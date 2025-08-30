import { ApolloCache, ObservableQuery, ApolloLink } from '@apollo/client'
import { ApolloError } from '@apollo/client/v4-migration'
import type { useMutation } from '@apollo/client/react'
import { RefObject } from 'react'

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
  addGame: (
    options?:
      | useMutation.MutationFunctionOptions<
          AddGameMutation,
          Exact<{
            opponentNames: string | string[]
          }>, // eslint-disable-line @typescript-eslint/no-explicit-any
          ApolloCache<any>
        >
      | undefined
  ) => Promise<ApolloLink.Result<AddGameMutation>>
  loading: boolean
  error: ApolloError | undefined
}

export interface GameProps {
  game: Game | undefined
  error: ApolloError | undefined
  loading: boolean
  refetch: (
    variables?:
      | Partial<
          Exact<{
            id: Scalars['ID']['input']
          }>
        >
      | undefined
  ) => Promise<ObservableQuery.Result<GameQuery>>
}

export interface GameDeckProps {
  deck: GameDeck | undefined
  error: ApolloError | undefined
  loading: boolean
  refetch: (
    variables?:
      | Partial<
          Exact<{
            game: Scalars['ID']['input']
          }>
        >
      | undefined
  ) => Promise<ObservableQuery.Result<GameDeckQuery>>
}

export interface SetDeckProps {
  setDeck: (
    options?:
      | useMutation.MutationFunctionOptions<
          SetDeckMutation,
          Exact<{
            game: string
            deck: string
          }>, // eslint-disable-line @typescript-eslint/no-explicit-any
          ApolloCache<any>
        >
      | undefined
  ) => Promise<ApolloLink.Result<SetDeckMutation>>
  loading: boolean
  error: ApolloError | undefined
}

export interface SetOrderProps {
  setOrder: (
    options?:
      | useMutation.MutationFunctionOptions<
          SetOrderMutation,
          Exact<{
            game: Scalars['ID']['input']
            users?: InputMaybe<Array<Scalars['ID']['input']> | Scalars['ID']['input']>
          }>, // eslint-disable-line @typescript-eslint/no-explicit-any
          ApolloCache<any>
        >
      | undefined
  ) => Promise<ApolloLink.Result<SetOrderMutation>>
  loading: boolean
  error: ApolloError | undefined
}

export interface RedrawProps {
  redraw: (
    options?:
      | useMutation.MutationFunctionOptions<
          RedrawMutation,
          Exact<{
            game: string
            unit: string
          }>, // eslint-disable-line @typescript-eslint/no-explicit-any
          ApolloCache<any>
        >
      | undefined
  ) => Promise<ApolloLink.Result<RedrawMutation>>
  error: ApolloError | undefined
  loading: boolean
}

export interface ReadyProps {
  ready: (
    options?:
      | useMutation.MutationFunctionOptions<
          ReadyMutation,
          Exact<{
            game: string
          }>, // eslint-disable-line @typescript-eslint/no-explicit-any
          ApolloCache<any>
        >
      | undefined
  ) => Promise<ApolloLink.Result<ReadyMutation>>
  error: ApolloError | undefined
  loading: boolean
}

export interface PlayUnitProps {
  playUnit: (
    options?:
      | useMutation.MutationFunctionOptions<
          PlayUnitMutation,
          Exact<{
            game: Scalars['ID']['input']
            unit: Scalars['ID']['input']
            combat?: InputMaybe<Combat>
          }>, // eslint-disable-line @typescript-eslint/no-explicit-any
          ApolloCache<any>
        >
      | undefined
  ) => Promise<ApolloLink.Result<PlayUnitMutation>>
  error: ApolloError | undefined
  loading: boolean
}

export interface PlayPassProps {
  playPass: (
    options?:
      | useMutation.MutationFunctionOptions<
          PlayPassMutation,
          Exact<{
            game: Scalars['ID']['input']
          }>, // eslint-disable-line @typescript-eslint/no-explicit-any
          ApolloCache<any>
        >
      | undefined
  ) => Promise<ApolloLink.Result<PlayPassMutation>>
  error: ApolloError | undefined
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
