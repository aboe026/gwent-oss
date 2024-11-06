import ApiClient from '../util/api-client'
import { Deck, FactionKey, Game, GameDeck, User } from '@gwent/graphql-schema/resolver-typings'
import { E2eCtx, getFixtureCtx, getTestCtx } from '../util/e2e-ctx'
import E2eUtil from '../util/e2e-util'
import GamePage, { GamePlayerExpected } from '../page-objects/game-page'
import HomePage from '../page-objects/home-page'
import LoginPage from '../page-objects/login-page'
import { PlayerTurn } from '../components/game-player-info'
import { sortObjectArray } from '@gwent/utils'
import { STARTING_HAND_SIZE } from '@gwent/constants'

interface GameReadyTestCtx extends E2eCtx {
  scenario: string
  self: {
    user: User
    client: ApiClient
    deck: Deck
    gameDeck: GameDeck
  }
  opponent: {
    user: User
    client: ApiClient
    deck: Deck
    gameDeck: GameDeck
  }
  northerRealms: {
    faction: FactionKey
    leader: string
    units: string[]
  }
  nilfgaard: {
    faction: FactionKey
    leader: string
    units: string[]
  }
  game: Game
}
const fixture = getFixtureCtx<E2eCtx, GameReadyTestCtx>()
const test = getTestCtx<E2eCtx, GameReadyTestCtx>()

fixture('Game Ready')
  .page(HomePage.getUrl())
  .beforeEach(async (t) => {
    t.ctx.scenario = 'game-ready'
    const self = await new ApiClient({}).addUser({
      name: `${t.ctx.scenario}-self-${t.ctx.start}`,
    })
    const opponent = await new ApiClient({}).addUser({
      name: `${t.ctx.scenario}-opponent-${t.ctx.start}`,
    })

    t.ctx.northerRealms = {
      faction: FactionKey.NorthernRealms,
      leader: 'Foltest Son of Medell',
      units: [
        'Ballista',
        'Biting Frost',
        'Blue Stripes Commando',
        'Blue Stripes Commando',
        'Blue Stripes Commando',
        'Catapult',
        'Catapult',
        'Cirilla Fiona Elen Riannon',
        "Commander's Horn",
        'Cow',
        'Decoy',
        'Dun Banner Medic',
        'Geralt of Rivia',
        'Mysterious Elf',
        'Prince Stennis',
        'Sabrina Glevissig',
        'Scorch',
        'Sigismund Dijkstra',
        'Skellige Storm',
        'Thaler',
        'Villentretenmerth',
        'Yennefer of Vengerberg',
      ],
    }
    t.ctx.nilfgaard = {
      faction: FactionKey.NilfgaardianEmpire,
      leader: 'Emhyr var Emreis the Relentless',
      units: [
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
      ],
    }

    const selfClient = new ApiClient({
      username: self.name,
    })
    const opponentClient = new ApiClient({
      username: opponent.name,
    })

    t.ctx.game = await selfClient.addGame([opponent.name])

    const selfDeck = await selfClient.addDeck({
      faction: t.ctx.northerRealms.faction,
      leaderName: t.ctx.northerRealms.leader,
      name: `${t.ctx.scenario}-self-deck-${Date.now()}`,
      unitNames: t.ctx.northerRealms.units,
    })
    const opponentDeck = await opponentClient.addDeck({
      faction: t.ctx.nilfgaard.faction,
      leaderName: t.ctx.nilfgaard.leader,
      name: `${t.ctx.scenario}-opponent-deck-${Date.now()}`,
      unitNames: t.ctx.nilfgaard.units,
    })

    t.ctx.self = {
      user: self,
      client: selfClient,
      deck: selfDeck,
      gameDeck: await selfClient.setDeck({
        deckId: selfDeck.id,
        gameId: t.ctx.game.id,
      }),
    }
    t.ctx.opponent = {
      user: opponent,
      client: opponentClient,
      deck: opponentDeck,
      gameDeck: await opponentClient.setDeck({
        deckId: opponentDeck.id,
        gameId: t.ctx.game.id,
      }),
    }

    t.ctx.game = await selfClient.getGame(t.ctx.game.id)

    await LoginPage.login({
      username: t.ctx.self.user.name,
    })
  })

