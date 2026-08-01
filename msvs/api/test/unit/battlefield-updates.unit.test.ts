import { ObjectId } from 'mongodb'

import BattlefieldUpdates from '../../src/graphql/resolvers/mutations/play-unit/battlefield-updates'
import { Combat } from '@gwent/graphql-schema/resolver-typings'
import {
  DeckUnitDbObject,
  FieldUnitDbObject,
  GameDbObject,
  GameUnitDbObject,
  GameUnitOrigin,
  ImpactDbObject,
  UnitDbObject,
} from '@gwent/graphql-schema/database-typings'
import deepClone from '../util/deep-clone'
import EffectAvenger from '../../src/graphql/resolvers/mutations/play-unit/effect-avenger'
import EffectDecoy from '../../src/graphql/resolvers/mutations/play-unit/effect-decoy'
import EffectMardroeme from '../../src/graphql/resolvers/mutations/play-unit/effect-mardroeme'
import EffectMedic from '../../src/graphql/resolvers/mutations/play-unit/effect-medic'
import EffectMuster, { MusteredOrigins } from '../../src/graphql/resolvers/mutations/play-unit/effect-muster'
import EffectScorch from '../../src/graphql/resolvers/mutations/play-unit/effect-scorch'
import EffectSpy from '../../src/graphql/resolvers/mutations/play-unit/effect-spy'
import EffectWeather from '../../src/graphql/resolvers/mutations/play-unit/effect-weather'
import { ImpactsByUnitId } from '../../src/graphql/resolvers/resolver-util'
import { PlayersToDeckUnitDbObjects } from '../../src/graphql/resolvers/mutations/util/players-to-deck-units'
import TestUtil from '../util/test-util'

