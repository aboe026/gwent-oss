import ApiClient, { AddDeckInput } from '../util/api-client'
import Banner from '../components/banner'
import { Combat, Deck, FactionKey, Game, GameStatus, User } from '@gwent-oss/node-client'
import { E2eCtx, getFixtureCtx, getScenario, getTestCtx } from '../util/e2e-ctx'
import E2eUtil from '../util/e2e-util'
import GamePage from '../page-objects/game-page'
import GamesPage from '../page-objects/games-page'
import HomePage from '../page-objects/home-page'
import LoginPage from '../page-objects/login-page'
import { STARTING_HAND_SIZE } from '@gwent-oss/constants'
import { E2eHelper } from '../util/e2e-helper'
import { PlayerTurn } from '../components/game-player-info'
import createGameManager from '../util/game-manager'

interface GameSubscriptionTestCtx extends E2eCtx {
  scenario: string
  self: {
    user: User
    client: ApiClient
    deck: Deck
  }
  opponent: {
    user: User
    client: ApiClient
    deck: Deck
  }
  scoiaTael: AddDeckInput
  nilfgaard: AddDeckInput
  game: Game
}
const fixture = getFixtureCtx<E2eCtx, GameSubscriptionTestCtx>()
const test = getTestCtx<E2eCtx, GameSubscriptionTestCtx>()

fixture('Game Subscription')
  .page(HomePage.getUrl())
  .beforeEach(async (t) => {
    const selfUsername = `${getScenario(t)}-self-${t.ctx.start}`
    const opponentUsername = `${getScenario(t)}-opponent-${t.ctx.start}`

    const self = await new ApiClient({}).addUser({
      name: selfUsername,
    })
    const opponent = await new ApiClient({}).addUser({
      name: opponentUsername,
    })

    const selfClient = new ApiClient({
      username: selfUsername,
    })
    const opponentClient = new ApiClient({
      username: opponentUsername,
    })

    t.ctx.scoiaTael = {
      name: `${getScenario(t)}-scoiatael-deck-${t.ctx.start}`,
      faction: FactionKey.ScoiaTael,
      leaderName: 'Francesca Findabair Queen of Dol Blathanna',
      unitNames: await E2eHelper.getUnitsForDeck({
        client: selfClient,
        faction: FactionKey.ScoiaTael,
      }),
    }
    t.ctx.nilfgaard = {
      name: `${getScenario(t)}-nilfgaard-deck-${t.ctx.start}`,
      faction: FactionKey.NilfgaardianEmpire,
      leaderName: 'Emhyr var Emreis the Relentless',
      unitNames: await E2eHelper.getUnitsForDeck({
        client: opponentClient,
        faction: FactionKey.NilfgaardianEmpire,
      }),
    }
    t.ctx.self = {
      client: selfClient,
      deck: await selfClient.addDeck(t.ctx.scoiaTael),
      user: self,
    }
    t.ctx.opponent = {
      client: opponentClient,
      deck: await opponentClient.addDeck(t.ctx.nilfgaard),
      user: opponent,
    }
    t.ctx.game = await t.ctx.self.client.addGame([t.ctx.opponent.user.name])
    await LoginPage.login({
      username: t.ctx.self.user.name,
    })
  })

test.only('Page updates automatically with deck set via API on game page', async (t) => {
  const client = new ApiClient({
    username: t.ctx.self.user.name,
  })
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  await GamePage.verify({
    opponent: {
      name: t.ctx.opponent.user.name,
    },
    self: {
      name: t.ctx.self.user.name,
    },
  })
  const deck = await t.ctx.self.client.addDeck(t.ctx.nilfgaard)
  const gameDeck = await client.setDeck({
    deckId: deck.id,
    gameId: t.ctx.game.id,
  })
  await GamePage.verify({
    opponent: {
      name: t.ctx.opponent.user.name,
    },
    self: {
      name: t.ctx.self.user.name,
      discard: 0,
      faction: deck.faction,
      leader: deck.leader,
      hand: STARTING_HAND_SIZE,
      undrawn: deck.units.length - STARTING_HAND_SIZE,
      from: gameDeck.from,
    },
    hand: gameDeck.hand,
  })
})

