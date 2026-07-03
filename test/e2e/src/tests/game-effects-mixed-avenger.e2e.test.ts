import { Combat, FactionKey, GameUnitOrigin } from '@gwent/node-client'
import createGameManager from '../util/game-manager'
import { E2eCtx, getFixtureCtx, getTestCtx, getScenario } from '../util/e2e-ctx'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Game Effects Mixed Avenger')

test('Cannot summon avenger by decoying', async (t) => {
  const unitName1 = 'Cow'
  const unitName2 = 'Decoy'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1, unitName2],
    },
  })
  await gameManager.deploy({
    unitName: unitName1,
    combat: Combat.Ranged,
  })
  await gameManager.pass({})
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName2,
    combat: Combat.Ranged,
    decoying: {
      name: unitName1,
      player: gameManager.self.gamePlayer,
      row: Combat.Ranged,
      effectiveStrength: 0,
    },
  })
})

test('Summoned avenger can be decoyed and played again', async (t) => {
  const unitName1 = 'Cow'
  const unitName2 = 'Bovine Defense Force'
  const unitName3 = 'Decoy'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1, unitName3],
    },
  })
  await gameManager.deploy({
    unitName: unitName1,
    combat: Combat.Ranged,
  })
  await gameManager.pass({})
  await gameManager.pass({
    avenging: [
      {
        name: unitName2,
        effectiveStrength: 8,
        turn: gameManager.self.gamePlayer,
        newUnitPlayer: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })
  await gameManager.initialize({})

  await gameManager.pass({})
  await gameManager.deploy({
    unitName: unitName3,
    decoying: {
      effectiveStrength: 8,
      name: unitName2,
      player: gameManager.self.gamePlayer,
      row: Combat.Close,
    },
  })
  await gameManager.deploy({
    unitName: unitName2,
  })
})

test('Summoned avenger does not carry over horn', async (t) => {
  const unitName1 = 'Cow'
  const unitName2 = "Commander's Horn"
  const unitName3 = 'Bovine Defense Force'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1, unitName2],
    },
  })
  await gameManager.deploy({
    unitName: unitName1,
    combat: Combat.Ranged,
  })
  await gameManager.pass({})
  await gameManager.deploy({
    unitName: unitName2,
    combat: Combat.Ranged,
    modifier: true,
    horning: [
      {
        effectiveStrength: 0,
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
      },
    ],
  })
  await gameManager.initialize({})

  await gameManager.pass({
    avenging: [
      {
        name: unitName3,
        effectiveStrength: 8,
        turn: gameManager.self.gamePlayer,
        newUnitPlayer: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })
})

test('Summoned avenger can be horned', async (t) => {
  const unitName1 = 'Cow'
  const unitName2 = 'Bovine Defense Force'
  const unitName3 = "Commander's Horn"
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1, unitName3],
    },
  })
  await gameManager.deploy({
    unitName: unitName1,
    combat: Combat.Ranged,
  })
  await gameManager.pass({})
  await gameManager.pass({
    switchTurnsWith: gameManager.opponent.gamePlayer,
    avenging: [
      {
        name: unitName2,
        effectiveStrength: 8,
        turn: gameManager.self.gamePlayer,
        newUnitPlayer: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })
  await gameManager.pass({})
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName3,
    combat: Combat.Close,
    modifier: true,
    horning: [
      {
        effectiveStrength: 16,
        name: unitName2,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })
})

test('Summoned avenger does not carry over morale', async (t) => {
  const unitName1 = 'Cow'
  const unitName2 = 'Milva'
  const unitName3 = 'Bovine Defense Force'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1, unitName2],
    },
  })
  await gameManager.deploy({
    unitName: unitName1,
    combat: Combat.Ranged,
  })
  await gameManager.pass({})
  await gameManager.deploy({
    unitName: unitName2,
    moraling: [
      {
        effectiveStrength: 1,
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
      },
    ],
  })
  await gameManager.initialize({})

  await gameManager.pass({
    switchTurnsWith: gameManager.self.gamePlayer,
    avenging: [
      {
        name: unitName3,
        effectiveStrength: 8,
        turn: gameManager.self.gamePlayer,
        newUnitPlayer: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })
})

test('Summoned avenger can be moraled', async (t) => {
  const unitName1 = 'Cow'
  const unitName2 = 'Bovine Defense Force'
  const unitName3 = 'Isengrim Faoiltiarna'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1, unitName3],
    },
  })
  await gameManager.deploy({
    unitName: unitName1,
    combat: Combat.Ranged,
  })
  await gameManager.pass({})
  await gameManager.pass({
    avenging: [
      {
        name: unitName2,
        effectiveStrength: 8,
        turn: gameManager.self.gamePlayer,
        newUnitPlayer: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })
  await gameManager.pass({})
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName3,
    moraling: [
      {
        effectiveStrength: 9,
        name: unitName2,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })
})

test('Summoned avenger does not carry over weather', async (t) => {
  const unitName1 = 'Cow'
  const unitName2 = 'Impenetrable Fog'
  const unitName3 = 'Bovine Defense Force'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1, unitName2],
    },
  })
  await gameManager.deploy({
    unitName: unitName1,
    combat: Combat.Ranged,
  })
  await gameManager.pass({})
  await gameManager.deploy({
    unitName: unitName2,
    weather: true,
    weathering: [],
  })
  await gameManager.initialize({})

  await gameManager.pass({
    avenging: [
      {
        name: unitName3,
        effectiveStrength: 8,
        turn: gameManager.self.gamePlayer,
        newUnitPlayer: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })
})

