import { Document, Filter, FindOptions, ObjectId, UpdateFilter } from 'mongodb'

import { DeckDbObject, DeckUnitDbObject, GameDbObject, RedrawDbObject } from '@gwent/graphql-schema/database-typings'
import GameStore from '../../src/database/stores/game-store'
import TestUtil from '../test-util'

describe('game-store', () => {
  describe('add', () => {
    it('calls out to create method with game information', async () => {
      await testAddGame({
        creatorId: new ObjectId(),
        opponentIds: [new ObjectId()],
      })
    })
    it('logs to trace if enabled', async () => {
      await testAddGame({
        creatorId: new ObjectId(),
        opponentIds: [new ObjectId()],
        traceEnabled: true,
      })
    })
  })
  describe('getById', () => {
    it('calls out to read method and returns undefined if no result', async () => {
      await testGetById({
        readResponse: undefined,
        expected: undefined,
      })
    })
    it('calls out to read method and returns undefined if empty result', async () => {
      await testGetById({
        readResponse: [],
        expected: undefined,
      })
    })
    it('calls out to read method and returns game if one exists', async () => {
      const game = TestUtil.getDbGame({})
      await testGetById({
        id: game._id,
        readResponse: [game],
        expected: game,
      })
    })
    it('calls out to read method with options', async () => {
      const game = TestUtil.getDbGame({})
      await testGetById({
        id: game._id,
        readResponse: [game],
        expected: game,
        options: {
          sort: {
            created: 1,
            _id: 1,
          },
        },
      })
    })
    it('calls out to read method and throws error if more than 1 game exists', async () => {
      const game = TestUtil.getDbGame({})
      await testGetById({
        id: game._id,
        readResponse: [game, game],
        error: `Multiple games with ID "${game._id}" found.`,
        errorCalls: [[`Multiple games with ID "${game._id}" found: "${JSON.stringify([game, game])}"`]],
      })
    })
    it('logs to trace if enabled', async () => {
      const game = TestUtil.getDbGame({})
      await testGetById({
        id: game._id,
        readResponse: [game],
        expected: game,
        traceEnabled: true,
      })
    })
  })
  describe('getByUserId', () => {
    it('calls out to read method and returns result if id string', async () => {
      await testGetByUserId({
        userId: new ObjectId().toString(),
      })
    })
    it('calls out to read method and returns result if id ObjectId', async () => {
      await testGetByUserId({
        userId: new ObjectId(),
      })
    })
    it('logs to trace if enabled', async () => {
      await testGetByUserId({
        userId: new ObjectId(),
        traceEnabled: true,
      })
    })
  })
  describe('setDeck', () => {
    it('calls out to update method and returns result if ids strings', async () => {
      await testSetDeck({
        gameId: new ObjectId().toString(),
        userId: new ObjectId().toString(),
      })
    })
    it('calls out to update method and returns result if ids ObjectIds', async () => {
      await testSetDeck({
        gameId: new ObjectId(),
        userId: new ObjectId(),
      })
    })
    it('logs to debug if enabled', async () => {
      await testSetDeck({
        gameId: new ObjectId(),
        userId: new ObjectId(),
        debugEnabled: true,
      })
    })
    it('logs to trace if enabled', async () => {
      await testSetDeck({
        gameId: new ObjectId(),
        userId: new ObjectId(),
        traceEnabled: true,
      })
    })
  })
  describe('setOrder', () => {
    it('calls out to update method and returns result if ids strings', async () => {
      await testSetOrder({
        gameId: new ObjectId().toString(),
        userIds: [new ObjectId().toString(), new ObjectId().toString()],
      })
    })
    it('calls out to update method and returns result if ids ObjectIds', async () => {
      await testSetOrder({
        gameId: new ObjectId(),
        userIds: [new ObjectId(), new ObjectId()],
      })
    })
    it('logs out if debug enabled', async () => {
      await testSetOrder({
        gameId: new ObjectId(),
        userIds: [new ObjectId(), new ObjectId()],
        debugEnabled: true,
      })
    })
    it('logs out if trace enabled', async () => {
      await testSetOrder({
        gameId: new ObjectId(),
        userIds: [new ObjectId(), new ObjectId()],
        traceEnabled: true,
      })
    })
  })
  describe('redraw', () => {
    it('calls out to update method and returns result if ids strings', async () => {
      await testRedraw({
        gameId: new ObjectId().toString(),
        userId: new ObjectId().toString(),
      })
    })
    it('calls out to update method and returns result if ids ObjectIds', async () => {
      await testRedraw({
        gameId: new ObjectId(),
        userId: new ObjectId(),
      })
    })
    it('logs out info if trace enabled', async () => {
      await testRedraw({
        gameId: new ObjectId(),
        userId: new ObjectId(),
        traceEnabled: true,
      })
    })
  })
  describe('setReady', () => {
    it('calls out to update and returns result if id strings', async () => {
      await testSetReady({
        gameId: new ObjectId().toString(),
        userId: new ObjectId().toString(),
      })
    })
    it('calls out to update and returns result if id ObjectIds', async () => {
      await testSetReady({
        gameId: new ObjectId(),
        userId: new ObjectId(),
      })
    })
    it('logs out info if trace enabled', async () => {
      await testSetReady({
        gameId: new ObjectId(),
        userId: new ObjectId(),
        traceEnabled: true,
      })
    })
  })
  describe('makeMove', () => {
    it('calls out to update and returns result if id strings', async () => {
      await testMakeMove({
        userId: new ObjectId().toString(),
      })
    })
    it('calls out to update and returns result if id ObjectIds', async () => {
      await testMakeMove({
        userId: new ObjectId(),
      })
    })
    it('logs out info if trace enabled', async () => {
      await testMakeMove({
        userId: new ObjectId(),
        traceEnabled: true,
      })
    })
  })
})

