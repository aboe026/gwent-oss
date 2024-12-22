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
  northerRealms: {
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

    t.ctx.northerRealms = {
      faction: FactionKey.NorthernRealms,
      leader: 'Foltest Son of Medell',
      units: [
        'Ballista',
        'Dethmold',
        'Emiel Regis Rohellec Terzieff',
        'Esterad Thyssen',
        'John Natalis',
        'Keira Metz',
        'Philippa Eilhart',
        'Redanian Foot Soldier',
        'Roach',
        'Sabrina Glevissig',
        'Sheldon Skaggs',
        'Siege Tower',
        'Siegfried of Denesle',
        'Sile de Tansarville',
        'Trebuchet',
        'Trebuchet',
        'Triss Merigold',
        'Vernon Roche',
        'Ves',
        'Vesemir',
        'Yarpen Zigrin',
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
      faction: t.ctx.northerRealms.faction,
      leaderName: t.ctx.northerRealms.leader,
      name: `${t.ctx.scenario}-self-deck-${Date.now()}`,
      unitNames: t.ctx.northerRealms.units,
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
    await t.ctx.self.client.ready(t.ctx.game.id)
    await t.ctx.opponent.client.ready(t.ctx.game.id)

    t.ctx.game = await selfClient.getGame(t.ctx.game.id)
  })

test.only('Can play a unit card', async (t) => {
  const winner = t.ctx.game.turn?.user.id === t.ctx.self.user.id ? t.ctx.self : t.ctx.opponent
  const loser = t.ctx.game.turn?.user.id === t.ctx.opponent.user.id ? t.ctx.self : t.ctx.opponent

  await LoginPage.login({
    username: winner.user.name,
  })

  const selfPlayer = E2eHelper.getGamePlayer({
    player: winner,
    turn: PlayerTurn.Current,
    ready: true,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: loser,
    ready: true,
  })
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: winner.gameDeck.hand,
    moves: [[]],
  })
  const unitToMove = winner.gameDeck.hand[0]
  const combatRow = (unitToMove.unit.combats as Combat[])[0]
  await GamePage.moveUnit({
    unitName: unitToMove.unit.name,
    row: combatRow,
  })

  winner.gameDeck.hand = winner.gameDeck.hand.filter((hand) => hand.unit.id !== unitToMove.unit.id)
  selfPlayer.turn = undefined
  selfPlayer.hand = 9
  opponentPlayer.turn = PlayerTurn.Current

  await GamePage.verify({
    opponent: opponentPlayer,
    self: {
      ...selfPlayer,
      score: unitToMove.unit.strength || 0,
    },
    hand: winner.gameDeck.hand,
    moves: [
      [
        {
          combatRow: combatRow,
          unitName: unitToMove.unit.name,
          userName: winner.user.name,
        },
      ],
    ],
  })
})
