import ApiClient, { AddDeckInput } from '../util/api-client'
import { E2eCtx, getFixtureCtx, getScenario, getTestCtx } from '../util/e2e-ctx'
import { E2eHelper } from '../util/e2e-helper'
import E2eUtil from '../util/e2e-util'
import { FactionKey, Game, User } from '@gwent/graphql-schema/resolver-typings'
import GamePage from '../page-objects/game-page'
import HomePage from '../page-objects/home-page'
import LoginPage from '../page-objects/login-page'
import { PlayerTurn } from '../components/game-player-info'

interface GameOrderingTestCtx extends E2eCtx {
  scenario: string
  self: {
    user: User
    client: ApiClient
  }
  opponent: {
    user: User
    client: ApiClient
  }
  scoiaTael: AddDeckInput
  nilfgaard: AddDeckInput
  game: Game
}
const fixture = getFixtureCtx<E2eCtx, GameOrderingTestCtx>()
const test = getTestCtx<E2eCtx, GameOrderingTestCtx>()

fixture('Game Ordering')
  .page(HomePage.getUrl())
  .beforeEach(async (t) => {
    const selfUsername = `${getScenario(t)}-self-${t.ctx.start}`
    const opponentUsername = `${getScenario(t)}-opponent-${t.ctx.start}`

    t.ctx.self = {
      user: await new ApiClient({}).addUser({
        name: selfUsername,
      }),
      client: new ApiClient({
        username: selfUsername,
      }),
    }
    t.ctx.opponent = {
      user: await new ApiClient({}).addUser({
        name: opponentUsername,
      }),
      client: new ApiClient({
        username: opponentUsername,
      }),
    }

    t.ctx.scoiaTael = {
      name: `${getScenario(t)}-scoiatael-deck-${t.ctx.start}`,
      faction: FactionKey.ScoiaTael,
      leaderName: 'Francesca Findabair Queen of Dol Blathanna',
      unitNames: await E2eHelper.getUnitsForDeck({
        client: t.ctx.self.client,
        faction: FactionKey.ScoiaTael,
      }),
    }
    t.ctx.nilfgaard = {
      name: `${getScenario(t)}-nilfgaard-deck-${t.ctx.start}`,
      faction: FactionKey.NilfgaardianEmpire,
      leaderName: 'Emhyr var Emreis the Relentless',
      unitNames: await E2eHelper.getUnitsForDeck({
        client: t.ctx.opponent.client,
        faction: FactionKey.NilfgaardianEmpire,
      }),
    }

    t.ctx.game = await t.ctx.self.client.addGame([t.ctx.opponent.user.name])
    await LoginPage.login({
      username: t.ctx.self.user.name,
    })
  })

test('User with ScoiaTael deck and opponent without it can choose turn order to make self go first', async (t) => {
  const deckSelf = await t.ctx.self.client.addDeck({
    faction: t.ctx.scoiaTael.faction,
    leaderName: t.ctx.scoiaTael.leaderName,
    name: t.ctx.scoiaTael.name,
    unitNames: t.ctx.scoiaTael.unitNames,
  })
  const deckOpponent = await t.ctx.opponent.client.addDeck({
    faction: t.ctx.nilfgaard.faction,
    leaderName: t.ctx.nilfgaard.leaderName,
    name: t.ctx.nilfgaard.name,
    unitNames: t.ctx.nilfgaard.unitNames,
  })
  await t.ctx.self.client.setDeck({
    deckId: deckSelf.id,
    gameId: t.ctx.game.id,
  })
  await t.ctx.opponent.client.setDeck({
    deckId: deckOpponent.id,
    gameId: t.ctx.game.id,
  })
  const gameDeckSelf = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  const gameDeckOpponent = await t.ctx.opponent.client.getGameDeck(t.ctx.game.id)
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  const selfPlayer = E2eHelper.getGamePlayer({
    player: {
      client: t.ctx.self.client,
      deck: deckSelf,
      gameDeck: gameDeckSelf,
      user: t.ctx.self.user,
    },
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: {
      client: t.ctx.opponent.client,
      deck: deckOpponent,
      gameDeck: gameDeckOpponent,
      user: t.ctx.opponent.user,
    },
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: gameDeckSelf.hand,
    turnOrder: [t.ctx.self.user.name, t.ctx.opponent.user.name],
  })
  await GamePage.setOrder()
  await GamePage.verifyCoinToss({
    won: true,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: {
      ...selfPlayer,
      turn: PlayerTurn.Future,
    },
    hand: gameDeckSelf.hand,
    redraws: [],
  })
})

