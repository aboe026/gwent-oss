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
import { Combat, Deck, EffectKey, FactionKey, Game, GameStatus, User } from '@gwent/graphql-schema/resolver-typings'
import { ensureUnitsInHand } from '@gwent/test-utils'
import {
  expectizeGame,
  expectizeGamePlayer,
  expectizeMovePass,
  expectizeMoveUnit,
  expectizePlayerRound,
} from './util/expect-util'
import funcEnv from './util/func-env'
import { getGameFragment } from './util/fragment-util'
import schema from '../../src/graphql/executable-schema'
import TestUtil from '../util/test-util'

describe('effect-decoy', () => {
  let self: User
  let opponent: User
  let game: Game
  let deckSelf: Deck
  let deckOpponent: Deck
  const decoyUnitName = 'Decoy'
  const scorchUnitName = 'Scorch'
  const hornUnitName = "Commander's Horn"
  beforeEach(async () => {
    self = await addUser(`effect-decoy-self-${Date.now()}`)
    opponent = await addUser(`effect-decoy-opponent-${Date.now()}`)
    game = await addGame({
      creator: self,
      opponentNames: [opponent.name],
    })
    deckSelf = await addDeck({
      faction: FactionKey.NorthernRealms,
      name: `effect-decoy-deck-self-${Date.now()}`,
      userId: self.id,
      unitNames: [decoyUnitName, hornUnitName],
    })
    deckOpponent = await addDeck({
      faction: FactionKey.ScoiaTael,
      name: `effect-decoy-deck-opponent-${Date.now()}`,
      userId: opponent.id,
      unitNames: [scorchUnitName],
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
    it('throws error if no target', async () => {
      const unitName1 = 'Ves'
      const unitName2 = decoyUnitName
      await ensureUnitsInHand({
        gameId: game.id,
        userId: self.id,
        mongoConnectionString: funcEnv.MONGO_URL,
        mongoDatabaseName: funcEnv.MONGO_DB,
        unitNames: [unitName1, unitName2],
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

      await expect(
        graphql({
          schema,
          source: `mutation {
              playUnit(
                game: "${game.id}"
                unit: "${unitSelf2.unit.id}"
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
        errors: [new GraphQLError(`Argument "target" required for units with "${EffectKey.Decoy}" effect.`)],
      })
    })
    it('throws error if target invalid ObjectID', async () => {
      const unitName1 = 'Ves'
      const unitName2 = decoyUnitName
      await ensureUnitsInHand({
        gameId: game.id,
        userId: self.id,
        mongoConnectionString: funcEnv.MONGO_URL,
        mongoDatabaseName: funcEnv.MONGO_DB,
        unitNames: [unitName1, unitName2],
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

      await expect(
        graphql({
          schema,
          source: `mutation {
              playUnit(
                game: "${game.id}"
                unit: "${unitSelf2.unit.id}"
                combat: ${Combat.Close}
                target: "invalid"
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
        errors: [new GraphQLError('Target ID "invalid" not a valid MongoDB ObjectId.')],
      })
    })
    it('throws error if target in hand instead of on battlefield', async () => {
      const unitName1 = 'Ves'
      const unitName2 = decoyUnitName
      await ensureUnitsInHand({
        gameId: game.id,
        userId: self.id,
        mongoConnectionString: funcEnv.MONGO_URL,
        mongoDatabaseName: funcEnv.MONGO_DB,
        unitNames: [unitName1, unitName2],
      })

      const gameDeckSelf = await getGameDeck({
        gameId: game.id,
        userId: self.id,
      })

      const unitSelf1 = gameDeckSelf.hand.find((unit) => unit.unit.name === unitName1)
      if (!unitSelf1) {
        throw Error(`Could not find unit "${unitName1}" in hand`)
      }

      const unitSelf2 = gameDeckSelf.hand.find((unit) => unit.unit.name === unitName2)
      if (!unitSelf2) {
        throw Error(`Could not find unit "${unitName2}" in hand`)
      }

      await expect(
        graphql({
          schema,
          source: `mutation {
              playUnit(
                game: "${game.id}"
                unit: "${unitSelf2.unit.id}"
                combat: ${Combat.Close}
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
        data: null,
        errors: [
          new GraphQLError(`Target "${unitSelf1.unit.id}" does not exist on the battlefield for player "${self.id}".`),
        ],
      })
    })
    it('throws error if target in discard instead of on battlefield', async () => {
      const unitName1 = 'Ves'
      const unitName2 = scorchUnitName
      const unitName3 = decoyUnitName
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
        unitId: unitSelf1.unit.id,
        combat: Combat.Close,
        userId: self.id,
      })
      gameDeckSelf.hand = gameDeckSelf.hand.filter((handUnit) => handUnit.unit.id !== unitSelf1.unit.id)

      const unitOpponent1 = gameDeckOpponent.hand.find((unit) => unit.unit.name === unitName2)
      if (!unitOpponent1) {
        throw Error(`Could not find unit "${unitName2}" in hand`)
      }

      await playUnit({
        gameId: game.id,
        unitId: unitOpponent1.unit.id,
        combat: Combat.Close,
        userId: opponent.id,
      })
      gameDeckOpponent.hand = gameDeckOpponent.hand.filter((handUnit) => handUnit.unit.id !== unitOpponent1.unit.id)

      const unitSelf2 = gameDeckSelf.hand.find((unit) => unit.unit.name === unitName3)
      if (!unitSelf2) {
        throw Error(`Could not find unit "${unitName3}" in hand`)
      }

      await expect(
        graphql({
          schema,
          source: `mutation {
              playUnit(
                game: "${game.id}"
                unit: "${unitSelf2.unit.id}"
                combat: ${Combat.Close}
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
        data: null,
        errors: [
          new GraphQLError(`Target "${unitSelf1.unit.id}" does not exist on the battlefield for player "${self.id}".`),
        ],
      })
    })
    it('throws error if target in undrawn instead of on battlefield', async () => {
      const unitName1 = 'Ves'
      const unitName2 = decoyUnitName
      await ensureUnitsInHand({
        gameId: game.id,
        userId: self.id,
        mongoConnectionString: funcEnv.MONGO_URL,
        mongoDatabaseName: funcEnv.MONGO_DB,
        unitNames: [unitName2],
        excludeNames: [unitName1],
      })

      const gameDeckSelf = await getGameDeck({
        gameId: game.id,
        userId: self.id,
      })

      const unitSelf1 = gameDeckSelf.undrawn.find((unit) => unit.unit.name === unitName1)
      if (!unitSelf1) {
        throw Error(`Could not find unit "${unitName1}" in undrawn`)
      }

      const unitSelf2 = gameDeckSelf.hand.find((unit) => unit.unit.name === unitName2)
      if (!unitSelf2) {
        throw Error(`Could not find unit "${unitName2}" in hand`)
      }

      await expect(
        graphql({
          schema,
          source: `mutation {
            playUnit(
              game: "${game.id}"
              unit: "${unitSelf2.unit.id}"
              combat: ${Combat.Close}
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
        data: null,
        errors: [
          new GraphQLError(`Target "${unitSelf1.unit.id}" does not exist on the battlefield for player "${self.id}".`),
        ],
      })
    })
    it('throws error if target is hero', async () => {
      const unitName1 = 'John Natalis'
      const unitName2 = decoyUnitName
      await ensureUnitsInHand({
        gameId: game.id,
        userId: self.id,
        mongoConnectionString: funcEnv.MONGO_URL,
        mongoDatabaseName: funcEnv.MONGO_DB,
        unitNames: [unitName1, unitName2],
      })

      const gameDeckSelf = await getGameDeck({
        gameId: game.id,
        userId: self.id,
      })

      const unitSelf1 = gameDeckSelf.hand.find((unit) => unit.unit.name === unitName1)
      if (!unitSelf1) {
        throw Error(`Could not find unit "${unitName1}" in hand`)
      }
      const combatUnit1 = Combat.Close

      await playUnit({
        gameId: game.id,
        unitId: unitSelf1.unit.id,
        combat: combatUnit1,
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

      await expect(
        graphql({
          schema,
          source: `mutation {
              playUnit(
                game: "${game.id}"
                unit: "${unitSelf2.unit.id}"
                combat: ${Combat.Close}
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
        data: null,
        errors: [new GraphQLError(`Invalid decoy target "${unitSelf1.unit.id}": Cannot be hero.`)],
      })
    })
    it('throws error if target is special', async () => {
      const unitName1 = hornUnitName
      const unitName2 = decoyUnitName
      await ensureUnitsInHand({
        gameId: game.id,
        userId: self.id,
        mongoConnectionString: funcEnv.MONGO_URL,
        mongoDatabaseName: funcEnv.MONGO_DB,
        unitNames: [unitName1, unitName2],
      })

      const gameDeckSelf = await getGameDeck({
        gameId: game.id,
        userId: self.id,
      })

      const unitSelf1 = gameDeckSelf.hand.find((unit) => unit.unit.name === unitName1)
      if (!unitSelf1) {
        throw Error(`Could not find unit "${unitName1}" in hand`)
      }
      const combatUnit1 = Combat.Close

      await playUnit({
        gameId: game.id,
        unitId: unitSelf1.unit.id,
        combat: combatUnit1,
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

      await expect(
        graphql({
          schema,
          source: `mutation {
              playUnit(
                game: "${game.id}"
                unit: "${unitSelf2.unit.id}"
                combat: ${Combat.Close}
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
        data: null,
        errors: [new GraphQLError(`Invalid decoy target "${unitSelf1.unit.id}": Cannot be special.`)],
      })
    })
    it('throws error if specified combat does not match target combat', async () => {
      const unitName1 = 'Ves'
      const unitName2 = decoyUnitName
      await ensureUnitsInHand({
        gameId: game.id,
        userId: self.id,
        mongoConnectionString: funcEnv.MONGO_URL,
        mongoDatabaseName: funcEnv.MONGO_DB,
        unitNames: [unitName1, unitName2],
      })

      const gameDeckSelf = await getGameDeck({
        gameId: game.id,
        userId: self.id,
      })

      const unitSelf1 = gameDeckSelf.hand.find((unit) => unit.unit.name === unitName1)
      if (!unitSelf1) {
        throw Error(`Could not find unit "${unitName1}" in hand`)
      }
      const combatUnit1 = Combat.Close

      await playUnit({
        gameId: game.id,
        unitId: unitSelf1.unit.id,
        combat: combatUnit1,
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
      const effectDecoy = unitSelf2.unit.effects?.find((effect) => effect.key === EffectKey.Decoy)
      if (!effectDecoy) {
        throw Error(`Could not find "${EffectKey.Decoy}" effect on "${unitName2}" unit`)
      }

      await expect(
        graphql({
          schema,
          source: `mutation {
              playUnit(
                game: "${game.id}"
                unit: "${unitSelf2.unit.id}"
                combat: ${Combat.Ranged}
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
        data: null,
        errors: [
          new GraphQLError(
            `Invalid combat "${Combat.Ranged}": Target "${unitSelf1.unit.id}" is in row "${Combat.Close}".`
          ),
        ],
      })
    })
  })
  describe('valid', () => {
    it('decoy unit replaces target in the battlefield with specifying combat', async () => {
      const unitName1 = 'Ves'
      const unitName2 = decoyUnitName
      await ensureUnitsInHand({
        gameId: game.id,
        userId: self.id,
        mongoConnectionString: funcEnv.MONGO_URL,
        mongoDatabaseName: funcEnv.MONGO_DB,
        unitNames: [unitName1, unitName2],
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
      const fieldUnitSelf1 = TestUtil.getFieldUnit({
        unit: unitSelf1.unit,
        artStyle: unitSelf1.artStyle,
        row: Combat.Close,
      })

      await playUnit({
        gameId: game.id,
        unitId: unitSelf1.unit.id,
        combat: fieldUnitSelf1.row,
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
      const effectDecoy = unitSelf2.unit.effects?.find((effect) => effect.key === EffectKey.Decoy)
      if (!effectDecoy) {
        throw Error(`Could not find "${EffectKey.Decoy}" effect on "${unitName2}" unit`)
      }
      const fieldUnitSelf2 = TestUtil.getFieldUnit({
        unit: unitSelf2.unit,
        artStyle: unitSelf2.artStyle,
        row: Combat.Close,
      })

      gameDeckSelf.hand = gameDeckSelf.hand.filter((handUnit) => handUnit.unit.id !== unitSelf2.unit.id)
      gameDeckSelf.hand.push(unitSelf1)
      const expectedGamePlayer = expectizeGamePlayer({
        user: self,
        gameDeck: gameDeckSelf,
        order: 0,
        ready: true,
        rounds: [
          expectizePlayerRound({
            close: {
              score: 0,
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
                    unit: fieldUnitSelf1,
                    user: self,
                  }),
                ],
              }),
            ],
            score: 0,
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
              expectedGamePlayer,
              expectizeGamePlayer({
                user: opponent,
                gameDeck: gameDeckOpponent,
                ready: true,
                order: 1,
                rounds: [
                  expectizePlayerRound({
                    passed: true,
                    moves: [expectizeMovePass()],
                  }),
                ],
              }),
            ],
            status: GameStatus.Playing,
            round: 1,
            turn: expectedGamePlayer,
          }),
        },
      })
    })
    it('decoy unit replaces target in the battlefield without specifying combat', async () => {
      const unitName1 = 'Ves'
      const unitName2 = decoyUnitName
      await ensureUnitsInHand({
        gameId: game.id,
        userId: self.id,
        mongoConnectionString: funcEnv.MONGO_URL,
        mongoDatabaseName: funcEnv.MONGO_DB,
        unitNames: [unitName1, unitName2],
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
      const fieldUnitSelf1 = TestUtil.getFieldUnit({
        unit: unitSelf1.unit,
        artStyle: unitSelf1.artStyle,
        row: Combat.Close,
      })

      await playUnit({
        gameId: game.id,
        unitId: unitSelf1.unit.id,
        combat: fieldUnitSelf1.row,
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
      const effectDecoy = unitSelf2.unit.effects?.find((effect) => effect.key === EffectKey.Decoy)
      if (!effectDecoy) {
        throw Error(`Could not find "${EffectKey.Decoy}" effect on "${unitName2}" unit`)
      }
      const fieldUnitSelf2 = TestUtil.getFieldUnit({
        unit: unitSelf2.unit,
        artStyle: unitSelf2.artStyle,
        row: Combat.Close,
      })

      gameDeckSelf.hand = gameDeckSelf.hand.filter((handUnit) => handUnit.unit.id !== unitSelf2.unit.id)
      gameDeckSelf.hand.push(unitSelf1)
      const expectedGamePlayer = expectizeGamePlayer({
        user: self,
        gameDeck: gameDeckSelf,
        order: 0,
        ready: true,
        rounds: [
          expectizePlayerRound({
            close: {
              score: 0,
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
                    unit: fieldUnitSelf1,
                    user: self,
                  }),
                ],
              }),
            ],
            score: 0,
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
              expectedGamePlayer,
              expectizeGamePlayer({
                user: opponent,
                gameDeck: gameDeckOpponent,
                ready: true,
                order: 1,
                rounds: [
                  expectizePlayerRound({
                    passed: true,
                    moves: [expectizeMovePass()],
                  }),
                ],
              }),
            ],
            status: GameStatus.Playing,
            round: 1,
            turn: expectedGamePlayer,
          }),
        },
      })
    })
  })
})
