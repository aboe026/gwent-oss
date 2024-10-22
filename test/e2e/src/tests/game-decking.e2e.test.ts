import ApiClient from '../util/api-client'
import DeckEditor from '../components/deck-editor'
import DeckList from '../components/deck-list'
import { Deck, Faction, FactionKey, Game, Leader } from '@gwent/graphql-schema/resolver-typings'
import { E2eCtx, getFixtureCtx, getTestCtx } from '../util/e2e-ctx'
import E2eUtil from '../util/e2e-util'
import GamePage from '../page-objects/game-page'
import HomePage from '../page-objects/home-page'
import LoginPage from '../page-objects/login-page'
import { sortObjectArray } from '@gwent/utils'
import { STARTING_HAND_SIZE } from '@gwent/constants'

interface GameDeckingTestCtx extends E2eCtx {
  username: string
  opponent: string
  deckName1: string
  deckName2: string
  faction1: Faction
  faction2: Faction
  leader1: Leader
  leader2: Leader
  deck1: Deck
  deck2: Deck
  game: Game
}
const fixture = getFixtureCtx<E2eCtx, GameDeckingTestCtx>()
const test = getTestCtx<E2eCtx, GameDeckingTestCtx>()

fixture('Game Decking')
  .page(HomePage.getUrl())
  .beforeEach(async (t) => {
    const scenario = 'game-decking'
    t.ctx.username = `${scenario}-self-${t.ctx.start}`
    t.ctx.opponent = `${scenario}-opponent-${t.ctx.start}`
    t.ctx.deckName1 = `${scenario}-deck-self-${t.ctx.start}`
    t.ctx.deckName2 = `${scenario}-deck-opponent-${t.ctx.start}`
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
    await new ApiClient({}).addUser({
      name: t.ctx.opponent,
    })
    const client1 = new ApiClient({
      username: t.ctx.username,
    })
    t.ctx.faction1 = await client1.getFaction({
      key: faction1,
      neutrals: true,
    })
    t.ctx.leader1 = await client1.getLeader({
      faction: faction1,
      name: leader1,
    })
    t.ctx.deck1 = await client1.addDeck({
      faction: faction1,
      leaderName: leader1,
      name: t.ctx.deckName1,
      unitNames: units1,
    })
    const client2 = new ApiClient({
      username: t.ctx.opponent,
    })
    t.ctx.faction2 = await client2.getFaction({
      key: faction2,
      neutrals: true,
    })
    t.ctx.leader2 = await client2.getLeader({
      faction: faction2,
      name: leader2,
    })
    t.ctx.deck2 = await client2.addDeck({
      faction: faction2,
      leaderName: leader2,
      name: t.ctx.deckName2,
      unitNames: units2,
    })
    t.ctx.game = await client1.addGame([t.ctx.opponent])
    await LoginPage.login({
      username: t.ctx.username,
    })
  })

