import createGameManager from '../util/game-manager'
import { Combat, EffectKey, FactionKey } from '@gwent/node-client'
import { E2eCtx, getFixtureCtx, getTestCtx, getScenario } from '../util/e2e-ctx'
import { EFFECT_OPERATOR } from '@gwent/constants'
import FullCard from '../components/full-card'
import GamePage from '../page-objects/game-page'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Game Effect Mixed')

test('Bond does not take into account scorched units', async (t) => {
  const unitName1 = 'Blue Stripes Commando'
  const unitName2 = 'Scorch'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1, unitName1, unitName1],
    },
    opponent: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName2],
    },
  })
  await gameManager.deploy({ unitName: unitName1, bonding: [] })
  await gameManager.deploy({
    unitName: unitName2,
    scorching: [
      {
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        strength: 4,
      },
    ],
  })
  const deckUnit1 = await gameManager.deploy({ unitName: unitName1, bonding: [] })
  await gameManager.pass({})

  await gameManager.initialize({})
  const deckUnit2 = await gameManager.deploy({
    unitName: unitName1,
    effectiveStrength: 8,
    bonding: [
      {
        effectiveStrength: 8,
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })
  await GamePage.fullscreenCombatCard({
    unitName: unitName1,
    row: Combat.Close,
    self: true,
  })
  await FullCard.verify({
    unit: deckUnit1.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 8,
    effects: [
      {
        operator: EFFECT_OPERATOR.Double,
        strength: 8,
        reason: `Bond from ${unitName1}`,
      },
    ],
  })
  await FullCard.next()
  await FullCard.verify({
    unit: deckUnit2.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 8,
    effects: [
      {
        operator: EFFECT_OPERATOR.Double,
        strength: 8,
        reason: `Bond from ${unitName1}`,
      },
    ],
  })
})

test('Can bond moraled unit', async (t) => {
  const unitName1 = 'Olgierd Von Everec'
  const unitName2 = 'Blue Stripes Commando'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1, unitName2, unitName2],
    },
  })
  const deckUnit1 = await gameManager.deploy({ unitName: unitName1, moraling: [] })
  await gameManager.pass({})
  const deckUnit2 = await gameManager.deploy({
    unitName: unitName2,
    effectiveStrength: 5,
    bonding: [],
  })

  await gameManager.initialize({})
  const deckUnit3 = await gameManager.deploy({
    unitName: unitName2,
    effectiveStrength: 9,
    bonding: [
      {
        effectiveStrength: 9,
        name: unitName2,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })
  await GamePage.fullscreenCombatCard({
    unitName: unitName1,
    row: Combat.Close,
    self: true,
  })
  await FullCard.verify({
    unit: deckUnit1.unit,
    username: gameManager.self.gamePlayer.name,
  })
  await FullCard.next()
  await FullCard.verify({
    unit: deckUnit2.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 9,
    effects: [
      {
        operator: EFFECT_OPERATOR.Double,
        strength: 8,
        reason: `Bond from ${unitName2}`,
      },
      {
        operator: EFFECT_OPERATOR.Plus,
        strength: 9,
        reason: `Morale from ${unitName1}`,
      },
    ],
  })
  await FullCard.next()
  await FullCard.verify({
    unit: deckUnit3.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 9,
    effects: [
      {
        operator: EFFECT_OPERATOR.Double,
        strength: 8,
        reason: `Bond from ${unitName2}`,
      },
      {
        operator: EFFECT_OPERATOR.Plus,
        strength: 9,
        reason: `Morale from ${unitName1}`,
      },
    ],
  })
})

