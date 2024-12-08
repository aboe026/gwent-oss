import ApiClient from '../util/api-client'
import DeckList, { DeckInfo } from '../components/deck-list'
import DecksPage from '../page-objects/decks-page'
import { Deck, Faction, FactionKey, Leader } from '@gwent/graphql-schema/resolver-typings'
import { E2eCtx, getFixtureCtx, getTestCtx } from '../util/e2e-ctx'
import LoginPage from '../page-objects/login-page'
import { SORT_FIELD } from '@gwent/graphql-schema/decks-filter'

interface DecksSortTestCtx extends E2eCtx {
  username: string
  name1: string
  name2: string
  faction1: Faction
  faction2: Faction
  leader1: Leader
  leader2: Leader
  deck1: Deck
  deck2: Deck
  neutralFaction: Faction
}
const fixture = getFixtureCtx<E2eCtx, DecksSortTestCtx>()
const test = getTestCtx<E2eCtx, DecksSortTestCtx>()

fixture('Decks Sort')
  .page(DecksPage.getUrl())
  .beforeEach(async (t) => {
    t.ctx.username = `decks-sort-${t.ctx.start}`
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
      'Young Emissary',
      'Young Emissary',
    ]
    await new ApiClient({}).addUser({
      name: t.ctx.username,
    })
    const client = new ApiClient({
      username: t.ctx.username,
    })
    t.ctx.faction1 = await client.getFaction({
      key: faction1,
    })
    t.ctx.faction2 = await client.getFaction({
      key: faction2,
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
    t.ctx.neutralFaction = await client.getFaction({ key: FactionKey.Neutral })
    await LoginPage.login({
      username: t.ctx.username,
    })
  })

test('Sorts by agile descending', async (t) => {
  await DeckList.setSortField(SORT_FIELD.Agile)
  await verifySortOrder({
    ctx: t.ctx,
    first: false,
  })
})

test('Sorts by agile ascending', async (t) => {
  await DeckList.setSortField(SORT_FIELD.Agile)
  await DeckList.changeSortOrder()
  await verifySortOrder({
    ctx: t.ctx,
    first: true,
  })
})

test('Sorts by close descending', async (t) => {
  await DeckList.setSortField(SORT_FIELD.Close)
  await verifySortOrder({
    ctx: t.ctx,
    first: false,
  })
})

test('Sorts by close ascending', async (t) => {
  await DeckList.setSortField(SORT_FIELD.Close)
  await DeckList.changeSortOrder()
  await verifySortOrder({
    ctx: t.ctx,
    first: true,
  })
})

test('Sorts by created descending', async (t) => {
  await DeckList.setSortField(SORT_FIELD.Created)
  await verifySortOrder({
    ctx: t.ctx,
    first: true,
  })
})

test('Sorts by created ascending', async (t) => {
  await DeckList.setSortField(SORT_FIELD.Created)
  await DeckList.changeSortOrder()
  await verifySortOrder({
    ctx: t.ctx,
    first: false,
  })
})

test('Sorts by heroes descending', async (t) => {
  await DeckList.setSortField(SORT_FIELD.Heroes)
  await verifySortOrder({
    ctx: t.ctx,
    first: false,
  })
})

test('Sorts by heroes ascending', async (t) => {
  await DeckList.setSortField(SORT_FIELD.Heroes)
  await DeckList.changeSortOrder()
  await verifySortOrder({
    ctx: t.ctx,
    first: true,
  })
})

test('Sorts by name descending by default', async (t) => {
  await verifySortOrder({
    ctx: t.ctx,
    first: true,
  })
})

test('Sorts by name ascending', async (t) => {
  await DeckList.changeSortOrder()
  await verifySortOrder({
    ctx: t.ctx,
    first: false,
  })
})

test('Sorts by ranged descending', async (t) => {
  await DeckList.setSortField(SORT_FIELD.Ranged)
  await verifySortOrder({
    ctx: t.ctx,
    first: false,
  })
})

test('Sorts by ranged ascending', async (t) => {
  await DeckList.setSortField(SORT_FIELD.Ranged)
  await DeckList.changeSortOrder()
  await verifySortOrder({
    ctx: t.ctx,
    first: true,
  })
})

test('Sorts by siege descending', async (t) => {
  await DeckList.setSortField(SORT_FIELD.Siege)
  await verifySortOrder({
    ctx: t.ctx,
    first: true,
  })
})

test('Sorts by siege ascending', async (t) => {
  await DeckList.setSortField(SORT_FIELD.Siege)
  await DeckList.changeSortOrder()
  await verifySortOrder({
    ctx: t.ctx,
    first: false,
  })
})

test('Sorts by specials descending', async (t) => {
  await DeckList.setSortField(SORT_FIELD.Specials)
  await verifySortOrder({
    ctx: t.ctx,
    first: false,
  })
})

test('Sorts by specials ascending', async (t) => {
  await DeckList.setSortField(SORT_FIELD.Specials)
  await DeckList.changeSortOrder()
  await verifySortOrder({
    ctx: t.ctx,
    first: true,
  })
})

test('Sorts by strength average descending', async (t) => {
  await DeckList.setSortField(SORT_FIELD.StrengthAverage)
  await verifySortOrder({
    ctx: t.ctx,
    first: true,
  })
})

test('Sorts by strength total ascending', async (t) => {
  await DeckList.setSortField(SORT_FIELD.StrengthAverage)
  await DeckList.changeSortOrder()
  await verifySortOrder({
    ctx: t.ctx,
    first: false,
  })
})

test('Sorts by units descending', async (t) => {
  await DeckList.setSortField(SORT_FIELD.Units)
  await verifySortOrder({
    ctx: t.ctx,
    first: false,
  })
})

test('Sorts by units ascending', async (t) => {
  await DeckList.setSortField(SORT_FIELD.Units)
  await DeckList.changeSortOrder()
  await verifySortOrder({
    ctx: t.ctx,
    first: true,
  })
})

async function verifySortOrder({ ctx, first }: { first: boolean; ctx: DecksSortTestCtx }) {
  const decks = []
  const deck1: DeckInfo = {
    created: new Date(ctx.deck1.created),
    faction: ctx.faction1,
    leader: ctx.leader1,
    name: ctx.name1,
    stats: ctx.deck1.stats,
    neutralFaction: ctx.neutralFaction,
  }
  const deck2: DeckInfo = {
    created: new Date(ctx.deck2.created),
    faction: ctx.faction2,
    leader: ctx.leader2,
    name: ctx.name2,
    stats: ctx.deck2.stats,
    neutralFaction: ctx.neutralFaction,
  }
  decks.push(first ? deck1 : deck2)
  decks.push(first ? deck2 : deck1)
  await DecksPage.verify({
    decks,
  })
}
