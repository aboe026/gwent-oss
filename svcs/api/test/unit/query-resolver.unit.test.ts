import { ObjectId } from 'mongodb'

import AppInfo from '../../src/app-info'
import DeckResolver from '../../src/graphql/resolvers/deck-resolver'
import DeckStore from '../../src/database/stores/deck-store'
import * as env from '../../src/env'
import { FactionDbObject, GameDbObject } from '@gwent/graphql-schema/database-typings'
import { FactionKey, GameDeck, SettingKey, SettingType, User } from '@gwent/graphql-schema/resolver-typings'
import FactionResolver from '../../src/graphql/resolvers/faction-resolver'
import FactionStore from '../../src/database/stores/faction-store'
import GameDeckResolver from '../../src/graphql/resolvers/game-deck-resolver'
import GameResolver from '../../src/graphql/resolvers/game-resolver'
import GameStore from '../../src/database/stores/game-store'
import LeaderResolver from '../../src/graphql/resolvers/leader-resolver'
import LeaderStore from '../../src/database/stores/leader-store'
import QueryResolver from '../../src/graphql/resolvers/query-resolver'
import TestUtil from '../test-util'
import UnitResolver from '../../src/graphql/resolvers/unit-resolver'
import UnitStore from '../../src/database/stores/unit-store'
import UserResolver from '../../src/graphql/resolvers/user-resolver'
import { version } from '../../package.json'

