import { GraphQLError, graphql } from 'graphql'
import { ObjectId } from 'mongodb'

import { addDeck, addGame, addUser, setDeck } from './util/graphql-util'
import DbConnector from '../../src/database/db-connector'
import DbUpgrader from '../../src/database/db-upgrader'
import DbUtil from './util/db-util'
import { expectizeGameDeck, verifyGameDeckSet } from './util/expect-util'
import { FactionKey, GameDeck } from '@gwent/graphql-schema/resolver-typings'
import { getGameDeckFragment } from './util/fragment-util'
import { NOT_AUTHORIZED_MESSAGE } from '@gwent/constants'
import schema from '../../src/graphql/executable-schema'

describe('game-deck-query', () => {
  beforeAll(async () => {
    await DbUtil.deleteDatabase()
    await DbUpgrader.run()
  })
  afterAll(async () => {
    await DbConnector.disconnect()
  })
  describe('gameDeck', () => {
    describe('invalid', () => {
      it('throws error if invalid game ID', async () => {
        const name = `gameDeck-${Date.now()}`
        const user = await addUser(name)
        const gameId = 'invalid'
        await expect(
          graphql({
            schema,
            source: `{
              gameDeck(game: "${gameId}") {
                ${getGameDeckFragment()}
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
          data: {
            gameDeck: null,
          },
          errors: [new GraphQLError(`Game ID "${gameId}" not a valid MongoDB ObjectId.`)],
        })
      })
      it('throws error if game does not exist', async () => {
        const name = `gameDeck-${Date.now()}`
        const user = await addUser(name)
        const id = new ObjectId()
        await expect(
          graphql({
            schema,
            source: `{
              gameDeck(game: "${id.toString()}") {
                ${getGameDeckFragment()}
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
          data: {
            gameDeck: null,
          },
          errors: [new GraphQLError(NOT_AUTHORIZED_MESSAGE)],
        })
      })
      it('throws error if user not a player on game', async () => {
        const name1 = `gameDeck-1-${Date.now()}`
        const name2 = `gameDeck-2-${Date.now()}`
        const name3 = `gameDeck-3-${Date.now()}`
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
              gameDeck(game: "${game.id}") {
                ${getGameDeckFragment()}
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
            gameDeck: null,
          },
          errors: [new GraphQLError(NOT_AUTHORIZED_MESSAGE)],
        })
      })
    })
    describe('valid', () => {
      it('returns null if no deck set for game', async () => {
        const name1 = `gameDeck-1-${Date.now()}`
        const name2 = `gameDeck-2-${Date.now()}`
        const user1 = await addUser(name1)
        await addUser(name2)
        const game = await addGame({
          opponentNames: [name2],
          creator: user1,
        })
        await expect(
          graphql({
            schema,
            source: `{
              gameDeck(game: "${game.id}") {
                ${getGameDeckFragment()}
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
            gameDeck: null,
          },
        })
      })
      it('returns null if deck set for opponent', async () => {
        const name1 = `gameDeck-1-${Date.now()}`
        const name2 = `gameDeck-2-${Date.now()}`
        const user1 = await addUser(name1)
        const user2 = await addUser(name2)
        const deck = await addDeck({
          faction: FactionKey.Monsters,
          name: `gameDeck-${Date.now()}`,
          userId: user2.id,
        })
        const game = await addGame({
          opponentNames: [name2],
          creator: user1,
        })
        await setDeck({
          deckId: deck.id,
          gameId: game.id,
          userId: user2.id,
        })
        await expect(
          graphql({
            schema,
            source: `{
              gameDeck(game: "${game.id}") {
                ${getGameDeckFragment()}
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
            gameDeck: null,
          },
        })
      })
      it('returns game deck if set for creator', async () => {
        const name1 = `gameDeck-1-${Date.now()}`
        const name2 = `gameDeck-2-${Date.now()}`
        const user1 = await addUser(name1)
        await addUser(name2)
        const deck = await addDeck({
          faction: FactionKey.Monsters,
          name: `gameDeck-${Date.now()}`,
          userId: user1.id,
        })
        const game = await addGame({
          opponentNames: [name2],
          creator: user1,
        })
        await setDeck({
          deckId: deck.id,
          gameId: game.id,
          userId: user1.id,
        })
        const gameDeck = await graphql({
          schema,
          source: `{
            gameDeck(game: "${game.id}") {
              ${getGameDeckFragment()}
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
        expect(gameDeck).toEqual({
          data: {
            gameDeck: expectizeGameDeck({
              deck: {
                factionKey: deck.faction.key,
                leaderName: deck.leader.name,
                name: deck.name,
                unitNames: deck.units.map((unit) => unit.unit.name),
                user: user1,
              },
              discards: [],
              redraws: [],
            }),
          },
        })
        verifyGameDeckSet((gameDeck.data as any).gameDeck as GameDeck, deck)
      })
      it('returns game deck if set for participant', async () => {
        const name1 = `gameDeck-1-${Date.now()}`
        const name2 = `gameDeck-2-${Date.now()}`
        const user1 = await addUser(name1)
        const user2 = await addUser(name2)
        const deck = await addDeck({
          faction: FactionKey.Monsters,
          name: `gameDeck-${Date.now()}`,
          userId: user1.id,
        })
        const game = await addGame({
          opponentNames: [name1],
          creator: user2,
        })
        await setDeck({
          deckId: deck.id,
          gameId: game.id,
          userId: user1.id,
        })
        const gameDeck = await graphql({
          schema,
          source: `{
            gameDeck(game: "${game.id}") {
              ${getGameDeckFragment()}
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
        expect(gameDeck).toEqual({
          data: {
            gameDeck: expectizeGameDeck({
              deck: {
                factionKey: deck.faction.key,
                leaderName: deck.leader.name,
                name: deck.name,
                unitNames: deck.units.map((unit) => unit.unit.name),
                user: user1,
              },
              discards: [],
              redraws: [],
            }),
          },
        })
        verifyGameDeckSet((gameDeck.data as any).gameDeck as GameDeck, deck)
      })
    })
  })
})
