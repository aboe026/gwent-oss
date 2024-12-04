import { GraphQLError, graphql } from 'graphql'

import { addDeck, addGame, addUser, getLeaderId, getUnitsInput, setDeck } from './util/graphql-util'
import DbConnector from '../../src/database/db-connector'
import DbUpgrader from '../../src/database/db-upgrader'
import DbUtil from './util/db-util'
import { FactionKey } from '@gwent/graphql-schema/resolver-typings'
import {
  getDeckFragment,
  getDeckUnitFragment,
  getFactionFragment,
  getGameDeckFragment,
  getGameFragment,
  getLeaderFragment,
  getSettingFragment,
  getUnitFragment,
  getUserFragment,
} from './util/fragment-util'
import { NOT_AUTHENTICATED_MESSAGE, NOT_AUTHORIZED_MESSAGE } from '@gwent/constants'
import schema from '../../src/graphql/executable-schema'

describe('permissions', () => {
  beforeAll(async () => {
    await DbUtil.deleteDatabase()
    await DbUpgrader.run()
  })
  afterAll(async () => {
    await DbConnector.disconnect()
  })
  describe('query', () => {
    describe('currentUser', () => {
      it('returns error if not authenticated', async () => {
        await expect(
          graphql({
            schema,
            source: `{
              currentUser {
                ${getUserFragment()}
              }
            }`,
          })
        ).resolves.toEqual({
          data: {
            currentUser: null,
          },
          errors: [new GraphQLError(NOT_AUTHENTICATED_MESSAGE)],
        })
      })
    })
    describe('decks', () => {
      it('returns error if not authenticated', async () => {
        await expect(
          graphql({
            schema,
            source: `{
              decks {
                ${getDeckFragment({})}
              }
            }`,
          })
        ).resolves.toEqual({
          data: null,
          errors: [new GraphQLError(NOT_AUTHENTICATED_MESSAGE)],
        })
      })
    })
    describe('factions', () => {
      it('returns error if not authenticated', async () => {
        await expect(
          graphql({
            schema,
            source: `{
              factions {
                ${getFactionFragment({})}
              }
            }`,
          })
        ).resolves.toEqual({
          data: null,
          errors: [new GraphQLError(NOT_AUTHENTICATED_MESSAGE)],
        })
      })
    })
    describe('game', () => {
      it('returns error if not authenticated', async () => {
        const user1 = await addUser(`user-1-${Date.now()}`)
        const user2 = await addUser(`user-2-${Date.now()}`)
        const game = await addGame({
          opponentNames: [user2.name],
          creator: user1,
        })
        await expect(
          graphql({
            schema,
            source: `{
              game(
                id: "${game.id}"
              ) {
                ${getGameFragment({})}
              }
            }`,
          })
        ).resolves.toEqual({
          data: null,
          errors: [new GraphQLError(NOT_AUTHENTICATED_MESSAGE)],
        })
      })
      it('returns error if not a player', async () => {
        const user1 = await addUser(`user-1-${Date.now()}`)
        const user2 = await addUser(`user-2-${Date.now()}`)
        const user3 = await addUser(`user-3-${Date.now()}`)
        const game = await addGame({
          opponentNames: [user2.name],
          creator: user1,
        })
        await expect(
          graphql({
            schema,
            source: `{
              game(
                id: "${game.id}"
              ) {
                ${getGameFragment({})}
              }
            }`,
            contextValue: {
              session: {
                user: {
                  _id: user3.id,
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
    describe('gameDeck', () => {
      it('returns error if not authenticated', async () => {
        const user1 = await addUser(`user-1-${Date.now()}`)
        const user2 = await addUser(`user-2-${Date.now()}`)
        const game = await addGame({
          opponentNames: [user2.name],
          creator: user1,
        })
        await expect(
          graphql({
            schema,
            source: `{
              gameDeck(
                game: "${game.id}"
              ) {
                ${getGameDeckFragment({})}
              }
            }`,
          })
        ).resolves.toEqual({
          data: {
            gameDeck: null,
          },
          errors: [new GraphQLError(NOT_AUTHENTICATED_MESSAGE)],
        })
      })
      it('returns error if not a player', async () => {
        const user1 = await addUser(`user-1-${Date.now()}`)
        const user2 = await addUser(`user-2-${Date.now()}`)
        const user3 = await addUser(`user-3-${Date.now()}`)
        const game = await addGame({
          opponentNames: [user2.name],
          creator: user1,
        })
        await expect(
          graphql({
            schema,
            source: `{
              gameDeck(
                game: "${game.id}"
              ) {
                ${getGameDeckFragment({})}
              }
            }`,
            contextValue: {
              session: {
                user: {
                  _id: user3.id,
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
    describe('games', () => {
      it('returns error if not authenticated', async () => {
        await expect(
          graphql({
            schema,
            source: `{
              games {
                ${getGameFragment({})}
              }
            }`,
          })
        ).resolves.toEqual({
          data: null,
          errors: [new GraphQLError(NOT_AUTHENTICATED_MESSAGE)],
        })
      })
    })
    describe('leaders', () => {
      it('returns error if not authenticated', async () => {
        await expect(
          graphql({
            schema,
            source: `{
              leaders {
                ${getLeaderFragment({})}
              }
            }`,
          })
        ).resolves.toEqual({
          data: null,
          errors: [new GraphQLError(NOT_AUTHENTICATED_MESSAGE)],
        })
      })
    })
    describe('settings', () => {
      it('returns error if not authenticated', async () => {
        await expect(
          graphql({
            schema,
            source: `{
              settings {
                ${getSettingFragment()}
              }
            }`,
          })
        ).resolves.toEqual({
          data: null,
          errors: [new GraphQLError(NOT_AUTHENTICATED_MESSAGE)],
        })
      })
    })
    describe('units', () => {
      it('returns error if not authenticated', async () => {
        await expect(
          graphql({
            schema,
            source: `{
              units {
                ${getUnitFragment({})}
              }
            }`,
          })
        ).resolves.toEqual({
          data: null,
          errors: [new GraphQLError(NOT_AUTHENTICATED_MESSAGE)],
        })
      })
    })
  })
  describe('mutation', () => {
    describe('addDeck', () => {
      it('returns error if not authenticated', async () => {
        await expect(
          graphql({
            schema,
            source: `mutation {
              addDeck(
                name: "Deck unauthenticated",
                faction: MONSTERS,
                leader: "${await getLeaderId({ name: 'Eredin Bringer of Death' })}",
                units: [${await getUnitsInput(FactionKey.Monsters)}]
              ) {
                ${getDeckFragment({})}
              }
            }`,
          })
        ).resolves.toEqual({
          data: null,
          errors: [new GraphQLError(NOT_AUTHENTICATED_MESSAGE)],
        })
      })
    })
    describe('addGame', () => {
      it('returns error if not authenticated', async () => {
        const opponent = await addUser(`opponent-${Date.now()}`)
        await expect(
          graphql({
            schema,
            source: `mutation {
              addGame(
                opponentNames: ["${opponent.name}"]
              ) {
                ${getGameFragment({})}
              }
            }`,
          })
        ).resolves.toEqual({
          data: null,
          errors: [new GraphQLError(NOT_AUTHENTICATED_MESSAGE)],
        })
      })
    })
    describe('ready', () => {
      it('returns error if not authenticated', async () => {
        const user1 = await addUser(`user-1-${Date.now()}`)
        const user2 = await addUser(`user-2-${Date.now()}`)
        const deck1 = await addDeck({
          faction: FactionKey.Monsters,
          name: 'deck1',
          userId: user1.id,
        })
        const deck2 = await addDeck({
          faction: FactionKey.Monsters,
          name: 'deck2',
          userId: user2.id,
        })
        const game = await addGame({
          opponentNames: [user2.name],
          creator: user1,
        })
        await setDeck({
          deckId: deck1.id,
          gameId: game.id,
          userId: user1.id,
        })
        await setDeck({
          deckId: deck2.id,
          gameId: game.id,
          userId: user2.id,
        })
        await expect(
          graphql({
            schema,
            source: `mutation {
              ready(
                game: "${game.id}"
              ) {
                ${getGameFragment({})}
              }
            }`,
          })
        ).resolves.toEqual({
          data: null,
          errors: [new GraphQLError(NOT_AUTHENTICATED_MESSAGE)],
        })
      })
      it('returns error if not a player', async () => {
        const user1 = await addUser(`user-1-${Date.now()}`)
        const user2 = await addUser(`user-2-${Date.now()}`)
        const user3 = await addUser(`user-3-${Date.now()}`)
        const deck1 = await addDeck({
          faction: FactionKey.Monsters,
          name: 'deck1',
          userId: user1.id,
        })
        const deck2 = await addDeck({
          faction: FactionKey.Monsters,
          name: 'deck2',
          userId: user2.id,
        })
        const game = await addGame({
          opponentNames: [user2.name],
          creator: user1,
        })
        await setDeck({
          deckId: deck1.id,
          gameId: game.id,
          userId: user1.id,
        })
        await setDeck({
          deckId: deck2.id,
          gameId: game.id,
          userId: user2.id,
        })
        await expect(
          graphql({
            schema,
            source: `mutation {
              ready(
                game: "${game.id}"
              ) {
                ${getGameFragment({})}
              }
            }`,
            contextValue: {
              session: {
                user: {
                  _id: user3.id,
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
    describe('redraw', () => {
      it('returns error if not authenticated', async () => {
        const user1 = await addUser(`user-1-${Date.now()}`)
        const user2 = await addUser(`user-2-${Date.now()}`)
        const deck1 = await addDeck({
          faction: FactionKey.Monsters,
          name: 'deck1',
          userId: user1.id,
        })
        const deck2 = await addDeck({
          faction: FactionKey.Monsters,
          name: 'deck2',
          userId: user2.id,
        })
        const game = await addGame({
          opponentNames: [user2.name],
          creator: user1,
        })
        await setDeck({
          deckId: deck1.id,
          gameId: game.id,
          userId: user1.id,
        })
        await setDeck({
          deckId: deck2.id,
          gameId: game.id,
          userId: user2.id,
        })
        await expect(
          graphql({
            schema,
            source: `mutation {
              redraw(
                game: "${game.id}"
                unit: "${deck1.units[0].unit.id}"
              ) {
                ${getDeckUnitFragment({})}
              }
            }`,
          })
        ).resolves.toEqual({
          data: null,
          errors: [new GraphQLError(NOT_AUTHENTICATED_MESSAGE)],
        })
      })
      it('returns error if not a player', async () => {
        const user1 = await addUser(`user-1-${Date.now()}`)
        const user2 = await addUser(`user-2-${Date.now()}`)
        const user3 = await addUser(`user-3-${Date.now()}`)
        const deck1 = await addDeck({
          faction: FactionKey.Monsters,
          name: 'deck1',
          userId: user1.id,
        })
        const deck2 = await addDeck({
          faction: FactionKey.Monsters,
          name: 'deck2',
          userId: user2.id,
        })
        const game = await addGame({
          opponentNames: [user2.name],
          creator: user1,
        })
        await setDeck({
          deckId: deck1.id,
          gameId: game.id,
          userId: user1.id,
        })
        await setDeck({
          deckId: deck2.id,
          gameId: game.id,
          userId: user2.id,
        })
        await expect(
          graphql({
            schema,
            source: `mutation {
              redraw(
                game: "${game.id}"
                unit: "${deck1.units[0].unit.id}"
              ) {
                ${getDeckUnitFragment({})}
              }
            }`,
            contextValue: {
              session: {
                user: {
                  _id: user3.id,
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
    describe('setDeck', () => {
      it('returns error if not authenticated', async () => {
        const user1 = await addUser(`user-1-${Date.now()}`)
        const user2 = await addUser(`user-2-${Date.now()}`)
        const deck = await addDeck({
          faction: FactionKey.Monsters,
          name: 'deck1',
          userId: user2.id,
        })
        const game = await addGame({
          opponentNames: [user2.name],
          creator: user1,
        })
        await expect(
          graphql({
            schema,
            source: `mutation {
              setDeck(
                game: "${game.id}",
                deck: "${deck.id}"
              ) {
                ${getGameDeckFragment({})}
              }
            }`,
          })
        ).resolves.toEqual({
          data: null,
          errors: [new GraphQLError(NOT_AUTHENTICATED_MESSAGE)],
        })
      })
      it('returns error if not a player', async () => {
        const user1 = await addUser(`user-1-${Date.now()}`)
        const user2 = await addUser(`user-2-${Date.now()}`)
        const user3 = await addUser(`user-3-${Date.now()}`)
        const deck = await addDeck({
          faction: FactionKey.Monsters,
          name: 'deck1',
          userId: user3.id,
        })
        const game = await addGame({
          opponentNames: [user2.name],
          creator: user1,
        })
        await expect(
          graphql({
            schema,
            source: `mutation {
              setDeck(
                game: "${game.id}",
                deck: "${deck.id}"
              ) {
                ${getGameDeckFragment({})}
              }
            }`,
            contextValue: {
              session: {
                user: {
                  _id: user3.id,
                },
              },
            },
          })
        ).resolves.toEqual({
          data: null,
          errors: [new GraphQLError(NOT_AUTHORIZED_MESSAGE)],
        })
      })
      it('returns error if deck not owned', async () => {
        const user1 = await addUser(`user-1-${Date.now()}`)
        const user2 = await addUser(`user-2-${Date.now()}`)
        const deck = await addDeck({
          faction: FactionKey.Monsters,
          name: 'deck2',
          userId: user2.id,
        })
        const game = await addGame({
          opponentNames: [user2.name],
          creator: user1,
        })
        await expect(
          graphql({
            schema,
            source: `mutation {
              setDeck(
                game: "${game.id}",
                deck: "${deck.id}"
              ) {
                ${getGameDeckFragment({})}
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
    describe('setOrder', () => {
      it('returns error if not authenticated', async () => {
        const user1 = await addUser(`user-1-${Date.now()}`)
        const user2 = await addUser(`user-2-${Date.now()}`)
        const deck1 = await addDeck({
          faction: FactionKey.ScoiaTael,
          name: 'deck1',
          userId: user1.id,
        })
        const deck2 = await addDeck({
          faction: FactionKey.Monsters,
          name: 'deck1',
          userId: user2.id,
        })
        const game = await addGame({
          opponentNames: [user2.name],
          creator: user1,
        })
        await setDeck({
          deckId: deck1.id,
          gameId: game.id,
          userId: user1.id,
        })
        await setDeck({
          deckId: deck2.id,
          gameId: game.id,
          userId: user2.id,
        })
        await expect(
          graphql({
            schema,
            source: `mutation {
              setOrder(
                game: "${game.id}",
                users: ["${user1.id}", "${user2.id}"]
              ) {
                ${getGameFragment({})}
              }
            }`,
          })
        ).resolves.toEqual({
          data: null,
          errors: [new GraphQLError(NOT_AUTHENTICATED_MESSAGE)],
        })
      })
      it('returns error if not a player', async () => {
        const user1 = await addUser(`user-1-${Date.now()}`)
        const user2 = await addUser(`user-2-${Date.now()}`)
        const user3 = await addUser(`user-3-${Date.now()}`)
        const deck1 = await addDeck({
          faction: FactionKey.ScoiaTael,
          name: 'deck1',
          userId: user1.id,
        })
        const deck2 = await addDeck({
          faction: FactionKey.Monsters,
          name: 'deck1',
          userId: user2.id,
        })
        const game = await addGame({
          opponentNames: [user2.name],
          creator: user1,
        })
        await setDeck({
          deckId: deck1.id,
          gameId: game.id,
          userId: user1.id,
        })
        await setDeck({
          deckId: deck2.id,
          gameId: game.id,
          userId: user2.id,
        })
        await expect(
          graphql({
            schema,
            source: `mutation {
              setOrder(
                game: "${game.id}",
                users: ["${user1.id}", "${user2.id}"]
              ) {
                ${getGameFragment({})}
              }
            }`,
            contextValue: {
              session: {
                user: {
                  _id: user3.id,
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
  })
})
