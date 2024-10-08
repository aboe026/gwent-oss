import { PropsWithChildren } from 'react'

import { DecksDocument, DecksQuery, useDeckAddedSubscription } from '@gwent/graphql-schema/apollo-typings'
import updateCacheList from './util/update-cache-list'

export default function Subscriptions({ children }: PropsWithChildren) {
  useDeckAddedSubscription({
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
            decks: updateCacheList({
              add: data.data?.deckAdded,
              previous: previous?.decks,
            }),
          })
        )
      }
    },
  })

  return <>{children}</>
}
