import AddGameImplementation from '../../src/graphql/resolvers/mutations/add-game/add-game-implementation'
import AddGameMutation from '../../src/graphql/resolvers/mutations/add-game/add-game-mutation'
import AddGameResolution from '../../src/graphql/resolvers/mutations/add-game/add-game-resolution'
import AddGameValidation from '../../src/graphql/resolvers/mutations/add-game/add-game-validation'
import { Context } from '@gwent-oss/graphql-schema/context'
import { MutationAddGameArgs } from '@gwent-oss/graphql-schema/resolver-typings'
import TestUtil from '../util/test-util'

describe('add-game-mutation', () => {
  describe('addGameMutation', () => {
    it('throws error if validation throws error', async () => {
      await testAddGameMutation({
        validationError: Error('validation error'),
      })
    })
    it('throws error if implementation throws error', async () => {
      await testAddGameMutation({
        implementationError: Error('implementation error'),
      })
    })
    it('throws error if resolution throws error', async () => {
      await testAddGameMutation({
        resolutionError: Error('resolution error'),
      })
    })
    it('returns resolution if no errors', async () => {
      await testAddGameMutation({})
    })
  })
})

async function testAddGameMutation({
  validationError,
  implementationError,
  resolutionError,
}: {
  validationError?: Error
  implementationError?: Error
  resolutionError?: Error
}) {
  const logPrefix = 'log-prefix'
  const user = TestUtil.getDbUser({})
  const opponent = TestUtil.getUser({
    name: 'opponent-name',
  })
  const context: Context = {
    session: {
      user,
    },
  }
  const args: MutationAddGameArgs = {
    opponentNames: [opponent.name],
  }
  const game = TestUtil.getDbGame({
    creator: user._id,
  })
  const resolvedGame = TestUtil.getGameFromDbGame({
    game,
    creator: TestUtil.getUserFromDbUser(user),
  })
  const validationSpy = jest.spyOn(AddGameValidation, 'addGameValidation')
  if (validationError) {
    validationSpy.mockRejectedValue(validationError)
  } else {
    validationSpy.mockResolvedValue({
      logPrefix,
      opponents: [opponent],
      userId: user._id,
    })
  }
  const implementationSpy = jest.spyOn(AddGameImplementation, 'AddGameImplementation')
  if (implementationError) {
    implementationSpy.mockRejectedValue(implementationError)
  } else {
    implementationSpy.mockResolvedValue(game)
  }
  const resolutionSpy = jest.spyOn(AddGameResolution, 'addGameResolution')
  if (resolutionError) {
    resolutionSpy.mockRejectedValue(resolutionError)
  } else {
    resolutionSpy.mockResolvedValue(resolvedGame)
  }

  const error = validationError || implementationError || resolutionError
  const promise = AddGameMutation.addGameMutation(args, context, null as any)
  if (error) {
    await expect(promise).rejects.toThrow(error)
  } else {
    await expect(promise).resolves.toEqual(resolvedGame)
  }

  expect(validationSpy.mock.calls).toEqual([[args, context, null]])
  expect(implementationSpy.mock.calls).toEqual(
    validationError
      ? []
      : [
          [
            {
              logPrefix,
              opponents: [opponent],
              userId: user._id,
            },
          ],
        ]
  )
  expect(resolutionSpy.mock.calls).toEqual(
    validationError || implementationError
      ? []
      : [
          [
            {
              game,
              logPrefix,
              opponents: [opponent],
              creatorId: user._id,
            },
          ],
        ]
  )
}
