import ApiClient from '../util/api-client'
import { Combat, FactionKey, Game } from '@gwent/graphql-schema/resolver-typings'
import { ContextGameDeck, ContextGamePlayer, E2eHelper } from '../util/e2e-helper'
import { E2eCtx, E2ETestController, getFixtureCtx, getTestCtx } from '../util/e2e-ctx'
import E2eUtil from '../util/e2e-util'
import { ensureUnitsInHand } from '@gwent/test-utils'
import env from '../util/env'
import GamePage, { HistoryMove, HistoryPass } from '../page-objects/game-page'
import HomePage from '../page-objects/home-page'
import LoginPage from '../page-objects/login-page'
import { PlayerTurn } from '../components/game-player-info'

interface GameEffectMoraleTestCtx extends E2eCtx {
  scenario: string
  self: ContextGamePlayer
  opponent: ContextGamePlayer
  monsters: ContextGameDeck
  nilfgaard: ContextGameDeck
  scoiatael: ContextGameDeck
  skellige: ContextGameDeck
  game: Game
}
const fixture = getFixtureCtx<E2eCtx, GameEffectMoraleTestCtx>()
const test = getTestCtx<E2eCtx, GameEffectMoraleTestCtx>()

fixture('Game Effect Scorch')
  .page(HomePage.getUrl())
  .beforeEach(async (t) => {
    t.ctx.scenario = 'game-effect-scorch'
    const self = await new ApiClient({}).addUser({
      name: `${t.ctx.scenario}-self-${t.ctx.start}`,
    })
    const opponent = await new ApiClient({}).addUser({
      name: `${t.ctx.scenario}-opponent-${t.ctx.start}`,
    })

    t.ctx.monsters = {
      faction: FactionKey.Monsters,
      leader: 'Eredin Bringer of Death',
      units: [
        'Draug',
        'Emiel Regis Rohellec Terzieff',
        'Endrega',
        'Fiend',
        'Fire Elemental',
        'Foglet',
        'Forktail',
        'Frightener',
        'Gargoyle',
        'Griffin',
        'Ice Giant',
        'Imlerith',
        'Leshen',
        'Plague Maiden',
        'Roach',
        'Scorch',
        'Toad',
        'Vesemir',
        'Villentretenmerth',
        'Werewolf',
        'Wyvern',
        'Zoltan Chivay',
      ],
    }
    t.ctx.nilfgaard = {
      faction: FactionKey.NilfgaardianEmpire,
      leader: 'Emhyr var Emreis His Imperial Majesty',
      units: [
        'Albrich',
        'Sweers',
        'Vreemde',
        'Morteisen',
        'Puttkammer',
        'Roach',
        'Rotten Mangonel',
        'Cynthia',
        'Rainfarn',
        'Vanhemar',
        'Emiel Regis Rohellec Terzieff',
        'Renuald aep Matsen',
        'Zerrikanian Fire Scorpion',
        'Zoltan Chivay',
        'Assire var Anahid',
        'Cahir Mawr Dyffryn aep Ceallach',
        'Fringilla Vigo',
        'Siege Engineer',
        'Vesemir',
        'Black Infantry Archer',
        'Black Infantry Archer',
        'Heavy Zerrikanian Fire Scorpion',
      ],
    }
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
        'Schirru',
        'Toruviel',
        'Triss Merigold',
        'Villentretenmerth',
        'Vrihedd Brigade Recruit',
        'Vrihedd Brigade Veteran',
        'Yaevinn',
        'Zoltan Chivay',
      ],
    }
    t.ctx.skellige = {
      faction: FactionKey.Skellige,
      leader: 'Crach an Craite',
      units: [
        'Blueboy Lugos',
        'Clan an Craite Warrior',
        'Clan Brokvar Archer',
        'Clan Brokvar Archer',
        'Clan Brokvar Archer',
        'Clan Dimun Pirate',
        'Clan Heymaey Skald',
        'Clan Tordarroch Armorsmith',
        'Donar an Hindar',
        'Emiel Regis Rohellec Terzieff',
        'Hjalmar',
        'Holger Blackhand',
        'Madman Lugos',
        'Olaf',
        'Scorch',
        'Svanrige',
        'Triss Merigold',
        'Udalryk',
        'Vesemir',
        'Villentretenmerth',
        'War Longship',
        'Zoltan Chivay',
      ],
    }

    const selfClient = new ApiClient({
      username: self.name,
    })
    const opponentClient = new ApiClient({
      username: opponent.name,
    })

    t.ctx.game = await selfClient.addGame([opponent.name])

    t.ctx.self = {
      user: self,
      client: selfClient,
    } as any
    t.ctx.opponent = {
      user: opponent,
      client: opponentClient,
    } as any
  })

