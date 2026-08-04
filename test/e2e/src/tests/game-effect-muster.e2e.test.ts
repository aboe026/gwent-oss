import { Combat, EffectKey, FactionKey } from '@gwent-oss/node-client'
import createGameManager from '../util/game-manager'
import { E2eCtx, getFixtureCtx, getTestCtx, getScenario } from '../util/e2e-ctx'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Game Effect Muster')

test('Muster works for single of same unit in undrawn', async (t) => {
  const unitName = 'Nekker'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Monsters,
      handUnitNames: [unitName],
      specialUnitNames: [unitName],
      excludeHandUnitNames: [unitName],
      ignoreUnitNames: [unitName],
    },
  })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName,
    mustering: [
      {
        effectiveStrength: 2,
        name: unitName,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        impact: {
          type: EffectKey.Muster,
        },
      },
    ],
  })
})

test('Muster works for single of same unit in hand', async (t) => {
  const unitName = 'Nekker'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Monsters,
      handUnitNames: [unitName, unitName],
      ignoreUnitNames: [unitName],
    },
  })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName,
    mustering: [
      {
        effectiveStrength: 2,
        name: unitName,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        impact: {
          type: EffectKey.Muster,
        },
        hand: true,
      },
    ],
  })
})

test('Muster works for single of different unit in undrawn', async (t) => {
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

  await gameManager.deploy({
    unitName: unitName1,
    mustering: [
      {
        effectiveStrength: 3,
        name: unitName2,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })
})

test('Muster works for single of different unit in hand', async (t) => {
  const unitName1 = 'Geralt of Rivia'
  const unitName2 = 'Roach'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1, unitName2],
    },
  })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName1,
    mustering: [
      {
        effectiveStrength: 3,
        name: unitName2,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        hand: true,
      },
    ],
  })
})

test('Muster works for multiple of same units in undrawn', async (t) => {
  const unitName = 'Nekker'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Monsters,
      handUnitNames: [unitName],
      excludeHandUnitNames: [unitName],
    },
  })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName,
    mustering: [
      {
        effectiveStrength: 2,
        name: unitName,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        impact: {
          type: EffectKey.Muster,
        },
      },
      {
        effectiveStrength: 2,
        name: unitName,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        impact: {
          type: EffectKey.Muster,
        },
      },
    ],
  })
})

test('Muster works for multiple of same units in hand', async (t) => {
  const unitName = 'Nekker'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Monsters,
      handUnitNames: [unitName, unitName, unitName],
    },
  })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName,
    mustering: [
      {
        effectiveStrength: 2,
        name: unitName,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        impact: {
          type: EffectKey.Muster,
        },
        hand: true,
      },
      {
        effectiveStrength: 2,
        name: unitName,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        impact: {
          type: EffectKey.Muster,
        },
        hand: true,
      },
    ],
  })
})

test('Muster works for multiple of same units in hand and undrawn', async (t) => {
  const unitName = 'Nekker'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Monsters,
      handUnitNames: [unitName, unitName],
      excludeHandUnitNames: [unitName],
    },
  })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName,
    mustering: [
      {
        effectiveStrength: 2,
        name: unitName,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        impact: {
          type: EffectKey.Muster,
        },
        hand: true,
      },
      {
        effectiveStrength: 2,
        name: unitName,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        impact: {
          type: EffectKey.Muster,
        },
      },
    ],
  })
})

test('Muster works for multiple of different units in undrawn', async (t) => {
  const unitName1 = 'Crone Brewess'
  const unitName2 = 'Crone Weavess'
  const unitName3 = 'Crone Whispess'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Monsters,
      handUnitNames: [unitName1],
      specialUnitNames: [unitName2, unitName3],
      excludeHandUnitNames: [unitName2, unitName3],
    },
  })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName1,
    mustering: [
      {
        effectiveStrength: 6,
        name: unitName2,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        impact: {
          type: EffectKey.Muster,
        },
      },
      {
        effectiveStrength: 6,
        name: unitName3,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        impact: {
          type: EffectKey.Muster,
        },
      },
    ],
  })
})