test('User with ScoiaTael deck and opponent without it can choose turn order to make opponent go first', async (t) => {
  const deckSelf = await t.ctx.self.client.addDeck({
    faction: t.ctx.scoiaTael.faction,
    leaderName: t.ctx.scoiaTael.leaderName,
    name: t.ctx.scoiaTael.name,
    unitNames: t.ctx.scoiaTael.unitNames,
  })
  const deckOpponent = await t.ctx.opponent.client.addDeck({
    faction: t.ctx.nilfgaard.faction,
    leaderName: t.ctx.nilfgaard.leaderName,
    name: t.ctx.nilfgaard.name,
    unitNames: t.ctx.nilfgaard.unitNames,
  })
  await t.ctx.self.client.setDeck({
    deckId: deckSelf.id,
    gameId: t.ctx.game.id,
  })
  await t.ctx.opponent.client.setDeck({
    deckId: deckOpponent.id,
    gameId: t.ctx.game.id,
  })
  const gameDeckSelf = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  const gameDeckOpponent = await t.ctx.opponent.client.getGameDeck(t.ctx.game.id)
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  const selfPlayer = E2eHelper.getGamePlayer({
    player: {
      client: t.ctx.self.client,
      deck: deckSelf,
      gameDeck: gameDeckSelf,
      user: t.ctx.self.user,
    },
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: {
      client: t.ctx.opponent.client,
      deck: deckOpponent,
      gameDeck: gameDeckOpponent,
      user: t.ctx.opponent.user,
    },
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: gameDeckSelf.hand,
    turnOrder: [t.ctx.self.user.name, t.ctx.opponent.user.name],
  })
  await GamePage.moveTurnOrderLater(t.ctx.self.user.name)
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: gameDeckSelf.hand,
    turnOrder: [t.ctx.opponent.user.name, t.ctx.self.user.name],
  })
  await GamePage.setOrder()
  await GamePage.verifyCoinToss({
    won: false,
  })
  await GamePage.verify({
    opponent: {
      ...opponentPlayer,
      turn: PlayerTurn.Future,
    },
    self: selfPlayer,
    hand: gameDeckSelf.hand,
    redraws: [],
  })
})

test('User without ScoiaTael deck and opponent with it must wait for opponent to set order opponent first', async (t) => {
  const deckSelf = await t.ctx.self.client.addDeck({
    faction: t.ctx.nilfgaard.faction,
    leaderName: t.ctx.nilfgaard.leaderName,
    name: t.ctx.scoiaTael.name,
    unitNames: t.ctx.nilfgaard.unitNames,
  })
  const deckOpponent = await t.ctx.opponent.client.addDeck({
    faction: t.ctx.scoiaTael.faction,
    leaderName: t.ctx.scoiaTael.leaderName,
    name: t.ctx.nilfgaard.name,
    unitNames: t.ctx.scoiaTael.unitNames,
  })
  await t.ctx.self.client.setDeck({
    deckId: deckSelf.id,
    gameId: t.ctx.game.id,
  })
  await t.ctx.opponent.client.setDeck({
    deckId: deckOpponent.id,
    gameId: t.ctx.game.id,
  })
  const gameDeckSelf = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  const gameDeckOpponent = await t.ctx.opponent.client.getGameDeck(t.ctx.game.id)
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  const selfPlayer = E2eHelper.getGamePlayer({
    player: {
      client: t.ctx.self.client,
      deck: deckSelf,
      gameDeck: gameDeckSelf,
      user: t.ctx.self.user,
    },
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: {
      client: t.ctx.opponent.client,
      deck: deckOpponent,
      gameDeck: gameDeckOpponent,
      user: t.ctx.opponent.user,
    },
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: gameDeckSelf.hand,
    turnOrder: [],
  })
  await t.ctx.opponent.client.setOrder({
    gameId: t.ctx.game.id,
    userIds: [t.ctx.opponent.user.id, t.ctx.self.user.id],
  })
  await GamePage.verifyCoinToss({
    won: false,
  })
  await GamePage.verify({
    opponent: {
      ...opponentPlayer,
      turn: PlayerTurn.Future,
    },
    self: selfPlayer,
    hand: gameDeckSelf.hand,
    redraws: [],
  })
})