test('Scorch does nothing if no other units on the battlefield', async (t) => {
  const unitName1 = 'Scorch'
  await prepareGame({
    t,
    self: {
      deck: t.ctx.monsters,
      hand: [unitName1],
    },
    opponent: {
      deck: t.ctx.scoiatael,
      hand: [],
    },
    selfFirst: true,
  })
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
    moves: [moves],
  })

  const unitToMoveSelf = t.ctx.self.gameDeck.hand.find((unit) => unit.unit.name === unitName1)
  if (!unitToMoveSelf) {
    throw Error(`Could not find unit in hand with name "${unitName1}"`)
  }
  const combatRowSelf = unitToMoveSelf.unit.combats ? unitToMoveSelf.unit.combats[0] : Combat.Close
  await GamePage.moveUnit({
    unitName: unitToMoveSelf.unit.name,
    row: combatRowSelf,
  })
  E2eHelper.playUnit({
    player: selfPlayer,
    gameDeck: t.ctx.self.gameDeck,
    deckUnit: unitToMoveSelf,
    row: combatRowSelf,
    moves,
    switchTurnsWith: opponentPlayer,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [moves],
  })
})

test('Scorch removes strongest card if on opponents side', async (t) => {
  const unitName1 = 'Dennis Cranmer'
  const unitName2 = 'Scorch'
  await prepareGame({
    t,
    self: {
      deck: t.ctx.monsters,
      hand: [unitName2],
    },
    opponent: {
      deck: t.ctx.scoiatael,
      hand: [unitName1],
    },
  })
  const selfPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.self,
    ready: true,
    passed: false,
    score: 0,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.opponent,
    turn: PlayerTurn.Current,
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
    moves: [moves],
  })

  const unitToMoveOpponent = t.ctx.opponent.gameDeck.hand.find((unit) => unit.unit.name === unitName1)
  if (!unitToMoveOpponent) {
    throw Error(`Could not find unit in hand with name "${unitName1}"`)
  }
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

  const unitToMoveSelf = t.ctx.self.gameDeck.hand.find((unit) => unit.unit.name === unitName2)
  if (!unitToMoveSelf) {
    throw Error(`Could not find unit in hand with name "${unitName2}"`)
  }
  const combatRowSelf = unitToMoveSelf.unit.combats ? unitToMoveSelf.unit.combats[0] : Combat.Close
  await GamePage.moveUnit({
    unitName: unitToMoveSelf.unit.name,
    row: combatRowSelf,
  })
  E2eHelper.playUnit({
    player: selfPlayer,
    gameDeck: t.ctx.self.gameDeck,
    deckUnit: unitToMoveSelf,
    row: combatRowSelf,
    moves,
    switchTurnsWith: opponentPlayer,
    scorching: [
      {
        name: unitName1,
        row: combatRowOpponent,
        strength: unitToMoveOpponent.unit.strength,
        player: opponentPlayer,
      },
    ],
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [moves],
  })
})

test('Scorch removes strongest card if on own side', async (t) => {
  const unitName1 = 'Toruviel'
  const unitName2 = 'Griffin'
  const unitName3 = 'Scorch'
  await prepareGame({
    t,
    self: {
      deck: t.ctx.monsters,
      hand: [unitName2, unitName3],
    },
    opponent: {
      deck: t.ctx.scoiatael,
      hand: [unitName1],
    },
  })
  const selfPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.self,
    ready: true,
    passed: false,
    score: 0,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.opponent,
    turn: PlayerTurn.Current,
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
    moves: [moves],
  })

  const unitToMoveOpponent = t.ctx.opponent.gameDeck.hand.find((unit) => unit.unit.name === unitName1)
  if (!unitToMoveOpponent) {
    throw Error(`Could not find unit in hand with name "${unitName1}"`)
  }
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

  const unitToMoveSelf1 = t.ctx.self.gameDeck.hand.find((unit) => unit.unit.name === unitName2)
  if (!unitToMoveSelf1) {
    throw Error(`Could not find unit in hand with name "${unitName2}"`)
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

  await t.ctx.opponent.client.playPass({
    gameId: t.ctx.game.id,
  })
  E2eHelper.playPass({
    player: opponentPlayer,
    moves,
    round: 1,
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
    scorching: [
      {
        name: unitName2,
        row: combatRowSelf1,
        strength: unitToMoveSelf1.unit.strength,
        player: selfPlayer,
      },
    ],
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [moves],
  })
})

test('Scorch removes opponents unit even after they pass', async (t) => {
  const unitName1 = 'Ida Emean aep Sivney'
  const unitName2 = 'Griffin'
  const unitName3 = 'Scorch'
  await prepareGame({
    t,
    self: {
      deck: t.ctx.monsters,
      hand: [unitName2, unitName3],
    },
    opponent: {
      deck: t.ctx.scoiatael,
      hand: [unitName1],
    },
  })
  const selfPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.self,
    ready: true,
    passed: false,
    score: 0,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.opponent,
    turn: PlayerTurn.Current,
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
    moves: [moves],
  })

  const unitToMoveOpponent = t.ctx.opponent.gameDeck.hand.find((unit) => unit.unit.name === unitName1)
  if (!unitToMoveOpponent) {
    throw Error(`Could not find unit in hand with name "${unitName1}"`)
  }
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

  const unitToMoveSelf1 = t.ctx.self.gameDeck.hand.find((unit) => unit.unit.name === unitName2)
  if (!unitToMoveSelf1) {
    throw Error(`Could not find unit in hand with name "${unitName2}"`)
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

  await t.ctx.opponent.client.playPass({
    gameId: t.ctx.game.id,
  })
  E2eHelper.playPass({
    player: opponentPlayer,
    moves,
    round: 1,
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
    scorching: [
      {
        name: unitName1,
        row: combatRowOpponent,
        strength: unitToMoveOpponent.unit.strength,
        player: opponentPlayer,
      },
    ],
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [moves],
  })
})

