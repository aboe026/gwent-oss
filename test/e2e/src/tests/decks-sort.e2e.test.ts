import { t } from 'testcafe'

import ApiClient from '../util/api-client'
import DecksPage from '../page-objects/decks-page'
import LoginPage from '../page-objects/login-page'
import { FactionKey } from '@gwent/graphql-schema/resolver-typings'
import { SORT_FIELD } from '@gwent/graphql-schema/decks-filter'

fixture('Decks Sort')
  .page(DecksPage.getUrl())
  .beforeEach(async () => {
    t.ctx.username = `decks-sort-${Date.now()}`
    t.ctx.name1 = 'decks sort first'
    t.ctx.name2 = 'decks sort second'
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
      'Scorch',
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
      'Young Emmisary',
      'Young Emmisary',
    ]
    await new ApiClient({}).addUser({
      name: t.ctx.username,
    })
    const client = new ApiClient({
      username: t.ctx.username,
    })
    t.ctx.faction1 = await client.getFaction({
      key: faction1,
      neutrals: true,
    })
    t.ctx.faction2 = await client.getFaction({
      key: faction2,
      neutrals: true,
    })
    t.ctx.leader1 = await client.getLeader({
      faction: faction1,
      name: leader1,
    })
    t.ctx.leader2 = await client.getLeader({
      faction: faction2,
      name: leader2,
    })
    t.ctx.deck1 = await client.addDeck({
      faction: faction1,
      leaderName: leader1,
      name: t.ctx.name1,
      unitNames: units1,
    })
    t.ctx.deck2 = await client.addDeck({
      faction: faction2,
      leaderName: leader2,
      name: t.ctx.name2,
      unitNames: units2,
    })
    await LoginPage.login({
      username: t.ctx.username,
    })
  })

test('Sorts by agile descending', async () => {
  await DecksPage.setSortField(SORT_FIELD.Agile)
  await verifySortOrder(false)
})

test('Sorts by agile ascending', async () => {
  await DecksPage.setSortField(SORT_FIELD.Agile)
  await DecksPage.changeSortOrder()
  await verifySortOrder(true)
})

test('Sorts by close descending', async () => {
  await DecksPage.setSortField(SORT_FIELD.Close)
  await verifySortOrder(false)
})

test('Sorts by close ascending', async () => {
  await DecksPage.setSortField(SORT_FIELD.Close)
  await DecksPage.changeSortOrder()
  await verifySortOrder(true)
})

test('Sorts by created descending', async () => {
  await DecksPage.setSortField(SORT_FIELD.Created)
  await verifySortOrder(true)
})

test('Sorts by created ascending', async () => {
  await DecksPage.setSortField(SORT_FIELD.Created)
  await DecksPage.changeSortOrder()
  await verifySortOrder(false)
})

test('Sorts by heroes descending', async () => {
  await DecksPage.setSortField(SORT_FIELD.Heroes)
  await verifySortOrder(false)
})

test('Sorts by heroes ascending', async () => {
  await DecksPage.setSortField(SORT_FIELD.Heroes)
  await DecksPage.changeSortOrder()
  await verifySortOrder(true)
})

test('Sorts by name descending by default', async () => {
  await verifySortOrder(true)
})

test('Sorts by name ascending', async () => {
  await DecksPage.changeSortOrder()
  await verifySortOrder(false)
})

test('Sorts by ranged descending', async () => {
  await DecksPage.setSortField(SORT_FIELD.Ranged)
  await verifySortOrder(false)
})

test('Sorts by ranged ascending', async () => {
  await DecksPage.setSortField(SORT_FIELD.Ranged)
  await DecksPage.changeSortOrder()
  await verifySortOrder(true)
})

test('Sorts by siege descending', async () => {
  await DecksPage.setSortField(SORT_FIELD.Siege)
  await verifySortOrder(true)
})

test('Sorts by siege ascending', async () => {
  await DecksPage.setSortField(SORT_FIELD.Siege)
  await DecksPage.changeSortOrder()
  await verifySortOrder(false)
})

test('Sorts by specials descending', async () => {
  await DecksPage.setSortField(SORT_FIELD.Specials)
  await verifySortOrder(false)
})

test('Sorts by specials ascending', async () => {
  await DecksPage.setSortField(SORT_FIELD.Specials)
  await DecksPage.changeSortOrder()
  await verifySortOrder(true)
})

test('Sorts by strength average descending', async () => {
  await DecksPage.setSortField(SORT_FIELD.StrengthAverage)
  await verifySortOrder(true)
})

test('Sorts by strength total ascending', async () => {
  await DecksPage.setSortField(SORT_FIELD.StrengthAverage)
  await DecksPage.changeSortOrder()
  await verifySortOrder(false)
})

test('Sorts by units descending', async () => {
  await DecksPage.setSortField(SORT_FIELD.Units)
  await verifySortOrder(false)
})

test('Sorts by units ascending', async () => {
  await DecksPage.setSortField(SORT_FIELD.Units)
  await DecksPage.changeSortOrder()
  await verifySortOrder(true)
})

async function verifySortOrder(first: boolean) {
  const decks = []
  const deck1 = {
    created: new Date(t.ctx.deck1.created),
    faction: t.ctx.faction1,
    leader: t.ctx.leader1,
    name: t.ctx.name1,
    stats: t.ctx.deck1.stats,
  }
  const deck2 = {
    created: new Date(t.ctx.deck2.created),
    faction: t.ctx.faction2,
    leader: t.ctx.leader2,
    name: t.ctx.name2,
    stats: t.ctx.deck2.stats,
  }
  decks.push(first ? deck1 : deck2)
  decks.push(first ? deck2 : deck1)
  await DecksPage.verifyContent({
    decks,
  })
}
