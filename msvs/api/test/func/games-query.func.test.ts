import { graphql } from 'graphql'
import { ObjectId } from 'mongodb'

import { addDeck, addGame, addUser, getGameDeck, playUnit, ready, setDeck, setOrder } from './util/graphql-util'
import { Combat, FactionKey, GameStatus } from '@gwent-oss/graphql-schema/resolver-typings'
import { ensureUnitsInHand } from '@gwent-oss/test-utils'
import { expectizeGame, expectizeGamePlayer, expectizePlayerRound } from './util/expect-util'
import funcEnv from './util/func-env'
import { getGameFragment } from './util/fragment-util'
import schema from '../../src/graphql/executable-schema'
import { sortObjectArray } from '@gwent-oss/utils'
import Store from '../../src/database/stores/store'

describe('games-query', () => {
  describe('games', () => {
    it('returns empty array if no games', async () => {
      const name = `games-${Date.now()}`
      const user = await addUser(name)
      await expect(
        graphql({
          schema,
          source: `{
            games {
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
        creator: user2,
      })
      await expect(
        graphql({
          schema,
          source: `{
            games {
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
        creator: user1,
      })
      await expect(
        graphql({
          schema,
          source: `{
            games {
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
        creator: user2,
      })
      await expect(
        graphql({
          schema,
          source: `{
            games {
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
        creator: user1,
      })
      const game2 = await addGame({
        opponentNames: [name2],
        creator: user1,
      })
      await expect(
        graphql({
          schema,
          source: `{
            games {
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
        creator: user1,
      })
      const game2 = await addGame({
        opponentNames: [name3],
        creator: user1,
      })
      await expect(
        graphql({
          schema,
          source: `{
            games {
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
        creator: user2,
      })
      const game2 = await addGame({
        opponentNames: [name1],
        creator: user2,
      })
      await expect(
        graphql({
          schema,
          source: `{
            games {
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
        creator: user2,
      })
      const game2 = await addGame({
        opponentNames: [name1],
        creator: user3,
      })
      await expect(
        graphql({
          schema,
          source: `{
            games {
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
        creator: user1,
      })
      const game2 = await addGame({
        opponentNames: [name1],
        creator: user2,
      })
      await expect(
        graphql({
          schema,
          source: `{
            games {
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
        creator: user1,
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
        creator: user1,
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
        creator: user1,
      })
      const deck1 = await addDeck({
        faction: FactionKey.Monsters,
        name: `games-1-${Date.now()}`,
        userId: user1.id,
      })
      const gameDeck1 = await setDeck({
        deckId: deck1.id,
        gameId: game.id,
        userId: user1.id,
      })
      const deck2 = await addDeck({
        faction: FactionKey.ScoiaTael,
        name: `games-2-${Date.now()}`,
        userId: user2.id,
      })
      const gameDeck2 = await setDeck({
        deckId: deck2.id,
        gameId: game.id,
        userId: user2.id,
      })
      const gamePlayer1 = expectizeGamePlayer({
        gameDeck: gameDeck1,
        user: user1,
      })
      const gamePlayer2 = expectizeGamePlayer({
        gameDeck: gameDeck2,
        user: user2,
      })
      await expect(
        graphql({
          schema,
          source: `{
            games {
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
          games: [
            expectizeGame({
              creator: user1,
              status: GameStatus.Ordering,
              players: [gamePlayer1, gamePlayer2],
            }),
          ],
        },
      })
    })
    it('returns factions and leaders if order set', async () => {
      const name1 = `games-1-${Date.now()}`
      const name2 = `games-2-${Date.now()}`
      const user1 = await addUser(name1)
      const user2 = await addUser(name2)
      const game = await addGame({
        opponentNames: [name2],
        creator: user1,
      })
      const deck1 = await addDeck({
        faction: FactionKey.Monsters,
        name: `games-1-${Date.now()}`,
        userId: user1.id,
      })
      const gameDeck1 = await setDeck({
        deckId: deck1.id,
        gameId: game.id,
        userId: user1.id,
      })
      const deck2 = await addDeck({
        faction: FactionKey.ScoiaTael,
        name: `games-2-${Date.now()}`,
        userId: user2.id,
      })
      const gameDeck2 = await setDeck({
        deckId: deck2.id,
        gameId: game.id,
        userId: user2.id,
      })
      const updatedGame = await setOrder({
        gameId: game.id,
        users: [user1.id, user2.id],
        userId: user2.id,
      })
      const gamePlayer1 = expectizeGamePlayer({
        gameDeck: gameDeck1,
        user: user1,
        order: updatedGame.turn?.user.id === user1.id ? 0 : 1,
      })
      const gamePlayer2 = expectizeGamePlayer({
        gameDeck: gameDeck2,
        user: user2,
        order: updatedGame.turn?.user.id === user2.id ? 0 : 1,
      })
      await expect(
        graphql({
          schema,
          source: `{
            games {
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
          games: [
            expectizeGame({
              creator: user1,
              status: GameStatus.Redrawing,
              players: [gamePlayer1, gamePlayer2],
              turn: updatedGame.turn?.user.id === user1.id ? gamePlayer1 : gamePlayer2,
            }),
          ],
        },
      })
    })
    it('returns factions and leaders if all players ready', async () => {
      const name1 = `games-1-${Date.now()}`
      const name2 = `games-2-${Date.now()}`
      const user1 = await addUser(name1)
      const user2 = await addUser(name2)
      const game = await addGame({
        opponentNames: [name2],
        creator: user1,
      })
      const deck1 = await addDeck({
        faction: FactionKey.Monsters,
        name: `games-1-${Date.now()}`,
        userId: user1.id,
      })
      const gameDeck1 = await setDeck({
        deckId: deck1.id,
        gameId: game.id,
        userId: user1.id,
      })
      const deck2 = await addDeck({
        faction: FactionKey.Monsters,
        name: `games-2-${Date.now()}`,
        userId: user2.id,
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
            games {
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
          games: [
            expectizeGame({
              creator: user1,
              status: GameStatus.Playing,
              players: [gamePlayer1, gamePlayer2],
              round: 1,
              turn: updatedGame.turn?.user.id === user1.id ? gamePlayer1 : gamePlayer2,
            }),
          ],
        },
      })
    })
    it('correctly batches requests to the database', async () => {
      const userName1 = `games-1-${Date.now()}`
      const userName2 = `games-2-${Date.now()}`
      const userName3 = `games-3-${Date.now()}`
      const unitName1 = "Gaunter O'Dimm"
      const unitName2 = "Gaunter O'Dimm Darkness"
      const unitName3 = 'Vernon Roche'
      const unitName4 = 'Leshen'
      const user1 = await addUser(userName1)
      const user2 = await addUser(userName2)
      const user3 = await addUser(userName3)

      const deckSelf = await addDeck({
        faction: FactionKey.ScoiaTael,
        name: `games-deck-self-${Date.now()}`,
        userId: user1.id,
      })
      const deckOpponent1 = await addDeck({
        faction: FactionKey.NorthernRealms,
        name: `games-deck-opponent-1-${Date.now()}`,
        userId: user2.id,
      })
      const deckOpponent2 = await addDeck({
        faction: FactionKey.Monsters,
        name: `games-deck-opponent-2-${Date.now()}`,
        userId: user3.id,
      })

      const game1 = await addGame({
        opponentNames: [userName2],
        creator: user1,
      })
      const game2 = await addGame({
        opponentNames: [userName3],
        creator: user1,
      })

      await setDeck({
        deckId: deckSelf.id,
        gameId: game1.id,
        userId: user1.id,
      })
      await setDeck({
        deckId: deckOpponent1.id,
        gameId: game1.id,
        userId: user2.id,
      })
      await setDeck({
        deckId: deckSelf.id,
        gameId: game2.id,
        userId: user1.id,
      })
      await setDeck({
        deckId: deckOpponent2.id,
        gameId: game2.id,
        userId: user3.id,
      })

      await setOrder({
        gameId: game1.id,
        userId: user1.id,
        users: [user1.id, user2.id],
      })
      await setOrder({
        gameId: game2.id,
        userId: user1.id,
        users: [user1.id, user3.id],
      })

      await ensureUnitsInHand({
        gameId: game1.id,
        userId: user1.id,
        mongoConnectionString: funcEnv.MONGO_URL,
        mongoDatabaseName: funcEnv.MONGO_DB,
        unitNames: [unitName1, unitName2, unitName2],
        excludeNames: [unitName2],
      })
      await ensureUnitsInHand({
        gameId: game1.id,
        userId: user2.id,
        mongoConnectionString: funcEnv.MONGO_URL,
        mongoDatabaseName: funcEnv.MONGO_DB,
        unitNames: [unitName3],
      })
      await ensureUnitsInHand({
        gameId: game2.id,
        userId: user1.id,
        mongoConnectionString: funcEnv.MONGO_URL,
        mongoDatabaseName: funcEnv.MONGO_DB,
        unitNames: [unitName1, unitName2, unitName2],
        excludeNames: [unitName2],
      })
      await ensureUnitsInHand({
        gameId: game2.id,
        userId: user3.id,
        mongoConnectionString: funcEnv.MONGO_URL,
        mongoDatabaseName: funcEnv.MONGO_DB,
        unitNames: [unitName4],
      })

      await ready({
        gameId: game1.id,
        userId: user1.id,
      })
      await ready({
        gameId: game1.id,
        userId: user2.id,
      })
      await ready({
        gameId: game2.id,
        userId: user1.id,
      })
      await ready({
        gameId: game2.id,
        userId: user3.id,
      })

      const gameDeckSelf1 = await getGameDeck({
        gameId: game1.id,
        userId: user1.id,
      })
      const gameDeckOpponent1 = await getGameDeck({
        gameId: game1.id,
        userId: user2.id,
      })
      const gameDeckSelf2 = await getGameDeck({
        gameId: game2.id,
        userId: user1.id,
      })
      const gameDeckOpponent2 = await getGameDeck({
        gameId: game2.id,
        userId: user3.id,
      })

      // game 1
      const unitGame1Self1 = sortObjectArray({
        array: gameDeckSelf1.hand,
        sortProperties: ['unit.id'],
      }).find((unit) => unit.unit.name === unitName1)
      if (!unitGame1Self1) {
        throw Error(`Could not find unit "${unitName1}" in self hand for game 1`)
      }
      gameDeckSelf1.hand = gameDeckSelf1.hand.filter((handUnit) => handUnit.unit.id !== unitGame1Self1.unit.id)
      const musterEffectId = unitGame1Self1.unit.effects && unitGame1Self1.unit.effects[0].id
      if (!musterEffectId) {
        throw Error(`Could not find muster effect ID for unit "${unitName1}"`)
      }

      const unitGame1Self2 = sortObjectArray({
        array: gameDeckSelf1.hand,
        sortProperties: ['unit.id'],
      }).find((unit) => unit.unit.name === unitName2)
      if (!unitGame1Self2) {
        throw Error(`Could not find first unit "${unitName2}" in self hand for game 1`)
      }
      gameDeckSelf1.hand = gameDeckSelf1.hand.filter((handUnit) => handUnit.unit.id !== unitGame1Self2.unit.id)

      const unitGame1Self3 = sortObjectArray({
        array: gameDeckSelf1.hand,
        sortProperties: ['unit.id'],
      }).find((unit) => unit.unit.name === unitName2)
      if (!unitGame1Self3) {
        throw Error(`Could not find second unit "${unitName2}" in self hand for game 1`)
      }
      gameDeckSelf1.hand = gameDeckSelf1.hand.filter((handUnit) => handUnit.unit.id !== unitGame1Self3.unit.id)

      const unitGame1Self4 = sortObjectArray({
        array: gameDeckSelf1.undrawn,
        sortProperties: ['unit.id'],
      }).find((unit) => unit.unit.name === unitName2)
      if (!unitGame1Self4) {
        throw Error(`Could not find third unit "${unitName2}" in self undrawn for game 1`)
      }
      gameDeckSelf1.undrawn = gameDeckSelf1.undrawn.filter(
        (undrawnUnit) => undrawnUnit.unit.id !== unitGame1Self4.unit.id
      )

      const unitGame1Opponent1 = gameDeckOpponent1.hand.find((handUnit) => handUnit.unit.name === unitName3)
      if (!unitGame1Opponent1) {
        throw Error(`Could not find unit "${unitName3}" in opponent hand for game 1`)
      }
      gameDeckOpponent1.hand = gameDeckOpponent1.hand.filter(
        (handUnit) => handUnit.unit.id !== unitGame1Opponent1.unit.id
      )

      // game 2
      const unitGame2Self1 = sortObjectArray({
        array: gameDeckSelf2.hand,
        sortProperties: ['unit.id'],
      }).find((unit) => unit.unit.name === unitName1)
      if (!unitGame2Self1) {
        throw Error(`Could not find unit "${unitName1}" in self hand`)
      }
      gameDeckSelf2.hand = gameDeckSelf2.hand.filter((handUnit) => handUnit.unit.id !== unitGame2Self1.unit.id)

      const unitGame2Self2 = sortObjectArray({
        array: gameDeckSelf2.hand,
        sortProperties: ['unit.id'],
      }).find((unit) => unit.unit.name === unitName2)
      if (!unitGame2Self2) {
        throw Error(`Could not find first unit "${unitName2}" in self hand for game 2`)
      }
      gameDeckSelf2.hand = gameDeckSelf2.hand.filter((handUnit) => handUnit.unit.id !== unitGame2Self2.unit.id)

      const unitGame2Self3 = sortObjectArray({
        array: gameDeckSelf2.hand,
        sortProperties: ['unit.id'],
      }).find((unit) => unit.unit.name === unitName2)
      if (!unitGame2Self3) {
        throw Error(`Could not find second unit "${unitName2}" in self hand for game 2`)
      }
      gameDeckSelf2.hand = gameDeckSelf2.hand.filter((handUnit) => handUnit.unit.id !== unitGame2Self3.unit.id)

      const unitGame2Self4 = sortObjectArray({
        array: gameDeckSelf2.undrawn,
        sortProperties: ['unit.id'],
      }).find((unit) => unit.unit.name === unitName2)
      if (!unitGame2Self4) {
        throw Error(`Could not find third unit "${unitName2}" in self undrawn for game 2`)
      }
      gameDeckSelf2.undrawn = gameDeckSelf2.undrawn.filter(
        (undrawnUnit) => undrawnUnit.unit.id !== unitGame2Self4.unit.id
      )

      const unitGame2Opponent2 = gameDeckOpponent2.hand.find((handUnit) => handUnit.unit.name === unitName4)
      if (!unitGame2Opponent2) {
        throw Error(`Could not find unit "${unitName4}" in opponent hand for game 2`)
      }
      gameDeckOpponent2.hand = gameDeckOpponent2.hand.filter(
        (handUnit) => handUnit.unit.id !== unitGame2Opponent2.unit.id
      )

      await playUnit({
        gameId: game1.id,
        combat: Combat.Siege,
        unitId: unitGame1Self1.unit.id,
        userId: user1.id,
      })
      await playUnit({
        gameId: game1.id,
        combat: Combat.Close,
        unitId: unitGame1Opponent1.unit.id,
        userId: user2.id,
      })

      await playUnit({
        gameId: game2.id,
        combat: Combat.Siege,
        unitId: unitGame2Self1.unit.id,
        userId: user1.id,
      })
      await playUnit({
        gameId: game2.id,
        combat: Combat.Ranged,
        unitId: unitGame2Opponent2.unit.id,
        userId: user3.id,
      })

      const readSpy = jest.spyOn(Store as any, 'read')

      await graphql({
        schema,
        source: `{
          games {
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

      expect(readSpy.mock.calls).toEqual([
        // getting all games in games-query.ts
        [
          {
            filter: {
              'players.user': new ObjectId(user1.id),
            },
          },
        ],
        // getting units in game-resolver.ts
        [
          {
            filter: {
              _id: {
                $in: [
                  ...[unitGame1Self2.unit.id, unitGame1Self3.unit.id].sort().map((id) => new ObjectId(id)),
                  new ObjectId(unitGame1Self4.unit.id),
                  new ObjectId(unitGame1Self1.unit.id),
                  new ObjectId(unitGame1Opponent1.unit.id),
                  new ObjectId(unitGame2Opponent2.unit.id),
                ],
              },
            },
            options: {
              collation: {
                locale: 'en',
              },
              sort: {
                name: 1,
                _id: 1,
              },
            },
          },
        ],
        // getting dlcs for units (can be hoisted for batching)
        [
          {
            filter: {
              _id: {
                $in: [new ObjectId(unitGame1Self1.unit.dlc?.id)],
              },
            },
          },
        ],
        // getting effects for units (can be hoisted for batching)
        [
          {
            filter: {
              _id: {
                $in: [new ObjectId(musterEffectId)],
              },
            },
          },
        ],
        // getting factions for units (can be hoisted for batching)
        [
          {
            filter: {
              _id: {
                $in: [
                  new ObjectId(unitGame1Self1.unit.faction.id),
                  new ObjectId(unitGame2Opponent2.unit.faction.id),
                  new ObjectId(unitGame1Opponent1.unit.faction.id),
                ],
              },
            },
          },
        ],
        // getting users in game-resolver.ts
        [
          {
            filter: {
              _id: { $in: [new ObjectId(user1.id), new ObjectId(user2.id), new ObjectId(user3.id)] },
            },
          },
        ],
        // factions for first game decks (can be hoisted for batching)
        [
          {
            filter: {
              _id: {
                $in: [new ObjectId(deckSelf.faction.id), new ObjectId(deckOpponent1.faction.id)],
              },
            },
          },
        ],
        // leaders for first game decks (can be hoisted for batching)
        [
          {
            filter: {
              _id: {
                $in: [new ObjectId(deckSelf.leader.id), new ObjectId(deckOpponent1.leader.id)],
              },
            },
            options: {
              collation: {
                locale: 'en',
              },
              sort: {
                _id: 1,
                name: 1,
              },
            },
          },
        ],
        // factions for second game decks (can be hoisted for batching)
        [
          {
            filter: {
              _id: {
                $in: [new ObjectId(deckSelf.faction.id), new ObjectId(deckOpponent2.faction.id)],
              },
            },
          },
        ],
        // leaders for second game decks (can be hoisted for batching)
        [
          {
            filter: {
              _id: {
                $in: [new ObjectId(deckSelf.leader.id), new ObjectId(deckOpponent2.leader.id)],
              },
            },
            options: {
              collation: {
                locale: 'en',
              },
              sort: {
                _id: 1,
                name: 1,
              },
            },
          },
        ],
        // dlcs for leaders in second game decks (can be hoisted for batching)
        [
          {
            filter: {
              _id: {
                $in: [new ObjectId(deckOpponent2.leader.dlc?.id)],
              },
            },
          },
        ],
      ])
    })
  })
})
