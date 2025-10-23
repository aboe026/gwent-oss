import ApiClient, { AddDeckInput } from '../util/api-client'
import { ContextGamePlayer, E2eHelper } from '../util/e2e-helper'
import { E2eCtx, getFixtureCtx, getScenario, getTestCtx } from '../util/e2e-ctx'
import e2eEnv from '../util/e2e-env'
import E2eUtil from '../util/e2e-util'
import { ensureUnitsInHand } from '@gwent/test-utils'
import { FactionKey, Game } from '@gwent/node-client'
import GamePage from '../page-objects/game-page'
import HomePage from '../page-objects/home-page'
import LoginPage from '../page-objects/login-page'
import { PlayerTurn } from '../components/game-player-info'

interface GameReadyTestCtx extends E2eCtx {
  self: ContextGamePlayer
  opponent: ContextGamePlayer
  northerRealms: AddDeckInput
  nilfgaard: AddDeckInput
  game: Game
}
const fixture = getFixtureCtx<E2eCtx, GameReadyTestCtx>()
const test = getTestCtx<E2eCtx, GameReadyTestCtx>()

fixture('Game Ready')
  .page(HomePage.getUrl())
  .beforeEach(async (t) => {
    const self = await new ApiClient({}).addUser({
      name: `${getScenario(t)}-self-${t.ctx.start}`,
    })
    const opponent = await new ApiClient({}).addUser({
      name: `${getScenario(t)}-opponent-${t.ctx.start}`,
    })

    const selfClient = new ApiClient({
      username: self.name,
    })
    const opponentClient = new ApiClient({
      username: opponent.name,
    })

    t.ctx.northerRealms = {
      name: `${getScenario(t)}-north-deck-${t.ctx.start}`,
      faction: FactionKey.NorthernRealms,
      leaderName: 'Foltest Son of Medell',
      unitNames: await E2eHelper.getUnitsForDeck({
        client: selfClient,
        faction: FactionKey.NorthernRealms,
      }),
    }
    t.ctx.nilfgaard = {
      name: `${getScenario(t)}-nilfgaard-deck-${t.ctx.start}`,
      faction: FactionKey.NilfgaardianEmpire,
      leaderName: 'Emhyr var Emreis the Relentless',
      unitNames: await E2eHelper.getUnitsForDeck({
        client: opponentClient,
        faction: FactionKey.NilfgaardianEmpire,
      }),
    }

    t.ctx.game = await selfClient.addGame([opponent.name])

    const selfDeck = await selfClient.addDeck(t.ctx.northerRealms)
    const opponentDeck = await opponentClient.addDeck(t.ctx.nilfgaard)

    t.ctx.self = {
      user: self,
      client: selfClient,
      deck: selfDeck,
      gameDeck: await selfClient.setDeck({
        deckId: selfDeck.id,
        gameId: t.ctx.game.id,
      }),
    }
    t.ctx.opponent = {
      user: opponent,
      client: opponentClient,
      deck: opponentDeck,
      gameDeck: await opponentClient.setDeck({
        deckId: opponentDeck.id,
        gameId: t.ctx.game.id,
      }),
    }

    t.ctx.game = await selfClient.getGame(t.ctx.game.id)

    await LoginPage.login({
      username: t.ctx.self.user.name,
    })
  })

test('Set ready without redrawing any cards before opponent is ready', async (t) => {
  const won = t.ctx.game.turn?.user.id === t.ctx.self.user.id
  const selfPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.self,
    turn: won ? PlayerTurn.Future : undefined,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.opponent,
    turn: won ? undefined : PlayerTurn.Future,
  })
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  await GamePage.verifyCoinToss({
    won,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    redraws: [],
  })
  await GamePage.ready()
  await GamePage.verify({
    opponent: opponentPlayer,
    self: {
      ...selfPlayer,
      ready: true,
    },
    hand: t.ctx.self.gameDeck.hand,
  })
})

