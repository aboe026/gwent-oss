import ApiClient from '../util/api-client'
import DeckPage from '../page-objects/deck-page'
import { Combat, DlcKey, EffectKey, FactionKey, Unit } from '@gwent/graphql-schema/resolver-typings'
import LoginPage from '../page-objects/login-page'
import { sortObjectArray } from '@gwent/utils'
import { SORT_FIELD } from '@gwent/graphql-schema/deck-filter'

fixture('Deck Units Filter').page(DeckPage.getUrl())

test('Available filters specials when locked', async () => {
  const username = `deck-available-filter-specials-locked-${Date.now()}`
  await new ApiClient({}).addUser({
    name: username,
  })
  const client = new ApiClient({ username })
  const faction = await client.getFaction({
    key: FactionKey.NorthernRealms,
  })
  await LoginPage.login({
    username,
  })
  await DeckPage.setFaction({
    faction,
  })
  const units = await client.getUnits({
    deckable: true,
    factions: [FactionKey.NorthernRealms, FactionKey.Neutral],
  })
  const sortedUnits = sortObjectArray({
    sortProperties: [SORT_FIELD.Name, SORT_FIELD.Id],
    array: units,
  })
  const halfway = Math.ceil(sortedUnits.length / 2)
  const sortedAvailableUnits = sortedUnits.slice(0, halfway)
  const sortedSelectedUnits = sortedUnits.slice(halfway, sortedUnits.length)
  await DeckPage.setUnits(sortedSelectedUnits.map((unit) => unit.name))
  await DeckPage.filterOnMainStat(DeckPage.elements.UnitStatSpecial)

  await DeckPage.verifyAvailableUnits(sortedAvailableUnits.filter((unit) => unit.special).map((unit) => unit.name))
  await DeckPage.verifySelectedUnits(sortedSelectedUnits.filter((unit) => unit.special).map((unit) => unit.name))

  await DeckPage.filterOnMainStat(DeckPage.elements.UnitStatUnit)
  await DeckPage.verifyAvailableUnits(sortedAvailableUnits.map((unit) => unit.name))
  await DeckPage.verifySelectedUnits(sortedSelectedUnits.map((unit) => unit.name))
})

test('Available filters heroes when locked', async () => {
  const username = `deck-available-filter-heroes-locked-${Date.now()}`
  await new ApiClient({}).addUser({
    name: username,
  })
  const client = new ApiClient({ username })
  const faction = await client.getFaction({
    key: FactionKey.NorthernRealms,
  })
  await LoginPage.login({
    username,
  })
  await DeckPage.setFaction({
    faction,
  })
  const units = await client.getUnits({
    deckable: true,
    factions: [FactionKey.NorthernRealms, FactionKey.Neutral],
  })
  const sortedUnits = sortObjectArray({
    sortProperties: [SORT_FIELD.Name, SORT_FIELD.Id],
    array: units,
  })
  const halfway = Math.ceil(sortedUnits.length / 2)
  const sortedAvailableUnits = sortedUnits.slice(0, halfway)
  const sortedSelectedUnits = sortedUnits.slice(halfway, sortedUnits.length)
  await DeckPage.setUnits(sortedSelectedUnits.map((unit) => unit.name))
  await DeckPage.filterOnMainStat(DeckPage.elements.UnitStatHero)

  await DeckPage.verifyAvailableUnits(sortedAvailableUnits.filter((unit) => unit.hero).map((unit) => unit.name))
  await DeckPage.verifySelectedUnits(sortedSelectedUnits.filter((unit) => unit.hero).map((unit) => unit.name))

  await DeckPage.filterOnMainStat(DeckPage.elements.UnitStatUnit)
  await DeckPage.verifyAvailableUnits(sortedAvailableUnits.map((unit) => unit.name))
  await DeckPage.verifySelectedUnits(sortedSelectedUnits.map((unit) => unit.name))
})

