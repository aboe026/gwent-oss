import { GraphQLResolveInfo } from 'graphql'
import { ObjectId } from 'mongodb'

import AddDeckImplementation from '../../src/graphql/resolvers/mutations/add-deck/add-deck-implementation'
import AddDeckMutation from '../../src/graphql/resolvers/mutations/add-deck/add-deck-mutation'
import AddDeckValidation from '../../src/graphql/resolvers/mutations/add-deck/add-deck-validation'
import { Context } from '@gwent/graphql-schema/context'
import DeckResolver from '../../src/graphql/resolvers/types/deck-resolver'
import EventManager from '../../src/graphql/event-manager'
import { FactionKey, MutationAddDeckArgs } from '@gwent/graphql-schema/resolver-typings'
import FactionResolver from '../../src/graphql/resolvers/types/faction-resolver'
import LeaderResolver from '../../src/graphql/resolvers/types/leader-resolver'
import TestUtil from '../util/test-util'
import { PubSubEvents } from '@gwent/constants'

describe('add-deck-mutation', () => {
  describe('addDeckMutation', () => {
    it('throws error if validate throws error', async () => {
      await testAddDeckMutation({
        validateError: Error('validate error'),
      })
    })
    it('throws error if implement throws error', async () => {
      await testAddDeckMutation({
        implementError: Error('implement error'),
      })
    })
    it('returns resolved deck if no errors', async () => {
      await testAddDeckMutation({})
    })
  })
})

async function testAddDeckMutation({
  validateError,
  implementError,
}: {
  validateError?: Error
  implementError?: Error
}) {
  const unitId = new ObjectId()
  const unitArtStyle = 2
  const args: MutationAddDeckArgs = {
    faction: FactionKey.Monsters,
    leader: 'leader-name',
    name: 'deck-name',
    units: [
      {
        id: unitId.toString(),
        artStyle: unitArtStyle,
      },
    ],
  }
  const userId = new ObjectId()
  const context: Context = {
    session: {
      user: TestUtil.getDbUser({
        id: userId,
      }),
    },
  }
  const info = null as any as GraphQLResolveInfo
  const deckUnits = [
    TestUtil.getDeckUnit({
      artStyle: unitArtStyle,
      id: unitId,
    }),
  ]
  const faction = TestUtil.getDbFaction({
    key: args.faction,
  })
  const leader = TestUtil.getDbLeader({
    faction: faction._id,
    name: args.leader,
  })
  const logPrefix = 'test-log-prefix'
  const deck = TestUtil.getDbDeck({
    faction: faction._id,
    leader: leader._id,
    name: args.name,
    user: userId,
    units: [
      {
        artStyle: unitArtStyle,
        unit: unitId,
      },
    ],
  })
  const resolvedFaction = TestUtil.getFactionFromDbFaction(faction)
  const resolvedLeader = TestUtil.getLeaderFromDbLeader(leader)
  const resolvedDeck = TestUtil.getDeckFromDbDeck({
    deck,
    faction: resolvedFaction,
    leader: resolvedLeader,
    units: deckUnits,
    user: TestUtil.getUser({
      id: userId,
    }),
  })

  const validateSpy = jest.spyOn(AddDeckValidation, 'addDeckValidation')
  if (validateError) {
    validateSpy.mockRejectedValue(validateError)
  } else {
    validateSpy.mockResolvedValue({
      deckUnits,
      faction,
      leader,
      logPrefix,
      name: args.name,
      userId,
    })
  }
  const implementSpy = jest.spyOn(AddDeckImplementation, 'addDeckImplementation')
  if (implementError) {
    implementSpy.mockRejectedValue(implementError)
  } else {
    implementSpy.mockResolvedValue(deck)
  }
  const resolveFactionSpy = jest.spyOn(FactionResolver, 'fromObject').mockResolvedValue(resolvedFaction)
  const resolveLeaderSpy = jest.spyOn(LeaderResolver, 'fromObject').mockResolvedValue(resolvedLeader)
  const resolveDeckSpy = jest.spyOn(DeckResolver, 'fromObject').mockResolvedValue(resolvedDeck)
  const publishSpy = jest.spyOn(EventManager.pubsub, 'publish').mockImplementation()

  const promise = AddDeckMutation.addDeckMutation(args, context, info)
  if (validateError || implementError) {
    await expect(promise).rejects.toThrow(validateError || implementError)
  } else {
    await expect(promise).resolves.toEqual(resolvedDeck)
  }

  const anyError = validateError || implementError
  expect(validateSpy.mock.calls).toEqual([[args, context, info]])
  expect(implementSpy.mock.calls).toEqual(
    validateError
      ? []
      : [
          [
            {
              deckUnits,
              faction,
              leader,
              logPrefix,
              name: args.name,
              userId,
            },
          ],
        ]
  )
  expect(resolveFactionSpy.mock.calls).toEqual(
    anyError
      ? []
      : [
          [
            {
              faction,
            },
          ],
        ]
  )
  expect(resolveLeaderSpy.mock.calls).toEqual(
    anyError
      ? []
      : [
          [
            {
              leader,
              faction: resolvedFaction,
            },
          ],
        ]
  )
  expect(resolveDeckSpy.mock.calls).toEqual(
    anyError
      ? []
      : [
          [
            {
              deck,
              faction: resolvedFaction,
              leader: resolvedLeader,
              units: deckUnits,
            },
          ],
        ]
  )
  expect(publishSpy.mock.calls).toEqual(
    anyError
      ? []
      : [
          [
            PubSubEvents.DeckAdded,
            {
              deckAdded: resolvedDeck,
            },
          ],
        ]
  )
}