test('Page updates automatically with deck set via API on games list', async (t) => {
  const client = new ApiClient({
    username: t.ctx.self.user.name,
  })
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  await GamePage.verify({
    opponent: {
      name: t.ctx.opponent.user.name,
    },
    self: {
      name: t.ctx.self.user.name,
    },
  })
  const deck = await t.ctx.self.client.addDeck(t.ctx.nilfgaard)
  await Banner.goTo(Banner.elements.MenuGames)
  await GamesPage.verify({
    games: [
      {
        created: t.ctx.game.created,
        owner: t.ctx.self.user.name,
        players: [t.ctx.self.user.name, t.ctx.opponent.user.name],
        status: GameStatus.Decking,
      },
    ],
  })
  const gameDeck = await client.setDeck({
    deckId: deck.id,
    gameId: t.ctx.game.id,
  })
  await GamesPage.verify({
    games: [
      {
        created: t.ctx.game.created,
        owner: t.ctx.self.user.name,
        players: [t.ctx.self.user.name, t.ctx.opponent.user.name],
        status: GameStatus.Decking,
      },
    ],
  })
  await GamesPage.selectGame(0)
  await GamePage.verify({
    opponent: {
      name: t.ctx.opponent.user.name,
    },
    self: {
      name: t.ctx.self.user.name,
      discard: 0,
      faction: deck.faction,
      leader: deck.leader,
      hand: STARTING_HAND_SIZE,
      undrawn: deck.units.length - STARTING_HAND_SIZE,
      from: gameDeck.from,
    },
    hand: gameDeck.hand,
  })
})

test('Page does not update with deck set for other game via API', async (t) => {
  const client = new ApiClient({
    username: t.ctx.self.user.name,
  })
  const game2 = await t.ctx.self.client.addGame([t.ctx.opponent.user.name])
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  await GamePage.verify({
    opponent: {
      name: t.ctx.opponent.user.name,
    },
    self: {
      name: t.ctx.self.user.name,
    },
  })
  const deck = await t.ctx.self.client.addDeck(t.ctx.nilfgaard)
  await client.setDeck({
    deckId: deck.id,
    gameId: game2.id,
  })
  await GamePage.verify({
    opponent: {
      name: t.ctx.opponent.user.name,
    },
    self: {
      name: t.ctx.self.user.name,
    },
  })
})