test('Ready before opponent shows loading message until opponent ready', async (t) => {
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  await GamePage.verify({
    opponent: {
      name: t.ctx.opponent,
    },
    self: {
      name: t.ctx.username,
    },
  })
  await GamePage.setDeck({
    created: t.ctx.deck1.created,
    faction: t.ctx.deck1.faction,
    leader: t.ctx.deck1.leader,
    name: t.ctx.deck1.name,
    stats: t.ctx.deck1.stats,
  })
  const client1 = new ApiClient({
    username: t.ctx.username,
  })
  const gameDeck = await client1.getGameDeck(t.ctx.game.id)
  await GamePage.verify({
    opponent: {
      name: t.ctx.opponent,
    },
    self: {
      name: t.ctx.username,
      discard: 0,
      faction: t.ctx.deck1.faction,
      leader: t.ctx.deck1.leader,
      hand: STARTING_HAND_SIZE,
      undrawn: t.ctx.deck1.units.length - STARTING_HAND_SIZE,
      from: gameDeck.from,
    },
    hand: sortObjectArray({
      sortProperties: ['unit.strength', 'unit.id'],
      array: gameDeck.hand,
    }).map((deckUnit) => deckUnit.unit.name),
  })
  await GamePage.ready()
  await GamePage.verify({
    opponent: {
      name: t.ctx.opponent,
    },
    self: {
      name: t.ctx.username,
      discard: 0,
      faction: t.ctx.deck1.faction,
      leader: t.ctx.deck1.leader,
      hand: STARTING_HAND_SIZE,
      undrawn: t.ctx.deck1.units.length - STARTING_HAND_SIZE,
      ready: true,
      from: gameDeck.from,
    },
    hand: sortObjectArray({
      sortProperties: ['unit.strength', 'unit.id'],
      array: gameDeck.hand,
    }).map((deckUnit) => deckUnit.unit.name),
  })
  const client2 = new ApiClient({
    username: t.ctx.opponent,
  })
  await client2.setDeck({
    deckId: t.ctx.deck2.id,
    gameId: t.ctx.game.id,
  })
  await client2.ready(t.ctx.game.id)
  await GamePage.verify({
    opponent: {
      name: t.ctx.opponent,
      discard: 0,
      faction: t.ctx.deck2.faction,
      leader: t.ctx.deck2.leader,
      hand: STARTING_HAND_SIZE,
      undrawn: t.ctx.deck2.units.length - STARTING_HAND_SIZE,
      ready: true,
    },
    self: {
      name: t.ctx.username,
      discard: 0,
      faction: t.ctx.deck1.faction,
      leader: t.ctx.deck1.leader,
      hand: STARTING_HAND_SIZE,
      undrawn: t.ctx.deck1.units.length - STARTING_HAND_SIZE,
      ready: true,
      from: gameDeck.from,
    },
    hand: sortObjectArray({
      sortProperties: ['unit.strength', 'unit.id'],
      array: gameDeck.hand,
    }).map((deckUnit) => deckUnit.unit.name),
  })
})

test('Ready after opponent enters playing', async (t) => {
  const client2 = new ApiClient({
    username: t.ctx.opponent,
  })
  await client2.setDeck({
    deckId: t.ctx.deck2.id,
    gameId: t.ctx.game.id,
  })
  await client2.ready(t.ctx.game.id)
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  await GamePage.verify({
    opponent: {
      name: t.ctx.opponent,
    },
    self: {
      name: t.ctx.username,
    },
  })
  await GamePage.setDeck({
    created: t.ctx.deck1.created,
    faction: t.ctx.deck1.faction,
    leader: t.ctx.deck1.leader,
    name: t.ctx.deck1.name,
    stats: t.ctx.deck1.stats,
  })
  const client1 = new ApiClient({
    username: t.ctx.username,
  })
  const gameDeck = await client1.getGameDeck(t.ctx.game.id)
  await GamePage.verify({
    opponent: {
      name: t.ctx.opponent,
    },
    self: {
      name: t.ctx.username,
      discard: 0,
      faction: t.ctx.deck1.faction,
      leader: t.ctx.deck1.leader,
      hand: STARTING_HAND_SIZE,
      undrawn: t.ctx.deck1.units.length - STARTING_HAND_SIZE,
      from: gameDeck.from,
    },
    hand: sortObjectArray({
      sortProperties: ['unit.strength', 'unit.id'],
      array: gameDeck.hand,
    }).map((deckUnit) => deckUnit.unit.name),
  })
  await GamePage.ready()
  await GamePage.verify({
    opponent: {
      name: t.ctx.opponent,
      discard: 0,
      faction: t.ctx.deck2.faction,
      leader: t.ctx.deck2.leader,
      hand: STARTING_HAND_SIZE,
      undrawn: t.ctx.deck2.units.length - STARTING_HAND_SIZE,
      ready: true,
    },
    self: {
      name: t.ctx.username,
      discard: 0,
      faction: t.ctx.deck1.faction,
      leader: t.ctx.deck1.leader,
      hand: STARTING_HAND_SIZE,
      undrawn: t.ctx.deck1.units.length - STARTING_HAND_SIZE,
      ready: true,
      from: gameDeck.from,
    },
    hand: sortObjectArray({
      sortProperties: ['unit.strength', 'unit.id'],
      array: gameDeck.hand,
    }).map((deckUnit) => deckUnit.unit.name),
  })
})