async function testAddGame({
  creatorId,
  opponentIds,
  traceEnabled,
}: {
  creatorId: ObjectId | string
  opponentIds: (ObjectId | string)[]
  traceEnabled?: boolean
}) {
  const created = new Date()
  const expected = TestUtil.getDbGame({
    created,
    creator: creatorId,
    players: [creatorId, ...opponentIds].map((playerId) =>
      TestUtil.getDbGamePlayer({
        deck: TestUtil.getDbGameDeck({
          from: null as any,
        }),
        user: playerId,
      })
    ),
    updated: created,
  })
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  GameStore['logger'] = {
    debug: debugSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as any
  const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => created)
  const createSpy = jest.spyOn(GameStore as any, 'create').mockResolvedValue(expected)

  await expect(
    GameStore.add({
      creatorId,
      opponentIds,
    })
  ).resolves.toEqual(expected)

  expect(dateSpy.mock.calls).toEqual([[]])
  const createExpected = {
    ...expected,
  } as any
  delete createExpected._id
  expect(createSpy.mock.calls).toEqual([[createExpected]])
  expect(debugSpy.mock.calls).toEqual([[`Adding game by creator "${creatorId}"`]])
  expect(traceSpy.mock.calls).toEqual(traceEnabled ? [[`Adding game: "${JSON.stringify(createExpected)}"`]] : [])
}

async function testGetById({
  id,
  options,
  readResponse,
  expected,
  error,
  errorCalls = [],
  traceEnabled,
}: {
  id?: ObjectId
  options?: FindOptions
  readResponse?: GameDbObject[]
  expected?: GameDbObject
  error?: string
  errorCalls?: any[][]
  traceEnabled?: boolean
}) {
  if (!id) {
    id = new ObjectId()
  }
  const readSpy = jest.spyOn(GameStore as any, 'read').mockResolvedValue(readResponse)
  const errorSpy = jest.fn().mockImplementation()
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  GameStore['logger'] = {
    error: errorSpy,
    debug: debugSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as any

  const promise = GameStore.getById({
    id,
    options,
  })
  if (error) {
    await expect(promise).rejects.toThrow(error)
  } else {
    await expect(promise).resolves.toEqual(expected)
  }
  const filter: Filter<Document> = {
    _id: id,
  }

  expect(readSpy.mock.calls).toEqual([
    [
      {
        filter,
        options,
      },
    ],
  ])
  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(debugSpy.mock.calls).toEqual([[`Getting game by ID "${id}"`]])
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [`getById filter for ID "${id}": "${JSON.stringify(filter)}"`],
          [`getById options for ID "${id}": "${JSON.stringify(options)}"`],
        ]
      : []
  )
}