describe('battlefield-updates', () => {
  describe('modifyBattlefieldWithNewUnit', () => {
    it('returns undefined if no impacts', async () => {
      await testModifyBattlefieldWithNewUnit({
        newDeckUnit: TestUtil.getDbDeckUnit({}),
        newUnit: TestUtil.getDbUnit({}),
      })
    })
    it('returns single impact for muster', async () => {
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const unitId = new ObjectId()
      const impacts: ImpactDbObject[] = [
        {
          unit: TestUtil.getDbGameUnit({
            id: unitId,
          }),
          user: new ObjectId(),
        },
      ]
      await testModifyBattlefieldWithNewUnit({
        newDeckUnit,
        newUnit: TestUtil.getDbUnit({}),
        musterImpacts: {
          [newDeckUnit.unit.toString()]: impacts,
        },
        musteredUnits: [
          TestUtil.getDbUnit({
            id: unitId,
          }),
        ],
        musteredOrigins: {
          [unitId.toString()]: GameUnitOrigin.Hand,
        },
      })
    })
    it('returns multiple impacts for muster', async () => {
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const unitId1 = new ObjectId()
      const unitId2 = new ObjectId()
      const impacts: ImpactDbObject[] = [
        {
          unit: TestUtil.getDbGameUnit({
            id: unitId1,
          }),
          user: new ObjectId(),
        },
        {
          unit: TestUtil.getDbGameUnit({
            id: unitId2,
          }),
          user: new ObjectId(),
        },
      ]
      await testModifyBattlefieldWithNewUnit({
        newDeckUnit,
        newUnit: TestUtil.getDbUnit({}),
        musterImpacts: {
          [newDeckUnit.unit.toString()]: impacts,
        },
        musteredUnits: [
          TestUtil.getDbUnit({
            id: unitId1,
          }),
          TestUtil.getDbUnit({
            id: unitId2,
          }),
        ],
        musteredOrigins: {
          [unitId1.toString()]: GameUnitOrigin.Hand,
          [unitId2.toString()]: GameUnitOrigin.Undrawn,
        },
      })
    })
    it('returns single impact for scorch', () => {
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const playerId = new ObjectId().toString()
      const discard = TestUtil.getDbDeckUnit({})
      const impacts: ImpactDbObject[] = [
        {
          unit: TestUtil.getDbGameUnit({}),
          user: new ObjectId(),
        },
      ]
      testModifyBattlefieldWithNewUnit({
        newDeckUnit,
        newUnit: TestUtil.getDbUnit({}),
        scorchImpacts: {
          [newDeckUnit.unit.toString()]: impacts,
        },
        scorchDiscards: {
          [playerId]: [discard],
        },
        discards: {
          [playerId]: [discard],
        },
      })
    })
    it('returns multiple impacts for scorch', async () => {
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const playerId1 = new ObjectId().toString()
      const playerId2 = new ObjectId().toString()
      const discard1 = TestUtil.getDbDeckUnit({})
      const discard2 = TestUtil.getDbDeckUnit({})
      const discard3 = TestUtil.getDbDeckUnit({})
      const discard4 = TestUtil.getDbDeckUnit({})
      const impacts: ImpactDbObject[] = [
        {
          unit: TestUtil.getDbGameUnit({}),
          user: new ObjectId(),
        },
        {
          unit: TestUtil.getDbGameUnit({}),
          user: new ObjectId(),
        },
      ]
      await testModifyBattlefieldWithNewUnit({
        newDeckUnit,
        newUnit: TestUtil.getDbUnit({}),
        scorchImpacts: {
          [newDeckUnit.unit.toString()]: impacts,
        },
        scorchDiscards: {
          [playerId1]: [discard1, discard2],
          [playerId2]: [discard3, discard4],
        },
        discards: {
          [playerId1]: [discard1, discard2],
          [playerId2]: [discard3, discard4],
        },
      })
    })
    it('returns single impact for medic', () => {
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const impacts: ImpactDbObject[] = [
        {
          unit: TestUtil.getDbGameUnit({}),
          user: new ObjectId(),
        },
      ]
      testModifyBattlefieldWithNewUnit({
        newDeckUnit,
        newUnit: TestUtil.getDbUnit({}),
        medicImpacts: {
          [newDeckUnit.unit.toString()]: impacts,
        },
        medicingUnit: TestUtil.getDbGameUnit({}),
      })
    })
    it('returns single impact for avenger', () => {
      const scorchUnit = TestUtil.getDbGameUnit({})
      const avengerUnit = TestUtil.getDbUnit({})
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const impacts: ImpactDbObject[] = [
        {
          unit: TestUtil.getDbGameUnit({}),
          user: new ObjectId(),
        },
      ]
      const playerId = new ObjectId().toString()
      const undiscard = TestUtil.getDbDeckUnit({})
      const unhanded = TestUtil.getDbDeckUnit({})
      testModifyBattlefieldWithNewUnit({
        newDeckUnit,
        newUnit: TestUtil.getDbUnit({}),
        scorchImpacts: {
          [new ObjectId().toString()]: [
            {
              user: new ObjectId(),
              unit: scorchUnit,
            },
          ],
        },
        avengerImpacts: {
          [newDeckUnit.unit.toString()]: impacts,
        },
        avengedUnits: [avengerUnit],
        avengerUndiscarded: {
          [playerId]: [undiscard],
        },
        avengerUnhanded: {
          [playerId]: [unhanded],
        },
        undiscards: {
          [playerId]: [undiscard],
        },
        unhands: {
          [playerId]: [unhanded],
        },
      })
    })
    it('returns multiple impacts for avengers', () => {
      const scorchUnit1 = TestUtil.getDbGameUnit({})
      const scorchUnit2 = TestUtil.getDbGameUnit({})
      const avengerUnit1 = TestUtil.getDbUnit({})
      const avengerUnit2 = TestUtil.getDbUnit({})
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const impacts: ImpactDbObject[] = [
        {
          unit: TestUtil.getDbGameUnit({}),
          user: new ObjectId(),
        },
        {
          unit: TestUtil.getDbGameUnit({}),
          user: new ObjectId(),
        },
      ]
      const playerId1 = new ObjectId().toString()
      const playerId2 = new ObjectId().toString()
      const undiscard1 = TestUtil.getDbDeckUnit({})
      const undiscard2 = TestUtil.getDbDeckUnit({})
      const undiscard3 = TestUtil.getDbDeckUnit({})
      const undiscard4 = TestUtil.getDbDeckUnit({})
      const unhanded1 = TestUtil.getDbDeckUnit({})
      const unhanded2 = TestUtil.getDbDeckUnit({})
      const unhanded3 = TestUtil.getDbDeckUnit({})
      const unhanded4 = TestUtil.getDbDeckUnit({})
      testModifyBattlefieldWithNewUnit({
        newDeckUnit,
        newUnit: TestUtil.getDbUnit({}),
        scorchImpacts: {
          [new ObjectId().toString()]: [
            {
              user: new ObjectId(),
              unit: scorchUnit1,
            },
            {
              user: new ObjectId(),
              unit: scorchUnit2,
            },
          ],
        },
        avengerImpacts: {
          [newDeckUnit.unit.toString()]: impacts,
        },
        avengedUnits: [avengerUnit1, avengerUnit2],
        avengerUndiscarded: {
          [playerId1]: [undiscard1, undiscard2],
          [playerId2]: [undiscard3, undiscard4],
        },
        avengerUnhanded: {
          [playerId1]: [unhanded1, unhanded2],
          [playerId2]: [unhanded3, unhanded4],
        },
        undiscards: {
          [playerId1]: [undiscard1, undiscard2],
          [playerId2]: [undiscard3, undiscard4],
        },
        unhands: {
          [playerId1]: [unhanded1, unhanded2],
          [playerId2]: [unhanded3, unhanded4],
        },
      })
    })
    it('returns single impact for mardroeme', async () => {
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const unitId = new ObjectId()
      const impacts: ImpactDbObject[] = [
        {
          unit: TestUtil.getDbGameUnit({}),
          user: new ObjectId(),
        },
      ]
      await testModifyBattlefieldWithNewUnit({
        newDeckUnit,
        newUnit: TestUtil.getDbUnit({}),
        mardroemeImpacts: {
          [newDeckUnit.unit.toString()]: impacts,
        },
        mardroemeTransformedUnits: [
          TestUtil.getDbUnit({
            id: unitId,
          }),
        ],
        mardroemeTransformedFieldUnits: [
          TestUtil.getDbFieldUnit({
            id: unitId,
          }),
        ],
        mardroemingFieldUnit: TestUtil.getDbFieldUnit({
          id: newDeckUnit.unit,
        }),
      })
    })
    it('returns multiple impacts for mardroeme', async () => {
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const unitId1 = new ObjectId()
      const unitId2 = new ObjectId()
      const impacts: ImpactDbObject[] = [
        {
          unit: TestUtil.getDbGameUnit({
            id: unitId1,
          }),
          user: new ObjectId(),
        },
        {
          unit: TestUtil.getDbGameUnit({
            id: unitId2,
          }),
          user: new ObjectId(),
        },
      ]
      await testModifyBattlefieldWithNewUnit({
        newDeckUnit,
        newUnit: TestUtil.getDbUnit({}),
        mardroemeImpacts: {
          [newDeckUnit.unit.toString()]: impacts,
        },
        mardroemeTransformedUnits: [
          TestUtil.getDbUnit({
            id: unitId1,
          }),
          TestUtil.getDbUnit({
            id: unitId2,
          }),
        ],
        mardroemeTransformedFieldUnits: [
          TestUtil.getDbFieldUnit({
            id: unitId1,
          }),
          TestUtil.getDbFieldUnit({
            id: unitId2,
          }),
        ],
        mardroemingFieldUnit: TestUtil.getDbFieldUnit({
          id: newDeckUnit.unit,
        }),
      })
    })
    it('returns single impact and deckUnitAddedToHand for decoy', () => {
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const impacts: ImpactDbObject[] = [
        {
          unit: TestUtil.getDbGameUnit({}),
          user: new ObjectId(),
        },
      ]
      testModifyBattlefieldWithNewUnit({
        newDeckUnit,
        newUnit: TestUtil.getDbUnit({}),
        decoyImpacts: {
          [newDeckUnit.unit.toString()]: impacts,
        },
        deckUnitAddedToHand: impacts[0].unit,
      })
    })
    it('returns single impact for weather', async () => {
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const impacts: ImpactDbObject[] = [
        {
          unit: TestUtil.getDbGameUnit({}),
          user: new ObjectId(),
        },
      ]
      await testModifyBattlefieldWithNewUnit({
        newDeckUnit,
        newUnit: TestUtil.getDbUnit({}),
        weatherImpacts: {
          [newDeckUnit.unit.toString()]: impacts,
        },
        isWeather: true,
      })
    })
    it('returns multiple impacts for weather', async () => {
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const impacts: ImpactDbObject[] = [
        {
          unit: TestUtil.getDbGameUnit({}),
          user: new ObjectId(),
        },
        {
          unit: TestUtil.getDbGameUnit({}),
          user: new ObjectId(),
        },
      ]
      await testModifyBattlefieldWithNewUnit({
        newDeckUnit,
        newUnit: TestUtil.getDbUnit({}),
        weatherImpacts: {
          [newDeckUnit.unit.toString()]: impacts,
        },
        isWeather: true,
      })
    })
    it('returns single impact no spiedUnitsAddedToHand for spy', async () => {
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const impacts: ImpactDbObject[] = [
        {
          unit: TestUtil.getDbGameUnit({}),
          user: new ObjectId(),
        },
      ]
      await testModifyBattlefieldWithNewUnit({
        newDeckUnit,
        newUnit: TestUtil.getDbUnit({}),
        spyImpacts: {
          [newDeckUnit.unit.toString()]: impacts,
        },
        isSpy: true,
      })
    })
    it('returns single impact and single spiedUnitsAddedToHand for spy', async () => {
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const impacts: ImpactDbObject[] = [
        {
          unit: TestUtil.getDbGameUnit({}),
          user: new ObjectId(),
        },
      ]
      await testModifyBattlefieldWithNewUnit({
        newDeckUnit,
        newUnit: TestUtil.getDbUnit({}),
        spyImpacts: {
          [newDeckUnit.unit.toString()]: impacts,
        },
        spiedUnitsAddedToHand: [TestUtil.getDbDeckUnit({})],
        isSpy: true,
      })
    })
    it('returns single impact and double spiedUnitsAddedToHand for spy', async () => {
      const newDeckUnit = TestUtil.getDbDeckUnit({})
      const impacts: ImpactDbObject[] = [
        {
          unit: TestUtil.getDbGameUnit({}),
          user: new ObjectId(),
        },
      ]
      await testModifyBattlefieldWithNewUnit({
        newDeckUnit,
        newUnit: TestUtil.getDbUnit({}),
        spyImpacts: {
          [newDeckUnit.unit.toString()]: impacts,
        },
        spiedUnitsAddedToHand: [TestUtil.getDbDeckUnit({}), TestUtil.getDbDeckUnit({})],
        isSpy: true,
      })
    })
  })
  describe('addNewUnitToBattlefield', () => {
    describe('close combat', () => {
      const combat = Combat.Close
      describe('only unit', () => {
        it('removes weather from hand and but does not add it to row for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  hand: [],
                },
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
            weather: true,
          })
        })
        it('removes spy from hand and but does not add it to row for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  hand: [],
                },
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
            spy: true,
          })
        })
        it('removes from hand and adds it to row for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  hand: [],
                },
                rounds: [
                  {
                    ...origGame.players[0].rounds[0],
                    close: TestUtil.getDbPlayerCombatRow({
                      units: [
                        TestUtil.getDbFieldUnit({
                          artStyle: newDeckUnit.artStyle,
                          id: newDeckUnit.unit,
                          row: combat,
                        }),
                      ],
                    }),
                  },
                ],
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from discard and adds it to row for round for first player when reviving', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              discard: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({})],
            reviving: true,
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  discard: [],
                },
                rounds: [
                  {
                    ...origGame.players[0].rounds[0],
                    close: TestUtil.getDbPlayerCombatRow({
                      units: [
                        TestUtil.getDbFieldUnit({
                          artStyle: newDeckUnit.artStyle,
                          id: newDeckUnit.unit,
                          row: combat,
                        }),
                      ],
                    }),
                  },
                ],
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from hand and adds it to modifier for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({
            modifier: true,
          })
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  hand: [],
                },
                rounds: [
                  {
                    ...origGame.players[0].rounds[0],
                    close: TestUtil.getDbPlayerCombatRow({
                      modifier: TestUtil.getDbFieldUnit({
                        artStyle: newDeckUnit.artStyle,
                        id: newDeckUnit.unit,
                        row: combat,
                      }),
                    }),
                  },
                ],
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from hand and adds it to row for round for second player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [opponent, self],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              origGame.players[0],
              {
                ...origGame.players[1],
                deck: {
                  ...origGame.players[1].deck,
                  hand: [],
                },
                rounds: [
                  {
                    ...origGame.players[1].rounds[0],
                    close: TestUtil.getDbPlayerCombatRow({
                      units: [
                        TestUtil.getDbFieldUnit({
                          artStyle: newDeckUnit.artStyle,
                          id: newDeckUnit.unit,
                          row: combat,
                        }),
                      ],
                    }),
                  },
                ],
              },
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from hand and adds it to modifier for round for second player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({
            modifier: true,
          })
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [opponent, self],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              origGame.players[0],
              {
                ...origGame.players[1],
                deck: {
                  ...origGame.players[1].deck,
                  hand: [],
                },
                rounds: [
                  {
                    ...origGame.players[1].rounds[0],
                    close: TestUtil.getDbPlayerCombatRow({
                      modifier: TestUtil.getDbFieldUnit({
                        artStyle: newDeckUnit.artStyle,
                        id: newDeckUnit.unit,
                        row: combat,
                      }),
                    }),
                  },
                ],
              },
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
      })
      describe('other units', () => {
        it('removes weather from hand but does not add add it to row for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({}),
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [
              TestUtil.getDbPlayerRound({
                close: TestUtil.getDbPlayerCombatRow({
                  units: [TestUtil.getDbFieldUnit({})],
                }),
              }),
            ],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  hand: [origGame.players[0].deck.hand[0]],
                },
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
            weather: true,
          })
        })
        it('removes spy from hand but does not add add it to row for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({}),
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [
              TestUtil.getDbPlayerRound({
                close: TestUtil.getDbPlayerCombatRow({
                  units: [TestUtil.getDbFieldUnit({})],
                }),
              }),
            ],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  hand: [origGame.players[0].deck.hand[0]],
                },
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
            spy: true,
          })
        })
        it('removes from hand and adds it to row for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({}),
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [
              TestUtil.getDbPlayerRound({
                close: TestUtil.getDbPlayerCombatRow({
                  units: [TestUtil.getDbFieldUnit({})],
                }),
              }),
            ],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  hand: [origGame.players[0].deck.hand[0]],
                },
                rounds: [
                  {
                    ...origGame.players[0].rounds[0],
                    close: TestUtil.getDbPlayerCombatRow({
                      units: [
                        origGame.players[0].rounds[0].close.units[0],
                        TestUtil.getDbFieldUnit({
                          artStyle: newDeckUnit.artStyle,
                          id: newDeckUnit.unit,
                          row: combat,
                        }),
                      ],
                    }),
                  },
                ],
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from discard and adds it to row for round for first player when reviving', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              discard: [
                TestUtil.getDbDeckUnit({}),
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [
              TestUtil.getDbPlayerRound({
                close: TestUtil.getDbPlayerCombatRow({
                  units: [TestUtil.getDbFieldUnit({})],
                }),
              }),
            ],
            reviving: true,
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  discard: [origGame.players[0].deck.discard[0]],
                },
                rounds: [
                  {
                    ...origGame.players[0].rounds[0],
                    close: TestUtil.getDbPlayerCombatRow({
                      units: [
                        origGame.players[0].rounds[0].close.units[0],
                        TestUtil.getDbFieldUnit({
                          artStyle: newDeckUnit.artStyle,
                          id: newDeckUnit.unit,
                          row: combat,
                        }),
                      ],
                    }),
                  },
                ],
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from hand and adds it to modifier for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({
            modifier: true,
          })
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({}),
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [
              TestUtil.getDbPlayerRound({
                close: TestUtil.getDbPlayerCombatRow({
                  units: [TestUtil.getDbFieldUnit({})],
                }),
              }),
            ],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  hand: [origGame.players[0].deck.hand[0]],
                },
                rounds: [
                  {
                    ...origGame.players[0].rounds[0],
                    close: TestUtil.getDbPlayerCombatRow({
                      units: [origGame.players[0].rounds[0].close.units[0]],
                      modifier: TestUtil.getDbFieldUnit({
                        artStyle: newDeckUnit.artStyle,
                        id: newDeckUnit.unit,
                        row: combat,
                      }),
                    }),
                  },
                ],
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from hand and adds it to row for round for second player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({}),
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [
              TestUtil.getDbPlayerRound({
                close: TestUtil.getDbPlayerCombatRow({
                  units: [TestUtil.getDbFieldUnit({})],
                }),
              }),
            ],
          })
          const game = TestUtil.getDbGame({
            players: [opponent, self],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              origGame.players[0],
              {
                ...origGame.players[1],
                deck: {
                  ...origGame.players[1].deck,
                  hand: [origGame.players[1].deck.hand[0]],
                },
                rounds: [
                  {
                    ...origGame.players[1].rounds[0],
                    close: TestUtil.getDbPlayerCombatRow({
                      units: [
                        origGame.players[1].rounds[0].close.units[0],
                        TestUtil.getDbFieldUnit({
                          artStyle: newDeckUnit.artStyle,
                          id: newDeckUnit.unit,
                          row: combat,
                        }),
                      ],
                    }),
                  },
                ],
              },
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from hand and adds it to modifier for round for second player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({
            modifier: true,
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({}),
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [
              TestUtil.getDbPlayerRound({
                close: TestUtil.getDbPlayerCombatRow({
                  units: [TestUtil.getDbFieldUnit({})],
                }),
              }),
            ],
          })
          const game = TestUtil.getDbGame({
            players: [opponent, self],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              origGame.players[0],
              {
                ...origGame.players[1],
                deck: {
                  ...origGame.players[1].deck,
                  hand: [origGame.players[1].deck.hand[0]],
                },
                rounds: [
                  {
                    ...origGame.players[1].rounds[0],
                    close: TestUtil.getDbPlayerCombatRow({
                      units: [origGame.players[1].rounds[0].close.units[0]],
                      modifier: TestUtil.getDbFieldUnit({
                        artStyle: newDeckUnit.artStyle,
                        id: newDeckUnit.unit,
                        row: combat,
                      }),
                    }),
                  },
                ],
              },
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
      })
      describe('second round', () => {
        it('removes weather from hand but does not add it to row for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 2,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  hand: [],
                },
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
            weather: true,
          })
        })
        it('removes spy from hand but does not add it to row for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 2,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  hand: [],
                },
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
            spy: true,
          })
        })
        it('removes from hand and adds it to row for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 2,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  hand: [],
                },
                rounds: [
                  origGame.players[0].rounds[0],
                  {
                    ...origGame.players[0].rounds[1],
                    close: TestUtil.getDbPlayerCombatRow({
                      units: [
                        TestUtil.getDbFieldUnit({
                          artStyle: newDeckUnit.artStyle,
                          id: newDeckUnit.unit,
                          row: combat,
                        }),
                      ],
                    }),
                  },
                ],
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from discard and adds it to row for round for first player when reviving', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              discard: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
            reviving: true,
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 2,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  discard: [],
                },
                rounds: [
                  origGame.players[0].rounds[0],
                  {
                    ...origGame.players[0].rounds[1],
                    close: TestUtil.getDbPlayerCombatRow({
                      units: [
                        TestUtil.getDbFieldUnit({
                          artStyle: newDeckUnit.artStyle,
                          id: newDeckUnit.unit,
                          row: combat,
                        }),
                      ],
                    }),
                  },
                ],
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from hand and adds it to modifier for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({
            modifier: true,
          })
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 2,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  hand: [],
                },
                rounds: [
                  origGame.players[0].rounds[0],
                  {
                    ...origGame.players[0].rounds[1],
                    close: TestUtil.getDbPlayerCombatRow({
                      modifier: TestUtil.getDbFieldUnit({
                        artStyle: newDeckUnit.artStyle,
                        id: newDeckUnit.unit,
                        row: combat,
                      }),
                    }),
                  },
                ],
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from hand and adds it to row for round for second player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [opponent, self],
            round: 2,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              origGame.players[0],
              {
                ...origGame.players[1],
                deck: {
                  ...origGame.players[1].deck,
                  hand: [],
                },
                rounds: [
                  origGame.players[1].rounds[0],
                  {
                    ...origGame.players[1].rounds[1],
                    close: TestUtil.getDbPlayerCombatRow({
                      units: [
                        TestUtil.getDbFieldUnit({
                          artStyle: newDeckUnit.artStyle,
                          id: newDeckUnit.unit,
                          row: combat,
                        }),
                      ],
                    }),
                  },
                ],
              },
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from hand and adds it to modifier for round for second player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({
            modifier: true,
          })
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [opponent, self],
            round: 2,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              origGame.players[0],
              {
                ...origGame.players[1],
                deck: {
                  ...origGame.players[1].deck,
                  hand: [],
                },
                rounds: [
                  origGame.players[1].rounds[0],
                  {
                    ...origGame.players[1].rounds[1],
                    close: TestUtil.getDbPlayerCombatRow({
                      modifier: TestUtil.getDbFieldUnit({
                        artStyle: newDeckUnit.artStyle,
                        id: newDeckUnit.unit,
                        row: combat,
                      }),
                    }),
                  },
                ],
              },
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
      })
    })
    describe('ranged combat', () => {
      const combat = Combat.Ranged
      describe('only unit', () => {
        it('removes weather from hand but does not add it to row for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  hand: [],
                },
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
            weather: true,
          })
        })
        it('removes spy from hand but does not add it to row for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  hand: [],
                },
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
            spy: true,
          })
        })
        it('removes from hand and adds it to row for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  hand: [],
                },
                rounds: [
                  {
                    ...origGame.players[0].rounds[0],
                    ranged: TestUtil.getDbPlayerCombatRow({
                      units: [
                        TestUtil.getDbFieldUnit({
                          artStyle: newDeckUnit.artStyle,
                          id: newDeckUnit.unit,
                          row: combat,
                        }),
                      ],
                    }),
                  },
                ],
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from discard and adds it to row for round for first player when reviving', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              discard: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({})],
            reviving: true,
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  discard: [],
                },
                rounds: [
                  {
                    ...origGame.players[0].rounds[0],
                    ranged: TestUtil.getDbPlayerCombatRow({
                      units: [
                        TestUtil.getDbFieldUnit({
                          artStyle: newDeckUnit.artStyle,
                          id: newDeckUnit.unit,
                          row: combat,
                        }),
                      ],
                    }),
                  },
                ],
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from hand and adds it to modifier for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({
            modifier: true,
          })
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  hand: [],
                },
                rounds: [
                  {
                    ...origGame.players[0].rounds[0],
                    ranged: TestUtil.getDbPlayerCombatRow({
                      modifier: TestUtil.getDbFieldUnit({
                        artStyle: newDeckUnit.artStyle,
                        id: newDeckUnit.unit,
                        row: combat,
                      }),
                    }),
                  },
                ],
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from hand and adds it to row for round for second player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [opponent, self],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              origGame.players[0],
              {
                ...origGame.players[1],
                deck: {
                  ...origGame.players[1].deck,
                  hand: [],
                },
                rounds: [
                  {
                    ...origGame.players[1].rounds[0],
                    ranged: TestUtil.getDbPlayerCombatRow({
                      units: [
                        TestUtil.getDbFieldUnit({
                          artStyle: newDeckUnit.artStyle,
                          id: newDeckUnit.unit,
                          row: combat,
                        }),
                      ],
                    }),
                  },
                ],
              },
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from hand and adds it to modifier for round for second player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({
            modifier: true,
          })
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [opponent, self],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              origGame.players[0],
              {
                ...origGame.players[1],
                deck: {
                  ...origGame.players[1].deck,
                  hand: [],
                },
                rounds: [
                  {
                    ...origGame.players[1].rounds[0],
                    ranged: TestUtil.getDbPlayerCombatRow({
                      modifier: TestUtil.getDbFieldUnit({
                        artStyle: newDeckUnit.artStyle,
                        id: newDeckUnit.unit,
                        row: combat,
                      }),
                    }),
                  },
                ],
              },
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
      })
      describe('other units', () => {
        it('removes weather from hand but does not add it to row for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({}),
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [
              TestUtil.getDbPlayerRound({
                ranged: TestUtil.getDbPlayerCombatRow({
                  units: [TestUtil.getDbFieldUnit({})],
                }),
              }),
            ],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  hand: [origGame.players[0].deck.hand[0]],
                },
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
            weather: true,
          })
        })
        it('removes spy from hand but does not add it to row for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({}),
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [
              TestUtil.getDbPlayerRound({
                ranged: TestUtil.getDbPlayerCombatRow({
                  units: [TestUtil.getDbFieldUnit({})],
                }),
              }),
            ],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  hand: [origGame.players[0].deck.hand[0]],
                },
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
            spy: true,
          })
        })
        it('removes from hand and adds it to row for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({}),
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [
              TestUtil.getDbPlayerRound({
                ranged: TestUtil.getDbPlayerCombatRow({
                  units: [TestUtil.getDbFieldUnit({})],
                }),
              }),
            ],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  hand: [origGame.players[0].deck.hand[0]],
                },
                rounds: [
                  {
                    ...origGame.players[0].rounds[0],
                    ranged: TestUtil.getDbPlayerCombatRow({
                      units: [
                        origGame.players[0].rounds[0].ranged.units[0],
                        TestUtil.getDbFieldUnit({
                          artStyle: newDeckUnit.artStyle,
                          id: newDeckUnit.unit,
                          row: combat,
                        }),
                      ],
                    }),
                  },
                ],
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from discard and adds it to row for round for first player when reviving', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              discard: [
                TestUtil.getDbDeckUnit({}),
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [
              TestUtil.getDbPlayerRound({
                ranged: TestUtil.getDbPlayerCombatRow({
                  units: [TestUtil.getDbFieldUnit({})],
                }),
              }),
            ],
            reviving: true,
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  discard: [origGame.players[0].deck.discard[0]],
                },
                rounds: [
                  {
                    ...origGame.players[0].rounds[0],
                    ranged: TestUtil.getDbPlayerCombatRow({
                      units: [
                        origGame.players[0].rounds[0].ranged.units[0],
                        TestUtil.getDbFieldUnit({
                          artStyle: newDeckUnit.artStyle,
                          id: newDeckUnit.unit,
                          row: combat,
                        }),
                      ],
                    }),
                  },
                ],
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from hand and adds it to modifier for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({
            modifier: true,
          })
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({}),
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [
              TestUtil.getDbPlayerRound({
                ranged: TestUtil.getDbPlayerCombatRow({
                  units: [TestUtil.getDbFieldUnit({})],
                }),
              }),
            ],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  hand: [origGame.players[0].deck.hand[0]],
                },
                rounds: [
                  {
                    ...origGame.players[0].rounds[0],
                    ranged: TestUtil.getDbPlayerCombatRow({
                      units: [origGame.players[0].rounds[0].ranged.units[0]],
                      modifier: TestUtil.getDbFieldUnit({
                        artStyle: newDeckUnit.artStyle,
                        id: newDeckUnit.unit,
                        row: combat,
                      }),
                    }),
                  },
                ],
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from hand and adds it to row for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({}),
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [
              TestUtil.getDbPlayerRound({
                ranged: TestUtil.getDbPlayerCombatRow({
                  units: [TestUtil.getDbFieldUnit({})],
                }),
              }),
            ],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [opponent, self],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              origGame.players[0],
              {
                ...origGame.players[1],
                deck: {
                  ...origGame.players[1].deck,
                  hand: [origGame.players[1].deck.hand[0]],
                },
                rounds: [
                  {
                    ...origGame.players[1].rounds[0],
                    ranged: TestUtil.getDbPlayerCombatRow({
                      units: [
                        origGame.players[1].rounds[0].ranged.units[0],
                        TestUtil.getDbFieldUnit({
                          artStyle: newDeckUnit.artStyle,
                          id: newDeckUnit.unit,
                          row: combat,
                        }),
                      ],
                    }),
                  },
                ],
              },
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from hand and adds it to modifier for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({
            modifier: true,
          })
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({}),
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [
              TestUtil.getDbPlayerRound({
                ranged: TestUtil.getDbPlayerCombatRow({
                  units: [TestUtil.getDbFieldUnit({})],
                }),
              }),
            ],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [opponent, self],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              origGame.players[0],
              {
                ...origGame.players[1],
                deck: {
                  ...origGame.players[1].deck,
                  hand: [origGame.players[1].deck.hand[0]],
                },
                rounds: [
                  {
                    ...origGame.players[1].rounds[0],
                    ranged: TestUtil.getDbPlayerCombatRow({
                      units: [origGame.players[1].rounds[0].ranged.units[0]],
                      modifier: TestUtil.getDbFieldUnit({
                        artStyle: newDeckUnit.artStyle,
                        id: newDeckUnit.unit,
                        row: combat,
                      }),
                    }),
                  },
                ],
              },
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
      })
      describe('second round', () => {
        it('removes weather from hand but does not add it to row for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 2,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  hand: [],
                },
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
            weather: true,
          })
        })
        it('removes spy from hand but does not add it to row for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 2,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  hand: [],
                },
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
            spy: true,
          })
        })
        it('removes from hand and adds it to row for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 2,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  hand: [],
                },
                rounds: [
                  origGame.players[0].rounds[0],
                  {
                    ...origGame.players[0].rounds[1],
                    ranged: TestUtil.getDbPlayerCombatRow({
                      units: [
                        TestUtil.getDbFieldUnit({
                          artStyle: newDeckUnit.artStyle,
                          id: newDeckUnit.unit,
                          row: combat,
                        }),
                      ],
                    }),
                  },
                ],
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from discard and adds it to row for round for first player when reviving', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              discard: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
            reviving: true,
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 2,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  discard: [],
                },
                rounds: [
                  origGame.players[0].rounds[0],
                  {
                    ...origGame.players[0].rounds[1],
                    ranged: TestUtil.getDbPlayerCombatRow({
                      units: [
                        TestUtil.getDbFieldUnit({
                          artStyle: newDeckUnit.artStyle,
                          id: newDeckUnit.unit,
                          row: combat,
                        }),
                      ],
                    }),
                  },
                ],
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from hand and adds it to modifier for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({
            modifier: true,
          })
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 2,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  hand: [],
                },
                rounds: [
                  origGame.players[0].rounds[0],
                  {
                    ...origGame.players[0].rounds[1],
                    ranged: TestUtil.getDbPlayerCombatRow({
                      modifier: TestUtil.getDbFieldUnit({
                        artStyle: newDeckUnit.artStyle,
                        id: newDeckUnit.unit,
                        row: combat,
                      }),
                    }),
                  },
                ],
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from hand and adds it to row for round for second player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [opponent, self],
            round: 2,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              origGame.players[0],
              {
                ...origGame.players[1],
                deck: {
                  ...origGame.players[1].deck,
                  hand: [],
                },
                rounds: [
                  origGame.players[1].rounds[0],
                  {
                    ...origGame.players[1].rounds[1],
                    ranged: TestUtil.getDbPlayerCombatRow({
                      units: [
                        TestUtil.getDbFieldUnit({
                          artStyle: newDeckUnit.artStyle,
                          id: newDeckUnit.unit,
                          row: combat,
                        }),
                      ],
                    }),
                  },
                ],
              },
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from hand and adds it to modifier for round for second player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({
            modifier: true,
          })
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [opponent, self],
            round: 2,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              origGame.players[0],
              {
                ...origGame.players[1],
                deck: {
                  ...origGame.players[1].deck,
                  hand: [],
                },
                rounds: [
                  origGame.players[1].rounds[0],
                  {
                    ...origGame.players[1].rounds[1],
                    ranged: TestUtil.getDbPlayerCombatRow({
                      modifier: TestUtil.getDbFieldUnit({
                        artStyle: newDeckUnit.artStyle,
                        id: newDeckUnit.unit,
                        row: combat,
                      }),
                    }),
                  },
                ],
              },
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
      })
    })
    describe('siege combat', () => {
      const combat = Combat.Siege
      describe('only unit', () => {
        it('removes weather from hand but does not add it to row for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  hand: [],
                },
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
            weather: true,
          })
        })
        it('removes spy from hand but does not add it to row for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  hand: [],
                },
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
            spy: true,
          })
        })
        it('removes from hand and adds it to row for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  hand: [],
                },
                rounds: [
                  {
                    ...origGame.players[0].rounds[0],
                    siege: TestUtil.getDbPlayerCombatRow({
                      units: [
                        TestUtil.getDbFieldUnit({
                          artStyle: newDeckUnit.artStyle,
                          id: newDeckUnit.unit,
                          row: combat,
                        }),
                      ],
                    }),
                  },
                ],
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from discard and adds it to row for round for first player when reviving', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              discard: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({})],
            reviving: true,
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  discard: [],
                },
                rounds: [
                  {
                    ...origGame.players[0].rounds[0],
                    siege: TestUtil.getDbPlayerCombatRow({
                      units: [
                        TestUtil.getDbFieldUnit({
                          artStyle: newDeckUnit.artStyle,
                          id: newDeckUnit.unit,
                          row: combat,
                        }),
                      ],
                    }),
                  },
                ],
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from hand and adds it to modifier for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({
            modifier: true,
          })
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  hand: [],
                },
                rounds: [
                  {
                    ...origGame.players[0].rounds[0],
                    siege: TestUtil.getDbPlayerCombatRow({
                      modifier: TestUtil.getDbFieldUnit({
                        artStyle: newDeckUnit.artStyle,
                        id: newDeckUnit.unit,
                        row: combat,
                      }),
                    }),
                  },
                ],
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from hand and adds it to row for round for second player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [opponent, self],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              origGame.players[0],
              {
                ...origGame.players[1],
                deck: {
                  ...origGame.players[1].deck,
                  hand: [],
                },
                rounds: [
                  {
                    ...origGame.players[1].rounds[0],
                    siege: TestUtil.getDbPlayerCombatRow({
                      units: [
                        TestUtil.getDbFieldUnit({
                          artStyle: newDeckUnit.artStyle,
                          id: newDeckUnit.unit,
                          row: combat,
                        }),
                      ],
                    }),
                  },
                ],
              },
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from hand and adds it to modifier for round for second player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({
            modifier: true,
          })
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [opponent, self],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              origGame.players[0],
              {
                ...origGame.players[1],
                deck: {
                  ...origGame.players[1].deck,
                  hand: [],
                },
                rounds: [
                  {
                    ...origGame.players[1].rounds[0],
                    siege: TestUtil.getDbPlayerCombatRow({
                      modifier: TestUtil.getDbFieldUnit({
                        artStyle: newDeckUnit.artStyle,
                        id: newDeckUnit.unit,
                        row: combat,
                      }),
                    }),
                  },
                ],
              },
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
      })
      describe('other units', () => {
        it('removes weather from hand but does not add it to row for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({}),
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [
              TestUtil.getDbPlayerRound({
                siege: TestUtil.getDbPlayerCombatRow({
                  units: [TestUtil.getDbFieldUnit({})],
                }),
              }),
            ],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  hand: [origGame.players[0].deck.hand[0]],
                },
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
            weather: true,
          })
        })
        it('removes spy from hand but does not add it to row for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({}),
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [
              TestUtil.getDbPlayerRound({
                siege: TestUtil.getDbPlayerCombatRow({
                  units: [TestUtil.getDbFieldUnit({})],
                }),
              }),
            ],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  hand: [origGame.players[0].deck.hand[0]],
                },
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
            spy: true,
          })
        })
        it('removes from hand and adds it to row for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({}),
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [
              TestUtil.getDbPlayerRound({
                siege: TestUtil.getDbPlayerCombatRow({
                  units: [TestUtil.getDbFieldUnit({})],
                }),
              }),
            ],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  hand: [origGame.players[0].deck.hand[0]],
                },
                rounds: [
                  {
                    ...origGame.players[0].rounds[0],
                    siege: TestUtil.getDbPlayerCombatRow({
                      units: [
                        origGame.players[0].rounds[0].siege.units[0],
                        TestUtil.getDbFieldUnit({
                          artStyle: newDeckUnit.artStyle,
                          id: newDeckUnit.unit,
                          row: combat,
                        }),
                      ],
                    }),
                  },
                ],
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from discard and adds it to row for round for first player when reviving', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              discard: [
                TestUtil.getDbDeckUnit({}),
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [
              TestUtil.getDbPlayerRound({
                siege: TestUtil.getDbPlayerCombatRow({
                  units: [TestUtil.getDbFieldUnit({})],
                }),
              }),
            ],
            reviving: true,
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  discard: [origGame.players[0].deck.discard[0]],
                },
                rounds: [
                  {
                    ...origGame.players[0].rounds[0],
                    siege: TestUtil.getDbPlayerCombatRow({
                      units: [
                        origGame.players[0].rounds[0].siege.units[0],
                        TestUtil.getDbFieldUnit({
                          artStyle: newDeckUnit.artStyle,
                          id: newDeckUnit.unit,
                          row: combat,
                        }),
                      ],
                    }),
                  },
                ],
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from hand and adds it to modifier for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({
            modifier: true,
          })
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({}),
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [
              TestUtil.getDbPlayerRound({
                siege: TestUtil.getDbPlayerCombatRow({
                  units: [TestUtil.getDbFieldUnit({})],
                }),
              }),
            ],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  hand: [origGame.players[0].deck.hand[0]],
                },
                rounds: [
                  {
                    ...origGame.players[0].rounds[0],
                    siege: TestUtil.getDbPlayerCombatRow({
                      units: [origGame.players[0].rounds[0].siege.units[0]],
                      modifier: TestUtil.getDbFieldUnit({
                        artStyle: newDeckUnit.artStyle,
                        id: newDeckUnit.unit,
                        row: combat,
                      }),
                    }),
                  },
                ],
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from hand and adds it to row for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({}),
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [
              TestUtil.getDbPlayerRound({
                siege: TestUtil.getDbPlayerCombatRow({
                  units: [TestUtil.getDbFieldUnit({})],
                }),
              }),
            ],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [opponent, self],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              origGame.players[0],
              {
                ...origGame.players[1],
                deck: {
                  ...origGame.players[1].deck,
                  hand: [origGame.players[1].deck.hand[0]],
                },
                rounds: [
                  {
                    ...origGame.players[1].rounds[0],
                    siege: TestUtil.getDbPlayerCombatRow({
                      units: [
                        origGame.players[1].rounds[0].siege.units[0],
                        TestUtil.getDbFieldUnit({
                          artStyle: newDeckUnit.artStyle,
                          id: newDeckUnit.unit,
                          row: combat,
                        }),
                      ],
                    }),
                  },
                ],
              },
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from hand and adds it to modifier for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({
            modifier: true,
          })
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({}),
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [
              TestUtil.getDbPlayerRound({
                siege: TestUtil.getDbPlayerCombatRow({
                  units: [TestUtil.getDbFieldUnit({})],
                }),
              }),
            ],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [opponent, self],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              origGame.players[0],
              {
                ...origGame.players[1],
                deck: {
                  ...origGame.players[1].deck,
                  hand: [origGame.players[1].deck.hand[0]],
                },
                rounds: [
                  {
                    ...origGame.players[1].rounds[0],
                    siege: TestUtil.getDbPlayerCombatRow({
                      units: [origGame.players[1].rounds[0].siege.units[0]],
                      modifier: TestUtil.getDbFieldUnit({
                        artStyle: newDeckUnit.artStyle,
                        id: newDeckUnit.unit,
                        row: combat,
                      }),
                    }),
                  },
                ],
              },
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
      })
      describe('second round', () => {
        it('removes weather from hand but does not add it to row for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 2,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  hand: [],
                },
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
            weather: true,
          })
        })
        it('removes spy from hand but does not add it to row for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 2,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  hand: [],
                },
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
            spy: true,
          })
        })
        it('removes from hand and adds it to row for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 2,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  hand: [],
                },
                rounds: [
                  origGame.players[0].rounds[0],
                  {
                    ...origGame.players[0].rounds[1],
                    siege: TestUtil.getDbPlayerCombatRow({
                      units: [
                        TestUtil.getDbFieldUnit({
                          artStyle: newDeckUnit.artStyle,
                          id: newDeckUnit.unit,
                          row: combat,
                        }),
                      ],
                    }),
                  },
                ],
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from discard and adds it to row for round for first player when reviving', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              discard: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
            reviving: true,
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 2,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  discard: [],
                },
                rounds: [
                  origGame.players[0].rounds[0],
                  {
                    ...origGame.players[0].rounds[1],
                    siege: TestUtil.getDbPlayerCombatRow({
                      units: [
                        TestUtil.getDbFieldUnit({
                          artStyle: newDeckUnit.artStyle,
                          id: newDeckUnit.unit,
                          row: combat,
                        }),
                      ],
                    }),
                  },
                ],
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from hand and adds it to modifier for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({
            modifier: true,
          })
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 2,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  hand: [],
                },
                rounds: [
                  origGame.players[0].rounds[0],
                  {
                    ...origGame.players[0].rounds[1],
                    siege: TestUtil.getDbPlayerCombatRow({
                      modifier: TestUtil.getDbFieldUnit({
                        artStyle: newDeckUnit.artStyle,
                        id: newDeckUnit.unit,
                        row: combat,
                      }),
                    }),
                  },
                ],
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from hand and adds it to row for round for second player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [opponent, self],
            round: 2,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              origGame.players[0],
              {
                ...origGame.players[1],
                deck: {
                  ...origGame.players[1].deck,
                  hand: [],
                },
                rounds: [
                  origGame.players[1].rounds[0],
                  {
                    ...origGame.players[1].rounds[1],
                    siege: TestUtil.getDbPlayerCombatRow({
                      units: [
                        TestUtil.getDbFieldUnit({
                          artStyle: newDeckUnit.artStyle,
                          id: newDeckUnit.unit,
                          row: combat,
                        }),
                      ],
                    }),
                  },
                ],
              },
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from hand and adds it to modifier for round for second player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({
            modifier: true,
          })
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [opponent, self],
            round: 2,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              origGame.players[0],
              {
                ...origGame.players[1],
                deck: {
                  ...origGame.players[1].deck,
                  hand: [],
                },
                rounds: [
                  origGame.players[1].rounds[0],
                  {
                    ...origGame.players[1].rounds[1],
                    siege: TestUtil.getDbPlayerCombatRow({
                      modifier: TestUtil.getDbFieldUnit({
                        artStyle: newDeckUnit.artStyle,
                        id: newDeckUnit.unit,
                        row: combat,
                      }),
                    }),
                  },
                ],
              },
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
      })
    })
    describe('no combat', () => {
      const combat = null
      describe('only unit', () => {
        it('removes weather from hand and does not add it to row for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  hand: [],
                },
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
            weather: true,
          })
        })
        it('removes spy from hand and does not add it to row for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  hand: [],
                },
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
            spy: true,
          })
        })
        it('removes from hand and does not add it to row for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  hand: [],
                },
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from discard and does not add it to row for round for first player when reviving', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              discard: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({})],
            reviving: true,
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  discard: [],
                },
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from hand and adds it to row for round for second player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [opponent, self],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              origGame.players[0],
              {
                ...origGame.players[1],
                deck: {
                  ...origGame.players[1].deck,
                  hand: [],
                },
                rounds: origGame.players[1].rounds,
              },
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
      })
      describe('other units', () => {
        it('removes weather from hand and does not add it to row for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({}),
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [
              TestUtil.getDbPlayerRound({
                close: TestUtil.getDbPlayerCombatRow({
                  units: [TestUtil.getDbFieldUnit({})],
                }),
              }),
            ],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  hand: [origGame.players[0].deck.hand[0]],
                },
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
            weather: true,
          })
        })
        it('removes spy from hand and does not add it to row for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({}),
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [
              TestUtil.getDbPlayerRound({
                close: TestUtil.getDbPlayerCombatRow({
                  units: [TestUtil.getDbFieldUnit({})],
                }),
              }),
            ],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  hand: [origGame.players[0].deck.hand[0]],
                },
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
            spy: true,
          })
        })
        it('removes from hand and adds it to row for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({}),
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [
              TestUtil.getDbPlayerRound({
                close: TestUtil.getDbPlayerCombatRow({
                  units: [TestUtil.getDbFieldUnit({})],
                }),
              }),
            ],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  hand: [origGame.players[0].deck.hand[0]],
                },
                rounds: origGame.players[0].rounds,
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from discard and adds it to row for round for first player when reviving', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              discard: [
                TestUtil.getDbDeckUnit({}),
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [
              TestUtil.getDbPlayerRound({
                close: TestUtil.getDbPlayerCombatRow({
                  units: [TestUtil.getDbFieldUnit({})],
                }),
              }),
            ],
            reviving: true,
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  discard: [origGame.players[0].deck.discard[0]],
                },
                rounds: origGame.players[0].rounds,
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from hand and adds it to row for round for second player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({}),
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [
              TestUtil.getDbPlayerRound({
                close: TestUtil.getDbPlayerCombatRow({
                  units: [TestUtil.getDbFieldUnit({})],
                }),
              }),
            ],
          })
          const game = TestUtil.getDbGame({
            players: [opponent, self],
            round: 1,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              origGame.players[0],
              {
                ...origGame.players[1],
                deck: {
                  ...origGame.players[1].deck,
                  hand: [origGame.players[1].deck.hand[0]],
                },
                rounds: origGame.players[1].rounds,
              },
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
      })
      describe('second round', () => {
        it('removes weather from hand and does not add it to row for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 2,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  hand: [],
                },
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
            weather: true,
          })
        })
        it('removes spy from hand and does not add it to row for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 2,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  hand: [],
                },
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
            spy: true,
          })
        })
        it('removes from hand and adds it to row for round for first player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 2,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  hand: [],
                },
                rounds: origGame.players[0].rounds,
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from discard and adds it to row for round for first player when reviving', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              discard: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
            reviving: true,
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [self, opponent],
            round: 2,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  discard: [],
                },
                rounds: origGame.players[0].rounds,
              },
              origGame.players[1],
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
        it('removes from hand and adds it to row for round for second player', () => {
          const newDeckUnit = TestUtil.getDbDeckUnit({})
          const newUnit = TestUtil.getDbUnit({})
          const self = TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              hand: [
                TestUtil.getDbDeckUnit({
                  id: newDeckUnit.unit,
                }),
              ],
            }),
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const opponent = TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
          const game = TestUtil.getDbGame({
            players: [opponent, self],
            round: 2,
            turn: self.user,
          })
          const origGame = deepClone(game)
          const expected = {
            ...origGame,
            players: [
              origGame.players[0],
              {
                ...origGame.players[1],
                deck: {
                  ...origGame.players[1].deck,
                  hand: [],
                },
                rounds: origGame.players[1].rounds,
              },
            ],
          }

          testAddNewUnitToBattlefield({
            combat,
            game,
            newDeckUnit,
            newUnit,
            expected,
          })
        })
      })
    })
  })
})

