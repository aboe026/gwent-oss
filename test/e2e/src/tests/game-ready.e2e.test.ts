import ApiClient from '../util/api-client'
import { Deck, FactionKey, Game, GameDeck, User } from '@gwent/graphql-schema/resolver-typings'
import { E2eCtx, getFixtureCtx, getTestCtx } from '../util/e2e-ctx'
import E2eUtil from '../util/e2e-util'
import GamePage from '../page-objects/game-page'
import HomePage from '../page-objects/home-page'
import LoginPage from '../page-objects/login-page'
import { PlayerTurn } from '../components/game-player-info'
import { E2eHelper } from '../util/e2e-helper'

interface ContextGamePlayer {
  user: User
  client: ApiClient
  deck: Deck
  gameDeck: GameDeck
}

interface GameReadyTestCtx extends E2eCtx {
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
const fixture = getFixtureCtx<E2eCtx, GameReadyTestCtx>()
const test = getTestCtx<E2eCtx, GameReadyTestCtx>()

fixture('Game Ready')
  .page(HomePage.getUrl())
  .beforeEach(async (t) => {
    t.ctx.scenario = 'game-ready'
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

test('Can set ready without redrawing any cards before opponent is ready', async (t) => {
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

test('Can set ready without redrawing any cards after opponent is ready', async (t) => {
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

test('Can set ready after redrawing once before opponent is ready', async (t) => {
  const won = t.ctx.game.turn?.user.id === t.ctx.self.user.id
  const selfPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.self,
    turn: won ? PlayerTurn.Future : undefined,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.opponent,
    turn: won ? undefined : PlayerTurn.Future,
  })
  await t.ctx.opponent.client.redraw({
    gameId: t.ctx.game.id,
    unitId: t.ctx.opponent.gameDeck.hand[0].unit.id,
  })
  const unitToRedraw = t.ctx.self.gameDeck.hand[0].unit
  const redraw = await t.ctx.self.client.redraw({
    gameId: t.ctx.game.id,
    unitId: unitToRedraw.id,
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
        from: unitToRedraw.name,
        to: redraw.unit.name,
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

test('Can set ready after redrawing once after opponent is ready', async (t) => {
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
  await t.ctx.opponent.client.redraw({
    gameId: t.ctx.game.id,
    unitId: t.ctx.opponent.gameDeck.hand[0].unit.id,
  })
  await t.ctx.opponent.client.ready(t.ctx.game.id)
  const unitToRedraw = t.ctx.self.gameDeck.hand[0].unit
  const redraw = await t.ctx.self.client.redraw({
    gameId: t.ctx.game.id,
    unitId: unitToRedraw.id,
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
        from: unitToRedraw.name,
        to: redraw.unit.name,
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

test('Can set ready after redrawing twice before opponent is ready', async (t) => {
  const won = t.ctx.game.turn?.user.id === t.ctx.self.user.id
  const selfPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.self,
    turn: won ? PlayerTurn.Future : undefined,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.opponent,
    turn: won ? undefined : PlayerTurn.Future,
  })
  await t.ctx.opponent.client.redraw({
    gameId: t.ctx.game.id,
    unitId: t.ctx.opponent.gameDeck.hand[0].unit.id,
  })
  const unitToRedraw1 = t.ctx.self.gameDeck.hand[0].unit
  const unitToRedraw2 = t.ctx.self.gameDeck.hand[1].unit
  const redraw1 = await t.ctx.self.client.redraw({
    gameId: t.ctx.game.id,
    unitId: unitToRedraw1.id,
  })
  const redraw2 = await t.ctx.self.client.redraw({
    gameId: t.ctx.game.id,
    unitId: unitToRedraw2.id,
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
        from: unitToRedraw1.name,
        to: redraw1.unit.name,
      },
      {
        from: unitToRedraw2.name,
        to: redraw2.unit.name,
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

test('Can set ready after redrawing twice after opponent is ready', async (t) => {
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
  await t.ctx.opponent.client.redraw({
    gameId: t.ctx.game.id,
    unitId: t.ctx.opponent.gameDeck.hand[0].unit.id,
  })
  await t.ctx.opponent.client.redraw({
    gameId: t.ctx.game.id,
    unitId: t.ctx.opponent.gameDeck.hand[1].unit.id,
  })
  await t.ctx.opponent.client.ready(t.ctx.game.id)
  const unitToRedraw1 = t.ctx.self.gameDeck.hand[0].unit
  const unitToRedraw2 = t.ctx.self.gameDeck.hand[1].unit
  const redraw1 = await t.ctx.self.client.redraw({
    gameId: t.ctx.game.id,
    unitId: unitToRedraw1.id,
  })
  const redraw2 = await t.ctx.self.client.redraw({
    gameId: t.ctx.game.id,
    unitId: unitToRedraw2.id,
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
        from: unitToRedraw1.name,
        to: redraw1.unit.name,
      },
      {
        from: unitToRedraw2.name,
        to: redraw2.unit.name,
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
