import { Combat, FactionKey } from '@gwent/node-client'
import createGameManager from '../util/game-manager'
import { E2eCtx, getFixtureCtx, getScenario, getTestCtx } from '../util/e2e-ctx'
import { MoralingExpected } from '../util/e2e-helper'
import { PlayerTurn } from '../components/game-player-info'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Game Effect Scorch')

test('Scorch does nothing if no other units on the battlefield', async (t) => {
  const unitName1 = 'Scorch'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Monsters,
      handUnitNames: [unitName1],
    },
  })
  await gameManager.initialize({})

  await gameManager.deploy({ unitName: unitName1, scorching: [] })
})

test('Scorch does nothing if only other unit has no strength', async (t) => {
  const unitName1 = "Commander's Horn"
  const unitName2 = 'Scorch'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName2],
    },
    opponent: {
      faction: FactionKey.NorthernRealms,
      handUnitNames: [unitName1],
    },
    opponentFirst: true,
  })
  await gameManager.deploy({ unitName: unitName1, horning: [] })
  await gameManager.initialize({})

  await gameManager.deploy({ unitName: unitName2, scorching: [] })
})

test('Scorch removes strongest card if on opponents side', async (t) => {
  const unitName1 = 'Dennis Cranmer'
  const unitName2 = 'Scorch'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Monsters,
      handUnitNames: [unitName2],
    },
    opponent: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1],
    },
    opponentFirst: true,
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName2,
    scorching: [
      {
        name: unitName1,
        row: Combat.Close,
        strength: 6,
        player: gameManager.opponent.gamePlayer,
      },
    ],
  })
})

test('Scorch removes strongest card if on own side', async (t) => {
  const unitName1 = 'Toruviel'
  const unitName2 = 'Griffin'
  const unitName3 = 'Scorch'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Monsters,
      handUnitNames: [unitName2, unitName3],
    },
    opponent: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1],
    },
  })
  await gameManager.deploy({ unitName: unitName2 })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName3,
    scorching: [
      {
        name: unitName2,
        row: Combat.Close,
        strength: 5,
        player: gameManager.self.gamePlayer,
      },
    ],
  })
})

test('Opponents scorch removes strongest card if on opponents side', async (t) => {
  const unitName1 = 'Dennis Cranmer'
  const unitName2 = 'Foglet'
  const unitName3 = 'Scorch'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Monsters,
      handUnitNames: [unitName2],
    },
    opponent: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1, unitName3],
    },
    opponentFirst: true,
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.deploy({ unitName: unitName2 })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName3,
    scorching: [
      {
        name: unitName1,
        row: Combat.Close,
        strength: 6,
        player: gameManager.opponent.gamePlayer,
      },
    ],
  })
})

test('Opponents scorch removes strongest card if on self side', async (t) => {
  const unitName1 = 'Dennis Cranmer'
  const unitName2 = 'Toad'
  const unitName3 = 'Scorch'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Monsters,
      handUnitNames: [unitName2],
    },
    opponent: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1, unitName3],
    },
    opponentFirst: true,
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.deploy({ unitName: unitName2, scorching: [] })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName3,
    scorching: [
      {
        name: unitName2,
        row: Combat.Ranged,
        strength: 7,
        player: gameManager.self.gamePlayer,
      },
    ],
  })
})

test('Multiple scorches can be played after each other', async (t) => {
  const unitName1 = 'Toruviel'
  const unitName2 = 'Griffin'
  const unitName3 = 'Scorch'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Monsters,
      handUnitNames: [unitName2, unitName3],
    },
    opponent: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1, unitName3],
    },
  })
  await gameManager.deploy({ unitName: unitName2 })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.deploy({
    unitName: unitName3,
    scorching: [
      {
        name: unitName2,
        row: Combat.Close,
        strength: 5,
        player: gameManager.self.gamePlayer,
      },
    ],
  })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName3,
    scorching: [
      {
        name: unitName1,
        row: Combat.Ranged,
        strength: 2,
        player: gameManager.opponent.gamePlayer,
      },
    ],
  })
})

test('Scorch removes opponents unit even after they pass', async (t) => {
  const unitName1 = 'Ida Emean aep Sivney'
  const unitName2 = 'Griffin'
  const unitName3 = 'Scorch'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Monsters,
      handUnitNames: [unitName2, unitName3],
    },
    opponent: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1],
    },
    opponentFirst: true,
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.deploy({ unitName: unitName2 })
  await gameManager.pass({})
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName3,
    scorching: [
      {
        name: unitName1,
        row: Combat.Ranged,
        strength: 6,
        player: gameManager.opponent.gamePlayer,
      },
    ],
  })
})

