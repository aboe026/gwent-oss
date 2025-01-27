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

test('Opponent passes ends in victory after 2 rounds', async (t) => {
  // round 1
  let round = 1
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
  E2eHelper.playUnit({
    player: t.ctx.selfPlayer,
    deckUnit: unit1,
    gameDeck: t.ctx.self.gameDeck,
    moves: t.ctx.round1Moves,
    row: combat1,
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
    round,
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

  // round 2
  const unit2 = sortedHand[1]
  const combat2 = unit2.unit.combats ? unit2.unit.combats[0] : Combat.Close
  await GamePage.moveUnit({
    unitName: unit2.unit.name,
    row: combat2,
  })
  E2eHelper.playUnit({
    player: t.ctx.selfPlayer,
    deckUnit: unit2,
    gameDeck: t.ctx.self.gameDeck,
    moves: t.ctx.round2Moves,
    row: combat2,
    switchTurnsWith: t.ctx.opponentPlayer,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves],
  })

  await t.ctx.opponent.client.playPass({
    gameId: t.ctx.game.id,
  })
  E2eHelper.playPass({
    player: t.ctx.opponentPlayer,
    round,
    moves: t.ctx.round2Moves,
    switchTurnsWith: t.ctx.selfPlayer,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves],
  })

  await GamePage.pass({})
  E2eHelper.playPass({
    player: t.ctx.selfPlayer,
    round,
    moves: t.ctx.round2Moves,
  })
  E2eHelper.endRound({
    self: t.ctx.selfPlayer,
    opponent: t.ctx.opponentPlayer,
    gameOver: true,
    losers: [t.ctx.opponentPlayer],
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves],
    victors: [t.ctx.self.user.name],
    rounds: [
      {
        creator: unit1.unit.strength || 0,
        opponent: 0,
      },
      {
        creator: unit2.unit.strength || 0,
        opponent: 0,
      },
    ],
  })
})

test('Self passes ends in loss after 2 rounds', async (t) => {
  // round 1
  let round = 1
  await GamePage.pass({})
  E2eHelper.playPass({
    player: t.ctx.selfPlayer,
    round,
    moves: t.ctx.round1Moves,
    switchTurnsWith: t.ctx.opponentPlayer,
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
  E2eHelper.playUnit({
    player: t.ctx.opponentPlayer,
    deckUnit: unit1,
    gameDeck: t.ctx.opponent.gameDeck,
    moves: t.ctx.round1Moves,
    row: combat1,
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
  })
  E2eHelper.endRound({
    self: t.ctx.selfPlayer,
    opponent: t.ctx.opponentPlayer,
    losers: [t.ctx.selfPlayer],
  })
  round = 2
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round,
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
  E2eHelper.playUnit({
    player: t.ctx.opponentPlayer,
    deckUnit: unit2,
    gameDeck: t.ctx.opponent.gameDeck,
    moves: t.ctx.round2Moves,
    row: combat2,
    switchTurnsWith: t.ctx.selfPlayer,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves],
  })

  await GamePage.pass({})
  E2eHelper.playPass({
    player: t.ctx.selfPlayer,
    round,
    moves: t.ctx.round2Moves,
    switchTurnsWith: t.ctx.opponentPlayer,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves],
  })

  await t.ctx.opponent.client.playPass({
    gameId: t.ctx.game.id,
  })
  E2eHelper.playPass({
    player: t.ctx.opponentPlayer,
    round,
    moves: t.ctx.round2Moves,
  })
  E2eHelper.endRound({
    self: t.ctx.selfPlayer,
    opponent: t.ctx.opponentPlayer,
    losers: [t.ctx.selfPlayer],
    gameOver: true,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves],
    victors: [t.ctx.opponent.user.name],
    rounds: [
      {
        creator: 0,
        opponent: unit1.unit.strength || 0,
      },
      {
        creator: 0,
        opponent: unit2.unit.strength || 0,
      },
    ],
  })
})

