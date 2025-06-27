import createGameManager from '../util/game-manager'
import { Combat, FactionKey } from '@gwent/graphql-schema/resolver-typings'
import { E2eCtx, getFixtureCtx, getTestCtx, getScenario } from '../util/e2e-ctx'
import FullCard from '../components/full-card'
import GamePage from '../page-objects/game-page'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Game Effect Morale')

test('Morale unit does not effect itself', async (t) => {
  const unitName = 'Milva'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName],
    },
  })
  await gameManager.initialize({})

  const deckUnit = await gameManager.deploy({ unitName, moraling: [] })
  await GamePage.fullscreenCombatCard({
    unitName,
    row: Combat.Ranged,
    self: true,
  })
  await FullCard.verify({
    unit: deckUnit.unit,
    username: gameManager.self.gamePlayer.name,
  })
})

test('Morale unit does not effect hero', async (t) => {
  const unitName1 = 'Eithne'
  const unitName2 = 'Milva'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1, unitName2],
    },
  })
  const deckUnit1 = await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({})
  await gameManager.initialize({})

  const deckUnit2 = await gameManager.deploy({ unitName: unitName2, moraling: [] })
  await GamePage.fullscreenCombatCard({
    unitName: unitName1,
    row: Combat.Ranged,
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
  })
})

test('Morale hero unit not effected by other morale', async (t) => {
  const unitName1 = 'Isengrim Faoiltiarna'
  const unitName2 = 'Olgierd Von Everec'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1, unitName2],
    },
  })
  const deckUnit1 = await gameManager.deploy({ unitName: unitName1, moraling: [] })
  await gameManager.pass({})
  await gameManager.initialize({})

  const deckUnit2 = await gameManager.deploy({
    unitName: unitName2,
    moraling: [
      {
        effectiveStrength: 7,
        name: unitName2,
        player: gameManager.self.gamePlayer,
        row: Combat.Close,
      },
    ],
    impacts: 0,
  })
  await GamePage.fullscreenCombatCard({
    unitName: unitName2,
    row: Combat.Close,
    self: true,
  })
  await FullCard.verify({
    unit: deckUnit2.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 7,
    effects: [
      {
        operator: '+1',
        strength: 7,
        reason: `Morale from ${unitName1}`,
      },
    ],
  })
  await FullCard.next()
  await FullCard.verify({
    unit: deckUnit1.unit,
    username: gameManager.self.gamePlayer.name,
  })
})

test('Morale unit does not effect unit not in row', async (t) => {
  const unitName1 = 'Dennis Cranmer'
  const unitName2 = 'Milva'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1, unitName2],
    },
  })
  const deckUnit = await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({})
  await gameManager.initialize({})

  await gameManager.deploy({ unitName: unitName2, moraling: [] })
  await GamePage.fullscreenCombatCard({
    unitName: unitName1,
    row: Combat.Close,
    self: true,
  })
  await FullCard.verify({
    unit: deckUnit.unit,
    username: gameManager.self.gamePlayer.name,
  })
})

test('Morale unit does not effect opponent unit', async (t) => {
  const unitName1 = 'Milva'
  const unitName2 = 'Albrich'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1],
    },
    opponent: {
      faction: FactionKey.NilfgaardianEmpire,
      handUnitNames: [unitName2],
    },
  })
  await gameManager.deploy({ unitName: unitName1, moraling: [] })
  await gameManager.initialize({})

  const deckUnit = await gameManager.deploy({ unitName: unitName2 })
  await GamePage.fullscreenCombatCard({
    unitName: unitName2,
    row: Combat.Ranged,
    self: false,
  })
  await FullCard.verify({
    unit: deckUnit.unit,
    username: gameManager.opponent.gamePlayer.name,
  })
})

