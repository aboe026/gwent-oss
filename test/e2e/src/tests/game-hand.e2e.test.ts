import createGameManager from '../util/game-manager'
import { Combat, FactionKey, GameUnitOrigin } from '@gwent-oss/node-client'
import { E2eCtx, getFixtureCtx, getScenario, getTestCtx } from '../util/e2e-ctx'
import GamePage from '../page-objects/game-page'
import { sortObjectArray } from '@gwent-oss/utils'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Game Hand')

test('Selecting hand unit while turn highlights appropriate single combat row', async (t) => {
  const unitName = 'Dennis Cranmer'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName],
    },
  })
  await gameManager.initialize({})

  await GamePage.selectHandUnit({
    unitName,
  })
  await gameManager.verify({
    highlightedHandCard: {
      unitName,
      rows: [Combat.Close],
    },
  })
  await GamePage.selectHandUnit({
    unitName,
  })
  await gameManager.verify({})
})

test('Selecting hand unit while turn highlights appropriate multi combat row', async (t) => {
  const unitName = 'Filavandrel aen Fidhail'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName],
    },
  })
  await gameManager.initialize({})

  await GamePage.selectHandUnit({
    unitName,
  })
  await gameManager.verify({
    highlightedHandCard: {
      unitName,
      rows: [Combat.Close, Combat.Ranged],
    },
  })
  await GamePage.selectHandUnit({
    unitName,
  })
  await gameManager.verify({})
})

test('Selecting hand unit while not turn dotted highlights appropriate single combat row', async (t) => {
  const unitName = 'Dennis Cranmer'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName],
    },
    opponentFirst: true,
  })
  await gameManager.initialize({})

  await GamePage.selectHandUnit({
    unitName,
  })
  await gameManager.verify({
    highlightedHandCard: {
      unitName,
      rows: [Combat.Close],
      dotted: true,
    },
  })
  await GamePage.selectHandUnit({
    unitName,
  })
  await gameManager.verify({})
})

test('Selecting hand unit while not turn dotted highlights appropriate multi combat rows', async (t) => {
  const unitName = 'Filavandrel aen Fidhail'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName],
    },
    opponentFirst: true,
  })
  await gameManager.initialize({})

  await GamePage.selectHandUnit({
    unitName,
  })
  await gameManager.verify({
    highlightedHandCard: {
      unitName,
      rows: [Combat.Close, Combat.Ranged],
      dotted: true,
    },
  })
  await GamePage.selectHandUnit({
    unitName,
  })
  await gameManager.verify({})
})

test('Selecting another hand unit while turn highlights appropriate card', async (t) => {
  const unitName1 = 'Dennis Cranmer'
  const unitName2 = 'Zoltan Chivay'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1, unitName2],
    },
  })
  await gameManager.initialize({})

  await GamePage.selectHandUnit({
    unitName: unitName1,
  })
  await gameManager.verify({
    highlightedHandCard: {
      unitName: unitName1,
      rows: [Combat.Close],
    },
  })
  await GamePage.selectHandUnit({
    unitName: unitName2,
  })
  await gameManager.verify({
    highlightedHandCard: {
      unitName: unitName2,
      rows: [Combat.Close],
    },
  })
})

test('Selecting another hand unit while not turn dotted highlights appropriate card', async (t) => {
  const unitName1 = 'Dennis Cranmer'
  const unitName2 = 'Zoltan Chivay'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1, unitName2],
    },
    opponentFirst: true,
  })
  await gameManager.initialize({})

  await GamePage.selectHandUnit({
    unitName: unitName1,
  })
  await gameManager.verify({
    highlightedHandCard: {
      unitName: unitName1,
      rows: [Combat.Close],
      dotted: true,
    },
  })
  await GamePage.selectHandUnit({
    unitName: unitName2,
  })
  await gameManager.verify({
    highlightedHandCard: {
      unitName: unitName2,
      rows: [Combat.Close],
      dotted: true,
    },
  })
})

