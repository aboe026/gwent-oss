import createGameManager from '../util/game-manager'
import { E2eCtx, getFixtureCtx, getScenario, getTestCtx } from '../util/e2e-ctx'
import { FactionKey } from '@gwent-oss/node-client'
import GamePage from '../page-objects/game-page'
import { PlayerTurn } from '../components/game-player-info'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()
const factionName = "Scoia'tael"

fixture('Game Faction ScoiaTael Ability')

test('User with ScoiaTael deck and opponent without it can choose turn order to make self go first', async (t) => {
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
    },
    opponent: {
      faction: FactionKey.NorthernRealms,
    },
    ready: false,
  })
  await gameManager.initialize({
    verify: false,
  })

  await gameManager.verify({
    turnOrder: [gameManager.self.gamePlayer.name, gameManager.opponent.gamePlayer.name],
  })
  await GamePage.setOrder()
  await GamePage.verifyCoinToss({
    won: true,
  })
  gameManager.self.gamePlayer.turn = PlayerTurn.Future
  gameManager.moves = [
    [
      {
        unitName: factionName,
        userName: gameManager.self.gamePlayer.name,
        impacts: {
          factionKey: FactionKey.ScoiaTael,
          number: 2,
        },
      },
    ],
  ]
  await gameManager.verify({
    redraws: [],
  })
  await GamePage.toggleImpacts({
    userName: gameManager.self.gamePlayer.name,
    round: 1,
    unitName: factionName,
  })
  await GamePage.verifyImpacts({
    moves: [
      {
        userName: gameManager.self.gamePlayer.name,
        unitName: factionName,
        round: 1,
        factionKey: FactionKey.ScoiaTael,
        impacts: [
          {
            unitName: '',
            username: gameManager.self.gamePlayer.name,
          },
          {
            unitName: '',
            username: gameManager.opponent.gamePlayer.name,
          },
        ],
      },
    ],
  })
})

test('User with ScoiaTael deck and opponent without it can choose turn order to make opponent go first', async (t) => {
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
    },
    opponent: {
      faction: FactionKey.NorthernRealms,
    },
    ready: false,
  })
  await gameManager.initialize({
    verify: false,
  })

  await gameManager.verify({
    turnOrder: [gameManager.self.gamePlayer.name, gameManager.opponent.gamePlayer.name],
  })
  await GamePage.moveTurnOrderLater(gameManager.self.gamePlayer.name)
  await gameManager.verify({
    turnOrder: [gameManager.opponent.gamePlayer.name, gameManager.self.gamePlayer.name],
  })
  await GamePage.setOrder()
  await GamePage.verifyCoinToss({
    won: false,
  })
  gameManager.opponent.gamePlayer.turn = PlayerTurn.Future
  gameManager.moves = [
    [
      {
        unitName: factionName,
        userName: gameManager.self.gamePlayer.name,
        impacts: {
          factionKey: FactionKey.ScoiaTael,
          number: 2,
        },
      },
    ],
  ]
  await gameManager.verify({
    redraws: [],
  })
  await GamePage.toggleImpacts({
    userName: gameManager.self.gamePlayer.name,
    round: 1,
    unitName: factionName,
  })
  await GamePage.verifyImpacts({
    moves: [
      {
        userName: gameManager.self.gamePlayer.name,
        unitName: factionName,
        round: 1,
        factionKey: FactionKey.ScoiaTael,
        impacts: [
          {
            username: gameManager.opponent.gamePlayer.name,
          },
          {
            username: gameManager.self.gamePlayer.name,
          },
        ],
      },
    ],
  })
})