test('Morale effects normal unit if morale played before', async (t) => {
  const unitName1 = 'Milva'
  const unitName2 = 'Toruviel'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1, unitName2],
    },
  })
  const deckUnit1 = await gameManager.deploy({ unitName: unitName1, moraling: [] })
  await gameManager.pass({})
  await gameManager.initialize({})

  const deckUnit2 = await gameManager.deploy({
    unitName: unitName2,
    moraling: [
      {
        effectiveStrength: 3,
        row: Combat.Ranged,
        name: unitName2,
        player: gameManager.self.gamePlayer,
      },
    ],
    impacts: -1,
  })
  await GamePage.fullscreenCombatCard({
    unitName: unitName2,
    row: Combat.Ranged,
    self: true,
  })
  await FullCard.verify({
    unit: deckUnit2.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 3,
    effects: [
      {
        operator: '+1',
        strength: 3,
        reason: `Morale from ${unitName1}`,
      },
    ],
  })
  await FullCard.next()
  await FullCard.verify({
    unit: deckUnit1.unit,
    username: gameManager.self.gamePlayer.name,
  })
})

test('Morale effects normal unit if morale played after', async (t) => {
  const unitName1 = 'Toruviel'
  const unitName2 = 'Milva'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1, unitName2],
    },
  })
  const deckUnit1 = await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({})
  await gameManager.initialize({})

  const deckUnit2 = await gameManager.deploy({
    unitName: unitName2,
    moraling: [
      {
        effectiveStrength: 3,
        row: Combat.Ranged,
        name: unitName1,
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
    unit: deckUnit1.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 3,
    effects: [
      {
        operator: '+1',
        strength: 3,
        reason: `Morale from ${unitName2}`,
      },
    ],
  })
  await FullCard.next()
  await FullCard.verify({
    unit: deckUnit2.unit,
    username: gameManager.self.gamePlayer.name,
  })
})

test('Morale effects multiple normal units', async (t) => {
  const unitName1 = 'Toruviel'
  const unitName2 = 'Ida Emean aep Sivney'
  const unitName3 = 'Milva'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1, unitName2, unitName3],
    },
  })
  const deckUnit1 = await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({})
  const deckUnit2 = await gameManager.deploy({ unitName: unitName2 })
  await gameManager.initialize({})

  const deckUnit3 = await gameManager.deploy({
    unitName: unitName3,
    moraling: [
      {
        effectiveStrength: 3,
        row: Combat.Ranged,
        name: unitName1,
        player: gameManager.self.gamePlayer,
      },
      {
        effectiveStrength: 7,
        row: Combat.Ranged,
        name: unitName2,
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
    unit: deckUnit1.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 3,
    effects: [
      {
        operator: '+1',
        strength: 3,
        reason: `Morale from ${unitName3}`,
      },
    ],
  })
  await FullCard.next()
  await FullCard.verify({
    unit: deckUnit2.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 7,
    effects: [
      {
        operator: '+1',
        strength: 7,
        reason: `Morale from ${unitName3}`,
      },
    ],
  })
  await FullCard.next()
  await FullCard.verify({
    unit: deckUnit3.unit,
    username: gameManager.self.gamePlayer.name,
  })
})

test('Multiple morales effect each other', async (t) => {
  const unitName1 = 'Milva'
  const unitName2 = 'Olgierd Von Everec'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1, unitName2],
    },
  })
  const deckUnit1 = await gameManager.deploy({ unitName: unitName1, moraling: [] })
  await gameManager.pass({})
  await gameManager.initialize({})

  const deckUnit2 = await gameManager.deploy({
    unitName: unitName2,
    combat: Combat.Ranged,
    moraling: [
      {
        effectiveStrength: 11,
        row: Combat.Ranged,
        name: unitName1,
        player: gameManager.self.gamePlayer,
      },
      {
        effectiveStrength: 7,
        row: Combat.Ranged,
        name: unitName2,
        player: gameManager.self.gamePlayer,
      },
    ],
    impacts: 1,
  })
  await GamePage.fullscreenCombatCard({
    unitName: unitName1,
    row: Combat.Ranged,
    self: true,
  })
  await FullCard.verify({
    unit: deckUnit1.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 11,
    effects: [
      {
        operator: '+1',
        strength: 11,
        reason: `Morale from ${unitName2}`,
      },
    ],
  })
  await FullCard.previous()
  await FullCard.verify({
    unit: deckUnit2.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 7,
    effects: [
      {
        operator: '+1',
        strength: 7,
        reason: `Morale from ${unitName1}`,
      },
    ],
  })
})

