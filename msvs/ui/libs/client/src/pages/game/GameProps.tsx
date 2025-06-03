import {
  ApolloCache,
  ApolloError,
  ApolloQueryResult,
  DefaultContext,
  FetchResult,
  MutationFunctionOptions,
} from '@apollo/client'
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
      | MutationFunctionOptions<
          AddGameMutation,
          Exact<{
            opponentNames: string | string[]
          }>,
          DefaultContext,
          ApolloCache<any> // eslint-disable-line @typescript-eslint/no-explicit-any
        >
      | undefined
  ) => Promise<FetchResult<AddGameMutation>>
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
  ) => Promise<ApolloQueryResult<GameQuery>>
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
  ) => Promise<ApolloQueryResult<GameDeckQuery>>
}

export interface SetDeckProps {
  setDeck: (
    options?:
      | MutationFunctionOptions<
          SetDeckMutation,
          Exact<{
            game: string
            deck: string
          }>,
          DefaultContext,
          ApolloCache<any> // eslint-disable-line @typescript-eslint/no-explicit-any
        >
      | undefined
  ) => Promise<FetchResult<SetDeckMutation>>
  loading: boolean
  error: ApolloError | undefined
}

export interface SetOrderProps {
  setOrder: (
    options?:
      | MutationFunctionOptions<
          SetOrderMutation,
          Exact<{
            game: Scalars['ID']['input']
            users?: InputMaybe<Array<Scalars['ID']['input']> | Scalars['ID']['input']>
          }>,
          DefaultContext,
          ApolloCache<any> // eslint-disable-line @typescript-eslint/no-explicit-any
        >
      | undefined
  ) => Promise<FetchResult<SetOrderMutation>>
  loading: boolean
  error: ApolloError | undefined
}

export interface RedrawProps {
  redraw: (
    options?:
      | MutationFunctionOptions<
          RedrawMutation,
          Exact<{
            game: string
            unit: string
          }>,
          DefaultContext,
          ApolloCache<any> // eslint-disable-line @typescript-eslint/no-explicit-any
        >
      | undefined
  ) => Promise<FetchResult<RedrawMutation>>
  error: ApolloError | undefined
  loading: boolean
}

export interface ReadyProps {
  ready: (
    options?:
      | MutationFunctionOptions<
          ReadyMutation,
          Exact<{
            game: string
          }>,
          DefaultContext,
          ApolloCache<any> // eslint-disable-line @typescript-eslint/no-explicit-any
        >
      | undefined
  ) => Promise<FetchResult<ReadyMutation>>
  error: ApolloError | undefined
  loading: boolean
}

export interface PlayUnitProps {
  playUnit: (
    options?:
      | MutationFunctionOptions<
          PlayUnitMutation,
          Exact<{
            game: Scalars['ID']['input']
            unit: Scalars['ID']['input']
            combat?: InputMaybe<Combat>
          }>,
          DefaultContext,
          ApolloCache<any> // eslint-disable-line @typescript-eslint/no-explicit-any
        >
      | undefined
  ) => Promise<FetchResult<PlayUnitMutation>>
  error: ApolloError | undefined
  loading: boolean
}

export interface PlayPassProps {
  playPass: (
    options?:
      | MutationFunctionOptions<
          PlayPassMutation,
          Exact<{
            game: Scalars['ID']['input']
          }>,
          DefaultContext,
          ApolloCache<any> // eslint-disable-line @typescript-eslint/no-explicit-any
        >
      | undefined
  ) => Promise<FetchResult<PlayPassMutation>>
  error: ApolloError | undefined
  loading: boolean
}

export interface UnitForPlayer {
  unit: DeckUnit | GameUnit
  playerId: string | undefined
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