test('All passes ends in tie after 2 rounds', async (t) => {
  // round 1
  let round = 1
  await GamePage.pass({})
  E2eHelper.playPass({
    player: t.ctx.selfPlayer,
    round,
    moves: t.ctx.round1Moves,
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
  })
  E2eHelper.endRound({
    self: t.ctx.selfPlayer,
    opponent: t.ctx.opponentPlayer,
    losers: [t.ctx.selfPlayer, t.ctx.opponentPlayer],
  })
  round = 2
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves],
  })

  // round 2
  await t.ctx.opponent.client.playPass({
    gameId: t.ctx.game.id,
  })
  E2eHelper.playPass({
    player: t.ctx.opponentPlayer,
    round,
    moves: t.ctx.round2Moves,
    switchTurnsWith: t.ctx.selfPlayer,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves],
  })

  await GamePage.pass({})
  E2eHelper.playPass({
    player: t.ctx.selfPlayer,
    round,
    moves: t.ctx.round2Moves,
  })
  E2eHelper.endRound({
    self: t.ctx.selfPlayer,
    opponent: t.ctx.opponentPlayer,
    losers: [t.ctx.selfPlayer, t.ctx.opponentPlayer],
    gameOver: true,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves],
    victors: [t.ctx.self.user.name, t.ctx.opponent.user.name],
    rounds: [
      {
        creator: 0,
        opponent: 0,
      },
      {
        creator: 0,
        opponent: 0,
      },
    ],
  })
})

test('Win loss win ends in victory', async (t) => {
  // round 1
  let round = 1
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
  E2eHelper.playUnit({
    player: t.ctx.selfPlayer,
    deckUnit: unitSelf1,
    gameDeck: t.ctx.self.gameDeck,
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
    round,
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

  // round 2
  await GamePage.pass({})
  E2eHelper.playPass({
    player: t.ctx.selfPlayer,
    round,
    moves: t.ctx.round2Moves,
    switchTurnsWith: t.ctx.opponentPlayer,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round,
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
  E2eHelper.playUnit({
    player: t.ctx.opponentPlayer,
    deckUnit: unitOpponent1,
    gameDeck: t.ctx.opponent.gameDeck,
    moves: t.ctx.round2Moves,
    row: combatOpponent1,
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
  E2eHelper.playPass({
    player: t.ctx.opponentPlayer,
    round,
    moves: t.ctx.round2Moves,
  })
  E2eHelper.endRound({
    self: t.ctx.selfPlayer,
    opponent: t.ctx.opponentPlayer,
    losers: [t.ctx.selfPlayer],
  })
  round = 3
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves, t.ctx.round3Moves],
  })

  // round 3
  await t.ctx.opponent.client.playPass({
    gameId: t.ctx.game.id,
  })
  E2eHelper.playPass({
    player: t.ctx.opponentPlayer,
    round,
    moves: t.ctx.round3Moves,
    switchTurnsWith: t.ctx.selfPlayer,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves, t.ctx.round3Moves],
  })

  const unitSelf2 = sortedHandSelf[1]
  const combatSelf2 = unitSelf2.unit.combats ? unitSelf2.unit.combats[0] : Combat.Close
  await GamePage.moveUnit({
    unitName: unitSelf2.unit.name,
    row: combatSelf2,
  })
  E2eHelper.playUnit({
    player: t.ctx.selfPlayer,
    deckUnit: unitSelf2,
    gameDeck: t.ctx.self.gameDeck,
    moves: t.ctx.round3Moves,
    row: combatSelf2,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves, t.ctx.round3Moves],
  })

  await GamePage.pass({})
  E2eHelper.playPass({
    player: t.ctx.selfPlayer,
    round,
    moves: t.ctx.round3Moves,
  })
  E2eHelper.endRound({
    self: t.ctx.selfPlayer,
    opponent: t.ctx.opponentPlayer,
    losers: [t.ctx.opponentPlayer],
    gameOver: true,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves, t.ctx.round3Moves],
    victors: [t.ctx.self.user.name],
    rounds: [
      {
        creator: unitSelf1.unit.strength || 0,
        opponent: 0,
      },
      {
        creator: 0,
        opponent: unitOpponent1.unit.strength || 0,
      },
      {
        creator: unitSelf2.unit.strength || 0,
        opponent: 0,
      },
    ],
  })
})

