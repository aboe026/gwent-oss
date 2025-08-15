import ApiClient, { AddDeckInput } from '../util/api-client'
import Banner from '../components/banner'
import DeckPage from '../page-objects/deck-page'
import DecksPage from '../page-objects/decks-page'
import { E2eCtx, getFixtureCtx, getScenario, getTestCtx } from '../util/e2e-ctx'
import { E2eHelper } from '../util/e2e-helper'
import E2eUtil from '../util/e2e-util'
import { FactionKey, User } from '@gwent/graphql-schema/resolver-typings'
import HomePage from '../page-objects/home-page'
import LoginPage from '../page-objects/login-page'

interface DecksSubscriptionTestCtx extends E2eCtx {
  north: AddDeckInput
  nilfgaard: AddDeckInput
  scoiaTael: AddDeckInput
  self: User
  client: ApiClient
}
const fixture = getFixtureCtx<E2eCtx, DecksSubscriptionTestCtx>()
const test = getTestCtx<E2eCtx, DecksSubscriptionTestCtx>()

fixture('Decks Subscription').beforeEach(async (t) => {
  t.ctx.self = await new ApiClient({}).addUser({
    name: `${getScenario(t)}-${t.ctx.start}-user-1`,
  })
  t.ctx.client = new ApiClient({
    username: t.ctx.self.name,
  })
  t.ctx.north = {
    faction: FactionKey.NorthernRealms,
    leaderName: 'Foltest Lord Commander of the North',
    name: 'deck one',
    unitNames: await E2eHelper.getUnitsForDeck({
      client: t.ctx.client,
      faction: FactionKey.NorthernRealms,
    }),
  }
  t.ctx.nilfgaard = {
    faction: FactionKey.NilfgaardianEmpire,
    leaderName: 'Emhyr var Emreis the Relentless',
    name: 'deck two',
    unitNames: await E2eHelper.getUnitsForDeck({
      client: t.ctx.client,
      faction: FactionKey.NilfgaardianEmpire,
    }),
  }
  t.ctx.scoiaTael = {
    faction: FactionKey.ScoiaTael,
    leaderName: 'Francesca Findabair Hope of the Aen Seidhe',
    name: 'deck three',
    unitNames: await E2eHelper.getUnitsForDeck({
      client: t.ctx.client,
      faction: FactionKey.ScoiaTael,
    }),
  }
})

test('Deck added through API appears for user on decks page without any decks', async (t) => {
  await E2eUtil.goTo(DecksPage.getUrl())
  await LoginPage.login({
    username: t.ctx.self.name,
  })
  await DecksPage.verify({
    decks: [],
  })

  const deck = await t.ctx.client.addDeck(t.ctx.north)

  await DecksPage.verify({
    decks: [
      {
        created: deck.created,
        faction: deck.faction,
        leader: deck.leader,
        name: deck.name,
        stats: deck.stats,
        neutralFaction: await t.ctx.client.getFaction({ key: FactionKey.Neutral }),
      },
    ],
  })
})

test('Deck added through API appears for user on decks page with existing deck', async (t) => {
  const deck1 = await t.ctx.client.addDeck(t.ctx.north)
  await E2eUtil.goTo(DecksPage.getUrl())
  await LoginPage.login({
    username: t.ctx.self.name,
  })
  const neutralFaction = await t.ctx.client.getFaction({ key: FactionKey.Neutral })

  await DecksPage.verify({
    decks: [
      {
        created: deck1.created,
        faction: deck1.faction,
        leader: deck1.leader,
        name: deck1.name,
        stats: deck1.stats,
        neutralFaction,
      },
    ],
  })

  const deck2 = await t.ctx.client.addDeck(t.ctx.nilfgaard)

  await DecksPage.verify({
    decks: [
      {
        created: deck1.created,
        faction: deck1.faction,
        leader: deck1.leader,
        name: deck1.name,
        stats: deck1.stats,
        neutralFaction,
      },
      {
        created: deck2.created,
        faction: deck2.faction,
        leader: deck2.leader,
        name: deck2.name,
        stats: deck2.stats,
        neutralFaction,
      },
    ],
  })
})