test('Can set ready after redrawing 1 card', async (t) => {
  const client2 = new ApiClient({
    username: t.ctx.opponent,
  })
  await client2.setDeck({
    deckId: t.ctx.deck2.id,
    gameId: t.ctx.game.id,
  })
  await client2.ready(t.ctx.game.id)
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  await GamePage.verify({
    opponent: {
      name: t.ctx.opponent,
    },
    self: {
      name: t.ctx.username,
    },
  })
  await GamePage.setDeck({
    created: t.ctx.deck1.created,
    faction: t.ctx.deck1.faction,
    leader: t.ctx.deck1.leader,
    name: t.ctx.deck1.name,
    stats: t.ctx.deck1.stats,
  })
  const client1 = new ApiClient({
    username: t.ctx.username,
  })
  const gameDeck = await client1.getGameDeck(t.ctx.game.id)
  await GamePage.verify({
    opponent: {
      name: t.ctx.opponent,
    },
    self: {
      name: t.ctx.username,
      discard: 0,
      faction: t.ctx.deck1.faction,
      leader: t.ctx.deck1.leader,
      hand: STARTING_HAND_SIZE,
      undrawn: t.ctx.deck1.units.length - STARTING_HAND_SIZE,
      from: gameDeck.from,
    },
    hand: sortObjectArray({
      sortProperties: ['unit.strength', 'unit.id'],
      array: gameDeck.hand,
    }).map((deckUnit) => deckUnit.unit.name),
    redraws: [],
  })
  const unitToRedraw = gameDeck.hand[0].unit.name
  await GamePage.redraw(unitToRedraw)
  const redrawnGameDeck = await client1.getGameDeck(t.ctx.game.id)
  await GamePage.verify({
    opponent: {
      name: t.ctx.opponent,
    },
    self: {
      name: t.ctx.username,
      discard: 0,
      faction: t.ctx.deck1.faction,
      leader: t.ctx.deck1.leader,
      hand: STARTING_HAND_SIZE,
      undrawn: t.ctx.deck1.units.length - STARTING_HAND_SIZE,
      from: gameDeck.from,
    },
    hand: sortObjectArray({
      sortProperties: ['unit.strength', 'unit.id'],
      array: redrawnGameDeck.hand,
    }).map((deckUnit) => deckUnit.unit.name),
    redraws: [
      {
        from: unitToRedraw,
        to: redrawnGameDeck.redraws[0].to.unit.name,
      },
    ],
  })
  await GamePage.ready()
  await GamePage.verify({
    opponent: {
      name: t.ctx.opponent,
      discard: 0,
      faction: t.ctx.deck2.faction,
      leader: t.ctx.deck2.leader,
      hand: STARTING_HAND_SIZE,
      undrawn: t.ctx.deck2.units.length - STARTING_HAND_SIZE,
      ready: true,
    },
    self: {
      name: t.ctx.username,
      discard: 0,
      faction: t.ctx.deck1.faction,
      leader: t.ctx.deck1.leader,
      hand: STARTING_HAND_SIZE,
      undrawn: t.ctx.deck1.units.length - STARTING_HAND_SIZE,
      ready: true,
      from: gameDeck.from,
    },
    hand: sortObjectArray({
      sortProperties: ['unit.strength', 'unit.id'],
      array: redrawnGameDeck.hand,
    }).map((deckUnit) => deckUnit.unit.name),
  })
})

