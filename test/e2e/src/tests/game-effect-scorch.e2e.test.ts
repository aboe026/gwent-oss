import ApiClient from '../util/api-client'
import { Combat, FactionKey, Game } from '@gwent/graphql-schema/resolver-typings'
import { ContextGameDeck, ContextGamePlayer, E2eHelper, MoralingExpected } from '../util/e2e-helper'
import { E2eCtx, E2ETestController, getFixtureCtx, getTestCtx } from '../util/e2e-ctx'
import { ensureUnitsInHand } from '@gwent/test-utils'
import env from '../util/env'
import GameManager from '../util/game-manager'
import HomePage from '../page-objects/home-page'
import { PlayerTurn } from '../components/game-player-info'

interface GameEffectScorchTestCtx extends E2eCtx {
  scenario: string
  self: ContextGamePlayer
  opponent: ContextGamePlayer
  monsters: ContextGameDeck
  nilfgaard: ContextGameDeck
  scoiatael: ContextGameDeck
  skellige: ContextGameDeck
  game: Game
}
const fixture = getFixtureCtx<E2eCtx, GameEffectScorchTestCtx>()
const test = getTestCtx<E2eCtx, GameEffectScorchTestCtx>()

fixture('Game Effect Scorch')
  .page(HomePage.getUrl())
  .beforeEach(async (t) => {
    t.ctx.scenario = 'game-effect-scorch'
    const self = await new ApiClient({}).addUser({
      name: `${t.ctx.scenario}-self-${t.ctx.start}`,
    })
    const opponent = await new ApiClient({}).addUser({
      name: `${t.ctx.scenario}-opponent-${t.ctx.start}`,
    })

    t.ctx.monsters = {
      faction: FactionKey.Monsters,
      leader: 'Eredin Bringer of Death',
      // TODO: just create with all units? do only units in hand matter?
      units: [
        'Draug',
        'Emiel Regis Rohellec Terzieff',
        'Endrega',
        'Fiend',
        'Fire Elemental',
        'Foglet',
        'Forktail',
        'Frightener',
        'Gargoyle',
        'Griffin',
        'Ice Giant',
        'Imlerith',
        'Leshen',
        'Plague Maiden',
        'Roach',
        'Scorch',
        'Toad',
        'Vesemir',
        'Villentretenmerth',
        'Werewolf',
        'Wyvern',
        'Zoltan Chivay',
      ],
    }
    t.ctx.nilfgaard = {
      faction: FactionKey.NilfgaardianEmpire,
      leader: 'Emhyr var Emreis His Imperial Majesty',
      units: [
        'Albrich',
        'Sweers',
        'Vreemde',
        'Morteisen',
        'Puttkammer',
        'Roach',
        'Rotten Mangonel',
        'Cynthia',
        'Rainfarn',
        'Vanhemar',
        'Emiel Regis Rohellec Terzieff',
        'Renuald aep Matsen',
        'Zerrikanian Fire Scorpion',
        'Zoltan Chivay',
        'Assire var Anahid',
        'Cahir Mawr Dyffryn aep Ceallach',
        'Fringilla Vigo',
        'Siege Engineer',
        'Vesemir',
        'Black Infantry Archer',
        'Black Infantry Archer',
        'Heavy Zerrikanian Fire Scorpion',
      ],
    }
    t.ctx.scoiatael = {
      faction: FactionKey.ScoiaTael,
      leader: 'Francesca Findabair the Beautiful',
      units: [
        'Barclay Els',
        'Ciaran aep Easnillien',
        'Dennis Cranmer',
        'Dol Blathanna Archer',
        'Dol Blathanna Scout',
        'Eithne',
        'Emiel Regis Rohellec Terzieff',
        'Filavandrel aen Fidhail',
        'Ida Emean aep Sivney',
        'Isengrim Faoiltiarna',
        'Mahakaman Defender',
        'Milva',
        'Olgierd Von Everec',
        'Riordain',
        'Schirru',
        'Toruviel',
        'Triss Merigold',
        'Vesemir',
        'Villentretenmerth',
        'Vrihedd Brigade Recruit',
        'Vrihedd Brigade Veteran',
        'Yaevinn',
        'Zoltan Chivay',
      ],
    }
    t.ctx.skellige = {
      faction: FactionKey.Skellige,
      leader: 'Crach an Craite',
      units: [
        'Berserker',
        'Blueboy Lugos',
        'Clan an Craite Warrior',
        'Clan Brokvar Archer',
        'Clan Brokvar Archer',
        'Clan Brokvar Archer',
        'Clan Dimun Pirate',
        'Clan Heymaey Skald',
        'Clan Tordarroch Armorsmith',
        'Donar an Hindar',
        'Emiel Regis Rohellec Terzieff',
        'Hjalmar',
        'Holger Blackhand',
        'Madman Lugos',
        'Olaf',
        'Roach',
        'Scorch',
        'Svanrige',
        'Triss Merigold',
        'Udalryk',
        'Vesemir',
        'Villentretenmerth',
        'War Longship',
        'Zoltan Chivay',
      ],
    }

    const selfClient = new ApiClient({
      username: self.name,
    })
    const opponentClient = new ApiClient({
      username: opponent.name,
    })

    t.ctx.game = await selfClient.addGame([opponent.name])

    t.ctx.self = {
      user: self,
      client: selfClient,
    } as any
    t.ctx.opponent = {
      user: opponent,
      client: opponentClient,
    } as any
  })

