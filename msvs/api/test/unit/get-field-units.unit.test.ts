import { ObjectId } from 'mongodb'

import { Combat, FieldUnitDbObject, GameDbObject } from '@gwent-oss/graphql-schema/database-typings'
import GetFieldUnits from '../../src/graphql/resolvers/util/get-field-units'
import TestUtil from '../util/test-util'

describe('GetFieldUnits', () => {
  describe('getFieldUnit', () => {
    it('throws error if player not on game', () => {
      const fieldUnit = TestUtil.getDbFieldUnit({})
      const player = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              units: [fieldUnit],
              modifier: TestUtil.getDbFieldUnit({}),
            }),
            ranged: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
              modifier: TestUtil.getDbFieldUnit({}),
            }),
            siege: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
              modifier: TestUtil.getDbFieldUnit({}),
            }),
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [player],
        round: 1,
      })
      const userId = new ObjectId()
      testGetFieldUnit({
        game,
        userId,
        unitId: fieldUnit.unit,
        expected: Error(`Could not find player "${userId}" on game "${game._id}"`),
      })
    })
    it('throws error if more than 1 player on game', () => {
      const fieldUnit = TestUtil.getDbFieldUnit({})
      const player = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              units: [fieldUnit],
              modifier: TestUtil.getDbFieldUnit({}),
            }),
            ranged: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
              modifier: TestUtil.getDbFieldUnit({}),
            }),
            siege: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
              modifier: TestUtil.getDbFieldUnit({}),
            }),
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [player, player],
        round: 1,
      })
      testGetFieldUnit({
        game,
        userId: player.user,
        unitId: fieldUnit.unit,
        expected: Error(
          `Found more than 1 player with ID "${player.user}" on game "${game._id}": "${JSON.stringify(game.players)}"`
        ),
      })
    })
    it('returns undefined if FieldUnit not found', () => {
      const fieldUnit = TestUtil.getDbFieldUnit({})
      const player = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              units: [fieldUnit],
              modifier: TestUtil.getDbFieldUnit({}),
            }),
            ranged: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
              modifier: TestUtil.getDbFieldUnit({}),
            }),
            siege: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
              modifier: TestUtil.getDbFieldUnit({}),
            }),
          }),
        ],
      })
      testGetFieldUnit({
        game: TestUtil.getDbGame({
          players: [player],
          round: 1,
        }),
        userId: player.user,
        unitId: new ObjectId(),
        expected: undefined,
      })
    })
    it('returns FieldUnit if in close row', () => {
      const fieldUnit = TestUtil.getDbFieldUnit({})
      const player = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              units: [fieldUnit],
              modifier: TestUtil.getDbFieldUnit({}),
            }),
            ranged: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
              modifier: TestUtil.getDbFieldUnit({}),
            }),
            siege: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
              modifier: TestUtil.getDbFieldUnit({}),
            }),
          }),
        ],
      })
      testGetFieldUnit({
        game: TestUtil.getDbGame({
          players: [player],
          round: 1,
        }),
        userId: player.user,
        unitId: fieldUnit.unit,
        expected: fieldUnit,
      })
    })
    it('returns FieldUnit if in close modifier', () => {
      const fieldUnit = TestUtil.getDbFieldUnit({})
      const player = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
              modifier: fieldUnit,
            }),
            ranged: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
              modifier: TestUtil.getDbFieldUnit({}),
            }),
            siege: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
              modifier: TestUtil.getDbFieldUnit({}),
            }),
          }),
        ],
      })
      testGetFieldUnit({
        game: TestUtil.getDbGame({
          players: [player],
          round: 1,
        }),
        userId: player.user,
        unitId: fieldUnit.unit,
        expected: fieldUnit,
      })
    })
    it('returns FieldUnit if in ranged row', () => {
      const fieldUnit = TestUtil.getDbFieldUnit({})
      const player = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
              modifier: TestUtil.getDbFieldUnit({}),
            }),
            ranged: TestUtil.getDbPlayerCombatRow({
              units: [fieldUnit],
              modifier: TestUtil.getDbFieldUnit({}),
            }),
            siege: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
              modifier: TestUtil.getDbFieldUnit({}),
            }),
          }),
        ],
      })
      testGetFieldUnit({
        game: TestUtil.getDbGame({
          players: [player],
          round: 1,
        }),
        userId: player.user,
        unitId: fieldUnit.unit,
        expected: fieldUnit,
      })
    })
    it('returns FieldUnit if in ranged modifier', () => {
      const fieldUnit = TestUtil.getDbFieldUnit({})
      const player = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
              modifier: TestUtil.getDbFieldUnit({}),
            }),
            ranged: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
              modifier: fieldUnit,
            }),
            siege: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
              modifier: TestUtil.getDbFieldUnit({}),
            }),
          }),
        ],
      })
      testGetFieldUnit({
        game: TestUtil.getDbGame({
          players: [player],
          round: 1,
        }),
        userId: player.user,
        unitId: fieldUnit.unit,
        expected: fieldUnit,
      })
    })
    it('returns FieldUnit if in siege row', () => {
      const fieldUnit = TestUtil.getDbFieldUnit({})
      const player = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
              modifier: TestUtil.getDbFieldUnit({}),
            }),
            ranged: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
              modifier: TestUtil.getDbFieldUnit({}),
            }),
            siege: TestUtil.getDbPlayerCombatRow({
              units: [fieldUnit],
              modifier: TestUtil.getDbFieldUnit({}),
            }),
          }),
        ],
      })
      testGetFieldUnit({
        game: TestUtil.getDbGame({
          players: [player],
          round: 1,
        }),
        userId: player.user,
        unitId: fieldUnit.unit,
        expected: fieldUnit,
      })
    })
    it('returns FieldUnit if in siege modifier', () => {
      const fieldUnit = TestUtil.getDbFieldUnit({})
      const player = TestUtil.getDbGamePlayer({
        rounds: [
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
              modifier: TestUtil.getDbFieldUnit({}),
            }),
            ranged: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
              modifier: TestUtil.getDbFieldUnit({}),
            }),
            siege: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbFieldUnit({})],
              modifier: fieldUnit,
            }),
          }),
        ],
      })
      testGetFieldUnit({
        game: TestUtil.getDbGame({
          players: [player],
          round: 1,
        }),
        userId: player.user,
        unitId: fieldUnit.unit,
        expected: fieldUnit,
      })
    })
  })
  describe('fromRow', () => {
    it('returns empty array if no FieldUnits', () => {
      expect(
        GetFieldUnits.fromRow({
          row: TestUtil.getDbPlayerCombatRow({}),
        })
      ).toEqual([])
    })
    it('returns single FieldUnit if in row', () => {
      const fieldUnit = TestUtil.getDbFieldUnit({})
      expect(
        GetFieldUnits.fromRow({
          row: TestUtil.getDbPlayerCombatRow({
            units: [fieldUnit],
          }),
        })
      ).toEqual([fieldUnit])
    })
    it('returns single FieldUnit if modifier', () => {
      const fieldUnit = TestUtil.getDbFieldUnit({})
      expect(
        GetFieldUnits.fromRow({
          row: TestUtil.getDbPlayerCombatRow({
            modifier: fieldUnit,
          }),
        })
      ).toEqual([fieldUnit])
    })
    it('returns multiple FieldUnits if in row', () => {
      const fieldUnit1 = TestUtil.getDbFieldUnit({})
      const fieldUnit2 = TestUtil.getDbFieldUnit({})
      expect(
        GetFieldUnits.fromRow({
          row: TestUtil.getDbPlayerCombatRow({
            units: [fieldUnit1, fieldUnit2],
          }),
        })
      ).toEqual([fieldUnit1, fieldUnit2])
    })
    it('returns multiple FieldUnits if one in row and modifier', () => {
      const fieldUnit1 = TestUtil.getDbFieldUnit({})
      const fieldUnit2 = TestUtil.getDbFieldUnit({})
      expect(
        GetFieldUnits.fromRow({
          row: TestUtil.getDbPlayerCombatRow({
            units: [fieldUnit1],
            modifier: fieldUnit2,
          }),
        })
      ).toEqual([fieldUnit1, fieldUnit2])
    })
    it('returns multiple FieldUnits if multiple in row and modifier', () => {
      const fieldUnit1 = TestUtil.getDbFieldUnit({})
      const fieldUnit2 = TestUtil.getDbFieldUnit({})
      const fieldUnit3 = TestUtil.getDbFieldUnit({})
      expect(
        GetFieldUnits.fromRow({
          row: TestUtil.getDbPlayerCombatRow({
            units: [fieldUnit1, fieldUnit2],
            modifier: fieldUnit3,
          }),
        })
      ).toEqual([fieldUnit1, fieldUnit2, fieldUnit3])
    })
  })
  describe('fromRounds', () => {
    it('returns empty array if rounds empty', () => {
      expect(
        GetFieldUnits.fromRounds({
          rounds: [],
        })
      ).toEqual([])
    })
    describe('single round', () => {
      it('returns empty array if no units', () => {
        expect(
          GetFieldUnits.fromRounds({
            rounds: [TestUtil.getDbPlayerRound({})],
          })
        ).toEqual([])
      })
      describe('no combat', () => {
        describe('single unit', () => {
          it('returns single item if close unit', () => {
            const fieldUnit = TestUtil.getDbFieldUnit({})
            expect(
              GetFieldUnits.fromRounds({
                rounds: [
                  TestUtil.getDbPlayerRound({
                    close: TestUtil.getDbPlayerCombatRow({
                      units: [fieldUnit],
                    }),
                  }),
                ],
              })
            ).toEqual([fieldUnit])
          })
          it('returns single item if close modifier', () => {
            const fieldUnit = TestUtil.getDbFieldUnit({})
            expect(
              GetFieldUnits.fromRounds({
                rounds: [
                  TestUtil.getDbPlayerRound({
                    close: TestUtil.getDbPlayerCombatRow({
                      modifier: fieldUnit,
                    }),
                  }),
                ],
              })
            ).toEqual([fieldUnit])
          })
          it('returns single item if ranged unit', () => {
            const fieldUnit = TestUtil.getDbFieldUnit({})
            expect(
              GetFieldUnits.fromRounds({
                rounds: [
                  TestUtil.getDbPlayerRound({
                    ranged: TestUtil.getDbPlayerCombatRow({
                      units: [fieldUnit],
                    }),
                  }),
                ],
              })
            ).toEqual([fieldUnit])
          })
          it('returns single item if ranged modifier', () => {
            const fieldUnit = TestUtil.getDbFieldUnit({})
            expect(
              GetFieldUnits.fromRounds({
                rounds: [
                  TestUtil.getDbPlayerRound({
                    ranged: TestUtil.getDbPlayerCombatRow({
                      modifier: fieldUnit,
                    }),
                  }),
                ],
              })
            ).toEqual([fieldUnit])
          })
          it('returns single item if siege unit', () => {
            const fieldUnit = TestUtil.getDbFieldUnit({})
            expect(
              GetFieldUnits.fromRounds({
                rounds: [
                  TestUtil.getDbPlayerRound({
                    siege: TestUtil.getDbPlayerCombatRow({
                      units: [fieldUnit],
                    }),
                  }),
                ],
              })
            ).toEqual([fieldUnit])
          })
          it('returns single item if siege modifier', () => {
            const fieldUnit = TestUtil.getDbFieldUnit({})
            expect(
              GetFieldUnits.fromRounds({
                rounds: [
                  TestUtil.getDbPlayerRound({
                    siege: TestUtil.getDbPlayerCombatRow({
                      modifier: fieldUnit,
                    }),
                  }),
                ],
              })
            ).toEqual([fieldUnit])
          })
        })
        describe('multiple units', () => {
          describe('close only', () => {
            it('returns multiple items if close units', () => {
              const fieldUnit1 = TestUtil.getDbFieldUnit({})
              const fieldUnit2 = TestUtil.getDbFieldUnit({})
              expect(
                GetFieldUnits.fromRounds({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [fieldUnit1, fieldUnit2],
                      }),
                    }),
                  ],
                })
              ).toEqual([fieldUnit1, fieldUnit2])
            })
            it('returns multiple items if close unit and modifier', () => {
              const fieldUnit1 = TestUtil.getDbFieldUnit({})
              const fieldUnit2 = TestUtil.getDbFieldUnit({})
              expect(
                GetFieldUnits.fromRounds({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [fieldUnit1],
                        modifier: fieldUnit2,
                      }),
                    }),
                  ],
                })
              ).toEqual([fieldUnit1, fieldUnit2])
            })
            it('returns single item if close unit and weather', () => {
              const fieldUnit1 = TestUtil.getDbFieldUnit({})
              const fieldUnit2 = TestUtil.getDbFieldUnit({})
              expect(
                GetFieldUnits.fromRounds({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [fieldUnit1],
                      }),
                      weathers: [fieldUnit2],
                    }),
                  ],
                })
              ).toEqual([fieldUnit1])
            })
            it('returns single item if close modifier and weather', () => {
              const fieldUnit1 = TestUtil.getDbFieldUnit({})
              const fieldUnit2 = TestUtil.getDbFieldUnit({})
              expect(
                GetFieldUnits.fromRounds({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        modifier: fieldUnit1,
                      }),
                      weathers: [fieldUnit2],
                    }),
                  ],
                })
              ).toEqual([fieldUnit1])
            })
          })
          describe('ranged only', () => {
            it('returns multiple items if ranged units', () => {
              const fieldUnit1 = TestUtil.getDbFieldUnit({})
              const fieldUnit2 = TestUtil.getDbFieldUnit({})
              expect(
                GetFieldUnits.fromRounds({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        units: [fieldUnit1, fieldUnit2],
                      }),
                    }),
                  ],
                })
              ).toEqual([fieldUnit1, fieldUnit2])
            })
            it('returns multiple items if ranged unit and modifier', () => {
              const fieldUnit1 = TestUtil.getDbFieldUnit({})
              const fieldUnit2 = TestUtil.getDbFieldUnit({})
              expect(
                GetFieldUnits.fromRounds({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        units: [fieldUnit1],
                        modifier: fieldUnit2,
                      }),
                    }),
                  ],
                })
              ).toEqual([fieldUnit1, fieldUnit2])
            })
            it('returns single item if ranged unit and weather', () => {
              const fieldUnit1 = TestUtil.getDbFieldUnit({})
              const fieldUnit2 = TestUtil.getDbFieldUnit({})
              expect(
                GetFieldUnits.fromRounds({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        units: [fieldUnit1],
                      }),
                      weathers: [fieldUnit2],
                    }),
                  ],
                })
              ).toEqual([fieldUnit1])
            })
            it('returns single item if ranged modifier and weather', () => {
              const fieldUnit1 = TestUtil.getDbFieldUnit({})
              const fieldUnit2 = TestUtil.getDbFieldUnit({})
              expect(
                GetFieldUnits.fromRounds({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        modifier: fieldUnit1,
                      }),
                      weathers: [fieldUnit2],
                    }),
                  ],
                })
              ).toEqual([fieldUnit1])
            })
          })
          describe('siege only', () => {
            it('returns multiple items if siege units', () => {
              const fieldUnit1 = TestUtil.getDbFieldUnit({})
              const fieldUnit2 = TestUtil.getDbFieldUnit({})
              expect(
                GetFieldUnits.fromRounds({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        units: [fieldUnit1, fieldUnit2],
                      }),
                    }),
                  ],
                })
              ).toEqual([fieldUnit1, fieldUnit2])
            })
            it('returns multiple items if siege unit and modifier', () => {
              const fieldUnit1 = TestUtil.getDbFieldUnit({})
              const fieldUnit2 = TestUtil.getDbFieldUnit({})
              expect(
                GetFieldUnits.fromRounds({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        units: [fieldUnit1],
                        modifier: fieldUnit2,
                      }),
                    }),
                  ],
                })
              ).toEqual([fieldUnit1, fieldUnit2])
            })
            it('returns single item if siege unit and weather', () => {
              const fieldUnit1 = TestUtil.getDbFieldUnit({})
              const fieldUnit2 = TestUtil.getDbFieldUnit({})
              expect(
                GetFieldUnits.fromRounds({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        units: [fieldUnit1],
                      }),
                      weathers: [fieldUnit2],
                    }),
                  ],
                })
              ).toEqual([fieldUnit1])
            })
            it('returns single item if siege modifier and weather', () => {
              const fieldUnit1 = TestUtil.getDbFieldUnit({})
              const fieldUnit2 = TestUtil.getDbFieldUnit({})
              expect(
                GetFieldUnits.fromRounds({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        modifier: fieldUnit1,
                      }),
                      weathers: [fieldUnit2],
                    }),
                  ],
                })
              ).toEqual([fieldUnit1])
            })
          })
          describe('mixed', () => {
            it('returns multiple items if units', () => {
              const fieldUnit1 = TestUtil.getDbFieldUnit({})
              const fieldUnit2 = TestUtil.getDbFieldUnit({})
              const fieldUnit3 = TestUtil.getDbFieldUnit({})
              expect(
                GetFieldUnits.fromRounds({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [fieldUnit1],
                      }),
                      ranged: TestUtil.getDbPlayerCombatRow({
                        units: [fieldUnit2],
                      }),
                      siege: TestUtil.getDbPlayerCombatRow({
                        units: [fieldUnit3],
                      }),
                    }),
                  ],
                })
              ).toEqual([fieldUnit1, fieldUnit2, fieldUnit3])
            })
            it('returns multiple items if modifiers', () => {
              const fieldUnit1 = TestUtil.getDbFieldUnit({})
              const fieldUnit2 = TestUtil.getDbFieldUnit({})
              const fieldUnit3 = TestUtil.getDbFieldUnit({})
              expect(
                GetFieldUnits.fromRounds({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        modifier: fieldUnit1,
                      }),
                      ranged: TestUtil.getDbPlayerCombatRow({
                        modifier: fieldUnit2,
                      }),
                      siege: TestUtil.getDbPlayerCombatRow({
                        modifier: fieldUnit3,
                      }),
                    }),
                  ],
                })
              ).toEqual([fieldUnit1, fieldUnit2, fieldUnit3])
            })
            it('returns not items if just weathers', () => {
              const fieldUnit1 = TestUtil.getDbFieldUnit({})
              const fieldUnit2 = TestUtil.getDbFieldUnit({})
              const fieldUnit3 = TestUtil.getDbFieldUnit({})
              expect(
                GetFieldUnits.fromRounds({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      weathers: [fieldUnit1, fieldUnit2, fieldUnit3],
                    }),
                  ],
                })
              ).toEqual([])
            })
            it('returns multiple items if units, modifiers and weathers', () => {
              const fieldUnit1 = TestUtil.getDbFieldUnit({})
              const fieldUnit2 = TestUtil.getDbFieldUnit({})
              const fieldUnit3 = TestUtil.getDbFieldUnit({})
              const fieldUnit4 = TestUtil.getDbFieldUnit({})
              const fieldUnit5 = TestUtil.getDbFieldUnit({})
              const fieldUnit6 = TestUtil.getDbFieldUnit({})
              const fieldUnit7 = TestUtil.getDbFieldUnit({})
              expect(
                GetFieldUnits.fromRounds({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [fieldUnit1],
                        modifier: fieldUnit2,
                      }),
                      ranged: TestUtil.getDbPlayerCombatRow({
                        units: [fieldUnit3],
                        modifier: fieldUnit4,
                      }),
                      siege: TestUtil.getDbPlayerCombatRow({
                        units: [fieldUnit5],
                        modifier: fieldUnit6,
                      }),
                      weathers: [fieldUnit7],
                    }),
                  ],
                })
              ).toEqual([fieldUnit1, fieldUnit2, fieldUnit3, fieldUnit4, fieldUnit5, fieldUnit6])
            })
          })
        })
      })
      describe('close combat', () => {
        const combat = Combat.Close
        describe('single unit', () => {
          it('returns single item if close unit', () => {
            const fieldUnit = TestUtil.getDbFieldUnit({})
            expect(
              GetFieldUnits.fromRounds({
                combat,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    close: TestUtil.getDbPlayerCombatRow({
                      units: [fieldUnit],
                    }),
                  }),
                ],
              })
            ).toEqual([fieldUnit])
          })
          it('returns single item if close modifier', () => {
            const fieldUnit = TestUtil.getDbFieldUnit({})
            expect(
              GetFieldUnits.fromRounds({
                combat,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    close: TestUtil.getDbPlayerCombatRow({
                      modifier: fieldUnit,
                    }),
                  }),
                ],
              })
            ).toEqual([fieldUnit])
          })
          it('returns empty array if ranged unit', () => {
            const fieldUnit = TestUtil.getDbFieldUnit({})
            expect(
              GetFieldUnits.fromRounds({
                combat,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    ranged: TestUtil.getDbPlayerCombatRow({
                      units: [fieldUnit],
                    }),
                  }),
                ],
              })
            ).toEqual([])
          })
          it('returns empty array if ranged modifier', () => {
            const fieldUnit = TestUtil.getDbFieldUnit({})
            expect(
              GetFieldUnits.fromRounds({
                combat,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    ranged: TestUtil.getDbPlayerCombatRow({
                      modifier: fieldUnit,
                    }),
                  }),
                ],
              })
            ).toEqual([])
          })
          it('returns empty array if siege unit', () => {
            const fieldUnit = TestUtil.getDbFieldUnit({})
            expect(
              GetFieldUnits.fromRounds({
                combat,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    siege: TestUtil.getDbPlayerCombatRow({
                      units: [fieldUnit],
                    }),
                  }),
                ],
              })
            ).toEqual([])
          })
          it('returns empty array if siege modifier', () => {
            const fieldUnit = TestUtil.getDbFieldUnit({})
            expect(
              GetFieldUnits.fromRounds({
                combat,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    siege: TestUtil.getDbPlayerCombatRow({
                      modifier: fieldUnit,
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
              const fieldUnit1 = TestUtil.getDbFieldUnit({})
              const fieldUnit2 = TestUtil.getDbFieldUnit({})
              expect(
                GetFieldUnits.fromRounds({
                  combat,
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [fieldUnit1, fieldUnit2],
                      }),
                    }),
                  ],
                })
              ).toEqual([fieldUnit1, fieldUnit2])
            })
            it('returns multiple items if close unit and modifier', () => {
              const fieldUnit1 = TestUtil.getDbFieldUnit({})
              const fieldUnit2 = TestUtil.getDbFieldUnit({})
              expect(
                GetFieldUnits.fromRounds({
                  combat,
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [fieldUnit1],
                        modifier: fieldUnit2,
                      }),
                    }),
                  ],
                })
              ).toEqual([fieldUnit1, fieldUnit2])
            })
            it('returns single item if close unit and weather', () => {
              const fieldUnit1 = TestUtil.getDbFieldUnit({})
              const fieldUnit2 = TestUtil.getDbFieldUnit({})
              expect(
                GetFieldUnits.fromRounds({
                  combat,
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [fieldUnit1],
                      }),
                      weathers: [fieldUnit2],
                    }),
                  ],
                })
              ).toEqual([fieldUnit1])
            })
            it('returns single item if close modifier and weather', () => {
              const fieldUnit1 = TestUtil.getDbFieldUnit({})
              const fieldUnit2 = TestUtil.getDbFieldUnit({})
              expect(
                GetFieldUnits.fromRounds({
                  combat,
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        modifier: fieldUnit1,
                      }),
                      weathers: [fieldUnit2],
                    }),
                  ],
                })
              ).toEqual([fieldUnit1])
            })
          })
          describe('ranged only', () => {
            it('returns empty array if ranged units', () => {
              const fieldUnit1 = TestUtil.getDbFieldUnit({})
              const fieldUnit2 = TestUtil.getDbFieldUnit({})
              expect(
                GetFieldUnits.fromRounds({
                  combat,
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        units: [fieldUnit1, fieldUnit2],
                      }),
                    }),
                  ],
                })
              ).toEqual([])
            })
            it('returns empty array if ranged unit and modifier', () => {
              const fieldUnit1 = TestUtil.getDbFieldUnit({})
              const fieldUnit2 = TestUtil.getDbFieldUnit({})
              expect(
                GetFieldUnits.fromRounds({
                  combat,
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        units: [fieldUnit1],
                        modifier: fieldUnit2,
                      }),
                    }),
                  ],
                })
              ).toEqual([])
            })
            it('returns empty array if ranged unit and weather', () => {
              const fieldUnit1 = TestUtil.getDbFieldUnit({})
              const fieldUnit2 = TestUtil.getDbFieldUnit({})
              expect(
                GetFieldUnits.fromRounds({
                  combat,
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        units: [fieldUnit1],
                      }),
                      weathers: [fieldUnit2],
                    }),
                  ],
                })
              ).toEqual([])
            })
            it('returns empty array if ranged modifier and weather', () => {
              const fieldUnit1 = TestUtil.getDbFieldUnit({})
              const fieldUnit2 = TestUtil.getDbFieldUnit({})
              expect(
                GetFieldUnits.fromRounds({
                  combat,
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        modifier: fieldUnit1,
                      }),
                      weathers: [fieldUnit2],
                    }),
                  ],
                })
              ).toEqual([])
            })
          })
          describe('siege only', () => {
            it('returns empty array if siege units', () => {
              const fieldUnit1 = TestUtil.getDbFieldUnit({})
              const fieldUnit2 = TestUtil.getDbFieldUnit({})
              expect(
                GetFieldUnits.fromRounds({
                  combat,
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        units: [fieldUnit1, fieldUnit2],
                      }),
                    }),
                  ],
                })
              ).toEqual([])
            })
            it('returns empty array if siege unit and modifier', () => {
              const fieldUnit1 = TestUtil.getDbFieldUnit({})
              const fieldUnit2 = TestUtil.getDbFieldUnit({})
              expect(
                GetFieldUnits.fromRounds({
                  combat,
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        units: [fieldUnit1],
                        modifier: fieldUnit2,
                      }),
                    }),
                  ],
                })
              ).toEqual([])
            })
            it('returns empty array if siege unit and weather', () => {
              const fieldUnit1 = TestUtil.getDbFieldUnit({})
              const fieldUnit2 = TestUtil.getDbFieldUnit({})
              expect(
                GetFieldUnits.fromRounds({
                  combat,
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        units: [fieldUnit1],
                      }),
                      weathers: [fieldUnit2],
                    }),
                  ],
                })
              ).toEqual([])
            })
            it('returns empty array if siege modifier and weather', () => {
              const fieldUnit1 = TestUtil.getDbFieldUnit({})
              const fieldUnit2 = TestUtil.getDbFieldUnit({})
              expect(
                GetFieldUnits.fromRounds({
                  combat,
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        modifier: fieldUnit1,
                      }),
                      weathers: [fieldUnit2],
                    }),
                  ],
                })
              ).toEqual([])
            })
          })
          describe('mixed', () => {
            it('returns single item if units', () => {
              const fieldUnit1 = TestUtil.getDbFieldUnit({})
              const fieldUnit2 = TestUtil.getDbFieldUnit({})
              const fieldUnit3 = TestUtil.getDbFieldUnit({})
              expect(
                GetFieldUnits.fromRounds({
                  combat,
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [fieldUnit1],
                      }),
                      ranged: TestUtil.getDbPlayerCombatRow({
                        units: [fieldUnit2],
                      }),
                      siege: TestUtil.getDbPlayerCombatRow({
                        units: [fieldUnit3],
                      }),
                    }),
                  ],
                })
              ).toEqual([fieldUnit1])
            })
            it('returns single item if modifiers', () => {
              const fieldUnit1 = TestUtil.getDbFieldUnit({})
              const fieldUnit2 = TestUtil.getDbFieldUnit({})
              const fieldUnit3 = TestUtil.getDbFieldUnit({})
              expect(
                GetFieldUnits.fromRounds({
                  combat,
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        modifier: fieldUnit1,
                      }),
                      ranged: TestUtil.getDbPlayerCombatRow({
                        modifier: fieldUnit2,
                      }),
                      siege: TestUtil.getDbPlayerCombatRow({
                        modifier: fieldUnit3,
                      }),
                    }),
                  ],
                })
              ).toEqual([fieldUnit1])
            })
            it('returns empty array if weathers', () => {
              const fieldUnit1 = TestUtil.getDbFieldUnit({})
              const fieldUnit2 = TestUtil.getDbFieldUnit({})
              expect(
                GetFieldUnits.fromRounds({
                  combat,
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({}),
                      weathers: [fieldUnit1, fieldUnit2],
                    }),
                  ],
                })
              ).toEqual([])
            })
            it('returns multiple items if units, modifiers and weathers', () => {
              const fieldUnit1 = TestUtil.getDbFieldUnit({})
              const fieldUnit2 = TestUtil.getDbFieldUnit({})
              const fieldUnit3 = TestUtil.getDbFieldUnit({})
              const fieldUnit4 = TestUtil.getDbFieldUnit({})
              const fieldUnit5 = TestUtil.getDbFieldUnit({})
              const fieldUnit6 = TestUtil.getDbFieldUnit({})
              const fieldUnit7 = TestUtil.getDbFieldUnit({})
              expect(
                GetFieldUnits.fromRounds({
                  combat,
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [fieldUnit1],
                        modifier: fieldUnit2,
                      }),
                      ranged: TestUtil.getDbPlayerCombatRow({
                        units: [fieldUnit3],
                        modifier: fieldUnit4,
                      }),
                      siege: TestUtil.getDbPlayerCombatRow({
                        units: [fieldUnit5],
                        modifier: fieldUnit6,
                      }),
                      weathers: [fieldUnit7],
                    }),
                  ],
                })
              ).toEqual([fieldUnit1, fieldUnit2])
            })
          })
        })
      })
      describe('ranged combat', () => {
        const combat = Combat.Ranged
        describe('single unit', () => {
          it('returns empty array if close unit', () => {
            const fieldUnit = TestUtil.getDbFieldUnit({})
            expect(
              GetFieldUnits.fromRounds({
                combat,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    close: TestUtil.getDbPlayerCombatRow({
                      units: [fieldUnit],
                    }),
                  }),
                ],
              })
            ).toEqual([])
          })
          it('returns empty array if close modifier', () => {
            const fieldUnit = TestUtil.getDbFieldUnit({})
            expect(
              GetFieldUnits.fromRounds({
                combat,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    close: TestUtil.getDbPlayerCombatRow({
                      modifier: fieldUnit,
                    }),
                  }),
                ],
              })
            ).toEqual([])
          })
          it('returns single item if ranged unit', () => {
            const fieldUnit = TestUtil.getDbFieldUnit({})
            expect(
              GetFieldUnits.fromRounds({
                combat,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    ranged: TestUtil.getDbPlayerCombatRow({
                      units: [fieldUnit],
                    }),
                  }),
                ],
              })
            ).toEqual([fieldUnit])
          })
          it('returns single item if ranged modifier', () => {
            const fieldUnit = TestUtil.getDbFieldUnit({})
            expect(
              GetFieldUnits.fromRounds({
                combat,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    ranged: TestUtil.getDbPlayerCombatRow({
                      modifier: fieldUnit,
                    }),
                  }),
                ],
              })
            ).toEqual([fieldUnit])
          })
          it('returns empty array if siege unit', () => {
            const fieldUnit = TestUtil.getDbFieldUnit({})
            expect(
              GetFieldUnits.fromRounds({
                combat,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    siege: TestUtil.getDbPlayerCombatRow({
                      units: [fieldUnit],
                    }),
                  }),
                ],
              })
            ).toEqual([])
          })
          it('returns empty array if siege modifier', () => {
            const fieldUnit = TestUtil.getDbFieldUnit({})
            expect(
              GetFieldUnits.fromRounds({
                combat,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    siege: TestUtil.getDbPlayerCombatRow({
                      modifier: fieldUnit,
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
              const fieldUnit1 = TestUtil.getDbFieldUnit({})
              const fieldUnit2 = TestUtil.getDbFieldUnit({})
              expect(
                GetFieldUnits.fromRounds({
                  combat,
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [fieldUnit1, fieldUnit2],
                      }),
                    }),
                  ],
                })
              ).toEqual([])
            })
            it('returns empty array if close unit and modifier', () => {
              const fieldUnit1 = TestUtil.getDbFieldUnit({})
              const fieldUnit2 = TestUtil.getDbFieldUnit({})
              expect(
                GetFieldUnits.fromRounds({
                  combat,
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [fieldUnit1],
                        modifier: fieldUnit2,
                      }),
                    }),
                  ],
                })
              ).toEqual([])
            })
            it('returns empty array if close unit and weather', () => {
              const fieldUnit1 = TestUtil.getDbFieldUnit({})
              const fieldUnit2 = TestUtil.getDbFieldUnit({})
              expect(
                GetFieldUnits.fromRounds({
                  combat,
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [fieldUnit1],
                      }),
                      weathers: [fieldUnit2],
                    }),
                  ],
                })
              ).toEqual([])
            })
            it('returns empty array if close modifier and weather', () => {
              const fieldUnit1 = TestUtil.getDbFieldUnit({})
              const fieldUnit2 = TestUtil.getDbFieldUnit({})
              expect(
                GetFieldUnits.fromRounds({
                  combat,
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        modifier: fieldUnit1,
                      }),
                      weathers: [fieldUnit2],
                    }),
                  ],
                })
              ).toEqual([])
            })
          })
          describe('ranged only', () => {
            it('returns multiple items if ranged units', () => {
              const fieldUnit1 = TestUtil.getDbFieldUnit({})
              const fieldUnit2 = TestUtil.getDbFieldUnit({})
              expect(
                GetFieldUnits.fromRounds({
                  combat,
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        units: [fieldUnit1, fieldUnit2],
                      }),
                    }),
                  ],
                })
              ).toEqual([fieldUnit1, fieldUnit2])
            })
            it('returns multiple items if ranged unit and modifier', () => {
              const fieldUnit1 = TestUtil.getDbFieldUnit({})
              const fieldUnit2 = TestUtil.getDbFieldUnit({})
              expect(
                GetFieldUnits.fromRounds({
                  combat,
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        units: [fieldUnit1],
                        modifier: fieldUnit2,
                      }),
                    }),
                  ],
                })
              ).toEqual([fieldUnit1, fieldUnit2])
            })
            it('returns single item if ranged unit and weather', () => {
              const fieldUnit1 = TestUtil.getDbFieldUnit({})
              const fieldUnit2 = TestUtil.getDbFieldUnit({})
              expect(
                GetFieldUnits.fromRounds({
                  combat,
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        units: [fieldUnit1],
                      }),
                      weathers: [fieldUnit2],
                    }),
                  ],
                })
              ).toEqual([fieldUnit1])
            })
            it('returns single item if ranged modifier and weather', () => {
              const fieldUnit1 = TestUtil.getDbFieldUnit({})
              const fieldUnit2 = TestUtil.getDbFieldUnit({})
              expect(
                GetFieldUnits.fromRounds({
                  combat,
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        modifier: fieldUnit1,
                      }),
                      weathers: [fieldUnit2],
                    }),
                  ],
                })
              ).toEqual([fieldUnit1])
            })
          })
          describe('siege only', () => {
            it('returns empty array if siege units', () => {
              const fieldUnit1 = TestUtil.getDbFieldUnit({})
              const fieldUnit2 = TestUtil.getDbFieldUnit({})
              expect(
                GetFieldUnits.fromRounds({
                  combat,
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        units: [fieldUnit1, fieldUnit2],
                      }),
                    }),
                  ],
                })
              ).toEqual([])
            })
            it('returns empty array if siege unit and modifier', () => {
              const fieldUnit1 = TestUtil.getDbFieldUnit({})
              const fieldUnit2 = TestUtil.getDbFieldUnit({})
              expect(
                GetFieldUnits.fromRounds({
                  combat,
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        units: [fieldUnit1],
                        modifier: fieldUnit2,
                      }),
                    }),
                  ],
                })
              ).toEqual([])
            })
            it('returns empty array if siege unit and weather', () => {
              const fieldUnit1 = TestUtil.getDbFieldUnit({})
              const fieldUnit2 = TestUtil.getDbFieldUnit({})
              expect(
                GetFieldUnits.fromRounds({
                  combat,
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        units: [fieldUnit1],
                      }),
                      weathers: [fieldUnit2],
                    }),
                  ],
                })
              ).toEqual([])
            })
            it('returns empty array if siege modifier and weather', () => {
              const fieldUnit1 = TestUtil.getDbFieldUnit({})
              const fieldUnit2 = TestUtil.getDbFieldUnit({})
              expect(
                GetFieldUnits.fromRounds({
                  combat,
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        modifier: fieldUnit1,
                      }),
                      weathers: [fieldUnit2],
                    }),
                  ],
                })
              ).toEqual([])
            })
          })
          describe('mixed', () => {
            it('returns single item if units', () => {
              const fieldUnit1 = TestUtil.getDbFieldUnit({})
              const fieldUnit2 = TestUtil.getDbFieldUnit({})
              const fieldUnit3 = TestUtil.getDbFieldUnit({})
              expect(
                GetFieldUnits.fromRounds({
                  combat,
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [fieldUnit1],
                      }),
                      ranged: TestUtil.getDbPlayerCombatRow({
                        units: [fieldUnit2],
                      }),
                      siege: TestUtil.getDbPlayerCombatRow({
                        units: [fieldUnit3],
                      }),
                    }),
                  ],
                })
              ).toEqual([fieldUnit2])
            })
            it('returns single item if modifiers', () => {
              const fieldUnit1 = TestUtil.getDbFieldUnit({})
              const fieldUnit2 = TestUtil.getDbFieldUnit({})
              const fieldUnit3 = TestUtil.getDbFieldUnit({})
              expect(
                GetFieldUnits.fromRounds({
                  combat,
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        modifier: fieldUnit1,
                      }),
                      ranged: TestUtil.getDbPlayerCombatRow({
                        modifier: fieldUnit2,
                      }),
                      siege: TestUtil.getDbPlayerCombatRow({
                        modifier: fieldUnit3,
                      }),
                    }),
                  ],
                })
              ).toEqual([fieldUnit2])
            })
            it('returns empty array if weathers', () => {
              const fieldUnit1 = TestUtil.getDbFieldUnit({})
              const fieldUnit2 = TestUtil.getDbFieldUnit({})
              expect(
                GetFieldUnits.fromRounds({
                  combat,
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({}),
                      weathers: [fieldUnit1, fieldUnit2],
                    }),
                  ],
                })
              ).toEqual([])
            })
            it('returns multiple items if units, modifiers and weathers', () => {
              const fieldUnit1 = TestUtil.getDbFieldUnit({})
              const fieldUnit2 = TestUtil.getDbFieldUnit({})
              const fieldUnit3 = TestUtil.getDbFieldUnit({})
              const fieldUnit4 = TestUtil.getDbFieldUnit({})
              const fieldUnit5 = TestUtil.getDbFieldUnit({})
              const fieldUnit6 = TestUtil.getDbFieldUnit({})
              const fieldUnit7 = TestUtil.getDbFieldUnit({})
              expect(
                GetFieldUnits.fromRounds({
                  combat,
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [fieldUnit1],
                        modifier: fieldUnit2,
                      }),
                      ranged: TestUtil.getDbPlayerCombatRow({
                        units: [fieldUnit3],
                        modifier: fieldUnit4,
                      }),
                      siege: TestUtil.getDbPlayerCombatRow({
                        units: [fieldUnit5],
                        modifier: fieldUnit6,
                      }),
                      weathers: [fieldUnit7],
                    }),
                  ],
                })
              ).toEqual([fieldUnit3, fieldUnit4])
            })
          })
        })
      })
      describe('siege combat', () => {
        const combat = Combat.Siege
        describe('single unit', () => {
          it('returns empty array if close unit', () => {
            const fieldUnit = TestUtil.getDbFieldUnit({})
            expect(
              GetFieldUnits.fromRounds({
                combat,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    close: TestUtil.getDbPlayerCombatRow({
                      units: [fieldUnit],
                    }),
                  }),
                ],
              })
            ).toEqual([])
          })
          it('returns empty array if close modifier', () => {
            const fieldUnit = TestUtil.getDbFieldUnit({})
            expect(
              GetFieldUnits.fromRounds({
                combat,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    close: TestUtil.getDbPlayerCombatRow({
                      modifier: fieldUnit,
                    }),
                  }),
                ],
              })
            ).toEqual([])
          })
          it('returns empty array if ranged unit', () => {
            const fieldUnit = TestUtil.getDbFieldUnit({})
            expect(
              GetFieldUnits.fromRounds({
                combat,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    ranged: TestUtil.getDbPlayerCombatRow({
                      units: [fieldUnit],
                    }),
                  }),
                ],
              })
            ).toEqual([])
          })
          it('returns empty array if ranged modifier', () => {
            const fieldUnit = TestUtil.getDbFieldUnit({})
            expect(
              GetFieldUnits.fromRounds({
                combat,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    ranged: TestUtil.getDbPlayerCombatRow({
                      modifier: fieldUnit,
                    }),
                  }),
                ],
              })
            ).toEqual([])
          })
          it('returns single item if siege unit', () => {
            const fieldUnit = TestUtil.getDbFieldUnit({})
            expect(
              GetFieldUnits.fromRounds({
                combat,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    siege: TestUtil.getDbPlayerCombatRow({
                      units: [fieldUnit],
                    }),
                  }),
                ],
              })
            ).toEqual([fieldUnit])
          })
          it('returns single item if siege modifier', () => {
            const fieldUnit = TestUtil.getDbFieldUnit({})
            expect(
              GetFieldUnits.fromRounds({
                combat,
                rounds: [
                  TestUtil.getDbPlayerRound({
                    siege: TestUtil.getDbPlayerCombatRow({
                      modifier: fieldUnit,
                    }),
                  }),
                ],
              })
            ).toEqual([fieldUnit])
          })
        })
        describe('multiple units', () => {
          describe('close only', () => {
            it('returns empty array if close units', () => {
              const fieldUnit1 = TestUtil.getDbFieldUnit({})
              const fieldUnit2 = TestUtil.getDbFieldUnit({})
              expect(
                GetFieldUnits.fromRounds({
                  combat,
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [fieldUnit1, fieldUnit2],
                      }),
                    }),
                  ],
                })
              ).toEqual([])
            })
            it('returns empty array if close unit and modifier', () => {
              const fieldUnit1 = TestUtil.getDbFieldUnit({})
              const fieldUnit2 = TestUtil.getDbFieldUnit({})
              expect(
                GetFieldUnits.fromRounds({
                  combat,
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [fieldUnit1],
                        modifier: fieldUnit2,
                      }),
                    }),
                  ],
                })
              ).toEqual([])
            })
            it('returns empty array if close unit and weather', () => {
              const fieldUnit1 = TestUtil.getDbFieldUnit({})
              const fieldUnit2 = TestUtil.getDbFieldUnit({})
              expect(
                GetFieldUnits.fromRounds({
                  combat,
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [fieldUnit1],
                      }),
                      weathers: [fieldUnit2],
                    }),
                  ],
                })
              ).toEqual([])
            })
            it('returns empty array if close modifier and weather', () => {
              const fieldUnit1 = TestUtil.getDbFieldUnit({})
              const fieldUnit2 = TestUtil.getDbFieldUnit({})
              expect(
                GetFieldUnits.fromRounds({
                  combat,
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        modifier: fieldUnit1,
                      }),
                      weathers: [fieldUnit2],
                    }),
                  ],
                })
              ).toEqual([])
            })
          })
          describe('ranged only', () => {
            it('returns empty array if ranged units', () => {
              const fieldUnit1 = TestUtil.getDbFieldUnit({})
              const fieldUnit2 = TestUtil.getDbFieldUnit({})
              expect(
                GetFieldUnits.fromRounds({
                  combat,
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        units: [fieldUnit1, fieldUnit2],
                      }),
                    }),
                  ],
                })
              ).toEqual([])
            })
            it('returns empty array if ranged unit and modifier', () => {
              const fieldUnit1 = TestUtil.getDbFieldUnit({})
              const fieldUnit2 = TestUtil.getDbFieldUnit({})
              expect(
                GetFieldUnits.fromRounds({
                  combat,
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        units: [fieldUnit1],
                        modifier: fieldUnit2,
                      }),
                    }),
                  ],
                })
              ).toEqual([])
            })
            it('returns empty array if ranged unit and weather', () => {
              const fieldUnit1 = TestUtil.getDbFieldUnit({})
              const fieldUnit2 = TestUtil.getDbFieldUnit({})
              expect(
                GetFieldUnits.fromRounds({
                  combat,
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        units: [fieldUnit1],
                      }),
                      weathers: [fieldUnit2],
                    }),
                  ],
                })
              ).toEqual([])
            })
            it('returns empty array if ranged modifier and weather', () => {
              const fieldUnit1 = TestUtil.getDbFieldUnit({})
              const fieldUnit2 = TestUtil.getDbFieldUnit({})
              expect(
                GetFieldUnits.fromRounds({
                  combat,
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        modifier: fieldUnit1,
                      }),
                      weathers: [fieldUnit2],
                    }),
                  ],
                })
              ).toEqual([])
            })
          })
          describe('siege only', () => {
            it('returns multiple items if siege units', () => {
              const fieldUnit1 = TestUtil.getDbFieldUnit({})
              const fieldUnit2 = TestUtil.getDbFieldUnit({})
              expect(
                GetFieldUnits.fromRounds({
                  combat,
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        units: [fieldUnit1, fieldUnit2],
                      }),
                    }),
                  ],
                })
              ).toEqual([fieldUnit1, fieldUnit2])
            })
            it('returns multiple items if siege unit and modifier', () => {
              const fieldUnit1 = TestUtil.getDbFieldUnit({})
              const fieldUnit2 = TestUtil.getDbFieldUnit({})
              expect(
                GetFieldUnits.fromRounds({
                  combat,
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        units: [fieldUnit1],
                        modifier: fieldUnit2,
                      }),
                    }),
                  ],
                })
              ).toEqual([fieldUnit1, fieldUnit2])
            })
            it('returns single item if siege unit and weather', () => {
              const fieldUnit1 = TestUtil.getDbFieldUnit({})
              const fieldUnit2 = TestUtil.getDbFieldUnit({})
              expect(
                GetFieldUnits.fromRounds({
                  combat,
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        units: [fieldUnit1],
                      }),
                      weathers: [fieldUnit2],
                    }),
                  ],
                })
              ).toEqual([fieldUnit1])
            })
            it('returns single item if siege modifier and weather', () => {
              const fieldUnit1 = TestUtil.getDbFieldUnit({})
              const fieldUnit2 = TestUtil.getDbFieldUnit({})
              expect(
                GetFieldUnits.fromRounds({
                  combat,
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        modifier: fieldUnit1,
                      }),
                      weathers: [fieldUnit2],
                    }),
                  ],
                })
              ).toEqual([fieldUnit1])
            })
          })
          describe('mixed', () => {
            it('returns single item if units', () => {
              const fieldUnit1 = TestUtil.getDbFieldUnit({})
              const fieldUnit2 = TestUtil.getDbFieldUnit({})
              const fieldUnit3 = TestUtil.getDbFieldUnit({})
              expect(
                GetFieldUnits.fromRounds({
                  combat,
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [fieldUnit1],
                      }),
                      ranged: TestUtil.getDbPlayerCombatRow({
                        units: [fieldUnit2],
                      }),
                      siege: TestUtil.getDbPlayerCombatRow({
                        units: [fieldUnit3],
                      }),
                    }),
                  ],
                })
              ).toEqual([fieldUnit3])
            })
            it('returns single item if modifiers', () => {
              const fieldUnit1 = TestUtil.getDbFieldUnit({})
              const fieldUnit2 = TestUtil.getDbFieldUnit({})
              const fieldUnit3 = TestUtil.getDbFieldUnit({})
              expect(
                GetFieldUnits.fromRounds({
                  combat,
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        modifier: fieldUnit1,
                      }),
                      ranged: TestUtil.getDbPlayerCombatRow({
                        modifier: fieldUnit2,
                      }),
                      siege: TestUtil.getDbPlayerCombatRow({
                        modifier: fieldUnit3,
                      }),
                    }),
                  ],
                })
              ).toEqual([fieldUnit3])
            })
            it('returns empty array if weathers', () => {
              const fieldUnit1 = TestUtil.getDbFieldUnit({})
              const fieldUnit2 = TestUtil.getDbFieldUnit({})
              expect(
                GetFieldUnits.fromRounds({
                  combat,
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({}),
                      weathers: [fieldUnit1, fieldUnit2],
                    }),
                  ],
                })
              ).toEqual([])
            })
            it('returns multiple items if units, modifiers and weathers', () => {
              const fieldUnit1 = TestUtil.getDbFieldUnit({})
              const fieldUnit2 = TestUtil.getDbFieldUnit({})
              const fieldUnit3 = TestUtil.getDbFieldUnit({})
              const fieldUnit4 = TestUtil.getDbFieldUnit({})
              const fieldUnit5 = TestUtil.getDbFieldUnit({})
              const fieldUnit6 = TestUtil.getDbFieldUnit({})
              const fieldUnit7 = TestUtil.getDbFieldUnit({})
              expect(
                GetFieldUnits.fromRounds({
                  combat,
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [fieldUnit1],
                        modifier: fieldUnit2,
                      }),
                      ranged: TestUtil.getDbPlayerCombatRow({
                        units: [fieldUnit3],
                        modifier: fieldUnit4,
                      }),
                      siege: TestUtil.getDbPlayerCombatRow({
                        units: [fieldUnit5],
                        modifier: fieldUnit6,
                      }),
                      weathers: [fieldUnit7],
                    }),
                  ],
                })
              ).toEqual([fieldUnit5, fieldUnit6])
            })
          })
        })
      })
    })
    describe('multiple rounds', () => {
      it('returns empty array if no units', () => {
        expect(
          GetFieldUnits.fromRounds({
            rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
          })
        ).toEqual([])
      })
      it('returns multiple items if single unique of each', () => {
        const fieldUnit1 = TestUtil.getDbFieldUnit({})
        const fieldUnit2 = TestUtil.getDbFieldUnit({})
        const fieldUnit3 = TestUtil.getDbFieldUnit({})
        const fieldUnit4 = TestUtil.getDbFieldUnit({})
        const fieldUnit5 = TestUtil.getDbFieldUnit({})
        const fieldUnit6 = TestUtil.getDbFieldUnit({})
        const fieldUnit7 = TestUtil.getDbFieldUnit({})
        const fieldUnit8 = TestUtil.getDbFieldUnit({})
        const fieldUnit9 = TestUtil.getDbFieldUnit({})
        const fieldUnit10 = TestUtil.getDbFieldUnit({})
        const fieldUnit11 = TestUtil.getDbFieldUnit({})
        const fieldUnit12 = TestUtil.getDbFieldUnit({})
        const fieldUnit13 = TestUtil.getDbFieldUnit({})
        const fieldUnit14 = TestUtil.getDbFieldUnit({})
        expect(
          GetFieldUnits.fromRounds({
            rounds: [
              TestUtil.getDbPlayerRound({
                close: {
                  units: [fieldUnit1],
                  modifier: fieldUnit2,
                },
                ranged: {
                  units: [fieldUnit3],
                  modifier: fieldUnit4,
                },
                siege: {
                  units: [fieldUnit5],
                  modifier: fieldUnit6,
                },
                weathers: [fieldUnit7],
              }),
              TestUtil.getDbPlayerRound({
                close: {
                  units: [fieldUnit8],
                  modifier: fieldUnit9,
                },
                ranged: {
                  units: [fieldUnit10],
                  modifier: fieldUnit11,
                },
                siege: {
                  units: [fieldUnit12],
                  modifier: fieldUnit13,
                },
                weathers: [fieldUnit14],
              }),
            ],
          })
        ).toEqual([
          fieldUnit1,
          fieldUnit2,
          fieldUnit3,
          fieldUnit4,
          fieldUnit5,
          fieldUnit6,
          fieldUnit8,
          fieldUnit9,
          fieldUnit10,
          fieldUnit11,
          fieldUnit12,
          fieldUnit13,
        ])
      })
      it('returns multiple duplicate items if single duplicate of each', () => {
        const fieldUnit1 = TestUtil.getDbFieldUnit({})
        const fieldUnit2 = TestUtil.getDbFieldUnit({})
        const fieldUnit3 = TestUtil.getDbFieldUnit({})
        const fieldUnit4 = TestUtil.getDbFieldUnit({})
        const fieldUnit5 = TestUtil.getDbFieldUnit({})
        const fieldUnit6 = TestUtil.getDbFieldUnit({})
        const fieldUnit7 = TestUtil.getDbFieldUnit({})
        expect(
          GetFieldUnits.fromRounds({
            rounds: [
              TestUtil.getDbPlayerRound({
                close: {
                  units: [fieldUnit1],
                  modifier: fieldUnit2,
                },
                ranged: {
                  units: [fieldUnit3],
                  modifier: fieldUnit4,
                },
                siege: {
                  units: [fieldUnit5],
                  modifier: fieldUnit6,
                },
                weathers: [fieldUnit7],
              }),
              TestUtil.getDbPlayerRound({
                close: {
                  units: [fieldUnit1],
                  modifier: fieldUnit2,
                },
                ranged: {
                  units: [fieldUnit3],
                  modifier: fieldUnit4,
                },
                siege: {
                  units: [fieldUnit5],
                  modifier: fieldUnit6,
                },
                weathers: [fieldUnit7],
              }),
            ],
          })
        ).toEqual([
          fieldUnit1,
          fieldUnit2,
          fieldUnit3,
          fieldUnit4,
          fieldUnit5,
          fieldUnit6,
          fieldUnit1,
          fieldUnit2,
          fieldUnit3,
          fieldUnit4,
          fieldUnit5,
          fieldUnit6,
        ])
      })
      it('returns multiple items if close combat', () => {
        const fieldUnit1 = TestUtil.getDbFieldUnit({})
        const fieldUnit2 = TestUtil.getDbFieldUnit({})
        const fieldUnit3 = TestUtil.getDbFieldUnit({})
        const fieldUnit4 = TestUtil.getDbFieldUnit({})
        const fieldUnit5 = TestUtil.getDbFieldUnit({})
        const fieldUnit6 = TestUtil.getDbFieldUnit({})
        const fieldUnit7 = TestUtil.getDbFieldUnit({})
        const fieldUnit8 = TestUtil.getDbFieldUnit({})
        const fieldUnit9 = TestUtil.getDbFieldUnit({})
        const fieldUnit10 = TestUtil.getDbFieldUnit({})
        const fieldUnit11 = TestUtil.getDbFieldUnit({})
        const fieldUnit12 = TestUtil.getDbFieldUnit({})
        const fieldUnit13 = TestUtil.getDbFieldUnit({})
        const fieldUnit14 = TestUtil.getDbFieldUnit({})
        expect(
          GetFieldUnits.fromRounds({
            combat: Combat.Close,
            rounds: [
              TestUtil.getDbPlayerRound({
                close: {
                  units: [fieldUnit1],
                  modifier: fieldUnit2,
                },
                ranged: {
                  units: [fieldUnit3],
                  modifier: fieldUnit4,
                },
                siege: {
                  units: [fieldUnit5],
                  modifier: fieldUnit6,
                },
                weathers: [fieldUnit7],
              }),
              TestUtil.getDbPlayerRound({
                close: {
                  units: [fieldUnit8],
                  modifier: fieldUnit9,
                },
                ranged: {
                  units: [fieldUnit10],
                  modifier: fieldUnit11,
                },
                siege: {
                  units: [fieldUnit12],
                  modifier: fieldUnit13,
                },
                weathers: [fieldUnit14],
              }),
            ],
          })
        ).toEqual([fieldUnit1, fieldUnit2, fieldUnit8, fieldUnit9])
      })
      it('returns multiple items if ranged combat', () => {
        const fieldUnit1 = TestUtil.getDbFieldUnit({})
        const fieldUnit2 = TestUtil.getDbFieldUnit({})
        const fieldUnit3 = TestUtil.getDbFieldUnit({})
        const fieldUnit4 = TestUtil.getDbFieldUnit({})
        const fieldUnit5 = TestUtil.getDbFieldUnit({})
        const fieldUnit6 = TestUtil.getDbFieldUnit({})
        const fieldUnit7 = TestUtil.getDbFieldUnit({})
        const fieldUnit8 = TestUtil.getDbFieldUnit({})
        const fieldUnit9 = TestUtil.getDbFieldUnit({})
        const fieldUnit10 = TestUtil.getDbFieldUnit({})
        const fieldUnit11 = TestUtil.getDbFieldUnit({})
        const fieldUnit12 = TestUtil.getDbFieldUnit({})
        const fieldUnit13 = TestUtil.getDbFieldUnit({})
        const fieldUnit14 = TestUtil.getDbFieldUnit({})
        expect(
          GetFieldUnits.fromRounds({
            combat: Combat.Ranged,
            rounds: [
              TestUtil.getDbPlayerRound({
                close: {
                  units: [fieldUnit1],
                  modifier: fieldUnit2,
                },
                ranged: {
                  units: [fieldUnit3],
                  modifier: fieldUnit4,
                },
                siege: {
                  units: [fieldUnit5],
                  modifier: fieldUnit6,
                },
                weathers: [fieldUnit7],
              }),
              TestUtil.getDbPlayerRound({
                close: {
                  units: [fieldUnit8],
                  modifier: fieldUnit9,
                },
                ranged: {
                  units: [fieldUnit10],
                  modifier: fieldUnit11,
                },
                siege: {
                  units: [fieldUnit12],
                  modifier: fieldUnit13,
                },
                weathers: [fieldUnit14],
              }),
            ],
          })
        ).toEqual([fieldUnit3, fieldUnit4, fieldUnit10, fieldUnit11])
      })
      it('returns multiple items if siege combat', () => {
        const fieldUnit1 = TestUtil.getDbFieldUnit({})
        const fieldUnit2 = TestUtil.getDbFieldUnit({})
        const fieldUnit3 = TestUtil.getDbFieldUnit({})
        const fieldUnit4 = TestUtil.getDbFieldUnit({})
        const fieldUnit5 = TestUtil.getDbFieldUnit({})
        const fieldUnit6 = TestUtil.getDbFieldUnit({})
        const fieldUnit7 = TestUtil.getDbFieldUnit({})
        const fieldUnit8 = TestUtil.getDbFieldUnit({})
        const fieldUnit9 = TestUtil.getDbFieldUnit({})
        const fieldUnit10 = TestUtil.getDbFieldUnit({})
        const fieldUnit11 = TestUtil.getDbFieldUnit({})
        const fieldUnit12 = TestUtil.getDbFieldUnit({})
        const fieldUnit13 = TestUtil.getDbFieldUnit({})
        const fieldUnit14 = TestUtil.getDbFieldUnit({})
        expect(
          GetFieldUnits.fromRounds({
            combat: Combat.Siege,
            rounds: [
              TestUtil.getDbPlayerRound({
                close: {
                  units: [fieldUnit1],
                  modifier: fieldUnit2,
                },
                ranged: {
                  units: [fieldUnit3],
                  modifier: fieldUnit4,
                },
                siege: {
                  units: [fieldUnit5],
                  modifier: fieldUnit6,
                },
                weathers: [fieldUnit7],
              }),
              TestUtil.getDbPlayerRound({
                close: {
                  units: [fieldUnit8],
                  modifier: fieldUnit9,
                },
                ranged: {
                  units: [fieldUnit10],
                  modifier: fieldUnit11,
                },
                siege: {
                  units: [fieldUnit12],
                  modifier: fieldUnit13,
                },
                weathers: [fieldUnit14],
              }),
            ],
          })
        ).toEqual([fieldUnit5, fieldUnit6, fieldUnit12, fieldUnit13])
      })
    })
  })
})

function testGetFieldUnit({
  game,
  unitId,
  userId,
  expected,
}: {
  game: GameDbObject
  unitId: ObjectId | string
  userId: ObjectId | string
  expected: FieldUnitDbObject | Error | undefined
}) {
  if (expected instanceof Error) {
    expect(() =>
      GetFieldUnits.getFieldUnit({
        game,
        unitId,
        userId,
      })
    ).toThrow(expected)
  } else {
    expect(
      GetFieldUnits.getFieldUnit({
        game,
        unitId,
        userId,
      })
    ).toEqual(expected)
  }
}
