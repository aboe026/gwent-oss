import { GraphQLError, graphql } from 'graphql'

import { addDeck, addGame, addUser, ready, setDeck } from './util/graphql-util'
import DbConnector from '../../src/database/db-connector'
import DbUpgrader from '../../src/database/db-upgrader'
import DbUtil from './util/db-util'
import { getGameFragment } from './util/fragment-util'
import schema from '../../src/graphql/executable-schema'
import { expectizeGame } from './util/expect-util'
import { FactionKey, GameStatus } from '@gwent/graphql-schema/resolver-typings'
import { NOT_AUTHENTICATED_MESSAGE, STARTING_HAND_SIZE } from '@gwent/constants'

describe('games', () => {
  beforeAll(async () => {
    await DbUtil.deleteDatabase()
    await DbUpgrader.run()
  })
  afterAll(async () => {
    await DbConnector.disconnect()
  })
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
                ${getGameFragment({})}
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
          errors: [new GraphQLError(`Not enough opponents for game at "0". Need at least "1" opponent.`)],
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
          errors: [
            new GraphQLError(`Excessive number of opponents for game at "2". Cannot have more than "1" opponent.`),
          ],
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
          errors: [new GraphQLError(`User with name "${name2}" does not exist`)],
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
  describe('games', () => {
    it('returns empty array if no games', async () => {
      const name = `games-${Date.now()}`
      const user = await addUser(name)
      await expect(
        graphql({
          schema,
          source: `{
            games {
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
        data: {
          games: [],
        },
      })
    })
    it('returns empty array if only game is for other players', async () => {
      const name1 = `games-1-${Date.now()}`
      const name2 = `games-2-${Date.now()}`
      const name3 = `games-3-${Date.now()}`
      const user1 = await addUser(name1)
      const user2 = await addUser(name2)
      await addUser(name3)
      await addGame({
        opponentNames: [name3],
        userId: user2.id,
      })
      await expect(
        graphql({
          schema,
          source: `{
            games {
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
        data: {
          games: [],
        },
      })
    })
    it('returns single game if one created', async () => {
      const name1 = `games-1-${Date.now()}`
      const name2 = `games-2-${Date.now()}`
      const user1 = await addUser(name1)
      await addUser(name2)
      const game = await addGame({
        opponentNames: [name2],
        userId: user1.id,
      })
      await expect(
        graphql({
          schema,
          source: `{
            games {
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
        data: {
          games: [game],
        },
      })
    })
    it('returns single game if one participated', async () => {
      const name1 = `games-1-${Date.now()}`
      const name2 = `games-2-${Date.now()}`
      const user1 = await addUser(name1)
      const user2 = await addUser(name2)
      const game = await addGame({
        opponentNames: [name1],
        userId: user2.id,
      })
      await expect(
        graphql({
          schema,
          source: `{
            games {
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
        data: {
          games: [game],
        },
      })
    })
    it('returns multiple games for created with same opponent', async () => {
      const name1 = `games-1-${Date.now()}`
      const name2 = `games-2-${Date.now()}`
      const user1 = await addUser(name1)
      await addUser(name2)
      const game1 = await addGame({
        opponentNames: [name2],
        userId: user1.id,
      })
      const game2 = await addGame({
        opponentNames: [name2],
        userId: user1.id,
      })
      await expect(
        graphql({
          schema,
          source: `{
            games {
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
        data: {
          games: [game1, game2],
        },
      })
    })
    it('returns multiple games for created with different opponents', async () => {
      const name1 = `games-1-${Date.now()}`
      const name2 = `games-2-${Date.now()}`
      const name3 = `games-3-${Date.now()}`
      const user1 = await addUser(name1)
      await addUser(name2)
      await addUser(name3)
      const game1 = await addGame({
        opponentNames: [name2],
        userId: user1.id,
      })
      const game2 = await addGame({
        opponentNames: [name3],
        userId: user1.id,
      })
      await expect(
        graphql({
          schema,
          source: `{
            games {
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
        data: {
          games: [game1, game2],
        },
      })
    })
    it('returns multiple games participated with same opponent', async () => {
      const name1 = `games-1-${Date.now()}`
      const name2 = `games-2-${Date.now()}`
      const user1 = await addUser(name1)
      const user2 = await addUser(name2)
      const game1 = await addGame({
        opponentNames: [name1],
        userId: user2.id,
      })
      const game2 = await addGame({
        opponentNames: [name1],
        userId: user2.id,
      })
      await expect(
        graphql({
          schema,
          source: `{
            games {
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
        data: {
          games: [game1, game2],
        },
      })
    })
    it('returns multiple games participated with different opponents', async () => {
      const name1 = `games-1-${Date.now()}`
      const name2 = `games-2-${Date.now()}`
      const name3 = `games-3-${Date.now()}`
      const user1 = await addUser(name1)
      const user2 = await addUser(name2)
      const user3 = await addUser(name3)
      const game1 = await addGame({
        opponentNames: [name1],
        userId: user2.id,
      })
      const game2 = await addGame({
        opponentNames: [name1],
        userId: user3.id,
      })
      await expect(
        graphql({
          schema,
          source: `{
            games {
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
        data: {
          games: [game1, game2],
        },
      })
    })
    it('returns multiple games for created and participant', async () => {
      const name1 = `games-1-${Date.now()}`
      const name2 = `games-2-${Date.now()}`
      const user1 = await addUser(name1)
      const user2 = await addUser(name2)
      const game1 = await addGame({
        opponentNames: [name2],
        userId: user1.id,
      })
      const game2 = await addGame({
        opponentNames: [name1],
        userId: user2.id,
      })
      await expect(
        graphql({
          schema,
          source: `{
            games {
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
        data: {
          games: [game1, game2],
        },
      })
    })
    it('returns null for factions and leaders if only creator sets deck', async () => {
      const name1 = `games-1-${Date.now()}`
      const name2 = `games-2-${Date.now()}`
      const user1 = await addUser(name1)
      const user2 = await addUser(name2)
      const game = await addGame({
        opponentNames: [name2],
        userId: user1.id,
      })
      const deck = await addDeck({
        faction: FactionKey.Monsters,
        name: `games-${Date.now()}`,
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
            games {
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
        data: {
          games: [
            expectizeGame({
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
          ],
        },
      })
    })
    it('returns null for factions and leaders if only opponent sets deck', async () => {
      const name1 = `games-1-${Date.now()}`
      const name2 = `games-2-${Date.now()}`
      const user1 = await addUser(name1)
      const user2 = await addUser(name2)
      const game = await addGame({
        opponentNames: [name2],
        userId: user1.id,
      })
      const deck = await addDeck({
        faction: FactionKey.Monsters,
        name: `games-${Date.now()}`,
        userId: user2.id,
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
            games {
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
        data: {
          games: [
            expectizeGame({
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
          ],
        },
      })
    })
    it('returns factions and leaders if all players set decks', async () => {
      const name1 = `games-1-${Date.now()}`
      const name2 = `games-2-${Date.now()}`
      const user1 = await addUser(name1)
      const user2 = await addUser(name2)
      const game = await addGame({
        opponentNames: [name2],
        userId: user1.id,
      })
      const deck1 = await addDeck({
        faction: FactionKey.Monsters,
        name: `games-1-${Date.now()}`,
        userId: user1.id,
      })
      await setDeck({
        deckId: deck1.id,
        gameId: game.id,
        userId: user1.id,
      })
      const deck2 = await addDeck({
        faction: FactionKey.Monsters,
        name: `games-2-${Date.now()}`,
        userId: user2.id,
      })
      await setDeck({
        deckId: deck2.id,
        gameId: game.id,
        userId: user2.id,
      })
      await ready({
        gameId: game.id,
        userId: user1.id,
      })
      await ready({
        gameId: game.id,
        userId: user2.id,
      })
      await expect(
        graphql({
          schema,
          source: `{
            games {
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
        data: {
          games: [
            expectizeGame({
              creator: user1,
              status: GameStatus.Playing,
              players: [
                {
                  faction: deck1.faction,
                  leader: deck1.leader,
                  user: user1,
                  counts: {
                    discard: 0,
                    hand: STARTING_HAND_SIZE,
                    undrawn: deck1.units.length - STARTING_HAND_SIZE,
                  },
                  ready: true,
                },
                {
                  faction: deck1.faction,
                  leader: deck1.leader,
                  user: user2,
                  counts: {
                    discard: 0,
                    hand: STARTING_HAND_SIZE,
                    undrawn: deck2.units.length - STARTING_HAND_SIZE,
                  },
                  ready: true,
                },
              ],
            }),
          ],
        },
      })
    })
  })
})