test('User without ScoiaTael deck and opponent with it must wait for opponent to set order self first', async (t) => {
  const deckSelf = await t.ctx.self.client.addDeck({
    faction: t.ctx.nilfgaard.faction,
    leaderName: t.ctx.nilfgaard.leaderName,
    name: t.ctx.scoiaTael.name,
    unitNames: t.ctx.nilfgaard.unitNames,
  })
  const deckOpponent = await t.ctx.opponent.client.addDeck({
    faction: t.ctx.scoiaTael.faction,
    leaderName: t.ctx.scoiaTael.leaderName,
    name: t.ctx.nilfgaard.name,
    unitNames: t.ctx.scoiaTael.unitNames,
  })
  await t.ctx.self.client.setDeck({
    deckId: deckSelf.id,
    gameId: t.ctx.game.id,
  })
  await t.ctx.opponent.client.setDeck({
    deckId: deckOpponent.id,
    gameId: t.ctx.game.id,
  })
  const gameDeckSelf = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  const gameDeckOpponent = await t.ctx.opponent.client.getGameDeck(t.ctx.game.id)
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  const selfPlayer = E2eHelper.getGamePlayer({
    player: {
      client: t.ctx.self.client,
      deck: deckSelf,
      gameDeck: gameDeckSelf,
      user: t.ctx.self.user,
    },
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: {
      client: t.ctx.opponent.client,
      deck: deckOpponent,
      gameDeck: gameDeckOpponent,
      user: t.ctx.opponent.user,
    },
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: gameDeckSelf.hand,
    turnOrder: [],
  })
  await t.ctx.opponent.client.setOrder({
    gameId: t.ctx.game.id,
    userIds: [t.ctx.self.user.id, t.ctx.opponent.user.id],
  })
  await GamePage.verifyCoinToss({
    won: true,
  })
  await GamePage.verify({
    opponent: {
      ...opponentPlayer,
    },
    self: {
      ...selfPlayer,
      turn: PlayerTurn.Future,
    },
    hand: gameDeckSelf.hand,
    redraws: [],
  })
})

