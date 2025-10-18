import { GameDbObject, UnitDbObject } from '@gwent/graphql-schema/database-typings'
import getRoundUnits from '../../src/graphql/resolvers/mutations/play-unit/get-round-units'
import TestUtil from '../util/test-util'
import UnitStore from '../../src/database/stores/unit-store'

describe('get-round-units', () => {
  const unitBeingPlayed = TestUtil.getDbUnit({})
  const unitsSelf = {
    close: TestUtil.getDbUnit({}),
    ranged: TestUtil.getDbUnit({}),
    siege: TestUtil.getDbUnit({}),
    modifier: TestUtil.getDbUnit({}),
  }
  const unitsOpponent = {
    close: TestUtil.getDbUnit({}),
    ranged: TestUtil.getDbUnit({}),
    siege: TestUtil.getDbUnit({}),
    modifier: TestUtil.getDbUnit({}),
  }
  describe('round 1', () => {
    it('calls to UnitStore to get all units ignoring unitBeingPlayed for units in close combat without modifiers', async () => {
      await testGetRoundUnits({
        game: TestUtil.getDbGame({
          round: 1,
          players: [
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({
                  close: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsSelf.close._id,
                      }),
                    ],
                  },
                }),
              ],
            }),
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({
                  close: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsOpponent.close._id,
                      }),
                    ],
                  },
                }),
              ],
            }),
          ],
        }),
        unitBeingPlayed,
        otherUnits: [unitsSelf.close, unitsOpponent.close],
      })
    })
    it('calls to UnitStore to get all units ignoring unitBeingPlayed for units in close combat with modifiers', async () => {
      await testGetRoundUnits({
        game: TestUtil.getDbGame({
          round: 1,
          players: [
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({
                  close: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsSelf.close._id,
                      }),
                    ],
                    modifier: TestUtil.getDbGameUnit({
                      id: unitsSelf.modifier._id,
                    }),
                  },
                }),
              ],
            }),
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({
                  close: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsOpponent.close._id,
                      }),
                    ],
                    modifier: TestUtil.getDbGameUnit({
                      id: unitsOpponent.modifier._id,
                    }),
                  },
                }),
              ],
            }),
          ],
        }),
        unitBeingPlayed,
        otherUnits: [unitsSelf.close, unitsSelf.modifier, unitsOpponent.close, unitsOpponent.modifier],
      })
    })
    it('calls to UnitStore to get all units ignoring unitBeingPlayed for units in ranged combat without modifiers', async () => {
      await testGetRoundUnits({
        game: TestUtil.getDbGame({
          round: 1,
          players: [
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({
                  ranged: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsSelf.ranged._id,
                      }),
                    ],
                  },
                }),
              ],
            }),
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({
                  ranged: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsOpponent.ranged._id,
                      }),
                    ],
                  },
                }),
              ],
            }),
          ],
        }),
        unitBeingPlayed,
        otherUnits: [unitsSelf.ranged, unitsOpponent.ranged],
      })
    })
    it('calls to UnitStore to get all units ignoring unitBeingPlayed for units in ranged combat with modifiers', async () => {
      await testGetRoundUnits({
        game: TestUtil.getDbGame({
          round: 1,
          players: [
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({
                  ranged: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsSelf.ranged._id,
                      }),
                    ],
                    modifier: TestUtil.getDbGameUnit({
                      id: unitsSelf.modifier._id,
                    }),
                  },
                }),
              ],
            }),
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({
                  ranged: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsOpponent.ranged._id,
                      }),
                    ],
                    modifier: TestUtil.getDbGameUnit({
                      id: unitsOpponent.modifier._id,
                    }),
                  },
                }),
              ],
            }),
          ],
        }),
        unitBeingPlayed,
        otherUnits: [unitsSelf.ranged, unitsSelf.modifier, unitsOpponent.ranged, unitsOpponent.modifier],
      })
    })
    it('calls to UnitStore to get all units ignoring unitBeingPlayed for units in siege combat without modifiers', async () => {
      await testGetRoundUnits({
        game: TestUtil.getDbGame({
          round: 1,
          players: [
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({
                  siege: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsSelf.siege._id,
                      }),
                    ],
                  },
                }),
              ],
            }),
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({
                  siege: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsOpponent.siege._id,
                      }),
                    ],
                  },
                }),
              ],
            }),
          ],
        }),
        unitBeingPlayed,
        otherUnits: [unitsSelf.siege, unitsOpponent.siege],
      })
    })
    it('calls to UnitStore to get all units ignoring unitBeingPlayed for units in siege combat with modifiers', async () => {
      await testGetRoundUnits({
        game: TestUtil.getDbGame({
          round: 1,
          players: [
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({
                  siege: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsSelf.siege._id,
                      }),
                    ],
                    modifier: TestUtil.getDbGameUnit({
                      id: unitsSelf.modifier._id,
                    }),
                  },
                }),
              ],
            }),
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({
                  siege: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsOpponent.siege._id,
                      }),
                    ],
                    modifier: TestUtil.getDbGameUnit({
                      id: unitsOpponent.modifier._id,
                    }),
                  },
                }),
              ],
            }),
          ],
        }),
        unitBeingPlayed,
        otherUnits: [unitsSelf.siege, unitsSelf.modifier, unitsOpponent.siege, unitsOpponent.modifier],
      })
    })
    it('calls to UnitStore to get all units ignoring unitBeingPlayed for units in all combats', async () => {
      await testGetRoundUnits({
        game: TestUtil.getDbGame({
          round: 1,
          players: [
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({
                  close: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsSelf.close._id,
                      }),
                    ],
                  },
                  ranged: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsSelf.ranged._id,
                      }),
                    ],
                  },
                  siege: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsSelf.siege._id,
                      }),
                    ],
                  },
                }),
              ],
            }),
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({
                  close: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsOpponent.close._id,
                      }),
                    ],
                  },
                  ranged: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsOpponent.ranged._id,
                      }),
                    ],
                  },
                  siege: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsOpponent.siege._id,
                      }),
                    ],
                  },
                }),
              ],
            }),
          ],
        }),
        unitBeingPlayed,
        otherUnits: [
          unitsSelf.close,
          unitsSelf.ranged,
          unitsSelf.siege,
          unitsOpponent.close,
          unitsOpponent.ranged,
          unitsOpponent.siege,
        ],
      })
    })
    it('calls to UnitStore to get all units ignoring unitBeingPlayed for units that are same across players', async () => {
      await testGetRoundUnits({
        game: TestUtil.getDbGame({
          round: 1,
          players: [
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({
                  close: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsSelf.close._id,
                      }),
                    ],
                  },
                  ranged: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsSelf.ranged._id,
                      }),
                    ],
                  },
                  siege: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsSelf.siege._id,
                      }),
                    ],
                  },
                }),
              ],
            }),
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({
                  close: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsSelf.close._id,
                      }),
                    ],
                  },
                  ranged: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsSelf.ranged._id,
                      }),
                    ],
                  },
                  siege: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsSelf.siege._id,
                      }),
                    ],
                  },
                }),
              ],
            }),
          ],
        }),
        unitBeingPlayed,
        otherUnits: [unitsSelf.close, unitsSelf.ranged, unitsSelf.siege],
      })
    })
  })
  describe('round 2', () => {
    it('calls to UnitStore to get all units ignoring unitBeingPlayed for units in close combat without modifiers', async () => {
      await testGetRoundUnits({
        game: TestUtil.getDbGame({
          round: 2,
          players: [
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({
                  close: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsSelf.close._id,
                      }),
                    ],
                  },
                }),
              ],
            }),
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({
                  close: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsOpponent.close._id,
                      }),
                    ],
                  },
                }),
              ],
            }),
          ],
        }),
        unitBeingPlayed,
        otherUnits: [unitsSelf.close, unitsOpponent.close],
      })
    })
    it('calls to UnitStore to get all units ignoring unitBeingPlayed for units in close combat with modifiers', async () => {
      await testGetRoundUnits({
        game: TestUtil.getDbGame({
          round: 2,
          players: [
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({
                  close: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsSelf.close._id,
                      }),
                    ],
                    modifier: TestUtil.getDbGameUnit({
                      id: unitsSelf.modifier._id,
                    }),
                  },
                }),
              ],
            }),
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({
                  close: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsOpponent.close._id,
                      }),
                    ],
                    modifier: TestUtil.getDbGameUnit({
                      id: unitsOpponent.modifier._id,
                    }),
                  },
                }),
              ],
            }),
          ],
        }),
        unitBeingPlayed,
        otherUnits: [unitsSelf.close, unitsSelf.modifier, unitsOpponent.close, unitsOpponent.modifier],
      })
    })
    it('calls to UnitStore to get all units ignoring unitBeingPlayed for units in ranged combat without modifiers', async () => {
      await testGetRoundUnits({
        game: TestUtil.getDbGame({
          round: 2,
          players: [
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({
                  ranged: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsSelf.ranged._id,
                      }),
                    ],
                  },
                }),
              ],
            }),
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({
                  ranged: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsOpponent.ranged._id,
                      }),
                    ],
                  },
                }),
              ],
            }),
          ],
        }),
        unitBeingPlayed,
        otherUnits: [unitsSelf.ranged, unitsOpponent.ranged],
      })
    })
    it('calls to UnitStore to get all units ignoring unitBeingPlayed for units in ranged combat with modifiers', async () => {
      await testGetRoundUnits({
        game: TestUtil.getDbGame({
          round: 2,
          players: [
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({
                  ranged: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsSelf.ranged._id,
                      }),
                    ],
                    modifier: TestUtil.getDbGameUnit({
                      id: unitsSelf.modifier._id,
                    }),
                  },
                }),
              ],
            }),
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({
                  ranged: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsOpponent.ranged._id,
                      }),
                    ],
                    modifier: TestUtil.getDbGameUnit({
                      id: unitsOpponent.modifier._id,
                    }),
                  },
                }),
              ],
            }),
          ],
        }),
        unitBeingPlayed,
        otherUnits: [unitsSelf.ranged, unitsSelf.modifier, unitsOpponent.ranged, unitsOpponent.modifier],
      })
    })
    it('calls to UnitStore to get all units ignoring unitBeingPlayed for units in siege combat without modifiers', async () => {
      await testGetRoundUnits({
        game: TestUtil.getDbGame({
          round: 2,
          players: [
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({
                  siege: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsSelf.siege._id,
                      }),
                    ],
                  },
                }),
              ],
            }),
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({
                  siege: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsOpponent.siege._id,
                      }),
                    ],
                  },
                }),
              ],
            }),
          ],
        }),
        unitBeingPlayed,
        otherUnits: [unitsSelf.siege, unitsOpponent.siege],
      })
    })
    it('calls to UnitStore to get all units ignoring unitBeingPlayed for units in siege combat with modifiers', async () => {
      await testGetRoundUnits({
        game: TestUtil.getDbGame({
          round: 2,
          players: [
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({
                  siege: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsSelf.siege._id,
                      }),
                    ],
                    modifier: TestUtil.getDbGameUnit({
                      id: unitsSelf.modifier._id,
                    }),
                  },
                }),
              ],
            }),
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({
                  siege: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsOpponent.siege._id,
                      }),
                    ],
                    modifier: TestUtil.getDbGameUnit({
                      id: unitsOpponent.modifier._id,
                    }),
                  },
                }),
              ],
            }),
          ],
        }),
        unitBeingPlayed,
        otherUnits: [unitsSelf.siege, unitsSelf.modifier, unitsOpponent.siege, unitsOpponent.modifier],
      })
    })
    it('calls to UnitStore to get all units ignoring unitBeingPlayed for units in all combats', async () => {
      await testGetRoundUnits({
        game: TestUtil.getDbGame({
          round: 2,
          players: [
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({
                  close: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsSelf.close._id,
                      }),
                    ],
                  },
                  ranged: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsSelf.ranged._id,
                      }),
                    ],
                  },
                  siege: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsSelf.siege._id,
                      }),
                    ],
                  },
                }),
              ],
            }),
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({
                  close: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsOpponent.close._id,
                      }),
                    ],
                  },
                  ranged: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsOpponent.ranged._id,
                      }),
                    ],
                  },
                  siege: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsOpponent.siege._id,
                      }),
                    ],
                  },
                }),
              ],
            }),
          ],
        }),
        unitBeingPlayed,
        otherUnits: [
          unitsSelf.close,
          unitsSelf.ranged,
          unitsSelf.siege,
          unitsOpponent.close,
          unitsOpponent.ranged,
          unitsOpponent.siege,
        ],
      })
    })
    it('calls to UnitStore to get all units ignoring unitBeingPlayed for units that are same across players', async () => {
      await testGetRoundUnits({
        game: TestUtil.getDbGame({
          round: 2,
          players: [
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({
                  close: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsSelf.close._id,
                      }),
                    ],
                  },
                  ranged: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsSelf.ranged._id,
                      }),
                    ],
                  },
                  siege: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsSelf.siege._id,
                      }),
                    ],
                  },
                }),
              ],
            }),
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({
                  close: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsSelf.close._id,
                      }),
                    ],
                  },
                  ranged: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsSelf.ranged._id,
                      }),
                    ],
                  },
                  siege: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsSelf.siege._id,
                      }),
                    ],
                  },
                }),
              ],
            }),
          ],
        }),
        unitBeingPlayed,
        otherUnits: [unitsSelf.close, unitsSelf.ranged, unitsSelf.siege],
      })
    })
  })
  describe('round 3', () => {
    it('calls to UnitStore to get all units ignoring unitBeingPlayed for units in close combat without modifier', async () => {
      await testGetRoundUnits({
        game: TestUtil.getDbGame({
          round: 3,
          players: [
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({
                  close: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsSelf.close._id,
                      }),
                    ],
                  },
                }),
              ],
            }),
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({
                  close: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsOpponent.close._id,
                      }),
                    ],
                  },
                }),
              ],
            }),
          ],
        }),
        unitBeingPlayed,
        otherUnits: [unitsSelf.close, unitsOpponent.close],
      })
    })
    it('calls to UnitStore to get all units ignoring unitBeingPlayed for units in close combat without modifier', async () => {
      await testGetRoundUnits({
        game: TestUtil.getDbGame({
          round: 3,
          players: [
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({
                  close: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsSelf.close._id,
                      }),
                    ],
                    modifier: TestUtil.getDbGameUnit({
                      id: unitsSelf.modifier._id,
                    }),
                  },
                }),
              ],
            }),
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({
                  close: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsOpponent.close._id,
                      }),
                    ],
                    modifier: TestUtil.getDbGameUnit({
                      id: unitsOpponent.modifier._id,
                    }),
                  },
                }),
              ],
            }),
          ],
        }),
        unitBeingPlayed,
        otherUnits: [unitsSelf.close, unitsSelf.modifier, unitsOpponent.close, unitsOpponent.modifier],
      })
    })
    it('calls to UnitStore to get all units ignoring unitBeingPlayed for units in ranged combat without modifier', async () => {
      await testGetRoundUnits({
        game: TestUtil.getDbGame({
          round: 3,
          players: [
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({
                  ranged: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsSelf.ranged._id,
                      }),
                    ],
                  },
                }),
              ],
            }),
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({
                  ranged: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsOpponent.ranged._id,
                      }),
                    ],
                  },
                }),
              ],
            }),
          ],
        }),
        unitBeingPlayed,
        otherUnits: [unitsSelf.ranged, unitsOpponent.ranged],
      })
    })
    it('calls to UnitStore to get all units ignoring unitBeingPlayed for units in ranged combat with modifier', async () => {
      await testGetRoundUnits({
        game: TestUtil.getDbGame({
          round: 3,
          players: [
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({
                  ranged: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsSelf.ranged._id,
                      }),
                    ],
                    modifier: TestUtil.getDbGameUnit({
                      id: unitsSelf.modifier._id,
                    }),
                  },
                }),
              ],
            }),
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({
                  ranged: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsOpponent.ranged._id,
                      }),
                    ],
                    modifier: TestUtil.getDbGameUnit({
                      id: unitsOpponent.modifier._id,
                    }),
                  },
                }),
              ],
            }),
          ],
        }),
        unitBeingPlayed,
        otherUnits: [unitsSelf.ranged, unitsSelf.modifier, unitsOpponent.ranged, unitsOpponent.modifier],
      })
    })
    it('calls to UnitStore to get all units ignoring unitBeingPlayed for units in siege combat without modifier', async () => {
      await testGetRoundUnits({
        game: TestUtil.getDbGame({
          round: 3,
          players: [
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({
                  siege: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsSelf.siege._id,
                      }),
                    ],
                  },
                }),
              ],
            }),
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({
                  siege: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsOpponent.siege._id,
                      }),
                    ],
                  },
                }),
              ],
            }),
          ],
        }),
        unitBeingPlayed,
        otherUnits: [unitsSelf.siege, unitsOpponent.siege],
      })
    })
    it('calls to UnitStore to get all units ignoring unitBeingPlayed for units in siege combat without modifier', async () => {
      await testGetRoundUnits({
        game: TestUtil.getDbGame({
          round: 3,
          players: [
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({
                  siege: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsSelf.siege._id,
                      }),
                    ],
                    modifier: TestUtil.getDbGameUnit({
                      id: unitsSelf.modifier._id,
                    }),
                  },
                }),
              ],
            }),
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({
                  siege: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsOpponent.siege._id,
                      }),
                    ],
                    modifier: TestUtil.getDbGameUnit({
                      id: unitsOpponent.modifier._id,
                    }),
                  },
                }),
              ],
            }),
          ],
        }),
        unitBeingPlayed,
        otherUnits: [unitsSelf.siege, unitsSelf.modifier, unitsOpponent.siege, unitsOpponent.modifier],
      })
    })
    it('calls to UnitStore to get all units ignoring unitBeingPlayed for units in all combats', async () => {
      await testGetRoundUnits({
        game: TestUtil.getDbGame({
          round: 3,
          players: [
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({
                  close: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsSelf.close._id,
                      }),
                    ],
                  },
                  ranged: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsSelf.ranged._id,
                      }),
                    ],
                  },
                  siege: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsSelf.siege._id,
                      }),
                    ],
                  },
                }),
              ],
            }),
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({
                  close: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsOpponent.close._id,
                      }),
                    ],
                  },
                  ranged: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsOpponent.ranged._id,
                      }),
                    ],
                  },
                  siege: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsOpponent.siege._id,
                      }),
                    ],
                  },
                }),
              ],
            }),
          ],
        }),
        unitBeingPlayed,
        otherUnits: [
          unitsSelf.close,
          unitsSelf.ranged,
          unitsSelf.siege,
          unitsOpponent.close,
          unitsOpponent.ranged,
          unitsOpponent.siege,
        ],
      })
    })
    it('calls to UnitStore to get all units ignoring unitBeingPlayed for units that are same across players', async () => {
      await testGetRoundUnits({
        game: TestUtil.getDbGame({
          round: 3,
          players: [
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({
                  close: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsSelf.close._id,
                      }),
                    ],
                  },
                  ranged: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsSelf.ranged._id,
                      }),
                    ],
                  },
                  siege: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsSelf.siege._id,
                      }),
                    ],
                  },
                }),
              ],
            }),
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({
                  close: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsSelf.close._id,
                      }),
                    ],
                  },
                  ranged: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsSelf.ranged._id,
                      }),
                    ],
                  },
                  siege: {
                    score: 0,
                    units: [
                      TestUtil.getDbGameUnit({
                        id: unitsSelf.siege._id,
                      }),
                    ],
                  },
                }),
              ],
            }),
          ],
        }),
        unitBeingPlayed,
        otherUnits: [unitsSelf.close, unitsSelf.ranged, unitsSelf.siege],
      })
    })
  })
})

async function testGetRoundUnits({
  game,
  unitBeingPlayed,
  otherUnits,
}: {
  game: GameDbObject
  unitBeingPlayed: UnitDbObject
  otherUnits: UnitDbObject[]
}) {
  const unitStoreGetSpy = jest.spyOn(UnitStore, 'get').mockResolvedValue(otherUnits)

  await expect(
    getRoundUnits({
      game,
      unitBeingPlayed,
    })
  ).resolves.toEqual([...otherUnits, unitBeingPlayed])

  expect(unitStoreGetSpy.mock.calls).toEqual([
    [
      {
        ids: otherUnits.map((unit) => unit._id.toString()),
      },
    ],
  ])
}
