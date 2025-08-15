import ApiClient, { AddDeckInput } from '../util/api-client'
import Banner from '../components/banner'
import DeckEditor from '../components/deck-editor'
import DeckList from '../components/deck-list'
import DeckPage from '../page-objects/deck-page'
import DecksPage from '../page-objects/decks-page'
import { E2eCtx, getFixtureCtx, getScenario, getTestCtx } from '../util/e2e-ctx'
import { E2eHelper } from '../util/e2e-helper'
import { FactionKey, User } from '@gwent/graphql-schema/resolver-typings'
import GamePage from '../page-objects/game-page'
import GamesPage from '../page-objects/games-page'
import LoginPage from '../page-objects/login-page'

interface DecksViewTestCtx extends E2eCtx {
  north: AddDeckInput
  nilfgaard: AddDeckInput
  scoiaTael: AddDeckInput
  self: User
  client: ApiClient
}
const fixture = getFixtureCtx<E2eCtx, DecksViewTestCtx>()
const test = getTestCtx<E2eCtx, DecksViewTestCtx>()

fixture('Decks View')
  .page(DecksPage.getUrl())
  .beforeEach(async (t) => {
    t.ctx.self = await new ApiClient({}).addUser({
      name: `${getScenario(t)}-${t.ctx.start}-user-1`,
    })
    t.ctx.client = new ApiClient({
      username: t.ctx.self.name,
    })
    t.ctx.nilfgaard = {
      faction: FactionKey.NilfgaardianEmpire,
      leaderName: 'Emhyr var Emreis the Relentless',
      name: 'deck one',
      unitNames: await E2eHelper.getUnitsForDeck({
        client: t.ctx.client,
        faction: FactionKey.NilfgaardianEmpire,
      }),
    }
    t.ctx.scoiaTael = {
      faction: FactionKey.ScoiaTael,
      leaderName: 'Francesca Findabair Hope of the Aen Seidhe',
      name: 'deck two',
      unitNames: await E2eHelper.getUnitsForDeck({
        client: t.ctx.client,
        faction: FactionKey.ScoiaTael,
      }),
    }
  })

test('Shows message if no decks', async (t) => {
  await LoginPage.login({
    username: t.ctx.self.name,
  })
  await DecksPage.verify({
    decks: [],
  })
})

test('Displays single deck', async (t) => {
  const deck = await t.ctx.client.addDeck(t.ctx.nilfgaard)
  await LoginPage.login({
    username: t.ctx.self.name,
  })

  await DecksPage.verify({
    decks: [
      {
        created: deck.created,
        faction: await t.ctx.client.getFaction({
          key: t.ctx.nilfgaard.faction,
        }),
        leader: await t.ctx.client.getLeader({
          faction: t.ctx.nilfgaard.faction,
          name: t.ctx.nilfgaard.leaderName,
        }),
        name: t.ctx.nilfgaard.name,
        stats: deck.stats,
        neutralFaction: await t.ctx.client.getFaction({ key: FactionKey.Neutral }),
      },
    ],
  })
})

test('Displays two decks', async (t) => {
  const deck1 = await t.ctx.client.addDeck(t.ctx.nilfgaard)
  const deck2 = await t.ctx.client.addDeck(t.ctx.scoiaTael)
  await LoginPage.login({
    username: t.ctx.self.name,
  })
  const neutralFaction = await t.ctx.client.getFaction({ key: FactionKey.Neutral })

  await DecksPage.verify({
    decks: [
      {
        created: deck1.created,
        faction: await t.ctx.client.getFaction({
          key: t.ctx.nilfgaard.faction,
        }),
        leader: await t.ctx.client.getLeader({
          faction: t.ctx.nilfgaard.faction,
          name: t.ctx.nilfgaard.leaderName,
        }),
        name: t.ctx.nilfgaard.name,
        stats: deck1.stats,
        neutralFaction,
      },
      {
        created: deck2.created,
        faction: await t.ctx.client.getFaction({
          key: t.ctx.scoiaTael.faction,
        }),
        leader: await t.ctx.client.getLeader({
          faction: t.ctx.scoiaTael.faction,
          name: t.ctx.scoiaTael.leaderName,
        }),
        name: t.ctx.scoiaTael.name,
        stats: deck2.stats,
        neutralFaction,
      },
    ],
  })
})