describe('query-resolver', () => {
  describe('application', () => {
    it('calls out to AppInfo to get build number', async () => {
      await testApplication({})
    })
    it('logs to trace if enabled', async () => {
      await testApplication({
        traceEnabled: true,
      })
    })
  })
  describe('currentUser', () => {
    it('throws error if context undefined', () => {
      const error = 'No user on session.'
      testCurrentUser({
        context: undefined,
        error: Error(error),
        debugCalls: [[`currentUser by "undefined" failed: "${error}"`]],
      })
    })
    it('throws error if session undefined', () => {
      const error = 'No user on session.'
      testCurrentUser({
        context: {},
        error: Error(error),
        debugCalls: [[`currentUser by "undefined" failed: "${error}"`]],
      })
    })
    it('throws error if user undefined', () => {
      const error = 'No user on session.'
      testCurrentUser({
        context: {
          session: {},
        },
        error: Error(error),
        debugCalls: [[`currentUser by "undefined" failed: "${error}"`]],
      })
    })
    it('returns user if defined on session', () => {
      const userId = new ObjectId()
      const created = new Date()
      const name = 'user-name'
      testCurrentUser({
        context: {
          session: {
            user: {
              _id: userId,
              created,
              name,
            },
          },
        },
        userResolverResponse: {
          created,
          id: userId.toString(),
          name,
        },
        userResolverCalls: [
          [
            {
              created,
              _id: userId,
              name,
            },
          ],
        ],
      })
    })
    it('logs to trace if enabled', () => {
      const userId = new ObjectId()
      const created = new Date()
      const name = 'user-name'
      testCurrentUser({
        context: {
          session: {
            user: {
              _id: userId,
              created,
              name,
            },
          },
        },
        userResolverResponse: {
          created,
          id: userId.toString(),
          name,
        },
        userResolverCalls: [
          [
            {
              created,
              _id: userId,
              name,
            },
          ],
        ],
        traceEnabled: true,
      })
    })
  })
  describe('decks', () => {
    it('reaches out to DeckStore with user on session', async () => {
      await testDecks({})
    })
    it('logs to trace if enabled', async () => {
      await testDecks({
        traceEnabled: true,
      })
    })
  })
  describe('factions', () => {
    it('reaches out to FactionStore', async () => {
      await testFactions({})
    })
    it('logs to trace if enabled', async () => {
      await testFactions({
        traceEnabled: true,
      })
    })
  })
  describe('game', () => {
    it('returns resolved game if found', async () => {
      await testGame({})
    })
    it('logs to trace if enabled', async () => {
      await testGame({
        traceEnabled: true,
      })
    })
  })
  describe('gameDeck', () => {
    const userId = new ObjectId()
    const gameId = new ObjectId().toString()
    const logPrefix = `gameDeck by "${userId}"`
    it('throws error if game does not exist', async () => {
      const error = `Game with ID "${gameId}" does not exist.`
      await testGameDeck({
        userId,
        gameId,
        gameResponse: undefined,
        error: Error(error),
        errorCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('throws error if user is not a player', async () => {
      const error = `Not a player on game "${gameId}".`
      const game = TestUtil.getDbGame({
        id: gameId,
      })
      await testGameDeck({
        userId: userId,
        gameId: gameId.toString(),
        gameResponse: game,
        error: Error(error),
        debugCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('returns undefined if player deck not set', async () => {
      await testGameDeck({
        userId: userId,
        gameId: gameId.toString(),
        gameResponse: TestUtil.getDbGame({
          id: gameId,
          players: [
            TestUtil.getDbGamePlayer({
              user: userId,
            }),
          ],
        }),
        expected: null,
      })
    })
    it('returns game deck if player deck is set', async () => {
      const deck = TestUtil.getDbDeck({
        user: userId,
      })
      const playerDeck = TestUtil.getDbGameDeck({
        from: deck,
      })
      const gameDeck = TestUtil.getGameDeck({
        from: TestUtil.getDeckFromDbDeck({
          deck,
        }),
      })
      await testGameDeck({
        userId: userId,
        gameId: gameId.toString(),
        gameResponse: TestUtil.getDbGame({
          id: gameId,
          creator: userId,
          players: [
            TestUtil.getDbGamePlayer({
              deck: playerDeck,
              user: userId,
            }),
          ],
        }),
        expected: gameDeck,
        gameDeckResolverCalls: [
          [
            {
              gameDeck: playerDeck,
              neutralDeckStats: undefined,
              neutralLeaderStats: undefined,
              neutralUnitStats: undefined,
            },
          ],
        ],
      })
    })
    it('logs to trace if enabled', async () => {
      const deck = TestUtil.getDbDeck({
        user: userId,
      })
      const playerDeck = TestUtil.getDbGameDeck({
        from: deck,
      })
      const gameDeck = TestUtil.getGameDeck({
        from: TestUtil.getDeckFromDbDeck({
          deck,
        }),
      })
      await testGameDeck({
        userId: userId,
        gameId: gameId.toString(),
        gameResponse: TestUtil.getDbGame({
          id: gameId,
          creator: userId,
          players: [
            TestUtil.getDbGamePlayer({
              deck: playerDeck,
              user: userId,
            }),
          ],
        }),
        expected: gameDeck,
        gameDeckResolverCalls: [
          [
            {
              gameDeck: playerDeck,
              neutralDeckStats: undefined,
              neutralLeaderStats: undefined,
              neutralUnitStats: undefined,
            },
          ],
        ],
        logPrefix,
        traceEnabled: true,
      })
    })
  })
  describe('games', () => {
    it('calls out to GameResolver fromArray', async () => {
      await testGames({})
    })
    it('logs to trace if enabled', async () => {
      await testGames({
        traceEnabled: true,
      })
    })
  })
  describe('leaders', () => {
    it('does not reach out to FactionStore if no factions in args', async () => {
      await testLeaders({
        leaderGetCalls: [
          [
            {
              factionIds: undefined,
            },
          ],
        ],
      })
    })
    it('reaches out to get faction ids if single faction in args', async () => {
      const factionKey = FactionKey.Monsters
      const factionId = new ObjectId()
      await testLeaders({
        factionKeys: [factionKey],
        factionGetCalls: [
          [
            {
              keys: [factionKey],
            },
          ],
        ],
        factionGetResponse: [
          TestUtil.getDbFaction({
            id: factionId,
          }),
        ],
        leaderGetCalls: [
          [
            {
              factionIds: [factionId.toString()],
            },
          ],
        ],
      })
    })
    it('logs to trace if enabled', async () => {
      const factionKey = FactionKey.Monsters
      const factionId = new ObjectId()
      await testLeaders({
        factionKeys: [factionKey],
        factionGetCalls: [
          [
            {
              keys: [factionKey],
            },
          ],
        ],
        factionGetResponse: [
          TestUtil.getDbFaction({
            id: factionId,
          }),
        ],
        leaderGetCalls: [
          [
            {
              factionIds: [factionId.toString()],
            },
          ],
        ],
        traceEnabled: true,
      })
    })
  })
  describe('settings', () => {
    it('returns settings with values from env', () => {
      testSettings({})
    })
    it('logs to trace if enabled', () => {
      testSettings({
        traceEnabled: true,
      })
    })
  })
  describe('units', () => {
    it('does not call out to FactionStore if no factions in args', async () => {
      await testUnits({
        factionKeys: undefined,
        factionGetCalls: [],
        factionGetResponse: undefined,
        unitGetCalls: [
          [
            {
              deckable: undefined,
              factionIds: undefined,
            },
          ],
        ],
      })
    })
    it('calls out to FactionStore if factions in args', async () => {
      const factionKey = FactionKey.Monsters
      const factionId = new ObjectId()
      await testUnits({
        factionKeys: [factionKey],
        factionGetCalls: [
          [
            {
              keys: [factionKey],
            },
          ],
        ],
        factionGetResponse: [
          TestUtil.getDbFaction({
            id: factionId,
            key: factionKey,
          }),
        ],
        unitGetCalls: [
          [
            {
              deckable: undefined,
              factionIds: [factionId.toString()],
            },
          ],
        ],
      })
    })
    it('passes deckable false to UnitStore if explicitly defined in args', async () => {
      await testUnits({
        deckable: false,
        unitGetCalls: [
          [
            {
              deckable: false,
              factionIds: undefined,
            },
          ],
        ],
      })
    })
    it('passes deckable true to UnitStore if explicitly defined in args', async () => {
      await testUnits({
        deckable: true,
        unitGetCalls: [
          [
            {
              deckable: true,
              factionIds: undefined,
            },
          ],
        ],
      })
    })
    it('logs to trace if enabled', async () => {
      const factionKey = FactionKey.Monsters
      const factionId = new ObjectId()
      await testUnits({
        factionKeys: [factionKey],
        factionGetCalls: [
          [
            {
              keys: [factionKey],
            },
          ],
        ],
        factionGetResponse: [
          TestUtil.getDbFaction({
            id: factionId,
            key: factionKey,
          }),
        ],
        unitGetCalls: [
          [
            {
              deckable: undefined,
              factionIds: [factionId.toString()],
            },
          ],
        ],
        traceEnabled: true,
      })
    })
  })
})

async function testApplication({ traceEnabled }: { traceEnabled?: boolean }) {
  const build = 3
  const context = {
    session: {
      user: {
        _id: new ObjectId(),
      },
    },
  }
  const logPrefix = `application by "${context.session.user._id}"`
  const getBuildNumberSpy = jest.spyOn(AppInfo, 'getBuildNumber').mockResolvedValue(build)
  const traceSpy = jest.fn().mockImplementation()
  QueryResolver['logger'] = {
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  await expect((QueryResolver.getResolvers().application as any)(null, null, context, null)).resolves.toEqual({
    build,
    version,
  })

  expect(getBuildNumberSpy.mock.calls).toEqual([[]])
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [`${logPrefix} requested fields: "[]"`],
          [`${logPrefix} requested arguments: "[]"`],
          [`${logPrefix} build: "${build}"`],
          [`${logPrefix} version: "${version}"`],
        ]
      : []
  )
}

function testCurrentUser({
  context,
  error,
  userResolverResponse,
  userResolverCalls = [],
  traceEnabled,
  debugCalls = [],
}: {
  context: any
  error?: Error
  userResolverResponse?: User
  userResolverCalls?: any[][]
  traceEnabled?: boolean
  debugCalls?: any[][]
}) {
  const logPrefix = `currentUser by "${context?.session?.user?._id}"`
  const userResolverSpy = jest.spyOn(UserResolver, 'fromObject')
  if (userResolverResponse) {
    userResolverSpy.mockReturnValue(userResolverResponse)
  }
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  QueryResolver['logger'] = {
    debug: debugSpy,
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  expect((QueryResolver.getResolvers().currentUser as any)(null, null, context, null)).toEqual(
    error || userResolverResponse
  )

  expect(userResolverSpy.mock.calls).toEqual(userResolverCalls)
  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [`${logPrefix} requested fields: "[]"`],
          [`${logPrefix} requested arguments: "[]"`],
          [`${logPrefix} user: "${JSON.stringify(context?.session?.user)}"`],
        ]
      : []
  )
}

async function testDecks({ traceEnabled }: { traceEnabled?: boolean }) {
  const context = {
    session: {
      user: {
        _id: new ObjectId(),
      },
    },
  }
  const logPrefix = `decks by "${context.session.user._id}"`
  const deck = TestUtil.getDbDeck({})
  const getSpy = jest.spyOn(DeckStore, 'get').mockResolvedValue([deck])
  const deckResolverSpy = jest.spyOn(DeckResolver, 'fromArray').mockResolvedValue([])
  const traceSpy = jest.fn().mockImplementation()
  QueryResolver['logger'] = {
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  await expect((QueryResolver.getResolvers().decks as any)(null, null, context, null)).resolves.toEqual([])

  expect(getSpy.mock.calls).toEqual([[context.session.user._id]])
  expect(deckResolverSpy.mock.calls).toEqual([
    [
      {
        decks: [deck],
        neutralDeckStats: undefined,
        neutralLeaderStats: undefined,
        neutralUnitStats: undefined,
      },
    ],
  ])
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [`${logPrefix} requested fields: "[]"`],
          [`${logPrefix} requested arguments: "[]"`],
          [`${logPrefix} decks: "${JSON.stringify([deck])}"`],
        ]
      : []
  )
}

async function testFactions({ traceEnabled }: { traceEnabled?: boolean }) {
  const context = {
    session: {
      user: {
        _id: new ObjectId(),
      },
    },
  }
  const logPrefix = `factions by "${context.session.user._id}"`
  const faction = TestUtil.getDbFaction({})
  const resolvedFaction = TestUtil.getFactionFromDbFaction(faction)
  const getSpy = jest.spyOn(FactionStore, 'get').mockResolvedValue([faction])
  const factionResolverSpy = jest.spyOn(FactionResolver, 'fromArray').mockResolvedValue([resolvedFaction])
  const traceSpy = jest.fn().mockImplementation()
  QueryResolver['logger'] = {
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  await expect((QueryResolver.getResolvers().factions as any)(null, null, context, null)).resolves.toEqual([
    resolvedFaction,
  ])

  expect(getSpy.mock.calls).toEqual([[{}]])
  expect(factionResolverSpy.mock.calls).toEqual([
    [
      {
        factions: [faction],
        neutrals: undefined,
      },
    ],
  ])
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [`${logPrefix} requested fields: "[]"`],
          [`${logPrefix} requested arguments: "[]"`],
          [`${logPrefix} factions: "${JSON.stringify([faction])}"`],
        ]
      : []
  )
}

async function testGame({ traceEnabled }: { traceEnabled?: boolean }) {
  const context = {
    session: {
      user: {
        _id: new ObjectId(),
      },
    },
  }
  const logPrefix = `game by "${context.session.user._id}"`
  const gameId = new ObjectId().toString()
  const game = TestUtil.getGame({
    id: gameId,
  })
  const fromIdSpy = jest.spyOn(GameResolver, 'fromId').mockResolvedValue(game)
  const traceSpy = jest.fn().mockImplementation()
  QueryResolver['logger'] = {
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  await expect(
    (QueryResolver.getResolvers().game as any)(
      null,
      {
        id: gameId,
      },
      context,
      null
    )
  ).resolves.toEqual(game)

  expect(fromIdSpy.mock.calls).toEqual([[gameId]])
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [`${logPrefix} args: "${JSON.stringify({ id: gameId })}"`],
          [`${logPrefix} requested fields: "[]"`],
          [`${logPrefix} requested arguments: "[]"`],
        ]
      : []
  )
}

async function testGameDeck({
  userId,
  gameId,
  gameResponse,
  error,
  expected,
  gameDeckResolverCalls = [],
  logPrefix,
  traceEnabled,
  errorCalls = [],
  debugCalls = [],
}: {
  userId?: ObjectId
  gameId?: string
  gameResponse?: GameDbObject
  error?: Error
  expected?: GameDeck | null
  gameDeckResolverCalls?: any[][]
  logPrefix?: string
  traceEnabled?: boolean
  errorCalls?: any[][]
  debugCalls?: any[][]
}) {
  const context = {
    session: {
      user: {
        _id: userId,
      },
    },
  }
  const args = {
    game: gameId,
  }
  const getByIdSpy = jest.spyOn(GameStore, 'getById').mockResolvedValue(gameResponse)
  const fromObjectSpy = jest.spyOn(GameDeckResolver, 'fromObject').mockResolvedValue(expected as any as GameDeck)
  const debugSpy = jest.fn().mockImplementation()
  const errorSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  QueryResolver['logger'] = {
    debug: debugSpy,
    error: errorSpy,
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  await expect((QueryResolver.getResolvers().gameDeck as any)(null, args, context, null)).resolves.toEqual(
    error || expected
  )

  expect(getByIdSpy.mock.calls).toEqual([
    [
      {
        id: gameId,
      },
    ],
  ])
  expect(fromObjectSpy.mock.calls).toEqual(gameDeckResolverCalls)
  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [`${logPrefix} args: "${JSON.stringify({ game: gameId })}"`],
          [`${logPrefix} requested fields: "[]"`],
          [`${logPrefix} requested arguments: "[]"`],
          [`${logPrefix} game: "${JSON.stringify(gameResponse)}"`],
          [
            `${logPrefix} player: "${JSON.stringify(
              gameResponse?.players.find((player) => player.user.toString() === userId?.toString())
            )}"`,
          ],
        ]
      : []
  )
}

async function testGames({ traceEnabled }: { traceEnabled?: boolean }) {
  const userId = new ObjectId()
  const context = {
    session: {
      user: {
        _id: userId,
      },
    },
  }
  const logPrefix = `games by "${userId}"`
  const game = TestUtil.getDbGame({
    creator: userId,
  })
  const resolvedGame = TestUtil.getGameFromDbGame({
    game,
  })
  const getByUserIdSpy = jest.spyOn(GameStore, 'getByUserId').mockResolvedValue([game])
  const fromArraySpy = jest.spyOn(GameResolver, 'fromArray').mockResolvedValue([resolvedGame])
  const traceSpy = jest.fn().mockImplementation()
  QueryResolver['logger'] = {
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  await expect((QueryResolver.getResolvers().games as any)(null, null, context, null)).resolves.toEqual([resolvedGame])

  expect(getByUserIdSpy.mock.calls).toEqual([[userId]])
  expect(fromArraySpy.mock.calls).toEqual([[[game]]])
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [`${logPrefix} requested fields: "[]"`],
          [`${logPrefix} requested arguments: "[]"`],
          [`${logPrefix} games: "${JSON.stringify([game])}"`],
        ]
      : []
  )
}

async function testLeaders({
  factionKeys,
  factionGetResponse,
  factionGetCalls = [],
  leaderGetCalls,
  traceEnabled,
}: {
  factionKeys?: FactionKey[]
  factionGetResponse?: FactionDbObject[]
  factionGetCalls?: any[][]
  leaderGetCalls: any[][]
  traceEnabled?: boolean
}) {
  const context = {
    session: {
      user: {
        _id: new ObjectId(),
      },
    },
  }
  const logPrefix = `leaders by "${context.session.user._id}"`
  const args = {
    factions: factionKeys,
  }
  const leader = TestUtil.getDbLeader({})
  const resolvedLeader = TestUtil.getLeaderFromDbLeader(leader)
  const factionGetSpy = jest.spyOn(FactionStore, 'get').mockResolvedValue(factionGetResponse || [])
  const leaderGetSpy = jest.spyOn(LeaderStore, 'get').mockResolvedValue([leader])
  const leaderResolverSpy = jest.spyOn(LeaderResolver, 'fromArray').mockResolvedValue([resolvedLeader])
  const traceSpy = jest.fn().mockImplementation()
  QueryResolver['logger'] = {
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  await expect((QueryResolver.getResolvers().leaders as any)(null, args, context, null)).resolves.toEqual([
    resolvedLeader,
  ])

  expect(factionGetSpy.mock.calls).toEqual(factionGetCalls)
  expect(leaderGetSpy.mock.calls).toEqual(leaderGetCalls)
  expect(leaderResolverSpy.mock.calls).toEqual([
    [
      {
        factions: factionGetResponse,
        leaders: [leader],
        neutralStats: undefined,
      },
    ],
  ])
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [`${logPrefix} args: "${JSON.stringify({ factions: factionKeys })}"`],
          [`${logPrefix} requested fields: "[]"`],
          [`${logPrefix} requested arguments: "[]"`],
          [`${logPrefix} factions: "${JSON.stringify(factionGetResponse)}"`],
          [`${logPrefix} factionIds: "${JSON.stringify(factionGetResponse?.map((faction) => faction._id))}"`],
          [`${logPrefix} leaders: "${JSON.stringify([leader])}"`],
        ]
      : []
  )
}

