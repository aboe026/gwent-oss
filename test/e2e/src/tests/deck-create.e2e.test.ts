import ApiClient from '../util/api-client'
import DeckPage from '../page-objects/deck-page'
import E2eUtil from '../util/e2e-util'
import { FactionKey } from '@gwent/graphql-schema/resolver-typings'
import LoginPage from '../page-objects/login-page'
import DecksPage from '../page-objects/decks-page'
import { sortObjectArray } from '@gwent/utils'
import { SORT_FIELD } from '@gwent/graphql-schema/deck-filter'
import DeckEditor from '../components/deck-editor'

fixture('Deck Create').page(DeckPage.getUrl())

test('Create deck with dropdowns', async () => {
  const username = `deck-create-dropdowns-${Date.now()}`
  const name = 'Create deck dropdowns'
  const factionKey = FactionKey.NorthernRealms
  const leaderName = 'Foltest Son of Medell'
  const units = [
    'Ballista',
    'Biting Frost',
    'Blue Stripes Commando',
    'Blue Stripes Commando',
    'Blue Stripes Commando',
    'Catapult',
    'Catapult',
    'Cirilla Fiona Elen Riannon',
    "Commander's Horn",
    'Cow',
    'Decoy',
    'Dun Banner Medic',
    'Geralt of Rivia',
    'Mysterious Elf',
    'Prince Stennis',
    'Sabrina Glevissig',
    'Scorch',
    'Sigismund Dijkstra',
    'Skellige Storm',
    'Thaler',
    'Villentretenmerth',
    'Yennefer of Vengerberg',
  ]

  await new ApiClient({}).addUser({
    name: username,
  })
  const client = new ApiClient({ username })
  const faction = await client.getFaction({
    key: factionKey,
  })
  const leader = await client.getLeader({
    faction: factionKey,
    name: leaderName,
  })
  await LoginPage.login({
    username,
  })

  await DeckPage.createDeck({
    faction,
    name,
    leader,
    units,
  })
})

test('Create deck with pickers', async () => {
  const username = `deck-create-pickers-${Date.now()}`
  const password = 'password'
  const name = 'Create deck pickers'
  const factionKey = FactionKey.ScoiaTael
  const leaderName = 'Francesca Findabair Pureblood Elf'
  const units = [
    'Barclay Els',
    'Dol Blathanna Scout',
    'Dol Blathanna Scout',
    'Dol Blathanna Scout',
    'Dwarven Skirmisher',
    'Dwarven Skirmisher',
    'Dwarven Skirmisher',
    'Elven Skirmisher',
    'Elven Skirmisher',
    'Elven Skirmisher',
    "Gaunter O'Dimm",
    'Havekar Healer',
    'Havekar Healer',
    'Havekar Healer',
    'Havekar Smuggler',
    'Havekar Smuggler',
    'Havekar Smuggler',
    'Olgierd Von Everec',
    'Schirru',
    'Vrihedd Brigade Veteran',
    'Vrihedd Brigade Veteran',
    'Yaevinn',
  ]

  await new ApiClient({}).addUser({
    name: username,
    password,
  })
  const faction = await new ApiClient({ username, password }).getFaction({
    key: factionKey,
  })
  const leader = await new ApiClient({ username, password }).getLeader({
    faction: factionKey,
    name: leaderName,
  })
  await LoginPage.login({
    username,
    password,
  })

  await DeckPage.createDeck({
    faction,
    name,
    leader,
    units,
    pickers: true,
  })
})

test('Create disabled if invalid', async () => {
  const username = `deck--create-disabled-if-invalid-${Date.now()}`
  const password = 'password'
  const name = 'Create deck disabled if invalid'
  const factionKey = FactionKey.NilfgaardianEmpire
  const leaderName = 'Emhyr var Emreis the Relentless'
  const units = [
    'Albrich',
    'Black Infantry Archer',
    'Cahir Mawr Dyffryn aep Ceallach',
    "Commander's Horn",
    'Decoy',
    'Decoy',
    'Decoy',
    'Fringilla Vigo',
    'Heavy Zerrikanian Fire Scorpion',
    'Impera Brigade Guard',
    'Menno Coehoorn',
    'Morteisen',
    'Puttkammer',
    'Rainfarn',
    'Rotten Mangonel',
    'Siege Technician',
    'Stefan Skellen',
    'Tibor Eggebracht',
    'Vanhemar',
  ]

  await new ApiClient({}).addUser({
    name: username,
    password,
  })
  const faction = await new ApiClient({ username, password }).getFaction({
    key: factionKey,
  })
  const leader = await new ApiClient({ username, password }).getLeader({
    faction: factionKey,
    name: leaderName,
  })
  await LoginPage.login({
    username,
    password,
  })
  await DeckPage.verify({})
  await DeckEditor.verifyValid(false)

  // name only
  await DeckEditor.setName(name)
  await DeckEditor.verifyValid(false)

  // name and faction
  await DeckEditor.setFaction({
    faction,
  })
  await DeckEditor.verifyValid(false)

  // name, faction, leader
  await DeckEditor.setLeader({
    leader,
  })
  await DeckEditor.verifyValid(false)

  // invalid units
  await DeckEditor.setUnits(units)
  await DeckEditor.verifyValid(false)

  // valid everything
  await DeckEditor.addUnits(['Vattier de Rideaux', 'Young Emissary', 'Young Emissary', 'Zerrikanian Fire Scorpion'])
  await DeckEditor.verifyValid(true)

  // invalid name
  await DeckEditor.setName('')
  await DeckEditor.verifyValid(false)
})