test('Scorch removes strongest units if multiple with highest strength', async (t) => {
  const unitName1 = 'Fiend'
  const unitName2 = 'Ida Emean aep Sivney'
  const unitName3 = 'Scorch'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Monsters,
      handUnitNames: [unitName1, unitName3],
    },
    opponent: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName2],
    },
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.deploy({ unitName: unitName2 })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName3,
    scorching: [
      {
        name: unitName1,
        row: Combat.Close,
        strength: 6,
        player: gameManager.self.gamePlayer,
      },
      {
        name: unitName2,
        row: Combat.Ranged,
        strength: 6,
        player: gameManager.opponent.gamePlayer,
      },
    ],
  })
})

test('Scorch removes strongest unit in second round if same unit played in first round', async (t) => {
  const unitName1 = 'Dol Blathanna Scout'
  const unitName2 = 'Dol Blathanna Scout'
  const unitName3 = 'Scorch'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Monsters,
      handUnitNames: [unitName3],
    },
    opponent: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1, unitName2],
    },
    opponentFirst: true,
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.pass({})
  await gameManager.pass({
    switchTurnsWith: gameManager.opponent.gamePlayer,
  })
  await gameManager.deploy({ unitName: unitName2 })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName3,
    scorching: [
      {
        name: unitName2,
        row: Combat.Close,
        strength: 6,
        player: gameManager.opponent.gamePlayer,
      },
    ],
  })
})

test('Scorch does not effect heroes', async (t) => {
  const unitName1 = 'Eithne'
  const unitName2 = 'Scorch'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Monsters,
      handUnitNames: [unitName2],
    },
    opponent: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1],
    },
    opponentFirst: true,
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.initialize({})

  await gameManager.deploy({ unitName: unitName2, scorching: [] })
})

test('Scorch does not effect unit played after it', async (t) => {
  const unitName1 = 'Scorch'
  const unitName2 = 'Dennis Cranmer'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Monsters,
      handUnitNames: [unitName1],
    },
    opponent: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName2],
    },
  })
  await gameManager.deploy({ unitName: unitName1, scorching: [] })
  await gameManager.initialize({})

  await gameManager.deploy({ unitName: unitName2 })
})

test('Scorch scoped to Close combat removes strongest Close combat card on opponents side over 10 effective strength', async (t) => {
  const unitName1 = 'Emiel Regis Rohellec Terzieff'
  const unitName2 = 'Yaevinn'
  const unitName3 = 'Vesemir'
  const unitName4 = 'Mahakaman Defender'
  const unitName5 = 'Roach'
  const unitName6 = 'Vesemir'
  const unitName7 = 'Olaf'
  const unitName8 = 'Villentretenmerth'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName2, unitName4, unitName6, unitName8],
    },
    opponent: {
      faction: FactionKey.Skellige,
      handUnitNames: [unitName1, unitName3, unitName5, unitName7],
    },
    opponentFirst: true,
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.deploy({ unitName: unitName2 })
  await gameManager.deploy({ unitName: unitName3 })
  await gameManager.deploy({ unitName: unitName4 })
  await gameManager.deploy({ unitName: unitName5 })
  await gameManager.deploy({ unitName: unitName6 })
  await gameManager.deploy({ unitName: unitName7, combat: Combat.Ranged, moraling: [] })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName8,
    scorching: [
      {
        name: unitName3,
        player: gameManager.opponent.gamePlayer,
        row: Combat.Close,
        strength: 6,
      },
    ],
  })
})

test('Scorch scoped to Close combat does not remove opponents Close combat if it is not over 10 effective strength', async (t) => {
  const unitName1 = 'Holger Blackhand'
  const unitName2 = 'Yaevinn'
  const unitName3 = 'Madman Lugos'
  const unitName4 = 'Villentretenmerth'
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
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.deploy({ unitName: unitName2 })
  await gameManager.deploy({ unitName: unitName3 })
  await gameManager.initialize({})

  await gameManager.deploy({ unitName: unitName4, scorching: [] })
})