test('Scorch removes strongest units if multiple with highest strength', async (t) => {
  const unitName1 = 'Ida Emean aep Sivney'
  const unitName2 = 'Fiend'
  const unitName3 = 'Scorch'
  await prepareGame({
    t,
    self: {
      deck: t.ctx.monsters,
      hand: [unitName2, unitName3],
    },
    opponent: {
      deck: t.ctx.scoiatael,
      hand: [unitName1],
    },
  })
  const selfPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.self,
    ready: true,
    passed: false,
    score: 0,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.opponent,
    turn: PlayerTurn.Current,
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
    moves: [moves],
  })

  const unitToMoveOpponent = t.ctx.opponent.gameDeck.hand.find((unit) => unit.unit.name === unitName1)
  if (!unitToMoveOpponent) {
    throw Error(`Could not find unit in hand with name "${unitName1}"`)
  }
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

  const unitToMoveSelf1 = t.ctx.self.gameDeck.hand.find((unit) => unit.unit.name === unitName2)
  if (!unitToMoveSelf1) {
    throw Error(`Could not find unit in hand with name "${unitName2}"`)
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

  await t.ctx.opponent.client.playPass({
    gameId: t.ctx.game.id,
  })
  E2eHelper.playPass({
    player: opponentPlayer,
    moves,
    round: 1,
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
    scorching: [
      {
        name: unitName1,
        row: combatRowOpponent,
        strength: unitToMoveOpponent.unit.strength,
        player: opponentPlayer,
      },
      {
        name: unitName2,
        row: combatRowSelf1,
        strength: unitToMoveSelf1.unit.strength,
        player: selfPlayer,
      },
    ],
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [moves],
  })
})

test('Scorch does not effect heroes', async (t) => {
  const unitName1 = 'Eithne'
  const unitName2 = 'Scorch'
  await prepareGame({
    t,
    self: {
      deck: t.ctx.monsters,
      hand: [unitName2],
    },
    opponent: {
      deck: t.ctx.scoiatael,
      hand: [unitName1],
    },
  })
  const selfPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.self,
    ready: true,
    passed: false,
    score: 0,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.opponent,
    turn: PlayerTurn.Current,
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
    moves: [moves],
  })

  const unitToMoveOpponent = t.ctx.opponent.gameDeck.hand.find((unit) => unit.unit.name === unitName1)
  if (!unitToMoveOpponent) {
    throw Error(`Could not find unit in hand with name "${unitName1}"`)
  }
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

  const unitToMoveSelf = t.ctx.self.gameDeck.hand.find((unit) => unit.unit.name === unitName2)
  if (!unitToMoveSelf) {
    throw Error(`Could not find unit in hand with name "${unitName2}"`)
  }
  const combatRowSelf = unitToMoveSelf.unit.combats ? unitToMoveSelf.unit.combats[0] : Combat.Close
  await GamePage.moveUnit({
    unitName: unitToMoveSelf.unit.name,
    row: combatRowSelf,
  })
  E2eHelper.playUnit({
    player: selfPlayer,
    gameDeck: t.ctx.self.gameDeck,
    deckUnit: unitToMoveSelf,
    row: combatRowSelf,
    moves,
    switchTurnsWith: opponentPlayer,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [moves],
  })
})

test('Scorch does not effect unit played after it', async (t) => {
  const unitName1 = 'Scorch'
  const unitName2 = 'Dennis Cranmer'
  await prepareGame({
    t,
    self: {
      deck: t.ctx.monsters,
      hand: [unitName1],
    },
    opponent: {
      deck: t.ctx.scoiatael,
      hand: [unitName2],
    },
    selfFirst: true,
  })
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
    moves: [moves],
  })

  const unitToMoveSelf = t.ctx.self.gameDeck.hand.find((unit) => unit.unit.name === unitName1)
  if (!unitToMoveSelf) {
    throw Error(`Could not find unit in hand with name "${unitName1}"`)
  }
  const combatRowSelf = unitToMoveSelf.unit.combats ? unitToMoveSelf.unit.combats[0] : Combat.Close
  await GamePage.moveUnit({
    unitName: unitToMoveSelf.unit.name,
    row: combatRowSelf,
  })
  E2eHelper.playUnit({
    player: selfPlayer,
    gameDeck: t.ctx.self.gameDeck,
    deckUnit: unitToMoveSelf,
    row: combatRowSelf,
    moves,
    switchTurnsWith: opponentPlayer,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [moves],
  })

  const unitToMoveOpponent = t.ctx.opponent.gameDeck.hand.find((unit) => unit.unit.name === unitName2)
  if (!unitToMoveOpponent) {
    throw Error(`Could not find unit in hand with name "${unitName2}"`)
  }
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

