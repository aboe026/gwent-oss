import { Combat, FactionKey } from '@gwent/node-client'
import createGameManager from '../util/game-manager'
import { E2eCtx, getFixtureCtx, getTestCtx, getScenario } from '../util/e2e-ctx'
import { EFFECT_OPERATOR } from '@gwent/constants'
import FullCard from '../components/full-card'
import GamePage from '../page-objects/game-page'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Game Effect Horn')

test('Horn unit does not effect itself', async (t) => {
  const unitName = 'Dandelion'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Skellige,
      handUnitNames: [unitName],
    },
  })
  await gameManager.initialize({})

  const deckUnit = await gameManager.deploy({ unitName, horning: [] })
  await GamePage.fullscreenCombatCard({
    unitName,
    row: Combat.Close,
    self: true,
  })
  await FullCard.verify({
    unit: deckUnit.unit,
    username: gameManager.self.gamePlayer.name,
  })
})

test('Horn unit does not effect hero', async (t) => {
  const unitName1 = 'Triss Merigold'
  const unitName2 = 'Dandelion'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Skellige,
      handUnitNames: [unitName1, unitName2],
    },
  })
  const deckUnit1 = await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({})
  await gameManager.initialize({})

  const deckUnit2 = await gameManager.deploy({ unitName: unitName2, horning: [] })
  await GamePage.fullscreenCombatCard({
    unitName: unitName1,
    row: Combat.Close,
    self: true,
  })
  await FullCard.verify({
    unit: deckUnit1.unit,
    username: gameManager.self.gamePlayer.name,
  })
  await FullCard.previous()
  await FullCard.verify({
    unit: deckUnit2.unit,
    username: gameManager.self.gamePlayer.name,
  })
})

test('Horn unit does not effect unit not in row', async (t) => {
  const unitName1 = 'Clan Brokvar Archer'
  const unitName2 = 'Dandelion'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Skellige,
      handUnitNames: [unitName1, unitName2],
    },
  })
  const deckUnit = await gameManager.deploy({ unitName: unitName1, combat: Combat.Ranged })
  await gameManager.pass({})
  await gameManager.initialize({})

  await gameManager.deploy({ unitName: unitName2, horning: [] })
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

test('Horn unit does not effect opponent unit', async (t) => {
  const unitName1 = 'Blueboy Lugos'
  const unitName2 = 'Dandelion'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Skellige,
      handUnitNames: [unitName2],
    },
    opponent: {
      faction: FactionKey.Skellige,
      handUnitNames: [unitName1],
    },
    opponentFirst: true,
  })
  const deckUnit = await gameManager.deploy({ unitName: unitName1 })
  await gameManager.initialize({})

  await gameManager.deploy({ unitName: unitName2, horning: [] })
  await GamePage.fullscreenCombatCard({
    unitName: unitName1,
    row: Combat.Close,
    self: false,
  })
  await FullCard.verify({
    unit: deckUnit.unit,
    username: gameManager.opponent.gamePlayer.name,
  })
})

test('Horn effects regular unit if played before', async (t) => {
  const unitName1 = 'Dandelion'
  const unitName2 = 'Blueboy Lugos'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Skellige,
      handUnitNames: [unitName1, unitName2],
    },
  })
  const deckUnit1 = await gameManager.deploy({ unitName: unitName1, horning: [] })
  await gameManager.pass({})
  await gameManager.initialize({})

  const deckUnit2 = await gameManager.deploy({
    unitName: unitName2,
    effectiveStrength: 12,
  })
  await GamePage.fullscreenCombatCard({
    unitName: unitName2,
    row: Combat.Close,
    self: true,
  })
  await FullCard.verify({
    unit: deckUnit2.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 12,
    effects: [
      {
        operator: EFFECT_OPERATOR.Double,
        strength: 12,
        reason: `Horn from ${unitName1}`,
      },
    ],
  })
  await FullCard.previous()
  await FullCard.verify({
    unit: deckUnit1.unit,
    username: gameManager.self.gamePlayer.name,
  })
})

test('Horn effects regular unit if played after', async (t) => {
  const unitName1 = 'Blueboy Lugos'
  const unitName2 = 'Dandelion'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Skellige,
      handUnitNames: [unitName1, unitName2],
    },
  })
  const deckUnit1 = await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({})
  await gameManager.initialize({})

  const deckUnit2 = await gameManager.deploy({
    unitName: unitName2,
    horning: [
      {
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
        effectiveStrength: 12,
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
    effectiveStrength: 12,
    effects: [
      {
        operator: EFFECT_OPERATOR.Double,
        strength: 12,
        reason: `Horn from ${unitName2}`,
      },
    ],
  })
  await FullCard.previous()
  await FullCard.verify({
    unit: deckUnit2.unit,
    username: gameManager.self.gamePlayer.name,
  })
})

test('Horn can only effect unit once', async (t) => {
  const unitName1 = 'Dandelion'
  const unitName2 = 'Blueboy Lugos'
  const unitName3 = "Commander's Horn"
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Skellige,
      handUnitNames: [unitName1, unitName2, unitName3],
    },
  })
  const deckUnit1 = await gameManager.deploy({ unitName: unitName1, horning: [] })
  await gameManager.pass({})
  await gameManager.initialize({})

  const deckUnit2 = await gameManager.deploy({
    unitName: unitName2,
    effectiveStrength: 12,
  })
  await gameManager.deploy({
    unitName: unitName3,
    modifier: true,
    horning: [
      {
        effectiveStrength: 4,
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
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
    effectiveStrength: 12,
    effects: [
      {
        operator: EFFECT_OPERATOR.Double,
        strength: 12,
        reason: `Horn from ${unitName1}`,
      },
    ],
  })
  await FullCard.previous()
  await FullCard.verify({
    unit: deckUnit1.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 4,
    effects: [
      {
        operator: EFFECT_OPERATOR.Double,
        strength: 4,
        reason: `Horn from ${unitName3}`,
      },
    ],
  })
})

// TODO: dandelion gets doubled from commander's horn, but both don't 4x a regular card
// TODO: gets applied after morale
// TODO: gets applied after bond
// TODO: morale, bond and horn
// TODO: gets applied to mardroemes
// TODO: gets applied to musters
// TODO: gets taken into account for scorch