test('List gets updated after deck created from deck page', async (t) => {
  await LoginPage.login({
    username: t.ctx.self.name,
  })
  await DecksPage.verify({
    decks: [],
  })
  await DecksPage.clickCreate()
  const faction = await t.ctx.client.getFaction({
    key: t.ctx.nilfgaard.faction,
  })
  const leader = await t.ctx.client.getLeader({
    faction: t.ctx.nilfgaard.faction,
    name: t.ctx.nilfgaard.leaderName,
  })
  await DeckPage.createDeck({
    faction,
    leader,
    name: t.ctx.nilfgaard.name,
    units: t.ctx.nilfgaard.unitNames,
  })
  const deck = await t.ctx.client.getDeck(t.ctx.nilfgaard.name)
  await DecksPage.verify({
    decks: [
      {
        created: deck.created,
        faction,
        leader,
        name: t.ctx.nilfgaard.name,
        stats: deck.stats,
        neutralFaction: await t.ctx.client.getFaction({ key: FactionKey.Neutral }),
      },
    ],
  })
})

test('List gets updated after deck created from game page', async (t) => {
  const opponent = `${getScenario(t)}-opponent-${t.ctx.start}`
  await new ApiClient({}).addUser({
    name: opponent,
  })
  await LoginPage.login({
    username: t.ctx.self.name,
  })
  await DecksPage.verify({
    decks: [],
  })
  await Banner.goTo(Banner.elements.MenuGames)
  await GamesPage.clickCreateNone()
  await GamePage.createGame({
    creator: t.ctx.self.name,
    opponents: [opponent],
  })
  await GamePage.clickSetDeck()
  await DeckList.clickCreateNone()
  const faction = await t.ctx.client.getFaction({
    key: t.ctx.nilfgaard.faction,
  })
  const leader = await t.ctx.client.getLeader({
    faction: t.ctx.nilfgaard.faction,
    name: t.ctx.nilfgaard.leaderName,
  })
  await DeckEditor.createDeck({
    faction,
    leader,
    name: t.ctx.nilfgaard.name,
    units: t.ctx.nilfgaard.unitNames,
    verifyRedirect: false,
  })
  await Banner.goTo(Banner.elements.MenuDecks)
  const deck = await t.ctx.client.getDeck(t.ctx.nilfgaard.name)
  await DecksPage.verify({
    decks: [
      {
        created: deck.created,
        faction,
        leader,
        name: t.ctx.nilfgaard.name,
        stats: deck.stats,
        neutralFaction: await t.ctx.client.getFaction({ key: FactionKey.Neutral }),
      },
    ],
  })
})

test('Shows deck created by api after list refresh button clicked', async (t) => {
  const deck1 = await t.ctx.client.addDeck(t.ctx.nilfgaard)
  const neutralFaction = await t.ctx.client.getFaction({ key: FactionKey.Neutral })

  await LoginPage.login({
    username: t.ctx.self.name,
  })
  await DecksPage.verify({
    decks: [
      {
        created: deck1.created,
        faction: await t.ctx.client.getFaction({
          key: t.ctx.nilfgaard.faction,
        }),
        leader: await t.ctx.client.getLeader({
          faction: t.ctx.nilfgaard.faction,
          name: t.ctx.nilfgaard.leaderName,
        }),
        name: t.ctx.nilfgaard.name,
        stats: deck1.stats,
        neutralFaction,
      },
    ],
  })

  const deck2 = await t.ctx.client.addDeck(t.ctx.scoiaTael)

  await DecksPage.verify({
    decks: [
      {
        created: deck1.created,
        faction: await t.ctx.client.getFaction({
          key: t.ctx.nilfgaard.faction,
        }),
        leader: await t.ctx.client.getLeader({
          faction: t.ctx.nilfgaard.faction,
          name: t.ctx.nilfgaard.leaderName,
        }),
        name: t.ctx.nilfgaard.name,
        stats: deck1.stats,
        neutralFaction,
      },
    ],
  })

  await DecksPage.clickRefresh()

  await DecksPage.verify({
    decks: [
      {
        created: deck1.created,
        faction: await t.ctx.client.getFaction({
          key: t.ctx.nilfgaard.faction,
        }),
        leader: await t.ctx.client.getLeader({
          faction: t.ctx.nilfgaard.faction,
          name: t.ctx.nilfgaard.leaderName,
        }),
        name: t.ctx.nilfgaard.name,
        stats: deck1.stats,
        neutralFaction,
      },
      {
        created: deck2.created,
        faction: await t.ctx.client.getFaction({
          key: t.ctx.scoiaTael.faction,
        }),
        leader: await t.ctx.client.getLeader({
          faction: t.ctx.scoiaTael.faction,
          name: t.ctx.scoiaTael.leaderName,
        }),
        name: t.ctx.scoiaTael.name,
        stats: deck2.stats,
        neutralFaction,
      },
    ],
  })
})
