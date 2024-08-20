import { ObjectId } from 'mongodb'

import GameStore from '../../src/database/stores/game-store'
import { DeckDbObject, DeckUnitDbObject, GameDbObject, RedrawDbObject } from '@gwent/graphql-schema/database-typings'
import { MAX_ROUNDS } from '@gwent/constants'

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
      const id = new ObjectId()
      const game = getFakeGame({
        id,
      })
      await testGetById({
        id,
        readResponse: [game],
        expected: game,
      })
    })
    it('calls out to read method and throws error if more than 1 game exists', async () => {
      const id = new ObjectId()
      const game = getFakeGame({
        id,
      })
      await testGetById({
        id,
        readResponse: [game, game],
        error: `Multiple games with ID "${id}" exist`,
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
    it('logs out info if trace enabled', async () => {
      await testSetDeck({
        gameId: new ObjectId(),
        userId: new ObjectId(),
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
      await testReady({
        gameId: new ObjectId().toString(),
        userId: new ObjectId().toString(),
      })
    })
    it('calls out to update and returns result if id strings', async () => {
      await testReady({
        gameId: new ObjectId(),
        userId: new ObjectId(),
      })
    })
    it('logs out info if trace enabled', async () => {
      await testReady({
        gameId: new ObjectId(),
        userId: new ObjectId(),
        traceEnabled: true,
      })
    })
  })
})

function getFakeGame({ creatorId, id }: { id?: ObjectId; creatorId?: ObjectId }): GameDbObject {
  if (!creatorId) {
    creatorId = new ObjectId()
  }
  return {
    _id: id || new ObjectId(),
    created: new Date(),
    creator: creatorId,
    players: [
      {
        deck: {
          discard: [],
          from: null as any as undefined,
          hand: [],
          redraws: [],
          undrawn: [],
        },
        ready: false,
        rounds: [],
        user: creatorId,
      },
      {
        deck: {
          discard: [],
          from: null as any as undefined,
          hand: [],
          redraws: [],
          undrawn: [],
        },
        ready: false,
        rounds: [],
        user: new ObjectId(),
      },
    ],
    round: {
      current: 0,
      maximum: MAX_ROUNDS,
    },
    updated: new Date(),
    victors: [],
  }
}

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
  const expected: GameDbObject = {
    _id: new ObjectId(),
    created,
    creator: new ObjectId(creatorId),
    players: [creatorId, ...opponentIds].map((playerId) => {
      return {
        deck: {
          discard: [],
          from: null as any as undefined,
          hand: [],
          redraws: [],
          undrawn: [],
        },
        ready: false,
        rounds: [],
        user: new ObjectId(playerId),
      }
    }),
    round: {
      current: 0,
      maximum: MAX_ROUNDS,
    },
    updated: created,
    victors: [],
  }
  const traceSpy = jest.fn().mockImplementation()
  GameStore['logger'] = {
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
  expect(traceSpy.mock.calls).toEqual(traceEnabled ? [[`Adding game: "${JSON.stringify(createExpected)}"`]] : [])
}

async function testGetById({
  id,
  readResponse,
  expected,
  error,
}: {
  id?: ObjectId
  readResponse?: GameDbObject[]
  expected?: GameDbObject
  error?: string
}) {
  if (!id) {
    id = new ObjectId()
  }
  const readSpy = jest.spyOn(GameStore as any, 'read').mockResolvedValue(readResponse)
  const errorSpy = jest.fn().mockImplementation()
  GameStore['logger'] = {
    error: errorSpy,
  } as any

  if (error) {
    await expect(
      GameStore.getById({
        id,
      })
    ).rejects.toThrow(error)
  } else {
    await expect(
      GameStore.getById({
        id,
      })
    ).resolves.toEqual(expected)
  }

  expect(readSpy.mock.calls).toEqual([
    [
      {
        filter: {
          _id: id,
        },
        options: undefined,
      },
    ],
  ])
  expect(errorSpy.mock.calls).toEqual(error ? [[error]] : [])
}

async function testGetByUserId({ userId }: { userId: ObjectId | string }) {
  const game = getFakeGame({})
  const readSpy = jest.spyOn(GameStore as any, 'read').mockResolvedValue([game])

  await expect(GameStore.getByUserId(userId)).resolves.toEqual([game])

  expect(readSpy.mock.calls).toEqual([
    [
      {
        filter: {
          'players.user': new ObjectId(userId),
        },
      },
    ],
  ])
}

async function testSetDeck({
  gameId,
  userId,
  traceEnabled,
}: {
  gameId: string | ObjectId
  userId: string | ObjectId
  traceEnabled?: boolean
}) {
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
  const hand: DeckUnitDbObject[] = [
    {
      artStyle: 1,
      unit: new ObjectId(),
    },
  ]
  const undrawn: DeckUnitDbObject[] = [
    {
      artStyle: 1,
      unit: new ObjectId(),
    },
    {
      artStyle: 1,
      unit: new ObjectId(),
    },
  ]
  const updatedGame = getFakeGame({
    id: new ObjectId(gameId),
    creatorId: new ObjectId(userId),
  })
  updatedGame.players = updatedGame.players.map((player) => {
    if (player.user === updatedGame.creator) {
      player.deck = {
        discard: [],
        hand,
        redraws: [],
        undrawn,
        from: deck,
      }
    }
    return player
  })
  const updated = new Date()
  const traceSpy = jest.fn().mockImplementation()
  GameStore['logger'] = {
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as any
  const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => updated)
  const updateSpy = jest.spyOn(GameStore as any, 'update').mockResolvedValue(updatedGame)

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
        filter: {
          _id: new ObjectId(gameId),
          'players.user': new ObjectId(userId),
          'players.deck.from': null,
        },
        update: {
          $set: {
            updated,
            'players.$.deck.from': deck,
            'players.$.deck.hand': hand,
            'players.$.deck.undrawn': undrawn,
          },
        },
        verifyExistence: false,
      },
    ],
  ])
  expect(dateSpy.mock.calls).toEqual([[]])
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [[`Setting deck to "${deck._id}" on game "${gameId}" for user "${userId}" with hand "${JSON.stringify(hand)}"`]]
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
  const from: DeckUnitDbObject = {
    artStyle: 1,
    unit: new ObjectId(),
  }
  const to: DeckUnitDbObject = {
    artStyle: 2,
    unit: new ObjectId(),
  }
  const currentRedraws: RedrawDbObject[] = []
  const newHand: DeckUnitDbObject[] = [
    {
      artStyle: 3,
      unit: new ObjectId(),
    },
    to,
  ]
  const newRedraws: RedrawDbObject[] = [
    {
      from,
      to,
    },
  ]
  const newUndrawn: DeckUnitDbObject[] = [
    {
      artStyle: 4,
      unit: new ObjectId(),
    },
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
  const updatedGame = getFakeGame({
    id: new ObjectId(gameId),
    creatorId: new ObjectId(userId),
  })
  updatedGame.players = updatedGame.players.map((player) => {
    if (player.user === updatedGame.creator) {
      player.deck = {
        discard: [],
        hand: newHand,
        redraws: [],
        undrawn: newUndrawn,
        from: deck,
      }
    }
    return player
  })
  const updated = new Date()
  const traceSpy = jest.fn().mockImplementation()
  GameStore['logger'] = {
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as any
  const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => updated)
  const updateSpy = jest.spyOn(GameStore as any, 'update').mockResolvedValue(updatedGame)

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
        filter: {
          _id: new ObjectId(gameId),
          'players.user': new ObjectId(userId),
          'players.ready': false,
          'players.deck.redraws': currentRedraws,
        },
        update: {
          $set: {
            updated,
            'players.$.deck.hand': newHand,
            'players.$.deck.undrawn': newUndrawn,
            'players.$.deck.redraws': newRedraws,
          },
        },
        verifyExistence: false,
      },
    ],
  ])
  expect(dateSpy.mock.calls).toEqual([[]])
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [[`Redrawing unit from "${from.unit}" to "${to.unit}" on game "${gameId}" for user "${userId}"`]]
      : []
  )
}