test('Horn effect applied after bond', async (t) => {
  const unitName1 = 'Clan an Craite Warrior'
  const unitName2 = 'Dandelion'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Skellige,
      handUnitNames: [unitName1, unitName1, unitName2],
    },
  })
  const deckUnit1 = await gameManager.deploy({ unitName: unitName1, bonding: [] })
  await gameManager.pass({})
  const deckUnit2 = await gameManager.deploy({
    unitName: unitName1,
    effectiveStrength: 12,
    bonding: [
      {
        effectiveStrength: 12,
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })
  await gameManager.initialize({})

  const deckUnit3 = await gameManager.deploy({
    unitName: unitName2,
    horning: [
      {
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        effectiveStrength: 24,
      },
      {
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        effectiveStrength: 24,
        instance: 2,
      },
    ],
  })
  await GamePage.fullscreenCombatCard({
    unitName: unitName1,
    row: Combat.Close,
    self: true,
    instance: 2,
  })
  await FullCard.verify({
    unit: deckUnit2.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 24,
    effects: [
      {
        operator: EFFECT_OPERATOR.Double,
        strength: 12,
        reason: `Bond from ${unitName1}`,
      },
      {
        operator: EFFECT_OPERATOR.Double,
        strength: 24,
        reason: `Horn from ${unitName2}`,
      },
    ],
  })
  await FullCard.previous()
  await FullCard.verify({
    unit: deckUnit1.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 24,
    effects: [
      {
        operator: EFFECT_OPERATOR.Double,
        strength: 12,
        reason: `Bond from ${unitName1}`,
      },
      {
        operator: EFFECT_OPERATOR.Double,
        strength: 24,
        reason: `Horn from ${unitName2}`,
      },
    ],
  })
  await FullCard.previous()
  await FullCard.verify({
    unit: deckUnit3.unit,
    username: gameManager.self.gamePlayer.name,
  })
})

test('Horn effect applied after morale', async (t) => {
  const unitName1 = 'Clan an Craite Warrior'
  const unitName2 = 'Olaf'
  const unitName3 = 'Dandelion'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Skellige,
      handUnitNames: [unitName1, unitName2, unitName3],
    },
  })
  const deckUnit1 = await gameManager.deploy({ unitName: unitName1, bonding: [] })
  await gameManager.pass({})
  const deckUnit2 = await gameManager.deploy({
    unitName: unitName2,
    moraling: [
      {
        effectiveStrength: 7,
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })
  await gameManager.initialize({})

  const deckUnit3 = await gameManager.deploy({
    unitName: unitName3,
    effectiveStrength: 3,
    horning: [
      {
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        effectiveStrength: 14,
      },
      {
        name: unitName2,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        effectiveStrength: 24,
      },
    ],
  })
  await GamePage.fullscreenCombatCard({
    unitName: unitName2,
    row: Combat.Close,
    self: true,
  })
  await FullCard.verify({
    unit: deckUnit2.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 24,
    effects: [
      {
        operator: EFFECT_OPERATOR.Double,
        strength: 24,
        reason: `Horn from ${unitName3}`,
      },
    ],
  })
  await FullCard.previous()
  await FullCard.verify({
    unit: deckUnit1.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 14,
    effects: [
      {
        operator: EFFECT_OPERATOR.Plus,
        strength: 7,
        reason: `Morale from ${unitName2}`,
      },
      {
        operator: EFFECT_OPERATOR.Double,
        strength: 14,
        reason: `Horn from ${unitName3}`,
      },
    ],
  })
  await FullCard.previous()
  await FullCard.verify({
    unit: deckUnit3.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 3,
    effects: [
      {
        operator: EFFECT_OPERATOR.Plus,
        strength: 3,
        reason: `Morale from ${unitName2}`,
      },
    ],
  })
})

