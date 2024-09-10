import { ObjectId } from 'mongodb'

import {
  DeckDbObject,
  DeckUnitDbObject,
  FactionDbObject,
  GameDbObject,
  LeaderDbObject,
  RedrawDbObject,
  UnitDbObject,
  UserDbObject,
} from '@gwent/graphql-schema/database-typings'
import DeckStore from '../../src/database/stores/deck-store'
import { Deck, DeckUnit, FactionKey, Game, GameDeck, User } from '@gwent/graphql-schema/resolver-typings'
import FactionStore from '../../src/database/stores/faction-store'
import * as gwentUtils from '@gwent/utils'
import LeaderStore from '../../src/database/stores/leader-store'
import MutationResolver from '../../src/graphql/resolvers/mutation-resolver'
import UnitStore from '../../src/database/stores/unit-store'
import UserStore from '../../src/database/stores/user-store'
import * as validateDeck from '@gwent/validators'
import DeckUnitResolver from '../../src/graphql/resolvers/deck-unit-resolver'
import FactionResolver from '../../src/graphql/resolvers/faction-resolver'
import LeaderResolver from '../../src/graphql/resolvers/leader-resolver'
import DeckResolver from '../../src/graphql/resolvers/deck-resolver'
import GameStore from '../../src/database/stores/game-store'
import { MAX_REDRAWS, PLAYER_COUNTS, STARTING_HAND_SIZE } from '@gwent/constants'
import GameResolver from '../../src/graphql/resolvers/game-resolver'
import TestUtil from '../test-util'
import * as getRandomSubset from '@gwent/utils'
import GameDeckResolver from '../../src/graphql/resolvers/game-deck-resolver'

