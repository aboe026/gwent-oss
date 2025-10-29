import { Combat, EffectKey, FactionKey } from '@gwent/node-client'
import createGameManager from '../util/game-manager'
import { E2eCtx, getFixtureCtx, getTestCtx, getScenario } from '../util/e2e-ctx'
import { EFFECT_OPERATOR } from '@gwent/constants'
import FullCard from '../components/full-card'
import GamePage from '../page-objects/game-page'

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

test('Mustered single unit gets moraled if morale already present', async (t) => {
  const unitName1 = 'Olgierd Von Everec'
  const unitName2 = 'Geralt of Rivia'
  const unitName3 = 'Roach'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1, unitName2],
      excludeHandUnitNames: [unitName3],
    },
  })
  await gameManager.deploy({
    unitName: unitName1,
    combat: Combat.Close,
    moraling: [],
  })
  await gameManager.pass({})
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName2,
    mustering: [
      {
        effectiveStrength: 4,
        name: unitName3,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })
})

test('Mustered multiple units get moraled if morale already present', async (t) => {
  const unitName1 = 'Olgierd Von Everec'
  const unitName2 = 'Nekker'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Monsters,
      handUnitNames: [unitName1, unitName2],
      excludeHandUnitNames: [unitName2],
    },
  })
  await gameManager.deploy({
    unitName: unitName1,
    combat: Combat.Close,
    moraling: [],
  })
  await gameManager.pass({})
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName2,
    effectiveStrength: 3,
    mustering: [
      {
        effectiveStrength: 3,
        name: unitName2,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        impact: {
          type: EffectKey.Muster,
        },
      },
      {
        effectiveStrength: 3,
        name: unitName2,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        impact: {
          type: EffectKey.Muster,
        },
      },
    ],
  })
})

test('Mustered units are scorcheable', async (t) => {
  const unitName1 = 'Nekker'
  const unitName2 = 'Scorch'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Monsters,
      handUnitNames: [unitName1, unitName2],
      excludeHandUnitNames: [unitName1],
    },
  })
  await gameManager.deploy({
    unitName: unitName1,
    mustering: [
      {
        effectiveStrength: 2,
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        impact: {
          type: EffectKey.Muster,
        },
      },
      {
        effectiveStrength: 2,
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        impact: {
          type: EffectKey.Muster,
        },
      },
    ],
  })
  await gameManager.pass({})
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName2,
    scorching: [
      {
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        strength: 2,
      },
      {
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        strength: 2,
      },
      {
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        strength: 2,
      },
    ],
  })
})

test('Mustered units are moraleable', async (t) => {
  const unitName1 = 'Geralt of Rivia'
  const unitName2 = 'Roach'
  const unitName3 = 'Olgierd Von Everec'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1, unitName3],
      excludeHandUnitNames: [unitName2],
    },
  })
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
  await gameManager.pass({})

  await gameManager.initialize({})
  await gameManager.deploy({
    unitName: unitName3,
    combat: Combat.Close,
    moraling: [
      {
        effectiveStrength: 4,
        name: unitName2,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })
})

test('Mustered unit with morale shows morale in history', async (t) => {
  const unitName1 = 'Olgierd Von Everec'
  const unitName2 = 'Geralt of Rivia'
  const unitName3 = 'Roach'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1, unitName2],
      excludeHandUnitNames: [unitName3],
    },
  })
  await gameManager.deploy({
    unitName: unitName1,
    combat: Combat.Close,
    moraling: [],
  })
  await gameManager.pass({})
  await gameManager.deploy({
    unitName: unitName2,
    mustering: [
      {
        effectiveStrength: 4,
        name: unitName3,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })

  await gameManager.initialize({})
  await GamePage.selectHistoryMoveImage({
    unitName: unitName3,
    round: gameManager.round,
    userName: gameManager.self.gamePlayer.name,
  })
  const unit = await gameManager.self.client.getUnit({
    name: unitName3,
  })
  await FullCard.verify({
    unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 4,
    effects: [
      {
        operator: EFFECT_OPERATOR.Plus,
        strength: 4,
        reason: `Morale from ${unitName1}`,
      },
    ],
  })
  await FullCard.close()
  await GamePage.toggleImpacts({
    unitName: unitName2,
    round: gameManager.round,
    userName: gameManager.self.gamePlayer.name,
  })
  await GamePage.selectImpactImage({
    move: {
      round: gameManager.round,
      unitName: unitName2,
      userName: gameManager.self.gamePlayer.name,
    },
    impact: {
      unitName: unitName3,
      userName: gameManager.self.gamePlayer.name,
    },
  })
  await FullCard.verify({
    unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 4,
    effects: [
      {
        operator: EFFECT_OPERATOR.Plus,
        strength: 4,
        reason: `Morale from ${unitName1}`,
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

test('Can muster units with bonding', async (t) => {
  const unitName1 = 'Cerys'
  const unitName2 = 'Clan Drummond Shield Maiden'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Skellige,
      handUnitNames: [unitName1, unitName2, unitName2, unitName2],
    },
  })
  await gameManager.initialize({})
  await gameManager.deploy({
    unitName: unitName1,
    mustering: [
      {
        name: unitName2,
        effectiveStrength: 16,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        impact: {
          type: EffectKey.Bond,
          instances: 2,
        },
        hand: true,
      },
      {
        name: unitName2,
        effectiveStrength: 16,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        impact: {
          type: EffectKey.Bond,
          instances: 2,
        },
        hand: true,
      },
      {
        name: unitName2,
        effectiveStrength: 16,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        impact: {
          type: EffectKey.Bond,
          instances: 2,
        },
        hand: true,
      },
    ],
  })
})

test('Can muster with berserker and mardroeme present', async (t) => {
  const unitName1 = 'Ermion'
  const unitName2 = 'Berserker'
  const unitName3 = 'Cerys'
  const unitName4 = 'Clan Drummond Shield Maiden'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Skellige,
      handUnitNames: [unitName1, unitName3, unitName4],
      ignoreUnitNames: [unitName4, unitName4],
    },
    opponent: {
      faction: FactionKey.Skellige,
      handUnitNames: [unitName2],
    },
  })
  await gameManager.deploy({ unitName: unitName1, combat: Combat.Ranged, mardroeming: [] })
  await gameManager.deploy({ unitName: unitName2 })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName3,
    mustering: [
      {
        name: unitName4,
        effectiveStrength: 4,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        impact: {
          type: EffectKey.Bond,
        },
        hand: true,
      },
    ],
  })
})

test('Mustered units effected by horn', async (t) => {
  const unitName1 = 'Dandelion'
  const unitName2 = 'Ghoul'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Monsters,
      handUnitNames: [unitName1, unitName2, unitName2, unitName2],
    },
  })
  await gameManager.deploy({ unitName: unitName1, horning: [] })
  await gameManager.pass({})
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName2,
    effectiveStrength: 2,
    mustering: [
      {
        effectiveStrength: 2,
        name: unitName2,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        impact: {
          type: EffectKey.Muster,
        },
        hand: true,
      },
      {
        effectiveStrength: 2,
        name: unitName2,
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