test('Available filters strength when locked', async () => {
  const username = `deck-available-filter-strength-locked-${Date.now()}`
  await new ApiClient({}).addUser({
    name: username,
  })
  const client = new ApiClient({ username })
  const faction = await client.getFaction({
    key: FactionKey.NorthernRealms,
  })
  await LoginPage.login({
    username,
  })
  await DeckPage.setFaction({
    faction,
  })
  const units = await client.getUnits({
    deckable: true,
    factions: [FactionKey.NorthernRealms, FactionKey.Neutral],
  })
  const sortedUnits = sortObjectArray({
    sortProperties: [SORT_FIELD.Name, SORT_FIELD.Id],
    array: units,
  })
  const halfway = Math.ceil(sortedUnits.length / 2)
  const sortedAvailableUnits = sortedUnits.slice(0, halfway)
  const sortedSelectedUnits = sortedUnits.slice(halfway, sortedUnits.length)
  await DeckPage.setUnits(sortedSelectedUnits.map((unit) => unit.name))
  await DeckPage.filterOnMainStat(DeckPage.elements.UnitStatStrength)

  await DeckPage.verifyAvailableUnits(
    sortedAvailableUnits
      .filter((unit) => unit.strength !== undefined && unit.strength !== null)
      .map((unit) => unit.name)
  )
  await DeckPage.verifySelectedUnits(
    sortedSelectedUnits.filter((unit) => unit.strength !== undefined && unit.strength !== null).map((unit) => unit.name)
  )

  await DeckPage.filterOnMainStat(DeckPage.elements.UnitStatUnit)
  await DeckPage.verifyAvailableUnits(sortedAvailableUnits.map((unit) => unit.name))
  await DeckPage.verifySelectedUnits(sortedSelectedUnits.map((unit) => unit.name))
})

test('Available filters close when locked', async () => {
  const username = `deck-available-filter-close-locked-${Date.now()}`
  await new ApiClient({}).addUser({
    name: username,
  })
  const client = new ApiClient({ username })
  const faction = await client.getFaction({
    key: FactionKey.NorthernRealms,
  })
  await LoginPage.login({
    username,
  })
  await DeckPage.setFaction({
    faction,
  })
  const units = await client.getUnits({
    deckable: true,
    factions: [FactionKey.NorthernRealms, FactionKey.Neutral],
  })
  const sortedUnits = sortObjectArray({
    sortProperties: [SORT_FIELD.Name, SORT_FIELD.Id],
    array: units,
  })
  const halfway = Math.ceil(sortedUnits.length / 2)
  const sortedAvailableUnits = sortedUnits.slice(0, halfway)
  const sortedSelectedUnits = sortedUnits.slice(halfway, sortedUnits.length)
  await DeckPage.setUnits(sortedSelectedUnits.map((unit) => unit.name))
  await DeckPage.toggleCombatsExpanded()
  await DeckPage.filterOnAdvancedStat(Combat.Close)

  await DeckPage.verifyAvailableUnits(
    sortedAvailableUnits
      .filter((unit) => unit.combats?.includes(Combat.Close) && !unit.special)
      .map((unit) => unit.name)
  )
  await DeckPage.verifySelectedUnits(
    sortedSelectedUnits.filter((unit) => unit.combats?.includes(Combat.Close) && !unit.special).map((unit) => unit.name)
  )

  await DeckPage.filterOnMainStat(DeckPage.elements.UnitStatUnit)
  await DeckPage.verifyAvailableUnits(sortedAvailableUnits.map((unit) => unit.name))
  await DeckPage.verifySelectedUnits(sortedSelectedUnits.map((unit) => unit.name))
})

test('Available filters ranged when locked', async () => {
  const username = `deck-available-filter-ranged-locked-${Date.now()}`
  await new ApiClient({}).addUser({
    name: username,
  })
  const client = new ApiClient({ username })
  const faction = await client.getFaction({
    key: FactionKey.NorthernRealms,
  })
  await LoginPage.login({
    username,
  })
  await DeckPage.setFaction({
    faction,
  })
  const units = await client.getUnits({
    deckable: true,
    factions: [FactionKey.NorthernRealms, FactionKey.Neutral],
  })
  const sortedUnits = sortObjectArray({
    sortProperties: [SORT_FIELD.Name, SORT_FIELD.Id],
    array: units,
  })
  const halfway = Math.ceil(sortedUnits.length / 2)
  const sortedAvailableUnits = sortedUnits.slice(0, halfway)
  const sortedSelectedUnits = sortedUnits.slice(halfway, sortedUnits.length)
  await DeckPage.setUnits(sortedSelectedUnits.map((unit) => unit.name))
  await DeckPage.toggleCombatsExpanded()
  await DeckPage.filterOnAdvancedStat(Combat.Ranged)

  await DeckPage.verifyAvailableUnits(
    sortedAvailableUnits
      .filter((unit) => unit.combats?.includes(Combat.Ranged) && !unit.special)
      .map((unit) => unit.name)
  )
  await DeckPage.verifySelectedUnits(
    sortedSelectedUnits
      .filter((unit) => unit.combats?.includes(Combat.Ranged) && !unit.special)
      .map((unit) => unit.name)
  )

  await DeckPage.filterOnMainStat(DeckPage.elements.UnitStatUnit)
  await DeckPage.verifyAvailableUnits(sortedAvailableUnits.map((unit) => unit.name))
  await DeckPage.verifySelectedUnits(sortedSelectedUnits.map((unit) => unit.name))
})