test('Horn effect applies after bond and morale', async (t) => {
  const unitName1 = 'Clan an Craite Warrior'
  const unitName2 = 'Olaf'
  const unitName3 = 'Dandelion'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Skellige,
      handUnitNames: [unitName1, unitName1, unitName2, unitName3],
    },
  })
  const deckUnit1 = await gameManager.deploy({ unitName: unitName1, bonding: [] })
  await gameManager.pass({})
  const deckUnit2 = await gameManager.deploy({
    unitName: unitName1,
    effectiveStrength: 12,
    bonding: [
      {
        effectiveStrength: 12,
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })
  const deckUnit3 = await gameManager.deploy({
    unitName: unitName2,
    moraling: [
      {
        effectiveStrength: 13,
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
      {
        effectiveStrength: 13,
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        instance: 2,
      },
    ],
  })
  await gameManager.initialize({})

  const deckUnit4 = await gameManager.deploy({
    unitName: unitName3,
    effectiveStrength: 3,
    horning: [
      {
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        effectiveStrength: 26,
      },
      {
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        effectiveStrength: 26,
        instance: 2,
      },
      {
        name: unitName2,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        effectiveStrength: 24,
      },
    ],
  })
  await GamePage.fullscreenCombatCard({
    unitName: unitName1,
    row: Combat.Close,
    self: true,
    instance: 2,
  })
  await FullCard.verify({
    unit: deckUnit2.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 26,
    effects: [
      {
        operator: EFFECT_OPERATOR.Double,
        strength: 12,
        reason: `Bond from ${unitName1}`,
      },
      {
        operator: EFFECT_OPERATOR.Plus,
        strength: 13,
        reason: `Morale from ${unitName2}`,
      },
      {
        operator: EFFECT_OPERATOR.Double,
        strength: 26,
        reason: `Horn from ${unitName3}`,
      },
    ],
  })
  await FullCard.previous()
  await FullCard.verify({
    unit: deckUnit1.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 26,
    effects: [
      {
        operator: EFFECT_OPERATOR.Double,
        strength: 12,
        reason: `Bond from ${unitName1}`,
      },
      {
        operator: EFFECT_OPERATOR.Plus,
        strength: 13,
        reason: `Morale from ${unitName2}`,
      },
      {
        operator: EFFECT_OPERATOR.Double,
        strength: 26,
        reason: `Horn from ${unitName3}`,
      },
    ],
  })
  await FullCard.previous()
  await FullCard.verify({
    unit: deckUnit3.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 24,
    effects: [
      {
        operator: EFFECT_OPERATOR.Double,
        strength: 24,
        reason: `Horn from ${unitName3}`,
      },
    ],
  })
  await FullCard.previous()
  await FullCard.verify({
    unit: deckUnit4.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 3,
    effects: [
      {
        operator: EFFECT_OPERATOR.Plus,
        strength: 3,
        reason: `Morale from ${unitName2}`,
      },
    ],
  })
})

test('Horn effect for berserker transfers to vildkaarl after mardroeme', async (t) => {
  const unitName1 = 'Berserker'
  const unitName2 = 'Dandelion'
  const unitName3 = 'Mardroeme'
  const unitName4 = 'Transformed Vildkaarl'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Skellige,
      handUnitNames: [unitName1, unitName2, unitName3],
    },
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({})
  const deckUnit1 = await gameManager.deploy({
    unitName: unitName2,
    horning: [
      {
        name: unitName1,
        effectiveStrength: 8,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName3,
    modifier: true,
    mardroeming: [
      {
        name: unitName4,
        effectiveStrength: 28,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        impact: {
          type: EffectKey.Morale,
          instances: 1,
        },
        reason: unitName3,
      },
    ],
    moraling: [
      {
        effectiveStrength: 3,
        name: unitName2,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })

  await GamePage.fullscreenCombatCard({
    unitName: unitName4,
    row: Combat.Close,
    self: true,
  })
  const unit = await gameManager.self.client.getUnit({
    name: unitName4,
  })
  await FullCard.verify({
    unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 28,
    effects: [
      {
        operator: EFFECT_OPERATOR.Double,
        strength: 28,
        reason: `Horn from ${unitName2}`,
      },
    ],
  })
  await FullCard.previous()
  await FullCard.verify({
    unit: deckUnit1.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 3,
    effects: [
      {
        operator: EFFECT_OPERATOR.Plus,
        strength: 3,
        reason: `Morale from ${unitName4}`,
      },
    ],
  })
})

test('Young berserker transforms into Vildkaarl and bonds with existing ones', async (t) => {
  const unitName1 = 'Young Berserker'
  const unitName2 = 'Ermion'
  const unitName3 = 'Transformed Young Vildkaarl'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Skellige,
      handUnitNames: [unitName1, unitName1, unitName1, unitName2],
    },
  })
  await gameManager.deploy({ unitName: unitName1, combat: Combat.Ranged })
  await gameManager.pass({})
  await gameManager.deploy({
    unitName: unitName2,
    combat: Combat.Ranged,
    mardroeming: [
      {
        name: unitName3,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
        effectiveStrength: 8,
        reason: unitName2,
        impact: {
          type: EffectKey.Bond,
          instances: 0,
        },
      },
    ],
  })
  await gameManager.deploy({
    unitName: unitName1,
    combat: Combat.Ranged,
    impacts: -1,
    mardroeming: [
      {
        name: unitName3,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
        effectiveStrength: 16,
        reason: unitName2,
        impact: {
          type: EffectKey.Bond,
          instances: 1,
        },
      },
    ],
    bonding: [
      {
        effectiveStrength: 16,
        name: unitName3,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
      },
    ],
  })

  await gameManager.initialize({})
  await gameManager.deploy({
    unitName: unitName1,
    combat: Combat.Ranged,
    impacts: -1,
    mardroeming: [
      {
        name: unitName3,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
        effectiveStrength: 32,
        reason: unitName2,
        impact: {
          type: EffectKey.Bond,
          instances: 2,
        },
      },
    ],
    bonding: [
      {
        effectiveStrength: 32,
        name: unitName3,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
      },
      {
        effectiveStrength: 32,
        name: unitName3,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
      },
    ],
  })
})

test('Transformed Vildkaarl morales existing unit', async (t) => {
  const unitName1 = 'Madman Lugos'
  const unitName2 = 'Mardroeme'
  const unitName3 = 'Berserker'
  const unitName4 = 'Transformed Vildkaarl'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Skellige,
      handUnitNames: [unitName1, unitName2, unitName3],
    },
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({})
  await gameManager.deploy({ unitName: unitName2, modifier: true, mardroeming: [] })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName3,
    impacts: -1,
    mardroeming: [
      {
        name: unitName4,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        effectiveStrength: 14,
        reason: unitName2,
        impact: {
          type: EffectKey.Morale,
          instances: 1,
        },
      },
    ],
    moraling: [
      {
        name: unitName1,
        effectiveStrength: 7,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })
})

