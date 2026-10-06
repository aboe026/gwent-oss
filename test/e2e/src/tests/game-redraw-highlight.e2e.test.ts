import createGameManager from '../util/game-manager'
import { E2eCtx, getFixtureCtx, getScenario, getTestCtx } from '../util/e2e-ctx'
import { E2eHelper } from '../util/e2e-helper'
import env from '../util/e2e-env'
import { FactionKey } from '@gwent-oss/node-client'
import FullCard from '../components/full-card'
import GamePage from '../page-objects/game-page'
import HomePage from '../page-objects/home-page'
import RedrawUnits from '../components/redraw-units'
import { redrawExactUnit } from '@gwent-oss/test-utils'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Game Redraw Highlight').page(HomePage.getUrl())

test('Selecting hand card without redraws toggles highlight of first available redraw', async (t) => {
  const unitName = 'Ves'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName],
    },
    opponent: {
      faction: FactionKey.NilfgaardianEmpire,
    },
    ready: false,
  })
  await gameManager.initialize({
    verify: false,
  })

  await GamePage.verifyCoinToss({
    won: true,
  })
  await gameManager.verify({
    redraws: [],
  })
  await GamePage.selectHandUnit({
    unitName,
  })
  await gameManager.verify({
    redraws: [
      {
        from: {
          highlighted: true,
        },
      },
    ],
    highlightedHandCard: {
      unitName,
    },
  })
  await GamePage.selectHandUnit({
    unitName,
  })
  await gameManager.verify({
    redraws: [],
  })
})

test('Selecting first from card highlights it dotted', async (t) => {
  const unitName1 = 'Ves'
  const unitName2 = 'Yarpen Zigrin'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1],
      excludeHandUnitNames: [unitName2],
    },
    opponent: {
      faction: FactionKey.NilfgaardianEmpire,
    },
    ready: false,
  })
  const toUnit = await E2eHelper.getUndrawnUnit({
    deck: gameManager.self.deck,
    name: unitName2,
  })
  await redrawExactUnit({
    gameId: gameManager.gameId,
    mongoConnectionString: env.MONGO_URL,
    mongoDatabaseName: env.MONGO_DB,
    userId: (await gameManager.self.client.currentUser()).id,
    fromId: (
      await E2eHelper.getHandUnit({
        deck: gameManager.self.deck,
        name: unitName1,
      })
    ).unit.id,
    toId: toUnit.unit.id,
  })
  gameManager.self.deck = await gameManager.self.client.getGameDeck(gameManager.gameId)
  await gameManager.initialize({
    verify: false,
  })

  await GamePage.verifyCoinToss({
    won: true,
  })
  await gameManager.verify({
    redraws: [
      {
        from: {
          unitName: unitName1,
        },
        to: {
          unitName: toUnit.unit.name,
        },
      },
    ],
  })

  await RedrawUnits.selectRedrawnCard({
    pair: 1,
    from: true,
  })
  await gameManager.verify({
    redraws: [
      {
        from: {
          highlighted: true,
          dotted: true,
        },
        to: {
          unitName: toUnit.unit.name,
        },
      },
    ],
  })
  await RedrawUnits.selectRedrawnCard({
    pair: 1,
    from: true,
  })
  await gameManager.verify({
    redraws: [
      {
        from: {
          unitName: unitName1,
        },
        to: {
          unitName: toUnit.unit.name,
        },
      },
    ],
  })
})

