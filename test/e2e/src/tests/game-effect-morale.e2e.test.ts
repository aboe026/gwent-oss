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

interface GamePlayTestCtx extends E2eCtx {
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
const fixture = getFixtureCtx<E2eCtx, GamePlayTestCtx>()
const test = getTestCtx<E2eCtx, GamePlayTestCtx>()

fixture('Game Effect Morale')
  .page(HomePage.getUrl())
  .beforeEach(async (t) => {
    t.ctx.scenario = 'game-play'
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
        'Iorveth',
        'Isengrim Faoiltiarna',
        'Mahakaman Defender',
        'Milva',
        'Olgierd Von Everec',
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
    unitNames: ['Isengrim Faoiltiarna', unitName, 'Olgierd Von Everec'],
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

test('Morale effects normal unit if morale played before', async (t) => {
  const unitName1 = 'Milva'
  const unitName2 = 'Toruviel'
  await ensureUnitsInHand({
    gameId: t.ctx.game.id,
    mongoConnectionString: env.MONGO_URL,
    mongoDatabaseName: env.MONGO_DB,
    unitNames: ['Isengrim Faoiltiarna', unitName1, 'Olgierd Von Everec', unitName2],
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
  t.ctx.opponent.client.playUnit({
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
    unitNames: ['Isengrim Faoiltiarna', unitName2, 'Olgierd Von Everec', unitName1],
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
  t.ctx.opponent.client.playUnit({
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

// TODO: morale effect multiple standard units
// TODO: multiple morales effect multiple standard units
// TODO: morale does not effect hero
// TODO: morales effect each other
// TODO: 3 morales