test('Change leader', async () => {
  const username = `deck-create-change-leader-${Date.now()}`
  const password = 'password'
  const name = 'Create deck change leader'
  const factionKey = FactionKey.Skellige
  const leaderName1 = 'King Bran'
  const leaderName2 = 'Crach an Craite'
  const units = [
    'Berserker',
    'Birna Bran',
    'Biting Frost',
    'Blueboy Lugos',
    'Cerys',
    'Clan an Craite Warrior',
    'Clan an Craite Warrior',
    'Clan Brokvar Archer',
    'Clan Dimun Pirate',
    'Clan Drummond Shield Maiden',
    'Clan Tordarroch Armorsmith',
    'Cow',
    'Donar an Hindar',
    'Draig Bon-Dhu',
    'Ermion',
    'Hjalmar',
    'Holger Blackhand',
    'Kambi',
    'Light Longship',
    'Madman Lugos',
    'Mardroeme',
    'Olaf',
  ]

  await new ApiClient({}).addUser({
    name: username,
    password,
  })
  const faction = await new ApiClient({ username, password }).getFaction({
    key: factionKey,
  })
  const leader1 = await new ApiClient({ username, password }).getLeader({
    faction: factionKey,
    name: leaderName1,
  })
  const leader2 = await new ApiClient({ username, password }).getLeader({
    faction: factionKey,
    name: leaderName2,
  })
  await LoginPage.login({
    username,
    password,
  })

  await DeckEditor.setName(name)
  await DeckEditor.setFaction({
    faction,
  })
  await DeckEditor.setLeader({
    leader: leader1,
  })
  await DeckEditor.setUnits(units)
  await DeckEditor.verifyValid(true)

  await DeckEditor.setLeader({
    leader: leader2,
  })
  await DeckEditor.verifyValid(true)
  await DeckEditor.save()
  await E2eUtil.verifyCurrentUrl(DecksPage.getUrl())
})

test('Change faction', async () => {
  const username = `deck-create-change-faction-${Date.now()}`
  const password = 'password'
  const name = 'Create deck change faction'
  const factionKey1 = FactionKey.Monsters
  const factionKey2 = FactionKey.NorthernRealms
  const leaderName1 = 'Eredin Breacc Glas the Treacherous'
  const leaderName2 = 'Foltest the Siegemaster'
  const units1 = [
    'Arachas',
    'Arachas',
    'Arachas',
    'Arachas Behemoth',
    'Botchling',
    'Celaeno Harpy',
    'Clear Weather',
    'Cockatrice',
    'Crone Brewess',
    'Crone Weavess',
    'Crone Whispess',
    'Draug',
    'Earth Elemental',
    'Fiend',
    'Fire Elemental',
    'Gargoyle',
    'Griffin',
    'Imlerith',
    'Leshen',
    'Vampire: Bruxa',
    'Vampire: Ekimmara',
    'Vampire: Fleder',
    'Vampire: Garkain',
    'Vampire: Katakan',
  ]
  const units2 = [
    'Ballista',
    'Blue Stripes Commando',
    'Catapult',
    'Crinfrid Reavers Dragon Hunter',
    'Dethmold',
    'Dun Banner Medic',
    'Emiel Regis Rohellec Terzieff',
    'Esterad Thyssen',
    'John Natalis',
    'Kaedweni Siege Expert',
    'Poor Fucking Infantry',
    'Prince Stennis',
    'Redanian Foot Soldier',
    'Sabrina Glevissig',
    'Sheldon Skaggs',
    'Siege Tower',
    'Siegfried of Denesle',
    'Sigismund Dijkstra',
    'Sile de Tansarville',
    'Thaler',
    'Vernon Roche',
  ]

  await new ApiClient({}).addUser({
    name: username,
    password,
  })
  const faction1 = await new ApiClient({ username, password }).getFaction({
    key: factionKey1,
  })
  const faction2 = await new ApiClient({ username, password }).getFaction({
    key: factionKey2,
  })
  const leader1 = await new ApiClient({ username, password }).getLeader({
    faction: factionKey1,
    name: leaderName1,
  })
  const leader2 = await new ApiClient({ username, password }).getLeader({
    faction: factionKey2,
    name: leaderName2,
  })
  await LoginPage.login({
    username,
    password,
  })

  await DeckEditor.setName(name)
  await DeckEditor.setFaction({
    faction: faction1,
  })
  await DeckEditor.setLeader({
    leader: leader1,
  })
  await DeckEditor.setUnits(units1)
  await DeckEditor.verifyValid(true)

  await DeckEditor.setFaction({
    faction: faction2,
  })
  await DeckEditor.setLeader({
    leader: leader2,
  })
  await DeckEditor.setUnits(units2)
  await DeckEditor.verifyValid(true)
  await DeckEditor.save()
  await E2eUtil.verifyCurrentUrl(DecksPage.getUrl())
})

