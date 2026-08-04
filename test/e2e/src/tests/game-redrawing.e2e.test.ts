import ApiClient, { AddDeckInput } from '../util/api-client'
import { FactionKey, Game } from '@gwent-oss/node-client'
import { E2eCtx, getFixtureCtx, getScenario, getTestCtx } from '../util/e2e-ctx'
import e2eEnv from '../util/e2e-env'
import E2eUtil from '../util/e2e-util'
import { ensureUnitsInHand } from '@gwent-oss/test-utils'
import GamePage from '../page-objects/game-page'
import HomePage from '../page-objects/home-page'
import LoginPage from '../page-objects/login-page'
import { ContextGamePlayer, E2eHelper } from '../util/e2e-helper'
import { PlayerTurn } from '../components/game-player-info'

interface GameRedrawingTestCtx extends E2eCtx {
  self: ContextGamePlayer
  opponent: ContextGamePlayer
  northerRealms: AddDeckInput
  nilfgaard: AddDeckInput
  game: Game
}
const fixture = getFixtureCtx<E2eCtx, GameRedrawingTestCtx>()
const test = getTestCtx<E2eCtx, GameRedrawingTestCtx>()

fixture('Game Redrawing')
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

test('Redraw 1 card before opponent redraws or ready', async (t) => {
  const unitName = 'Siegfried of Denesle'
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
    unitNames: [unitName],
    userId: t.ctx.self.user.id,
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
    redraws: [],
  })
  await GamePage.redraw(unitName)
  const updatedGameDeck = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: updatedGameDeck.hand,
    redraws: [
      {
        from: {
          unitName,
        },
        to: {
          unitName: updatedGameDeck.redraws[0].to.unit.name,
        },
      },
    ],
  })
})

test('Redraw 1 card after opponent redraws', async (t) => {
  const unitName1 = 'Morteisen'
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
  await ensureUnitsInHand({
    gameId: t.ctx.game.id,
    mongoConnectionString: e2eEnv.MONGO_URL,
    mongoDatabaseName: e2eEnv.MONGO_DB,
    unitNames: [unitName2],
    userId: t.ctx.self.user.id,
  })
  t.ctx.self.gameDeck = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  t.ctx.opponent.gameDeck = await t.ctx.opponent.client.getGameDeck(t.ctx.game.id)
  const opponentFrom = E2eHelper.getHandUnit({
    name: unitName1,
    deck: t.ctx.opponent.gameDeck,
  })
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  await GamePage.verifyCoinToss({
    won,
  })
  await t.ctx.opponent.client.redraw({
    gameId: t.ctx.game.id,
    unitId: opponentFrom.unit.id,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    redraws: [],
  })
  await GamePage.redraw(unitName2)
  const updatedGameDeck = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: updatedGameDeck.hand,
    redraws: [
      {
        from: {
          unitName: unitName2,
        },
        to: {
          unitName: updatedGameDeck.redraws[0].to.unit.name,
        },
      },
    ],
  })
})

test('Redraw 1 card after opponent ready', async (t) => {
  const unitName = 'Siegfried of Denesle'
  const won = t.ctx.game.turn?.user.id === t.ctx.self.user.id
  const selfPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.self,
    turn: won ? PlayerTurn.Future : undefined,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.opponent,
    turn: won ? undefined : PlayerTurn.Future,
  })
  await t.ctx.opponent.client.ready(t.ctx.game.id)
  await ensureUnitsInHand({
    gameId: t.ctx.game.id,
    mongoConnectionString: e2eEnv.MONGO_URL,
    mongoDatabaseName: e2eEnv.MONGO_DB,
    unitNames: [unitName],
    userId: t.ctx.self.user.id,
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
    redraws: [],
  })
  await GamePage.redraw(unitName)
  const updatedGameDeck = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: updatedGameDeck.hand,
    redraws: [
      {
        from: {
          unitName,
        },
        to: {
          unitName: updatedGameDeck.redraws[0].to.unit.name,
        },
      },
    ],
  })
})

