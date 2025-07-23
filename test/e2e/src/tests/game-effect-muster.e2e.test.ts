import { Combat, FactionKey } from '@gwent/graphql-schema/resolver-typings'
import createGameManager from '../util/game-manager'
import { E2eCtx, getFixtureCtx, getTestCtx, getScenario } from '../util/e2e-ctx'
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
        impactable: true,
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
        impactable: true,
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
        impactable: true,
      },
      {
        effectiveStrength: 2,
        name: unitName,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        impactable: true,
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
        impactable: true,
        hand: true,
      },
      {
        effectiveStrength: 2,
        name: unitName,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        impactable: true,
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
        impactable: true,
        hand: true,
      },
      {
        effectiveStrength: 2,
        name: unitName,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        impactable: true,
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
        impactable: true,
      },
      {
        effectiveStrength: 6,
        name: unitName3,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        impactable: true,
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
        impactable: true,
        hand: true,
      },
      {
        effectiveStrength: 6,
        name: unitName3,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        impactable: true,
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
        impactable: true,
        hand: true,
      },
      {
        effectiveStrength: 6,
        name: unitName3,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        impactable: true,
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
        impactable: true,
      },
      {
        effectiveStrength: 4,
        name: unitName2,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
        impactable: true,
      },
      {
        effectiveStrength: 4,
        name: unitName2,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
        impactable: true,
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
        impactable: true,
      },
      {
        effectiveStrength: 4,
        name: unitName2,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
        impactable: true,
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
        impactable: true,
      },
      {
        effectiveStrength: 3,
        name: unitName2,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        impactable: true,
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
        impactable: true,
      },
      {
        effectiveStrength: 2,
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        impactable: true,
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
        operator: '+1',
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
        operator: '+1',
        strength: 4,
        reason: `Morale from ${unitName1}`,
      },
    ],
  })
})
