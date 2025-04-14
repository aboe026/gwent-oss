import ApiClient from '../util/api-client'
import { Combat, FactionKey, Game } from '@gwent/graphql-schema/resolver-typings'
import { ContextGamePlayer, E2eHelper } from '../util/e2e-helper'
import { E2eCtx, getFixtureCtx, getTestCtx } from '../util/e2e-ctx'
import E2eUtil from '../util/e2e-util'
import { ensureUnitsInHand } from '@gwent/test-utils'
import env from '../util/env'
import FullCard from '../components/full-card'
import GamePage, { HistoryMove, HistoryPass } from '../page-objects/game-page'
import HomePage from '../page-objects/home-page'
import LoginPage from '../page-objects/login-page'
import { PlayerTurn } from '../components/game-player-info'

interface GameEffectMoraleTestCtx extends E2eCtx {
  scenario: string
  self: ContextGamePlayer
  opponent: ContextGamePlayer
  scoiatael: {
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
const fixture = getFixtureCtx<E2eCtx, GameEffectMoraleTestCtx>()
const test = getTestCtx<E2eCtx, GameEffectMoraleTestCtx>()

fixture('Game Effect Morale')
  .page(HomePage.getUrl())
  .beforeEach(async (t) => {
    t.ctx.scenario = 'game-effect-morale'
    const self = await new ApiClient({}).addUser({
      name: `${t.ctx.scenario}-self-${t.ctx.start}`,
    })
    const opponent = await new ApiClient({}).addUser({
      name: `${t.ctx.scenario}-opponent-${t.ctx.start}`,
    })

    t.ctx.scoiatael = {
      faction: FactionKey.ScoiaTael,
      leader: 'Francesca Findabair the Beautiful',
      units: [
        'Barclay Els',
        'Ciaran aep Easnillien',
        'Dennis Cranmer',
        'Dol Blathanna Archer',
        'Dol Blathanna Scout',
        'Eithne',
        'Emiel Regis Rohellec Terzieff',
        'Filavandrel aen Fidhail',
        'Ida Emean aep Sivney',
        'Isengrim Faoiltiarna',
        'Mahakaman Defender',
        'Milva',
        'Olgierd Von Everec',
        'Riordain',
        'Saesenthessis',
        'Toruviel',
        'Triss Merigold',
        'Vesemir',
        'Vrihedd Brigade Recruit',
        'Vrihedd Brigade Veteran',
        'Yaevinn',
        'Zoltan Chivay',
      ],
    }
    t.ctx.nilfgaard = {
      faction: FactionKey.NilfgaardianEmpire,
      leader: 'Emhyr var Emreis the Relentless',
      units: [
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
        'Olgierd Von Everec',
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
    }

    const selfClient = new ApiClient({
      username: self.name,
    })
    const opponentClient = new ApiClient({
      username: opponent.name,
    })

    t.ctx.game = await selfClient.addGame([opponent.name])

    const selfDeck = await selfClient.addDeck({
      faction: t.ctx.scoiatael.faction,
      leaderName: t.ctx.scoiatael.leader,
      name: `${t.ctx.scenario}-self-deck-${Date.now()}`,
      unitNames: t.ctx.scoiatael.units,
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
    await selfClient.setOrder({
      gameId: t.ctx.game.id,
      userIds: [self.id, opponent.id],
    })
    await t.ctx.self.client.ready(t.ctx.game.id)
    await t.ctx.opponent.client.ready(t.ctx.game.id)

    t.ctx.game = await selfClient.getGame(t.ctx.game.id)
  })

test('Morale unit does not effect itself', async (t) => {
  const unitName = 'Milva'
  await ensureUnitsInHand({
    gameId: t.ctx.game.id,
    mongoConnectionString: env.MONGO_URL,
    mongoDatabaseName: env.MONGO_DB,
    unitNames: [unitName],
    userId: t.ctx.self.user.id,
  })
  t.ctx.self.gameDeck = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  const selfPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.self,
    turn: PlayerTurn.Current,
    ready: true,
    passed: false,
    score: 0,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.opponent,
    ready: true,
    score: 0,
  })
  await LoginPage.login({
    username: t.ctx.self.user.name,
  })
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [[]],
  })

  const unitToMove = t.ctx.self.gameDeck.hand.find((unit) => unit.unit.name === unitName)
  if (!unitToMove) {
    throw Error(`Could not find unit in hand with name "${unitName}"`)
  }
  const combatRow = unitToMove.unit.combats ? unitToMove.unit.combats[0] : Combat.Close
  await GamePage.moveUnit({
    unitName: unitToMove.unit.name,
    row: combatRow,
  })
  E2eHelper.playUnit({
    player: selfPlayer,
    gameDeck: t.ctx.self.gameDeck,
    deckUnit: unitToMove,
    row: combatRow,
    switchTurnsWith: opponentPlayer,
  })

  await GamePage.verify({
    opponent: opponentPlayer,
    self: {
      ...selfPlayer,
      score: 10,
    },
    hand: t.ctx.self.gameDeck.hand,
    moves: [
      [
        {
          combatRow: combatRow,
          unitName: unitToMove.unit.name,
          userName: t.ctx.self.user.name,
        },
      ],
    ],
  })

  await GamePage.fullscreenCombatCard({
    unitName,
    row: combatRow,
    self: true,
  })
  await FullCard.verify({
    unit: unitToMove.unit,
  })
})

test('Morale unit does not effect hero', async (t) => {
  const unitName1 = 'Milva'
  const unitName2 = 'Eithne'
  await ensureUnitsInHand({
    gameId: t.ctx.game.id,
    mongoConnectionString: env.MONGO_URL,
    mongoDatabaseName: env.MONGO_DB,
    unitNames: [unitName1, unitName2],
    userId: t.ctx.self.user.id,
  })
  t.ctx.self.gameDeck = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  const selfPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.self,
    turn: PlayerTurn.Current,
    ready: true,
    passed: false,
    score: 0,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.opponent,
    ready: true,
    score: 0,
  })
  const moves: (HistoryMove | HistoryPass)[] = []
  await LoginPage.login({
    username: t.ctx.self.user.name,
  })
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [[]],
  })

  const unitToMoveSelf1 = t.ctx.self.gameDeck.hand.find((unit) => unit.unit.name === unitName1)
  if (!unitToMoveSelf1) {
    throw Error(`Could not find unit in hand with name "${unitName1}"`)
  }
  const combatRowSelf1 = unitToMoveSelf1.unit.combats ? unitToMoveSelf1.unit.combats[0] : Combat.Close
  await GamePage.moveUnit({
    unitName: unitToMoveSelf1.unit.name,
    row: combatRowSelf1,
  })
  E2eHelper.playUnit({
    player: selfPlayer,
    gameDeck: t.ctx.self.gameDeck,
    deckUnit: unitToMoveSelf1,
    row: combatRowSelf1,
    moves,
    switchTurnsWith: opponentPlayer,
  })

  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [moves],
  })

  await GamePage.fullscreenCombatCard({
    unitName: unitName1,
    row: combatRowSelf1,
    self: true,
  })
  await FullCard.verify({
    unit: unitToMoveSelf1.unit,
  })
  await FullCard.close()

  const unitToMoveOpponent = t.ctx.opponent.gameDeck.hand[0]
  const combatRowOpponent = unitToMoveOpponent.unit.combats ? unitToMoveOpponent.unit.combats[0] : Combat.Close
  await t.ctx.opponent.client.playUnit({
    gameId: t.ctx.game.id,
    unitId: unitToMoveOpponent.unit.id,
    combat: combatRowOpponent,
  })
  E2eHelper.playUnit({
    player: opponentPlayer,
    gameDeck: t.ctx.opponent.gameDeck,
    deckUnit: unitToMoveOpponent,
    row: combatRowOpponent,
    moves,
    switchTurnsWith: selfPlayer,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [moves],
  })
})