test('Available filters siege when locked', async () => {
  const username = `deck-available-filter-siege-locked-${Date.now()}`
  await new ApiClient({}).addUser({
    name: username,
  })
  const client = new ApiClient({ username })
  const faction = await client.getFaction({
    key: FactionKey.NorthernRealms,
  })
  await LoginPage.login({
    username,
  })
  await DeckPage.setFaction({
    faction,
  })
  const units = await client.getUnits({
    deckable: true,
    factions: [FactionKey.NorthernRealms, FactionKey.Neutral],
  })
  const sortedUnits = sortObjectArray({
    sortProperties: [SORT_FIELD.Name, SORT_FIELD.Id],
    array: units,
  })
  const halfway = Math.ceil(sortedUnits.length / 2)
  const sortedAvailableUnits = sortedUnits.slice(0, halfway)
  const sortedSelectedUnits = sortedUnits.slice(halfway, sortedUnits.length)
  await DeckPage.setUnits(sortedSelectedUnits.map((unit) => unit.name))
  await DeckPage.toggleCombatsExpanded()
  await DeckPage.filterOnAdvancedStat(Combat.Siege)

  await DeckPage.verifyAvailableUnits(
    sortedAvailableUnits
      .filter((unit) => unit.combats?.includes(Combat.Siege) && !unit.special)
      .map((unit) => unit.name)
  )
  await DeckPage.verifySelectedUnits(
    sortedSelectedUnits.filter((unit) => unit.combats?.includes(Combat.Siege) && !unit.special).map((unit) => unit.name)
  )

  await DeckPage.filterOnMainStat(DeckPage.elements.UnitStatUnit)
  await DeckPage.verifyAvailableUnits(sortedAvailableUnits.map((unit) => unit.name))
  await DeckPage.verifySelectedUnits(sortedSelectedUnits.map((unit) => unit.name))
})

test('Available filters agile when locked', async () => {
  const username = `deck-available-filter-agile-locked-${Date.now()}`
  const factionKey = FactionKey.Skellige
  await new ApiClient({}).addUser({
    name: username,
  })
  const client = new ApiClient({ username })
  const faction = await client.getFaction({
    key: factionKey,
  })
  await LoginPage.login({
    username,
  })
  await DeckPage.setFaction({
    faction,
  })
  const units = await client.getUnits({
    deckable: true,
    factions: [factionKey, FactionKey.Neutral],
  })
  const sortedUnits = sortObjectArray({
    sortProperties: [SORT_FIELD.Name, SORT_FIELD.Id],
    array: units,
  })
  const halfway = Math.ceil(sortedUnits.length / 2)
  // force "Olaf" as available to test filter works on both available and selected
  const olaf = sortedUnits.find((unit) => unit.name === 'Olaf')
  if (!olaf) {
    throw Error('Could not find unit with name "Olaf"')
  }
  const sortedAvailableUnits = [...sortedUnits.slice(0, halfway), olaf]
  const sortedSelectedUnits = sortedUnits.slice(halfway, sortedUnits.length).filter((unit) => unit.name !== 'Olaf')
  await DeckPage.setUnits(sortedSelectedUnits.map((unit) => unit.name))
  await DeckPage.toggleCombatsExpanded()
  await DeckPage.filterOnAdvancedStat(EffectKey.Agile)

  await DeckPage.verifyAvailableUnits(
    sortedAvailableUnits
      .filter((unit) => unit.effects?.map((effect) => effect.key)?.includes(EffectKey.Agile))
      .map((unit) => unit.name)
  )
  await DeckPage.verifySelectedUnits(
    sortedSelectedUnits
      .filter((unit) => unit.effects?.map((effect) => effect.key)?.includes(EffectKey.Agile))
      .map((unit) => unit.name)
  )

  await DeckPage.filterOnMainStat(DeckPage.elements.UnitStatUnit)
  await DeckPage.verifyAvailableUnits(sortedAvailableUnits.map((unit) => unit.name))
  await DeckPage.verifySelectedUnits(sortedSelectedUnits.map((unit) => unit.name))
})