test('Transformed Vildkaarl morales new unit', async (t) => {
  const unitName1 = 'Mardroeme'
  const unitName2 = 'Madman Lugos'
  const unitName3 = 'Berserker'
  const unitName4 = 'Transformed Vildkaarl'
  const unitName5 = 'Udalryk'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Skellige,
      handUnitNames: [unitName1, unitName2, unitName3, unitName5],
    },
  })
  await gameManager.deploy({ unitName: unitName1, modifier: true, mardroeming: [] })
  await gameManager.pass({})
  await gameManager.deploy({ unitName: unitName2 })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName3,
    impacts: -1,
    mardroeming: [
      {
        name: unitName4,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        effectiveStrength: 14,
        reason: unitName1,
        impact: {
          type: EffectKey.Morale,
          instances: 1,
        },
      },
    ],
    moraling: [
      {
        name: unitName2,
        effectiveStrength: 7,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })
  await gameManager.deploy({
    unitName: unitName5,
    effectiveStrength: 5,
  })
})

test('Morale effect for other units goes away after it gets scorched', async (t) => {
  const unitName1 = 'Toruviel'
  const unitName2 = 'Vreemde'
  const unitName3 = 'Milva'
  const unitName4 = 'Scorch'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1, unitName3],
    },
    opponent: {
      faction: FactionKey.NilfgaardianEmpire,
      handUnitNames: [unitName2, unitName4],
    },
  })
  const deckUnit = await gameManager.deploy({ unitName: unitName1 })
  await gameManager.deploy({ unitName: unitName2 })
  await gameManager.deploy({
    unitName: unitName3,
    moraling: [
      {
        name: unitName1,
        effectiveStrength: 3,
        row: Combat.Ranged,
        player: gameManager.self.gamePlayer,
      },
    ],
  })
  await gameManager.initialize({})
  await GamePage.fullscreenCombatCard({
    unitName: unitName1,
    row: Combat.Ranged,
    self: true,
  })
  await FullCard.verify({
    unit: deckUnit.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 3,
    effects: [
      {
        operator: EFFECT_OPERATOR.Plus,
        strength: 3,
        reason: `Morale from ${unitName3}`,
      },
    ],
  })
  await FullCard.close()
  await GamePage.selectHistoryUnit({
    playerName: gameManager.self.gamePlayer.name,
    round: gameManager.round,
    row: Combat.Ranged,
    unitName: unitName1,
  })

  await gameManager.deploy({
    unitName: unitName4,
    scorching: [
      {
        name: unitName3,
        strength: 10,
        row: Combat.Ranged,
        player: gameManager.self.gamePlayer,
      },
    ],
    moraling: [
      {
        name: unitName1,
        effectiveStrength: 2,
        row: Combat.Ranged,
        player: gameManager.self.gamePlayer,
      },
    ],
  })
  await GamePage.fullscreenCombatCard({
    unitName: unitName1,
    row: Combat.Ranged,
    self: true,
  })
  await FullCard.verify({
    unit: deckUnit.unit,
    username: gameManager.self.gamePlayer.name,
  })
})

