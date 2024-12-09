import ApiClient from '../util/api-client'
import DeckEditor from '../components/deck-editor'
import DeckList from '../components/deck-list'
import { Deck, FactionKey, Game, User } from '@gwent/graphql-schema/resolver-typings'
import { E2eCtx, getFixtureCtx, getTestCtx } from '../util/e2e-ctx'
import E2eUtil from '../util/e2e-util'
import GamePage from '../page-objects/game-page'
import HomePage from '../page-objects/home-page'
import LoginPage from '../page-objects/login-page'
import { STARTING_HAND_SIZE } from '@gwent/constants'

interface GameDeckingTestCtx extends E2eCtx {
  scenario: string
  self: {
    user: User
    client: ApiClient
  }
  opponent: {
    user: User
    client: ApiClient
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
const fixture = getFixtureCtx<E2eCtx, GameDeckingTestCtx>()
const test = getTestCtx<E2eCtx, GameDeckingTestCtx>()

fixture('Game Decking')
  .page(HomePage.getUrl())
  .beforeEach(async (t) => {
    t.ctx.scenario = 'game-decking'
    const selfUsername = `${t.ctx.scenario}-self-${t.ctx.start}`
    const opponentUsername = `${t.ctx.scenario}-opponent-${t.ctx.start}`

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
    t.ctx.game = await t.ctx.self.client.addGame([t.ctx.opponent.user.name])
    await LoginPage.login({
      username: t.ctx.self.user.name,
    })
  })

test('Set deck from new one without any existing', async (t) => {
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  await GamePage.verify({
    opponent: {
      name: t.ctx.opponent.user.name,
    },
    self: {
      name: t.ctx.self.user.name,
    },
  })
  await GamePage.setNewDeck({
    faction: await t.ctx.self.client.getFaction({
      key: t.ctx.nilfgaard.faction,
    }),
    leader: await t.ctx.self.client.getLeader({
      faction: t.ctx.nilfgaard.faction,
      name: t.ctx.nilfgaard.leader,
    }),
    name: `${t.ctx.scenario}-deck-${Date.now()}`,
    units: t.ctx.nilfgaard.units,
  })
  const gameDeck = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  await GamePage.verify({
    opponent: {
      name: t.ctx.opponent.user.name,
    },
    self: {
      name: t.ctx.self.user.name,
      discard: 0,
      faction: gameDeck.from?.faction,
      leader: gameDeck.from?.leader,
      hand: STARTING_HAND_SIZE,
      undrawn: (gameDeck.from as Deck).units.length - STARTING_HAND_SIZE,
      from: gameDeck.from,
    },
    hand: gameDeck.hand,
  })
})

test('Set deck from new one with single existing', async (t) => {
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  await GamePage.verify({
    opponent: {
      name: t.ctx.opponent.user.name,
    },
    self: {
      name: t.ctx.self.user.name,
    },
  })
  const existingDeck = await t.ctx.self.client.addDeck({
    faction: t.ctx.scoiaTael.faction,
    leaderName: t.ctx.scoiaTael.leader,
    name: `${t.ctx.scenario}-existing-deck-${Date.now()}`,
    unitNames: t.ctx.scoiaTael.units,
  })
  await GamePage.setNewDeck({
    faction: await t.ctx.self.client.getFaction({
      key: t.ctx.nilfgaard.faction,
    }),
    leader: await t.ctx.self.client.getLeader({
      faction: t.ctx.nilfgaard.faction,
      name: t.ctx.nilfgaard.leader,
    }),
    name: `${t.ctx.scenario}-deck-${Date.now()}`,
    units: t.ctx.nilfgaard.units,
    existingDecks: [
      {
        created: existingDeck.created,
        faction: existingDeck.faction,
        leader: existingDeck.leader,
        name: existingDeck.name,
        stats: existingDeck.stats,
        neutralFaction: await t.ctx.self.client.getFaction({ key: FactionKey.Neutral }),
      },
    ],
  })
  const gameDeck = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  await GamePage.verify({
    opponent: {
      name: t.ctx.opponent.user.name,
    },
    self: {
      name: t.ctx.self.user.name,
      discard: 0,
      faction: gameDeck.from?.faction,
      leader: gameDeck.from?.leader,
      hand: STARTING_HAND_SIZE,
      undrawn: (gameDeck.from as Deck).units.length - STARTING_HAND_SIZE,
      from: gameDeck.from,
    },
    hand: gameDeck.hand,
  })
})

test('Set deck from existing one with single existing', async (t) => {
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
  await GamePage.setDeck({
    created: deck.created,
    faction: deck.faction,
    leader: deck.leader,
    name: deck.name,
    stats: deck.stats,
    neutralFaction: await t.ctx.self.client.getFaction({ key: FactionKey.Neutral }),
  })
  const gameDeck = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  await GamePage.verify({
    opponent: {
      name: t.ctx.opponent.user.name,
    },
    self: {
      name: t.ctx.self.user.name,
      discard: 0,
      faction: gameDeck.from?.faction,
      leader: gameDeck.from?.leader,
      hand: STARTING_HAND_SIZE,
      undrawn: (gameDeck.from as Deck).units.length - STARTING_HAND_SIZE,
      from: gameDeck.from,
    },
    hand: gameDeck.hand,
  })
})

test('Set deck from existing one with multiple existing', async (t) => {
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  await GamePage.verify({
    opponent: {
      name: t.ctx.opponent.user.name,
    },
    self: {
      name: t.ctx.self.user.name,
    },
  })
  const existingDeck = await t.ctx.self.client.addDeck({
    faction: t.ctx.scoiaTael.faction,
    leaderName: t.ctx.scoiaTael.leader,
    name: `${t.ctx.scenario}-existing-deck-${Date.now()}`,
    unitNames: t.ctx.scoiaTael.units,
  })
  const deck = await t.ctx.self.client.addDeck({
    faction: t.ctx.nilfgaard.faction,
    leaderName: t.ctx.nilfgaard.leader,
    name: `${t.ctx.scenario}-deck-${Date.now()}`,
    unitNames: t.ctx.nilfgaard.units,
  })
  const neutralFaction = await t.ctx.self.client.getFaction({ key: FactionKey.Neutral })
  await GamePage.setDeck({
    created: deck.created,
    faction: deck.faction,
    leader: deck.leader,
    name: deck.name,
    stats: deck.stats,
    additionalExistingDecks: [
      {
        created: existingDeck.created,
        faction: existingDeck.faction,
        leader: existingDeck.leader,
        name: existingDeck.name,
        stats: existingDeck.stats,
        neutralFaction,
      },
    ],
    neutralFaction,
  })
  const gameDeck = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  await GamePage.verify({
    opponent: {
      name: t.ctx.opponent.user.name,
    },
    self: {
      name: t.ctx.self.user.name,
      discard: 0,
      faction: gameDeck.from?.faction,
      leader: gameDeck.from?.leader,
      hand: STARTING_HAND_SIZE,
      undrawn: (gameDeck.from as Deck).units.length - STARTING_HAND_SIZE,
      from: gameDeck.from,
    },
    hand: gameDeck.hand,
  })
})

test('Cancel on decks list closes decks dialog and remains on game page', async (t) => {
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  await GamePage.verify({
    opponent: {
      name: t.ctx.opponent.user.name,
    },
    self: {
      name: t.ctx.self.user.name,
    },
  })
  await GamePage.clickSetDeck()
  await DeckList.close()

  await GamePage.verify({
    opponent: {
      name: t.ctx.opponent.user.name,
    },
    self: {
      name: t.ctx.self.user.name,
    },
  })
})

test('Cancel on deck create closes decks dialog and remains on game page', async (t) => {
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  await GamePage.verify({
    opponent: {
      name: t.ctx.opponent.user.name,
    },
    self: {
      name: t.ctx.self.user.name,
    },
  })
  await GamePage.clickSetDeck()
  await DeckList.clickCreate()

  await DeckEditor.cancel()

  await GamePage.verify({
    opponent: {
      name: t.ctx.opponent.user.name,
    },
    self: {
      name: t.ctx.self.user.name,
    },
  })
})
