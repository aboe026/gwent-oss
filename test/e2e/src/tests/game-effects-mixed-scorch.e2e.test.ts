import { Combat, EffectKey, FactionKey } from '@gwent/node-client'
import createGameManager from '../util/game-manager'
import { E2eCtx, getFixtureCtx, getTestCtx, getScenario } from '../util/e2e-ctx'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Game Effects Mixed Scorch')

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

test('Scorch ignores decoyed to determine strongest', async (t) => {
  const unitName1 = 'Cahir Mawr Dyffryn aep Ceallach'
  const unitName2 = 'Yarpen Zigrin'
  const unitName3 = 'Decoy'
  const unitName4 = 'Scorch'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.NilfgaardianEmpire,
      handUnitNames: [unitName1, unitName3, unitName4],
    },
    opponent: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName2],
    },
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.deploy({ unitName: unitName2 })
  await gameManager.deploy({
    unitName: unitName3,
    decoying: {
      effectiveStrength: 6,
      name: unitName1,
      player: gameManager.self.gamePlayer,
      row: Combat.Close,
    },
  })
  await gameManager.pass({})
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName4,
    scorching: [
      {
        name: unitName2,
        player: gameManager.opponent.gamePlayer,
        row: Combat.Close,
        strength: 2,
      },
    ],
  })
})