test('Redraw 2 cards before opponent ready', async (t) => {
  const unitName1 = 'Siegfried of Denesle'
  const unitName2 = 'Ves'
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
    unitNames: [unitName1, unitName2],
    userId: t.ctx.self.user.id,
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
    redraws: [],
  })
  await GamePage.redraw(unitName1)
  const updatedGameDeck1 = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: updatedGameDeck1.hand,
    redraws: [
      {
        from: {
          unitName: unitName1,
        },
        to: {
          unitName: updatedGameDeck1.redraws[0].to.unit.name,
        },
      },
    ],
  })
  await GamePage.redraw(unitName2)
  const updatedGameDeck2 = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: updatedGameDeck2.hand,
    redraws: [
      {
        from: {
          unitName: unitName1,
        },
        to: {
          unitName: updatedGameDeck2.redraws[0].to.unit.name,
        },
      },
      {
        from: {
          unitName: unitName2,
        },
        to: {
          unitName: updatedGameDeck2.redraws[1].to.unit.name,
        },
      },
    ],
  })
})

test('Redraw 2 cards after opponent redraws', async (t) => {
  const unitName1 = 'Vreemde'
  const unitName2 = 'Siegfried of Denesle'
  const unitName3 = 'Morteisen'
  const unitName4 = 'Ves'
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
    unitNames: [unitName2, unitName4],
    userId: t.ctx.self.user.id,
  })
  t.ctx.self.gameDeck = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  await ensureUnitsInHand({
    gameId: t.ctx.game.id,
    mongoConnectionString: e2eEnv.MONGO_URL,
    mongoDatabaseName: e2eEnv.MONGO_DB,
    unitNames: [unitName1, unitName3],
    userId: t.ctx.opponent.user.id,
  })
  t.ctx.opponent.gameDeck = await t.ctx.opponent.client.getGameDeck(t.ctx.game.id)
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  await GamePage.verifyCoinToss({
    won,
  })
  const opponentFrom1 = E2eHelper.getHandUnit({
    name: unitName1,
    deck: t.ctx.opponent.gameDeck,
  })
  const opponentFrom2 = E2eHelper.getHandUnit({
    name: unitName3,
    deck: t.ctx.opponent.gameDeck,
  })
  await t.ctx.opponent.client.redraw({
    gameId: t.ctx.game.id,
    unitId: opponentFrom1.unit.id,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    redraws: [],
  })
  await GamePage.redraw(unitName2)
  const updatedGameDeck1 = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: updatedGameDeck1.hand,
    redraws: [
      {
        from: {
          unitName: unitName2,
        },
        to: {
          unitName: updatedGameDeck1.redraws[0].to.unit.name,
        },
      },
    ],
  })
  await t.ctx.opponent.client.redraw({
    gameId: t.ctx.game.id,
    unitId: opponentFrom2.unit.id,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: updatedGameDeck1.hand,
    redraws: [
      {
        from: {
          unitName: unitName2,
        },
        to: {
          unitName: updatedGameDeck1.redraws[0].to.unit.name,
        },
      },
    ],
  })
  await GamePage.redraw(unitName4)
  const updatedGameDeck2 = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: updatedGameDeck2.hand,
    redraws: [
      {
        from: {
          unitName: unitName2,
        },
        to: {
          unitName: updatedGameDeck2.redraws[0].to.unit.name,
        },
      },
      {
        from: {
          unitName: unitName4,
        },
        to: {
          unitName: updatedGameDeck2.redraws[1].to.unit.name,
        },
      },
    ],
  })
})

test('Redraw 2 cards after opponent ready', async (t) => {
  const unitName1 = 'Siegfried of Denesle'
  const unitName2 = 'Ves'
  const won = t.ctx.game.turn?.user.id === t.ctx.self.user.id
  const selfPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.self,
    turn: won ? PlayerTurn.Future : undefined,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.opponent,
    turn: won ? undefined : PlayerTurn.Future,
    ready: true,
  })
  await t.ctx.opponent.client.ready(t.ctx.game.id)
  await ensureUnitsInHand({
    gameId: t.ctx.game.id,
    mongoConnectionString: e2eEnv.MONGO_URL,
    mongoDatabaseName: e2eEnv.MONGO_DB,
    unitNames: [unitName1, unitName2],
    userId: t.ctx.self.user.id,
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
    redraws: [],
  })
  await GamePage.redraw(unitName1)
  const updatedGameDeck1 = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: updatedGameDeck1.hand,
    redraws: [
      {
        from: {
          unitName: unitName1,
        },
        to: {
          unitName: updatedGameDeck1.redraws[0].to.unit.name,
        },
      },
    ],
  })
  await GamePage.redraw(unitName2)
  const updatedGameDeck2 = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: updatedGameDeck2.hand,
    redraws: [
      {
        from: {
          unitName: unitName1,
        },
        to: {
          unitName: updatedGameDeck2.redraws[0].to.unit.name,
        },
      },
      {
        from: {
          unitName: unitName2,
        },
        to: {
          unitName: updatedGameDeck2.redraws[1].to.unit.name,
        },
      },
    ],
  })
})

