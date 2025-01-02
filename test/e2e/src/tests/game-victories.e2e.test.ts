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

interface GameVictoriesTestCtx extends E2eCtx {
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
const fixture = getFixtureCtx<E2eCtx, GameVictoriesTestCtx>()
const test = getTestCtx<E2eCtx, GameVictoriesTestCtx>()

fixture('Game Victories')
  .page(HomePage.getUrl())
  .beforeEach(async (t) => {
    t.ctx.scenario = 'game-victories'
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
    })
    t.ctx.opponentPlayer = E2eHelper.getGamePlayer({
      player: t.ctx.opponent,
      ready: true,
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

test('Opponent passes ends in victory after 2 rounds', async (t) => {
  // round 1
  const sortedHand = sortObjectArray({
    array: t.ctx.self.gameDeck.hand,
    sortProperties: ['unit.strength', 'unit.id'],
    reverse: true,
  })
  const unit1 = sortedHand[0]
  const combat1 = unit1.unit.combats ? unit1.unit.combats[0] : Combat.Close
  await GamePage.moveUnit({
    unitName: unit1.unit.name,
    row: combat1,
  })
  t.ctx.selfPlayer.turn = undefined
  t.ctx.self.gameDeck.hand = t.ctx.self.gameDeck.hand.filter((card) => card.unit.id !== unit1.unit.id)
  t.ctx.selfPlayer.hand = 9
  t.ctx.selfPlayer.score = unit1.unit.strength || 0
  E2eHelper.addUnitToGamePlayer({
    player: t.ctx.selfPlayer,
    row: combat1,
    score: unit1.unit.strength || 0,
    unitName: unit1.unit.name,
  })
  t.ctx.opponentPlayer.turn = PlayerTurn.Current
  t.ctx.round1Moves.push({
    userName: t.ctx.self.user.name,
    unitName: unit1.unit.name,
    combatRow: combat1,
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
  t.ctx.selfPlayer.turn = PlayerTurn.Current
  t.ctx.opponentPlayer.passed = true
  t.ctx.opponentPlayer.turn = undefined
  t.ctx.round1Moves.push({
    userName: t.ctx.opponent.user.name,
    round: 1,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round: 1,
    moves: [t.ctx.round1Moves],
  })

  await GamePage.pass({})
  t.ctx.selfPlayer.score = 0
  t.ctx.selfPlayer.discard = 1
  E2eHelper.resetPlayerCombatRow({
    player: t.ctx.selfPlayer,
    row: combat1,
  })
  t.ctx.opponentPlayer.losses = 1
  t.ctx.opponentPlayer.passed = undefined
  t.ctx.round1Moves.push({
    userName: t.ctx.self.user.name,
    round: 1,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round: 2,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves],
  })

  // round 2
  const unit2 = sortedHand[1]
  const combat2 = unit2.unit.combats ? unit2.unit.combats[0] : Combat.Close
  await GamePage.moveUnit({
    unitName: unit2.unit.name,
    row: combat2,
  })
  t.ctx.self.gameDeck.hand = t.ctx.self.gameDeck.hand.filter((card) => card.unit.id !== unit2.unit.id)
  t.ctx.selfPlayer.turn = undefined
  t.ctx.selfPlayer.hand = 8
  t.ctx.selfPlayer.score += unit2.unit.strength || 0
  E2eHelper.addUnitToGamePlayer({
    player: t.ctx.selfPlayer,
    row: combat2,
    score: unit2.unit.strength || 0,
    unitName: unit2.unit.name,
  })
  t.ctx.opponentPlayer.turn = PlayerTurn.Current
  t.ctx.round2Moves.push({
    userName: t.ctx.self.user.name,
    unitName: unit2.unit.name,
    combatRow: combat2,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round: 2,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves],
  })

  await t.ctx.opponent.client.playPass({
    gameId: t.ctx.game.id,
  })
  t.ctx.selfPlayer.turn = PlayerTurn.Current
  t.ctx.opponentPlayer.turn = undefined
  t.ctx.opponentPlayer.passed = true
  t.ctx.round2Moves.push({
    userName: t.ctx.opponent.user.name,
    round: 2,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round: 2,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves],
  })

  await GamePage.pass({})
  t.ctx.selfPlayer.turn = undefined
  t.ctx.selfPlayer.passed = true
  t.ctx.selfPlayer.discard = 2
  E2eHelper.resetPlayerCombatRow({
    player: t.ctx.selfPlayer,
    row: combat2,
  })
  t.ctx.opponentPlayer.losses = 2
  t.ctx.round2Moves.push({
    userName: t.ctx.self.user.name,
    round: 2,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round: 2,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves],
    victors: [t.ctx.self.user.name],
    rounds: [
      {
        self: unit1.unit.strength || 0,
        opponent: 0,
      },
      {
        self: unit2.unit.strength || 0,
        opponent: 0,
      },
    ],
  })
})

test('Self passes ends in loss after 2 rounds', async (t) => {
  // round 1
  await GamePage.pass({})
  t.ctx.selfPlayer.passed = true
  t.ctx.selfPlayer.turn = undefined
  t.ctx.opponentPlayer.turn = PlayerTurn.Current
  t.ctx.round1Moves.push({
    userName: t.ctx.self.user.name,
    round: 1,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [t.ctx.round1Moves],
  })

  const sortedHand = sortObjectArray({
    array: t.ctx.opponent.gameDeck.hand,
    sortProperties: ['unit.strength', 'unit.id'],
    reverse: true,
  })
  const unit1 = sortedHand[0]
  const combat1 = unit1.unit.combats ? unit1.unit.combats[0] : Combat.Close
  await t.ctx.opponent.client.playUnit({
    gameId: t.ctx.game.id,
    unitId: unit1.unit.id,
    combat: combat1,
  })
  t.ctx.opponentPlayer.hand = 9
  t.ctx.opponentPlayer.score = unit1.unit.strength || 0
  E2eHelper.addUnitToGamePlayer({
    player: t.ctx.opponentPlayer,
    row: combat1,
    score: unit1.unit.strength || 0,
    unitName: unit1.unit.name,
  })
  t.ctx.round1Moves.push({
    userName: t.ctx.opponent.user.name,
    unitName: unit1.unit.name,
    combatRow: combat1,
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
  t.ctx.selfPlayer.losses = 1
  t.ctx.selfPlayer.passed = undefined
  t.ctx.opponentPlayer.score = 0
  t.ctx.opponentPlayer.discard = 1
  E2eHelper.resetPlayerCombatRow({
    player: t.ctx.opponentPlayer,
    row: combat1,
  })
  t.ctx.round1Moves.push({
    userName: t.ctx.opponent.user.name,
    round: 1,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round: 2,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves],
  })

  // round 2
  const unit2 = sortedHand[1]
  const combat2 = unit2.unit.combats ? unit2.unit.combats[0] : Combat.Close
  await t.ctx.opponent.client.playUnit({
    gameId: t.ctx.game.id,
    unitId: unit2.unit.id,
    combat: combat2,
  })
  t.ctx.selfPlayer.turn = PlayerTurn.Current
  t.ctx.opponentPlayer.hand = 8
  t.ctx.opponentPlayer.score += unit2.unit.strength || 0
  t.ctx.opponentPlayer.turn = undefined
  E2eHelper.addUnitToGamePlayer({
    player: t.ctx.opponentPlayer,
    row: combat2,
    score: unit2.unit.strength || 0,
    unitName: unit2.unit.name,
  })
  t.ctx.round2Moves.push({
    userName: t.ctx.opponent.user.name,
    unitName: unit2.unit.name,
    combatRow: combat2,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round: 2,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves],
  })

  await GamePage.pass({})
  t.ctx.selfPlayer.passed = true
  t.ctx.selfPlayer.turn = undefined
  t.ctx.opponentPlayer.turn = PlayerTurn.Current
  t.ctx.round2Moves.push({
    userName: t.ctx.self.user.name,
    round: 2,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round: 2,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves],
  })

  await t.ctx.opponent.client.playPass({
    gameId: t.ctx.game.id,
  })
  t.ctx.opponentPlayer.passed = true
  t.ctx.opponentPlayer.turn = undefined
  t.ctx.opponentPlayer.discard = 2
  t.ctx.selfPlayer.losses = 2
  E2eHelper.resetPlayerCombatRow({
    player: t.ctx.opponentPlayer,
    row: combat2,
  })
  t.ctx.round2Moves.push({
    userName: t.ctx.opponent.user.name,
    round: 2,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round: 2,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves],
    victors: [t.ctx.opponent.user.name],
    rounds: [
      {
        self: 0,
        opponent: unit1.unit.strength || 0,
      },
      {
        self: 0,
        opponent: unit2.unit.strength || 0,
      },
    ],
  })
})

