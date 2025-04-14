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
  usePassPlayedSubscription,
  useRoundEndedForDeckSubscription,
  useUnitPlayedFromDeckSubscription,
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
      const gameDeck = data.data?.deckSet.deck
      const game = data.data?.deckSet.game
      if (gameDeck && game) {
        client.cache.updateQuery<GameDeckQuery>(
          {
            query: GameDeckDocument,
            variables: {
              game: game.id,
            },
          },
          (previous) => {
            if (!previous?.gameDeck) {
              return {
                gameDeck,
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
      const game = data.data?.gameReady
      if (game) {
        client.cache.updateQuery<GameQuery>(
          {
            query: GameDocument,
            variables: {
              id: game.id,
            },
          },
          (previous) => {
            if (previous?.game) {
              return {
                game,
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
      const game = data.data?.gameSet
      if (game) {
        client.cache.updateQuery<GameQuery>(
          {
            query: GameDocument,
            variables: {
              id: game.id,
            },
          },
          (previous) => {
            if (previous?.game) {
              return {
                game,
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
      const game = data.data?.orderSet
      if (game) {
        client.cache.updateQuery<GameQuery>(
          {
            query: GameDocument,
            variables: {
              id: game.id,
            },
          },
          (previous) => {
            if (previous?.game) {
              return {
                game,
              }
            }
          }
        )
      }
    },
  })
  useRoundEndedForDeckSubscription({
    skip: !user,
    onData: ({ data, client }) => {
      const game = data.data?.roundEndedForDeck.game
      const gameDeck = data.data?.roundEndedForDeck.deck
      if (game && gameDeck) {
        client.cache.updateQuery<GameDeckQuery>(
          {
            query: GameDeckDocument,
            variables: {
              game: game.id,
            },
          },
          (previous) => {
            if (previous?.gameDeck) {
              return {
                gameDeck,
              }
            }
          }
        )
      }
    },
  })
  usePassPlayedSubscription({
    skip: !user,
    onData: ({ data, client }) => {
      const game = data.data?.passPlayed
      if (game) {
        client.cache.updateQuery<GameQuery>(
          {
            query: GameDocument,
            variables: {
              id: game.id,
            },
          },
          (previous) => {
            if (previous?.game) {
              return {
                game,
              }
            }
          }
        )
      }
    },
  })
  useUnitPlayedFromDeckSubscription({
    skip: !user,
    onData: ({ data, client }) => {
      const game = data.data?.unitPlayedFromDeck.game
      const playedUnit = data.data?.unitPlayedFromDeck.unit
      if (game && playedUnit) {
        client.cache.updateQuery<GameDeckQuery>(
          {
            query: GameDeckDocument,
            variables: {
              game: game.id,
            },
          },
          (previous) => {
            if (previous?.gameDeck) {
              return {
                gameDeck: {
                  ...previous.gameDeck,
                  hand: previous.gameDeck.hand.filter((deckUnit) => deckUnit.unit.id !== playedUnit.unit.id),
                  discard:
                    playedUnit.unit.name === 'Scorch'
                      ? [...previous.gameDeck.discard, playedUnit]
                      : previous.gameDeck.discard,
                },
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
      const game = data.data?.unitPlayedOnGame.game
      if (game) {
        client.cache.updateQuery<GameQuery>(
          {
            query: GameDocument,
            variables: {
              id: game.id,
            },
          },
          (previous) => {
            if (previous?.game) {
              return {
                game,
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