test('Scorch scoped to Close combat does not remove opponents unit over 10 effective strength if not in Close combat row', async (t) => {
  const unitName1 = 'Yaevinn'
  const unitName2 = 'Olaf'
  const unitName3 = 'Villentretenmerth'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1, unitName3],
    },
    opponent: {
      faction: FactionKey.Skellige,
      handUnitNames: [unitName2],
    },
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.deploy({ unitName: unitName2, combat: Combat.Ranged, moraling: [] })
  await gameManager.initialize({})

  await gameManager.deploy({ unitName: unitName3, scorching: [] })
})

test('Scorch scoped to Range combat removes strongest Ranged combat card on opponents side over 10 effective strength', async (t) => {
  const unitName1 = 'Dennis Cranmer'
  const unitName2 = 'Olgierd Von Everec'
  const unitName3 = 'Vrihedd Brigade Veteran'
  const unitName4 = 'Grave Hag'
  const unitName5 = 'Vrihedd Brigade Veteran'
  const unitName6 = 'Toad'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Monsters,
      handUnitNames: [unitName2, unitName4, unitName6],
    },
    opponent: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1, unitName3, unitName5],
    },
    opponentFirst: true,
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.deploy({ unitName: unitName2, moraling: [] })
  await gameManager.deploy({ unitName: unitName3, combat: Combat.Ranged })
  await gameManager.deploy({ unitName: unitName4 })
  await gameManager.deploy({ unitName: unitName5, combat: Combat.Ranged })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName6,
    scorching: [
      {
        name: unitName3,
        row: Combat.Ranged,
        strength: 5,
        player: gameManager.opponent.gamePlayer,
      },
      {
        name: unitName5,
        row: Combat.Ranged,
        strength: 5,
        player: gameManager.opponent.gamePlayer,
      },
    ],
  })
})

test('Scorch scoped to Ranged combat does not remove opponents Ranged combat if it is not over 10 effective strength', async (t) => {
  const unitName1 = 'Dennis Cranmer'
  const unitName2 = 'Olgierd Von Everec'
  const unitName3 = 'Vrihedd Brigade Veteran'
  const unitName4 = 'Grave Hag'
  const unitName5 = 'Vrihedd Brigade Recruit'
  const unitName6 = 'Toad'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Monsters,
      handUnitNames: [unitName2, unitName4, unitName6],
    },
    opponent: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1, unitName3, unitName5],
    },
    opponentFirst: true,
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.deploy({ unitName: unitName2, moraling: [] })
  await gameManager.deploy({ unitName: unitName3, combat: Combat.Ranged })
  await gameManager.deploy({ unitName: unitName4 })
  await gameManager.deploy({ unitName: unitName5, combat: Combat.Ranged })
  await gameManager.initialize({})

  await gameManager.deploy({ unitName: unitName6, scorching: [] })
})

test('Scorch scoped to Ranged combat does not remove opponents unit over 10 effective strength if not in Ranged combat row', async (t) => {
  const unitName1 = 'Dennis Cranmer'
  const unitName2 = 'Olgierd Von Everec'
  const unitName3 = 'Vrihedd Brigade Veteran'
  const unitName4 = 'Grave Hag'
  const unitName5 = 'Vrihedd Brigade Veteran'
  const unitName6 = 'Toad'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Monsters,
      handUnitNames: [unitName2, unitName4, unitName6],
    },
    opponent: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName1, unitName3, unitName5],
    },
    opponentFirst: true,
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.deploy({ unitName: unitName2, moraling: [] })
  await gameManager.deploy({ unitName: unitName3 })
  await gameManager.deploy({ unitName: unitName4 })
  await gameManager.deploy({ unitName: unitName5 })
  await gameManager.initialize({})

  await gameManager.deploy({ unitName: unitName6, scorching: [] })
})

test('Scorch scoped to Siege combat removes strongest Siege combat card on opponents side over 10 effective strength', async (t) => {
  const unitName1 = 'Black Infantry Archer'
  const unitName2 = 'Yaevinn'
  const unitName3 = 'Zerrikanian Fire Scorpion'
  const unitName4 = 'Filavandrel aen Fidhail'
  const unitName5 = 'Siege Engineer'
  const unitName6 = 'Schirru'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName2, unitName4, unitName6],
    },
    opponent: {
      faction: FactionKey.NilfgaardianEmpire,
      handUnitNames: [unitName1, unitName3, unitName5],
    },
    opponentFirst: true,
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.deploy({ unitName: unitName2 })
  await gameManager.deploy({ unitName: unitName3 })
  await gameManager.deploy({ unitName: unitName4 })
  await gameManager.deploy({ unitName: unitName5 })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName6,
    scorching: [
      {
        name: unitName5,
        row: Combat.Siege,
        strength: 6,
        player: gameManager.opponent.gamePlayer,
      },
    ],
  })
})

