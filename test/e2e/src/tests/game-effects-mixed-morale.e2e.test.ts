import createGameManager from '../util/game-manager'
import { Combat, EffectKey, FactionKey } from '@gwent/node-client'
import { E2eCtx, getFixtureCtx, getTestCtx, getScenario } from '../util/e2e-ctx'
import { EFFECT_OPERATOR } from '@gwent/constants'
import FullCard from '../components/full-card'
import GamePage from '../page-objects/game-page'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Game Effects Mixed Morale')

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
