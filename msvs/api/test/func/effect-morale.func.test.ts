import { graphql } from 'graphql'

import {
  addDeck,
  addGame,
  addUser,
  getGame,
  getGameDeck,
  playUnit,
  ready,
  setDeck,
  setOrder,
} from './util/graphql-util'
import {
  Combat,
  Deck,
  EffectKey,
  FactionKey,
  Game,
  GamePlayer,
  GameStatus,
  MoveUnit,
  PlayerCombatRow,
  User,
} from '@gwent/graphql-schema/resolver-typings'
import { ensureUnitsInHand } from '@gwent/test-utils'
import { expectizeGame, expectizeGamePlayer, expectizePlayerRound } from './util/expect-util'
import funcEnv from './util/func-env'
import { getGameFragment } from './util/fragment-util'
import schema from '../../src/graphql/executable-schema'
import TestUtil from '../util/test-util'

describe('effect-morale', () => {
  let self: User
  let opponent: User
  let game: Game
  let deckSelf: Deck
  let deckOpponent: Deck
  beforeEach(async () => {
    self = await addUser(`effect-morale-self-${Date.now()}`)
    opponent = await addUser(`effect-morale-opponent-${Date.now()}`)
    game = await addGame({
      creator: self,
      opponentNames: [opponent.name],
    })
    deckSelf = await addDeck({
      faction: FactionKey.ScoiaTael,
      name: `effect-morale-deck-self-${Date.now()}`,
      userId: self.id,
    })
    deckOpponent = await addDeck({
      faction: FactionKey.NorthernRealms,
      name: `effect-morale-deck-opponent-${Date.now()}`,
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
    await setOrder({
      gameId: game.id,
      userId: self.id,
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
  it('morale unit played by itself does not effect itself', async () => {
    const unitName1 = 'Milva'
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
                      unit: unitSelf1,
                    } as MoveUnit,
                  ],
                  ranged: {
                    score: unitSelf1.unit.strength || 0,
                    units: [
                      TestUtil.getGameUnit({
                        unit: unitSelf1.unit,
                      }),
                    ],
                  },
                  siege: TestUtil.getPlayerCombatRow({}),
                  score: unitSelf1.unit.strength || 0,
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
  it('morale unit played before normal unit increases normal unit effective strength by 1 after normal unit played', async () => {
    const unitName1 = 'Milva'
    const unitName2 = 'Toruviel'
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
    const combatUnit1 = unitSelf1.unit.combats ? unitSelf1.unit.combats[0] : Combat.Close
    const effectMorale = unitSelf1.unit.effects?.find((effect) => effect.key === EffectKey.Morale)
    if (!effectMorale) {
      throw Error(`Could not find "${EffectKey.Morale}" effect on "${unitName1}" unit`)
    }
    await playUnit({
      gameId: game.id,
      unitId: unitSelf1.unit.id,
      combat: combatUnit1,
      userId: self.id,
    })
    gameDeckSelf.hand = gameDeckSelf.hand.filter((handUnit) => handUnit.unit.id !== unitSelf1.unit.id)

    const unitOpponent1 = gameDeckOpponent.hand[0]
    const combatUnitOpponent = unitOpponent1.unit.combats ? unitOpponent1.unit.combats[0] : Combat.Close
    await playUnit({
      gameId: game.id,
      unitId: unitOpponent1.unit.id,
      combat: combatUnitOpponent,
      userId: opponent.id,
    })
    gameDeckOpponent.hand = gameDeckOpponent.hand.filter((handUnit) => handUnit.unit.id !== unitOpponent1.unit.id)

    const unitSelf2 = gameDeckSelf.hand.find((unit) => unit.unit.name === unitName2)
    if (!unitSelf2) {
      throw Error(`Could not find unit "${unitName2}" in hand`)
    }

    const expectedCombatRowOpponent: PlayerCombatRow = {
      score: unitOpponent1.unit.strength || 0,
      units: [
        TestUtil.getGameUnit({
          unit: unitOpponent1.unit,
        }),
      ],
    }
    gameDeckSelf.hand = gameDeckSelf.hand.filter((handUnit) => handUnit.unit.id !== unitSelf2.unit.id)
    const expectedGamePlayer = expectizeGamePlayer({
      user: opponent,
      gameDeck: gameDeckOpponent,
      order: 1,
      ready: true,
      rounds: [
        expectizePlayerRound({
          close: combatUnitOpponent === Combat.Close ? expectedCombatRowOpponent : TestUtil.getPlayerCombatRow({}),
          moves: [
            {
              created: expect.any(Date),
              unit: unitOpponent1,
            } as MoveUnit,
          ],
          ranged: combatUnitOpponent === Combat.Ranged ? expectedCombatRowOpponent : TestUtil.getPlayerCombatRow({}),
          siege: combatUnitOpponent === Combat.Siege ? expectedCombatRowOpponent : TestUtil.getPlayerCombatRow({}),
          score: unitOpponent1.unit.strength || 0,
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
                  close: TestUtil.getPlayerCombatRow({}),
                  moves: [
                    {
                      created: expect.any(Date),
                      unit: unitSelf1,
                    } as MoveUnit,
                    {
                      created: expect.any(Date),
                      unit: unitSelf2,
                    } as MoveUnit,
                  ],
                  ranged: {
                    score: 13,
                    units: [
                      TestUtil.getGameUnit({
                        unit: unitSelf1.unit,
                      }),
                      TestUtil.getGameUnit({
                        unit: unitSelf2.unit,
                        effectiveStrength: 3,
                        effects: [
                          {
                            operator: '+1',
                            total: 3,
                            reason: {
                              effect: effectMorale,
                              unit: unitSelf1.unit,
                            },
                          },
                        ],
                      }),
                    ],
                  },
                  siege: TestUtil.getPlayerCombatRow({}),
                  score: 13,
                }),
              ],
            }),
            expectedGamePlayer,
          ],
          status: GameStatus.Playing,
          round: 1,
          turn: expectedGamePlayer,
        }),
      },
    })
  })
  it('morale unit played after normal unit increases normal unit effective strength by 1 after morale unit played', async () => {
    const unitName1 = 'Toruviel'
    const unitName2 = 'Milva'
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
    const combatUnit1 = unitSelf1.unit.combats ? unitSelf1.unit.combats[0] : Combat.Close
    await playUnit({
      gameId: game.id,
      unitId: unitSelf1.unit.id,
      combat: combatUnit1,
      userId: self.id,
    })
    gameDeckSelf.hand = gameDeckSelf.hand.filter((handUnit) => handUnit.unit.id !== unitSelf1.unit.id)

    const unitOpponent1 = gameDeckOpponent.hand[0]
    const combatUnitOpponent = unitOpponent1.unit.combats ? unitOpponent1.unit.combats[0] : Combat.Close
    await playUnit({
      gameId: game.id,
      unitId: unitOpponent1.unit.id,
      combat: combatUnitOpponent,
      userId: opponent.id,
    })
    gameDeckOpponent.hand = gameDeckOpponent.hand.filter((handUnit) => handUnit.unit.id !== unitOpponent1.unit.id)

    const unitSelf2 = gameDeckSelf.hand.find((unit) => unit.unit.name === unitName2)
    if (!unitSelf2) {
      throw Error(`Could not find unit "${unitName2}" in hand`)
    }
    const effectMorale = unitSelf2.unit.effects?.find((effect) => effect.key === EffectKey.Morale)
    if (!effectMorale) {
      throw Error(`Could not find "${EffectKey.Morale}" effect on "${unitName2}" unit`)
    }

    const expectedCombatRowOpponent: PlayerCombatRow = {
      score: unitOpponent1.unit.strength || 0,
      units: [
        TestUtil.getGameUnit({
          unit: unitOpponent1.unit,
        }),
      ],
    }
    gameDeckSelf.hand = gameDeckSelf.hand.filter((handUnit) => handUnit.unit.id !== unitSelf2.unit.id)
    const expectedGamePlayer = expectizeGamePlayer({
      user: opponent,
      gameDeck: gameDeckOpponent,
      order: 1,
      ready: true,
      rounds: [
        expectizePlayerRound({
          close: combatUnitOpponent === Combat.Close ? expectedCombatRowOpponent : TestUtil.getPlayerCombatRow({}),
          moves: [
            {
              created: expect.any(Date),
              unit: unitOpponent1,
            } as MoveUnit,
          ],
          ranged: combatUnitOpponent === Combat.Ranged ? expectedCombatRowOpponent : TestUtil.getPlayerCombatRow({}),
          siege: combatUnitOpponent === Combat.Siege ? expectedCombatRowOpponent : TestUtil.getPlayerCombatRow({}),
          score: unitOpponent1.unit.strength || 0,
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
                  close: TestUtil.getPlayerCombatRow({}),
                  moves: [
                    {
                      created: expect.any(Date),
                      unit: unitSelf1,
                    } as MoveUnit,
                    {
                      created: expect.any(Date),
                      unit: unitSelf2,
                      impacts: [
                        {
                          unit: {
                            ...unitSelf1,
                            effectiveStrength: 3,
                            effects: [
                              {
                                operator: '+1',
                                reason: {
                                  effect: effectMorale,
                                  unit: unitSelf2.unit,
                                },
                                total: 3,
                              },
                            ],
                          },
                          user: self,
                        },
                      ],
                    } as MoveUnit,
                  ],
                  ranged: {
                    score: 13,
                    units: [
                      TestUtil.getGameUnit({
                        unit: unitSelf1.unit,
                        effectiveStrength: 3,
                        effects: [
                          {
                            operator: '+1',
                            total: 3,
                            reason: {
                              effect: effectMorale,
                              unit: unitSelf2.unit,
                            },
                          },
                        ],
                      }),
                      TestUtil.getGameUnit({
                        unit: unitSelf2.unit,
                      }),
                    ],
                  },
                  siege: TestUtil.getPlayerCombatRow({}),
                  score: 13,
                }),
              ],
            }),
            expectedGamePlayer,
          ],
          status: GameStatus.Playing,
          round: 1,
          turn: expectedGamePlayer,
        }),
      },
    })
  })
  it('morale unit does not effect hero', async () => {
    const unitName1 = 'Eithne'
    const unitName2 = 'Milva'
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
    const combatUnit1 = unitSelf1.unit.combats ? unitSelf1.unit.combats[0] : Combat.Close
    await playUnit({
      gameId: game.id,
      unitId: unitSelf1.unit.id,
      combat: combatUnit1,
      userId: self.id,
    })
    gameDeckSelf.hand = gameDeckSelf.hand.filter((handUnit) => handUnit.unit.id !== unitSelf1.unit.id)

    const unitOpponent1 = gameDeckOpponent.hand[0]
    const combatUnitOpponent = unitOpponent1.unit.combats ? unitOpponent1.unit.combats[0] : Combat.Close
    await playUnit({
      gameId: game.id,
      unitId: unitOpponent1.unit.id,
      combat: combatUnitOpponent,
      userId: opponent.id,
    })
    gameDeckOpponent.hand = gameDeckOpponent.hand.filter((handUnit) => handUnit.unit.id !== unitOpponent1.unit.id)

    const unitSelf2 = gameDeckSelf.hand.find((unit) => unit.unit.name === unitName2)
    if (!unitSelf2) {
      throw Error(`Could not find unit "${unitName2}" in hand`)
    }
    const effectMorale = unitSelf2.unit.effects?.find((effect) => effect.key === EffectKey.Morale)
    if (!effectMorale) {
      throw Error(`Could not find "${EffectKey.Morale}" effect on "${unitName2}" unit`)
    }

    const expectedCombatRowOpponent: PlayerCombatRow = {
      score: unitOpponent1.unit.strength || 0,
      units: [
        TestUtil.getGameUnit({
          unit: unitOpponent1.unit,
        }),
      ],
    }
    gameDeckSelf.hand = gameDeckSelf.hand.filter((handUnit) => handUnit.unit.id !== unitSelf2.unit.id)
    const expectedGamePlayer = expectizeGamePlayer({
      user: opponent,
      gameDeck: gameDeckOpponent,
      order: 1,
      ready: true,
      rounds: [
        expectizePlayerRound({
          close: combatUnitOpponent === Combat.Close ? expectedCombatRowOpponent : TestUtil.getPlayerCombatRow({}),
          moves: [
            {
              created: expect.any(Date),
              unit: unitOpponent1,
            } as MoveUnit,
          ],
          ranged: combatUnitOpponent === Combat.Ranged ? expectedCombatRowOpponent : TestUtil.getPlayerCombatRow({}),
          siege: combatUnitOpponent === Combat.Siege ? expectedCombatRowOpponent : TestUtil.getPlayerCombatRow({}),
          score: unitOpponent1.unit.strength || 0,
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
                  close: TestUtil.getPlayerCombatRow({}),
                  moves: [
                    {
                      created: expect.any(Date),
                      unit: unitSelf1,
                    } as MoveUnit,
                    {
                      created: expect.any(Date),
                      unit: unitSelf2,
                    } as MoveUnit,
                  ],
                  ranged: {
                    score: 20,
                    units: [
                      TestUtil.getGameUnit({
                        unit: unitSelf1.unit,
                      }),
                      TestUtil.getGameUnit({
                        unit: unitSelf2.unit,
                      }),
                    ],
                  },
                  siege: TestUtil.getPlayerCombatRow({}),
                  score: 20,
                }),
              ],
            }),
            expectedGamePlayer,
          ],
          status: GameStatus.Playing,
          round: 1,
          turn: expectedGamePlayer,
        }),
      },
    })
  })
})
