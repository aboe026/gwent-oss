import { Context } from '@gwent/graphql-schema/context'
import { GameDbObject } from '@gwent/graphql-schema/database-typings'
import { MutationReadyArgs } from '@gwent/graphql-schema/resolver-typings'
import ReadyImplementation from '../../src/graphql/resolvers/mutations/ready/ready-implementation'
import ReadyMutation from '../../src/graphql/resolvers/mutations/ready/ready-mutation'
import ReadyResolution from '../../src/graphql/resolvers/mutations/ready/ready-resolution'
import ReadyValidation from '../../src/graphql/resolvers/mutations/ready/ready-validation'
import TestUtil from '../util/test-util'

describe('ready-mutation', () => {
  describe('readyMutation', () => {
    it('throws error if validation throws error', async () => {
      await testReadyMutation({
        validationError: Error('validation error'),
      })
    })
    it('throws error if implementation throws error', async () => {
      await testReadyMutation({
        implementationError: Error('implementation error'),
      })
    })
    it('throws error if resolution throws error', async () => {
      await testReadyMutation({
        resolutionError: Error('resolution error'),
      })
    })
    it('returns resolution if no errors', async () => {
      await testReadyMutation({})
    })
  })
})

async function testReadyMutation({
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
  const context: Context = {
    session: {
      user,
    },
  }
  const game = TestUtil.getDbGame({})
  const updatedGame: GameDbObject = {
    ...game,
    updated: new Date(game.updated.getTime() + 1),
  }
  const resolvedGame = TestUtil.getGameFromDbGame({
    game: updatedGame,
  })
  const args: MutationReadyArgs = {
    game: game._id.toString(),
  }

  const validationSpy = jest.spyOn(ReadyValidation, 'readyValidation')
  if (validationError) {
    validationSpy.mockRejectedValue(validationError)
  } else {
    validationSpy.mockResolvedValue({
      logPrefix,
      game,
      userId: user._id,
    })
  }
  const implementationSpy = jest.spyOn(ReadyImplementation, 'readyImplementation')
  if (implementationError) {
    implementationSpy.mockRejectedValue(implementationError)
  } else {
    implementationSpy.mockResolvedValue(updatedGame)
  }
  const resolutionSpy = jest.spyOn(ReadyResolution, 'readyResolution')
  if (resolutionError) {
    resolutionSpy.mockRejectedValue(resolutionError)
  } else {
    resolutionSpy.mockResolvedValue(resolvedGame)
  }

  const error = validationError || implementationError || resolutionError
  const promise = ReadyMutation.readyMutation(args, context, null as any)
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
              game,
              logPrefix,
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
              game: updatedGame,
              logPrefix,
            },
          ],
        ]
  )
}
