import { PropsWithChildren } from 'react'
import { useSubscription } from '@apollo/client/react'

import addToCacheList from './util/add-to-cache-list'
import {
  CardUnitFragmentFragmentDoc,
  DeckAddedDocument,
  DecksDocument,
  DeckSetDocument,
  DecksQuery,
  DeckUnitFragmentFragmentDoc,
  GameAddedDocument,
  GameDeckDocument,
  GameDeckQuery,
  GameDocument,
  GameFragmentFragmentDoc,
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
  useFragment,
} from '@gwent/graphql-schema/apollo-typings'
import updateGameDeckCacheOnRedraw from './util/update-game-deck-cache-on-redraw'
import { useUserContext } from './UserContext'

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
                  add: data.data?.deckAdded as any, // eslint-disable-line @typescript-eslint/no-explicit-any
                  // TODO: fix so no explicit casting necessary
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
              } as any // eslint-disable-line @typescript-eslint/no-explicit-any
              // TODO: fix so no explicit casting necessary
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
                add: useFragment(GameFragmentFragmentDoc, data.data?.gameAdded) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
                // TODO: fix so no explicit casting necessary
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
      const game = useFragment(GameFragmentFragmentDoc, data.data?.gameReady)
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
              } as any // eslint-disable-line @typescript-eslint/no-explicit-any
              // TODO: fix so no explicit casting necessary
            }
          }
        )
      }
    },
  })
  useSubscription(GameSetDocument, {
    skip: !user,
    onData: ({ data, client }) => {
      const game = useFragment(GameFragmentFragmentDoc, data.data?.gameSet)
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
              } as any // eslint-disable-line @typescript-eslint/no-explicit-any
              // TODO: fix so no explicit casting necessary
            }
          }
        )
      }
    },
  })
  useSubscription(OrderSetDocument, {
    skip: !user,
    onData: ({ data, client }) => {
      const game = useFragment(GameFragmentFragmentDoc, data.data?.orderSet)
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
              } as any // eslint-disable-line @typescript-eslint/no-explicit-any
              // TODO: fix so no explicit casting necessary
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
              } as any // eslint-disable-line @typescript-eslint/no-explicit-any
              // TODO: fix so no explicit casting necessary
            }
          }
        )
      }
    },
  })
  useSubscription(PassPlayedDocument, {
    skip: !user,
    onData: ({ data, client }) => {
      const game = useFragment(GameFragmentFragmentDoc, data.data?.passPlayed)
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
              } as any // eslint-disable-line @typescript-eslint/no-explicit-any
              // TODO: fix so no explicit casting necessary
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
      const playedUnit = useFragment(
        CardUnitFragmentFragmentDoc,
        useFragment(DeckUnitFragmentFragmentDoc, data.data?.unitPlayedFromDeck.unit)?.unit
      )
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
                  hand: previous.gameDeck.hand.filter((deckUnit) => deckUnit.unit.id !== playedUnit.id),
                  discard:
                    playedUnit.name === 'Scorch'
                      ? [...previous.gameDeck.discard, playedUnit]
                      : previous.gameDeck.discard,
                },
              } as any // eslint-disable-line @typescript-eslint/no-explicit-any
              // TODO: fix so no explicit casting necessary
            }
          }
        )
      }
    },
  })
  useSubscription(UnitPlayedOnGameDocument, {
    skip: !user,
    onData: ({ data, client }) => {
      const game = useFragment(GameFragmentFragmentDoc, data.data?.unitPlayedOnGame.game)
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
              } as any // eslint-disable-line @typescript-eslint/no-explicit-any
              // TODO: fix so no explicit casting necessary
            }
          }
        )
      }
    },
  })
  useSubscription(UnitRedrawnDocument, {
    skip: !user,
    onData: ({ data, client }) => {
      const from = useFragment(DeckUnitFragmentFragmentDoc, data.data?.unitRedrawn.from)
      const to = useFragment(DeckUnitFragmentFragmentDoc, data.data?.unitRedrawn.to)
      const game = data.data?.unitRedrawn.game
      if (from && to && game) {
        client.cache.updateQuery<GameDeckQuery>(
          {
            query: GameDeckDocument,
            variables: {
              game: game.id,
            },
          },
          (previous) => {
            if (previous) {
              updateGameDeckCacheOnRedraw({
                from,
                previous,
                to,
              })
            }
          }
        )
      }
    },
  })

  return <>{children}</>
}