test('Playing all units in hand shows message to user to pass or activate leader ability', async (t) => {
  const unitName1 = 'Ciaran aep Easnillien'
  const unitName2 = 'Dennis Cranmer'
  const unitName3 = 'Dol Blathanna Archer'
  const unitName4 = 'Dol Blathanna Scout'
  const unitName5 = 'Filavandrel aen Fidhail'
  const unitName6 = 'Ida Emean aep Sivney'
  const unitName7 = 'Riordain'
  const unitName8 = 'Toruviel'
  const unitName9 = 'Vrihedd Brigade Recruit'
  const unitName10 = 'Yaevinn'

  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [
        unitName1,
        unitName2,
        unitName3,
        unitName4,
        unitName5,
        unitName6,
        unitName7,
        unitName8,
        unitName9,
        unitName10,
      ],
    },
  })
  await gameManager.deploy({ unitName: unitName1, eligibleCombats: [Combat.Close, Combat.Ranged] })
  await gameManager.pass({})
  await gameManager.deploy({ unitName: unitName2 })
  await gameManager.deploy({
    unitName: unitName3,
    combat: Combat.Ranged,
    eligibleCombats: [Combat.Close, Combat.Ranged],
  })
  await gameManager.deploy({ unitName: unitName4 })
  await gameManager.deploy({ unitName: unitName5 })
  await gameManager.deploy({
    unitName: unitName6,
    combat: Combat.Ranged,
    eligibleCombats: [Combat.Close, Combat.Ranged],
  })
  await gameManager.deploy({
    unitName: unitName7,
    combat: Combat.Ranged,
    eligibleCombats: [Combat.Close, Combat.Ranged],
  })
  await gameManager.deploy({ unitName: unitName8, combat: Combat.Ranged })
  await gameManager.deploy({
    unitName: unitName9,
    combat: Combat.Ranged,
    eligibleCombats: [Combat.Close, Combat.Ranged],
  })
  await gameManager.initialize({})

  await gameManager.deploy({ unitName: unitName10, eligibleCombats: [Combat.Close, Combat.Ranged] })
})

test('Unit gets added to lost pile when round ends', async (t) => {
  const unitName = 'Ves'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName],
    },
  })
  await gameManager.deploy({
    unitName,
  })
  await gameManager.pass({})

  await gameManager.initialize({})

  await GamePage.switchDeckPartSelected(GameUnitOrigin.Discard)
  await t.expect(gameManager.self.deck.discard.map((undrawn) => undrawn.unit.name)).notContains(unitName)
  await gameManager.verify({
    deckPartSelected: GameUnitOrigin.Discard,
  })
  await GamePage.switchDeckPartSelected(GameUnitOrigin.Hand)

  await gameManager.pass({
    switchTurnsWith: gameManager.self.gamePlayer,
  })

  await GamePage.switchDeckPartSelected(GameUnitOrigin.Discard)
  await t.expect(gameManager.self.deck.discard.map((undrawn) => undrawn.unit.name)).contains(unitName)
  await gameManager.verify({
    deckPartSelected: GameUnitOrigin.Discard,
  })
})

test('Unit gets added to lost pile when scorched', async (t) => {
  const unitName1 = 'Ves'
  const unitName2 = 'Scorch'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1, unitName2],
    },
  })
  await gameManager.deploy({
    unitName: unitName1,
  })
  await gameManager.pass({})

  await gameManager.initialize({})

  await GamePage.switchDeckPartSelected(GameUnitOrigin.Discard)
  await t.expect(gameManager.self.deck.discard.map((undrawn) => undrawn.unit.name)).notContains(unitName2)
  await gameManager.verify({
    deckPartSelected: GameUnitOrigin.Discard,
  })
  await GamePage.switchDeckPartSelected(GameUnitOrigin.Hand)

  await gameManager.deploy({
    unitName: unitName2,
    scorching: [
      {
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        strength: 5,
      },
    ],
  })

  await GamePage.switchDeckPartSelected(GameUnitOrigin.Discard)
  await t.expect(gameManager.self.deck.discard.map((undrawn) => undrawn.unit.name)).contains(unitName2)
  await gameManager.verify({
    deckPartSelected: GameUnitOrigin.Discard,
  })
})

test('Unit gets removed from draw pile when summoned', async (t) => {
  const unitName1 = 'Geralt of Rivia'
  const unitName2 = 'Roach'

  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1],
      excludeHandUnitNames: [unitName2],
    },
  })
  await gameManager.initialize({})

  await GamePage.switchDeckPartSelected(GameUnitOrigin.Undrawn)
  await t.expect(gameManager.self.deck.undrawn.map((undrawn) => undrawn.unit.name)).contains(unitName2)
  await gameManager.verify({
    deckPartSelected: GameUnitOrigin.Undrawn,
  })
  await GamePage.switchDeckPartSelected(GameUnitOrigin.Hand)

  await gameManager.deploy({
    unitName: unitName1,
    mustering: [
      {
        name: unitName2,
        effectiveStrength: 3,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })

  await GamePage.switchDeckPartSelected(GameUnitOrigin.Undrawn)
  await t.expect(gameManager.self.deck.undrawn.map((undrawn) => undrawn.unit.name)).notContains(unitName2)
  await gameManager.verify({
    deckPartSelected: GameUnitOrigin.Undrawn,
  })
})

