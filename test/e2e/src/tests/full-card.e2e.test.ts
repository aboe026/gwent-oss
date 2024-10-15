import { t } from 'testcafe'

import ApiClient from '../util/api-client'
import DeckEditor from '../components/deck-editor'
import DeckPage from '../page-objects/deck-page'
import E2eUtil from '../util/e2e-util'
import { FactionKey } from '@gwent/graphql-schema/resolver-typings'
import FullCard from '../components/full-card'
import GamePage from '../page-objects/game-page'
import LoginPage from '../page-objects/login-page'
import { sortObjectArray } from '@gwent/utils'

fixture('Full Card')
  .page(DeckPage.getUrl())
  .beforeEach(async () => {
    const scenario = 'full-card'
    t.ctx.username = `${scenario}-user-${t.ctx.start}`
    await new ApiClient({}).addUser({
      name: t.ctx.username,
    })
    await LoginPage.login({
      username: t.ctx.username,
    })
  })

test('Shows correct info for Monster faction', async () => {
  const client = new ApiClient({
    username: t.ctx.username,
  })
  const unit = await client.getUnit({
    name: 'Botchling',
  })
  await DeckEditor.setFaction({
    faction: unit.faction,
  })
  await FullCard.verify({})
  await DeckEditor.openFullCard(unit.name)
  await FullCard.verify({ unit })
  await FullCard.close()
  await FullCard.verify({})
})

test('Shows correct info for Nilfgaardian Empire faction', async () => {
  const client = new ApiClient({
    username: t.ctx.username,
  })
  const unit = await client.getUnit({
    name: 'Zerrikanian Fire Scorpion',
  })
  await DeckEditor.setFaction({
    faction: unit.faction,
  })
  await FullCard.verify({})
  await DeckEditor.openFullCard(unit.name)
  await FullCard.verify({ unit })
  await FullCard.close()
  await FullCard.verify({})
})

test('Shows correct info for Northern Realms faction', async () => {
  const client = new ApiClient({
    username: t.ctx.username,
  })
  const unit = await client.getUnit({
    name: 'Ballista',
  })
  await DeckEditor.setFaction({
    faction: unit.faction,
  })
  await FullCard.verify({})
  await DeckEditor.openFullCard(unit.name)
  await FullCard.verify({ unit })
  await FullCard.close()
  await FullCard.verify({})
})

test('Shows correct info for Scoiatael faction', async () => {
  const client = new ApiClient({
    username: t.ctx.username,
  })
  const unit = await client.getUnit({
    name: 'Dol Blathanna Archer',
  })
  await DeckEditor.setFaction({
    faction: unit.faction,
  })
  await FullCard.verify({})
  await DeckEditor.openFullCard(unit.name)
  await FullCard.verify({ unit })
  await FullCard.close()
  await FullCard.verify({})
})

test('Shows correct info for Skellige faction', async () => {
  const client = new ApiClient({
    username: t.ctx.username,
  })
  const unit = await client.getUnit({
    name: 'Blueboy Lugos',
  })
  await DeckEditor.setFaction({
    faction: unit.faction,
  })
  await FullCard.verify({})
  await DeckEditor.openFullCard(unit.name)
  await FullCard.verify({ unit })
  await FullCard.close()
  await FullCard.verify({})
})

test('Shows correct info for Neutral faction', async () => {
  const client = new ApiClient({
    username: t.ctx.username,
  })
  const unit = await client.getUnit({
    name: 'Vesemir',
  })
  await DeckEditor.setFaction({
    faction: await client.getFaction({
      key: FactionKey.Monsters,
    }),
  })
  await FullCard.verify({})
  await DeckEditor.openFullCard(unit.name)
  await FullCard.verify({ unit })
  await FullCard.close()
  await FullCard.verify({})
})

test('Shows correct info for special', async () => {
  const client = new ApiClient({
    username: t.ctx.username,
  })
  const unit = await client.getUnit({
    name: 'Scorch',
  })
  await DeckEditor.setFaction({
    faction: await client.getFaction({
      key: FactionKey.Monsters,
    }),
  })
  await FullCard.verify({})
  await DeckEditor.openFullCard(unit.name)
  await FullCard.verify({ unit })
  await FullCard.close()
  await FullCard.verify({})
})

test('Shows correct info for hero', async () => {
  const client = new ApiClient({
    username: t.ctx.username,
  })
  const unit = await client.getUnit({
    name: 'Leshen',
  })
  await DeckEditor.setFaction({
    faction: unit.faction,
  })
  await FullCard.verify({})
  await DeckEditor.openFullCard(unit.name)
  await FullCard.verify({ unit })
  await FullCard.close()
  await FullCard.verify({})
})