test('Scorch scoped to Siege combat does not remove opponents Siege combat if it is not over 10 effective strength', async (t) => {
  const unitName1 = 'Black Infantry Archer'
  const unitName2 = 'Yaevinn'
  const unitName3 = 'Rotten Mangonel'
  const unitName4 = 'Filavandrel aen Fidhail'
  const unitName5 = 'Siege Engineer'
  const unitName6 = 'Schirru'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName2, unitName4, unitName6],
    },
    opponent: {
      faction: FactionKey.NilfgaardianEmpire,
      handUnitNames: [unitName1, unitName3, unitName5],
    },
    opponentFirst: true,
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.deploy({ unitName: unitName2 })
  await gameManager.deploy({ unitName: unitName3 })
  await gameManager.deploy({ unitName: unitName4 })
  await gameManager.deploy({ unitName: unitName5 })
  await gameManager.initialize({})

  await gameManager.deploy({ unitName: unitName6, scorching: [] })
})

test('Clan Dimun Pirate removes strongest card if on opponents side', async (t) => {
  const unitName1 = 'Clan Tordarroch Armorsmith'
  const unitName2 = 'Milva'
  const unitName3 = 'Clan Dimun Pirate'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Skellige,
      handUnitNames: [unitName1, unitName3],
    },
    opponent: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName2],
    },
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.deploy({ unitName: unitName2, moraling: [] })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName3,
    scorching: [
      {
        name: unitName2,
        row: Combat.Ranged,
        strength: 10,
        player: gameManager.opponent.gamePlayer,
      },
    ],
  })
})

test('Clan Dimun Pirate removes strongest card if on own side', async (t) => {
  const unitName1 = 'Olaf'
  const unitName2 = 'Milva'
  const unitName3 = 'Clan Dimun Pirate'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Skellige,
      handUnitNames: [unitName1, unitName3],
    },
    opponent: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName2],
    },
  })
  await gameManager.deploy({ unitName: unitName1, moraling: [] })
  await gameManager.deploy({ unitName: unitName2, moraling: [] })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName3,
    scorching: [
      {
        name: unitName1,
        row: Combat.Close,
        strength: 12,
        player: gameManager.self.gamePlayer,
      },
    ],
  })
})

test('Clan Dimun Pirate removes itself if strongest unit', async (t) => {
  const unitName1 = 'Donar an Hindar'
  const unitName2 = 'Riordain'
  const unitName3 = 'Clan Dimun Pirate'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Skellige,
      handUnitNames: [unitName1, unitName3],
    },
    opponent: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName2],
    },
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.deploy({ unitName: unitName2 })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName3,
    scorching: [
      {
        name: unitName3,
        row: Combat.Ranged,
        strength: 6,
        player: gameManager.self.gamePlayer,
      },
    ],
  })
})

test('Clan Dimun Pirate removes itself and others if all strongest units', async (t) => {
  const unitName1 = 'Blueboy Lugos'
  const unitName2 = 'Barclay Els'
  const unitName3 = 'Clan Dimun Pirate'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Skellige,
      handUnitNames: [unitName1, unitName3],
    },
    opponent: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName2],
    },
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.deploy({ unitName: unitName2 })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName3,
    scorching: [
      {
        name: unitName1,
        row: Combat.Close,
        strength: 6,
        player: gameManager.self.gamePlayer,
      },
      {
        name: unitName2,
        row: Combat.Close,
        strength: 6,
        player: gameManager.opponent.gamePlayer,
      },
      {
        name: unitName3,
        row: Combat.Ranged,
        strength: 6,
        player: gameManager.self.gamePlayer,
      },
    ],
  })
})