test('Multiple morales effect themselves and multiple standard units in same row', async (t) => {
  const unitName1 = 'Riordain'
  const unitName2 = 'Ida Emean aep Sivney'
  const unitName3 = 'Milva'
  const unitName4 = 'Olgierd Von Everec'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1, unitName2, unitName3, unitName4],
    },
  })
  const deckUnit1 = await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({})
  const deckUnit2 = await gameManager.deploy({ unitName: unitName2 })
  const deckUnit3 = await gameManager.deploy({
    unitName: unitName3,
    moraling: [
      {
        name: unitName1,
        effectiveStrength: 2,
        row: Combat.Ranged,
        player: gameManager.self.gamePlayer,
      },
      {
        name: unitName2,
        effectiveStrength: 7,
        row: Combat.Ranged,
        player: gameManager.self.gamePlayer,
      },
    ],
  })
  await gameManager.initialize({})

  const deckUnit4 = await gameManager.deploy({
    unitName: unitName4,
    combat: Combat.Ranged,
    moraling: [
      {
        name: unitName1,
        effectiveStrength: 3,
        row: Combat.Ranged,
        player: gameManager.self.gamePlayer,
      },
      {
        name: unitName2,
        effectiveStrength: 8,
        row: Combat.Ranged,
        player: gameManager.self.gamePlayer,
      },
      {
        name: unitName3,
        effectiveStrength: 11,
        row: Combat.Ranged,
        player: gameManager.self.gamePlayer,
      },
      {
        name: unitName4,
        effectiveStrength: 7,
        row: Combat.Ranged,
        player: gameManager.self.gamePlayer,
      },
    ],
    impacts: 3,
  })
  await GamePage.fullscreenCombatCard({
    unitName: unitName1,
    row: Combat.Ranged,
    self: true,
  })
  await FullCard.verify({
    unit: deckUnit1.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 3,
    effects: [
      {
        operator: '+1',
        strength: 2,
        reason: `Morale from ${unitName3}`,
      },
      {
        operator: '+1',
        strength: 3,
        reason: `Morale from ${unitName4}`,
      },
    ],
  })
  await FullCard.next()
  await FullCard.verify({
    unit: deckUnit4.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 7,
    effects: [
      {
        operator: '+1',
        strength: 7,
        reason: `Morale from ${unitName3}`,
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
        operator: '+1',
        strength: 7,
        reason: `Morale from ${unitName3}`,
      },
      {
        operator: '+1',
        strength: 8,
        reason: `Morale from ${unitName4}`,
      },
    ],
  })
  await FullCard.next()
  await FullCard.verify({
    unit: deckUnit3.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 11,
    effects: [
      {
        operator: '+1',
        strength: 11,
        reason: `Morale from ${unitName4}`,
      },
    ],
  })
})