test('Morale hero unit not effected by other morale', async (t) => {
  const unitName1 = 'Isengrim Faoiltiarna'
  const unitName2 = 'Olgierd Von Everec'
  await ensureUnitsInHand({
    gameId: t.ctx.game.id,
    mongoConnectionString: env.MONGO_URL,
    mongoDatabaseName: env.MONGO_DB,
    unitNames: [unitName1, unitName2],
    userId: t.ctx.self.user.id,
  })
  t.ctx.self.gameDeck = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  const selfPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.self,
    turn: PlayerTurn.Current,
    ready: true,
    passed: false,
    score: 0,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.opponent,
    ready: true,
    score: 0,
  })
  const moves: (HistoryMove | HistoryPass)[] = []
  await LoginPage.login({
    username: t.ctx.self.user.name,
  })
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [[]],
  })

  const unitToMoveSelf1 = t.ctx.self.gameDeck.hand.find((unit) => unit.unit.name === unitName1)
  if (!unitToMoveSelf1) {
    throw Error(`Could not find unit in hand with name "${unitName1}"`)
  }
  const combatRowSelf1 = unitToMoveSelf1.unit.combats ? unitToMoveSelf1.unit.combats[0] : Combat.Close
  await GamePage.moveUnit({
    unitName: unitToMoveSelf1.unit.name,
    row: combatRowSelf1,
  })
  E2eHelper.playUnit({
    player: selfPlayer,
    gameDeck: t.ctx.self.gameDeck,
    deckUnit: unitToMoveSelf1,
    row: combatRowSelf1,
    moves,
    switchTurnsWith: opponentPlayer,
  })

  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [moves],
  })

  await GamePage.fullscreenCombatCard({
    unitName: unitName1,
    row: combatRowSelf1,
    self: true,
  })
  await FullCard.verify({
    unit: unitToMoveSelf1.unit,
  })
  await FullCard.close()

  const unitToMoveOpponent = t.ctx.opponent.gameDeck.hand[0]
  const combatRowOpponent = unitToMoveOpponent.unit.combats ? unitToMoveOpponent.unit.combats[0] : Combat.Close
  await t.ctx.opponent.client.playUnit({
    gameId: t.ctx.game.id,
    unitId: unitToMoveOpponent.unit.id,
    combat: combatRowOpponent,
  })
  E2eHelper.playUnit({
    player: opponentPlayer,
    gameDeck: t.ctx.opponent.gameDeck,
    deckUnit: unitToMoveOpponent,
    row: combatRowOpponent,
    moves,
    switchTurnsWith: selfPlayer,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [moves],
  })

  const unitToMoveSelf2 = t.ctx.self.gameDeck.hand.find((unit) => unit.unit.name === unitName2)
  if (!unitToMoveSelf2) {
    throw Error(`Could not find unit in hand with name "${unitName2}"`)
  }
  const combatRowSelf2 = unitToMoveSelf2.unit.combats ? unitToMoveSelf2.unit.combats[0] : Combat.Close
  await GamePage.moveUnit({
    unitName: unitToMoveSelf2.unit.name,
    row: combatRowSelf2,
  })
  E2eHelper.playUnit({
    player: selfPlayer,
    gameDeck: t.ctx.self.gameDeck,
    deckUnit: unitToMoveSelf2,
    effectiveStrength: 7,
    row: combatRowSelf2,
    moves,
    switchTurnsWith: opponentPlayer,
  })

  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [moves],
  })

  await GamePage.fullscreenCombatCard({
    unitName: unitName2,
    row: combatRowSelf2,
    self: true,
  })
  await FullCard.verify({
    unit: unitToMoveSelf2.unit,
    effectiveStrength: 7,
    effects: [
      {
        operator: '+1',
        strength: 7,
        reason: `Morale from ${unitName1}`,
      },
    ],
  })
  await FullCard.next()
  await FullCard.verify({
    unit: unitToMoveSelf1.unit,
  })
})

test('Morale unit does not effect unit not in row', async (t) => {
  const unitName1 = 'Milva'
  const unitName2 = 'Dennis Cranmer'
  await ensureUnitsInHand({
    gameId: t.ctx.game.id,
    mongoConnectionString: env.MONGO_URL,
    mongoDatabaseName: env.MONGO_DB,
    unitNames: [unitName1, unitName2],
    userId: t.ctx.self.user.id,
  })
  t.ctx.self.gameDeck = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  const selfPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.self,
    turn: PlayerTurn.Current,
    ready: true,
    passed: false,
    score: 0,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.opponent,
    ready: true,
    score: 0,
  })
  const moves: (HistoryMove | HistoryPass)[] = []
  await LoginPage.login({
    username: t.ctx.self.user.name,
  })
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [[]],
  })

  const unitToMoveSelf1 = t.ctx.self.gameDeck.hand.find((unit) => unit.unit.name === unitName1)
  if (!unitToMoveSelf1) {
    throw Error(`Could not find unit in hand with name "${unitName1}"`)
  }
  const combatRowSelf1 = unitToMoveSelf1.unit.combats ? unitToMoveSelf1.unit.combats[0] : Combat.Close
  await GamePage.moveUnit({
    unitName: unitToMoveSelf1.unit.name,
    row: combatRowSelf1,
  })
  E2eHelper.playUnit({
    player: selfPlayer,
    gameDeck: t.ctx.self.gameDeck,
    deckUnit: unitToMoveSelf1,
    row: combatRowSelf1,
    moves,
    switchTurnsWith: opponentPlayer,
  })

  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [moves],
  })

  await GamePage.fullscreenCombatCard({
    unitName: unitName1,
    row: combatRowSelf1,
    self: true,
  })
  await FullCard.verify({
    unit: unitToMoveSelf1.unit,
  })
  await FullCard.close()

  const unitToMoveOpponent = t.ctx.opponent.gameDeck.hand[0]
  const combatRowOpponent = unitToMoveOpponent.unit.combats ? unitToMoveOpponent.unit.combats[0] : Combat.Close
  await t.ctx.opponent.client.playUnit({
    gameId: t.ctx.game.id,
    unitId: unitToMoveOpponent.unit.id,
    combat: combatRowOpponent,
  })
  E2eHelper.playUnit({
    player: opponentPlayer,
    gameDeck: t.ctx.opponent.gameDeck,
    deckUnit: unitToMoveOpponent,
    row: combatRowOpponent,
    moves,
    switchTurnsWith: selfPlayer,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [moves],
  })

  const unitToMoveSelf2 = t.ctx.self.gameDeck.hand.find((unit) => unit.unit.name === unitName2)
  if (!unitToMoveSelf2) {
    throw Error(`Could not find unit in hand with name "${unitName2}"`)
  }
  const combatRowSelf2 = unitToMoveSelf2.unit.combats ? unitToMoveSelf2.unit.combats[0] : Combat.Close
  await GamePage.moveUnit({
    unitName: unitToMoveSelf2.unit.name,
    row: combatRowSelf2,
  })
  E2eHelper.playUnit({
    player: selfPlayer,
    gameDeck: t.ctx.self.gameDeck,
    deckUnit: unitToMoveSelf2,
    row: combatRowSelf2,
    moves,
    switchTurnsWith: opponentPlayer,
  })

  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [moves],
  })

  await GamePage.fullscreenCombatCard({
    unitName: unitName2,
    row: combatRowSelf2,
    self: true,
  })
  await FullCard.verify({
    unit: unitToMoveSelf2.unit,
  })
})

