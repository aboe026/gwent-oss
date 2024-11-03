import ApiClient from '../util/api-client'
import { E2eCtx, getFixtureCtx, getTestCtx } from '../util/e2e-ctx'
import E2eUtil from '../util/e2e-util'
import { FactionKey, Game, User } from '@gwent/graphql-schema/resolver-typings'
import GamePage, { GamePlayerExpected } from '../page-objects/game-page'
import HomePage from '../page-objects/home-page'
import LoginPage from '../page-objects/login-page'
import { PlayerTurn } from '../components/game-player-info'
import { sortObjectArray } from '@gwent/utils'
import { STARTING_HAND_SIZE } from '@gwent/constants'

interface GameOrderingTestCtx extends E2eCtx {
  scenario: string
  self: {
    user: User
    client: ApiClient
  }
  opponent: {
    user: User
    client: ApiClient
  }
  scoiaTael: {
    faction: FactionKey
    leader: string
    units: string[]
  }
  nilfgaard: {
    faction: FactionKey
    leader: string
    units: string[]
  }
  game: Game
}
const fixture = getFixtureCtx<E2eCtx, GameOrderingTestCtx>()
const test = getTestCtx<E2eCtx, GameOrderingTestCtx>()

fixture('Game Ordering')
  .page(HomePage.getUrl())
  .beforeEach(async (t) => {
    t.ctx.scenario = 'game-ordering'
    const selfUsername = `${t.ctx.scenario}-self-${t.ctx.start}`
    const opponentUsername = `${t.ctx.scenario}-opponent-${t.ctx.start}`

    t.ctx.self = {
      user: await new ApiClient({}).addUser({
        name: selfUsername,
      }),
      client: new ApiClient({
        username: selfUsername,
      }),
    }
    t.ctx.opponent = {
      user: await new ApiClient({}).addUser({
        name: opponentUsername,
      }),
      client: new ApiClient({
        username: opponentUsername,
      }),
    }

    t.ctx.scoiaTael = {
      faction: FactionKey.ScoiaTael,
      leader: 'Francesca Findabair Queen of Dol Blathanna',
      units: [
        'Barclay Els',
        'Ciaran aep Easnillien',
        'Cirilla Fiona Elen Riannon',
        'Dol Blathanna Archer',
        'Dol Blathanna Scout',
        'Dol Blathanna Scout',
        'Dol Blathanna Scout',
        'Dwarven Skirmisher',
        'Dwarven Skirmisher',
        'Dwarven Skirmisher',
        'Eithne',
        'Elven Skirmisher',
        'Elven Skirmisher',
        'Elven Skirmisher',
        'Emiel Regis Rohellec Terzieff',
        'Filavandrel aen Fidhail',
        'Havekar Healer',
        'Havekar Healer',
        'Havekar Healer',
        'Havekar Smuggler',
        'Havekar Smuggler',
        'Havekar Smuggler',
        'Scorch',
      ],
    }
    t.ctx.nilfgaard = {
      faction: FactionKey.NilfgaardianEmpire,
      leader: 'Emhyr var Emreis the Relentless',
      units: [
        'Albrich',
        'Assire var Anahid',
        'Black Infantry Archer',
        'Black Infantry Archer',
        'Emiel Regis Rohellec Terzieff',
        'Etolian Auxiliary Archers',
        'Etolian Auxiliary Archers',
        'Heavy Zerrikanian Fire Scorpion',
        'Impera Brigade Guard',
        'Impera Brigade Guard',
        'Impera Brigade Guard',
        'Impera Brigade Guard',
        'Nausicaa Cavalry Rider',
        'Nausicaa Cavalry Rider',
        'Nausicaa Cavalry Rider',
        'Renuald aep Matsen',
        'Rotten Mangonel',
        'Shilard Fitz-Oesterlen',
        'Siege Engineer',
        'Siege Technician',
        'Young Emissary',
        'Young Emissary',
      ],
    }

    t.ctx.game = await new ApiClient({
      username: t.ctx.self.user.name,
    }).addGame([t.ctx.opponent.user.name])
    await LoginPage.login({
      username: t.ctx.self.user.name,
    })
  })