test('Scorch takes into account morale to determine strongest', async (t) => {
  const unitName1 = 'Isengrim Faoiltiarna'
  const unitName2 = 'Fiend'
  const unitName3 = 'Dennis Cranmer'
  const unitName4 = 'Scorch'
  await prepareGame({
    t,
    self: {
      deck: t.ctx.monsters,
      hand: [unitName2, unitName4],
    },
    opponent: {
      deck: t.ctx.scoiatael,
      hand: [unitName1, unitName3],
    },
  })
  const selfPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.self,
    ready: true,
    passed: false,
    score: 0,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.opponent,
    turn: PlayerTurn.Current,
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
    moves: [moves],
  })

  const unitToMoveOpponent1 = t.ctx.opponent.gameDeck.hand.find((unit) => unit.unit.name === unitName1)
  if (!unitToMoveOpponent1) {
    throw Error(`Could not find unit in hand with name "${unitName1}"`)
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

  const unitToMoveSelf1 = t.ctx.self.gameDeck.hand.find((unit) => unit.unit.name === unitName2)
  if (!unitToMoveSelf1) {
    throw Error(`Could not find unit in hand with name "${unitName2}"`)
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

  const unitToMoveOpponent2 = t.ctx.opponent.gameDeck.hand.find((unit) => unit.unit.name === unitName3)
  if (!unitToMoveOpponent2) {
    throw Error(`Could not find unit in hand with name "${unitName3}"`)
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
    effectiveStrength: 7,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [moves],
  })

  const unitToMoveSelf2 = t.ctx.self.gameDeck.hand.find((unit) => unit.unit.name === unitName4)
  if (!unitToMoveSelf2) {
    throw Error(`Could not find unit in hand with name "${unitName4}"`)
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
    scorching: [
      {
        name: unitName3,
        row: combatRowOpponent2,
        strength: 7,
        player: opponentPlayer,
      },
    ],
    switchTurnsWith: opponentPlayer,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [moves],
  })
})

test('Scorch scoped to Close combat removes strongest Close combat card on opponents side over 10 effective strength', async (t) => {
  // TODO: replace make first 2 units stronger than 3rd one to test that it is properly limiting itself
  const unitName1 = 'Holger Blackhand'
  const unitName2 = 'Yaevinn'
  const unitName3 = 'Olaf'
  const unitName4 = 'Villentretenmerth'
  await prepareGame({
    t,
    self: {
      deck: t.ctx.scoiatael,
      hand: [unitName2, unitName4],
    },
    opponent: {
      deck: t.ctx.skellige,
      hand: [unitName1, unitName3],
    },
  })
  const selfPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.self,
    ready: true,
    passed: false,
    score: 0,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.opponent,
    turn: PlayerTurn.Current,
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
    moves: [moves],
  })

  const unitToMoveOpponent1 = t.ctx.opponent.gameDeck.hand.find((unit) => unit.unit.name === unitName1)
  if (!unitToMoveOpponent1) {
    throw Error(`Could not find unit in hand with name "${unitName1}"`)
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

  const unitToMoveSelf1 = t.ctx.self.gameDeck.hand.find((unit) => unit.unit.name === unitName2)
  if (!unitToMoveSelf1) {
    throw Error(`Could not find unit in hand with name "${unitName2}"`)
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

  const unitToMoveOpponent2 = t.ctx.opponent.gameDeck.hand.find((unit) => unit.unit.name === unitName3)
  if (!unitToMoveOpponent2) {
    throw Error(`Could not find unit in hand with name "${unitName3}"`)
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
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [moves],
  })

  const unitToMoveSelf2 = t.ctx.self.gameDeck.hand.find((unit) => unit.unit.name === unitName4)
  if (!unitToMoveSelf2) {
    throw Error(`Could not find unit in hand with name "${unitName4}"`)
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
    scorching: [
      {
        name: unitName3,
        row: combatRowOpponent2,
        strength: unitToMoveOpponent2.unit.strength,
        player: opponentPlayer,
      },
    ],
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [moves],
  })
})

test('Scorch scoped to Close combat does not remove opponents Close combat if it is not over 10 effective strength', async (t) => {
  const unitName1 = 'Holger Blackhand'
  const unitName2 = 'Yaevinn'
  const unitName3 = 'Madman Lugos'
  const unitName4 = 'Villentretenmerth'
  await prepareGame({
    t,
    self: {
      deck: t.ctx.scoiatael,
      hand: [unitName2, unitName4],
    },
    opponent: {
      deck: t.ctx.skellige,
      hand: [unitName1, unitName3],
    },
  })
  const selfPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.self,
    ready: true,
    passed: false,
    score: 0,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.opponent,
    turn: PlayerTurn.Current,
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
    moves: [moves],
  })

  const unitToMoveOpponent1 = t.ctx.opponent.gameDeck.hand.find((unit) => unit.unit.name === unitName1)
  if (!unitToMoveOpponent1) {
    throw Error(`Could not find unit in hand with name "${unitName1}"`)
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

  const unitToMoveSelf1 = t.ctx.self.gameDeck.hand.find((unit) => unit.unit.name === unitName2)
  if (!unitToMoveSelf1) {
    throw Error(`Could not find unit in hand with name "${unitName2}"`)
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

  const unitToMoveOpponent2 = t.ctx.opponent.gameDeck.hand.find((unit) => unit.unit.name === unitName3)
  if (!unitToMoveOpponent2) {
    throw Error(`Could not find unit in hand with name "${unitName3}"`)
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
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [moves],
  })

  const unitToMoveSelf2 = t.ctx.self.gameDeck.hand.find((unit) => unit.unit.name === unitName4)
  if (!unitToMoveSelf2) {
    throw Error(`Could not find unit in hand with name "${unitName4}"`)
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
})

