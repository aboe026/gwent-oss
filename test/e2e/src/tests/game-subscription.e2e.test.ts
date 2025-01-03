import ApiClient from '../util/api-client'
import Banner from '../components/banner'
import { Combat, Deck, FactionKey, Game, GameStatus, User } from '@gwent/graphql-schema/resolver-typings'
import { E2eCtx, getFixtureCtx, getTestCtx } from '../util/e2e-ctx'
import E2eUtil from '../util/e2e-util'
import GamePage, { HistoryMove, HistoryPass } from '../page-objects/game-page'
import GamesPage from '../page-objects/games-page'
import HomePage from '../page-objects/home-page'
import LoginPage from '../page-objects/login-page'
import { STARTING_HAND_SIZE } from '@gwent/constants'
import { E2eHelper } from '../util/e2e-helper'
import { PlayerTurn } from '../components/game-player-info'
import { sortObjectArray } from '@gwent/utils'

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
  scoiaTael: {
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
const fixture = getFixtureCtx<E2eCtx, GameSubscriptionTestCtx>()
const test = getTestCtx<E2eCtx, GameSubscriptionTestCtx>()

fixture('Game Subscription')
  .page(HomePage.getUrl())
  .beforeEach(async (t) => {
    t.ctx.scenario = 'game-subscription'
    const selfUsername = `${t.ctx.scenario}-self-${t.ctx.start}`
    const opponentUsername = `${t.ctx.scenario}-opponent-${t.ctx.start}`

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
      faction: FactionKey.ScoiaTael,
      leader: 'Francesca Findabair Queen of Dol Blathanna',
      units: [
        'Barclay Els',
        'Ciaran aep Easnillien',
        'Cirilla Fiona Elen Riannon',
        'Dol Blathanna Archer',
        'Dol Blathanna Scout',
        'Dol Blathanna Scout',
        'Dol Blathanna Scout',
        'Dwarven Skirmisher',
        'Dwarven Skirmisher',
        'Dwarven Skirmisher',
        'Eithne',
        'Elven Skirmisher',
        'Elven Skirmisher',
        'Elven Skirmisher',
        'Emiel Regis Rohellec Terzieff',
        'Filavandrel aen Fidhail',
        'Havekar Healer',
        'Havekar Healer',
        'Havekar Healer',
        'Havekar Smuggler',
        'Havekar Smuggler',
        'Havekar Smuggler',
        'Scorch',
      ],
    }
    t.ctx.nilfgaard = {
      faction: FactionKey.NilfgaardianEmpire,
      leader: 'Emhyr var Emreis the Relentless',
      units: [
        'Albrich',
        'Assire var Anahid',
        'Black Infantry Archer',
        'Black Infantry Archer',
        'Emiel Regis Rohellec Terzieff',
        'Etolian Auxiliary Archers',
        'Etolian Auxiliary Archers',
        'Heavy Zerrikanian Fire Scorpion',
        'Impera Brigade Guard',
        'Impera Brigade Guard',
        'Impera Brigade Guard',
        'Impera Brigade Guard',
        'Nausicaa Cavalry Rider',
        'Nausicaa Cavalry Rider',
        'Nausicaa Cavalry Rider',
        'Renuald aep Matsen',
        'Rotten Mangonel',
        'Shilard Fitz-Oesterlen',
        'Siege Engineer',
        'Siege Technician',
        'Young Emissary',
        'Young Emissary',
      ],
    }
    t.ctx.self = {
      client: selfClient,
      deck: await selfClient.addDeck({
        faction: t.ctx.scoiaTael.faction,
        leaderName: t.ctx.scoiaTael.leader,
        name: `${t.ctx.scenario}-self-deck-${t.ctx.start}`,
        unitNames: t.ctx.scoiaTael.units,
      }),
      user: self,
    }
    t.ctx.opponent = {
      client: opponentClient,
      deck: await opponentClient.addDeck({
        faction: t.ctx.nilfgaard.faction,
        leaderName: t.ctx.nilfgaard.leader,
        name: `${t.ctx.scenario}-opponent-deck-${t.ctx.start}`,
        unitNames: t.ctx.nilfgaard.units,
      }),
      user: opponent,
    }
    t.ctx.game = await t.ctx.self.client.addGame([t.ctx.opponent.user.name])
    await LoginPage.login({
      username: t.ctx.self.user.name,
    })
  })