test('All passes ends in tie after 2 rounds', async (t) => {
  // round 1
  await GamePage.pass({})
  t.ctx.selfPlayer.turn = undefined
  t.ctx.selfPlayer.passed = true
  t.ctx.opponentPlayer.turn = PlayerTurn.Current
  t.ctx.round1Moves.push({
    userName: t.ctx.self.user.name,
    round: 1,
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
  t.ctx.selfPlayer.passed = false
  t.ctx.selfPlayer.losses = 1
  t.ctx.opponentPlayer.losses = 1
  t.ctx.round1Moves.push({
    userName: t.ctx.opponent.user.name,
    round: 1,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round: 2,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves],
  })

  // round 2
  await t.ctx.opponent.client.playPass({
    gameId: t.ctx.game.id,
  })
  t.ctx.selfPlayer.turn = PlayerTurn.Current
  t.ctx.opponentPlayer.turn = undefined
  t.ctx.opponentPlayer.passed = true
  t.ctx.round2Moves.push({
    userName: t.ctx.opponent.user.name,
    round: 2,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round: 2,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves],
  })

  await GamePage.pass({})
  t.ctx.selfPlayer.turn = undefined
  t.ctx.selfPlayer.passed = true
  t.ctx.selfPlayer.losses = 2
  t.ctx.opponentPlayer.losses = 2
  t.ctx.round2Moves.push({
    userName: t.ctx.self.user.name,
    round: 2,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round: 2,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves],
    victors: [t.ctx.self.user.name, t.ctx.opponent.user.name],
    rounds: [
      {
        self: 0,
        opponent: 0,
      },
      {
        self: 0,
        opponent: 0,
      },
    ],
  })
})

