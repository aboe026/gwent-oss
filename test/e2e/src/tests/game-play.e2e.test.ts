import ApiClient from '../util/api-client'
import { Combat, Deck, FactionKey, Game, GameDeck, User } from '@gwent/graphql-schema/resolver-typings'
import { E2eCtx, getFixtureCtx, getTestCtx } from '../util/e2e-ctx'
import { E2eHelper } from '../util/e2e-helper'
import E2eUtil from '../util/e2e-util'
import GamePage from '../page-objects/game-page'
import HomePage from '../page-objects/home-page'
import LoginPage from '../page-objects/login-page'
import { PlayerTurn } from '../components/game-player-info'

interface ContextGamePlayer {
  user: User
  client: ApiClient
  deck: Deck
  gameDeck: GameDeck
}

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

fixture('Game Play')
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

test('Can play a unit as first move', async (t) => {
  const selfPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.self,
    turn: PlayerTurn.Current,
    ready: true,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.opponent,
    ready: true,
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
  const unitToMove = t.ctx.self.gameDeck.hand[0]
  const combatRow = unitToMove.unit.combats ? unitToMove.unit.combats[0] : Combat.Close
  await GamePage.moveUnit({
    unitName: unitToMove.unit.name,
    row: combatRow,
  })

  t.ctx.self.gameDeck.hand = t.ctx.self.gameDeck.hand.filter((hand) => hand.unit.id !== unitToMove.unit.id)
  selfPlayer.turn = undefined
  selfPlayer.hand = 9
  opponentPlayer.turn = PlayerTurn.Current

  await GamePage.verify({
    opponent: opponentPlayer,
    self: {
      ...selfPlayer,
      score: unitToMove.unit.strength || 0,
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
})

test('Can play a unit after opponent plays unit', async (t) => {
  const selfPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.self,
    turn: PlayerTurn.Current,
    ready: true,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.opponent,
    ready: true,
  })
  const unitToMoveSelf = t.ctx.self.gameDeck.hand[0]
  const combatRowSelf = unitToMoveSelf.unit.combats ? unitToMoveSelf.unit.combats[0] : Combat.Close
  await t.ctx.self.client.playUnit({
    gameId: t.ctx.game.id,
    unitId: unitToMoveSelf.unit.id,
    combat: combatRowSelf,
  })
  t.ctx.self.gameDeck.hand = t.ctx.self.gameDeck.hand.filter((hand) => hand.unit.id !== unitToMoveSelf.unit.id)
  selfPlayer.turn = undefined
  selfPlayer.hand = 9
  opponentPlayer.turn = PlayerTurn.Current
  await LoginPage.login({
    username: t.ctx.opponent.user.name,
  })
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))

  await GamePage.verify({
    opponent: {
      ...selfPlayer,
      score: unitToMoveSelf.unit.strength || 0,
    },
    self: opponentPlayer,
    hand: t.ctx.opponent.gameDeck.hand,
    moves: [
      [
        {
          combatRow: combatRowSelf,
          unitName: unitToMoveSelf.unit.name,
          userName: t.ctx.self.user.name,
        },
      ],
    ],
  })

  const unitToMoveOpponent = t.ctx.opponent.gameDeck.hand[0]
  const combatRowOpponent = unitToMoveOpponent.unit.combats ? unitToMoveOpponent.unit.combats[0] : Combat.Close
  await GamePage.moveUnit({
    unitName: unitToMoveOpponent.unit.name,
    row: combatRowOpponent,
  })

  t.ctx.opponent.gameDeck.hand = t.ctx.opponent.gameDeck.hand.filter(
    (hand) => hand.unit.id !== unitToMoveOpponent.unit.id
  )
  opponentPlayer.turn = undefined
  opponentPlayer.hand = 9
  selfPlayer.turn = PlayerTurn.Current

  await GamePage.verify({
    opponent: {
      ...selfPlayer,
      score: unitToMoveSelf.unit.strength || 0,
    },
    self: {
      ...opponentPlayer,
      score: unitToMoveOpponent.unit.strength || 0,
    },
    hand: t.ctx.opponent.gameDeck.hand,
    moves: [
      [
        {
          combatRow: combatRowSelf,
          unitName: unitToMoveSelf.unit.name,
          userName: t.ctx.self.user.name,
        },
        {
          combatRow: combatRowOpponent,
          unitName: unitToMoveOpponent.unit.name,
          userName: t.ctx.opponent.user.name,
        },
      ],
    ],
  })
})

test('Play unit after opponent plays pass', async (t) => {
  await t.ctx.self.client.playPass({
    gameId: t.ctx.game.id,
  })
  const selfPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.self,
    ready: true,
    passed: true,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: t.ctx.opponent,
    ready: true,
    turn: PlayerTurn.Current,
  })
  await LoginPage.login({
    username: t.ctx.opponent.user.name,
  })
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))

  await GamePage.verify({
    opponent: selfPlayer,
    self: opponentPlayer,
    hand: t.ctx.opponent.gameDeck.hand,
    moves: [
      [
        {
          userName: t.ctx.self.user.name,
          round: 1,
        },
      ],
    ],
  })

  const unitToMove = t.ctx.opponent.gameDeck.hand[0]
  const combatRow = unitToMove.unit.combats ? unitToMove.unit.combats[0] : Combat.Close
  await GamePage.moveUnit({
    unitName: unitToMove.unit.name,
    row: combatRow,
  })

  t.ctx.opponent.gameDeck.hand = t.ctx.opponent.gameDeck.hand.filter((hand) => hand.unit.id !== unitToMove.unit.id)
  opponentPlayer.turn = PlayerTurn.Current
  opponentPlayer.hand = 9
  selfPlayer.turn = undefined

  await GamePage.verify({
    opponent: selfPlayer,
    self: {
      ...opponentPlayer,
      score: unitToMove.unit.strength || 0,
    },
    hand: t.ctx.opponent.gameDeck.hand,
    moves: [
      [
        {
          userName: t.ctx.self.user.name,
          round: 1,
        },
        {
          combatRow: combatRow,
          unitName: unitToMove.unit.name,
          userName: t.ctx.opponent.user.name,
        },
      ],
    ],
  })
})