test('Page updates automatically with deck set via API on game page', async (t) => {
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
  const deck = await t.ctx.self.client.addDeck({
    faction: t.ctx.nilfgaard.faction,
    leaderName: t.ctx.nilfgaard.leader,
    name: `${t.ctx.scenario}-deck-${Date.now()}`,
    unitNames: t.ctx.nilfgaard.units,
  })
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
  const deck = await t.ctx.self.client.addDeck({
    faction: t.ctx.nilfgaard.faction,
    leaderName: t.ctx.nilfgaard.leader,
    name: `${t.ctx.scenario}-deck-${Date.now()}`,
    unitNames: t.ctx.nilfgaard.units,
  })
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
  const deck = await t.ctx.self.client.addDeck({
    faction: t.ctx.nilfgaard.faction,
    leaderName: t.ctx.nilfgaard.leader,
    name: `${t.ctx.scenario}-deck-${Date.now()}`,
    unitNames: t.ctx.nilfgaard.units,
  })
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
  await t.ctx.self.client.ready(game2.id)
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: gameDeckSelf.hand,
    redraws: [],
  })
})

test('Page automatically updates after unit played via API on game page', async (t) => {
  const gameDeckSelf = await t.ctx.self.client.setDeck({
    deckId: t.ctx.self.deck.id,
    gameId: t.ctx.game.id,
  })
  const gameDeckOpponent = await t.ctx.opponent.client.setDeck({
    deckId: t.ctx.opponent.deck.id,
    gameId: t.ctx.game.id,
  })
  await t.ctx.self.client.setOrder({
    gameId: t.ctx.game.id,
    userIds: [t.ctx.self.user.id, t.ctx.opponent.user.id],
  })
  await t.ctx.self.client.ready(t.ctx.game.id)
  await t.ctx.opponent.client.ready(t.ctx.game.id)
  const selfPlayer = E2eHelper.getGamePlayer({
    player: {
      client: t.ctx.self.client,
      deck: t.ctx.self.deck,
      gameDeck: gameDeckSelf,
      user: t.ctx.self.user,
    },
    ready: true,
    passed: false,
    turn: PlayerTurn.Current,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: {
      client: t.ctx.opponent.client,
      deck: t.ctx.opponent.deck,
      gameDeck: gameDeckOpponent,
      user: t.ctx.opponent.user,
    },
    ready: true,
  })
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: gameDeckSelf.hand,
    moves: [[]],
  })

  const sortedHand = sortObjectArray({
    array: gameDeckSelf.hand,
    sortProperties: ['unit.strength', 'unit.id'],
    reverse: true,
  })
  const unitToMove = sortedHand[0]
  const combatRow = unitToMove.unit.combats ? unitToMove.unit.combats[0] : Combat.Close

  await t.ctx.self.client.playUnit({
    gameId: t.ctx.game.id,
    unitId: unitToMove.unit.id,
    combat: combatRow,
  })
  selfPlayer.turn = undefined
  gameDeckSelf.hand = gameDeckSelf.hand.filter((card) => card.unit.id !== unitToMove.unit.id)
  selfPlayer.hand = 9
  selfPlayer.score = unitToMove.unit.strength || 0
  E2eHelper.addUnitToGamePlayer({
    player: selfPlayer,
    row: combatRow,
    score: unitToMove.unit.strength || 0,
    unitName: unitToMove.unit.name,
  })
  opponentPlayer.turn = PlayerTurn.Current

  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: gameDeckSelf.hand,
    moves: [
      [
        {
          userName: selfPlayer.name,
          unitName: unitToMove.unit.name,
          combatRow: combatRow,
        },
      ],
    ],
  })
})