test('Shows correct info for alternative art', async () => {
  const client = new ApiClient({
    username: t.ctx.username,
  })
  const unit = await client.getUnit({
    name: 'Ghoul',
  })
  await DeckEditor.setFaction({
    faction: unit.faction,
  })
  await FullCard.verify({})
  await DeckEditor.openFullCard(unit.name)
  await FullCard.verify({ unit })
  await FullCard.artStyleNext()
  await FullCard.verify({
    unit,
    artStyle: 2,
  })
  await FullCard.close()
  await FullCard.verify({})
})

test('Shows correct info for Hearts of Stone dlc', async () => {
  const client = new ApiClient({
    username: t.ctx.username,
  })
  const unit = await client.getUnit({
    name: 'Cow',
  })
  await DeckEditor.setFaction({
    faction: await client.getFaction({
      key: FactionKey.Monsters,
    }),
  })
  await FullCard.verify({})
  await DeckEditor.openFullCard(unit.name)
  await FullCard.verify({ unit })
  await FullCard.close()
  await FullCard.verify({})
})

test('Shows correct info for Blood and Wine dlc', async () => {
  const client = new ApiClient({
    username: t.ctx.username,
  })
  const unit = await client.getUnit({
    name: 'Skellige Storm',
  })
  await DeckEditor.setFaction({
    faction: await client.getFaction({
      key: FactionKey.Monsters,
    }),
  })
  await FullCard.verify({})
  await DeckEditor.openFullCard(unit.name)
  await FullCard.verify({ unit })
  await FullCard.close()
  await FullCard.verify({})
})

test('Shows correct info for Gwent the Witcher Card Game dlc', async () => {
  const client = new ApiClient({
    username: t.ctx.username,
  })
  const unit = await client.getUnit({
    name: 'Roach',
  })
  await DeckEditor.setFaction({
    faction: await client.getFaction({
      key: FactionKey.Monsters,
    }),
  })
  await FullCard.verify({})
  await DeckEditor.openFullCard(unit.name)
  await FullCard.verify({ unit })
  await FullCard.close()
  await FullCard.verify({})
})

test('Shows correct info for Agile effect', async () => {
  const client = new ApiClient({
    username: t.ctx.username,
  })
  const unit = await client.getUnit({
    name: 'Celaeno Harpy',
  })
  await DeckEditor.setFaction({
    faction: unit.faction,
  })
  await FullCard.verify({})
  await DeckEditor.openFullCard(unit.name)
  await FullCard.verify({ unit })
  await FullCard.close()
  await FullCard.verify({})
})

test('Shows correct info for Avenger effect', async () => {
  const client = new ApiClient({
    username: t.ctx.username,
  })
  const unit = await client.getUnit({
    name: 'Kambi',
  })
  await DeckEditor.setFaction({
    faction: unit.faction,
  })
  await FullCard.verify({})
  await DeckEditor.openFullCard(unit.name)
  await FullCard.verify({ unit })
  await FullCard.close()
  await FullCard.verify({})
})

test('Shows correct info for Avenger effect', async () => {
  const client = new ApiClient({
    username: t.ctx.username,
  })
  const unit = await client.getUnit({
    name: 'Young Berserker',
  })
  await DeckEditor.setFaction({
    faction: unit.faction,
  })
  await FullCard.verify({})
  await DeckEditor.openFullCard(unit.name)
  await FullCard.verify({ unit })
  await FullCard.close()
  await FullCard.verify({})
})

test('Shows correct info for Bond effect', async () => {
  const client = new ApiClient({
    username: t.ctx.username,
  })
  const unit = await client.getUnit({
    name: 'Impera Brigade Guard',
  })
  await DeckEditor.setFaction({
    faction: unit.faction,
  })
  await FullCard.verify({})
  await DeckEditor.openFullCard(unit.name)
  await FullCard.verify({ unit })
  await FullCard.close()
  await FullCard.verify({})
})

test('Shows correct info for Decoy effect', async () => {
  const client = new ApiClient({
    username: t.ctx.username,
  })
  const unit = await client.getUnit({
    name: 'Decoy',
  })
  await DeckEditor.setFaction({
    faction: await client.getFaction({
      key: FactionKey.Monsters,
    }),
  })
  await FullCard.verify({})
  await DeckEditor.openFullCard(unit.name)
  await FullCard.verify({ unit })
  await FullCard.close()
  await FullCard.verify({})
})