describe('mutation-resolver', () => {
  describe('addDeck', () => {
    const userId = new ObjectId()
    const logPrefix = `addDeck by user "${userId}"`
    it('returns error if faction is neutral', async () => {
      await testAddDeck({
        userId,
        factionKey: FactionKey.Neutral,
        errorReturned: `Cannot create Deck with "${FactionKey.Neutral}" faction.`,
        factionGetCalls: [],
        leaderGetCalls: [],
        unitGetCalls: [],
        deckUnitCalls: [],
        validateDeckCalls: [],
        deckAddCalls: [],
        getDeckStatsCalls: [],
        postResolversCalled: false,
        debugCalls: [[`${logPrefix} failed: "${FactionKey.Neutral}" faction invalid.`]],
      })
    })
    it('returns error if faction with key does not exist', async () => {
      await testAddDeck({
        userId,
        factionGetResponse: [],
        errorReturned: `Faction with key "${FactionKey.Monsters}" not found.`,
        leaderGetCalls: [],
        unitGetCalls: [],
        deckUnitCalls: [],
        validateDeckCalls: [],
        deckAddCalls: [],
        getDeckStatsCalls: [],
        postResolversCalled: false,
        debugCalls: [[`${logPrefix} failed: Faction with key "${FactionKey.Monsters}" not found.`]],
      })
    })
    it('returns error if leader does not exist', async () => {
      const leaderId = new ObjectId()
      await testAddDeck({
        userId,
        leaderId,
        leaderGetResponse: [],
        errorReturned: `Leader with ID "${leaderId}" does not exist.`,
        unitGetCalls: [],
        deckUnitCalls: [],
        validateDeckCalls: [],
        deckAddCalls: [],
        getDeckStatsCalls: [],
        postResolversCalled: false,
        debugCalls: [[`${logPrefix} failed: Leader with ID "${leaderId}" does not exist.`]],
      })
    })
    it('returns error if leader is of wrong faction', async () => {
      const factionId = new ObjectId()
      const leaderId = new ObjectId()
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
        errorReturned: `Leader "${leaderId}" faction "${FactionKey.NorthernRealms}" does not match deck faction "${FactionKey.Monsters}".`,
        unitGetCalls: [],
        deckUnitCalls: [],
        validateDeckCalls: [],
        deckAddCalls: [],
        getDeckStatsCalls: [],
        postResolversCalled: false,
        debugCalls: [
          [
            `${logPrefix} failed: Leader "${leaderId}" faction "${FactionKey.NorthernRealms}" does not match deck faction "${FactionKey.Monsters}".`,
          ],
        ],
      })
    })
    it('returns error if single unit does not exist', async () => {
      const unitId = new ObjectId()
      await testAddDeck({
        userId,
        unitIds: [unitId],
        unitGetResponse: [],
        errorReturned: `Unit "${unitId}" does not exist.`,
        deckUnitCalls: [],
        validateDeckCalls: [],
        deckAddCalls: [],
        getDeckStatsCalls: [],
        postResolversCalled: false,
        debugCalls: [[`${logPrefix} failed: Unit "${unitId}" does not exist.`]],
      })
    })
    it('returns errors if multiple units do not exist', async () => {
      const unitId1 = new ObjectId()
      const unitId2 = new ObjectId()
      await testAddDeck({
        userId,
        unitIds: [unitId1, unitId2],
        unitGetResponse: [],
        errorReturned: [`Unit "${unitId1}" does not exist.`, `Unit "${unitId2}" does not exist.`].join('\n'),
        deckUnitCalls: [],
        validateDeckCalls: [],
        deckAddCalls: [],
        getDeckStatsCalls: [],
        postResolversCalled: false,
        debugCalls: [[`${logPrefix} failed: Unit "${unitId1}" does not exist.\nUnit "${unitId2}" does not exist.`]],
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
    it('returns error if not enough opponents', async () => {
      await testAddGame({
        opponentNames: [],
        expected: Error(`Not enough opponents for game at "0", minimum is "${PLAYER_COUNTS.Min - 1}".`),
      })
    })
    it('returns error if too many opponents', async () => {
      await testAddGame({
        opponentNames: ['one', 'two'],
        expected: Error(`Excessive number of opponents for game at "2", maximum is "${PLAYER_COUNTS.Min - 1}".`),
      })
    })
    it('returns error if opponent does not exist', async () => {
      const opponent = 'opponent'
      await testAddGame({
        opponentNames: [opponent],
        expected: Error(`User with name "${opponent}" does not exist.`),
        getByNamesCalls: [[[opponent]]],
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
  })
  describe('addUser', () => {
    const name = 'james.bond@mi6.com'
    it('returns error if user already exists', async () => {
      const error = Error(`User "${name}" already exists`)
      await testAddUser({
        name,
        userAddResponse: error,
        expected: error,
      })
    })
    it('throws error if not about user already existing', async () => {
      const error = Error('Connection refused')
      await testAddUser({
        name,
        userAddResponse: error,
        error,
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
  })
  describe('login', () => {
    it('returns error if credentials invalid', async () => {
      const name = 'james.bond@mi6.com'
      const error = Error(`Invalid credentials for user "${name}"`)
      await testLogin({
        name,
        userValidateResponse: error,
        expected: error,
      })
    })
    it('throws error if not invalid credentials', async () => {
      const error = Error('Connection refused')
      await testLogin({
        userValidateResponse: error,
        error,
      })
    })
    it('sets user on context if context undefined', async () => {
      await testLogin({
        context: undefined,
      })
    })
    it('sets user on context if context session undefined', async () => {
      await testLogin({
        context: {},
      })
    })
    it('sets user on context if context session does not have user', async () => {
      await testLogin({
        context: {
          session: {},
        },
      })
    })
    it('sets user on context if context session already has user', async () => {
      await testLogin({
        context: {
          session: {
            user: TestUtil.getDbUser({}),
          },
        },
      })
    })
  })
  describe('logout', () => {
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
            user: TestUtil.getDbUser({}),
          },
        },
        expected: true,
      })
    })
  })
  describe('ready', () => {
    it('returns error if game does not exist', async () => {
      const gameId = new ObjectId().toString()
      await testReady({
        gameId,
        expected: Error('Game does not exist.'),
        gameGetCalls: [
          [
            {
              id: gameId,
            },
          ],
        ],
      })
    })
    it('returns error if not a player on the game', async () => {
      const gameId = new ObjectId().toString()
      await testReady({
        gameId,
        gameGetResponse: TestUtil.getDbGame({}),
        expected: Error('Not a player on this game.'),
        gameGetCalls: [
          [
            {
              id: gameId,
            },
          ],
        ],
      })
    })
    it('returns error if deck not yet set', async () => {
      const userId = new ObjectId()
      const gameId = new ObjectId().toString()
      await testReady({
        userId,
        gameId,
        gameGetResponse: TestUtil.getDbGame({
          creator: userId,
        }),
        expected: Error('Must set deck first.'),
        gameGetCalls: [
          [
            {
              id: gameId,
            },
          ],
        ],
      })
    })
    it('returns error if already marked as ready', async () => {
      const userId = new ObjectId()
      const gameId = new ObjectId().toString()
      await testReady({
        userId,
        gameId,
        gameGetResponse: TestUtil.getDbGame({
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
        expected: Error('Already marked as ready.'),
        gameGetCalls: [
          [
            {
              id: gameId,
            },
          ],
        ],
      })
    })
    it('returns error if setReady response is undefined', async () => {
      const userId = new ObjectId()
      const gameId = new ObjectId().toString()
      await testReady({
        userId,
        gameId,
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
        setReadyResponse: undefined,
        expected: Error('Could not set player as ready in probably race condition collision.'),
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
      })
    })
    it('returns resolved game if no errors', async () => {
      const userId = new ObjectId()
      const gameId = new ObjectId().toString()
      const game = TestUtil.getDbGame({
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
  })
  describe('redraw', () => {
    it('returns error if game does not exist', async () => {
      const gameId = new ObjectId().toString()
      await testRedraw({
        userId: new ObjectId().toString(),
        gameId: gameId,
        expected: Error('Game does not exist.'),
        gameGetCalls: [
          [
            {
              id: gameId,
            },
          ],
        ],
      })
    })
    it('returns error if not a player on game', async () => {
      const gameId = new ObjectId().toString()
      await testRedraw({
        userId: new ObjectId().toString(),
        gameId: gameId,
        gameGetResponse: TestUtil.getDbGame({}),
        expected: Error('Not a player on this game.'),
        gameGetCalls: [
          [
            {
              id: gameId,
            },
          ],
        ],
      })
    })
    it('returns error if game marked as ready', async () => {
      const userId = new ObjectId().toString()
      const gameId = new ObjectId().toString()
      await testRedraw({
        userId: userId,
        gameId: gameId,
        gameGetResponse: TestUtil.getDbGame({
          players: [
            TestUtil.getDbGamePlayer({
              ready: true,
              user: userId,
            }),
          ],
        }),
        expected: Error('Cannot redraw after game is marked as ready.'),
        gameGetCalls: [
          [
            {
              id: gameId,
            },
          ],
        ],
      })
    })
    it('returns error if deck not set', async () => {
      const userId = new ObjectId().toString()
      const gameId = new ObjectId().toString()
      await testRedraw({
        userId: userId,
        gameId: gameId,
        gameGetResponse: TestUtil.getDbGame({
          players: [
            TestUtil.getDbGamePlayer({
              user: userId,
            }),
          ],
        }),
        expected: Error('Cannot redraw before deck is set.'),
        gameGetCalls: [
          [
            {
              id: gameId,
            },
          ],
        ],
      })
    })
    it('returns error if max redraws already taken', async () => {
      const userId = new ObjectId().toString()
      const gameId = new ObjectId().toString()
      await testRedraw({
        userId: userId,
        gameId: gameId,
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
        expected: Error(`Cannot exceed maximum redraw limit of "${MAX_REDRAWS}".`),
        gameGetCalls: [
          [
            {
              id: gameId,
            },
          ],
        ],
      })
    })
    it('returns error if unit not in hand', async () => {
      const userId = new ObjectId().toString()
      const gameId = new ObjectId().toString()
      await testRedraw({
        userId: userId,
        gameId: gameId,
        unitId: new ObjectId().toString(),
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
        expected: Error('Invalid unit, does not exist in hand.'),
        gameGetCalls: [
          [
            {
              id: gameId,
            },
          ],
        ],
      })
    })
    it('returns error if updated game undefined', async () => {
      const userId = new ObjectId().toString()
      const gameId = new ObjectId().toString()
      const unit1 = TestUtil.getDbUnit({})
      const unit2 = TestUtil.getDbUnit({})
      await testRedraw({
        userId: userId,
        gameId: gameId,
        unitId: unit1._id.toString(),
        gameGetResponse: TestUtil.getDbGame({
          players: [
            TestUtil.getDbGamePlayer({
              deck: TestUtil.getDbGameDeck({
                from: TestUtil.getDbDeck({}),
                hand: [
                  {
                    artStyle: 1,
                    unit: unit1._id,
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
        expected: Error('Could not update game with new card in probably race condition collision.'),
        gameGetCalls: [
          [
            {
              id: gameId,
            },
          ],
        ],
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
                    unit: unit1._id,
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
                  unit: unit1._id,
                },
              ],
              userId,
            },
          ],
        ],
      })
    })
    it('returns resolved DeckUnit if no errors', async () => {
      const userId = new ObjectId().toString()
      const gameId = new ObjectId().toString()
      const unit1 = TestUtil.getDbUnit({})
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
                  unit: unit1._id,
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
        userId: userId,
        gameId: gameId,
        unitId: unit1._id.toString(),
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
                      unit: unit1._id,
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
                    unit: unit1._id,
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
                    unit: unit1._id,
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
                  unit: unit1._id,
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
  })
  describe('setDeck', () => {
    it('returns error if deck does not exist', async () => {
      const deckId = new ObjectId().toString()
      await testSetDeck({
        deckId,
        expected: Error(`Deck with ID "${deckId}" does not exist`),
        getDeckCalls: [
          [
            {
              id: deckId,
            },
          ],
        ],
      })
    })
    it('returns error if game does not exist', async () => {
      const deck = TestUtil.getDbDeck({})
      const gameId = new ObjectId().toString()
      await testSetDeck({
        deckId: deck._id.toString(),
        gameId,
        getDeckResponse: deck,
        expected: Error(`Game with ID "${gameId}" does not exist`),
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
              id: gameId,
            },
          ],
        ],
      })
    })
    it('returns error if not a player on game', async () => {
      const userId = new ObjectId()
      const deck = TestUtil.getDbDeck({})
      const game = TestUtil.getDbGame({})
      await testSetDeck({
        userId,
        deckId: deck._id.toString(),
        gameId: game._id.toString(),
        getDeckResponse: deck,
        getGameResponse: game,
        expected: Error(`User "${userId}" is not a player on game "${game._id}"`),
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
      })
    })
    it('returns error if deck is already set', async () => {
      const userId = new ObjectId()
      const deck = TestUtil.getDbDeck({})
      const game = TestUtil.getDbGame({
        players: [
          TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              from: TestUtil.getDbDeck({}),
            }),
            user: userId,
          }),
        ],
      })
      await testSetDeck({
        userId,
        deckId: deck._id.toString(),
        gameId: game._id.toString(),
        getDeckResponse: deck,
        getGameResponse: game,
        expected: Error('Deck already set'),
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
      })
    })
    it('returns error if updated game is undefined', async () => {
      const userId = new ObjectId()
      const deck = TestUtil.getDbDeck({})
      const game = TestUtil.getDbGame({
        creator: userId,
      })
      await testSetDeck({
        userId,
        deckId: deck._id.toString(),
        gameId: game._id.toString(),
        getDeckResponse: deck,
        getGameResponse: game,
        setDeckResponse: undefined,
        randomSubset: deck.units.slice(0, STARTING_HAND_SIZE),
        expected: Error('Game updated underneath operation in probable race condition collision.'),
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
    it('returns error if player not on updated game', async () => {
      const userId = new ObjectId()
      const deck = TestUtil.getDbDeck({})
      const game = TestUtil.getDbGame({
        creator: userId,
      })
      await testSetDeck({
        userId,
        deckId: deck._id.toString(),
        gameId: game._id.toString(),
        getDeckResponse: deck,
        getGameResponse: game,
        setDeckResponse: TestUtil.getDbGame({}),
        randomSubset: deck.units.slice(0, STARTING_HAND_SIZE),
        expected: Error('Could not get player after setting deck on game.'),
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
    it('returns resolved deck if no errors', async () => {
      const userId = new ObjectId()
      const deck = TestUtil.getDbDeck({})
      const game = TestUtil.getDbGame({
        creator: userId,
      })
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
}: {
  creatorId?: ObjectId
  opponentNames: string[]
  getUserByNamesResponse?: UserDbObject[]
  expected?: Game | Error
  addCalls?: any[][]
  fromObjectCalled?: boolean
  getByNamesCalls?: any[][]
}) {
  const context = {
    session: {
      user: {
        _id: creatorId,
      },
    },
  }
  const args = {
    opponentNames,
  }
  const user = TestUtil.getUser({
    id: creatorId,
  })
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
}

async function testAddUser({
  name = 'james.bond@mi6.com',
  userAddResponse,
  error,
  expected,
}: {
  name?: string
  userAddResponse: UserDbObject | Error
  error?: Error
  expected?: User | Error
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

  if (error) {
    await expect((MutationResolver.getResolvers().addUser as any)(null, args, null, null)).rejects.toThrow(error)
  } else {
    await expect((MutationResolver.getResolvers().addUser as any)(null, args, null, null)).resolves.toEqual(expected)
  }

  expect(addSpy.mock.calls).toEqual([[args.name, args.password]])
}

async function testLogin({
  name = 'james.bond@mi6.com',
  context,
  userValidateResponse = TestUtil.getDbUser({}),
  error,
  expected,
}: {
  name?: string
  context?: any
  userValidateResponse?: UserDbObject | Error
  error?: Error
  expected?: User | Error
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
}

function testLogout({ context, expected }: { context?: any; expected: boolean }) {
  expect((MutationResolver.getResolvers().logout as any)(null, null, context, null)).toEqual(expected)

  expect(context?.session?.user).toEqual(undefined)
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

  await expect((MutationResolver.getResolvers().ready as any)(null, args, context, null)).resolves.toEqual(expected)

  expect(gameGetSpy.mock.calls).toEqual(gameGetCalls)
  expect(setReadySpy.mock.calls).toEqual(setReadyCalls)
  expect(gameResolveSpy.mock.calls).toEqual(gameResolveCalls)
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
  const gameGetSpy = jest.spyOn(GameStore, 'getById').mockResolvedValue(gameGetResponse)
  const gameRedrawSpy = jest.spyOn(GameStore, 'redraw').mockResolvedValue(gameRedrawResponse)
  const resolveDeckUnitSpy = jest.spyOn(DeckUnitResolver, 'fromObject')
  if (resolveDeckUnitResponse) {
    resolveDeckUnitSpy.mockResolvedValue(resolveDeckUnitResponse)
  }

  await expect((MutationResolver.getResolvers().redraw as any)(null, args, context, null)).resolves.toEqual(expected)

  expect(gameGetSpy.mock.calls).toEqual(gameGetCalls)
  expect(gameRedrawSpy.mock.calls).toEqual(gameRedrawCalls)
  expect(resolveDeckUnitSpy.mock.calls).toEqual(resolveDeckUnitCalls)
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
  const getDeckSpy = jest.spyOn(DeckStore, 'getById').mockResolvedValue(getDeckResponse)
  const getGameSpy = jest.spyOn(GameStore, 'getById').mockResolvedValue(getGameResponse)
  const getRandomSubsetSpy = jest.spyOn(getRandomSubset, 'getRandomSubset').mockReturnValue(randomSubset)
  const setDeckSpy = jest.spyOn(GameStore, 'setDeck').mockResolvedValue(setDeckResponse as any as GameDbObject)
  const fromObjectSpy = jest.spyOn(GameDeckResolver, 'fromObject')
  if (!(expected instanceof Error)) {
    fromObjectSpy.mockResolvedValue(expected)
  }

  await expect((MutationResolver.getResolvers().setDeck as any)(null, args, context, null)).resolves.toEqual(expected)

  expect(getDeckSpy.mock.calls).toEqual(getDeckCalls)
  expect(getGameSpy.mock.calls).toEqual(getGameCalls)
  expect(getRandomSubsetSpy.mock.calls).toEqual(getRandomSubsetCalls)
  expect(setDeckSpy.mock.calls).toEqual(setDeckCalls)
}
