import { PropsWithChildren } from 'react'
import { useSubscription } from '@apollo/client'

import addToCacheList from './util/add-to-cache-list'
import {
  DeckAddedDocument,
  DecksDocument,
  DeckSetDocument,
  DecksQuery,
  DeckUnit,
  GameAddedDocument,
  GameDeckDocument,
  GameDeckQuery,
  GameDocument,
  GameQuery,
  GameReadyDocument,
  GamesDocument,
  GameSetDocument,
  GamesQuery,
  OrderSetDocument,
  PassPlayedDocument,
  RoundEndedForDeckDocument,
  UnitPlayedFromDeckDocument,
  UnitPlayedOnGameDocument,
  UnitRedrawnDocument,
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

  useSubscription(DeckAddedDocument, {
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
  useSubscription(DeckSetDocument, {
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
  useSubscription(GameAddedDocument, {
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
  useSubscription(GameReadyDocument, {
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
  useSubscription(GameSetDocument, {
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
  useSubscription(OrderSetDocument, {
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
  useSubscription(RoundEndedForDeckDocument, {
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
  useSubscription(PassPlayedDocument, {
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
  useSubscription(UnitPlayedFromDeckDocument, {
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
  useSubscription(UnitPlayedOnGameDocument, {
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
  useSubscription(UnitRedrawnDocument, {
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
