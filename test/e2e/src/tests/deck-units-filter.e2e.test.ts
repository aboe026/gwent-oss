import ApiClient from '../util/api-client'
import { Combat, DlcKey, EffectKey, FactionKey, Unit } from '@gwent/graphql-schema/resolver-typings'
import DeckEditor from '../components/deck-editor'
import DeckPage from '../page-objects/deck-page'
import { E2eCtx, getFixtureCtx, getTestCtx } from '../util/e2e-ctx'
import LoginPage from '../page-objects/login-page'
import { sortObjectArray } from '@gwent/utils'
import { SORT_FIELD } from '@gwent/graphql-schema/deck-filter'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Deck Units Filter').page(DeckPage.getUrl())

test('Available filters specials when locked', async (t) => {
  const username = `deck-available-filter-specials-locked-${t.ctx.start}`
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
  await DeckEditor.setFaction({
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
  await DeckEditor.setUnits(sortedSelectedUnits.map((unit) => unit.name))
  await DeckEditor.filterOnMainStat(DeckEditor.elements.UnitStatSpecial)

  await DeckEditor.verifyAvailableUnits(sortedAvailableUnits.filter((unit) => unit.special).map((unit) => unit.name))
  await DeckEditor.verifySelectedUnits(sortedSelectedUnits.filter((unit) => unit.special).map((unit) => unit.name))

  await DeckEditor.filterOnMainStat(DeckEditor.elements.UnitStatUnit)
  await DeckEditor.verifyAvailableUnits(sortedAvailableUnits.map((unit) => unit.name))
  await DeckEditor.verifySelectedUnits(sortedSelectedUnits.map((unit) => unit.name))
})

test('Available filters heroes when locked', async (t) => {
  const username = `deck-available-filter-heroes-locked-${t.ctx.start}`
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
  await DeckEditor.setFaction({
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
  await DeckEditor.setUnits(sortedSelectedUnits.map((unit) => unit.name))
  await DeckEditor.filterOnMainStat(DeckEditor.elements.UnitStatHero)

  await DeckEditor.verifyAvailableUnits(sortedAvailableUnits.filter((unit) => unit.hero).map((unit) => unit.name))
  await DeckEditor.verifySelectedUnits(sortedSelectedUnits.filter((unit) => unit.hero).map((unit) => unit.name))

  await DeckEditor.filterOnMainStat(DeckEditor.elements.UnitStatUnit)
  await DeckEditor.verifyAvailableUnits(sortedAvailableUnits.map((unit) => unit.name))
  await DeckEditor.verifySelectedUnits(sortedSelectedUnits.map((unit) => unit.name))
})

test('Available filters strength when locked', async (t) => {
  const username = `deck-available-filter-strength-locked-${t.ctx.start}`
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
  await DeckEditor.setFaction({
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
  await DeckEditor.setUnits(sortedSelectedUnits.map((unit) => unit.name))
  await DeckEditor.filterOnMainStat(DeckEditor.elements.UnitStatStrength)

  await DeckEditor.verifyAvailableUnits(
    sortedAvailableUnits
      .filter((unit) => unit.strength !== undefined && unit.strength !== null)
      .map((unit) => unit.name)
  )
  await DeckEditor.verifySelectedUnits(
    sortedSelectedUnits.filter((unit) => unit.strength !== undefined && unit.strength !== null).map((unit) => unit.name)
  )

  await DeckEditor.filterOnMainStat(DeckEditor.elements.UnitStatUnit)
  await DeckEditor.verifyAvailableUnits(sortedAvailableUnits.map((unit) => unit.name))
  await DeckEditor.verifySelectedUnits(sortedSelectedUnits.map((unit) => unit.name))
})

test('Available filters close when locked', async (t) => {
  const username = `deck-available-filter-close-locked-${t.ctx.start}`
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
  await DeckEditor.setFaction({
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
  await DeckEditor.setUnits(sortedSelectedUnits.map((unit) => unit.name))
  await DeckEditor.toggleCombatsExpanded()
  await DeckEditor.filterOnAdvancedStat(Combat.Close)

  await DeckEditor.verifyAvailableUnits(
    sortedAvailableUnits
      .filter((unit) => unit.combats?.includes(Combat.Close) && !unit.special)
      .map((unit) => unit.name)
  )
  await DeckEditor.verifySelectedUnits(
    sortedSelectedUnits.filter((unit) => unit.combats?.includes(Combat.Close) && !unit.special).map((unit) => unit.name)
  )

  await DeckEditor.filterOnMainStat(DeckEditor.elements.UnitStatUnit)
  await DeckEditor.verifyAvailableUnits(sortedAvailableUnits.map((unit) => unit.name))
  await DeckEditor.verifySelectedUnits(sortedSelectedUnits.map((unit) => unit.name))
})

test('Available filters ranged when locked', async (t) => {
  const username = `deck-available-filter-ranged-locked-${t.ctx.start}`
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
  await DeckEditor.setFaction({
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
  await DeckEditor.setUnits(sortedSelectedUnits.map((unit) => unit.name))
  await DeckEditor.toggleCombatsExpanded()
  await DeckEditor.filterOnAdvancedStat(Combat.Ranged)

  await DeckEditor.verifyAvailableUnits(
    sortedAvailableUnits
      .filter((unit) => unit.combats?.includes(Combat.Ranged) && !unit.special)
      .map((unit) => unit.name)
  )
  await DeckEditor.verifySelectedUnits(
    sortedSelectedUnits
      .filter((unit) => unit.combats?.includes(Combat.Ranged) && !unit.special)
      .map((unit) => unit.name)
  )

  await DeckEditor.filterOnMainStat(DeckEditor.elements.UnitStatUnit)
  await DeckEditor.verifyAvailableUnits(sortedAvailableUnits.map((unit) => unit.name))
  await DeckEditor.verifySelectedUnits(sortedSelectedUnits.map((unit) => unit.name))
})

test('Available filters siege when locked', async (t) => {
  const username = `deck-available-filter-siege-locked-${t.ctx.start}`
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
  await DeckEditor.setFaction({
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
  await DeckEditor.setUnits(sortedSelectedUnits.map((unit) => unit.name))
  await DeckEditor.toggleCombatsExpanded()
  await DeckEditor.filterOnAdvancedStat(Combat.Siege)

  await DeckEditor.verifyAvailableUnits(
    sortedAvailableUnits
      .filter((unit) => unit.combats?.includes(Combat.Siege) && !unit.special)
      .map((unit) => unit.name)
  )
  await DeckEditor.verifySelectedUnits(
    sortedSelectedUnits.filter((unit) => unit.combats?.includes(Combat.Siege) && !unit.special).map((unit) => unit.name)
  )

  await DeckEditor.filterOnMainStat(DeckEditor.elements.UnitStatUnit)
  await DeckEditor.verifyAvailableUnits(sortedAvailableUnits.map((unit) => unit.name))
  await DeckEditor.verifySelectedUnits(sortedSelectedUnits.map((unit) => unit.name))
})

test('Available filters agile when locked', async (t) => {
  const username = `deck-available-filter-agile-locked-${t.ctx.start}`
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
  await DeckEditor.setFaction({
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
  await DeckEditor.setUnits(sortedSelectedUnits.map((unit) => unit.name))
  await DeckEditor.toggleEffectsExpanded()
  await DeckEditor.filterOnAdvancedStat(EffectKey.Agile)

  await DeckEditor.verifyAvailableUnits(
    sortedAvailableUnits
      .filter((unit) => unit.effects?.map((effect) => effect.key)?.includes(EffectKey.Agile))
      .map((unit) => unit.name)
  )
  await DeckEditor.verifySelectedUnits(
    sortedSelectedUnits
      .filter((unit) => unit.effects?.map((effect) => effect.key)?.includes(EffectKey.Agile))
      .map((unit) => unit.name)
  )

  await DeckEditor.filterOnMainStat(DeckEditor.elements.UnitStatUnit)
  await DeckEditor.verifyAvailableUnits(sortedAvailableUnits.map((unit) => unit.name))
  await DeckEditor.verifySelectedUnits(sortedSelectedUnits.map((unit) => unit.name))
})

test('Available filters avenger when locked', async (t) => {
  await testEffectFilter({
    effectKey: EffectKey.Avenger,
    available: ['Cow'],
    selected: ['Kambi'],
    start: t.ctx.start,
  })
})

test('Available filters berserker when locked', async (t) => {
  await testEffectFilter({
    effectKey: EffectKey.Berserker,
    available: ['Berserker'],
    selected: ['Young Berserker', 'Young Berserker', 'Young Berserker'],
    start: t.ctx.start,
  })
})

test('Available filters bond when locked', async (t) => {
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
    start: t.ctx.start,
  })
})

test('Available filters decoy when locked', async (t) => {
  await testEffectFilter({
    effectKey: EffectKey.Decoy,
    available: ['Decoy', 'Decoy'],
    selected: ['Decoy'],
    start: t.ctx.start,
  })
})

test('Available filters horn when locked', async (t) => {
  await testEffectFilter({
    effectKey: EffectKey.Horn,
    available: ["Commander's Horn", "Commander's Horn", "Commander's Horn", 'Dandelion'],
    selected: ['Draig Bon-Dhu'],
    start: t.ctx.start,
  })
})

test('Available filters mardroeme when locked', async (t) => {
  await testEffectFilter({
    effectKey: EffectKey.Mardroeme,
    available: ['Ermion', 'Mardroeme'],
    selected: ['Mardroeme', 'Mardroeme'],
    start: t.ctx.start,
  })
})

test('Available filters medic when locked', async (t) => {
  await testEffectFilter({
    effectKey: EffectKey.Medic,
    available: ['Birna Bran'],
    selected: ['Yennefer of Vengerberg'],
    start: t.ctx.start,
  })
})

test('Available filters morale when locked', async (t) => {
  await testEffectFilter({
    effectKey: EffectKey.Morale,
    available: ['Olaf'],
    selected: ['Olgierd Von Everec'],
    start: t.ctx.start,
  })
})

test('Available filters muster when locked', async (t) => {
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
    start: t.ctx.start,
  })
})

test('Available filters scorch when locked', async (t) => {
  await testEffectFilter({
    effectKey: EffectKey.Scorch,
    available: ['Clan Dimun Pirate', 'Scorch', 'Scorch', 'Scorch'],
    selected: ['Villentretenmerth'],
    start: t.ctx.start,
  })
})

test('Available filters spy when locked', async (t) => {
  await testEffectFilter({
    factionKey: FactionKey.NilfgaardianEmpire,
    effectKey: EffectKey.Spy,
    available: ['Mysterious Elf', 'Shilard Fitz-Oesterlen', 'Stefan Skellen'],
    selected: ['Vattier de Rideaux'],
    start: t.ctx.start,
  })
})

test('Available filters weather when locked', async (t) => {
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
    start: t.ctx.start,
  })
})

test('Selected filters effects separate from available when unlocked', async (t) => {
  const username = `deck-selected-filter-effect-unlocked-${t.ctx.start}`
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
  await DeckEditor.setFaction({
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
  await DeckEditor.setUnits(sortedSelectedUnits.map((unit) => unit.name))
  await DeckEditor.toggleUnitsLock()
  await DeckEditor.toggleAvailableFiltersExpanded()
  await DeckEditor.toggleAdvancedFilter('filterAvailableMEDIC')
  await DeckEditor.toggleSelectedFiltersExpanded()
  await DeckEditor.toggleAdvancedFilter('filterSelectedMORALE')

  await DeckEditor.verifyAvailableUnits(['Dun Banner Medic'])
  await DeckEditor.verifySelectedUnits(['Olgierd Von Everec'])

  await DeckEditor.filterOnMainStat(DeckEditor.elements.UnitStatUnit)

  await DeckEditor.verifyAvailableUnits(sortedAvailableUnits.map((unit) => unit.name))
  await DeckEditor.verifySelectedUnits(sortedSelectedUnits.map((unit) => unit.name))
})

test('Available filters faction when locked', async (t) => {
  const username = `deck-available-filter-faction-locked-${t.ctx.start}`
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
  await DeckEditor.setFaction({
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
  await DeckEditor.setUnits(sortedSelectedUnits.map((unit) => unit.name))
  await DeckEditor.toggleAvailableFiltersExpanded()
  await DeckEditor.toggleAdvancedFilter('filterAvailablefaction')

  await DeckEditor.verifyAvailableUnits(
    sortedAvailableUnits.filter((unit) => unit.faction.key === factionKey).map((unit) => unit.name)
  )
  await DeckEditor.verifySelectedUnits(
    sortedSelectedUnits.filter((unit) => unit.faction.key === factionKey).map((unit) => unit.name)
  )

  await DeckEditor.filterOnMainStat(DeckEditor.elements.UnitStatUnit)

  await DeckEditor.verifyAvailableUnits(sortedAvailableUnits.map((unit) => unit.name))
  await DeckEditor.verifySelectedUnits(sortedSelectedUnits.map((unit) => unit.name))
})

test('Selected filters faction separately when unlocked', async (t) => {
  const username = `deck-selected-filter-faction-unlocked-${t.ctx.start}`
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
  await DeckEditor.setFaction({
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
  await DeckEditor.setUnits(sortedSelectedUnits.map((unit) => unit.name))
  await DeckEditor.toggleUnitsLock()
  await DeckEditor.toggleAvailableFiltersExpanded()
  await DeckEditor.toggleSelectedFiltersExpanded()
  await DeckEditor.toggleAdvancedFilter('filterAvailablefaction')
  await DeckEditor.toggleAdvancedFilter('filterSelectedNEUTRAL')

  await DeckEditor.verifyAvailableUnits(
    sortedAvailableUnits.filter((unit) => unit.faction.key === factionKey).map((unit) => unit.name)
  )
  await DeckEditor.verifySelectedUnits(
    sortedSelectedUnits.filter((unit) => unit.faction.key === FactionKey.Neutral).map((unit) => unit.name)
  )

  await DeckEditor.filterOnMainStat(DeckEditor.elements.UnitStatUnit)

  await DeckEditor.verifyAvailableUnits(sortedAvailableUnits.map((unit) => unit.name))
  await DeckEditor.verifySelectedUnits(sortedSelectedUnits.map((unit) => unit.name))
})

test('Available filters DLC when locked', async (t) => {
  const username = `deck-available-filter-dlc-locked-${t.ctx.start}`
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
  await DeckEditor.setFaction({
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
  await DeckEditor.setUnits(sortedSelectedUnits.map((unit) => unit.name))
  await DeckEditor.toggleAvailableFiltersExpanded()
  await DeckEditor.toggleAdvancedFilter('filterAvailableHEARTS_OF_STONE')

  await DeckEditor.verifyAvailableUnits(
    sortedAvailableUnits.filter((unit) => unit.dlc?.key === DlcKey.HeartsOfStone).map((unit) => unit.name)
  )
  await DeckEditor.verifySelectedUnits(
    sortedSelectedUnits.filter((unit) => unit.dlc?.key === DlcKey.HeartsOfStone).map((unit) => unit.name)
  )

  await DeckEditor.filterOnMainStat(DeckEditor.elements.UnitStatUnit)

  await DeckEditor.verifyAvailableUnits(sortedAvailableUnits.map((unit) => unit.name))
  await DeckEditor.verifySelectedUnits(sortedSelectedUnits.map((unit) => unit.name))
})

test('Selected filters DLC separately when unlocked', async (t) => {
  const username = `deck-selected-filter-dlc-unlocked-${t.ctx.start}`
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
  await DeckEditor.setFaction({
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
  await DeckEditor.setUnits(sortedSelectedUnits.map((unit) => unit.name))
  await DeckEditor.toggleUnitsLock()
  await DeckEditor.toggleAvailableFiltersExpanded()
  await DeckEditor.toggleSelectedFiltersExpanded()
  await DeckEditor.toggleAdvancedFilter('filterAvailableBLOOD_AND_WINE')
  await DeckEditor.toggleAdvancedFilter('filterSelectedGWENT_THE_WITCHER_CARD_GAME')

  await DeckEditor.verifyAvailableUnits(
    sortedAvailableUnits.filter((unit) => unit.dlc?.key === DlcKey.BloodAndWine).map((unit) => unit.name)
  )
  await DeckEditor.verifySelectedUnits(
    sortedSelectedUnits.filter((unit) => unit.dlc?.key === DlcKey.GwentTheWitcherCardGame).map((unit) => unit.name)
  )

  await DeckEditor.filterOnMainStat(DeckEditor.elements.UnitStatUnit)

  await DeckEditor.verifyAvailableUnits(sortedAvailableUnits.map((unit) => unit.name))
  await DeckEditor.verifySelectedUnits(sortedSelectedUnits.map((unit) => unit.name))
})

test('Available filters Alternate Art when locked', async (t) => {
  const username = `deck-available-filter-alt-art-locked-${t.ctx.start}`
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
  await DeckEditor.setFaction({
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
  await DeckEditor.setUnits(sortedSelectedUnits.map((unit) => unit.name))
  await DeckEditor.toggleAvailableFiltersExpanded()
  await DeckEditor.toggleAdvancedFilter('filterAvailableart')

  await DeckEditor.verifyAvailableUnits(
    sortedAvailableUnits.filter((unit) => unit.images.length > 1).map((unit) => unit.name)
  )
  await DeckEditor.verifySelectedUnits(
    sortedSelectedUnits.filter((unit) => unit.images.length > 1).map((unit) => unit.name)
  )

  await DeckEditor.filterOnMainStat(DeckEditor.elements.UnitStatUnit)

  await DeckEditor.verifyAvailableUnits(sortedAvailableUnits.map((unit) => unit.name))
  await DeckEditor.verifySelectedUnits(sortedSelectedUnits.map((unit) => unit.name))
})

test('Available filters name when locked', async (t) => {
  const username = `deck-available-filter-name-locked-${t.ctx.start}`
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
  await DeckEditor.setFaction({
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
  await DeckEditor.setUnits(sortedSelectedUnits.map((unit) => unit.name))
  await DeckEditor.filterByName({
    name: 'siege',
  })

  await DeckEditor.verifyAvailableUnits(['Kaedweni Siege Expert'])
  await DeckEditor.verifySelectedUnits(['Siege Tower'])

  await DeckEditor.filterByName({
    name: '',
  })

  await DeckEditor.verifyAvailableUnits(sortedAvailableUnits.map((unit) => unit.name))
  await DeckEditor.verifySelectedUnits(sortedSelectedUnits.map((unit) => unit.name))
})

test('Selected filters separately on name when unlocked', async (t) => {
  const username = `deck-selected-filter-name-unlocked-${t.ctx.start}`
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
  await DeckEditor.setFaction({
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
  await DeckEditor.setUnits(sortedSelectedUnits.map((unit) => unit.name))
  await DeckEditor.toggleUnitsLock()
  await DeckEditor.filterByName({
    name: 'geralt',
  })
  await DeckEditor.filterByName({
    name: 'roach',
    available: false,
  })

  await DeckEditor.verifyAvailableUnits(['Geralt of Rivia'])
  await DeckEditor.verifySelectedUnits(['Roach'])

  await DeckEditor.filterByName({
    name: '',
  })
  await DeckEditor.filterByName({
    name: '',
    available: false,
  })

  await DeckEditor.verifyAvailableUnits(sortedAvailableUnits.map((unit) => unit.name))
  await DeckEditor.verifySelectedUnits(sortedSelectedUnits.map((unit) => unit.name))
})

async function testEffectFilter({
  factionKey = FactionKey.Skellige,
  effectKey,
  available,
  selected,
  start,
}: {
  factionKey?: FactionKey
  effectKey: EffectKey
  available: string[]
  selected: string[]
  start: number
}) {
  const username = `deck-available-filter-${effectKey.toLowerCase()}-locked-${start}`
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
  await DeckEditor.setFaction({
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
  await DeckEditor.setUnits(selectedUnits.map((unit) => unit.name))
  await DeckEditor.toggleEffectsExpanded()
  await DeckEditor.filterOnAdvancedStat(effectKey)

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
  await DeckEditor.verifyAvailableUnits(expectedAvailableUnits)
  await DeckEditor.verifySelectedUnits(expectedSelectedUnits)

  await DeckEditor.filterOnMainStat(DeckEditor.elements.UnitStatUnit)
  await DeckEditor.verifyAvailableUnits(sortedAvailableUnits.map((unit) => unit.name))
  await DeckEditor.verifySelectedUnits(sortedSelectedUnits.map((unit) => unit.name))
}