test('Can set ready after redrawing 2 cards', async (t) => {
  const client2 = new ApiClient({
    username: t.ctx.opponent,
  })
  await client2.setDeck({
    deckId: t.ctx.deck2.id,
    gameId: t.ctx.game.id,
  })
  await client2.ready(t.ctx.game.id)
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  await GamePage.verify({
    opponent: {
      name: t.ctx.opponent,
    },
    self: {
      name: t.ctx.username,
    },
  })
  await GamePage.setDeck({
    created: t.ctx.deck1.created,
    faction: t.ctx.deck1.faction,
    leader: t.ctx.deck1.leader,
    name: t.ctx.deck1.name,
    stats: t.ctx.deck1.stats,
  })
  const client1 = new ApiClient({
    username: t.ctx.username,
  })
  const gameDeck = await client1.getGameDeck(t.ctx.game.id)
  await GamePage.verify({
    opponent: {
      name: t.ctx.opponent,
    },
    self: {
      name: t.ctx.username,
      discard: 0,
      faction: t.ctx.deck1.faction,
      leader: t.ctx.deck1.leader,
      hand: STARTING_HAND_SIZE,
      undrawn: t.ctx.deck1.units.length - STARTING_HAND_SIZE,
      from: gameDeck.from,
    },
    hand: sortObjectArray({
      sortProperties: ['unit.strength', 'unit.id'],
      array: gameDeck.hand,
    }).map((deckUnit) => deckUnit.unit.name),
    redraws: [],
  })
  const unitToRedraw1 = gameDeck.hand[0].unit.name
  await GamePage.redraw(unitToRedraw1)
  const redrawnGameDeck1 = await client1.getGameDeck(t.ctx.game.id)
  await GamePage.verify({
    opponent: {
      name: t.ctx.opponent,
    },
    self: {
      name: t.ctx.username,
      discard: 0,
      faction: t.ctx.deck1.faction,
      leader: t.ctx.deck1.leader,
      hand: STARTING_HAND_SIZE,
      undrawn: t.ctx.deck1.units.length - STARTING_HAND_SIZE,
      from: gameDeck.from,
    },
    hand: sortObjectArray({
      sortProperties: ['unit.strength', 'unit.id'],
      array: redrawnGameDeck1.hand,
    }).map((deckUnit) => deckUnit.unit.name),
    redraws: [
      {
        from: unitToRedraw1,
        to: redrawnGameDeck1.redraws[0].to.unit.name,
      },
    ],
  })
  const unitToRedraw2 = gameDeck.hand[gameDeck.hand.length - 1].unit.name
  await GamePage.redraw(unitToRedraw2)
  const redrawnGameDeck2 = await client1.getGameDeck(t.ctx.game.id)
  await GamePage.verify({
    opponent: {
      name: t.ctx.opponent,
    },
    self: {
      name: t.ctx.username,
      discard: 0,
      faction: t.ctx.deck1.faction,
      leader: t.ctx.deck1.leader,
      hand: STARTING_HAND_SIZE,
      undrawn: t.ctx.deck1.units.length - STARTING_HAND_SIZE,
      from: gameDeck.from,
    },
    hand: sortObjectArray({
      sortProperties: ['unit.strength', 'unit.id'],
      array: redrawnGameDeck2.hand,
    }).map((deckUnit) => deckUnit.unit.name),
    redraws: [
      {
        from: unitToRedraw1,
        to: redrawnGameDeck1.redraws[0].to.unit.name,
      },
      {
        from: unitToRedraw2,
        to: redrawnGameDeck2.redraws[1].to.unit.name,
      },
    ],
  })
  await GamePage.ready()
  await GamePage.verify({
    opponent: {
      name: t.ctx.opponent,
      discard: 0,
      faction: t.ctx.deck2.faction,
      leader: t.ctx.deck2.leader,
      hand: STARTING_HAND_SIZE,
      undrawn: t.ctx.deck2.units.length - STARTING_HAND_SIZE,
      ready: true,
    },
    self: {
      name: t.ctx.username,
      discard: 0,
      faction: t.ctx.deck1.faction,
      leader: t.ctx.deck1.leader,
      hand: STARTING_HAND_SIZE,
      undrawn: t.ctx.deck1.units.length - STARTING_HAND_SIZE,
      ready: true,
      from: gameDeck.from,
    },
    hand: sortObjectArray({
      sortProperties: ['unit.strength', 'unit.id'],
      array: redrawnGameDeck2.hand,
    }).map((deckUnit) => deckUnit.unit.name),
  })
})

