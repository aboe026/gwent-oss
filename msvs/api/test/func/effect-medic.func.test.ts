import { graphql, GraphQLError } from 'graphql'

import {
  addDeck,
  addGame,
  addUser,
  getGame,
  getGameDeck,
  playPass,
  playUnit,
  ready,
  setDeck,
  setOrder,
} from './util/graphql-util'
import {
  Combat,
  Deck,
  FactionKey,
  Game,
  GameStatus,
  GameUnitOrigin,
  MoveReasonType,
  User,
} from '@gwent/graphql-schema/resolver-typings'
import { ensureUnitsInHand } from '@gwent/test-utils'
import { expectizeGame, expectizeGamePlayer, expectizeMoveUnit, expectizePlayerRound } from './util/expect-util'
import funcEnv from './util/func-env'
import { getGameFragment } from './util/fragment-util'
import schema from '../../src/graphql/executable-schema'
import TestUtil from '../util/test-util'

describe('effect-medic', () => {
  let self: User
  let opponent: User
  let game: Game
  let deckSelf: Deck
  let deckOpponent: Deck
  const medicUnitName = 'Dun Banner Medic'
  const scorchUnitName = 'Scorch'
  const hornUnitName = "Commander's Horn"
  beforeEach(async () => {
    self = await addUser(`effect-medic-self-${Date.now()}`)
    opponent = await addUser(`effect-medic-opponent-${Date.now()}`)
    game = await addGame({
      creator: self,
      opponentNames: [opponent.name],
    })
    deckSelf = await addDeck({
      faction: FactionKey.NorthernRealms,
      name: `effect-medic-deck-self-${Date.now()}`,
      userId: self.id,
      unitNames: [medicUnitName, hornUnitName],
    })
    deckOpponent = await addDeck({
      faction: FactionKey.ScoiaTael,
      name: `effect-medic-deck-opponent-${Date.now()}`,
      userId: opponent.id,
      unitNames: [scorchUnitName, scorchUnitName],
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
    await setOrder({
      gameId: game.id,
      userId: opponent.id,
      users: [self.id, opponent.id],
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
    it('throws error if attempting to revive hero', async () => {
      const unitName1 = 'John Natalis'
      const unitName2 = 'Ves'
      const unitName3 = medicUnitName
      await ensureUnitsInHand({
        gameId: game.id,
        userId: self.id,
        mongoConnectionString: funcEnv.MONGO_URL,
        mongoDatabaseName: funcEnv.MONGO_DB,
        unitNames: [unitName1, unitName2, unitName3],
      })

      const gameDeckSelf = await getGameDeck({
        gameId: game.id,
        userId: self.id,
      })

      const unitSelf1 = gameDeckSelf.hand.find((unit) => unit.unit.name === unitName1)
      if (!unitSelf1) {
        throw Error(`Could not find unit "${unitName1}" in hand`)
      }

      await playUnit({
        gameId: game.id,
        unitId: unitSelf1.unit.id,
        combat: Combat.Close,
        userId: self.id,
      })
      gameDeckSelf.hand = gameDeckSelf.hand.filter((handUnit) => handUnit.unit.id !== unitSelf1.unit.id)

      await playPass({
        gameId: game.id,
        userId: opponent.id,
      })

      const unitSelf2 = gameDeckSelf.hand.find((unit) => unit.unit.name === unitName2)
      if (!unitSelf2) {
        throw Error(`Could not find unit "${unitName2}" in hand`)
      }

      await playUnit({
        gameId: game.id,
        userId: self.id,
        unitId: unitSelf2.unit.id,
      })

      await playPass({
        gameId: game.id,
        userId: self.id,
      })

      const unitSelf3 = gameDeckSelf.hand.find((unit) => unit.unit.name === unitName3)
      if (!unitSelf3) {
        throw Error(`Could not find unit "${unitName3}" in hand`)
      }

      await playUnit({
        gameId: game.id,
        userId: self.id,
        unitId: unitSelf3.unit.id,
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
        data: null,
        errors: [new GraphQLError(`Invalid unit "${unitSelf1.unit.id}": Cannot revive hero units.`)],
      })
    })
    it('throws error if attempting to revive special', async () => {
      const unitName1 = hornUnitName
      const unitName2 = 'Ves'
      const unitName3 = medicUnitName
      await ensureUnitsInHand({
        gameId: game.id,
        userId: self.id,
        mongoConnectionString: funcEnv.MONGO_URL,
        mongoDatabaseName: funcEnv.MONGO_DB,
        unitNames: [unitName1, unitName2, unitName3],
      })

      const gameDeckSelf = await getGameDeck({
        gameId: game.id,
        userId: self.id,
      })

      const unitSelf1 = gameDeckSelf.hand.find((unit) => unit.unit.name === unitName1)
      if (!unitSelf1) {
        throw Error(`Could not find unit "${unitName1}" in hand`)
      }

      await playUnit({
        gameId: game.id,
        unitId: unitSelf1.unit.id,
        combat: Combat.Close,
        userId: self.id,
      })
      gameDeckSelf.hand = gameDeckSelf.hand.filter((handUnit) => handUnit.unit.id !== unitSelf1.unit.id)

      await playPass({
        gameId: game.id,
        userId: opponent.id,
      })

      const unitSelf2 = gameDeckSelf.hand.find((unit) => unit.unit.name === unitName2)
      if (!unitSelf2) {
        throw Error(`Could not find unit "${unitName2}" in hand`)
      }

      await playUnit({
        gameId: game.id,
        userId: self.id,
        unitId: unitSelf2.unit.id,
      })

      await playPass({
        gameId: game.id,
        userId: self.id,
      })

      const unitSelf3 = gameDeckSelf.hand.find((unit) => unit.unit.name === unitName3)
      if (!unitSelf3) {
        throw Error(`Could not find unit "${unitName3}" in hand`)
      }

      await playUnit({
        gameId: game.id,
        userId: self.id,
        unitId: unitSelf3.unit.id,
      })

      await expect(
        graphql({
          schema,
          source: `mutation {
              playUnit(
                game: "${game.id}"
                unit: "${unitSelf1.unit.id}"
                combat: ${Combat.Close}
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
        errors: [new GraphQLError(`Invalid unit "${unitSelf1.unit.id}": Cannot revive special units.`)],
      })
    })
    it('throws error if attempting to revive unit from hand', async () => {
      const unitName1 = 'Ves'
      const unitName2 = medicUnitName
      const unitName3 = 'Siegfried of Denesle'
      await ensureUnitsInHand({
        gameId: game.id,
        userId: self.id,
        mongoConnectionString: funcEnv.MONGO_URL,
        mongoDatabaseName: funcEnv.MONGO_DB,
        unitNames: [unitName1, unitName2, unitName3],
      })

      const gameDeckSelf = await getGameDeck({
        gameId: game.id,
        userId: self.id,
      })

      const unitSelf1 = gameDeckSelf.hand.find((unit) => unit.unit.name === unitName1)
      if (!unitSelf1) {
        throw Error(`Could not find unit "${unitName1}" in hand`)
      }

      await playUnit({
        gameId: game.id,
        unitId: unitSelf1.unit.id,
        combat: Combat.Close,
        userId: self.id,
      })
      gameDeckSelf.hand = gameDeckSelf.hand.filter((handUnit) => handUnit.unit.id !== unitSelf1.unit.id)

      await playPass({
        gameId: game.id,
        userId: opponent.id,
      })

      await playPass({
        gameId: game.id,
        userId: self.id,
      })

      const unitSelf2 = gameDeckSelf.hand.find((unit) => unit.unit.name === unitName2)
      if (!unitSelf2) {
        throw Error(`Could not find unit "${unitName2}" in hand`)
      }

      await playUnit({
        gameId: game.id,
        userId: self.id,
        unitId: unitSelf2.unit.id,
      })

      const unitSelf3 = gameDeckSelf.hand.find((unit) => unit.unit.name === unitName3)
      if (!unitSelf3) {
        throw Error(`Could not find unit "${unitName3}" in hand`)
      }

      await expect(
        graphql({
          schema,
          source: `mutation {
            playUnit(
              game: "${game.id}"
              unit: "${unitSelf3.unit.id}"
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
        errors: [new GraphQLError(`Unit not in discard.`)],
      })
    })
    it('throws error if attempting to revive unit from undrawn', async () => {
      const unitName1 = 'Ves'
      const unitName2 = medicUnitName
      const unitName3 = 'Siegfried of Denesle'
      await ensureUnitsInHand({
        gameId: game.id,
        userId: self.id,
        mongoConnectionString: funcEnv.MONGO_URL,
        mongoDatabaseName: funcEnv.MONGO_DB,
        unitNames: [unitName1, unitName2],
        excludeNames: [unitName3],
      })

      const gameDeckSelf = await getGameDeck({
        gameId: game.id,
        userId: self.id,
      })

      const unitSelf1 = gameDeckSelf.hand.find((unit) => unit.unit.name === unitName1)
      if (!unitSelf1) {
        throw Error(`Could not find unit "${unitName1}" in hand`)
      }

      await playUnit({
        gameId: game.id,
        unitId: unitSelf1.unit.id,
        combat: Combat.Close,
        userId: self.id,
      })
      gameDeckSelf.hand = gameDeckSelf.hand.filter((handUnit) => handUnit.unit.id !== unitSelf1.unit.id)

      await playPass({
        gameId: game.id,
        userId: opponent.id,
      })

      await playPass({
        gameId: game.id,
        userId: self.id,
      })

      const unitSelf2 = gameDeckSelf.hand.find((unit) => unit.unit.name === unitName2)
      if (!unitSelf2) {
        throw Error(`Could not find unit "${unitName2}" in hand`)
      }

      await playUnit({
        gameId: game.id,
        userId: self.id,
        unitId: unitSelf2.unit.id,
      })

      const unitSelf3 = gameDeckSelf.undrawn.find((undrawn) => undrawn.unit.name === unitName3)
      if (!unitSelf3) {
        throw Error(`Could not find unit "${unitName3}" in undrawn`)
      }

      await expect(
        graphql({
          schema,
          source: `mutation {
            playUnit(
              game: "${game.id}"
              unit: "${unitSelf3.unit.id}"
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
        errors: [new GraphQLError(`Unit not in discard.`)],
      })
    })
  })
  describe('valid', () => {
    it('medic does not trigger revival if no eligible units', async () => {
      const unitName1 = medicUnitName
      await ensureUnitsInHand({
        gameId: game.id,
        userId: self.id,
        mongoConnectionString: funcEnv.MONGO_URL,
        mongoDatabaseName: funcEnv.MONGO_DB,
        unitNames: [unitName1],
      })

      const gameDeckSelf = await getGameDeck({
        gameId: game.id,
        userId: self.id,
      })
      const gameDeckOpponent = await getGameDeck({
        gameId: game.id,
        userId: opponent.id,
      })

      const unitSelf1 = gameDeckSelf.hand.find((unit) => unit.unit.name === unitName1)
      if (!unitSelf1) {
        throw Error(`Could not find unit "${unitName1}" in hand`)
      }
      gameDeckSelf.hand = gameDeckSelf.hand.filter((handUnit) => handUnit.unit.id !== unitSelf1.unit.id)
      const fieldUnitSelf1 = TestUtil.getFieldUnit({
        unit: unitSelf1.unit,
        artStyle: unitSelf1.artStyle,
        row: Combat.Siege,
      })

      const expectedOpponent = expectizeGamePlayer({
        user: opponent,
        gameDeck: gameDeckOpponent,
        ready: true,
        order: 1,
        rounds: [expectizePlayerRound({})],
      })

      await expect(
        graphql({
          schema,
          source: `mutation {
            playUnit(
              game: "${game.id}"
              unit: "${unitSelf1.unit.id}"
              combat: ${fieldUnitSelf1.row}
              target: "${unitSelf1.unit.id}"
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
                gameDeck: gameDeckSelf,
                order: 0,
                ready: true,
                rounds: [
                  expectizePlayerRound({
                    siege: {
                      score: 5,
                      units: [fieldUnitSelf1],
                    },
                    moves: [
                      expectizeMoveUnit({
                        unit: fieldUnitSelf1,
                        impacts: [],
                      }),
                    ],
                    score: 5,
                  }),
                ],
              }),
              expectedOpponent,
            ],
            status: GameStatus.Playing,
            round: 1,
            turn: expectedOpponent,
          }),
        },
      })
    })
    it('medic revives eligible unit', async () => {
      const unitName1 = 'Ves'
      const unitName2 = scorchUnitName
      const unitName3 = medicUnitName
      await ensureUnitsInHand({
        gameId: game.id,
        userId: self.id,
        mongoConnectionString: funcEnv.MONGO_URL,
        mongoDatabaseName: funcEnv.MONGO_DB,
        unitNames: [unitName1, unitName3],
      })
      await ensureUnitsInHand({
        gameId: game.id,
        userId: opponent.id,
        mongoConnectionString: funcEnv.MONGO_URL,
        mongoDatabaseName: funcEnv.MONGO_DB,
        unitNames: [unitName2],
      })

      const gameDeckSelf = await getGameDeck({
        gameId: game.id,
        userId: self.id,
      })
      const gameDeckOpponent = await getGameDeck({
        gameId: game.id,
        userId: opponent.id,
      })

      const unitSelf1 = gameDeckSelf.hand.find((unit) => unit.unit.name === unitName1)
      if (!unitSelf1) {
        throw Error(`Could not find unit "${unitName1}" in hand`)
      }
      await playUnit({
        gameId: game.id,
        userId: self.id,
        unitId: unitSelf1.unit.id,
      })
      gameDeckSelf.hand = gameDeckSelf.hand.filter((handUnit) => handUnit.unit.id !== unitSelf1.unit.id)
      const fieldUnitSelf1 = TestUtil.getFieldUnit({
        unit: unitSelf1.unit,
        artStyle: unitSelf1.artStyle,
        row: Combat.Close,
      })

      const unitOpponent1 = gameDeckOpponent.hand.find((unit) => unit.unit.name === unitName2)
      if (!unitOpponent1) {
        throw Error(`Could not find unit "${unitName2}" in opponents hand`)
      }
      await playUnit({
        gameId: game.id,
        userId: opponent.id,
        unitId: unitOpponent1.unit.id,
      })
      gameDeckOpponent.hand = gameDeckOpponent.hand.filter((handUnit) => handUnit.unit.id !== unitOpponent1.unit.id)
      gameDeckOpponent.discard = [unitOpponent1]

      const unitSelf2 = gameDeckSelf.hand.find((unit) => unit.unit.name === unitName3)
      if (!unitSelf2) {
        throw Error(`Could not find unit "${unitName3}" in hand`)
      }
      await playUnit({
        gameId: game.id,
        userId: self.id,
        unitId: unitSelf2.unit.id,
      })
      gameDeckSelf.hand = gameDeckSelf.hand.filter((handUnit) => handUnit.unit.id !== unitSelf2.unit.id)
      const fieldUnitSelf2 = TestUtil.getFieldUnit({
        unit: unitSelf2.unit,
        artStyle: unitSelf2.artStyle,
        row: Combat.Siege,
      })

      const expectedOpponent = expectizeGamePlayer({
        user: opponent,
        gameDeck: gameDeckOpponent,
        ready: true,
        order: 1,
        rounds: [
          expectizePlayerRound({
            moves: [
              expectizeMoveUnit({
                unit: unitOpponent1,
                impacts: [
                  TestUtil.getImpact({
                    unit: fieldUnitSelf1,
                    user: self,
                  }),
                ],
              }),
            ],
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
              combat: ${fieldUnitSelf1.row}
              target: "${unitSelf1.unit.id}"
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
                gameDeck: gameDeckSelf,
                order: 0,
                ready: true,
                rounds: [
                  expectizePlayerRound({
                    close: {
                      score: 5,
                      units: [fieldUnitSelf1],
                    },
                    siege: {
                      score: 5,
                      units: [fieldUnitSelf2],
                    },
                    moves: [
                      expectizeMoveUnit({
                        unit: fieldUnitSelf1,
                      }),
                      expectizeMoveUnit({
                        unit: fieldUnitSelf2,
                        impacts: [
                          TestUtil.getImpact({
                            unit: {
                              ...fieldUnitSelf1,
                              effectiveStrength: null,
                            },
                            user: self,
                            source: {
                              origin: GameUnitOrigin.Discard,
                              user: null,
                            },
                          }),
                        ],
                      }),
                      expectizeMoveUnit({
                        unit: fieldUnitSelf1,
                        reason: {
                          type: MoveReasonType.Revive,
                          unit: fieldUnitSelf2,
                        },
                      }),
                    ],
                    score: 10,
                  }),
                ],
              }),
              expectedOpponent,
            ],
            status: GameStatus.Playing,
            round: 1,
            turn: expectedOpponent,
          }),
        },
      })
    })
    it('medics can be chained', async () => {
      const unitName1 = medicUnitName
      const unitName2 = scorchUnitName
      const unitName3 = 'Ves'
      const unitName4 = 'Yennefer of Vengerberg'
      await ensureUnitsInHand({
        gameId: game.id,
        userId: self.id,
        mongoConnectionString: funcEnv.MONGO_URL,
        mongoDatabaseName: funcEnv.MONGO_DB,
        unitNames: [unitName3, unitName1, unitName4],
      })
      await ensureUnitsInHand({
        gameId: game.id,
        userId: opponent.id,
        mongoConnectionString: funcEnv.MONGO_URL,
        mongoDatabaseName: funcEnv.MONGO_DB,
        unitNames: [unitName2, unitName2],
      })

      const gameDeckSelf = await getGameDeck({
        gameId: game.id,
        userId: self.id,
      })
      const gameDeckOpponent = await getGameDeck({
        gameId: game.id,
        userId: opponent.id,
      })

      const unitSelf1 = gameDeckSelf.hand.find((unit) => unit.unit.name === unitName1)
      if (!unitSelf1) {
        throw Error(`Could not find unit "${unitName1}" in hand`)
      }
      await playUnit({
        gameId: game.id,
        userId: self.id,
        unitId: unitSelf1.unit.id,
      })
      gameDeckSelf.hand = gameDeckSelf.hand.filter((handUnit) => handUnit.unit.id !== unitSelf1.unit.id)
      const fieldUnitSelf1 = TestUtil.getFieldUnit({
        unit: unitSelf1.unit,
        artStyle: unitSelf1.artStyle,
        row: Combat.Siege,
      })

      const unitOpponent1 = gameDeckOpponent.hand.find((unit) => unit.unit.name === unitName2)
      if (!unitOpponent1) {
        throw Error(`Could not find unit "${unitName2}" in opponents hand`)
      }
      await playUnit({
        gameId: game.id,
        userId: opponent.id,
        unitId: unitOpponent1.unit.id,
      })
      gameDeckOpponent.hand = gameDeckOpponent.hand.filter((handUnit) => handUnit.unit.id !== unitOpponent1.unit.id)
      gameDeckOpponent.discard = [unitOpponent1]

      const unitSelf2 = gameDeckSelf.hand.find((unit) => unit.unit.name === unitName3)
      if (!unitSelf2) {
        throw Error(`Could not find unit "${unitName3}" in hand`)
      }
      await playUnit({
        gameId: game.id,
        userId: self.id,
        unitId: unitSelf2.unit.id,
      })
      gameDeckSelf.hand = gameDeckSelf.hand.filter((handUnit) => handUnit.unit.id !== unitSelf2.unit.id)
      const fieldUnitSelf2 = TestUtil.getFieldUnit({
        unit: unitSelf2.unit,
        artStyle: unitSelf2.artStyle,
        row: Combat.Close,
      })

      const unitOpponent2 = gameDeckOpponent.hand.find((unit) => unit.unit.name === unitName2)
      if (!unitOpponent2) {
        throw Error(`Could not find 2nd unit "${unitName2}" in opponents hand`)
      }
      await playUnit({
        gameId: game.id,
        userId: opponent.id,
        unitId: unitOpponent2.unit.id,
      })
      gameDeckOpponent.hand = gameDeckOpponent.hand.filter((handUnit) => handUnit.unit.id !== unitOpponent2.unit.id)
      gameDeckOpponent.discard.push(unitOpponent2)

      const unitSelf3 = gameDeckSelf.hand.find((unit) => unit.unit.name === unitName4)
      if (!unitSelf3) {
        throw Error(`Could not find unit "${unitName4}" in hand`)
      }
      await playUnit({
        gameId: game.id,
        userId: self.id,
        unitId: unitSelf3.unit.id,
      })
      gameDeckSelf.hand = gameDeckSelf.hand.filter((handUnit) => handUnit.unit.id !== unitSelf3.unit.id)
      const fieldUnitSelf3 = TestUtil.getFieldUnit({
        unit: unitSelf3.unit,
        artStyle: unitSelf3.artStyle,
        row: Combat.Ranged,
      })

      await playUnit({
        gameId: game.id,
        userId: self.id,
        unitId: unitSelf1.unit.id,
      })

      const expectedOpponent = expectizeGamePlayer({
        user: opponent,
        gameDeck: gameDeckOpponent,
        ready: true,
        order: 1,
        rounds: [
          expectizePlayerRound({
            moves: [
              expectizeMoveUnit({
                unit: unitOpponent1,
                impacts: [
                  TestUtil.getImpact({
                    unit: fieldUnitSelf1,
                    user: self,
                  }),
                ],
              }),
              expectizeMoveUnit({
                unit: unitOpponent2,
                impacts: [
                  TestUtil.getImpact({
                    unit: fieldUnitSelf2,
                    user: self,
                  }),
                ],
              }),
            ],
          }),
        ],
      })

      await expect(
        graphql({
          schema,
          source: `mutation {
            playUnit(
              game: "${game.id}"
              unit: "${unitSelf2.unit.id}"
              combat: ${fieldUnitSelf2.row}
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
                gameDeck: gameDeckSelf,
                order: 0,
                ready: true,
                rounds: [
                  expectizePlayerRound({
                    close: {
                      score: 5,
                      units: [fieldUnitSelf2],
                    },
                    ranged: {
                      score: 7,
                      units: [fieldUnitSelf3],
                    },
                    siege: {
                      score: 5,
                      units: [fieldUnitSelf1],
                    },
                    moves: [
                      expectizeMoveUnit({
                        unit: fieldUnitSelf1,
                        impacts: [],
                      }),
                      expectizeMoveUnit({
                        unit: fieldUnitSelf2,
                      }),
                      expectizeMoveUnit({
                        unit: fieldUnitSelf3,
                        impacts: [
                          TestUtil.getImpact({
                            unit: {
                              ...fieldUnitSelf1,
                              effectiveStrength: null,
                            },
                            user: self,
                            source: {
                              origin: GameUnitOrigin.Discard,
                              user: null,
                            },
                          }),
                        ],
                      }),
                      expectizeMoveUnit({
                        unit: fieldUnitSelf1,
                        impacts: [
                          TestUtil.getImpact({
                            unit: {
                              ...fieldUnitSelf2,
                              effectiveStrength: null,
                            },
                            user: self,
                            source: {
                              origin: GameUnitOrigin.Discard,
                              user: null,
                            },
                          }),
                        ],
                        reason: {
                          type: MoveReasonType.Revive,
                          unit: fieldUnitSelf3,
                        },
                      }),
                      expectizeMoveUnit({
                        unit: fieldUnitSelf2,
                        reason: {
                          type: MoveReasonType.Revive,
                          unit: fieldUnitSelf1,
                        },
                      }),
                    ],
                    score: 17,
                  }),
                ],
              }),
              expectedOpponent,
            ],
            status: GameStatus.Playing,
            round: 1,
            turn: expectedOpponent,
          }),
        },
      })
    })
  })
})
