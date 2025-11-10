import { Context } from '@gwent/graphql-schema/context'
import DeckResolver from '../../src/graphql/resolvers/types/deck-resolver'
import DecksQuery from '../../src/graphql/resolvers/queries/decks-query'
import DeckStore from '../../src/database/stores/deck-store'
import Permissions from '../../src/graphql/permissions'
import TestUtil from '../util/test-util'
import { UserDbObject } from '@gwent/graphql-schema/database-typings'

describe('decks-query', () => {
  describe('decks', () => {
    it('throws error if isAuthenticated throws error', async () => {
      await testDecks({
        isAuthenticatedResponse: Error('isAuthenticated error'),
      })
    })
    it('reaches out to DeckStore with user on session', async () => {
      await testDecks({
        isAuthenticatedResponse: TestUtil.getDbUser({}),
      })
    })
    it('logs to trace if enabled', async () => {
      await testDecks({
        isAuthenticatedResponse: TestUtil.getDbUser({}),
        traceEnabled: true,
      })
    })
  })
})

async function testDecks({
  isAuthenticatedResponse,
  traceEnabled,
}: {
  isAuthenticatedResponse: UserDbObject | Error
  traceEnabled?: boolean
}) {
  const context: Context = {
    session: {
      user: isAuthenticatedResponse instanceof Error ? undefined : isAuthenticatedResponse,
    },
  }
  const logPrefix = `decks by "${context.session?.user?._id}"`
  const deck = TestUtil.getDbDeck({})
  const isAuthenticatedSpy = jest.spyOn(Permissions, 'isAuthenticated').mockImplementation(() => {
    if (isAuthenticatedResponse instanceof Error) {
      throw isAuthenticatedResponse
    } else {
      return isAuthenticatedResponse
    }
  })
  const getSpy = jest.spyOn(DeckStore, 'get').mockResolvedValue([deck])
  const deckResolverSpy = jest.spyOn(DeckResolver, 'fromArray').mockResolvedValue([])
  const traceSpy = jest.fn().mockImplementation()
  DecksQuery['logger'] = {
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  const promise = DecksQuery.decks(context, null as any)
  if (isAuthenticatedResponse instanceof Error) {
    await expect(promise).rejects.toThrow(isAuthenticatedResponse)
  } else {
    await expect(promise).resolves.toEqual([])
  }

  expect(isAuthenticatedSpy.mock.calls).toEqual([
    [
      {
        context,
        label: 'decks query',
      },
    ],
  ])
  expect(getSpy.mock.calls).toEqual(isAuthenticatedResponse instanceof Error ? [] : [[context.session?.user?._id]])
  expect(deckResolverSpy.mock.calls).toEqual(
    isAuthenticatedResponse instanceof Error
      ? []
      : [
          [
            {
              decks: [deck],
            },
          ],
        ]
  )
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [`${logPrefix} args: "{}"`],
          [`${logPrefix} requested fields: "[]"`],
          [`${logPrefix} requested arguments: "[]"`],
          [`${logPrefix} decks: "${JSON.stringify([deck])}"`],
        ]
      : []
  )
}