test('Morale effects normal unit if morale played before', async (t) => {
  const unitName1 = 'Milva'
  const unitName2 = 'Toruviel'
  await ensureUnitsInHand({
    gameId: t.ctx.game.id,
    mongoConnectionString: env.MONGO_URL,
    mongoDatabaseName: env.MONGO_DB,
    unitNames: [unitName1, unitName2],
    userId: t.ctx.self.user.id,
  })
  t.ctx.self.gameDeck = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  const selfPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.self,
    turn: PlayerTurn.Current,
    ready: true,
    passed: false,
    score: 0,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.opponent,
    ready: true,
    score: 0,
  })
  const moves: (HistoryMove | HistoryPass)[] = []
  await LoginPage.login({
    username: t.ctx.self.user.name,
  })
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [[]],
  })

  const unitToMoveSelf1 = t.ctx.self.gameDeck.hand.find((unit) => unit.unit.name === unitName1)
  if (!unitToMoveSelf1) {
    throw Error(`Could not find unit in hand with name "${unitName1}"`)
  }
  const combatRowSelf1 = unitToMoveSelf1.unit.combats ? unitToMoveSelf1.unit.combats[0] : Combat.Close
  await GamePage.moveUnit({
    unitName: unitToMoveSelf1.unit.name,
    row: combatRowSelf1,
  })
  E2eHelper.playUnit({
    player: selfPlayer,
    gameDeck: t.ctx.self.gameDeck,
    deckUnit: unitToMoveSelf1,
    row: combatRowSelf1,
    moves,
    switchTurnsWith: opponentPlayer,
  })

  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [moves],
  })

  await GamePage.fullscreenCombatCard({
    unitName: unitName1,
    row: combatRowSelf1,
    self: true,
  })
  await FullCard.verify({
    unit: unitToMoveSelf1.unit,
  })
  await FullCard.close()

  const unitToMoveOpponent = t.ctx.opponent.gameDeck.hand[0]
  const combatRowOpponent = unitToMoveOpponent.unit.combats ? unitToMoveOpponent.unit.combats[0] : Combat.Close
  await t.ctx.opponent.client.playUnit({
    gameId: t.ctx.game.id,
    unitId: unitToMoveOpponent.unit.id,
    combat: combatRowOpponent,
  })
  E2eHelper.playUnit({
    player: opponentPlayer,
    gameDeck: t.ctx.opponent.gameDeck,
    deckUnit: unitToMoveOpponent,
    row: combatRowOpponent,
    moves,
    switchTurnsWith: selfPlayer,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [moves],
  })

  const unitToMoveSelf2 = t.ctx.self.gameDeck.hand.find((unit) => unit.unit.name === unitName2)
  if (!unitToMoveSelf2) {
    throw Error(`Could not find unit in hand with name "${unitName2}"`)
  }
  const combatRowSelf2 = unitToMoveSelf2.unit.combats ? unitToMoveSelf2.unit.combats[0] : Combat.Close
  await GamePage.moveUnit({
    unitName: unitToMoveSelf2.unit.name,
    row: combatRowSelf2,
  })
  E2eHelper.playUnit({
    player: selfPlayer,
    gameDeck: t.ctx.self.gameDeck,
    deckUnit: unitToMoveSelf2,
    effectiveStrength: 3,
    row: combatRowSelf2,
    moves,
    switchTurnsWith: opponentPlayer,
  })

  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [moves],
  })

  await GamePage.fullscreenCombatCard({
    unitName: unitName2,
    row: combatRowSelf2,
    self: true,
  })
  await FullCard.verify({
    unit: unitToMoveSelf2.unit,
    effectiveStrength: 3,
    effects: [
      {
        operator: '+1',
        strength: 3,
        reason: `Morale from ${unitName1}`,
      },
    ],
  })
  await FullCard.next()
  await FullCard.verify({
    unit: unitToMoveSelf1.unit,
  })
})

test('Morale effects normal unit if morale played after', async (t) => {
  const unitName1 = 'Toruviel'
  const unitName2 = 'Milva'
  await ensureUnitsInHand({
    gameId: t.ctx.game.id,
    mongoConnectionString: env.MONGO_URL,
    mongoDatabaseName: env.MONGO_DB,
    unitNames: [unitName2, unitName1],
    userId: t.ctx.self.user.id,
  })
  t.ctx.self.gameDeck = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  const selfPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.self,
    turn: PlayerTurn.Current,
    ready: true,
    passed: false,
    score: 0,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.opponent,
    ready: true,
    score: 0,
  })
  const moves: (HistoryMove | HistoryPass)[] = []
  await LoginPage.login({
    username: t.ctx.self.user.name,
  })
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [[]],
  })

  const unitToMoveSelf1 = t.ctx.self.gameDeck.hand.find((unit) => unit.unit.name === unitName1)
  if (!unitToMoveSelf1) {
    throw Error(`Could not find unit in hand with name "${unitName1}"`)
  }
  const combatRowSelf1 = unitToMoveSelf1.unit.combats ? unitToMoveSelf1.unit.combats[0] : Combat.Close
  await GamePage.moveUnit({
    unitName: unitToMoveSelf1.unit.name,
    row: combatRowSelf1,
  })
  E2eHelper.playUnit({
    player: selfPlayer,
    gameDeck: t.ctx.self.gameDeck,
    deckUnit: unitToMoveSelf1,
    row: combatRowSelf1,
    moves,
    switchTurnsWith: opponentPlayer,
  })

  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [moves],
  })

  await GamePage.fullscreenCombatCard({
    unitName: unitName1,
    row: combatRowSelf1,
    self: true,
  })
  await FullCard.verify({
    unit: unitToMoveSelf1.unit,
  })
  await FullCard.close()

  const unitToMoveOpponent = t.ctx.opponent.gameDeck.hand[0]
  const combatRowOpponent = unitToMoveOpponent.unit.combats ? unitToMoveOpponent.unit.combats[0] : Combat.Close
  await t.ctx.opponent.client.playUnit({
    gameId: t.ctx.game.id,
    unitId: unitToMoveOpponent.unit.id,
    combat: combatRowOpponent,
  })
  E2eHelper.playUnit({
    player: opponentPlayer,
    gameDeck: t.ctx.opponent.gameDeck,
    deckUnit: unitToMoveOpponent,
    row: combatRowOpponent,
    moves,
    switchTurnsWith: selfPlayer,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [moves],
  })

  const unitToMoveSelf2 = t.ctx.self.gameDeck.hand.find((unit) => unit.unit.name === unitName2)
  if (!unitToMoveSelf2) {
    throw Error(`Could not find unit in hand with name "${unitName2}"`)
  }
  const combatRowSelf2 = unitToMoveSelf2.unit.combats ? unitToMoveSelf2.unit.combats[0] : Combat.Close
  await GamePage.moveUnit({
    unitName: unitToMoveSelf2.unit.name,
    row: combatRowSelf2,
  })
  E2eHelper.playUnit({
    player: selfPlayer,
    gameDeck: t.ctx.self.gameDeck,
    deckUnit: unitToMoveSelf2,
    row: combatRowSelf2,
    moves,
    switchTurnsWith: opponentPlayer,
  })
  E2eHelper.setEffectiveStrength({
    player: selfPlayer,
    effectiveStrength: 3,
    unitName: unitName1,
    row: combatRowSelf1,
  })

  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [moves],
  })

  await GamePage.fullscreenCombatCard({
    unitName: unitName1,
    row: combatRowSelf1,
    self: true,
  })
  await FullCard.verify({
    unit: unitToMoveSelf1.unit,
    effectiveStrength: 3,
    effects: [
      {
        operator: '+1',
        strength: 3,
        reason: `Morale from ${unitName2}`,
      },
    ],
  })
  await FullCard.next()
  await FullCard.verify({
    unit: unitToMoveSelf2.unit,
  })
})