// TODO: Can set ready after 1 card redrawn

// TODO: replace redraws with API calls
// test('Can set ready after 1 card redrawn', async (t) => {
//   const client2 = new ApiClient({
//     username: t.ctx.opponent,
//   })
//   await client2.setDeck({
//     deckId: t.ctx.deck2.id,
//     gameId: t.ctx.game.id,
//   })
//   await client2.ready(t.ctx.game.id)
//   await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
//   await GamePage.verify({
//     opponent: {
//       name: t.ctx.opponent,
//     },
//     self: {
//       name: t.ctx.username,
//     },
//   })
//   await GamePage.setDeck({
//     created: t.ctx.deck1.created,
//     faction: t.ctx.deck1.faction,
//     leader: t.ctx.deck1.leader,
//     name: t.ctx.deck1.name,
//     stats: t.ctx.deck1.stats,
//   })
//   const client1 = new ApiClient({
//     username: t.ctx.username,
//   })
//   const gameDeck = await client1.getGameDeck(t.ctx.game.id)
//   await GamePage.verify({
//     opponent: {
//       name: t.ctx.opponent,
//     },
//     self: {
//       name: t.ctx.username,
//       discard: 0,
//       faction: t.ctx.deck1.faction,
//       leader: t.ctx.deck1.leader,
//       hand: STARTING_HAND_SIZE,
//       undrawn: t.ctx.deck1.units.length - STARTING_HAND_SIZE,
//       from: gameDeck.from,
//     },
//     hand: sortObjectArray({
//       sortProperties: ['unit.strength', 'unit.id'],
//       array: gameDeck.hand,
//     }).map((deckUnit) => deckUnit.unit.name),
//     redraws: [],
//   })
//   const unitToRedraw = gameDeck.hand[0].unit.name
//   await GamePage.redraw(unitToRedraw)
//   const redrawnGameDeck = await client1.getGameDeck(t.ctx.game.id)
//   await GamePage.verify({
//     opponent: {
//       name: t.ctx.opponent,
//     },
//     self: {
//       name: t.ctx.username,
//       discard: 0,
//       faction: t.ctx.deck1.faction,
//       leader: t.ctx.deck1.leader,
//       hand: STARTING_HAND_SIZE,
//       undrawn: t.ctx.deck1.units.length - STARTING_HAND_SIZE,
//       from: gameDeck.from,
//     },
//     hand: sortObjectArray({
//       sortProperties: ['unit.strength', 'unit.id'],
//       array: redrawnGameDeck.hand,
//     }).map((deckUnit) => deckUnit.unit.name),
//     redraws: [
//       {
//         from: unitToRedraw,
//         to: redrawnGameDeck.redraws[0].to.unit.name,
//       },
//     ],
//   })
//   await GamePage.ready()
//   await GamePage.verify({
//     opponent: {
//       name: t.ctx.opponent,
//       discard: 0,
//       faction: t.ctx.deck2.faction,
//       leader: t.ctx.deck2.leader,
//       hand: STARTING_HAND_SIZE,
//       undrawn: t.ctx.deck2.units.length - STARTING_HAND_SIZE,
//       ready: true,
//     },
//     self: {
//       name: t.ctx.username,
//       discard: 0,
//       faction: t.ctx.deck1.faction,
//       leader: t.ctx.deck1.leader,
//       hand: STARTING_HAND_SIZE,
//       undrawn: t.ctx.deck1.units.length - STARTING_HAND_SIZE,
//       ready: true,
//       from: gameDeck.from,
//     },
//     hand: sortObjectArray({
//       sortProperties: ['unit.strength', 'unit.id'],
//       array: redrawnGameDeck.hand,
//     }).map((deckUnit) => deckUnit.unit.name),
//   })
// })