test('Win loss loss ends in defeat', async (t) => {
  // round 1
  let round = 1
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
  E2eHelper.playUnit({
    player: t.ctx.selfPlayer,
    deckUnit: unitSelf1,
    gameDeck: t.ctx.self.gameDeck,
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
    round,
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

  // round 2
  await GamePage.pass({})
  E2eHelper.playPass({
    player: t.ctx.selfPlayer,
    round,
    moves: t.ctx.round2Moves,
    switchTurnsWith: t.ctx.opponentPlayer,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round,
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
  E2eHelper.playUnit({
    player: t.ctx.opponentPlayer,
    deckUnit: unitOpponent1,
    gameDeck: t.ctx.opponent.gameDeck,
    moves: t.ctx.round2Moves,
    row: combatOpponent1,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves],
  })

  await t.ctx.opponent.client.playPass({
    gameId: t.ctx.game.id,
  })
  E2eHelper.playPass({
    player: t.ctx.opponentPlayer,
    round,
    moves: t.ctx.round2Moves,
  })
  E2eHelper.endRound({
    self: t.ctx.selfPlayer,
    opponent: t.ctx.opponentPlayer,
    losers: [t.ctx.selfPlayer],
  })
  round = 3
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round,
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
  E2eHelper.playUnit({
    player: t.ctx.opponentPlayer,
    deckUnit: unitOpponent2,
    gameDeck: t.ctx.opponent.gameDeck,
    moves: t.ctx.round3Moves,
    row: combatOpponent2,
    switchTurnsWith: t.ctx.selfPlayer,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves, t.ctx.round3Moves],
  })

  await GamePage.pass({})
  E2eHelper.playPass({
    player: t.ctx.selfPlayer,
    round,
    moves: t.ctx.round3Moves,
    switchTurnsWith: t.ctx.opponentPlayer,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves, t.ctx.round3Moves],
  })

  await t.ctx.opponent.client.playPass({
    gameId: t.ctx.game.id,
  })
  E2eHelper.playPass({
    player: t.ctx.opponentPlayer,
    round,
    moves: t.ctx.round3Moves,
  })
  E2eHelper.endRound({
    self: t.ctx.selfPlayer,
    opponent: t.ctx.opponentPlayer,
    losers: [t.ctx.selfPlayer],
    gameOver: true,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves, t.ctx.round3Moves],
    victors: [t.ctx.opponent.user.name],
    rounds: [
      {
        creator: unitSelf1.unit.strength || 0,
        opponent: 0,
      },
      {
        creator: 0,
        opponent: unitOpponent1.unit.strength || 0,
      },
      {
        creator: 0,
        opponent: unitOpponent2.unit.strength || 0,
      },
    ],
  })
})

test('Win loss tie ends in tie', async (t) => {
  // round 1
  let round = 1
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
  E2eHelper.playUnit({
    player: t.ctx.selfPlayer,
    deckUnit: unitSelf1,
    gameDeck: t.ctx.self.gameDeck,
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
    round,
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

  // round 2
  await GamePage.pass({})
  E2eHelper.playPass({
    player: t.ctx.selfPlayer,
    round,
    moves: t.ctx.round2Moves,
    switchTurnsWith: t.ctx.opponentPlayer,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round,
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
  E2eHelper.playUnit({
    player: t.ctx.opponentPlayer,
    deckUnit: unitOpponent1,
    gameDeck: t.ctx.opponent.gameDeck,
    moves: t.ctx.round2Moves,
    row: combatOpponent1,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves],
  })

  await t.ctx.opponent.client.playPass({
    gameId: t.ctx.game.id,
  })
  E2eHelper.playPass({
    player: t.ctx.opponentPlayer,
    round,
    moves: t.ctx.round2Moves,
  })
  E2eHelper.endRound({
    self: t.ctx.selfPlayer,
    opponent: t.ctx.opponentPlayer,
    losers: [t.ctx.selfPlayer],
  })
  round = 3
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves, t.ctx.round3Moves],
  })

  // round 3
  await t.ctx.opponent.client.playPass({
    gameId: t.ctx.game.id,
  })
  E2eHelper.playPass({
    player: t.ctx.opponentPlayer,
    round,
    moves: t.ctx.round3Moves,
    switchTurnsWith: t.ctx.selfPlayer,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves, t.ctx.round3Moves],
  })

  await GamePage.pass({})
  E2eHelper.playPass({
    player: t.ctx.selfPlayer,
    round,
    moves: t.ctx.round3Moves,
  })
  E2eHelper.endRound({
    self: t.ctx.selfPlayer,
    opponent: t.ctx.opponentPlayer,
    losers: [t.ctx.selfPlayer, t.ctx.opponentPlayer],
    gameOver: true,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves, t.ctx.round3Moves],
    victors: [t.ctx.self.user.name, t.ctx.opponent.user.name],
    rounds: [
      {
        creator: unitSelf1.unit.strength || 0,
        opponent: 0,
      },
      {
        creator: 0,
        opponent: unitOpponent1.unit.strength || 0,
      },
      {
        creator: 0,
        opponent: 0,
      },
    ],
  })
})

