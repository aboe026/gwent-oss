import FactionResolver from '../../src/graphql/resolvers/types/faction-resolver'
import TestUtil from '../util/test-util'
import DeckResolver from '../../src/graphql/resolvers/types/deck-resolver'
import EventManager from '../../src/graphql/event-manager'
import AddDeckResolution from '../../src/graphql/resolvers/mutations/add-deck/add-deck-resolution'
import LeaderResolver from '../../src/graphql/resolvers/types/leader-resolver'
import { PubSubEvents } from '@gwent/constants'

describe('add-deck-resolution', () => {
  it('returns resolved deck', async () => {
    await testAddDeckResolution({})
  })
  it('logs to trace if enabled', async () => {
    await testAddDeckResolution({
      traceEnabled: true,
    })
  })
})

async function testAddDeckResolution({ traceEnabled }: { traceEnabled?: boolean }) {
  const logPrefix = 'log-prefix'
  const faction = TestUtil.getDbFaction({})
  const leader = TestUtil.getDbLeader({
    faction: faction._id,
  })
  const deck = TestUtil.getDbDeck({
    faction: faction._id,
    leader: leader._id,
  })
  const deckUnits = [TestUtil.getDeckUnit({}), TestUtil.getDeckUnit({})]
  const resolvedFaction = TestUtil.getFactionFromDbFaction(faction)
  const resolvedLeader = TestUtil.getLeaderFromDbLeader(leader)
  const resolvedDeck = TestUtil.getDeckFromDbDeck({
    deck,
    faction: resolvedFaction,
  })
  const factionResolveSpy = jest.spyOn(FactionResolver, 'fromObject').mockResolvedValue(resolvedFaction)
  const leaderResolveSpy = jest.spyOn(LeaderResolver, 'fromObject').mockResolvedValue(resolvedLeader)
  const deckResolveSpy = jest.spyOn(DeckResolver, 'fromObject').mockResolvedValue(resolvedDeck)
  const publishSpy = jest.spyOn(EventManager.pubsub, 'publish').mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  AddDeckResolution['logger'] = {
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  await expect(
    AddDeckResolution.addDeckResolution({
      deck,
      deckUnits,
      faction,
      leader,
      logPrefix,
    })
  ).resolves.toEqual(resolvedDeck)

  expect(factionResolveSpy.mock.calls).toEqual([
    [
      {
        faction,
      },
    ],
  ])
  expect(leaderResolveSpy.mock.calls).toEqual([
    [
      {
        leader,
        faction: resolvedFaction,
      },
    ],
  ])
  expect(deckResolveSpy.mock.calls).toEqual([
    [
      {
        deck,
        faction: resolvedFaction,
        leader: resolvedLeader,
        units: deckUnits,
      },
    ],
  ])
  expect(publishSpy.mock.calls).toEqual([
    [
      PubSubEvents.DeckAdded,
      {
        deckAdded: resolvedDeck,
      },
    ],
  ])
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [`${logPrefix} resolvedFaction: "${JSON.stringify(resolvedFaction)}"`],
          [`${logPrefix} resolvedDeck: "${JSON.stringify(resolvedDeck)}"`],
        ]
      : []
  )
}
