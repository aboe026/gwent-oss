import { ObjectId } from 'mongodb'

import { Combat, GameDbObject, GameUnitDbObject } from '@gwent/graphql-schema/database-typings'
import GetBattlefieldUnit, {
  BattlefieldUnit,
} from '../../src/graphql/resolvers/mutations/play-unit/get-battlefield-unit'
import TestUtil from '../util/test-util'

describe('get-battlefield-unit', () => {
  describe('getBattlefieldUnit', () => {
    it('throws error if user not no game', () => {
      const userId = new ObjectId().toString()
      const game = TestUtil.getDbGame({})
      testGetBattlefieldUnit({
        game,
        unitId: new ObjectId(),
        userId,
        expected: Error(`Could not find player "${userId}" on game "${game._id}"`),
      })
    })
    it('throws error more than 1 user found on game', () => {
      const userId = new ObjectId().toString()
      const game = TestUtil.getDbGame({
        players: [
          TestUtil.getDbGamePlayer({
            user: userId,
          }),
          TestUtil.getDbGamePlayer({
            user: userId,
          }),
        ],
      })
      testGetBattlefieldUnit({
        game,
        unitId: new ObjectId(),
        userId,
        expected: Error(
          `Found more than 1 player with ID "${userId}" on game "${game._id}": "${JSON.stringify(game.players)}"`
        ),
      })
    })
    describe('round 1', () => {
      const unitId = new ObjectId()
      const round = 1
      it('returns undefined if unit not found', () => {
        const userId = new ObjectId().toString()
        const game = TestUtil.getDbGame({
          round,
          players: [
            TestUtil.getDbGamePlayer({
              user: userId,
              rounds: [
                TestUtil.getDbPlayerRound({
                  close: {
                    score: 0,
                    units: [],
                  },
                }),
              ],
            }),
          ],
        })
        testGetBattlefieldUnit({
          game,
          unitId,
          userId,
          getRowUnitResponses: [undefined, undefined, undefined],
          expected: undefined,
          getRowUnitCalls: [
            [
              {
                row: Combat.Close,
                unitId,
                units: [],
              },
            ],
            [
              {
                row: Combat.Ranged,
                unitId,
                units: [],
              },
            ],
            [
              {
                row: Combat.Siege,
                unitId,
                units: [],
              },
            ],
          ],
        })
      })
      it('returns unit if found in close units', () => {
        const userId = new ObjectId().toString()
        const gameUnit = TestUtil.getDbGameUnit({
          id: unitId,
        })
        const game = TestUtil.getDbGame({
          round,
          players: [
            TestUtil.getDbGamePlayer({
              user: userId,
              rounds: [
                TestUtil.getDbPlayerRound({
                  close: {
                    score: 0,
                    units: [gameUnit],
                  },
                }),
              ],
            }),
          ],
        })
        const battlefieldUnit: BattlefieldUnit = {
          row: Combat.Close,
          unit: gameUnit,
        }
        testGetBattlefieldUnit({
          game,
          unitId,
          userId,
          getRowUnitResponses: [battlefieldUnit, undefined, undefined],
          expected: battlefieldUnit,
          getRowUnitCalls: [
            [
              {
                row: Combat.Close,
                unitId,
                units: [gameUnit],
              },
            ],
          ],
        })
      })
      it('returns unit if found in close modifier', () => {
        const userId = new ObjectId().toString()
        const gameUnit = TestUtil.getDbGameUnit({
          id: unitId,
        })
        const game = TestUtil.getDbGame({
          round,
          players: [
            TestUtil.getDbGamePlayer({
              user: userId,
              rounds: [
                TestUtil.getDbPlayerRound({
                  close: {
                    score: 0,
                    units: [],
                    modifier: gameUnit,
                  },
                }),
              ],
            }),
          ],
        })
        const battlefieldUnit: BattlefieldUnit = {
          row: Combat.Close,
          unit: gameUnit,
        }
        testGetBattlefieldUnit({
          game,
          unitId,
          userId,
          getRowUnitResponses: [battlefieldUnit, undefined, undefined],
          expected: battlefieldUnit,
          getRowUnitCalls: [
            [
              {
                row: Combat.Close,
                unitId,
                units: [],
                modifier: gameUnit,
              },
            ],
          ],
        })
      })
      it('returns unit if found in ranged units', () => {
        const userId = new ObjectId().toString()
        const gameUnit = TestUtil.getDbGameUnit({
          id: unitId,
        })
        const game = TestUtil.getDbGame({
          round,
          players: [
            TestUtil.getDbGamePlayer({
              user: userId,
              rounds: [
                TestUtil.getDbPlayerRound({
                  ranged: {
                    score: 0,
                    units: [gameUnit],
                  },
                }),
              ],
            }),
          ],
        })
        const battlefieldUnit: BattlefieldUnit = {
          row: Combat.Ranged,
          unit: gameUnit,
        }
        testGetBattlefieldUnit({
          game,
          unitId,
          userId,
          getRowUnitResponses: [undefined, battlefieldUnit, undefined],
          expected: battlefieldUnit,
          getRowUnitCalls: [
            [
              {
                row: Combat.Close,
                unitId,
                units: [],
              },
            ],
            [
              {
                row: Combat.Ranged,
                unitId,
                units: [gameUnit],
              },
            ],
          ],
        })
      })
      it('returns unit if found in ranged modifier', () => {
        const userId = new ObjectId().toString()
        const gameUnit = TestUtil.getDbGameUnit({
          id: unitId,
        })
        const game = TestUtil.getDbGame({
          round,
          players: [
            TestUtil.getDbGamePlayer({
              user: userId,
              rounds: [
                TestUtil.getDbPlayerRound({
                  ranged: {
                    score: 0,
                    units: [],
                    modifier: gameUnit,
                  },
                }),
              ],
            }),
          ],
        })
        const battlefieldUnit: BattlefieldUnit = {
          row: Combat.Ranged,
          unit: gameUnit,
        }
        testGetBattlefieldUnit({
          game,
          unitId,
          userId,
          getRowUnitResponses: [undefined, battlefieldUnit, undefined],
          expected: battlefieldUnit,
          getRowUnitCalls: [
            [
              {
                row: Combat.Close,
                unitId,
                units: [],
              },
            ],
            [
              {
                row: Combat.Ranged,
                unitId,
                units: [],
                modifier: gameUnit,
              },
            ],
          ],
        })
      })
      it('returns unit if found in sieges units', () => {
        const userId = new ObjectId().toString()
        const gameUnit = TestUtil.getDbGameUnit({
          id: unitId,
        })
        const game = TestUtil.getDbGame({
          round,
          players: [
            TestUtil.getDbGamePlayer({
              user: userId,
              rounds: [
                TestUtil.getDbPlayerRound({
                  siege: {
                    score: 0,
                    units: [gameUnit],
                  },
                }),
              ],
            }),
          ],
        })
        const battlefieldUnit: BattlefieldUnit = {
          row: Combat.Siege,
          unit: gameUnit,
        }
        testGetBattlefieldUnit({
          game,
          unitId,
          userId,
          getRowUnitResponses: [undefined, undefined, battlefieldUnit],
          expected: battlefieldUnit,
          getRowUnitCalls: [
            [
              {
                row: Combat.Close,
                unitId,
                units: [],
              },
            ],
            [
              {
                row: Combat.Ranged,
                unitId,
                units: [],
              },
            ],
            [
              {
                row: Combat.Siege,
                unitId,
                units: [gameUnit],
              },
            ],
          ],
        })
      })
      it('returns unit if found in sieges modifier', () => {
        const userId = new ObjectId().toString()
        const gameUnit = TestUtil.getDbGameUnit({
          id: unitId,
        })
        const game = TestUtil.getDbGame({
          round,
          players: [
            TestUtil.getDbGamePlayer({
              user: userId,
              rounds: [
                TestUtil.getDbPlayerRound({
                  siege: {
                    score: 0,
                    units: [],
                    modifier: gameUnit,
                  },
                }),
              ],
            }),
          ],
        })
        const battlefieldUnit: BattlefieldUnit = {
          row: Combat.Siege,
          unit: gameUnit,
        }
        testGetBattlefieldUnit({
          game,
          unitId,
          userId,
          getRowUnitResponses: [undefined, undefined, battlefieldUnit],
          expected: battlefieldUnit,
          getRowUnitCalls: [
            [
              {
                row: Combat.Close,
                unitId,
                units: [],
              },
            ],
            [
              {
                row: Combat.Ranged,
                unitId,
                units: [],
              },
            ],
            [
              {
                row: Combat.Siege,
                unitId,
                units: [],
                modifier: gameUnit,
              },
            ],
          ],
        })
      })
    })
    describe('round 2', () => {
      const unitId = new ObjectId()
      const round = 2
      it('returns undefined if unit not found', () => {
        const userId = new ObjectId().toString()
        const game = TestUtil.getDbGame({
          round,
          players: [
            TestUtil.getDbGamePlayer({
              user: userId,
              rounds: [
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({
                  close: {
                    score: 0,
                    units: [],
                  },
                }),
              ],
            }),
          ],
        })
        testGetBattlefieldUnit({
          game,
          unitId,
          userId,
          getRowUnitResponses: [undefined, undefined, undefined],
          expected: undefined,
          getRowUnitCalls: [
            [
              {
                row: Combat.Close,
                unitId,
                units: [],
              },
            ],
            [
              {
                row: Combat.Ranged,
                unitId,
                units: [],
              },
            ],
            [
              {
                row: Combat.Siege,
                unitId,
                units: [],
              },
            ],
          ],
        })
      })
      it('returns unit if found in close units', () => {
        const userId = new ObjectId().toString()
        const gameUnit = TestUtil.getDbGameUnit({
          id: unitId,
        })
        const game = TestUtil.getDbGame({
          round,
          players: [
            TestUtil.getDbGamePlayer({
              user: userId,
              rounds: [
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({
                  close: {
                    score: 0,
                    units: [gameUnit],
                  },
                }),
              ],
            }),
          ],
        })
        const battlefieldUnit: BattlefieldUnit = {
          row: Combat.Close,
          unit: gameUnit,
        }
        testGetBattlefieldUnit({
          game,
          unitId,
          userId,
          getRowUnitResponses: [battlefieldUnit, undefined, undefined],
          expected: battlefieldUnit,
          getRowUnitCalls: [
            [
              {
                row: Combat.Close,
                unitId,
                units: [gameUnit],
              },
            ],
          ],
        })
      })
      it('returns unit if found in close modifier', () => {
        const userId = new ObjectId().toString()
        const gameUnit = TestUtil.getDbGameUnit({
          id: unitId,
        })
        const game = TestUtil.getDbGame({
          round,
          players: [
            TestUtil.getDbGamePlayer({
              user: userId,
              rounds: [
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({
                  close: {
                    score: 0,
                    units: [],
                    modifier: gameUnit,
                  },
                }),
              ],
            }),
          ],
        })
        const battlefieldUnit: BattlefieldUnit = {
          row: Combat.Close,
          unit: gameUnit,
        }
        testGetBattlefieldUnit({
          game,
          unitId,
          userId,
          getRowUnitResponses: [battlefieldUnit, undefined, undefined],
          expected: battlefieldUnit,
          getRowUnitCalls: [
            [
              {
                row: Combat.Close,
                unitId,
                units: [],
                modifier: gameUnit,
              },
            ],
          ],
        })
      })
      it('returns unit if found in ranged units', () => {
        const userId = new ObjectId().toString()
        const gameUnit = TestUtil.getDbGameUnit({
          id: unitId,
        })
        const game = TestUtil.getDbGame({
          round,
          players: [
            TestUtil.getDbGamePlayer({
              user: userId,
              rounds: [
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({
                  ranged: {
                    score: 0,
                    units: [gameUnit],
                  },
                }),
              ],
            }),
          ],
        })
        const battlefieldUnit: BattlefieldUnit = {
          row: Combat.Ranged,
          unit: gameUnit,
        }
        testGetBattlefieldUnit({
          game,
          unitId,
          userId,
          getRowUnitResponses: [undefined, battlefieldUnit, undefined],
          expected: battlefieldUnit,
          getRowUnitCalls: [
            [
              {
                row: Combat.Close,
                unitId,
                units: [],
              },
            ],
            [
              {
                row: Combat.Ranged,
                unitId,
                units: [gameUnit],
              },
            ],
          ],
        })
      })
      it('returns unit if found in ranged modifier', () => {
        const userId = new ObjectId().toString()
        const gameUnit = TestUtil.getDbGameUnit({
          id: unitId,
        })
        const game = TestUtil.getDbGame({
          round,
          players: [
            TestUtil.getDbGamePlayer({
              user: userId,
              rounds: [
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({
                  ranged: {
                    score: 0,
                    units: [],
                    modifier: gameUnit,
                  },
                }),
              ],
            }),
          ],
        })
        const battlefieldUnit: BattlefieldUnit = {
          row: Combat.Ranged,
          unit: gameUnit,
        }
        testGetBattlefieldUnit({
          game,
          unitId,
          userId,
          getRowUnitResponses: [undefined, battlefieldUnit, undefined],
          expected: battlefieldUnit,
          getRowUnitCalls: [
            [
              {
                row: Combat.Close,
                unitId,
                units: [],
              },
            ],
            [
              {
                row: Combat.Ranged,
                unitId,
                units: [],
                modifier: gameUnit,
              },
            ],
          ],
        })
      })
      it('returns unit if found in siege units', () => {
        const userId = new ObjectId().toString()
        const gameUnit = TestUtil.getDbGameUnit({
          id: unitId,
        })
        const game = TestUtil.getDbGame({
          round,
          players: [
            TestUtil.getDbGamePlayer({
              user: userId,
              rounds: [
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({
                  siege: {
                    score: 0,
                    units: [gameUnit],
                  },
                }),
              ],
            }),
          ],
        })
        const battlefieldUnit: BattlefieldUnit = {
          row: Combat.Siege,
          unit: gameUnit,
        }
        testGetBattlefieldUnit({
          game,
          unitId,
          userId,
          getRowUnitResponses: [undefined, undefined, battlefieldUnit],
          expected: battlefieldUnit,
          getRowUnitCalls: [
            [
              {
                row: Combat.Close,
                unitId,
                units: [],
              },
            ],
            [
              {
                row: Combat.Ranged,
                unitId,
                units: [],
              },
            ],
            [
              {
                row: Combat.Siege,
                unitId,
                units: [gameUnit],
              },
            ],
          ],
        })
      })
      it('returns unit if found in siege modifier', () => {
        const userId = new ObjectId().toString()
        const gameUnit = TestUtil.getDbGameUnit({
          id: unitId,
        })
        const game = TestUtil.getDbGame({
          round,
          players: [
            TestUtil.getDbGamePlayer({
              user: userId,
              rounds: [
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({
                  siege: {
                    score: 0,
                    units: [],
                    modifier: gameUnit,
                  },
                }),
              ],
            }),
          ],
        })
        const battlefieldUnit: BattlefieldUnit = {
          row: Combat.Siege,
          unit: gameUnit,
        }
        testGetBattlefieldUnit({
          game,
          unitId,
          userId,
          getRowUnitResponses: [undefined, undefined, battlefieldUnit],
          expected: battlefieldUnit,
          getRowUnitCalls: [
            [
              {
                row: Combat.Close,
                unitId,
                units: [],
              },
            ],
            [
              {
                row: Combat.Ranged,
                unitId,
                units: [],
              },
            ],
            [
              {
                row: Combat.Siege,
                unitId,
                units: [],
                modifier: gameUnit,
              },
            ],
          ],
        })
      })
    })
    describe('round 3', () => {
      const unitId = new ObjectId()
      const round = 3
      it('returns undefined if unit not found', () => {
        const userId = new ObjectId().toString()
        const game = TestUtil.getDbGame({
          round,
          players: [
            TestUtil.getDbGamePlayer({
              user: userId,
              rounds: [
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({
                  close: {
                    score: 0,
                    units: [],
                  },
                }),
              ],
            }),
          ],
        })
        testGetBattlefieldUnit({
          game,
          unitId,
          userId,
          getRowUnitResponses: [undefined, undefined, undefined],
          expected: undefined,
          getRowUnitCalls: [
            [
              {
                row: Combat.Close,
                unitId,
                units: [],
              },
            ],
            [
              {
                row: Combat.Ranged,
                unitId,
                units: [],
              },
            ],
            [
              {
                row: Combat.Siege,
                unitId,
                units: [],
              },
            ],
          ],
        })
      })
      it('returns unit if found in close units', () => {
        const userId = new ObjectId().toString()
        const gameUnit = TestUtil.getDbGameUnit({
          id: unitId,
        })
        const game = TestUtil.getDbGame({
          round,
          players: [
            TestUtil.getDbGamePlayer({
              user: userId,
              rounds: [
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({
                  close: {
                    score: 0,
                    units: [gameUnit],
                  },
                }),
              ],
            }),
          ],
        })
        const battlefieldUnit: BattlefieldUnit = {
          row: Combat.Close,
          unit: gameUnit,
        }
        testGetBattlefieldUnit({
          game,
          unitId,
          userId,
          getRowUnitResponses: [battlefieldUnit, undefined, undefined],
          expected: battlefieldUnit,
          getRowUnitCalls: [
            [
              {
                row: Combat.Close,
                unitId,
                units: [gameUnit],
              },
            ],
          ],
        })
      })
      it('returns unit if found in close modifier', () => {
        const userId = new ObjectId().toString()
        const gameUnit = TestUtil.getDbGameUnit({
          id: unitId,
        })
        const game = TestUtil.getDbGame({
          round,
          players: [
            TestUtil.getDbGamePlayer({
              user: userId,
              rounds: [
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({
                  close: {
                    score: 0,
                    units: [],
                    modifier: gameUnit,
                  },
                }),
              ],
            }),
          ],
        })
        const battlefieldUnit: BattlefieldUnit = {
          row: Combat.Close,
          unit: gameUnit,
        }
        testGetBattlefieldUnit({
          game,
          unitId,
          userId,
          getRowUnitResponses: [battlefieldUnit, undefined, undefined],
          expected: battlefieldUnit,
          getRowUnitCalls: [
            [
              {
                row: Combat.Close,
                unitId,
                units: [],
                modifier: gameUnit,
              },
            ],
          ],
        })
      })
      it('returns unit if found in ranged units', () => {
        const userId = new ObjectId().toString()
        const gameUnit = TestUtil.getDbGameUnit({
          id: unitId,
        })
        const game = TestUtil.getDbGame({
          round,
          players: [
            TestUtil.getDbGamePlayer({
              user: userId,
              rounds: [
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({
                  ranged: {
                    score: 0,
                    units: [gameUnit],
                  },
                }),
              ],
            }),
          ],
        })
        const battlefieldUnit: BattlefieldUnit = {
          row: Combat.Ranged,
          unit: gameUnit,
        }
        testGetBattlefieldUnit({
          game,
          unitId,
          userId,
          getRowUnitResponses: [undefined, battlefieldUnit, undefined],
          expected: battlefieldUnit,
          getRowUnitCalls: [
            [
              {
                row: Combat.Close,
                unitId,
                units: [],
              },
            ],
            [
              {
                row: Combat.Ranged,
                unitId,
                units: [gameUnit],
              },
            ],
          ],
        })
      })
      it('returns unit if found in ranged modifier', () => {
        const userId = new ObjectId().toString()
        const gameUnit = TestUtil.getDbGameUnit({
          id: unitId,
        })
        const game = TestUtil.getDbGame({
          round,
          players: [
            TestUtil.getDbGamePlayer({
              user: userId,
              rounds: [
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({
                  ranged: {
                    score: 0,
                    units: [],
                    modifier: gameUnit,
                  },
                }),
              ],
            }),
          ],
        })
        const battlefieldUnit: BattlefieldUnit = {
          row: Combat.Ranged,
          unit: gameUnit,
        }
        testGetBattlefieldUnit({
          game,
          unitId,
          userId,
          getRowUnitResponses: [undefined, battlefieldUnit, undefined],
          expected: battlefieldUnit,
          getRowUnitCalls: [
            [
              {
                row: Combat.Close,
                unitId,
                units: [],
              },
            ],
            [
              {
                row: Combat.Ranged,
                unitId,
                units: [],
                modifier: gameUnit,
              },
            ],
          ],
        })
      })
      it('returns unit if found in siege units', () => {
        const userId = new ObjectId().toString()
        const gameUnit = TestUtil.getDbGameUnit({
          id: unitId,
        })
        const game = TestUtil.getDbGame({
          round,
          players: [
            TestUtil.getDbGamePlayer({
              user: userId,
              rounds: [
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({
                  siege: {
                    score: 0,
                    units: [gameUnit],
                  },
                }),
              ],
            }),
          ],
        })
        const battlefieldUnit: BattlefieldUnit = {
          row: Combat.Siege,
          unit: gameUnit,
        }
        testGetBattlefieldUnit({
          game,
          unitId,
          userId,
          getRowUnitResponses: [undefined, undefined, battlefieldUnit],
          expected: battlefieldUnit,
          getRowUnitCalls: [
            [
              {
                row: Combat.Close,
                unitId,
                units: [],
              },
            ],
            [
              {
                row: Combat.Ranged,
                unitId,
                units: [],
              },
            ],
            [
              {
                row: Combat.Siege,
                unitId,
                units: [gameUnit],
              },
            ],
          ],
        })
      })
      it('returns unit if found in siege modifier', () => {
        const userId = new ObjectId().toString()
        const gameUnit = TestUtil.getDbGameUnit({
          id: unitId,
        })
        const game = TestUtil.getDbGame({
          round,
          players: [
            TestUtil.getDbGamePlayer({
              user: userId,
              rounds: [
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({
                  siege: {
                    score: 0,
                    units: [],
                    modifier: gameUnit,
                  },
                }),
              ],
            }),
          ],
        })
        const battlefieldUnit: BattlefieldUnit = {
          row: Combat.Siege,
          unit: gameUnit,
        }
        testGetBattlefieldUnit({
          game,
          unitId,
          userId,
          getRowUnitResponses: [undefined, undefined, battlefieldUnit],
          expected: battlefieldUnit,
          getRowUnitCalls: [
            [
              {
                row: Combat.Close,
                unitId,
                units: [],
              },
            ],
            [
              {
                row: Combat.Ranged,
                unitId,
                units: [],
              },
            ],
            [
              {
                row: Combat.Siege,
                unitId,
                units: [],
                modifier: gameUnit,
              },
            ],
          ],
        })
      })
    })
  })
  describe('getRowUnit', () => {
    const unitId = new ObjectId()
    it('returns undefined if units empty array', () => {
      testGetRowUnit({
        unitId,
        units: [],
        row: Combat.Close,
        expected: undefined,
      })
    })
    it('returns undefined if single unit does not match', () => {
      testGetRowUnit({
        unitId,
        units: [TestUtil.getDbGameUnit({})],
        row: Combat.Close,
        expected: undefined,
      })
    })
    it('returns undefined if multiple units do not match', () => {
      testGetRowUnit({
        unitId,
        units: [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})],
        row: Combat.Close,
        expected: undefined,
      })
    })
    describe('close', () => {
      const row = Combat.Close
      it('returns BattlefieldUnit if modifier matches close', () => {
        const gameUnit = TestUtil.getDbGameUnit({
          id: unitId,
        })
        testGetRowUnit({
          unitId,
          units: [],
          modifier: gameUnit,
          row,
          expected: {
            row,
            unit: gameUnit,
          },
        })
      })
      it('returns BattlefieldUnit if single unit matches close', () => {
        const gameUnit = TestUtil.getDbGameUnit({
          id: unitId,
        })
        testGetRowUnit({
          unitId,
          units: [gameUnit],
          row,
          expected: {
            row,
            unit: gameUnit,
          },
        })
      })
      it('returns BattlefieldUnit if first of many matches close', () => {
        const gameUnit = TestUtil.getDbGameUnit({
          id: unitId,
        })
        testGetRowUnit({
          unitId,
          units: [gameUnit, TestUtil.getDbGameUnit({})],
          row,
          expected: {
            row,
            unit: gameUnit,
          },
        })
      })
      it('returns BattlefieldUnit if middle of many matches close', () => {
        const gameUnit = TestUtil.getDbGameUnit({
          id: unitId,
        })
        testGetRowUnit({
          unitId,
          units: [TestUtil.getDbGameUnit({}), gameUnit, TestUtil.getDbGameUnit({})],
          row,
          expected: {
            row,
            unit: gameUnit,
          },
        })
      })
      it('returns BattlefieldUnit if last of many matches close', () => {
        const gameUnit = TestUtil.getDbGameUnit({
          id: unitId,
        })
        testGetRowUnit({
          unitId,
          units: [TestUtil.getDbGameUnit({}), gameUnit],
          row,
          expected: {
            row,
            unit: gameUnit,
          },
        })
      })
    })
    describe('ranged', () => {
      const row = Combat.Ranged
      it('returns BattlefieldUnit if modifier matches ranged', () => {
        const gameUnit = TestUtil.getDbGameUnit({
          id: unitId,
        })
        testGetRowUnit({
          unitId,
          units: [],
          modifier: gameUnit,
          row,
          expected: {
            row,
            unit: gameUnit,
          },
        })
      })
      it('returns BattlefieldUnit if single unit matches ranged', () => {
        const gameUnit = TestUtil.getDbGameUnit({
          id: unitId,
        })
        testGetRowUnit({
          unitId,
          units: [gameUnit],
          row,
          expected: {
            row,
            unit: gameUnit,
          },
        })
      })
      it('returns BattlefieldUnit if first of many matches ranged', () => {
        const gameUnit = TestUtil.getDbGameUnit({
          id: unitId,
        })
        testGetRowUnit({
          unitId,
          units: [gameUnit, TestUtil.getDbGameUnit({})],
          row,
          expected: {
            row,
            unit: gameUnit,
          },
        })
      })
      it('returns BattlefieldUnit if middle of many matches ranged', () => {
        const gameUnit = TestUtil.getDbGameUnit({
          id: unitId,
        })
        testGetRowUnit({
          unitId,
          units: [TestUtil.getDbGameUnit({}), gameUnit, TestUtil.getDbGameUnit({})],
          row,
          expected: {
            row,
            unit: gameUnit,
          },
        })
      })
      it('returns BattlefieldUnit if last of many matches ranged', () => {
        const gameUnit = TestUtil.getDbGameUnit({
          id: unitId,
        })
        testGetRowUnit({
          unitId,
          units: [TestUtil.getDbGameUnit({}), gameUnit],
          row,
          expected: {
            row,
            unit: gameUnit,
          },
        })
      })
    })
    describe('siege', () => {
      const row = Combat.Siege
      it('returns BattlefieldUnit if modifier matches siege', () => {
        const gameUnit = TestUtil.getDbGameUnit({
          id: unitId,
        })
        testGetRowUnit({
          unitId,
          units: [],
          modifier: gameUnit,
          row,
          expected: {
            row,
            unit: gameUnit,
          },
        })
      })
      it('returns BattlefieldUnit if single unit matches siege', () => {
        const gameUnit = TestUtil.getDbGameUnit({
          id: unitId,
        })
        testGetRowUnit({
          unitId,
          units: [gameUnit],
          row,
          expected: {
            row,
            unit: gameUnit,
          },
        })
      })
      it('returns BattlefieldUnit if first of many matches siege', () => {
        const gameUnit = TestUtil.getDbGameUnit({
          id: unitId,
        })
        testGetRowUnit({
          unitId,
          units: [gameUnit, TestUtil.getDbGameUnit({})],
          row,
          expected: {
            row,
            unit: gameUnit,
          },
        })
      })
      it('returns BattlefieldUnit if middle of many matches siege', () => {
        const gameUnit = TestUtil.getDbGameUnit({
          id: unitId,
        })
        testGetRowUnit({
          unitId,
          units: [TestUtil.getDbGameUnit({}), gameUnit, TestUtil.getDbGameUnit({})],
          row,
          expected: {
            row,
            unit: gameUnit,
          },
        })
      })
      it('returns BattlefieldUnit if last of many matches siege', () => {
        const gameUnit = TestUtil.getDbGameUnit({
          id: unitId,
        })
        testGetRowUnit({
          unitId,
          units: [TestUtil.getDbGameUnit({}), gameUnit],
          row,
          expected: {
            row,
            unit: gameUnit,
          },
        })
      })
    })
  })
})