test('Loss win win ends in victory', async (t) => {
  // round 1
  let round = 1
  await GamePage.pass({})
  E2eHelper.playPass({
    player: t.ctx.selfPlayer,
    round,
    moves: t.ctx.round1Moves,
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
  const unitOpponent1 = sortedHandOpponent[0]
  const combatOpponent1 = unitOpponent1.unit.combats ? unitOpponent1.unit.combats[0] : Combat.Close
  await t.ctx.opponent.client.playUnit({
    gameId: t.ctx.game.id,
    unitId: unitOpponent1.unit.id,
    combat: combatOpponent1,
  })
  E2eHelper.playUnit({
    player: t.ctx.opponentPlayer,
    deckUnit: unitOpponent1,
    gameDeck: t.ctx.opponent.gameDeck,
    moves: t.ctx.round1Moves,
    row: combatOpponent1,
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
  })
  E2eHelper.endRound({
    self: t.ctx.selfPlayer,
    opponent: t.ctx.opponentPlayer,
    losers: [t.ctx.selfPlayer],
  })
  round = 2
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves],
  })

  // round 2
  await t.ctx.opponent.client.playPass({
    gameId: t.ctx.game.id,
  })
  E2eHelper.playPass({
    player: t.ctx.opponentPlayer,
    round,
    moves: t.ctx.round2Moves,
    switchTurnsWith: t.ctx.selfPlayer,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round,
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
  E2eHelper.playUnit({
    player: t.ctx.selfPlayer,
    deckUnit: unitSelf1,
    gameDeck: t.ctx.self.gameDeck,
    moves: t.ctx.round2Moves,
    row: combatSelf1,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves],
  })

  await GamePage.pass({})
  E2eHelper.playPass({
    player: t.ctx.selfPlayer,
    round,
    moves: t.ctx.round2Moves,
  })
  E2eHelper.endRound({
    self: t.ctx.selfPlayer,
    opponent: t.ctx.opponentPlayer,
    losers: [t.ctx.opponentPlayer],
  })
  round = 3
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves, t.ctx.round3Moves],
  })

  // round 3
  const unitSelf2 = sortedHandSelf[1]
  const combatSelf2 = unitSelf2.unit.combats ? unitSelf2.unit.combats[0] : Combat.Close
  await GamePage.moveUnit({
    unitName: unitSelf2.unit.name,
    row: combatSelf2,
  })
  E2eHelper.playUnit({
    player: t.ctx.selfPlayer,
    deckUnit: unitSelf2,
    gameDeck: t.ctx.self.gameDeck,
    moves: t.ctx.round3Moves,
    row: combatSelf2,
    switchTurnsWith: t.ctx.opponentPlayer,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves, t.ctx.round3Moves],
  })

  await t.ctx.opponent.client.playPass({
    gameId: t.ctx.game.id,
  })
  E2eHelper.playPass({
    player: t.ctx.opponentPlayer,
    round,
    moves: t.ctx.round3Moves,
    switchTurnsWith: t.ctx.selfPlayer,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves, t.ctx.round3Moves],
  })

  await GamePage.pass({})
  E2eHelper.playPass({
    player: t.ctx.selfPlayer,
    round,
    moves: t.ctx.round3Moves,
  })
  E2eHelper.endRound({
    self: t.ctx.selfPlayer,
    opponent: t.ctx.opponentPlayer,
    losers: [t.ctx.opponentPlayer],
    gameOver: true,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves, t.ctx.round3Moves],
    victors: [t.ctx.self.user.name],
    rounds: [
      {
        creator: 0,
        opponent: unitOpponent1.unit.strength || 0,
      },
      {
        creator: unitSelf1.unit.strength || 0,
        opponent: 0,
      },
      {
        creator: unitSelf2.unit.strength || 0,
        opponent: 0,
      },
    ],
  })
})

