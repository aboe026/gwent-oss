import ApiClient from '../util/api-client'
import { Combat, Deck, FactionKey, Game, GameDeck, User } from '@gwent/graphql-schema/resolver-typings'
import { E2eCtx, getFixtureCtx, getTestCtx } from '../util/e2e-ctx'
import { E2eHelper } from '../util/e2e-helper'
import E2eUtil from '../util/e2e-util'
import GamePage, { GamePlayerExpected, HistoryMove, HistoryPass } from '../page-objects/game-page'
import HomePage from '../page-objects/home-page'
import LoginPage from '../page-objects/login-page'
import { PlayerTurn } from '../components/game-player-info'
import { sortObjectArray } from '@gwent/utils'

interface ContextGamePlayer {
  user: User
  client: ApiClient
  deck: Deck
  gameDeck: GameDeck
}

interface GameHistoryTestCtx extends E2eCtx {
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
const fixture = getFixtureCtx<E2eCtx, GameHistoryTestCtx>()
const test = getTestCtx<E2eCtx, GameHistoryTestCtx>()

fixture('Game History')
  .page(HomePage.getUrl())
  .beforeEach(async (t) => {
    t.ctx.scenario = 'game-history'
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

test('Selecting self unit when not turn in history highlights it and card on battlefield', async (t) => {
  const sortedHand = sortObjectArray({
    array: t.ctx.self.gameDeck.hand,
    sortProperties: ['unit.strength', 'unit.id'],
    reverse: true,
  })
  const unitToMove = sortedHand[0]
  const combat = unitToMove.unit.combats ? unitToMove.unit.combats[0] : Combat.Close

  await GamePage.moveUnit({
    unitName: unitToMove.unit.name,
    row: combat,
  })
  E2eHelper.playUnit({
    player: t.ctx.selfPlayer,
    gameDeck: t.ctx.self.gameDeck,
    deckUnit: unitToMove,
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

  await GamePage.selectHistoryUnit({
    playerName: t.ctx.self.user.name,
    unitName: unitToMove.unit.name,
    row: combat,
    round: 1,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [t.ctx.round1Moves],
    highlightedHistory: {
      playerName: t.ctx.self.user.name,
      round: 1,
      unitName: unitToMove.unit.name,
      row: combat,
    },
    highlightedBattlefieldCard: {
      unitName: unitToMove.unit.name,
      row: combat,
    },
  })

  await GamePage.selectHistoryUnit({
    playerName: t.ctx.self.user.name,
    unitName: unitToMove.unit.name,
    row: combat,
    round: 1,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [t.ctx.round1Moves],
  })
})

test('Selecting self unit when not turn on combat row highlights it and move in history', async (t) => {
  const sortedHand = sortObjectArray({
    array: t.ctx.self.gameDeck.hand,
    sortProperties: ['unit.strength', 'unit.id'],
    reverse: true,
  })
  const unitToMove = sortedHand[0]
  const combat = unitToMove.unit.combats ? unitToMove.unit.combats[0] : Combat.Close

  await GamePage.moveUnit({
    unitName: unitToMove.unit.name,
    row: combat,
  })
  E2eHelper.playUnit({
    player: t.ctx.selfPlayer,
    gameDeck: t.ctx.self.gameDeck,
    deckUnit: unitToMove,
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

  await GamePage.selectBattlefieldCard({
    unitName: unitToMove.unit.name,
    row: combat,
    self: true,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [t.ctx.round1Moves],
    highlightedHistory: {
      playerName: t.ctx.self.user.name,
      round: 1,
      unitName: unitToMove.unit.name,
      row: combat,
    },
    highlightedBattlefieldCard: {
      unitName: unitToMove.unit.name,
      row: combat,
    },
  })

  await GamePage.selectBattlefieldCard({
    unitName: unitToMove.unit.name,
    row: combat,
    self: true,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [t.ctx.round1Moves],
  })
})

test('Selecting self unit when turn in history highlights it and card on battlefield', async (t) => {
  const sortedHandSelf = sortObjectArray({
    array: t.ctx.self.gameDeck.hand,
    sortProperties: ['unit.strength', 'unit.id'],
    reverse: true,
  })
  const unitToMoveSelf = sortedHandSelf[0]
  const combatSelf = unitToMoveSelf.unit.combats ? unitToMoveSelf.unit.combats[0] : Combat.Close

  await GamePage.moveUnit({
    unitName: unitToMoveSelf.unit.name,
    row: combatSelf,
  })
  E2eHelper.playUnit({
    player: t.ctx.selfPlayer,
    gameDeck: t.ctx.self.gameDeck,
    deckUnit: unitToMoveSelf,
    moves: t.ctx.round1Moves,
    row: combatSelf,
    switchTurnsWith: t.ctx.opponentPlayer,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [t.ctx.round1Moves],
  })

  const sortedHandOpponent = sortObjectArray({
    array: t.ctx.opponent.gameDeck.hand,
    sortProperties: ['unit.strength', 'unit.id'],
    reverse: true,
  })
  const unitToMoveOpponent = sortedHandOpponent[0]
  const combatOpponent = unitToMoveOpponent.unit.combats ? unitToMoveOpponent.unit.combats[0] : Combat.Close
  await t.ctx.opponent.client.playUnit({
    gameId: t.ctx.game.id,
    unitId: unitToMoveOpponent.unit.id,
    combat: combatOpponent,
  })
  E2eHelper.playUnit({
    player: t.ctx.opponentPlayer,
    gameDeck: t.ctx.opponent.gameDeck,
    deckUnit: unitToMoveOpponent,
    moves: t.ctx.round1Moves,
    row: combatOpponent,
    switchTurnsWith: t.ctx.selfPlayer,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [t.ctx.round1Moves],
  })

  await GamePage.selectHistoryUnit({
    playerName: t.ctx.self.user.name,
    unitName: unitToMoveSelf.unit.name,
    row: combatSelf,
    round: 1,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [t.ctx.round1Moves],
    highlightedHistory: {
      playerName: t.ctx.self.user.name,
      round: 1,
      unitName: unitToMoveSelf.unit.name,
      row: combatSelf,
    },
    highlightedBattlefieldCard: {
      unitName: unitToMoveSelf.unit.name,
      row: combatSelf,
    },
  })

  await GamePage.selectHistoryUnit({
    playerName: t.ctx.self.user.name,
    unitName: unitToMoveSelf.unit.name,
    row: combatSelf,
    round: 1,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [t.ctx.round1Moves],
  })
})

test('Selecting self unit when turn on combat row highlights it and move in history', async (t) => {
  const sortedHandSelf = sortObjectArray({
    array: t.ctx.self.gameDeck.hand,
    sortProperties: ['unit.strength', 'unit.id'],
    reverse: true,
  })
  const unitToMoveSelf = sortedHandSelf[0]
  const combatSelf = unitToMoveSelf.unit.combats ? unitToMoveSelf.unit.combats[0] : Combat.Close

  await GamePage.moveUnit({
    unitName: unitToMoveSelf.unit.name,
    row: combatSelf,
  })
  E2eHelper.playUnit({
    player: t.ctx.selfPlayer,
    gameDeck: t.ctx.self.gameDeck,
    deckUnit: unitToMoveSelf,
    moves: t.ctx.round1Moves,
    row: combatSelf,
    switchTurnsWith: t.ctx.opponentPlayer,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [t.ctx.round1Moves],
  })

  const sortedHandOpponent = sortObjectArray({
    array: t.ctx.opponent.gameDeck.hand,
    sortProperties: ['unit.strength', 'unit.id'],
    reverse: true,
  })
  const unitToMoveOpponent = sortedHandOpponent[0]
  const combatOpponent = unitToMoveOpponent.unit.combats ? unitToMoveOpponent.unit.combats[0] : Combat.Close
  await t.ctx.opponent.client.playUnit({
    gameId: t.ctx.game.id,
    unitId: unitToMoveOpponent.unit.id,
    combat: combatOpponent,
  })
  E2eHelper.playUnit({
    player: t.ctx.opponentPlayer,
    gameDeck: t.ctx.opponent.gameDeck,
    deckUnit: unitToMoveOpponent,
    moves: t.ctx.round1Moves,
    row: combatOpponent,
    switchTurnsWith: t.ctx.selfPlayer,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [t.ctx.round1Moves],
  })

  await GamePage.selectBattlefieldCard({
    unitName: unitToMoveSelf.unit.name,
    row: combatSelf,
    self: true,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [t.ctx.round1Moves],
    highlightedHistory: {
      playerName: t.ctx.self.user.name,
      round: 1,
      unitName: unitToMoveSelf.unit.name,
      row: combatSelf,
    },
    highlightedBattlefieldCard: {
      unitName: unitToMoveSelf.unit.name,
      row: combatSelf,
    },
  })

  await GamePage.selectBattlefieldCard({
    unitName: unitToMoveSelf.unit.name,
    row: combatSelf,
    self: true,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [t.ctx.round1Moves],
  })
})

test('Selecting opponent unit when turn in history highlights it and card on battlefield', async (t) => {
  const sortedHandSelf = sortObjectArray({
    array: t.ctx.self.gameDeck.hand,
    sortProperties: ['unit.strength', 'unit.id'],
    reverse: true,
  })
  const unitToMoveSelf = sortedHandSelf[0]
  const combatSelf = unitToMoveSelf.unit.combats ? unitToMoveSelf.unit.combats[0] : Combat.Close

  await GamePage.moveUnit({
    unitName: unitToMoveSelf.unit.name,
    row: combatSelf,
  })
  E2eHelper.playUnit({
    player: t.ctx.selfPlayer,
    gameDeck: t.ctx.self.gameDeck,
    deckUnit: unitToMoveSelf,
    moves: t.ctx.round1Moves,
    row: combatSelf,
    switchTurnsWith: t.ctx.opponentPlayer,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [t.ctx.round1Moves],
  })

  const sortedHandOpponent = sortObjectArray({
    array: t.ctx.opponent.gameDeck.hand,
    sortProperties: ['unit.strength', 'unit.id'],
    reverse: true,
  })
  const unitToMoveOpponent = sortedHandOpponent[0]
  const combatOpponent = unitToMoveOpponent.unit.combats ? unitToMoveOpponent.unit.combats[0] : Combat.Close
  await t.ctx.opponent.client.playUnit({
    gameId: t.ctx.game.id,
    unitId: unitToMoveOpponent.unit.id,
    combat: combatOpponent,
  })
  E2eHelper.playUnit({
    player: t.ctx.opponentPlayer,
    gameDeck: t.ctx.opponent.gameDeck,
    deckUnit: unitToMoveOpponent,
    moves: t.ctx.round1Moves,
    row: combatOpponent,
    switchTurnsWith: t.ctx.selfPlayer,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [t.ctx.round1Moves],
  })

  await GamePage.selectHistoryUnit({
    playerName: t.ctx.opponent.user.name,
    unitName: unitToMoveOpponent.unit.name,
    row: combatOpponent,
    round: 1,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [t.ctx.round1Moves],
    highlightedHistory: {
      playerName: t.ctx.opponent.user.name,
      round: 1,
      unitName: unitToMoveOpponent.unit.name,
      row: combatOpponent,
    },
    highlightedBattlefieldCard: {
      unitName: unitToMoveOpponent.unit.name,
      row: combatOpponent,
    },
  })

  await GamePage.selectHistoryUnit({
    playerName: t.ctx.opponent.user.name,
    unitName: unitToMoveOpponent.unit.name,
    row: combatOpponent,
    round: 1,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [t.ctx.round1Moves],
  })
})

test('Selecting opponent unit when turn on combat row highlights it and move in history', async (t) => {
  const sortedHandSelf = sortObjectArray({
    array: t.ctx.self.gameDeck.hand,
    sortProperties: ['unit.strength', 'unit.id'],
    reverse: true,
  })
  const unitToMoveSelf = sortedHandSelf[0]
  const combatSelf = unitToMoveSelf.unit.combats ? unitToMoveSelf.unit.combats[0] : Combat.Close

  await GamePage.moveUnit({
    unitName: unitToMoveSelf.unit.name,
    row: combatSelf,
  })
  E2eHelper.playUnit({
    player: t.ctx.selfPlayer,
    gameDeck: t.ctx.self.gameDeck,
    deckUnit: unitToMoveSelf,
    moves: t.ctx.round1Moves,
    row: combatSelf,
    switchTurnsWith: t.ctx.opponentPlayer,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [t.ctx.round1Moves],
  })

  const sortedHandOpponent = sortObjectArray({
    array: t.ctx.opponent.gameDeck.hand,
    sortProperties: ['unit.strength', 'unit.id'],
    reverse: true,
  })
  const unitToMoveOpponent = sortedHandOpponent[0]
  const combatOpponent = unitToMoveOpponent.unit.combats ? unitToMoveOpponent.unit.combats[0] : Combat.Close
  await t.ctx.opponent.client.playUnit({
    gameId: t.ctx.game.id,
    unitId: unitToMoveOpponent.unit.id,
    combat: combatOpponent,
  })
  E2eHelper.playUnit({
    player: t.ctx.opponentPlayer,
    gameDeck: t.ctx.opponent.gameDeck,
    deckUnit: unitToMoveOpponent,
    moves: t.ctx.round1Moves,
    row: combatOpponent,
    switchTurnsWith: t.ctx.selfPlayer,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [t.ctx.round1Moves],
  })

  await GamePage.selectBattlefieldCard({
    unitName: unitToMoveOpponent.unit.name,
    row: combatOpponent,
    self: false,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [t.ctx.round1Moves],
    highlightedHistory: {
      playerName: t.ctx.opponent.user.name,
      round: 1,
      unitName: unitToMoveOpponent.unit.name,
      row: combatOpponent,
    },
    highlightedBattlefieldCard: {
      unitName: unitToMoveOpponent.unit.name,
      row: combatOpponent,
    },
  })

  await GamePage.selectBattlefieldCard({
    unitName: unitToMoveOpponent.unit.name,
    row: combatOpponent,
    self: false,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [t.ctx.round1Moves],
  })
})

test('Selecting opponent unit when not turn in history highlights it and card on battlefield', async (t) => {
  const sortedHandSelf = sortObjectArray({
    array: t.ctx.self.gameDeck.hand,
    sortProperties: ['unit.strength', 'unit.id'],
    reverse: true,
  })
  const unitToMoveSelf1 = sortedHandSelf[0]
  const combatSelf1 = unitToMoveSelf1.unit.combats ? unitToMoveSelf1.unit.combats[0] : Combat.Close

  await GamePage.moveUnit({
    unitName: unitToMoveSelf1.unit.name,
    row: combatSelf1,
  })
  E2eHelper.playUnit({
    player: t.ctx.selfPlayer,
    gameDeck: t.ctx.self.gameDeck,
    deckUnit: unitToMoveSelf1,
    moves: t.ctx.round1Moves,
    row: combatSelf1,
    switchTurnsWith: t.ctx.opponentPlayer,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [t.ctx.round1Moves],
  })

  const sortedHandOpponent = sortObjectArray({
    array: t.ctx.opponent.gameDeck.hand,
    sortProperties: ['unit.strength', 'unit.id'],
    reverse: true,
  })
  const unitToMoveOpponent = sortedHandOpponent[0]
  const combatOpponent = unitToMoveOpponent.unit.combats ? unitToMoveOpponent.unit.combats[0] : Combat.Close
  await t.ctx.opponent.client.playUnit({
    gameId: t.ctx.game.id,
    unitId: unitToMoveOpponent.unit.id,
    combat: combatOpponent,
  })
  E2eHelper.playUnit({
    player: t.ctx.opponentPlayer,
    gameDeck: t.ctx.opponent.gameDeck,
    deckUnit: unitToMoveOpponent,
    moves: t.ctx.round1Moves,
    row: combatOpponent,
    switchTurnsWith: t.ctx.selfPlayer,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [t.ctx.round1Moves],
  })

  const unitToMoveSelf2 = sortedHandSelf[1]
  const combatSelf2 = unitToMoveSelf2.unit.combats ? unitToMoveSelf2.unit.combats[0] : Combat.Close
  await GamePage.moveUnit({
    unitName: unitToMoveSelf2.unit.name,
    row: combatSelf2,
  })
  E2eHelper.playUnit({
    player: t.ctx.selfPlayer,
    gameDeck: t.ctx.self.gameDeck,
    deckUnit: unitToMoveSelf2,
    moves: t.ctx.round1Moves,
    row: combatSelf2,
    switchTurnsWith: t.ctx.opponentPlayer,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [t.ctx.round1Moves],
  })

  await GamePage.selectHistoryUnit({
    playerName: t.ctx.opponent.user.name,
    unitName: unitToMoveOpponent.unit.name,
    row: combatOpponent,
    round: 1,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [t.ctx.round1Moves],
    highlightedHistory: {
      playerName: t.ctx.opponent.user.name,
      round: 1,
      unitName: unitToMoveOpponent.unit.name,
      row: combatOpponent,
    },
    highlightedBattlefieldCard: {
      unitName: unitToMoveOpponent.unit.name,
      row: combatOpponent,
    },
  })

  await GamePage.selectHistoryUnit({
    playerName: t.ctx.opponent.user.name,
    unitName: unitToMoveOpponent.unit.name,
    row: combatOpponent,
    round: 1,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [t.ctx.round1Moves],
  })
})

test('Selecting opponent unit when not turn on combat row highlights it and move in history', async (t) => {
  const sortedHandSelf = sortObjectArray({
    array: t.ctx.self.gameDeck.hand,
    sortProperties: ['unit.strength', 'unit.id'],
    reverse: true,
  })
  const unitToMoveSelf1 = sortedHandSelf[0]
  const combatSelf1 = unitToMoveSelf1.unit.combats ? unitToMoveSelf1.unit.combats[0] : Combat.Close

  await GamePage.moveUnit({
    unitName: unitToMoveSelf1.unit.name,
    row: combatSelf1,
  })
  E2eHelper.playUnit({
    player: t.ctx.selfPlayer,
    gameDeck: t.ctx.self.gameDeck,
    deckUnit: unitToMoveSelf1,
    moves: t.ctx.round1Moves,
    row: combatSelf1,
    switchTurnsWith: t.ctx.opponentPlayer,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [t.ctx.round1Moves],
  })

  const sortedHandOpponent = sortObjectArray({
    array: t.ctx.opponent.gameDeck.hand,
    sortProperties: ['unit.strength', 'unit.id'],
    reverse: true,
  })
  const unitToMoveOpponent = sortedHandOpponent[0]
  const combatOpponent = unitToMoveOpponent.unit.combats ? unitToMoveOpponent.unit.combats[0] : Combat.Close
  await t.ctx.opponent.client.playUnit({
    gameId: t.ctx.game.id,
    unitId: unitToMoveOpponent.unit.id,
    combat: combatOpponent,
  })
  E2eHelper.playUnit({
    player: t.ctx.opponentPlayer,
    gameDeck: t.ctx.opponent.gameDeck,
    deckUnit: unitToMoveOpponent,
    moves: t.ctx.round1Moves,
    row: combatOpponent,
    switchTurnsWith: t.ctx.selfPlayer,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [t.ctx.round1Moves],
  })

  const unitToMoveSelf2 = sortedHandSelf[1]
  const combatSelf2 = unitToMoveSelf2.unit.combats ? unitToMoveSelf2.unit.combats[0] : Combat.Close
  await GamePage.moveUnit({
    unitName: unitToMoveSelf2.unit.name,
    row: combatSelf2,
  })
  E2eHelper.playUnit({
    player: t.ctx.selfPlayer,
    gameDeck: t.ctx.self.gameDeck,
    deckUnit: unitToMoveSelf2,
    moves: t.ctx.round1Moves,
    row: combatSelf2,
    switchTurnsWith: t.ctx.opponentPlayer,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [t.ctx.round1Moves],
  })

  await GamePage.selectBattlefieldCard({
    unitName: unitToMoveOpponent.unit.name,
    row: combatOpponent,
    self: false,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [t.ctx.round1Moves],
    highlightedHistory: {
      playerName: t.ctx.opponent.user.name,
      round: 1,
      unitName: unitToMoveOpponent.unit.name,
      row: combatOpponent,
    },
    highlightedBattlefieldCard: {
      unitName: unitToMoveOpponent.unit.name,
      row: combatOpponent,
    },
  })

  await GamePage.selectBattlefieldCard({
    unitName: unitToMoveOpponent.unit.name,
    row: combatOpponent,
    self: false,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [t.ctx.round1Moves],
  })
})

test('Select card from history and deselect from battlefield', async (t) => {
  const sortedHand = sortObjectArray({
    array: t.ctx.self.gameDeck.hand,
    sortProperties: ['unit.strength', 'unit.id'],
    reverse: true,
  })
  const unitToMove = sortedHand[0]
  const combat = unitToMove.unit.combats ? unitToMove.unit.combats[0] : Combat.Close

  await GamePage.moveUnit({
    unitName: unitToMove.unit.name,
    row: combat,
  })
  E2eHelper.playUnit({
    player: t.ctx.selfPlayer,
    gameDeck: t.ctx.self.gameDeck,
    deckUnit: unitToMove,
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

  await GamePage.selectHistoryUnit({
    playerName: t.ctx.self.user.name,
    unitName: unitToMove.unit.name,
    row: combat,
    round: 1,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [t.ctx.round1Moves],
    highlightedHistory: {
      playerName: t.ctx.self.user.name,
      round: 1,
      unitName: unitToMove.unit.name,
      row: combat,
    },
    highlightedBattlefieldCard: {
      unitName: unitToMove.unit.name,
      row: combat,
    },
  })

  await GamePage.selectBattlefieldCard({
    unitName: unitToMove.unit.name,
    row: combat,
    self: true,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [t.ctx.round1Moves],
  })
})

test('Select card from battlefield and deselect from history', async (t) => {
  const sortedHand = sortObjectArray({
    array: t.ctx.self.gameDeck.hand,
    sortProperties: ['unit.strength', 'unit.id'],
    reverse: true,
  })
  const unitToMove = sortedHand[0]
  const combat = unitToMove.unit.combats ? unitToMove.unit.combats[0] : Combat.Close

  await GamePage.moveUnit({
    unitName: unitToMove.unit.name,
    row: combat,
  })
  E2eHelper.playUnit({
    player: t.ctx.selfPlayer,
    gameDeck: t.ctx.self.gameDeck,
    deckUnit: unitToMove,
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

  await GamePage.selectBattlefieldCard({
    unitName: unitToMove.unit.name,
    row: combat,
    self: true,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [t.ctx.round1Moves],
    highlightedHistory: {
      playerName: t.ctx.self.user.name,
      round: 1,
      unitName: unitToMove.unit.name,
      row: combat,
    },
    highlightedBattlefieldCard: {
      unitName: unitToMove.unit.name,
      row: combat,
    },
  })

  await GamePage.selectHistoryUnit({
    playerName: t.ctx.self.user.name,
    unitName: unitToMove.unit.name,
    row: combat,
    round: 1,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [t.ctx.round1Moves],
  })
})

test('Select card from history deselects card selected in hand', async (t) => {
  const sortedHand = sortObjectArray({
    array: t.ctx.self.gameDeck.hand,
    sortProperties: ['unit.strength', 'unit.id'],
    reverse: true,
  })
  const unitToMove = sortedHand[0]
  const combat = unitToMove.unit.combats ? unitToMove.unit.combats[0] : Combat.Close
  const unitInHand = sortedHand[1]

  await GamePage.moveUnit({
    unitName: unitToMove.unit.name,
    row: combat,
  })
  E2eHelper.playUnit({
    player: t.ctx.selfPlayer,
    gameDeck: t.ctx.self.gameDeck,
    deckUnit: unitToMove,
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
    unitName: unitInHand.unit.name,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [t.ctx.round1Moves],
    highlightedHandCard: {
      unitName: unitInHand.unit.name,
      rows: unitInHand.unit.combats,
      dotted: true,
    },
  })

  await GamePage.selectHistoryUnit({
    playerName: t.ctx.self.user.name,
    unitName: unitToMove.unit.name,
    row: combat,
    round: 1,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [t.ctx.round1Moves],
    highlightedHistory: {
      playerName: t.ctx.self.user.name,
      round: 1,
      unitName: unitToMove.unit.name,
      row: combat,
    },
    highlightedBattlefieldCard: {
      unitName: unitToMove.unit.name,
      row: combat,
    },
  })
})

test('Select card from battlefield deselects card selected in hand', async (t) => {
  const sortedHand = sortObjectArray({
    array: t.ctx.self.gameDeck.hand,
    sortProperties: ['unit.strength', 'unit.id'],
    reverse: true,
  })
  const unitToMove = sortedHand[0]
  const combat = unitToMove.unit.combats ? unitToMove.unit.combats[0] : Combat.Close
  const unitInHand = sortedHand[1]

  await GamePage.moveUnit({
    unitName: unitToMove.unit.name,
    row: combat,
  })
  E2eHelper.playUnit({
    player: t.ctx.selfPlayer,
    gameDeck: t.ctx.self.gameDeck,
    deckUnit: unitToMove,
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
    unitName: unitInHand.unit.name,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [t.ctx.round1Moves],
    highlightedHandCard: {
      unitName: unitInHand.unit.name,
      rows: unitInHand.unit.combats,
      dotted: true,
    },
  })

  await GamePage.selectBattlefieldCard({
    unitName: unitToMove.unit.name,
    row: combat,
    self: true,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [t.ctx.round1Moves],
    highlightedHistory: {
      playerName: t.ctx.self.user.name,
      round: 1,
      unitName: unitToMove.unit.name,
      row: combat,
    },
    highlightedBattlefieldCard: {
      unitName: unitToMove.unit.name,
      row: combat,
    },
  })
})

test('Selecting history unit that is no longer on battlefield is dotted', async (t) => {
  let round = 1
  const sortedHandSelf = sortObjectArray({
    array: t.ctx.self.gameDeck.hand,
    sortProperties: ['unit.strength', 'unit.id'],
    reverse: true,
  })
  const unitToMoveSelf = sortedHandSelf[0]
  const combatSelf = unitToMoveSelf.unit.combats ? unitToMoveSelf.unit.combats[0] : Combat.Close

  await GamePage.moveUnit({
    unitName: unitToMoveSelf.unit.name,
    row: combatSelf,
  })
  E2eHelper.playUnit({
    player: t.ctx.selfPlayer,
    gameDeck: t.ctx.self.gameDeck,
    deckUnit: unitToMoveSelf,
    moves: t.ctx.round1Moves,
    row: combatSelf,
    switchTurnsWith: t.ctx.opponentPlayer,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [t.ctx.round1Moves],
  })

  await t.ctx.opponent.client.playPass({
    gameId: t.ctx.game.id,
  })
  E2eHelper.playPass({
    player: t.ctx.opponentPlayer,
    round,
    moves: t.ctx.round1Moves,
    switchTurnsWith: t.ctx.selfPlayer,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [t.ctx.round1Moves],
  })

  await GamePage.pass({})
  E2eHelper.playPass({
    player: t.ctx.selfPlayer,
    round,
    moves: t.ctx.round1Moves,
  })
  E2eHelper.endRound({
    self: t.ctx.selfPlayer,
    opponent: t.ctx.opponentPlayer,
    losers: [t.ctx.opponentPlayer],
  })
  round = 2
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves],
  })

  await GamePage.selectHistoryUnit({
    playerName: t.ctx.self.user.name,
    unitName: unitToMoveSelf.unit.name,
    row: combatSelf,
    round: 1,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves],
    highlightedHistory: {
      playerName: t.ctx.self.user.name,
      round: 1,
      unitName: unitToMoveSelf.unit.name,
      row: combatSelf,
      dotted: true,
    },
  })

  await GamePage.selectHistoryUnit({
    playerName: t.ctx.self.user.name,
    unitName: unitToMoveSelf.unit.name,
    row: combatSelf,
    round: 1,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves],
  })
})

test('Selecting combat card whose history entry is offscreen scrolls it into view', async (t) => {
  const { selfPlayedCards } = await E2eHelper.playStrongestCards({
    gameId: t.ctx.game.id,
    round: 1,
    self: {
      expected: t.ctx.selfPlayer,
      player: t.ctx.self,
    },
    opponent: {
      expected: t.ctx.opponentPlayer,
      player: t.ctx.opponent,
    },
    moves: t.ctx.round1Moves,
  })

  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [t.ctx.round1Moves],
  })

  const firstSelfUnit = selfPlayedCards[0]

  await GamePage.verifyHistoryUnitInViewport({
    historyItem: {
      playerName: t.ctx.self.user.name,
      round: 1,
      unitName: firstSelfUnit.name,
      row: firstSelfUnit.row,
    },
    inViewport: false,
  })

  await GamePage.selectBattlefieldCard({
    unitName: firstSelfUnit.name,
    row: firstSelfUnit.row,
    self: true,
  })

  await GamePage.verifyHistoryUnitInViewport({
    historyItem: {
      playerName: t.ctx.self.user.name,
      round: 1,
      unitName: firstSelfUnit.name,
      row: firstSelfUnit.row,
    },
    inViewport: true,
  })

  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [t.ctx.round1Moves],
    highlightedHistory: {
      playerName: t.ctx.self.user.name,
      round: 1,
      unitName: firstSelfUnit.name,
      row: firstSelfUnit.row,
    },
    highlightedBattlefieldCard: {
      unitName: firstSelfUnit.name,
      row: firstSelfUnit.row,
    },
  })
})
