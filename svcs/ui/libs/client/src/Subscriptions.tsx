import { PropsWithChildren } from 'react'

import addToCacheList from './util/add-to-cache-list'
import {
  DecksDocument,
  DecksQuery,
  DeckUnit,
  GameDeckDocument,
  GameDeckQuery,
  GameDocument,
  GameQuery,
  GamesDocument,
  GamesQuery,
  useDeckAddedSubscription,
  useDeckSetSubscription,
  useGameAddedSubscription,
  useGameReadySubscription,
  useGameSetSubscription,
  useOrderSetSubscription,
  useUnitPlayedOnGameSubscription,
  useUnitRedrawnSubscription,
} from '@gwent/graphql-schema/apollo-typings'
import updateGameDeckCacheOnRedraw from './util/update-game-deck-cache-on-redraw'
import { useUserContext } from './App'

/**
 * A class to listen to GraphQL subscriptions and update Apollo cache accordingly.
 *
 * @param config The configuration for the component
 * @param config.children The children to render underneath the component.
 * @returns A component which updates the Apollo cache with Subscription events.
 */
export default function Subscriptions({ children }: PropsWithChildren) {
  const { user } = useUserContext()

  useDeckAddedSubscription({
    skip: !user,
    onData: ({ data, client }) => {
      const newDeck = data.data?.deckAdded
      if (newDeck) {
        client.cache.updateQuery<DecksQuery>(
          {
            query: DecksDocument,
          },
          (previous) => {
            if (previous?.decks) {
              return {
                decks: addToCacheList({
                  add: data.data?.deckAdded,
                  previous: previous?.decks,
                }),
              }
            }
          }
        )
      }
    },
  })
  useDeckSetSubscription({
    skip: !user,
    onData: ({ data, client }) => {
      const updatedGameDeck = data.data?.deckSet.deck
      const updatedGame = data.data?.deckSet.game
      if (updatedGameDeck && updatedGame) {
        client.cache.updateQuery<GameDeckQuery>(
          {
            query: GameDeckDocument,
            variables: {
              game: updatedGame.id,
            },
          },
          (previous) => {
            if (!previous?.gameDeck) {
              return {
                gameDeck: updatedGameDeck,
              }
            }
          }
        )
      }
    },
  })
  useGameAddedSubscription({
    skip: !user,
    onData: ({ data, client }) => {
      client.cache.updateQuery<GamesQuery>(
        {
          query: GamesDocument,
        },
        (previous) => {
          if (previous?.games) {
            return {
              games: addToCacheList({
                add: data.data?.gameAdded,
                previous: previous?.games,
              }),
            }
          }
        }
      )
    },
  })
  useGameReadySubscription({
    skip: !user,
    onData: ({ data, client }) => {
      const updatedGame = data.data?.gameReady
      if (updatedGame) {
        client.cache.updateQuery<GameQuery>(
          {
            query: GameDocument,
            variables: {
              id: updatedGame.id,
            },
          },
          (previous) => {
            if (previous?.game) {
              return {
                game: updatedGame,
              }
            }
          }
        )
      }
    },
  })
  useGameSetSubscription({
    skip: !user,
    onData: ({ data, client }) => {
      const updatedGame = data.data?.gameSet
      if (updatedGame) {
        client.cache.updateQuery<GameQuery>(
          {
            query: GameDocument,
            variables: {
              id: updatedGame.id,
            },
          },
          (previous) => {
            if (previous?.game) {
              return {
                game: updatedGame,
              }
            }
          }
        )
      }
    },
  })
  useOrderSetSubscription({
    skip: !user,
    onData: ({ data, client }) => {
      const updatedGame = data.data?.orderSet
      if (updatedGame) {
        client.cache.updateQuery<GameQuery>(
          {
            query: GameDocument,
            variables: {
              id: updatedGame.id,
            },
          },
          (previous) => {
            if (previous?.game) {
              return {
                game: updatedGame,
              }
            }
          }
        )
      }
    },
  })
  useUnitPlayedOnGameSubscription({
    skip: !user,
    onData: ({ data, client }) => {
      const updatedGame = data.data?.unitPlayedOnGame.game
      if (updatedGame) {
        client.cache.updateQuery<GameQuery>(
          {
            query: GameDocument,
            variables: {
              id: updatedGame.id,
            },
          },
          (previous) => {
            if (previous?.game) {
              return {
                game: updatedGame,
              }
            }
          }
        )
      }
    },
  })
  useUnitRedrawnSubscription({
    skip: !user,
    onData: ({ data, client }) => {
      const from = data.data?.unitRedrawn.from
      const to = data.data?.unitRedrawn.to
      const game = data.data?.unitRedrawn.game
      if (from && to && game) {
        client.cache.updateQuery<GameDeckQuery>(
          {
            query: GameDeckDocument,
            variables: {
              game: game.id,
            },
          },
          (previous) =>
            updateGameDeckCacheOnRedraw({
              from: from as DeckUnit,
              previous,
              to: to as DeckUnit,
            })
        )
      }
    },
  })

  return <>{children}</>
}