test('Loss win loss ends in defeat', async (t) => {
  // round 1
  let round = 1
  await GamePage.pass({})
  E2eHelper.playPass({
    player: t.ctx.selfPlayer,
    round,
    moves: t.ctx.round1Moves,
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
  const unitOpponent1 = sortedHandOpponent[0]
  const combatOpponent1 = unitOpponent1.unit.combats ? unitOpponent1.unit.combats[0] : Combat.Close
  await t.ctx.opponent.client.playUnit({
    gameId: t.ctx.game.id,
    unitId: unitOpponent1.unit.id,
    combat: combatOpponent1,
  })
  E2eHelper.playUnit({
    player: t.ctx.opponentPlayer,
    deckUnit: unitOpponent1,
    gameDeck: t.ctx.opponent.gameDeck,
    moves: t.ctx.round1Moves,
    row: combatOpponent1,
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
  })
  E2eHelper.endRound({
    self: t.ctx.selfPlayer,
    opponent: t.ctx.opponentPlayer,
    losers: [t.ctx.selfPlayer],
  })
  round = 2
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves],
  })

  // round 2
  await t.ctx.opponent.client.playPass({
    gameId: t.ctx.game.id,
  })
  E2eHelper.playPass({
    player: t.ctx.opponentPlayer,
    round,
    moves: t.ctx.round2Moves,
    switchTurnsWith: t.ctx.selfPlayer,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round,
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
  E2eHelper.playUnit({
    player: t.ctx.selfPlayer,
    deckUnit: unitSelf1,
    gameDeck: t.ctx.self.gameDeck,
    moves: t.ctx.round2Moves,
    row: combatSelf1,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves],
  })

  await GamePage.pass({})
  E2eHelper.playPass({
    player: t.ctx.selfPlayer,
    round,
    moves: t.ctx.round2Moves,
  })
  E2eHelper.endRound({
    self: t.ctx.selfPlayer,
    opponent: t.ctx.opponentPlayer,
    losers: [t.ctx.opponentPlayer],
  })
  round = 3
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves, t.ctx.round3Moves],
  })

  // round 3
  await GamePage.pass({})
  E2eHelper.playPass({
    player: t.ctx.selfPlayer,
    round,
    moves: t.ctx.round3Moves,
    switchTurnsWith: t.ctx.opponentPlayer,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves, t.ctx.round3Moves],
  })

  const unitOpponent2 = sortedHandOpponent[1]
  const combatOpponent2 = unitOpponent2.unit.combats ? unitOpponent2.unit.combats[0] : Combat.Close
  await t.ctx.opponent.client.playUnit({
    gameId: t.ctx.game.id,
    unitId: unitOpponent2.unit.id,
    combat: combatOpponent2,
  })
  E2eHelper.playUnit({
    player: t.ctx.opponentPlayer,
    deckUnit: unitOpponent2,
    gameDeck: t.ctx.opponent.gameDeck,
    moves: t.ctx.round3Moves,
    row: combatOpponent2,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves, t.ctx.round3Moves],
  })

  await t.ctx.opponent.client.playPass({
    gameId: t.ctx.game.id,
  })
  E2eHelper.playPass({
    player: t.ctx.opponentPlayer,
    round,
    moves: t.ctx.round3Moves,
  })
  E2eHelper.endRound({
    self: t.ctx.selfPlayer,
    opponent: t.ctx.opponentPlayer,
    losers: [t.ctx.selfPlayer],
    gameOver: true,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves, t.ctx.round3Moves],
    victors: [t.ctx.opponent.user.name],
    rounds: [
      {
        creator: 0,
        opponent: unitOpponent1.unit.strength || 0,
      },
      {
        creator: unitSelf1.unit.strength || 0,
        opponent: 0,
      },
      {
        creator: 0,
        opponent: unitOpponent2.unit.strength || 0,
      },
    ],
  })
})