test('Muster works for multiple of different units in hand', async (t) => {
  const unitName1 = 'Crone Brewess'
  const unitName2 = 'Crone Weavess'
  const unitName3 = 'Crone Whispess'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Monsters,
      handUnitNames: [unitName1, unitName2, unitName3],
    },
  })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName1,
    mustering: [
      {
        effectiveStrength: 6,
        name: unitName2,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        impact: {
          type: EffectKey.Muster,
        },
        hand: true,
      },
      {
        effectiveStrength: 6,
        name: unitName3,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        impact: {
          type: EffectKey.Muster,
        },
        hand: true,
      },
    ],
  })
})

test('Muster works for multiple of different units in hand and undrawn', async (t) => {
  const unitName1 = 'Crone Brewess'
  const unitName2 = 'Crone Weavess'
  const unitName3 = 'Crone Whispess'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Monsters,
      handUnitNames: [unitName1, unitName2],
      specialUnitNames: [unitName3],
      excludeHandUnitNames: [unitName3],
    },
  })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName1,
    mustering: [
      {
        effectiveStrength: 6,
        name: unitName2,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        impact: {
          type: EffectKey.Muster,
        },
        hand: true,
      },
      {
        effectiveStrength: 6,
        name: unitName3,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        impact: {
          type: EffectKey.Muster,
        },
      },
    ],
  })
})

test("Gaunter O'Dimm musters Gaunter O'Dimm Darkness units", async (t) => {
  const unitName1 = "Gaunter O'Dimm"
  const unitName2 = "Gaunter O'Dimm Darkness"
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Monsters,
      handUnitNames: [unitName1],
      specialUnitNames: [unitName2],
      excludeHandUnitNames: [unitName2],
    },
  })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName1,
    combat: Combat.Siege,
    mustering: [
      {
        effectiveStrength: 4,
        name: unitName2,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
        impact: {
          type: EffectKey.Muster,
        },
      },
      {
        effectiveStrength: 4,
        name: unitName2,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
        impact: {
          type: EffectKey.Muster,
        },
      },
      {
        effectiveStrength: 4,
        name: unitName2,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
        impact: {
          type: EffectKey.Muster,
        },
      },
    ],
  })
})

test("Gaunter O'Dimm Darkness does not muster Gaunter O'Dimm unit", async (t) => {
  const unitName1 = "Gaunter O'Dimm"
  const unitName2 = "Gaunter O'Dimm Darkness"
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Monsters,
      handUnitNames: [unitName2],
      specialUnitNames: [unitName1],
      excludeHandUnitNames: [unitName2, unitName2],
    },
  })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName2,
    combat: Combat.Ranged,
    mustering: [
      {
        effectiveStrength: 4,
        name: unitName2,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
        impact: {
          type: EffectKey.Muster,
        },
      },
      {
        effectiveStrength: 4,
        name: unitName2,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
        impact: {
          type: EffectKey.Muster,
        },
      },
    ],
  })
})

test('Does not muster units in Lost pile', async (t) => {
  const unitName1 = "Gaunter O'Dimm"
  const unitName2 = "Gaunter O'Dimm Darkness"
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Monsters,
      handUnitNames: [unitName1, unitName2],
      excludeHandUnitNames: [unitName2, unitName2],
    },
  })
  await gameManager.deploy({
    unitName: unitName2,
    combat: Combat.Ranged,
    mustering: [
      {
        effectiveStrength: 4,
        name: unitName2,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
        impact: {
          type: EffectKey.Muster,
        },
      },
      {
        effectiveStrength: 4,
        name: unitName2,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
        impact: {
          type: EffectKey.Muster,
        },
      },
    ],
  })
  await gameManager.pass({})
  await gameManager.pass({
    switchTurnsWith: gameManager.self.gamePlayer,
  })

  await gameManager.initialize({})
  await gameManager.deploy({
    unitName: unitName1,
    mustering: [],
  })
})

test('Can muster same units as opponent', async (t) => {
  const unitName1 = 'Cirilla Fiona Elen Riannon'
  const unitName2 = 'Roach'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Monsters,
      handUnitNames: [unitName1],
      excludeHandUnitNames: [unitName2],
    },
    opponent: {
      faction: FactionKey.Monsters,
      handUnitNames: [unitName1],
      excludeHandUnitNames: [unitName2],
    },
    opponentFirst: true,
  })
  await gameManager.deploy({
    unitName: unitName1,
    mustering: [
      {
        name: unitName2,
        effectiveStrength: 3,
        player: gameManager.opponent.gamePlayer,
        row: Combat.Close,
      },
    ],
  })

  await gameManager.initialize({})
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
})