test('Available filters avenger when locked', async () => {
  await testEffectFilter({
    effectKey: EffectKey.Avenger,
    available: ['Cow'],
    selected: ['Kambi'],
  })
})

test('Available filters berserker when locked', async () => {
  await testEffectFilter({
    effectKey: EffectKey.Berserker,
    available: ['Berserker'],
    selected: ['Young Berserker', 'Young Berserker', 'Young Berserker'],
  })
})

test('Available filters bond when locked', async () => {
  await testEffectFilter({
    effectKey: EffectKey.Bond,
    available: [
      'Clan an Craite Warrior',
      'Clan an Craite Warrior',
      'Clan an Craite Warrior',
      'Clan Drummond Shield Maiden',
      'Clan Drummond Shield Maiden',
      'Clan Drummond Shield Maiden',
    ],
    selected: ['War Longship', 'War Longship', 'War Longship'],
  })
})

test('Available filters decoy when locked', async () => {
  await testEffectFilter({
    effectKey: EffectKey.Decoy,
    available: ['Decoy', 'Decoy'],
    selected: ['Decoy'],
  })
})

test('Available filters horn when locked', async () => {
  await testEffectFilter({
    effectKey: EffectKey.Horn,
    available: ["Commander's Horn", "Commander's Horn", "Commander's Horn", 'Dandelion'],
    selected: ['Draig Bon-Dhu'],
  })
})

test('Available filters mardroeme when locked', async () => {
  await testEffectFilter({
    effectKey: EffectKey.Mardroeme,
    available: ['Ermion', 'Mardroeme'],
    selected: ['Mardroeme', 'Mardroeme'],
  })
})

test('Available filters medic when locked', async () => {
  await testEffectFilter({
    effectKey: EffectKey.Medic,
    available: ['Birna Bran'],
    selected: ['Yennefer of Vengerberg'],
  })
})

test('Available filters morale when locked', async () => {
  await testEffectFilter({
    effectKey: EffectKey.Morale,
    available: ['Olaf'],
    selected: ['Olgierd Von Everec'],
  })
})

test('Available filters muster when locked', async () => {
  await testEffectFilter({
    effectKey: EffectKey.Muster,
    available: [
      'Cerys',
      'Cirilla Fiona Elen Riannon',
      "Gaunter O'Dimm",
      "Gaunter O'Dimm Darkness",
      "Gaunter O'Dimm Darkness",
      "Gaunter O'Dimm Darkness",
    ],
    selected: ['Geralt of Rivia', 'Light Longship', 'Light Longship', 'Light Longship'],
  })
})

test('Available filters scorch when locked', async () => {
  await testEffectFilter({
    effectKey: EffectKey.Scorch,
    available: ['Clan Dimun Pirate', 'Scorch', 'Scorch', 'Scorch'],
    selected: ['Villentretenmerth'],
  })
})

test('Available filters spy when locked', async () => {
  await testEffectFilter({
    factionKey: FactionKey.NilfgaardianEmpire,
    effectKey: EffectKey.Spy,
    available: ['Mysterious Elf', 'Shilard Fitz-Oesterlen', 'Stefan Skellen'],
    selected: ['Vattier de Rideaux'],
  })
})

test('Available filters weather when locked', async () => {
  await testEffectFilter({
    effectKey: EffectKey.Weather,
    available: [
      'Biting Frost',
      'Biting Frost',
      'Clear Weather',
      'Clear Weather',
      'Impenetrable Fog',
      'Impenetrable Fog',
      'Impenetrable Fog',
      'Skellige Storm',
      'Skellige Storm',
      'Skellige Storm',
    ],
    selected: ['Torrential Rain', 'Torrential Rain'],
  })
})

