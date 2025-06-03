import { graphql } from 'graphql'

import {
  addDeck,
  addGame,
  addUser,
  getGame,
  getGameDeck,
  getStrengthUnits,
  ready,
  setDeck,
  setOrder,
} from './util/graphql-util'
import {
  Combat,
  Deck,
  FactionKey,
  Game,
  GamePlayer,
  GameStatus,
  MoveUnit,
  User,
} from '@gwent/graphql-schema/resolver-typings'
import { ensureUnitsInHand } from '@gwent/test-utils'
import { expectizeGame, expectizeGamePlayer, expectizePlayerRound } from './util/expect-util'
import funcEnv from './util/func-env'
import { getGameFragment } from './util/fragment-util'
import schema from '../../src/graphql/executable-schema'
import TestUtil from '../util/test-util'

describe('effect-scorch', () => {
  it('scorch unit played by itself does not effect battlefield', async () => {
    const { game, opponent, self } = await setupGame({})
    const unitName1 = 'Scorch'
    await ensureUnitsInHand({
      gameId: game.id,
      userId: self.id,
      mongoConnectionString: funcEnv.MONGO_URL,
      mongoDatabaseName: funcEnv.MONGO_DB,
      unitNames: [unitName1],
    })

    const gameDeck = await getGameDeck({
      gameId: game.id,
      userId: self.id,
    })

    const unitSelf1 = gameDeck.hand.find((unit) => unit.unit.name === unitName1)
    if (!unitSelf1) {
      throw Error(`Could not find unit "${unitName1}" in hand`)
    }

    gameDeck.hand = gameDeck.hand.filter((handUnit) => handUnit.unit.id !== unitSelf1.unit.id)
    gameDeck.discard = [unitSelf1]
    const opponentGamePlayer = game.players.find((player) => player.user.id === opponent.id) as GamePlayer
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
                    {
                      created: expect.any(Date),
                      row: null,
                      unit: unitSelf1,
                    } as MoveUnit,
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
  it('scorch unit removes opponents unit from battlefield', async () => {
    const { game, opponent, self } = await setupGame({
      opponentFirst: true,
    })
    const unitName1 = 'Siegfried of Denesle'
    const unitName2 = 'Scorch'
    await ensureUnitsInHand({
      gameId: game.id,
      userId: self.id,
      mongoConnectionString: funcEnv.MONGO_URL,
      mongoDatabaseName: funcEnv.MONGO_DB,
      unitNames: [unitName2],
    })
    await ensureUnitsInHand({
      gameId: game.id,
      userId: opponent.id,
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

    const unitSelf1 = gameDeckSelf.hand.find((unit) => unit.unit.name === unitName2)
    if (!unitSelf1) {
      throw Error(`Could not find self unit "${unitName1}" in hand`)
    }
    const unitOpponent1 = gameDeckOpponent.hand.find((unit) => unit.unit.name === unitName1)
    if (!unitOpponent1) {
      throw Error(`Could not find opponent unit "${unitName2}" in hand`)
    }

    gameDeckOpponent.hand = gameDeckOpponent.hand.filter((handUnit) => handUnit.unit.id !== unitOpponent1.unit.id)
    const selfGamePlayer = game.players.find((player) => player.user.id === self.id) as GamePlayer
    await expect(
      graphql({
        schema,
        source: `mutation {
          playUnit(
            game: "${game.id}"
            unit: "${unitOpponent1.unit.id}"
          ) {
            ${getGameFragment()}
          }
        }`,
        contextValue: {
          session: {
            user: TestUtil.getDbUserFromUser(opponent),
          },
        },
      })
    ).resolves.toEqual({
      data: {
        playUnit: expectizeGame({
          creator: game.creator,
          players: [
            selfGamePlayer,
            expectizeGamePlayer({
              user: opponent,
              gameDeck: gameDeckOpponent,
              order: 0,
              ready: true,
              rounds: [
                expectizePlayerRound({
                  close: {
                    score: 5,
                    units: [
                      TestUtil.getGameUnit({
                        unit: unitOpponent1.unit,
                      }),
                    ],
                  },
                  moves: [
                    {
                      created: expect.any(Date),
                      row: Combat.Close,
                      unit: unitOpponent1,
                    } as MoveUnit,
                  ],
                  ranged: TestUtil.getPlayerCombatRow({}),
                  siege: TestUtil.getPlayerCombatRow({}),
                  score: 5,
                }),
              ],
            }),
          ],
          status: GameStatus.Playing,
          round: 1,
          turn: selfGamePlayer,
        }),
      },
    })

    gameDeckSelf.hand = gameDeckSelf.hand.filter((handUnit) => handUnit.unit.id !== unitSelf1.unit.id)
    gameDeckSelf.discard = [unitSelf1]
    gameDeckOpponent.discard = [unitOpponent1]
    const opponentGamePlayer = expectizeGamePlayer({
      user: opponent,
      gameDeck: gameDeckOpponent,
      order: 0,
      ready: true,
      rounds: [
        expectizePlayerRound({
          close: TestUtil.getPlayerCombatRow({}),
          moves: [
            {
              created: expect.any(Date),
              row: Combat.Close,
              unit: unitOpponent1,
            } as MoveUnit,
          ],
          ranged: TestUtil.getPlayerCombatRow({}),
          siege: TestUtil.getPlayerCombatRow({}),
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
              gameDeck: gameDeckSelf,
              order: 1,
              ready: true,
              rounds: [
                expectizePlayerRound({
                  close: TestUtil.getPlayerCombatRow({}),
                  moves: [
                    {
                      created: expect.any(Date),
                      row: null,
                      unit: unitSelf1,
                    } as MoveUnit,
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
  it('scorch does not effect hero unit', async () => {
    const { game, opponent, self } = await setupGame({
      opponentFirst: true,
    })
    const unitName1 = 'Vernon Roche'
    const unitName2 = 'Scorch'
    await ensureUnitsInHand({
      gameId: game.id,
      userId: self.id,
      mongoConnectionString: funcEnv.MONGO_URL,
      mongoDatabaseName: funcEnv.MONGO_DB,
      unitNames: [unitName2],
    })
    await ensureUnitsInHand({
      gameId: game.id,
      userId: opponent.id,
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

    const unitSelf1 = gameDeckSelf.hand.find((unit) => unit.unit.name === unitName2)
    if (!unitSelf1) {
      throw Error(`Could not find self unit "${unitName1}" in hand`)
    }
    const unitOpponent1 = gameDeckOpponent.hand.find((unit) => unit.unit.name === unitName1)
    if (!unitOpponent1) {
      throw Error(`Could not find opponent unit "${unitName2}" in hand`)
    }

    gameDeckOpponent.hand = gameDeckOpponent.hand.filter((handUnit) => handUnit.unit.id !== unitOpponent1.unit.id)
    const selfGamePlayer = game.players.find((player) => player.user.id === self.id) as GamePlayer
    const opponentGamePlayer = expectizeGamePlayer({
      user: opponent,
      gameDeck: gameDeckOpponent,
      order: 0,
      ready: true,
      rounds: [
        expectizePlayerRound({
          close: {
            score: 10,
            units: [
              TestUtil.getGameUnit({
                unit: unitOpponent1.unit,
              }),
            ],
          },
          moves: [
            {
              created: expect.any(Date),
              row: Combat.Close,
              unit: unitOpponent1,
            } as MoveUnit,
          ],
          ranged: TestUtil.getPlayerCombatRow({}),
          siege: TestUtil.getPlayerCombatRow({}),
          score: 10,
        }),
      ],
    })
    await expect(
      graphql({
        schema,
        source: `mutation {
          playUnit(
            game: "${game.id}"
            unit: "${unitOpponent1.unit.id}"
          ) {
            ${getGameFragment()}
          }
        }`,
        contextValue: {
          session: {
            user: TestUtil.getDbUserFromUser(opponent),
          },
        },
      })
    ).resolves.toEqual({
      data: {
        playUnit: expectizeGame({
          creator: game.creator,
          players: [selfGamePlayer, opponentGamePlayer],
          status: GameStatus.Playing,
          round: 1,
          turn: selfGamePlayer,
        }),
      },
    })

    gameDeckSelf.hand = gameDeckSelf.hand.filter((handUnit) => handUnit.unit.id !== unitSelf1.unit.id)
    gameDeckSelf.discard = [unitSelf1]
    gameDeckOpponent.discard = [unitOpponent1]
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
              gameDeck: gameDeckSelf,
              order: 1,
              ready: true,
              rounds: [
                expectizePlayerRound({
                  close: TestUtil.getPlayerCombatRow({}),
                  moves: [
                    {
                      created: expect.any(Date),
                      row: null,
                      unit: unitSelf1,
                    } as MoveUnit,
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

async function setupGame({ opponentFirst }: { opponentFirst?: boolean }): Promise<{
  self: User
  opponent: User
  game: Game
  deckSelf: Deck
  deckOpponent: Deck
}> {
  const scenario = 'effect-scorch'
  const self = await addUser(`self-${scenario}-${Date.now()}`)
  const opponent = await addUser(`opponent-${scenario}-${Date.now()}`)
  const game = await addGame({
    creator: self,
    opponentNames: [opponent.name],
  })
  const deckSelf = await addDeck({
    faction: FactionKey.ScoiaTael,
    name: `deck-self-${scenario}-${Date.now()}`,
    userId: self.id,
    unitIds: (
      await getStrengthUnits({ faction: FactionKey.ScoiaTael, unitNames: ['Scorch'] })
    ).map((deckUnit) => deckUnit.unit.id),
  })
  const deckOpponent = await addDeck({
    faction: FactionKey.NorthernRealms,
    name: `deck-opponent-${scenario}-${Date.now()}`,
    userId: opponent.id,
    unitIds: (
      await getStrengthUnits({ faction: FactionKey.NorthernRealms, unitNames: ['Scorch'] })
    ).map((deckUnit) => deckUnit.unit.id),
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
    userId: self.id,
    users: [opponentFirst ? opponent.id : self.id, opponentFirst ? self.id : opponent.id],
  })
  await ready({
    gameId: game.id,
    userId: self.id,
  })
  await ready({
    gameId: game.id,
    userId: opponent.id,
  })

  return {
    deckOpponent,
    deckSelf,
    opponent,
    self,
    game: await getGame({
      gameId: game.id,
      userId: self.id,
    }),
  }
}
