import ApiClient from '../util/api-client'
import { Combat, FactionKey, Game } from '@gwent/graphql-schema/resolver-typings'
import { ContextGamePlayer, E2eHelper } from '../util/e2e-helper'
import { E2eCtx, E2ETestController, getFixtureCtx, getTestCtx } from '../util/e2e-ctx'
import E2eUtil from '../util/e2e-util'
import { ensureUnitsInHand } from '@gwent/test-utils'
import env from '../util/env'
import FullCard from '../components/full-card'
import GameManager from '../util/game-manager'
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
        'Scorch',
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
  const gameManager = await prepareGame({
    t,
    selfHandUnitNames: [unitName],
  })
  await gameManager.initialize({})

  await gameManager.deploy({ unitName })
})

test('Morale unit does not effect hero', async (t) => {
  const unitName1 = 'Eithne'
  const unitName2 = 'Milva'
  const gameManager = await prepareGame({
    t,
    selfHandUnitNames: [unitName1, unitName2],
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({})
  await gameManager.initialize({})

  await gameManager.deploy({ unitName: unitName2 })
})

test('Morale hero unit not effected by other morale', async (t) => {
  const unitName1 = 'Isengrim Faoiltiarna'
  const unitName2 = 'Olgierd Von Everec'
  const gameManager = await prepareGame({
    t,
    selfHandUnitNames: [unitName1, unitName2],
  })
  const deckUnit1 = await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({})
  await gameManager.initialize({})

  const deckUnit2 = await gameManager.deploy({
    unitName: unitName2,
    moraling: [
      {
        effectiveStrength: 7,
        name: unitName2,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })
  // TODO: move fullscreen verification ot full-card.e2e.test.ts?
  await GamePage.fullscreenCombatCard({
    unitName: unitName2,
    row: Combat.Close,
    self: true,
  })
  await FullCard.verify({
    unit: deckUnit2.unit,
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
    unit: deckUnit1.unit,
  })
})

test('Morale unit does not effect unit not in row', async (t) => {
  const unitName1 = 'Dennis Cranmer'
  const unitName2 = 'Milva'
  const gameManager = await prepareGame({
    t,
    selfHandUnitNames: [unitName1, unitName2],
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({})
  await gameManager.initialize({})

  await gameManager.deploy({ unitName: unitName2 })
})

// TODO: morale does not effect opponent unit

test('Morale effects normal unit if morale played before', async (t) => {
  const unitName1 = 'Milva'
  const unitName2 = 'Toruviel'
  const gameManager = await prepareGame({
    t,
    selfHandUnitNames: [unitName1, unitName2],
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({})
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName2,
    moraling: [
      {
        effectiveStrength: 3,
        row: Combat.Ranged,
        name: unitName2,
        player: gameManager.self.gamePlayer,
      },
    ],
  })
})

test('Morale effects normal unit if morale played after', async (t) => {
  const unitName1 = 'Toruviel'
  const unitName2 = 'Milva'
  const gameManager = await prepareGame({
    t,
    selfHandUnitNames: [unitName1, unitName2],
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({})
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName2,
    moraling: [
      {
        effectiveStrength: 3,
        row: Combat.Ranged,
        name: unitName1,
        player: gameManager.self.gamePlayer,
      },
    ],
  })
})

test('Morale effects multiple normal units', async (t) => {
  const unitName1 = 'Toruviel'
  const unitName2 = 'Ida Emean aep Sivney'
  const unitName3 = 'Milva'
  const gameManager = await prepareGame({
    t,
    selfHandUnitNames: [unitName1, unitName2, unitName3],
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({})
  await gameManager.deploy({ unitName: unitName2 })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName3,
    moraling: [
      {
        effectiveStrength: 3,
        row: Combat.Ranged,
        name: unitName1,
        player: gameManager.self.gamePlayer,
      },
      {
        effectiveStrength: 7,
        row: Combat.Ranged,
        name: unitName2,
        player: gameManager.self.gamePlayer,
      },
    ],
  })
})

test('Multiple morales effect each other', async (t) => {
  const unitName1 = 'Milva'
  const unitName2 = 'Olgierd Von Everec'
  const gameManager = await prepareGame({
    t,
    selfHandUnitNames: [unitName1, unitName2],
  })
  const deckUnit1 = await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({})
  await gameManager.initialize({})

  const deckUnit2 = await gameManager.deploy({
    unitName: unitName2,
    combat: Combat.Ranged,
    moraling: [
      {
        effectiveStrength: 11,
        row: Combat.Ranged,
        name: unitName1,
        player: gameManager.self.gamePlayer,
      },
      {
        effectiveStrength: 7,
        row: Combat.Ranged,
        name: unitName2,
        player: gameManager.self.gamePlayer,
      },
    ],
  })
  await GamePage.fullscreenCombatCard({
    unitName: unitName1,
    row: Combat.Ranged,
    self: true,
  })
  await FullCard.verify({
    unit: deckUnit1.unit,
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
    unit: deckUnit2.unit,
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
  const unitName1 = 'Riordain'
  const unitName2 = 'Ida Emean aep Sivney'
  const unitName3 = 'Milva'
  const unitName4 = 'Olgierd Von Everec'
  const gameManager = await prepareGame({
    t,
    selfHandUnitNames: [unitName1, unitName2, unitName3, unitName4],
  })
  const deckUnit1 = await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({})
  const deckUnit2 = await gameManager.deploy({ unitName: unitName2 })
  const deckUnit3 = await gameManager.deploy({
    unitName: unitName3,
    moraling: [
      {
        name: unitName1,
        effectiveStrength: 2,
        row: Combat.Ranged,
        player: gameManager.self.gamePlayer,
      },
      {
        name: unitName2,
        effectiveStrength: 7,
        row: Combat.Ranged,
        player: gameManager.self.gamePlayer,
      },
    ],
  })
  await gameManager.initialize({})

  const deckUnit4 = await gameManager.deploy({
    unitName: unitName4,
    combat: Combat.Ranged,
    moraling: [
      {
        name: unitName1,
        effectiveStrength: 3,
        row: Combat.Ranged,
        player: gameManager.self.gamePlayer,
      },
      {
        name: unitName2,
        effectiveStrength: 8,
        row: Combat.Ranged,
        player: gameManager.self.gamePlayer,
      },
      {
        name: unitName3,
        effectiveStrength: 11,
        row: Combat.Ranged,
        player: gameManager.self.gamePlayer,
      },
      {
        name: unitName4,
        effectiveStrength: 7,
        row: Combat.Ranged,
        player: gameManager.self.gamePlayer,
      },
    ],
  })
  await GamePage.fullscreenCombatCard({
    unitName: unitName1,
    row: Combat.Ranged,
    self: true,
  })
  await FullCard.verify({
    unit: deckUnit1.unit,
    effectiveStrength: 3,
    effects: [
      {
        operator: '+1',
        strength: 2,
        reason: `Morale from ${unitName3}`,
      },
      {
        operator: '+1',
        strength: 3,
        reason: `Morale from ${unitName4}`,
      },
    ],
  })
  await FullCard.next()
  await FullCard.verify({
    unit: deckUnit4.unit,
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
    unit: deckUnit2.unit,
    effectiveStrength: 8,
    effects: [
      {
        operator: '+1',
        strength: 7,
        reason: `Morale from ${unitName3}`,
      },
      {
        operator: '+1',
        strength: 8,
        reason: `Morale from ${unitName4}`,
      },
    ],
  })
  await FullCard.next()
  await FullCard.verify({
    unit: deckUnit3.unit,
    effectiveStrength: 11,
    effects: [
      {
        operator: '+1',
        strength: 11,
        reason: `Morale from ${unitName4}`,
      },
    ],
  })
})

test('Multiple morales effect themselves and multiple standard units in different rows', async (t) => {
  const unitName1 = 'Milva'
  const unitName2 = 'Toruviel'
  const unitName3 = 'Isengrim Faoiltiarna'
  const unitName4 = 'Dennis Cranmer'
  const gameManager = await prepareGame({
    t,
    selfHandUnitNames: [unitName1, unitName2, unitName3, unitName4],
  })
  const deckUnit1 = await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({})
  const deckUnit2 = await gameManager.deploy({
    unitName: unitName2,
    moraling: [
      {
        name: unitName2,
        effectiveStrength: 3,
        row: Combat.Ranged,
        player: gameManager.self.gamePlayer,
      },
    ],
  })
  const deckUnit3 = await gameManager.deploy({ unitName: unitName3 })
  await gameManager.initialize({})

  const deckUnit4 = await gameManager.deploy({
    unitName: unitName4,
    moraling: [
      {
        name: unitName4,
        effectiveStrength: 7,
        row: Combat.Close,
        player: gameManager.self.gamePlayer,
      },
    ],
  })

  await GamePage.fullscreenCombatCard({
    unitName: unitName1,
    row: Combat.Ranged,
    self: true,
  })
  await FullCard.verify({
    unit: deckUnit1.unit,
  })
  await FullCard.previous()
  await FullCard.verify({
    unit: deckUnit2.unit,
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
    row: Combat.Close,
    self: true,
  })
  await FullCard.verify({
    unit: deckUnit3.unit,
  })
  await FullCard.previous()
  await FullCard.verify({
    unit: deckUnit4.unit,
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
  const unitName1 = 'Albrich'
  const unitName2 = 'Olgierd Von Everec'
  const gameManager = await prepareGame({
    t,
    opponentHandUnitNames: [unitName1, unitName2],
  })
  await gameManager.pass({})
  const deckUnit1 = await gameManager.deploy({ unitName: unitName1 })
  await gameManager.initialize({})

  const deckUnit2 = await gameManager.deploy({
    unitName: unitName2,
    combat: Combat.Ranged,
    moraling: [
      {
        name: unitName1,
        effectiveStrength: 3,
        row: Combat.Ranged,
        player: gameManager.opponent.gamePlayer,
      },
    ],
  })
  await GamePage.fullscreenCombatCard({
    unitName: unitName1,
    row: Combat.Ranged,
    self: false,
  })
  await FullCard.verify({
    unit: deckUnit1.unit,
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
    unit: deckUnit2.unit,
  })
})

// TODO: fix this running through API instead of UI
// TODO: update this with units that would actually change outcome if morale didn't work properly
test.only('Morale scores persist to end of game', async (t) => {
  const unitName1 = 'Milva'
  const unitName2 = 'Toruviel'
  const unitName3 = 'Isengrim Faoiltiarna'
  const unitName4 = 'Dennis Cranmer'
  const unitName5 = 'Olgierd Von Everec'
  const unitName6 = 'Cynthia'
  const gameManager = await prepareGame({
    t,
    selfHandUnitNames: [unitName1, unitName2, unitName3, unitName4],
    opponentHandUnitNames: [unitName5, unitName6],
  })
  // round 1
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({})
  await gameManager.deploy({
    unitName: unitName2,
    moraling: [
      {
        name: unitName2,
        effectiveStrength: 3,
        row: Combat.Ranged,
        player: gameManager.self.gamePlayer,
      },
    ],
  })
  await gameManager.pass({
    switchTurnsWith: gameManager.self.gamePlayer,
  })
  // round 2
  await gameManager.pass({})
  await gameManager.deploy({ unitName: unitName5, combat: Combat.Ranged })
  await gameManager.deploy({
    unitName: unitName6,
    moraling: [
      {
        name: unitName6,
        effectiveStrength: 5,
        row: Combat.Ranged,
        player: gameManager.opponent.gamePlayer,
      },
    ],
  })
  await gameManager.pass({
    switchTurnsWith: gameManager.opponent.gamePlayer,
  })
  // round 3
  await gameManager.pass({})
  await gameManager.deploy({ unitName: unitName3 })
  await gameManager.deploy({
    unitName: unitName4,
    moraling: [
      {
        name: unitName4,
        effectiveStrength: 7,
        row: Combat.Close,
        player: gameManager.self.gamePlayer,
      },
    ],
  })
  await gameManager.initialize({})
  await gameManager.pass({
    victors: [gameManager.self.gamePlayer.name],
  })
})

test('Morale effect for other units goes away after it gets scorched', async (t) => {
  const unitName1 = 'Toruviel'
  const unitName2 = 'Vreemde'
  const unitName3 = 'Milva'
  const unitName4 = 'Scorch'
  await ensureUnitsInHand({
    gameId: t.ctx.game.id,
    mongoConnectionString: env.MONGO_URL,
    mongoDatabaseName: env.MONGO_DB,
    unitNames: [unitName1, unitName3],
    userId: t.ctx.self.user.id,
  })
  await ensureUnitsInHand({
    gameId: t.ctx.game.id,
    mongoConnectionString: env.MONGO_URL,
    mongoDatabaseName: env.MONGO_DB,
    unitNames: [unitName2, unitName4],
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

  const unitToMoveOpponent1 = t.ctx.opponent.gameDeck.hand.find((unit) => unit.unit.name === unitName2)
  if (!unitToMoveOpponent1) {
    throw Error(`Could not find unit in hand with name "${unitName2}"`)
  }
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

  const unitToMoveSelf2 = t.ctx.self.gameDeck.hand.find((unit) => unit.unit.name === unitName3)
  if (!unitToMoveSelf2) {
    throw Error(`Could not find unit in hand with name "${unitName3}"`)
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

  const unitToMoveOpponent2 = t.ctx.opponent.gameDeck.hand.find((unit) => unit.unit.name === unitName4)
  if (!unitToMoveOpponent2) {
    throw Error(`Could not find unit in hand with name "${unitName4}"`)
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
    row: combatRowOpponent2,
    moves,
    switchTurnsWith: selfPlayer,
    scorching: [
      {
        name: unitName3,
        player: selfPlayer,
        row: combatRowSelf2,
        strength: unitToMoveSelf2.unit.strength,
      },
    ],
  })
  E2eHelper.setEffectiveStrength({
    player: selfPlayer,
    unitName: unitName1,
    effectiveStrength: 2,
    row: combatRowSelf1,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [moves],
  })
})

// TODO: test effect works for both self and opponent

async function prepareGame({
  t,
  selfHandUnitNames,
  opponentHandUnitNames,
}: {
  t: E2ETestController<E2eCtx, GameEffectMoraleTestCtx>
  selfHandUnitNames?: string[]
  opponentHandUnitNames?: string[]
}): Promise<GameManager> {
  if (selfHandUnitNames) {
    await ensureUnitsInHand({
      gameId: t.ctx.game.id,
      mongoConnectionString: env.MONGO_URL,
      mongoDatabaseName: env.MONGO_DB,
      unitNames: selfHandUnitNames,
      userId: t.ctx.self.user.id,
    })
  }
  if (opponentHandUnitNames) {
    await ensureUnitsInHand({
      gameId: t.ctx.game.id,
      mongoConnectionString: env.MONGO_URL,
      mongoDatabaseName: env.MONGO_DB,
      unitNames: opponentHandUnitNames,
      userId: t.ctx.opponent.user.id,
    })
  }
  return new GameManager({
    gameId: t.ctx.game.id,
    self: {
      client: t.ctx.self.client,
      deck: await t.ctx.self.client.getGameDeck(t.ctx.game.id),
      gamePlayer: E2eHelper.getGamePlayer({
        player: t.ctx.self,
        turn: PlayerTurn.Current,
        ready: true,
        passed: false,
        score: 0,
      }),
    },
    opponent: {
      client: t.ctx.opponent.client,
      deck: await t.ctx.opponent.client.getGameDeck(t.ctx.game.id),
      gamePlayer: E2eHelper.getGamePlayer({
        player: t.ctx.opponent,
        ready: true,
        score: 0,
      }),
    },
  })
}
