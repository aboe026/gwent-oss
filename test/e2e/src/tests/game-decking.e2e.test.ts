import ApiClient, { AddDeckInput } from '../util/api-client'
import { Deck, FactionKey, Game, User } from '@gwent/node-client'
import DeckEditor from '../components/deck-editor'
import DeckList from '../components/deck-list'
import { DECK_MIN_UNITS, STARTING_HAND_SIZE } from '@gwent/constants'
import { E2eCtx, getFixtureCtx, getScenario, getTestCtx } from '../util/e2e-ctx'
import { E2eHelper } from '../util/e2e-helper'
import E2eUtil from '../util/e2e-util'
import GamePage from '../page-objects/game-page'
import HomePage from '../page-objects/home-page'
import LoginPage from '../page-objects/login-page'

interface GameDeckingTestCtx extends E2eCtx {
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
const fixture = getFixtureCtx<E2eCtx, GameDeckingTestCtx>()
const test = getTestCtx<E2eCtx, GameDeckingTestCtx>()

fixture('Game Decking')
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
      unitNames: (
        await E2eHelper.getUnitsForDeck({
          client: t.ctx.self.client,
          faction: FactionKey.ScoiaTael,
        })
      ).slice(0, DECK_MIN_UNITS),
    }
    t.ctx.nilfgaard = {
      name: `${getScenario(t)}-nilfgaard-deck-${t.ctx.start}`,
      faction: FactionKey.NilfgaardianEmpire,
      leaderName: 'Emhyr var Emreis the Relentless',
      unitNames: (
        await E2eHelper.getUnitsForDeck({
          client: t.ctx.self.client,
          faction: FactionKey.NilfgaardianEmpire,
        })
      ).slice(0, DECK_MIN_UNITS),
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
      name: t.ctx.nilfgaard.leaderName,
    }),
    name: t.ctx.nilfgaard.name,
    units: t.ctx.nilfgaard.unitNames,
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
  const existingDeck = await t.ctx.self.client.addDeck(t.ctx.scoiaTael)
  await GamePage.setNewDeck({
    faction: await t.ctx.self.client.getFaction({
      key: t.ctx.nilfgaard.faction,
    }),
    leader: await t.ctx.self.client.getLeader({
      faction: t.ctx.nilfgaard.faction,
      name: t.ctx.nilfgaard.leaderName,
    }),
    name: t.ctx.nilfgaard.name,
    units: t.ctx.nilfgaard.unitNames,
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
  const deck = await t.ctx.self.client.addDeck(t.ctx.nilfgaard)
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
  const existingDeck = await t.ctx.self.client.addDeck(t.ctx.scoiaTael)
  const deck = await t.ctx.self.client.addDeck(t.ctx.nilfgaard)
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