test('Fullscreening first from card highlights it dotted', async (t) => {
  const unitName1 = 'Ves'
  const unitName2 = 'Yarpen Zigrin'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1],
      excludeHandUnitNames: [unitName2],
    },
    opponent: {
      faction: FactionKey.NilfgaardianEmpire,
    },
    ready: false,
  })
  const toUnit = await E2eHelper.getUndrawnUnit({
    deck: gameManager.self.deck,
    name: unitName2,
  })
  await redrawExactUnit({
    gameId: gameManager.gameId,
    mongoConnectionString: env.MONGO_URL,
    mongoDatabaseName: env.MONGO_DB,
    userId: (await gameManager.self.client.currentUser()).id,
    fromId: (
      await E2eHelper.getHandUnit({
        deck: gameManager.self.deck,
        name: unitName1,
      })
    ).unit.id,
    toId: toUnit.unit.id,
  })
  gameManager.self.deck = await gameManager.self.client.getGameDeck(gameManager.gameId)
  await gameManager.initialize({
    verify: false,
  })

  await GamePage.verifyCoinToss({
    won: true,
  })
  await gameManager.verify({
    redraws: [
      {
        from: {
          unitName: unitName1,
        },
        to: {
          unitName: toUnit.unit.name,
        },
      },
    ],
  })

  await RedrawUnits.fullscreenRedrawnCard({
    pair: 1,
    from: true,
  })
  await gameManager.verify({
    redraws: [
      {
        from: {
          highlighted: true,
          dotted: true,
        },
        to: {
          unitName: toUnit.unit.name,
        },
      },
    ],
  })
  await FullCard.close()
  await gameManager.verify({
    redraws: [
      {
        from: {
          highlighted: true,
          dotted: true,
        },
        to: {
          unitName: toUnit.unit.name,
        },
      },
    ],
  })
  await RedrawUnits.selectRedrawnCard({
    pair: 1,
    from: true,
  })
  await gameManager.verify({
    redraws: [
      {
        from: {
          unitName: unitName1,
        },
        to: {
          unitName: toUnit.unit.name,
        },
      },
    ],
  })
})

test('Selecting first to card highlights it and hand card', async (t) => {
  const unitName1 = 'Ves'
  const unitName2 = 'Yarpen Zigrin'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1],
      excludeHandUnitNames: [unitName2],
    },
    opponent: {
      faction: FactionKey.NilfgaardianEmpire,
    },
    ready: false,
  })
  const toUnit = await E2eHelper.getUndrawnUnit({
    deck: gameManager.self.deck,
    name: unitName2,
  })
  await redrawExactUnit({
    gameId: gameManager.gameId,
    mongoConnectionString: env.MONGO_URL,
    mongoDatabaseName: env.MONGO_DB,
    userId: (await gameManager.self.client.currentUser()).id,
    fromId: (
      await E2eHelper.getHandUnit({
        deck: gameManager.self.deck,
        name: unitName1,
      })
    ).unit.id,
    toId: toUnit.unit.id,
  })
  gameManager.self.deck = await gameManager.self.client.getGameDeck(gameManager.gameId)
  await gameManager.initialize({
    verify: false,
  })

  await GamePage.verifyCoinToss({
    won: true,
  })
  await gameManager.verify({
    redraws: [
      {
        from: {
          unitName: unitName1,
        },
        to: {
          unitName: toUnit.unit.name,
        },
      },
    ],
  })

  await RedrawUnits.selectRedrawnCard({
    pair: 1,
  })
  await gameManager.verify({
    redraws: [
      {
        from: {
          unitName: unitName1,
        },
        to: {
          unitName: toUnit.unit.name,
          highlighted: true,
        },
      },
      {
        from: {
          highlighted: true,
        },
      },
    ],
    highlightedHandCard: {
      unitName: toUnit.unit.name,
    },
  })
  await RedrawUnits.selectRedrawnCard({
    pair: 1,
  })
  await gameManager.verify({
    redraws: [
      {
        from: {
          unitName: unitName1,
        },
        to: {
          unitName: toUnit.unit.name,
        },
      },
    ],
  })
})

test('Fullscreening first to card highlights it and hand card', async (t) => {
  const unitName1 = 'Ves'
  const unitName2 = 'Yarpen Zigrin'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1],
      excludeHandUnitNames: [unitName2],
    },
    opponent: {
      faction: FactionKey.NilfgaardianEmpire,
    },
    ready: false,
  })
  const toUnit = await E2eHelper.getUndrawnUnit({
    deck: gameManager.self.deck,
    name: unitName2,
  })
  await redrawExactUnit({
    gameId: gameManager.gameId,
    mongoConnectionString: env.MONGO_URL,
    mongoDatabaseName: env.MONGO_DB,
    userId: (await gameManager.self.client.currentUser()).id,
    fromId: (
      await E2eHelper.getHandUnit({
        deck: gameManager.self.deck,
        name: unitName1,
      })
    ).unit.id,
    toId: toUnit.unit.id,
  })
  gameManager.self.deck = await gameManager.self.client.getGameDeck(gameManager.gameId)
  await gameManager.initialize({
    verify: false,
  })

  await GamePage.verifyCoinToss({
    won: true,
  })
  await gameManager.verify({
    redraws: [
      {
        from: {
          unitName: unitName1,
        },
        to: {
          unitName: toUnit.unit.name,
        },
      },
    ],
  })

  await RedrawUnits.fullscreenRedrawnCard({
    pair: 1,
  })
  await gameManager.verify({
    redraws: [
      {
        from: {
          unitName: unitName1,
        },
        to: {
          unitName: toUnit.unit.name,
          highlighted: true,
        },
      },
      {
        from: {
          highlighted: true,
        },
      },
    ],
    highlightedHandCard: {
      unitName: toUnit.unit.name,
    },
  })
  await FullCard.close()
  await gameManager.verify({
    redraws: [
      {
        from: {
          unitName: unitName1,
        },
        to: {
          unitName: toUnit.unit.name,
          highlighted: true,
        },
      },
      {
        from: {
          highlighted: true,
        },
      },
    ],
    highlightedHandCard: {
      unitName: toUnit.unit.name,
    },
  })
  await RedrawUnits.selectRedrawnCard({
    pair: 1,
  })
  await gameManager.verify({
    redraws: [
      {
        from: {
          unitName: unitName1,
        },
        to: {
          unitName: toUnit.unit.name,
        },
      },
    ],
  })
})

