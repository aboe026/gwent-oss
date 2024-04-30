import ApiClient from '../util/api-client'
import DeckPage from '../page-objects/deck-page'
import { FactionKey } from '@gwent/graphql-schema/resolver-typings'
import LoginPage from '../page-objects/login-page'
import { sortObjectArray } from '@gwent/utils'
import { SORT_FIELD } from '@gwent/graphql-schema/deck-filter'

fixture('Deck Units Sort').page(DeckPage.getUrl())

test('Available sorts selected by name ascending when locked', async () => {
  const username = `deck-available-sort-selected-by-name-ascending-locked-${Date.now()}`
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
  }).map((unit) => unit.name)
  const halfway = Math.ceil(sortedUnits.length / 2)
  const sortedAvailableUnits = sortedUnits.slice(0, halfway)
  const sortedSelectedUnits = sortedUnits.slice(halfway, sortedUnits.length)
  await DeckPage.setUnits(sortedSelectedUnits)

  await DeckPage.verifyAvailableUnits(sortedAvailableUnits)
  await DeckPage.verifySelectedUnits(sortedSelectedUnits)
})

test('Available sorts selected by strength ascending when locked', async () => {
  const username = `deck-available-sort-selected-by-strength-ascending-locked-${Date.now()}`
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
    sortProperties: [SORT_FIELD.Strength, SORT_FIELD.Name, SORT_FIELD.Id],
    array: units,
  }).map((unit) => unit.name)
  const halfway = Math.ceil(sortedUnits.length / 2)
  const sortedAvailableUnits = sortedUnits.slice(0, halfway)
  const sortedSelectedUnits = sortedUnits.slice(halfway, sortedUnits.length)
  await DeckPage.setAvailableSortField(SORT_FIELD.Strength)
  await DeckPage.setUnits(sortedSelectedUnits)

  await DeckPage.verifyAvailableUnits(sortedAvailableUnits)
  await DeckPage.verifySelectedUnits(sortedSelectedUnits)
})

test('Available sorts selected by name descending when locked', async () => {
  const username = `deck-available-sort-selected-by-name-descending-locked-${Date.now()}`
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
    reverse: true,
  }).map((unit) => unit.name)
  const halfway = Math.ceil(sortedUnits.length / 2)
  const sortedAvailableUnits = sortedUnits.slice(0, halfway)
  const sortedSelectedUnits = sortedUnits.slice(halfway, sortedUnits.length)
  await DeckPage.setUnits(sortedSelectedUnits)
  await DeckPage.changeAvailableSortOrder()

  await DeckPage.verifyAvailableUnits(sortedAvailableUnits)
  await DeckPage.verifySelectedUnits(sortedSelectedUnits)
})

test('Available sorts selected by strength descending when locked', async () => {
  const username = `deck-available-sort-selected-by-strength-descending-locked-${Date.now()}`
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
    sortProperties: [SORT_FIELD.Strength, SORT_FIELD.Name, SORT_FIELD.Id],
    array: units,
    reverse: true,
  }).map((unit) => unit.name)
  const halfway = Math.ceil(sortedUnits.length / 2)
  const sortedAvailableUnits = sortedUnits.slice(0, halfway)
  const sortedSelectedUnits = sortedUnits.slice(halfway, sortedUnits.length)
  await DeckPage.setAvailableSortField(SORT_FIELD.Strength)
  await DeckPage.setUnits(sortedSelectedUnits)
  await DeckPage.changeAvailableSortOrder()

  await DeckPage.verifyAvailableUnits(sortedAvailableUnits)
  await DeckPage.verifySelectedUnits(sortedSelectedUnits)
})