test('Set ready without redrawing any cards after opponent is ready', async (t) => {
  const won = t.ctx.game.turn?.user.id === t.ctx.self.user.id
  const selfPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.self,
    turn: won ? PlayerTurn.Future : undefined,
    score: 0,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.opponent,
    turn: won ? undefined : PlayerTurn.Future,
    ready: true,
    score: 0,
  })
  await t.ctx.opponent.client.ready(t.ctx.game.id)
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  await GamePage.verifyCoinToss({
    won,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    redraws: [],
  })
  await GamePage.ready()
  if (won) {
    selfPlayer.turn = PlayerTurn.Current
  } else {
    opponentPlayer.turn = PlayerTurn.Current
  }
  await GamePage.verify({
    opponent: opponentPlayer,
    self: {
      ...selfPlayer,
      ready: true,
      passed: false,
    },
    hand: t.ctx.self.gameDeck.hand,
    moves: [[]],
  })
})

test('Set ready after redrawing once before opponent is ready', async (t) => {
  const unitName1 = 'Vreemde'
  const unitName2 = 'Siegfried of Denesle'
  const won = t.ctx.game.turn?.user.id === t.ctx.self.user.id
  const selfPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.self,
    turn: won ? PlayerTurn.Future : undefined,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.opponent,
    turn: won ? undefined : PlayerTurn.Future,
  })
  await ensureUnitsInHand({
    gameId: t.ctx.game.id,
    mongoConnectionString: e2eEnv.MONGO_URL,
    mongoDatabaseName: e2eEnv.MONGO_DB,
    unitNames: [unitName1],
    userId: t.ctx.opponent.user.id,
  })
  t.ctx.opponent.gameDeck = await t.ctx.opponent.client.getGameDeck(t.ctx.game.id)
  await ensureUnitsInHand({
    gameId: t.ctx.game.id,
    mongoConnectionString: e2eEnv.MONGO_URL,
    mongoDatabaseName: e2eEnv.MONGO_DB,
    unitNames: [unitName2],
    userId: t.ctx.self.user.id,
  })
  t.ctx.self.gameDeck = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  const opponentFrom = E2eHelper.getHandUnit({
    name: unitName1,
    deck: t.ctx.opponent.gameDeck,
  })
  const selfFrom = E2eHelper.getHandUnit({
    name: unitName2,
    deck: t.ctx.self.gameDeck,
  })
  await t.ctx.opponent.client.redraw({
    gameId: t.ctx.game.id,
    unitId: opponentFrom.unit.id,
  })
  const redraw = await t.ctx.self.client.redraw({
    gameId: t.ctx.game.id,
    unitId: selfFrom.unit.id,
  })
  t.ctx.self.gameDeck = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  await GamePage.verifyCoinToss({
    won,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    redraws: [
      {
        from: {
          unitName: unitName2,
        },
        to: {
          unitName: redraw.unit.name,
        },
      },
    ],
  })
  await GamePage.ready()
  await GamePage.verify({
    opponent: opponentPlayer,
    self: {
      ...selfPlayer,
      ready: true,
    },
    hand: t.ctx.self.gameDeck.hand,
  })
})