test('Selecting first redrawn hand card highlights it and redraw card', async (t) => {
  const unitName1 = 'Ves'
  const unitName2 = 'Yarpen Zigrin'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1],
      excludeHandUnitNames: [unitName2],
    },
    opponent: {
      faction: FactionKey.NilfgaardianEmpire,
    },
    ready: false,
  })
  const toUnit = await E2eHelper.getUndrawnUnit({
    deck: gameManager.self.deck,
    name: unitName2,
  })
  await redrawExactUnit({
    gameId: gameManager.gameId,
    mongoConnectionString: env.MONGO_URL,
    mongoDatabaseName: env.MONGO_DB,
    userId: (await gameManager.self.client.currentUser()).id,
    fromId: (
      await E2eHelper.getHandUnit({
        deck: gameManager.self.deck,
        name: unitName1,
      })
    ).unit.id,
    toId: toUnit.unit.id,
  })
  gameManager.self.deck = await gameManager.self.client.getGameDeck(gameManager.gameId)
  await gameManager.initialize({
    verify: false,
  })

  await GamePage.verifyCoinToss({
    won: true,
  })
  await gameManager.verify({
    redraws: [
      {
        from: {
          unitName: unitName1,
        },
        to: {
          unitName: toUnit.unit.name,
        },
      },
    ],
  })

  await GamePage.selectHandUnit({
    unitName: toUnit.unit.name,
  })
  await gameManager.verify({
    redraws: [
      {
        from: {
          unitName: unitName1,
        },
        to: {
          unitName: toUnit.unit.name,
          highlighted: true,
        },
      },
      {
        from: {
          highlighted: true,
        },
      },
    ],
    highlightedHandCard: {
      unitName: toUnit.unit.name,
    },
  })
  await GamePage.selectHandUnit({
    unitName: toUnit.unit.name,
  })
  await gameManager.verify({
    redraws: [
      {
        from: {
          unitName: unitName1,
        },
        to: {
          unitName: toUnit.unit.name,
        },
      },
    ],
  })
})