test('User with ScoiaTael deck and opponent without it can choose turn order to make self go first', async (t) => {
  const deckSelf = await t.ctx.self.client.addDeck({
    faction: t.ctx.scoiaTael.faction,
    leaderName: t.ctx.scoiaTael.leader,
    name: `${t.ctx.scenario}-deck-self-${t.ctx.start}`,
    unitNames: t.ctx.scoiaTael.units,
  })
  const deckOpponent = await t.ctx.opponent.client.addDeck({
    faction: t.ctx.nilfgaard.faction,
    leaderName: t.ctx.nilfgaard.leader,
    name: `${t.ctx.scenario}-deck-opponent-${t.ctx.start}`,
    unitNames: t.ctx.nilfgaard.units,
  })
  await t.ctx.self.client.setDeck({
    deckId: deckSelf.id,
    gameId: t.ctx.game.id,
  })
  await t.ctx.opponent.client.setDeck({
    deckId: deckOpponent.id,
    gameId: t.ctx.game.id,
  })
  const gameDeckSelf = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  const gameDeckOpponent = await t.ctx.opponent.client.getGameDeck(t.ctx.game.id)
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  const selfPlayer: GamePlayerExpected = {
    name: t.ctx.self.user.name,
    discard: 0,
    faction: deckSelf.faction,
    leader: deckSelf.leader,
    hand: STARTING_HAND_SIZE,
    undrawn: deckSelf.units.length - STARTING_HAND_SIZE,
    from: gameDeckSelf.from,
  }
  const opponentPlayer: GamePlayerExpected = {
    name: t.ctx.opponent.user.name,
    discard: 0,
    faction: deckOpponent.faction,
    leader: deckOpponent.leader,
    hand: STARTING_HAND_SIZE,
    undrawn: deckOpponent.units.length - STARTING_HAND_SIZE,
    from: gameDeckOpponent.from,
  }
  const hand = sortObjectArray({
    sortProperties: ['unit.strength', 'unit.id'],
    array: gameDeckSelf.hand,
  }).map((deckUnit) => deckUnit.unit.name)
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand,
    turnOrder: [t.ctx.self.user.name, t.ctx.opponent.user.name],
  })
  await GamePage.setOrder()
  await GamePage.verifyCoinFlip({
    won: true,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: {
      ...selfPlayer,
      turn: PlayerTurn.Future,
    },
    hand,
    redraws: [],
  })
})

test('User with ScoiaTael deck and opponent without it can choose turn order to make opponent go first', async (t) => {
  const deckSelf = await t.ctx.self.client.addDeck({
    faction: t.ctx.scoiaTael.faction,
    leaderName: t.ctx.scoiaTael.leader,
    name: `${t.ctx.scenario}-deck-self-${t.ctx.start}`,
    unitNames: t.ctx.scoiaTael.units,
  })
  const deckOpponent = await t.ctx.opponent.client.addDeck({
    faction: t.ctx.nilfgaard.faction,
    leaderName: t.ctx.nilfgaard.leader,
    name: `${t.ctx.scenario}-deck-opponent-${t.ctx.start}`,
    unitNames: t.ctx.nilfgaard.units,
  })
  await t.ctx.self.client.setDeck({
    deckId: deckSelf.id,
    gameId: t.ctx.game.id,
  })
  await t.ctx.opponent.client.setDeck({
    deckId: deckOpponent.id,
    gameId: t.ctx.game.id,
  })
  const gameDeckSelf = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  const gameDeckOpponent = await t.ctx.opponent.client.getGameDeck(t.ctx.game.id)
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  const selfPlayer: GamePlayerExpected = {
    name: t.ctx.self.user.name,
    discard: 0,
    faction: deckSelf.faction,
    leader: deckSelf.leader,
    hand: STARTING_HAND_SIZE,
    undrawn: deckSelf.units.length - STARTING_HAND_SIZE,
    from: gameDeckSelf.from,
  }
  const opponentPlayer: GamePlayerExpected = {
    name: t.ctx.opponent.user.name,
    discard: 0,
    faction: deckOpponent.faction,
    leader: deckOpponent.leader,
    hand: STARTING_HAND_SIZE,
    undrawn: deckOpponent.units.length - STARTING_HAND_SIZE,
    from: gameDeckOpponent.from,
  }
  const hand = sortObjectArray({
    sortProperties: ['unit.strength', 'unit.id'],
    array: gameDeckSelf.hand,
  }).map((deckUnit) => deckUnit.unit.name)
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand,
    turnOrder: [t.ctx.self.user.name, t.ctx.opponent.user.name],
  })
  await GamePage.moveTurnOrderLater(t.ctx.self.user.name)
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand,
    turnOrder: [t.ctx.opponent.user.name, t.ctx.self.user.name],
  })
  await GamePage.setOrder()
  await GamePage.verifyCoinFlip({
    won: false,
  })
  await GamePage.verify({
    opponent: {
      ...opponentPlayer,
      turn: PlayerTurn.Future,
    },
    self: selfPlayer,
    hand,
    redraws: [],
  })
})