test('Shows correct info for Horn effect', async () => {
  const client = new ApiClient({
    username: t.ctx.username,
  })
  const unit = await client.getUnit({
    name: "Commander's Horn",
  })
  await DeckEditor.setFaction({
    faction: await client.getFaction({
      key: FactionKey.Monsters,
    }),
  })
  await FullCard.verify({})
  await DeckEditor.openFullCard(unit.name)
  await FullCard.verify({ unit })
  await FullCard.close()
  await FullCard.verify({})
})

test('Shows correct info for Mardroeme effect', async () => {
  const client = new ApiClient({
    username: t.ctx.username,
  })
  const unit = await client.getUnit({
    name: 'Mardroeme',
  })
  await DeckEditor.setFaction({
    faction: unit.faction,
  })
  await FullCard.verify({})
  await DeckEditor.openFullCard(unit.name)
  await FullCard.verify({ unit })
  await FullCard.close()
  await FullCard.verify({})
})

test('Shows correct info for Medic effect', async () => {
  const client = new ApiClient({
    username: t.ctx.username,
  })
  const unit = await client.getUnit({
    name: 'Dun Banner Medic',
  })
  await DeckEditor.setFaction({
    faction: unit.faction,
  })
  await FullCard.verify({})
  await DeckEditor.openFullCard(unit.name)
  await FullCard.verify({ unit })
  await FullCard.close()
  await FullCard.verify({})
})

test('Shows correct info for Morale effect', async () => {
  const client = new ApiClient({
    username: t.ctx.username,
  })
  const unit = await client.getUnit({
    name: 'Milva',
  })
  await DeckEditor.setFaction({
    faction: unit.faction,
  })
  await FullCard.verify({})
  await DeckEditor.openFullCard(unit.name)
  await FullCard.verify({ unit })
  await FullCard.close()
  await FullCard.verify({})
})

test('Shows correct info for Muster effect', async () => {
  const client = new ApiClient({
    username: t.ctx.username,
  })
  const unit = await client.getUnit({
    name: 'Nekker',
  })
  await DeckEditor.setFaction({
    faction: unit.faction,
  })
  await FullCard.verify({})
  await DeckEditor.openFullCard(unit.name)
  await FullCard.verify({ unit })
  await FullCard.close()
  await FullCard.verify({})
})

test('Shows correct info for Scorch effect', async () => {
  const client = new ApiClient({
    username: t.ctx.username,
  })
  const unit = await client.getUnit({
    name: 'Toad',
  })
  await DeckEditor.setFaction({
    faction: unit.faction,
  })
  await FullCard.verify({})
  await DeckEditor.openFullCard(unit.name)
  await FullCard.verify({ unit })
  await FullCard.close()
  await FullCard.verify({})
})

test('Shows correct info for Scorch effect', async () => {
  const client = new ApiClient({
    username: t.ctx.username,
  })
  const unit = await client.getUnit({
    name: 'Sigismund Dijkstra',
  })
  await DeckEditor.setFaction({
    faction: unit.faction,
  })
  await FullCard.verify({})
  await DeckEditor.openFullCard(unit.name)
  await FullCard.verify({ unit })
  await FullCard.close()
  await FullCard.verify({})
})

test('Shows correct info for Biting Frost weather', async () => {
  const client = new ApiClient({
    username: t.ctx.username,
  })
  const unit = await client.getUnit({
    name: 'Biting Frost',
  })
  await DeckEditor.setFaction({
    faction: await client.getFaction({
      key: FactionKey.Monsters,
    }),
  })
  await FullCard.verify({})
  await DeckEditor.openFullCard(unit.name)
  await FullCard.verify({ unit })
  await FullCard.close()
  await FullCard.verify({})
})

test('Shows correct info for Clear Weather weather', async () => {
  const client = new ApiClient({
    username: t.ctx.username,
  })
  const unit = await client.getUnit({
    name: 'Clear Weather',
  })
  await DeckEditor.setFaction({
    faction: await client.getFaction({
      key: FactionKey.Monsters,
    }),
  })
  await FullCard.verify({})
  await DeckEditor.openFullCard(unit.name)
  await FullCard.verify({ unit })
  await FullCard.close()
  await FullCard.verify({})
})

test('Shows correct info for Impenetrable Fog weather', async () => {
  const client = new ApiClient({
    username: t.ctx.username,
  })
  const unit = await client.getUnit({
    name: 'Impenetrable Fog',
  })
  await DeckEditor.setFaction({
    faction: await client.getFaction({
      key: FactionKey.Monsters,
    }),
  })
  await FullCard.verify({})
  await DeckEditor.openFullCard(unit.name)
  await FullCard.verify({ unit })
  await FullCard.close()
  await FullCard.verify({})
})

