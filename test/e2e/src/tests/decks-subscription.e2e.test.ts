import { t } from 'testcafe'

import ApiClient, { AddDeckInput } from '../util/api-client'
import Banner from '../components/banner'
import DeckPage from '../page-objects/deck-page'
import DecksPage from '../page-objects/decks-page'
import E2eUtil from '../util/e2e-util'
import { FactionKey } from '@gwent/graphql-schema/resolver-typings'
import HomePage from '../page-objects/home-page'
import LoginPage from '../page-objects/login-page'

fixture('Decks Subscription')

const deckInput1: AddDeckInput = {
  faction: FactionKey.NorthernRealms,
  leaderName: 'Foltest Lord Commander of the North',
  name: 'deck one',
  unitNames: [
    'Ballista',
    'Blue Stripes Commando',
    'Blue Stripes Commando',
    'Blue Stripes Commando',
    'Catapult',
    'Catapult',
    'Cirilla Fiona Elen Riannon',
    "Commander's Horn",
    'Crinfrid Reavers Dragon Hunter',
    'Crinfrid Reavers Dragon Hunter',
    'Crinfrid Reavers Dragon Hunter',
    'Esterad Thyssen',
    'John Natalis',
    'Poor Fucking Infantry',
    'Poor Fucking Infantry',
    'Poor Fucking Infantry',
    'Prince Stennis',
    'Redanian Foot Soldier',
    'Redanian Foot Soldier',
    'Siegfried of Denesle',
    'Thaler',
    'Yarpen Zigrin',
  ],
}