test('Win loss win ends in victory', async (t) => {
  // round 1
  const sortedHandSelf = sortObjectArray({
    array: t.ctx.self.gameDeck.hand,
    sortProperties: ['unit.strength', 'unit.id'],
    reverse: true,
  })
  const unitSelf1 = sortedHandSelf[0]
  const combatSelf1 = unitSelf1.unit.combats ? unitSelf1.unit.combats[0] : Combat.Close
  await GamePage.moveUnit({
    unitName: unitSelf1.unit.name,
    row: combatSelf1,
  })
  t.ctx.selfPlayer.turn = undefined
  t.ctx.self.gameDeck.hand = t.ctx.self.gameDeck.hand.filter((card) => card.unit.id !== unitSelf1.unit.id)
  t.ctx.selfPlayer.hand = 9
  t.ctx.selfPlayer.score = unitSelf1.unit.strength || 0
  E2eHelper.addUnitToGamePlayer({
    player: t.ctx.selfPlayer,
    row: combatSelf1,
    score: unitSelf1.unit.strength || 0,
    unitName: unitSelf1.unit.name,
  })
  t.ctx.opponentPlayer.turn = PlayerTurn.Current
  t.ctx.round1Moves.push({
    userName: t.ctx.self.user.name,
    unitName: unitSelf1.unit.name,
    combatRow: combatSelf1,
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
  t.ctx.selfPlayer.turn = PlayerTurn.Current
  t.ctx.opponentPlayer.passed = true
  t.ctx.opponentPlayer.turn = undefined
  t.ctx.round1Moves.push({
    userName: t.ctx.opponent.user.name,
    round: 1,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round: 1,
    moves: [t.ctx.round1Moves],
  })

  await GamePage.pass({})
  t.ctx.selfPlayer.score = 0
  E2eHelper.resetPlayerCombatRow({
    player: t.ctx.selfPlayer,
    row: combatSelf1,
  })
  t.ctx.selfPlayer.discard = 1
  t.ctx.opponentPlayer.losses = 1
  t.ctx.opponentPlayer.passed = undefined
  t.ctx.round1Moves.push({
    userName: t.ctx.self.user.name,
    round: 1,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round: 2,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves],
  })

  // round 2
  await GamePage.pass({})
  t.ctx.selfPlayer.passed = true
  t.ctx.selfPlayer.turn = undefined
  t.ctx.opponentPlayer.turn = PlayerTurn.Current
  t.ctx.round2Moves.push({
    userName: t.ctx.self.user.name,
    round: 2,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round: 2,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves],
  })

  const sortedHandOpponent = sortObjectArray({
    array: t.ctx.opponent.gameDeck.hand,
    sortProperties: ['unit.strength', 'unit.id'],
    reverse: true,
  })
  const unitOpponent1 = sortedHandOpponent[0]
  const combatOpponent1 = unitOpponent1.unit.combats ? unitOpponent1.unit.combats[0] : Combat.Close
  await t.ctx.opponent.client.playUnit({
    gameId: t.ctx.game.id,
    unitId: unitOpponent1.unit.id,
    combat: combatOpponent1,
  })
  t.ctx.opponentPlayer.hand = 9
  t.ctx.opponentPlayer.score = unitOpponent1.unit.strength || 0
  E2eHelper.addUnitToGamePlayer({
    player: t.ctx.opponentPlayer,
    row: combatOpponent1,
    score: unitOpponent1.unit.strength || 0,
    unitName: unitOpponent1.unit.name,
  })
  t.ctx.round2Moves.push({
    userName: t.ctx.opponent.user.name,
    unitName: unitOpponent1.unit.name,
    combatRow: combatOpponent1,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round: 2,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves],
  })

  await t.ctx.opponent.client.playPass({
    gameId: t.ctx.game.id,
  })
  t.ctx.selfPlayer.passed = undefined
  t.ctx.selfPlayer.score = 0
  t.ctx.selfPlayer.losses = 1
  t.ctx.opponentPlayer.score = 0
  t.ctx.opponentPlayer.discard = 1
  E2eHelper.resetPlayerCombatRow({
    player: t.ctx.opponentPlayer,
    row: combatOpponent1,
  })
  t.ctx.round2Moves.push({
    userName: t.ctx.opponent.user.name,
    round: 2,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round: 3,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves, t.ctx.round3Moves],
  })

  // round 3
  await t.ctx.opponent.client.playPass({
    gameId: t.ctx.game.id,
  })
  t.ctx.opponentPlayer.passed = true
  t.ctx.opponentPlayer.turn = undefined
  t.ctx.selfPlayer.turn = PlayerTurn.Current
  t.ctx.round3Moves.push({
    userName: t.ctx.opponent.user.name,
    round: 3,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round: 3,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves, t.ctx.round3Moves],
  })

  const unitSelf2 = sortedHandSelf[1]
  const combatSelf2 = unitSelf2.unit.combats ? unitSelf2.unit.combats[0] : Combat.Close
  await GamePage.moveUnit({
    unitName: unitSelf2.unit.name,
    row: combatSelf2,
  })
  t.ctx.self.gameDeck.hand = t.ctx.self.gameDeck.hand.filter((card) => card.unit.id !== unitSelf2.unit.id)
  t.ctx.selfPlayer.hand = 8
  t.ctx.selfPlayer.score = unitSelf2.unit.strength || 0
  E2eHelper.addUnitToGamePlayer({
    player: t.ctx.selfPlayer,
    row: combatSelf2,
    score: unitSelf2.unit.strength || 0,
    unitName: unitSelf2.unit.name,
  })
  t.ctx.round3Moves.push({
    userName: t.ctx.self.user.name,
    unitName: unitSelf2.unit.name,
    combatRow: combatSelf2,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round: 3,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves, t.ctx.round3Moves],
  })

  await GamePage.pass({})
  t.ctx.selfPlayer.turn = undefined
  t.ctx.selfPlayer.passed = true
  t.ctx.selfPlayer.discard = 2
  t.ctx.opponentPlayer.losses = 2
  t.ctx.round3Moves.push({
    userName: t.ctx.self.user.name,
    round: 3,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round: 3,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves, t.ctx.round3Moves],
    victors: [t.ctx.self.user.name],
    rounds: [
      {
        self: unitSelf1.unit.strength || 0,
        opponent: 0,
      },
      {
        self: 0,
        opponent: unitOpponent1.unit.strength || 0,
      },
      {
        self: unitSelf2.unit.strength || 0,
        opponent: 0,
      },
    ],
  })
})