test('Morale effects multiple normal units', async (t) => {
  const unitName1 = 'Toruviel'
  const unitName2 = 'Ida Emean aep Sivney'
  const unitName3 = 'Milva'
  await ensureUnitsInHand({
    gameId: t.ctx.game.id,
    mongoConnectionString: env.MONGO_URL,
    mongoDatabaseName: env.MONGO_DB,
    unitNames: [unitName3, unitName1, unitName2],
    userId: t.ctx.self.user.id,
  })
  t.ctx.self.gameDeck = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  const selfPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.self,
    turn: PlayerTurn.Current,
    ready: true,
    passed: false,
    score: 0,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.opponent,
    ready: true,
    score: 0,
  })
  const moves: (HistoryMove | HistoryPass)[] = []
  await LoginPage.login({
    username: t.ctx.self.user.name,
  })
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [[]],
  })

  const unitToMoveSelf1 = t.ctx.self.gameDeck.hand.find((unit) => unit.unit.name === unitName1)
  if (!unitToMoveSelf1) {
    throw Error(`Could not find unit in hand with name "${unitName1}"`)
  }
  const combatRowSelf1 = unitToMoveSelf1.unit.combats ? unitToMoveSelf1.unit.combats[0] : Combat.Close
  await GamePage.moveUnit({
    unitName: unitToMoveSelf1.unit.name,
    row: combatRowSelf1,
  })
  E2eHelper.playUnit({
    player: selfPlayer,
    gameDeck: t.ctx.self.gameDeck,
    deckUnit: unitToMoveSelf1,
    row: combatRowSelf1,
    moves,
    switchTurnsWith: opponentPlayer,
  })

  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [moves],
  })

  await GamePage.fullscreenCombatCard({
    unitName: unitName1,
    row: combatRowSelf1,
    self: true,
  })
  await FullCard.verify({
    unit: unitToMoveSelf1.unit,
  })
  await FullCard.close()

  const unitToMoveOpponent1 = t.ctx.opponent.gameDeck.hand[0]
  const combatRowOpponent1 = unitToMoveOpponent1.unit.combats ? unitToMoveOpponent1.unit.combats[0] : Combat.Close
  await t.ctx.opponent.client.playUnit({
    gameId: t.ctx.game.id,
    unitId: unitToMoveOpponent1.unit.id,
    combat: combatRowOpponent1,
  })
  E2eHelper.playUnit({
    player: opponentPlayer,
    gameDeck: t.ctx.opponent.gameDeck,
    deckUnit: unitToMoveOpponent1,
    row: combatRowOpponent1,
    moves,
    switchTurnsWith: selfPlayer,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [moves],
  })

  const unitToMoveSelf2 = t.ctx.self.gameDeck.hand.find((unit) => unit.unit.name === unitName2)
  if (!unitToMoveSelf2) {
    throw Error(`Could not find unit in hand with name "${unitName2}"`)
  }
  const combatRowSelf2 = unitToMoveSelf2.unit.combats ? unitToMoveSelf2.unit.combats[0] : Combat.Close
  await GamePage.moveUnit({
    unitName: unitToMoveSelf2.unit.name,
    row: combatRowSelf2,
  })
  E2eHelper.playUnit({
    player: selfPlayer,
    gameDeck: t.ctx.self.gameDeck,
    deckUnit: unitToMoveSelf2,
    row: combatRowSelf2,
    moves,
    switchTurnsWith: opponentPlayer,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [moves],
  })
  await GamePage.fullscreenCombatCard({
    unitName: unitName1,
    row: combatRowSelf1,
    self: true,
  })
  await FullCard.verify({
    unit: unitToMoveSelf1.unit,
  })
  await FullCard.next()
  await FullCard.verify({
    unit: unitToMoveSelf2.unit,
  })
  await FullCard.close()

  const unitToMoveOpponent2 = t.ctx.opponent.gameDeck.hand[1]
  const combatRowOpponent2 = unitToMoveOpponent2.unit.combats ? unitToMoveOpponent2.unit.combats[0] : Combat.Close
  await t.ctx.opponent.client.playUnit({
    gameId: t.ctx.game.id,
    unitId: unitToMoveOpponent2.unit.id,
    combat: combatRowOpponent2,
  })
  E2eHelper.playUnit({
    player: opponentPlayer,
    gameDeck: t.ctx.opponent.gameDeck,
    deckUnit: unitToMoveOpponent2,
    row: combatRowOpponent2,
    moves,
    switchTurnsWith: selfPlayer,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [moves],
  })

  const unitToMoveSelf3 = t.ctx.self.gameDeck.hand.find((unit) => unit.unit.name === unitName3)
  if (!unitToMoveSelf3) {
    throw Error(`Could not find unit in hand with name "${unitName3}"`)
  }
  const combatRowSelf3 = unitToMoveSelf3.unit.combats ? unitToMoveSelf3.unit.combats[0] : Combat.Close
  await GamePage.moveUnit({
    unitName: unitToMoveSelf3.unit.name,
    row: combatRowSelf3,
  })
  E2eHelper.playUnit({
    player: selfPlayer,
    gameDeck: t.ctx.self.gameDeck,
    deckUnit: unitToMoveSelf3,
    row: combatRowSelf3,
    moves,
    switchTurnsWith: opponentPlayer,
  })
  E2eHelper.setEffectiveStrength({
    player: selfPlayer,
    effectiveStrength: 3,
    unitName: unitName1,
    row: combatRowSelf1,
  })
  E2eHelper.setEffectiveStrength({
    player: selfPlayer,
    effectiveStrength: 7,
    unitName: unitName2,
    row: combatRowSelf2,
  })

  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [moves],
  })

  await GamePage.fullscreenCombatCard({
    unitName: unitName1,
    row: combatRowSelf1,
    self: true,
  })
  await FullCard.verify({
    unit: unitToMoveSelf1.unit,
    effectiveStrength: 3,
    effects: [
      {
        operator: '+1',
        strength: 3,
        reason: `Morale from ${unitName3}`,
      },
    ],
  })
  await FullCard.next()
  await FullCard.verify({
    unit: unitToMoveSelf2.unit,
    effectiveStrength: 7,
    effects: [
      {
        operator: '+1',
        strength: 7,
        reason: `Morale from ${unitName3}`,
      },
    ],
  })
  await FullCard.next()
  await FullCard.verify({
    unit: unitToMoveSelf3.unit,
  })
})