test('Fullscreening first redrawn hand card highlights it and redraw card', async (t) => {
  const unitName1 = 'Ves'
  const unitName2 = 'Yarpen Zigrin'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1],
      excludeHandUnitNames: [unitName2],
    },
    opponent: {
      faction: FactionKey.NilfgaardianEmpire,
    },
    ready: false,
  })
  const toUnit = await E2eHelper.getUndrawnUnit({
    deck: gameManager.self.deck,
    name: unitName2,
  })
  await redrawExactUnit({
    gameId: gameManager.gameId,
    mongoConnectionString: env.MONGO_URL,
    mongoDatabaseName: env.MONGO_DB,
    userId: (await gameManager.self.client.currentUser()).id,
    fromId: (
      await E2eHelper.getHandUnit({
        deck: gameManager.self.deck,
        name: unitName1,
      })
    ).unit.id,
    toId: toUnit.unit.id,
  })
  gameManager.self.deck = await gameManager.self.client.getGameDeck(gameManager.gameId)
  await gameManager.initialize({
    verify: false,
  })

  await GamePage.verifyCoinToss({
    won: true,
  })
  await gameManager.verify({
    redraws: [
      {
        from: {
          unitName: unitName1,
        },
        to: {
          unitName: toUnit.unit.name,
        },
      },
    ],
  })

  await GamePage.fullscreenHandCard(toUnit.unit.name)
  await gameManager.verify({
    redraws: [
      {
        from: {
          unitName: unitName1,
        },
        to: {
          unitName: toUnit.unit.name,
          highlighted: true,
        },
      },
      {
        from: {
          highlighted: true,
        },
      },
    ],
    highlightedHandCard: {
      unitName: toUnit.unit.name,
    },
  })
  await FullCard.close()
  await gameManager.verify({
    redraws: [
      {
        from: {
          unitName: unitName1,
        },
        to: {
          unitName: toUnit.unit.name,
          highlighted: true,
        },
      },
      {
        from: {
          highlighted: true,
        },
      },
    ],
    highlightedHandCard: {
      unitName: toUnit.unit.name,
    },
  })
  await GamePage.selectHandUnit({
    unitName: toUnit.unit.name,
  })
  await gameManager.verify({
    redraws: [
      {
        from: {
          unitName: unitName1,
        },
        to: {
          unitName: toUnit.unit.name,
        },
      },
    ],
  })
})

test('First to card highlight toggled by both hand and redraw card', async (t) => {
  const unitName1 = 'Ves'
  const unitName2 = 'Yarpen Zigrin'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1],
      excludeHandUnitNames: [unitName2],
    },
    opponent: {
      faction: FactionKey.NilfgaardianEmpire,
    },
    ready: false,
  })
  const toUnit = await E2eHelper.getUndrawnUnit({
    deck: gameManager.self.deck,
    name: unitName2,
  })
  await redrawExactUnit({
    gameId: gameManager.gameId,
    mongoConnectionString: env.MONGO_URL,
    mongoDatabaseName: env.MONGO_DB,
    userId: (await gameManager.self.client.currentUser()).id,
    fromId: (
      await E2eHelper.getHandUnit({
        deck: gameManager.self.deck,
        name: unitName1,
      })
    ).unit.id,
    toId: toUnit.unit.id,
  })
  gameManager.self.deck = await gameManager.self.client.getGameDeck(gameManager.gameId)
  await gameManager.initialize({
    verify: false,
  })

  await GamePage.verifyCoinToss({
    won: true,
  })
  await gameManager.verify({
    redraws: [
      {
        from: {
          unitName: unitName1,
        },
        to: {
          unitName: toUnit.unit.name,
        },
      },
    ],
  })

  await GamePage.selectHandUnit({
    unitName: toUnit.unit.name,
  })
  await gameManager.verify({
    redraws: [
      {
        from: {
          unitName: unitName1,
        },
        to: {
          unitName: toUnit.unit.name,
          highlighted: true,
        },
      },
      {
        from: {
          highlighted: true,
        },
      },
    ],
    highlightedHandCard: {
      unitName: toUnit.unit.name,
    },
  })
  await RedrawUnits.selectRedrawnCard({
    pair: 1,
  })
  await gameManager.verify({
    redraws: [
      {
        from: {
          unitName: unitName1,
        },
        to: {
          unitName: toUnit.unit.name,
        },
      },
    ],
  })

  await RedrawUnits.selectRedrawnCard({
    pair: 1,
  })
  await gameManager.verify({
    redraws: [
      {
        from: {
          unitName: unitName1,
        },
        to: {
          unitName: toUnit.unit.name,
          highlighted: true,
        },
      },
      {
        from: {
          highlighted: true,
        },
      },
    ],
    highlightedHandCard: {
      unitName: toUnit.unit.name,
    },
  })
  await GamePage.selectHandUnit({
    unitName: toUnit.unit.name,
  })
  await gameManager.verify({
    redraws: [
      {
        from: {
          unitName: unitName1,
        },
        to: {
          unitName: toUnit.unit.name,
        },
      },
    ],
  })
})

