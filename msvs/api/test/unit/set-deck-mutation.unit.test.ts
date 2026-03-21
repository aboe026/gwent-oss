import { Context } from '@gwent/graphql-schema/context'
import { GameDbObject } from '@gwent/graphql-schema/database-typings'
import { MutationSetDeckArgs } from '@gwent/graphql-schema/resolver-typings'
import SetDeckImplementation from '../../src/graphql/resolvers/mutations/set-deck/set-deck-implementation'
import SetDeckMutation from '../../src/graphql/resolvers/mutations/set-deck/set-deck-mutation'
import SetDeckResolution from '../../src/graphql/resolvers/mutations/set-deck/set-deck-resolution'
import SetDeckValidation from '../../src/graphql/resolvers/mutations/set-deck/set-deck-validation'
import TestUtil from '../util/test-util'

describe('set-deck-mutation', () => {
  describe('setDeckMutation', () => {
    it('throws error if validation throws error', async () => {
      await testSetDeckMutation({
        validationError: Error('validation error'),
      })
    })
    it('throws error if implementation throws error', async () => {
      await testSetDeckMutation({
        implementationError: Error('implementation error'),
      })
    })
    it('throws error if resolution throws error', async () => {
      await testSetDeckMutation({
        resolutionError: Error('resolution error'),
      })
    })
    it('returns resolution if no errors', async () => {
      await testSetDeckMutation({})
    })
  })
})

async function testSetDeckMutation({
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
  const deck = TestUtil.getDbDeck({})
  const gameDeck = TestUtil.getDbGameDeck({})
  const resolvedGameDeck = TestUtil.getGameDeckFromDbGameDeck(gameDeck)
  const args: MutationSetDeckArgs = {
    game: game._id.toString(),
    deck: deck._id.toString(),
  }

  const validationSpy = jest.spyOn(SetDeckValidation, 'setDeckValidation')
  if (validationError) {
    validationSpy.mockRejectedValue(validationError)
  } else {
    validationSpy.mockResolvedValue({
      deck,
      game,
      logPrefix,
      userId: user._id,
    })
  }
  const implementationSpy = jest.spyOn(SetDeckImplementation, 'setDeckImplementation')
  if (implementationError) {
    implementationSpy.mockRejectedValue(implementationError)
  } else {
    implementationSpy.mockResolvedValue({
      gameDeck,
      game: updatedGame,
    })
  }
  const resolutionSpy = jest.spyOn(SetDeckResolution, 'setDeckResolution')
  if (resolutionError) {
    resolutionSpy.mockRejectedValue(resolutionError)
  } else {
    resolutionSpy.mockResolvedValue(resolvedGameDeck)
  }

  const error = validationError || implementationError || resolutionError
  const promise = SetDeckMutation.setDeckMutation(args, context, null as any)
  if (error) {
    await expect(promise).rejects.toThrow(error)
  } else {
    await expect(promise).resolves.toEqual(resolvedGameDeck)
  }

  expect(validationSpy.mock.calls).toEqual([[args, context, null]])
  expect(implementationSpy.mock.calls).toEqual(
    validationError
      ? []
      : [
          [
            {
              deck,
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
              gameDeck,
              logPrefix,
              userId: user._id,
            },
          ],
        ]
  )
}