test('Summoned avenger can be weathered', async (t) => {
  const unitName1 = 'Cow'
  const unitName2 = 'Bovine Defense Force'
  const unitName3 = 'Biting Frost'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1, unitName3],
    },
  })
  await gameManager.deploy({
    unitName: unitName1,
    combat: Combat.Ranged,
  })
  await gameManager.pass({})
  await gameManager.pass({
    avenging: [
      {
        name: unitName2,
        effectiveStrength: 8,
        turn: gameManager.self.gamePlayer,
        newUnitPlayer: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })
  await gameManager.initialize({})

  await gameManager.pass({})
  await gameManager.deploy({
    unitName: unitName3,
    weather: true,
    weathering: [
      {
        name: unitName2,
        player: gameManager.self.gamePlayer,
        effectiveStrength: 1,
        row: Combat.Close,
      },
    ],
  })
})

test('Can summon avenger after scorched to discard', async (t) => {
  const unitName1 = 'Cow'
  const unitName2 = 'Ballista'
  const unitName3 = 'Bovine Defense Force'
  const unitName4 = 'Scorch'
  const unitName5 = 'Dun Banner Medic'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1, unitName4, unitName5],
    },
    opponent: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName2],
    },
  })
  await gameManager.deploy({
    unitName: unitName1,
    combat: Combat.Ranged,
  })
  await gameManager.deploy({
    unitName: unitName2,
  })
  await gameManager.pass({})
  await gameManager.pass({
    switchTurnsWith: gameManager.opponent.gamePlayer,
    avenging: [
      {
        name: unitName3,
        effectiveStrength: 8,
        turn: gameManager.opponent.gamePlayer,
        newUnitPlayer: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })
  await gameManager.pass({})

  await gameManager.deploy({
    unitName: unitName4,
    scorching: [
      {
        name: unitName3,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        strength: 8,
      },
    ],
  })
  await gameManager.deploy({
    unitName: unitName5,
    medicing: true,
  })
  await gameManager.deploy({
    unitName: unitName1,
    revivedBy: unitName5,
  })
  await gameManager.initialize({})

  await gameManager.pass({
    switchTurnsWith: gameManager.self.gamePlayer,
    avenging: [
      {
        name: unitName3,
        effectiveStrength: 8,
        turn: gameManager.self.gamePlayer,
        newUnitPlayer: gameManager.self.gamePlayer,
        row: Combat.Close,
        origin: GameUnitOrigin.Discard,
      },
    ],
  })
})

test('Can summon avenger after decoyed to hand', async (t) => {
  const unitName1 = 'Cow'
  const unitName2 = 'Ballista'
  const unitName3 = 'Bovine Defense Force'
  const unitName4 = 'Decoy'
  const unitName5 = 'Dun Banner Medic'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1, unitName4, unitName5],
    },
    opponent: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName2],
    },
  })
  await gameManager.deploy({
    unitName: unitName1,
    combat: Combat.Ranged,
  })
  await gameManager.deploy({
    unitName: unitName2,
  })
  await gameManager.pass({})
  await gameManager.pass({
    switchTurnsWith: gameManager.opponent.gamePlayer,
    avenging: [
      {
        name: unitName3,
        effectiveStrength: 8,
        turn: gameManager.opponent.gamePlayer,
        newUnitPlayer: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })
  await gameManager.pass({})

  await gameManager.deploy({
    unitName: unitName4,
    decoying: {
      name: unitName3,
      effectiveStrength: 8,
      player: gameManager.self.gamePlayer,
      row: Combat.Close,
    },
  })
  await gameManager.deploy({
    unitName: unitName5,
    medicing: true,
  })
  await gameManager.deploy({
    unitName: unitName1,
    revivedBy: unitName5,
  })
  await gameManager.initialize({})

  await gameManager.pass({
    switchTurnsWith: gameManager.self.gamePlayer,
    avenging: [
      {
        name: unitName3,
        effectiveStrength: 8,
        turn: gameManager.self.gamePlayer,
        newUnitPlayer: gameManager.self.gamePlayer,
        row: Combat.Close,
        origin: GameUnitOrigin.Hand,
      },
    ],
  })
})

test('Cannot summon avenger already on battlefield', async (t) => {
  const unitName1 = 'Cow'
  const unitName2 = 'Bovine Defense Force'
  const unitName3 = 'Foglet'
  const unitName4 = 'Philippa Eilhart'
  const unitName5 = 'Earth Elemental'
  const unitName6 = 'Dun Banner Medic'
  const unitName7 = 'Toad'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1, unitName4, unitName6],
    },
    opponent: {
      faction: FactionKey.Monsters,
      handUnitNames: [unitName3, unitName5, unitName7],
    },
  })
  await gameManager.deploy({
    unitName: unitName1,
    combat: Combat.Ranged,
  })
  await gameManager.pass({})
  await gameManager.pass({
    switchTurnsWith: gameManager.opponent.gamePlayer,
    avenging: [
      {
        name: unitName2,
        effectiveStrength: 8,
        turn: gameManager.self.gamePlayer,
        newUnitPlayer: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })

  await gameManager.deploy({
    unitName: unitName3,
  })
  await gameManager.deploy({
    unitName: unitName4,
    combat: Combat.Ranged,
    hero: true,
  })
  await gameManager.deploy({
    unitName: unitName5,
    combat: Combat.Siege,
  })
  await gameManager.deploy({
    unitName: unitName6,
    medicing: true,
  })
  await gameManager.deploy({
    unitName: unitName1,
    revivedBy: unitName6,
  })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName7,
    scorching: [
      {
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
      },
    ],
  })
})
