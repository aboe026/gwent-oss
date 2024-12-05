import { GraphQLError, graphql } from 'graphql'
import { ObjectId } from 'mongodb'

import { addDeck, addGame, addUser, getGame, ready, setDeck } from './util/graphql-util'
import DbConnector from '../../src/database/db-connector'
import DbUpgrader from '../../src/database/db-upgrader'
import DbUtil from './util/db-util'
import { expectizeGame, expectizeGamePlayer } from './util/expect-util'
import { FactionKey, GameStatus } from '@gwent/graphql-schema/resolver-typings'
import { getGameFragment } from './util/fragment-util'
import { NOT_AUTHORIZED_MESSAGE } from '@gwent/constants'
import schema from '../../src/graphql/executable-schema'

describe('ready-mutation', () => {
  beforeAll(async () => {
    await DbUtil.deleteDatabase()
    await DbUpgrader.run()
  })
  afterAll(async () => {
    await DbConnector.disconnect()
  })
  describe('ready', () => {
    describe('invalid', () => {
      it('returns error if game does not exist', async () => {
        const name = `ready-${Date.now()}`
        const user = await addUser(name)
        await expect(
          graphql({
            schema,
            source: `mutation {
              ready(game: "${new ObjectId()}") {
                ${getGameFragment({})}
              }
            }`,
            contextValue: {
              session: {
                user: {
                  _id: user.id,
                },
              },
            },
          })
        ).resolves.toEqual({
          data: null,
          errors: [new GraphQLError(NOT_AUTHORIZED_MESSAGE)],
        })
      })
      it('returns error if not a player on game', async () => {
        const name1 = `ready-1-${Date.now()}`
        const name2 = `ready-2-${Date.now()}`
        const name3 = `ready-3-${Date.now()}`
        const user1 = await addUser(name1)
        const user2 = await addUser(name2)
        await addUser(name3)
        const game = await addGame({
          opponentNames: [name3],
          creator: user2,
        })
        await expect(
          graphql({
            schema,
            source: `mutation {
              ready(game: "${game.id}") {
                ${getGameFragment({})}
              }
            }`,
            contextValue: {
              session: {
                user: {
                  _id: user1.id,
                },
              },
            },
          })
        ).resolves.toEqual({
          data: null,
          errors: [new GraphQLError(NOT_AUTHORIZED_MESSAGE)],
        })
      })
      it('returns error if deck not set', async () => {
        const name1 = `ready-1-${Date.now()}`
        const name2 = `ready-2-${Date.now()}`
        const user1 = await addUser(name1)
        await addUser(name2)
        const game = await addGame({
          opponentNames: [name2],
          creator: user1,
        })
        await expect(
          graphql({
            schema,
            source: `mutation {
              ready(game: "${game.id}") {
                ${getGameFragment({})}
              }
            }`,
            contextValue: {
              session: {
                user: {
                  _id: user1.id,
                },
              },
            },
          })
        ).resolves.toEqual({
          data: null,
          errors: [new GraphQLError(`Must set deck on game "${game.id}" first.`)],
        })
      })
      it('returns error if already marked as ready', async () => {
        const name1 = `ready-1-${Date.now()}`
        const name2 = `ready-2-${Date.now()}`
        const user1 = await addUser(name1)
        await addUser(name2)
        const game = await addGame({
          opponentNames: [name2],
          creator: user1,
        })
        const deck = await addDeck({
          faction: FactionKey.Monsters,
          name: `ready-${Date.now()}`,
          userId: user1.id,
        })
        await setDeck({
          deckId: deck.id,
          gameId: game.id,
          userId: user1.id,
        })
        await ready({
          gameId: game.id,
          userId: user1.id,
        })
        await expect(
          graphql({
            schema,
            source: `mutation {
              ready(game: "${game.id}") {
                ${getGameFragment({})}
              }
            }`,
            contextValue: {
              session: {
                user: {
                  _id: user1.id,
                },
              },
            },
          })
        ).resolves.toEqual({
          data: null,
          errors: [new GraphQLError(`Game "${game.id}" already marked as ready.`)],
        })
      })
    })
    describe('valid', () => {
      it('marks game as ready if creator', async () => {
        const name1 = `ready-1-${Date.now()}`
        const name2 = `ready-2-${Date.now()}`
        const user1 = await addUser(name1)
        const user2 = await addUser(name2)
        const game = await addGame({
          opponentNames: [name2],
          creator: user1,
        })
        const deck = await addDeck({
          faction: FactionKey.Monsters,
          name: `ready-${Date.now()}`,
          userId: user1.id,
        })
        await setDeck({
          deckId: deck.id,
          gameId: game.id,
          userId: user1.id,
        })
        const updatedGame = await getGame({
          gameId: game.id,
          userId: user1.id,
        })
        const response = await graphql({
          schema,
          source: `mutation {
            ready(game: "${game.id}") {
              ${getGameFragment({})}
            }
          }`,
          contextValue: {
            session: {
              user: {
                _id: user1.id,
              },
            },
          },
        })
        expect(response).toEqual({
          data: {
            ready: expectizeGame({
              creator: user1,
              players: [
                {
                  user: user1,
                  ready: true,
                },
                {
                  user: user2,
                },
              ],
            }),
          },
        })
        if (response.data?.ready) {
          expect(new Date((response.data.ready as any).updated).getTime()).toBeGreaterThan(
            new Date(updatedGame.updated).getTime()
          )
        }
      })
      it('marks game as ready if opponent', async () => {
        const name1 = `ready-1-${Date.now()}`
        const name2 = `ready-2-${Date.now()}`
        const user1 = await addUser(name1)
        const user2 = await addUser(name2)
        const game = await addGame({
          opponentNames: [name1],
          creator: user2,
        })
        const deck = await addDeck({
          faction: FactionKey.Monsters,
          name: `ready-${Date.now()}`,
          userId: user1.id,
        })
        await setDeck({
          deckId: deck.id,
          gameId: game.id,
          userId: user1.id,
        })
        const updatedGame = await getGame({
          gameId: game.id,
          userId: user1.id,
        })
        const response = await graphql({
          schema,
          source: `mutation {
            ready(game: "${game.id}") {
              ${getGameFragment({})}
            }
          }`,
          contextValue: {
            session: {
              user: {
                _id: user1.id,
              },
            },
          },
        })
        expect(response).toEqual({
          data: {
            ready: expectizeGame({
              creator: user2,
              players: [
                {
                  user: user2,
                },
                {
                  user: user1,
                  ready: true,
                },
              ],
            }),
          },
        })
        if (response.data?.ready) {
          expect(new Date((response.data.ready as any).updated).getTime()).toBeGreaterThan(
            new Date(updatedGame.updated).getTime()
          )
        }
      })
      it('does not add neutrals to stats if neutrals is false', async () => {
        const name1 = `ready-1-${Date.now()}`
        const name2 = `ready-2-${Date.now()}`
        const user1 = await addUser(name1)
        const user2 = await addUser(name2)
        const game = await addGame({
          opponentNames: [name2],
          creator: user1,
        })
        const deck1 = await addDeck({
          faction: FactionKey.Monsters,
          name: `ready-1-${Date.now()}`,
          userId: user1.id,
        })
        const deck2 = await addDeck({
          faction: FactionKey.NorthernRealms,
          name: `ready-2-${Date.now()}`,
          userId: user2.id,
        })
        const gameDeck1 = await setDeck({
          deckId: deck1.id,
          gameId: game.id,
          userId: user1.id,
        })
        const gameDeck2 = await setDeck({
          deckId: deck2.id,
          gameId: game.id,
          userId: user2.id,
        })
        const updatedGame = await ready({
          gameId: game.id,
          userId: user2.id,
        })
        const response = await graphql({
          schema,
          source: `mutation {
            ready(game: "${game.id}") {
              ${getGameFragment({
                statsModifier: '(neutrals: false)',
              })}
            }
          }`,
          contextValue: {
            session: {
              user: {
                _id: user1.id,
              },
            },
          },
        })
        const gamePlayer1 = expectizeGamePlayer({
          gameDeck: gameDeck1,
          user: user1,
          order: updatedGame.turn?.user.id === user1.id ? 0 : 1,
          ready: true,
        })
        const gamePlayer2 = expectizeGamePlayer({
          gameDeck: gameDeck2,
          user: user2,
          order: updatedGame.turn?.user.id === user2.id ? 0 : 1,
          ready: true,
        })
        expect(response).toEqual({
          data: {
            ready: expectizeGame({
              creator: user1,
              status: GameStatus.Playing,
              players: [gamePlayer1, gamePlayer2],
              turn: updatedGame.turn?.user.id === user1.id ? gamePlayer1 : gamePlayer2,
            }),
          },
        })
        if (response.data?.ready) {
          expect(new Date((response.data.ready as any).updated).getTime()).toBeGreaterThan(
            new Date(updatedGame.updated).getTime()
          )
        }
      })
      it('adds neutrals to stats if neutrals is true', async () => {
        const name1 = `ready-1-${Date.now()}`
        const name2 = `ready-2-${Date.now()}`
        const user1 = await addUser(name1)
        const user2 = await addUser(name2)
        const game = await addGame({
          opponentNames: [name2],
          creator: user1,
        })
        const deck1 = await addDeck({
          faction: FactionKey.Monsters,
          name: `ready-1-${Date.now()}`,
          userId: user1.id,
          statsModifier: '(neutrals: true)',
        })
        const deck2 = await addDeck({
          faction: FactionKey.NorthernRealms,
          name: `ready-2-${Date.now()}`,
          userId: user2.id,
          statsModifier: '(neutrals: true)',
        })
        const gameDeck1 = await setDeck({
          deckId: deck1.id,
          gameId: game.id,
          userId: user1.id,
          statsModifier: '(neutrals: true)',
        })
        const gameDeck2 = await setDeck({
          deckId: deck2.id,
          gameId: game.id,
          userId: user2.id,
          statsModifier: '(neutrals: true)',
        })
        const updatedGame = await ready({
          gameId: game.id,
          userId: user2.id,
        })
        const response = await graphql({
          schema,
          source: `mutation {
            ready(game: "${game.id}") {
              ${getGameFragment({
                statsModifier: '(neutrals: true)',
              })}
            }
          }`,
          contextValue: {
            session: {
              user: {
                _id: user1.id,
              },
            },
          },
        })
        const gamePlayer1 = expectizeGamePlayer({
          gameDeck: gameDeck1,
          user: user1,
          order: updatedGame.turn?.user.id === user1.id ? 0 : 1,
          ready: true,
        })
        const gamePlayer2 = expectizeGamePlayer({
          gameDeck: gameDeck2,
          user: user2,
          order: updatedGame.turn?.user.id === user2.id ? 0 : 1,
          ready: true,
        })
        expect(response).toEqual({
          data: {
            ready: expectizeGame({
              creator: user1,
              status: GameStatus.Playing,
              players: [gamePlayer1, gamePlayer2],
              turn: updatedGame.turn?.user.id === user1.id ? gamePlayer1 : gamePlayer2,
            }),
          },
        })
        if (response.data?.ready) {
          expect(new Date((response.data.ready as any).updated).getTime()).toBeGreaterThan(
            new Date(updatedGame.updated).getTime()
          )
        }
      })
    })
  })
})
