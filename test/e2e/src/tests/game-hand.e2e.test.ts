import ApiClient from '../util/api-client'
import { Combat, FactionKey, Game } from '@gwent/graphql-schema/resolver-typings'
import { ContextGamePlayer, E2eHelper } from '../util/e2e-helper'
import { E2eCtx, getFixtureCtx, getTestCtx } from '../util/e2e-ctx'
import E2eUtil from '../util/e2e-util'
import GamePage, { GamePlayerExpected, HistoryMove, HistoryPass } from '../page-objects/game-page'
import HomePage from '../page-objects/home-page'
import LoginPage from '../page-objects/login-page'
import { PlayerTurn } from '../components/game-player-info'
import { sortObjectArray } from '@gwent/utils'

interface GameHandTestCtx extends E2eCtx {
  scenario: string
  self: ContextGamePlayer
  opponent: ContextGamePlayer
  selfPlayer: GamePlayerExpected
  opponentPlayer: GamePlayerExpected
  game: Game
  round1Moves: (HistoryMove | HistoryPass)[]
  round2Moves: (HistoryMove | HistoryPass)[]
  round3Moves: (HistoryMove | HistoryPass)[]
}
const fixture = getFixtureCtx<E2eCtx, GameHandTestCtx>()
const test = getTestCtx<E2eCtx, GameHandTestCtx>()