test('Morale effect for berserker transfers to vildkaarl after mardroeme', async (t) => {
  const unitName1 = 'Young Berserker'
  const unitName2 = 'Olaf'
  const unitName3 = 'Mardroeme'
  const unitName4 = 'Transformed Young Vildkaarl'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Skellige,
      handUnitNames: [unitName1, unitName2, unitName3],
    },
  })
  await gameManager.deploy({ unitName: unitName1, combat: Combat.Ranged })
  await gameManager.pass({})
  await gameManager.deploy({
    unitName: unitName2,
    combat: Combat.Ranged,
    moraling: [
      {
        name: unitName1,
        effectiveStrength: 3,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
      },
    ],
  })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName3,
    combat: Combat.Ranged,
    modifier: true,
    mardroeming: [
      {
        name: unitName4,
        effectiveStrength: 9,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
        impact: {
          type: EffectKey.Bond,
        },
        reason: unitName3,
      },
    ],
  })

  await GamePage.fullscreenCombatCard({
    unitName: unitName4,
    row: Combat.Ranged,
    self: true,
  })
  const unit = await gameManager.self.client.getUnit({
    name: unitName4,
  })
  await FullCard.verify({
    unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 9,
    effects: [
      {
        operator: EFFECT_OPERATOR.Plus,
        strength: 9,
        reason: `Morale from ${unitName2}`,
      },
    ],
  })
})

test('Morale applied to bonded units after bonding applied if played after bonds', async (t) => {
  const unitName1 = 'Catapult'
  const unitName2 = 'Kaedweni Siege Expert'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1, unitName1, unitName2],
    },
  })
  const deckUnit1 = await gameManager.deploy({ unitName: unitName1, combat: Combat.Siege, bonding: [] })
  await gameManager.pass({})
  const deckUnit2 = await gameManager.deploy({
    unitName: unitName1,
    effectiveStrength: 16,
    bonding: [
      {
        effectiveStrength: 16,
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Siege,
      },
    ],
  })
  await gameManager.initialize({})

  const deckUnit3 = await gameManager.deploy({
    unitName: unitName2,
    moraling: [
      {
        effectiveStrength: 17,
        row: Combat.Siege,
        name: unitName1,
        player: gameManager.self.gamePlayer,
      },
      {
        effectiveStrength: 17,
        row: Combat.Siege,
        name: unitName1,
        player: gameManager.self.gamePlayer,
        instance: 2,
      },
    ],
  })
  await GamePage.fullscreenCombatCard({
    unitName: unitName2,
    row: Combat.Siege,
    self: true,
  })
  await FullCard.verify({
    unit: deckUnit3.unit,
    username: gameManager.self.gamePlayer.name,
  })
  await FullCard.next()
  await FullCard.verify({
    unit: deckUnit1.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 17,
    effects: [
      {
        operator: EFFECT_OPERATOR.Double,
        strength: 16,
        reason: `Bond from ${unitName1}`,
      },
      {
        operator: EFFECT_OPERATOR.Plus,
        strength: 17,
        reason: `Morale from ${unitName2}`,
      },
    ],
  })
  await FullCard.next()
  await FullCard.verify({
    unit: deckUnit2.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 17,
    effects: [
      {
        operator: EFFECT_OPERATOR.Double,
        strength: 16,
        reason: `Bond from ${unitName1}`,
      },
      {
        operator: EFFECT_OPERATOR.Plus,
        strength: 17,
        reason: `Morale from ${unitName2}`,
      },
    ],
  })
})