test('Page automatically updates after opponent plays unit via API on game page', async (t) => {
  const gameDeckSelf = await t.ctx.self.client.setDeck({
    deckId: t.ctx.self.deck.id,
    gameId: t.ctx.game.id,
  })
  const gameDeckOpponent = await t.ctx.opponent.client.setDeck({
    deckId: t.ctx.opponent.deck.id,
    gameId: t.ctx.game.id,
  })
  await t.ctx.self.client.setOrder({
    gameId: t.ctx.game.id,
    userIds: [t.ctx.self.user.id, t.ctx.opponent.user.id],
  })
  await t.ctx.self.client.ready(t.ctx.game.id)
  await t.ctx.opponent.client.ready(t.ctx.game.id)
  const selfPlayer = E2eHelper.getGamePlayer({
    player: {
      client: t.ctx.self.client,
      deck: t.ctx.self.deck,
      gameDeck: gameDeckSelf,
      user: t.ctx.self.user,
    },
    ready: true,
    passed: false,
    turn: PlayerTurn.Current,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: {
      client: t.ctx.opponent.client,
      deck: t.ctx.opponent.deck,
      gameDeck: gameDeckOpponent,
      user: t.ctx.opponent.user,
    },
    ready: true,
  })
  const moves: (HistoryMove | HistoryPass)[] = []

  await t.ctx.self.client.playPass({
    gameId: t.ctx.game.id,
  })
  selfPlayer.passed = true
  selfPlayer.turn = undefined
  opponentPlayer.turn = PlayerTurn.Current
  moves.push({
    userName: t.ctx.self.user.name,
    round: 1,
  })

  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: gameDeckSelf.hand,
    moves: [moves],
  })

  const sortedHand = sortObjectArray({
    array: gameDeckOpponent.hand,
    sortProperties: ['unit.strength', 'unit.id'],
    reverse: true,
  })
  const unitToMove = sortedHand[0]
  const combatRow = unitToMove.unit.combats ? unitToMove.unit.combats[0] : Combat.Close

  await t.ctx.opponent.client.playUnit({
    gameId: t.ctx.game.id,
    unitId: unitToMove.unit.id,
    combat: combatRow,
  })
  opponentPlayer.hand = 9
  opponentPlayer.score = unitToMove.unit.strength || 0
  E2eHelper.addUnitToGamePlayer({
    player: opponentPlayer,
    row: combatRow,
    score: unitToMove.unit.strength || 0,
    unitName: unitToMove.unit.name,
  })
  moves.push({
    userName: opponentPlayer.name,
    unitName: unitToMove.unit.name,
    combatRow: combatRow,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: gameDeckSelf.hand,
    moves: [moves],
  })
})

test('Page automatically updates after unit played via API on games list', async (t) => {
  const gameDeckSelf = await t.ctx.self.client.setDeck({
    deckId: t.ctx.self.deck.id,
    gameId: t.ctx.game.id,
  })
  const gameDeckOpponent = await t.ctx.opponent.client.setDeck({
    deckId: t.ctx.opponent.deck.id,
    gameId: t.ctx.game.id,
  })
  await t.ctx.self.client.setOrder({
    gameId: t.ctx.game.id,
    userIds: [t.ctx.self.user.id, t.ctx.opponent.user.id],
  })
  await t.ctx.self.client.ready(t.ctx.game.id)
  await t.ctx.opponent.client.ready(t.ctx.game.id)
  const selfPlayer = E2eHelper.getGamePlayer({
    player: {
      client: t.ctx.self.client,
      deck: t.ctx.self.deck,
      gameDeck: gameDeckSelf,
      user: t.ctx.self.user,
    },
    ready: true,
    passed: false,
    turn: PlayerTurn.Current,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: {
      client: t.ctx.opponent.client,
      deck: t.ctx.opponent.deck,
      gameDeck: gameDeckOpponent,
      user: t.ctx.opponent.user,
    },
    ready: true,
  })
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: gameDeckSelf.hand,
    moves: [[]],
  })

  await Banner.goTo(Banner.elements.MenuGames)
  await GamesPage.verify({
    games: [
      {
        created: t.ctx.game.created,
        owner: t.ctx.self.user.name,
        players: [t.ctx.self.user.name, t.ctx.opponent.user.name],
        status: GameStatus.Playing,
        factions: [t.ctx.self.deck.faction.key, t.ctx.opponent.deck.faction.key],
      },
    ],
  })

  const sortedHand = sortObjectArray({
    array: gameDeckSelf.hand,
    sortProperties: ['unit.strength', 'unit.id'],
    reverse: true,
  })
  const unitToMove = sortedHand[0]
  const combatRow = unitToMove.unit.combats ? unitToMove.unit.combats[0] : Combat.Close

  await t.ctx.self.client.playUnit({
    gameId: t.ctx.game.id,
    unitId: unitToMove.unit.id,
    combat: combatRow,
  })
  selfPlayer.turn = undefined
  gameDeckSelf.hand = gameDeckSelf.hand.filter((card) => card.unit.id !== unitToMove.unit.id)
  selfPlayer.hand = 9
  selfPlayer.score = unitToMove.unit.strength || 0
  E2eHelper.addUnitToGamePlayer({
    player: selfPlayer,
    row: combatRow,
    score: unitToMove.unit.strength || 0,
    unitName: unitToMove.unit.name,
  })
  opponentPlayer.turn = PlayerTurn.Current

  await GamesPage.verify({
    games: [
      {
        created: t.ctx.game.created,
        owner: t.ctx.self.user.name,
        players: [t.ctx.self.user.name, t.ctx.opponent.user.name],
        status: GameStatus.Playing,
        factions: [t.ctx.self.deck.faction.key, t.ctx.opponent.deck.faction.key],
      },
    ],
  })

  await GamesPage.selectGame(0)

  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: gameDeckSelf.hand,
    moves: [
      [
        {
          userName: selfPlayer.name,
          unitName: unitToMove.unit.name,
          combatRow: combatRow,
        },
      ],
    ],
  })
})

