import { Context } from '@gwent/graphql-schema/context'
import { MutationPlayPassArgs } from '@gwent/graphql-schema/resolver-typings'
import PlayPassImplementation from '../../src/graphql/resolvers/mutations/play-pass/play-pass-implementation'
import PlayPassMutation from '../../src/graphql/resolvers/mutations/play-pass/play-pass-mutation'
import PlayPassValidation from '../../src/graphql/resolvers/mutations/play-pass/play-pass-validation'
import PlayPassResolution from '../../src/graphql/resolvers/mutations/play-pass/play-pass-resolution'
import TestUtil from '../util/test-util'
import { GameDbObject } from '@gwent/graphql-schema/database-typings'

describe('play-pass-mutation', () => {
  describe('playPassMutation', () => {
    it('throws error if validation throws error', async () => {
      await testPlayPassMutation({
        validationError: Error('validation error'),
      })
    })
    it('throws error if implementation throws error', async () => {
      await testPlayPassMutation({
        implementationError: Error('implementation error'),
      })
    })
    it('throws error if resolution throws error', async () => {
      await testPlayPassMutation({
        resolutionError: Error('resolution error'),
      })
    })
    it('returns resolution if no errors if roundOver is true', async () => {
      await testPlayPassMutation({
        roundOver: true,
      })
    })
    it('returns resolution if no errors if roundOver is false', async () => {
      await testPlayPassMutation({
        roundOver: false,
      })
    })
  })
})

async function testPlayPassMutation({
  validationError,
  implementationError,
  resolutionError,
  roundOver,
}: {
  validationError?: Error
  implementationError?: Error
  resolutionError?: Error
  roundOver?: boolean
}) {
  const logPrefix = 'log-prefix'
  const game = TestUtil.getDbGame({})
  const updatedGame: GameDbObject = {
    ...game,
    updated: new Date(game.updated.getTime() + 1),
  }
  const resolvedGame = TestUtil.getGameFromDbGame({
    game: updatedGame,
  })
  const context: Context = {
    session: {},
  }
  const args: MutationPlayPassArgs = {
    game: game._id.toString(),
  }

  const validationSpy = jest.spyOn(PlayPassValidation, 'playPassValidation')
  if (validationError) {
    validationSpy.mockRejectedValue(validationError)
  } else {
    validationSpy.mockResolvedValue({
      game,
      logPrefix,
    })
  }
  const implementationSpy = jest.spyOn(PlayPassImplementation, 'playPassImplementation')
  if (implementationError) {
    implementationSpy.mockRejectedValue(implementationError)
  } else {
    implementationSpy.mockResolvedValue({
      game: updatedGame,
      roundOver: !!roundOver,
    })
  }
  const resolutionSpy = jest.spyOn(PlayPassResolution, 'playPassResolution')
  if (resolutionError) {
    resolutionSpy.mockRejectedValue(resolutionError)
  } else {
    resolutionSpy.mockResolvedValue(resolvedGame)
  }

  const error = validationError || implementationError || resolutionError
  const promise = PlayPassMutation.playPassMutation(args, context, null as any)
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
              roundOver: !!roundOver,
            },
          ],
        ]
  )
}
