import createGameManager from '../util/game-manager'
import { Combat, EffectKey, FactionKey } from '@gwent/node-client'
import { E2eCtx, getFixtureCtx, getTestCtx, getScenario } from '../util/e2e-ctx'
import { EFFECT_OPERATOR } from '@gwent/constants'
import FullCard from '../components/full-card'
import GamePage from '../page-objects/game-page'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Game Effects Mixed Horn')

test('Horn applied after bond', async (t) => {
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

test('Horn applied after morale', async (t) => {
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

test('Horn applies after bond and morale', async (t) => {
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

test('Horn for berserker transfers to vildkaarl after mardroeme', async (t) => {
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