test('Page automatically updates after pass at round start via API on game page', async (t) => {
  const gameDeckSelf = await t.ctx.self.client.setDeck({
    deckId: t.ctx.self.deck.id,
    gameId: t.ctx.game.id,
  })
  const gameDeckOpponent = await t.ctx.opponent.client.setDeck({
    deckId: t.ctx.opponent.deck.id,
    gameId: t.ctx.game.id,
  })
  await t.ctx.self.client.setOrder({
    gameId: t.ctx.game.id,
    userIds: [t.ctx.self.user.id, t.ctx.opponent.user.id],
  })
  await t.ctx.self.client.ready(t.ctx.game.id)
  await t.ctx.opponent.client.ready(t.ctx.game.id)
  const selfPlayer = E2eHelper.getGamePlayer({
    player: {
      client: t.ctx.self.client,
      deck: t.ctx.self.deck,
      gameDeck: gameDeckSelf,
      user: t.ctx.self.user,
    },
    ready: true,
    passed: false,
    turn: PlayerTurn.Current,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: {
      client: t.ctx.opponent.client,
      deck: t.ctx.opponent.deck,
      gameDeck: gameDeckOpponent,
      user: t.ctx.opponent.user,
    },
    ready: true,
  })
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: gameDeckSelf.hand,
    moves: [[]],
  })

  await t.ctx.self.client.playPass({
    gameId: t.ctx.game.id,
  })
  selfPlayer.passed = true
  selfPlayer.turn = undefined
  opponentPlayer.turn = PlayerTurn.Current

  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: gameDeckSelf.hand,
    moves: [
      [
        {
          userName: selfPlayer.name,
          round: 1,
        },
      ],
    ],
  })
})