test('Loss win tie ends in tie', async (t) => {
  // round 1
  let round = 1
  await GamePage.pass({})
  E2eHelper.playPass({
    player: t.ctx.selfPlayer,
    round,
    moves: t.ctx.round1Moves,
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
  const unitOpponent1 = sortedHandOpponent[0]
  const combatOpponent1 = unitOpponent1.unit.combats ? unitOpponent1.unit.combats[0] : Combat.Close
  await t.ctx.opponent.client.playUnit({
    gameId: t.ctx.game.id,
    unitId: unitOpponent1.unit.id,
    combat: combatOpponent1,
  })
  E2eHelper.playUnit({
    player: t.ctx.opponentPlayer,
    deckUnit: unitOpponent1,
    gameDeck: t.ctx.opponent.gameDeck,
    moves: t.ctx.round1Moves,
    row: combatOpponent1,
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
  })
  E2eHelper.endRound({
    self: t.ctx.selfPlayer,
    opponent: t.ctx.opponentPlayer,
    losers: [t.ctx.selfPlayer],
  })
  round = 2
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves],
  })

  // round 2
  await t.ctx.opponent.client.playPass({
    gameId: t.ctx.game.id,
  })
  E2eHelper.playPass({
    player: t.ctx.opponentPlayer,
    round,
    moves: t.ctx.round2Moves,
    switchTurnsWith: t.ctx.selfPlayer,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round,
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
  E2eHelper.playUnit({
    player: t.ctx.selfPlayer,
    deckUnit: unitSelf1,
    gameDeck: t.ctx.self.gameDeck,
    moves: t.ctx.round2Moves,
    row: combatSelf1,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves],
  })

  await GamePage.pass({})
  E2eHelper.playPass({
    player: t.ctx.selfPlayer,
    round,
    moves: t.ctx.round2Moves,
  })
  E2eHelper.endRound({
    self: t.ctx.selfPlayer,
    opponent: t.ctx.opponentPlayer,
    losers: [t.ctx.opponentPlayer],
  })
  round = 3
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves, t.ctx.round3Moves],
  })

  // round 3
  await GamePage.pass({})
  E2eHelper.playPass({
    player: t.ctx.selfPlayer,
    round,
    moves: t.ctx.round3Moves,
    switchTurnsWith: t.ctx.opponentPlayer,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves, t.ctx.round3Moves],
  })

  await t.ctx.opponent.client.playPass({
    gameId: t.ctx.game.id,
  })
  E2eHelper.playPass({
    player: t.ctx.opponentPlayer,
    round,
    moves: t.ctx.round3Moves,
  })
  E2eHelper.endRound({
    self: t.ctx.selfPlayer,
    opponent: t.ctx.opponentPlayer,
    losers: [t.ctx.selfPlayer, t.ctx.opponentPlayer],
    gameOver: true,
  })
  await GamePage.verify({
    opponent: t.ctx.opponentPlayer,
    self: t.ctx.selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round,
    moves: [t.ctx.round1Moves, t.ctx.round2Moves, t.ctx.round3Moves],
    victors: [t.ctx.self.user.name, t.ctx.opponent.user.name],
    rounds: [
      {
        creator: 0,
        opponent: unitOpponent1.unit.strength || 0,
      },
      {
        creator: unitSelf1.unit.strength || 0,
        opponent: 0,
      },
      {
        creator: 0,
        opponent: 0,
      },
    ],
  })
})