test('Scorch scoped to Close combat does not remove opponents unit over 10 effective strength if not in Close combat row', async (t) => {
  const unitName1 = 'Holger Blackhand'
  const unitName2 = 'Yaevinn'
  const unitName3 = 'Olaf'
  const unitName4 = 'Villentretenmerth'
  await prepareGame({
    t,
    self: {
      deck: t.ctx.scoiatael,
      hand: [unitName2, unitName4],
    },
    opponent: {
      deck: t.ctx.skellige,
      hand: [unitName1, unitName3],
    },
  })
  const selfPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.self,
    ready: true,
    passed: false,
    score: 0,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.opponent,
    turn: PlayerTurn.Current,
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
    moves: [moves],
  })

  const unitToMoveOpponent1 = t.ctx.opponent.gameDeck.hand.find((unit) => unit.unit.name === unitName1)
  if (!unitToMoveOpponent1) {
    throw Error(`Could not find unit in hand with name "${unitName1}"`)
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

  const unitToMoveSelf1 = t.ctx.self.gameDeck.hand.find((unit) => unit.unit.name === unitName2)
  if (!unitToMoveSelf1) {
    throw Error(`Could not find unit in hand with name "${unitName2}"`)
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

  const unitToMoveOpponent2 = t.ctx.opponent.gameDeck.hand.find((unit) => unit.unit.name === unitName3)
  if (!unitToMoveOpponent2) {
    throw Error(`Could not find unit in hand with name "${unitName3}"`)
  }
  const combatRowOpponent2 = Combat.Ranged
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

  const unitToMoveSelf2 = t.ctx.self.gameDeck.hand.find((unit) => unit.unit.name === unitName4)
  if (!unitToMoveSelf2) {
    throw Error(`Could not find unit in hand with name "${unitName4}"`)
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
})

test('Scorch scoped to Range combat removes strongest Ranged combat card on opponents side over 10 effective strength', async (t) => {
  // TODO: replace make first 2 units stronger than 3rd one to test that it is properly limiting itself
  const unitName1 = 'Yaevinn'
  const unitName2 = 'Gargoyle'
  const unitName3 = 'Milva'
  const unitName4 = 'Toad'
  await prepareGame({
    t,
    self: {
      deck: t.ctx.monsters,
      hand: [unitName2, unitName4],
    },
    opponent: {
      deck: t.ctx.scoiatael,
      hand: [unitName1, unitName3],
    },
  })
  const selfPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.self,
    ready: true,
    passed: false,
    score: 0,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.opponent,
    turn: PlayerTurn.Current,
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
    moves: [moves],
  })

  const unitToMoveOpponent1 = t.ctx.opponent.gameDeck.hand.find((unit) => unit.unit.name === unitName1)
  if (!unitToMoveOpponent1) {
    throw Error(`Could not find unit in hand with name "${unitName1}"`)
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

  const unitToMoveSelf1 = t.ctx.self.gameDeck.hand.find((unit) => unit.unit.name === unitName2)
  if (!unitToMoveSelf1) {
    throw Error(`Could not find unit in hand with name "${unitName2}"`)
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

  const unitToMoveOpponent2 = t.ctx.opponent.gameDeck.hand.find((unit) => unit.unit.name === unitName3)
  if (!unitToMoveOpponent2) {
    throw Error(`Could not find unit in hand with name "${unitName3}"`)
  }
  const combatRowOpponent2 = Combat.Ranged
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

  const unitToMoveSelf2 = t.ctx.self.gameDeck.hand.find((unit) => unit.unit.name === unitName4)
  if (!unitToMoveSelf2) {
    throw Error(`Could not find unit in hand with name "${unitName4}"`)
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
    scorching: [
      {
        name: unitName3,
        row: combatRowOpponent2,
        strength: unitToMoveOpponent2.unit.strength,
        player: opponentPlayer,
      },
    ],
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [moves],
  })
})