test('Scorch does nothing if no other units on the battlefield', async (t) => {
  const unitName1 = 'Scorch'
  const gameManager = await prepareGame({
    t,
    self: {
      deck: t.ctx.monsters,
      hand: [unitName1],
    },
    opponent: {
      deck: t.ctx.scoiatael,
      hand: [],
    },
    selfFirst: true,
  })
  await gameManager.initialize({})

  await gameManager.deploy({ unitName: unitName1 })
})

test('Scorch removes strongest card if on opponents side', async (t) => {
  const unitName1 = 'Dennis Cranmer'
  const unitName2 = 'Scorch'
  const gameManager = await prepareGame({
    t,
    self: {
      deck: t.ctx.monsters,
      hand: [unitName2],
    },
    opponent: {
      deck: t.ctx.scoiatael,
      hand: [unitName1],
    },
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
  const gameManager = await prepareGame({
    t,
    self: {
      deck: t.ctx.monsters,
      hand: [unitName2, unitName3],
    },
    opponent: {
      deck: t.ctx.scoiatael,
      hand: [unitName1],
    },
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.deploy({ unitName: unitName2 })
  await gameManager.pass({})
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

// TODO: opponent can play scorch

test('Scorch removes opponents unit even after they pass', async (t) => {
  const unitName1 = 'Ida Emean aep Sivney'
  const unitName2 = 'Griffin'
  const unitName3 = 'Scorch'
  const gameManager = await prepareGame({
    t,
    self: {
      deck: t.ctx.monsters,
      hand: [unitName2, unitName3],
    },
    opponent: {
      deck: t.ctx.scoiatael,
      hand: [unitName1],
    },
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
  const unitName1 = 'Ida Emean aep Sivney'
  const unitName2 = 'Fiend'
  const unitName3 = 'Scorch'
  const gameManager = await prepareGame({
    t,
    self: {
      deck: t.ctx.monsters,
      hand: [unitName2, unitName3],
    },
    opponent: {
      deck: t.ctx.scoiatael,
      hand: [unitName1],
    },
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
      {
        name: unitName2,
        row: Combat.Close,
        strength: 6,
        player: gameManager.self.gamePlayer,
      },
    ],
  })
})

test('Scorch does not effect heroes', async (t) => {
  const unitName1 = 'Eithne'
  const unitName2 = 'Scorch'
  const gameManager = await prepareGame({
    t,
    self: {
      deck: t.ctx.monsters,
      hand: [unitName2],
    },
    opponent: {
      deck: t.ctx.scoiatael,
      hand: [unitName1],
    },
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.initialize({})

  await gameManager.deploy({ unitName: unitName2 })
})

test('Scorch does not effect unit played after it', async (t) => {
  const unitName1 = 'Scorch'
  const unitName2 = 'Dennis Cranmer'
  const gameManager = await prepareGame({
    t,
    self: {
      deck: t.ctx.monsters,
      hand: [unitName1],
    },
    opponent: {
      deck: t.ctx.scoiatael,
      hand: [unitName2],
    },
    selfFirst: true,
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.initialize({})

  await gameManager.deploy({ unitName: unitName2 })
})

test('Scorch takes into account morale to determine strongest', async (t) => {
  const unitName1 = 'Isengrim Faoiltiarna'
  const unitName2 = 'Fiend'
  const unitName3 = 'Dennis Cranmer'
  const unitName4 = 'Scorch'
  const gameManager = await prepareGame({
    t,
    self: {
      deck: t.ctx.monsters,
      hand: [unitName2, unitName4],
    },
    opponent: {
      deck: t.ctx.scoiatael,
      hand: [unitName1, unitName3],
    },
  })
  await gameManager.deploy({ unitName: unitName1 })
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

test('Scorch scoped to Close combat removes strongest Close combat card on opponents side over 10 effective strength', async (t) => {
  const unitName1 = 'Emiel Regis Rohellec Terzieff'
  const unitName2 = 'Yaevinn'
  const unitName3 = 'Vesemir'
  const unitName4 = 'Mahakaman Defender'
  const unitName5 = 'Roach'
  const unitName6 = 'Vesemir'
  const unitName7 = 'Olaf'
  const unitName8 = 'Villentretenmerth'
  const gameManager = await prepareGame({
    t,
    self: {
      deck: t.ctx.scoiatael,
      hand: [unitName2, unitName4, unitName6, unitName8],
    },
    opponent: {
      deck: t.ctx.skellige,
      hand: [unitName1, unitName3, unitName5, unitName7],
    },
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.deploy({ unitName: unitName2 })
  await gameManager.deploy({ unitName: unitName3 })
  await gameManager.deploy({ unitName: unitName4 })
  await gameManager.deploy({ unitName: unitName5 })
  await gameManager.deploy({ unitName: unitName6 })
  await gameManager.deploy({ unitName: unitName7, combat: Combat.Ranged })
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
  const gameManager = await prepareGame({
    t,
    self: {
      deck: t.ctx.scoiatael,
      hand: [unitName2, unitName4],
    },
    opponent: {
      deck: t.ctx.skellige,
      hand: [unitName1, unitName3],
    },
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.deploy({ unitName: unitName2 })
  await gameManager.deploy({ unitName: unitName3 })
  await gameManager.initialize({})

  await gameManager.deploy({ unitName: unitName4 })
})

test('Scorch scoped to Close combat does not remove opponents unit over 10 effective strength if not in Close combat row', async (t) => {
  const unitName1 = 'Holger Blackhand'
  const unitName2 = 'Yaevinn'
  const unitName3 = 'Olaf'
  const unitName4 = 'Villentretenmerth'
  const gameManager = await prepareGame({
    t,
    self: {
      deck: t.ctx.scoiatael,
      hand: [unitName2, unitName4],
    },
    opponent: {
      deck: t.ctx.skellige,
      hand: [unitName1, unitName3],
    },
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.deploy({ unitName: unitName2 })
  await gameManager.deploy({ unitName: unitName3, combat: Combat.Ranged })
  await gameManager.initialize({})

  await gameManager.deploy({ unitName: unitName4 })
})

test('Scorch scoped to Range combat removes strongest Ranged combat card on opponents side over 10 effective strength', async (t) => {
  // TODO: replace make first 2 units stronger than 3rd one to test that it is properly limiting itself
  const unitName1 = 'Yaevinn'
  const unitName2 = 'Gargoyle'
  const unitName3 = 'Milva'
  const unitName4 = 'Toad'
  const gameManager = await prepareGame({
    t,
    self: {
      deck: t.ctx.monsters,
      hand: [unitName2, unitName4],
    },
    opponent: {
      deck: t.ctx.scoiatael,
      hand: [unitName1, unitName3],
    },
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.deploy({ unitName: unitName2 })
  await gameManager.deploy({ unitName: unitName3 })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName4,
    scorching: [
      {
        name: unitName3,
        row: Combat.Ranged,
        strength: 10,
        player: gameManager.opponent.gamePlayer,
      },
    ],
  })
})

test('Scorch scoped to Ranged combat does not remove opponents Ranged combat if it is not over 10 effective strength', async (t) => {
  // TODO: replace make first 2 units stronger than 3rd one to test that it is properly limiting itself
  // TODO: make self ranged row over 10 effective strengtht to verify it doesn't hurt self
  const unitName1 = 'Yaevinn'
  const unitName2 = 'Gargoyle'
  const unitName3 = 'Ida Emean aep Sivney'
  const unitName4 = 'Toad'
  const gameManager = await prepareGame({
    t,
    self: {
      deck: t.ctx.monsters,
      hand: [unitName2, unitName4],
    },
    opponent: {
      deck: t.ctx.scoiatael,
      hand: [unitName1, unitName3],
    },
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.deploy({ unitName: unitName2 })
  await gameManager.deploy({ unitName: unitName3 })
  await gameManager.initialize({})

  await gameManager.deploy({ unitName: unitName4 })
})

test('Scorch scoped to Ranged combat does not remove opponents unit over 10 effective strength if not in Ranged combat row', async (t) => {
  // TODO: replace make first 2 units stronger than 3rd one to test that it is properly limiting itself
  const unitNameOptional = 'Forktail'
  const unitName1 = 'Albrich'
  const unitName2 = 'Gargoyle'
  const unitName3 = 'Heavy Zerrikanian Fire Scorpion'
  const unitName4 = 'Toad'
  const gameManager = await prepareGame({
    t,
    self: {
      deck: t.ctx.monsters,
      hand: [unitNameOptional, unitName2, unitName4],
    },
    opponent: {
      deck: t.ctx.nilfgaard,
      hand: [unitName1, unitName3],
    },
  })
  if (t.ctx.game.turn?.user.id === t.ctx.self.user.id) {
    await gameManager.deploy({ unitName: unitNameOptional })
  }
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.deploy({ unitName: unitName2 })
  await gameManager.deploy({ unitName: unitName3 })
  await gameManager.initialize({})

  await gameManager.deploy({ unitName: unitName4 })
})

test('Scorch scoped to Siege combat removes strongest Siege combat card on opponents side over 10 effective strength', async (t) => {
  // TODO: replace make first 2 units stronger than 3rd one to test that it is properly limiting itself
  const unitName1 = 'Black Infantry Archer'
  const unitName2 = 'Yaevinn'
  const unitName3 = 'Heavy Zerrikanian Fire Scorpion'
  const unitName4 = 'Schirru'
  const gameManager = await prepareGame({
    t,
    self: {
      deck: t.ctx.scoiatael,
      hand: [unitName2, unitName4],
    },
    opponent: {
      deck: t.ctx.nilfgaard,
      hand: [unitName1, unitName3],
    },
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.deploy({ unitName: unitName2 })
  await gameManager.deploy({ unitName: unitName3 })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName4,
    scorching: [
      {
        name: unitName3,
        row: Combat.Siege,
        strength: 10,
        player: gameManager.opponent.gamePlayer,
      },
    ],
  })
})

test('Scorch scoped to Siege combat does not remove opponents Siege combat if it is not over 10 effective strength', async (t) => {
  // TODO: replace make first 2 units stronger than 3rd one to test that it is properly limiting itself
  const unitName1 = 'Black Infantry Archer'
  const unitName2 = 'Yaevinn'
  const unitName3 = 'Zerrikanian Fire Scorpion'
  const unitName4 = 'Schirru'
  const gameManager = await prepareGame({
    t,
    self: {
      deck: t.ctx.scoiatael,
      hand: [unitName2, unitName4],
    },
    opponent: {
      deck: t.ctx.nilfgaard,
      hand: [unitName1, unitName3],
    },
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.deploy({ unitName: unitName2 })
  await gameManager.deploy({ unitName: unitName3 })
  await gameManager.initialize({})

  await gameManager.deploy({ unitName: unitName4 })
})

test('Clan Dimun Pirate removes strongest card if on opponents side', async (t) => {
  const unitName1 = 'Milva'
  const unitName2 = 'Clan Dimun Pirate'
  const gameManager = await prepareGame({
    t,
    self: {
      deck: t.ctx.skellige,
      hand: [unitName2],
    },
    opponent: {
      deck: t.ctx.scoiatael,
      hand: [unitName1],
    },
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName2,
    scorching: [
      {
        name: unitName1,
        row: Combat.Ranged,
        strength: 10,
        player: gameManager.opponent.gamePlayer,
      },
    ],
  })
})

test('Clan Dimun Pirate removes strongest card if on own side', async (t) => {
  const unitName1 = 'Toruviel'
  const unitName2 = 'Olaf'
  const unitName3 = 'Clan Dimun Pirate'
  const gameManager = await prepareGame({
    t,
    self: {
      deck: t.ctx.skellige,
      hand: [unitName2, unitName3],
    },
    opponent: {
      deck: t.ctx.scoiatael,
      hand: [unitName1],
    },
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.deploy({ unitName: unitName2 })
  await gameManager.pass({})
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName3,
    scorching: [
      {
        name: unitName2,
        row: Combat.Close,
        strength: 12,
        player: gameManager.self.gamePlayer,
      },
    ],
  })
})

test('Clan Dimun Pirate removes itself if strongest unit', async (t) => {
  const unitName1 = 'Toruviel'
  const unitName2 = 'Clan Dimun Pirate'
  const gameManager = await prepareGame({
    t,
    self: {
      deck: t.ctx.skellige,
      hand: [unitName2],
    },
    opponent: {
      deck: t.ctx.scoiatael,
      hand: [unitName1],
    },
  })
  await gameManager.deploy({ unitName: unitName1 })
  await gameManager.initialize({})

  await gameManager.deploy({
    unitName: unitName2,
    scorching: [
      {
        name: unitName2,
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
  const gameManager = await prepareGame({
    t,
    self: {
      deck: t.ctx.skellige,
      hand: [unitName1, unitName3],
    },
    opponent: {
      deck: t.ctx.skellige,
      hand: [unitName2, unitNameOptional],
    },
  })
  let optionalUnitPlayed = false
  if (t.ctx.game.turn?.user.id === t.ctx.opponent.user.id) {
    optionalUnitPlayed = true
    await gameManager.deploy({ unitName: unitNameOptional })
  }
  await gameManager.deploy({ unitName: unitName1 })
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

// TODO: test that scorch does not effect unit without strength (eg Drummer)

async function prepareGame({
  self,
  opponent,
  t,
  selfFirst,
}: {
  t: E2ETestController<E2eCtx, GameEffectScorchTestCtx>
  self: {
    deck: ContextGameDeck
    hand: string[]
  }
  opponent: {
    deck: ContextGameDeck
    hand: string[]
  }
  selfFirst?: boolean
}): Promise<GameManager> {
  t.ctx.self.deck = await t.ctx.self.client.addDeck({
    faction: self.deck.faction,
    leaderName: self.deck.leader,
    name: `${t.ctx.scenario}-self-deck-${Date.now()}`,
    unitNames: self.deck.units,
  })
  t.ctx.opponent.deck = await t.ctx.opponent.client.addDeck({
    faction: opponent.deck.faction,
    leaderName: opponent.deck.leader,
    name: `${t.ctx.scenario}-opponent-deck-${Date.now()}`,
    unitNames: opponent.deck.units,
  })

  await t.ctx.self.client.setDeck({
    deckId: t.ctx.self.deck.id,
    gameId: t.ctx.game.id,
  })
  await t.ctx.opponent.client.setDeck({
    deckId: t.ctx.opponent.deck.id,
    gameId: t.ctx.game.id,
  })

  if (self.deck.faction === FactionKey.ScoiaTael || opponent.deck.faction === FactionKey.ScoiaTael) {
    const client = self.deck.faction === FactionKey.ScoiaTael ? t.ctx.self.client : t.ctx.opponent.client
    await client.setOrder({
      gameId: t.ctx.game.id,
      userIds: [
        selfFirst ? t.ctx.self.user.id : t.ctx.opponent.user.id,
        selfFirst ? t.ctx.opponent.user.id : t.ctx.self.user.id,
      ],
    })
  }
  await t.ctx.self.client.ready(t.ctx.game.id)
  await t.ctx.opponent.client.ready(t.ctx.game.id)

  await ensureUnitsInHand({
    gameId: t.ctx.game.id,
    mongoConnectionString: env.MONGO_URL,
    mongoDatabaseName: env.MONGO_DB,
    unitNames: self.hand,
    userId: t.ctx.self.user.id,
  })
  await ensureUnitsInHand({
    gameId: t.ctx.game.id,
    mongoConnectionString: env.MONGO_URL,
    mongoDatabaseName: env.MONGO_DB,
    unitNames: opponent.hand,
    userId: t.ctx.opponent.user.id,
  })

  t.ctx.self.gameDeck = await t.ctx.self.client.getGameDeck(t.ctx.game.id)
  t.ctx.opponent.gameDeck = await t.ctx.opponent.client.getGameDeck(t.ctx.game.id)
  t.ctx.game = await t.ctx.self.client.getGame(t.ctx.game.id)

  const gameManager = new GameManager({
    gameId: t.ctx.game.id,
    self: {
      client: t.ctx.self.client,
      deck: t.ctx.self.gameDeck,
      gamePlayer: E2eHelper.getGamePlayer({
        player: t.ctx.self,
        turn: selfFirst ? PlayerTurn.Current : undefined,
        ready: true,
        passed: false,
        score: 0,
      }),
    },
    opponent: {
      client: t.ctx.opponent.client,
      deck: t.ctx.opponent.gameDeck,
      gamePlayer: E2eHelper.getGamePlayer({
        player: t.ctx.opponent,
        turn: selfFirst ? undefined : PlayerTurn.Current,
        ready: true,
        score: 0,
      }),
    },
  })

  return gameManager
}
