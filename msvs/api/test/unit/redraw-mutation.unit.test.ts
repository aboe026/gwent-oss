import { Context } from '@gwent-oss/graphql-schema/context'
import { GameDbObject } from '@gwent-oss/graphql-schema/database-typings'
import { MutationRedrawArgs } from '@gwent-oss/graphql-schema/resolver-typings'
import RedrawImplementation from '../../src/graphql/resolvers/mutations/redraw/redraw-implementation'
import RedrawMutation from '../../src/graphql/resolvers/mutations/redraw/redraw-mutation'
import RedrawResolution from '../../src/graphql/resolvers/mutations/redraw/redraw-resolution'
import RedrawValidation from '../../src/graphql/resolvers/mutations/redraw/redraw-validation'
import TestUtil from '../util/test-util'

describe('redraw-mutation', () => {
  describe('redrawMutation', () => {
    it('throws error if validation throws error', async () => {
      await testRedrawMutation({
        validationError: Error('validation error'),
      })
    })
    it('throws error if implementation throws error', async () => {
      await testRedrawMutation({
        implementationError: Error('implementation error'),
      })
    })
    it('throws error if resolution throws error', async () => {
      await testRedrawMutation({
        resolutionError: Error('resolution error'),
      })
    })
    it('returns resolution if no errors', async () => {
      await testRedrawMutation({})
    })
  })
})

async function testRedrawMutation({
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
  const game = TestUtil.getDbGame({
    players: [
      TestUtil.getDbGamePlayer({
        user: user._id,
      }),
      TestUtil.getDbGamePlayer({}),
    ],
  })
  const updatedGame: GameDbObject = {
    ...game,
    updated: new Date(game.updated.getTime() + 1),
  }
  const from = TestUtil.getDbDeckUnit({})
  const to = TestUtil.getDbDeckUnit({})
  const resolvedTo = TestUtil.getDeckUnitFromDbDeckUnit({
    deckUnit: to,
  })
  const args: MutationRedrawArgs = {
    game: game._id.toString(),
    unit: from.unit.toString(),
  }

  const validationSpy = jest.spyOn(RedrawValidation, 'redrawValidation')
  if (validationError) {
    validationSpy.mockRejectedValue(validationError)
  } else {
    validationSpy.mockResolvedValue({
      game,
      logPrefix,
      unitId: from.unit.toString(),
      userId: user._id,
    })
  }
  const implementationSpy = jest.spyOn(RedrawImplementation, 'redrawImplementation')
  if (implementationError) {
    implementationSpy.mockRejectedValue(implementationError)
  } else {
    implementationSpy.mockResolvedValue({
      from,
      game: updatedGame,
      to,
    })
  }
  const resolutionSpy = jest.spyOn(RedrawResolution, 'redrawResolution')
  if (resolutionError) {
    resolutionSpy.mockRejectedValue(resolutionError)
  } else {
    resolutionSpy.mockResolvedValue(resolvedTo)
  }

  const error = validationError || implementationError || resolutionError
  const promise = RedrawMutation.redrawMutation(args, context, null as any)
  if (error) {
    await expect(promise).rejects.toThrow(error)
  } else {
    await expect(promise).resolves.toEqual(resolvedTo)
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
              unitId: from.unit.toString(),
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
              from,
              game: updatedGame,
              gameDeck: updatedGame.players[0].deck,
              logPrefix,
              to,
            },
          ],
        ]
  )
}
