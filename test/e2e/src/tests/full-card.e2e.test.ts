import ApiClient from '../util/api-client'
import { Combat, FactionKey, User } from '@gwent/graphql-schema/resolver-typings'
import DeckEditor from '../components/deck-editor'
import DeckPage from '../page-objects/deck-page'
import { E2eCtx, getFixtureCtx, getTestCtx } from '../util/e2e-ctx'
import { E2eHelper } from '../util/e2e-helper'
import E2eUtil from '../util/e2e-util'
import FullCard from '../components/full-card'
import GamePage, { HistoryMove, HistoryPass } from '../page-objects/game-page'
import LoginPage from '../page-objects/login-page'
import { PlayerTurn } from '../components/game-player-info'
import { sortObjectArray } from '@gwent/utils'

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

test('Can select card for deck', async (t) => {
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
  const client = new ApiClient({
    username: t.ctx.user.name,
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
  await GamePage.fullscreenHandCard(unit.name)
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

test('Moving to previous and next units works for a combat row card', async (t) => {
  const clientSelf = new ApiClient({
    username: t.ctx.user.name,
  })
  const opponent = await clientSelf.addUser({
    name: `${t.ctx.scenario}-opponent-${t.ctx.start}`,
  })
  const clientOpponent = new ApiClient({
    username: opponent.name,
  })
  const game = await clientSelf.addGame([opponent.name])

  const deckSelf = await clientSelf.addDeck({
    faction: FactionKey.ScoiaTael,
    leaderName: 'Francesca Findabair the Beautiful',
    name: `${t.ctx.scenario}-self-deck-${Date.now()}`,
    unitNames: [
      'Barclay Els',
      'Ciaran aep Easnillien',
      'Dennis Cranmer',
      'Dol Blathanna Archer',
      'Dol Blathanna Scout',
      'Eithne',
      'Emiel Regis Rohellec Terzieff',
      'Filavandrel aen Fidhail',
      'Ida Emean aep Sivney',
      'Iorveth',
      'Mahakaman Defender',
      'Mahakaman Defender',
      'Riordain',
      'Roach',
      'Saesenthessis',
      'Toruviel',
      'Triss Merigold',
      'Vesemir',
      'Vrihedd Brigade Recruit',
      'Vrihedd Brigade Veteran',
      'Yaevinn',
      'Zoltan Chivay',
    ],
  })
  const deckOpponent = await clientOpponent.addDeck({
    faction: FactionKey.NilfgaardianEmpire,
    leaderName: 'Emhyr var Emreis the Relentless',
    name: `${t.ctx.scenario}-opponent-deck-${Date.now()}`,
    unitNames: [
      'Albrich',
      'Assire var Anahid',
      'Black Infantry Archer',
      'Cahir Mawr Dyffryn aep Ceallach',
      'Cynthia',
      'Emiel Regis Rohellec Terzieff',
      'Fringilla Vigo',
      'Heavy Zerrikanian Fire Scorpion',
      'Letho of Gulet',
      'Morteisen',
      'Morvran Voorhis',
      'Puttkammer',
      'Renuald aep Matsen',
      'Roach',
      'Siege Engineer',
      'Sweers',
      'Tibor Eggebracht',
      'Triss Merigold',
      'Vanhemar',
      'Vesemir',
      'Vreemde',
      'Zerrikanian Fire Scorpion',
    ],
  })
  const gameDeckSelf = await clientSelf.setDeck({
    deckId: deckSelf.id,
    gameId: game.id,
  })
  const gameDeckOpponent = await clientOpponent.setDeck({
    deckId: deckOpponent.id,
    gameId: game.id,
  })
  await clientSelf.setOrder({
    gameId: game.id,
    userIds: [t.ctx.user.id, opponent.id],
  })
  await clientSelf.ready(game.id)
  await clientOpponent.ready(game.id)

  const gamePlayerSelf = E2eHelper.getGamePlayer({
    player: {
      user: t.ctx.user,
      client: clientSelf,
      deck: deckSelf,
      gameDeck: gameDeckSelf,
    },
    ready: true,
    score: 0,
    passed: false,
    turn: PlayerTurn.Current,
  })
  const gamePlayerOpponent = E2eHelper.getGamePlayer({
    player: {
      user: opponent,
      client: clientOpponent,
      deck: deckOpponent,
      gameDeck: gameDeckOpponent,
    },
    ready: true,
    score: 0,
    passed: undefined,
    turn: undefined,
  })
  const moves: (HistoryMove | HistoryPass)[] = []

  await E2eUtil.goTo(GamePage.getUrl(game.id))
  await GamePage.verify({
    self: gamePlayerSelf,
    opponent: gamePlayerOpponent,
    hand: gameDeckSelf.hand,
    moves: [moves],
  })

  const sortedHand = sortObjectArray({
    sortProperties: ['unit.strength', 'unit.id'],
    array: gameDeckSelf.hand,
  })
  const sortedCloseCards = sortedHand.filter((card) => card.unit.combats && card.unit.combats.includes(Combat.Close))
  if (sortedCloseCards.length < 3) {
    throw Error('Not enough Close combat cards for test')
  }

  await GamePage.moveUnit({
    unitName: sortedCloseCards[0].unit.name,
    row: Combat.Close,
  })
  E2eHelper.playUnit({
    player: gamePlayerSelf,
    gameDeck: gameDeckSelf,
    deckUnit: sortedCloseCards[0],
    row: Combat.Close,
    moves,
  })
  gamePlayerSelf.turn = undefined
  gamePlayerOpponent.turn = PlayerTurn.Current

  await clientOpponent.playPass({
    gameId: game.id,
  })
  moves.push({
    userName: opponent.name,
    round: 1,
  })
  gamePlayerSelf.turn = PlayerTurn.Current
  gamePlayerOpponent.turn = undefined
  gamePlayerOpponent.passed = true

  await GamePage.moveUnit({
    unitName: sortedCloseCards[1].unit.name,
    row: Combat.Close,
  })
  E2eHelper.playUnit({
    player: gamePlayerSelf,
    gameDeck: gameDeckSelf,
    deckUnit: sortedCloseCards[1],
    row: Combat.Close,
    moves,
  })

  await GamePage.moveUnit({
    unitName: sortedCloseCards[2].unit.name,
    row: Combat.Close,
  })
  E2eHelper.playUnit({
    player: gamePlayerSelf,
    gameDeck: gameDeckSelf,
    deckUnit: sortedCloseCards[2],
    row: Combat.Close,
    moves,
  })

  await GamePage.verify({
    self: gamePlayerSelf,
    opponent: gamePlayerOpponent,
    hand: gameDeckSelf.hand,
    moves: [moves],
  })

  const previous = sortedCloseCards[0].unit
  const unit = sortedCloseCards[1].unit
  const next = sortedCloseCards[2].unit
  await FullCard.verify({})
  await GamePage.fullscreenCombatCard({
    unitName: unit.name,
    row: Combat.Close,
    self: true,
  })
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
