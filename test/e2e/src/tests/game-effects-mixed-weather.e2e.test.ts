import { Combat, EffectKey, FactionKey } from '@gwent/node-client'
import createGameManager from '../util/game-manager'
import { E2eCtx, getFixtureCtx, getTestCtx, getScenario } from '../util/e2e-ctx'
import { EFFECT_OPERATOR } from '@gwent/constants'
import FullCard from '../components/full-card'
import GamePage from '../page-objects/game-page'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Game Effects Mixed Weather')

test('Weather applied before bond', async (t) => {
  const unitName1 = 'Blue Stripes Commando'
  const unitName2 = 'Biting Frost'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1, unitName1, unitName2],
    },
  })
  const deckUnit1 = await gameManager.deploy({ unitName: unitName1, bonding: [] })
  await gameManager.pass({})
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
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName2,
    weather: true,
    weathering: [
      {
        effectiveStrength: 2,
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
      {
        effectiveStrength: 2,
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        instance: 2,
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
    effectiveStrength: 2,
    effects: [
      {
        operator: EFFECT_OPERATOR.Set,
        strength: 1,
        reason: `Weather from ${unitName2}`,
      },
      {
        operator: EFFECT_OPERATOR.Double,
        strength: 2,
        reason: `Bond from ${unitName1}`,
      },
    ],
  })
  await FullCard.next()
  await FullCard.verify({
    unit: deckUnit2.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 2,
    effects: [
      {
        operator: EFFECT_OPERATOR.Set,
        strength: 1,
        reason: `Weather from ${unitName2}`,
      },
      {
        operator: EFFECT_OPERATOR.Double,
        strength: 2,
        reason: `Bond from ${unitName1}`,
      },
    ],
  })
})

test('Can decoy weathered unit and play it in non weathered row for full strength', async (t) => {
  const unitName1 = 'Barclay Els'
  const unitName2 = 'Biting Frost'
  const unitName3 = 'Decoy'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1, unitName2, unitName3],
    },
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({})
  await gameManager.deploy({
    unitName: unitName2,
    weather: true,
    weathering: [
      {
        effectiveStrength: 1,
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })
  await gameManager.deploy({
    unitName: unitName3,
    decoying: {
      effectiveStrength: 1,
      strength: 6,
      name: unitName1,
      player: gameManager.self.gamePlayer,
      row: Combat.Close,
    },
  })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName1,
    combat: Combat.Ranged,
    eligibleCombats: [Combat.Close, Combat.Ranged],
  })
})

test('Weather applied before horn', async (t) => {
  const unitName1 = 'Ves'
  const unitName2 = "Commander's Horn"
  const unitName3 = 'Biting Frost'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1, unitName2, unitName3],
    },
  })
  const deckUnit1 = await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({})
  await gameManager.deploy({
    unitName: unitName2,
    modifier: true,
    horning: [
      {
        effectiveStrength: 10,
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName3,
    weather: true,
    weathering: [
      {
        effectiveStrength: 2,
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
    effectiveStrength: 2,
    effects: [
      {
        operator: EFFECT_OPERATOR.Set,
        strength: 1,
        reason: `Weather from ${unitName3}`,
      },
      {
        operator: EFFECT_OPERATOR.Double,
        strength: 2,
        reason: `Horn from ${unitName2}`,
      },
    ],
  })
})

test('Weather applied before mardroeme', async (t) => {
  const unitName1 = 'Berserker'
  const unitName2 = 'Mardroeme'
  const unitName3 = 'Transformed Vildkaarl'
  const unitName4 = 'Biting Frost'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Skellige,
      handUnitNames: [unitName1, unitName2, unitName4],
    },
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({})
  await gameManager.deploy({
    unitName: unitName2,
    modifier: true,
    mardroeming: [
      {
        effectiveStrength: 14,
        name: unitName3,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        impact: {
          type: EffectKey.Morale,
          instances: 0,
        },
      },
    ],
  })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName4,
    weather: true,
    weathering: [
      {
        effectiveStrength: 1,
        name: unitName3,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
  })
  await GamePage.fullscreenCombatCard({
    unitName: unitName3,
    row: Combat.Close,
    self: true,
  })
  await FullCard.verify({
    unit: await gameManager.self.client.getBattlefieldUnit({
      gameId: gameManager.gameId,
      combat: Combat.Close,
      name: unitName3,
    }),
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 1,
    effects: [
      {
        operator: EFFECT_OPERATOR.Set,
        strength: 1,
        reason: `Weather from ${unitName4}`,
      },
    ],
  })
})

test('Weather applied before morale', async (t) => {
  const unitName1 = 'Barclay Els'
  const unitName2 = 'Milva'
  const unitName3 = 'Impenetrable Fog'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1, unitName2, unitName3],
    },
  })
  const deckUnit1 = await gameManager.deploy({ unitName: unitName1, combat: Combat.Ranged })
  await gameManager.pass({})
  const deckUnit2 = await gameManager.deploy({
    unitName: unitName2,
    combat: Combat.Ranged,
    moraling: [
      {
        effectiveStrength: 7,
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
      },
    ],
  })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName3,
    weather: true,
    weathering: [
      {
        effectiveStrength: 2,
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
      },
      {
        effectiveStrength: 1,
        name: unitName2,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
      },
    ],
  })
  await GamePage.fullscreenCombatCard({
    unitName: unitName1,
    row: Combat.Ranged,
    self: true,
  })
  await FullCard.verify({
    unit: deckUnit1.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 2,
    effects: [
      {
        operator: EFFECT_OPERATOR.Set,
        strength: 1,
        reason: `Weather from ${unitName3}`,
      },
      {
        operator: EFFECT_OPERATOR.Plus,
        strength: 2,
        reason: `Morale from ${unitName2}`,
      },
    ],
  })
  await FullCard.previous()
  await FullCard.verify({
    unit: deckUnit2.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 1,
    effects: [
      {
        operator: EFFECT_OPERATOR.Set,
        strength: 1,
        reason: `Weather from ${unitName3}`,
      },
    ],
  })
})

test('Weather applied to musters', async (t) => {
  const unitName1 = 'Havekar Smuggler'
  const unitName2 = 'Biting Frost'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1, unitName1, unitName2],
      ignoreUnitNames: [unitName1],
    },
  })
  const deckUnit1 = await gameManager.deploy({
    unitName: unitName1,
    mustering: [
      {
        effectiveStrength: 5,
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        hand: true,
        impact: {
          type: EffectKey.Muster,
          instances: 0,
        },
      },
    ],
  })
  await gameManager.pass({})
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName2,
    weather: true,
    weathering: [
      {
        effectiveStrength: 1,
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
      {
        effectiveStrength: 1,
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        instance: 2,
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
    effectiveStrength: 1,
    effects: [
      {
        operator: EFFECT_OPERATOR.Set,
        strength: 1,
        reason: `Weather from ${unitName2}`,
      },
    ],
  })
  await FullCard.next()
  await FullCard.verify({
    unit: deckUnit1.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 1,
    effects: [
      {
        operator: EFFECT_OPERATOR.Set,
        strength: 1,
        reason: `Weather from ${unitName2}`,
      },
    ],
  })
})