fixture('Game Hand')
  .page(HomePage.getUrl())
  .beforeEach(async (t) => {
    t.ctx.scenario = 'game-hand'
    const self = await new ApiClient({}).addUser({
      name: `${t.ctx.scenario}-self-${t.ctx.start}`,
    })
    const opponent = await new ApiClient({}).addUser({
      name: `${t.ctx.scenario}-opponent-${t.ctx.start}`,
    })

    const selfClient = new ApiClient({
      username: self.name,
    })
    const opponentClient = new ApiClient({
      username: opponent.name,
    })

    t.ctx.game = await selfClient.addGame([opponent.name])

    const selfDeck = await selfClient.addDeck({
      faction: FactionKey.ScoiaTael,
      leaderName: 'Francesca Findabair the Beautiful',
      name: `${t.ctx.scenario}-self-deck-${Date.now()}`,
      unitNames: [
        'Barclay Els',
        'Ciaran aep Easnillien',
        'Dennis Cranmer',
        'Dol Blathanna Archer',
        'Dol Blathanna Scout',
        'Eithne',
        'Emiel Regis Rohellec Terzieff',
        'Filavandrel aen Fidhail',
        'Ida Emean aep Sivney',
        'Iorveth',
        'Mahakaman Defender',
        'Mahakaman Defender',
        'Riordain',
        'Roach',
        'Saesenthessis',
        'Toruviel',
        'Triss Merigold',
        'Vesemir',
        'Vrihedd Brigade Recruit',
        'Vrihedd Brigade Veteran',
        'Yaevinn',
        'Zoltan Chivay',
      ],
    })
    const opponentDeck = await opponentClient.addDeck({
      faction: FactionKey.NilfgaardianEmpire,
      leaderName: 'Emhyr var Emreis the Relentless',
      name: `${t.ctx.scenario}-opponent-deck-${Date.now()}`,
      unitNames: [
        'Albrich',
        'Assire var Anahid',
        'Black Infantry Archer',
        'Cahir Mawr Dyffryn aep Ceallach',
        'Cynthia',
        'Emiel Regis Rohellec Terzieff',
        'Fringilla Vigo',
        'Heavy Zerrikanian Fire Scorpion',
        'Letho of Gulet',
        'Morteisen',
        'Morvran Voorhis',
        'Puttkammer',
        'Renuald aep Matsen',
        'Roach',
        'Siege Engineer',
        'Sweers',
        'Tibor Eggebracht',
        'Triss Merigold',
        'Vanhemar',
        'Vesemir',
        'Vreemde',
        'Zerrikanian Fire Scorpion',
      ],
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
    t.ctx.selfPlayer = E2eHelper.getGamePlayer({
      player: t.ctx.self,
      turn: PlayerTurn.Current,
      ready: true,
      passed: false,
      score: 0,
    })
    t.ctx.opponentPlayer = E2eHelper.getGamePlayer({
      player: t.ctx.opponent,
      ready: true,
      score: 0,
    })
    await selfClient.setOrder({
      gameId: t.ctx.game.id,
      userIds: [self.id, opponent.id],
    })
    await t.ctx.self.client.ready(t.ctx.game.id)
    await t.ctx.opponent.client.ready(t.ctx.game.id)

    t.ctx.game = await selfClient.getGame(t.ctx.game.id)
    t.ctx.round1Moves = []
    t.ctx.round2Moves = []
    t.ctx.round3Moves = []
    await LoginPage.login({
      username: t.ctx.self.user.name,
    })
    await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
    await GamePage.verify({
      opponent: t.ctx.opponentPlayer,
      self: t.ctx.selfPlayer,
      hand: t.ctx.self.gameDeck.hand,
      moves: [t.ctx.round1Moves],
    })
  })

test('Selecting hand unit while turn highlights appropriate single combat row', async (t) => {
  const sortedHand = sortObjectArray({
    array: t.ctx.self.gameDeck.hand,
    sortProperties: ['unit.strength', 'unit.id'],
    reverse: true,
  })
  const unitToSelect = sortedHand.find((card) => card.unit.combats && card.unit.combats.length === 1)
  if (!unitToSelect) {
    throw Error('Could not find unit in hand with only single eligible combat')
  }

  await GamePage.selectHandUnit({
    unitName: unitToSelect.unit.name,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [t.ctx.round1Moves],
    highlightedHandCard: {
      unitName: unitToSelect.unit.name,
      rows: unitToSelect.unit.combats,
    },
  })

  await GamePage.selectHandUnit({
    unitName: unitToSelect.unit.name,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [t.ctx.round1Moves],
  })
})

test('Selecting hand unit while turn highlights appropriate multi combat row', async (t) => {
  const sortedHand = sortObjectArray({
    array: t.ctx.self.gameDeck.hand,
    sortProperties: ['unit.strength', 'unit.id'],
    reverse: true,
  })
  const unitToSelect = sortedHand.find((card) => card.unit.combats && card.unit.combats.length > 1)
  if (!unitToSelect) {
    throw Error('Could not find unit in hand with multiple eligible combats')
  }

  await GamePage.selectHandUnit({
    unitName: unitToSelect.unit.name,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [t.ctx.round1Moves],
    highlightedHandCard: {
      unitName: unitToSelect.unit.name,
      rows: unitToSelect.unit.combats,
    },
  })

  await GamePage.selectHandUnit({
    unitName: unitToSelect.unit.name,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [t.ctx.round1Moves],
  })
})

test('Selecting hand unit while not turn dotted highlights appropriate single combat row', async (t) => {
  const sortedHand = sortObjectArray({
    array: t.ctx.self.gameDeck.hand,
    sortProperties: ['unit.strength', 'unit.id'],
    reverse: true,
  })
  const unitToSelect = sortedHand.find((card) => card.unit.combats && card.unit.combats.length === 1)
  if (!unitToSelect) {
    throw Error('Could not find unit in hand with only single eligible combat')
  }
  const unitToMove = sortedHand.find((card) => card.unit.id !== unitToSelect.unit.id)
  if (!unitToMove) {
    throw Error('Could not find unit in hand to play')
  }
  const combat = unitToMove.unit.combats ? unitToMove?.unit.combats[0] : Combat.Close

  await GamePage.moveUnit({
    unitName: unitToMove.unit.name,
    row: combat,
  })
  E2eHelper.playUnit({
    player: t.ctx.selfPlayer,
    deckUnit: unitToMove,
    gameDeck: t.ctx.self.gameDeck,
    moves: t.ctx.round1Moves,
    row: combat,
    switchTurnsWith: t.ctx.opponentPlayer,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [t.ctx.round1Moves],
  })

  await GamePage.selectHandUnit({
    unitName: unitToSelect.unit.name,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [t.ctx.round1Moves],
    highlightedHandCard: {
      unitName: unitToSelect.unit.name,
      rows: unitToSelect.unit.combats,
      dotted: true,
    },
  })

  await GamePage.selectHandUnit({
    unitName: unitToSelect.unit.name,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [t.ctx.round1Moves],
  })
})

test('Selecting hand unit while not turn dotted highlights appropriate multi combat rows', async (t) => {
  const sortedHand = sortObjectArray({
    array: t.ctx.self.gameDeck.hand,
    sortProperties: ['unit.strength', 'unit.id'],
    reverse: true,
  })
  const unitToSelect = sortedHand.find((card) => card.unit.combats && card.unit.combats.length > 1)
  if (!unitToSelect) {
    throw Error('Could not find unit in hand with multiple eligible combats')
  }
  const unitToMove = sortedHand.find((card) => card.unit.id !== unitToSelect.unit.id)
  if (!unitToMove) {
    throw Error('Could not find unit in hand to play')
  }
  const combat = unitToMove.unit.combats ? unitToMove?.unit.combats[0] : Combat.Close

  await GamePage.moveUnit({
    unitName: unitToMove.unit.name,
    row: combat,
  })
  E2eHelper.playUnit({
    player: t.ctx.selfPlayer,
    deckUnit: unitToMove,
    gameDeck: t.ctx.self.gameDeck,
    moves: t.ctx.round1Moves,
    row: combat,
    switchTurnsWith: t.ctx.opponentPlayer,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [t.ctx.round1Moves],
  })

  await GamePage.selectHandUnit({
    unitName: unitToSelect.unit.name,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [t.ctx.round1Moves],
    highlightedHandCard: {
      unitName: unitToSelect.unit.name,
      rows: unitToSelect.unit.combats,
      dotted: true,
    },
  })

  await GamePage.selectHandUnit({
    unitName: unitToSelect.unit.name,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [t.ctx.round1Moves],
  })
})

test('Selecting another hand unit while turn highlights appropriate card', async (t) => {
  const sortedHand = sortObjectArray({
    array: t.ctx.self.gameDeck.hand,
    sortProperties: ['unit.strength', 'unit.id'],
    reverse: true,
  })
  const unitToSelect1 = sortedHand[0]
  const unitToSelect2 = sortedHand[1]

  await GamePage.selectHandUnit({
    unitName: unitToSelect1.unit.name,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [t.ctx.round1Moves],
    highlightedHandCard: {
      unitName: unitToSelect1.unit.name,
      rows: unitToSelect1.unit.combats,
    },
  })

  await GamePage.selectHandUnit({
    unitName: unitToSelect2.unit.name,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [t.ctx.round1Moves],
    highlightedHandCard: {
      unitName: unitToSelect2.unit.name,
      rows: unitToSelect2.unit.combats,
    },
  })
})

test('Selecting another hand unit while not turn dotted highlights appropriate card', async (t) => {
  const sortedHand = sortObjectArray({
    array: t.ctx.self.gameDeck.hand,
    sortProperties: ['unit.strength', 'unit.id'],
    reverse: true,
  })
  const unitToSelect1 = sortedHand[1]
  const unitToSelect2 = sortedHand[2]
  const unitToMove = sortedHand[0]
  const combat = unitToMove.unit.combats ? unitToMove?.unit.combats[0] : Combat.Close

  await GamePage.moveUnit({
    unitName: unitToMove.unit.name,
    row: combat,
  })
  E2eHelper.playUnit({
    player: t.ctx.selfPlayer,
    deckUnit: unitToMove,
    gameDeck: t.ctx.self.gameDeck,
    moves: t.ctx.round1Moves,
    row: combat,
    switchTurnsWith: t.ctx.opponentPlayer,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [t.ctx.round1Moves],
  })

  await GamePage.selectHandUnit({
    unitName: unitToSelect1.unit.name,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [t.ctx.round1Moves],
    highlightedHandCard: {
      unitName: unitToSelect1.unit.name,
      rows: unitToSelect1.unit.combats,
      dotted: true,
    },
  })

  await GamePage.selectHandUnit({
    unitName: unitToSelect2.unit.name,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [t.ctx.round1Moves],
    highlightedHandCard: {
      unitName: unitToSelect2.unit.name,
      rows: unitToSelect2.unit.combats,
      dotted: true,
    },
  })
})

test('Playing all units in hand shows message to user to pass or activate leader ability', async (t) => {
  await E2eHelper.playStrongestCards({
    gameId: t.ctx.game.id,
    moves: t.ctx.round1Moves,
    opponent: {
      player: t.ctx.opponent,
      expected: t.ctx.opponentPlayer,
      numberToPlay: 0,
    },
    self: {
      player: t.ctx.self,
      expected: t.ctx.selfPlayer,
    },
    round: 1,
    uiDriven: true,
  })

  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [t.ctx.round1Moves],
  })
})