test('Selected filters effects separate from available when unlocked', async () => {
  const username = `deck-selected-filter-effect-unlocked-${Date.now()}`
  await new ApiClient({}).addUser({
    name: username,
  })
  const client = new ApiClient({ username })
  const faction = await client.getFaction({
    key: FactionKey.NorthernRealms,
  })
  await LoginPage.login({
    username,
  })
  await DeckPage.setFaction({
    faction,
  })
  const units = await client.getUnits({
    deckable: true,
    factions: [FactionKey.NorthernRealms, FactionKey.Neutral],
  })
  const sortedUnits = sortObjectArray({
    sortProperties: [SORT_FIELD.Name, SORT_FIELD.Id],
    array: units,
  })
  const halfway = Math.ceil(sortedUnits.length / 2)
  const sortedAvailableUnits = sortedUnits.slice(0, halfway)
  const sortedSelectedUnits = sortedUnits.slice(halfway, sortedUnits.length)
  await DeckPage.setUnits(sortedSelectedUnits.map((unit) => unit.name))
  await DeckPage.toggleUnitsLock()
  await DeckPage.toggleAvailableFiltersExpanded()
  await DeckPage.toggleAdvancedFilter('filterAvailableMEDIC')
  await DeckPage.toggleSelectedFiltersExpanded()
  await DeckPage.toggleAdvancedFilter('filterSelectedMORALE')

  await DeckPage.verifyAvailableUnits(['Dun Banner Medic'])
  await DeckPage.verifySelectedUnits(['Olgierd Von Everec'])

  await DeckPage.filterOnMainStat(DeckPage.elements.UnitStatUnit)

  await DeckPage.verifyAvailableUnits(sortedAvailableUnits.map((unit) => unit.name))
  await DeckPage.verifySelectedUnits(sortedSelectedUnits.map((unit) => unit.name))
})

test('Available filters faction when locked', async () => {
  const username = `deck-available-filter-faction-locked-${Date.now()}`
  const factionKey = FactionKey.NorthernRealms
  await new ApiClient({}).addUser({
    name: username,
  })
  const client = new ApiClient({ username })
  const faction = await client.getFaction({
    key: factionKey,
  })
  await LoginPage.login({
    username,
  })
  await DeckPage.setFaction({
    faction,
  })
  const units = await client.getUnits({
    deckable: true,
    factions: [factionKey, FactionKey.Neutral],
  })
  const sortedUnits = sortObjectArray({
    sortProperties: [SORT_FIELD.Name, SORT_FIELD.Id],
    array: units,
  })
  const halfway = Math.ceil(sortedUnits.length / 2)
  const sortedAvailableUnits = sortedUnits.slice(0, halfway)
  const sortedSelectedUnits = sortedUnits.slice(halfway, sortedUnits.length)
  await DeckPage.setUnits(sortedSelectedUnits.map((unit) => unit.name))
  await DeckPage.toggleAvailableFiltersExpanded()
  await DeckPage.toggleAdvancedFilter('filterAvailablefaction')

  await DeckPage.verifyAvailableUnits(
    sortedAvailableUnits.filter((unit) => unit.faction.key === factionKey).map((unit) => unit.name)
  )
  await DeckPage.verifySelectedUnits(
    sortedSelectedUnits.filter((unit) => unit.faction.key === factionKey).map((unit) => unit.name)
  )

  await DeckPage.filterOnMainStat(DeckPage.elements.UnitStatUnit)

  await DeckPage.verifyAvailableUnits(sortedAvailableUnits.map((unit) => unit.name))
  await DeckPage.verifySelectedUnits(sortedSelectedUnits.map((unit) => unit.name))
})

test('Selected filters faction separately when unlocked', async () => {
  const username = `deck-selected-filter-faction-unlocked-${Date.now()}`
  const factionKey = FactionKey.NorthernRealms
  await new ApiClient({}).addUser({
    name: username,
  })
  const client = new ApiClient({ username })
  const faction = await client.getFaction({
    key: factionKey,
  })
  await LoginPage.login({
    username,
  })
  await DeckPage.setFaction({
    faction,
  })
  const units = await client.getUnits({
    deckable: true,
    factions: [factionKey, FactionKey.Neutral],
  })
  const sortedUnits = sortObjectArray({
    sortProperties: [SORT_FIELD.Name, SORT_FIELD.Id],
    array: units,
  })
  const halfway = Math.ceil(sortedUnits.length / 2)
  const sortedAvailableUnits = sortedUnits.slice(0, halfway)
  const sortedSelectedUnits = sortedUnits.slice(halfway, sortedUnits.length)
  await DeckPage.setUnits(sortedSelectedUnits.map((unit) => unit.name))
  await DeckPage.toggleUnitsLock()
  await DeckPage.toggleAvailableFiltersExpanded()
  await DeckPage.toggleSelectedFiltersExpanded()
  await DeckPage.toggleAdvancedFilter('filterAvailablefaction')
  await DeckPage.toggleAdvancedFilter('filterSelectedNEUTRAL')

  await DeckPage.verifyAvailableUnits(
    sortedAvailableUnits.filter((unit) => unit.faction.key === factionKey).map((unit) => unit.name)
  )
  await DeckPage.verifySelectedUnits(
    sortedSelectedUnits.filter((unit) => unit.faction.key === FactionKey.Neutral).map((unit) => unit.name)
  )

  await DeckPage.filterOnMainStat(DeckPage.elements.UnitStatUnit)

  await DeckPage.verifyAvailableUnits(sortedAvailableUnits.map((unit) => unit.name))
  await DeckPage.verifySelectedUnits(sortedSelectedUnits.map((unit) => unit.name))
})