test('Selecting hand card with redraw toggles highlight of last available redraw', async (t) => {
  const unitName1 = 'Ves'
  const unitName2 = 'Yarpen Zigrin'
  const unitName3 = 'Siegfried of Denesle'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1, unitName3],
      excludeHandUnitNames: [unitName2],
    },
    opponent: {
      faction: FactionKey.NilfgaardianEmpire,
    },
    ready: false,
  })
  const toUnit = await E2eHelper.getUndrawnUnit({
    deck: gameManager.self.deck,
    name: unitName2,
  })
  await redrawExactUnit({
    gameId: gameManager.gameId,
    mongoConnectionString: env.MONGO_URL,
    mongoDatabaseName: env.MONGO_DB,
    userId: (await gameManager.self.client.currentUser()).id,
    fromId: (
      await E2eHelper.getHandUnit({
        deck: gameManager.self.deck,
        name: unitName1,
      })
    ).unit.id,
    toId: toUnit.unit.id,
  })
  gameManager.self.deck = await gameManager.self.client.getGameDeck(gameManager.gameId)
  await gameManager.initialize({
    verify: false,
  })

  await GamePage.verifyCoinToss({
    won: true,
  })
  await gameManager.verify({
    redraws: [
      {
        from: {
          unitName: unitName1,
        },
        to: {
          unitName: toUnit.unit.name,
        },
      },
    ],
  })
  await GamePage.selectHandUnit({
    unitName: unitName3,
  })
  await gameManager.verify({
    redraws: [
      {
        from: {
          unitName: unitName1,
        },
        to: {
          unitName: toUnit.unit.name,
        },
      },
      {
        from: {
          highlighted: true,
        },
      },
    ],
    highlightedHandCard: {
      unitName: unitName3,
    },
  })
  await GamePage.selectHandUnit({
    unitName: unitName3,
  })
  await gameManager.verify({
    redraws: [
      {
        from: {
          unitName: unitName1,
        },
        to: {
          unitName: toUnit.unit.name,
        },
      },
    ],
  })
})

test('Redrawing first to card highlight toggled by to or from', async (t) => {
  const unitName1 = 'Ves'
  const unitName2 = 'Yarpen Zigrin'
  const unitName3 = 'Siegfried of Denesle'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1],
      excludeHandUnitNames: [unitName2, unitName3],
    },
    opponent: {
      faction: FactionKey.NilfgaardianEmpire,
    },
    ready: false,
  })
  const toUnit1 = await E2eHelper.getUndrawnUnit({
    deck: gameManager.self.deck,
    name: unitName2,
  })
  const toUnit2 = await E2eHelper.getUndrawnUnit({
    deck: gameManager.self.deck,
    name: unitName3,
  })
  const userId = (await gameManager.self.client.currentUser()).id
  await redrawExactUnit({
    gameId: gameManager.gameId,
    mongoConnectionString: env.MONGO_URL,
    mongoDatabaseName: env.MONGO_DB,
    userId,
    fromId: (
      await E2eHelper.getHandUnit({
        deck: gameManager.self.deck,
        name: unitName1,
      })
    ).unit.id,
    toId: toUnit1.unit.id,
  })
  await redrawExactUnit({
    gameId: gameManager.gameId,
    mongoConnectionString: env.MONGO_URL,
    mongoDatabaseName: env.MONGO_DB,
    userId,
    fromId: toUnit1.unit.id,
    toId: toUnit2.unit.id,
  })
  gameManager.self.deck = await gameManager.self.client.getGameDeck(gameManager.gameId)
  await gameManager.initialize({
    verify: false,
  })

  await GamePage.verifyCoinToss({
    won: true,
  })
  await gameManager.verify({
    redraws: [
      {
        from: {
          unitName: unitName1,
        },
        to: {
          unitName: toUnit1.unit.name,
        },
      },
      {
        from: {
          unitName: toUnit1.unit.name,
        },
        to: {
          unitName: toUnit2.unit.name,
        },
      },
    ],
  })

  await RedrawUnits.selectRedrawnCard({
    pair: 1,
  })
  await gameManager.verify({
    redraws: [
      {
        from: {
          unitName: unitName1,
        },
        to: {
          highlighted: true,
          dotted: true,
        },
      },
      {
        from: {
          highlighted: true,
          dotted: true,
        },
        to: {
          unitName: toUnit2.unit.name,
        },
      },
    ],
  })
  await RedrawUnits.selectRedrawnCard({
    pair: 2,
    from: true,
  })
  await gameManager.verify({
    redraws: [
      {
        from: {
          unitName: unitName1,
        },
        to: {
          unitName: toUnit1.unit.name,
        },
      },
      {
        from: {
          unitName: toUnit1.unit.name,
        },
        to: {
          unitName: toUnit2.unit.name,
        },
      },
    ],
  })
})