test('Win loss loss ends in defeat', async (t) => {
  // round 1
  const sortedHandSelf = sortObjectArray({
    array: t.ctx.self.gameDeck.hand,
    sortProperties: ['unit.strength', 'unit.id'],
    reverse: true,
  })
  const unitSelf1 = sortedHandSelf[0]
  const combatSelf1 = unitSelf1.unit.combats ? unitSelf1.unit.combats[0] : Combat.Close
  await GamePage.moveUnit({
    unitName: unitSelf1.unit.name,
    row: combatSelf1,
  })
  t.ctx.selfPlayer.turn = undefined
  t.ctx.self.gameDeck.hand = t.ctx.self.gameDeck.hand.filter((card) => card.unit.id !== unitSelf1.unit.id)
  t.ctx.selfPlayer.hand = 9
  t.ctx.selfPlayer.score = unitSelf1.unit.strength || 0
  E2eHelper.addUnitToGamePlayer({
    player: t.ctx.selfPlayer,
    row: combatSelf1,
    score: unitSelf1.unit.strength || 0,
    unitName: unitSelf1.unit.name,
  })
  t.ctx.opponentPlayer.turn = PlayerTurn.Current
  t.ctx.round1Moves.push({
    userName: t.ctx.self.user.name,
    unitName: unitSelf1.unit.name,
    combatRow: combatSelf1,
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
  t.ctx.selfPlayer.turn = PlayerTurn.Current
  t.ctx.opponentPlayer.passed = true
  t.ctx.opponentPlayer.turn = undefined
  t.ctx.round1Moves.push({
    userName: t.ctx.opponent.user.name,
    round: 1,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round: 1,
    moves: [t.ctx.round1Moves],
  })

  await GamePage.pass({})
  t.ctx.selfPlayer.score = 0
  t.ctx.selfPlayer.discard = 1
  E2eHelper.resetPlayerCombatRow({
    player: t.ctx.selfPlayer,
    row: combatSelf1,
  })
  t.ctx.opponentPlayer.losses = 1
  t.ctx.opponentPlayer.passed = undefined
  t.ctx.round1Moves.push({
    userName: t.ctx.self.user.name,
    round: 1,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round: 2,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves],
  })

  // round 2
  await GamePage.pass({})
  t.ctx.selfPlayer.passed = true
  t.ctx.selfPlayer.turn = undefined
  t.ctx.opponentPlayer.turn = PlayerTurn.Current
  t.ctx.round2Moves.push({
    userName: t.ctx.self.user.name,
    round: 2,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round: 2,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves],
  })

  const sortedHandOpponent = sortObjectArray({
    array: t.ctx.opponent.gameDeck.hand,
    sortProperties: ['unit.strength', 'unit.id'],
    reverse: true,
  })
  const unitOpponent1 = sortedHandOpponent[0]
  const combatOpponent1 = unitOpponent1.unit.combats ? unitOpponent1.unit.combats[0] : Combat.Close
  await t.ctx.opponent.client.playUnit({
    gameId: t.ctx.game.id,
    unitId: unitOpponent1.unit.id,
    combat: combatOpponent1,
  })
  t.ctx.opponentPlayer.hand = 9
  t.ctx.opponentPlayer.score = unitOpponent1.unit.strength || 0
  E2eHelper.addUnitToGamePlayer({
    player: t.ctx.opponentPlayer,
    row: combatOpponent1,
    score: unitOpponent1.unit.strength || 0,
    unitName: unitOpponent1.unit.name,
  })
  t.ctx.round2Moves.push({
    userName: t.ctx.opponent.user.name,
    unitName: unitOpponent1.unit.name,
    combatRow: combatOpponent1,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round: 2,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves],
  })

  await t.ctx.opponent.client.playPass({
    gameId: t.ctx.game.id,
  })
  t.ctx.selfPlayer.passed = undefined
  t.ctx.selfPlayer.score = 0
  t.ctx.selfPlayer.losses = 1
  t.ctx.opponentPlayer.score = 0
  t.ctx.opponentPlayer.discard = 1
  E2eHelper.resetPlayerCombatRow({
    player: t.ctx.opponentPlayer,
    row: combatOpponent1,
  })
  t.ctx.round2Moves.push({
    userName: t.ctx.opponent.user.name,
    round: 2,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round: 3,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves, t.ctx.round3Moves],
  })

  // round 3
  const unitOpponent2 = sortedHandOpponent[1]
  const combatOpponent2 = unitOpponent2.unit.combats ? unitOpponent2.unit.combats[0] : Combat.Close
  await t.ctx.opponent.client.playUnit({
    gameId: t.ctx.game.id,
    unitId: unitOpponent2.unit.id,
    combat: combatOpponent2,
  })
  t.ctx.selfPlayer.turn = PlayerTurn.Current
  t.ctx.opponentPlayer.turn = undefined
  t.ctx.opponentPlayer.hand = 8
  t.ctx.opponentPlayer.score = unitOpponent2.unit.strength || 0
  E2eHelper.addUnitToGamePlayer({
    player: t.ctx.opponentPlayer,
    row: combatOpponent2,
    score: unitOpponent2.unit.strength || 0,
    unitName: unitOpponent2.unit.name,
  })
  t.ctx.round3Moves.push({
    userName: t.ctx.opponent.user.name,
    unitName: unitOpponent2.unit.name,
    combatRow: combatOpponent2,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round: 3,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves, t.ctx.round3Moves],
  })

  await GamePage.pass({})
  t.ctx.selfPlayer.turn = undefined
  t.ctx.selfPlayer.passed = true
  t.ctx.opponentPlayer.turn = PlayerTurn.Current
  t.ctx.round3Moves.push({
    userName: t.ctx.self.user.name,
    round: 3,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round: 3,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves, t.ctx.round3Moves],
  })

  await t.ctx.opponent.client.playPass({
    gameId: t.ctx.game.id,
  })
  t.ctx.selfPlayer.losses = 2
  t.ctx.opponentPlayer.turn = undefined
  t.ctx.opponentPlayer.passed = true
  t.ctx.opponentPlayer.discard = 2
  E2eHelper.resetPlayerCombatRow({
    player: t.ctx.opponentPlayer,
    row: combatOpponent2,
  })
  t.ctx.round3Moves.push({
    userName: t.ctx.opponent.user.name,
    round: 3,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round: 3,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves, t.ctx.round3Moves],
    victors: [t.ctx.opponent.user.name],
    rounds: [
      {
        self: unitSelf1.unit.strength || 0,
        opponent: 0,
      },
      {
        self: 0,
        opponent: unitOpponent1.unit.strength || 0,
      },
      {
        self: 0,
        opponent: unitOpponent2.unit.strength || 0,
      },
    ],
  })
})

