import { ObjectId } from 'mongodb'

import { Deck, DeckUnit, FactionKey, Game, GameDeck, User } from '@gwent/graphql-schema/resolver-typings'
import {
  DeckDbObject,
  DeckUnitDbObject,
  FactionDbObject,
  GameDbObject,
  GamePlayerDbObject,
  LeaderDbObject,
  RedrawDbObject,
  UnitDbObject,
  UserDbObject,
} from '@gwent/graphql-schema/database-typings'
import DeckResolver from '../../src/graphql/resolvers/deck-resolver'
import DeckStore from '../../src/database/stores/deck-store'
import DeckUnitResolver from '../../src/graphql/resolvers/deck-unit-resolver'
import FactionResolver from '../../src/graphql/resolvers/faction-resolver'
import FactionStore from '../../src/database/stores/faction-store'
import GameDeckResolver from '../../src/graphql/resolvers/game-deck-resolver'
import GameResolver from '../../src/graphql/resolvers/game-resolver'
import GameStore from '../../src/database/stores/game-store'
import * as getRandomSubset from '@gwent/utils'
import * as gwentUtils from '@gwent/utils'
import LeaderResolver from '../../src/graphql/resolvers/leader-resolver'
import LeaderStore from '../../src/database/stores/leader-store'
import { MAX_REDRAWS, PLAYER_COUNTS, STARTING_HAND_SIZE } from '@gwent/constants'
import MutationResolver from '../../src/graphql/resolvers/mutation-resolver'
import TestUtil from '../test-util'
import UnitStore from '../../src/database/stores/unit-store'
import UserStore from '../../src/database/stores/user-store'
import * as validateDeck from '@gwent/validators'