test('Villentretenmerth removes only opponents unit if self has same one', async (t) => {
  const unitNameOptional = 'Clan Heymaey Skald'
  const unitName1 = 'Olaf'
  const unitName2 = 'Olaf'
  const unitName3 = 'Villentretenmerth'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Skellige,
      handUnitNames: [unitName1, unitName3],
    },
    opponent: {
      faction: FactionKey.Skellige,
      handUnitNames: [unitName2, unitNameOptional],
    },
  })
  let optionalUnitPlayed = false
  if (gameManager.opponent.gamePlayer.turn === PlayerTurn.Current) {
    optionalUnitPlayed = true
    await gameManager.deploy({ unitName: unitNameOptional })
  }
  await gameManager.deploy({ unitName: unitName1, moraling: [] })
  await gameManager.deploy({
    unitName: unitName2,
    moraling: optionalUnitPlayed
      ? [
          {
            name: unitNameOptional,
            player: gameManager.opponent.gamePlayer,
            row: Combat.Close,
            effectiveStrength: 5,
          },
        ]
      : [],
  })
  await gameManager.initialize({})

  const moraling: MoralingExpected[] = []
  if (optionalUnitPlayed) {
    moraling.push({
      name: unitNameOptional,
      player: gameManager.opponent.gamePlayer,
      row: Combat.Close,
      effectiveStrength: 4,
    })
  }
  await gameManager.deploy({
    unitName: unitName3,
    scorching: [
      {
        name: unitName2,
        row: Combat.Close,
        strength: 12,
        player: gameManager.opponent.gamePlayer,
      },
    ],
    moraling: [
      ...moraling,
      {
        player: gameManager.self.gamePlayer,
        effectiveStrength: 8,
        row: Combat.Close,
        name: unitName3,
      },
    ],
  })
})

test('Toad removes only opponents unit if self has same one', async (t) => {
  const unitName1 = 'Grave Hag'
  const unitName2 = 'Dol Blathanna Archer'
  const unitName3 = 'Olgierd Von Everec'
  const unitName4 = 'Olgierd Von Everec'
  const unitName5 = 'Toad'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.Monsters,
      handUnitNames: [unitName1, unitName3, unitName5],
    },
    opponent: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName2, unitName4],
    },
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.deploy({ unitName: unitName2 })
  await gameManager.deploy({
    unitName: unitName3,
    combat: Combat.Ranged,
    moraling: [
      {
        name: unitName1,
        player: gameManager.self.gamePlayer,
        row: Combat.Ranged,
        effectiveStrength: 6,
      },
    ],
  })
  await gameManager.deploy({
    unitName: unitName4,
    combat: Combat.Ranged,
    moraling: [
      {
        name: unitName2,
        row: Combat.Ranged,
        effectiveStrength: 5,
        player: gameManager.opponent.gamePlayer,
      },
    ],
  })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName5,
    scorching: [
      {
        name: unitName4,
        row: Combat.Ranged,
        strength: 6,
        player: gameManager.opponent.gamePlayer,
      },
    ],
    moraling: [
      {
        name: unitName2,
        row: Combat.Ranged,
        effectiveStrength: 4,
        player: gameManager.opponent.gamePlayer,
      },
      {
        name: unitName5,
        row: Combat.Ranged,
        effectiveStrength: 8,
        player: gameManager.self.gamePlayer,
      },
    ],
  })
})

test('Schirru removes only opponents unit if self has same one', async (t) => {
  const unitName1 = 'Morvran Voorhis'
  const unitName2 = "Gaunter O'Dimm"
  const unitName3 = "Gaunter O'Dimm"
  const unitName4 = 'Schirru'
  const gameManager = await createGameManager({
    label: `${getScenario(t)}-${t.ctx.start}`,
    self: {
      faction: FactionKey.ScoiaTael,
      handUnitNames: [unitName2, unitName4],
      ignoreUnitNames: ["Gaunter O'Dimm Darkness", "Gaunter O'Dimm Darkness", "Gaunter O'Dimm Darkness"],
    },
    opponent: {
      faction: FactionKey.NilfgaardianEmpire,
      handUnitNames: [unitName1, unitName3],
      ignoreUnitNames: ["Gaunter O'Dimm Darkness", "Gaunter O'Dimm Darkness", "Gaunter O'Dimm Darkness"],
    },
    opponentFirst: true,
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.deploy({ unitName: unitName2, mustering: [] })
  await gameManager.deploy({ unitName: unitName3, mustering: [] })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName4,
    scorching: [
      {
        name: unitName3,
        row: Combat.Siege,
        strength: 2,
        player: gameManager.opponent.gamePlayer,
      },
    ],
  })
})
