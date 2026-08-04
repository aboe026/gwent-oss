import { Context } from '@gwent-oss/graphql-schema/context'
import { MutationSetOrderArgs } from '@gwent-oss/graphql-schema/resolver-typings'
import SetGameTurnOrder from '../../src/graphql/resolvers/mutations/util/set-game-turn-order'
import SetOrderMutation from '../../src/graphql/resolvers/mutations/set-order/set-order-mutation'
import SetOrderValidation from '../../src/graphql/resolvers/mutations/set-order/set-order-validation'
import TestUtil from '../util/test-util'

describe('set-order-mutation', () => {
  describe('setOrderMutation', () => {
    it('throws error if validation throws error', async () => {
      await testSetOrderMutation({
        validationError: Error('validation error'),
      })
    })
    it('throws error if implementation throws error', async () => {
      await testSetOrderMutation({
        setGameTurnOrderError: Error('setGameTurnOrder error'),
      })
    })
    it('returns resolved game if no errors', async () => {
      await testSetOrderMutation({})
    })
  })
})

async function testSetOrderMutation({
  validationError,
  setGameTurnOrderError,
}: {
  validationError?: Error
  setGameTurnOrderError?: Error
}) {
  const logPrefix = 'log-prefix'
  const user = TestUtil.getDbUser({})
  const context: Context = {
    session: {
      user,
    },
  }
  const game = TestUtil.getDbGame({})
  const resolvedGame = TestUtil.getGameFromDbGame({
    game,
  })
  const gameDeck = TestUtil.getDbGameDeck({})
  const args: MutationSetOrderArgs = {
    game: game._id.toString(),
    users: [],
  }

  const validationSpy = jest.spyOn(SetOrderValidation, 'setOrderValidation')
  if (validationError) {
    validationSpy.mockRejectedValue(validationError)
  } else {
    validationSpy.mockResolvedValue({
      game,
      gameDeck,
      logPrefix,
      userIds: args.users,
      userId: user._id,
    })
  }
  const setGameTurnOrderSpy = jest.spyOn(SetGameTurnOrder, 'setGameTurnOrder')
  if (setGameTurnOrderError) {
    setGameTurnOrderSpy.mockRejectedValue(setGameTurnOrderError)
  } else {
    setGameTurnOrderSpy.mockResolvedValue(resolvedGame)
  }

  const error = validationError || setGameTurnOrderError
  const promise = SetOrderMutation.setOrderMutation(args, context, null as any)
  if (error) {
    await expect(promise).rejects.toThrow(error)
  } else {
    await expect(promise).resolves.toEqual(resolvedGame)
  }

  expect(validationSpy.mock.calls).toEqual([[args, context, null]])
  expect(setGameTurnOrderSpy.mock.calls).toEqual(
    validationError
      ? []
      : [
          [
            {
              game,
              gameDeck,
              userIds: [],
              allowImplicit: true,
              logPrefix,
              userId: user._id,
            },
          ],
        ]
  )
}
