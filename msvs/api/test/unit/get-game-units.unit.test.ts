import { Combat } from '@gwent/graphql-schema/database-typings'
import getGameUnits from '../../src/graphql/resolvers/mutations/play-unit/get-game-units'
import TestUtil from '../util/test-util'

describe('get-game-units', () => {
  it('returns empty array if rounds empty', () => {
    expect(
      getGameUnits({
        rounds: [],
      })
    ).toEqual([])
  })
  describe('single round', () => {
    it('returns empty array if no units', () => {
      expect(
        getGameUnits({
          rounds: [TestUtil.getDbPlayerRound({})],
        })
      ).toEqual([])
    })
    describe('no combat', () => {
      describe('single unit', () => {
        it('returns single item if close unit', () => {
          const gameUnit = TestUtil.getDbGameUnit({})
          expect(
            getGameUnits({
              rounds: [
                TestUtil.getDbPlayerRound({
                  close: TestUtil.getDbPlayerCombatRow({
                    units: [gameUnit],
                  }),
                }),
              ],
            })
          ).toEqual([gameUnit])
        })
        it('returns single item if close modifier', () => {
          const gameUnit = TestUtil.getDbGameUnit({})
          expect(
            getGameUnits({
              rounds: [
                TestUtil.getDbPlayerRound({
                  close: TestUtil.getDbPlayerCombatRow({
                    modifier: gameUnit,
                  }),
                }),
              ],
            })
          ).toEqual([gameUnit])
        })
        it('returns single item if ranged unit', () => {
          const gameUnit = TestUtil.getDbGameUnit({})
          expect(
            getGameUnits({
              rounds: [
                TestUtil.getDbPlayerRound({
                  ranged: TestUtil.getDbPlayerCombatRow({
                    units: [gameUnit],
                  }),
                }),
              ],
            })
          ).toEqual([gameUnit])
        })
        it('returns single item if ranged modifier', () => {
          const gameUnit = TestUtil.getDbGameUnit({})
          expect(
            getGameUnits({
              rounds: [
                TestUtil.getDbPlayerRound({
                  ranged: TestUtil.getDbPlayerCombatRow({
                    modifier: gameUnit,
                  }),
                }),
              ],
            })
          ).toEqual([gameUnit])
        })
        it('returns single item if siege unit', () => {
          const gameUnit = TestUtil.getDbGameUnit({})
          expect(
            getGameUnits({
              rounds: [
                TestUtil.getDbPlayerRound({
                  siege: TestUtil.getDbPlayerCombatRow({
                    units: [gameUnit],
                  }),
                }),
              ],
            })
          ).toEqual([gameUnit])
        })
        it('returns single item if siege modifier', () => {
          const gameUnit = TestUtil.getDbGameUnit({})
          expect(
            getGameUnits({
              rounds: [
                TestUtil.getDbPlayerRound({
                  siege: TestUtil.getDbPlayerCombatRow({
                    modifier: gameUnit,
                  }),
                }),
              ],
            })
          ).toEqual([gameUnit])
        })
      })
      describe('multiple units', () => {
        describe('close only', () => {
          it('returns multiple items if close units', () => {
            const gameUnit1 = TestUtil.getDbGameUnit({})
            const gameUnit2 = TestUtil.getDbGameUnit({})
            expect(
              getGameUnits({
                rounds: [
                  TestUtil.getDbPlayerRound({
                    close: TestUtil.getDbPlayerCombatRow({
                      units: [gameUnit1, gameUnit2],
                    }),
                  }),
                ],
              })
            ).toEqual([gameUnit1, gameUnit2])
          })
          it('returns multiple items if close unit and modifier', () => {
            const gameUnit1 = TestUtil.getDbGameUnit({})
            const gameUnit2 = TestUtil.getDbGameUnit({})
            expect(
              getGameUnits({
                rounds: [
                  TestUtil.getDbPlayerRound({
                    close: TestUtil.getDbPlayerCombatRow({
                      units: [gameUnit1],
                      modifier: gameUnit2,
                    }),
                  }),
                ],
              })
            ).toEqual([gameUnit1, gameUnit2])
          })
          it('returns multiple items if close unit and weather', () => {
            const gameUnit1 = TestUtil.getDbGameUnit({})
            const gameUnit2 = TestUtil.getDbGameUnit({})
            expect(
              getGameUnits({
                rounds: [
                  TestUtil.getDbPlayerRound({
                    close: TestUtil.getDbPlayerCombatRow({
                      units: [gameUnit1],
                    }),
                    weathers: [gameUnit2],
                  }),
                ],
              })
            ).toEqual([gameUnit1, gameUnit2])
          })
          it('returns multiple items if close modifier and weather', () => {
            const gameUnit1 = TestUtil.getDbGameUnit({})
            const gameUnit2 = TestUtil.getDbGameUnit({})
            expect(
              getGameUnits({
                rounds: [
                  TestUtil.getDbPlayerRound({
                    close: TestUtil.getDbPlayerCombatRow({
                      modifier: gameUnit1,
                    }),
                    weathers: [gameUnit2],
                  }),
                ],
              })
            ).toEqual([gameUnit1, gameUnit2])
          })
        })
        describe('ranged only', () => {
          it('returns multiple items if ranged units', () => {
            const gameUnit1 = TestUtil.getDbGameUnit({})
            const gameUnit2 = TestUtil.getDbGameUnit({})
            expect(
              getGameUnits({
                rounds: [
                  TestUtil.getDbPlayerRound({
                    ranged: TestUtil.getDbPlayerCombatRow({
                      units: [gameUnit1, gameUnit2],
                    }),
                  }),
                ],
              })
            ).toEqual([gameUnit1, gameUnit2])
          })
          it('returns multiple items if ranged unit and modifier', () => {
            const gameUnit1 = TestUtil.getDbGameUnit({})
            const gameUnit2 = TestUtil.getDbGameUnit({})
            expect(
              getGameUnits({
                rounds: [
                  TestUtil.getDbPlayerRound({
                    ranged: TestUtil.getDbPlayerCombatRow({
                      units: [gameUnit1],
                      modifier: gameUnit2,
                    }),
                  }),
                ],
              })
            ).toEqual([gameUnit1, gameUnit2])
          })
          it('returns multiple items if ranged unit and weather', () => {
            const gameUnit1 = TestUtil.getDbGameUnit({})
            const gameUnit2 = TestUtil.getDbGameUnit({})
            expect(
              getGameUnits({
                rounds: [
                  TestUtil.getDbPlayerRound({
                    ranged: TestUtil.getDbPlayerCombatRow({
                      units: [gameUnit1],
                    }),
                    weathers: [gameUnit2],
                  }),
                ],
              })
            ).toEqual([gameUnit1, gameUnit2])
          })
          it('returns multiple items if ranged modifier and weather', () => {
            const gameUnit1 = TestUtil.getDbGameUnit({})
            const gameUnit2 = TestUtil.getDbGameUnit({})
            expect(
              getGameUnits({
                rounds: [
                  TestUtil.getDbPlayerRound({
                    ranged: TestUtil.getDbPlayerCombatRow({
                      modifier: gameUnit1,
                    }),
                    weathers: [gameUnit2],
                  }),
                ],
              })
            ).toEqual([gameUnit1, gameUnit2])
          })
        })
        describe('siege only', () => {
          it('returns multiple items if siege units', () => {
            const gameUnit1 = TestUtil.getDbGameUnit({})
            const gameUnit2 = TestUtil.getDbGameUnit({})
            expect(
              getGameUnits({
                rounds: [
                  TestUtil.getDbPlayerRound({
                    siege: TestUtil.getDbPlayerCombatRow({
                      units: [gameUnit1, gameUnit2],
                    }),
                  }),
                ],
              })
            ).toEqual([gameUnit1, gameUnit2])
          })
          it('returns multiple items if siege unit and modifier', () => {
            const gameUnit1 = TestUtil.getDbGameUnit({})
            const gameUnit2 = TestUtil.getDbGameUnit({})
            expect(
              getGameUnits({
                rounds: [
                  TestUtil.getDbPlayerRound({
                    siege: TestUtil.getDbPlayerCombatRow({
                      units: [gameUnit1],
                      modifier: gameUnit2,
                    }),
                  }),
                ],
              })
            ).toEqual([gameUnit1, gameUnit2])
          })
          it('returns multiple items if siege unit and weather', () => {
            const gameUnit1 = TestUtil.getDbGameUnit({})
            const gameUnit2 = TestUtil.getDbGameUnit({})
            expect(
              getGameUnits({
                rounds: [
                  TestUtil.getDbPlayerRound({
                    siege: TestUtil.getDbPlayerCombatRow({
                      units: [gameUnit1],
                    }),
                    weathers: [gameUnit2],
                  }),
                ],
              })
            ).toEqual([gameUnit1, gameUnit2])
          })
          it('returns multiple items if siege modifier and weather', () => {
            const gameUnit1 = TestUtil.getDbGameUnit({})
            const gameUnit2 = TestUtil.getDbGameUnit({})
            expect(
              getGameUnits({
                rounds: [
                  TestUtil.getDbPlayerRound({
                    siege: TestUtil.getDbPlayerCombatRow({
                      modifier: gameUnit1,
                    }),
                    weathers: [gameUnit2],
                  }),
                ],
              })
            ).toEqual([gameUnit1, gameUnit2])
          })
        })
        describe('mixed', () => {
          it('returns multiple items if units', () => {
            const gameUnit1 = TestUtil.getDbGameUnit({})
            const gameUnit2 = TestUtil.getDbGameUnit({})
            const gameUnit3 = TestUtil.getDbGameUnit({})
            expect(
              getGameUnits({
                rounds: [
                  TestUtil.getDbPlayerRound({
                    close: TestUtil.getDbPlayerCombatRow({
                      units: [gameUnit1],
                    }),
                    ranged: TestUtil.getDbPlayerCombatRow({
                      units: [gameUnit2],
                    }),
                    siege: TestUtil.getDbPlayerCombatRow({
                      units: [gameUnit3],
                    }),
                  }),
                ],
              })
            ).toEqual([gameUnit1, gameUnit2, gameUnit3])
          })
          it('returns multiple items if modifiers', () => {
            const gameUnit1 = TestUtil.getDbGameUnit({})
            const gameUnit2 = TestUtil.getDbGameUnit({})
            const gameUnit3 = TestUtil.getDbGameUnit({})
            expect(
              getGameUnits({
                rounds: [
                  TestUtil.getDbPlayerRound({
                    close: TestUtil.getDbPlayerCombatRow({
                      modifier: gameUnit1,
                    }),
                    ranged: TestUtil.getDbPlayerCombatRow({
                      modifier: gameUnit2,
                    }),
                    siege: TestUtil.getDbPlayerCombatRow({
                      modifier: gameUnit3,
                    }),
                  }),
                ],
              })
            ).toEqual([gameUnit1, gameUnit2, gameUnit3])
          })
          it('returns multiple items if weathers', () => {
            const gameUnit1 = TestUtil.getDbGameUnit({})
            const gameUnit2 = TestUtil.getDbGameUnit({})
            const gameUnit3 = TestUtil.getDbGameUnit({})
            expect(
              getGameUnits({
                rounds: [
                  TestUtil.getDbPlayerRound({
                    weathers: [gameUnit1, gameUnit2, gameUnit3],
                  }),
                ],
              })
            ).toEqual([gameUnit1, gameUnit2, gameUnit3])
          })
          it('returns multiple items if units, modifiers and weathers', () => {
            const gameUnit1 = TestUtil.getDbGameUnit({})
            const gameUnit2 = TestUtil.getDbGameUnit({})
            const gameUnit3 = TestUtil.getDbGameUnit({})
            const gameUnit4 = TestUtil.getDbGameUnit({})
            const gameUnit5 = TestUtil.getDbGameUnit({})
            const gameUnit6 = TestUtil.getDbGameUnit({})
            const gameUnit7 = TestUtil.getDbGameUnit({})
            expect(
              getGameUnits({
                rounds: [
                  TestUtil.getDbPlayerRound({
                    close: TestUtil.getDbPlayerCombatRow({
                      units: [gameUnit1],
                      modifier: gameUnit2,
                    }),
                    ranged: TestUtil.getDbPlayerCombatRow({
                      units: [gameUnit3],
                      modifier: gameUnit4,
                    }),
                    siege: TestUtil.getDbPlayerCombatRow({
                      units: [gameUnit5],
                      modifier: gameUnit6,
                    }),
                    weathers: [gameUnit7],
                  }),
                ],
              })
            ).toEqual([gameUnit1, gameUnit2, gameUnit3, gameUnit4, gameUnit5, gameUnit6, gameUnit7])
          })
        })
      })
    })
    describe('close combat', () => {
      const combat = Combat.Close
      describe('single unit', () => {
        it('returns single item if close unit', () => {
          const gameUnit = TestUtil.getDbGameUnit({})
          expect(
            getGameUnits({
              combat,
              rounds: [
                TestUtil.getDbPlayerRound({
                  close: TestUtil.getDbPlayerCombatRow({
                    units: [gameUnit],
                  }),
                }),
              ],
            })
          ).toEqual([gameUnit])
        })
        it('returns single item if close modifier', () => {
          const gameUnit = TestUtil.getDbGameUnit({})
          expect(
            getGameUnits({
              combat,
              rounds: [
                TestUtil.getDbPlayerRound({
                  close: TestUtil.getDbPlayerCombatRow({
                    modifier: gameUnit,
                  }),
                }),
              ],
            })
          ).toEqual([gameUnit])
        })
        it('returns empty array if ranged unit', () => {
          const gameUnit = TestUtil.getDbGameUnit({})
          expect(
            getGameUnits({
              combat,
              rounds: [
                TestUtil.getDbPlayerRound({
                  ranged: TestUtil.getDbPlayerCombatRow({
                    units: [gameUnit],
                  }),
                }),
              ],
            })
          ).toEqual([])
        })
        it('returns empty array if ranged modifier', () => {
          const gameUnit = TestUtil.getDbGameUnit({})
          expect(
            getGameUnits({
              combat,
              rounds: [
                TestUtil.getDbPlayerRound({
                  ranged: TestUtil.getDbPlayerCombatRow({
                    modifier: gameUnit,
                  }),
                }),
              ],
            })
          ).toEqual([])
        })
        it('returns empty array if siege unit', () => {
          const gameUnit = TestUtil.getDbGameUnit({})
          expect(
            getGameUnits({
              combat,
              rounds: [
                TestUtil.getDbPlayerRound({
                  siege: TestUtil.getDbPlayerCombatRow({
                    units: [gameUnit],
                  }),
                }),
              ],
            })
          ).toEqual([])
        })
        it('returns empty array if siege modifier', () => {
          const gameUnit = TestUtil.getDbGameUnit({})
          expect(
            getGameUnits({
              combat,
              rounds: [
                TestUtil.getDbPlayerRound({
                  siege: TestUtil.getDbPlayerCombatRow({
                    modifier: gameUnit,
                  }),
                }),
              ],
            })
          ).toEqual([])
        })
      })
      describe('multiple units', () => {
        describe('close only', () => {
          it('returns multiple items if close units', () => {
            const gameUnit1 = TestUtil.getDbGameUnit({})
            const gameUnit2 = TestUtil.getDbGameUnit({})
            expect(
              getGameUnits({
                combat,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    close: TestUtil.getDbPlayerCombatRow({
                      units: [gameUnit1, gameUnit2],
                    }),
                  }),
                ],
              })
            ).toEqual([gameUnit1, gameUnit2])
          })
          it('returns multiple items if close unit and modifier', () => {
            const gameUnit1 = TestUtil.getDbGameUnit({})
            const gameUnit2 = TestUtil.getDbGameUnit({})
            expect(
              getGameUnits({
                combat,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    close: TestUtil.getDbPlayerCombatRow({
                      units: [gameUnit1],
                      modifier: gameUnit2,
                    }),
                  }),
                ],
              })
            ).toEqual([gameUnit1, gameUnit2])
          })
          it('returns single item if close unit and weather', () => {
            const gameUnit1 = TestUtil.getDbGameUnit({})
            const gameUnit2 = TestUtil.getDbGameUnit({})
            expect(
              getGameUnits({
                combat,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    close: TestUtil.getDbPlayerCombatRow({
                      units: [gameUnit1],
                    }),
                    weathers: [gameUnit2],
                  }),
                ],
              })
            ).toEqual([gameUnit1])
          })
          it('returns single item if close modifier and weather', () => {
            const gameUnit1 = TestUtil.getDbGameUnit({})
            const gameUnit2 = TestUtil.getDbGameUnit({})
            expect(
              getGameUnits({
                combat,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    close: TestUtil.getDbPlayerCombatRow({
                      modifier: gameUnit1,
                    }),
                    weathers: [gameUnit2],
                  }),
                ],
              })
            ).toEqual([gameUnit1])
          })
        })
        describe('ranged only', () => {
          it('returns empty array if ranged units', () => {
            const gameUnit1 = TestUtil.getDbGameUnit({})
            const gameUnit2 = TestUtil.getDbGameUnit({})
            expect(
              getGameUnits({
                combat,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    ranged: TestUtil.getDbPlayerCombatRow({
                      units: [gameUnit1, gameUnit2],
                    }),
                  }),
                ],
              })
            ).toEqual([])
          })
          it('returns empty array if ranged unit and modifier', () => {
            const gameUnit1 = TestUtil.getDbGameUnit({})
            const gameUnit2 = TestUtil.getDbGameUnit({})
            expect(
              getGameUnits({
                combat,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    ranged: TestUtil.getDbPlayerCombatRow({
                      units: [gameUnit1],
                      modifier: gameUnit2,
                    }),
                  }),
                ],
              })
            ).toEqual([])
          })
          it('returns empty array if ranged unit and weather', () => {
            const gameUnit1 = TestUtil.getDbGameUnit({})
            const gameUnit2 = TestUtil.getDbGameUnit({})
            expect(
              getGameUnits({
                combat,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    ranged: TestUtil.getDbPlayerCombatRow({
                      units: [gameUnit1],
                    }),
                    weathers: [gameUnit2],
                  }),
                ],
              })
            ).toEqual([])
          })
          it('returns empty array if ranged modifier and weather', () => {
            const gameUnit1 = TestUtil.getDbGameUnit({})
            const gameUnit2 = TestUtil.getDbGameUnit({})
            expect(
              getGameUnits({
                combat,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    ranged: TestUtil.getDbPlayerCombatRow({
                      modifier: gameUnit1,
                    }),
                    weathers: [gameUnit2],
                  }),
                ],
              })
            ).toEqual([])
          })
        })
        describe('siege only', () => {
          it('returns empty array if siege units', () => {
            const gameUnit1 = TestUtil.getDbGameUnit({})
            const gameUnit2 = TestUtil.getDbGameUnit({})
            expect(
              getGameUnits({
                combat,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    siege: TestUtil.getDbPlayerCombatRow({
                      units: [gameUnit1, gameUnit2],
                    }),
                  }),
                ],
              })
            ).toEqual([])
          })
          it('returns empty array if siege unit and modifier', () => {
            const gameUnit1 = TestUtil.getDbGameUnit({})
            const gameUnit2 = TestUtil.getDbGameUnit({})
            expect(
              getGameUnits({
                combat,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    siege: TestUtil.getDbPlayerCombatRow({
                      units: [gameUnit1],
                      modifier: gameUnit2,
                    }),
                  }),
                ],
              })
            ).toEqual([])
          })
          it('returns empty array if siege unit and weather', () => {
            const gameUnit1 = TestUtil.getDbGameUnit({})
            const gameUnit2 = TestUtil.getDbGameUnit({})
            expect(
              getGameUnits({
                combat,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    siege: TestUtil.getDbPlayerCombatRow({
                      units: [gameUnit1],
                    }),
                    weathers: [gameUnit2],
                  }),
                ],
              })
            ).toEqual([])
          })
          it('returns empty array if siege modifier and weather', () => {
            const gameUnit1 = TestUtil.getDbGameUnit({})
            const gameUnit2 = TestUtil.getDbGameUnit({})
            expect(
              getGameUnits({
                combat,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    siege: TestUtil.getDbPlayerCombatRow({
                      modifier: gameUnit1,
                    }),
                    weathers: [gameUnit2],
                  }),
                ],
              })
            ).toEqual([])
          })
        })
        describe('mixed', () => {
          it('returns single item if units', () => {
            const gameUnit1 = TestUtil.getDbGameUnit({})
            const gameUnit2 = TestUtil.getDbGameUnit({})
            const gameUnit3 = TestUtil.getDbGameUnit({})
            expect(
              getGameUnits({
                combat,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    close: TestUtil.getDbPlayerCombatRow({
                      units: [gameUnit1],
                    }),
                    ranged: TestUtil.getDbPlayerCombatRow({
                      units: [gameUnit2],
                    }),
                    siege: TestUtil.getDbPlayerCombatRow({
                      units: [gameUnit3],
                    }),
                  }),
                ],
              })
            ).toEqual([gameUnit1])
          })
          it('returns single item if modifiers', () => {
            const gameUnit1 = TestUtil.getDbGameUnit({})
            const gameUnit2 = TestUtil.getDbGameUnit({})
            const gameUnit3 = TestUtil.getDbGameUnit({})
            expect(
              getGameUnits({
                combat,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    close: TestUtil.getDbPlayerCombatRow({
                      modifier: gameUnit1,
                    }),
                    ranged: TestUtil.getDbPlayerCombatRow({
                      modifier: gameUnit2,
                    }),
                    siege: TestUtil.getDbPlayerCombatRow({
                      modifier: gameUnit3,
                    }),
                  }),
                ],
              })
            ).toEqual([gameUnit1])
          })
          it('returns empty array if weathers', () => {
            const gameUnit1 = TestUtil.getDbGameUnit({})
            const gameUnit2 = TestUtil.getDbGameUnit({})
            expect(
              getGameUnits({
                combat,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    close: TestUtil.getDbPlayerCombatRow({}),
                    weathers: [gameUnit1, gameUnit2],
                  }),
                ],
              })
            ).toEqual([])
          })
          it('returns multiple items if units, modifiers and weathers', () => {
            const gameUnit1 = TestUtil.getDbGameUnit({})
            const gameUnit2 = TestUtil.getDbGameUnit({})
            const gameUnit3 = TestUtil.getDbGameUnit({})
            const gameUnit4 = TestUtil.getDbGameUnit({})
            const gameUnit5 = TestUtil.getDbGameUnit({})
            const gameUnit6 = TestUtil.getDbGameUnit({})
            const gameUnit7 = TestUtil.getDbGameUnit({})
            expect(
              getGameUnits({
                combat,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    close: TestUtil.getDbPlayerCombatRow({
                      units: [gameUnit1],
                      modifier: gameUnit2,
                    }),
                    ranged: TestUtil.getDbPlayerCombatRow({
                      units: [gameUnit3],
                      modifier: gameUnit4,
                    }),
                    siege: TestUtil.getDbPlayerCombatRow({
                      units: [gameUnit5],
                      modifier: gameUnit6,
                    }),
                    weathers: [gameUnit7],
                  }),
                ],
              })
            ).toEqual([gameUnit1, gameUnit2])
          })
        })
      })
    })
    describe('ranged combat', () => {
      const combat = Combat.Ranged
      describe('single unit', () => {
        it('returns empty array if close unit', () => {
          const gameUnit = TestUtil.getDbGameUnit({})
          expect(
            getGameUnits({
              combat,
              rounds: [
                TestUtil.getDbPlayerRound({
                  close: TestUtil.getDbPlayerCombatRow({
                    units: [gameUnit],
                  }),
                }),
              ],
            })
          ).toEqual([])
        })
        it('returns empty array if close modifier', () => {
          const gameUnit = TestUtil.getDbGameUnit({})
          expect(
            getGameUnits({
              combat,
              rounds: [
                TestUtil.getDbPlayerRound({
                  close: TestUtil.getDbPlayerCombatRow({
                    modifier: gameUnit,
                  }),
                }),
              ],
            })
          ).toEqual([])
        })
        it('returns single item if ranged unit', () => {
          const gameUnit = TestUtil.getDbGameUnit({})
          expect(
            getGameUnits({
              combat,
              rounds: [
                TestUtil.getDbPlayerRound({
                  ranged: TestUtil.getDbPlayerCombatRow({
                    units: [gameUnit],
                  }),
                }),
              ],
            })
          ).toEqual([gameUnit])
        })
        it('returns single item if ranged modifier', () => {
          const gameUnit = TestUtil.getDbGameUnit({})
          expect(
            getGameUnits({
              combat,
              rounds: [
                TestUtil.getDbPlayerRound({
                  ranged: TestUtil.getDbPlayerCombatRow({
                    modifier: gameUnit,
                  }),
                }),
              ],
            })
          ).toEqual([gameUnit])
        })
        it('returns empty array if siege unit', () => {
          const gameUnit = TestUtil.getDbGameUnit({})
          expect(
            getGameUnits({
              combat,
              rounds: [
                TestUtil.getDbPlayerRound({
                  siege: TestUtil.getDbPlayerCombatRow({
                    units: [gameUnit],
                  }),
                }),
              ],
            })
          ).toEqual([])
        })
        it('returns empty array if siege modifier', () => {
          const gameUnit = TestUtil.getDbGameUnit({})
          expect(
            getGameUnits({
              combat,
              rounds: [
                TestUtil.getDbPlayerRound({
                  siege: TestUtil.getDbPlayerCombatRow({
                    modifier: gameUnit,
                  }),
                }),
              ],
            })
          ).toEqual([])
        })
      })
      describe('multiple units', () => {
        describe('close only', () => {
          it('returns empty array if close units', () => {
            const gameUnit1 = TestUtil.getDbGameUnit({})
            const gameUnit2 = TestUtil.getDbGameUnit({})
            expect(
              getGameUnits({
                combat,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    close: TestUtil.getDbPlayerCombatRow({
                      units: [gameUnit1, gameUnit2],
                    }),
                  }),
                ],
              })
            ).toEqual([])
          })
          it('returns empty array if close unit and modifier', () => {
            const gameUnit1 = TestUtil.getDbGameUnit({})
            const gameUnit2 = TestUtil.getDbGameUnit({})
            expect(
              getGameUnits({
                combat,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    close: TestUtil.getDbPlayerCombatRow({
                      units: [gameUnit1],
                      modifier: gameUnit2,
                    }),
                  }),
                ],
              })
            ).toEqual([])
          })
          it('returns empty array if close unit and weather', () => {
            const gameUnit1 = TestUtil.getDbGameUnit({})
            const gameUnit2 = TestUtil.getDbGameUnit({})
            expect(
              getGameUnits({
                combat,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    close: TestUtil.getDbPlayerCombatRow({
                      units: [gameUnit1],
                    }),
                    weathers: [gameUnit2],
                  }),
                ],
              })
            ).toEqual([])
          })
          it('returns empty array if close modifier and weather', () => {
            const gameUnit1 = TestUtil.getDbGameUnit({})
            const gameUnit2 = TestUtil.getDbGameUnit({})
            expect(
              getGameUnits({
                combat,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    close: TestUtil.getDbPlayerCombatRow({
                      modifier: gameUnit1,
                    }),
                    weathers: [gameUnit2],
                  }),
                ],
              })
            ).toEqual([])
          })
        })
        describe('ranged only', () => {
          it('returns multiple items if ranged units', () => {
            const gameUnit1 = TestUtil.getDbGameUnit({})
            const gameUnit2 = TestUtil.getDbGameUnit({})
            expect(
              getGameUnits({
                combat,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    ranged: TestUtil.getDbPlayerCombatRow({
                      units: [gameUnit1, gameUnit2],
                    }),
                  }),
                ],
              })
            ).toEqual([gameUnit1, gameUnit2])
          })
          it('returns multiple items if ranged unit and modifier', () => {
            const gameUnit1 = TestUtil.getDbGameUnit({})
            const gameUnit2 = TestUtil.getDbGameUnit({})
            expect(
              getGameUnits({
                combat,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    ranged: TestUtil.getDbPlayerCombatRow({
                      units: [gameUnit1],
                      modifier: gameUnit2,
                    }),
                  }),
                ],
              })
            ).toEqual([gameUnit1, gameUnit2])
          })
          it('returns single item if ranged unit and weather', () => {
            const gameUnit1 = TestUtil.getDbGameUnit({})
            const gameUnit2 = TestUtil.getDbGameUnit({})
            expect(
              getGameUnits({
                combat,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    ranged: TestUtil.getDbPlayerCombatRow({
                      units: [gameUnit1],
                    }),
                    weathers: [gameUnit2],
                  }),
                ],
              })
            ).toEqual([gameUnit1])
          })
          it('returns single item if ranged modifier and weather', () => {
            const gameUnit1 = TestUtil.getDbGameUnit({})
            const gameUnit2 = TestUtil.getDbGameUnit({})
            expect(
              getGameUnits({
                combat,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    ranged: TestUtil.getDbPlayerCombatRow({
                      modifier: gameUnit1,
                    }),
                    weathers: [gameUnit2],
                  }),
                ],
              })
            ).toEqual([gameUnit1])
          })
        })
        describe('siege only', () => {
          it('returns empty array if siege units', () => {
            const gameUnit1 = TestUtil.getDbGameUnit({})
            const gameUnit2 = TestUtil.getDbGameUnit({})
            expect(
              getGameUnits({
                combat,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    siege: TestUtil.getDbPlayerCombatRow({
                      units: [gameUnit1, gameUnit2],
                    }),
                  }),
                ],
              })
            ).toEqual([])
          })
          it('returns empty array if siege unit and modifier', () => {
            const gameUnit1 = TestUtil.getDbGameUnit({})
            const gameUnit2 = TestUtil.getDbGameUnit({})
            expect(
              getGameUnits({
                combat,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    siege: TestUtil.getDbPlayerCombatRow({
                      units: [gameUnit1],
                      modifier: gameUnit2,
                    }),
                  }),
                ],
              })
            ).toEqual([])
          })
          it('returns empty array if siege unit and weather', () => {
            const gameUnit1 = TestUtil.getDbGameUnit({})
            const gameUnit2 = TestUtil.getDbGameUnit({})
            expect(
              getGameUnits({
                combat,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    siege: TestUtil.getDbPlayerCombatRow({
                      units: [gameUnit1],
                    }),
                    weathers: [gameUnit2],
                  }),
                ],
              })
            ).toEqual([])
          })
          it('returns empty array if siege modifier and weather', () => {
            const gameUnit1 = TestUtil.getDbGameUnit({})
            const gameUnit2 = TestUtil.getDbGameUnit({})
            expect(
              getGameUnits({
                combat,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    siege: TestUtil.getDbPlayerCombatRow({
                      modifier: gameUnit1,
                    }),
                    weathers: [gameUnit2],
                  }),
                ],
              })
            ).toEqual([])
          })
        })
        describe('mixed', () => {
          it('returns single item if units', () => {
            const gameUnit1 = TestUtil.getDbGameUnit({})
            const gameUnit2 = TestUtil.getDbGameUnit({})
            const gameUnit3 = TestUtil.getDbGameUnit({})
            expect(
              getGameUnits({
                combat,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    close: TestUtil.getDbPlayerCombatRow({
                      units: [gameUnit1],
                    }),
                    ranged: TestUtil.getDbPlayerCombatRow({
                      units: [gameUnit2],
                    }),
                    siege: TestUtil.getDbPlayerCombatRow({
                      units: [gameUnit3],
                    }),
                  }),
                ],
              })
            ).toEqual([gameUnit2])
          })
          it('returns single item if modifiers', () => {
            const gameUnit1 = TestUtil.getDbGameUnit({})
            const gameUnit2 = TestUtil.getDbGameUnit({})
            const gameUnit3 = TestUtil.getDbGameUnit({})
            expect(
              getGameUnits({
                combat,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    close: TestUtil.getDbPlayerCombatRow({
                      modifier: gameUnit1,
                    }),
                    ranged: TestUtil.getDbPlayerCombatRow({
                      modifier: gameUnit2,
                    }),
                    siege: TestUtil.getDbPlayerCombatRow({
                      modifier: gameUnit3,
                    }),
                  }),
                ],
              })
            ).toEqual([gameUnit2])
          })
          it('returns empty array if weathers', () => {
            const gameUnit1 = TestUtil.getDbGameUnit({})
            const gameUnit2 = TestUtil.getDbGameUnit({})
            expect(
              getGameUnits({
                combat,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    close: TestUtil.getDbPlayerCombatRow({}),
                    weathers: [gameUnit1, gameUnit2],
                  }),
                ],
              })
            ).toEqual([])
          })
          it('returns multiple items if units, modifiers and weathers', () => {
            const gameUnit1 = TestUtil.getDbGameUnit({})
            const gameUnit2 = TestUtil.getDbGameUnit({})
            const gameUnit3 = TestUtil.getDbGameUnit({})
            const gameUnit4 = TestUtil.getDbGameUnit({})
            const gameUnit5 = TestUtil.getDbGameUnit({})
            const gameUnit6 = TestUtil.getDbGameUnit({})
            const gameUnit7 = TestUtil.getDbGameUnit({})
            expect(
              getGameUnits({
                combat,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    close: TestUtil.getDbPlayerCombatRow({
                      units: [gameUnit1],
                      modifier: gameUnit2,
                    }),
                    ranged: TestUtil.getDbPlayerCombatRow({
                      units: [gameUnit3],
                      modifier: gameUnit4,
                    }),
                    siege: TestUtil.getDbPlayerCombatRow({
                      units: [gameUnit5],
                      modifier: gameUnit6,
                    }),
                    weathers: [gameUnit7],
                  }),
                ],
              })
            ).toEqual([gameUnit3, gameUnit4])
          })
        })
      })
    })
    describe('siege combat', () => {
      const combat = Combat.Siege
      describe('single unit', () => {
        it('returns empty array if close unit', () => {
          const gameUnit = TestUtil.getDbGameUnit({})
          expect(
            getGameUnits({
              combat,
              rounds: [
                TestUtil.getDbPlayerRound({
                  close: TestUtil.getDbPlayerCombatRow({
                    units: [gameUnit],
                  }),
                }),
              ],
            })
          ).toEqual([])
        })
        it('returns empty array if close modifier', () => {
          const gameUnit = TestUtil.getDbGameUnit({})
          expect(
            getGameUnits({
              combat,
              rounds: [
                TestUtil.getDbPlayerRound({
                  close: TestUtil.getDbPlayerCombatRow({
                    modifier: gameUnit,
                  }),
                }),
              ],
            })
          ).toEqual([])
        })
        it('returns empty array if ranged unit', () => {
          const gameUnit = TestUtil.getDbGameUnit({})
          expect(
            getGameUnits({
              combat,
              rounds: [
                TestUtil.getDbPlayerRound({
                  ranged: TestUtil.getDbPlayerCombatRow({
                    units: [gameUnit],
                  }),
                }),
              ],
            })
          ).toEqual([])
        })
        it('returns empty array if ranged modifier', () => {
          const gameUnit = TestUtil.getDbGameUnit({})
          expect(
            getGameUnits({
              combat,
              rounds: [
                TestUtil.getDbPlayerRound({
                  ranged: TestUtil.getDbPlayerCombatRow({
                    modifier: gameUnit,
                  }),
                }),
              ],
            })
          ).toEqual([])
        })
        it('returns single item if siege unit', () => {
          const gameUnit = TestUtil.getDbGameUnit({})
          expect(
            getGameUnits({
              combat,
              rounds: [
                TestUtil.getDbPlayerRound({
                  siege: TestUtil.getDbPlayerCombatRow({
                    units: [gameUnit],
                  }),
                }),
              ],
            })
          ).toEqual([gameUnit])
        })
        it('returns single item if siege modifier', () => {
          const gameUnit = TestUtil.getDbGameUnit({})
          expect(
            getGameUnits({
              combat,
              rounds: [
                TestUtil.getDbPlayerRound({
                  siege: TestUtil.getDbPlayerCombatRow({
                    modifier: gameUnit,
                  }),
                }),
              ],
            })
          ).toEqual([gameUnit])
        })
      })
      describe('multiple units', () => {
        describe('close only', () => {
          it('returns empty array if close units', () => {
            const gameUnit1 = TestUtil.getDbGameUnit({})
            const gameUnit2 = TestUtil.getDbGameUnit({})
            expect(
              getGameUnits({
                combat,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    close: TestUtil.getDbPlayerCombatRow({
                      units: [gameUnit1, gameUnit2],
                    }),
                  }),
                ],
              })
            ).toEqual([])
          })
          it('returns empty array if close unit and modifier', () => {
            const gameUnit1 = TestUtil.getDbGameUnit({})
            const gameUnit2 = TestUtil.getDbGameUnit({})
            expect(
              getGameUnits({
                combat,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    close: TestUtil.getDbPlayerCombatRow({
                      units: [gameUnit1],
                      modifier: gameUnit2,
                    }),
                  }),
                ],
              })
            ).toEqual([])
          })
          it('returns empty array if close unit and weather', () => {
            const gameUnit1 = TestUtil.getDbGameUnit({})
            const gameUnit2 = TestUtil.getDbGameUnit({})
            expect(
              getGameUnits({
                combat,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    close: TestUtil.getDbPlayerCombatRow({
                      units: [gameUnit1],
                    }),
                    weathers: [gameUnit2],
                  }),
                ],
              })
            ).toEqual([])
          })
          it('returns empty array if close modifier and weather', () => {
            const gameUnit1 = TestUtil.getDbGameUnit({})
            const gameUnit2 = TestUtil.getDbGameUnit({})
            expect(
              getGameUnits({
                combat,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    close: TestUtil.getDbPlayerCombatRow({
                      modifier: gameUnit1,
                    }),
                    weathers: [gameUnit2],
                  }),
                ],
              })
            ).toEqual([])
          })
        })
        describe('ranged only', () => {
          it('returns empty array if ranged units', () => {
            const gameUnit1 = TestUtil.getDbGameUnit({})
            const gameUnit2 = TestUtil.getDbGameUnit({})
            expect(
              getGameUnits({
                combat,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    ranged: TestUtil.getDbPlayerCombatRow({
                      units: [gameUnit1, gameUnit2],
                    }),
                  }),
                ],
              })
            ).toEqual([])
          })
          it('returns empty array if ranged unit and modifier', () => {
            const gameUnit1 = TestUtil.getDbGameUnit({})
            const gameUnit2 = TestUtil.getDbGameUnit({})
            expect(
              getGameUnits({
                combat,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    ranged: TestUtil.getDbPlayerCombatRow({
                      units: [gameUnit1],
                      modifier: gameUnit2,
                    }),
                  }),
                ],
              })
            ).toEqual([])
          })
          it('returns empty array if ranged unit and weather', () => {
            const gameUnit1 = TestUtil.getDbGameUnit({})
            const gameUnit2 = TestUtil.getDbGameUnit({})
            expect(
              getGameUnits({
                combat,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    ranged: TestUtil.getDbPlayerCombatRow({
                      units: [gameUnit1],
                    }),
                    weathers: [gameUnit2],
                  }),
                ],
              })
            ).toEqual([])
          })
          it('returns empty array if ranged modifier and weather', () => {
            const gameUnit1 = TestUtil.getDbGameUnit({})
            const gameUnit2 = TestUtil.getDbGameUnit({})
            expect(
              getGameUnits({
                combat,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    ranged: TestUtil.getDbPlayerCombatRow({
                      modifier: gameUnit1,
                    }),
                    weathers: [gameUnit2],
                  }),
                ],
              })
            ).toEqual([])
          })
        })
        describe('siege only', () => {
          it('returns multiple items if siege units', () => {
            const gameUnit1 = TestUtil.getDbGameUnit({})
            const gameUnit2 = TestUtil.getDbGameUnit({})
            expect(
              getGameUnits({
                combat,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    siege: TestUtil.getDbPlayerCombatRow({
                      units: [gameUnit1, gameUnit2],
                    }),
                  }),
                ],
              })
            ).toEqual([gameUnit1, gameUnit2])
          })
          it('returns multiple items if siege unit and modifier', () => {
            const gameUnit1 = TestUtil.getDbGameUnit({})
            const gameUnit2 = TestUtil.getDbGameUnit({})
            expect(
              getGameUnits({
                combat,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    siege: TestUtil.getDbPlayerCombatRow({
                      units: [gameUnit1],
                      modifier: gameUnit2,
                    }),
                  }),
                ],
              })
            ).toEqual([gameUnit1, gameUnit2])
          })
          it('returns single item if siege unit and weather', () => {
            const gameUnit1 = TestUtil.getDbGameUnit({})
            const gameUnit2 = TestUtil.getDbGameUnit({})
            expect(
              getGameUnits({
                combat,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    siege: TestUtil.getDbPlayerCombatRow({
                      units: [gameUnit1],
                    }),
                    weathers: [gameUnit2],
                  }),
                ],
              })
            ).toEqual([gameUnit1])
          })
          it('returns single item if siege modifier and weather', () => {
            const gameUnit1 = TestUtil.getDbGameUnit({})
            const gameUnit2 = TestUtil.getDbGameUnit({})
            expect(
              getGameUnits({
                combat,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    siege: TestUtil.getDbPlayerCombatRow({
                      modifier: gameUnit1,
                    }),
                    weathers: [gameUnit2],
                  }),
                ],
              })
            ).toEqual([gameUnit1])
          })
        })
        describe('mixed', () => {
          it('returns single item if units', () => {
            const gameUnit1 = TestUtil.getDbGameUnit({})
            const gameUnit2 = TestUtil.getDbGameUnit({})
            const gameUnit3 = TestUtil.getDbGameUnit({})
            expect(
              getGameUnits({
                combat,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    close: TestUtil.getDbPlayerCombatRow({
                      units: [gameUnit1],
                    }),
                    ranged: TestUtil.getDbPlayerCombatRow({
                      units: [gameUnit2],
                    }),
                    siege: TestUtil.getDbPlayerCombatRow({
                      units: [gameUnit3],
                    }),
                  }),
                ],
              })
            ).toEqual([gameUnit3])
          })
          it('returns single item if modifiers', () => {
            const gameUnit1 = TestUtil.getDbGameUnit({})
            const gameUnit2 = TestUtil.getDbGameUnit({})
            const gameUnit3 = TestUtil.getDbGameUnit({})
            expect(
              getGameUnits({
                combat,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    close: TestUtil.getDbPlayerCombatRow({
                      modifier: gameUnit1,
                    }),
                    ranged: TestUtil.getDbPlayerCombatRow({
                      modifier: gameUnit2,
                    }),
                    siege: TestUtil.getDbPlayerCombatRow({
                      modifier: gameUnit3,
                    }),
                  }),
                ],
              })
            ).toEqual([gameUnit3])
          })
          it('returns empty array if weathers', () => {
            const gameUnit1 = TestUtil.getDbGameUnit({})
            const gameUnit2 = TestUtil.getDbGameUnit({})
            expect(
              getGameUnits({
                combat,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    close: TestUtil.getDbPlayerCombatRow({}),
                    weathers: [gameUnit1, gameUnit2],
                  }),
                ],
              })
            ).toEqual([])
          })
          it('returns multiple items if units, modifiers and weathers', () => {
            const gameUnit1 = TestUtil.getDbGameUnit({})
            const gameUnit2 = TestUtil.getDbGameUnit({})
            const gameUnit3 = TestUtil.getDbGameUnit({})
            const gameUnit4 = TestUtil.getDbGameUnit({})
            const gameUnit5 = TestUtil.getDbGameUnit({})
            const gameUnit6 = TestUtil.getDbGameUnit({})
            const gameUnit7 = TestUtil.getDbGameUnit({})
            expect(
              getGameUnits({
                combat,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    close: TestUtil.getDbPlayerCombatRow({
                      units: [gameUnit1],
                      modifier: gameUnit2,
                    }),
                    ranged: TestUtil.getDbPlayerCombatRow({
                      units: [gameUnit3],
                      modifier: gameUnit4,
                    }),
                    siege: TestUtil.getDbPlayerCombatRow({
                      units: [gameUnit5],
                      modifier: gameUnit6,
                    }),
                    weathers: [gameUnit7],
                  }),
                ],
              })
            ).toEqual([gameUnit5, gameUnit6])
          })
        })
      })
    })
  })
  describe('multiple rounds', () => {
    it('returns empty array if no units', () => {
      expect(
        getGameUnits({
          rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
        })
      ).toEqual([])
    })
    it('returns multiple items if single unique of each', () => {
      const gameUnit1 = TestUtil.getDbGameUnit({})
      const gameUnit2 = TestUtil.getDbGameUnit({})
      const gameUnit3 = TestUtil.getDbGameUnit({})
      const gameUnit4 = TestUtil.getDbGameUnit({})
      const gameUnit5 = TestUtil.getDbGameUnit({})
      const gameUnit6 = TestUtil.getDbGameUnit({})
      const gameUnit7 = TestUtil.getDbGameUnit({})
      const gameUnit8 = TestUtil.getDbGameUnit({})
      const gameUnit9 = TestUtil.getDbGameUnit({})
      const gameUnit10 = TestUtil.getDbGameUnit({})
      const gameUnit11 = TestUtil.getDbGameUnit({})
      const gameUnit12 = TestUtil.getDbGameUnit({})
      const gameUnit13 = TestUtil.getDbGameUnit({})
      const gameUnit14 = TestUtil.getDbGameUnit({})
      expect(
        getGameUnits({
          rounds: [
            TestUtil.getDbPlayerRound({
              close: {
                units: [gameUnit1],
                modifier: gameUnit2,
              },
              ranged: {
                units: [gameUnit3],
                modifier: gameUnit4,
              },
              siege: {
                units: [gameUnit5],
                modifier: gameUnit6,
              },
              weathers: [gameUnit7],
            }),
            TestUtil.getDbPlayerRound({
              close: {
                units: [gameUnit8],
                modifier: gameUnit9,
              },
              ranged: {
                units: [gameUnit10],
                modifier: gameUnit11,
              },
              siege: {
                units: [gameUnit12],
                modifier: gameUnit13,
              },
              weathers: [gameUnit14],
            }),
          ],
        })
      ).toEqual([
        gameUnit1,
        gameUnit2,
        gameUnit3,
        gameUnit4,
        gameUnit5,
        gameUnit6,
        gameUnit7,
        gameUnit8,
        gameUnit9,
        gameUnit10,
        gameUnit11,
        gameUnit12,
        gameUnit13,
        gameUnit14,
      ])
    })
    it('returns multiple duplicate items if single duplicate of each', () => {
      const gameUnit1 = TestUtil.getDbGameUnit({})
      const gameUnit2 = TestUtil.getDbGameUnit({})
      const gameUnit3 = TestUtil.getDbGameUnit({})
      const gameUnit4 = TestUtil.getDbGameUnit({})
      const gameUnit5 = TestUtil.getDbGameUnit({})
      const gameUnit6 = TestUtil.getDbGameUnit({})
      const gameUnit7 = TestUtil.getDbGameUnit({})
      expect(
        getGameUnits({
          rounds: [
            TestUtil.getDbPlayerRound({
              close: {
                units: [gameUnit1],
                modifier: gameUnit2,
              },
              ranged: {
                units: [gameUnit3],
                modifier: gameUnit4,
              },
              siege: {
                units: [gameUnit5],
                modifier: gameUnit6,
              },
              weathers: [gameUnit7],
            }),
            TestUtil.getDbPlayerRound({
              close: {
                units: [gameUnit1],
                modifier: gameUnit2,
              },
              ranged: {
                units: [gameUnit3],
                modifier: gameUnit4,
              },
              siege: {
                units: [gameUnit5],
                modifier: gameUnit6,
              },
              weathers: [gameUnit7],
            }),
          ],
        })
      ).toEqual([
        gameUnit1,
        gameUnit2,
        gameUnit3,
        gameUnit4,
        gameUnit5,
        gameUnit6,
        gameUnit7,
        gameUnit1,
        gameUnit2,
        gameUnit3,
        gameUnit4,
        gameUnit5,
        gameUnit6,
        gameUnit7,
      ])
    })
    it('returns multiple items if close combat', () => {
      const gameUnit1 = TestUtil.getDbGameUnit({})
      const gameUnit2 = TestUtil.getDbGameUnit({})
      const gameUnit3 = TestUtil.getDbGameUnit({})
      const gameUnit4 = TestUtil.getDbGameUnit({})
      const gameUnit5 = TestUtil.getDbGameUnit({})
      const gameUnit6 = TestUtil.getDbGameUnit({})
      const gameUnit7 = TestUtil.getDbGameUnit({})
      const gameUnit8 = TestUtil.getDbGameUnit({})
      const gameUnit9 = TestUtil.getDbGameUnit({})
      const gameUnit10 = TestUtil.getDbGameUnit({})
      const gameUnit11 = TestUtil.getDbGameUnit({})
      const gameUnit12 = TestUtil.getDbGameUnit({})
      const gameUnit13 = TestUtil.getDbGameUnit({})
      const gameUnit14 = TestUtil.getDbGameUnit({})
      expect(
        getGameUnits({
          combat: Combat.Close,
          rounds: [
            TestUtil.getDbPlayerRound({
              close: {
                units: [gameUnit1],
                modifier: gameUnit2,
              },
              ranged: {
                units: [gameUnit3],
                modifier: gameUnit4,
              },
              siege: {
                units: [gameUnit5],
                modifier: gameUnit6,
              },
              weathers: [gameUnit7],
            }),
            TestUtil.getDbPlayerRound({
              close: {
                units: [gameUnit8],
                modifier: gameUnit9,
              },
              ranged: {
                units: [gameUnit10],
                modifier: gameUnit11,
              },
              siege: {
                units: [gameUnit12],
                modifier: gameUnit13,
              },
              weathers: [gameUnit14],
            }),
          ],
        })
      ).toEqual([gameUnit1, gameUnit2, gameUnit8, gameUnit9])
    })
    it('returns multiple items if ranged combat', () => {
      const gameUnit1 = TestUtil.getDbGameUnit({})
      const gameUnit2 = TestUtil.getDbGameUnit({})
      const gameUnit3 = TestUtil.getDbGameUnit({})
      const gameUnit4 = TestUtil.getDbGameUnit({})
      const gameUnit5 = TestUtil.getDbGameUnit({})
      const gameUnit6 = TestUtil.getDbGameUnit({})
      const gameUnit7 = TestUtil.getDbGameUnit({})
      const gameUnit8 = TestUtil.getDbGameUnit({})
      const gameUnit9 = TestUtil.getDbGameUnit({})
      const gameUnit10 = TestUtil.getDbGameUnit({})
      const gameUnit11 = TestUtil.getDbGameUnit({})
      const gameUnit12 = TestUtil.getDbGameUnit({})
      const gameUnit13 = TestUtil.getDbGameUnit({})
      const gameUnit14 = TestUtil.getDbGameUnit({})
      expect(
        getGameUnits({
          combat: Combat.Ranged,
          rounds: [
            TestUtil.getDbPlayerRound({
              close: {
                units: [gameUnit1],
                modifier: gameUnit2,
              },
              ranged: {
                units: [gameUnit3],
                modifier: gameUnit4,
              },
              siege: {
                units: [gameUnit5],
                modifier: gameUnit6,
              },
              weathers: [gameUnit7],
            }),
            TestUtil.getDbPlayerRound({
              close: {
                units: [gameUnit8],
                modifier: gameUnit9,
              },
              ranged: {
                units: [gameUnit10],
                modifier: gameUnit11,
              },
              siege: {
                units: [gameUnit12],
                modifier: gameUnit13,
              },
              weathers: [gameUnit14],
            }),
          ],
        })
      ).toEqual([gameUnit3, gameUnit4, gameUnit10, gameUnit11])
    })
    it('returns multiple items if siege combat', () => {
      const gameUnit1 = TestUtil.getDbGameUnit({})
      const gameUnit2 = TestUtil.getDbGameUnit({})
      const gameUnit3 = TestUtil.getDbGameUnit({})
      const gameUnit4 = TestUtil.getDbGameUnit({})
      const gameUnit5 = TestUtil.getDbGameUnit({})
      const gameUnit6 = TestUtil.getDbGameUnit({})
      const gameUnit7 = TestUtil.getDbGameUnit({})
      const gameUnit8 = TestUtil.getDbGameUnit({})
      const gameUnit9 = TestUtil.getDbGameUnit({})
      const gameUnit10 = TestUtil.getDbGameUnit({})
      const gameUnit11 = TestUtil.getDbGameUnit({})
      const gameUnit12 = TestUtil.getDbGameUnit({})
      const gameUnit13 = TestUtil.getDbGameUnit({})
      const gameUnit14 = TestUtil.getDbGameUnit({})
      expect(
        getGameUnits({
          combat: Combat.Siege,
          rounds: [
            TestUtil.getDbPlayerRound({
              close: {
                units: [gameUnit1],
                modifier: gameUnit2,
              },
              ranged: {
                units: [gameUnit3],
                modifier: gameUnit4,
              },
              siege: {
                units: [gameUnit5],
                modifier: gameUnit6,
              },
              weathers: [gameUnit7],
            }),
            TestUtil.getDbPlayerRound({
              close: {
                units: [gameUnit8],
                modifier: gameUnit9,
              },
              ranged: {
                units: [gameUnit10],
                modifier: gameUnit11,
              },
              siege: {
                units: [gameUnit12],
                modifier: gameUnit13,
              },
              weathers: [gameUnit14],
            }),
          ],
        })
      ).toEqual([gameUnit5, gameUnit6, gameUnit12, gameUnit13])
    })
  })
})