test('Units get removed from undrawn pile when spying', async (t) => {
  const unitName1 = 'Sigismund Dijkstra'

  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1],
      deckUnitNames: [
        unitName1,
        // only units without "duplicates" (i.e. all units in deck have unique names)
        'Ballista',
        'Cow',
        'Dandelion',
        'Dethmold',
        'Dun Banner Medic',
        'Emiel Regis Rohellec Terzieff',
        'Kaedweni Siege Expert',
        'Keira Metz',
        'Olgierd Von Everec',
        'Prince Stennis',
        'Roach',
        'Sabrina Glevissig',
        'Sheldon Skaggs',
        'Siege Tower',
        'Siegfried of Denesle',
        'Sile de Tansarville',
        'Thaler',
        'Ves',
        'Vesemir',
        'Villentretenmerth',
        'Yarpen Zigrin',
        'Zoltan Chivay',
      ],
    },
  })
  const handUnitIds = gameManager.self.deck.hand.map((handUnit) => handUnit.unit.id)
  await gameManager.initialize({})

  await GamePage.switchDeckPartSelected(GameUnitOrigin.Undrawn)
  await gameManager.verify({
    deckPartSelected: GameUnitOrigin.Undrawn,
  })
  await GamePage.switchDeckPartSelected(GameUnitOrigin.Hand)

  await gameManager.deploy({
    unitName: unitName1,
    spying: {
      effectiveStrength: 4,
      name: unitName1,
      opponent: gameManager.opponent.gamePlayer,
      player: gameManager.self.gamePlayer,
      row: Combat.Close,
    },
  })

  const newHandUnits = sortObjectArray({
    array: gameManager.self.deck.hand.filter((handUnit) => !handUnitIds.includes(handUnit.unit.id)),
    sortProperties: ['unit.name', 'unit.id'],
  })

  await GamePage.switchDeckPartSelected(GameUnitOrigin.Undrawn)
  await t.expect(gameManager.self.deck.undrawn.map((undrawn) => undrawn.unit.name)).notContains(newHandUnits[0].unit.id)
  await t.expect(gameManager.self.deck.undrawn.map((undrawn) => undrawn.unit.name)).notContains(newHandUnits[1].unit.id)
  await gameManager.verify({
    deckPartSelected: GameUnitOrigin.Undrawn,
  })
})

test('Unit gets removed from discard pile when revived', async (t) => {
  const unitName1 = 'Ves'
  const unitName2 = 'Dun Banner Medic'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1, unitName2],
    },
  })
  await gameManager.deploy({
    unitName: unitName1,
  })
  await gameManager.pass({})
  await gameManager.pass({
    switchTurnsWith: gameManager.self.gamePlayer,
  })

  await gameManager.initialize({})

  await GamePage.switchDeckPartSelected(GameUnitOrigin.Discard)
  await t.expect(gameManager.self.deck.discard.map((undrawn) => undrawn.unit.name)).contains(unitName1)
  await gameManager.verify({
    deckPartSelected: GameUnitOrigin.Discard,
  })
  await GamePage.switchDeckPartSelected(GameUnitOrigin.Hand)

  await gameManager.deploy({
    unitName: unitName2,
    combat: Combat.Siege,
    medicing: true,
  })
  await gameManager.deploy({
    unitName: unitName1,
    revivedBy: unitName2,
  })

  await GamePage.switchDeckPartSelected(GameUnitOrigin.Discard)
  await t.expect(gameManager.self.deck.discard.map((undrawn) => undrawn.unit.name)).notContains(unitName1)
  await gameManager.verify({
    deckPartSelected: GameUnitOrigin.Discard,
  })
})