test('Deck added through API appears for user without decks navigating to decks page from home page', async (t) => {
  await E2eUtil.goTo(HomePage.getUrl())
  await LoginPage.login({
    username: t.ctx.self.name,
  })
  await HomePage.verify(t.ctx.self.name)
  const deck = await t.ctx.client.addDeck(t.ctx.north)
  await Banner.goTo(Banner.elements.MenuDecks)

  await DecksPage.verify({
    decks: [
      {
        created: deck.created,
        faction: deck.faction,
        leader: deck.leader,
        name: deck.name,
        stats: deck.stats,
        neutralFaction: await t.ctx.client.getFaction({ key: FactionKey.Neutral }),
      },
    ],
  })
})

test('Deck added through API appears for user with existing deck navigating to decks page from home page', async (t) => {
  const deck1 = await t.ctx.client.addDeck(t.ctx.north)
  await E2eUtil.goTo(HomePage.getUrl())
  await LoginPage.login({
    username: t.ctx.self.name,
  })
  await HomePage.verify(t.ctx.self.name)
  const deck2 = await t.ctx.client.addDeck(t.ctx.nilfgaard)
  const neutralFaction = await t.ctx.client.getFaction({ key: FactionKey.Neutral })

  await Banner.goTo(Banner.elements.MenuDecks)
  await DecksPage.verify({
    decks: [
      {
        created: deck1.created,
        faction: deck1.faction,
        leader: deck1.leader,
        name: deck1.name,
        stats: deck1.stats,
        neutralFaction,
      },
      {
        created: deck2.created,
        faction: deck2.faction,
        leader: deck2.leader,
        name: deck2.name,
        stats: deck2.stats,
        neutralFaction,
      },
    ],
  })
})

test('Deck added through API appears for user without decks navigating from decks page to home page and back to decks page', async (t) => {
  await E2eUtil.goTo(DecksPage.getUrl())
  await LoginPage.login({
    username: t.ctx.self.name,
  })
  await DecksPage.verify({
    decks: [],
  })
  await Banner.goTo(Banner.elements.MenuHome)
  await HomePage.verify(t.ctx.self.name)
  const deck = await t.ctx.client.addDeck(t.ctx.north)
  await Banner.goTo(Banner.elements.MenuDecks)

  await DecksPage.verify({
    decks: [
      {
        created: deck.created,
        faction: deck.faction,
        leader: deck.leader,
        name: deck.name,
        stats: deck.stats,
        neutralFaction: await t.ctx.client.getFaction({ key: FactionKey.Neutral }),
      },
    ],
  })
})

test('Deck added through API appears for user with existing deck navigating from decks page to home page and back to decks page', async (t) => {
  const deck1 = await t.ctx.client.addDeck(t.ctx.north)
  await E2eUtil.goTo(DecksPage.getUrl())
  await LoginPage.login({
    username: t.ctx.self.name,
  })
  const neutralFaction = await t.ctx.client.getFaction({ key: FactionKey.Neutral })
  await DecksPage.verify({
    decks: [
      {
        created: deck1.created,
        faction: deck1.faction,
        leader: deck1.leader,
        name: deck1.name,
        stats: deck1.stats,
        neutralFaction,
      },
    ],
  })
  await Banner.goTo(Banner.elements.MenuHome)
  await HomePage.verify(t.ctx.self.name)
  const deck2 = await t.ctx.client.addDeck(t.ctx.nilfgaard)

  await Banner.goTo(Banner.elements.MenuDecks)
  await DecksPage.verify({
    decks: [
      {
        created: deck1.created,
        faction: deck1.faction,
        leader: deck1.leader,
        name: deck1.name,
        stats: deck1.stats,
        neutralFaction,
      },
      {
        created: deck2.created,
        faction: deck2.faction,
        leader: deck2.leader,
        name: deck2.name,
        stats: deck2.stats,
        neutralFaction,
      },
    ],
  })
})

test('Deck added through API appears for user without any decks after they create a deck from decks page', async (t) => {
  await E2eUtil.goTo(DecksPage.getUrl())
  await LoginPage.login({
    username: t.ctx.self.name,
  })
  await DecksPage.verify({
    decks: [],
  })
  await DecksPage.clickCreate()
  const deck1 = await t.ctx.client.addDeck(t.ctx.north)
  await DeckPage.createDeck({
    faction: await t.ctx.client.getFaction({
      key: t.ctx.nilfgaard.faction,
    }),
    leader: await t.ctx.client.getLeader({
      faction: t.ctx.nilfgaard.faction,
      name: t.ctx.nilfgaard.leaderName,
    }),
    name: t.ctx.nilfgaard.name,
    units: t.ctx.nilfgaard.unitNames,
  })
  const deck2 = await t.ctx.client.getDeck(t.ctx.nilfgaard.name)
  const neutralFaction = await t.ctx.client.getFaction({ key: FactionKey.Neutral })

  await DecksPage.verify({
    decks: [
      {
        created: deck1.created,
        faction: deck1.faction,
        leader: deck1.leader,
        name: deck1.name,
        stats: deck1.stats,
        neutralFaction,
      },
      {
        created: deck2.created,
        faction: deck2.faction,
        leader: deck2.leader,
        name: deck2.name,
        stats: deck2.stats,
        neutralFaction,
      },
    ],
  })
})

