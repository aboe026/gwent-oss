import ApiClient from '../util/api-client'
import { FactionKey, Game } from '@gwent/graphql-schema/resolver-typings'
import { E2eCtx, getFixtureCtx, getTestCtx } from '../util/e2e-ctx'
import E2eUtil from '../util/e2e-util'
import GamePage from '../page-objects/game-page'
import HomePage from '../page-objects/home-page'
import LoginPage from '../page-objects/login-page'
import { ContextGamePlayer, E2eHelper } from '../util/e2e-helper'
import { PlayerTurn } from '../components/game-player-info'

interface GameRedrawingTestCtx extends E2eCtx {
  scenario: string
  self: ContextGamePlayer
  opponent: ContextGamePlayer
  northerRealms: {
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
const fixture = getFixtureCtx<E2eCtx, GameRedrawingTestCtx>()
const test = getTestCtx<E2eCtx, GameRedrawingTestCtx>()

fixture('Game Redrawing')
  .page(HomePage.getUrl())
  .beforeEach(async (t) => {
    t.ctx.scenario = 'game-redrawing'
    const self = await new ApiClient({}).addUser({
      name: `${t.ctx.scenario}-self-${t.ctx.start}`,
    })
    const opponent = await new ApiClient({}).addUser({
      name: `${t.ctx.scenario}-opponent-${t.ctx.start}`,
    })

    t.ctx.northerRealms = {
      faction: FactionKey.NorthernRealms,
      leader: 'Foltest Son of Medell',
      units: [
        'Ballista',
        'Biting Frost',
        'Blue Stripes Commando',
        'Blue Stripes Commando',
        'Blue Stripes Commando',
        'Catapult',
        'Catapult',
        'Cirilla Fiona Elen Riannon',
        "Commander's Horn",
        'Cow',
        'Decoy',
        'Dun Banner Medic',
        'Geralt of Rivia',
        'Mysterious Elf',
        'Prince Stennis',
        'Sabrina Glevissig',
        'Scorch',
        'Sigismund Dijkstra',
        'Skellige Storm',
        'Thaler',
        'Villentretenmerth',
        'Yennefer of Vengerberg',
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

    const selfClient = new ApiClient({
      username: self.name,
    })
    const opponentClient = new ApiClient({
      username: opponent.name,
    })

    t.ctx.game = await selfClient.addGame([opponent.name])

    const selfDeck = await selfClient.addDeck({
      faction: t.ctx.northerRealms.faction,
      leaderName: t.ctx.northerRealms.leader,
      name: `${t.ctx.scenario}-self-deck-${Date.now()}`,
      unitNames: t.ctx.northerRealms.units,
    })
    const opponentDeck = await opponentClient.addDeck({
      faction: t.ctx.nilfgaard.faction,
      leaderName: t.ctx.nilfgaard.leader,
      name: `${t.ctx.scenario}-opponent-deck-${Date.now()}`,
      unitNames: t.ctx.nilfgaard.units,
    })

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
  const unitToRedraw = t.ctx.self.gameDeck.hand[0].unit.name
  await GamePage.redraw(unitToRedraw)
  const updatedGameDeck = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: updatedGameDeck.hand,
    redraws: [
      {
        from: {
          unitName: unitToRedraw,
        },
        to: {
          unitName: updatedGameDeck.redraws[0].to.unit.name,
        },
      },
    ],
  })
})

test('Redraw 1 card after opponent redraws', async (t) => {
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
  await t.ctx.opponent.client.redraw({
    gameId: t.ctx.game.id,
    unitId: t.ctx.opponent.gameDeck.hand[0].unit.id,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    redraws: [],
  })
  const unitToRedraw = t.ctx.self.gameDeck.hand[0].unit.name
  await GamePage.redraw(unitToRedraw)
  const updatedGameDeck = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: updatedGameDeck.hand,
    redraws: [
      {
        from: {
          unitName: unitToRedraw,
        },
        to: {
          unitName: updatedGameDeck.redraws[0].to.unit.name,
        },
      },
    ],
  })
})

test('Redraw 1 card after opponent ready', async (t) => {
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
  const unitToRedraw = t.ctx.self.gameDeck.hand[0].unit.name
  await GamePage.redraw(unitToRedraw)
  const updatedGameDeck = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: updatedGameDeck.hand,
    redraws: [
      {
        from: {
          unitName: unitToRedraw,
        },
        to: {
          unitName: updatedGameDeck.redraws[0].to.unit.name,
        },
      },
    ],
  })
})

test('Redraw 2 cards before opponent ready', async (t) => {
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
  const unitToRedraw1 = t.ctx.self.gameDeck.hand[0].unit.name
  const unitToRedraw2 = t.ctx.self.gameDeck.hand[1].unit.name
  await GamePage.redraw(unitToRedraw1)
  const updatedGameDeck1 = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: updatedGameDeck1.hand,
    redraws: [
      {
        from: {
          unitName: unitToRedraw1,
        },
        to: {
          unitName: updatedGameDeck1.redraws[0].to.unit.name,
        },
      },
    ],
  })
  await GamePage.redraw(unitToRedraw2)
  const updatedGameDeck2 = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: updatedGameDeck2.hand,
    redraws: [
      {
        from: {
          unitName: unitToRedraw1,
        },
        to: {
          unitName: updatedGameDeck2.redraws[0].to.unit.name,
        },
      },
      {
        from: {
          unitName: unitToRedraw2,
        },
        to: {
          unitName: updatedGameDeck2.redraws[1].to.unit.name,
        },
      },
    ],
  })
})