test('Page automatically updates after first redraw via API', async (t) => {
  const unitName = 'Siegfried of Denesle'
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
    unitNames: [unitName],
    userId: t.ctx.self.user.id,
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
    redraws: [],
  })
  const unitToRedraw = E2eHelper.getHandUnit({
    name: unitName,
    deck: t.ctx.self.gameDeck,
  })
  await t.ctx.self.client.redraw({
    gameId: t.ctx.game.id,
    unitId: unitToRedraw.unit.id,
  })
  const updatedGameDeck = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: updatedGameDeck.hand,
    redraws: [
      {
        from: {
          unitName,
        },
        to: {
          unitName: updatedGameDeck.redraws[0].to.unit.name,
        },
      },
    ],
  })
})

test('Page automatically updates after second redraw via API', async (t) => {
  const unitName1 = 'Siegfried of Denesle'
  const unitName2 = 'Ves'
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
    unitNames: [unitName1, unitName2],
    userId: t.ctx.self.user.id,
  })
  t.ctx.self.gameDeck = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  const unitToRedraw1 = E2eHelper.getHandUnit({
    name: unitName1,
    deck: t.ctx.self.gameDeck,
  })
  const unitToRedraw2 = E2eHelper.getHandUnit({
    name: unitName2,
    deck: t.ctx.self.gameDeck,
  })
  await t.ctx.self.client.redraw({
    gameId: t.ctx.game.id,
    unitId: unitToRedraw1.unit.id,
  })
  const updatedGameDeck1 = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  await GamePage.verifyCoinToss({
    won,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: updatedGameDeck1.hand,
    redraws: [
      {
        from: {
          unitName: unitName1,
        },
        to: {
          unitName: updatedGameDeck1.redraws[0].to.unit.name,
        },
      },
    ],
  })
  await t.ctx.self.client.redraw({
    gameId: t.ctx.game.id,
    unitId: unitToRedraw2.unit.id,
  })
  const updatedGameDeck2 = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: updatedGameDeck2.hand,
    redraws: [
      {
        from: {
          unitName: unitName1,
        },
        to: {
          unitName: updatedGameDeck1.redraws[0].to.unit.name,
        },
      },
      {
        from: {
          unitName: unitName2,
        },
        to: {
          unitName: updatedGameDeck2.redraws[1].to.unit.name,
        },
      },
    ],
  })
})

test('Page not updated if use API to redraw from other game', async (t) => {
  const unitName = 'Ves'
  const won = t.ctx.game.turn?.user.id === t.ctx.self.user.id
  const selfPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.self,
    turn: won ? PlayerTurn.Future : undefined,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.opponent,
    turn: won ? undefined : PlayerTurn.Future,
  })
  const game2 = await t.ctx.self.client.addGame([t.ctx.opponent.user.name])
  await t.ctx.self.client.setDeck({
    deckId: t.ctx.self.deck.id,
    gameId: game2.id,
  })
  await t.ctx.opponent.client.setDeck({
    deckId: t.ctx.opponent.deck.id,
    gameId: game2.id,
  })
  await ensureUnitsInHand({
    gameId: game2.id,
    mongoConnectionString: e2eEnv.MONGO_URL,
    mongoDatabaseName: e2eEnv.MONGO_DB,
    unitNames: [unitName],
    userId: t.ctx.self.user.id,
  })
  const gameDeck2 = await t.ctx.self.client.getGameDeck(game2.id)
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
  const unitToRedraw = E2eHelper.getHandUnit({
    name: unitName,
    deck: gameDeck2,
  })
  await t.ctx.self.client.redraw({
    gameId: game2.id,
    unitId: unitToRedraw.unit.id,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    redraws: [],
  })
})
