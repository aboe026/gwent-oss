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
        'Roach',
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

// TODO: scorch does not effect heros
// TODO: scorch does not effect units played after it
// TODO: scorch takes into account morale to determine strongest

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

  const client = self.deck.faction === FactionKey.ScoiaTael ? t.ctx.self.client : t.ctx.opponent.client
  await client.setOrder({
    gameId: t.ctx.game.id,
    userIds: [
      selfFirst ? t.ctx.self.user.id : t.ctx.opponent.user.id,
      selfFirst ? t.ctx.opponent.user.id : t.ctx.self.user.id,
    ],
  })
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
}