test('User without ScoiaTael deck and opponent with it must wait for opponent to set order opponent first', async (t) => {
  const deckSelf = await t.ctx.self.client.addDeck({
    faction: t.ctx.nilfgaard.faction,
    leaderName: t.ctx.nilfgaard.leader,
    name: `${t.ctx.scenario}-deck-self-${t.ctx.start}`,
    unitNames: t.ctx.nilfgaard.units,
  })
  const deckOpponent = await t.ctx.opponent.client.addDeck({
    faction: t.ctx.scoiaTael.faction,
    leaderName: t.ctx.scoiaTael.leader,
    name: `${t.ctx.scenario}-deck-opponent-${t.ctx.start}`,
    unitNames: t.ctx.scoiaTael.units,
  })
  await t.ctx.self.client.setDeck({
    deckId: deckSelf.id,
    gameId: t.ctx.game.id,
  })
  await t.ctx.opponent.client.setDeck({
    deckId: deckOpponent.id,
    gameId: t.ctx.game.id,
  })
  const gameDeckSelf = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  const gameDeckOpponent = await t.ctx.opponent.client.getGameDeck(t.ctx.game.id)
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  const selfPlayer: GamePlayerExpected = {
    name: t.ctx.self.user.name,
    discard: 0,
    faction: deckSelf.faction,
    leader: deckSelf.leader,
    hand: STARTING_HAND_SIZE,
    undrawn: deckSelf.units.length - STARTING_HAND_SIZE,
    from: gameDeckSelf.from,
  }
  const opponentPlayer: GamePlayerExpected = {
    name: t.ctx.opponent.user.name,
    discard: 0,
    faction: deckOpponent.faction,
    leader: deckOpponent.leader,
    hand: STARTING_HAND_SIZE,
    undrawn: deckOpponent.units.length - STARTING_HAND_SIZE,
    from: gameDeckOpponent.from,
  }
  const hand = sortObjectArray({
    sortProperties: ['unit.strength', 'unit.id'],
    array: gameDeckSelf.hand,
  }).map((deckUnit) => deckUnit.unit.name)
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand,
    turnOrder: [],
  })
  await t.ctx.opponent.client.setOrder({
    gameId: t.ctx.game.id,
    userIds: [t.ctx.opponent.user.id, t.ctx.self.user.id],
  })
  // TODO: remove reload once subscription in place
  await GamePage.refresh()
  await GamePage.verifyCoinFlip({
    won: false,
  })
  await GamePage.verify({
    opponent: {
      ...opponentPlayer,
      turn: PlayerTurn.Future,
    },
    self: selfPlayer,
    hand,
    redraws: [],
  })
})

