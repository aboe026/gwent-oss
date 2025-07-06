import ApiClient from '../util/api-client'
import createGameManager from '../util/game-manager'
import { Combat, FactionKey, User } from '@gwent/graphql-schema/resolver-typings'
import DeckEditor from '../components/deck-editor'
import DeckPage from '../page-objects/deck-page'
import { E2eCtx, getFixtureCtx, getScenario, getTestCtx } from '../util/e2e-ctx'
import FullCard from '../components/full-card'
import GamePage from '../page-objects/game-page'
import LoginPage from '../page-objects/login-page'

interface FullCardTestCtx extends E2eCtx {
  scenario: string
  user: User
}
const fixture = getFixtureCtx<E2eCtx, FullCardTestCtx>()
const test = getTestCtx<E2eCtx, FullCardTestCtx>()

fixture('Full Card')
  .page(DeckPage.getUrl())
  .beforeEach(async (t) => {
    t.ctx.scenario = 'full-card'
    t.ctx.user = await new ApiClient({}).addUser({
      name: `${t.ctx.scenario}-self-${t.ctx.start}`,
    })
    await LoginPage.login({
      username: t.ctx.user.name,
    })
  })

test('Shows correct info for Monster faction', async (t) => {
  const client = new ApiClient({
    username: t.ctx.user.name,
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

test('Shows correct info for Nilfgaardian Empire faction', async (t) => {
  const client = new ApiClient({
    username: t.ctx.user.name,
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

test('Shows correct info for Northern Realms faction', async (t) => {
  const client = new ApiClient({
    username: t.ctx.user.name,
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

test('Shows correct info for Scoiatael faction', async (t) => {
  const client = new ApiClient({
    username: t.ctx.user.name,
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

test('Shows correct info for Skellige faction', async (t) => {
  const client = new ApiClient({
    username: t.ctx.user.name,
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

test('Shows correct info for Neutral faction', async (t) => {
  const client = new ApiClient({
    username: t.ctx.user.name,
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

test('Shows correct info for special', async (t) => {
  const client = new ApiClient({
    username: t.ctx.user.name,
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

test('Shows correct info for hero', async (t) => {
  const client = new ApiClient({
    username: t.ctx.user.name,
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

test('Shows correct info for alternative art', async (t) => {
  const client = new ApiClient({
    username: t.ctx.user.name,
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

test('Shows correct info for Hearts of Stone dlc', async (t) => {
  const client = new ApiClient({
    username: t.ctx.user.name,
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

test('Shows correct info for Blood and Wine dlc', async (t) => {
  const client = new ApiClient({
    username: t.ctx.user.name,
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

test('Shows correct info for Gwent the Witcher Card Game dlc', async (t) => {
  const client = new ApiClient({
    username: t.ctx.user.name,
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

test('Shows correct info for Agile effect', async (t) => {
  const client = new ApiClient({
    username: t.ctx.user.name,
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

test('Shows correct info for Avenger effect', async (t) => {
  const client = new ApiClient({
    username: t.ctx.user.name,
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

test('Shows correct info for Avenger effect', async (t) => {
  const client = new ApiClient({
    username: t.ctx.user.name,
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

test('Shows correct info for Bond effect', async (t) => {
  const client = new ApiClient({
    username: t.ctx.user.name,
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

test('Shows correct info for Decoy effect', async (t) => {
  const client = new ApiClient({
    username: t.ctx.user.name,
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

test('Shows correct info for Horn effect', async (t) => {
  const client = new ApiClient({
    username: t.ctx.user.name,
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

test('Shows correct info for Mardroeme effect', async (t) => {
  const client = new ApiClient({
    username: t.ctx.user.name,
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

test('Shows correct info for Medic effect', async (t) => {
  const client = new ApiClient({
    username: t.ctx.user.name,
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

test('Shows correct info for Morale effect', async (t) => {
  const client = new ApiClient({
    username: t.ctx.user.name,
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

test('Shows correct info for Muster effect', async (t) => {
  const client = new ApiClient({
    username: t.ctx.user.name,
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

test('Shows correct info for Scorch effect', async (t) => {
  const client = new ApiClient({
    username: t.ctx.user.name,
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

test('Shows correct info for Scorch effect', async (t) => {
  const client = new ApiClient({
    username: t.ctx.user.name,
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

test('Shows correct info for Biting Frost weather', async (t) => {
  const client = new ApiClient({
    username: t.ctx.user.name,
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

test('Shows correct info for Clear Weather weather', async (t) => {
  const client = new ApiClient({
    username: t.ctx.user.name,
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

test('Shows correct info for Impenetrable Fog weather', async (t) => {
  const client = new ApiClient({
    username: t.ctx.user.name,
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

test('Shows correct info for Skellige Storm weather', async (t) => {
  const client = new ApiClient({
    username: t.ctx.user.name,
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

test('Shows correct info for Torrential Rain weather', async (t) => {
  const client = new ApiClient({
    username: t.ctx.user.name,
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

test('Moving to previous and next units works for a deck card', async (t) => {
  const client = new ApiClient({
    username: t.ctx.user.name,
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

test('Select card for deck', async (t) => {
  const client = new ApiClient({
    username: t.ctx.user.name,
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

test('Moving to previous and next units works for a hand card', async (t) => {
  const unitName1 = 'Ciaran aep Easnillien'
  const unitName2 = 'Dennis Cranmer'
  const unitName3 = 'Yaevinn'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [
        'Riordain',
        unitName1,
        unitName2,
        unitName3,
        'Yennefer of Vengerberg',
        'Eithne',
        'Iorveth',
        'Isengrim Faoiltiarna',
        'Milva',
        'Saesenthessis',
      ],
    },
  })
  await gameManager.initialize({})

  await FullCard.verify({})
  await GamePage.fullscreenHandCard(unitName2)
  await FullCard.verify({
    unit: gameManager.getHandUnit({
      name: unitName2,
    }).unit,
    username: gameManager.self.gamePlayer.name,
  })
  await FullCard.next()
  await FullCard.verify({
    unit: gameManager.getHandUnit({
      name: unitName3,
    }).unit,
    username: gameManager.self.gamePlayer.name,
  })
  await FullCard.previous()
  await FullCard.verify({
    unit: gameManager.getHandUnit({
      name: unitName2,
    }).unit,
    username: gameManager.self.gamePlayer.name,
  })
  await FullCard.previous()
  await FullCard.verify({
    unit: gameManager.getHandUnit({
      name: unitName1,
    }).unit,
    username: gameManager.self.gamePlayer.name,
  })
  await FullCard.close()
  await FullCard.verify({})
})

test('Moving to previous and next units works for a combat row card', async (t) => {
  const unitName1 = 'Ciaran aep Easnillien'
  const unitName2 = 'Dennis Cranmer'
  const unitName3 = 'Yaevinn'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1, unitName2, unitName3],
    },
  })
  const unit1 = await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({})
  const unit2 = await gameManager.deploy({ unitName: unitName2 })
  const unit3 = await gameManager.deploy({ unitName: unitName3 })
  await gameManager.initialize({})

  await FullCard.verify({})
  await GamePage.fullscreenCombatCard({
    unitName: unitName2,
    row: Combat.Close,
    self: true,
  })
  await FullCard.verify({ unit: unit2.unit, username: gameManager.self.gamePlayer.name })
  await FullCard.next()
  await FullCard.verify({ unit: unit3.unit, username: gameManager.self.gamePlayer.name })
  await FullCard.previous()
  await FullCard.verify({ unit: unit2.unit, username: gameManager.self.gamePlayer.name })
  await FullCard.previous()
  await FullCard.verify({ unit: unit1.unit, username: gameManager.self.gamePlayer.name })
  await FullCard.close()
  await FullCard.verify({})
})
