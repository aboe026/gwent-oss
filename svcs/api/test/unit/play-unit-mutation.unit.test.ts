import { Combat, MutationPlayUnitArgs } from '@gwent/graphql-schema/resolver-typings'
import { Context } from '@gwent/graphql-schema/context'
import { GameDbObject } from '@gwent/graphql-schema/database-typings'
import PlayUnitImplementation from '../../src/graphql/resolvers/mutations/play-unit/play-unit-implementation'
import PlayUnitMutation from '../../src/graphql/resolvers/mutations/play-unit/play-unit-mutation'
import PlayUnitResolution from '../../src/graphql/resolvers/mutations/play-unit/play-unit-resolution'
import PlayUnitValidation from '../../src/graphql/resolvers/mutations/play-unit/play-unit-validation'
import TestUtil from '../util/test-util'

describe('play-unit-mutation', () => {
  describe('playUnitMutation', () => {
    it('throws error if validation throws error', async () => {
      await testPlayUnitMutation({
        validationError: Error('validation error'),
      })
    })
    it('throws error if implementation throws error', async () => {
      await testPlayUnitMutation({
        implementationError: Error('implementation error'),
      })
    })
    it('throws error if resolution throws error', async () => {
      await testPlayUnitMutation({
        resolutionError: Error('resolution error'),
      })
    })
    it('returns resolution if no errors', async () => {
      await testPlayUnitMutation({})
    })
  })
})

async function testPlayUnitMutation({
  validationError,
  implementationError,
  resolutionError,
}: {
  validationError?: Error
  implementationError?: Error
  resolutionError?: Error
}) {
  const logPrefix = 'log-prefix'
  const context: Context = {
    session: {},
  }
  const game = TestUtil.getDbGame({})
  const updatedGame: GameDbObject = {
    ...game,
    updated: new Date(game.updated.getTime() + 1),
  }
  const unit = TestUtil.getDbUnit({})
  const combat = Combat.Close
  const deckUnit = TestUtil.getDbDeckUnit({
    id: unit._id,
  })
  const gameDeck = TestUtil.getDbGameDeck({})
  const resolvedGame = TestUtil.getGameFromDbGame({
    game: updatedGame,
  })
  const args: MutationPlayUnitArgs = {
    game: game._id.toString(),
    unit: unit._id.toString(),
    combat,
  }

  const validationSpy = jest.spyOn(PlayUnitValidation, 'playUnitValidation')
  if (validationError) {
    validationSpy.mockRejectedValue(validationError)
  } else {
    validationSpy.mockResolvedValue({
      combat,
      deckUnit,
      game,
      logPrefix,
      unit,
    })
  }
  const implementationSpy = jest.spyOn(PlayUnitImplementation, 'playUnitImplementation')
  if (implementationError) {
    implementationSpy.mockRejectedValue(implementationError)
  } else {
    implementationSpy.mockResolvedValue({
      game: updatedGame,
      gameDeck,
    })
  }
  const resolutionSpy = jest.spyOn(PlayUnitResolution, 'playUnitResolution')
  if (resolutionError) {
    resolutionSpy.mockRejectedValue(resolutionError)
  } else {
    resolutionSpy.mockResolvedValue(resolvedGame)
  }

  const error = validationError || implementationError || resolutionError
  const promise = PlayUnitMutation.playUnitMutation(args, context, null as any)
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
              combat,
              deckUnit,
              game,
              logPrefix,
              unit,
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
              deckUnit,
              game: updatedGame,
              gameDeck,
              logPrefix,
            },
          ],
        ]
  )
}