test('Redraw 2 cards after opponent redraws', async (t) => {
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
  await t.ctx.opponent.client.redraw({
    gameId: t.ctx.game.id,
    unitId: t.ctx.opponent.gameDeck.hand[0].unit.id,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    redraws: [],
  })
  const unitToRedraw1 = t.ctx.self.gameDeck.hand[0].unit.name
  const unitToRedraw2 = t.ctx.self.gameDeck.hand[1].unit.name
  await GamePage.redraw(unitToRedraw1)
  const updatedGameDeck1 = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: updatedGameDeck1.hand,
    redraws: [
      {
        from: {
          unitName: unitToRedraw1,
        },
        to: {
          unitName: updatedGameDeck1.redraws[0].to.unit.name,
        },
      },
    ],
  })
  await t.ctx.opponent.client.redraw({
    gameId: t.ctx.game.id,
    unitId: t.ctx.opponent.gameDeck.hand[1].unit.id,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: updatedGameDeck1.hand,
    redraws: [
      {
        from: {
          unitName: unitToRedraw1,
        },
        to: {
          unitName: updatedGameDeck1.redraws[0].to.unit.name,
        },
      },
    ],
  })
  await GamePage.redraw(unitToRedraw2)
  const updatedGameDeck2 = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: updatedGameDeck2.hand,
    redraws: [
      {
        from: {
          unitName: unitToRedraw1,
        },
        to: {
          unitName: updatedGameDeck2.redraws[0].to.unit.name,
        },
      },
      {
        from: {
          unitName: unitToRedraw2,
        },
        to: {
          unitName: updatedGameDeck2.redraws[1].to.unit.name,
        },
      },
    ],
  })
})

test('Redraw 2 cards after opponent ready', async (t) => {
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
  const unitToRedraw1 = t.ctx.self.gameDeck.hand[0].unit.name
  const unitToRedraw2 = t.ctx.self.gameDeck.hand[1].unit.name
  await GamePage.redraw(unitToRedraw1)
  const updatedGameDeck1 = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: updatedGameDeck1.hand,
    redraws: [
      {
        from: {
          unitName: unitToRedraw1,
        },
        to: {
          unitName: updatedGameDeck1.redraws[0].to.unit.name,
        },
      },
    ],
  })
  await GamePage.redraw(unitToRedraw2)
  const updatedGameDeck2 = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: updatedGameDeck2.hand,
    redraws: [
      {
        from: {
          unitName: unitToRedraw1,
        },
        to: {
          unitName: updatedGameDeck2.redraws[0].to.unit.name,
        },
      },
      {
        from: {
          unitName: unitToRedraw2,
        },
        to: {
          unitName: updatedGameDeck2.redraws[1].to.unit.name,
        },
      },
    ],
  })
})

test('Page automatically updates after first redraw via API', async (t) => {
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
  const unitToRedraw = t.ctx.self.gameDeck.hand[0].unit
  await t.ctx.self.client.redraw({
    gameId: t.ctx.game.id,
    unitId: unitToRedraw.id,
  })
  const updatedGameDeck = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: updatedGameDeck.hand,
    redraws: [
      {
        from: {
          unitName: unitToRedraw.name,
        },
        to: {
          unitName: updatedGameDeck.redraws[0].to.unit.name,
        },
      },
    ],
  })
})

test('Page automatically updates after second redraw via API', async (t) => {
  const won = t.ctx.game.turn?.user.id === t.ctx.self.user.id
  const selfPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.self,
    turn: won ? PlayerTurn.Future : undefined,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.opponent,
    turn: won ? undefined : PlayerTurn.Future,
  })
  const unitToRedraw1 = t.ctx.self.gameDeck.hand[0].unit
  const unitToRedraw2 = t.ctx.self.gameDeck.hand[1].unit
  await t.ctx.self.client.redraw({
    gameId: t.ctx.game.id,
    unitId: unitToRedraw1.id,
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
          unitName: unitToRedraw1.name,
        },
        to: {
          unitName: updatedGameDeck1.redraws[0].to.unit.name,
        },
      },
    ],
  })
  await t.ctx.self.client.redraw({
    gameId: t.ctx.game.id,
    unitId: unitToRedraw2.id,
  })
  const updatedGameDeck2 = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: updatedGameDeck2.hand,
    redraws: [
      {
        from: {
          unitName: unitToRedraw1.name,
        },
        to: {
          unitName: updatedGameDeck1.redraws[0].to.unit.name,
        },
      },
      {
        from: {
          unitName: unitToRedraw2.name,
        },
        to: {
          unitName: updatedGameDeck2.redraws[1].to.unit.name,
        },
      },
    ],
  })
})

test('Page not updated if use API to redraw from other game', async (t) => {
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
  const gameDeck2 = await t.ctx.self.client.setDeck({
    deckId: t.ctx.self.deck.id,
    gameId: game2.id,
  })
  await t.ctx.opponent.client.setDeck({
    deckId: t.ctx.opponent.deck.id,
    gameId: game2.id,
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
  const unitToRedraw = gameDeck2.hand[0].unit
  await t.ctx.self.client.redraw({
    gameId: game2.id,
    unitId: unitToRedraw.id,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    redraws: [],
  })
})
