import createGameManager from '../util/game-manager'
import { Combat, FactionKey } from '@gwent/graphql-schema/resolver-typings'
import { E2eCtx, getFixtureCtx, getTestCtx, getScenario } from '../util/e2e-ctx'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Game Effect Muster')

test('Muster works for single of same unit', async (t) => {
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

test('Muster works for single of different unit', async (t) => {
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

test('Muster works for multiple of same units', async (t) => {
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

test('Muster works for multiple of different units', async (t) => {
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

// TODO: deploy guanter odimm musteres darknesses
// TODO: deploy darkness does not muster non-darkness gaunter
// TODO: muster units next to morale unit
// TODO: can scorch mustered unit
// TODO: muster unit then morale it