// test('Can set ready after 2 cards redrawn', async (t) => {
//   const client2 = new ApiClient({
//     username: t.ctx.opponent,
//   })
//   await client2.setDeck({
//     deckId: t.ctx.deck2.id,
//     gameId: t.ctx.game.id,
//   })
//   await client2.ready(t.ctx.game.id)
//   await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
//   await GamePage.verify({
//     opponent: {
//       name: t.ctx.opponent,
//     },
//     self: {
//       name: t.ctx.username,
//     },
//   })
//   await GamePage.setDeck({
//     created: t.ctx.deck1.created,
//     faction: t.ctx.deck1.faction,
//     leader: t.ctx.deck1.leader,
//     name: t.ctx.deck1.name,
//     stats: t.ctx.deck1.stats,
//   })
//   const client1 = new ApiClient({
//     username: t.ctx.username,
//   })
//   const gameDeck = await client1.getGameDeck(t.ctx.game.id)
//   await GamePage.verify({
//     opponent: {
//       name: t.ctx.opponent,
//     },
//     self: {
//       name: t.ctx.username,
//       discard: 0,
//       faction: t.ctx.deck1.faction,
//       leader: t.ctx.deck1.leader,
//       hand: STARTING_HAND_SIZE,
//       undrawn: t.ctx.deck1.units.length - STARTING_HAND_SIZE,
//       from: gameDeck.from,
//     },
//     hand: sortObjectArray({
//       sortProperties: ['unit.strength', 'unit.id'],
//       array: gameDeck.hand,
//     }).map((deckUnit) => deckUnit.unit.name),
//     redraws: [],
//   })
//   const unitToRedraw1 = gameDeck.hand[0].unit.name
//   await GamePage.redraw(unitToRedraw1)
//   const redrawnGameDeck1 = await client1.getGameDeck(t.ctx.game.id)
//   await GamePage.verify({
//     opponent: {
//       name: t.ctx.opponent,
//     },
//     self: {
//       name: t.ctx.username,
//       discard: 0,
//       faction: t.ctx.deck1.faction,
//       leader: t.ctx.deck1.leader,
//       hand: STARTING_HAND_SIZE,
//       undrawn: t.ctx.deck1.units.length - STARTING_HAND_SIZE,
//       from: gameDeck.from,
//     },
//     hand: sortObjectArray({
//       sortProperties: ['unit.strength', 'unit.id'],
//       array: redrawnGameDeck1.hand,
//     }).map((deckUnit) => deckUnit.unit.name),
//     redraws: [
//       {
//         from: unitToRedraw1,
//         to: redrawnGameDeck1.redraws[0].to.unit.name,
//       },
//     ],
//   })
//   const unitToRedraw2 = gameDeck.hand[gameDeck.hand.length - 1].unit.name
//   await GamePage.redraw(unitToRedraw2)
//   const redrawnGameDeck2 = await client1.getGameDeck(t.ctx.game.id)
//   await GamePage.verify({
//     opponent: {
//       name: t.ctx.opponent,
//     },
//     self: {
//       name: t.ctx.username,
//       discard: 0,
//       faction: t.ctx.deck1.faction,
//       leader: t.ctx.deck1.leader,
//       hand: STARTING_HAND_SIZE,
//       undrawn: t.ctx.deck1.units.length - STARTING_HAND_SIZE,
//       from: gameDeck.from,
//     },
//     hand: sortObjectArray({
//       sortProperties: ['unit.strength', 'unit.id'],
//       array: redrawnGameDeck2.hand,
//     }).map((deckUnit) => deckUnit.unit.name),
//     redraws: [
//       {
//         from: unitToRedraw1,
//         to: redrawnGameDeck1.redraws[0].to.unit.name,
//       },
//       {
//         from: unitToRedraw2,
//         to: redrawnGameDeck2.redraws[1].to.unit.name,
//       },
//     ],
//   })
//   await GamePage.ready()
//   await GamePage.verify({
//     opponent: {
//       name: t.ctx.opponent,
//       discard: 0,
//       faction: t.ctx.deck2.faction,
//       leader: t.ctx.deck2.leader,
//       hand: STARTING_HAND_SIZE,
//       undrawn: t.ctx.deck2.units.length - STARTING_HAND_SIZE,
//       ready: true,
//     },
//     self: {
//       name: t.ctx.username,
//       discard: 0,
//       faction: t.ctx.deck1.faction,
//       leader: t.ctx.deck1.leader,
//       hand: STARTING_HAND_SIZE,
//       undrawn: t.ctx.deck1.units.length - STARTING_HAND_SIZE,
//       ready: true,
//       from: gameDeck.from,
//     },
//     hand: sortObjectArray({
//       sortProperties: ['unit.strength', 'unit.id'],
//       array: redrawnGameDeck2.hand,
//     }).map((deckUnit) => deckUnit.unit.name),
//   })
// })