test('Scorch scoped to Ranged combat does not remove opponents Ranged combat if it is not over 10 effective strength', async (t) => {
  // TODO: replace make first 2 units stronger than 3rd one to test that it is properly limiting itself
  const unitName1 = 'Yaevinn'
  const unitName2 = 'Gargoyle'
  const unitName3 = 'Ida Emean aep Sivney'
  const unitName4 = 'Toad'
  await prepareGame({
    t,
    self: {
      deck: t.ctx.monsters,
      hand: [unitName2, unitName4],
    },
    opponent: {
      deck: t.ctx.scoiatael,
      hand: [unitName1, unitName3],
    },
  })
  const selfPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.self,
    ready: true,
    passed: false,
    score: 0,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.opponent,
    turn: PlayerTurn.Current,
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
    moves: [moves],
  })

  const unitToMoveOpponent1 = t.ctx.opponent.gameDeck.hand.find((unit) => unit.unit.name === unitName1)
  if (!unitToMoveOpponent1) {
    throw Error(`Could not find unit in hand with name "${unitName1}"`)
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

  const unitToMoveSelf1 = t.ctx.self.gameDeck.hand.find((unit) => unit.unit.name === unitName2)
  if (!unitToMoveSelf1) {
    throw Error(`Could not find unit in hand with name "${unitName2}"`)
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

  const unitToMoveOpponent2 = t.ctx.opponent.gameDeck.hand.find((unit) => unit.unit.name === unitName3)
  if (!unitToMoveOpponent2) {
    throw Error(`Could not find unit in hand with name "${unitName3}"`)
  }
  const combatRowOpponent2 = Combat.Ranged
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

  const unitToMoveSelf2 = t.ctx.self.gameDeck.hand.find((unit) => unit.unit.name === unitName4)
  if (!unitToMoveSelf2) {
    throw Error(`Could not find unit in hand with name "${unitName4}"`)
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
})

test('Scorch scoped to Ranged combat does not remove opponents unit over 10 effective strength if not in Ranged combat row', async (t) => {
  // TODO: replace make first 2 units stronger than 3rd one to test that it is properly limiting itself
  const unitNameOptional = 'Forktail'
  const unitName1 = 'Zoltan Chivay'
  const unitName2 = 'Gargoyle'
  const unitName3 = 'Heavy Zerrikanian Fire Scorpion'
  const unitName4 = 'Toad'
  await prepareGame({
    t,
    self: {
      deck: t.ctx.monsters,
      hand: [unitNameOptional, unitName2, unitName4],
    },
    opponent: {
      deck: t.ctx.nilfgaard,
      hand: [unitName1, unitName3],
    },
  })
  const selfPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.self,
    turn: t.ctx.game.turn?.user.id === t.ctx.self.user.id ? PlayerTurn.Current : undefined,
    ready: true,
    passed: false,
    score: 0,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.opponent,
    turn: t.ctx.game.turn?.user.id === t.ctx.opponent.user.id ? PlayerTurn.Current : undefined,
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
    moves: [moves],
  })

  if (t.ctx.game.turn?.user.id === t.ctx.self.user.id) {
    const unitToMoveSelfOptional = t.ctx.self.gameDeck.hand.find((unit) => unit.unit.name === unitNameOptional)
    if (!unitToMoveSelfOptional) {
      throw Error(`Could not find unit in hand with name "${unitNameOptional}"`)
    }
    const combatRowSelfOptional = unitToMoveSelfOptional.unit.combats
      ? unitToMoveSelfOptional.unit.combats[0]
      : Combat.Close
    await GamePage.moveUnit({
      unitName: unitToMoveSelfOptional.unit.name,
      row: combatRowSelfOptional,
    })
    E2eHelper.playUnit({
      player: selfPlayer,
      gameDeck: t.ctx.self.gameDeck,
      deckUnit: unitToMoveSelfOptional,
      row: combatRowSelfOptional,
      moves,
      switchTurnsWith: opponentPlayer,
    })
    await GamePage.verify({
      opponent: opponentPlayer,
      self: selfPlayer,
      hand: t.ctx.self.gameDeck.hand,
      moves: [moves],
    })
  }

  const unitToMoveOpponent1 = t.ctx.opponent.gameDeck.hand.find((unit) => unit.unit.name === unitName1)
  if (!unitToMoveOpponent1) {
    throw Error(`Could not find unit in hand with name "${unitName1}"`)
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

  const unitToMoveSelf1 = t.ctx.self.gameDeck.hand.find((unit) => unit.unit.name === unitName2)
  if (!unitToMoveSelf1) {
    throw Error(`Could not find unit in hand with name "${unitName2}"`)
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

  const unitToMoveOpponent2 = t.ctx.opponent.gameDeck.hand.find((unit) => unit.unit.name === unitName3)
  if (!unitToMoveOpponent2) {
    throw Error(`Could not find unit in hand with name "${unitName3}"`)
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
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [moves],
  })

  const unitToMoveSelf2 = t.ctx.self.gameDeck.hand.find((unit) => unit.unit.name === unitName4)
  if (!unitToMoveSelf2) {
    throw Error(`Could not find unit in hand with name "${unitName4}"`)
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
})

test('Scorch scoped to Siege combat removes strongest Siege combat card on opponents side over 10 effective strength', async (t) => {
  // TODO: replace make first 2 units stronger than 3rd one to test that it is properly limiting itself
  const unitName1 = 'Black Infantry Archer'
  const unitName2 = 'Yaevinn'
  const unitName3 = 'Heavy Zerrikanian Fire Scorpion'
  const unitName4 = 'Schirru'
  await prepareGame({
    t,
    self: {
      deck: t.ctx.scoiatael,
      hand: [unitName2, unitName4],
    },
    opponent: {
      deck: t.ctx.nilfgaard,
      hand: [unitName1, unitName3],
    },
  })
  const selfPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.self,
    ready: true,
    passed: false,
    score: 0,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.opponent,
    turn: PlayerTurn.Current,
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
    moves: [moves],
  })

  const unitToMoveOpponent1 = t.ctx.opponent.gameDeck.hand.find((unit) => unit.unit.name === unitName1)
  if (!unitToMoveOpponent1) {
    throw Error(`Could not find unit in hand with name "${unitName1}"`)
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

  const unitToMoveSelf1 = t.ctx.self.gameDeck.hand.find((unit) => unit.unit.name === unitName2)
  if (!unitToMoveSelf1) {
    throw Error(`Could not find unit in hand with name "${unitName2}"`)
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

  const unitToMoveOpponent2 = t.ctx.opponent.gameDeck.hand.find((unit) => unit.unit.name === unitName3)
  if (!unitToMoveOpponent2) {
    throw Error(`Could not find unit in hand with name "${unitName3}"`)
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
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [moves],
  })

  const unitToMoveSelf2 = t.ctx.self.gameDeck.hand.find((unit) => unit.unit.name === unitName4)
  if (!unitToMoveSelf2) {
    throw Error(`Could not find unit in hand with name "${unitName4}"`)
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
    scorching: [
      {
        name: unitName3,
        row: combatRowOpponent2,
        strength: unitToMoveOpponent2.unit.strength,
        player: opponentPlayer,
      },
    ],
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [moves],
  })
})