async function testModifyBattlefieldWithNewUnit({
  newDeckUnit,
  newUnit,
  isDecoy = false,
  isSpy = false,
  isWeather = false,
  isMedic = false,
  avengedUnits = [],
  avengerImpacts = {},
  avengerUndiscarded = {},
  avengerUnhanded = {},
  musterImpacts = {},
  musteredUnits = [],
  musteredOrigins = {},
  medicImpacts = {},
  medicingUnit,
  scorchImpacts = {},
  scorchDiscards = {},
  mardroemeImpacts = {},
  mardroemeTransformedFieldUnits = [],
  mardroemeTransformedUnits = [],
  mardroemingFieldUnit,
  decoyImpacts = {},
  deckUnitAddedToHand,
  discards = {},
  undiscards = {},
  unhands = {},
  weatherImpacts = {},
  spyImpacts = {},
  spiedUnitsAddedToHand = [],
}: {
  newDeckUnit: DeckUnitDbObject
  newUnit: UnitDbObject
  isDecoy?: boolean
  isSpy?: boolean
  isWeather?: boolean
  isMedic?: boolean
  avengedUnits?: UnitDbObject[]
  avengerImpacts?: ImpactsByUnitId
  avengerUndiscarded?: PlayersToDeckUnitDbObjects
  avengerUnhanded?: PlayersToDeckUnitDbObjects
  musterImpacts?: ImpactsByUnitId
  musteredUnits?: UnitDbObject[]
  musteredOrigins?: MusteredOrigins
  medicImpacts?: ImpactsByUnitId
  medicingUnit?: GameUnitDbObject | undefined
  scorchImpacts?: ImpactsByUnitId
  scorchDiscards?: PlayersToDeckUnitDbObjects
  mardroemeImpacts?: ImpactsByUnitId
  mardroemeTransformedUnits?: UnitDbObject[]
  mardroemeTransformedFieldUnits?: FieldUnitDbObject[]
  mardroemingFieldUnit?: FieldUnitDbObject
  decoyImpacts?: ImpactsByUnitId
  deckUnitAddedToHand?: DeckUnitDbObject
  discards?: PlayersToDeckUnitDbObjects
  undiscards?: PlayersToDeckUnitDbObjects
  unhands?: PlayersToDeckUnitDbObjects
  weatherImpacts?: ImpactsByUnitId
  spyImpacts?: ImpactsByUnitId
  spiedUnitsAddedToHand?: DeckUnitDbObject[]
}) {
  const battlefieldUnits = [TestUtil.getDbUnit({})]
  const combat = Combat.Close
  const targetId = new ObjectId().toString()
  const effects = [TestUtil.getDbEffect({})]
  const game = TestUtil.getDbGame({})
  const logPrefix = 'log-prefix'

  const weatherBattlefieldSpy = jest.spyOn(EffectWeather, 'weatherBattlefield').mockReturnValue(weatherImpacts)
  const spyBattlefieldSpy = jest.spyOn(EffectSpy, 'spyBattlefield').mockReturnValue({
    deckUnitsAddedToHand: spiedUnitsAddedToHand,
    impacts: spyImpacts,
  })
  const addNewUnitToBattlefieldSpy = jest.spyOn(BattlefieldUpdates, 'addNewUnitToBattlefield').mockReturnValue()
  const medicBattlefieldSpy = jest.spyOn(EffectMedic, 'deployMedicOrReviveUnit').mockResolvedValue({
    impacts: medicImpacts,
    medicingUnit,
  })
  const scorchBattlefieldSpy = jest.spyOn(EffectScorch, 'scorchBattlefield').mockReturnValue({
    impacts: scorchImpacts,
    discards: scorchDiscards,
  })
  const avengeRemovedUnitsSpy = jest.spyOn(EffectAvenger, 'avengeRemovedUnits').mockResolvedValue({
    avengedUnits: avengedUnits,
    impacts: avengerImpacts,
    undiscarded: avengerUndiscarded,
    unhanded: avengerUnhanded,
  })
  const musterBattlefieldSpy = jest.spyOn(EffectMuster, 'musterBattlefield').mockResolvedValue({
    impacts: musterImpacts,
    musteredUnits,
    musteredOrigins,
  })
  const transformBerserkersSpy = jest.spyOn(EffectMardroeme, 'transformBerserkers').mockResolvedValue({
    impacts: mardroemeImpacts,
    transformedUnits: mardroemeTransformedUnits,
    transformedFieldUnits: mardroemeTransformedFieldUnits,
    mardroemingFieldUnit: mardroemingFieldUnit,
  })
  const decoyFromBattlefieldSpy = jest.spyOn(EffectDecoy, 'decoyFromBattlefield').mockReturnValue({
    impacts: decoyImpacts,
    deckUnitAddedToHand,
  })
  const expectedDeckUnitsAddedToHand: DeckUnitDbObject[] = []
  if (deckUnitAddedToHand) {
    expectedDeckUnitsAddedToHand.push(deckUnitAddedToHand)
  }
  if (spiedUnitsAddedToHand) {
    expectedDeckUnitsAddedToHand.push(...spiedUnitsAddedToHand)
  }

  await expect(
    BattlefieldUpdates.modifyBattlefieldWithNewUnit({
      battlefieldUnits,
      effects,
      game,
      logPrefix,
      newDeckUnit,
      newUnit,
      combat,
      targetId,
      isDecoy,
      isSpy,
      isWeather,
      isMedic,
    })
  ).resolves.toEqual({
    avengedUnits,
    avengers: avengerImpacts,
    scorches: scorchImpacts,
    musters: musterImpacts,
    musteredUnits,
    musteredOrigins,
    mardroemes: mardroemeImpacts,
    spies: spyImpacts,
    transformedUnits: mardroemeTransformedUnits,
    transformedFieldUnits: mardroemeTransformedFieldUnits,
    mardroemingFieldUnit: mardroemingFieldUnit,
    decoys: decoyImpacts,
    deckUnitsAddedToHand: expectedDeckUnitsAddedToHand,
    weathers: weatherImpacts,
    medics: medicImpacts,
    medicingUnit,
    undiscards,
    unhands,
    discards,
  })

  expect(addNewUnitToBattlefieldSpy.mock.calls).toEqual([
    [
      {
        combat,
        game,
        newDeckUnit,
        newUnit,
        weather: isWeather,
        spy: isSpy,
      },
    ],
  ])
  expect(medicBattlefieldSpy.mock.calls).toEqual([
    [
      {
        game,
        isMedic,
        isSpy,
        targetId,
        logPrefix,
        newDeckUnit,
      },
    ],
  ])
  expect(weatherBattlefieldSpy.mock.calls).toEqual([
    [
      {
        game,
        logPrefix,
        newDeckUnit,
        newUnit,
        isWeather,
      },
    ],
  ])
  expect(spyBattlefieldSpy.mock.calls).toEqual([
    [
      {
        combat,
        game,
        isSpy,
        logPrefix,
        newDeckUnit,
        targetId,
      },
    ],
  ])
  expect(musterBattlefieldSpy.mock.calls).toEqual([
    [
      {
        battlefieldUnits,
        combat,
        effects,
        game,
        logPrefix,
        newDeckUnit,
      },
    ],
  ])
  expect(scorchBattlefieldSpy.mock.calls).toEqual([
    [
      {
        battlefieldUnits,
        effects,
        game,
        logPrefix,
        newDeckUnit,
      },
    ],
  ])
  expect(avengeRemovedUnitsSpy.mock.calls).toEqual([
    [
      {
        battlefieldUnits,
        effects,
        game,
        logPrefix,
        removedGameUnits: scorchImpacts
          ? Object.values(scorchImpacts)
              .flat()
              .map((scorch) => {
                return {
                  user: scorch.user,
                  unit: scorch.unit,
                }
              })
          : [],
      },
    ],
  ])
  expect(transformBerserkersSpy.mock.calls).toEqual([
    [
      {
        battlefieldUnits: [...battlefieldUnits, ...musteredUnits],
        effects,
        game,
        logPrefix,
        newDeckUnit,
        combat,
      },
    ],
  ])
  expect(decoyFromBattlefieldSpy.mock.calls).toEqual([
    [
      {
        game,
        logPrefix,
        newDeckUnit,
        combat,
        targetId,
        isDecoy,
      },
    ],
  ])
}

function testAddNewUnitToBattlefield({
  combat,
  newDeckUnit,
  newUnit,
  weather = false,
  spy = false,
  game,
  expected,
}: {
  combat: Combat | null
  newDeckUnit: DeckUnitDbObject
  newUnit: UnitDbObject
  weather?: boolean
  spy?: boolean
  game: GameDbObject
  expected: GameDbObject
}) {
  expect(
    BattlefieldUpdates.addNewUnitToBattlefield({
      combat,
      game,
      newDeckUnit,
      newUnit,
      weather,
      spy,
    })
  ).toEqual(undefined)

  expect(game).toEqual(expected)
}
