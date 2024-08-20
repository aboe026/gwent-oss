import ApiClient from '../util/api-client'
import DecksPage from '../page-objects/decks-page'
import LoginPage from '../page-objects/login-page'
import { FactionKey } from '@gwent/graphql-schema/resolver-typings'
import DeckPage from '../page-objects/deck-page'
import Banner from '../components/banner'
import GamesPage from '../page-objects/games-page'
import GamePage from '../page-objects/game-page'
import DeckEditor from '../components/deck-editor'
import DeckList from '../components/deck-list'

fixture('Decks View').page(DecksPage.getUrl())

test('Shows message if no decks', async () => {
  const username = `decks-none-${Date.now()}`
  await new ApiClient({}).addUser({
    name: username,
  })
  await LoginPage.login({
    username,
  })
  await DecksPage.verify({
    decks: [],
  })
})

test('Displays single deck', async () => {
  const username = `decks-single-${Date.now()}`
  const name = 'single deck'
  const faction = FactionKey.NorthernRealms
  const leader = 'Foltest Son of Medell'
  const units = [
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
  ]
  await new ApiClient({}).addUser({
    name: username,
  })
  const client = new ApiClient({ username })
  const deck = await client.addDeck({
    faction,
    leaderName: leader,
    name,
    unitNames: units,
  })
  await LoginPage.login({
    username,
  })

  await DecksPage.verify({
    decks: [
      {
        created: new Date(),
        faction: await client.getFaction({
          key: faction,
          neutrals: true,
        }),
        leader: await client.getLeader({
          faction,
          name: leader,
        }),
        name,
        stats: deck.stats,
      },
    ],
  })
})

test('Displays two decks', async () => {
  const username = `decks-two-${Date.now()}`
  const name1 = 'two decks first'
  const name2 = 'two decks second'
  const faction1 = FactionKey.ScoiaTael
  const faction2 = FactionKey.NilfgaardianEmpire
  const leader1 = 'Francesca Findabair Queen of Dol Blathanna'
  const leader2 = 'Emhyr var Emreis the Relentless'
  const units1 = [
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
  ]
  const units2 = [
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
  ]
  await new ApiClient({}).addUser({
    name: username,
  })
  const client = new ApiClient({ username })
  const deck1 = await client.addDeck({
    faction: faction1,
    leaderName: leader1,
    name: name1,
    unitNames: units1,
  })
  const deck2 = await client.addDeck({
    faction: faction2,
    leaderName: leader2,
    name: name2,
    unitNames: units2,
  })
  await LoginPage.login({
    username,
  })

  await DecksPage.verify({
    decks: [
      {
        created: new Date(),
        faction: await client.getFaction({
          key: faction1,
          neutrals: true,
        }),
        leader: await client.getLeader({
          faction: faction1,
          name: leader1,
        }),
        name: name1,
        stats: deck1.stats,
      },
      {
        created: new Date(),
        faction: await client.getFaction({
          key: faction2,
          neutrals: true,
        }),
        leader: await client.getLeader({
          faction: faction2,
          name: leader2,
        }),
        name: name2,
        stats: deck2.stats,
      },
    ],
  })
})

test('List gets updated after deck created from deck page', async () => {
  const username = `decks-list-updated-on-create-deck-page-${Date.now()}`
  await new ApiClient({}).addUser({
    name: username,
  })
  const client = new ApiClient({ username })
  await LoginPage.login({
    username,
  })
  await DecksPage.verify({
    decks: [],
  })
  await DecksPage.clickCreate()
  const name = 'list-updated-on-create'
  const factionKey = FactionKey.NilfgaardianEmpire
  const faction = await client.getFaction({
    key: factionKey,
    neutrals: true,
  })
  const leader = await client.getLeader({
    faction: factionKey,
    name: 'Emhyr var Emreis the White Flame',
  })
  await DeckPage.createDeck({
    faction,
    leader,
    name,
    units: [
      'Biting Frost',
      'Biting Frost',
      'Biting Frost',
      'Clear Weather',
      'Clear Weather',
      'Decoy',
      'Decoy',
      'Decoy',
      "Gaunter O'Dimm Darkness",
      "Gaunter O'Dimm Darkness",
      "Gaunter O'Dimm Darkness",
      'Impenetrable Fog',
      'Impenetrable Fog',
      'Impera Brigade Guard',
      'Impera Brigade Guard',
      'Impera Brigade Guard',
      'Impera Brigade Guard',
      'Nausicaa Cavalry Rider',
      'Nausicaa Cavalry Rider',
      'Nausicaa Cavalry Rider',
      'Young Emissary',
      'Young Emissary',
    ],
  })
  await DecksPage.verify({
    decks: [
      {
        created: new Date(),
        faction,
        leader,
        name,
        stats: (await client.getDeck(name)).stats,
      },
    ],
  })
})

test('List gets updated after deck created from game page', async () => {
  const scenario = 'decks-list-updated-on-create-game-page'
  const username = `${scenario}-user-${Date.now()}`
  const opponent = `${scenario}-opponent-${Date.now()}`
  await new ApiClient({}).addUser({
    name: username,
  })
  await new ApiClient({}).addUser({
    name: opponent,
  })
  const client = new ApiClient({ username })
  await LoginPage.login({
    username,
  })
  await DecksPage.verify({
    decks: [],
  })
  await Banner.goTo(Banner.elements.MenuGames)
  await GamesPage.clickCreateNone()
  await GamePage.createGame({
    creator: username,
    opponents: [opponent],
  })
  await GamePage.clickSetDeck()
  await DeckList.clickCreateNone()
  const name = 'list-updated-on-create'
  const factionKey = FactionKey.NilfgaardianEmpire
  const faction = await client.getFaction({
    key: factionKey,
    neutrals: true,
  })
  const leader = await client.getLeader({
    faction: factionKey,
    name: 'Emhyr var Emreis the White Flame',
  })
  await DeckEditor.createDeck({
    faction,
    leader,
    name,
    units: [
      'Biting Frost',
      'Biting Frost',
      'Biting Frost',
      'Clear Weather',
      'Clear Weather',
      'Decoy',
      'Decoy',
      'Decoy',
      "Gaunter O'Dimm Darkness",
      "Gaunter O'Dimm Darkness",
      "Gaunter O'Dimm Darkness",
      'Impenetrable Fog',
      'Impenetrable Fog',
      'Impera Brigade Guard',
      'Impera Brigade Guard',
      'Impera Brigade Guard',
      'Impera Brigade Guard',
      'Nausicaa Cavalry Rider',
      'Nausicaa Cavalry Rider',
      'Nausicaa Cavalry Rider',
      'Young Emissary',
      'Young Emissary',
    ],
    verify: false,
  })
  await Banner.goTo(Banner.elements.MenuDecks)
  await DecksPage.verify({
    decks: [
      {
        created: new Date(),
        faction,
        leader,
        name,
        stats: (await client.getDeck(name)).stats,
      },
    ],
  })
})