async function testGetByUserId({ userId, traceEnabled }: { userId: ObjectId | string; traceEnabled?: boolean }) {
  const game = TestUtil.getDbGame({})
  const readSpy = jest.spyOn(GameStore as any, 'read').mockResolvedValue([game])
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  GameStore['logger'] = {
    debug: debugSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as any
  const filter: Filter<Document> = {
    'players.user': new ObjectId(userId),
  }

  await expect(GameStore.getByUserId(userId)).resolves.toEqual([game])

  expect(readSpy.mock.calls).toEqual([
    [
      {
        filter,
      },
    ],
  ])
  expect(debugSpy.mock.calls).toEqual([[`Getting games for userId "${userId}"`]])
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled ? [[`getByUserId filter for userId "${userId}": "${JSON.stringify(filter)}"`]] : []
  )
}

async function testSetDeck({
  gameId,
  userId,
  debugEnabled,
  traceEnabled,
}: {
  gameId: string | ObjectId
  userId: string | ObjectId
  debugEnabled?: boolean
  traceEnabled?: boolean
}) {
  const deck = TestUtil.getDbDeck({
    user: userId,
  })
  const hand: DeckUnitDbObject[] = [TestUtil.getDbDeckUnit({})]
  const undrawn: DeckUnitDbObject[] = [TestUtil.getDbDeckUnit({}), TestUtil.getDbDeckUnit({})]
  const updatedGame = TestUtil.getDbGame({
    id: gameId,
    creator: userId,
  })
  updatedGame.players = updatedGame.players.map((player) => {
    if (player.user === updatedGame.creator) {
      player.deck = TestUtil.getDbGameDeck({
        from: deck,
      })
    }
    return player
  })
  const updated = new Date()
  const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => updated)
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  GameStore['logger'] = {
    isDebugEnabled: jest.fn().mockReturnValue(debugEnabled),
    debug: debugSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as any
  const updateSpy = jest.spyOn(GameStore as any, 'update').mockResolvedValue(updatedGame)
  const filter: Filter<Document> = {
    _id: new ObjectId(gameId),
    'players.user': new ObjectId(userId),
    'players.deck.from': null,
  }
  const update: UpdateFilter<Document> = {
    $set: {
      updated,
      'players.$.deck.from': deck,
      'players.$.deck.hand': hand,
      'players.$.deck.undrawn': undrawn,
    },
  }

  await expect(
    GameStore.setDeck({
      deck,
      gameId,
      hand,
      undrawn,
      userId,
    })
  ).resolves.toEqual(updatedGame)

  expect(updateSpy.mock.calls).toEqual([
    [
      {
        filter,
        update,
        verifyExistence: false,
      },
    ],
  ])
  expect(dateSpy.mock.calls).toEqual([[]])
  expect(debugSpy.mock.calls).toEqual(
    debugEnabled
      ? [
          [
            `Setting deck to "${deck._id}" on game "${gameId}" for user "${userId}" with hand "${JSON.stringify(
              hand.map((deckUnit) => deckUnit.unit.id)
            )}"`,
          ],
        ]
      : []
  )
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [`setDeck for game "${gameId}" and user "${userId}" filter: "${JSON.stringify(filter)}"`],
          [`setDeck for game "${gameId}" and user "${userId}" update: "${JSON.stringify(update)}"`],
        ]
      : []
  )
}