test('Available filters DLC when locked', async () => {
  const username = `deck-available-filter-dlc-locked-${Date.now()}`
  const factionKey = FactionKey.NorthernRealms
  await new ApiClient({}).addUser({
    name: username,
  })
  const client = new ApiClient({ username })
  const faction = await client.getFaction({
    key: factionKey,
  })
  await LoginPage.login({
    username,
  })
  await DeckPage.setFaction({
    faction,
  })
  const units = await client.getUnits({
    deckable: true,
    factions: [factionKey, FactionKey.Neutral],
  })
  const sortedUnits = sortObjectArray({
    sortProperties: [SORT_FIELD.Name, SORT_FIELD.Id],
    array: units,
  })
  const halfway = Math.ceil(sortedUnits.length / 2)
  const sortedAvailableUnits = sortedUnits.slice(0, halfway)
  const sortedSelectedUnits = sortedUnits.slice(halfway, sortedUnits.length)
  await DeckPage.setUnits(sortedSelectedUnits.map((unit) => unit.name))
  await DeckPage.toggleAvailableFiltersExpanded()
  await DeckPage.toggleAdvancedFilter('filterAvailableHEARTS_OF_STONE')

  await DeckPage.verifyAvailableUnits(
    sortedAvailableUnits.filter((unit) => unit.dlc?.key === DlcKey.HeartsOfStone).map((unit) => unit.name)
  )
  await DeckPage.verifySelectedUnits(
    sortedSelectedUnits.filter((unit) => unit.dlc?.key === DlcKey.HeartsOfStone).map((unit) => unit.name)
  )

  await DeckPage.filterOnMainStat(DeckPage.elements.UnitStatUnit)

  await DeckPage.verifyAvailableUnits(sortedAvailableUnits.map((unit) => unit.name))
  await DeckPage.verifySelectedUnits(sortedSelectedUnits.map((unit) => unit.name))
})

test('Selected filters DLC separately when unlocked', async () => {
  const username = `deck-selected-filter-dlc-unlocked-${Date.now()}`
  const factionKey = FactionKey.Skellige
  await new ApiClient({}).addUser({
    name: username,
  })
  const client = new ApiClient({ username })
  const faction = await client.getFaction({
    key: factionKey,
  })
  await LoginPage.login({
    username,
  })
  await DeckPage.setFaction({
    faction,
  })
  const units = await client.getUnits({
    deckable: true,
    factions: [factionKey, FactionKey.Neutral],
  })
  const sortedUnits = sortObjectArray({
    sortProperties: [SORT_FIELD.Name, SORT_FIELD.Id],
    array: units,
  })
  const halfway = Math.ceil(sortedUnits.length / 2)
  const sortedAvailableUnits = sortedUnits.slice(0, halfway)
  const sortedSelectedUnits = sortedUnits.slice(halfway, sortedUnits.length)
  await DeckPage.setUnits(sortedSelectedUnits.map((unit) => unit.name))
  await DeckPage.toggleUnitsLock()
  await DeckPage.toggleAvailableFiltersExpanded()
  await DeckPage.toggleSelectedFiltersExpanded()
  await DeckPage.toggleAdvancedFilter('filterAvailableBLOOD_AND_WINE')
  await DeckPage.toggleAdvancedFilter('filterSelectedGWENT_THE_WITCHER_CARD_GAME')

  await DeckPage.verifyAvailableUnits(
    sortedAvailableUnits.filter((unit) => unit.dlc?.key === DlcKey.BloodAndWine).map((unit) => unit.name)
  )
  await DeckPage.verifySelectedUnits(
    sortedSelectedUnits.filter((unit) => unit.dlc?.key === DlcKey.GwentTheWitcherCardGame).map((unit) => unit.name)
  )

  await DeckPage.filterOnMainStat(DeckPage.elements.UnitStatUnit)

  await DeckPage.verifyAvailableUnits(sortedAvailableUnits.map((unit) => unit.name))
  await DeckPage.verifySelectedUnits(sortedSelectedUnits.map((unit) => unit.name))
})

