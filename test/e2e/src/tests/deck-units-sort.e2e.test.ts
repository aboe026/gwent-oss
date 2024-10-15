import { t } from 'testcafe'

import ApiClient from '../util/api-client'
import DeckEditor from '../components/deck-editor'
import DeckPage from '../page-objects/deck-page'
import { FactionKey } from '@gwent/graphql-schema/resolver-typings'
import LoginPage from '../page-objects/login-page'
import { sortObjectArray } from '@gwent/utils'
import { SORT_FIELD } from '@gwent/graphql-schema/deck-filter'

fixture('Deck Units Sort').page(DeckPage.getUrl())

test('Available sorts selected by name ascending when locked', async () => {
  const username = `deck-available-sort-selected-by-name-ascending-locked-${t.ctx.start}`
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
  }).map((unit) => unit.name)
  const halfway = Math.ceil(sortedUnits.length / 2)
  const sortedAvailableUnits = sortedUnits.slice(0, halfway)
  const sortedSelectedUnits = sortedUnits.slice(halfway, sortedUnits.length)
  await DeckEditor.setUnits(sortedSelectedUnits)

  await DeckEditor.verifyAvailableUnits(sortedAvailableUnits)
  await DeckEditor.verifySelectedUnits(sortedSelectedUnits)
})

test('Available sorts selected by strength ascending when locked', async () => {
  const username = `deck-available-sort-selected-by-strength-ascending-locked-${t.ctx.start}`
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
    sortProperties: [SORT_FIELD.Strength, SORT_FIELD.Name, SORT_FIELD.Id],
    array: units,
  }).map((unit) => unit.name)
  const halfway = Math.ceil(sortedUnits.length / 2)
  const sortedAvailableUnits = sortedUnits.slice(0, halfway)
  const sortedSelectedUnits = sortedUnits.slice(halfway, sortedUnits.length)
  await DeckEditor.setAvailableSortField(SORT_FIELD.Strength)
  await DeckEditor.setUnits(sortedSelectedUnits)

  await DeckEditor.verifyAvailableUnits(sortedAvailableUnits)
  await DeckEditor.verifySelectedUnits(sortedSelectedUnits)
})

test('Available sorts selected by name descending when locked', async () => {
  const username = `deck-available-sort-selected-by-name-descending-locked-${t.ctx.start}`
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
    reverse: true,
  }).map((unit) => unit.name)
  const halfway = Math.ceil(sortedUnits.length / 2)
  const sortedAvailableUnits = sortedUnits.slice(0, halfway)
  const sortedSelectedUnits = sortedUnits.slice(halfway, sortedUnits.length)
  await DeckEditor.setUnits(sortedSelectedUnits)
  await DeckEditor.changeAvailableSortOrder()

  await DeckEditor.verifyAvailableUnits(sortedAvailableUnits)
  await DeckEditor.verifySelectedUnits(sortedSelectedUnits)
})

test('Available sorts selected by strength descending when locked', async () => {
  const username = `deck-available-sort-selected-by-strength-descending-locked-${t.ctx.start}`
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
    sortProperties: [SORT_FIELD.Strength, SORT_FIELD.Name, SORT_FIELD.Id],
    array: units,
    reverse: true,
  }).map((unit) => unit.name)
  const halfway = Math.ceil(sortedUnits.length / 2)
  const sortedAvailableUnits = sortedUnits.slice(0, halfway)
  const sortedSelectedUnits = sortedUnits.slice(halfway, sortedUnits.length)
  await DeckEditor.setAvailableSortField(SORT_FIELD.Strength)
  await DeckEditor.setUnits(sortedSelectedUnits)
  await DeckEditor.changeAvailableSortOrder()

  await DeckEditor.verifyAvailableUnits(sortedAvailableUnits)
  await DeckEditor.verifySelectedUnits(sortedSelectedUnits)
})

test('Selected independently sorts by name ascending when unlocked', async () => {
  const username = `deck-selected-sort-by-name-ascending-unlocked-${t.ctx.start}`
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
  await DeckEditor.setUnits(sortedSelectedUnits)
  await DeckEditor.toggleUnitsLock()
  await DeckEditor.setAvailableSortField(SORT_FIELD.Strength)
  await DeckEditor.changeAvailableSortOrder()
  await DeckEditor.verifyAvailableUnits(sortedAvailableUnits)
  await DeckEditor.verifySelectedUnits(sortedSelectedUnits)
})

test('Selected independently sorts by strength ascending when unlocked', async () => {
  const username = `deck-selected-sort-by-strength-ascending-unlocked-${t.ctx.start}`
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
  await DeckEditor.setUnits(sortedSelectedUnits)
  await DeckEditor.toggleUnitsLock()
  await DeckEditor.changeAvailableSortOrder()
  await DeckEditor.setSelectedSortField(SORT_FIELD.Strength)
  await DeckEditor.verifyAvailableUnits(sortedAvailableUnits)
  await DeckEditor.verifySelectedUnits(sortedSelectedUnits)
})

test('Selected independently sorts by name descending when unlocked', async () => {
  const username = `deck-selected-sort-by-name-descending-unlocked-${t.ctx.start}`
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
  await DeckEditor.setUnits(sortedSelectedUnits)
  await DeckEditor.toggleUnitsLock()
  await DeckEditor.setAvailableSortField(SORT_FIELD.Strength)
  await DeckEditor.changeSelectedSortOrder()
  await DeckEditor.verifyAvailableUnits(sortedAvailableUnits)
  await DeckEditor.verifySelectedUnits(sortedSelectedUnits)
})

test('Selected independently sorts by strength descending when unlocked', async () => {
  const username = `deck-selected-sort-by-strength-descending-unlocked-${t.ctx.start}`
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
  await DeckEditor.setUnits(sortedSelectedUnits)
  await DeckEditor.toggleUnitsLock()
  await DeckEditor.changeSelectedSortOrder()
  await DeckEditor.setSelectedSortField(SORT_FIELD.Strength)
  await DeckEditor.verifyAvailableUnits(sortedAvailableUnits)
  await DeckEditor.verifySelectedUnits(sortedSelectedUnits)
})
