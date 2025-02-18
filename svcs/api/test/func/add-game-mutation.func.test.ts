import { GraphQLError, graphql } from 'graphql'

import { addUser } from './util/graphql-util'
import { expectizeGame } from './util/expect-util'
import { getGameFragment } from './util/fragment-util'
import { NOT_AUTHENTICATED_MESSAGE, PLAYER_COUNTS } from '@gwent/constants'
import schema from '../../src/graphql/executable-schema'
import TestUtil from '../test-util'

describe('add-game-mutation', () => {
  describe('addGame', () => {
    describe('invalid', () => {
      it('returns error if user not authentiated', async () => {
        const name1 = `addGaem-1-${Date.now()}`
        const name2 = `addGaem-2-${Date.now()}`
        await addUser(name1)
        await addUser(name2)
        await expect(
          graphql({
            schema,
            source: `mutation {
              addGame(
                opponentNames: ["${name2}"]
              ) {
                ${getGameFragment()}
              }
            }`,
          })
        ).resolves.toEqual({
          data: null,
          errors: [new GraphQLError(NOT_AUTHENTICATED_MESSAGE)],
        })
      })
      it('throws error if no opponent', async () => {
        const name = `games-${Date.now()}`
        const user = await addUser(name)
        await expect(
          graphql({
            schema,
            source: `mutation {
              addGame(
                opponentNames: []
              ) {
                ${getGameFragment()}
              }
            }`,
            contextValue: {
              session: {
                user: TestUtil.getDbUserFromUser(user),
              },
            },
          })
        ).resolves.toEqual({
          data: null,
          errors: [new GraphQLError(`Not enough opponents at "0", minimum is "${PLAYER_COUNTS.Min - 1}".`)],
        })
      })
      it('throws error if self included as opponent', async () => {
        const name1 = `games-1-${Date.now()}`
        const name2 = `games-2-${Date.now()}`
        const user1 = await addUser(name1)
        await addUser(name2)
        await expect(
          graphql({
            schema,
            source: `mutation {
              addGame(
                opponentNames: [
                  "${name1}",
                  "${name2}"
                ]
              ) {
                ${getGameFragment()}
              }
            }`,
            contextValue: {
              session: {
                user: TestUtil.getDbUserFromUser(user1),
              },
            },
          })
        ).resolves.toEqual({
          data: null,
          errors: [new GraphQLError('Opponents cannot include self.')],
        })
      })
      it('throws error if duplicate opponents', async () => {
        const name1 = `games-1-${Date.now()}`
        const name2 = `games-2-${Date.now()}`
        const user1 = await addUser(name1)
        await addUser(name2)
        await expect(
          graphql({
            schema,
            source: `mutation {
              addGame(
                opponentNames: [
                  "${name2}",
                  "${name2}"
                ]
              ) {
                ${getGameFragment()}
              }
            }`,
            contextValue: {
              session: {
                user: TestUtil.getDbUserFromUser(user1),
              },
            },
          })
        ).resolves.toEqual({
          data: null,
          errors: [new GraphQLError(`Opponent(s) ["${name2}"] are duplicates.`)],
        })
      })
      it('throws error if 2 opponents', async () => {
        const name1 = `games-1-${Date.now()}`
        const name2 = `games-2-${Date.now()}`
        const name3 = `games-3-${Date.now()}`
        const user1 = await addUser(name1)
        await addUser(name2)
        await addUser(name3)
        await expect(
          graphql({
            schema,
            source: `mutation {
              addGame(
                opponentNames: [
                  "${name2}",
                  "${name3}"
                ]
              ) {
                ${getGameFragment()}
              }
            }`,
            contextValue: {
              session: {
                user: TestUtil.getDbUserFromUser(user1),
              },
            },
          })
        ).resolves.toEqual({
          data: null,
          errors: [new GraphQLError(`Excessive opponent count of "2", maximum is "${PLAYER_COUNTS.Max - 1}".`)],
        })
      })
      it('throws error if opponent does not exist', async () => {
        const name1 = `games-1-${Date.now()}`
        const name2 = `games-2-${Date.now()}`
        const user = await addUser(name1)
        await expect(
          graphql({
            schema,
            source: `mutation {
              addGame(
                opponentNames: ["${name2}"]
              ) {
                ${getGameFragment()}
              }
            }`,
            contextValue: {
              session: {
                user: TestUtil.getDbUserFromUser(user),
              },
            },
          })
        ).resolves.toEqual({
          data: null,
          errors: [new GraphQLError(`User with name "${name2}" does not exist.`)],
        })
      })
    })
    describe('valid', () => {
      it('returns game if opponent exists', async () => {
        const name1 = `games-1-${Date.now()}`
        const name2 = `games-2-${Date.now()}`
        const user1 = await addUser(name1)
        const user2 = await addUser(name2)
        await expect(
          graphql({
            schema,
            source: `mutation {
              addGame(
                opponentNames: ["${name2}"]
              ) {
                ${getGameFragment()}
              }
            }`,
            contextValue: {
              session: {
                user: TestUtil.getDbUserFromUser(user1),
              },
            },
          })
        ).resolves.toEqual({
          data: {
            addGame: expectizeGame({
              creator: user1,
              players: [
                {
                  user: user1,
                },
                {
                  user: user2,
                },
              ],
            }),
          },
        })
      })
    })
  })
})