async function testSetOrder({
  gameId,
  userIds,
  debugEnabled,
  traceEnabled,
}: {
  gameId: string | ObjectId
  userIds: (string | ObjectId)[]
  debugEnabled?: boolean
  traceEnabled?: boolean
}) {
  const mockedResponse = undefined
  const updated = new Date()
  const filter = {
    _id: new ObjectId(gameId),
    turn: null,
  }
  const update = {
    $set: {
      updated,
      turn: new ObjectId(userIds[0]),
      'players.$[p0].order': 0,
      'players.$[p1].order': 1,
    },
  }
  const arrayFilters = [
    {
      'p0.user': new ObjectId(userIds[0]),
    },
    {
      'p1.user': new ObjectId(userIds[1]),
    },
  ]
  const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => updated)
  const updateSpy = jest.spyOn(GameStore as any, 'update').mockResolvedValue(mockedResponse)
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  GameStore['logger'] = {
    isDebugEnabled: jest.fn().mockReturnValue(debugEnabled),
    debug: debugSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as any

  await expect(
    GameStore.setOrder({
      gameId,
      userIds,
    })
  ).resolves.toEqual(mockedResponse)

  expect(dateSpy.mock.calls).toEqual([[]])
  expect(updateSpy.mock.calls).toEqual([
    [
      {
        filter,
        update,
        options: {
          arrayFilters,
        },
        verifyExistence: false,
      },
    ],
  ])
  expect(debugSpy.mock.calls).toEqual(
    debugEnabled ? [[`Setting order on game "${gameId}" to "${JSON.stringify(userIds)}"`]] : []
  )
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [`setOrder for game "${gameId}" filter: "${JSON.stringify(filter)}"`],
          [`setOrder for game "${gameId}" update: "${JSON.stringify(update)}"`],
          [`setOrder for game "${gameId}" arrayFilters: "${JSON.stringify(arrayFilters)}"`],
        ]
      : []
  )
}

async function testRedraw({
  gameId,
  userId,
  traceEnabled,
}: {
  gameId: string | ObjectId
  userId: string | ObjectId
  traceEnabled?: boolean
}) {
  const from: DeckUnitDbObject = TestUtil.getDbDeckUnit({})
  const to: DeckUnitDbObject = TestUtil.getDbDeckUnit({
    artStyle: 2,
  })
  const currentRedraws: RedrawDbObject[] = []
  const newHand: DeckUnitDbObject[] = [
    TestUtil.getDbDeckUnit({
      artStyle: 3,
    }),
    to,
  ]
  const newRedraws: RedrawDbObject[] = [
    {
      from,
      to,
    },
  ]
  const newUndrawn: DeckUnitDbObject[] = [
    TestUtil.getDbDeckUnit({
      artStyle: 4,
    }),
  ]

  const deck: DeckDbObject = {
    _id: new ObjectId(),
    created: new Date(),
    faction: new ObjectId(),
    leader: new ObjectId(),
    name: 'deck-name',
    stats: {} as any,
    units: [],
    user: new ObjectId(userId),
  }
  const updatedGame = TestUtil.getDbGame({
    id: gameId,
    creator: userId,
  })
  updatedGame.players = updatedGame.players.map((player) => {
    if (player.user === updatedGame.creator) {
      player.deck = TestUtil.getDbGameDeck({
        from: deck,
        hand: newHand,
        undrawn: newUndrawn,
      })
    }
    return player
  })
  const updated = new Date()
  const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => updated)
  const updateSpy = jest.spyOn(GameStore as any, 'update').mockResolvedValue(updatedGame)
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  GameStore['logger'] = {
    debug: debugSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as any
  const filter: Filter<Document> = {
    _id: new ObjectId(gameId),
    'players.user': new ObjectId(userId),
    'players.ready': false,
    'players.deck.redraws': currentRedraws,
  }
  const update: UpdateFilter<Document> = {
    $set: {
      updated,
      'players.$.deck.hand': newHand,
      'players.$.deck.undrawn': newUndrawn,
      'players.$.deck.redraws': newRedraws,
    },
  }

  await expect(
    GameStore.redraw({
      currentRedraws,
      newHand,
      newRedraws,
      newUndrawn,
      gameId,
      userId,
    })
  ).resolves.toEqual(updatedGame)

  expect(updateSpy.mock.calls).toEqual([
    [
      {
        filter,
        update,
        verifyExistence: false,
      },
    ],
  ])
  expect(dateSpy.mock.calls).toEqual([[]])
  expect(debugSpy.mock.calls).toEqual([
    [`Redrawing unit from "${from.unit}" to "${to.unit}" on game "${gameId}" for user "${userId}"`],
  ])
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [`redraw for game "${gameId}" by user "${userId}" filter: "${JSON.stringify(filter)}"`],
          [`redraw for game "${gameId}" by user "${userId}" update: "${JSON.stringify(update)}"`],
        ]
      : []
  )
}

