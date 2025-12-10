import createGameManager from '../util/game-manager'
import { Combat, EffectKey, FactionKey } from '@gwent/node-client'
import { E2eCtx, getFixtureCtx, getTestCtx, getScenario } from '../util/e2e-ctx'
import { EFFECT_OPERATOR } from '@gwent/constants'
import FullCard from '../components/full-card'
import GamePage from '../page-objects/game-page'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Game Effects Mixed Muster')

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
    eligibleCombats: [Combat.Close, Combat.Ranged],
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
