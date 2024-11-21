import ApiClient from '../util/api-client'
import { Deck, FactionKey, Game, User } from '@gwent/graphql-schema/resolver-typings'
import { E2eCtx, getFixtureCtx, getTestCtx } from '../util/e2e-ctx'
import E2eUtil from '../util/e2e-util'
import GamePage from '../page-objects/game-page'
import HomePage from '../page-objects/home-page'
import LoginPage from '../page-objects/login-page'
import { STARTING_HAND_SIZE } from '@gwent/constants'
import { E2eHelper } from '../util/e2e-helper'
import { PlayerTurn } from '../components/game-player-info'

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

test('Page updates automatically with deck set via API', async (t) => {
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

test('Page automatically updates if user with ScoiaTael deck uses API to make self go first', async (t) => {
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

test('Page automatically updates if user with ScoiaTael deck uses API to make opponent go first', async (t) => {
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

test('Page automatically updates after game ready via API before opponent ready', async (t) => {
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

test('Page automatically updates after game ready via API after opponent ready', async (t) => {
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
    },
    hand: gameDeckSelf.hand,
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