test('Available filters Alternate Art when locked', async () => {
  const username = `deck-available-filter-alt-art-locked-${Date.now()}`
  const factionKey = FactionKey.NorthernRealms
  await new ApiClient({}).addUser({
    name: username,
  })
  const client = new ApiClient({ username })
  const faction = await client.getFaction({
    key: factionKey,
  })
  await LoginPage.login({
    username,
  })
  await DeckPage.setFaction({
    faction,
  })
  const units = await client.getUnits({
    deckable: true,
    factions: [factionKey, FactionKey.Neutral],
  })
  const sortedUnits = sortObjectArray({
    sortProperties: [SORT_FIELD.Name, SORT_FIELD.Id],
    array: units,
  })
  const halfway = Math.ceil(sortedUnits.length / 2)
  const sortedAvailableUnits = sortedUnits.slice(0, halfway)
  const sortedSelectedUnits = sortedUnits.slice(halfway, sortedUnits.length)
  await DeckPage.setUnits(sortedSelectedUnits.map((unit) => unit.name))
  await DeckPage.toggleAvailableFiltersExpanded()
  await DeckPage.toggleAdvancedFilter('filterAvailableart')

  await DeckPage.verifyAvailableUnits(
    sortedAvailableUnits.filter((unit) => unit.images.length > 1).map((unit) => unit.name)
  )
  await DeckPage.verifySelectedUnits(
    sortedSelectedUnits.filter((unit) => unit.images.length > 1).map((unit) => unit.name)
  )

  await DeckPage.filterOnMainStat(DeckPage.elements.UnitStatUnit)

  await DeckPage.verifyAvailableUnits(sortedAvailableUnits.map((unit) => unit.name))
  await DeckPage.verifySelectedUnits(sortedSelectedUnits.map((unit) => unit.name))
})

test('Available filters name when locked', async () => {
  const username = `deck-available-filter-name-locked-${Date.now()}`
  const factionKey = FactionKey.NorthernRealms
  await new ApiClient({}).addUser({
    name: username,
  })
  const client = new ApiClient({ username })
  const faction = await client.getFaction({
    key: factionKey,
  })
  await LoginPage.login({
    username,
  })
  await DeckPage.setFaction({
    faction,
  })
  const units = await client.getUnits({
    deckable: true,
    factions: [factionKey, FactionKey.Neutral],
  })
  const sortedUnits = sortObjectArray({
    sortProperties: [SORT_FIELD.Name, SORT_FIELD.Id],
    array: units,
  })
  const halfway = Math.ceil(sortedUnits.length / 2)
  const sortedAvailableUnits = sortedUnits.slice(0, halfway)
  const sortedSelectedUnits = sortedUnits.slice(halfway, sortedUnits.length)
  await DeckPage.setUnits(sortedSelectedUnits.map((unit) => unit.name))
  await DeckPage.filterByName({
    name: 'siege',
  })

  await DeckPage.verifyAvailableUnits(['Kaedweni Siege Expert'])
  await DeckPage.verifySelectedUnits(['Siege Tower'])

  await DeckPage.filterByName({
    name: '',
  })

  await DeckPage.verifyAvailableUnits(sortedAvailableUnits.map((unit) => unit.name))
  await DeckPage.verifySelectedUnits(sortedSelectedUnits.map((unit) => unit.name))
})

