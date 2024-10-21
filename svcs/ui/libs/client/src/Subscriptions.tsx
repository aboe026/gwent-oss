import { PropsWithChildren } from 'react'

import addToCacheList from './util/add-to-cache-list'
import {
  DecksDocument,
  DecksQuery,
  Game,
  GameDocument,
  GameQuery,
  GamesDocument,
  GamesQuery,
  useDeckAddedSubscription,
  useGameAddedSubscription,
  useGameReadySubscription,
} from '@gwent/graphql-schema/apollo-typings'
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
      const previousDecks = client.cache.readQuery<DecksQuery>({ query: DecksDocument })
      if (previousDecks) {
        // only update cache if the query has already been run (there is something in the cache)
        // otherwise when navigating to decks, it will not fire the query, so would only show the
        // new created deck, and not all decks for the user
        client.cache.updateQuery<DecksQuery>(
          {
            query: DecksDocument,
          },
          (previous) => ({
            decks: addToCacheList({
              add: data.data?.deckAdded,
              previous: previous?.decks,
            }),
          })
        )
      }
    },
  })
  useGameAddedSubscription({
    skip: !user,
    onData: ({ data, client }) => {
      const previousGames = client.cache.readQuery<GamesQuery>({ query: GamesDocument })
      if (previousGames) {
        // only update cache if the query has already been run (there is something in the cache)
        // otherwise when navigating to games, it will not fire the query, so would only show the
        // new created game, and not all games for the user
        client.cache.updateQuery<GamesQuery>(
          {
            query: GamesDocument,
          },
          (previous) => ({
            games: addToCacheList({
              add: data.data?.gameAdded,
              previous: previous?.games,
            }),
          })
        )
      }
    },
  })
  useGameReadySubscription({
    skip: !user,
    onData: ({ data, client }) => {
      const updatedGame = data.data?.gameReady
      const previousGame = client.cache.readQuery<GameQuery>({
        query: GameDocument,
        variables: {
          id: updatedGame?.id,
        },
      })
      if (previousGame) {
        client.cache.updateQuery<GameQuery>(
          {
            query: GameDocument,
          },
          () => ({
            game: updatedGame as Game,
          })
        )
      }
    },
  })

  return <>{children}</>
}