test('Morale applied to bonded units after bonding applied if played before bonds', async (t) => {
  const unitName1 = 'Kaedweni Siege Expert'
  const unitName2 = 'Catapult'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1, unitName2, unitName2],
    },
  })
  const deckUnit1 = await gameManager.deploy({ unitName: unitName1, combat: Combat.Siege, moraling: [] })
  await gameManager.pass({})
  const deckUnit2 = await gameManager.deploy({
    unitName: unitName2,
    effectiveStrength: 9,
    bonding: [],
  })
  await gameManager.initialize({})

  const deckUnit3 = await gameManager.deploy({
    unitName: unitName2,
    effectiveStrength: 17,
    bonding: [
      {
        effectiveStrength: 17,
        row: Combat.Siege,
        name: unitName2,
        player: gameManager.self.gamePlayer,
      },
    ],
  })
  await GamePage.fullscreenCombatCard({
    unitName: unitName1,
    row: Combat.Siege,
    self: true,
  })
  await FullCard.verify({
    unit: deckUnit1.unit,
    username: gameManager.self.gamePlayer.name,
  })
  await FullCard.next()
  await FullCard.verify({
    unit: deckUnit2.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 17,
    effects: [
      {
        operator: EFFECT_OPERATOR.Double,
        strength: 16,
        reason: `Bond from ${unitName2}`,
      },
      {
        operator: EFFECT_OPERATOR.Plus,
        strength: 17,
        reason: `Morale from ${unitName1}`,
      },
    ],
  })
  await FullCard.next()
  await FullCard.verify({
    unit: deckUnit3.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 17,
    effects: [
      {
        operator: EFFECT_OPERATOR.Double,
        strength: 16,
        reason: `Bond from ${unitName2}`,
      },
      {
        operator: EFFECT_OPERATOR.Plus,
        strength: 17,
        reason: `Morale from ${unitName1}`,
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

test('Scorch takes into account morale to determine strongest', async (t) => {
  const unitName1 = 'Isengrim Faoiltiarna'
  const unitName2 = 'Fiend'
  const unitName3 = 'Dennis Cranmer'
  const unitName4 = 'Scorch'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Monsters,
      handUnitNames: [unitName2, unitName4],
    },
    opponent: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1, unitName3],
    },
    opponentFirst: true,
  })
  await gameManager.deploy({ unitName: unitName1, moraling: [] })
  await gameManager.deploy({ unitName: unitName2 })
  await gameManager.deploy({ unitName: unitName3, effectiveStrength: 7 })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName4,
    scorching: [
      {
        name: unitName3,
        row: Combat.Close,
        strength: 7,
        player: gameManager.opponent.gamePlayer,
      },
    ],
  })
})

test('Scorch takes into account mardroemes to determine strongest', async (t) => {
  const unitName1 = 'Berserker'
  const unitName2 = 'Dennis Cranmer'
  const unitName3 = 'Mardroeme'
  const unitName4 = 'Transformed Vildkaarl'
  const unitName5 = 'Scorch'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName2, unitName5],
    },
    opponent: {
      faction: FactionKey.Skellige,
      handUnitNames: [unitName1, unitName3],
    },
    opponentFirst: true,
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.deploy({ unitName: unitName2 })
  await gameManager.deploy({
    unitName: unitName3,
    modifier: true,
    mardroeming: [
      {
        name: unitName4,
        effectiveStrength: 14,
        player: gameManager.opponent.gamePlayer,
        row: Combat.Close,
        reason: unitName3,
        impact: {
          type: EffectKey.Morale,
          instances: 0,
        },
      },
    ],
  })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName5,
    scorching: [
      {
        name: unitName4,
        row: Combat.Close,
        strength: 14,
        player: gameManager.opponent.gamePlayer,
      },
    ],
  })
})

test('Scorch takes into account horn to determine strongest', async (t) => {
  const unitName1 = 'Dandelion'
  const unitName2 = 'Dennis Cranmer'
  const unitName3 = 'Clan Heymaey Skald'
  const unitName4 = 'Scorch'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName2, unitName4],
    },
    opponent: {
      faction: FactionKey.Skellige,
      handUnitNames: [unitName1, unitName3],
    },
    opponentFirst: true,
  })
  await gameManager.deploy({ unitName: unitName1, horning: [] })
  await gameManager.deploy({ unitName: unitName2 })
  await gameManager.deploy({
    unitName: unitName3,
    effectiveStrength: 8,
  })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName4,
    scorching: [
      {
        name: unitName3,
        row: Combat.Close,
        strength: 8,
        player: gameManager.opponent.gamePlayer,
      },
    ],
  })
})