test('Cancel on decks list closes decks dialog and remains on game page', async (t) => {
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  await GamePage.verify({
    opponent: {
      name: t.ctx.opponent,
    },
    self: {
      name: t.ctx.username,
    },
  })
  await GamePage.clickSetDeck()
  await DeckList.close()

  await GamePage.verify({
    opponent: {
      name: t.ctx.opponent,
    },
    self: {
      name: t.ctx.username,
    },
  })
})

test('Cancel on deck create closes decks dialog and remains on game page', async (t) => {
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  await GamePage.verify({
    opponent: {
      name: t.ctx.opponent,
    },
    self: {
      name: t.ctx.username,
    },
  })
  await GamePage.clickSetDeck()
  await DeckList.clickCreate()

  await DeckEditor.cancel()

  await GamePage.verify({
    opponent: {
      name: t.ctx.opponent,
    },
    self: {
      name: t.ctx.username,
    },
  })
})

test('Refresh button updates page after deck chosen via API', async (t) => {
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  await GamePage.verify({
    opponent: {
      name: t.ctx.opponent,
    },
    self: {
      name: t.ctx.username,
    },
  })
  const client = new ApiClient({
    username: t.ctx.username,
  })
  const gameDeck = await client.setDeck({
    deckId: t.ctx.deck1.id,
    gameId: t.ctx.game.id,
  })
  await GamePage.verify({
    opponent: {
      name: t.ctx.opponent,
    },
    self: {
      name: t.ctx.username,
    },
  })
  await GamePage.refresh()
  await GamePage.verify({
    opponent: {
      name: t.ctx.opponent,
    },
    self: {
      name: t.ctx.username,
      discard: 0,
      faction: t.ctx.deck1.faction,
      leader: t.ctx.deck1.leader,
      hand: STARTING_HAND_SIZE,
      undrawn: t.ctx.deck1.units.length - STARTING_HAND_SIZE,
      from: gameDeck.from,
    },
    hand: sortObjectArray({
      sortProperties: ['unit.strength', 'unit.id'],
      array: gameDeck.hand,
    }).map((deckUnit) => deckUnit.unit.name),
  })
})

test('Refresh button updates page after game ready via API', async (t) => {
  const client = new ApiClient({
    username: t.ctx.username,
  })
  const gameDeck = await client.setDeck({
    deckId: t.ctx.deck1.id,
    gameId: t.ctx.game.id,
  })
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  await GamePage.verify({
    opponent: {
      name: t.ctx.opponent,
    },
    self: {
      name: t.ctx.username,
      discard: 0,
      faction: t.ctx.deck1.faction,
      leader: t.ctx.deck1.leader,
      hand: STARTING_HAND_SIZE,
      undrawn: t.ctx.deck1.units.length - STARTING_HAND_SIZE,
      from: gameDeck.from,
    },
    hand: sortObjectArray({
      sortProperties: ['unit.strength', 'unit.id'],
      array: gameDeck.hand,
    }).map((deckUnit) => deckUnit.unit.name),
  })
  await client.ready(t.ctx.game.id)
  await GamePage.verify({
    opponent: {
      name: t.ctx.opponent,
    },
    self: {
      name: t.ctx.username,
      discard: 0,
      faction: t.ctx.deck1.faction,
      leader: t.ctx.deck1.leader,
      hand: STARTING_HAND_SIZE,
      undrawn: t.ctx.deck1.units.length - STARTING_HAND_SIZE,
      from: gameDeck.from,
    },
    hand: sortObjectArray({
      sortProperties: ['unit.strength', 'unit.id'],
      array: gameDeck.hand,
    }).map((deckUnit) => deckUnit.unit.name),
  })
  await GamePage.refresh()
  await GamePage.verify({
    opponent: {
      name: t.ctx.opponent,
    },
    self: {
      name: t.ctx.username,
      discard: 0,
      faction: t.ctx.deck1.faction,
      leader: t.ctx.deck1.leader,
      hand: STARTING_HAND_SIZE,
      undrawn: t.ctx.deck1.units.length - STARTING_HAND_SIZE,
      from: gameDeck.from,
      ready: true,
    },
    hand: sortObjectArray({
      sortProperties: ['unit.strength', 'unit.id'],
      array: gameDeck.hand,
    }).map((deckUnit) => deckUnit.unit.name),
  })
})

