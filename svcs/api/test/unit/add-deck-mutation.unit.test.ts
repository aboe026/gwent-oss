import { GraphQLResolveInfo } from 'graphql'
import { ObjectId } from 'mongodb'

import AddDeckImplementation from '../../src/graphql/resolvers/mutations/add-deck/add-deck-implementation'
import AddDeckMutation from '../../src/graphql/resolvers/mutations/add-deck/add-deck-mutation'
import AddDeckValidation from '../../src/graphql/resolvers/mutations/add-deck/add-deck-validation'
import { Context } from '@gwent/graphql-schema/context'
import { FactionKey, MutationAddDeckArgs } from '@gwent/graphql-schema/resolver-typings'
import TestUtil from '../util/test-util'
import AddDeckResolution from '../../src/graphql/resolvers/mutations/add-deck/add-deck-resolution'

describe('add-deck-mutation', () => {
  describe('addDeckMutation', () => {
    it('throws error if validation throws error', async () => {
      await testAddDeckMutation({
        validateError: Error('validation error'),
      })
    })
    it('throws error if implementation throws error', async () => {
      await testAddDeckMutation({
        implementError: Error('implementation error'),
      })
    })
    it('throws error if resolution throws error', async () => {
      await testAddDeckMutation({
        resolutionError: Error('resolution error'),
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
  resolutionError,
}: {
  validateError?: Error
  implementError?: Error
  resolutionError?: Error
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
  const resolvedDeck = TestUtil.getDeckFromDbDeck({
    deck,
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
  const resolveSpy = jest.spyOn(AddDeckResolution, 'addDeckResolution')
  if (resolutionError) {
    resolveSpy.mockRejectedValue(resolutionError)
  } else {
    resolveSpy.mockResolvedValue(resolvedDeck)
  }

  const promise = AddDeckMutation.addDeckMutation(args, context, info)
  if (validateError || implementError || resolutionError) {
    await expect(promise).rejects.toThrow(validateError || implementError || resolutionError)
  } else {
    await expect(promise).resolves.toEqual(resolvedDeck)
  }

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
  expect(resolveSpy.mock.calls).toEqual(
    validateError || implementError
      ? []
      : [
          [
            {
              deck,
              deckUnits,
              faction,
              leader,
              logPrefix,
            },
          ],
        ]
  )
}
