import { PropsWithChildren } from 'react'
import { useSubscription } from '@apollo/client/react'

import addToCacheList from './util/add-to-cache-list'
import {
  DeckAddedDocument,
  DeckFragment,
  DeckFragmentDoc,
  DecksDocument,
  DecksQuery,
  DeckSetDocument,
  DeckUnitFragmentDoc,
  GameAddedDocument,
  GameDeckDocument,
  GameDeckQuery,
  GameDocument,
  GameFragment,
  GameFragmentDoc,
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
  UnitFragmentDoc,
} from '@gwent/graphql-schema/apollo-typings'
import {
  DecksQuery as DecksQueryRaw,
  GameDeckQuery as GameDeckQueryRaw,
  GameQuery as GameQueryRaw,
  GamesQuery as GamesQueryRaw,
} from '@gwent/graphql-schema/apollo-raw-typings'
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
                  add: useFragment(DeckFragmentDoc, data.data?.deckAdded),
                  previous: previous?.decks as DeckFragment[],
                }),
              } as DecksQueryRaw
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
              } as GameDeckQueryRaw
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
                add: useFragment(GameFragmentDoc, data.data?.gameAdded),
                previous: previous?.games as GameFragment[],
              }),
            } as GamesQueryRaw
          }
        }
      )
    },
  })
  useSubscription(GameReadyDocument, {
    skip: !user,
    onData: ({ data, client }) => {
      const game = useFragment(GameFragmentDoc, data.data?.gameReady)
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
              } as GameQueryRaw
            }
          }
        )
      }
    },
  })
  useSubscription(GameSetDocument, {
    skip: !user,
    onData: ({ data, client }) => {
      const game = useFragment(GameFragmentDoc, data.data?.gameSet)
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
              } as GameQueryRaw
            }
          }
        )
      }
    },
  })
  useSubscription(OrderSetDocument, {
    skip: !user,
    onData: ({ data, client }) => {
      const game = useFragment(GameFragmentDoc, data.data?.orderSet)
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
              } as GameQueryRaw
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
              } as GameDeckQueryRaw
            }
          }
        )
      }
    },
  })
  useSubscription(PassPlayedDocument, {
    skip: !user,
    onData: ({ data, client }) => {
      const game = useFragment(GameFragmentDoc, data.data?.passPlayed)
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
              } as GameQueryRaw
            }
          }
        )
      }
    },
  })
  // TODO: create new "updatedGameDeck" subscription? have other places we're modifying GameDeckQuery use that too?
  useSubscription(UnitPlayedFromDeckDocument, {
    skip: !user,
    onData: ({ data, client }) => {
      const game = data.data?.unitPlayedFromDeck.game
      const playedUnit = useFragment(
        UnitFragmentDoc,
        useFragment(DeckUnitFragmentDoc, data.data?.unitPlayedFromDeck.unit)?.unit
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
              } as GameDeckQueryRaw
            }
          }
        )
      }
    },
  })
  useSubscription(UnitPlayedOnGameDocument, {
    skip: !user,
    onData: ({ data, client }) => {
      const game = useFragment(GameFragmentDoc, data.data?.unitPlayedOnGame.game)
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
              } as GameQueryRaw
            }
          }
        )
      }
    },
  })
  useSubscription(UnitRedrawnDocument, {
    skip: !user,
    onData: ({ data, client }) => {
      const from = useFragment(DeckUnitFragmentDoc, data.data?.unitRedrawn.from)
      const to = useFragment(DeckUnitFragmentDoc, data.data?.unitRedrawn.to)
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
            if (previous?.gameDeck) {
              return updateGameDeckCacheOnRedraw({
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