async function testSetReady({
  gameId,
  userId,
  traceEnabled,
}: {
  gameId: string | ObjectId
  userId: string | ObjectId
  traceEnabled?: boolean
}) {
  const previousUpdate = new Date()
  const currentRound = 1
  const deck = TestUtil.getDbDeck({
    user: userId,
  })
  const updatedGame = TestUtil.getDbGame({
    id: gameId,
    creator: userId,
  })
  updatedGame.players = updatedGame.players.map((player) => {
    if (player.user === updatedGame.creator) {
      player.deck = TestUtil.getDbGameDeck({
        from: deck,
      })
      player.ready = true
    }
    return player
  })
  const updated = new Date()
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  GameStore['logger'] = {
    debug: debugSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as any
  const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => updated)
  const updateSpy = jest.spyOn(GameStore as any, 'update').mockResolvedValue(updatedGame)
  const filter: Filter<Document> = {
    _id: new ObjectId(gameId),
    updated: previousUpdate,
  }
  const update: UpdateFilter<Document> = {
    $set: {
      updated,
      players: updatedGame.players,
      round: currentRound,
    },
  }

  await expect(
    GameStore.setReady({
      gameId,
      userId,
      previousUpdate,
      players: updatedGame.players,
      currentRound,
    })
  ).resolves.toEqual(updatedGame)

  expect(updateSpy.mock.calls).toEqual([
    [
      {
        filter,
        update,
        verifyExistence: false,
      },
    ],
  ])
  expect(dateSpy.mock.calls).toEqual([[]])
  expect(debugSpy.mock.calls).toEqual([[`Marking game "${gameId}" ready for user "${userId}"`]])
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [`ready for game "${gameId}" by user "${userId}" filter: "${JSON.stringify(filter)}"`],
          [`ready for game "${gameId}" by user "${userId}" update: "${JSON.stringify(update)}"`],
        ]
      : []
  )
}

async function testMakeMove({ userId, traceEnabled }: { userId: string | ObjectId; traceEnabled?: boolean }) {
  const game = TestUtil.getDbGame({
    creator: userId,
  })
  const updated = new Date()
  const udatedGame: GameDbObject = {
    ...game,
    updated,
  }
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  GameStore['logger'] = {
    debug: debugSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as any
  const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => updated)
  const updateSpy = jest.spyOn(GameStore as any, 'update').mockResolvedValue(udatedGame)
  const filter: Filter<Document> = {
    _id: new ObjectId(game._id),
    turn: new ObjectId(userId),
    updated: game.updated,
  }
  const update: UpdateFilter<Document> = {
    $set: {
      ...game,
      updated,
    },
  }

  await expect(
    GameStore.makeMove({
      game: game,
      userId,
    })
  ).resolves.toEqual(udatedGame)

  expect(updateSpy.mock.calls).toEqual([
    [
      {
        filter,
        update,
        verifyExistence: false,
      },
    ],
  ])
  expect(dateSpy.mock.calls).toEqual([[]])
  expect(debugSpy.mock.calls).toEqual([
    [`Move made on game "${game._id}" by user "${userId}", setting next move to "${game.turn}"`],
  ])
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [`move on game "${game._id}" by user "${userId}" filter: "${JSON.stringify(filter)}"`],
          [`move on game "${game._id}" by user "${userId}" update: "${JSON.stringify(update)}"`],
        ]
      : []
  )
}