function testSettings({ traceEnabled }: { traceEnabled?: boolean }) {
  const context = {
    session: {
      user: {
        _id: new ObjectId(),
      },
    },
  }
  const logPrefix = `settings by "${context.session.user._id}"`
  const sessionTimeout = 30
  jest.spyOn(env, 'default').mockReturnValue({
    SESSION_TIMEOUT_SECONDS: sessionTimeout,
  } as any)
  const traceSpy = jest.fn().mockImplementation()
  QueryResolver['logger'] = {
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  expect((QueryResolver.getResolvers().settings as any)(null, null, context, null)).toEqual([
    {
      key: SettingKey.SessionTimeoutSeconds,
      type: SettingType.Number,
      label: 'Session Timeout (seconds)',
      value: sessionTimeout.toString(),
    },
  ])

  expect(traceSpy.mock.calls).toEqual(
    traceEnabled ? [[`${logPrefix} requested fields: "[]"`], [`${logPrefix} requested arguments: "[]"`]] : []
  )
}

async function testUnits({
  factionKeys,
  deckable,
  factionGetResponse,
  factionGetCalls = [],
  unitGetCalls,
  traceEnabled,
}: {
  factionKeys?: FactionKey[]
  deckable?: boolean
  factionGetResponse?: FactionDbObject[]
  factionGetCalls?: any[][]
  unitGetCalls: any[][]
  traceEnabled?: boolean
}) {
  const context = {
    session: {
      user: {
        _id: new ObjectId(),
      },
    },
  }
  const logPrefix = `units by "${context.session.user._id}"`
  const args = {
    factions: factionKeys,
    deckable,
  }
  const unit = TestUtil.getDbUnit({
    faction: factionGetResponse && factionGetResponse[0]._id,
  })
  const resolvedUnit = TestUtil.getUnitFromDbUnit({
    unit,
  })
  const factionGetSpy = jest.spyOn(FactionStore, 'get').mockResolvedValue(factionGetResponse || [])
  const unitGetSpy = jest.spyOn(UnitStore, 'get').mockResolvedValue([unit])
  const unitResolverSpy = jest.spyOn(UnitResolver, 'fromArray').mockResolvedValue([resolvedUnit])
  const traceSpy = jest.fn().mockImplementation()
  QueryResolver['logger'] = {
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  await expect((QueryResolver.getResolvers().units as any)(null, args, context, null)).resolves.toEqual([resolvedUnit])

  expect(factionGetSpy.mock.calls).toEqual(factionGetCalls)
  expect(unitGetSpy.mock.calls).toEqual(unitGetCalls)
  expect(unitResolverSpy.mock.calls).toEqual([
    [
      {
        factions: factionGetResponse,
        units: [unit],
        neutralStats: undefined,
      },
    ],
  ])
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [`${logPrefix} args: "${JSON.stringify({ factions: factionKeys, deckable })}"`],
          [`${logPrefix} requested fields: "[]"`],
          [`${logPrefix} requested arguments: "[]"`],
          [`${logPrefix} factions: "${JSON.stringify(factionGetResponse)}"`],
          [`${logPrefix} factionIds: "${JSON.stringify(factionGetResponse?.map((faction) => faction._id))}"`],
          [`${logPrefix} units: "${JSON.stringify([unit])}"`],
        ]
      : []
  )
}