// test('Ready before opponent shows loading message until opponent ready', async (t) => {
//   await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
//   await GamePage.verify({
//     opponent: {
//       name: t.ctx.opponent,
//     },
//     self: {
//       name: t.ctx.username,
//     },
//   })
//   await GamePage.setDeck({
//     created: t.ctx.deck1.created,
//     faction: t.ctx.deck1.faction,
//     leader: t.ctx.deck1.leader,
//     name: t.ctx.deck1.name,
//     stats: t.ctx.deck1.stats,
//   })
//   const client1 = new ApiClient({
//     username: t.ctx.username,
//   })
//   const gameDeck = await client1.getGameDeck(t.ctx.game.id)
//   await GamePage.verify({
//     opponent: {
//       name: t.ctx.opponent,
//     },
//     self: {
//       name: t.ctx.username,
//       discard: 0,
//       faction: t.ctx.deck1.faction,
//       leader: t.ctx.deck1.leader,
//       hand: STARTING_HAND_SIZE,
//       undrawn: t.ctx.deck1.units.length - STARTING_HAND_SIZE,
//       from: gameDeck.from,
//     },
//     hand: sortObjectArray({
//       sortProperties: ['unit.strength', 'unit.id'],
//       array: gameDeck.hand,
//     }).map((deckUnit) => deckUnit.unit.name),
//   })
//   await GamePage.ready()
//   await GamePage.verify({
//     opponent: {
//       name: t.ctx.opponent,
//     },
//     self: {
//       name: t.ctx.username,
//       discard: 0,
//       faction: t.ctx.deck1.faction,
//       leader: t.ctx.deck1.leader,
//       hand: STARTING_HAND_SIZE,
//       undrawn: t.ctx.deck1.units.length - STARTING_HAND_SIZE,
//       ready: true,
//       from: gameDeck.from,
//     },
//     hand: sortObjectArray({
//       sortProperties: ['unit.strength', 'unit.id'],
//       array: gameDeck.hand,
//     }).map((deckUnit) => deckUnit.unit.name),
//   })
//   const client2 = new ApiClient({
//     username: t.ctx.opponent,
//   })
//   await client2.setDeck({
//     deckId: t.ctx.deck2.id,
//     gameId: t.ctx.game.id,
//   })
//   await client2.ready(t.ctx.game.id)
//   await GamePage.verify({
//     opponent: {
//       name: t.ctx.opponent,
//       discard: 0,
//       faction: t.ctx.deck2.faction,
//       leader: t.ctx.deck2.leader,
//       hand: STARTING_HAND_SIZE,
//       undrawn: t.ctx.deck2.units.length - STARTING_HAND_SIZE,
//       ready: true,
//     },
//     self: {
//       name: t.ctx.username,
//       discard: 0,
//       faction: t.ctx.deck1.faction,
//       leader: t.ctx.deck1.leader,
//       hand: STARTING_HAND_SIZE,
//       undrawn: t.ctx.deck1.units.length - STARTING_HAND_SIZE,
//       ready: true,
//       from: gameDeck.from,
//     },
//     hand: sortObjectArray({
//       sortProperties: ['unit.strength', 'unit.id'],
//       array: gameDeck.hand,
//     }).map((deckUnit) => deckUnit.unit.name),
//   })
// })