test('Deck added through API appears for user without any decks after they create a deck from home page', async (t) => {
  await E2eUtil.goTo(HomePage.getUrl())
  await LoginPage.login({
    username: t.ctx.self.name,
  })
  await HomePage.verify(t.ctx.self.name)
  await HomePage.goTo(HomePage.elements.CreateDeck)
  const deck1 = await t.ctx.client.addDeck(t.ctx.north)
  await DeckPage.createDeck({
    faction: await t.ctx.client.getFaction({
      key: t.ctx.nilfgaard.faction,
    }),
    leader: await t.ctx.client.getLeader({
      faction: t.ctx.nilfgaard.faction,
      name: t.ctx.nilfgaard.leaderName,
    }),
    name: t.ctx.nilfgaard.name,
    units: t.ctx.nilfgaard.unitNames,
  })
  const deck2 = await t.ctx.client.getDeck(t.ctx.nilfgaard.name)
  const neutralFaction = await t.ctx.client.getFaction({ key: FactionKey.Neutral })

  await DecksPage.verify({
    decks: [
      {
        created: deck1.created,
        faction: deck1.faction,
        leader: deck1.leader,
        name: deck1.name,
        stats: deck1.stats,
        neutralFaction,
      },
      {
        created: deck2.created,
        faction: deck2.faction,
        leader: deck2.leader,
        name: deck2.name,
        stats: deck2.stats,
        neutralFaction,
      },
    ],
  })
})

test('Deck added through API appears for user with existing deck after they create a deck from decks page', async (t) => {
  await E2eUtil.goTo(DecksPage.getUrl())
  await LoginPage.login({
    username: t.ctx.self.name,
  })
  const deck1 = await t.ctx.client.addDeck(t.ctx.north)
  await DecksPage.verify({
    decks: [
      {
        created: deck1.created,
        faction: deck1.faction,
        leader: deck1.leader,
        name: deck1.name,
        stats: deck1.stats,
        neutralFaction: await t.ctx.client.getFaction({ key: FactionKey.Neutral }),
      },
    ],
  })
  await DecksPage.clickCreate()
  const deck2 = await t.ctx.client.addDeck(t.ctx.nilfgaard)
  await DeckPage.createDeck({
    faction: await t.ctx.client.getFaction({
      key: t.ctx.scoiaTael.faction,
    }),
    leader: await t.ctx.client.getLeader({
      faction: t.ctx.scoiaTael.faction,
      name: t.ctx.scoiaTael.leaderName,
    }),
    name: t.ctx.scoiaTael.name,
    units: t.ctx.scoiaTael.unitNames,
  })
  const deck3 = await t.ctx.client.getDeck(t.ctx.scoiaTael.name)
  const neutralFaction = await t.ctx.client.getFaction({ key: FactionKey.Neutral })

  await DecksPage.verify({
    decks: [
      {
        created: deck1.created,
        faction: deck1.faction,
        leader: deck1.leader,
        name: deck1.name,
        stats: deck1.stats,
        neutralFaction,
      },
      {
        created: deck3.created,
        faction: deck3.faction,
        leader: deck3.leader,
        name: deck3.name,
        stats: deck3.stats,
        neutralFaction,
      },
      {
        created: deck2.created,
        faction: deck2.faction,
        leader: deck2.leader,
        name: deck2.name,
        stats: deck2.stats,
        neutralFaction,
      },
    ],
  })
})

test('Deck added for other user through API does not appear on deck page', async (t) => {
  const username2 = `${getScenario(t)}-${t.ctx.start}-user-2`
  await new ApiClient({}).addUser({
    name: username2,
  })
  await E2eUtil.goTo(DecksPage.getUrl())
  await LoginPage.login({
    username: t.ctx.self.name,
  })
  await DecksPage.verify({
    decks: [],
  })

  await new ApiClient({
    username: username2,
  }).addDeck(t.ctx.north)

  await DecksPage.verify({
    decks: [],
  })
})