function testGetBattlefieldUnit({
  game,
  unitId,
  userId,
  getRowUnitResponses = [],
  expected,
  getRowUnitCalls = [],
}: {
  game: GameDbObject
  unitId: ObjectId
  userId: string
  getRowUnitResponses?: (BattlefieldUnit | undefined)[]
  expected: BattlefieldUnit | undefined | Error
  getRowUnitCalls?: any[][]
}) {
  const getRowUnitSpy = jest.spyOn(GetBattlefieldUnit as any, 'getRowUnit')
  for (const getRowUnitResponse of getRowUnitResponses) {
    getRowUnitSpy.mockReturnValueOnce(getRowUnitResponse)
  }

  if (expected instanceof Error) {
    expect(() =>
      GetBattlefieldUnit.getBattlefieldUnit({
        game,
        unitId,
        userId,
      })
    ).toThrow(expected)
  } else {
    expect(
      GetBattlefieldUnit.getBattlefieldUnit({
        game,
        unitId,
        userId,
      })
    ).toEqual(expected)
  }

  expect(getRowUnitSpy.mock.calls).toEqual(getRowUnitCalls)
}

function testGetRowUnit({
  unitId,
  units,
  modifier,
  row,
  expected,
}: {
  unitId: ObjectId
  units: GameUnitDbObject[]
  modifier?: GameUnitDbObject
  row: Combat
  expected: BattlefieldUnit | undefined
}) {
  expect(
    GetBattlefieldUnit['getRowUnit']({
      row,
      unitId,
      units,
      modifier,
    })
  ).toEqual(expected)
}