test('Order automatically set if both are ScoiaTael', async (t) => {
  const deckSelf = await t.ctx.self.client.addDeck({
    faction: t.ctx.scoiaTael.faction,
    leaderName: t.ctx.scoiaTael.leaderName,
    name: t.ctx.scoiaTael.name,
    unitNames: t.ctx.scoiaTael.unitNames,
  })
  const deckOpponent = await t.ctx.opponent.client.addDeck({
    faction: t.ctx.scoiaTael.faction,
    leaderName: t.ctx.scoiaTael.leaderName,
    name: t.ctx.nilfgaard.name,
    unitNames: t.ctx.scoiaTael.unitNames,
  })
  await t.ctx.opponent.client.setDeck({
    deckId: deckOpponent.id,
    gameId: t.ctx.game.id,
  })
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  await GamePage.verify({
    self: {
      name: t.ctx.self.user.name,
    },
    opponent: {
      name: t.ctx.opponent.user.name,
    },
  })
  await GamePage.setDeck({
    created: deckSelf.created,
    faction: deckSelf.faction,
    leader: deckSelf.leader,
    name: deckSelf.name,
    stats: deckSelf.stats,
    verifyCloses: false,
    neutralFaction: await t.ctx.self.client.getFaction({ key: FactionKey.Neutral }),
  })
  const gameDeckSelf = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  const gameDeckOpponent = await t.ctx.opponent.client.getGameDeck(t.ctx.game.id)
  const selfPlayer = E2eHelper.getGamePlayer({
    player: {
      client: t.ctx.self.client,
      deck: deckSelf,
      gameDeck: gameDeckSelf,
      user: t.ctx.self.user,
    },
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: {
      client: t.ctx.opponent.client,
      deck: deckOpponent,
      gameDeck: gameDeckOpponent,
      user: t.ctx.opponent.user,
    },
  })
  const updatedGame = await t.ctx.self.client.getGame(t.ctx.game.id)
  await t.expect(updatedGame.turn).notEql(null)
  await t.expect(updatedGame.turn).notEql(undefined)
  if (updatedGame.turn?.user.id === t.ctx.self.user.id) {
    selfPlayer.turn = PlayerTurn.Future
  } else if (updatedGame.turn?.user.id === t.ctx.opponent.user.id) {
    opponentPlayer.turn = PlayerTurn.Future
  }
  await GamePage.verifyCoinToss({
    won: selfPlayer.turn === PlayerTurn.Future,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: gameDeckSelf.hand,
    redraws: [],
  })
})

test('Order automatically set if none are ScoiaTael', async (t) => {
  const deckSelf = await t.ctx.self.client.addDeck({
    faction: t.ctx.nilfgaard.faction,
    leaderName: t.ctx.nilfgaard.leaderName,
    name: t.ctx.scoiaTael.name,
    unitNames: t.ctx.nilfgaard.unitNames,
  })
  const deckOpponent = await t.ctx.opponent.client.addDeck({
    faction: t.ctx.nilfgaard.faction,
    leaderName: t.ctx.nilfgaard.leaderName,
    name: t.ctx.nilfgaard.name,
    unitNames: t.ctx.nilfgaard.unitNames,
  })
  await t.ctx.opponent.client.setDeck({
    deckId: deckOpponent.id,
    gameId: t.ctx.game.id,
  })
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  await GamePage.verify({
    self: {
      name: t.ctx.self.user.name,
    },
    opponent: {
      name: t.ctx.opponent.user.name,
    },
  })
  await GamePage.setDeck({
    created: deckSelf.created,
    faction: deckSelf.faction,
    leader: deckSelf.leader,
    name: deckSelf.name,
    stats: deckSelf.stats,
    verifyCloses: false,
    neutralFaction: await t.ctx.self.client.getFaction({ key: FactionKey.Neutral }),
  })
  const gameDeckSelf = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  const gameDeckOpponent = await t.ctx.opponent.client.getGameDeck(t.ctx.game.id)
  const selfPlayer = E2eHelper.getGamePlayer({
    player: {
      client: t.ctx.self.client,
      deck: deckSelf,
      gameDeck: gameDeckSelf,
      user: t.ctx.self.user,
    },
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: {
      client: t.ctx.opponent.client,
      deck: deckOpponent,
      gameDeck: gameDeckOpponent,
      user: t.ctx.opponent.user,
    },
  })
  const updatedGame = await t.ctx.self.client.getGame(t.ctx.game.id)
  await t.expect(updatedGame.turn).notEql(null)
  await t.expect(updatedGame.turn).notEql(undefined)
  if (updatedGame.turn?.user.id === t.ctx.self.user.id) {
    selfPlayer.turn = PlayerTurn.Future
  } else if (updatedGame.turn?.user.id === t.ctx.opponent.user.id) {
    opponentPlayer.turn = PlayerTurn.Future
  }
  await GamePage.verifyCoinToss({
    won: selfPlayer.turn === PlayerTurn.Future,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: gameDeckSelf.hand,
    redraws: [],
  })
})