test('User without ScoiaTael deck and opponent with it must wait for opponent to set order opponent first', async (t) => {
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
    },
    opponent: {
      faction: FactionKey.ScoiaTael,
    },
    ready: false,
  })
  await gameManager.initialize({
    verify: false,
  })

  await gameManager.verify({
    turnOrder: [],
  })
  await gameManager.opponent.client.setOrder({
    gameId: gameManager.gameId,
    userIds: [(await gameManager.opponent.client.currentUser()).id, (await gameManager.self.client.currentUser()).id],
  })
  await GamePage.verifyCoinToss({
    won: false,
  })
  gameManager.opponent.gamePlayer.turn = PlayerTurn.Future
  gameManager.moves = [
    [
      {
        unitName: factionName,
        userName: gameManager.opponent.gamePlayer.name,
        impacts: {
          factionKey: FactionKey.ScoiaTael,
          number: 2,
        },
      },
    ],
  ]
  await gameManager.verify({
    redraws: [],
  })
  await GamePage.toggleImpacts({
    userName: gameManager.opponent.gamePlayer.name,
    round: 1,
    unitName: factionName,
  })
  await GamePage.verifyImpacts({
    moves: [
      {
        userName: gameManager.opponent.gamePlayer.name,
        unitName: factionName,
        round: 1,
        factionKey: FactionKey.ScoiaTael,
        impacts: [
          {
            username: gameManager.opponent.gamePlayer.name,
          },
          {
            username: gameManager.self.gamePlayer.name,
          },
        ],
      },
    ],
  })
})

test('User without ScoiaTael deck and opponent with it must wait for opponent to set order self first', async (t) => {
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
    },
    opponent: {
      faction: FactionKey.ScoiaTael,
    },
    ready: false,
  })
  await gameManager.initialize({
    verify: false,
  })

  await gameManager.verify({
    turnOrder: [],
  })
  await gameManager.opponent.client.setOrder({
    gameId: gameManager.gameId,
    userIds: [(await gameManager.self.client.currentUser()).id, (await gameManager.opponent.client.currentUser()).id],
  })
  await GamePage.verifyCoinToss({
    won: true,
  })
  gameManager.self.gamePlayer.turn = PlayerTurn.Future
  gameManager.moves = [
    [
      {
        unitName: factionName,
        userName: gameManager.opponent.gamePlayer.name,
        impacts: {
          factionKey: FactionKey.ScoiaTael,
          number: 2,
        },
      },
    ],
  ]
  await gameManager.verify({
    redraws: [],
  })
  await GamePage.toggleImpacts({
    userName: gameManager.opponent.gamePlayer.name,
    round: 1,
    unitName: factionName,
  })
  await GamePage.verifyImpacts({
    moves: [
      {
        userName: gameManager.opponent.gamePlayer.name,
        unitName: factionName,
        round: 1,
        factionKey: FactionKey.ScoiaTael,
        impacts: [
          {
            username: gameManager.self.gamePlayer.name,
          },
          {
            username: gameManager.opponent.gamePlayer.name,
          },
        ],
      },
    ],
  })
})

test('Order automatically set if both are ScoiaTael', async (t) => {
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
    },
    opponent: {
      faction: FactionKey.ScoiaTael,
    },
    ready: false,
  })
  await gameManager.initialize({
    verify: false,
  })

  await GamePage.verifyCoinToss({
    won: gameManager.self.gamePlayer.turn === PlayerTurn.Future ? true : false,
  })
  gameManager.moves = [
    [
      {
        unitName: factionName,
        userName: gameManager.self.gamePlayer.name,
        impacts: {
          factionKey: FactionKey.ScoiaTael,
          number: 0,
        },
      },
      {
        unitName: factionName,
        userName: gameManager.opponent.gamePlayer.name,
        impacts: {
          factionKey: FactionKey.ScoiaTael,
          number: 0,
        },
      },
    ],
  ]
  await GamePage.toggleImpacts({
    userName: gameManager.self.gamePlayer.name,
    round: 1,
    unitName: factionName,
  })
  await GamePage.toggleImpacts({
    userName: gameManager.opponent.gamePlayer.name,
    round: 1,
    unitName: factionName,
  })
  await GamePage.verifyImpacts({
    moves: [
      {
        userName: gameManager.self.gamePlayer.name,
        unitName: factionName,
        round: 1,
        factionKey: FactionKey.ScoiaTael,
        impacts: [],
      },
      {
        userName: gameManager.opponent.gamePlayer.name,
        unitName: factionName,
        round: 1,
        factionKey: FactionKey.ScoiaTael,
        impacts: [],
      },
    ],
  })
})
