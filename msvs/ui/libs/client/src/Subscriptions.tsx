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
  DeckUnit as DeckUnitRaw,
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
  useSubscription(UnitPlayedFromDeckDocument, {
    skip: !user,
    onData: ({ data, client }) => {
      const game = data.data?.unitPlayedFromDeck.game
      const handed = data.data?.unitPlayedFromDeck.handed
      const discarded = data.data?.unitPlayedFromDeck.discarded
      const playedDeckUnit = useFragment(DeckUnitFragmentDoc, data.data?.unitPlayedFromDeck.unit)
      const playedUnit = useFragment(UnitFragmentDoc, playedDeckUnit?.unit)
      if (game && playedDeckUnit && playedUnit) {
        client.cache.updateQuery<GameDeckQuery>(
          {
            query: GameDeckDocument,
            variables: {
              game: game.id,
            },
          },
          (previous) => {
            if (previous?.gameDeck) {
              const newHand = [...previous.gameDeck.hand.filter((deckUnit) => deckUnit.unit.id !== playedUnit.id)]
              const newDiscard = [...previous.gameDeck.discard]
              const existingHandIndex = newHand.findIndex((deckUnit) => deckUnit.unit.id === playedUnit.id)
              if (existingHandIndex >= 0) {
                newHand.splice(existingHandIndex, 1)
              } else {
                const existingDiscardIndex = newDiscard.findIndex((deckUnit) => deckUnit.unit.id === playedUnit.id)
                if (existingDiscardIndex >= 0) {
                  newDiscard.splice(existingDiscardIndex, 1)
                }
              }
              if (handed) {
                const currentHandIds = newHand.map((handUnit) => handUnit.unit.id)
                for (const rehand of handed) {
                  const deckUnit = useFragment(DeckUnitFragmentDoc, rehand)
                  if (!currentHandIds.includes(useFragment(UnitFragmentDoc, deckUnit.unit).id)) {
                    newHand.push(deckUnit as DeckUnitRaw)
                  }
                }
              }
              if (discarded) {
                const currentDiscardIds = newDiscard.map((discardUnit) => discardUnit.unit.id)
                for (const discard of discarded) {
                  const deckUnit = useFragment(DeckUnitFragmentDoc, discard)
                  if (!currentDiscardIds.includes(useFragment(UnitFragmentDoc, deckUnit.unit).id)) {
                    newDiscard.push(deckUnit as DeckUnitRaw)
                  }
                }
              }
              return {
                gameDeck: {
                  ...previous.gameDeck,
                  hand: newHand,
                  discard: newDiscard,
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
