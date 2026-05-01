import { ObjectId } from 'mongodb'

import { GameDbObject, UnitDbObject } from '@gwent/graphql-schema/database-typings'
import getRoundUnits from '../../src/graphql/resolvers/mutations/util/get-round-units'
import TestUtil from '../util/test-util'
import UnitStore from '../../src/database/stores/unit-store'

describe('get-round-units', () => {
  const unitBeingPlayed = TestUtil.getDbUnit({})
  const unitsSelf = {
    close: TestUtil.getDbUnit({}),
    ranged: TestUtil.getDbUnit({}),
    siege: TestUtil.getDbUnit({}),
    modifier: TestUtil.getDbUnit({}),
    weather: TestUtil.getDbUnit({}),
  }
  const unitsOpponent = {
    close: TestUtil.getDbUnit({}),
    ranged: TestUtil.getDbUnit({}),
    siege: TestUtil.getDbUnit({}),
    modifier: TestUtil.getDbUnit({}),
    weather: TestUtil.getDbUnit({}),
  }
  describe('round 1', () => {
    const round = 1
    describe('close combat', () => {
      describe('unit', () => {
        it('calls to UnitStore to get multiple if none presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.close._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsOpponent.close._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.close, unitsOpponent.close],
          })
        })
        it('calls to UnitStore to get multiple if no unitBeingPlayed', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.close._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsOpponent.close._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitsGetResponse: [unitsSelf.close, unitsOpponent.close],
          })
        })
        it('calls to UnitStore to get multiple if explicit current round', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.close._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsOpponent.close._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
              ],
            }),
            round: round - 1,
            unitsGetResponse: [unitsSelf.close, unitsOpponent.close],
          })
        })
        it('calls to UnitStore to get multiple if explicit not current round', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.close._id,
                          }),
                        ],
                      }),
                    }),
                    TestUtil.getDbPlayerRound({}),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsOpponent.close._id,
                          }),
                        ],
                      }),
                    }),
                    TestUtil.getDbPlayerRound({}),
                  ],
                }),
              ],
            }),
            round,
            unitsGetResponse: [],
          })
        })
        it('calls to UnitStore to get multiple if scoped to specific player', async () => {
          const userId = new ObjectId()
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.close._id,
                          }),
                        ],
                      }),
                    }),
                    TestUtil.getDbPlayerRound({}),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  user: userId,
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsOpponent.close._id,
                          }),
                        ],
                      }),
                    }),
                    TestUtil.getDbPlayerRound({}),
                  ],
                }),
              ],
            }),
            playerId: userId,
            unitsGetResponse: [unitsOpponent.close],
          })
        })
        it('calls to UnitStore to get single ignoring presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.close._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsOpponent.close._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            units: [
              TestUtil.getDbUnit({
                id: unitsSelf.close._id,
              }),
            ],
            unitsGetResponse: [unitsOpponent.close],
          })
        })
        it('calls to UnitStore to get single ignoring duplicate from opponent', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.close._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.close._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.close],
          })
        })
        it('calls to UnitStore to get single ignoring unitBeingPlayed if in opponents hand', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.close._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitBeingPlayed._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.close],
          })
        })
        it('does not call UnitStore if all presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.close._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsOpponent.close._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            units: [
              TestUtil.getDbUnit({
                id: unitsSelf.close._id,
              }),
              TestUtil.getDbUnit({
                id: unitsOpponent.close._id,
              }),
            ],
            unitsGetResponse: [],
          })
        })
      })
      describe('modifier', () => {
        it('calls to UnitStore to get multiple if none presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsOpponent.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.modifier, unitsOpponent.modifier],
          })
        })
        it('calls to UnitStore to get single ignoring presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsOpponent.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            units: [
              TestUtil.getDbUnit({
                id: unitsSelf.modifier._id,
              }),
            ],
            unitsGetResponse: [unitsOpponent.modifier],
          })
        })
        it('calls to UnitStore to get single ignoring duplicate from opponent', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.modifier],
          })
        })
        it('calls to UnitStore to get single ignoring unitBeingPlayed if in opponents hand', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitBeingPlayed._id,
                        }),
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.modifier],
          })
        })
        it('does not call UnitStore if all presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsOpponent.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            units: [
              TestUtil.getDbUnit({
                id: unitsSelf.modifier._id,
              }),
              TestUtil.getDbUnit({
                id: unitsOpponent.modifier._id,
              }),
            ],
            unitsGetResponse: [],
          })
        })
      })
      describe('weather', () => {
        it('calls to UnitStore to get multiple if none presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsOpponent.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.weather, unitsOpponent.weather],
          })
        })
        it('calls to UnitStore to get single ignoring presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsOpponent.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            units: [
              TestUtil.getDbUnit({
                id: unitsSelf.weather._id,
              }),
            ],
            unitsGetResponse: [unitsOpponent.weather],
          })
        })
        it('calls to UnitStore to get single ignoring duplicate from opponent', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.weather],
          })
        })
        it('calls to UnitStore to get single ignoring unitBeingPlayed if in opponents hand', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitBeingPlayed._id,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.weather],
          })
        })
        it('does not call UnitStore if all presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsOpponent.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            units: [
              TestUtil.getDbUnit({
                id: unitsSelf.weather._id,
              }),
              TestUtil.getDbUnit({
                id: unitsOpponent.weather._id,
              }),
            ],
            unitsGetResponse: [],
          })
        })
      })
      describe('all', () => {
        it('calls to UnitStore for all if none presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.close._id,
                          }),
                        ],
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsOpponent.close._id,
                          }),
                        ],
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsOpponent.modifier._id,
                        }),
                      }),
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsOpponent.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [
              unitsSelf.close,
              unitsSelf.modifier,
              unitsSelf.weather,
              unitsOpponent.close,
              unitsOpponent.modifier,
              unitsOpponent.weather,
            ],
          })
        })
        it('does not call to UnitStore if all presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.close._id,
                          }),
                        ],
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsOpponent.close._id,
                          }),
                        ],
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsOpponent.modifier._id,
                        }),
                      }),
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsOpponent.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            units: [
              TestUtil.getDbUnit({
                id: unitsSelf.close._id,
              }),
              TestUtil.getDbUnit({
                id: unitsSelf.modifier._id,
              }),
              TestUtil.getDbUnit({
                id: unitsSelf.weather._id,
              }),
              TestUtil.getDbUnit({
                id: unitsOpponent.close._id,
              }),
              TestUtil.getDbUnit({
                id: unitsOpponent.modifier._id,
              }),
              TestUtil.getDbUnit({
                id: unitsOpponent.weather._id,
              }),
            ],
            unitsGetResponse: [],
          })
        })
      })
    })
    describe('ranged combat', () => {
      describe('unit', () => {
        it('calls to UnitStore to get multiple if none presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.ranged._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsOpponent.ranged._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.ranged, unitsOpponent.ranged],
          })
        })
        it('calls to UnitStore to get single ignoring presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.ranged._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsOpponent.ranged._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            units: [
              TestUtil.getDbUnit({
                id: unitsSelf.ranged._id,
              }),
            ],
            unitsGetResponse: [unitsOpponent.ranged],
          })
        })
        it('calls to UnitStore to get single ignoring duplicate from opponent', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.ranged._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.ranged._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.ranged],
          })
        })
        it('calls to UnitStore to get single ignoring unitBeingPlayed if in opponents hand', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.ranged._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitBeingPlayed._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.ranged],
          })
        })
        it('does not call UnitStore if all presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.ranged._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsOpponent.ranged._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            units: [
              TestUtil.getDbUnit({
                id: unitsSelf.ranged._id,
              }),
              TestUtil.getDbUnit({
                id: unitsOpponent.ranged._id,
              }),
            ],
            unitsGetResponse: [],
          })
        })
      })
      describe('modifier', () => {
        it('calls to UnitStore to get multiple if none presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsOpponent.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.modifier, unitsOpponent.modifier],
          })
        })
        it('calls to UnitStore to get single ignoring presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsOpponent.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            units: [
              TestUtil.getDbUnit({
                id: unitsSelf.modifier._id,
              }),
            ],
            unitsGetResponse: [unitsOpponent.modifier],
          })
        })
        it('calls to UnitStore to get single ignoring duplicate from opponent', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.modifier],
          })
        })
        it('calls to UnitStore to get single ignoring unitBeingPlayed if in opponents hand', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitBeingPlayed._id,
                        }),
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.modifier],
          })
        })
        it('does not call UnitStore if all presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsOpponent.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            units: [
              TestUtil.getDbUnit({
                id: unitsSelf.modifier._id,
              }),
              TestUtil.getDbUnit({
                id: unitsOpponent.modifier._id,
              }),
            ],
            unitsGetResponse: [],
          })
        })
      })
      describe('weather', () => {
        it('calls to UnitStore to get multiple if none presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsOpponent.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.weather, unitsOpponent.weather],
          })
        })
        it('calls to UnitStore to get single ignoring presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsOpponent.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            units: [
              TestUtil.getDbUnit({
                id: unitsSelf.weather._id,
              }),
            ],
            unitsGetResponse: [unitsOpponent.weather],
          })
        })
        it('calls to UnitStore to get single ignoring duplicate from opponent', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.weather],
          })
        })
        it('calls to UnitStore to get single ignoring unitBeingPlayed if in opponents hand', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitBeingPlayed._id,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.weather],
          })
        })
        it('does not call UnitStore if all presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsOpponent.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            units: [
              TestUtil.getDbUnit({
                id: unitsSelf.weather._id,
              }),
              TestUtil.getDbUnit({
                id: unitsOpponent.weather._id,
              }),
            ],
            unitsGetResponse: [],
          })
        })
      })
      describe('all', () => {
        it('calls to UnitStore for all if none presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.ranged._id,
                          }),
                        ],
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsOpponent.ranged._id,
                          }),
                        ],
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsOpponent.modifier._id,
                        }),
                      }),
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsOpponent.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [
              unitsSelf.ranged,
              unitsSelf.modifier,
              unitsSelf.weather,
              unitsOpponent.ranged,
              unitsOpponent.modifier,
              unitsOpponent.weather,
            ],
          })
        })
        it('does not call to UnitStore if all presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.ranged._id,
                          }),
                        ],
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsOpponent.ranged._id,
                          }),
                        ],
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsOpponent.modifier._id,
                        }),
                      }),
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsOpponent.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            units: [
              TestUtil.getDbUnit({
                id: unitsSelf.ranged._id,
              }),
              TestUtil.getDbUnit({
                id: unitsSelf.modifier._id,
              }),
              TestUtil.getDbUnit({
                id: unitsSelf.weather._id,
              }),
              TestUtil.getDbUnit({
                id: unitsOpponent.ranged._id,
              }),
              TestUtil.getDbUnit({
                id: unitsOpponent.modifier._id,
              }),
              TestUtil.getDbUnit({
                id: unitsOpponent.weather._id,
              }),
            ],
            unitsGetResponse: [],
          })
        })
      })
    })
    describe('siege combat', () => {
      describe('unit', () => {
        it('calls to UnitStore to get multiple if none presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.siege._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsOpponent.siege._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.siege, unitsOpponent.siege],
          })
        })
        it('calls to UnitStore to get single ignoring presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.siege._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsOpponent.siege._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            units: [
              TestUtil.getDbUnit({
                id: unitsSelf.siege._id,
              }),
            ],
            unitsGetResponse: [unitsOpponent.siege],
          })
        })
        it('calls to UnitStore to get single ignoring duplicate from opponent', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.siege._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.siege._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.siege],
          })
        })
        it('calls to UnitStore to get single ignoring unitBeingPlayed if in opponents hand', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.siege._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitBeingPlayed._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.siege],
          })
        })
        it('does not call UnitStore if all presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.siege._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsOpponent.siege._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            units: [
              TestUtil.getDbUnit({
                id: unitsSelf.siege._id,
              }),
              TestUtil.getDbUnit({
                id: unitsOpponent.siege._id,
              }),
            ],
            unitsGetResponse: [],
          })
        })
      })
      describe('modifier', () => {
        it('calls to UnitStore to get multiple if none presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsOpponent.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.modifier, unitsOpponent.modifier],
          })
        })
        it('calls to UnitStore to get single ignoring presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsOpponent.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            units: [
              TestUtil.getDbUnit({
                id: unitsSelf.modifier._id,
              }),
            ],
            unitsGetResponse: [unitsOpponent.modifier],
          })
        })
        it('calls to UnitStore to get single ignoring duplicate from opponent', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.modifier],
          })
        })
        it('calls to UnitStore to get single ignoring unitBeingPlayed if in opponents hand', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitBeingPlayed._id,
                        }),
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.modifier],
          })
        })
        it('does not call UnitStore if all presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsOpponent.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            units: [
              TestUtil.getDbUnit({
                id: unitsSelf.modifier._id,
              }),
              TestUtil.getDbUnit({
                id: unitsOpponent.modifier._id,
              }),
            ],
            unitsGetResponse: [],
          })
        })
      })
      describe('weather', () => {
        it('calls to UnitStore to get multiple if none presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsOpponent.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.weather, unitsOpponent.weather],
          })
        })
        it('calls to UnitStore to get single ignoring presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsOpponent.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            units: [
              TestUtil.getDbUnit({
                id: unitsSelf.weather._id,
              }),
            ],
            unitsGetResponse: [unitsOpponent.weather],
          })
        })
        it('calls to UnitStore to get single ignoring duplicate from opponent', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.weather],
          })
        })
        it('calls to UnitStore to get single ignoring unitBeingPlayed if in opponents hand', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitBeingPlayed._id,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.weather],
          })
        })
        it('does not call UnitStore if all presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsOpponent.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            units: [
              TestUtil.getDbUnit({
                id: unitsSelf.weather._id,
              }),
              TestUtil.getDbUnit({
                id: unitsOpponent.weather._id,
              }),
            ],
            unitsGetResponse: [],
          })
        })
      })
      describe('all', () => {
        it('calls to UnitStore for all if none presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.siege._id,
                          }),
                        ],
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsOpponent.siege._id,
                          }),
                        ],
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsOpponent.modifier._id,
                        }),
                      }),
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsOpponent.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [
              unitsSelf.siege,
              unitsSelf.modifier,
              unitsSelf.weather,
              unitsOpponent.siege,
              unitsOpponent.modifier,
              unitsOpponent.weather,
            ],
          })
        })
        it('does not call to UnitStore if all presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.siege._id,
                          }),
                        ],
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsOpponent.siege._id,
                          }),
                        ],
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsOpponent.modifier._id,
                        }),
                      }),
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsOpponent.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            units: [
              TestUtil.getDbUnit({
                id: unitsSelf.siege._id,
              }),
              TestUtil.getDbUnit({
                id: unitsSelf.modifier._id,
              }),
              TestUtil.getDbUnit({
                id: unitsSelf.weather._id,
              }),
              TestUtil.getDbUnit({
                id: unitsOpponent.siege._id,
              }),
              TestUtil.getDbUnit({
                id: unitsOpponent.modifier._id,
              }),
              TestUtil.getDbUnit({
                id: unitsOpponent.weather._id,
              }),
            ],
            unitsGetResponse: [],
          })
        })
      })
    })
    describe('all combats', () => {
      it('calls to UnitStore to get multiple if none presolved', async () => {
        await testGetRoundUnits({
          game: TestUtil.getDbGame({
            round,
            players: [
              TestUtil.getDbGamePlayer({
                rounds: [
                  TestUtil.getDbPlayerRound({
                    close: TestUtil.getDbPlayerCombatRow({
                      units: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.close._id,
                        }),
                      ],
                    }),
                    ranged: TestUtil.getDbPlayerCombatRow({
                      units: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.ranged._id,
                        }),
                      ],
                    }),
                    siege: TestUtil.getDbPlayerCombatRow({
                      units: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.siege._id,
                        }),
                      ],
                    }),
                  }),
                ],
              }),
              TestUtil.getDbGamePlayer({
                rounds: [
                  TestUtil.getDbPlayerRound({
                    close: TestUtil.getDbPlayerCombatRow({
                      units: [
                        TestUtil.getDbFieldUnit({
                          id: unitsOpponent.close._id,
                        }),
                      ],
                    }),
                    ranged: TestUtil.getDbPlayerCombatRow({
                      units: [
                        TestUtil.getDbFieldUnit({
                          id: unitsOpponent.ranged._id,
                        }),
                      ],
                    }),
                    siege: TestUtil.getDbPlayerCombatRow({
                      units: [
                        TestUtil.getDbFieldUnit({
                          id: unitsOpponent.siege._id,
                        }),
                      ],
                    }),
                  }),
                ],
              }),
            ],
          }),
          unitBeingPlayed,
          unitsGetResponse: [
            unitsSelf.close,
            unitsSelf.ranged,
            unitsSelf.siege,
            unitsOpponent.close,
            unitsOpponent.ranged,
            unitsOpponent.siege,
          ],
        })
      })
      it('does not call to UnitStore if all presolved', async () => {
        await testGetRoundUnits({
          game: TestUtil.getDbGame({
            round,
            players: [
              TestUtil.getDbGamePlayer({
                rounds: [
                  TestUtil.getDbPlayerRound({
                    close: TestUtil.getDbPlayerCombatRow({
                      units: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.close._id,
                        }),
                      ],
                    }),
                    ranged: TestUtil.getDbPlayerCombatRow({
                      units: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.ranged._id,
                        }),
                      ],
                    }),
                    siege: TestUtil.getDbPlayerCombatRow({
                      units: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.siege._id,
                        }),
                      ],
                    }),
                  }),
                ],
              }),
              TestUtil.getDbGamePlayer({
                rounds: [
                  TestUtil.getDbPlayerRound({
                    close: TestUtil.getDbPlayerCombatRow({
                      units: [
                        TestUtil.getDbFieldUnit({
                          id: unitsOpponent.close._id,
                        }),
                      ],
                    }),
                    ranged: TestUtil.getDbPlayerCombatRow({
                      units: [
                        TestUtil.getDbFieldUnit({
                          id: unitsOpponent.ranged._id,
                        }),
                      ],
                    }),
                    siege: TestUtil.getDbPlayerCombatRow({
                      units: [
                        TestUtil.getDbFieldUnit({
                          id: unitsOpponent.siege._id,
                        }),
                      ],
                    }),
                  }),
                ],
              }),
            ],
          }),
          unitBeingPlayed,
          units: [
            TestUtil.getDbUnit({
              id: unitsSelf.close._id,
            }),
            TestUtil.getDbUnit({
              id: unitsSelf.ranged._id,
            }),
            TestUtil.getDbUnit({
              id: unitsSelf.siege._id,
            }),
            TestUtil.getDbUnit({
              id: unitsOpponent.close._id,
            }),
            TestUtil.getDbUnit({
              id: unitsOpponent.ranged._id,
            }),
            TestUtil.getDbUnit({
              id: unitsOpponent.siege._id,
            }),
          ],
          unitsGetResponse: [],
        })
      })
    })
  })
  describe('round 2', () => {
    const round = 2
    describe('close combat', () => {
      describe('unit', () => {
        it('calls to UnitStore to get multiple if none presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.close._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsOpponent.close._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.close, unitsOpponent.close],
          })
        })
        it('calls to UnitStore to get single ignoring presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.close._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsOpponent.close._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            units: [
              TestUtil.getDbUnit({
                id: unitsSelf.close._id,
              }),
            ],
            unitsGetResponse: [unitsOpponent.close],
          })
        })
        it('calls to UnitStore to get single ignoring duplicate from opponent', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.close._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.close._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.close],
          })
        })
        it('calls to UnitStore to get single ignoring unitBeingPlayed if in opponents hand', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.close._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitBeingPlayed._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.close],
          })
        })
        it('does not call UnitStore if all presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.close._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsOpponent.close._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            units: [
              TestUtil.getDbUnit({
                id: unitsSelf.close._id,
              }),
              TestUtil.getDbUnit({
                id: unitsOpponent.close._id,
              }),
            ],
            unitsGetResponse: [],
          })
        })
      })
      describe('modifier', () => {
        it('calls to UnitStore to get multiple if none presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsOpponent.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.modifier, unitsOpponent.modifier],
          })
        })
        it('calls to UnitStore to get single ignoring presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsOpponent.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            units: [
              TestUtil.getDbUnit({
                id: unitsSelf.modifier._id,
              }),
            ],
            unitsGetResponse: [unitsOpponent.modifier],
          })
        })
        it('calls to UnitStore to get single ignoring duplicate from opponent', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.modifier],
          })
        })
        it('calls to UnitStore to get single ignoring unitBeingPlayed if in opponents hand', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitBeingPlayed._id,
                        }),
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.modifier],
          })
        })
        it('does not call UnitStore if all presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsOpponent.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            units: [
              TestUtil.getDbUnit({
                id: unitsSelf.modifier._id,
              }),
              TestUtil.getDbUnit({
                id: unitsOpponent.modifier._id,
              }),
            ],
            unitsGetResponse: [],
          })
        })
      })
      describe('weather', () => {
        it('calls to UnitStore to get multiple if none presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsOpponent.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.weather, unitsOpponent.weather],
          })
        })
        it('calls to UnitStore to get single ignoring presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsOpponent.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            units: [
              TestUtil.getDbUnit({
                id: unitsSelf.weather._id,
              }),
            ],
            unitsGetResponse: [unitsOpponent.weather],
          })
        })
        it('calls to UnitStore to get single ignoring duplicate from opponent', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.weather],
          })
        })
        it('calls to UnitStore to get single ignoring unitBeingPlayed if in opponents hand', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitBeingPlayed._id,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.weather],
          })
        })
        it('does not call UnitStore if all presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsOpponent.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            units: [
              TestUtil.getDbUnit({
                id: unitsSelf.weather._id,
              }),
              TestUtil.getDbUnit({
                id: unitsOpponent.weather._id,
              }),
            ],
            unitsGetResponse: [],
          })
        })
      })
      describe('all', () => {
        it('calls to UnitStore for all if none presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.close._id,
                          }),
                        ],
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsOpponent.close._id,
                          }),
                        ],
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsOpponent.modifier._id,
                        }),
                      }),
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsOpponent.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [
              unitsSelf.close,
              unitsSelf.modifier,
              unitsSelf.weather,
              unitsOpponent.close,
              unitsOpponent.modifier,
              unitsOpponent.weather,
            ],
          })
        })
        it('does not call to UnitStore if all presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.close._id,
                          }),
                        ],
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsOpponent.close._id,
                          }),
                        ],
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsOpponent.modifier._id,
                        }),
                      }),
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsOpponent.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            units: [
              TestUtil.getDbUnit({
                id: unitsSelf.close._id,
              }),
              TestUtil.getDbUnit({
                id: unitsSelf.modifier._id,
              }),
              TestUtil.getDbUnit({
                id: unitsSelf.weather._id,
              }),
              TestUtil.getDbUnit({
                id: unitsOpponent.close._id,
              }),
              TestUtil.getDbUnit({
                id: unitsOpponent.modifier._id,
              }),
              TestUtil.getDbUnit({
                id: unitsOpponent.weather._id,
              }),
            ],
            unitsGetResponse: [],
          })
        })
      })
    })
    describe('ranged combat', () => {
      describe('unit', () => {
        it('calls to UnitStore to get multiple if none presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.ranged._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsOpponent.ranged._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.ranged, unitsOpponent.ranged],
          })
        })
        it('calls to UnitStore to get single ignoring presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.ranged._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsOpponent.ranged._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            units: [
              TestUtil.getDbUnit({
                id: unitsSelf.ranged._id,
              }),
            ],
            unitsGetResponse: [unitsOpponent.ranged],
          })
        })
        it('calls to UnitStore to get single ignoring duplicate from opponent', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.ranged._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.ranged._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.ranged],
          })
        })
        it('calls to UnitStore to get single ignoring unitBeingPlayed if in opponents hand', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.ranged._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitBeingPlayed._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.ranged],
          })
        })
        it('does not call UnitStore if all presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.ranged._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsOpponent.ranged._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            units: [
              TestUtil.getDbUnit({
                id: unitsSelf.ranged._id,
              }),
              TestUtil.getDbUnit({
                id: unitsOpponent.ranged._id,
              }),
            ],
            unitsGetResponse: [],
          })
        })
      })
      describe('modifier', () => {
        it('calls to UnitStore to get multiple if none presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsOpponent.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.modifier, unitsOpponent.modifier],
          })
        })
        it('calls to UnitStore to get single ignoring presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsOpponent.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            units: [
              TestUtil.getDbUnit({
                id: unitsSelf.modifier._id,
              }),
            ],
            unitsGetResponse: [unitsOpponent.modifier],
          })
        })
        it('calls to UnitStore to get single ignoring duplicate from opponent', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.modifier],
          })
        })
        it('calls to UnitStore to get single ignoring unitBeingPlayed if in opponents hand', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitBeingPlayed._id,
                        }),
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.modifier],
          })
        })
        it('does not call UnitStore if all presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsOpponent.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            units: [
              TestUtil.getDbUnit({
                id: unitsSelf.modifier._id,
              }),
              TestUtil.getDbUnit({
                id: unitsOpponent.modifier._id,
              }),
            ],
            unitsGetResponse: [],
          })
        })
      })
      describe('weather', () => {
        it('calls to UnitStore to get multiple if none presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsOpponent.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.weather, unitsOpponent.weather],
          })
        })
        it('calls to UnitStore to get single ignoring presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsOpponent.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            units: [
              TestUtil.getDbUnit({
                id: unitsSelf.weather._id,
              }),
            ],
            unitsGetResponse: [unitsOpponent.weather],
          })
        })
        it('calls to UnitStore to get single ignoring duplicate from opponent', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.weather],
          })
        })
        it('calls to UnitStore to get single ignoring unitBeingPlayed if in opponents hand', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitBeingPlayed._id,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.weather],
          })
        })
        it('does not call UnitStore if all presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsOpponent.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            units: [
              TestUtil.getDbUnit({
                id: unitsSelf.weather._id,
              }),
              TestUtil.getDbUnit({
                id: unitsOpponent.weather._id,
              }),
            ],
            unitsGetResponse: [],
          })
        })
      })
      describe('all', () => {
        it('calls to UnitStore for all if none presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.ranged._id,
                          }),
                        ],
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsOpponent.ranged._id,
                          }),
                        ],
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsOpponent.modifier._id,
                        }),
                      }),
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsOpponent.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [
              unitsSelf.ranged,
              unitsSelf.modifier,
              unitsSelf.weather,
              unitsOpponent.ranged,
              unitsOpponent.modifier,
              unitsOpponent.weather,
            ],
          })
        })
        it('does not call to UnitStore if all presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.ranged._id,
                          }),
                        ],
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsOpponent.ranged._id,
                          }),
                        ],
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsOpponent.modifier._id,
                        }),
                      }),
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsOpponent.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            units: [
              TestUtil.getDbUnit({
                id: unitsSelf.ranged._id,
              }),
              TestUtil.getDbUnit({
                id: unitsSelf.modifier._id,
              }),
              TestUtil.getDbUnit({
                id: unitsSelf.weather._id,
              }),
              TestUtil.getDbUnit({
                id: unitsOpponent.ranged._id,
              }),
              TestUtil.getDbUnit({
                id: unitsOpponent.modifier._id,
              }),
              TestUtil.getDbUnit({
                id: unitsOpponent.weather._id,
              }),
            ],
            unitsGetResponse: [],
          })
        })
      })
    })
    describe('siege combat', () => {
      describe('unit', () => {
        it('calls to UnitStore to get multiple if none presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.siege._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsOpponent.siege._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.siege, unitsOpponent.siege],
          })
        })
        it('calls to UnitStore to get single ignoring presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.siege._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsOpponent.siege._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            units: [
              TestUtil.getDbUnit({
                id: unitsSelf.siege._id,
              }),
            ],
            unitsGetResponse: [unitsOpponent.siege],
          })
        })
        it('calls to UnitStore to get single ignoring duplicate from opponent', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.siege._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.siege._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.siege],
          })
        })
        it('calls to UnitStore to get single ignoring unitBeingPlayed if in opponents hand', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.siege._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitBeingPlayed._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.siege],
          })
        })
        it('does not call UnitStore if all presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.siege._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsOpponent.siege._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            units: [
              TestUtil.getDbUnit({
                id: unitsSelf.siege._id,
              }),
              TestUtil.getDbUnit({
                id: unitsOpponent.siege._id,
              }),
            ],
            unitsGetResponse: [],
          })
        })
      })
      describe('modifier', () => {
        it('calls to UnitStore to get multiple if none presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsOpponent.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.modifier, unitsOpponent.modifier],
          })
        })
        it('calls to UnitStore to get single ignoring presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsOpponent.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            units: [
              TestUtil.getDbUnit({
                id: unitsSelf.modifier._id,
              }),
            ],
            unitsGetResponse: [unitsOpponent.modifier],
          })
        })
        it('calls to UnitStore to get single ignoring duplicate from opponent', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.modifier],
          })
        })
        it('calls to UnitStore to get single ignoring unitBeingPlayed if in opponents hand', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitBeingPlayed._id,
                        }),
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.modifier],
          })
        })
        it('does not call UnitStore if all presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsOpponent.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            units: [
              TestUtil.getDbUnit({
                id: unitsSelf.modifier._id,
              }),
              TestUtil.getDbUnit({
                id: unitsOpponent.modifier._id,
              }),
            ],
            unitsGetResponse: [],
          })
        })
      })
      describe('weather', () => {
        it('calls to UnitStore to get multiple if none presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsOpponent.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.weather, unitsOpponent.weather],
          })
        })
        it('calls to UnitStore to get single ignoring presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsOpponent.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            units: [
              TestUtil.getDbUnit({
                id: unitsSelf.weather._id,
              }),
            ],
            unitsGetResponse: [unitsOpponent.weather],
          })
        })
        it('calls to UnitStore to get single ignoring duplicate from opponent', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.weather],
          })
        })
        it('calls to UnitStore to get single ignoring unitBeingPlayed if in opponents hand', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitBeingPlayed._id,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.weather],
          })
        })
        it('does not call UnitStore if all presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsOpponent.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            units: [
              TestUtil.getDbUnit({
                id: unitsSelf.weather._id,
              }),
              TestUtil.getDbUnit({
                id: unitsOpponent.weather._id,
              }),
            ],
            unitsGetResponse: [],
          })
        })
      })
      describe('all', () => {
        it('calls to UnitStore for all if none presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.siege._id,
                          }),
                        ],
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsOpponent.siege._id,
                          }),
                        ],
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsOpponent.modifier._id,
                        }),
                      }),
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsOpponent.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [
              unitsSelf.siege,
              unitsSelf.modifier,
              unitsSelf.weather,
              unitsOpponent.siege,
              unitsOpponent.modifier,
              unitsOpponent.weather,
            ],
          })
        })
        it('does not call to UnitStore if all presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.siege._id,
                          }),
                        ],
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsOpponent.siege._id,
                          }),
                        ],
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsOpponent.modifier._id,
                        }),
                      }),
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsOpponent.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            units: [
              TestUtil.getDbUnit({
                id: unitsSelf.siege._id,
              }),
              TestUtil.getDbUnit({
                id: unitsSelf.modifier._id,
              }),
              TestUtil.getDbUnit({
                id: unitsSelf.weather._id,
              }),
              TestUtil.getDbUnit({
                id: unitsOpponent.siege._id,
              }),
              TestUtil.getDbUnit({
                id: unitsOpponent.modifier._id,
              }),
              TestUtil.getDbUnit({
                id: unitsOpponent.weather._id,
              }),
            ],
            unitsGetResponse: [],
          })
        })
      })
    })
    describe('all combats', () => {
      it('calls to UnitStore to get multiple if none presolved', async () => {
        await testGetRoundUnits({
          game: TestUtil.getDbGame({
            round,
            players: [
              TestUtil.getDbGamePlayer({
                rounds: [
                  TestUtil.getDbPlayerRound({}),
                  TestUtil.getDbPlayerRound({
                    close: TestUtil.getDbPlayerCombatRow({
                      units: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.close._id,
                        }),
                      ],
                    }),
                    ranged: TestUtil.getDbPlayerCombatRow({
                      units: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.ranged._id,
                        }),
                      ],
                    }),
                    siege: TestUtil.getDbPlayerCombatRow({
                      units: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.siege._id,
                        }),
                      ],
                    }),
                  }),
                ],
              }),
              TestUtil.getDbGamePlayer({
                rounds: [
                  TestUtil.getDbPlayerRound({}),
                  TestUtil.getDbPlayerRound({
                    close: TestUtil.getDbPlayerCombatRow({
                      units: [
                        TestUtil.getDbFieldUnit({
                          id: unitsOpponent.close._id,
                        }),
                      ],
                    }),
                    ranged: TestUtil.getDbPlayerCombatRow({
                      units: [
                        TestUtil.getDbFieldUnit({
                          id: unitsOpponent.ranged._id,
                        }),
                      ],
                    }),
                    siege: TestUtil.getDbPlayerCombatRow({
                      units: [
                        TestUtil.getDbFieldUnit({
                          id: unitsOpponent.siege._id,
                        }),
                      ],
                    }),
                  }),
                ],
              }),
            ],
          }),
          unitBeingPlayed,
          unitsGetResponse: [
            unitsSelf.close,
            unitsSelf.ranged,
            unitsSelf.siege,
            unitsOpponent.close,
            unitsOpponent.ranged,
            unitsOpponent.siege,
          ],
        })
      })
      it('does not call to UnitStore if all presolved', async () => {
        await testGetRoundUnits({
          game: TestUtil.getDbGame({
            round,
            players: [
              TestUtil.getDbGamePlayer({
                rounds: [
                  TestUtil.getDbPlayerRound({}),
                  TestUtil.getDbPlayerRound({
                    close: TestUtil.getDbPlayerCombatRow({
                      units: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.close._id,
                        }),
                      ],
                    }),
                    ranged: TestUtil.getDbPlayerCombatRow({
                      units: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.ranged._id,
                        }),
                      ],
                    }),
                    siege: TestUtil.getDbPlayerCombatRow({
                      units: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.siege._id,
                        }),
                      ],
                    }),
                  }),
                ],
              }),
              TestUtil.getDbGamePlayer({
                rounds: [
                  TestUtil.getDbPlayerRound({}),
                  TestUtil.getDbPlayerRound({
                    close: TestUtil.getDbPlayerCombatRow({
                      units: [
                        TestUtil.getDbFieldUnit({
                          id: unitsOpponent.close._id,
                        }),
                      ],
                    }),
                    ranged: TestUtil.getDbPlayerCombatRow({
                      units: [
                        TestUtil.getDbFieldUnit({
                          id: unitsOpponent.ranged._id,
                        }),
                      ],
                    }),
                    siege: TestUtil.getDbPlayerCombatRow({
                      units: [
                        TestUtil.getDbFieldUnit({
                          id: unitsOpponent.siege._id,
                        }),
                      ],
                    }),
                  }),
                ],
              }),
            ],
          }),
          unitBeingPlayed,
          units: [
            TestUtil.getDbUnit({
              id: unitsSelf.close._id,
            }),
            TestUtil.getDbUnit({
              id: unitsSelf.ranged._id,
            }),
            TestUtil.getDbUnit({
              id: unitsSelf.siege._id,
            }),
            TestUtil.getDbUnit({
              id: unitsOpponent.close._id,
            }),
            TestUtil.getDbUnit({
              id: unitsOpponent.ranged._id,
            }),
            TestUtil.getDbUnit({
              id: unitsOpponent.siege._id,
            }),
          ],
          unitsGetResponse: [],
        })
      })
    })
  })
  describe('round 3', () => {
    const round = 3
    describe('close combat', () => {
      describe('unit', () => {
        it('calls to UnitStore to get multiple if none presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.close._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsOpponent.close._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.close, unitsOpponent.close],
          })
        })
        it('calls to UnitStore to get single ignoring presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.close._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsOpponent.close._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            units: [
              TestUtil.getDbUnit({
                id: unitsSelf.close._id,
              }),
            ],
            unitsGetResponse: [unitsOpponent.close],
          })
        })
        it('calls to UnitStore to get single ignoring duplicate from opponent', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.close._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.close._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.close],
          })
        })
        it('calls to UnitStore to get single ignoring unitBeingPlayed if in opponents hand', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.close._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitBeingPlayed._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.close],
          })
        })
        it('does not call UnitStore if all presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.close._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsOpponent.close._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            units: [
              TestUtil.getDbUnit({
                id: unitsSelf.close._id,
              }),
              TestUtil.getDbUnit({
                id: unitsOpponent.close._id,
              }),
            ],
            unitsGetResponse: [],
          })
        })
      })
      describe('modifier', () => {
        it('calls to UnitStore to get multiple if none presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsOpponent.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.modifier, unitsOpponent.modifier],
          })
        })
        it('calls to UnitStore to get single ignoring presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsOpponent.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            units: [
              TestUtil.getDbUnit({
                id: unitsSelf.modifier._id,
              }),
            ],
            unitsGetResponse: [unitsOpponent.modifier],
          })
        })
        it('calls to UnitStore to get single ignoring duplicate from opponent', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.modifier],
          })
        })
        it('calls to UnitStore to get single ignoring unitBeingPlayed if in opponents hand', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitBeingPlayed._id,
                        }),
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.modifier],
          })
        })
        it('does not call UnitStore if all presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsOpponent.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            units: [
              TestUtil.getDbUnit({
                id: unitsSelf.modifier._id,
              }),
              TestUtil.getDbUnit({
                id: unitsOpponent.modifier._id,
              }),
            ],
            unitsGetResponse: [],
          })
        })
      })
      describe('weather', () => {
        it('calls to UnitStore to get multiple if none presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsOpponent.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.weather, unitsOpponent.weather],
          })
        })
        it('calls to UnitStore to get single ignoring presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsOpponent.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            units: [
              TestUtil.getDbUnit({
                id: unitsSelf.weather._id,
              }),
            ],
            unitsGetResponse: [unitsOpponent.weather],
          })
        })
        it('calls to UnitStore to get single ignoring duplicate from opponent', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.weather],
          })
        })
        it('calls to UnitStore to get single ignoring unitBeingPlayed if in opponents hand', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitBeingPlayed._id,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.weather],
          })
        })
        it('does not call UnitStore if all presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsOpponent.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            units: [
              TestUtil.getDbUnit({
                id: unitsSelf.weather._id,
              }),
              TestUtil.getDbUnit({
                id: unitsOpponent.weather._id,
              }),
            ],
            unitsGetResponse: [],
          })
        })
      })
      describe('all', () => {
        it('calls to UnitStore for all if none presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.close._id,
                          }),
                        ],
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsOpponent.close._id,
                          }),
                        ],
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsOpponent.modifier._id,
                        }),
                      }),
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsOpponent.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [
              unitsSelf.close,
              unitsSelf.modifier,
              unitsSelf.weather,
              unitsOpponent.close,
              unitsOpponent.modifier,
              unitsOpponent.weather,
            ],
          })
        })
        it('does not call to UnitStore if all presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.close._id,
                          }),
                        ],
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      close: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsOpponent.close._id,
                          }),
                        ],
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsOpponent.modifier._id,
                        }),
                      }),
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsOpponent.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            units: [
              TestUtil.getDbUnit({
                id: unitsSelf.close._id,
              }),
              TestUtil.getDbUnit({
                id: unitsSelf.modifier._id,
              }),
              TestUtil.getDbUnit({
                id: unitsSelf.weather._id,
              }),
              TestUtil.getDbUnit({
                id: unitsOpponent.close._id,
              }),
              TestUtil.getDbUnit({
                id: unitsOpponent.modifier._id,
              }),
              TestUtil.getDbUnit({
                id: unitsOpponent.weather._id,
              }),
            ],
            unitsGetResponse: [],
          })
        })
      })
    })
    describe('ranged combat', () => {
      describe('unit', () => {
        it('calls to UnitStore to get multiple if none presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.ranged._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsOpponent.ranged._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.ranged, unitsOpponent.ranged],
          })
        })
        it('calls to UnitStore to get single ignoring presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.ranged._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsOpponent.ranged._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            units: [
              TestUtil.getDbUnit({
                id: unitsSelf.ranged._id,
              }),
            ],
            unitsGetResponse: [unitsOpponent.ranged],
          })
        })
        it('calls to UnitStore to get single ignoring duplicate from opponent', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.ranged._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.ranged._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.ranged],
          })
        })
        it('calls to UnitStore to get single ignoring unitBeingPlayed if in opponents hand', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.ranged._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitBeingPlayed._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.ranged],
          })
        })
        it('does not call UnitStore if all presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.ranged._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsOpponent.ranged._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            units: [
              TestUtil.getDbUnit({
                id: unitsSelf.ranged._id,
              }),
              TestUtil.getDbUnit({
                id: unitsOpponent.ranged._id,
              }),
            ],
            unitsGetResponse: [],
          })
        })
      })
      describe('modifier', () => {
        it('calls to UnitStore to get multiple if none presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsOpponent.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.modifier, unitsOpponent.modifier],
          })
        })
        it('calls to UnitStore to get single ignoring presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsOpponent.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            units: [
              TestUtil.getDbUnit({
                id: unitsSelf.modifier._id,
              }),
            ],
            unitsGetResponse: [unitsOpponent.modifier],
          })
        })
        it('calls to UnitStore to get single ignoring duplicate from opponent', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.modifier],
          })
        })
        it('calls to UnitStore to get single ignoring unitBeingPlayed if in opponents hand', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitBeingPlayed._id,
                        }),
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.modifier],
          })
        })
        it('does not call UnitStore if all presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsOpponent.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            units: [
              TestUtil.getDbUnit({
                id: unitsSelf.modifier._id,
              }),
              TestUtil.getDbUnit({
                id: unitsOpponent.modifier._id,
              }),
            ],
            unitsGetResponse: [],
          })
        })
      })
      describe('weather', () => {
        it('calls to UnitStore to get multiple if none presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsOpponent.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.weather, unitsOpponent.weather],
          })
        })
        it('calls to UnitStore to get single ignoring presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsOpponent.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            units: [
              TestUtil.getDbUnit({
                id: unitsSelf.weather._id,
              }),
            ],
            unitsGetResponse: [unitsOpponent.weather],
          })
        })
        it('calls to UnitStore to get single ignoring duplicate from opponent', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.weather],
          })
        })
        it('calls to UnitStore to get single ignoring unitBeingPlayed if in opponents hand', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitBeingPlayed._id,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.weather],
          })
        })
        it('does not call UnitStore if all presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsOpponent.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            units: [
              TestUtil.getDbUnit({
                id: unitsSelf.weather._id,
              }),
              TestUtil.getDbUnit({
                id: unitsOpponent.weather._id,
              }),
            ],
            unitsGetResponse: [],
          })
        })
      })
      describe('all', () => {
        it('calls to UnitStore for all if none presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.ranged._id,
                          }),
                        ],
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsOpponent.ranged._id,
                          }),
                        ],
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsOpponent.modifier._id,
                        }),
                      }),
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsOpponent.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [
              unitsSelf.ranged,
              unitsSelf.modifier,
              unitsSelf.weather,
              unitsOpponent.ranged,
              unitsOpponent.modifier,
              unitsOpponent.weather,
            ],
          })
        })
        it('does not call to UnitStore if all presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.ranged._id,
                          }),
                        ],
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      ranged: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsOpponent.ranged._id,
                          }),
                        ],
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsOpponent.modifier._id,
                        }),
                      }),
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsOpponent.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            units: [
              TestUtil.getDbUnit({
                id: unitsSelf.ranged._id,
              }),
              TestUtil.getDbUnit({
                id: unitsSelf.modifier._id,
              }),
              TestUtil.getDbUnit({
                id: unitsSelf.weather._id,
              }),
              TestUtil.getDbUnit({
                id: unitsOpponent.ranged._id,
              }),
              TestUtil.getDbUnit({
                id: unitsOpponent.modifier._id,
              }),
              TestUtil.getDbUnit({
                id: unitsOpponent.weather._id,
              }),
            ],
            unitsGetResponse: [],
          })
        })
      })
    })
    describe('siege combat', () => {
      describe('unit', () => {
        it('calls to UnitStore to get multiple if none presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.siege._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsOpponent.siege._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.siege, unitsOpponent.siege],
          })
        })
        it('calls to UnitStore to get single ignoring presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.siege._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsOpponent.siege._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            units: [
              TestUtil.getDbUnit({
                id: unitsSelf.siege._id,
              }),
            ],
            unitsGetResponse: [unitsOpponent.siege],
          })
        })
        it('calls to UnitStore to get single ignoring duplicate from opponent', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.siege._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.siege._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.siege],
          })
        })
        it('calls to UnitStore to get single ignoring unitBeingPlayed if in opponents hand', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.siege._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitBeingPlayed._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.siege],
          })
        })
        it('does not call UnitStore if all presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.siege._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsOpponent.siege._id,
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            units: [
              TestUtil.getDbUnit({
                id: unitsSelf.siege._id,
              }),
              TestUtil.getDbUnit({
                id: unitsOpponent.siege._id,
              }),
            ],
            unitsGetResponse: [],
          })
        })
      })
      describe('modifier', () => {
        it('calls to UnitStore to get multiple if none presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsOpponent.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.modifier, unitsOpponent.modifier],
          })
        })
        it('calls to UnitStore to get single ignoring presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsOpponent.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            units: [
              TestUtil.getDbUnit({
                id: unitsSelf.modifier._id,
              }),
            ],
            unitsGetResponse: [unitsOpponent.modifier],
          })
        })
        it('calls to UnitStore to get single ignoring duplicate from opponent', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.modifier],
          })
        })
        it('calls to UnitStore to get single ignoring unitBeingPlayed if in opponents hand', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitBeingPlayed._id,
                        }),
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.modifier],
          })
        })
        it('does not call UnitStore if all presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsOpponent.modifier._id,
                        }),
                      }),
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            units: [
              TestUtil.getDbUnit({
                id: unitsSelf.modifier._id,
              }),
              TestUtil.getDbUnit({
                id: unitsOpponent.modifier._id,
              }),
            ],
            unitsGetResponse: [],
          })
        })
      })
      describe('weather', () => {
        it('calls to UnitStore to get multiple if none presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsOpponent.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.weather, unitsOpponent.weather],
          })
        })
        it('calls to UnitStore to get single ignoring presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsOpponent.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            units: [
              TestUtil.getDbUnit({
                id: unitsSelf.weather._id,
              }),
            ],
            unitsGetResponse: [unitsOpponent.weather],
          })
        })
        it('calls to UnitStore to get single ignoring duplicate from opponent', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.weather],
          })
        })
        it('calls to UnitStore to get single ignoring unitBeingPlayed if in opponents hand', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitBeingPlayed._id,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [unitsSelf.weather],
          })
        })
        it('does not call UnitStore if all presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsOpponent.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            units: [
              TestUtil.getDbUnit({
                id: unitsSelf.weather._id,
              }),
              TestUtil.getDbUnit({
                id: unitsOpponent.weather._id,
              }),
            ],
            unitsGetResponse: [],
          })
        })
      })
      describe('all', () => {
        it('calls to UnitStore for all if none presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.siege._id,
                          }),
                        ],
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsOpponent.siege._id,
                          }),
                        ],
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsOpponent.modifier._id,
                        }),
                      }),
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsOpponent.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            unitsGetResponse: [
              unitsSelf.siege,
              unitsSelf.modifier,
              unitsSelf.weather,
              unitsOpponent.siege,
              unitsOpponent.modifier,
              unitsOpponent.weather,
            ],
          })
        })
        it('does not call to UnitStore if all presolved', async () => {
          await testGetRoundUnits({
            game: TestUtil.getDbGame({
              round,
              players: [
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsSelf.siege._id,
                          }),
                        ],
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsSelf.modifier._id,
                        }),
                      }),
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
                TestUtil.getDbGamePlayer({
                  rounds: [
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({}),
                    TestUtil.getDbPlayerRound({
                      siege: TestUtil.getDbPlayerCombatRow({
                        units: [
                          TestUtil.getDbFieldUnit({
                            id: unitsOpponent.siege._id,
                          }),
                        ],
                        modifier: TestUtil.getDbFieldUnit({
                          id: unitsOpponent.modifier._id,
                        }),
                      }),
                      weathers: [
                        TestUtil.getDbFieldUnit({
                          id: unitsOpponent.weather._id,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            unitBeingPlayed,
            units: [
              TestUtil.getDbUnit({
                id: unitsSelf.siege._id,
              }),
              TestUtil.getDbUnit({
                id: unitsSelf.modifier._id,
              }),
              TestUtil.getDbUnit({
                id: unitsSelf.weather._id,
              }),
              TestUtil.getDbUnit({
                id: unitsOpponent.siege._id,
              }),
              TestUtil.getDbUnit({
                id: unitsOpponent.modifier._id,
              }),
              TestUtil.getDbUnit({
                id: unitsOpponent.weather._id,
              }),
            ],
            unitsGetResponse: [],
          })
        })
      })
    })
    describe('all combats', () => {
      it('calls to UnitStore to get multiple if none presolved', async () => {
        await testGetRoundUnits({
          game: TestUtil.getDbGame({
            round,
            players: [
              TestUtil.getDbGamePlayer({
                rounds: [
                  TestUtil.getDbPlayerRound({}),
                  TestUtil.getDbPlayerRound({}),
                  TestUtil.getDbPlayerRound({
                    close: TestUtil.getDbPlayerCombatRow({
                      units: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.close._id,
                        }),
                      ],
                    }),
                    ranged: TestUtil.getDbPlayerCombatRow({
                      units: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.ranged._id,
                        }),
                      ],
                    }),
                    siege: TestUtil.getDbPlayerCombatRow({
                      units: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.siege._id,
                        }),
                      ],
                    }),
                  }),
                ],
              }),
              TestUtil.getDbGamePlayer({
                rounds: [
                  TestUtil.getDbPlayerRound({}),
                  TestUtil.getDbPlayerRound({}),
                  TestUtil.getDbPlayerRound({
                    close: TestUtil.getDbPlayerCombatRow({
                      units: [
                        TestUtil.getDbFieldUnit({
                          id: unitsOpponent.close._id,
                        }),
                      ],
                    }),
                    ranged: TestUtil.getDbPlayerCombatRow({
                      units: [
                        TestUtil.getDbFieldUnit({
                          id: unitsOpponent.ranged._id,
                        }),
                      ],
                    }),
                    siege: TestUtil.getDbPlayerCombatRow({
                      units: [
                        TestUtil.getDbFieldUnit({
                          id: unitsOpponent.siege._id,
                        }),
                      ],
                    }),
                  }),
                ],
              }),
            ],
          }),
          unitBeingPlayed,
          unitsGetResponse: [
            unitsSelf.close,
            unitsSelf.ranged,
            unitsSelf.siege,
            unitsOpponent.close,
            unitsOpponent.ranged,
            unitsOpponent.siege,
          ],
        })
      })
      it('does not call to UnitStore if all presolved', async () => {
        await testGetRoundUnits({
          game: TestUtil.getDbGame({
            round,
            players: [
              TestUtil.getDbGamePlayer({
                rounds: [
                  TestUtil.getDbPlayerRound({}),
                  TestUtil.getDbPlayerRound({}),
                  TestUtil.getDbPlayerRound({
                    close: TestUtil.getDbPlayerCombatRow({
                      units: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.close._id,
                        }),
                      ],
                    }),
                    ranged: TestUtil.getDbPlayerCombatRow({
                      units: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.ranged._id,
                        }),
                      ],
                    }),
                    siege: TestUtil.getDbPlayerCombatRow({
                      units: [
                        TestUtil.getDbFieldUnit({
                          id: unitsSelf.siege._id,
                        }),
                      ],
                    }),
                  }),
                ],
              }),
              TestUtil.getDbGamePlayer({
                rounds: [
                  TestUtil.getDbPlayerRound({}),
                  TestUtil.getDbPlayerRound({}),
                  TestUtil.getDbPlayerRound({
                    close: TestUtil.getDbPlayerCombatRow({
                      units: [
                        TestUtil.getDbFieldUnit({
                          id: unitsOpponent.close._id,
                        }),
                      ],
                    }),
                    ranged: TestUtil.getDbPlayerCombatRow({
                      units: [
                        TestUtil.getDbFieldUnit({
                          id: unitsOpponent.ranged._id,
                        }),
                      ],
                    }),
                    siege: TestUtil.getDbPlayerCombatRow({
                      units: [
                        TestUtil.getDbFieldUnit({
                          id: unitsOpponent.siege._id,
                        }),
                      ],
                    }),
                  }),
                ],
              }),
            ],
          }),
          unitBeingPlayed,
          units: [
            TestUtil.getDbUnit({
              id: unitsSelf.close._id,
            }),
            TestUtil.getDbUnit({
              id: unitsSelf.ranged._id,
            }),
            TestUtil.getDbUnit({
              id: unitsSelf.siege._id,
            }),
            TestUtil.getDbUnit({
              id: unitsOpponent.close._id,
            }),
            TestUtil.getDbUnit({
              id: unitsOpponent.ranged._id,
            }),
            TestUtil.getDbUnit({
              id: unitsOpponent.siege._id,
            }),
          ],
          unitsGetResponse: [],
        })
      })
    })
  })
})

async function testGetRoundUnits({
  game,
  unitBeingPlayed,
  round,
  playerId,
  units,
  unitsGetResponse,
}: {
  game: GameDbObject
  unitBeingPlayed?: UnitDbObject
  round?: number
  playerId?: ObjectId
  units?: UnitDbObject[]
  unitsGetResponse: UnitDbObject[]
}) {
  const unitStoreGetSpy = jest.spyOn(UnitStore, 'get').mockResolvedValue(unitsGetResponse)

  await expect(
    getRoundUnits({
      game,
      unitBeingPlayed,
      round,
      playerId,
      units,
    })
  ).resolves.toEqual(unitsGetResponse)

  expect(unitStoreGetSpy.mock.calls).toEqual(
    unitsGetResponse.length > 0
      ? [
          [
            {
              ids: unitsGetResponse.map((unit) => unit._id.toString()),
            },
          ],
        ]
      : []
  )
}