test('Multiple morales effect each other', async (t) => {
  const unitName1 = 'Milva'
  const unitName2 = 'Olgierd Von Everec'
  await ensureUnitsInHand({
    gameId: t.ctx.game.id,
    mongoConnectionString: env.MONGO_URL,
    mongoDatabaseName: env.MONGO_DB,
    unitNames: [unitName1, unitName2],
    userId: t.ctx.self.user.id,
  })
  t.ctx.self.gameDeck = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  const selfPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.self,
    turn: PlayerTurn.Current,
    ready: true,
    passed: false,
    score: 0,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.opponent,
    ready: true,
    score: 0,
  })
  const moves: (HistoryMove | HistoryPass)[] = []
  await LoginPage.login({
    username: t.ctx.self.user.name,
  })
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [[]],
  })

  const unitToMoveSelf1 = t.ctx.self.gameDeck.hand.find((unit) => unit.unit.name === unitName1)
  if (!unitToMoveSelf1) {
    throw Error(`Could not find unit in hand with name "${unitName1}"`)
  }
  const combatRowSelf1 = unitToMoveSelf1.unit.combats ? unitToMoveSelf1.unit.combats[0] : Combat.Close
  await GamePage.moveUnit({
    unitName: unitToMoveSelf1.unit.name,
    row: combatRowSelf1,
  })
  E2eHelper.playUnit({
    player: selfPlayer,
    gameDeck: t.ctx.self.gameDeck,
    deckUnit: unitToMoveSelf1,
    row: combatRowSelf1,
    moves,
    switchTurnsWith: opponentPlayer,
  })

  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [moves],
  })

  await GamePage.fullscreenCombatCard({
    unitName: unitName1,
    row: combatRowSelf1,
    self: true,
  })
  await FullCard.verify({
    unit: unitToMoveSelf1.unit,
  })
  await FullCard.close()

  const unitToMoveOpponent = t.ctx.opponent.gameDeck.hand[0]
  const combatRowOpponent = unitToMoveOpponent.unit.combats ? unitToMoveOpponent.unit.combats[0] : Combat.Close
  await t.ctx.opponent.client.playUnit({
    gameId: t.ctx.game.id,
    unitId: unitToMoveOpponent.unit.id,
    combat: combatRowOpponent,
  })
  E2eHelper.playUnit({
    player: opponentPlayer,
    gameDeck: t.ctx.opponent.gameDeck,
    deckUnit: unitToMoveOpponent,
    row: combatRowOpponent,
    moves,
    switchTurnsWith: selfPlayer,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [moves],
  })

  const unitToMoveSelf2 = t.ctx.self.gameDeck.hand.find((unit) => unit.unit.name === unitName2)
  if (!unitToMoveSelf2) {
    throw Error(`Could not find unit in hand with name "${unitName2}"`)
  }
  const combatRowSelf2 = Combat.Ranged
  await GamePage.moveUnit({
    unitName: unitToMoveSelf2.unit.name,
    row: combatRowSelf2,
  })
  E2eHelper.playUnit({
    player: selfPlayer,
    gameDeck: t.ctx.self.gameDeck,
    deckUnit: unitToMoveSelf2,
    effectiveStrength: 7,
    row: combatRowSelf2,
    moves,
    switchTurnsWith: opponentPlayer,
  })
  E2eHelper.setEffectiveStrength({
    player: selfPlayer,
    effectiveStrength: 11,
    unitName: unitName1,
    row: combatRowSelf1,
  })

  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [moves],
  })

  await GamePage.fullscreenCombatCard({
    unitName: unitName1,
    row: combatRowSelf1,
    self: true,
  })
  await FullCard.verify({
    unit: unitToMoveSelf1.unit,
    effectiveStrength: 11,
    effects: [
      {
        operator: '+1',
        strength: 11,
        reason: `Morale from ${unitName2}`,
      },
    ],
  })
  await FullCard.previous()
  await FullCard.verify({
    unit: unitToMoveSelf2.unit,
    effectiveStrength: 7,
    effects: [
      {
        operator: '+1',
        strength: 7,
        reason: `Morale from ${unitName1}`,
      },
    ],
  })
})

test('Multiple morales effect themselves and multiple standard units in same row', async (t) => {
  const unitName1 = 'Milva'
  const unitName2 = 'Ida Emean aep Sivney'
  const unitName3 = 'Olgierd Von Everec'
  const unitName4 = 'Riordain'
  await ensureUnitsInHand({
    gameId: t.ctx.game.id,
    mongoConnectionString: env.MONGO_URL,
    mongoDatabaseName: env.MONGO_DB,
    unitNames: [unitName1, unitName2, unitName3, unitName4],
    userId: t.ctx.self.user.id,
  })
  t.ctx.self.gameDeck = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  const selfPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.self,
    turn: PlayerTurn.Current,
    ready: true,
    passed: false,
    score: 0,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.opponent,
    ready: true,
    score: 0,
  })
  const moves: (HistoryMove | HistoryPass)[] = []
  await LoginPage.login({
    username: t.ctx.self.user.name,
  })
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [[]],
  })

  const unitToMoveSelf1 = t.ctx.self.gameDeck.hand.find((unit) => unit.unit.name === unitName1)
  if (!unitToMoveSelf1) {
    throw Error(`Could not find unit in hand with name "${unitName1}"`)
  }
  const combatRowSelf1 = unitToMoveSelf1.unit.combats ? unitToMoveSelf1.unit.combats[0] : Combat.Close
  await GamePage.moveUnit({
    unitName: unitToMoveSelf1.unit.name,
    row: combatRowSelf1,
  })
  E2eHelper.playUnit({
    player: selfPlayer,
    gameDeck: t.ctx.self.gameDeck,
    deckUnit: unitToMoveSelf1,
    row: combatRowSelf1,
    moves,
    switchTurnsWith: opponentPlayer,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [moves],
  })

  const unitToMoveOpponent1 = t.ctx.opponent.gameDeck.hand[0]
  const combatRowOpponent1 = unitToMoveOpponent1.unit.combats ? unitToMoveOpponent1.unit.combats[0] : Combat.Close
  await t.ctx.opponent.client.playUnit({
    gameId: t.ctx.game.id,
    unitId: unitToMoveOpponent1.unit.id,
    combat: combatRowOpponent1,
  })
  E2eHelper.playUnit({
    player: opponentPlayer,
    gameDeck: t.ctx.opponent.gameDeck,
    deckUnit: unitToMoveOpponent1,
    row: combatRowOpponent1,
    moves,
    switchTurnsWith: selfPlayer,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [moves],
  })

  const unitToMoveSelf2 = t.ctx.self.gameDeck.hand.find((unit) => unit.unit.name === unitName2)
  if (!unitToMoveSelf2) {
    throw Error(`Could not find unit in hand with name "${unitName2}"`)
  }
  const combatRowSelf2 = unitToMoveSelf2.unit.combats ? unitToMoveSelf2.unit.combats[0] : Combat.Close
  await GamePage.moveUnit({
    unitName: unitToMoveSelf2.unit.name,
    row: combatRowSelf2,
  })
  E2eHelper.playUnit({
    player: selfPlayer,
    gameDeck: t.ctx.self.gameDeck,
    deckUnit: unitToMoveSelf2,
    effectiveStrength: 7,
    row: combatRowSelf2,
    moves,
    switchTurnsWith: opponentPlayer,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [moves],
  })

  const unitToMoveOpponent2 = t.ctx.opponent.gameDeck.hand[0]
  const combatRowOpponent2 = unitToMoveOpponent2.unit.combats ? unitToMoveOpponent2.unit.combats[0] : Combat.Close
  await t.ctx.opponent.client.playUnit({
    gameId: t.ctx.game.id,
    unitId: unitToMoveOpponent2.unit.id,
    combat: combatRowOpponent2,
  })
  E2eHelper.playUnit({
    player: opponentPlayer,
    gameDeck: t.ctx.opponent.gameDeck,
    deckUnit: unitToMoveOpponent2,
    row: combatRowOpponent2,
    moves,
    switchTurnsWith: selfPlayer,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [moves],
  })

  const unitToMoveSelf3 = t.ctx.self.gameDeck.hand.find((unit) => unit.unit.name === unitName3)
  if (!unitToMoveSelf3) {
    throw Error(`Could not find unit in hand with name "${unitName3}"`)
  }
  const combatRowSelf3 = Combat.Ranged
  await GamePage.moveUnit({
    unitName: unitToMoveSelf3.unit.name,
    row: combatRowSelf3,
  })
  E2eHelper.playUnit({
    player: selfPlayer,
    gameDeck: t.ctx.self.gameDeck,
    deckUnit: unitToMoveSelf3,
    effectiveStrength: 7,
    row: combatRowSelf3,
    moves,
    switchTurnsWith: opponentPlayer,
  })
  E2eHelper.setEffectiveStrength({
    player: selfPlayer,
    effectiveStrength: 11,
    unitName: unitName1,
    row: combatRowSelf1,
  })
  E2eHelper.setEffectiveStrength({
    player: selfPlayer,
    effectiveStrength: 8,
    unitName: unitName2,
    row: combatRowSelf2,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [moves],
  })

  const unitToMoveOpponent3 = t.ctx.opponent.gameDeck.hand[0]
  const combatRowOpponent3 = unitToMoveOpponent3.unit.combats ? unitToMoveOpponent3.unit.combats[0] : Combat.Close
  await t.ctx.opponent.client.playUnit({
    gameId: t.ctx.game.id,
    unitId: unitToMoveOpponent3.unit.id,
    combat: combatRowOpponent3,
  })
  E2eHelper.playUnit({
    player: opponentPlayer,
    gameDeck: t.ctx.opponent.gameDeck,
    deckUnit: unitToMoveOpponent3,
    row: combatRowOpponent3,
    moves,
    switchTurnsWith: selfPlayer,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [moves],
  })

  const unitToMoveSelf4 = t.ctx.self.gameDeck.hand.find((unit) => unit.unit.name === unitName4)
  if (!unitToMoveSelf4) {
    throw Error(`Could not find unit in hand with name "${unitName4}"`)
  }
  const combatRowSelf4 = unitToMoveSelf4.unit.combats ? unitToMoveSelf4.unit.combats[0] : Combat.Close
  await GamePage.moveUnit({
    unitName: unitToMoveSelf4.unit.name,
    row: combatRowSelf4,
  })
  E2eHelper.playUnit({
    player: selfPlayer,
    gameDeck: t.ctx.self.gameDeck,
    deckUnit: unitToMoveSelf4,
    effectiveStrength: 3,
    row: combatRowSelf4,
    moves,
    switchTurnsWith: opponentPlayer,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [moves],
  })

  await GamePage.fullscreenCombatCard({
    unitName: unitName1,
    row: combatRowSelf1,
    self: true,
  })
  await FullCard.verify({
    unit: unitToMoveSelf1.unit,
    effectiveStrength: 11,
    effects: [
      {
        operator: '+1',
        strength: 11,
        reason: `Morale from ${unitName3}`,
      },
    ],
  })
  await FullCard.previous()
  await FullCard.verify({
    unit: unitToMoveSelf2.unit,
    effectiveStrength: 8,
    effects: [
      {
        operator: '+1',
        strength: 7,
        reason: `Morale from ${unitName1}`,
      },
      {
        operator: '+1',
        strength: 8,
        reason: `Morale from ${unitName3}`,
      },
    ],
  })
  await FullCard.previous()
  await FullCard.verify({
    unit: unitToMoveSelf3.unit,
    effectiveStrength: 7,
    effects: [
      {
        operator: '+1',
        strength: 7,
        reason: `Morale from ${unitName1}`,
      },
    ],
  })
  await FullCard.previous()
  await FullCard.verify({
    unit: unitToMoveSelf4.unit,
    effectiveStrength: 3,
    effects: [
      {
        operator: '+1',
        strength: 2,
        reason: `Morale from ${unitName1}`,
      },
      {
        operator: '+1',
        strength: 3,
        reason: `Morale from ${unitName3}`,
      },
    ],
  })
})

