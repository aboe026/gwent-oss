import { Context } from '@gwent/graphql-schema/context'
import DeckResolver from '../../src/graphql/resolvers/types/deck-resolver'
import DecksQuery from '../../src/graphql/resolvers/queries/decks-query'
import DeckStore from '../../src/database/stores/deck-store'
import TestUtil from '../test-util'

describe('decks-query', () => {
  describe('decks', () => {
    it('reaches out to DeckStore with user on session', async () => {
      await testDecks({})
    })
    it('logs to trace if enabled', async () => {
      await testDecks({
        traceEnabled: true,
      })
    })
  })
})

async function testDecks({ traceEnabled }: { traceEnabled?: boolean }) {
  const context: Context = {
    session: {
      user: TestUtil.getDbUser({}),
    },
  }
  const logPrefix = `decks by "${context.session?.user?._id}"`
  const deck = TestUtil.getDbDeck({})
  const getSpy = jest.spyOn(DeckStore, 'get').mockResolvedValue([deck])
  const deckResolverSpy = jest.spyOn(DeckResolver, 'fromArray').mockResolvedValue([])
  const traceSpy = jest.fn().mockImplementation()
  DecksQuery['logger'] = {
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  await expect(DecksQuery.decks(context, null as any)).resolves.toEqual([])

  expect(getSpy.mock.calls).toEqual([[context.session?.user?._id]])
  expect(deckResolverSpy.mock.calls).toEqual([
    [
      {
        decks: [deck],
      },
    ],
  ])
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