// test('Ready after opponent enters playing', async (t) => {
//   const client2 = new ApiClient({
//     username: t.ctx.opponent,
//   })
//   await client2.setDeck({
//     deckId: t.ctx.deck2.id,
//     gameId: t.ctx.game.id,
//   })
//   await client2.ready(t.ctx.game.id)
//   await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
//   await GamePage.verify({
//     opponent: {
//       name: t.ctx.opponent,
//     },
//     self: {
//       name: t.ctx.username,
//     },
//   })
//   await GamePage.setDeck({
//     created: t.ctx.deck1.created,
//     faction: t.ctx.deck1.faction,
//     leader: t.ctx.deck1.leader,
//     name: t.ctx.deck1.name,
//     stats: t.ctx.deck1.stats,
//   })
//   const client1 = new ApiClient({
//     username: t.ctx.username,
//   })
//   const gameDeck = await client1.getGameDeck(t.ctx.game.id)
//   await GamePage.verify({
//     opponent: {
//       name: t.ctx.opponent,
//     },
//     self: {
//       name: t.ctx.username,
//       discard: 0,
//       faction: t.ctx.deck1.faction,
//       leader: t.ctx.deck1.leader,
//       hand: STARTING_HAND_SIZE,
//       undrawn: t.ctx.deck1.units.length - STARTING_HAND_SIZE,
//       from: gameDeck.from,
//     },
//     hand: sortObjectArray({
//       sortProperties: ['unit.strength', 'unit.id'],
//       array: gameDeck.hand,
//     }).map((deckUnit) => deckUnit.unit.name),
//   })
//   await GamePage.ready()
//   await GamePage.verify({
//     opponent: {
//       name: t.ctx.opponent,
//       discard: 0,
//       faction: t.ctx.deck2.faction,
//       leader: t.ctx.deck2.leader,
//       hand: STARTING_HAND_SIZE,
//       undrawn: t.ctx.deck2.units.length - STARTING_HAND_SIZE,
//       ready: true,
//     },
//     self: {
//       name: t.ctx.username,
//       discard: 0,
//       faction: t.ctx.deck1.faction,
//       leader: t.ctx.deck1.leader,
//       hand: STARTING_HAND_SIZE,
//       undrawn: t.ctx.deck1.units.length - STARTING_HAND_SIZE,
//       ready: true,
//       from: gameDeck.from,
//     },
//     hand: sortObjectArray({
//       sortProperties: ['unit.strength', 'unit.id'],
//       array: gameDeck.hand,
//     }).map((deckUnit) => deckUnit.unit.name),
//   })
// })

test('Page automatically updates after game ready via API before opponent ready', async (t) => {
  await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
  const won = t.ctx.game.turn?.user.id === t.ctx.self.user.id
  const selfPlayer: GamePlayerExpected = {
    name: t.ctx.self.user.name,
    discard: 0,
    faction: t.ctx.self.deck.faction,
    leader: t.ctx.self.deck.leader,
    hand: STARTING_HAND_SIZE,
    undrawn: t.ctx.self.deck.units.length - STARTING_HAND_SIZE,
    from: t.ctx.self.deck,
  }
  const opponentPlayer: GamePlayerExpected = {
    name: t.ctx.opponent.user.name,
    discard: 0,
    faction: t.ctx.opponent.deck.faction,
    leader: t.ctx.opponent.deck.leader,
    hand: STARTING_HAND_SIZE,
    undrawn: t.ctx.opponent.deck.units.length - STARTING_HAND_SIZE,
    from: t.ctx.opponent.deck,
  }
  if (won) {
    selfPlayer.turn = PlayerTurn.Future
  } else {
    opponentPlayer.turn = PlayerTurn.Future
  }
  await GamePage.verifyCoinToss({
    won,
  })
  await GamePage.verify({
    opponent: opponentPlayer,
    self: selfPlayer,
    hand: sortObjectArray({
      sortProperties: ['unit.strength', 'unit.id'],
      array: t.ctx.self.gameDeck.hand,
    }).map((deckUnit) => deckUnit.unit.name),
    redraws: [],
  })
  await t.ctx.self.client.ready(t.ctx.game.id)
  await GamePage.verify({
    opponent: opponentPlayer,
    self: {
      ...selfPlayer,
      ready: true,
    },
    hand: sortObjectArray({
      sortProperties: ['unit.strength', 'unit.id'],
      array: t.ctx.self.gameDeck.hand,
    }).map((deckUnit) => deckUnit.unit.name),
  })
})