test('Avenger summoned from discard pile gets removed from it on scorch', async (t) => {
  const unitName1 = 'Cow'
  const unitName2 = 'Scorch'
  const unitName3 = 'Bovine Defense Force'
  const unitName4 = 'Dun Banner Medic'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1, unitName4],
    },
    opponent: {
      faction: FactionKey.NilfgaardianEmpire,
      handUnitNames: [unitName2, unitName2, unitName2],
    },
  })
  await gameManager.deploy({
    unitName: unitName1,
    combat: Combat.Ranged,
  })
  await gameManager.deploy({
    unitName: unitName2,
    scorching: [
      {
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
      },
    ],
    avenging: [
      {
        name: unitName3,
        effectiveStrength: 8,
        newUnitPlayer: gameManager.self.gamePlayer,
        turn: gameManager.opponent.gamePlayer,
        row: Combat.Close,
      },
    ],
  })
  await gameManager.pass({})
  await gameManager.pass({
    switchTurnsWith: gameManager.self.gamePlayer,
  })

  await gameManager.deploy({
    unitName: unitName4,
    medicing: true,
  })
  await gameManager.deploy({
    unitName: unitName1,
    combat: Combat.Ranged,
    revivedBy: unitName4,
  })
  await gameManager.deploy({
    unitName: unitName2,
    scorching: [
      {
        name: unitName4,
        player: gameManager.self.gamePlayer,
        row: Combat.Siege,
        strength: 5,
      },
    ],
  })
  await gameManager.pass({})
  await gameManager.initialize({})

  await GamePage.switchDeckPartSelected(GameUnitOrigin.Discard)
  await t.expect(gameManager.self.deck.discard.map((undrawn) => undrawn.unit.name)).contains(unitName3)
  await gameManager.verify({
    deckPartSelected: GameUnitOrigin.Discard,
  })

  await gameManager.deploy({
    unitName: unitName2,
    scorching: [
      {
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
      },
    ],
    avenging: [
      {
        name: unitName3,
        effectiveStrength: 8,
        newUnitPlayer: gameManager.self.gamePlayer,
        turn: gameManager.opponent.gamePlayer,
        row: Combat.Close,
        origin: GameUnitOrigin.Discard,
      },
    ],
    deckPartSelected: GameUnitOrigin.Discard,
  })

  await t.expect(gameManager.self.deck.discard.map((undrawn) => undrawn.unit.name)).notContains(unitName3)
  await gameManager.verify({
    deckPartSelected: GameUnitOrigin.Discard,
  })
})

test('Avenger summoned from discard pile gets removed from it on round end', async (t) => {
  const unitName1 = 'Cow'
  const unitName2 = 'Scorch'
  const unitName3 = 'Bovine Defense Force'
  const unitName4 = 'Dun Banner Medic'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1, unitName4],
    },
    opponent: {
      faction: FactionKey.NilfgaardianEmpire,
      handUnitNames: [unitName2, unitName2, unitName2],
    },
  })
  await gameManager.deploy({
    unitName: unitName1,
    combat: Combat.Ranged,
  })
  await gameManager.deploy({
    unitName: unitName2,
    scorching: [
      {
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
      },
    ],
    avenging: [
      {
        name: unitName3,
        effectiveStrength: 8,
        newUnitPlayer: gameManager.self.gamePlayer,
        turn: gameManager.opponent.gamePlayer,
        row: Combat.Close,
      },
    ],
  })

  await gameManager.deploy({
    unitName: unitName4,
    medicing: true,
  })
  await gameManager.deploy({
    unitName: unitName1,
    combat: Combat.Ranged,
    revivedBy: unitName4,
  })
  await gameManager.deploy({
    unitName: unitName2,
    scorching: [
      {
        name: unitName3,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        strength: 8,
      },
    ],
  })
  await gameManager.pass({})
  await gameManager.initialize({})

  await GamePage.switchDeckPartSelected(GameUnitOrigin.Discard)
  await t.expect(gameManager.self.deck.discard.map((undrawn) => undrawn.unit.name)).contains(unitName3)
  await gameManager.verify({
    deckPartSelected: GameUnitOrigin.Discard,
  })

  await gameManager.pass({
    avenging: [
      {
        name: unitName3,
        effectiveStrength: 8,
        newUnitPlayer: gameManager.self.gamePlayer,
        turn: gameManager.opponent.gamePlayer,
        row: Combat.Close,
        origin: GameUnitOrigin.Discard,
      },
    ],
    deckPartSelected: GameUnitOrigin.Discard,
  })

  await t.expect(gameManager.self.deck.discard.map((undrawn) => undrawn.unit.name)).notContains(unitName3)
  await gameManager.verify({
    deckPartSelected: GameUnitOrigin.Discard,
  })
})

