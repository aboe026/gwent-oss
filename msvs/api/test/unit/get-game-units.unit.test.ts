import { Combat } from '@gwent/graphql-schema/database-typings'
import getGameUnits from '../../src/graphql/resolvers/mutations/play-unit/get-game-units'
import TestUtil from '../util/test-util'

describe('get-game-units', () => {
  describe('round 1', () => {
    const round = 1
    describe('no combat', () => {
      it('returns empty array if no units in player rounds', () => {
        expect(
          getGameUnits({
            players: [
              TestUtil.getDbGamePlayer({
                rounds: [TestUtil.getDbPlayerRound({})],
              }),
              TestUtil.getDbGamePlayer({
                rounds: [TestUtil.getDbPlayerRound({})],
              }),
            ],
            round,
          })
        ).toEqual([])
      })
      describe('first player', () => {
        it('returns single item if present in close row', () => {
          const deckUnit = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [deckUnit],
                      },
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [TestUtil.getDbPlayerRound({})],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit])
        })
        it('returns single item if present in close modifier', () => {
          const deckUnit = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [],
                        modifier: deckUnit,
                      },
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [TestUtil.getDbPlayerRound({})],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit])
        })
        it('returns single item if present in ranged row', () => {
          const deckUnit = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      ranged: {
                        score: 0,
                        units: [deckUnit],
                      },
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [TestUtil.getDbPlayerRound({})],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit])
        })
        it('returns single item if present in ranged modifier', () => {
          const deckUnit = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      ranged: {
                        score: 0,
                        units: [],
                        modifier: deckUnit,
                      },
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [TestUtil.getDbPlayerRound({})],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit])
        })
        it('returns single item if present in siege row', () => {
          const deckUnit = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      siege: {
                        score: 0,
                        units: [deckUnit],
                      },
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [TestUtil.getDbPlayerRound({})],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit])
        })
        it('returns single item if present in siege modifier', () => {
          const deckUnit = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      siege: {
                        score: 0,
                        units: [],
                        modifier: deckUnit,
                      },
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [TestUtil.getDbPlayerRound({})],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit])
        })
        it('returns multiple items if present in close row', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [deckUnit1, deckUnit2],
                      },
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [TestUtil.getDbPlayerRound({})],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
        it('returns multiple items if present in ranged row', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      ranged: {
                        score: 0,
                        units: [deckUnit1, deckUnit2],
                      },
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [TestUtil.getDbPlayerRound({})],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
        it('returns multiple items if present in siege row', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      siege: {
                        score: 0,
                        units: [deckUnit1, deckUnit2],
                      },
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [TestUtil.getDbPlayerRound({})],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
        it('returns multiple items if present in close and ranged rows', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [deckUnit1],
                      },
                      ranged: {
                        score: 0,
                        units: [deckUnit2],
                      },
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [TestUtil.getDbPlayerRound({})],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
        it('returns multiple items if present in close and siege rows', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [deckUnit1],
                      },
                      siege: {
                        score: 0,
                        units: [deckUnit2],
                      },
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [TestUtil.getDbPlayerRound({})],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
        it('returns multiple items if present in ranged and siege rows', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      ranged: {
                        score: 0,
                        units: [deckUnit1],
                      },
                      siege: {
                        score: 0,
                        units: [deckUnit2],
                      },
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [TestUtil.getDbPlayerRound({})],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
        it('returns multiple items if present in all rows without modifiers', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          const deckUnit3 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [deckUnit1],
                      },
                      ranged: {
                        score: 0,
                        units: [deckUnit2],
                      },
                      siege: {
                        score: 0,
                        units: [deckUnit3],
                      },
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [TestUtil.getDbPlayerRound({})],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit1, deckUnit2, deckUnit3])
        })
        it('returns multiple items if present in all rows with modifiers', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          const deckUnit3 = TestUtil.getDbDeckUnit({})
          const deckUnit4 = TestUtil.getDbDeckUnit({})
          const deckUnit5 = TestUtil.getDbDeckUnit({})
          const deckUnit6 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [deckUnit1],
                        modifier: deckUnit2,
                      },
                      ranged: {
                        score: 0,
                        units: [deckUnit3],
                        modifier: deckUnit4,
                      },
                      siege: {
                        score: 0,
                        units: [deckUnit5],
                        modifier: deckUnit6,
                      },
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [TestUtil.getDbPlayerRound({})],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit1, deckUnit2, deckUnit3, deckUnit4, deckUnit5, deckUnit6])
        })
        it('returns multiple items if multiple present in all rows', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          const deckUnit3 = TestUtil.getDbDeckUnit({})
          const deckUnit4 = TestUtil.getDbDeckUnit({})
          const deckUnit5 = TestUtil.getDbDeckUnit({})
          const deckUnit6 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [deckUnit1, deckUnit2],
                      },
                      ranged: {
                        score: 0,
                        units: [deckUnit3, deckUnit4],
                      },
                      siege: {
                        score: 0,
                        units: [deckUnit5, deckUnit6],
                      },
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [TestUtil.getDbPlayerRound({})],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit1, deckUnit2, deckUnit3, deckUnit4, deckUnit5, deckUnit6])
        })
      })
      describe('second player', () => {
        it('returns single item if present in close row', () => {
          const deckUnit = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [TestUtil.getDbPlayerRound({})],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [deckUnit],
                      },
                    }),
                  ],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit])
        })
        it('returns single item if present in close modifier', () => {
          const deckUnit = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [TestUtil.getDbPlayerRound({})],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [],
                        modifier: deckUnit,
                      },
                    }),
                  ],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit])
        })
        it('returns single item if present in ranged row', () => {
          const deckUnit = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [TestUtil.getDbPlayerRound({})],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      ranged: {
                        score: 0,
                        units: [deckUnit],
                      },
                    }),
                  ],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit])
        })
        it('returns single item if present in ranged row', () => {
          const deckUnit = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [TestUtil.getDbPlayerRound({})],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      ranged: {
                        score: 0,
                        units: [],
                        modifier: deckUnit,
                      },
                    }),
                  ],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit])
        })
        it('returns single item if present in siege row', () => {
          const deckUnit = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [TestUtil.getDbPlayerRound({})],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      siege: {
                        score: 0,
                        units: [deckUnit],
                      },
                    }),
                  ],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit])
        })
        it('returns single item if present in siege modifier', () => {
          const deckUnit = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [TestUtil.getDbPlayerRound({})],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      siege: {
                        score: 0,
                        units: [],
                        modifier: deckUnit,
                      },
                    }),
                  ],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit])
        })
        it('returns multiple items if present in close row', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [TestUtil.getDbPlayerRound({})],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [deckUnit1, deckUnit2],
                      },
                    }),
                  ],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
        it('returns multiple items if present in ranged row', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [TestUtil.getDbPlayerRound({})],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      ranged: {
                        score: 0,
                        units: [deckUnit1, deckUnit2],
                      },
                    }),
                  ],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
        it('returns multiple items if present in siege row', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [TestUtil.getDbPlayerRound({})],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      siege: {
                        score: 0,
                        units: [deckUnit1, deckUnit2],
                      },
                    }),
                  ],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
        it('returns multiple items if present in close and ranged rows', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [TestUtil.getDbPlayerRound({})],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [deckUnit1],
                      },
                      ranged: {
                        score: 0,
                        units: [deckUnit2],
                      },
                    }),
                  ],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
        it('returns multiple items if present in close and siege rows', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [TestUtil.getDbPlayerRound({})],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [deckUnit1],
                      },
                      siege: {
                        score: 0,
                        units: [deckUnit2],
                      },
                    }),
                  ],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
        it('returns multiple items if present in ranged and siege rows', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [TestUtil.getDbPlayerRound({})],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      ranged: {
                        score: 0,
                        units: [deckUnit1],
                      },
                      siege: {
                        score: 0,
                        units: [deckUnit2],
                      },
                    }),
                  ],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
        it('returns multiple items if present in all rows without modifiers', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          const deckUnit3 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [TestUtil.getDbPlayerRound({})],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [deckUnit1],
                      },
                      ranged: {
                        score: 0,
                        units: [deckUnit2],
                      },
                      siege: {
                        score: 0,
                        units: [deckUnit3],
                      },
                    }),
                  ],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit1, deckUnit2, deckUnit3])
        })
        it('returns multiple items if present in all rows with modifiers', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          const deckUnit3 = TestUtil.getDbDeckUnit({})
          const deckUnit4 = TestUtil.getDbDeckUnit({})
          const deckUnit5 = TestUtil.getDbDeckUnit({})
          const deckUnit6 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [TestUtil.getDbPlayerRound({})],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [deckUnit1],
                        modifier: deckUnit2,
                      },
                      ranged: {
                        score: 0,
                        units: [deckUnit3],
                        modifier: deckUnit4,
                      },
                      siege: {
                        score: 0,
                        units: [deckUnit5],
                        modifier: deckUnit6,
                      },
                    }),
                  ],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit1, deckUnit2, deckUnit3, deckUnit4, deckUnit5, deckUnit6])
        })
        it('returns multiple items if multiple present in all rows', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          const deckUnit3 = TestUtil.getDbDeckUnit({})
          const deckUnit4 = TestUtil.getDbDeckUnit({})
          const deckUnit5 = TestUtil.getDbDeckUnit({})
          const deckUnit6 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [TestUtil.getDbPlayerRound({})],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [deckUnit1, deckUnit2],
                      },
                      ranged: {
                        score: 0,
                        units: [deckUnit3, deckUnit4],
                      },
                      siege: {
                        score: 0,
                        units: [deckUnit5, deckUnit6],
                      },
                    }),
                  ],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit1, deckUnit2, deckUnit3, deckUnit4, deckUnit5, deckUnit6])
        })
      })
    })
    describe('close combat', () => {
      const combat = Combat.Close
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            ranged: {
              score: 0,
              units: [TestUtil.getDbDeckUnit({})],
            },
            siege: {
              score: 0,
              units: [TestUtil.getDbDeckUnit({})],
            },
          }),
        ],
      })
      describe('first player', () => {
        it('returns empty array if no units present in row', () => {
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
                opponent,
              ],
              round,
              combat,
            })
          ).toEqual([])
        })
        it('returns single opponent item if present', () => {
          const deckUnit = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [deckUnit],
                      },
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
                opponent,
              ],
              round,
              combat,
            })
          ).toEqual([deckUnit])
        })
        it('returns single opponent modifier if present', () => {
          const deckUnit = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [],
                        modifier: deckUnit,
                      },
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
                opponent,
              ],
              round,
              combat,
            })
          ).toEqual([deckUnit])
        })
        it('returns multiple opponent items if present', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [deckUnit1, deckUnit2],
                      },
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
                opponent,
              ],
              round,
              combat,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
      })
      describe('second player', () => {
        it('returns empty array if no units present in row', () => {
          expect(
            getGameUnits({
              players: [
                opponent,
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
              ],
              round,
              combat,
            })
          ).toEqual([])
        })
        it('returns single opponent item if present', () => {
          const deckUnit = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                opponent,
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [deckUnit],
                      },
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
              ],
              round,
              combat,
            })
          ).toEqual([deckUnit])
        })
        it('returns single opponent modifier if present', () => {
          const deckUnit = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                opponent,
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [],
                        modifier: deckUnit,
                      },
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
              ],
              round,
              combat,
            })
          ).toEqual([deckUnit])
        })
        it('returns multiple opponent items if present', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                opponent,
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [deckUnit1, deckUnit2],
                      },
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
              ],
              round,
              combat,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
      })
      describe('both players', () => {
        it('returns empty array if no units in player rounds', () => {
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [TestUtil.getDbPlayerRound({})],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [TestUtil.getDbPlayerRound({})],
                }),
              ],
              round,
              combat,
            })
          ).toEqual([])
        })
        it('returns empty array if no units present in row', () => {
          expect(
            getGameUnits({
              players: [opponent, opponent],
              round,
              combat,
            })
          ).toEqual([])
        })
        it('returns single items if present', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [deckUnit1],
                      },
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [deckUnit2],
                      },
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
              ],
              round,
              combat,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
        it('returns single modifiers if present', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [],
                        modifier: deckUnit1,
                      },
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [],
                        modifier: deckUnit2,
                      },
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
              ],
              round,
              combat,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
        it('returns multiple items if present', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          const deckUnit3 = TestUtil.getDbDeckUnit({})
          const deckUnit4 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [deckUnit1, deckUnit2],
                      },
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [deckUnit3, deckUnit4],
                      },
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
              ],
              round,
              combat,
            })
          ).toEqual([deckUnit1, deckUnit2, deckUnit3, deckUnit4])
        })
      })
    })
    describe('ranged combat', () => {
      const combat = Combat.Ranged
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            close: {
              score: 0,
              units: [TestUtil.getDbDeckUnit({})],
            },
            siege: {
              score: 0,
              units: [TestUtil.getDbDeckUnit({})],
            },
          }),
        ],
      })
      describe('first player', () => {
        it('returns empty array if no units present in row', () => {
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
                opponent,
              ],
              round,
              combat,
            })
          ).toEqual([])
        })
        it('returns single opponent item if present', () => {
          const deckUnit = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      ranged: {
                        score: 0,
                        units: [deckUnit],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
                opponent,
              ],
              round,
              combat,
            })
          ).toEqual([deckUnit])
        })
        it('returns single opponent modifier if present', () => {
          const deckUnit = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      ranged: {
                        score: 0,
                        units: [],
                        modifier: deckUnit,
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
                opponent,
              ],
              round,
              combat,
            })
          ).toEqual([deckUnit])
        })
        it('returns multiple opponent items if present', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      ranged: {
                        score: 0,
                        units: [deckUnit1, deckUnit2],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
                opponent,
              ],
              round,
              combat,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
      })
      describe('second player', () => {
        it('returns empty array if no units present in row', () => {
          expect(
            getGameUnits({
              players: [
                opponent,
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
              ],
              round,
              combat,
            })
          ).toEqual([])
        })
        it('returns single opponent item if present', () => {
          const deckUnit = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                opponent,
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      ranged: {
                        score: 0,
                        units: [deckUnit],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
              ],
              round,
              combat,
            })
          ).toEqual([deckUnit])
        })
        it('returns single opponent modifier if present', () => {
          const deckUnit = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                opponent,
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      ranged: {
                        score: 0,
                        units: [],
                        modifier: deckUnit,
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
              ],
              round,
              combat,
            })
          ).toEqual([deckUnit])
        })
        it('returns multiple opponent items if present', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                opponent,
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      ranged: {
                        score: 0,
                        units: [deckUnit1, deckUnit2],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
              ],
              round,
              combat,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
      })
      describe('both players', () => {
        it('returns empty array if no units in player rounds', () => {
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [TestUtil.getDbPlayerRound({})],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [TestUtil.getDbPlayerRound({})],
                }),
              ],
              round,
              combat,
            })
          ).toEqual([])
        })
        it('returns empty array if no units present in row', () => {
          expect(
            getGameUnits({
              players: [opponent, opponent],
              round,
              combat,
            })
          ).toEqual([])
        })
        it('returns single items if present', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      ranged: {
                        score: 0,
                        units: [deckUnit1],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      ranged: {
                        score: 0,
                        units: [deckUnit2],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
              ],
              round,
              combat,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
        it('returns single modifiers if present', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      ranged: {
                        score: 0,
                        units: [],
                        modifier: deckUnit1,
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      ranged: {
                        score: 0,
                        units: [],
                        modifier: deckUnit2,
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
              ],
              round,
              combat,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
        it('returns multiple items if present', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          const deckUnit3 = TestUtil.getDbDeckUnit({})
          const deckUnit4 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      ranged: {
                        score: 0,
                        units: [deckUnit1, deckUnit2],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      ranged: {
                        score: 0,
                        units: [deckUnit3, deckUnit4],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
              ],
              round,
              combat,
            })
          ).toEqual([deckUnit1, deckUnit2, deckUnit3, deckUnit4])
        })
      })
    })
    describe('siege combat', () => {
      const combat = Combat.Siege
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            close: {
              score: 0,
              units: [TestUtil.getDbDeckUnit({})],
            },
            ranged: {
              score: 0,
              units: [TestUtil.getDbDeckUnit({})],
            },
          }),
        ],
      })
      describe('first player', () => {
        it('returns empty array if no units present in row', () => {
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
                opponent,
              ],
              round,
              combat,
            })
          ).toEqual([])
        })
        it('returns single opponent item if present', () => {
          const deckUnit = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [deckUnit],
                      },
                    }),
                  ],
                }),
                opponent,
              ],
              round,
              combat,
            })
          ).toEqual([deckUnit])
        })
        it('returns single opponent modifier if present', () => {
          const deckUnit = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [],
                        modifier: deckUnit,
                      },
                    }),
                  ],
                }),
                opponent,
              ],
              round,
              combat,
            })
          ).toEqual([deckUnit])
        })
        it('returns multiple opponent items if present', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [deckUnit1, deckUnit2],
                      },
                    }),
                  ],
                }),
                opponent,
              ],
              round,
              combat,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
      })
      describe('second player', () => {
        it('returns empty array if no units present in row', () => {
          expect(
            getGameUnits({
              players: [
                opponent,
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
              ],
              round,
              combat,
            })
          ).toEqual([])
        })
        it('returns single opponent item if present', () => {
          const deckUnit = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                opponent,
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [deckUnit],
                      },
                    }),
                  ],
                }),
              ],
              round,
              combat,
            })
          ).toEqual([deckUnit])
        })
        it('returns single opponent modifier if present', () => {
          const deckUnit = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                opponent,
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [],
                        modifier: deckUnit,
                      },
                    }),
                  ],
                }),
              ],
              round,
              combat,
            })
          ).toEqual([deckUnit])
        })
        it('returns multiple opponent items if present', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                opponent,
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [deckUnit1, deckUnit2],
                      },
                    }),
                  ],
                }),
              ],
              round,
              combat,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
      })
      describe('both players', () => {
        it('returns empty array if no units in player rounds', () => {
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [TestUtil.getDbPlayerRound({})],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [TestUtil.getDbPlayerRound({})],
                }),
              ],
              round,
              combat,
            })
          ).toEqual([])
        })
        it('returns empty array if no units present in row', () => {
          expect(
            getGameUnits({
              players: [opponent, opponent],
              round,
              combat,
            })
          ).toEqual([])
        })
        it('returns single items if present', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [deckUnit1],
                      },
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [deckUnit2],
                      },
                    }),
                  ],
                }),
              ],
              round,
              combat,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
        it('returns single modifiers if present', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [],
                        modifier: deckUnit1,
                      },
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [],
                        modifier: deckUnit2,
                      },
                    }),
                  ],
                }),
              ],
              round,
              combat,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
        it('returns multiple items if present', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          const deckUnit3 = TestUtil.getDbDeckUnit({})
          const deckUnit4 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [deckUnit1, deckUnit2],
                      },
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [deckUnit3, deckUnit4],
                      },
                    }),
                  ],
                }),
              ],
              round,
              combat,
            })
          ).toEqual([deckUnit1, deckUnit2, deckUnit3, deckUnit4])
        })
      })
    })
  })
  describe('round 2', () => {
    const round = 2
    const previousRound = TestUtil.getDbPlayerRound({
      close: {
        score: 0,
        units: [TestUtil.getDbDeckUnit({})],
      },
      ranged: {
        score: 0,
        units: [TestUtil.getDbDeckUnit({})],
      },
      siege: {
        score: 0,
        units: [TestUtil.getDbDeckUnit({})],
      },
    })
    describe('no combat', () => {
      it('returns empty array if no units in player rounds', () => {
        expect(
          getGameUnits({
            players: [
              TestUtil.getDbGamePlayer({
                rounds: [previousRound, TestUtil.getDbPlayerRound({})],
              }),
              TestUtil.getDbGamePlayer({
                rounds: [previousRound, TestUtil.getDbPlayerRound({})],
              }),
            ],
            round,
          })
        ).toEqual([])
      })
      describe('first player', () => {
        it('returns single item if present in close row', () => {
          const deckUnit = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [deckUnit],
                      },
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [previousRound, TestUtil.getDbPlayerRound({})],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit])
        })
        it('returns single modifier if present in close row', () => {
          const deckUnit = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [],
                        modifier: deckUnit,
                      },
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [previousRound, TestUtil.getDbPlayerRound({})],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit])
        })
        it('returns single item if present in ranged row', () => {
          const deckUnit = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      ranged: {
                        score: 0,
                        units: [deckUnit],
                      },
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [previousRound, TestUtil.getDbPlayerRound({})],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit])
        })
        it('returns single modifier if present in ranged row', () => {
          const deckUnit = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      ranged: {
                        score: 0,
                        units: [],
                        modifier: deckUnit,
                      },
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [previousRound, TestUtil.getDbPlayerRound({})],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit])
        })
        it('returns single item if present in siege row', () => {
          const deckUnit = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      siege: {
                        score: 0,
                        units: [deckUnit],
                      },
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [previousRound, TestUtil.getDbPlayerRound({})],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit])
        })
        it('returns single modifier if present in siege row', () => {
          const deckUnit = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      siege: {
                        score: 0,
                        units: [],
                        modifier: deckUnit,
                      },
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [previousRound, TestUtil.getDbPlayerRound({})],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit])
        })
        it('returns multiple items if present in close row', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [deckUnit1, deckUnit2],
                      },
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [previousRound, TestUtil.getDbPlayerRound({})],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
        it('returns multiple items if present in ranged row', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      ranged: {
                        score: 0,
                        units: [deckUnit1, deckUnit2],
                      },
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [previousRound, TestUtil.getDbPlayerRound({})],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
        it('returns multiple items if present in siege row', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      siege: {
                        score: 0,
                        units: [deckUnit1, deckUnit2],
                      },
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [previousRound, TestUtil.getDbPlayerRound({})],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
        it('returns multiple items if present in close and ranged rows', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [deckUnit1],
                      },
                      ranged: {
                        score: 0,
                        units: [deckUnit2],
                      },
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [previousRound, TestUtil.getDbPlayerRound({})],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
        it('returns multiple items if present in close and siege rows', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [deckUnit1],
                      },
                      siege: {
                        score: 0,
                        units: [deckUnit2],
                      },
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [previousRound, TestUtil.getDbPlayerRound({})],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
        it('returns multiple items if present in ranged and siege rows', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      ranged: {
                        score: 0,
                        units: [deckUnit1],
                      },
                      siege: {
                        score: 0,
                        units: [deckUnit2],
                      },
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [previousRound, TestUtil.getDbPlayerRound({})],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
        it('returns multiple items if present in all rows without modifiers', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          const deckUnit3 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [deckUnit1],
                      },
                      ranged: {
                        score: 0,
                        units: [deckUnit2],
                      },
                      siege: {
                        score: 0,
                        units: [deckUnit3],
                      },
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [previousRound, TestUtil.getDbPlayerRound({})],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit1, deckUnit2, deckUnit3])
        })
        it('returns multiple items if present in all rows with modifiers', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          const deckUnit3 = TestUtil.getDbDeckUnit({})
          const deckUnit4 = TestUtil.getDbDeckUnit({})
          const deckUnit5 = TestUtil.getDbDeckUnit({})
          const deckUnit6 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [deckUnit1],
                        modifier: deckUnit2,
                      },
                      ranged: {
                        score: 0,
                        units: [deckUnit3],
                        modifier: deckUnit4,
                      },
                      siege: {
                        score: 0,
                        units: [deckUnit5],
                        modifier: deckUnit6,
                      },
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [previousRound, TestUtil.getDbPlayerRound({})],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit1, deckUnit2, deckUnit3, deckUnit4, deckUnit5, deckUnit6])
        })
        it('returns multiple items if multiple present in all rows', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          const deckUnit3 = TestUtil.getDbDeckUnit({})
          const deckUnit4 = TestUtil.getDbDeckUnit({})
          const deckUnit5 = TestUtil.getDbDeckUnit({})
          const deckUnit6 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [deckUnit1, deckUnit2],
                      },
                      ranged: {
                        score: 0,
                        units: [deckUnit3, deckUnit4],
                      },
                      siege: {
                        score: 0,
                        units: [deckUnit5, deckUnit6],
                      },
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [previousRound, TestUtil.getDbPlayerRound({})],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit1, deckUnit2, deckUnit3, deckUnit4, deckUnit5, deckUnit6])
        })
      })
      describe('second player', () => {
        it('returns single item if present in close row', () => {
          const deckUnit = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [previousRound, TestUtil.getDbPlayerRound({})],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [deckUnit],
                      },
                    }),
                  ],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit])
        })
        it('returns single modifier if present in close row', () => {
          const deckUnit = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [previousRound, TestUtil.getDbPlayerRound({})],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [],
                        modifier: deckUnit,
                      },
                    }),
                  ],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit])
        })
        it('returns single item if present in ranged row', () => {
          const deckUnit = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [previousRound, TestUtil.getDbPlayerRound({})],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      ranged: {
                        score: 0,
                        units: [deckUnit],
                      },
                    }),
                  ],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit])
        })
        it('returns single modifier if present in ranged row', () => {
          const deckUnit = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [previousRound, TestUtil.getDbPlayerRound({})],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      ranged: {
                        score: 0,
                        units: [],
                        modifier: deckUnit,
                      },
                    }),
                  ],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit])
        })
        it('returns single item if present in siege row', () => {
          const deckUnit = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [previousRound, TestUtil.getDbPlayerRound({})],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      siege: {
                        score: 0,
                        units: [deckUnit],
                      },
                    }),
                  ],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit])
        })
        it('returns single modifier if present in siege row', () => {
          const deckUnit = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [previousRound, TestUtil.getDbPlayerRound({})],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      siege: {
                        score: 0,
                        units: [],
                        modifier: deckUnit,
                      },
                    }),
                  ],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit])
        })
        it('returns multiple items if present in close row', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [previousRound, TestUtil.getDbPlayerRound({})],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [deckUnit1, deckUnit2],
                      },
                    }),
                  ],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
        it('returns multiple items if present in ranged row', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [previousRound, TestUtil.getDbPlayerRound({})],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      ranged: {
                        score: 0,
                        units: [deckUnit1, deckUnit2],
                      },
                    }),
                  ],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
        it('returns multiple items if present in siege row', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [previousRound, TestUtil.getDbPlayerRound({})],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      siege: {
                        score: 0,
                        units: [deckUnit1, deckUnit2],
                      },
                    }),
                  ],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
        it('returns multiple items if present in close and ranged rows', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [previousRound, TestUtil.getDbPlayerRound({})],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [deckUnit1],
                      },
                      ranged: {
                        score: 0,
                        units: [deckUnit2],
                      },
                    }),
                  ],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
        it('returns multiple items if present in close and siege rows', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [previousRound, TestUtil.getDbPlayerRound({})],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [deckUnit1],
                      },
                      siege: {
                        score: 0,
                        units: [deckUnit2],
                      },
                    }),
                  ],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
        it('returns multiple items if present in ranged and siege rows', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [previousRound, TestUtil.getDbPlayerRound({})],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      ranged: {
                        score: 0,
                        units: [deckUnit1],
                      },
                      siege: {
                        score: 0,
                        units: [deckUnit2],
                      },
                    }),
                  ],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
        it('returns multiple items if present in all rows without modifiers', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          const deckUnit3 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [previousRound, TestUtil.getDbPlayerRound({})],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [deckUnit1],
                      },
                      ranged: {
                        score: 0,
                        units: [deckUnit2],
                      },
                      siege: {
                        score: 0,
                        units: [deckUnit3],
                      },
                    }),
                  ],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit1, deckUnit2, deckUnit3])
        })
        it('returns multiple items if present in all rows with modifiers', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          const deckUnit3 = TestUtil.getDbDeckUnit({})
          const deckUnit4 = TestUtil.getDbDeckUnit({})
          const deckUnit5 = TestUtil.getDbDeckUnit({})
          const deckUnit6 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [previousRound, TestUtil.getDbPlayerRound({})],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [deckUnit1],
                        modifier: deckUnit2,
                      },
                      ranged: {
                        score: 0,
                        units: [deckUnit3],
                        modifier: deckUnit4,
                      },
                      siege: {
                        score: 0,
                        units: [deckUnit5],
                        modifier: deckUnit6,
                      },
                    }),
                  ],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit1, deckUnit2, deckUnit3, deckUnit4, deckUnit5, deckUnit6])
        })
        it('returns multiple items if multiple present in all rows', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          const deckUnit3 = TestUtil.getDbDeckUnit({})
          const deckUnit4 = TestUtil.getDbDeckUnit({})
          const deckUnit5 = TestUtil.getDbDeckUnit({})
          const deckUnit6 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [previousRound, TestUtil.getDbPlayerRound({})],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [deckUnit1, deckUnit2],
                      },
                      ranged: {
                        score: 0,
                        units: [deckUnit3, deckUnit4],
                      },
                      siege: {
                        score: 0,
                        units: [deckUnit5, deckUnit6],
                      },
                    }),
                  ],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit1, deckUnit2, deckUnit3, deckUnit4, deckUnit5, deckUnit6])
        })
      })
    })
    describe('close combat', () => {
      const combat = Combat.Close
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          previousRound,
          TestUtil.getDbPlayerRound({
            ranged: {
              score: 0,
              units: [TestUtil.getDbDeckUnit({})],
            },
            siege: {
              score: 0,
              units: [TestUtil.getDbDeckUnit({})],
            },
          }),
        ],
      })
      describe('first player', () => {
        it('returns empty array if no units present in row', () => {
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
                opponent,
              ],
              round,
              combat,
            })
          ).toEqual([])
        })
        it('returns single opponent item if present', () => {
          const deckUnit = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [deckUnit],
                      },
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
                opponent,
              ],
              round,
              combat,
            })
          ).toEqual([deckUnit])
        })
        it('returns single opponent modifier if present', () => {
          const deckUnit = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [],
                        modifier: deckUnit,
                      },
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
                opponent,
              ],
              round,
              combat,
            })
          ).toEqual([deckUnit])
        })
        it('returns multiple opponent items if present', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [deckUnit1, deckUnit2],
                      },
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
                opponent,
              ],
              round,
              combat,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
      })
      describe('second player', () => {
        it('returns empty array if no units present in row', () => {
          expect(
            getGameUnits({
              players: [
                opponent,
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
              ],
              round,
              combat,
            })
          ).toEqual([])
        })
        it('returns single opponent item if present', () => {
          const deckUnit = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                opponent,
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [deckUnit],
                      },
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
              ],
              round,
              combat,
            })
          ).toEqual([deckUnit])
        })
        it('returns single opponent modifier if present', () => {
          const deckUnit = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                opponent,
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [],
                        modifier: deckUnit,
                      },
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
              ],
              round,
              combat,
            })
          ).toEqual([deckUnit])
        })
        it('returns multiple opponent items if present', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                opponent,
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [deckUnit1, deckUnit2],
                      },
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
              ],
              round,
              combat,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
      })
      describe('both players', () => {
        it('returns empty array if no units in player rounds', () => {
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [previousRound, TestUtil.getDbPlayerRound({})],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [previousRound, TestUtil.getDbPlayerRound({})],
                }),
              ],
              round,
              combat,
            })
          ).toEqual([])
        })
        it('returns empty array if no units present in row', () => {
          expect(
            getGameUnits({
              players: [opponent, opponent],
              round,
              combat,
            })
          ).toEqual([])
        })
        it('returns single items if present', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [deckUnit1],
                      },
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [deckUnit2],
                      },
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
              ],
              round,
              combat,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
        it('returns single modifiers if present', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [],
                        modifier: deckUnit1,
                      },
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [],
                        modifier: deckUnit2,
                      },
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
              ],
              round,
              combat,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
        it('returns multiple items if present', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          const deckUnit3 = TestUtil.getDbDeckUnit({})
          const deckUnit4 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [deckUnit1, deckUnit2],
                      },
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [deckUnit3, deckUnit4],
                      },
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
              ],
              round,
              combat,
            })
          ).toEqual([deckUnit1, deckUnit2, deckUnit3, deckUnit4])
        })
      })
    })
    // TODO: pick up there
    describe('ranged combat', () => {
      const combat = Combat.Ranged
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          previousRound,
          TestUtil.getDbPlayerRound({
            close: {
              score: 0,
              units: [TestUtil.getDbDeckUnit({})],
            },
            siege: {
              score: 0,
              units: [TestUtil.getDbDeckUnit({})],
            },
          }),
        ],
      })
      describe('first player', () => {
        it('returns empty array if no units present in row', () => {
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
                opponent,
              ],
              round,
              combat,
            })
          ).toEqual([])
        })
        it('returns single opponent item if present', () => {
          const deckUnit = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      ranged: {
                        score: 0,
                        units: [deckUnit],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
                opponent,
              ],
              round,
              combat,
            })
          ).toEqual([deckUnit])
        })
        it('returns multiple opponent items if present', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      ranged: {
                        score: 0,
                        units: [deckUnit1, deckUnit2],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
                opponent,
              ],
              round,
              combat,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
      })
      describe('second player', () => {
        it('returns empty array if no units present in row', () => {
          expect(
            getGameUnits({
              players: [
                opponent,
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
              ],
              round,
              combat,
            })
          ).toEqual([])
        })
        it('returns single opponent item if present', () => {
          const deckUnit = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                opponent,
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      ranged: {
                        score: 0,
                        units: [deckUnit],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
              ],
              round,
              combat,
            })
          ).toEqual([deckUnit])
        })
        it('returns multiple opponent items if present', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                opponent,
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      ranged: {
                        score: 0,
                        units: [deckUnit1, deckUnit2],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
              ],
              round,
              combat,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
      })
      describe('both players', () => {
        it('returns empty array if no units in player rounds', () => {
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [previousRound, TestUtil.getDbPlayerRound({})],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [previousRound, TestUtil.getDbPlayerRound({})],
                }),
              ],
              round,
              combat,
            })
          ).toEqual([])
        })
        it('returns empty array if no units present in row', () => {
          expect(
            getGameUnits({
              players: [opponent, opponent],
              round,
              combat,
            })
          ).toEqual([])
        })
        it('returns single items if present', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      ranged: {
                        score: 0,
                        units: [deckUnit1],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      ranged: {
                        score: 0,
                        units: [deckUnit2],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
              ],
              round,
              combat,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
        it('returns multiple items if present', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          const deckUnit3 = TestUtil.getDbDeckUnit({})
          const deckUnit4 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      ranged: {
                        score: 0,
                        units: [deckUnit1, deckUnit2],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      ranged: {
                        score: 0,
                        units: [deckUnit3, deckUnit4],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
              ],
              round,
              combat,
            })
          ).toEqual([deckUnit1, deckUnit2, deckUnit3, deckUnit4])
        })
      })
    })
    describe('siege combat', () => {
      const combat = Combat.Siege
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          previousRound,
          TestUtil.getDbPlayerRound({
            close: {
              score: 0,
              units: [TestUtil.getDbDeckUnit({})],
            },
            ranged: {
              score: 0,
              units: [TestUtil.getDbDeckUnit({})],
            },
          }),
        ],
      })
      describe('first player', () => {
        it('returns empty array if no units present in row', () => {
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
                opponent,
              ],
              round,
              combat,
            })
          ).toEqual([])
        })
        it('returns single opponent item if present', () => {
          const deckUnit = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [deckUnit],
                      },
                    }),
                  ],
                }),
                opponent,
              ],
              round,
              combat,
            })
          ).toEqual([deckUnit])
        })
        it('returns multiple opponent items if present', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [deckUnit1, deckUnit2],
                      },
                    }),
                  ],
                }),
                opponent,
              ],
              round,
              combat,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
      })
      describe('second player', () => {
        it('returns empty array if no units present in row', () => {
          expect(
            getGameUnits({
              players: [
                opponent,
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
              ],
              round,
              combat,
            })
          ).toEqual([])
        })
        it('returns single opponent item if present', () => {
          const deckUnit = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                opponent,
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [deckUnit],
                      },
                    }),
                  ],
                }),
              ],
              round,
              combat,
            })
          ).toEqual([deckUnit])
        })
        it('returns multiple opponent items if present', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                opponent,
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [deckUnit1, deckUnit2],
                      },
                    }),
                  ],
                }),
              ],
              round,
              combat,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
      })
      describe('both players', () => {
        it('returns empty array if no units in player rounds', () => {
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [previousRound, TestUtil.getDbPlayerRound({})],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [previousRound, TestUtil.getDbPlayerRound({})],
                }),
              ],
              round,
              combat,
            })
          ).toEqual([])
        })
        it('returns empty array if no units present in row', () => {
          expect(
            getGameUnits({
              players: [opponent, opponent],
              round,
              combat,
            })
          ).toEqual([])
        })
        it('returns single items if present', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [deckUnit1],
                      },
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [deckUnit2],
                      },
                    }),
                  ],
                }),
              ],
              round,
              combat,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
        it('returns multiple items if present', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          const deckUnit3 = TestUtil.getDbDeckUnit({})
          const deckUnit4 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [deckUnit1, deckUnit2],
                      },
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [deckUnit3, deckUnit4],
                      },
                    }),
                  ],
                }),
              ],
              round,
              combat,
            })
          ).toEqual([deckUnit1, deckUnit2, deckUnit3, deckUnit4])
        })
      })
    })
  })
  describe('round 3', () => {
    const round = 3
    const previousRound = TestUtil.getDbPlayerRound({
      close: {
        score: 0,
        units: [TestUtil.getDbDeckUnit({})],
      },
      ranged: {
        score: 0,
        units: [TestUtil.getDbDeckUnit({})],
      },
      siege: {
        score: 0,
        units: [TestUtil.getDbDeckUnit({})],
      },
    })
    describe('no combat', () => {
      it('returns empty array if no units in player rounds', () => {
        expect(
          getGameUnits({
            players: [
              TestUtil.getDbGamePlayer({
                rounds: [previousRound, previousRound, TestUtil.getDbPlayerRound({})],
              }),
              TestUtil.getDbGamePlayer({
                rounds: [previousRound, previousRound, TestUtil.getDbPlayerRound({})],
              }),
            ],
            round,
          })
        ).toEqual([])
      })
      describe('first player', () => {
        it('returns single item if present in close row', () => {
          const deckUnit = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [deckUnit],
                      },
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [previousRound, previousRound, TestUtil.getDbPlayerRound({})],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit])
        })
        it('returns single item if present in ranged row', () => {
          const deckUnit = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      ranged: {
                        score: 0,
                        units: [deckUnit],
                      },
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [previousRound, previousRound, TestUtil.getDbPlayerRound({})],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit])
        })
        it('returns single item if present in siege row', () => {
          const deckUnit = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      siege: {
                        score: 0,
                        units: [deckUnit],
                      },
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [previousRound, previousRound, TestUtil.getDbPlayerRound({})],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit])
        })
        it('returns multiple items if present in close row', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [deckUnit1, deckUnit2],
                      },
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [previousRound, previousRound, TestUtil.getDbPlayerRound({})],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
        it('returns multiple items if present in ranged row', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      ranged: {
                        score: 0,
                        units: [deckUnit1, deckUnit2],
                      },
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [previousRound, previousRound, TestUtil.getDbPlayerRound({})],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
        it('returns multiple items if present in siege row', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      siege: {
                        score: 0,
                        units: [deckUnit1, deckUnit2],
                      },
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [previousRound, previousRound, TestUtil.getDbPlayerRound({})],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
        it('returns multiple items if present in close and ranged rows', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [deckUnit1],
                      },
                      ranged: {
                        score: 0,
                        units: [deckUnit2],
                      },
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [previousRound, previousRound, TestUtil.getDbPlayerRound({})],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
        it('returns multiple items if present in close and siege rows', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [deckUnit1],
                      },
                      siege: {
                        score: 0,
                        units: [deckUnit2],
                      },
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [previousRound, previousRound, TestUtil.getDbPlayerRound({})],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
        it('returns multiple items if present in ranged and siege rows', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      ranged: {
                        score: 0,
                        units: [deckUnit1],
                      },
                      siege: {
                        score: 0,
                        units: [deckUnit2],
                      },
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [previousRound, previousRound, TestUtil.getDbPlayerRound({})],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
        it('returns multiple items if present in all rows', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          const deckUnit3 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [deckUnit1],
                      },
                      ranged: {
                        score: 0,
                        units: [deckUnit2],
                      },
                      siege: {
                        score: 0,
                        units: [deckUnit3],
                      },
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [previousRound, previousRound, TestUtil.getDbPlayerRound({})],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit1, deckUnit2, deckUnit3])
        })
        it('returns multiple items if multiple present in all rows', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          const deckUnit3 = TestUtil.getDbDeckUnit({})
          const deckUnit4 = TestUtil.getDbDeckUnit({})
          const deckUnit5 = TestUtil.getDbDeckUnit({})
          const deckUnit6 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [deckUnit1, deckUnit2],
                      },
                      ranged: {
                        score: 0,
                        units: [deckUnit3, deckUnit4],
                      },
                      siege: {
                        score: 0,
                        units: [deckUnit5, deckUnit6],
                      },
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [previousRound, previousRound, TestUtil.getDbPlayerRound({})],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit1, deckUnit2, deckUnit3, deckUnit4, deckUnit5, deckUnit6])
        })
      })
      describe('second player', () => {
        it('returns single item if present in close row', () => {
          const deckUnit = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [previousRound, previousRound, TestUtil.getDbPlayerRound({})],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [deckUnit],
                      },
                    }),
                  ],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit])
        })
        it('returns single item if present in ranged row', () => {
          const deckUnit = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [previousRound, previousRound, TestUtil.getDbPlayerRound({})],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      ranged: {
                        score: 0,
                        units: [deckUnit],
                      },
                    }),
                  ],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit])
        })
        it('returns single item if present in siege row', () => {
          const deckUnit = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [previousRound, previousRound, TestUtil.getDbPlayerRound({})],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      siege: {
                        score: 0,
                        units: [deckUnit],
                      },
                    }),
                  ],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit])
        })
        it('returns multiple items if present in close row', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [previousRound, previousRound, TestUtil.getDbPlayerRound({})],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [deckUnit1, deckUnit2],
                      },
                    }),
                  ],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
        it('returns multiple items if present in ranged row', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [previousRound, previousRound, TestUtil.getDbPlayerRound({})],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      ranged: {
                        score: 0,
                        units: [deckUnit1, deckUnit2],
                      },
                    }),
                  ],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
        it('returns multiple items if present in siege row', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [previousRound, previousRound, TestUtil.getDbPlayerRound({})],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      siege: {
                        score: 0,
                        units: [deckUnit1, deckUnit2],
                      },
                    }),
                  ],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
        it('returns multiple items if present in close and ranged rows', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [previousRound, previousRound, TestUtil.getDbPlayerRound({})],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [deckUnit1],
                      },
                      ranged: {
                        score: 0,
                        units: [deckUnit2],
                      },
                    }),
                  ],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
        it('returns multiple items if present in close and siege rows', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [previousRound, previousRound, TestUtil.getDbPlayerRound({})],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [deckUnit1],
                      },
                      siege: {
                        score: 0,
                        units: [deckUnit2],
                      },
                    }),
                  ],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
        it('returns multiple items if present in ranged and siege rows', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [previousRound, previousRound, TestUtil.getDbPlayerRound({})],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      ranged: {
                        score: 0,
                        units: [deckUnit1],
                      },
                      siege: {
                        score: 0,
                        units: [deckUnit2],
                      },
                    }),
                  ],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
        it('returns multiple items if present in all rows', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          const deckUnit3 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [previousRound, previousRound, TestUtil.getDbPlayerRound({})],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [deckUnit1],
                      },
                      ranged: {
                        score: 0,
                        units: [deckUnit2],
                      },
                      siege: {
                        score: 0,
                        units: [deckUnit3],
                      },
                    }),
                  ],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit1, deckUnit2, deckUnit3])
        })
        it('returns multiple items if multiple present in all rows', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          const deckUnit3 = TestUtil.getDbDeckUnit({})
          const deckUnit4 = TestUtil.getDbDeckUnit({})
          const deckUnit5 = TestUtil.getDbDeckUnit({})
          const deckUnit6 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [previousRound, previousRound, TestUtil.getDbPlayerRound({})],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [deckUnit1, deckUnit2],
                      },
                      ranged: {
                        score: 0,
                        units: [deckUnit3, deckUnit4],
                      },
                      siege: {
                        score: 0,
                        units: [deckUnit5, deckUnit6],
                      },
                    }),
                  ],
                }),
              ],
              round,
            })
          ).toEqual([deckUnit1, deckUnit2, deckUnit3, deckUnit4, deckUnit5, deckUnit6])
        })
      })
    })
    describe('close combat', () => {
      const combat = Combat.Close
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          previousRound,
          previousRound,
          TestUtil.getDbPlayerRound({
            ranged: {
              score: 0,
              units: [TestUtil.getDbDeckUnit({})],
            },
            siege: {
              score: 0,
              units: [TestUtil.getDbDeckUnit({})],
            },
          }),
        ],
      })
      describe('first player', () => {
        it('returns empty array if no units present in row', () => {
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
                opponent,
              ],
              round,
              combat,
            })
          ).toEqual([])
        })
        it('returns single opponent item if present', () => {
          const deckUnit = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [deckUnit],
                      },
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
                opponent,
              ],
              round,
              combat,
            })
          ).toEqual([deckUnit])
        })
        it('returns multiple opponent items if present', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [deckUnit1, deckUnit2],
                      },
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
                opponent,
              ],
              round,
              combat,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
      })
      describe('second player', () => {
        it('returns empty array if no units present in row', () => {
          expect(
            getGameUnits({
              players: [
                opponent,
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
              ],
              round,
              combat,
            })
          ).toEqual([])
        })
        it('returns single opponent item if present', () => {
          const deckUnit = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                opponent,
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [deckUnit],
                      },
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
              ],
              round,
              combat,
            })
          ).toEqual([deckUnit])
        })
        it('returns multiple opponent items if present', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                opponent,
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [deckUnit1, deckUnit2],
                      },
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
              ],
              round,
              combat,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
      })
      describe('both players', () => {
        it('returns empty array if no units in player rounds', () => {
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [previousRound, previousRound, TestUtil.getDbPlayerRound({})],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [previousRound, previousRound, TestUtil.getDbPlayerRound({})],
                }),
              ],
              round,
              combat,
            })
          ).toEqual([])
        })
        it('returns empty array if no units present in row', () => {
          expect(
            getGameUnits({
              players: [opponent, opponent],
              round,
              combat,
            })
          ).toEqual([])
        })
        it('returns single items if present', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [deckUnit1],
                      },
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [deckUnit2],
                      },
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
              ],
              round,
              combat,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
        it('returns multiple items if present', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          const deckUnit3 = TestUtil.getDbDeckUnit({})
          const deckUnit4 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [deckUnit1, deckUnit2],
                      },
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [deckUnit3, deckUnit4],
                      },
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
              ],
              round,
              combat,
            })
          ).toEqual([deckUnit1, deckUnit2, deckUnit3, deckUnit4])
        })
      })
    })
    describe('ranged combat', () => {
      const combat = Combat.Ranged
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          previousRound,
          previousRound,
          TestUtil.getDbPlayerRound({
            close: {
              score: 0,
              units: [TestUtil.getDbDeckUnit({})],
            },
            siege: {
              score: 0,
              units: [TestUtil.getDbDeckUnit({})],
            },
          }),
        ],
      })
      describe('first player', () => {
        it('returns empty array if no units present in row', () => {
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
                opponent,
              ],
              round,
              combat,
            })
          ).toEqual([])
        })
        it('returns single opponent item if present', () => {
          const deckUnit = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      ranged: {
                        score: 0,
                        units: [deckUnit],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
                opponent,
              ],
              round,
              combat,
            })
          ).toEqual([deckUnit])
        })
        it('returns multiple opponent items if present', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      ranged: {
                        score: 0,
                        units: [deckUnit1, deckUnit2],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
                opponent,
              ],
              round,
              combat,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
      })
      describe('second player', () => {
        it('returns empty array if no units present in row', () => {
          expect(
            getGameUnits({
              players: [
                opponent,
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
              ],
              round,
              combat,
            })
          ).toEqual([])
        })
        it('returns single opponent item if present', () => {
          const deckUnit = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                opponent,
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      ranged: {
                        score: 0,
                        units: [deckUnit],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
              ],
              round,
              combat,
            })
          ).toEqual([deckUnit])
        })
        it('returns multiple opponent items if present', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                opponent,
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      ranged: {
                        score: 0,
                        units: [deckUnit1, deckUnit2],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
              ],
              round,
              combat,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
      })
      describe('both players', () => {
        it('returns empty array if no units in player rounds', () => {
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [previousRound, previousRound, TestUtil.getDbPlayerRound({})],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [previousRound, previousRound, TestUtil.getDbPlayerRound({})],
                }),
              ],
              round,
              combat,
            })
          ).toEqual([])
        })
        it('returns empty array if no units present in row', () => {
          expect(
            getGameUnits({
              players: [opponent, opponent],
              round,
              combat,
            })
          ).toEqual([])
        })
        it('returns single items if present', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      ranged: {
                        score: 0,
                        units: [deckUnit1],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      ranged: {
                        score: 0,
                        units: [deckUnit2],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
              ],
              round,
              combat,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
        it('returns multiple items if present', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          const deckUnit3 = TestUtil.getDbDeckUnit({})
          const deckUnit4 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      ranged: {
                        score: 0,
                        units: [deckUnit1, deckUnit2],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      ranged: {
                        score: 0,
                        units: [deckUnit3, deckUnit4],
                      },
                      siege: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
              ],
              round,
              combat,
            })
          ).toEqual([deckUnit1, deckUnit2, deckUnit3, deckUnit4])
        })
      })
    })
    describe('siege combat', () => {
      const combat = Combat.Siege
      const opponent = TestUtil.getDbGamePlayer({
        rounds: [
          previousRound,
          previousRound,
          TestUtil.getDbPlayerRound({
            close: {
              score: 0,
              units: [TestUtil.getDbDeckUnit({})],
            },
            ranged: {
              score: 0,
              units: [TestUtil.getDbDeckUnit({})],
            },
          }),
        ],
      })
      describe('first player', () => {
        it('returns empty array if no units present in row', () => {
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
                opponent,
              ],
              round,
              combat,
            })
          ).toEqual([])
        })
        it('returns single opponent item if present', () => {
          const deckUnit = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [deckUnit],
                      },
                    }),
                  ],
                }),
                opponent,
              ],
              round,
              combat,
            })
          ).toEqual([deckUnit])
        })
        it('returns multiple opponent items if present', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [deckUnit1, deckUnit2],
                      },
                    }),
                  ],
                }),
                opponent,
              ],
              round,
              combat,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
      })
      describe('second player', () => {
        it('returns empty array if no units present in row', () => {
          expect(
            getGameUnits({
              players: [
                opponent,
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                    }),
                  ],
                }),
              ],
              round,
              combat,
            })
          ).toEqual([])
        })
        it('returns single opponent item if present', () => {
          const deckUnit = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                opponent,
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [deckUnit],
                      },
                    }),
                  ],
                }),
              ],
              round,
              combat,
            })
          ).toEqual([deckUnit])
        })
        it('returns multiple opponent items if present', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                opponent,
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [deckUnit1, deckUnit2],
                      },
                    }),
                  ],
                }),
              ],
              round,
              combat,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
      })
      describe('both players', () => {
        it('returns empty array if no units in player rounds', () => {
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [previousRound, previousRound, TestUtil.getDbPlayerRound({})],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [previousRound, previousRound, TestUtil.getDbPlayerRound({})],
                }),
              ],
              round,
              combat,
            })
          ).toEqual([])
        })
        it('returns empty array if no units present in row', () => {
          expect(
            getGameUnits({
              players: [opponent, opponent],
              round,
              combat,
            })
          ).toEqual([])
        })
        it('returns single items if present', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [deckUnit1],
                      },
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [deckUnit2],
                      },
                    }),
                  ],
                }),
              ],
              round,
              combat,
            })
          ).toEqual([deckUnit1, deckUnit2])
        })
        it('returns multiple items if present', () => {
          const deckUnit1 = TestUtil.getDbDeckUnit({})
          const deckUnit2 = TestUtil.getDbDeckUnit({})
          const deckUnit3 = TestUtil.getDbDeckUnit({})
          const deckUnit4 = TestUtil.getDbDeckUnit({})
          expect(
            getGameUnits({
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [deckUnit1, deckUnit2],
                      },
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    previousRound,
                    previousRound,
                    TestUtil.getDbPlayerRound({
                      close: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      ranged: {
                        score: 0,
                        units: [TestUtil.getDbDeckUnit({})],
                      },
                      siege: {
                        score: 0,
                        units: [deckUnit3, deckUnit4],
                      },
                    }),
                  ],
                }),
              ],
              round,
              combat,
            })
          ).toEqual([deckUnit1, deckUnit2, deckUnit3, deckUnit4])
        })
      })
    })
  })
})