test('Selected independently sorts by name ascending when unlocked', async () => {
  const username = `deck-selected-sort-by-name-ascending-unlocked-${Date.now()}`
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
  const halfway = Math.ceil(units.length / 2)
  const sortedAvailableUnits = sortObjectArray({
    sortProperties: [SORT_FIELD.Strength, SORT_FIELD.Name, SORT_FIELD.Id],
    array: units.slice(0, halfway),
    reverse: true,
  }).map((unit) => unit.name)
  const sortedSelectedUnits = sortObjectArray({
    sortProperties: [SORT_FIELD.Name, SORT_FIELD.Id],
    array: units.slice(halfway, units.length),
  }).map((unit) => unit.name)
  await DeckPage.setUnits(sortedSelectedUnits)
  await DeckPage.toggleUnitsLock()
  await DeckPage.setAvailableSortField(SORT_FIELD.Strength)
  await DeckPage.changeAvailableSortOrder()
  await DeckPage.verifyAvailableUnits(sortedAvailableUnits)
  await DeckPage.verifySelectedUnits(sortedSelectedUnits)
})

test('Selected independently sorts by strength ascending when unlocked', async () => {
  const username = `deck-selected-sort-by-strength-ascending-unlocked-${Date.now()}`
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
  const halfway = Math.ceil(units.length / 2)
  const sortedAvailableUnits = sortObjectArray({
    sortProperties: [SORT_FIELD.Name, SORT_FIELD.Id],
    array: units.slice(0, halfway),
    reverse: true,
  }).map((unit) => unit.name)
  const sortedSelectedUnits = sortObjectArray({
    sortProperties: [SORT_FIELD.Strength, SORT_FIELD.Name, SORT_FIELD.Id],
    array: units.slice(halfway, units.length),
  }).map((unit) => unit.name)
  await DeckPage.setUnits(sortedSelectedUnits)
  await DeckPage.toggleUnitsLock()
  await DeckPage.changeAvailableSortOrder()
  await DeckPage.setSelectedSortField(SORT_FIELD.Strength)
  await DeckPage.verifyAvailableUnits(sortedAvailableUnits)
  await DeckPage.verifySelectedUnits(sortedSelectedUnits)
})

test('Selected independently sorts by name descending when unlocked', async () => {
  const username = `deck-selected-sort-by-name-descending-unlocked-${Date.now()}`
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
  const halfway = Math.ceil(units.length / 2)
  const sortedAvailableUnits = sortObjectArray({
    sortProperties: [SORT_FIELD.Strength, SORT_FIELD.Name, SORT_FIELD.Id],
    array: units.slice(0, halfway),
  }).map((unit) => unit.name)
  const sortedSelectedUnits = sortObjectArray({
    sortProperties: [SORT_FIELD.Name, SORT_FIELD.Id],
    array: units.slice(halfway, units.length),
    reverse: true,
  }).map((unit) => unit.name)
  await DeckPage.setUnits(sortedSelectedUnits)
  await DeckPage.toggleUnitsLock()
  await DeckPage.setAvailableSortField(SORT_FIELD.Strength)
  await DeckPage.changeSelectedSortOrder()
  await DeckPage.verifyAvailableUnits(sortedAvailableUnits)
  await DeckPage.verifySelectedUnits(sortedSelectedUnits)
})

test('Selected independently sorts by strength descending when unlocked', async () => {
  const username = `deck-selected-sort-by-strength-descending-unlocked-${Date.now()}`
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
  const halfway = Math.ceil(units.length / 2)
  const sortedAvailableUnits = sortObjectArray({
    sortProperties: [SORT_FIELD.Name, SORT_FIELD.Id],
    array: units.slice(0, halfway),
  }).map((unit) => unit.name)
  const sortedSelectedUnits = sortObjectArray({
    sortProperties: [SORT_FIELD.Strength, SORT_FIELD.Name, SORT_FIELD.Id],
    array: units.slice(halfway, units.length),
    reverse: true,
  }).map((unit) => unit.name)
  await DeckPage.setUnits(sortedSelectedUnits)
  await DeckPage.toggleUnitsLock()
  await DeckPage.changeSelectedSortOrder()
  await DeckPage.setSelectedSortField(SORT_FIELD.Strength)
  await DeckPage.verifyAvailableUnits(sortedAvailableUnits)
  await DeckPage.verifySelectedUnits(sortedSelectedUnits)
})