test('Multiple morales effect themselves and multiple standard units in different rows', async (t) => {
  const unitName1 = 'Milva'
  const unitName2 = 'Toruviel'
  const unitName3 = 'Isengrim Faoiltiarna'
  const unitName4 = 'Dennis Cranmer'
  await ensureUnitsInHand({
    gameId: t.ctx.game.id,
    mongoConnectionString: env.MONGO_URL,
    mongoDatabaseName: env.MONGO_DB,
    unitNames: [unitName1, unitName2, unitName3, unitName4],
    userId: t.ctx.self.user.id,
  })
  t.ctx.self.gameDeck = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  const selfPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.self,
    turn: PlayerTurn.Current,
    ready: true,
    passed: false,
    score: 0,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.opponent,
    ready: true,
    score: 0,
  })
  const moves: (HistoryMove | HistoryPass)[] = []
  await LoginPage.login({
    username: t.ctx.self.user.name,
  })
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [[]],
  })

  const unitToMoveSelf1 = t.ctx.self.gameDeck.hand.find((unit) => unit.unit.name === unitName1)
  if (!unitToMoveSelf1) {
    throw Error(`Could not find unit in hand with name "${unitName1}"`)
  }
  const combatRowSelf1 = unitToMoveSelf1.unit.combats ? unitToMoveSelf1.unit.combats[0] : Combat.Close
  await GamePage.moveUnit({
    unitName: unitToMoveSelf1.unit.name,
    row: combatRowSelf1,
  })
  E2eHelper.playUnit({
    player: selfPlayer,
    gameDeck: t.ctx.self.gameDeck,
    deckUnit: unitToMoveSelf1,
    row: combatRowSelf1,
    moves,
    switchTurnsWith: opponentPlayer,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [moves],
  })

  const unitToMoveOpponent1 = t.ctx.opponent.gameDeck.hand[0]
  const combatRowOpponent1 = unitToMoveOpponent1.unit.combats ? unitToMoveOpponent1.unit.combats[0] : Combat.Close
  await t.ctx.opponent.client.playUnit({
    gameId: t.ctx.game.id,
    unitId: unitToMoveOpponent1.unit.id,
    combat: combatRowOpponent1,
  })
  E2eHelper.playUnit({
    player: opponentPlayer,
    gameDeck: t.ctx.opponent.gameDeck,
    deckUnit: unitToMoveOpponent1,
    row: combatRowOpponent1,
    moves,
    switchTurnsWith: selfPlayer,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [moves],
  })

  const unitToMoveSelf2 = t.ctx.self.gameDeck.hand.find((unit) => unit.unit.name === unitName2)
  if (!unitToMoveSelf2) {
    throw Error(`Could not find unit in hand with name "${unitName2}"`)
  }
  const combatRowSelf2 = unitToMoveSelf2.unit.combats ? unitToMoveSelf2.unit.combats[0] : Combat.Close
  await GamePage.moveUnit({
    unitName: unitToMoveSelf2.unit.name,
    row: combatRowSelf2,
  })
  E2eHelper.playUnit({
    player: selfPlayer,
    gameDeck: t.ctx.self.gameDeck,
    deckUnit: unitToMoveSelf2,
    effectiveStrength: 3,
    row: combatRowSelf2,
    moves,
    switchTurnsWith: opponentPlayer,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [moves],
  })

  const unitToMoveOpponent2 = t.ctx.opponent.gameDeck.hand[0]
  const combatRowOpponent2 = unitToMoveOpponent2.unit.combats ? unitToMoveOpponent2.unit.combats[0] : Combat.Close
  await t.ctx.opponent.client.playUnit({
    gameId: t.ctx.game.id,
    unitId: unitToMoveOpponent2.unit.id,
    combat: combatRowOpponent2,
  })
  E2eHelper.playUnit({
    player: opponentPlayer,
    gameDeck: t.ctx.opponent.gameDeck,
    deckUnit: unitToMoveOpponent2,
    row: combatRowOpponent2,
    moves,
    switchTurnsWith: selfPlayer,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [moves],
  })

  const unitToMoveSelf3 = t.ctx.self.gameDeck.hand.find((unit) => unit.unit.name === unitName3)
  if (!unitToMoveSelf3) {
    throw Error(`Could not find unit in hand with name "${unitName3}"`)
  }
  const combatRowSelf3 = unitToMoveSelf3.unit.combats ? unitToMoveSelf3.unit.combats[0] : Combat.Close
  await GamePage.moveUnit({
    unitName: unitToMoveSelf3.unit.name,
    row: combatRowSelf3,
  })
  E2eHelper.playUnit({
    player: selfPlayer,
    gameDeck: t.ctx.self.gameDeck,
    deckUnit: unitToMoveSelf3,
    row: combatRowSelf3,
    moves,
    switchTurnsWith: opponentPlayer,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [moves],
  })

  const unitToMoveOpponent3 = t.ctx.opponent.gameDeck.hand[0]
  const combatRowOpponent3 = unitToMoveOpponent3.unit.combats ? unitToMoveOpponent3.unit.combats[0] : Combat.Close
  await t.ctx.opponent.client.playUnit({
    gameId: t.ctx.game.id,
    unitId: unitToMoveOpponent3.unit.id,
    combat: combatRowOpponent3,
  })
  E2eHelper.playUnit({
    player: opponentPlayer,
    gameDeck: t.ctx.opponent.gameDeck,
    deckUnit: unitToMoveOpponent3,
    row: combatRowOpponent3,
    moves,
    switchTurnsWith: selfPlayer,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [moves],
  })

  const unitToMoveSelf4 = t.ctx.self.gameDeck.hand.find((unit) => unit.unit.name === unitName4)
  if (!unitToMoveSelf4) {
    throw Error(`Could not find unit in hand with name "${unitName4}"`)
  }
  const combatRowSelf4 = unitToMoveSelf4.unit.combats ? unitToMoveSelf4.unit.combats[0] : Combat.Close
  await GamePage.moveUnit({
    unitName: unitToMoveSelf4.unit.name,
    row: combatRowSelf4,
  })
  E2eHelper.playUnit({
    player: selfPlayer,
    gameDeck: t.ctx.self.gameDeck,
    deckUnit: unitToMoveSelf4,
    effectiveStrength: 7,
    row: combatRowSelf4,
    moves,
    switchTurnsWith: opponentPlayer,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [moves],
  })

  await GamePage.fullscreenCombatCard({
    unitName: unitName1,
    row: combatRowSelf1,
    self: true,
  })
  await FullCard.verify({
    unit: unitToMoveSelf1.unit,
  })
  await FullCard.previous()
  await FullCard.verify({
    unit: unitToMoveSelf2.unit,
    effectiveStrength: 3,
    effects: [
      {
        operator: '+1',
        strength: 3,
        reason: `Morale from ${unitName1}`,
      },
    ],
  })
  await FullCard.close()
  await GamePage.fullscreenCombatCard({
    unitName: unitName3,
    row: combatRowSelf3,
    self: true,
  })
  await FullCard.verify({
    unit: unitToMoveSelf3.unit,
  })
  await FullCard.previous()
  await FullCard.verify({
    unit: unitToMoveSelf4.unit,
    effectiveStrength: 7,
    effects: [
      {
        operator: '+1',
        strength: 7,
        reason: `Morale from ${unitName3}`,
      },
    ],
  })
})

