import { PropsWithChildren } from 'react'

import addToCacheList from './util/add-to-cache-list'
import {
  DecksDocument,
  DecksQuery,
  DeckUnit,
  Game,
  GameDeck,
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
  useUnitRedrawnSubscription,
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
      const newDeck = data.data?.deckAdded
      if (newDeck) {
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
      }
    },
  })
  useDeckSetSubscription({
    skip: !user,
    onData: ({ data, client }) => {
      const updatedGameDeck = data.data?.deckSet.deck
      const updatedGame = data.data?.deckSet.game
      if (updatedGameDeck && updatedGame) {
        const variables = {
          game: updatedGame.id,
        }
        const previousGameDeck = client.cache.readQuery<GameDeckQuery>({
          query: GameDeckDocument,
          variables,
        })
        if (!previousGameDeck?.gameDeck) {
          client.cache.updateQuery<GameDeckQuery>(
            {
              query: GameDeckDocument,
              variables,
            },
            () => ({
              gameDeck: updatedGameDeck as GameDeck,
            })
          )
        }
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
      if (updatedGame) {
        client.cache.updateQuery<GameQuery>(
          {
            query: GameDocument,
            variables: {
              id: updatedGame.id,
            },
          },
          (previous) => {
            // TODO: extract to shared method that Game.tsx can use to reduce code duplication
            const prevGame = previous?.game
            if (prevGame) {
              return {
                game: {
                  ...prevGame,
                  players: prevGame.players.map((player) => {
                    let updatedReady = player.ready
                    const updatedPlayer = updatedGame.players.find(
                      (updatedGamePlayer) => updatedGamePlayer.user.name === player.user.name
                    )
                    if (updatedPlayer) {
                      updatedReady = updatedPlayer.ready
                    }
                    return {
                      ...player,
                      ready: updatedReady,
                    }
                  }),
                },
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
        const variables = {
          id: updatedGame.id,
        }
        const previousGame = client.cache.readQuery<GameQuery>({
          query: GameDocument,
          variables,
        })
        if (previousGame) {
          client.cache.updateQuery<GameQuery>(
            {
              query: GameDocument,
              variables,
            },
            () => ({
              game: updatedGame as Game,
            })
          )
        }
      }
    },
  })
  useOrderSetSubscription({
    skip: !user,
    onData: ({ data, client }) => {
      const updatedGame = data.data?.orderSet
      if (updatedGame) {
        const variables = {
          id: updatedGame.id,
        }
        const previousGame = client.cache.readQuery<GameQuery>({
          query: GameDocument,
          variables,
        })
        if (previousGame) {
          client.cache.updateQuery<GameQuery>(
            {
              query: GameDocument,
              variables,
            },
            () => ({
              game: updatedGame as Game,
            })
          )
        }
      }
    },
  })
  useUnitRedrawnSubscription({
    skip: !user,
    onData: ({ data, client }) => {
      const from = data.data?.unitRedrawn.from as DeckUnit
      const to = data.data?.unitRedrawn.to as DeckUnit
      const game = data.data?.unitRedrawn.game
      if (from && to && game) {
        const variables = {
          game: game.id,
        }
        const previousGameDeck = client.cache.readQuery<GameDeckQuery>({
          query: GameDeckDocument,
          variables,
        })?.gameDeck as GameDeck | undefined
        if (previousGameDeck) {
          client.cache.updateQuery<GameDeckQuery>(
            {
              query: GameDeckDocument,
              variables,
            },
            (previous) => ({
              gameDeck: {
                ...previous?.gameDeck,
                hand: [
                  ...(previous?.gameDeck?.hand || []).filter(
                    (deckUnit) => deckUnit.unit.id !== from?.unit.id && deckUnit.unit.id !== to.unit.id
                  ),
                  to,
                ],
                undrawn: [
                  ...(previous?.gameDeck?.undrawn || []).filter(
                    (deckUnit) => deckUnit.unit.id !== to?.unit.id && deckUnit.unit.id !== from.unit.id
                  ),
                  from,
                ],
                redraws: [
                  ...(previous?.gameDeck?.redraws || []).filter(
                    (deckUnit) => deckUnit.from.unit.id !== from.unit.id && deckUnit.to.unit.id !== to.unit.id
                  ),
                  {
                    from,
                    to,
                  },
                ],
              } as GameDeck,
            })
          )
        }
      }
    },
  })

  return <>{children}</>
}