test('Game not marked as ready if use API to mark other game as ready', async (t) => {
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  await GamePage.verify({
    opponent: {
      name: t.ctx.opponent,
    },
    self: {
      name: t.ctx.username,
    },
  })
  await GamePage.setDeck({
    created: t.ctx.deck1.created,
    faction: t.ctx.deck1.faction,
    leader: t.ctx.deck1.leader,
    name: t.ctx.deck1.name,
    stats: t.ctx.deck1.stats,
  })
  const client1 = new ApiClient({
    username: t.ctx.username,
  })
  const game2 = await client1.addGame([t.ctx.opponent])
  await client1.setDeck({
    deckId: t.ctx.deck1.id,
    gameId: game2.id,
  })
  await client1.ready(game2.id)
  const gameDeck = await client1.getGameDeck(t.ctx.game.id)
  await GamePage.verify({
    opponent: {
      name: t.ctx.opponent,
    },
    self: {
      name: t.ctx.username,
      discard: 0,
      faction: t.ctx.deck1.faction,
      leader: t.ctx.deck1.leader,
      hand: STARTING_HAND_SIZE,
      undrawn: t.ctx.deck1.units.length - STARTING_HAND_SIZE,
      from: gameDeck.from,
    },
    hand: sortObjectArray({
      sortProperties: ['unit.strength', 'unit.id'],
      array: gameDeck.hand,
    }).map((deckUnit) => deckUnit.unit.name),
  })
  await GamePage.ready()
  await GamePage.verify({
    opponent: {
      name: t.ctx.opponent,
    },
    self: {
      name: t.ctx.username,
      discard: 0,
      faction: t.ctx.deck1.faction,
      leader: t.ctx.deck1.leader,
      hand: STARTING_HAND_SIZE,
      undrawn: t.ctx.deck1.units.length - STARTING_HAND_SIZE,
      ready: true,
      from: gameDeck.from,
    },
    hand: sortObjectArray({
      sortProperties: ['unit.strength', 'unit.id'],
      array: gameDeck.hand,
    }).map((deckUnit) => deckUnit.unit.name),
  })
  const client2 = new ApiClient({
    username: t.ctx.opponent,
  })
  await client2.setDeck({
    deckId: t.ctx.deck2.id,
    gameId: game2.id,
  })
  await client2.ready(game2.id)
  await GamePage.verify({
    opponent: {
      name: t.ctx.opponent,
    },
    self: {
      name: t.ctx.username,
      discard: 0,
      faction: t.ctx.deck1.faction,
      leader: t.ctx.deck1.leader,
      hand: STARTING_HAND_SIZE,
      undrawn: t.ctx.deck1.units.length - STARTING_HAND_SIZE,
      ready: true,
      from: gameDeck.from,
    },
    hand: sortObjectArray({
      sortProperties: ['unit.strength', 'unit.id'],
      array: gameDeck.hand,
    }).map((deckUnit) => deckUnit.unit.name),
  })
})
