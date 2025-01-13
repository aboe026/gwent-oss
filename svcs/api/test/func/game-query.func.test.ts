import { GraphQLError, graphql } from 'graphql'
import { ObjectId } from 'mongodb'

import { addDeck, addGame, addUser, ready, setDeck } from './util/graphql-util'
import DbConnector from '../../src/database/db-connector'
import DbUpgrader from '../../src/database/db-upgrader'
import DbUtil from './util/db-util'
import { expectizeGame, expectizeGamePlayer, expectizePlayerRound } from './util/expect-util'
import { FactionKey, GameStatus } from '@gwent/graphql-schema/resolver-typings'
import { getGameFragment } from './util/fragment-util'
import { NOT_AUTHORIZED_MESSAGE } from '@gwent/constants'
import schema from '../../src/graphql/executable-schema'

describe('game-query', () => {
  beforeAll(async () => {
    await DbUtil.deleteDatabase()
    await DbUpgrader.run()
  })
  afterAll(async () => {
    await DbConnector.disconnect()
  })
  describe('game', () => {
    describe('invalid', () => {
      it('throws error if invalid ObjectId', async () => {
        const name = `game-${Date.now()}`
        const user = await addUser(name)
        const gameId = 'invalid'
        await expect(
          graphql({
            schema,
            source: `{
              game(id: "${gameId}") {
                ${getGameFragment()}
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
          errors: [new GraphQLError(`Game ID "${gameId}" not a valid MongoDB ObjectId.`)],
        })
      })
      it('throws error if game does not exist', async () => {
        const name = `game-${Date.now()}`
        const user = await addUser(name)
        await expect(
          graphql({
            schema,
            source: `{
              game(id: "${new ObjectId()}") {
                ${getGameFragment()}
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
      it('throws error if user is not participant of game', async () => {
        const name1 = `game-1-${Date.now()}`
        const name2 = `game-2-${Date.now()}`
        const name3 = `game-3-${Date.now()}`
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
            source: `{
              game(id: "${game.id}") {
                ${getGameFragment()}
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
    })
    describe('valid', () => {
      it('returns game if user is creator', async () => {
        const name1 = `game-1-${Date.now()}`
        const name2 = `game-2-${Date.now()}`
        const user1 = await addUser(name1)
        const user2 = await addUser(name2)
        const game = await addGame({
          opponentNames: [name2],
          creator: user1,
        })
        await expect(
          graphql({
            schema,
            source: `{
              game(id: "${game.id}") {
                ${getGameFragment()}
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
          data: {
            game: expectizeGame({
              creator: user1,
              players: [
                {
                  user: user1,
                },
                {
                  user: user2,
                },
              ],
              status: GameStatus.Decking,
            }),
          },
        })
      })
      it('returns game if user is a participant but not owner', async () => {
        const name1 = `game-1-${Date.now()}`
        const name2 = `game-2-${Date.now()}`
        const user1 = await addUser(name1)
        const user2 = await addUser(name2)
        const game = await addGame({
          opponentNames: [name1],
          creator: user2,
        })
        await expect(
          graphql({
            schema,
            source: `{
              game(id: "${game.id}") {
                ${getGameFragment()}
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
          data: {
            game: expectizeGame({
              creator: user2,
              players: [
                {
                  user: user2,
                },
                {
                  user: user1,
                },
              ],
              status: GameStatus.Decking,
            }),
          },
        })
      })
      it('does not return faction leader and count deatils if only creator ready', async () => {
        const name1 = `game-1-${Date.now()}`
        const name2 = `game-2-${Date.now()}`
        const user1 = await addUser(name1)
        const user2 = await addUser(name2)
        const game = await addGame({
          opponentNames: [name2],
          creator: user1,
        })
        const deck = await addDeck({
          faction: FactionKey.Monsters,
          name: `game-1-deck-${Date.now()}`,
          userId: user1.id,
        })
        await setDeck({
          deckId: deck.id,
          gameId: game.id,
          userId: user1.id,
        })
        await expect(
          graphql({
            schema,
            source: `{
              game(id: "${game.id}") {
                ${getGameFragment()}
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
          data: {
            game: expectizeGame({
              creator: user1,
              players: [
                {
                  user: user1,
                },
                {
                  user: user2,
                },
              ],
              status: GameStatus.Decking,
            }),
          },
        })
      })
      it('does not return faction leader and count deatils if only opponent ready', async () => {
        const name1 = `game-1-${Date.now()}`
        const name2 = `game-2-${Date.now()}`
        const user1 = await addUser(name1)
        const user2 = await addUser(name2)
        const game = await addGame({
          opponentNames: [name1],
          creator: user2,
        })
        const deck = await addDeck({
          faction: FactionKey.Monsters,
          name: `game-1-deck-${Date.now()}`,
          userId: user1.id,
        })
        await setDeck({
          deckId: deck.id,
          gameId: game.id,
          userId: user1.id,
        })
        await expect(
          graphql({
            schema,
            source: `{
              game(id: "${game.id}") {
                ${getGameFragment()}
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
          data: {
            game: expectizeGame({
              creator: user2,
              players: [
                {
                  user: user2,
                },
                {
                  user: user1,
                },
              ],
              status: GameStatus.Decking,
            }),
          },
        })
      })
      it('returns faction leader and count details after all players ready', async () => {
        const name1 = `game-1-${Date.now()}`
        const name2 = `game-2-${Date.now()}`
        const user1 = await addUser(name1)
        const user2 = await addUser(name2)
        const game = await addGame({
          opponentNames: [name2],
          creator: user1,
        })
        const deck1 = await addDeck({
          faction: FactionKey.NorthernRealms,
          name: `game-1-deck-${Date.now()}`,
          userId: user1.id,
        })
        const deck2 = await addDeck({
          faction: FactionKey.Monsters,
          name: `game-2-deck-${Date.now()}`,
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
        await ready({
          gameId: game.id,
          userId: user1.id,
        })
        const updatedGame = await ready({
          gameId: game.id,
          userId: user2.id,
        })
        const gamePlayer1 = expectizeGamePlayer({
          gameDeck: gameDeck1,
          user: user1,
          order: updatedGame.turn?.user.id === user1.id ? 0 : 1,
          ready: true,
          rounds: [expectizePlayerRound({})],
        })
        const gamePlayer2 = expectizeGamePlayer({
          gameDeck: gameDeck2,
          user: user2,
          order: updatedGame.turn?.user.id === user2.id ? 0 : 1,
          ready: true,
          rounds: [expectizePlayerRound({})],
        })
        await expect(
          graphql({
            schema,
            source: `{
              game(id: "${game.id}") {
                ${getGameFragment()}
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
          data: {
            game: expectizeGame({
              creator: user1,
              players: [gamePlayer1, gamePlayer2],
              status: GameStatus.Playing,
              turn: updatedGame.turn?.user.id === user1.id ? gamePlayer1 : gamePlayer2,
              round: 1,
            }),
          },
        })
      })
    })
  })
})