test('Shows correct info for Skellige Storm weather', async () => {
  const client = new ApiClient({
    username: t.ctx.username,
  })
  const unit = await client.getUnit({
    name: 'Skellige Storm',
  })
  await DeckEditor.setFaction({
    faction: await client.getFaction({
      key: FactionKey.Monsters,
    }),
  })
  await FullCard.verify({})
  await DeckEditor.openFullCard(unit.name)
  await FullCard.verify({ unit })
  await FullCard.close()
  await FullCard.verify({})
})

test('Shows correct info for Torrential Rain weather', async () => {
  const client = new ApiClient({
    username: t.ctx.username,
  })
  const unit = await client.getUnit({
    name: 'Torrential Rain',
  })
  await DeckEditor.setFaction({
    faction: await client.getFaction({
      key: FactionKey.Monsters,
    }),
  })
  await FullCard.verify({})
  await DeckEditor.openFullCard(unit.name)
  await FullCard.verify({ unit })
  await FullCard.close()
  await FullCard.verify({})
})

test('Moving to previous and next units works for a deck card', async () => {
  const client = new ApiClient({
    username: t.ctx.username,
  })
  const previous = await client.getUnit({
    name: 'Endrega',
  })
  const unit = await client.getUnit({
    name: 'Fiend',
  })
  const next = await client.getUnit({
    name: 'Fire Elemental',
  })
  await DeckEditor.setFaction({
    faction: unit.faction,
  })
  await FullCard.verify({})
  await DeckEditor.openFullCard(unit.name)
  await FullCard.verify({ unit })
  await FullCard.next()
  await FullCard.verify({ unit: next })
  await FullCard.previous()
  await FullCard.verify({ unit })
  await FullCard.previous()
  await FullCard.verify({ unit: previous })
  await FullCard.close()
  await FullCard.verify({})
})

test('Can select card for deck', async () => {
  const client = new ApiClient({
    username: t.ctx.username,
  })
  const unit = await client.getUnit({
    name: 'Fiend',
  })
  const next = await client.getUnit({
    name: 'Fire Elemental',
  })
  await DeckEditor.setFaction({
    faction: unit.faction,
  })
  await DeckEditor.verify({
    faction: unit.faction,
  })
  await FullCard.verify({})
  await DeckEditor.openFullCard(unit.name)
  await FullCard.verify({ unit })
  await FullCard.select()
  await FullCard.verify({ unit: next })
  await FullCard.close()
  await FullCard.verify({})
  await DeckEditor.verify({
    faction: unit.faction,
    selectedUnits: [unit.name],
  })
})

test('Moving to previous and next units works for a game card', async () => {
  const client = new ApiClient({
    username: t.ctx.username,
  })
  const opponent = await client.addUser({
    name: `full-card-game-opponent-${t.ctx.start}`,
  })
  const deck = await client.addDeck({
    faction: FactionKey.Monsters,
    leaderName: 'Eredin Destroyer of Worlds',
    name: `full-card-game-${t.ctx.start}`,
    unitNames: [
      'Botchling',
      'Celaeno Harpy',
      'Crone Weavess',
      'Draug',
      'Forktail',
      'Gargoyle',
      'Ghoul',
      'Grave Hag',
      'Griffin',
      'Harpy',
      'Ice Giant',
      'Imlerith',
      'Kayran',
      'Leshen',
      'Nekker',
      'Plague Maiden',
      'Toad',
      'Vampire: Bruxa',
      'Vampire: Ekimmara',
      'Vampire: Fleder',
      'Vampire: Garkain',
      'Vampire: Katakan',
    ],
  })
  const game = await client.addGame([opponent.name])
  const gameDeck = await client.setDeck({
    deckId: deck.id,
    gameId: game.id,
  })
  await E2eUtil.goTo(GamePage.getUrl(game.id))
  const sortedHand = sortObjectArray({
    sortProperties: ['unit.strength', 'unit.id'],
    array: gameDeck.hand,
  })
  const previous = sortedHand[0].unit
  const unit = sortedHand[1].unit
  const next = sortedHand[2].unit
  await FullCard.verify({})
  await GamePage.openFullCard(unit.name)
  await FullCard.verify({ unit })
  await FullCard.next()
  await FullCard.verify({ unit: next })
  await FullCard.previous()
  await FullCard.verify({ unit })
  await FullCard.previous()
  await FullCard.verify({ unit: previous })
  await FullCard.close()
  await FullCard.verify({})
})
