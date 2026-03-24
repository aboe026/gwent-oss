import { graphql, GraphQLError } from 'graphql'
import { ObjectId } from 'mongodb'

import { addDeck, addGame, addUser, getGame, getGameDeck, ready, setDeck } from './util/graphql-util'
import { Deck, FactionKey, Game, GameStatus, User } from '@gwent/graphql-schema/resolver-typings'
import { ensureUnitsInHand, setTurnOrder } from '@gwent/test-utils'
import { expectizeGame, expectizeGamePlayer, expectizeMoveUnit, expectizePlayerRound } from './util/expect-util'
import funcEnv from './util/func-env'
import { getGameFragment } from './util/fragment-util'
import schema from '../../src/graphql/executable-schema'
import TestUtil from '../util/test-util'
import * as utils from '@gwent/utils'

describe('effect-spy', () => {
  let self: User
  let opponent: User
  let game: Game
  let deckSelf: Deck
  let deckOpponent: Deck
  beforeEach(async () => {
    self = await addUser(`effect-spy-self-${Date.now()}`)
    opponent = await addUser(`effect-spy-opponent-${Date.now()}`)
    game = await addGame({
      creator: self,
      opponentNames: [opponent.name],
    })
    deckSelf = await addDeck({
      faction: FactionKey.NorthernRealms,
      name: `effect-spy-deck-self-${Date.now()}`,
      userId: self.id,
    })
    deckOpponent = await addDeck({
      faction: FactionKey.Monsters,
      name: `effect-spy-deck-opponent-${Date.now()}`,
      userId: opponent.id,
    })
    await setDeck({
      deckId: deckSelf.id,
      gameId: game.id,
      userId: self.id,
    })
    await setDeck({
      deckId: deckOpponent.id,
      gameId: game.id,
      userId: opponent.id,
    })
    await setTurnOrder({
      gameId: game.id,
      mongoConnectionString: funcEnv.MONGO_URL,
      mongoDatabaseName: funcEnv.MONGO_DB,
      userIds: [self.id, opponent.id],
    })
    await ready({
      gameId: game.id,
      userId: self.id,
    })
    await ready({
      gameId: game.id,
      userId: opponent.id,
    })
    game = await getGame({
      gameId: game.id,
      userId: self.id,
    })
  })
  describe('invalid', () => {
    it('spy with target that is invalid ObjectId throws error', async () => {
      const unitName = 'Prince Stennis'
      await ensureUnitsInHand({
        gameId: game.id,
        userId: self.id,
        mongoConnectionString: funcEnv.MONGO_URL,
        mongoDatabaseName: funcEnv.MONGO_DB,
        unitNames: [unitName],
      })

      const gameDeck = await getGameDeck({
        gameId: game.id,
        userId: self.id,
      })

      const unitSelf1 = utils
        .sortObjectArray({
          array: gameDeck.hand,
          sortProperties: ['unit.id'],
        })
        .find((unit) => unit.unit.name === unitName)
      if (!unitSelf1) {
        throw Error(`Could not find unit "${unitName}" in hand`)
      }

      const target = 'invalid'

      await expect(
        graphql({
          schema,
          source: `mutation {
            playUnit(
              game: "${game.id}"
              unit: "${unitSelf1.unit.id}"
              target: "${target}"
            ) {
              ${getGameFragment()}
            }
          }`,
          contextValue: {
            session: {
              user: TestUtil.getDbUserFromUser(self),
            },
          },
        })
      ).resolves.toEqual({
        data: null,
        errors: [new GraphQLError(`Target ID "${target}" not a valid MongoDB ObjectId.`)],
      })
    })
    it('spy with target that is self throws error', async () => {
      const unitName = 'Prince Stennis'
      await ensureUnitsInHand({
        gameId: game.id,
        userId: self.id,
        mongoConnectionString: funcEnv.MONGO_URL,
        mongoDatabaseName: funcEnv.MONGO_DB,
        unitNames: [unitName],
      })

      const gameDeck = await getGameDeck({
        gameId: game.id,
        userId: self.id,
      })

      const unitSelf1 = utils
        .sortObjectArray({
          array: gameDeck.hand,
          sortProperties: ['unit.id'],
        })
        .find((unit) => unit.unit.name === unitName)
      if (!unitSelf1) {
        throw Error(`Could not find unit "${unitName}" in hand`)
      }

      await expect(
        graphql({
          schema,
          source: `mutation {
            playUnit(
              game: "${game.id}"
              unit: "${unitSelf1.unit.id}"
              target: "${self.id}"
            ) {
              ${getGameFragment()}
            }
          }`,
          contextValue: {
            session: {
              user: TestUtil.getDbUserFromUser(self),
            },
          },
        })
      ).resolves.toEqual({
        data: null,
        errors: [new GraphQLError(`Invalid spy target "${self.id}": Cannot be self, must be an opponent.`)],
      })
    })
    it('spy with target that is not player on game throws error', async () => {
      const unitName = 'Prince Stennis'
      await ensureUnitsInHand({
        gameId: game.id,
        userId: self.id,
        mongoConnectionString: funcEnv.MONGO_URL,
        mongoDatabaseName: funcEnv.MONGO_DB,
        unitNames: [unitName],
      })

      const gameDeck = await getGameDeck({
        gameId: game.id,
        userId: self.id,
      })

      const unitSelf1 = utils
        .sortObjectArray({
          array: gameDeck.hand,
          sortProperties: ['unit.id'],
        })
        .find((unit) => unit.unit.name === unitName)
      if (!unitSelf1) {
        throw Error(`Could not find unit "${unitName}" in hand`)
      }

      const target = new ObjectId().toString()

      await expect(
        graphql({
          schema,
          source: `mutation {
            playUnit(
              game: "${game.id}"
              unit: "${unitSelf1.unit.id}"
              target: "${target}"
            ) {
              ${getGameFragment()}
            }
          }`,
          contextValue: {
            session: {
              user: TestUtil.getDbUserFromUser(self),
            },
          },
        })
      ).resolves.toEqual({
        data: null,
        errors: [new GraphQLError(`Invalid spy target "${target}": Could not find that opponent on game.`)],
      })
    })
  })
  describe('valid', () => {
    it('spy works without target specified if single opponent', async () => {
      const unitName = 'Prince Stennis'
      await ensureUnitsInHand({
        gameId: game.id,
        userId: self.id,
        mongoConnectionString: funcEnv.MONGO_URL,
        mongoDatabaseName: funcEnv.MONGO_DB,
        unitNames: [unitName],
      })

      const gameDeck = await getGameDeck({
        gameId: game.id,
        userId: self.id,
      })

      jest.spyOn(utils, 'getRandomNumber').mockReturnValue(0)

      const unitSelf1 = utils
        .sortObjectArray({
          array: gameDeck.hand,
          sortProperties: ['unit.id'],
        })
        .find((unit) => unit.unit.name === unitName)
      if (!unitSelf1) {
        throw Error(`Could not find unit "${unitName}" in hand`)
      }
      gameDeck.hand = gameDeck.hand.filter((handUnit) => handUnit.unit.id !== unitSelf1.unit.id)
      gameDeck.hand.push(gameDeck.undrawn[0])
      const spied1 = gameDeck.undrawn.splice(0, 1)
      gameDeck.hand.push(gameDeck.undrawn[0])
      const spied2 = gameDeck.undrawn.splice(0, 1)

      const opponentGamePlayer = expectizeGamePlayer({
        user: opponent,
        gameDeck: await getGameDeck({
          gameId: game.id,
          userId: opponent.id,
        }),
        order: 1,
        ready: true,
        rounds: [
          expectizePlayerRound({
            close: {
              score: 5,
              units: [
                TestUtil.getGameUnit({
                  unit: unitSelf1.unit,
                }),
              ],
            },
            score: 5,
          }),
        ],
      })

      await expect(
        graphql({
          schema,
          source: `mutation {
            playUnit(
              game: "${game.id}"
              unit: "${unitSelf1.unit.id}"
            ) {
              ${getGameFragment()}
            }
          }`,
          contextValue: {
            session: {
              user: TestUtil.getDbUserFromUser(self),
            },
          },
        })
      ).resolves.toEqual({
        data: {
          playUnit: expectizeGame({
            creator: game.creator,
            players: [
              expectizeGamePlayer({
                user: self,
                gameDeck,
                order: 0,
                ready: true,
                rounds: [
                  expectizePlayerRound({
                    close: TestUtil.getPlayerCombatRow({}),
                    moves: [
                      expectizeMoveUnit({
                        unit: unitSelf1,
                        impacts: [
                          TestUtil.getImpact({
                            unit: TestUtil.getGameUnit({
                              unit: spied1[0].unit,
                              effectiveStrength: null,
                            }),
                            user: self,
                          }),
                          TestUtil.getImpact({
                            unit: TestUtil.getGameUnit({
                              unit: spied2[0].unit,
                              effectiveStrength: null,
                            }),
                            user: self,
                          }),
                        ],
                      }),
                    ],
                    ranged: TestUtil.getPlayerCombatRow({}),
                    siege: TestUtil.getPlayerCombatRow({}),
                    score: 0,
                  }),
                ],
              }),
              opponentGamePlayer,
            ],
            status: GameStatus.Playing,
            round: 1,
            turn: opponentGamePlayer,
          }),
        },
      })
    })
    it('spy works with target specified if single opponent', async () => {
      const unitName = 'Prince Stennis'
      await ensureUnitsInHand({
        gameId: game.id,
        userId: self.id,
        mongoConnectionString: funcEnv.MONGO_URL,
        mongoDatabaseName: funcEnv.MONGO_DB,
        unitNames: [unitName],
      })

      const gameDeck = await getGameDeck({
        gameId: game.id,
        userId: self.id,
      })

      jest.spyOn(utils, 'getRandomNumber').mockReturnValue(0)

      const unitSelf1 = utils
        .sortObjectArray({
          array: gameDeck.hand,
          sortProperties: ['unit.id'],
        })
        .find((unit) => unit.unit.name === unitName)
      if (!unitSelf1) {
        throw Error(`Could not find unit "${unitName}" in hand`)
      }
      gameDeck.hand = gameDeck.hand.filter((handUnit) => handUnit.unit.id !== unitSelf1.unit.id)
      gameDeck.hand.push(gameDeck.undrawn[0])
      const spied1 = gameDeck.undrawn.splice(0, 1)
      gameDeck.hand.push(gameDeck.undrawn[0])
      const spied2 = gameDeck.undrawn.splice(0, 1)

      const opponentGamePlayer = expectizeGamePlayer({
        user: opponent,
        gameDeck: await getGameDeck({
          gameId: game.id,
          userId: opponent.id,
        }),
        order: 1,
        ready: true,
        rounds: [
          expectizePlayerRound({
            close: {
              score: 5,
              units: [
                TestUtil.getGameUnit({
                  unit: unitSelf1.unit,
                }),
              ],
            },
            score: 5,
          }),
        ],
      })

      await expect(
        graphql({
          schema,
          source: `mutation {
            playUnit(
              game: "${game.id}"
              unit: "${unitSelf1.unit.id}"
              target: "${opponent.id}"
            ) {
              ${getGameFragment()}
            }
          }`,
          contextValue: {
            session: {
              user: TestUtil.getDbUserFromUser(self),
            },
          },
        })
      ).resolves.toEqual({
        data: {
          playUnit: expectizeGame({
            creator: game.creator,
            players: [
              expectizeGamePlayer({
                user: self,
                gameDeck,
                order: 0,
                ready: true,
                rounds: [
                  expectizePlayerRound({
                    close: TestUtil.getPlayerCombatRow({}),
                    moves: [
                      expectizeMoveUnit({
                        unit: unitSelf1,
                        impacts: [
                          TestUtil.getImpact({
                            unit: TestUtil.getGameUnit({
                              unit: spied1[0].unit,
                              effectiveStrength: null,
                            }),
                            user: self,
                          }),
                          TestUtil.getImpact({
                            unit: TestUtil.getGameUnit({
                              unit: spied2[0].unit,
                              effectiveStrength: null,
                            }),
                            user: self,
                          }),
                        ],
                      }),
                    ],
                    ranged: TestUtil.getPlayerCombatRow({}),
                    siege: TestUtil.getPlayerCombatRow({}),
                    score: 0,
                  }),
                ],
              }),
              opponentGamePlayer,
            ],
            status: GameStatus.Playing,
            round: 1,
            turn: opponentGamePlayer,
          }),
        },
      })
    })
  })
})
