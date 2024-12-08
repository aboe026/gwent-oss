import ApiClient from '../util/api-client'
import DeckList from '../components/deck-list'
import DecksPage from '../page-objects/decks-page'
import { Deck, Faction, FactionKey, Leader } from '@gwent/graphql-schema/resolver-typings'
import { E2eCtx, getFixtureCtx, getTestCtx } from '../util/e2e-ctx'
import { FILTER_FIELD } from '@gwent/graphql-schema/decks-filter'
import LoginPage from '../page-objects/login-page'

interface DeckFilterTestCtx extends E2eCtx {
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
const fixture = getFixtureCtx<E2eCtx, DeckFilterTestCtx>()
const test = getTestCtx<E2eCtx, DeckFilterTestCtx>()

fixture('Decks Filter')
  .page(DecksPage.getUrl())
  .beforeEach(async (t) => {
    t.ctx.username = `decks-filter-${t.ctx.start}`
    t.ctx.name1 = 'decks filter first'
    t.ctx.name2 = 'decks filter second'
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

test('Filters by name', async (t) => {
  await DeckList.filterName(t.ctx.name1)
  await DecksPage.verify({
    decks: [
      {
        created: new Date(t.ctx.deck1.created),
        faction: t.ctx.faction1,
        leader: t.ctx.leader1,
        name: t.ctx.name1,
        stats: t.ctx.deck1.stats,
        neutralFaction: t.ctx.neutralFaction,
      },
    ],
  })
  await DeckList.filterName(t.ctx.name2)
  await DecksPage.verify({
    decks: [
      {
        created: new Date(t.ctx.deck2.created),
        faction: t.ctx.faction2,
        leader: t.ctx.leader2,
        name: t.ctx.name2,
        stats: t.ctx.deck2.stats,
        neutralFaction: t.ctx.neutralFaction,
      },
    ],
  })
  await DeckList.filterName('invalid')
  await DeckList.verifyNoFilterResults()
  await DeckList.clearFilterNoneFound()
  await DecksPage.verify({
    decks: [
      {
        created: new Date(t.ctx.deck1.created),
        faction: t.ctx.faction1,
        leader: t.ctx.leader1,
        name: t.ctx.name1,
        stats: t.ctx.deck1.stats,
        neutralFaction: t.ctx.neutralFaction,
      },
      {
        created: new Date(t.ctx.deck2.created),
        faction: t.ctx.faction2,
        leader: t.ctx.leader2,
        name: t.ctx.name2,
        stats: t.ctx.deck2.stats,
        neutralFaction: t.ctx.neutralFaction,
      },
    ],
  })
})

test('Filters by faction', async (t) => {
  await DeckList.toggleAdvancedFiltersExpanded()
  await DeckList.toggleAdvancedFilter(FILTER_FIELD.NilfgaardianEmpire)
  await DecksPage.verify({
    decks: [
      {
        created: new Date(t.ctx.deck2.created),
        faction: t.ctx.faction2,
        leader: t.ctx.leader2,
        name: t.ctx.name2,
        stats: t.ctx.deck2.stats,
        neutralFaction: t.ctx.neutralFaction,
      },
    ],
  })
  await DeckList.toggleAdvancedFilter(FILTER_FIELD.ScoiaTael)
  await DecksPage.verify({
    decks: [
      {
        created: new Date(t.ctx.deck1.created),
        faction: t.ctx.faction1,
        leader: t.ctx.leader1,
        name: t.ctx.name1,
        stats: t.ctx.deck1.stats,
        neutralFaction: t.ctx.neutralFaction,
      },
      {
        created: new Date(t.ctx.deck2.created),
        faction: t.ctx.faction2,
        leader: t.ctx.leader2,
        name: t.ctx.name2,
        stats: t.ctx.deck2.stats,
        neutralFaction: t.ctx.neutralFaction,
      },
    ],
  })
  await DeckList.toggleAdvancedFilter(FILTER_FIELD.ScoiaTael)
  await DeckList.toggleAdvancedFilter(FILTER_FIELD.NilfgaardianEmpire)
  await DecksPage.verify({
    decks: [
      {
        created: new Date(t.ctx.deck1.created),
        faction: t.ctx.faction1,
        leader: t.ctx.leader1,
        name: t.ctx.name1,
        stats: t.ctx.deck1.stats,
        neutralFaction: t.ctx.neutralFaction,
      },
      {
        created: new Date(t.ctx.deck2.created),
        faction: t.ctx.faction2,
        leader: t.ctx.leader2,
        name: t.ctx.name2,
        stats: t.ctx.deck2.stats,
        neutralFaction: t.ctx.neutralFaction,
      },
    ],
  })
  await DeckList.toggleAdvancedFilter(FILTER_FIELD.Monsters)
  await DeckList.verifyNoFilterResults()
  await DeckList.clearFilterNoneFound()
  await DecksPage.verify({
    decks: [
      {
        created: new Date(t.ctx.deck1.created),
        faction: t.ctx.faction1,
        leader: t.ctx.leader1,
        name: t.ctx.name1,
        stats: t.ctx.deck1.stats,
        neutralFaction: t.ctx.neutralFaction,
      },
      {
        created: new Date(t.ctx.deck2.created),
        faction: t.ctx.faction2,
        leader: t.ctx.leader2,
        name: t.ctx.name2,
        stats: t.ctx.deck2.stats,
        neutralFaction: t.ctx.neutralFaction,
      },
    ],
  })
})

test('Filters by name and faction', async (t) => {
  await DeckList.toggleAdvancedFiltersExpanded()
  await DeckList.toggleAdvancedFilter(FILTER_FIELD.ScoiaTael)
  await DeckList.toggleAdvancedFilter(FILTER_FIELD.NilfgaardianEmpire)
  await DeckList.filterName(t.ctx.name2)
  await DecksPage.verify({
    decks: [
      {
        created: new Date(t.ctx.deck2.created),
        faction: t.ctx.faction2,
        leader: t.ctx.leader2,
        name: t.ctx.name2,
        stats: t.ctx.deck2.stats,
        neutralFaction: t.ctx.neutralFaction,
      },
    ],
  })
  await DeckList.toggleAdvancedFilter(FILTER_FIELD.NilfgaardianEmpire)
  await DeckList.verifyNoFilterResults()
  await DeckList.clearFilterNoneFound()
  await DecksPage.verify({
    decks: [
      {
        created: new Date(t.ctx.deck1.created),
        faction: t.ctx.faction1,
        leader: t.ctx.leader1,
        name: t.ctx.name1,
        stats: t.ctx.deck1.stats,
        neutralFaction: t.ctx.neutralFaction,
      },
      {
        created: new Date(t.ctx.deck2.created),
        faction: t.ctx.faction2,
        leader: t.ctx.leader2,
        name: t.ctx.name2,
        stats: t.ctx.deck2.stats,
        neutralFaction: t.ctx.neutralFaction,
      },
    ],
  })
  await DeckList.filterName('decks filter')
  await DecksPage.verify({
    decks: [
      {
        created: new Date(t.ctx.deck1.created),
        faction: t.ctx.faction1,
        leader: t.ctx.leader1,
        name: t.ctx.name1,
        stats: t.ctx.deck1.stats,
        neutralFaction: t.ctx.neutralFaction,
      },
      {
        created: new Date(t.ctx.deck2.created),
        faction: t.ctx.faction2,
        leader: t.ctx.leader2,
        name: t.ctx.name2,
        stats: t.ctx.deck2.stats,
        neutralFaction: t.ctx.neutralFaction,
      },
    ],
  })
  await DeckList.toggleAdvancedFilter(FILTER_FIELD.ScoiaTael)
  await DecksPage.verify({
    decks: [
      {
        created: new Date(t.ctx.deck1.created),
        faction: t.ctx.faction1,
        leader: t.ctx.leader1,
        name: t.ctx.name1,
        stats: t.ctx.deck1.stats,
        neutralFaction: t.ctx.neutralFaction,
      },
    ],
  })
})
