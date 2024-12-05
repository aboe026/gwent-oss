import { ObjectId } from 'mongodb'

import { Context } from '@gwent/graphql-schema/context'
import DeckResolver from '../../src/graphql/resolvers/types/deck-resolver'
import DecksQuery from '../../src/graphql/resolvers/queries/decks-query'
import DeckStore from '../../src/database/stores/deck-store'
import { NOT_AUTHENTICATED_MESSAGE } from '@gwent/constants'
import TestUtil from '../test-util'

describe('decks-query', () => {
  describe('decks', () => {
    it('throws error if no user on context', async () => {
      await testDecks({
        error: Error(NOT_AUTHENTICATED_MESSAGE),
        errorCalls: [[`No user on context for decks query: "${JSON.stringify({})}".`]],
      })
    })
    it('reaches out to DeckStore with user on session', async () => {
      await testDecks({
        userId: new ObjectId(),
      })
    })
    it('logs to trace if enabled', async () => {
      await testDecks({
        userId: new ObjectId(),
        traceEnabled: true,
      })
    })
  })
})

async function testDecks({
  userId,
  error,
  errorCalls = [],
  traceEnabled,
}: {
  userId?: ObjectId
  error?: Error
  errorCalls?: any[][]
  traceEnabled?: boolean
}) {
  const context: Context = {
    session: {},
  }
  if (userId && context.session) {
    context.session.user = TestUtil.getDbUser({
      id: userId,
    })
  }
  const logPrefix = `decks by "${context.session?.user?._id}"`
  const deck = TestUtil.getDbDeck({})
  const getSpy = jest.spyOn(DeckStore, 'get').mockResolvedValue([deck])
  const deckResolverSpy = jest.spyOn(DeckResolver, 'fromArray').mockResolvedValue([])
  const errorSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  DecksQuery['logger'] = {
    error: errorSpy,
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  await expect(DecksQuery.decks(context, null as any)).resolves.toEqual(error || [])

  expect(getSpy.mock.calls).toEqual(error ? [] : [[context.session?.user?._id]])
  expect(deckResolverSpy.mock.calls).toEqual(
    error
      ? []
      : [
          [
            {
              decks: [deck],
              neutralDeckStats: undefined,
              neutralLeaderStats: undefined,
              neutralUnitStats: undefined,
            },
          ],
        ]
  )
  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [`${logPrefix} requested fields: "[]"`],
          [`${logPrefix} requested arguments: "[]"`],
          [`${logPrefix} decks: "${JSON.stringify([deck])}"`],
        ]
      : []
  )
}