test('Page automatically updates after pass at round end via API on game page', async (t) => {
  const gameDeckSelf = await t.ctx.self.client.setDeck({
    deckId: t.ctx.self.deck.id,
    gameId: t.ctx.game.id,
  })
  const gameDeckOpponent = await t.ctx.opponent.client.setDeck({
    deckId: t.ctx.opponent.deck.id,
    gameId: t.ctx.game.id,
  })
  await t.ctx.self.client.setOrder({
    gameId: t.ctx.game.id,
    userIds: [t.ctx.self.user.id, t.ctx.opponent.user.id],
  })
  await t.ctx.self.client.ready(t.ctx.game.id)
  await t.ctx.opponent.client.ready(t.ctx.game.id)
  const selfPlayer = E2eHelper.getGamePlayer({
    player: {
      client: t.ctx.self.client,
      deck: t.ctx.self.deck,
      gameDeck: gameDeckSelf,
      user: t.ctx.self.user,
    },
    ready: true,
    passed: false,
    turn: PlayerTurn.Current,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: {
      client: t.ctx.opponent.client,
      deck: t.ctx.opponent.deck,
      gameDeck: gameDeckOpponent,
      user: t.ctx.opponent.user,
    },
    ready: true,
  })
  const moves: (HistoryMove | HistoryPass)[] = []

  const sortedHand = sortObjectArray({
    array: gameDeckSelf.hand,
    sortProperties: ['unit.strength', 'unit.id'],
    reverse: true,
  })
  const unitToMove = sortedHand[0]
  const combatRow = unitToMove.unit.combats ? unitToMove.unit.combats[0] : Combat.Close
  await t.ctx.self.client.playUnit({
    gameId: t.ctx.game.id,
    unitId: unitToMove.unit.id,
    combat: combatRow,
  })
  gameDeckSelf.hand = gameDeckSelf.hand.filter((card) => card.unit.id !== unitToMove.unit.id)
  selfPlayer.hand = 9
  selfPlayer.score = unitToMove.unit.strength || 0
  E2eHelper.addUnitToGamePlayer({
    player: selfPlayer,
    row: combatRow,
    score: unitToMove.unit.strength || 0,
    unitName: unitToMove.unit.name,
  })
  moves.push({
    userName: t.ctx.self.user.name,
    unitName: unitToMove.unit.name,
    combatRow: combatRow,
  })

  await t.ctx.opponent.client.playPass({
    gameId: t.ctx.game.id,
  })
  opponentPlayer.passed = true
  moves.push({
    userName: t.ctx.opponent.user.name,
    round: 1,
  })

  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: gameDeckSelf.hand,
    moves: [moves],
  })

  await t.ctx.self.client.playPass({
    gameId: t.ctx.game.id,
  })
  opponentPlayer.passed = undefined
  opponentPlayer.losses = 1
  selfPlayer.score = 0
  selfPlayer.discard = 1
  E2eHelper.resetPlayerCombatRow({
    player: selfPlayer,
    row: combatRow,
  })
  moves.push({
    userName: t.ctx.self.user.name,
    round: 1,
  })

  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: gameDeckSelf.hand,
    round: 2,
    moves: [moves, []],
  })
})

test('Page automatically updates after pass via API on games list', async (t) => {
  const gameDeckSelf = await t.ctx.self.client.setDeck({
    deckId: t.ctx.self.deck.id,
    gameId: t.ctx.game.id,
  })
  const gameDeckOpponent = await t.ctx.opponent.client.setDeck({
    deckId: t.ctx.opponent.deck.id,
    gameId: t.ctx.game.id,
  })
  await t.ctx.self.client.setOrder({
    gameId: t.ctx.game.id,
    userIds: [t.ctx.self.user.id, t.ctx.opponent.user.id],
  })
  await t.ctx.self.client.ready(t.ctx.game.id)
  await t.ctx.opponent.client.ready(t.ctx.game.id)
  const selfPlayer = E2eHelper.getGamePlayer({
    player: {
      client: t.ctx.self.client,
      deck: t.ctx.self.deck,
      gameDeck: gameDeckSelf,
      user: t.ctx.self.user,
    },
    ready: true,
    passed: false,
    turn: PlayerTurn.Current,
  })
  const opponentPlayer = E2eHelper.getGamePlayer({
    player: {
      client: t.ctx.opponent.client,
      deck: t.ctx.opponent.deck,
      gameDeck: gameDeckOpponent,
      user: t.ctx.opponent.user,
    },
    ready: true,
  })
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: gameDeckSelf.hand,
    moves: [[]],
  })

  await Banner.goTo(Banner.elements.MenuGames)
  await GamesPage.verify({
    games: [
      {
        created: t.ctx.game.created,
        owner: t.ctx.self.user.name,
        players: [t.ctx.self.user.name, t.ctx.opponent.user.name],
        status: GameStatus.Playing,
        factions: [t.ctx.self.deck.faction.key, t.ctx.opponent.deck.faction.key],
      },
    ],
  })

  await t.ctx.self.client.playPass({
    gameId: t.ctx.game.id,
  })
  selfPlayer.passed = true
  selfPlayer.turn = undefined
  opponentPlayer.turn = PlayerTurn.Current

  await GamesPage.verify({
    games: [
      {
        created: t.ctx.game.created,
        owner: t.ctx.self.user.name,
        players: [t.ctx.self.user.name, t.ctx.opponent.user.name],
        status: GameStatus.Playing,
        factions: [t.ctx.self.deck.faction.key, t.ctx.opponent.deck.faction.key],
      },
    ],
  })
  await GamesPage.selectGame(0)

  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: gameDeckSelf.hand,
    moves: [
      [
        {
          userName: selfPlayer.name,
          round: 1,
        },
      ],
    ],
  })
})