test('Can see reason for morale in opponents fullcard details', async (t) => {
  const unitName1 = 'Milva'
  const unitName2 = 'Toruviel'
  await ensureUnitsInHand({
    gameId: t.ctx.game.id,
    mongoConnectionString: env.MONGO_URL,
    mongoDatabaseName: env.MONGO_DB,
    unitNames: [unitName1, unitName2],
    userId: t.ctx.self.user.id,
  })
  t.ctx.self.gameDeck = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  const selfPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.self,
    turn: PlayerTurn.Current,
    ready: true,
    passed: false,
    score: 0,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.opponent,
    ready: true,
    score: 0,
  })
  const moves: (HistoryMove | HistoryPass)[] = []
  await LoginPage.login({
    username: t.ctx.self.user.name,
  })
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [[]],
  })

  const unitToMoveSelf1 = t.ctx.self.gameDeck.hand.find((unit) => unit.unit.name === unitName1)
  if (!unitToMoveSelf1) {
    throw Error(`Could not find unit in hand with name "${unitName1}"`)
  }
  const combatRowSelf1 = unitToMoveSelf1.unit.combats ? unitToMoveSelf1.unit.combats[0] : Combat.Close
  await GamePage.moveUnit({
    unitName: unitToMoveSelf1.unit.name,
    row: combatRowSelf1,
  })
  E2eHelper.playUnit({
    player: selfPlayer,
    gameDeck: t.ctx.self.gameDeck,
    deckUnit: unitToMoveSelf1,
    row: combatRowSelf1,
    moves,
    switchTurnsWith: opponentPlayer,
  })

  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [moves],
  })

  await GamePage.fullscreenCombatCard({
    unitName: unitName1,
    row: combatRowSelf1,
    self: true,
  })
  await FullCard.verify({
    unit: unitToMoveSelf1.unit,
  })
  await FullCard.close()

  const unitToMoveOpponent = t.ctx.opponent.gameDeck.hand[0]
  const combatRowOpponent = unitToMoveOpponent.unit.combats ? unitToMoveOpponent.unit.combats[0] : Combat.Close
  await t.ctx.opponent.client.playUnit({
    gameId: t.ctx.game.id,
    unitId: unitToMoveOpponent.unit.id,
    combat: combatRowOpponent,
  })
  E2eHelper.playUnit({
    player: opponentPlayer,
    gameDeck: t.ctx.opponent.gameDeck,
    deckUnit: unitToMoveOpponent,
    row: combatRowOpponent,
    moves,
    switchTurnsWith: selfPlayer,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [moves],
  })

  const unitToMoveSelf2 = t.ctx.self.gameDeck.hand.find((unit) => unit.unit.name === unitName2)
  if (!unitToMoveSelf2) {
    throw Error(`Could not find unit in hand with name "${unitName2}"`)
  }
  const combatRowSelf2 = unitToMoveSelf2.unit.combats ? unitToMoveSelf2.unit.combats[0] : Combat.Close
  await GamePage.moveUnit({
    unitName: unitToMoveSelf2.unit.name,
    row: combatRowSelf2,
  })
  E2eHelper.playUnit({
    player: selfPlayer,
    gameDeck: t.ctx.self.gameDeck,
    deckUnit: unitToMoveSelf2,
    effectiveStrength: 3,
    row: combatRowSelf2,
    moves,
    switchTurnsWith: opponentPlayer,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [moves],
  })

  await E2eHelper.switchToUser({
    username: t.ctx.opponent.user.name,
  })
  opponentPlayer.passed = false
  selfPlayer.passed = undefined

  await GamePage.verify({
    opponent: selfPlayer,
    self: opponentPlayer,
    hand: t.ctx.opponent.gameDeck.hand,
    moves: [moves],
  })

  await GamePage.fullscreenCombatCard({
    unitName: unitName2,
    row: combatRowSelf2,
    self: false,
  })
  await FullCard.verify({
    unit: unitToMoveSelf2.unit,
    effectiveStrength: 3,
    effects: [
      {
        operator: '+1',
        strength: 3,
        reason: `Morale from ${unitName1}`,
      },
    ],
  })
  await FullCard.next()
  await FullCard.verify({
    unit: unitToMoveSelf1.unit,
  })
})