test('Selected filters separately on name when unlocked', async () => {
  const username = `deck-selected-filter-name-unlocked-${Date.now()}`
  const factionKey = FactionKey.NorthernRealms
  await new ApiClient({}).addUser({
    name: username,
  })
  const client = new ApiClient({ username })
  const faction = await client.getFaction({
    key: factionKey,
  })
  await LoginPage.login({
    username,
  })
  await DeckPage.setFaction({
    faction,
  })
  const units = await client.getUnits({
    deckable: true,
    factions: [factionKey, FactionKey.Neutral],
  })
  const sortedUnits = sortObjectArray({
    sortProperties: [SORT_FIELD.Name, SORT_FIELD.Id],
    array: units,
  })
  const halfway = Math.ceil(sortedUnits.length / 2)
  const sortedAvailableUnits = sortedUnits.slice(0, halfway)
  const sortedSelectedUnits = sortedUnits.slice(halfway, sortedUnits.length)
  await DeckPage.setUnits(sortedSelectedUnits.map((unit) => unit.name))
  await DeckPage.toggleUnitsLock()
  await DeckPage.filterByName({
    name: 'geralt',
  })
  await DeckPage.filterByName({
    name: 'roach',
    available: false,
  })

  await DeckPage.verifyAvailableUnits(['Geralt of Rivia'])
  await DeckPage.verifySelectedUnits(['Roach'])

  await DeckPage.filterByName({
    name: '',
  })
  await DeckPage.filterByName({
    name: '',
    available: false,
  })

  await DeckPage.verifyAvailableUnits(sortedAvailableUnits.map((unit) => unit.name))
  await DeckPage.verifySelectedUnits(sortedSelectedUnits.map((unit) => unit.name))
})

async function testEffectFilter({
  factionKey = FactionKey.Skellige,
  effectKey,
  available,
  selected,
}: {
  factionKey?: FactionKey
  effectKey: EffectKey
  available: string[]
  selected: string[]
}) {
  const username = `deck-available-filter-${effectKey.toLowerCase()}-locked-${Date.now()}`
  await new ApiClient({}).addUser({
    name: username,
  })
  const client = new ApiClient({ username })
  const faction = await client.getFaction({
    key: factionKey,
  })
  await LoginPage.login({
    username,
  })
  await DeckPage.setFaction({
    faction,
  })
  const units = await client.getUnits({
    deckable: true,
    factions: [factionKey, FactionKey.Neutral],
  })
  const availableUnits: Unit[] = []
  const selectedUnits: Unit[] = []
  for (const name of available) {
    const index = units.findIndex((unit) => unit.name === name)
    if (index < 0) {
      throw Error(`Could not find unit with name "${name}" for available`)
    }
    availableUnits.push(units[index])
    units.splice(index, 1)
  }
  for (const name of selected) {
    const index = units.findIndex((unit) => unit.name === name)
    if (index < 0) {
      throw Error(`Could not find unit with name "${name}" for selected`)
    }
    selectedUnits.push(units[index])
    units.splice(index, 1)
  }
  const halfway = Math.ceil(units.length / 2)
  availableUnits.push(...units.slice(0, halfway))
  selectedUnits.push(...units.slice(halfway, units.length))
  const sortedAvailableUnits = sortObjectArray({
    sortProperties: [SORT_FIELD.Name, SORT_FIELD.Id],
    array: availableUnits,
  })
  const sortedSelectedUnits = sortObjectArray({
    sortProperties: [SORT_FIELD.Name, SORT_FIELD.Id],
    array: selectedUnits,
  })
  await DeckPage.setUnits(selectedUnits.map((unit) => unit.name))
  await DeckPage.toggleEffectsExpanded()
  await DeckPage.filterOnAdvancedStat(effectKey)

  const expectedAvailableUnits = sortedAvailableUnits
    .filter((unit) => unit.effects?.map((effect) => effect.key)?.includes(effectKey))
    .map((unit) => unit.name)
  if (expectedAvailableUnits.length < 1) {
    throw Error('Should have at least 1 available unit to ensure filter is actually working')
  }
  const expectedSelectedUnits = sortedSelectedUnits
    .filter((unit) => unit.effects?.map((effect) => effect.key)?.includes(effectKey))
    .map((unit) => unit.name)
  if (expectedSelectedUnits.length < 1) {
    throw Error('Should have at least 1 selected unit to ensure filter is actually working')
  }
  await DeckPage.verifyAvailableUnits(expectedAvailableUnits)
  await DeckPage.verifySelectedUnits(expectedSelectedUnits)

  await DeckPage.filterOnMainStat(DeckPage.elements.UnitStatUnit)
  await DeckPage.verifyAvailableUnits(sortedAvailableUnits.map((unit) => unit.name))
  await DeckPage.verifySelectedUnits(sortedSelectedUnits.map((unit) => unit.name))
}