test('Win loss tie ends in tie', async (t) => {
  // round 1
  const sortedHandSelf = sortObjectArray({
    array: t.ctx.self.gameDeck.hand,
    sortProperties: ['unit.strength', 'unit.id'],
    reverse: true,
  })
  const unitSelf1 = sortedHandSelf[0]
  const combatSelf1 = unitSelf1.unit.combats ? unitSelf1.unit.combats[0] : Combat.Close
  await GamePage.moveUnit({
    unitName: unitSelf1.unit.name,
    row: combatSelf1,
  })
  t.ctx.selfPlayer.turn = undefined
  t.ctx.self.gameDeck.hand = t.ctx.self.gameDeck.hand.filter((card) => card.unit.id !== unitSelf1.unit.id)
  t.ctx.selfPlayer.hand = 9
  t.ctx.selfPlayer.score = unitSelf1.unit.strength || 0
  E2eHelper.addUnitToGamePlayer({
    player: t.ctx.selfPlayer,
    row: combatSelf1,
    score: unitSelf1.unit.strength || 0,
    unitName: unitSelf1.unit.name,
  })
  t.ctx.opponentPlayer.turn = PlayerTurn.Current
  t.ctx.round1Moves.push({
    userName: t.ctx.self.user.name,
    unitName: unitSelf1.unit.name,
    combatRow: combatSelf1,
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
  t.ctx.selfPlayer.turn = PlayerTurn.Current
  t.ctx.opponentPlayer.passed = true
  t.ctx.opponentPlayer.turn = undefined
  t.ctx.round1Moves.push({
    userName: t.ctx.opponent.user.name,
    round: 1,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round: 1,
    moves: [t.ctx.round1Moves],
  })

  await GamePage.pass({})
  t.ctx.selfPlayer.score = 0
  t.ctx.selfPlayer.discard = 1
  E2eHelper.resetPlayerCombatRow({
    player: t.ctx.selfPlayer,
    row: combatSelf1,
  })
  t.ctx.opponentPlayer.losses = 1
  t.ctx.opponentPlayer.passed = undefined
  t.ctx.round1Moves.push({
    userName: t.ctx.self.user.name,
    round: 1,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round: 2,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves],
  })

  // round 2
  await GamePage.pass({})
  t.ctx.selfPlayer.passed = true
  t.ctx.selfPlayer.turn = undefined
  t.ctx.opponentPlayer.turn = PlayerTurn.Current
  t.ctx.round2Moves.push({
    userName: t.ctx.self.user.name,
    round: 2,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round: 2,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves],
  })

  const sortedHandOpponent = sortObjectArray({
    array: t.ctx.opponent.gameDeck.hand,
    sortProperties: ['unit.strength', 'unit.id'],
    reverse: true,
  })
  const unitOpponent1 = sortedHandOpponent[0]
  const combatOpponent1 = unitOpponent1.unit.combats ? unitOpponent1.unit.combats[0] : Combat.Close
  await t.ctx.opponent.client.playUnit({
    gameId: t.ctx.game.id,
    unitId: unitOpponent1.unit.id,
    combat: combatOpponent1,
  })
  t.ctx.opponentPlayer.hand = 9
  t.ctx.opponentPlayer.score = unitOpponent1.unit.strength || 0
  E2eHelper.addUnitToGamePlayer({
    player: t.ctx.opponentPlayer,
    row: combatOpponent1,
    score: unitOpponent1.unit.strength || 0,
    unitName: unitOpponent1.unit.name,
  })
  t.ctx.round2Moves.push({
    userName: t.ctx.opponent.user.name,
    unitName: unitOpponent1.unit.name,
    combatRow: combatOpponent1,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round: 2,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves],
  })

  await t.ctx.opponent.client.playPass({
    gameId: t.ctx.game.id,
  })
  t.ctx.selfPlayer.passed = undefined
  t.ctx.selfPlayer.score = 0
  t.ctx.selfPlayer.losses = 1
  t.ctx.opponentPlayer.score = 0
  t.ctx.opponentPlayer.discard = 1
  E2eHelper.resetPlayerCombatRow({
    player: t.ctx.opponentPlayer,
    row: combatOpponent1,
  })
  t.ctx.round2Moves.push({
    userName: t.ctx.opponent.user.name,
    round: 2,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round: 3,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves, t.ctx.round3Moves],
  })

  // round 3
  await t.ctx.opponent.client.playPass({
    gameId: t.ctx.game.id,
  })
  t.ctx.selfPlayer.turn = PlayerTurn.Current
  t.ctx.opponentPlayer.turn = undefined
  t.ctx.opponentPlayer.passed = true
  t.ctx.round3Moves.push({
    userName: t.ctx.opponent.user.name,
    round: 3,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round: 3,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves, t.ctx.round3Moves],
  })

  await GamePage.pass({})
  t.ctx.selfPlayer.turn = undefined
  t.ctx.selfPlayer.passed = true
  t.ctx.selfPlayer.losses = 2
  t.ctx.opponentPlayer.losses = 2
  t.ctx.round3Moves.push({
    userName: t.ctx.self.user.name,
    round: 3,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round: 3,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves, t.ctx.round3Moves],
    victors: [t.ctx.self.user.name, t.ctx.opponent.user.name],
    rounds: [
      {
        self: unitSelf1.unit.strength || 0,
        opponent: 0,
      },
      {
        self: 0,
        opponent: unitOpponent1.unit.strength || 0,
      },
      {
        self: 0,
        opponent: 0,
      },
    ],
  })
})