const deckInput2: AddDeckInput = {
  faction: FactionKey.NilfgaardianEmpire,
  leaderName: 'Emhyr var Emreis the Relentless',
  name: 'deck two',
  unitNames: [
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

const deckInput3: AddDeckInput = {
  faction: FactionKey.ScoiaTael,
  leaderName: 'Francesca Findabair Hope of the Aen Seidhe',
  name: 'deck three',
  unitNames: [
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
  ],
}

test('Deck added through API appears for user on decks page without any decks', async () => {
  const username = `decks-subscription-deck-page-none-${t.ctx.start}`
  await new ApiClient({}).addUser({
    name: username,
  })
  await E2eUtil.goTo(DecksPage.getUrl())
  await LoginPage.login({
    username,
  })
  await DecksPage.verify({
    decks: [],
  })

  const deck = await new ApiClient({
    username,
  }).addDeck(deckInput1)

  await DecksPage.verify({
    decks: [
      {
        created: deck.created,
        faction: deck.faction,
        leader: deck.leader,
        name: deck.name,
        stats: deck.stats,
      },
    ],
  })
})

test('Deck added through API appears for user on decks page with existing deck', async () => {
  const username = `decks-subscription-deck-page-existing-${t.ctx.start}`
  await new ApiClient({}).addUser({
    name: username,
  })
  const client = new ApiClient({ username })
  const deck1 = await client.addDeck(deckInput1)
  await E2eUtil.goTo(DecksPage.getUrl())
  await LoginPage.login({
    username,
  })

  await DecksPage.verify({
    decks: [
      {
        created: deck1.created,
        faction: deck1.faction,
        leader: deck1.leader,
        name: deck1.name,
        stats: deck1.stats,
      },
    ],
  })

  const deck2 = await client.addDeck(deckInput2)

  await DecksPage.verify({
    decks: [
      {
        created: deck1.created,
        faction: deck1.faction,
        leader: deck1.leader,
        name: deck1.name,
        stats: deck1.stats,
      },
      {
        created: deck2.created,
        faction: deck2.faction,
        leader: deck2.leader,
        name: deck2.name,
        stats: deck2.stats,
      },
    ],
  })
})

test('Deck added through API appears for user without decks navigating to decks page from home page', async () => {
  const username = `decks-subscription-home-page-none-${t.ctx.start}`
  await new ApiClient({}).addUser({
    name: username,
  })
  await E2eUtil.goTo(HomePage.getUrl())
  await LoginPage.login({
    username,
  })
  await HomePage.verify(username)
  const deck = await new ApiClient({
    username,
  }).addDeck(deckInput1)
  await Banner.goTo(Banner.elements.MenuDecks)

  await DecksPage.verify({
    decks: [
      {
        created: deck.created,
        faction: deck.faction,
        leader: deck.leader,
        name: deck.name,
        stats: deck.stats,
      },
    ],
  })
})

test('Deck added through API appears for user with existing deck navigating to decks page from home page', async () => {
  const username = `decks-subscription-home-page-existing-${t.ctx.start}`
  await new ApiClient({}).addUser({
    name: username,
  })
  const client = new ApiClient({ username })
  const deck1 = await client.addDeck(deckInput1)
  await E2eUtil.goTo(HomePage.getUrl())
  await LoginPage.login({
    username,
  })
  await HomePage.verify(username)
  const deck2 = await client.addDeck(deckInput2)

  await Banner.goTo(Banner.elements.MenuDecks)
  await DecksPage.verify({
    decks: [
      {
        created: deck1.created,
        faction: deck1.faction,
        leader: deck1.leader,
        name: deck1.name,
        stats: deck1.stats,
      },
      {
        created: deck2.created,
        faction: deck2.faction,
        leader: deck2.leader,
        name: deck2.name,
        stats: deck2.stats,
      },
    ],
  })
})

test('Deck added through API appears for user without decks navigating from decks page to home page and back to decks page', async () => {
  const username = `decks-subscription-deck-page-home-page-none-${t.ctx.start}`
  await new ApiClient({}).addUser({
    name: username,
  })
  await E2eUtil.goTo(DecksPage.getUrl())
  await LoginPage.login({
    username,
  })
  await DecksPage.verify({
    decks: [],
  })
  await Banner.goTo(Banner.elements.MenuHome)
  await HomePage.verify(username)
  const deck = await new ApiClient({
    username,
  }).addDeck(deckInput1)
  await Banner.goTo(Banner.elements.MenuDecks)

  await DecksPage.verify({
    decks: [
      {
        created: deck.created,
        faction: deck.faction,
        leader: deck.leader,
        name: deck.name,
        stats: deck.stats,
      },
    ],
  })
})

test('Deck added through API appears for user with existing deck navigating from decks page to home page and back to decks page', async () => {
  const username = `decks-subscription-deck-page-home-page-existing-${t.ctx.start}`
  await new ApiClient({}).addUser({
    name: username,
  })
  const client = new ApiClient({ username })
  const deck1 = await client.addDeck(deckInput1)
  await E2eUtil.goTo(DecksPage.getUrl())
  await LoginPage.login({
    username,
  })
  await DecksPage.verify({
    decks: [
      {
        created: deck1.created,
        faction: deck1.faction,
        leader: deck1.leader,
        name: deck1.name,
        stats: deck1.stats,
      },
    ],
  })
  await Banner.goTo(Banner.elements.MenuHome)
  await HomePage.verify(username)
  const deck2 = await client.addDeck(deckInput2)

  await Banner.goTo(Banner.elements.MenuDecks)
  await DecksPage.verify({
    decks: [
      {
        created: deck1.created,
        faction: deck1.faction,
        leader: deck1.leader,
        name: deck1.name,
        stats: deck1.stats,
      },
      {
        created: deck2.created,
        faction: deck2.faction,
        leader: deck2.leader,
        name: deck2.name,
        stats: deck2.stats,
      },
    ],
  })
})

test('Deck added through API appears for user without any decks after they create a deck from decks page', async () => {
  const username = `decks-subscription-create-deck-none-decks-page-${t.ctx.start}`
  await new ApiClient({}).addUser({
    name: username,
  })
  const client = new ApiClient({
    username,
  })
  await E2eUtil.goTo(DecksPage.getUrl())
  await LoginPage.login({
    username,
  })
  await DecksPage.verify({
    decks: [],
  })
  await DecksPage.clickCreate()
  const deck1 = await client.addDeck(deckInput1)
  await DeckPage.createDeck({
    faction: await client.getFaction({
      key: deckInput2.faction,
    }),
    leader: await client.getLeader({
      faction: deckInput2.faction,
      name: deckInput2.leaderName,
    }),
    name: deckInput2.name,
    units: deckInput2.unitNames,
  })
  const deck2 = await client.getDeck(deckInput2.name)

  await DecksPage.verify({
    decks: [
      {
        created: deck1.created,
        faction: deck1.faction,
        leader: deck1.leader,
        name: deck1.name,
        stats: deck1.stats,
      },
      {
        created: deck2.created,
        faction: deck2.faction,
        leader: deck2.leader,
        name: deck2.name,
        stats: deck2.stats,
      },
    ],
  })
})

test('Deck added through API appears for user without any decks after they create a deck from home page', async () => {
  const username = `decks-subscription-create-deck-none-home-page-${t.ctx.start}`
  await new ApiClient({}).addUser({
    name: username,
  })
  const client = new ApiClient({
    username,
  })
  await E2eUtil.goTo(HomePage.getUrl())
  await LoginPage.login({
    username,
  })
  await HomePage.verify(username)
  await HomePage.goTo(HomePage.elements.CreateDeck)
  const deck1 = await client.addDeck(deckInput1)
  await DeckPage.createDeck({
    faction: await client.getFaction({
      key: deckInput2.faction,
    }),
    leader: await client.getLeader({
      faction: deckInput2.faction,
      name: deckInput2.leaderName,
    }),
    name: deckInput2.name,
    units: deckInput2.unitNames,
  })
  const deck2 = await client.getDeck(deckInput2.name)

  await DecksPage.verify({
    decks: [
      {
        created: deck1.created,
        faction: deck1.faction,
        leader: deck1.leader,
        name: deck1.name,
        stats: deck1.stats,
      },
      {
        created: deck2.created,
        faction: deck2.faction,
        leader: deck2.leader,
        name: deck2.name,
        stats: deck2.stats,
      },
    ],
  })
})

test('Deck added through API appears for user with existing deck after they create a deck from decks page', async () => {
  const username = `decks-subscription-create-deck-existing-decks-page-${t.ctx.start}`
  await new ApiClient({}).addUser({
    name: username,
  })
  const client = new ApiClient({
    username,
  })
  await E2eUtil.goTo(DecksPage.getUrl())
  await LoginPage.login({
    username,
  })
  const deck1 = await client.addDeck(deckInput1)
  await DecksPage.verify({
    decks: [
      {
        created: deck1.created,
        faction: deck1.faction,
        leader: deck1.leader,
        name: deck1.name,
        stats: deck1.stats,
      },
    ],
  })
  await DecksPage.clickCreate()
  const deck2 = await client.addDeck(deckInput2)
  await DeckPage.createDeck({
    faction: await client.getFaction({
      key: deckInput3.faction,
    }),
    leader: await client.getLeader({
      faction: deckInput3.faction,
      name: deckInput3.leaderName,
    }),
    name: deckInput3.name,
    units: deckInput3.unitNames,
  })
  const deck3 = await client.getDeck(deckInput3.name)

  await DecksPage.verify({
    decks: [
      {
        created: deck1.created,
        faction: deck1.faction,
        leader: deck1.leader,
        name: deck1.name,
        stats: deck1.stats,
      },
      {
        created: deck3.created,
        faction: deck3.faction,
        leader: deck3.leader,
        name: deck3.name,
        stats: deck3.stats,
      },
      {
        created: deck2.created,
        faction: deck2.faction,
        leader: deck2.leader,
        name: deck2.name,
        stats: deck2.stats,
      },
    ],
  })
})

test('Deck added for other user through API does not appear on deck page', async () => {
  const username1 = `decks-subscription-decks-page-different-owner-1-${t.ctx.start}`
  const username2 = `decks-subscription-decks-page-different-owner-2-${t.ctx.start}`
  await new ApiClient({}).addUser({
    name: username1,
  })
  await new ApiClient({}).addUser({
    name: username2,
  })
  await E2eUtil.goTo(DecksPage.getUrl())
  await LoginPage.login({
    username: username1,
  })
  await DecksPage.verify({
    decks: [],
  })

  await new ApiClient({
    username: username2,
  }).addDeck(deckInput1)

  await DecksPage.verify({
    decks: [],
  })
})