test('Avenger summoned from hand gets removed from it on scorch', async (t) => {
  const unitName1 = 'Cow'
  const unitName2 = 'Letho of Gulet'
  const unitName3 = 'Decoy'
  const unitName4 = 'Scorch'
  const unitName5 = 'Bovine Defense Force'
  const unitName6 = 'Dun Banner Medic'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1, unitName3, unitName6],
    },
    opponent: {
      faction: FactionKey.NilfgaardianEmpire,
      handUnitNames: [unitName2, unitName4, unitName4, unitName4],
    },
  })
  await gameManager.deploy({
    unitName: unitName1,
    combat: Combat.Ranged,
  })
  await gameManager.deploy({
    unitName: unitName4,
    scorching: [
      {
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
      },
    ],
    avenging: [
      {
        name: unitName5,
        effectiveStrength: 8,
        newUnitPlayer: gameManager.self.gamePlayer,
        turn: gameManager.opponent.gamePlayer,
        row: Combat.Close,
      },
    ],
  })
  await gameManager.deploy({
    unitName: unitName3,
    decoying: {
      name: unitName5,
      effectiveStrength: 8,
      player: gameManager.self.gamePlayer,
      row: Combat.Close,
    },
  })

  await gameManager.deploy({
    unitName: unitName2,
  })

  await gameManager.deploy({
    unitName: unitName6,
    medicing: true,
  })
  await gameManager.deploy({
    unitName: unitName1,
    combat: Combat.Ranged,
    revivedBy: unitName6,
  })
  await gameManager.deploy({
    unitName: unitName4,
    scorching: [
      {
        name: unitName6,
        player: gameManager.self.gamePlayer,
        row: Combat.Siege,
        strength: 5,
      },
    ],
  })
  await gameManager.pass({})
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName4,
    scorching: [
      {
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
      },
    ],
    avenging: [
      {
        name: unitName5,
        effectiveStrength: 8,
        newUnitPlayer: gameManager.self.gamePlayer,
        turn: gameManager.opponent.gamePlayer,
        row: Combat.Close,
        origin: GameUnitOrigin.Hand,
      },
    ],
  })
})

test('Avenger summoned from hand gets removed from it on round end', async (t) => {
  const unitName1 = 'Cow'
  const unitName2 = 'Scorch'
  const unitName3 = 'Bovine Defense Force'
  const unitName4 = 'Dun Banner Medic'
  const unitName5 = 'Decoy'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1, unitName4, unitName5],
    },
    opponent: {
      faction: FactionKey.NilfgaardianEmpire,
      handUnitNames: [unitName2, unitName2, unitName2],
    },
  })
  await gameManager.deploy({
    unitName: unitName1,
    combat: Combat.Ranged,
  })
  await gameManager.deploy({
    unitName: unitName2,
    scorching: [
      {
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
      },
    ],
    avenging: [
      {
        name: unitName3,
        effectiveStrength: 8,
        newUnitPlayer: gameManager.self.gamePlayer,
        turn: gameManager.opponent.gamePlayer,
        row: Combat.Close,
      },
    ],
  })
  await gameManager.deploy({
    unitName: unitName5,
    decoying: {
      name: unitName3,
      effectiveStrength: 8,
      player: gameManager.self.gamePlayer,
      row: Combat.Close,
    },
  })
  await gameManager.deploy({
    unitName: unitName2,
    scorching: [],
  })

  await gameManager.deploy({
    unitName: unitName4,
    medicing: true,
  })
  await gameManager.deploy({
    unitName: unitName1,
    combat: Combat.Ranged,
    revivedBy: unitName4,
  })
  await gameManager.pass({})
  await gameManager.initialize({})

  await gameManager.pass({
    switchTurnsWith: gameManager.self.gamePlayer,
    avenging: [
      {
        name: unitName3,
        effectiveStrength: 8,
        newUnitPlayer: gameManager.self.gamePlayer,
        turn: gameManager.self.gamePlayer,
        row: Combat.Close,
        origin: GameUnitOrigin.Hand,
      },
    ],
  })
})

test('Opponent scorching units from all players only moves self units to discard', async (t) => {
  const unitName1 = 'Forktail'
  const unitName2 = 'Ves'
  const unitName3 = 'Scorch'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName2],
    },
    opponent: {
      faction: FactionKey.Monsters,
      handUnitNames: [unitName1, unitName3],
    },
    opponentFirst: true,
  })
  await gameManager.deploy({
    unitName: unitName1,
  })
  await gameManager.deploy({
    unitName: unitName2,
  })

  await gameManager.initialize({})

  await GamePage.switchDeckPartSelected(GameUnitOrigin.Discard)
  await t.expect(gameManager.self.deck.discard.map((undrawn) => undrawn.unit.name)).notContains(unitName2)
  await gameManager.verify({
    deckPartSelected: GameUnitOrigin.Discard,
  })

  await gameManager.deploy({
    unitName: unitName3,
    scorching: [
      {
        name: unitName1,
        player: gameManager.opponent.gamePlayer,
        row: Combat.Close,
        strength: 5,
      },
      {
        name: unitName2,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        strength: 5,
      },
    ],
    deckPartSelected: GameUnitOrigin.Discard,
  })

  await t.expect(gameManager.self.deck.discard.map((undrawn) => undrawn.unit.name)).contains(unitName2)
  await gameManager.verify({
    deckPartSelected: GameUnitOrigin.Discard,
  })
})