test('Loss win win ends in victory', async (t) => {
  // round 1
  await GamePage.pass({})
  t.ctx.selfPlayer.passed = true
  t.ctx.selfPlayer.turn = undefined
  t.ctx.opponentPlayer.turn = PlayerTurn.Current
  t.ctx.round1Moves.push({
    userName: t.ctx.self.user.name,
    round: 1,
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
  const unitOpponent1 = sortedHandOpponent[0]
  const combatOpponent1 = unitOpponent1.unit.combats ? unitOpponent1.unit.combats[0] : Combat.Close
  await t.ctx.opponent.client.playUnit({
    gameId: t.ctx.game.id,
    unitId: unitOpponent1.unit.id,
    combat: combatOpponent1,
  })
  t.ctx.opponentPlayer.hand = 9
  t.ctx.opponentPlayer.score = unitOpponent1.unit.strength || 0
  E2eHelper.addUnitToGamePlayer({
    player: t.ctx.opponentPlayer,
    row: combatOpponent1,
    score: unitOpponent1.unit.strength || 0,
    unitName: unitOpponent1.unit.name,
  })
  t.ctx.round1Moves.push({
    userName: t.ctx.opponent.user.name,
    unitName: unitOpponent1.unit.name,
    combatRow: combatOpponent1,
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
  t.ctx.selfPlayer.passed = undefined
  t.ctx.selfPlayer.score = 0
  t.ctx.selfPlayer.losses = 1
  t.ctx.opponentPlayer.score = 0
  t.ctx.opponentPlayer.discard = 1
  E2eHelper.resetPlayerCombatRow({
    player: t.ctx.opponentPlayer,
    row: combatOpponent1,
  })
  t.ctx.round1Moves.push({
    userName: t.ctx.opponent.user.name,
    round: 1,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round: 2,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves],
  })

  // round 2
  await t.ctx.opponent.client.playPass({
    gameId: t.ctx.game.id,
  })
  t.ctx.selfPlayer.turn = PlayerTurn.Current
  t.ctx.opponentPlayer.turn = undefined
  t.ctx.opponentPlayer.passed = true
  t.ctx.round2Moves.push({
    userName: t.ctx.opponent.user.name,
    round: 2,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round: 2,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves],
  })

  const sortedHandSelf = sortObjectArray({
    array: t.ctx.self.gameDeck.hand,
    sortProperties: ['unit.strength', 'unit.id'],
    reverse: true,
  })
  const unitSelf1 = sortedHandSelf[0]
  const combatSelf1 = unitSelf1.unit.combats ? unitSelf1.unit.combats[0] : Combat.Close
  await GamePage.moveUnit({
    unitName: unitSelf1.unit.name,
    row: combatSelf1,
  })
  t.ctx.self.gameDeck.hand = t.ctx.self.gameDeck.hand.filter((card) => card.unit.id !== unitSelf1.unit.id)
  t.ctx.selfPlayer.hand = 9
  t.ctx.selfPlayer.score = unitSelf1.unit.strength || 0
  E2eHelper.addUnitToGamePlayer({
    player: t.ctx.selfPlayer,
    row: combatSelf1,
    score: unitSelf1.unit.strength || 0,
    unitName: unitSelf1.unit.name,
  })
  t.ctx.round2Moves.push({
    userName: t.ctx.self.user.name,
    unitName: unitSelf1.unit.name,
    combatRow: combatSelf1,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round: 2,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves],
  })

  await GamePage.pass({})
  t.ctx.selfPlayer.score = 0
  t.ctx.selfPlayer.discard = 1
  E2eHelper.resetPlayerCombatRow({
    player: t.ctx.selfPlayer,
    row: combatSelf1,
  })
  t.ctx.opponentPlayer.passed = undefined
  t.ctx.opponentPlayer.losses = 1
  t.ctx.round2Moves.push({
    userName: t.ctx.self.user.name,
    round: 2,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round: 3,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves, t.ctx.round3Moves],
  })

  // round 3
  const unitSelf2 = sortedHandSelf[1]
  const combatSelf2 = unitSelf2.unit.combats ? unitSelf2.unit.combats[0] : Combat.Close
  await GamePage.moveUnit({
    unitName: unitSelf2.unit.name,
    row: combatSelf2,
  })
  t.ctx.self.gameDeck.hand = t.ctx.self.gameDeck.hand.filter((card) => card.unit.id !== unitSelf2.unit.id)
  t.ctx.selfPlayer.hand = 8
  t.ctx.selfPlayer.score = unitSelf2.unit.strength || 0
  t.ctx.selfPlayer.turn = undefined
  E2eHelper.addUnitToGamePlayer({
    player: t.ctx.selfPlayer,
    row: combatSelf2,
    score: unitSelf2.unit.strength || 0,
    unitName: unitSelf2.unit.name,
  })
  t.ctx.opponentPlayer.turn = PlayerTurn.Current
  t.ctx.round3Moves.push({
    userName: t.ctx.self.user.name,
    unitName: unitSelf2.unit.name,
    combatRow: combatSelf2,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round: 3,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves, t.ctx.round3Moves],
  })

  await t.ctx.opponent.client.playPass({
    gameId: t.ctx.game.id,
  })
  t.ctx.selfPlayer.turn = PlayerTurn.Current
  t.ctx.opponentPlayer.turn = undefined
  t.ctx.opponentPlayer.passed = true
  t.ctx.round3Moves.push({
    userName: t.ctx.opponent.user.name,
    round: 3,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round: 3,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves, t.ctx.round3Moves],
  })

  await GamePage.pass({})
  t.ctx.selfPlayer.turn = undefined
  t.ctx.selfPlayer.passed = true
  t.ctx.selfPlayer.discard = 2
  E2eHelper.resetPlayerCombatRow({
    player: t.ctx.selfPlayer,
    row: combatSelf2,
  })
  t.ctx.opponentPlayer.losses = 2
  t.ctx.round3Moves.push({
    userName: t.ctx.self.user.name,
    round: 3,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round: 3,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves, t.ctx.round3Moves],
    victors: [t.ctx.self.user.name],
    rounds: [
      {
        self: 0,
        opponent: unitOpponent1.unit.strength || 0,
      },
      {
        self: unitSelf1.unit.strength || 0,
        opponent: 0,
      },
      {
        self: unitSelf2.unit.strength || 0,
        opponent: 0,
      },
    ],
  })
})