test('Page automatically updates if user with ScoiaTael deck uses API to make self go first on game page', async (t) => {
  await t.ctx.self.client.setDeck({
    deckId: t.ctx.self.deck.id,
    gameId: t.ctx.game.id,
  })
  await t.ctx.opponent.client.setDeck({
    deckId: t.ctx.opponent.deck.id,
    gameId: t.ctx.game.id,
  })
  const gameDeckSelf = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  const gameDeckOpponent = await t.ctx.opponent.client.getGameDeck(t.ctx.game.id)
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  const selfPlayer = E2eHelper.getGamePlayer({
    player: {
      client: t.ctx.self.client,
      deck: t.ctx.self.deck,
      gameDeck: gameDeckSelf,
      user: t.ctx.self.user,
    },
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: {
      client: t.ctx.opponent.client,
      deck: t.ctx.opponent.deck,
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
  await t.ctx.self.client.setOrder({
    gameId: t.ctx.game.id,
    userIds: [t.ctx.self.user.id, t.ctx.opponent.user.id],
  })
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

test('Page automatically updates if user with ScoiaTael deck uses API to make opponent go first on game page', async (t) => {
  await t.ctx.self.client.setDeck({
    deckId: t.ctx.self.deck.id,
    gameId: t.ctx.game.id,
  })
  await t.ctx.opponent.client.setDeck({
    deckId: t.ctx.opponent.deck.id,
    gameId: t.ctx.game.id,
  })
  const gameDeckSelf = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  const gameDeckOpponent = await t.ctx.opponent.client.getGameDeck(t.ctx.game.id)
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  const selfPlayer = E2eHelper.getGamePlayer({
    player: {
      client: t.ctx.self.client,
      deck: t.ctx.self.deck,
      gameDeck: gameDeckSelf,
      user: t.ctx.self.user,
    },
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: {
      client: t.ctx.opponent.client,
      deck: t.ctx.opponent.deck,
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
  await t.ctx.self.client.setOrder({
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

test('Page automatically updates if user with ScoiaTael deck uses API to make self go first on games list', async (t) => {
  await t.ctx.self.client.setDeck({
    deckId: t.ctx.self.deck.id,
    gameId: t.ctx.game.id,
  })
  await t.ctx.opponent.client.setDeck({
    deckId: t.ctx.opponent.deck.id,
    gameId: t.ctx.game.id,
  })
  const gameDeckSelf = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  const gameDeckOpponent = await t.ctx.opponent.client.getGameDeck(t.ctx.game.id)
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  const selfPlayer = E2eHelper.getGamePlayer({
    player: {
      client: t.ctx.self.client,
      deck: t.ctx.self.deck,
      gameDeck: gameDeckSelf,
      user: t.ctx.self.user,
    },
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: {
      client: t.ctx.opponent.client,
      deck: t.ctx.opponent.deck,
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
  await Banner.goTo(Banner.elements.MenuGames)
  await GamesPage.verify({
    games: [
      {
        created: t.ctx.game.created,
        owner: t.ctx.self.user.name,
        players: [t.ctx.self.user.name, t.ctx.opponent.user.name],
        status: GameStatus.Ordering,
        factions: [t.ctx.scoiaTael.faction, t.ctx.nilfgaard.faction],
      },
    ],
  })
  await t.ctx.self.client.setOrder({
    gameId: t.ctx.game.id,
    userIds: [t.ctx.self.user.id, t.ctx.opponent.user.id],
  })
  await GamesPage.verify({
    games: [
      {
        created: t.ctx.game.created,
        owner: t.ctx.self.user.name,
        players: [t.ctx.self.user.name, t.ctx.opponent.user.name],
        status: GameStatus.Redrawing,
        factions: [t.ctx.scoiaTael.faction, t.ctx.nilfgaard.faction],
      },
    ],
  })
  await GamesPage.selectGame(0)
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

test('Page automatically updates if user with ScoiaTael deck uses API to make opponent go first on games list', async (t) => {
  await t.ctx.self.client.setDeck({
    deckId: t.ctx.self.deck.id,
    gameId: t.ctx.game.id,
  })
  await t.ctx.opponent.client.setDeck({
    deckId: t.ctx.opponent.deck.id,
    gameId: t.ctx.game.id,
  })
  const gameDeckSelf = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  const gameDeckOpponent = await t.ctx.opponent.client.getGameDeck(t.ctx.game.id)
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  const selfPlayer = E2eHelper.getGamePlayer({
    player: {
      client: t.ctx.self.client,
      deck: t.ctx.self.deck,
      gameDeck: gameDeckSelf,
      user: t.ctx.self.user,
    },
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: {
      client: t.ctx.opponent.client,
      deck: t.ctx.opponent.deck,
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
  await Banner.goTo(Banner.elements.MenuGames)
  await GamesPage.verify({
    games: [
      {
        created: t.ctx.game.created,
        owner: t.ctx.self.user.name,
        players: [t.ctx.self.user.name, t.ctx.opponent.user.name],
        status: GameStatus.Ordering,
        factions: [t.ctx.scoiaTael.faction, t.ctx.nilfgaard.faction],
      },
    ],
  })
  await t.ctx.self.client.setOrder({
    gameId: t.ctx.game.id,
    userIds: [t.ctx.opponent.user.id, t.ctx.self.user.id],
  })
  await GamesPage.verify({
    games: [
      {
        created: t.ctx.game.created,
        owner: t.ctx.self.user.name,
        players: [t.ctx.self.user.name, t.ctx.opponent.user.name],
        status: GameStatus.Redrawing,
        factions: [t.ctx.scoiaTael.faction, t.ctx.nilfgaard.faction],
      },
    ],
  })
  await GamesPage.selectGame(0)
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

test('Page does not automatically update if user with ScoiaTael deck uses API to set order for another game', async (t) => {
  await t.ctx.self.client.setDeck({
    deckId: t.ctx.self.deck.id,
    gameId: t.ctx.game.id,
  })
  await t.ctx.opponent.client.setDeck({
    deckId: t.ctx.opponent.deck.id,
    gameId: t.ctx.game.id,
  })
  const gameDeckSelf = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  const gameDeckOpponent = await t.ctx.opponent.client.getGameDeck(t.ctx.game.id)
  const game2 = await t.ctx.self.client.addGame([t.ctx.opponent.user.name])
  await t.ctx.self.client.setDeck({
    deckId: t.ctx.self.deck.id,
    gameId: game2.id,
  })
  await t.ctx.opponent.client.setDeck({
    deckId: t.ctx.opponent.deck.id,
    gameId: game2.id,
  })
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  const selfPlayer = E2eHelper.getGamePlayer({
    player: {
      client: t.ctx.self.client,
      deck: t.ctx.self.deck,
      gameDeck: gameDeckSelf,
      user: t.ctx.self.user,
    },
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: {
      client: t.ctx.opponent.client,
      deck: t.ctx.opponent.deck,
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
  await t.ctx.self.client.setOrder({
    gameId: game2.id,
    userIds: [t.ctx.self.user.id, t.ctx.opponent.user.id],
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: gameDeckSelf.hand,
    turnOrder: [t.ctx.self.user.name, t.ctx.opponent.user.name],
  })
})

test('Page automatically updates after game ready via API before opponent ready on game page', async (t) => {
  const gameDeckSelf = await t.ctx.self.client.setDeck({
    deckId: t.ctx.self.deck.id,
    gameId: t.ctx.game.id,
  })
  const gameDeckOpponent = await t.ctx.opponent.client.setDeck({
    deckId: t.ctx.opponent.deck.id,
    gameId: t.ctx.game.id,
  })
  const updatedGame = await t.ctx.self.client.setOrder({
    gameId: t.ctx.game.id,
    userIds: [t.ctx.self.user.id, t.ctx.opponent.user.id],
  })
  const won = updatedGame.turn?.user.id === t.ctx.self.user.id
  const selfPlayer = E2eHelper.getGamePlayer({
    player: {
      client: t.ctx.self.client,
      deck: t.ctx.self.deck,
      gameDeck: gameDeckSelf,
      user: t.ctx.self.user,
    },
    turn: won ? PlayerTurn.Future : undefined,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: {
      client: t.ctx.opponent.client,
      deck: t.ctx.opponent.deck,
      gameDeck: gameDeckOpponent,
      user: t.ctx.opponent.user,
    },
    turn: won ? undefined : PlayerTurn.Future,
  })
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  await GamePage.verifyCoinToss({
    won,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: gameDeckSelf.hand,
    redraws: [],
  })
  await t.ctx.self.client.ready(t.ctx.game.id)
  await GamePage.verify({
    opponent: opponentPlayer,
    self: {
      ...selfPlayer,
      ready: true,
    },
    hand: gameDeckSelf.hand,
  })
})

test('Page automatically updates after game ready via API after opponent ready on game page', async (t) => {
  const gameDeckSelf = await t.ctx.self.client.setDeck({
    deckId: t.ctx.self.deck.id,
    gameId: t.ctx.game.id,
  })
  const gameDeckOpponent = await t.ctx.opponent.client.setDeck({
    deckId: t.ctx.opponent.deck.id,
    gameId: t.ctx.game.id,
  })
  const updatedGame = await t.ctx.self.client.setOrder({
    gameId: t.ctx.game.id,
    userIds: [t.ctx.self.user.id, t.ctx.opponent.user.id],
  })
  const won = updatedGame.turn?.user.id === t.ctx.self.user.id
  const selfPlayer = E2eHelper.getGamePlayer({
    player: {
      client: t.ctx.self.client,
      deck: t.ctx.self.deck,
      gameDeck: gameDeckSelf,
      user: t.ctx.self.user,
    },
    turn: won ? PlayerTurn.Future : undefined,
    score: 0,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: {
      client: t.ctx.opponent.client,
      deck: t.ctx.opponent.deck,
      gameDeck: gameDeckOpponent,
      user: t.ctx.opponent.user,
    },
    turn: won ? undefined : PlayerTurn.Future,
    ready: true,
    score: 0,
  })
  await t.ctx.opponent.client.ready(t.ctx.game.id)
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  await GamePage.verifyCoinToss({
    won,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: gameDeckSelf.hand,
    redraws: [],
  })
  await t.ctx.self.client.ready(t.ctx.game.id)
  if (won) {
    selfPlayer.turn = PlayerTurn.Current
  } else {
    opponentPlayer.turn = PlayerTurn.Current
  }
  await GamePage.verify({
    opponent: opponentPlayer,
    self: {
      ...selfPlayer,
      ready: true,
      passed: false,
    },
    hand: gameDeckSelf.hand,
    moves: [[]],
  })
})

test('Page automatically updates after game ready via API before opponent ready on games list', async (t) => {
  const gameDeckSelf = await t.ctx.self.client.setDeck({
    deckId: t.ctx.self.deck.id,
    gameId: t.ctx.game.id,
  })
  const gameDeckOpponent = await t.ctx.opponent.client.setDeck({
    deckId: t.ctx.opponent.deck.id,
    gameId: t.ctx.game.id,
  })
  const updatedGame = await t.ctx.self.client.setOrder({
    gameId: t.ctx.game.id,
    userIds: [t.ctx.self.user.id, t.ctx.opponent.user.id],
  })
  const won = updatedGame.turn?.user.id === t.ctx.self.user.id
  const selfPlayer = E2eHelper.getGamePlayer({
    player: {
      client: t.ctx.self.client,
      deck: t.ctx.self.deck,
      gameDeck: gameDeckSelf,
      user: t.ctx.self.user,
    },
    turn: won ? PlayerTurn.Future : undefined,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: {
      client: t.ctx.opponent.client,
      deck: t.ctx.opponent.deck,
      gameDeck: gameDeckOpponent,
      user: t.ctx.opponent.user,
    },
    turn: won ? undefined : PlayerTurn.Future,
  })
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  await GamePage.verifyCoinToss({
    won,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: gameDeckSelf.hand,
    redraws: [],
  })
  await Banner.goTo(Banner.elements.MenuGames)
  await GamesPage.verify({
    games: [
      {
        created: t.ctx.game.created,
        owner: t.ctx.self.user.name,
        players: [t.ctx.self.user.name, t.ctx.opponent.user.name],
        status: GameStatus.Redrawing,
        factions: [t.ctx.scoiaTael.faction, t.ctx.nilfgaard.faction],
      },
    ],
  })
  await t.ctx.self.client.ready(t.ctx.game.id)
  await GamesPage.verify({
    games: [
      {
        created: t.ctx.game.created,
        owner: t.ctx.self.user.name,
        players: [t.ctx.self.user.name, t.ctx.opponent.user.name],
        status: GameStatus.Redrawing,
        factions: [t.ctx.scoiaTael.faction, t.ctx.nilfgaard.faction],
      },
    ],
  })
  await GamesPage.selectGame(0)
  await GamePage.verify({
    opponent: opponentPlayer,
    self: {
      ...selfPlayer,
      ready: true,
    },
    hand: gameDeckSelf.hand,
  })
})

test('Page automatically updates after game ready via API after opponent ready on games list', async (t) => {
  const gameDeckSelf = await t.ctx.self.client.setDeck({
    deckId: t.ctx.self.deck.id,
    gameId: t.ctx.game.id,
  })
  const gameDeckOpponent = await t.ctx.opponent.client.setDeck({
    deckId: t.ctx.opponent.deck.id,
    gameId: t.ctx.game.id,
  })
  const updatedGame = await t.ctx.self.client.setOrder({
    gameId: t.ctx.game.id,
    userIds: [t.ctx.self.user.id, t.ctx.opponent.user.id],
  })
  const won = updatedGame.turn?.user.id === t.ctx.self.user.id
  const selfPlayer = E2eHelper.getGamePlayer({
    player: {
      client: t.ctx.self.client,
      deck: t.ctx.self.deck,
      gameDeck: gameDeckSelf,
      user: t.ctx.self.user,
    },
    turn: won ? PlayerTurn.Future : undefined,
    score: 0,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: {
      client: t.ctx.opponent.client,
      deck: t.ctx.opponent.deck,
      gameDeck: gameDeckOpponent,
      user: t.ctx.opponent.user,
    },
    turn: won ? undefined : PlayerTurn.Future,
    ready: true,
    score: 0,
  })
  await t.ctx.opponent.client.ready(t.ctx.game.id)
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  await GamePage.verifyCoinToss({
    won,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: gameDeckSelf.hand,
    redraws: [],
  })
  await Banner.goTo(Banner.elements.MenuGames)
  await GamesPage.verify({
    games: [
      {
        created: t.ctx.game.created,
        owner: t.ctx.self.user.name,
        players: [t.ctx.self.user.name, t.ctx.opponent.user.name],
        status: GameStatus.Redrawing,
        factions: [t.ctx.scoiaTael.faction, t.ctx.nilfgaard.faction],
      },
    ],
  })
  await t.ctx.self.client.ready(t.ctx.game.id)
  await GamesPage.verify({
    games: [
      {
        created: t.ctx.game.created,
        owner: t.ctx.self.user.name,
        players: [t.ctx.self.user.name, t.ctx.opponent.user.name],
        status: GameStatus.Playing,
        factions: [t.ctx.scoiaTael.faction, t.ctx.nilfgaard.faction],
      },
    ],
  })
  await GamesPage.selectGame(0)
  if (won) {
    selfPlayer.turn = PlayerTurn.Current
  } else {
    opponentPlayer.turn = PlayerTurn.Current
  }
  await GamePage.verify({
    opponent: opponentPlayer,
    self: {
      ...selfPlayer,
      ready: true,
      passed: false,
    },
    hand: gameDeckSelf.hand,
    moves: [[]],
  })
})

test('Game not marked as ready if use API to mark other game as ready', async (t) => {
  const gameDeckSelf = await t.ctx.self.client.setDeck({
    deckId: t.ctx.self.deck.id,
    gameId: t.ctx.game.id,
  })
  const gameDeckOpponent = await t.ctx.opponent.client.setDeck({
    deckId: t.ctx.opponent.deck.id,
    gameId: t.ctx.game.id,
  })
  const updatedGame = await t.ctx.self.client.setOrder({
    gameId: t.ctx.game.id,
    userIds: [t.ctx.self.user.id, t.ctx.opponent.user.id],
  })
  const won = updatedGame.turn?.user.id === t.ctx.self.user.id
  const selfPlayer = E2eHelper.getGamePlayer({
    player: {
      client: t.ctx.self.client,
      deck: t.ctx.self.deck,
      gameDeck: gameDeckSelf,
      user: t.ctx.self.user,
    },
    turn: won ? PlayerTurn.Future : undefined,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: {
      client: t.ctx.opponent.client,
      deck: t.ctx.opponent.deck,
      gameDeck: gameDeckOpponent,
      user: t.ctx.opponent.user,
    },
    turn: won ? undefined : PlayerTurn.Future,
  })
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  await GamePage.verifyCoinToss({
    won,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: gameDeckSelf.hand,
    redraws: [],
  })
  const game2 = await t.ctx.self.client.addGame([t.ctx.opponent.user.name])
  await t.ctx.self.client.setDeck({
    deckId: t.ctx.self.deck.id,
    gameId: game2.id,
  })
  await t.ctx.opponent.client.setDeck({
    deckId: t.ctx.opponent.deck.id,
    gameId: game2.id,
  })
  await t.ctx.self.client.setOrder({
    gameId: game2.id,
    userIds: [t.ctx.self.user.id, t.ctx.opponent.user.id],
  })
  await t.ctx.self.client.ready(game2.id)
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: gameDeckSelf.hand,
    redraws: [],
  })
})

test('Page automatically updates after unit played via API on game page', async (t) => {
  const unitName = 'Dennis Cranmer'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName],
    },
  })
  const deckUnit = gameManager.getHandUnit({
    name: unitName,
  })
  await gameManager.initialize({})

  await gameManager.self.client.playUnit({
    gameId: gameManager.gameId,
    unitId: deckUnit.unit.id,
    combat: Combat.Close,
  })
  E2eHelper.playUnit({
    player: gameManager.self.gamePlayer,
    gameDeck: gameManager.self.deck,
    newDeckUnit: deckUnit,
    row: Combat.Close,
    switchTurnsWith: gameManager.opponent.gamePlayer,
    moves: gameManager.moves[gameManager.round - 1],
  })
  await gameManager.verify({})
})

test('Page automatically updates after opponent plays unit via API on game page', async (t) => {
  const unitName = 'Dennis Cranmer'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    opponent: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName],
    },
    opponentFirst: true,
  })
  const deckUnit = gameManager.getHandUnit({
    name: unitName,
    opponent: true,
  })
  await gameManager.initialize({})

  await gameManager.opponent.client.playUnit({
    gameId: gameManager.gameId,
    unitId: deckUnit.unit.id,
    combat: Combat.Close,
  })
  E2eHelper.playUnit({
    player: gameManager.opponent.gamePlayer,
    gameDeck: gameManager.opponent.deck,
    newDeckUnit: deckUnit,
    row: Combat.Close,
    switchTurnsWith: gameManager.self.gamePlayer,
    moves: gameManager.moves[gameManager.round - 1],
  })
  await gameManager.verify({})
})

test('Page automatically updates after unit played via API on games list', async (t) => {
  const unitName = 'Dennis Cranmer'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName],
    },
  })
  const deckUnit = gameManager.getHandUnit({
    name: unitName,
  })
  await gameManager.initialize({})

  await Banner.goTo(Banner.elements.MenuGames)
  const game = await gameManager.self.client.getGame(gameManager.gameId)
  await GamesPage.verify({
    games: [
      {
        created: game.created,
        owner: game.creator.name,
        players: [gameManager.self.gamePlayer.name, gameManager.opponent.gamePlayer.name],
        status: GameStatus.Playing,
        factions: [
          gameManager.self.gamePlayer.faction?.key as FactionKey,
          gameManager.opponent.gamePlayer.faction?.key as FactionKey,
        ],
      },
    ],
  })

  await gameManager.self.client.playUnit({
    gameId: gameManager.gameId,
    unitId: deckUnit.unit.id,
    combat: Combat.Close,
  })
  E2eHelper.playUnit({
    player: gameManager.self.gamePlayer,
    gameDeck: gameManager.self.deck,
    newDeckUnit: deckUnit,
    row: Combat.Close,
    switchTurnsWith: gameManager.opponent.gamePlayer,
    moves: gameManager.moves[gameManager.round - 1],
  })
  await GamesPage.verify({
    games: [
      {
        created: game.created,
        owner: game.creator.name,
        players: [gameManager.self.gamePlayer.name, gameManager.opponent.gamePlayer.name],
        status: GameStatus.Playing,
        factions: [
          gameManager.self.gamePlayer.faction?.key as FactionKey,
          gameManager.opponent.gamePlayer.faction?.key as FactionKey,
        ],
      },
    ],
  })

  await GamesPage.selectGame(0)
  await gameManager.verify({})
})

test('Page automatically updates after pass at round start via API on game page', async (t) => {
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
  })
  await gameManager.initialize({})

  await gameManager.self.client.playPass({
    gameId: gameManager.gameId,
  })
  E2eHelper.playPass({
    player: gameManager.self.gamePlayer,
    round: gameManager.round,
    switchTurnsWith: gameManager.opponent.gamePlayer,
    moves: gameManager.moves[gameManager.round - 1],
  })

  await gameManager.verify({})
})

test('Page automatically updates after opponent passes at round start via API on game page', async (t) => {
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    opponentFirst: true,
  })
  await gameManager.initialize({})

  await gameManager.opponent.client.playPass({
    gameId: gameManager.gameId,
  })
  E2eHelper.playPass({
    player: gameManager.opponent.gamePlayer,
    round: gameManager.round,
    switchTurnsWith: gameManager.self.gamePlayer,
    moves: gameManager.moves[gameManager.round - 1],
  })

  await gameManager.verify({})
})

test('Page automatically updates after pass at round end via API on game page', async (t) => {
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    opponentFirst: true,
  })
  await gameManager.pass({})
  await gameManager.initialize({})

  await gameManager.self.client.playPass({
    gameId: gameManager.gameId,
  })
  E2eHelper.playPass({
    player: gameManager.self.gamePlayer,
    round: gameManager.round,
    switchTurnsWith: gameManager.self.gamePlayer,
    moves: gameManager.moves[gameManager.round - 1],
  })
  E2eHelper.endRound({
    self: gameManager.self.gamePlayer,
    opponent: gameManager.opponent.gamePlayer,
    losers: [gameManager.self.gamePlayer, gameManager.opponent.gamePlayer],
  })
  gameManager.round++
  gameManager.moves.push([])

  await gameManager.verify({})
})

test('Page automatically updates after opponent passes at round end via API on game page', async (t) => {
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
  })
  await gameManager.pass({})
  await gameManager.initialize({})

  await gameManager.opponent.client.playPass({
    gameId: gameManager.gameId,
  })
  E2eHelper.playPass({
    player: gameManager.opponent.gamePlayer,
    round: gameManager.round,
    switchTurnsWith: gameManager.opponent.gamePlayer,
    moves: gameManager.moves[gameManager.round - 1],
  })
  E2eHelper.endRound({
    self: gameManager.self.gamePlayer,
    opponent: gameManager.opponent.gamePlayer,
    losers: [gameManager.self.gamePlayer, gameManager.opponent.gamePlayer],
  })
  gameManager.round++
  gameManager.moves.push([])

  await gameManager.verify({})
})

test('Page automatically updates after pass via API on games list', async (t) => {
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
  })
  await gameManager.initialize({})

  await Banner.goTo(Banner.elements.MenuGames)
  const game = await gameManager.self.client.getGame(gameManager.gameId)
  await GamesPage.verify({
    games: [
      {
        created: game.created,
        owner: game.creator.name,
        players: [gameManager.self.gamePlayer.name, gameManager.opponent.gamePlayer.name],
        status: GameStatus.Playing,
        factions: [
          gameManager.self.gamePlayer.faction?.key as FactionKey,
          gameManager.opponent.gamePlayer.faction?.key as FactionKey,
        ],
      },
    ],
  })

  await gameManager.self.client.playPass({
    gameId: gameManager.gameId,
  })
  E2eHelper.playPass({
    player: gameManager.self.gamePlayer,
    round: gameManager.round,
    switchTurnsWith: gameManager.opponent.gamePlayer,
    moves: gameManager.moves[gameManager.round - 1],
  })
  await GamesPage.verify({
    games: [
      {
        created: game.created,
        owner: game.creator.name,
        players: [gameManager.self.gamePlayer.name, gameManager.opponent.gamePlayer.name],
        status: GameStatus.Playing,
        factions: [
          gameManager.self.gamePlayer.faction?.key as FactionKey,
          gameManager.opponent.gamePlayer.faction?.key as FactionKey,
        ],
      },
    ],
  })

  await GamesPage.selectGame(0)
  await gameManager.verify({})
})

test('Page automatically updates after game finished on games list', async (t) => {
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
  })
  await gameManager.pass({})
  await gameManager.pass({
    switchTurnsWith: gameManager.opponent.gamePlayer,
  })
  await gameManager.pass({})
  await gameManager.initialize({})

  await Banner.goTo(Banner.elements.MenuGames)
  const game = await gameManager.self.client.getGame(gameManager.gameId)
  await GamesPage.verify({
    games: [
      {
        created: game.created,
        owner: game.creator.name,
        players: [gameManager.self.gamePlayer.name, gameManager.opponent.gamePlayer.name],
        status: GameStatus.Playing,
        factions: [
          gameManager.self.gamePlayer.faction?.key as FactionKey,
          gameManager.opponent.gamePlayer.faction?.key as FactionKey,
        ],
      },
    ],
  })

  await gameManager.self.client.playPass({
    gameId: gameManager.gameId,
  })
  E2eHelper.playPass({
    player: gameManager.self.gamePlayer,
    round: gameManager.round,
    moves: gameManager.moves[gameManager.round - 1],
  })
  E2eHelper.endRound({
    self: gameManager.self.gamePlayer,
    opponent: gameManager.opponent.gamePlayer,
    losers: [gameManager.self.gamePlayer, gameManager.opponent.gamePlayer],
    gameOver: true,
  })
  gameManager.victors = [gameManager.self.gamePlayer.name, gameManager.opponent.gamePlayer.name]
  await GamesPage.verify({
    games: [
      {
        created: game.created,
        owner: game.creator.name,
        players: [gameManager.self.gamePlayer.name, gameManager.opponent.gamePlayer.name],
        status: GameStatus.Done,
        factions: [
          gameManager.self.gamePlayer.faction?.key as FactionKey,
          gameManager.opponent.gamePlayer.faction?.key as FactionKey,
        ],
        victors: [gameManager.self.gamePlayer.name, gameManager.opponent.gamePlayer.name],
      },
    ],
  })

  await GamesPage.selectGame(0)
  await gameManager.verify({})
})