describe('mutation-resolver', () => {
  describe('addDeck', () => {
    const userId = new ObjectId()
    const logPrefix = `addDeck by "${userId}"`
    it('returns error if faction is neutral', async () => {
      const error = `Cannot create Deck with "${FactionKey.Neutral}" faction.`
      await testAddDeck({
        userId,
        factionKey: FactionKey.Neutral,
        errorReturned: error,
        factionGetCalls: [],
        leaderGetCalls: [],
        unitGetCalls: [],
        deckUnitCalls: [],
        validateDeckCalls: [],
        deckAddCalls: [],
        getDeckStatsCalls: [],
        postResolversCalled: false,
        debugCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('returns error if faction with key does not exist', async () => {
      const error = `Faction with key "${FactionKey.Monsters}" not found.`
      await testAddDeck({
        userId,
        factionGetResponse: [],
        errorReturned: error,
        leaderGetCalls: [],
        unitGetCalls: [],
        deckUnitCalls: [],
        validateDeckCalls: [],
        deckAddCalls: [],
        getDeckStatsCalls: [],
        postResolversCalled: false,
        debugCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('returns error if leader does not exist', async () => {
      const leaderId = new ObjectId()
      const error = `Leader "${leaderId}" does not exist.`
      await testAddDeck({
        userId,
        leaderId,
        leaderGetResponse: [],
        errorReturned: error,
        unitGetCalls: [],
        deckUnitCalls: [],
        validateDeckCalls: [],
        deckAddCalls: [],
        getDeckStatsCalls: [],
        postResolversCalled: false,
        debugCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('returns error if leader is of wrong faction', async () => {
      const factionId = new ObjectId()
      const leaderId = new ObjectId()
      const error = `Leader "${leaderId}" faction "${FactionKey.NorthernRealms}" does not match deck faction "${FactionKey.Monsters}".`
      await testAddDeck({
        userId,
        factionKey: FactionKey.Monsters,
        factionGetResponse: [
          TestUtil.getDbFaction({
            key: FactionKey.Monsters,
          }),
          TestUtil.getDbFaction({
            id: factionId,
            key: FactionKey.NorthernRealms,
          }),
        ],
        leaderId,
        leaderGetResponse: [
          TestUtil.getDbLeader({
            id: leaderId,
            faction: factionId,
          }),
        ],
        errorReturned: error,
        unitGetCalls: [],
        deckUnitCalls: [],
        validateDeckCalls: [],
        deckAddCalls: [],
        getDeckStatsCalls: [],
        postResolversCalled: false,
        debugCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('returns error if single unit does not exist', async () => {
      const unitId = new ObjectId()
      const error = `Unit "${unitId}" does not exist.`
      await testAddDeck({
        userId,
        unitIds: [unitId],
        unitGetResponse: [],
        errorReturned: error,
        deckUnitCalls: [],
        validateDeckCalls: [],
        deckAddCalls: [],
        getDeckStatsCalls: [],
        postResolversCalled: false,
        debugCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('returns errors if multiple units do not exist', async () => {
      const unitId1 = new ObjectId()
      const unitId2 = new ObjectId()
      const error = [`Unit "${unitId1}" does not exist.`, `Unit "${unitId2}" does not exist.`].join('\n')
      await testAddDeck({
        userId,
        unitIds: [unitId1, unitId2],
        unitGetResponse: [],
        errorReturned: error,
        deckUnitCalls: [],
        validateDeckCalls: [],
        deckAddCalls: [],
        getDeckStatsCalls: [],
        postResolversCalled: false,
        debugCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('returns error if validateDeck returns single error', async () => {
      const error = 'too many specials'
      await testAddDeck({
        userId,
        validateDeckResponse: [error],
        errorReturned: error,
        deckAddCalls: [],
        getDeckStatsCalls: [],
        postResolversCalled: false,
        debugCalls: [[`${logPrefix} failed validateDeck: ${error}`]],
      })
    })
    it('returns errors if validateDeck returns multiple errors', async () => {
      const error1 = 'too many specials'
      const error2 = 'not enough units'
      await testAddDeck({
        userId,
        validateDeckResponse: [error1, error2],
        errorReturned: `${error1}\n${error2}`,
        deckAddCalls: [],
        getDeckStatsCalls: [],
        postResolversCalled: false,
        debugCalls: [[`${logPrefix} failed validateDeck: ${error1}\n${error2}`]],
      })
    })
    it('returns error if deck with name already exists', async () => {
      const name = 'deck-name'
      const error = `Deck with name "${name}" already exists for user "${userId}"`
      await testAddDeck({
        userId,
        name,
        deckAddError: error,
        errorReturned: `Deck with name "${name}" already exists.`,
        postResolversCalled: false,
        debugCalls: [[`${logPrefix} failed: Deck with name "${name}" already exists.`]],
      })
    })
    it('throws error if addDeck throws error that is not duplicate name', async () => {
      const error = 'network error'
      await testAddDeck({
        userId,
        deckAddError: error,
        errorThrown: error,
        postResolversCalled: false,
        errorCalls: [[Error(`${logPrefix} failed: ${Error(error)}`)]],
      })
    })
    it('undefined artstyle converted to 1', async () => {
      await testAddDeck({
        inputArtStyle: undefined,
        expectedArtStyle: 1,
      })
    })
    it('null artstyle converted to 1', async () => {
      await testAddDeck({
        inputArtStyle: null,
        expectedArtStyle: 1,
      })
    })
    it('explicit artStyle of 1', async () => {
      await testAddDeck({
        inputArtStyle: 1,
        expectedArtStyle: 1,
      })
    })
    it('explicit artStyle of 2', async () => {
      await testAddDeck({
        inputArtStyle: 2,
        expectedArtStyle: 2,
      })
    })
    it('calls to trace if enabled', async () => {
      await testAddDeck({
        userId,
        traceEnabled: true,
        logPrefix,
      })
    })
  })
  describe('addGame', () => {
    const userId = new ObjectId()
    const logPrefix = `addGame by "${userId}"`
    it('returns error if not enough opponents', async () => {
      const error = `Not enough opponents for game at "0", minimum is "${PLAYER_COUNTS.Min - 1}".`
      await testAddGame({
        creatorId: userId,
        opponentNames: [],
        expected: Error(error),
        debugCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('returns error if too many opponents', async () => {
      const error = `Excessive number of opponents for game at "2", maximum is "${PLAYER_COUNTS.Min - 1}".`
      await testAddGame({
        creatorId: userId,
        opponentNames: ['one', 'two'],
        expected: Error(error),
        debugCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('returns error if opponent does not exist', async () => {
      const opponent = 'opponent'
      const error = `User with name "${opponent}" does not exist.`
      await testAddGame({
        creatorId: userId,
        opponentNames: [opponent],
        expected: Error(error),
        getByNamesCalls: [[[opponent]]],
        debugCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('returns resolved game if opponent exists', async () => {
      const creatorId = new ObjectId()
      const opponent = 'opponent'
      const user = TestUtil.getDbUser({
        name: 'opponent',
      })
      await testAddGame({
        creatorId,
        opponentNames: [user.name],
        getUserByNamesResponse: [user],
        addCalls: [
          [
            {
              creatorId,
              opponentIds: [user._id.toString()],
            },
          ],
        ],
        fromObjectCalled: true,
        getByNamesCalls: [[[opponent]]],
      })
    })
    it('calls to trace if enabled', async () => {
      const opponent = 'opponent'
      const user = TestUtil.getDbUser({
        name: 'opponent',
      })
      await testAddGame({
        creatorId: userId,
        opponentNames: [user.name],
        getUserByNamesResponse: [user],
        addCalls: [
          [
            {
              creatorId: userId,
              opponentIds: [user._id.toString()],
            },
          ],
        ],
        fromObjectCalled: true,
        getByNamesCalls: [[[opponent]]],
        logPrefix,
        traceEnabled: true,
      })
    })
  })
  describe('addUser', () => {
    const name = 'james.bond@mi6.com'
    const logPrefix = `addUser for user "${name}"`
    it('returns error if user already exists', async () => {
      const error = 'User already exists.'
      await testAddUser({
        name,
        userAddResponse: Error(`User "${name}" already exists`),
        expected: Error(error),
        debugCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('throws error if not about user already existing', async () => {
      const error = Error('Connection refused')
      await testAddUser({
        name,
        userAddResponse: error,
        error,
        errorCalls: [[Error(`${logPrefix} failed: ${error}`)]],
      })
    })
    it('returns user if no error', async () => {
      const user = TestUtil.getDbUser({
        name,
      })
      await testAddUser({
        name,
        userAddResponse: user,
        expected: TestUtil.getUserFromDbUser(user),
      })
    })
    it('calls to trace if enabled', async () => {
      const user = TestUtil.getDbUser({
        name,
      })
      await testAddUser({
        name,
        userAddResponse: user,
        expected: TestUtil.getUserFromDbUser(user),
        logPrefix,
        traceEnabled: true,
      })
    })
  })
  describe('login', () => {
    const name = 'james.bond@mi6.com'
    const logPrefix = `login for user "${name}"`
    it('returns error if credentials invalid', async () => {
      const error = Error(`Invalid credentials for user "${name}"`)
      await testLogin({
        name,
        userValidateResponse: error,
        expected: error,
        debugCalls: [[`${logPrefix} failed: Invalid credentials for user "${name}"`]],
      })
    })
    it('throws error if not invalid credentials', async () => {
      const error = Error('Connection refused')
      await testLogin({
        userValidateResponse: error,
        error,
        errorCalls: [[Error(`${logPrefix} failed: ${error}`)]],
      })
    })
    it('sets user on context if context undefined', async () => {
      await testLogin({
        context: undefined,
        additionalTraceCalls: [`${logPrefix}: context not set, defining.`],
      })
    })
    it('sets user on context if context session undefined', async () => {
      await testLogin({
        context: {},
        additionalTraceCalls: [`${logPrefix}: session not set, defining.`],
      })
    })
    it('sets user on context if context session does not have user', async () => {
      await testLogin({
        context: {
          session: {},
        },
        additionalTraceCalls: [`${logPrefix}: setting user on context session.`],
      })
    })
    it('sets user on context if context session already has user', async () => {
      await testLogin({
        context: {
          session: {
            user: TestUtil.getDbUser({}),
          },
        },
        additionalTraceCalls: [`${logPrefix}: setting user on context session.`],
      })
    })
    it('calls to trace if enabled', async () => {
      await testLogin({
        context: {
          session: {
            user: TestUtil.getDbUser({}),
          },
        },
        logPrefix,
        traceEnabled: true,
        additionalTraceCalls: [`${logPrefix}: setting user on context session.`],
      })
    })
  })
  describe('logout', () => {
    const user = TestUtil.getDbUser({})
    const logPrefix = `logout for user "${user._id}"`
    it('returns false if no context', () => {
      testLogout({
        context: undefined,
        expected: false,
      })
    })
    it('returns false if no session on context', () => {
      testLogout({
        context: {},
        expected: false,
      })
    })
    it('returns false if no user on session', () => {
      testLogout({
        context: {
          session: {},
        },
        expected: false,
      })
    })
    it('removes user from session and returns true if user on session', () => {
      testLogout({
        context: {
          session: {
            user,
          },
        },
        expected: true,
        debugCalls: [[`${logPrefix}: removing from session.`]],
      })
    })
    it('calls to trace if enabled', async () => {
      testLogout({
        context: {
          session: {
            user,
          },
        },
        expected: true,
        debugCalls: [[`${logPrefix}: removing from session.`]],
        logPrefix,
        traceEnabled: true,
      })
    })
  })
  describe('ready', () => {
    const userId = new ObjectId()
    const gameId = new ObjectId().toString()
    const logPrefix = `ready by "${userId}"`
    it('returns error if game does not exist', async () => {
      const error = `Game "${gameId}" does not exist.`
      await testReady({
        userId,
        gameId,
        expected: Error(error),
        gameGetCalls: [
          [
            {
              id: gameId,
            },
          ],
        ],
        errorCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('returns error if not a player on the game', async () => {
      const error = 'Not a player on game.'
      await testReady({
        userId,
        gameId,
        gameGetResponse: TestUtil.getDbGame({
          id: gameId,
        }),
        expected: Error(error),
        gameGetCalls: [
          [
            {
              id: gameId,
            },
          ],
        ],
        debugCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('returns error if deck not yet set', async () => {
      const error = 'Must set deck first.'
      await testReady({
        userId,
        gameId,
        gameGetResponse: TestUtil.getDbGame({
          id: gameId,
          creator: userId,
        }),
        expected: Error(error),
        gameGetCalls: [
          [
            {
              id: gameId,
            },
          ],
        ],
        debugCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('returns error if already marked as ready', async () => {
      const error = 'Already marked as ready.'
      await testReady({
        userId,
        gameId,
        gameGetResponse: TestUtil.getDbGame({
          id: gameId,
          players: [
            TestUtil.getDbGamePlayer({
              deck: TestUtil.getDbGameDeck({
                from: TestUtil.getDbDeck({}),
              }),
              ready: true,
              user: userId,
            }),
          ],
        }),
        expected: Error(error),
        gameGetCalls: [
          [
            {
              id: gameId,
            },
          ],
        ],
        debugCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('returns error if setReady response is undefined', async () => {
      const error = `Could not set player as ready for game "${gameId}" in probable race condition collision.`
      await testReady({
        userId,
        gameId,
        gameGetResponse: TestUtil.getDbGame({
          id: gameId,
          players: [
            TestUtil.getDbGamePlayer({
              deck: TestUtil.getDbGameDeck({
                from: TestUtil.getDbDeck({}),
              }),
              user: userId,
            }),
          ],
        }),
        setReadyResponse: undefined,
        expected: Error(error),
        gameGetCalls: [
          [
            {
              id: gameId,
            },
          ],
        ],
        setReadyCalls: [
          [
            {
              gameId,
              userId,
            },
          ],
        ],
        errorCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('returns resolved game if no errors', async () => {
      const game = TestUtil.getDbGame({
        id: gameId,
        players: [
          TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              from: TestUtil.getDbDeck({}),
            }),
            user: userId,
          }),
        ],
      })
      const updatedGame: GameDbObject = {
        ...game,
        players: [
          {
            ...game.players[0],
            ready: true,
          },
        ],
      }
      const resolvedGame = TestUtil.getGame({
        id: game._id,
        players: [
          {
            ready: true,
            rounds: [],
            user: TestUtil.getUser({
              id: userId,
            }),
          },
        ],
      })
      await testReady({
        userId,
        gameId,
        gameGetResponse: game,
        setReadyResponse: updatedGame,
        resolvedGame: resolvedGame,
        expected: resolvedGame,
        gameGetCalls: [
          [
            {
              id: gameId,
            },
          ],
        ],
        setReadyCalls: [
          [
            {
              gameId,
              userId,
            },
          ],
        ],
        gameResolveCalls: [
          [
            {
              game: updatedGame,
              neutralFactionStats: undefined,
              neutralLeaderStats: undefined,
            },
          ],
        ],
      })
    })
    it('logs to trace if enabled', async () => {
      const game = TestUtil.getDbGame({
        id: gameId,
        players: [
          TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              from: TestUtil.getDbDeck({}),
            }),
            user: userId,
          }),
        ],
      })
      const updatedGame: GameDbObject = {
        ...game,
        players: [
          {
            ...game.players[0],
            ready: true,
          },
        ],
      }
      const resolvedGame = TestUtil.getGame({
        id: game._id,
        players: [
          {
            ready: true,
            rounds: [],
            user: TestUtil.getUser({
              id: userId,
            }),
          },
        ],
      })
      await testReady({
        userId,
        gameId,
        gameGetResponse: game,
        setReadyResponse: updatedGame,
        resolvedGame: resolvedGame,
        expected: resolvedGame,
        gameGetCalls: [
          [
            {
              id: gameId,
            },
          ],
        ],
        setReadyCalls: [
          [
            {
              gameId,
              userId,
            },
          ],
        ],
        gameResolveCalls: [
          [
            {
              game: updatedGame,
              neutralFactionStats: undefined,
              neutralLeaderStats: undefined,
            },
          ],
        ],
        logPrefix,
        traceEnabled: true,
      })
    })
  })
  describe('redraw', () => {
    const userId = new ObjectId().toString()
    const gameId = new ObjectId().toString()
    const unit = TestUtil.getDbUnit({})
    const logPrefix = `redraw by "${userId}"`
    it('returns error if game does not exist', async () => {
      const error = `Game "${gameId}" does not exist.`
      await testRedraw({
        userId,
        gameId,
        unitId: unit._id.toString(),
        expected: Error(error),
        gameGetCalls: [
          [
            {
              id: gameId,
            },
          ],
        ],
        errorCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('returns error if not a player on game', async () => {
      const error = 'Not a player on game.'
      await testRedraw({
        userId,
        gameId,
        unitId: unit._id.toString(),
        gameGetResponse: TestUtil.getDbGame({}),
        expected: Error(error),
        gameGetCalls: [
          [
            {
              id: gameId,
            },
          ],
        ],
        debugCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('returns error if game marked as ready', async () => {
      const error = 'Cannot redraw after game is marked as ready.'
      await testRedraw({
        userId,
        gameId,
        unitId: unit._id.toString(),
        gameGetResponse: TestUtil.getDbGame({
          players: [
            TestUtil.getDbGamePlayer({
              ready: true,
              user: userId,
            }),
          ],
        }),
        expected: Error(error),
        gameGetCalls: [
          [
            {
              id: gameId,
            },
          ],
        ],
        debugCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('returns error if deck not set', async () => {
      const error = 'Cannot redraw before deck is set.'
      await testRedraw({
        userId,
        gameId,
        unitId: unit._id.toString(),
        gameGetResponse: TestUtil.getDbGame({
          players: [
            TestUtil.getDbGamePlayer({
              user: userId,
            }),
          ],
        }),
        expected: Error(error),
        gameGetCalls: [
          [
            {
              id: gameId,
            },
          ],
        ],
        debugCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('returns error if max redraws already taken', async () => {
      const error = `Cannot exceed maximum redraw limit of "${MAX_REDRAWS}".`
      await testRedraw({
        userId,
        gameId,
        unitId: unit._id.toString(),
        gameGetResponse: TestUtil.getDbGame({
          players: [
            TestUtil.getDbGamePlayer({
              deck: TestUtil.getDbGameDeck({
                from: TestUtil.getDbDeck({}),
                redraws: [
                  {
                    from: TestUtil.getDbDeckUnit({}),
                    to: TestUtil.getDbDeckUnit({}),
                  },
                  {
                    from: TestUtil.getDbDeckUnit({}),
                    to: TestUtil.getDbDeckUnit({}),
                  },
                ],
              }),
              user: new ObjectId(userId),
            }),
          ],
        }),
        expected: Error(error),
        gameGetCalls: [
          [
            {
              id: gameId,
            },
          ],
        ],
        debugCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('returns error if unit not in hand', async () => {
      const error = 'Invalid unit, does not exist in hand.'
      await testRedraw({
        userId,
        gameId,
        unitId: unit._id.toString(),
        gameGetResponse: TestUtil.getDbGame({
          players: [
            TestUtil.getDbGamePlayer({
              deck: TestUtil.getDbGameDeck({
                from: TestUtil.getDbDeck({}),
              }),
              user: userId,
            }),
          ],
        }),
        expected: Error(error),
        gameGetCalls: [
          [
            {
              id: gameId,
            },
          ],
        ],
        debugCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('returns error if updated game undefined', async () => {
      const error = `Could not update game "${gameId}" to redraw unit "${unit._id}" in probable race condition collision.`
      const unit2 = TestUtil.getDbUnit({})
      await testRedraw({
        userId,
        gameId,
        unitId: unit._id.toString(),
        gameGetResponse: TestUtil.getDbGame({
          players: [
            TestUtil.getDbGamePlayer({
              deck: TestUtil.getDbGameDeck({
                from: TestUtil.getDbDeck({}),
                hand: [
                  {
                    artStyle: 1,
                    unit: unit._id,
                  },
                ],
                undrawn: [
                  {
                    artStyle: 1,
                    unit: unit2._id,
                  },
                ],
              }),
              user: userId,
            }),
          ],
        }),
        gameRedrawResponse: undefined,
        expected: Error(error),
        gameGetCalls: [
          [
            {
              id: gameId,
            },
          ],
        ],
        getRandomSubsetCalled: true,
        gameRedrawCalls: [
          [
            {
              currentRedraws: [],
              gameId,
              newHand: [
                {
                  artStyle: 1,
                  unit: unit2._id,
                },
              ],
              newRedraws: [
                {
                  from: {
                    artStyle: 1,
                    unit: unit._id,
                  },
                  to: {
                    artStyle: 1,
                    unit: unit2._id,
                  },
                },
              ],
              newUndrawn: [
                {
                  artStyle: 1,
                  unit: unit._id,
                },
              ],
              userId,
            },
          ],
        ],
        errorCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('returns resolved DeckUnit if no errors', async () => {
      const unit2 = TestUtil.getDbUnit({})
      const previousRedraw: RedrawDbObject = {
        from: TestUtil.getDbDeckUnit({}),
        to: TestUtil.getDbDeckUnit({}),
      }
      const game = TestUtil.getDbGame({
        players: [
          TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              from: TestUtil.getDbDeck({}),
              hand: [
                {
                  artStyle: 1,
                  unit: unit._id,
                },
              ],
              redraws: [previousRedraw],
              undrawn: [
                {
                  artStyle: 1,
                  unit: unit2._id,
                },
              ],
            }),
            user: userId,
          }),
        ],
      })
      const newDeckUnit: DeckUnit = {
        artStyle: 1,
        unit: TestUtil.getUnit({
          id: unit2._id,
          created: unit2.created,
          factionId: unit2.faction,
        }),
      }

      await testRedraw({
        userId,
        gameId,
        unitId: unit._id.toString(),
        gameGetResponse: game,
        gameRedrawResponse: TestUtil.getDbGame({
          created: game.created,
          id: game._id,
          players: [
            TestUtil.getDbGamePlayer({
              deck: TestUtil.getDbGameDeck({
                from: TestUtil.getDbDeck({}),
                hand: [
                  {
                    artStyle: 1,
                    unit: unit2._id,
                  },
                ],
                redraws: [
                  previousRedraw,
                  {
                    from: {
                      artStyle: 1,
                      unit: unit._id,
                    },
                    to: {
                      artStyle: 1,
                      unit: unit2._id,
                    },
                  },
                ],
                undrawn: [
                  {
                    artStyle: 1,
                    unit: unit._id,
                  },
                ],
              }),
              user: userId,
            }),
          ],
        }),
        resolveDeckUnitResponse: newDeckUnit,
        expected: newDeckUnit,
        gameGetCalls: [
          [
            {
              id: gameId,
            },
          ],
        ],
        getRandomSubsetCalled: true,
        gameRedrawCalls: [
          [
            {
              currentRedraws: [previousRedraw],
              gameId,
              newHand: [
                {
                  artStyle: 1,
                  unit: unit2._id,
                },
              ],
              newRedraws: [
                previousRedraw,
                {
                  from: {
                    artStyle: 1,
                    unit: unit._id,
                  },
                  to: {
                    artStyle: 1,
                    unit: unit2._id,
                  },
                },
              ],
              newUndrawn: [
                {
                  artStyle: 1,
                  unit: unit._id,
                },
              ],
              userId,
            },
          ],
        ],
        resolveDeckUnitCalls: [
          [
            {
              deckUnit: {
                artStyle: 1,
                unit: unit2._id,
              },
              neutralStats: undefined,
            },
          ],
        ],
      })
    })
    it('calls to trace if enabled', async () => {
      const unit2 = TestUtil.getDbUnit({})
      const previousRedraw: RedrawDbObject = {
        from: TestUtil.getDbDeckUnit({}),
        to: TestUtil.getDbDeckUnit({}),
      }
      const game = TestUtil.getDbGame({
        players: [
          TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              from: TestUtil.getDbDeck({}),
              hand: [
                {
                  artStyle: 1,
                  unit: unit._id,
                },
              ],
              redraws: [previousRedraw],
              undrawn: [
                {
                  artStyle: 1,
                  unit: unit2._id,
                },
              ],
            }),
            user: userId,
          }),
        ],
      })
      const newDeckUnit: DeckUnit = {
        artStyle: 1,
        unit: TestUtil.getUnit({
          id: unit2._id,
          created: unit2.created,
          factionId: unit2.faction,
        }),
      }

      await testRedraw({
        userId,
        gameId,
        unitId: unit._id.toString(),
        gameGetResponse: game,
        gameRedrawResponse: TestUtil.getDbGame({
          created: game.created,
          id: game._id,
          players: [
            TestUtil.getDbGamePlayer({
              deck: TestUtil.getDbGameDeck({
                from: TestUtil.getDbDeck({}),
                hand: [
                  {
                    artStyle: 1,
                    unit: unit2._id,
                  },
                ],
                redraws: [
                  previousRedraw,
                  {
                    from: {
                      artStyle: 1,
                      unit: unit._id,
                    },
                    to: {
                      artStyle: 1,
                      unit: unit2._id,
                    },
                  },
                ],
                undrawn: [
                  {
                    artStyle: 1,
                    unit: unit._id,
                  },
                ],
              }),
              user: userId,
            }),
          ],
        }),
        resolveDeckUnitResponse: newDeckUnit,
        expected: newDeckUnit,
        gameGetCalls: [
          [
            {
              id: gameId,
            },
          ],
        ],
        getRandomSubsetCalled: true,
        gameRedrawCalls: [
          [
            {
              currentRedraws: [previousRedraw],
              gameId,
              newHand: [
                {
                  artStyle: 1,
                  unit: unit2._id,
                },
              ],
              newRedraws: [
                previousRedraw,
                {
                  from: {
                    artStyle: 1,
                    unit: unit._id,
                  },
                  to: {
                    artStyle: 1,
                    unit: unit2._id,
                  },
                },
              ],
              newUndrawn: [
                {
                  artStyle: 1,
                  unit: unit._id,
                },
              ],
              userId,
            },
          ],
        ],
        resolveDeckUnitCalls: [
          [
            {
              deckUnit: {
                artStyle: 1,
                unit: unit2._id,
              },
              neutralStats: undefined,
            },
          ],
        ],
        logPrefix,
        traceEnabled: true,
      })
    })
  })
  describe('setDeck', () => {
    const userId = new ObjectId()
    const game = TestUtil.getDbGame({
      creator: userId,
    })
    const deck = TestUtil.getDbDeck({})
    const logPrefix = `setDeck by "${userId}"`
    it('returns error if deck does not exist', async () => {
      const error = `Deck "${deck._id}" does not exist.`
      await testSetDeck({
        userId,
        gameId: game._id.toString(),
        deckId: deck._id.toString(),
        expected: Error(error),
        getDeckCalls: [
          [
            {
              id: deck._id.toString(),
            },
          ],
        ],
        errorCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('returns error if game does not exist', async () => {
      const error = `Game "${game._id}" does not exist.`
      await testSetDeck({
        userId,
        deckId: deck._id.toString(),
        gameId: game._id.toString(),
        getDeckResponse: deck,
        expected: Error(error),
        getDeckCalls: [
          [
            {
              id: deck._id.toString(),
            },
          ],
        ],
        getGameCalls: [
          [
            {
              id: game._id.toString(),
            },
          ],
        ],
        errorCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('returns error if not a player on game', async () => {
      const error = 'Not a player on game.'
      await testSetDeck({
        userId,
        deckId: deck._id.toString(),
        gameId: game._id.toString(),
        getDeckResponse: deck,
        getGameResponse: {
          ...game,
          players: [],
        },
        expected: Error(error),
        getDeckCalls: [
          [
            {
              id: deck._id.toString(),
            },
          ],
        ],
        getGameCalls: [
          [
            {
              id: game._id.toString(),
            },
          ],
        ],
        debugCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('returns error if deck is already set', async () => {
      const error = 'Deck already set.'
      await testSetDeck({
        userId,
        deckId: deck._id.toString(),
        gameId: game._id.toString(),
        getDeckResponse: deck,
        getGameResponse: {
          ...game,
          players: [
            TestUtil.getDbGamePlayer({
              deck: TestUtil.getDbGameDeck({
                from: TestUtil.getDbDeck({}),
              }),
              user: userId,
            }),
          ],
        },
        expected: Error(error),
        getDeckCalls: [
          [
            {
              id: deck._id.toString(),
            },
          ],
        ],
        getGameCalls: [
          [
            {
              id: game._id.toString(),
            },
          ],
        ],
        debugCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('returns error if updated game is undefined', async () => {
      const error = `Could not update game "${game._id}" in probable race condition collision.`
      await testSetDeck({
        userId,
        deckId: deck._id.toString(),
        gameId: game._id.toString(),
        getDeckResponse: deck,
        getGameResponse: game,
        setDeckResponse: undefined,
        randomSubset: deck.units.slice(0, STARTING_HAND_SIZE),
        expected: Error(error),
        getDeckCalls: [
          [
            {
              id: deck._id.toString(),
            },
          ],
        ],
        getGameCalls: [
          [
            {
              id: game._id.toString(),
            },
          ],
        ],
        getRandomSubsetCalls: [
          [
            {
              items: deck.units,
              subsetSize: STARTING_HAND_SIZE,
            },
          ],
        ],
        setDeckCalls: [
          [
            {
              deck,
              gameId: game._id.toString(),
              hand: deck.units.slice(0, STARTING_HAND_SIZE),
              undrawn: deck.units.slice(STARTING_HAND_SIZE + 1, deck.units.length),
              userId,
            },
          ],
        ],
        errorCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('returns error if player not on updated game', async () => {
      const error = `Could not get player after setting deck "${deck._id}" on game "${game._id}".`
      await testSetDeck({
        userId,
        deckId: deck._id.toString(),
        gameId: game._id.toString(),
        getDeckResponse: deck,
        getGameResponse: game,
        setDeckResponse: TestUtil.getDbGame({}),
        randomSubset: deck.units.slice(0, STARTING_HAND_SIZE),
        expected: Error(error),
        getDeckCalls: [
          [
            {
              id: deck._id.toString(),
            },
          ],
        ],
        getGameCalls: [
          [
            {
              id: game._id.toString(),
            },
          ],
        ],
        getRandomSubsetCalls: [
          [
            {
              items: deck.units,
              subsetSize: STARTING_HAND_SIZE,
            },
          ],
        ],
        setDeckCalls: [
          [
            {
              deck,
              gameId: game._id.toString(),
              hand: deck.units.slice(0, STARTING_HAND_SIZE),
              undrawn: deck.units.slice(STARTING_HAND_SIZE + 1, deck.units.length),
              userId,
            },
          ],
        ],
        errorCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('returns resolved deck if no errors', async () => {
      await testSetDeck({
        userId,
        deckId: deck._id.toString(),
        gameId: game._id.toString(),
        getDeckResponse: deck,
        getGameResponse: game,
        setDeckResponse: game,
        randomSubset: deck.units.slice(0, STARTING_HAND_SIZE),
        expected: {
          discard: [],
          hand: [],
          name: deck.name,
          redraws: [],
          undrawn: [],
          from: TestUtil.getDeckFromDbDeck({
            deck,
          }),
        },
        getDeckCalls: [
          [
            {
              id: deck._id.toString(),
            },
          ],
        ],
        getGameCalls: [
          [
            {
              id: game._id.toString(),
            },
          ],
        ],
        getRandomSubsetCalls: [
          [
            {
              items: deck.units,
              subsetSize: STARTING_HAND_SIZE,
            },
          ],
        ],
        setDeckCalls: [
          [
            {
              deck,
              gameId: game._id.toString(),
              hand: deck.units.slice(0, STARTING_HAND_SIZE),
              undrawn: deck.units.slice(STARTING_HAND_SIZE + 1, deck.units.length),
              userId,
            },
          ],
        ],
      })
    })
    it('calls to trace if enabled', async () => {
      await testSetDeck({
        userId,
        deckId: deck._id.toString(),
        gameId: game._id.toString(),
        getDeckResponse: deck,
        getGameResponse: game,
        setDeckResponse: game,
        randomSubset: deck.units.slice(0, STARTING_HAND_SIZE),
        expected: {
          discard: [],
          hand: [],
          name: deck.name,
          redraws: [],
          undrawn: [],
          from: TestUtil.getDeckFromDbDeck({
            deck,
          }),
        },
        getDeckCalls: [
          [
            {
              id: deck._id.toString(),
            },
          ],
        ],
        getGameCalls: [
          [
            {
              id: game._id.toString(),
            },
          ],
        ],
        getRandomSubsetCalls: [
          [
            {
              items: deck.units,
              subsetSize: STARTING_HAND_SIZE,
            },
          ],
        ],
        setDeckCalls: [
          [
            {
              deck,
              gameId: game._id.toString(),
              hand: deck.units.slice(0, STARTING_HAND_SIZE),
              undrawn: deck.units.slice(STARTING_HAND_SIZE + 1, deck.units.length),
              userId,
            },
          ],
        ],
        logPrefix,
        traceEnabled: true,
      })
    })
  })
})

async function testAddDeck({
  inputArtStyle = 1,
  expectedArtStyle = 1,
  factionKey = FactionKey.Monsters,
  leaderId = new ObjectId(),
  unitIds,
  name = 'deck-name',
  userId,
  factionGetResponse,
  leaderGetResponse,
  unitGetResponse,
  validateDeckResponse = [],
  deckAddResponse,
  deckAddError,
  errorReturned,
  errorThrown,
  traceEnabled,
  factionGetCalls,
  leaderGetCalls,
  unitGetCalls,
  deckUnitCalls,
  validateDeckCalls,
  deckAddCalls,
  getDeckStatsCalls,
  postResolversCalled = true,
  logPrefix,
  debugCalls = [],
  errorCalls = [],
}: {
  inputArtStyle?: number | undefined | null
  expectedArtStyle?: number
  factionKey?: FactionKey
  leaderId?: ObjectId
  unitIds?: ObjectId[]
  name?: string
  userId?: ObjectId
  factionGetResponse?: FactionDbObject[]
  leaderGetResponse?: LeaderDbObject[]
  unitGetResponse?: UnitDbObject[]
  validateDeckResponse?: string[]
  deckAddResponse?: Deck
  deckAddError?: string
  errorReturned?: string
  errorThrown?: string
  traceEnabled?: boolean
  factionGetCalls?: any[][]
  leaderGetCalls?: any[][]
  unitGetCalls?: any[][]
  deckUnitCalls?: any[][]
  validateDeckCalls?: any[][]
  deckAddCalls?: any[][]
  getDeckStatsCalls?: any[][]
  postResolversCalled?: boolean
  logPrefix?: string
  debugCalls?: any[][]
  errorCalls?: any[][]
}) {
  if (!unitIds) {
    unitIds = [new ObjectId()]
  }
  const args = {
    faction: factionKey.toString(),
    leader: leaderId.toString(),
    units: unitIds.map((unitId) => {
      return {
        artStyle: inputArtStyle,
        id: unitId.toString(),
      }
    }),
    name,
  }
  const context = {
    session: {
      user: {
        _id: userId,
      },
    },
  }
  const resolvedUser = TestUtil.getUser({
    id: userId,
  })
  const faction = TestUtil.getDbFaction({
    key: factionKey,
  })
  const resolvedFaction = TestUtil.getFactionFromDbFaction(faction)
  const leader = TestUtil.getDbLeader({
    faction: faction._id,
    id: args.leader,
  })
  const resolvedLeader = TestUtil.getLeaderFromDbLeader(leader)
  const unit = TestUtil.getDbUnit({
    id: unitIds[0],
    faction: faction._id,
  })
  const deckUnits: DeckUnit[] = [
    {
      artStyle: expectedArtStyle,
      unit: {
        ...unit,
        id: unitIds.toString(),
        combats: undefined,
        dlc: undefined,
        effects: [],
        scorchScope: undefined,
        faction: resolvedFaction,
      },
    },
  ]
  const deckStats = TestUtil.getStats()
  const deck = TestUtil.getDbDeck({
    faction: faction._id,
    leader: args.leader,
    name: args.name,
    units: unitIds.map((unitId) =>
      TestUtil.getDbDeckUnit({
        artStyle: expectedArtStyle,
        id: unitId,
      })
    ),
    user: userId,
  })
  const resolvedDeck = TestUtil.getDeckFromDbDeck({
    deck,
    user: resolvedUser,
  })
  const factionGetSpy = jest.spyOn(FactionStore, 'get').mockResolvedValue(factionGetResponse || [faction])
  const leaderGetSpy = jest.spyOn(LeaderStore, 'get').mockResolvedValue(leaderGetResponse || [leader])
  const unitGetSpy = jest.spyOn(UnitStore, 'get').mockResolvedValue(unitGetResponse || [unit])
  const deckUnitResolverSpy = jest.spyOn(DeckUnitResolver, 'fromArray').mockResolvedValue(deckUnits)
  const validateDeckSpy = jest.spyOn(validateDeck, 'validateDeck').mockReturnValue(validateDeckResponse)
  const addDeckSpy = jest.spyOn(DeckStore, 'add')
  if (deckAddError) {
    addDeckSpy.mockRejectedValue(Error(deckAddError))
  } else {
    addDeckSpy.mockResolvedValue((deckAddResponse as any) || deck)
  }
  const getDeckStatsSpy = jest.spyOn(gwentUtils, 'getDeckStats').mockReturnValue(deckStats)
  const factionResolverSpy = jest.spyOn(FactionResolver, 'fromObject').mockResolvedValue(resolvedFaction)
  const leaderResolverSpy = jest.spyOn(LeaderResolver, 'fromObject').mockResolvedValue(resolvedLeader)
  const deckResolverSpy = jest.spyOn(DeckResolver, 'fromObject').mockResolvedValue(resolvedDeck)
  const traceSpy = jest.fn().mockImplementation()
  const debugSpy = jest.fn().mockImplementation()
  const errorSpy = jest.fn().mockImplementation()
  MutationResolver['logger'] = {
    debug: debugSpy,
    error: errorSpy,
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  const promise = (MutationResolver.getResolvers().addDeck as any)(null, args, context, null)
  if (errorThrown) {
    await expect(promise).rejects.toEqual(Error(errorThrown))
  } else {
    await expect(promise).resolves.toEqual(errorReturned ? Error(errorReturned) : resolvedDeck)
  }

  expect(factionGetSpy.mock.calls).toEqual(factionGetCalls || [[{}]])
  expect(leaderGetSpy.mock.calls).toEqual(
    leaderGetCalls || [
      [
        {
          ids: [args.leader],
        },
      ],
    ]
  )
  expect(unitGetSpy.mock.calls).toEqual(
    unitGetCalls || [
      [
        {
          ids: unitIds.map((unitId) => unitId.toString()),
        },
      ],
    ]
  )
  expect(deckUnitResolverSpy.mock.calls).toEqual(
    deckUnitCalls || [
      [
        {
          deckUnits: [
            {
              artStyle: expectedArtStyle,
              unit: unit._id,
            },
          ],
          neutralStats: undefined,
        },
      ],
    ]
  )
  expect(validateDeckSpy.mock.calls).toEqual(
    validateDeckCalls || [
      [
        {
          deckUnits: deckUnits,
          faction: args.faction,
        },
      ],
    ]
  )
  expect(addDeckSpy.mock.calls).toEqual(
    deckAddCalls || [
      [
        {
          factionId: faction._id,
          leaderId: args.leader,
          name: args.name,
          stats: deckStats,
          units: [
            {
              artStyle: expectedArtStyle,
              unit: unitIds.toString(),
            },
          ],
          userId,
        },
      ],
    ]
  )
  expect(getDeckStatsSpy.mock.calls).toEqual(getDeckStatsCalls || [[deckUnits]])
  expect(factionResolverSpy.mock.calls).toEqual(
    postResolversCalled
      ? [
          [
            {
              faction,
              neutralStats: undefined,
            },
          ],
        ]
      : []
  )
  expect(leaderResolverSpy.mock.calls).toEqual(
    postResolversCalled
      ? [
          [
            {
              leader,
              faction: resolvedFaction,
              neutralStats: undefined,
            },
          ],
        ]
      : []
  )
  expect(deckResolverSpy.mock.calls).toEqual(
    postResolversCalled
      ? [
          [
            {
              deck,
              faction: resolvedFaction,
              leader: resolvedLeader,
              units: deckUnits,
              neutralDeckStats: undefined,
            },
          ],
        ]
      : []
  )
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [
            `${logPrefix} args: "${JSON.stringify({
              faction: factionKey.toString(),
              leader: leaderId.toString(),
              units: unitIds.map((unitId) => {
                return {
                  artStyle: 1,
                  id: unitId.toString(),
                }
              }),
              name,
            })}"`,
          ],
          [`${logPrefix} requested fields: "[]"`],
          [`${logPrefix} factions: "${JSON.stringify([faction])}"`],
          [`${logPrefix} leaders: "${JSON.stringify([leader])}"`],
          [`${logPrefix} units: "${JSON.stringify([unit])}"`],
          [`${logPrefix} deckUnits: "${JSON.stringify(deckUnits)}"`],
          [`${logPrefix} deck: "${JSON.stringify(deck)}"`],
          [`${logPrefix} resolvedFaction: "${JSON.stringify(resolvedFaction)}"`],
        ]
      : []
  )
  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(errorSpy.mock.calls).toEqual(errorCalls)
}

async function testAddGame({
  creatorId = new ObjectId(),
  opponentNames,
  getUserByNamesResponse = [],
  expected,
  addCalls = [],
  fromObjectCalled,
  getByNamesCalls = [],
  logPrefix,
  traceEnabled,
  debugCalls = [],
}: {
  creatorId?: ObjectId
  opponentNames: string[]
  getUserByNamesResponse?: UserDbObject[]
  expected?: Game | Error
  addCalls?: any[][]
  fromObjectCalled?: boolean
  getByNamesCalls?: any[][]
  logPrefix?: string
  traceEnabled?: boolean
  debugCalls?: any[][]
}) {
  const user = TestUtil.getUser({
    id: creatorId,
  })
  const context = {
    session: {
      user: {
        _id: creatorId,
        name: user.name,
      },
    },
  }
  const args = {
    opponentNames,
  }
  const game = TestUtil.getDbGame({
    creator: creatorId,
  })
  const resolvedGame = TestUtil.getGameFromDbGame({
    game,
    creator: user,
  })
  const getByNamesSpy = jest.spyOn(UserStore, 'getByNames').mockResolvedValue(getUserByNamesResponse)
  const addSpy = jest.spyOn(GameStore, 'add').mockResolvedValue(game)
  const fromObjectSpy = jest.spyOn(GameResolver, 'fromObject').mockResolvedValue(resolvedGame)
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  MutationResolver['logger'] = {
    debug: debugSpy,
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  await expect((MutationResolver.getResolvers().addGame as any)(null, args, context, null)).resolves.toEqual(
    expected || resolvedGame
  )

  expect(getByNamesSpy.mock.calls).toEqual(getByNamesCalls)
  expect(addSpy.mock.calls).toEqual(addCalls)
  expect(fromObjectSpy.mock.calls).toEqual(
    fromObjectCalled
      ? [
          [
            {
              game: game,
              users: getUserByNamesResponse.map((dbUser) => TestUtil.getUserFromDbUser(dbUser)),
              neutralFactionStats: undefined,
              neutralLeaderStats: undefined,
            },
          ],
        ]
      : []
  )
  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [
            `${logPrefix} args: "${JSON.stringify({
              opponentNames,
            })}"`,
          ],
          [`${logPrefix} requested fields: "[]"`],
          [`${logPrefix} creator: "${user.name}"`],
          [`${logPrefix} opponentNames: "${JSON.stringify(opponentNames)}"`],
          [`${logPrefix} opponents: "${JSON.stringify(getUserByNamesResponse)}"`],
          [
            `${logPrefix} resolvedOpponents: "${JSON.stringify(
              getUserByNamesResponse.map((opponent) => TestUtil.getUserFromDbUser(opponent))
            )}"`,
          ],
          [`${logPrefix} game: "${JSON.stringify(game)}"`],
        ]
      : []
  )
}

async function testAddUser({
  name = 'james.bond@mi6.com',
  userAddResponse,
  error,
  expected,
  logPrefix,
  traceEnabled,
  debugCalls = [],
  errorCalls = [],
}: {
  name?: string
  userAddResponse: UserDbObject | Error
  error?: Error
  expected?: User | Error
  logPrefix?: string
  traceEnabled?: boolean
  debugCalls?: any[][]
  errorCalls?: any[][]
}) {
  const args = {
    name,
    password: 'secret',
  }
  const addSpy = jest.spyOn(UserStore, 'add')
  if (userAddResponse instanceof Error) {
    addSpy.mockRejectedValue(userAddResponse)
  } else {
    addSpy.mockResolvedValue(userAddResponse)
  }
  const traceSpy = jest.fn().mockImplementation()
  const debugSpy = jest.fn().mockImplementation()
  const errorSpy = jest.fn().mockImplementation()
  MutationResolver['logger'] = {
    trace: traceSpy,
    debug: debugSpy,
    error: errorSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  if (error) {
    await expect((MutationResolver.getResolvers().addUser as any)(null, args, null, null)).rejects.toThrow(error)
  } else {
    await expect((MutationResolver.getResolvers().addUser as any)(null, args, null, null)).resolves.toEqual(expected)
  }

  expect(addSpy.mock.calls).toEqual([[args.name, args.password]])
  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [[`${logPrefix} requested fields: "[]"`], [`${logPrefix} user: "${JSON.stringify(userAddResponse)}"`]]
      : []
  )
}

async function testLogin({
  name = 'james.bond@mi6.com',
  context,
  userValidateResponse = TestUtil.getDbUser({}),
  error,
  expected,
  logPrefix,
  traceEnabled,
  debugCalls = [],
  errorCalls = [],
  additionalTraceCalls = [],
}: {
  name?: string
  context?: any
  userValidateResponse?: UserDbObject | Error
  error?: Error
  expected?: User | Error
  logPrefix?: string
  traceEnabled?: boolean
  debugCalls?: any[][]
  errorCalls?: any[][]
  additionalTraceCalls?: any[]
}) {
  const args = {
    name,
    password: 'secret',
  }
  const validateSpy = jest.spyOn(UserStore, 'validate')
  if (userValidateResponse instanceof Error) {
    validateSpy.mockRejectedValue(userValidateResponse)
  } else {
    validateSpy.mockResolvedValue(userValidateResponse as UserDbObject)
    if (!expected) {
      expected = TestUtil.getUserFromDbUser(userValidateResponse as UserDbObject)
    }
  }
  const traceSpy = jest.fn().mockImplementation()
  const debugSpy = jest.fn().mockImplementation()
  const errorSpy = jest.fn().mockImplementation()
  MutationResolver['logger'] = {
    trace: traceSpy,
    debug: debugSpy,
    error: errorSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  const promise = (MutationResolver.getResolvers().login as any)(null, args, context, null)
  if (error) {
    await expect(promise).rejects.toThrow(error)
  } else {
    await expect(promise).resolves.toEqual(expected)
  }

  expect(validateSpy.mock.calls).toEqual([[args.name, args.password]])
  expect(context).toEqual(
    userValidateResponse instanceof Error || !context
      ? undefined
      : {
          session: {
            user: userValidateResponse,
          },
        }
  )
  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(errorSpy.mock.calls).toEqual(errorCalls)
  const traceCalls: string[][] = []
  if (traceEnabled) {
    traceCalls.push(
      [`${logPrefix} requested fields: "[]"`],
      [`${logPrefix} user: "${JSON.stringify(userValidateResponse)}"`]
    )
  }
  if (additionalTraceCalls.length > 0) {
    for (const additionalTraceCall of additionalTraceCalls) {
      traceCalls.push([additionalTraceCall])
    }
  }
  expect(traceSpy.mock.calls).toEqual(traceCalls)
}

function testLogout({
  context,
  expected,
  logPrefix,
  traceEnabled,
  debugCalls = [],
}: {
  context?: any
  expected: boolean
  logPrefix?: string
  traceEnabled?: boolean
  debugCalls?: any[][]
}) {
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  MutationResolver['logger'] = {
    debug: debugSpy,
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  expect((MutationResolver.getResolvers().logout as any)(null, null, context, null)).toEqual(expected)

  expect(context?.session?.user).toEqual(undefined)
  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(traceSpy.mock.calls).toEqual(traceEnabled ? [[`${logPrefix} requested fields: "[]"`]] : [])
}

async function testReady({
  userId = new ObjectId(),
  gameId = new ObjectId().toString(),
  gameGetResponse,
  setReadyResponse,
  resolvedGame,
  expected,
  gameGetCalls = [],
  gameResolveCalls = [],
  setReadyCalls = [],
  logPrefix,
  traceEnabled,
  debugCalls = [],
  errorCalls = [],
}: {
  userId?: ObjectId
  gameId?: string
  gameGetResponse?: GameDbObject
  setReadyResponse?: GameDbObject
  resolvedGame?: Game
  expected?: Error | Game
  gameGetCalls?: any[][]
  setReadyCalls?: any[][]
  gameResolveCalls?: any[][]
  logPrefix?: string
  traceEnabled?: boolean
  debugCalls?: any[][]
  errorCalls?: any[][]
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
  const gameGetSpy = jest.spyOn(GameStore, 'getById').mockResolvedValue(gameGetResponse)
  const setReadySpy = jest.spyOn(GameStore, 'setReady').mockResolvedValue(setReadyResponse)
  const gameResolveSpy = jest.spyOn(GameResolver, 'fromObject')
  if (resolvedGame) {
    gameResolveSpy.mockResolvedValue(resolvedGame)
  }
  const debugSpy = jest.fn().mockImplementation()
  const errorSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  MutationResolver['logger'] = {
    debug: debugSpy,
    error: errorSpy,
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  await expect((MutationResolver.getResolvers().ready as any)(null, args, context, null)).resolves.toEqual(expected)

  expect(gameGetSpy.mock.calls).toEqual(gameGetCalls)
  expect(setReadySpy.mock.calls).toEqual(setReadyCalls)
  expect(gameResolveSpy.mock.calls).toEqual(gameResolveCalls)
  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [
            `${logPrefix} args: "${JSON.stringify({
              game: gameId,
            })}"`,
          ],
          [`${logPrefix} requested fields: "[]"`],
          [`${logPrefix} game: "${JSON.stringify(gameGetResponse)}"`],
          [
            `${logPrefix} player: "${JSON.stringify(
              gameGetResponse?.players.find((player) => player.user.toString() === userId.toString())
            )}"`,
          ],
          [`${logPrefix} updatedGame: "${JSON.stringify(setReadyResponse)}"`],
        ]
      : []
  )
}

async function testRedraw({
  userId,
  gameId,
  unitId,
  gameGetResponse,
  gameRedrawResponse,
  resolveDeckUnitResponse,
  expected,
  gameGetCalls = [],
  gameRedrawCalls = [],
  resolveDeckUnitCalls = [],
  getRandomSubsetCalled,
  logPrefix,
  traceEnabled,
  debugCalls = [],
  errorCalls = [],
}: {
  userId?: string
  gameId?: string
  unitId?: string
  gameGetResponse?: GameDbObject
  gameRedrawResponse?: GameDbObject
  resolveDeckUnitResponse?: DeckUnit
  expected?: Error | DeckUnit
  gameGetCalls?: any[][]
  gameRedrawCalls?: any[][]
  resolveDeckUnitCalls?: any[][]
  getRandomSubsetCalled?: boolean
  logPrefix?: string
  traceEnabled?: boolean
  debugCalls?: any[][]
  errorCalls?: any[][]
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
    unit: unitId,
  }
  const player = gameGetResponse?.players.find(
    (player) => player.user.toString() === userId?.toString()
  ) as GamePlayerDbObject
  let newCard: DeckUnitDbObject | undefined = undefined
  let cardToRedraw: DeckUnitDbObject | undefined = undefined
  let redrawPool: DeckUnitDbObject[] = []
  let redrawnIds: string[] = []
  if (player) {
    redrawnIds = player.deck.redraws.map((redraw) => redraw.from.unit.toString())
    redrawPool = player.deck.undrawn.filter((deckUnit) => !redrawnIds.includes(deckUnit.unit.toString()))
    cardToRedraw = player.deck.hand.find((deckUnit) => deckUnit.unit.toString() === unitId)
    newCard = redrawPool[redrawPool.length - 1]
  }
  const gameGetSpy = jest.spyOn(GameStore, 'getById').mockResolvedValue(gameGetResponse)
  const getRandomSubsetSpy = jest.spyOn(getRandomSubset, 'getRandomSubset').mockReturnValue([newCard])
  const gameRedrawSpy = jest.spyOn(GameStore, 'redraw').mockResolvedValue(gameRedrawResponse)
  const resolveDeckUnitSpy = jest.spyOn(DeckUnitResolver, 'fromObject')
  if (resolveDeckUnitResponse) {
    resolveDeckUnitSpy.mockResolvedValue(resolveDeckUnitResponse)
  }
  const debugSpy = jest.fn().mockImplementation()
  const errorSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  MutationResolver['logger'] = {
    debug: debugSpy,
    error: errorSpy,
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  await expect((MutationResolver.getResolvers().redraw as any)(null, args, context, null)).resolves.toEqual(expected)

  expect(gameGetSpy.mock.calls).toEqual(gameGetCalls)
  expect(getRandomSubsetSpy.mock.calls).toEqual(
    getRandomSubsetCalled
      ? [
          [
            {
              items: redrawPool,
              subsetSize: 1,
            },
          ],
        ]
      : []
  )
  expect(gameRedrawSpy.mock.calls).toEqual(gameRedrawCalls)
  expect(resolveDeckUnitSpy.mock.calls).toEqual(resolveDeckUnitCalls)
  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [
            `${logPrefix} args: "${JSON.stringify({
              game: gameId,
              unit: unitId,
            })}"`,
          ],
          [`${logPrefix} requested fields: "[]"`],
          [`${logPrefix} game: "${JSON.stringify(gameGetResponse)}"`],
          [`${logPrefix} player: "${JSON.stringify(player)}"`],
          [
            `${logPrefix} cardToRedraw: "${JSON.stringify(
              player.deck.hand.find((deckUnit) => deckUnit.unit.toString() === unitId)
            )}"`,
          ],
          [
            `${logPrefix} redrawPool: "${JSON.stringify(
              player.deck.undrawn.filter((deckUnit) => !redrawnIds.includes(deckUnit.unit.toString()))
            )}"`,
          ],
          [
            `${logPrefix} newCard: "${JSON.stringify(
              player.deck.undrawn.filter((deckUnit) => !redrawnIds.includes(deckUnit.unit.toString()))[0]
            )}"`,
          ],
          [
            `${logPrefix} newHand: "${JSON.stringify([
              ...player.deck.hand.filter((deckUnit) => deckUnit.unit.toString() !== unitId),
              newCard,
            ])}"`,
          ],
          [
            `${logPrefix} newRedraws: "${JSON.stringify([
              ...player.deck.redraws,
              {
                from: cardToRedraw,
                to: newCard,
              },
            ])}"`,
          ],
          [
            `${logPrefix} newUndrawn: "${JSON.stringify([
              ...player.deck.undrawn.filter(
                (deckUnit) => deckUnit.unit.toString() !== (newCard as DeckUnitDbObject).unit.toString()
              ),
              cardToRedraw,
            ])}"`,
          ],
          [`${logPrefix} updatedGame: "${JSON.stringify(gameRedrawResponse)}"`],
        ]
      : []
  )
}

async function testSetDeck({
  userId,
  gameId,
  deckId,
  getDeckResponse,
  getGameResponse,
  randomSubset = [],
  setDeckResponse,
  expected,
  getDeckCalls = [],
  getGameCalls = [],
  getRandomSubsetCalls = [],
  setDeckCalls = [],
  logPrefix,
  traceEnabled,
  debugCalls = [],
  errorCalls = [],
}: {
  userId?: ObjectId
  gameId?: string
  deckId?: string
  getDeckResponse?: DeckDbObject
  getGameResponse?: GameDbObject
  randomSubset?: DeckUnitDbObject[]
  setDeckResponse?: GameDbObject
  expected: Error | GameDeck
  getDeckCalls?: any[][]
  getGameCalls?: any[][]
  getRandomSubsetCalls?: any[][]
  setDeckCalls?: any[][]
  logPrefix?: string
  traceEnabled?: boolean
  debugCalls?: any[][]
  errorCalls?: any[][]
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
    deck: deckId,
  }
  const player = getGameResponse?.players.find(
    (player) => player.user.toString() === userId?.toString()
  ) as GamePlayerDbObject
  let handIds: string[] = []
  if (player) {
    handIds = randomSubset.map((deckUnit) => deckUnit.unit.toString())
  }
  const getDeckSpy = jest.spyOn(DeckStore, 'getById').mockResolvedValue(getDeckResponse)
  const getGameSpy = jest.spyOn(GameStore, 'getById').mockResolvedValue(getGameResponse)
  const getRandomSubsetSpy = jest.spyOn(getRandomSubset, 'getRandomSubset').mockReturnValue(randomSubset)
  const setDeckSpy = jest.spyOn(GameStore, 'setDeck').mockResolvedValue(setDeckResponse as any as GameDbObject)
  const fromObjectSpy = jest.spyOn(GameDeckResolver, 'fromObject')
  if (!(expected instanceof Error)) {
    fromObjectSpy.mockResolvedValue(expected)
  }
  const debugSpy = jest.fn().mockImplementation()
  const errorSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  MutationResolver['logger'] = {
    debug: debugSpy,
    error: errorSpy,
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  await expect((MutationResolver.getResolvers().setDeck as any)(null, args, context, null)).resolves.toEqual(expected)

  expect(getDeckSpy.mock.calls).toEqual(getDeckCalls)
  expect(getGameSpy.mock.calls).toEqual(getGameCalls)
  expect(getRandomSubsetSpy.mock.calls).toEqual(getRandomSubsetCalls)
  expect(setDeckSpy.mock.calls).toEqual(setDeckCalls)
  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [
            `${logPrefix} args: "${JSON.stringify({
              game: gameId,
              deck: deckId,
            })}"`,
          ],
          [`${logPrefix} requested fields: "[]"`],
          [`${logPrefix} deck: "${JSON.stringify(getDeckResponse)}"`],
          [`${logPrefix} game: "${JSON.stringify(getGameResponse)}"`],
          [
            `${logPrefix} player: "${JSON.stringify(
              (getGameResponse as GameDbObject).players.find((player) => player.user.toString() === userId?.toString())
            )}"`,
          ],
          [`${logPrefix} hand: "${JSON.stringify(randomSubset)}"`],
          [
            `${logPrefix} undrawn: "${JSON.stringify(
              (getDeckResponse as DeckDbObject).units.filter((deckUnit) => !handIds.includes(deckUnit.unit.toString()))
            )}"`,
          ],
          [`${logPrefix} updatedGame: "${JSON.stringify(setDeckResponse)}"`],
          [
            `${logPrefix} updatedPlayer: "${JSON.stringify(
              setDeckResponse?.players.find((player) => player.user.toString() === userId?.toString())
            )}"`,
          ],
        ]
      : []
  )
}