test('Loss win loss ends in defeat', async (t) => {
  // round 1
  await GamePage.pass({})
  t.ctx.selfPlayer.passed = true
  t.ctx.selfPlayer.turn = undefined
  t.ctx.opponentPlayer.turn = PlayerTurn.Current
  t.ctx.round1Moves.push({
    userName: t.ctx.self.user.name,
    round: 1,
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
  const unitOpponent1 = sortedHandOpponent[0]
  const combatOpponent1 = unitOpponent1.unit.combats ? unitOpponent1.unit.combats[0] : Combat.Close
  await t.ctx.opponent.client.playUnit({
    gameId: t.ctx.game.id,
    unitId: unitOpponent1.unit.id,
    combat: combatOpponent1,
  })
  t.ctx.opponentPlayer.hand = 9
  t.ctx.opponentPlayer.score = unitOpponent1.unit.strength || 0
  E2eHelper.addUnitToGamePlayer({
    player: t.ctx.opponentPlayer,
    row: combatOpponent1,
    score: unitOpponent1.unit.strength || 0,
    unitName: unitOpponent1.unit.name,
  })
  t.ctx.round1Moves.push({
    userName: t.ctx.opponent.user.name,
    unitName: unitOpponent1.unit.name,
    combatRow: combatOpponent1,
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
  t.ctx.selfPlayer.passed = undefined
  t.ctx.selfPlayer.score = 0
  t.ctx.selfPlayer.losses = 1
  t.ctx.opponentPlayer.score = 0
  t.ctx.opponentPlayer.discard = 1
  E2eHelper.resetPlayerCombatRow({
    player: t.ctx.opponentPlayer,
    row: combatOpponent1,
  })
  t.ctx.round1Moves.push({
    userName: t.ctx.opponent.user.name,
    round: 1,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round: 2,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves],
  })

  // round 2
  await t.ctx.opponent.client.playPass({
    gameId: t.ctx.game.id,
  })
  t.ctx.selfPlayer.turn = PlayerTurn.Current
  t.ctx.opponentPlayer.turn = undefined
  t.ctx.opponentPlayer.passed = true
  t.ctx.round2Moves.push({
    userName: t.ctx.opponent.user.name,
    round: 2,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round: 2,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves],
  })

  const sortedHandSelf = sortObjectArray({
    array: t.ctx.self.gameDeck.hand,
    sortProperties: ['unit.strength', 'unit.id'],
    reverse: true,
  })
  const unitSelf1 = sortedHandSelf[0]
  const combatSelf1 = unitSelf1.unit.combats ? unitSelf1.unit.combats[0] : Combat.Close
  await GamePage.moveUnit({
    unitName: unitSelf1.unit.name,
    row: combatSelf1,
  })
  t.ctx.self.gameDeck.hand = t.ctx.self.gameDeck.hand.filter((card) => card.unit.id !== unitSelf1.unit.id)
  t.ctx.selfPlayer.hand = 9
  t.ctx.selfPlayer.score = unitSelf1.unit.strength || 0
  E2eHelper.addUnitToGamePlayer({
    player: t.ctx.selfPlayer,
    row: combatSelf1,
    score: unitSelf1.unit.strength || 0,
    unitName: unitSelf1.unit.name,
  })
  t.ctx.round2Moves.push({
    userName: t.ctx.self.user.name,
    unitName: unitSelf1.unit.name,
    combatRow: combatSelf1,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round: 2,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves],
  })

  await GamePage.pass({})
  t.ctx.selfPlayer.score = 0
  t.ctx.selfPlayer.discard = 1
  E2eHelper.resetPlayerCombatRow({
    player: t.ctx.selfPlayer,
    row: combatSelf1,
  })
  t.ctx.opponentPlayer.passed = undefined
  t.ctx.opponentPlayer.losses = 1
  t.ctx.round2Moves.push({
    userName: t.ctx.self.user.name,
    round: 2,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round: 3,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves, t.ctx.round3Moves],
  })

  // round 3
  await GamePage.pass({})
  t.ctx.selfPlayer.passed = true
  t.ctx.selfPlayer.turn = undefined
  t.ctx.opponentPlayer.turn = PlayerTurn.Current
  t.ctx.round3Moves.push({
    userName: t.ctx.self.user.name,
    round: 3,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round: 3,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves, t.ctx.round3Moves],
  })

  const unitOpponent2 = sortedHandOpponent[1]
  const combatOpponent2 = unitOpponent2.unit.combats ? unitOpponent2.unit.combats[0] : Combat.Close
  await t.ctx.opponent.client.playUnit({
    gameId: t.ctx.game.id,
    unitId: unitOpponent2.unit.id,
    combat: combatOpponent2,
  })
  t.ctx.opponentPlayer.hand = 8
  t.ctx.opponentPlayer.score = unitOpponent2.unit.strength || 0
  E2eHelper.addUnitToGamePlayer({
    player: t.ctx.opponentPlayer,
    row: combatOpponent2,
    score: unitOpponent2.unit.strength || 0,
    unitName: unitOpponent2.unit.name,
  })
  t.ctx.round3Moves.push({
    userName: t.ctx.opponent.user.name,
    unitName: unitOpponent2.unit.name,
    combatRow: combatOpponent2,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round: 3,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves, t.ctx.round3Moves],
  })

  await t.ctx.opponent.client.playPass({
    gameId: t.ctx.game.id,
  })
  t.ctx.selfPlayer.losses = 2
  t.ctx.opponentPlayer.turn = undefined
  t.ctx.opponentPlayer.passed = true
  t.ctx.opponentPlayer.discard = 2
  E2eHelper.resetPlayerCombatRow({
    player: t.ctx.opponentPlayer,
    row: combatOpponent2,
  })
  t.ctx.round3Moves.push({
    userName: t.ctx.opponent.user.name,
    round: 3,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round: 3,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves, t.ctx.round3Moves],
    victors: [t.ctx.opponent.user.name],
    rounds: [
      {
        self: 0,
        opponent: unitOpponent1.unit.strength || 0,
      },
      {
        self: unitSelf1.unit.strength || 0,
        opponent: 0,
      },
      {
        self: 0,
        opponent: unitOpponent2.unit.strength || 0,
      },
    ],
  })
})