test('Create deck with Select All button', async () => {
  const username = `deck-create-select-all-${Date.now()}`
  const name = 'Create deck select all'
  const factionKey = FactionKey.NorthernRealms
  const leaderName = 'Foltest Son of Medell'

  await new ApiClient({}).addUser({
    name: username,
  })
  const client = new ApiClient({ username })
  const faction = await client.getFaction({
    key: factionKey,
  })
  const leader = await client.getLeader({
    faction: factionKey,
    name: leaderName,
  })
  const units = sortObjectArray({
    array: await client.getUnits({
      deckable: true,
      factions: [factionKey, FactionKey.Neutral],
    }),
    sortProperties: [SORT_FIELD.Name, SORT_FIELD.Id],
  })
  await LoginPage.login({
    username,
  })
  await DeckEditor.setName(name)
  await DeckEditor.setFaction({
    faction: faction,
  })
  await DeckEditor.setLeader({
    leader,
  })
  await DeckEditor.filterOnMainStat(DeckEditor.elements.UnitStatStrength)
  await DeckEditor.selectAll()
  await DeckEditor.filterOnMainStat(DeckEditor.elements.UnitStatUnit)

  await DeckPage.verify({
    name,
    faction,
    leader,
    availableUnits: units
      .filter((unit) => unit.strength === undefined || unit.strength === null)
      .map((unit) => unit.name),
    selectedUnits: units
      .filter((unit) => unit.strength !== undefined && unit.strength !== null)
      .map((unit) => unit.name),
  })

  await DeckEditor.verifyValid(true)
  await DeckEditor.save()
  await E2eUtil.verifyCurrentUrl(DecksPage.getUrl())
})

test('Cannot create deck with existing name', async () => {
  const username = `deck-create-existing-name-${Date.now()}`
  const name = 'Create deck select all'
  const factionKey = FactionKey.NorthernRealms
  const leaderName = 'Foltest Son of Medell'

  await new ApiClient({}).addUser({
    name: username,
  })
  const client = new ApiClient({ username })
  const faction = await client.getFaction({
    key: factionKey,
  })
  const leader = await client.getLeader({
    faction: factionKey,
    name: leaderName,
  })
  const units = sortObjectArray({
    array: await client.getUnits({
      deckable: true,
      factions: [factionKey, FactionKey.Neutral],
    }),
    sortProperties: [SORT_FIELD.Name, SORT_FIELD.Id],
  })
  const unitNames = units
    .filter((unit) => unit.strength !== undefined && unit.strength !== null)
    .map((unit) => unit.name)
  await client.addDeck({
    faction: factionKey,
    leaderName,
    name,
    unitNames,
  })
  await LoginPage.login({
    username,
  })

  await DeckPage.createDeck({
    faction,
    name,
    leader,
    units: unitNames,
    pickers: true,
    verify: false,
  })

  await E2eUtil.verifyCurrentUrl(DeckPage.getUrl())
  await DeckEditor.verifyCreateError(`Error creating deck: Deck with name "${name}" already exists.`)
})

test('Cancel brings user to decks list', async () => {
  const username = `deck-create-cancel-${Date.now()}`
  await new ApiClient({}).addUser({
    name: username,
  })
  await LoginPage.login({
    username,
  })
  await DeckPage.verify({})

  await DeckEditor.cancel()

  await DecksPage.verify({
    decks: [],
  })
})