// test('Game not marked as ready if use API to mark other game as ready', async (t) => {
//   await E2eUtil.goTo(GamePage.getUrl(t.ctx.game.id))
//   await GamePage.verify({
//     opponent: {
//       name: t.ctx.opponent,
//     },
//     self: {
//       name: t.ctx.username,
//     },
//   })
//   await GamePage.setDeck({
//     created: t.ctx.deck1.created,
//     faction: t.ctx.deck1.faction,
//     leader: t.ctx.deck1.leader,
//     name: t.ctx.deck1.name,
//     stats: t.ctx.deck1.stats,
//   })
//   const client1 = new ApiClient({
//     username: t.ctx.username,
//   })
//   const game2 = await client1.addGame([t.ctx.opponent])
//   await client1.setDeck({
//     deckId: t.ctx.deck1.id,
//     gameId: game2.id,
//   })
//   await client1.ready(game2.id)
//   const gameDeck = await client1.getGameDeck(t.ctx.game.id)
//   await GamePage.verify({
//     opponent: {
//       name: t.ctx.opponent,
//     },
//     self: {
//       name: t.ctx.username,
//       discard: 0,
//       faction: t.ctx.deck1.faction,
//       leader: t.ctx.deck1.leader,
//       hand: STARTING_HAND_SIZE,
//       undrawn: t.ctx.deck1.units.length - STARTING_HAND_SIZE,
//       from: gameDeck.from,
//     },
//     hand: sortObjectArray({
//       sortProperties: ['unit.strength', 'unit.id'],
//       array: gameDeck.hand,
//     }).map((deckUnit) => deckUnit.unit.name),
//   })
//   await GamePage.ready()
//   await GamePage.verify({
//     opponent: {
//       name: t.ctx.opponent,
//     },
//     self: {
//       name: t.ctx.username,
//       discard: 0,
//       faction: t.ctx.deck1.faction,
//       leader: t.ctx.deck1.leader,
//       hand: STARTING_HAND_SIZE,
//       undrawn: t.ctx.deck1.units.length - STARTING_HAND_SIZE,
//       ready: true,
//       from: gameDeck.from,
//     },
//     hand: sortObjectArray({
//       sortProperties: ['unit.strength', 'unit.id'],
//       array: gameDeck.hand,
//     }).map((deckUnit) => deckUnit.unit.name),
//   })
//   const client2 = new ApiClient({
//     username: t.ctx.opponent,
//   })
//   await client2.setDeck({
//     deckId: t.ctx.deck2.id,
//     gameId: game2.id,
//   })
//   await client2.ready(game2.id)
//   await GamePage.verify({
//     opponent: {
//       name: t.ctx.opponent,
//     },
//     self: {
//       name: t.ctx.username,
//       discard: 0,
//       faction: t.ctx.deck1.faction,
//       leader: t.ctx.deck1.leader,
//       hand: STARTING_HAND_SIZE,
//       undrawn: t.ctx.deck1.units.length - STARTING_HAND_SIZE,
//       ready: true,
//       from: gameDeck.from,
//     },
//     hand: sortObjectArray({
//       sortProperties: ['unit.strength', 'unit.id'],
//       array: gameDeck.hand,
//     }).map((deckUnit) => deckUnit.unit.name),
//   })
// })
