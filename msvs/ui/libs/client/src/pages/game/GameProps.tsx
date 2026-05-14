import { ApolloCache, ApolloClient } from '@apollo/client'
import { RefObject } from 'react'
import type { useMutation } from '@apollo/client/react'

import {
  AddGameMutation,
  DeckUnitFragment,
  FragmentType,
  GameDeckFragmentDoc,
  GameDeckQuery,
  GameFragment,
  GameQuery,
  MoveFragment,
  PlayPassMutation,
  PlayUnitMutation,
  RedrawMutation,
  SetDeckMutation,
  SetOrderMutation,
  ReadyMutation,
  WeatherUnitFragment,
  FieldUnitFragment,
  PlayUnitMutationVariables,
  AddGameMutationVariables,
  GameQueryVariables,
  GameDeckQueryVariables,
  SetDeckMutationVariables,
  SetOrderMutationVariables,
  RedrawMutationVariables,
  ReadyMutationVariables,
  PlayPassMutationVariables,
} from '@gwent/graphql-schema/apollo-typings'

export interface AddGameProps {
  addGame: useMutation.MutationFunction<AddGameMutation, AddGameMutationVariables, ApolloCache>
  loading: boolean
  error: unknown
}

export interface GameProps {
  game: GameFragment | undefined
  error: unknown
  loading: boolean
  refetch: (variables?: GameQueryVariables) => Promise<ApolloClient.QueryResult<GameQuery>>
}

export interface GameDeckProps {
  deck: FragmentType<typeof GameDeckFragmentDoc> | null | undefined
  error: unknown
  loading: boolean
  refetch: (variables?: GameDeckQueryVariables) => Promise<ApolloClient.QueryResult<GameDeckQuery>>
}

export interface SetDeckProps {
  setDeck: useMutation.MutationFunction<SetDeckMutation, SetDeckMutationVariables, ApolloCache>
  loading: boolean
  error: unknown
}

export interface SetOrderProps {
  setOrder: useMutation.MutationFunction<SetOrderMutation, SetOrderMutationVariables, ApolloCache>
  loading: boolean
  error: unknown
}

export interface RedrawProps {
  redraw: useMutation.MutationFunction<RedrawMutation, RedrawMutationVariables, ApolloCache>
  error: unknown
  loading: boolean
}

export interface ReadyProps {
  ready: useMutation.MutationFunction<ReadyMutation, ReadyMutationVariables, ApolloCache>
  error: unknown
  loading: boolean
}

export interface PlayUnitProps {
  playUnit: useMutation.MutationFunction<PlayUnitMutation, PlayUnitMutationVariables, ApolloCache>
  error: unknown
  loading: boolean
}

export interface PlayPassProps {
  playPass: useMutation.MutationFunction<PlayPassMutation, PlayPassMutationVariables, ApolloCache>
  error: unknown
  loading: boolean
}

export interface UnitForPlayer {
  unitFragment: DeckUnitFragment | FieldUnitFragment | WeatherUnitFragment
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