test('Multiple morales effect themselves and multiple standard units in different rows', async (t) => {
  const unitName1 = 'Milva'
  const unitName2 = 'Toruviel'
  const unitName3 = 'Isengrim Faoiltiarna'
  const unitName4 = 'Dennis Cranmer'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1, unitName2, unitName3, unitName4],
    },
  })
  const deckUnit1 = await gameManager.deploy({ unitName: unitName1, moraling: [] })
  await gameManager.pass({})
  const deckUnit2 = await gameManager.deploy({
    unitName: unitName2,
    moraling: [
      {
        name: unitName2,
        effectiveStrength: 3,
        row: Combat.Ranged,
        player: gameManager.self.gamePlayer,
      },
    ],
    impacts: -1,
  })
  const deckUnit3 = await gameManager.deploy({ unitName: unitName3, moraling: [] })
  await gameManager.initialize({})

  const deckUnit4 = await gameManager.deploy({
    unitName: unitName4,
    moraling: [
      {
        name: unitName4,
        effectiveStrength: 7,
        row: Combat.Close,
        player: gameManager.self.gamePlayer,
      },
    ],
    impacts: -1,
  })

  await GamePage.fullscreenCombatCard({
    unitName: unitName1,
    row: Combat.Ranged,
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
    effectiveStrength: 3,
    effects: [
      {
        operator: '+1',
        strength: 3,
        reason: `Morale from ${unitName1}`,
      },
    ],
  })
  await FullCard.close()
  await GamePage.fullscreenCombatCard({
    unitName: unitName3,
    row: Combat.Close,
    self: true,
  })
  await FullCard.verify({
    unit: deckUnit3.unit,
    username: gameManager.self.gamePlayer.name,
  })
  await FullCard.previous()
  await FullCard.verify({
    unit: deckUnit4.unit,
    username: gameManager.self.gamePlayer.name,
    effectiveStrength: 7,
    effects: [
      {
        operator: '+1',
        strength: 7,
        reason: `Morale from ${unitName3}`,
      },
    ],
  })
})

test('Can see reason for morale in opponents fullcard details', async (t) => {
  const unitName1 = 'Albrich'
  const unitName2 = 'Olgierd Von Everec'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
    },
    opponent: {
      faction: FactionKey.NilfgaardianEmpire,
      handUnitNames: [unitName1, unitName2],
    },
  })
  await gameManager.pass({})
  const deckUnit1 = await gameManager.deploy({ unitName: unitName1 })
  await gameManager.initialize({})

  const deckUnit2 = await gameManager.deploy({
    unitName: unitName2,
    combat: Combat.Ranged,
    moraling: [
      {
        name: unitName1,
        effectiveStrength: 3,
        row: Combat.Ranged,
        player: gameManager.opponent.gamePlayer,
      },
    ],
  })
  await GamePage.fullscreenCombatCard({
    unitName: unitName1,
    row: Combat.Ranged,
    self: false,
  })
  await FullCard.verify({
    unit: deckUnit1.unit,
    username: gameManager.opponent.gamePlayer.name,
    effectiveStrength: 3,
    effects: [
      {
        operator: '+1',
        strength: 3,
        reason: `Morale from ${unitName2}`,
      },
    ],
  })
  await FullCard.next()
  await FullCard.verify({
    unit: deckUnit2.unit,
    username: gameManager.opponent.gamePlayer.name,
  })
})

test('Morale scores persist to end of game', async (t) => {
  const unitName1 = 'Milva'
  const unitName2 = 'Olgierd Von Everec'
  const unitName3 = 'Black Infantry Archer'
  const unitName4 = 'Triss Merigold'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1, unitName2],
    },
    opponent: {
      faction: FactionKey.NilfgaardianEmpire,
      handUnitNames: [unitName3, unitName4],
    },
  })
  // round 1
  await gameManager.deploy({ unitName: unitName1, moraling: [] })
  await gameManager.deploy({ unitName: unitName3 })
  await gameManager.deploy({
    unitName: unitName2,
    combat: Combat.Ranged,
    moraling: [
      {
        name: unitName1,
        effectiveStrength: 11,
        row: Combat.Ranged,
        player: gameManager.self.gamePlayer,
      },
      {
        name: unitName2,
        effectiveStrength: 7,
        row: Combat.Ranged,
        player: gameManager.self.gamePlayer,
      },
    ],
    impacts: 1,
  })
  await gameManager.deploy({ unitName: unitName4 })
  await gameManager.pass({})
  await gameManager.pass({})
  // round 2
  await gameManager.pass({})
  await gameManager.initialize({})
  await gameManager.pass({
    victors: [gameManager.self.gamePlayer.name],
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
        operator: '+1',
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