test('User without ScoiaTael deck and opponent with it must wait for opponent to set order self first', async (t) => {
  const deckSelf = await t.ctx.self.client.addDeck({
    faction: t.ctx.nilfgaard.faction,
    leaderName: t.ctx.nilfgaard.leader,
    name: `${t.ctx.scenario}-deck-self-${t.ctx.start}`,
    unitNames: t.ctx.nilfgaard.units,
  })
  const deckOpponent = await t.ctx.opponent.client.addDeck({
    faction: t.ctx.scoiaTael.faction,
    leaderName: t.ctx.scoiaTael.leader,
    name: `${t.ctx.scenario}-deck-opponent-${t.ctx.start}`,
    unitNames: t.ctx.scoiaTael.units,
  })
  await t.ctx.self.client.setDeck({
    deckId: deckSelf.id,
    gameId: t.ctx.game.id,
  })
  await t.ctx.opponent.client.setDeck({
    deckId: deckOpponent.id,
    gameId: t.ctx.game.id,
  })
  const gameDeckSelf = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  const gameDeckOpponent = await t.ctx.opponent.client.getGameDeck(t.ctx.game.id)
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  const selfPlayer: GamePlayerExpected = {
    name: t.ctx.self.user.name,
    discard: 0,
    faction: deckSelf.faction,
    leader: deckSelf.leader,
    hand: STARTING_HAND_SIZE,
    undrawn: deckSelf.units.length - STARTING_HAND_SIZE,
    from: gameDeckSelf.from,
  }
  const opponentPlayer: GamePlayerExpected = {
    name: t.ctx.opponent.user.name,
    discard: 0,
    faction: deckOpponent.faction,
    leader: deckOpponent.leader,
    hand: STARTING_HAND_SIZE,
    undrawn: deckOpponent.units.length - STARTING_HAND_SIZE,
    from: gameDeckOpponent.from,
  }
  const hand = sortObjectArray({
    sortProperties: ['unit.strength', 'unit.id'],
    array: gameDeckSelf.hand,
  }).map((deckUnit) => deckUnit.unit.name)
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand,
    turnOrder: [],
  })
  await t.ctx.opponent.client.setOrder({
    gameId: t.ctx.game.id,
    userIds: [t.ctx.self.user.id, t.ctx.opponent.user.id],
  })
  // TODO: remove reload once subscription in place
  await GamePage.refresh()
  await GamePage.verifyCoinFlip({
    won: true,
  })
  await GamePage.verify({
    opponent: {
      ...opponentPlayer,
    },
    self: {
      ...selfPlayer,
      turn: PlayerTurn.Future,
    },
    hand,
    redraws: [],
  })
})

test('Cannot choose order if both are ScoiaTael', async (t) => {
  const deckSelf = await t.ctx.self.client.addDeck({
    faction: t.ctx.scoiaTael.faction,
    leaderName: t.ctx.scoiaTael.leader,
    name: `${t.ctx.scenario}-deck-self-${t.ctx.start}`,
    unitNames: t.ctx.scoiaTael.units,
  })
  const deckOpponent = await t.ctx.opponent.client.addDeck({
    faction: t.ctx.scoiaTael.faction,
    leaderName: t.ctx.scoiaTael.leader,
    name: `${t.ctx.scenario}-deck-opponent-${t.ctx.start}`,
    unitNames: t.ctx.scoiaTael.units,
  })
  await t.ctx.self.client.setDeck({
    deckId: deckSelf.id,
    gameId: t.ctx.game.id,
  })
  await t.ctx.opponent.client.setDeck({
    deckId: deckOpponent.id,
    gameId: t.ctx.game.id,
  })
  const gameDeckSelf = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  const gameDeckOpponent = await t.ctx.opponent.client.getGameDeck(t.ctx.game.id)
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  const selfPlayer: GamePlayerExpected = {
    name: t.ctx.self.user.name,
    discard: 0,
    faction: deckSelf.faction,
    leader: deckSelf.leader,
    hand: STARTING_HAND_SIZE,
    undrawn: deckSelf.units.length - STARTING_HAND_SIZE,
    from: gameDeckSelf.from,
  }
  const opponentPlayer: GamePlayerExpected = {
    name: t.ctx.opponent.user.name,
    discard: 0,
    faction: deckOpponent.faction,
    leader: deckOpponent.leader,
    hand: STARTING_HAND_SIZE,
    undrawn: deckOpponent.units.length - STARTING_HAND_SIZE,
    from: gameDeckOpponent.from,
  }
  const hand = sortObjectArray({
    sortProperties: ['unit.strength', 'unit.id'],
    array: gameDeckSelf.hand,
  }).map((deckUnit) => deckUnit.unit.name)
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand,
    turnOrder: true,
  })
  await GamePage.setOrder()
  // TODO: remove reload once subscription in place
  await GamePage.refresh()
  const updatedGame = await t.ctx.self.client.getGame(t.ctx.game.id)
  await t.expect(updatedGame.turn).notEql(null)
  await t.expect(updatedGame.turn).notEql(undefined)
  if (updatedGame.turn?.user.id === t.ctx.self.user.id) {
    selfPlayer.turn = PlayerTurn.Future
  } else if (updatedGame.turn?.user.id === t.ctx.opponent.user.id) {
    opponentPlayer.turn = PlayerTurn.Future
  }
  await GamePage.verifyCoinFlip({
    won: selfPlayer.turn === PlayerTurn.Future,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand,
    redraws: [],
  })
})