test('Scorch scoped to Siege combat does not remove opponents Siege combat if it is not over 10 effective strength', async (t) => {
  // TODO: replace make first 2 units stronger than 3rd one to test that it is properly limiting itself
  const unitName1 = 'Black Infantry Archer'
  const unitName2 = 'Yaevinn'
  const unitName3 = 'Zerrikanian Fire Scorpion'
  const unitName4 = 'Schirru'
  await prepareGame({
    t,
    self: {
      deck: t.ctx.scoiatael,
      hand: [unitName2, unitName4],
    },
    opponent: {
      deck: t.ctx.nilfgaard,
      hand: [unitName1, unitName3],
    },
  })
  const selfPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.self,
    ready: true,
    passed: false,
    score: 0,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.opponent,
    turn: PlayerTurn.Current,
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
    moves: [moves],
  })

  const unitToMoveOpponent1 = t.ctx.opponent.gameDeck.hand.find((unit) => unit.unit.name === unitName1)
  if (!unitToMoveOpponent1) {
    throw Error(`Could not find unit in hand with name "${unitName1}"`)
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

  const unitToMoveSelf1 = t.ctx.self.gameDeck.hand.find((unit) => unit.unit.name === unitName2)
  if (!unitToMoveSelf1) {
    throw Error(`Could not find unit in hand with name "${unitName2}"`)
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

  const unitToMoveOpponent2 = t.ctx.opponent.gameDeck.hand.find((unit) => unit.unit.name === unitName3)
  if (!unitToMoveOpponent2) {
    throw Error(`Could not find unit in hand with name "${unitName3}"`)
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
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [moves],
  })

  const unitToMoveSelf2 = t.ctx.self.gameDeck.hand.find((unit) => unit.unit.name === unitName4)
  if (!unitToMoveSelf2) {
    throw Error(`Could not find unit in hand with name "${unitName4}"`)
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
})

// Clan Dimun Pirate destroys himself if no stronger units on battlefield
test('Clan Dimun Pirate removes strongest card if on opponents side', async (t) => {
  const unitName1 = 'Milva'
  const unitName2 = 'Clan Dimun Pirate'
  await prepareGame({
    t,
    self: {
      deck: t.ctx.skellige,
      hand: [unitName2],
    },
    opponent: {
      deck: t.ctx.scoiatael,
      hand: [unitName1],
    },
  })
  const selfPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.self,
    ready: true,
    passed: false,
    score: 0,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.opponent,
    turn: PlayerTurn.Current,
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
    moves: [moves],
  })

  const unitToMoveOpponent = t.ctx.opponent.gameDeck.hand.find((unit) => unit.unit.name === unitName1)
  if (!unitToMoveOpponent) {
    throw Error(`Could not find unit in hand with name "${unitName1}"`)
  }
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

  const unitToMoveSelf = t.ctx.self.gameDeck.hand.find((unit) => unit.unit.name === unitName2)
  if (!unitToMoveSelf) {
    throw Error(`Could not find unit in hand with name "${unitName2}"`)
  }
  const combatRowSelf = unitToMoveSelf.unit.combats ? unitToMoveSelf.unit.combats[0] : Combat.Close
  await GamePage.moveUnit({
    unitName: unitToMoveSelf.unit.name,
    row: combatRowSelf,
  })
  E2eHelper.playUnit({
    player: selfPlayer,
    gameDeck: t.ctx.self.gameDeck,
    deckUnit: unitToMoveSelf,
    row: combatRowSelf,
    moves,
    switchTurnsWith: opponentPlayer,
    scorching: [
      {
        name: unitName1,
        row: combatRowOpponent,
        strength: unitToMoveOpponent.unit.strength,
        player: opponentPlayer,
      },
    ],
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [moves],
  })
})

test('Clan Dimun Pirate removes strongest card if on own side', async (t) => {
  const unitName1 = 'Toruviel'
  const unitName2 = 'Olaf'
  const unitName3 = 'Clan Dimun Pirate'
  await prepareGame({
    t,
    self: {
      deck: t.ctx.skellige,
      hand: [unitName2, unitName3],
    },
    opponent: {
      deck: t.ctx.scoiatael,
      hand: [unitName1],
    },
  })
  const selfPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.self,
    ready: true,
    passed: false,
    score: 0,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.opponent,
    turn: PlayerTurn.Current,
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
    moves: [moves],
  })

  const unitToMoveOpponent = t.ctx.opponent.gameDeck.hand.find((unit) => unit.unit.name === unitName1)
  if (!unitToMoveOpponent) {
    throw Error(`Could not find unit in hand with name "${unitName1}"`)
  }
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

  const unitToMoveSelf1 = t.ctx.self.gameDeck.hand.find((unit) => unit.unit.name === unitName2)
  if (!unitToMoveSelf1) {
    throw Error(`Could not find unit in hand with name "${unitName2}"`)
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

  await t.ctx.opponent.client.playPass({
    gameId: t.ctx.game.id,
  })
  E2eHelper.playPass({
    player: opponentPlayer,
    moves,
    round: 1,
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
    scorching: [
      {
        name: unitName2,
        row: combatRowSelf1,
        strength: unitToMoveSelf1.unit.strength,
        player: selfPlayer,
      },
    ],
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [moves],
  })
})

