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

test('Scorch removes strongest card if on opponents side', async (t) => {
  await prepareGame({
    t,
    self: {
      deck: t.ctx.monsters,
      hand: ['Scorch', 'Toad', 'Villentretenmerth'],
    },
    opponent: {
      deck: t.ctx.scoiatael,
      hand: ['Dennis Cranmer'],
    },
  })
  const unitName1 = 'Dennis Cranmer'
  const unitName2 = 'Scorch'
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
    opponent: opponentPlayer,
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

// TODO: scorch card does nothing if played with nothing else on battlefield
// TODO: scorch works on opponents units even after they passed
// TODO: scorch card removes strongest card if on opponents side
// TODO: scorch card removes strongest card if on selfs side
// TODO: scorch card removes strongest card if on same side
// TODO: scorch card removes strongest cards if on opponents side
// TODO: scorch card removes strongest cards if on selfs side
// TODO: scorch card removes strongest cards if on same side
// TODO: scorch does not effect heros
// TODO: scorch takes into account morale to determine strongest

async function prepareGame({
  self,
  opponent,
  t,
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
    userIds: [t.ctx.opponent.user.id, t.ctx.self.user.id],
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