test('Set ready after redrawing once after opponent is ready', async (t) => {
  const unitName1 = 'Vreemde'
  const unitName2 = 'Siegfried of Denesle'
  const won = t.ctx.game.turn?.user.id === t.ctx.self.user.id
  const selfPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.self,
    turn: won ? PlayerTurn.Future : undefined,
    score: 0,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.opponent,
    turn: won ? undefined : PlayerTurn.Future,
    ready: true,
    score: 0,
  })
  await ensureUnitsInHand({
    gameId: t.ctx.game.id,
    mongoConnectionString: e2eEnv.MONGO_URL,
    mongoDatabaseName: e2eEnv.MONGO_DB,
    unitNames: [unitName1],
    userId: t.ctx.opponent.user.id,
  })
  t.ctx.opponent.gameDeck = await t.ctx.opponent.client.getGameDeck(t.ctx.game.id)
  await ensureUnitsInHand({
    gameId: t.ctx.game.id,
    mongoConnectionString: e2eEnv.MONGO_URL,
    mongoDatabaseName: e2eEnv.MONGO_DB,
    unitNames: [unitName2],
    userId: t.ctx.self.user.id,
  })
  t.ctx.self.gameDeck = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  const opponentFrom = E2eHelper.getHandUnit({
    name: unitName1,
    deck: t.ctx.opponent.gameDeck,
  })
  const selfFrom = E2eHelper.getHandUnit({
    name: unitName2,
    deck: t.ctx.self.gameDeck,
  })
  await t.ctx.opponent.client.redraw({
    gameId: t.ctx.game.id,
    unitId: opponentFrom.unit.id,
  })
  await t.ctx.opponent.client.ready(t.ctx.game.id)
  const redraw = await t.ctx.self.client.redraw({
    gameId: t.ctx.game.id,
    unitId: selfFrom.unit.id,
  })
  t.ctx.self.gameDeck = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  await GamePage.verifyCoinToss({
    won,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    redraws: [
      {
        from: {
          unitName: unitName2,
        },
        to: {
          unitName: redraw.unit.name,
        },
      },
    ],
  })
  await GamePage.ready()
  if (won) {
    selfPlayer.turn = PlayerTurn.Current
  } else {
    opponentPlayer.turn = PlayerTurn.Current
  }
  await GamePage.verify({
    opponent: opponentPlayer,
    self: {
      ...selfPlayer,
      ready: true,
      passed: false,
    },
    hand: t.ctx.self.gameDeck.hand,
    moves: [[]],
  })
})

test('Set ready after redrawing twice before opponent is ready', async (t) => {
  const unitName1 = 'Vreemde'
  const unitName2 = 'Siegfried of Denesle'
  const unitName3 = 'Ves'
  const won = t.ctx.game.turn?.user.id === t.ctx.self.user.id
  const selfPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.self,
    turn: won ? PlayerTurn.Future : undefined,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.opponent,
    turn: won ? undefined : PlayerTurn.Future,
  })
  await ensureUnitsInHand({
    gameId: t.ctx.game.id,
    mongoConnectionString: e2eEnv.MONGO_URL,
    mongoDatabaseName: e2eEnv.MONGO_DB,
    unitNames: [unitName1],
    userId: t.ctx.opponent.user.id,
  })
  t.ctx.opponent.gameDeck = await t.ctx.opponent.client.getGameDeck(t.ctx.game.id)
  await ensureUnitsInHand({
    gameId: t.ctx.game.id,
    mongoConnectionString: e2eEnv.MONGO_URL,
    mongoDatabaseName: e2eEnv.MONGO_DB,
    unitNames: [unitName2, unitName3],
    userId: t.ctx.self.user.id,
  })
  t.ctx.self.gameDeck = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  const opponentFrom = E2eHelper.getHandUnit({
    name: unitName1,
    deck: t.ctx.opponent.gameDeck,
  })
  const selfFrom1 = E2eHelper.getHandUnit({
    name: unitName2,
    deck: t.ctx.self.gameDeck,
  })
  const selfFrom2 = E2eHelper.getHandUnit({
    name: unitName3,
    deck: t.ctx.self.gameDeck,
  })
  await t.ctx.opponent.client.redraw({
    gameId: t.ctx.game.id,
    unitId: opponentFrom.unit.id,
  })
  const redraw1 = await t.ctx.self.client.redraw({
    gameId: t.ctx.game.id,
    unitId: selfFrom1.unit.id,
  })
  const redraw2 = await t.ctx.self.client.redraw({
    gameId: t.ctx.game.id,
    unitId: selfFrom2.unit.id,
  })
  t.ctx.self.gameDeck = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  await GamePage.verifyCoinToss({
    won,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    redraws: [
      {
        from: {
          unitName: unitName2,
        },
        to: {
          unitName: redraw1.unit.name,
        },
      },
      {
        from: {
          unitName: unitName3,
        },
        to: {
          unitName: redraw2.unit.name,
        },
      },
    ],
  })
  await GamePage.ready()
  await GamePage.verify({
    opponent: opponentPlayer,
    self: {
      ...selfPlayer,
      ready: true,
    },
    hand: t.ctx.self.gameDeck.hand,
  })
})