test('Morale scores persist to end of game', async (t) => {
  const unitName1 = 'Milva'
  const unitName2 = 'Toruviel'
  const unitName3 = 'Isengrim Faoiltiarna'
  const unitName4 = 'Dennis Cranmer'
  const unitName5 = 'Olgierd Von Everec'
  const unitName6 = 'Cynthia'
  await ensureUnitsInHand({
    gameId: t.ctx.game.id,
    mongoConnectionString: env.MONGO_URL,
    mongoDatabaseName: env.MONGO_DB,
    unitNames: [unitName1, unitName2, unitName3, unitName4],
    userId: t.ctx.self.user.id,
  })
  await ensureUnitsInHand({
    gameId: t.ctx.game.id,
    mongoConnectionString: env.MONGO_URL,
    mongoDatabaseName: env.MONGO_DB,
    unitNames: [unitName5, unitName6],
    userId: t.ctx.opponent.user.id,
  })
  t.ctx.self.gameDeck = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  t.ctx.opponent.gameDeck = await t.ctx.opponent.client.getGameDeck(t.ctx.game.id)
  const selfPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.self,
    turn: PlayerTurn.Current,
    ready: true,
    passed: false,
    score: 0,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.opponent,
    ready: true,
    score: 0,
  })
  const movesRound1: (HistoryMove | HistoryPass)[] = []
  const movesRound2: (HistoryMove | HistoryPass)[] = []
  const movesRound3: (HistoryMove | HistoryPass)[] = []
  await LoginPage.login({
    username: t.ctx.self.user.name,
  })
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [[]],
  })

  // round 1
  const unitToMoveSelf1 = t.ctx.self.gameDeck.hand.find((unit) => unit.unit.name === unitName1)
  if (!unitToMoveSelf1) {
    throw Error(`Could not find unit in hand with name "${unitName1}"`)
  }
  const combatRowSelf1 = unitToMoveSelf1.unit.combats ? unitToMoveSelf1.unit.combats[0] : Combat.Close
  await GamePage.moveUnit({
    unitName: unitToMoveSelf1.unit.name,
    row: combatRowSelf1,
  })
  E2eHelper.playUnit({
    player: selfPlayer,
    gameDeck: t.ctx.self.gameDeck,
    deckUnit: unitToMoveSelf1,
    row: combatRowSelf1,
    moves: movesRound1,
    switchTurnsWith: opponentPlayer,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [movesRound1],
  })

  await t.ctx.opponent.client.playPass({
    gameId: t.ctx.game.id,
  })
  E2eHelper.playPass({
    player: opponentPlayer,
    moves: movesRound1,
    round: 1,
    switchTurnsWith: selfPlayer,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [movesRound1],
  })

  const unitToMoveSelf2 = t.ctx.self.gameDeck.hand.find((unit) => unit.unit.name === unitName2)
  if (!unitToMoveSelf2) {
    throw Error(`Could not find unit in hand with name "${unitName2}"`)
  }
  const combatRowSelf2 = unitToMoveSelf2.unit.combats ? unitToMoveSelf2.unit.combats[0] : Combat.Close
  await GamePage.moveUnit({
    unitName: unitToMoveSelf2.unit.name,
    row: combatRowSelf2,
  })
  E2eHelper.playUnit({
    player: selfPlayer,
    gameDeck: t.ctx.self.gameDeck,
    deckUnit: unitToMoveSelf2,
    effectiveStrength: 3,
    row: combatRowSelf2,
    moves: movesRound1,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [movesRound1],
  })

  await GamePage.pass({})
  E2eHelper.playPass({
    player: selfPlayer,
    moves: movesRound1,
    round: 1,
  })
  E2eHelper.endRound({
    self: selfPlayer,
    opponent: opponentPlayer,
    losers: [opponentPlayer],
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round: 2,
    moves: [movesRound1, movesRound2],
  })

  // round 2
  await GamePage.pass({})
  E2eHelper.playPass({
    player: selfPlayer,
    moves: movesRound2,
    round: 2,
    switchTurnsWith: opponentPlayer,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round: 2,
    moves: [movesRound1, movesRound2],
  })

  const unitToMoveOpponent1 = t.ctx.opponent.gameDeck.hand.find((unit) => unit.unit.name === unitName5)
  if (!unitToMoveOpponent1) {
    throw Error(`Could not find unit "${unitName5}" in opponents hand`)
  }
  const combatRowOpponent1 = Combat.Ranged
  await t.ctx.opponent.client.playUnit({
    gameId: t.ctx.game.id,
    unitId: unitToMoveOpponent1.unit.id,
    combat: combatRowOpponent1,
  })
  E2eHelper.playUnit({
    player: opponentPlayer,
    gameDeck: t.ctx.opponent.gameDeck,
    deckUnit: unitToMoveOpponent1,
    row: combatRowOpponent1,
    moves: movesRound2,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round: 2,
    moves: [movesRound1, movesRound2],
  })

  const unitToMoveOpponent2 = t.ctx.opponent.gameDeck.hand.find((unit) => unit.unit.name === unitName6)
  if (!unitToMoveOpponent2) {
    throw Error(`Could not find unit "${unitName6}" in opponents hand`)
  }
  const combatRowOpponent2 = unitToMoveOpponent2.unit.combats ? unitToMoveOpponent2.unit.combats[0] : Combat.Close
  await t.ctx.opponent.client.playUnit({
    gameId: t.ctx.game.id,
    unitId: unitToMoveOpponent2.unit.id,
    combat: combatRowOpponent2,
  })
  E2eHelper.playUnit({
    player: opponentPlayer,
    gameDeck: t.ctx.opponent.gameDeck,
    deckUnit: unitToMoveOpponent2,
    effectiveStrength: 5,
    row: combatRowOpponent2,
    moves: movesRound2,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round: 2,
    moves: [movesRound1, movesRound2],
  })

  await t.ctx.opponent.client.playPass({
    gameId: t.ctx.game.id,
  })
  E2eHelper.playPass({
    player: opponentPlayer,
    moves: movesRound2,
    round: 2,
  })
  E2eHelper.endRound({
    self: selfPlayer,
    opponent: opponentPlayer,
    losers: [selfPlayer],
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round: 3,
    moves: [movesRound1, movesRound2, movesRound3],
  })

  // round 3
  await t.ctx.opponent.client.playPass({
    gameId: t.ctx.game.id,
  })
  E2eHelper.playPass({
    player: opponentPlayer,
    moves: movesRound3,
    round: 3,
    switchTurnsWith: selfPlayer,
  })

  const unitToMoveSelf3 = t.ctx.self.gameDeck.hand.find((unit) => unit.unit.name === unitName3)
  if (!unitToMoveSelf3) {
    throw Error(`Could not find unit in hand with name "${unitName3}"`)
  }
  const combatRowSelf3 = unitToMoveSelf3.unit.combats ? unitToMoveSelf3.unit.combats[0] : Combat.Close
  await GamePage.moveUnit({
    unitName: unitToMoveSelf3.unit.name,
    row: combatRowSelf3,
  })
  E2eHelper.playUnit({
    player: selfPlayer,
    gameDeck: t.ctx.self.gameDeck,
    deckUnit: unitToMoveSelf3,
    row: combatRowSelf3,
    moves: movesRound3,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round: 3,
    moves: [movesRound1, movesRound2, movesRound3],
  })

  const unitToMoveSelf4 = t.ctx.self.gameDeck.hand.find((unit) => unit.unit.name === unitName4)
  if (!unitToMoveSelf4) {
    throw Error(`Could not find unit in hand with name "${unitName4}"`)
  }
  const combatRowSelf4 = unitToMoveSelf4.unit.combats ? unitToMoveSelf4.unit.combats[0] : Combat.Close
  await GamePage.moveUnit({
    unitName: unitToMoveSelf4.unit.name,
    row: combatRowSelf4,
  })
  E2eHelper.playUnit({
    player: selfPlayer,
    gameDeck: t.ctx.self.gameDeck,
    deckUnit: unitToMoveSelf4,
    effectiveStrength: 7,
    row: combatRowSelf4,
    moves: movesRound3,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    round: 3,
    moves: [movesRound1, movesRound2, movesRound3],
  })

  await GamePage.pass({})
  E2eHelper.playPass({
    player: selfPlayer,
    moves: movesRound3,
    round: 3,
  })
  E2eHelper.endRound({
    self: selfPlayer,
    opponent: opponentPlayer,
    losers: [opponentPlayer],
    gameOver: true,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [movesRound1, movesRound2, movesRound3],
    victors: [selfPlayer.name],
    rounds: [
      {
        creator: 13,
        opponent: 0,
      },
      {
        creator: 0,
        opponent: 11,
      },
      {
        creator: 17,
        opponent: 0,
      },
    ],
  })
})

// TODO: morale effect for other units go away if it gets scorched.
