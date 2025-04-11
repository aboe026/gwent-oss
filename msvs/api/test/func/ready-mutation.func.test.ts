import { GraphQLError, graphql } from 'graphql'
import { ObjectId } from 'mongodb'

import { addDeck, addGame, addUser, getGame, ready, setDeck } from './util/graphql-util'
import { expectizeGame, expectizeGamePlayer } from './util/expect-util'
import { FactionKey, GameStatus } from '@gwent/graphql-schema/resolver-typings'
import { getGameFragment } from './util/fragment-util'
import { NOT_AUTHORIZED_MESSAGE } from '@gwent/constants'
import schema from '../../src/graphql/executable-schema'

describe('ready-mutation', () => {
  describe('ready', () => {
    describe('invalid', () => {
      it('returns error if invalid game ID', async () => {
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
        const gameId = 'invalid'
        await setDeck({
          deckId: deck.id,
          gameId: game.id,
          userId: user1.id,
        })
        await expect(
          graphql({
            schema,
            source: `mutation {
              ready(game: "${gameId}") {
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
          errors: [new GraphQLError(`Game ID "${gameId}" not a valid MongoDB ObjectId.`)],
        })
      })
      it('returns error if game does not exist', async () => {
        const name = `ready-${Date.now()}`
        const user = await addUser(name)
        await expect(
          graphql({
            schema,
            source: `mutation {
              ready(game: "${new ObjectId()}") {
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
          errors: [
            new GraphQLError(
              `Invalid game status "${GameStatus.Decking}": Can only mark ready for game with status "${GameStatus.Redrawing}".`
            ),
          ],
        })
      })
      it('returns error if already marked as ready', async () => {
        const name1 = `ready-1-${Date.now()}`
        const name2 = `ready-2-${Date.now()}`
        const user1 = await addUser(name1)
        const user2 = await addUser(name2)
        const game = await addGame({
          opponentNames: [name2],
          creator: user1,
        })
        const deckSelf = await addDeck({
          faction: FactionKey.Monsters,
          name: `ready-self-${Date.now()}`,
          userId: user1.id,
        })
        const deckOpponent = await addDeck({
          faction: FactionKey.Monsters,
          name: `ready-opponent-${Date.now()}`,
          userId: user2.id,
        })
        await setDeck({
          deckId: deckSelf.id,
          gameId: game.id,
          userId: user1.id,
        })
        await setDeck({
          deckId: deckOpponent.id,
          gameId: game.id,
          userId: user2.id,
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
          errors: [new GraphQLError('Already marked as ready.')],
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
        const deckSelf = await addDeck({
          faction: FactionKey.Monsters,
          name: `ready-self-${Date.now()}`,
          userId: user1.id,
        })
        const deckOpponent = await addDeck({
          faction: FactionKey.Monsters,
          name: `ready-opponent-${Date.now()}`,
          userId: user2.id,
        })
        const gameDeckSelf = await setDeck({
          deckId: deckSelf.id,
          gameId: game.id,
          userId: user1.id,
        })
        const gameDeckOpponent = await setDeck({
          deckId: deckOpponent.id,
          gameId: game.id,
          userId: user2.id,
        })
        const updatedGame = await getGame({
          gameId: game.id,
          userId: user1.id,
        })
        const gamePlayerSelf = expectizeGamePlayer({
          gameDeck: gameDeckSelf,
          user: user1,
          order: updatedGame.turn?.user.id === user1.id ? 0 : 1,
          ready: true,
        })
        const gamePlayerOpponent = expectizeGamePlayer({
          gameDeck: gameDeckOpponent,
          user: user2,
          order: updatedGame.turn?.user.id === user2.id ? 0 : 1,
        })
        const response = await graphql({
          schema,
          source: `mutation {
            ready(game: "${game.id}") {
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
        expect(response).toEqual({
          data: {
            ready: expectizeGame({
              creator: user1,
              players: [gamePlayerSelf, gamePlayerOpponent],
              status: GameStatus.Redrawing,
              turn: updatedGame.turn?.user.id === user1.id ? gamePlayerSelf : gamePlayerOpponent,
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
        const deckSelf = await addDeck({
          faction: FactionKey.Monsters,
          name: `ready-self-${Date.now()}`,
          userId: user1.id,
        })
        const deckOpponent = await addDeck({
          faction: FactionKey.Monsters,
          name: `ready-opponent-${Date.now()}`,
          userId: user2.id,
        })
        const gameDeckOpponent = await setDeck({
          deckId: deckSelf.id,
          gameId: game.id,
          userId: user1.id,
        })
        const gameDeckCreator = await setDeck({
          deckId: deckOpponent.id,
          gameId: game.id,
          userId: user2.id,
        })
        const updatedGame = await getGame({
          gameId: game.id,
          userId: user1.id,
        })
        const response = await graphql({
          schema,
          source: `mutation {
            ready(game: "${game.id}") {
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
        const gamePlayerCreator = expectizeGamePlayer({
          gameDeck: gameDeckCreator,
          user: user2,
          order: updatedGame.turn?.user.id === user2.id ? 0 : 1,
        })
        const gamePlayerOpponent = expectizeGamePlayer({
          gameDeck: gameDeckOpponent,
          user: user1,
          order: updatedGame.turn?.user.id === user1.id ? 0 : 1,
          ready: true,
        })
        expect(response).toEqual({
          data: {
            ready: expectizeGame({
              creator: user2,
              players: [gamePlayerCreator, gamePlayerOpponent],
              status: GameStatus.Redrawing,
              turn: updatedGame.turn?.user.id === user2.id ? gamePlayerCreator : gamePlayerOpponent,
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