test('Set ready after redrawing twice after opponent is ready', async (t) => {
  const unitName1 = 'Vreemde'
  const unitName2 = 'Siegfried of Denesle'
  const unitName3 = 'Morteisen'
  const unitName4 = 'Ves'
  const won = t.ctx.game.turn?.user.id === t.ctx.self.user.id
  const selfPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.self,
    turn: won ? PlayerTurn.Future : undefined,
    score: 0,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.opponent,
    turn: won ? undefined : PlayerTurn.Future,
    ready: true,
    score: 0,
  })
  await ensureUnitsInHand({
    gameId: t.ctx.game.id,
    mongoConnectionString: e2eEnv.MONGO_URL,
    mongoDatabaseName: e2eEnv.MONGO_DB,
    unitNames: [unitName1, unitName3],
    userId: t.ctx.opponent.user.id,
  })
  t.ctx.opponent.gameDeck = await t.ctx.opponent.client.getGameDeck(t.ctx.game.id)
  await ensureUnitsInHand({
    gameId: t.ctx.game.id,
    mongoConnectionString: e2eEnv.MONGO_URL,
    mongoDatabaseName: e2eEnv.MONGO_DB,
    unitNames: [unitName2, unitName4],
    userId: t.ctx.self.user.id,
  })
  t.ctx.self.gameDeck = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  const opponentFrom1 = E2eHelper.getHandUnit({
    name: unitName1,
    deck: t.ctx.opponent.gameDeck,
  })
  const opponentFrom2 = E2eHelper.getHandUnit({
    name: unitName3,
    deck: t.ctx.opponent.gameDeck,
  })
  const selfFrom1 = E2eHelper.getHandUnit({
    name: unitName2,
    deck: t.ctx.self.gameDeck,
  })
  const selfFrom2 = E2eHelper.getHandUnit({
    name: unitName4,
    deck: t.ctx.self.gameDeck,
  })
  await t.ctx.opponent.client.redraw({
    gameId: t.ctx.game.id,
    unitId: opponentFrom1.unit.id,
  })
  await t.ctx.opponent.client.redraw({
    gameId: t.ctx.game.id,
    unitId: opponentFrom2.unit.id,
  })
  await t.ctx.opponent.client.ready(t.ctx.game.id)
  const redraw1 = await t.ctx.self.client.redraw({
    gameId: t.ctx.game.id,
    unitId: selfFrom1.unit.id,
  })
  const redraw2 = await t.ctx.self.client.redraw({
    gameId: t.ctx.game.id,
    unitId: selfFrom2.unit.id,
  })
  t.ctx.self.gameDeck = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  await GamePage.verifyCoinToss({
    won,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    redraws: [
      {
        from: {
          unitName: unitName2,
        },
        to: {
          unitName: redraw1.unit.name,
        },
      },
      {
        from: {
          unitName: unitName4,
        },
        to: {
          unitName: redraw2.unit.name,
        },
      },
    ],
  })
  await GamePage.ready()
  if (won) {
    selfPlayer.turn = PlayerTurn.Current
  } else {
    opponentPlayer.turn = PlayerTurn.Current
  }
  await GamePage.verify({
    opponent: opponentPlayer,
    self: {
      ...selfPlayer,
      ready: true,
      passed: false,
    },
    hand: t.ctx.self.gameDeck.hand,
    moves: [[]],
  })
})