test('Loss win tie ends in tie', async (t) => {
  // round 1
  await GamePage.pass({})
  t.ctx.selfPlayer.passed = true
  t.ctx.selfPlayer.turn = undefined
  t.ctx.opponentPlayer.turn = PlayerTurn.Current
  t.ctx.round1Moves.push({
    userName: t.ctx.self.user.name,
    round: 1,
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
  const unitOpponent1 = sortedHandOpponent[0]
  const combatOpponent1 = unitOpponent1.unit.combats ? unitOpponent1.unit.combats[0] : Combat.Close
  await t.ctx.opponent.client.playUnit({
    gameId: t.ctx.game.id,
    unitId: unitOpponent1.unit.id,
    combat: combatOpponent1,
  })
  t.ctx.opponentPlayer.hand = 9
  t.ctx.opponentPlayer.score = unitOpponent1.unit.strength || 0
  E2eHelper.addUnitToGamePlayer({
    player: t.ctx.opponentPlayer,
    row: combatOpponent1,
    score: unitOpponent1.unit.strength || 0,
    unitName: unitOpponent1.unit.name,
  })
  t.ctx.round1Moves.push({
    userName: t.ctx.opponent.user.name,
    unitName: unitOpponent1.unit.name,
    combatRow: combatOpponent1,
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
  t.ctx.selfPlayer.passed = undefined
  t.ctx.selfPlayer.score = 0
  t.ctx.selfPlayer.losses = 1
  t.ctx.opponentPlayer.score = 0
  t.ctx.opponentPlayer.discard = 1
  E2eHelper.resetPlayerCombatRow({
    player: t.ctx.opponentPlayer,
    row: combatOpponent1,
  })
  t.ctx.round1Moves.push({
    userName: t.ctx.opponent.user.name,
    round: 1,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round: 2,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves],
  })

  // round 2
  await t.ctx.opponent.client.playPass({
    gameId: t.ctx.game.id,
  })
  t.ctx.selfPlayer.turn = PlayerTurn.Current
  t.ctx.opponentPlayer.turn = undefined
  t.ctx.opponentPlayer.passed = true
  t.ctx.round2Moves.push({
    userName: t.ctx.opponent.user.name,
    round: 2,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round: 2,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves],
  })

  const sortedHandSelf = sortObjectArray({
    array: t.ctx.self.gameDeck.hand,
    sortProperties: ['unit.strength', 'unit.id'],
    reverse: true,
  })
  const unitSelf1 = sortedHandSelf[0]
  const combatSelf1 = unitSelf1.unit.combats ? unitSelf1.unit.combats[0] : Combat.Close
  await GamePage.moveUnit({
    unitName: unitSelf1.unit.name,
    row: combatSelf1,
  })
  t.ctx.self.gameDeck.hand = t.ctx.self.gameDeck.hand.filter((card) => card.unit.id !== unitSelf1.unit.id)
  t.ctx.selfPlayer.hand = 9
  t.ctx.selfPlayer.score = unitSelf1.unit.strength || 0
  E2eHelper.addUnitToGamePlayer({
    player: t.ctx.selfPlayer,
    row: combatSelf1,
    score: unitSelf1.unit.strength || 0,
    unitName: unitSelf1.unit.name,
  })
  t.ctx.round2Moves.push({
    userName: t.ctx.self.user.name,
    unitName: unitSelf1.unit.name,
    combatRow: combatSelf1,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round: 2,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves],
  })

  await GamePage.pass({})
  t.ctx.selfPlayer.score = 0
  t.ctx.selfPlayer.discard = 1
  E2eHelper.resetPlayerCombatRow({
    player: t.ctx.selfPlayer,
    row: combatSelf1,
  })
  t.ctx.opponentPlayer.passed = undefined
  t.ctx.opponentPlayer.losses = 1
  t.ctx.round2Moves.push({
    userName: t.ctx.self.user.name,
    round: 2,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round: 3,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves, t.ctx.round3Moves],
  })

  // round 3
  await GamePage.pass({})
  t.ctx.selfPlayer.passed = true
  t.ctx.selfPlayer.turn = undefined
  t.ctx.opponentPlayer.turn = PlayerTurn.Current
  t.ctx.round3Moves.push({
    userName: t.ctx.self.user.name,
    round: 3,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round: 3,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves, t.ctx.round3Moves],
  })

  await t.ctx.opponent.client.playPass({
    gameId: t.ctx.game.id,
  })
  t.ctx.selfPlayer.losses = 2
  t.ctx.opponentPlayer.turn = undefined
  t.ctx.opponentPlayer.passed = true
  t.ctx.opponentPlayer.losses = 2
  t.ctx.round3Moves.push({
    userName: t.ctx.opponent.user.name,
    round: 3,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round: 3,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves, t.ctx.round3Moves],
    victors: [t.ctx.self.user.name, t.ctx.opponent.user.name],
    rounds: [
      {
        self: 0,
        opponent: unitOpponent1.unit.strength || 0,
      },
      {
        self: unitSelf1.unit.strength || 0,
        opponent: 0,
      },
      {
        self: 0,
        opponent: 0,
      },
    ],
  })
})