async function testReady({
  gameId,
  userId,
  traceEnabled,
}: {
  gameId: string | ObjectId
  userId: string | ObjectId
  traceEnabled?: boolean
}) {
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
  const hand: DeckUnitDbObject[] = [
    {
      artStyle: 1,
      unit: new ObjectId(),
    },
  ]
  const undrawn: DeckUnitDbObject[] = [
    {
      artStyle: 1,
      unit: new ObjectId(),
    },
    {
      artStyle: 1,
      unit: new ObjectId(),
    },
  ]
  const updatedGame = getFakeGame({
    id: new ObjectId(gameId),
    creatorId: new ObjectId(userId),
  })
  updatedGame.players = updatedGame.players.map((player) => {
    if (player.user === updatedGame.creator) {
      player.deck = {
        discard: [],
        hand,
        redraws: [],
        undrawn,
        from: deck,
      }
      player.ready = true
    }
    return player
  })
  const updated = new Date()
  const traceSpy = jest.fn().mockImplementation()
  GameStore['logger'] = {
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as any
  const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => updated)
  const updateSpy = jest.spyOn(GameStore as any, 'update').mockResolvedValue(updatedGame)

  await expect(
    GameStore.setReady({
      gameId,
      userId,
    })
  ).resolves.toEqual(updatedGame)

  expect(updateSpy.mock.calls).toEqual([
    [
      {
        filter: {
          _id: new ObjectId(gameId),
          'players.user': new ObjectId(userId),
          'players.ready': false,
        },
        update: {
          $set: {
            updated,
            'players.$.ready': true,
          },
        },
        verifyExistence: false,
      },
    ],
  ])
  expect(dateSpy.mock.calls).toEqual([[]])
  expect(traceSpy.mock.calls).toEqual(traceEnabled ? [[`Marking game "${gameId}" ready for user "${userId}"`]] : [])
}