test('Clan Dimun Pirate removes itself if strongest unit', async (t) => {
  const unitName1 = 'Toruviel'
  const unitName2 = 'Clan Dimun Pirate'
  await prepareGame({
    t,
    self: {
      deck: t.ctx.skellige,
      hand: [unitName2],
    },
    opponent: {
      deck: t.ctx.scoiatael,
      hand: [unitName1],
    },
  })
  const selfPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.self,
    ready: true,
    passed: false,
    score: 0,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.opponent,
    turn: PlayerTurn.Current,
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
    moves: [moves],
  })

  const unitToMoveOpponent = t.ctx.opponent.gameDeck.hand.find((unit) => unit.unit.name === unitName1)
  if (!unitToMoveOpponent) {
    throw Error(`Could not find unit in hand with name "${unitName1}"`)
  }
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

  const unitToMoveSelf = t.ctx.self.gameDeck.hand.find((unit) => unit.unit.name === unitName2)
  if (!unitToMoveSelf) {
    throw Error(`Could not find unit in hand with name "${unitName2}"`)
  }
  const combatRowSelf = unitToMoveSelf.unit.combats ? unitToMoveSelf.unit.combats[0] : Combat.Close
  await GamePage.moveUnit({
    unitName: unitToMoveSelf.unit.name,
    row: combatRowSelf,
  })
  E2eHelper.playUnit({
    player: selfPlayer,
    gameDeck: t.ctx.self.gameDeck,
    deckUnit: unitToMoveSelf,
    row: combatRowSelf,
    moves,
    switchTurnsWith: opponentPlayer,
    scorching: [
      {
        name: unitName2,
        row: combatRowSelf,
        strength: unitToMoveSelf.unit.strength,
        player: selfPlayer,
      },
    ],
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: t.ctx.self.gameDeck.hand,
    moves: [moves],
  })
})

async function prepareGame({
  self,
  opponent,
  t,
  selfFirst,
}: {
  t: E2ETestController<E2eCtx, GameEffectMoraleTestCtx>
  self: {
    deck: ContextGameDeck
    hand: string[]
  }
  opponent: {
    deck: ContextGameDeck
    hand: string[]
  }
  selfFirst?: boolean
}) {
  t.ctx.self.deck = await t.ctx.self.client.addDeck({
    faction: self.deck.faction,
    leaderName: self.deck.leader,
    name: `${t.ctx.scenario}-self-deck-${Date.now()}`,
    unitNames: self.deck.units,
  })
  t.ctx.opponent.deck = await t.ctx.opponent.client.addDeck({
    faction: opponent.deck.faction,
    leaderName: opponent.deck.leader,
    name: `${t.ctx.scenario}-opponent-deck-${Date.now()}`,
    unitNames: opponent.deck.units,
  })

  await t.ctx.self.client.setDeck({
    deckId: t.ctx.self.deck.id,
    gameId: t.ctx.game.id,
  })
  await t.ctx.opponent.client.setDeck({
    deckId: t.ctx.opponent.deck.id,
    gameId: t.ctx.game.id,
  })

  if (self.deck.faction === FactionKey.ScoiaTael || opponent.deck.faction === FactionKey.ScoiaTael) {
    const client = self.deck.faction === FactionKey.ScoiaTael ? t.ctx.self.client : t.ctx.opponent.client
    await client.setOrder({
      gameId: t.ctx.game.id,
      userIds: [
        selfFirst ? t.ctx.self.user.id : t.ctx.opponent.user.id,
        selfFirst ? t.ctx.opponent.user.id : t.ctx.self.user.id,
      ],
    })
  }
  await t.ctx.self.client.ready(t.ctx.game.id)
  await t.ctx.opponent.client.ready(t.ctx.game.id)

  await ensureUnitsInHand({
    gameId: t.ctx.game.id,
    mongoConnectionString: env.MONGO_URL,
    mongoDatabaseName: env.MONGO_DB,
    unitNames: self.hand,
    userId: t.ctx.self.user.id,
  })
  await ensureUnitsInHand({
    gameId: t.ctx.game.id,
    mongoConnectionString: env.MONGO_URL,
    mongoDatabaseName: env.MONGO_DB,
    unitNames: opponent.hand,
    userId: t.ctx.opponent.user.id,
  })

  t.ctx.self.gameDeck = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  t.ctx.opponent.gameDeck = await t.ctx.opponent.client.getGameDeck(t.ctx.game.id)
  t.ctx.game = await t.ctx.self.client.getGame(t.ctx.game.id)
}