test('Cannot choose order if none are ScoiaTael', async (t) => {
  const deckSelf = await t.ctx.self.client.addDeck({
    faction: t.ctx.nilfgaard.faction,
    leaderName: t.ctx.nilfgaard.leader,
    name: `${t.ctx.scenario}-deck-self-${t.ctx.start}`,
    unitNames: t.ctx.nilfgaard.units,
  })
  const deckOpponent = await t.ctx.opponent.client.addDeck({
    faction: t.ctx.nilfgaard.faction,
    leaderName: t.ctx.nilfgaard.leader,
    name: `${t.ctx.scenario}-deck-opponent-${t.ctx.start}`,
    unitNames: t.ctx.nilfgaard.units,
  })
  await t.ctx.self.client.setDeck({
    deckId: deckSelf.id,
    gameId: t.ctx.game.id,
  })
  await t.ctx.opponent.client.setDeck({
    deckId: deckOpponent.id,
    gameId: t.ctx.game.id,
  })
  const gameDeckSelf = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  const gameDeckOpponent = await t.ctx.opponent.client.getGameDeck(t.ctx.game.id)
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  const selfPlayer: GamePlayerExpected = {
    name: t.ctx.self.user.name,
    discard: 0,
    faction: deckSelf.faction,
    leader: deckSelf.leader,
    hand: STARTING_HAND_SIZE,
    undrawn: deckSelf.units.length - STARTING_HAND_SIZE,
    from: gameDeckSelf.from,
  }
  const opponentPlayer: GamePlayerExpected = {
    name: t.ctx.opponent.user.name,
    discard: 0,
    faction: deckOpponent.faction,
    leader: deckOpponent.leader,
    hand: STARTING_HAND_SIZE,
    undrawn: deckOpponent.units.length - STARTING_HAND_SIZE,
    from: gameDeckOpponent.from,
  }
  const hand = sortObjectArray({
    sortProperties: ['unit.strength', 'unit.id'],
    array: gameDeckSelf.hand,
  }).map((deckUnit) => deckUnit.unit.name)
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand,
    turnOrder: true,
  })
  await GamePage.setOrder()
  // TODO: remove reload once subscription in place
  await GamePage.refresh()
  const updatedGame = await t.ctx.self.client.getGame(t.ctx.game.id)
  await t.expect(updatedGame.turn).notEql(null)
  await t.expect(updatedGame.turn).notEql(undefined)
  if (updatedGame.turn?.user.id === t.ctx.self.user.id) {
    selfPlayer.turn = PlayerTurn.Future
  } else if (updatedGame.turn?.user.id === t.ctx.opponent.user.id) {
    opponentPlayer.turn = PlayerTurn.Future
  }
  await GamePage.verifyCoinFlip({
    won: selfPlayer.turn === PlayerTurn.Future,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand,
    redraws: [],
  })
})
