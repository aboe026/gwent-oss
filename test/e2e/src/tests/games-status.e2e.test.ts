import ApiClient from '../util/api-client'
import { E2eCtx, getFixtureCtx, getTestCtx } from '../util/e2e-ctx'
import GamesPage from '../page-objects/games-page'
import { FactionKey, Game, GameStatus, User } from '@gwent/graphql-schema/resolver-typings'
import LoginPage from '../page-objects/login-page'

interface GamesStatusTestCtx extends E2eCtx {
  scenario: string
  self: {
    user: User
    client: ApiClient
  }
  opponent: {
    user: User
    client: ApiClient
  }
  scoiaTael: {
    faction: FactionKey
    leader: string
    units: string[]
  }
  nilfgaard: {
    faction: FactionKey
    leader: string
    units: string[]
  }
  game: Game
}
const fixture = getFixtureCtx<E2eCtx, GamesStatusTestCtx>()
const test = getTestCtx<E2eCtx, GamesStatusTestCtx>()

fixture('Games Status')
  .page(GamesPage.getUrl())
  .beforeEach(async (t) => {
    t.ctx.scenario = 'games-status'
    const selfUsername = `${t.ctx.scenario}-self-${t.ctx.start}`
    const opponentUsername = `${t.ctx.scenario}-opponent-${t.ctx.start}`

    t.ctx.self = {
      user: await new ApiClient({}).addUser({
        name: selfUsername,
      }),
      client: new ApiClient({
        username: selfUsername,
      }),
    }
    t.ctx.opponent = {
      user: await new ApiClient({}).addUser({
        name: opponentUsername,
      }),
      client: new ApiClient({
        username: opponentUsername,
      }),
    }

    t.ctx.scoiaTael = {
      faction: FactionKey.ScoiaTael,
      leader: 'Francesca Findabair Queen of Dol Blathanna',
      units: [
        'Barclay Els',
        'Ciaran aep Easnillien',
        'Cirilla Fiona Elen Riannon',
        'Dol Blathanna Archer',
        'Dol Blathanna Scout',
        'Dol Blathanna Scout',
        'Dol Blathanna Scout',
        'Dwarven Skirmisher',
        'Dwarven Skirmisher',
        'Dwarven Skirmisher',
        'Eithne',
        'Elven Skirmisher',
        'Elven Skirmisher',
        'Elven Skirmisher',
        'Emiel Regis Rohellec Terzieff',
        'Filavandrel aen Fidhail',
        'Havekar Healer',
        'Havekar Healer',
        'Havekar Healer',
        'Havekar Smuggler',
        'Havekar Smuggler',
        'Havekar Smuggler',
        'Scorch',
      ],
    }
    t.ctx.nilfgaard = {
      faction: FactionKey.NilfgaardianEmpire,
      leader: 'Emhyr var Emreis the Relentless',
      units: [
        'Albrich',
        'Assire var Anahid',
        'Black Infantry Archer',
        'Black Infantry Archer',
        'Emiel Regis Rohellec Terzieff',
        'Etolian Auxiliary Archers',
        'Etolian Auxiliary Archers',
        'Heavy Zerrikanian Fire Scorpion',
        'Impera Brigade Guard',
        'Impera Brigade Guard',
        'Impera Brigade Guard',
        'Impera Brigade Guard',
        'Nausicaa Cavalry Rider',
        'Nausicaa Cavalry Rider',
        'Nausicaa Cavalry Rider',
        'Renuald aep Matsen',
        'Rotten Mangonel',
        'Shilard Fitz-Oesterlen',
        'Siege Engineer',
        'Siege Technician',
        'Young Emissary',
        'Young Emissary',
      ],
    }

    t.ctx.game = await t.ctx.self.client.addGame([t.ctx.opponent.user.name])
  })

test('Automatically updated with ordering status if decks set through API and self is scoitael', async (t) => {
  const selfDeck = await t.ctx.self.client.addDeck({
    faction: t.ctx.scoiaTael.faction,
    leaderName: t.ctx.scoiaTael.leader,
    name: `${t.ctx.scenario}-self-deck-${t.ctx.start}`,
    unitNames: t.ctx.scoiaTael.units,
  })
  const opponentDeck = await t.ctx.opponent.client.addDeck({
    faction: t.ctx.nilfgaard.faction,
    leaderName: t.ctx.nilfgaard.leader,
    name: `${t.ctx.scenario}-opponent-deck-${t.ctx.start}`,
    unitNames: t.ctx.nilfgaard.units,
  })
  await t.ctx.self.client.setDeck({
    deckId: selfDeck.id,
    gameId: t.ctx.game.id,
  })
  await LoginPage.login({
    username: t.ctx.self.user.name,
  })
  await GamesPage.verify({
    games: [
      {
        created: t.ctx.game.created,
        owner: t.ctx.self.user.name,
        players: [t.ctx.self.user.name, t.ctx.opponent.user.name],
        status: GameStatus.Decking,
      },
    ],
  })
  await t.ctx.opponent.client.setDeck({
    deckId: opponentDeck.id,
    gameId: t.ctx.game.id,
  })
  await GamesPage.verify({
    games: [
      {
        created: t.ctx.game.created,
        owner: t.ctx.self.user.name,
        players: [t.ctx.self.user.name, t.ctx.opponent.user.name],
        status: GameStatus.Ordering,
        factions: [FactionKey.ScoiaTael, FactionKey.NilfgaardianEmpire],
      },
    ],
  })
})

test('Automatically updated with ordering status if decks set through API and opponent is scoitael', async (t) => {
  const selfDeck = await t.ctx.self.client.addDeck({
    faction: t.ctx.nilfgaard.faction,
    leaderName: t.ctx.nilfgaard.leader,
    name: `${t.ctx.scenario}-self-deck-${t.ctx.start}`,
    unitNames: t.ctx.nilfgaard.units,
  })
  const opponentDeck = await t.ctx.opponent.client.addDeck({
    faction: t.ctx.scoiaTael.faction,
    leaderName: t.ctx.scoiaTael.leader,
    name: `${t.ctx.scenario}-opponent-deck-${t.ctx.start}`,
    unitNames: t.ctx.scoiaTael.units,
  })
  await t.ctx.self.client.setDeck({
    deckId: selfDeck.id,
    gameId: t.ctx.game.id,
  })
  await LoginPage.login({
    username: t.ctx.self.user.name,
  })
  await GamesPage.verify({
    games: [
      {
        created: t.ctx.game.created,
        owner: t.ctx.self.user.name,
        players: [t.ctx.self.user.name, t.ctx.opponent.user.name],
        status: GameStatus.Decking,
      },
    ],
  })
  await t.ctx.opponent.client.setDeck({
    deckId: opponentDeck.id,
    gameId: t.ctx.game.id,
  })
  await GamesPage.verify({
    games: [
      {
        created: t.ctx.game.created,
        owner: t.ctx.self.user.name,
        players: [t.ctx.self.user.name, t.ctx.opponent.user.name],
        status: GameStatus.Ordering,
        factions: [FactionKey.NilfgaardianEmpire, FactionKey.ScoiaTael],
      },
    ],
  })
})

test('Games page updated with redrawing status if order set by self through API', async (t) => {
  const selfDeck = await t.ctx.self.client.addDeck({
    faction: t.ctx.scoiaTael.faction,
    leaderName: t.ctx.scoiaTael.leader,
    name: `${t.ctx.scenario}-self-deck-${t.ctx.start}`,
    unitNames: t.ctx.scoiaTael.units,
  })
  const opponentDeck = await t.ctx.opponent.client.addDeck({
    faction: t.ctx.nilfgaard.faction,
    leaderName: t.ctx.nilfgaard.leader,
    name: `${t.ctx.scenario}-opponent-deck-${t.ctx.start}`,
    unitNames: t.ctx.nilfgaard.units,
  })
  await t.ctx.self.client.setDeck({
    deckId: selfDeck.id,
    gameId: t.ctx.game.id,
  })
  await t.ctx.opponent.client.setDeck({
    deckId: opponentDeck.id,
    gameId: t.ctx.game.id,
  })
  await LoginPage.login({
    username: t.ctx.self.user.name,
  })
  await GamesPage.verify({
    games: [
      {
        created: t.ctx.game.created,
        owner: t.ctx.self.user.name,
        players: [t.ctx.self.user.name, t.ctx.opponent.user.name],
        status: GameStatus.Ordering,
        factions: [FactionKey.ScoiaTael, FactionKey.NilfgaardianEmpire],
      },
    ],
  })
  await t.ctx.self.client.setOrder({
    gameId: t.ctx.game.id,
    userIds: [t.ctx.self.user.id, t.ctx.opponent.user.id],
  })
  await GamesPage.verify({
    games: [
      {
        created: t.ctx.game.created,
        owner: t.ctx.self.user.name,
        players: [t.ctx.self.user.name, t.ctx.opponent.user.name],
        status: GameStatus.Redrawing,
        factions: [FactionKey.ScoiaTael, FactionKey.NilfgaardianEmpire],
      },
    ],
  })
})

test('Games page updated with redrawing status if order set by opponent through API', async (t) => {
  const selfDeck = await t.ctx.self.client.addDeck({
    faction: t.ctx.nilfgaard.faction,
    leaderName: t.ctx.nilfgaard.leader,
    name: `${t.ctx.scenario}-self-deck-${t.ctx.start}`,
    unitNames: t.ctx.nilfgaard.units,
  })
  const opponentDeck = await t.ctx.opponent.client.addDeck({
    faction: t.ctx.scoiaTael.faction,
    leaderName: t.ctx.scoiaTael.leader,
    name: `${t.ctx.scenario}-opponent-deck-${t.ctx.start}`,
    unitNames: t.ctx.scoiaTael.units,
  })
  await t.ctx.self.client.setDeck({
    deckId: selfDeck.id,
    gameId: t.ctx.game.id,
  })
  await t.ctx.opponent.client.setDeck({
    deckId: opponentDeck.id,
    gameId: t.ctx.game.id,
  })
  await LoginPage.login({
    username: t.ctx.self.user.name,
  })
  await GamesPage.verify({
    games: [
      {
        created: t.ctx.game.created,
        owner: t.ctx.self.user.name,
        players: [t.ctx.self.user.name, t.ctx.opponent.user.name],
        status: GameStatus.Ordering,
        factions: [FactionKey.NilfgaardianEmpire, FactionKey.ScoiaTael],
      },
    ],
  })
  await t.ctx.opponent.client.setOrder({
    gameId: t.ctx.game.id,
    userIds: [t.ctx.opponent.user.id, t.ctx.self.user.id],
  })
  await GamesPage.verify({
    games: [
      {
        created: t.ctx.game.created,
        owner: t.ctx.self.user.name,
        players: [t.ctx.self.user.name, t.ctx.opponent.user.name],
        status: GameStatus.Redrawing,
        factions: [FactionKey.NilfgaardianEmpire, FactionKey.ScoiaTael],
      },
    ],
  })
})

test('Games page updated with redrawing status if decks set through API by self last', async (t) => {
  const selfDeck = await t.ctx.self.client.addDeck({
    faction: t.ctx.nilfgaard.faction,
    leaderName: t.ctx.nilfgaard.leader,
    name: `${t.ctx.scenario}-self-deck-${t.ctx.start}`,
    unitNames: t.ctx.nilfgaard.units,
  })
  const opponentDeck = await t.ctx.opponent.client.addDeck({
    faction: t.ctx.nilfgaard.faction,
    leaderName: t.ctx.nilfgaard.leader,
    name: `${t.ctx.scenario}-opponent-deck-${t.ctx.start}`,
    unitNames: t.ctx.nilfgaard.units,
  })
  await t.ctx.opponent.client.setDeck({
    deckId: opponentDeck.id,
    gameId: t.ctx.game.id,
  })
  await LoginPage.login({
    username: t.ctx.self.user.name,
  })
  await GamesPage.verify({
    games: [
      {
        created: t.ctx.game.created,
        owner: t.ctx.self.user.name,
        players: [t.ctx.self.user.name, t.ctx.opponent.user.name],
        status: GameStatus.Decking,
      },
    ],
  })
  await t.ctx.self.client.setDeck({
    deckId: selfDeck.id,
    gameId: t.ctx.game.id,
  })
  await GamesPage.verify({
    games: [
      {
        created: t.ctx.game.created,
        owner: t.ctx.self.user.name,
        players: [t.ctx.self.user.name, t.ctx.opponent.user.name],
        status: GameStatus.Redrawing,
        factions: [FactionKey.NilfgaardianEmpire, FactionKey.NilfgaardianEmpire],
      },
    ],
  })
})

test('Games page updated with redrawing status if decks set through API by opponent last', async (t) => {
  const selfDeck = await t.ctx.self.client.addDeck({
    faction: t.ctx.nilfgaard.faction,
    leaderName: t.ctx.nilfgaard.leader,
    name: `${t.ctx.scenario}-self-deck-${t.ctx.start}`,
    unitNames: t.ctx.nilfgaard.units,
  })
  const opponentDeck = await t.ctx.opponent.client.addDeck({
    faction: t.ctx.nilfgaard.faction,
    leaderName: t.ctx.nilfgaard.leader,
    name: `${t.ctx.scenario}-opponent-deck-${t.ctx.start}`,
    unitNames: t.ctx.nilfgaard.units,
  })
  await t.ctx.self.client.setDeck({
    deckId: selfDeck.id,
    gameId: t.ctx.game.id,
  })
  await LoginPage.login({
    username: t.ctx.self.user.name,
  })
  await GamesPage.verify({
    games: [
      {
        created: t.ctx.game.created,
        owner: t.ctx.self.user.name,
        players: [t.ctx.self.user.name, t.ctx.opponent.user.name],
        status: GameStatus.Decking,
      },
    ],
  })
  await t.ctx.opponent.client.setDeck({
    deckId: opponentDeck.id,
    gameId: t.ctx.game.id,
  })
  await GamesPage.verify({
    games: [
      {
        created: t.ctx.game.created,
        owner: t.ctx.self.user.name,
        players: [t.ctx.self.user.name, t.ctx.opponent.user.name],
        status: GameStatus.Redrawing,
        factions: [FactionKey.NilfgaardianEmpire, FactionKey.NilfgaardianEmpire],
      },
    ],
  })
})

test('Games page updated with playing status if marked ready through API by self last', async (t) => {
  const selfDeck = await t.ctx.self.client.addDeck({
    faction: t.ctx.nilfgaard.faction,
    leaderName: t.ctx.nilfgaard.leader,
    name: `${t.ctx.scenario}-self-deck-${t.ctx.start}`,
    unitNames: t.ctx.nilfgaard.units,
  })
  const opponentDeck = await t.ctx.opponent.client.addDeck({
    faction: t.ctx.nilfgaard.faction,
    leaderName: t.ctx.nilfgaard.leader,
    name: `${t.ctx.scenario}-opponent-deck-${t.ctx.start}`,
    unitNames: t.ctx.nilfgaard.units,
  })
  await t.ctx.self.client.setDeck({
    deckId: selfDeck.id,
    gameId: t.ctx.game.id,
  })
  await t.ctx.opponent.client.setDeck({
    deckId: opponentDeck.id,
    gameId: t.ctx.game.id,
  })
  await t.ctx.opponent.client.ready(t.ctx.game.id)
  await LoginPage.login({
    username: t.ctx.self.user.name,
  })
  await GamesPage.verify({
    games: [
      {
        created: t.ctx.game.created,
        owner: t.ctx.self.user.name,
        players: [t.ctx.self.user.name, t.ctx.opponent.user.name],
        status: GameStatus.Redrawing,
        factions: [FactionKey.NilfgaardianEmpire, FactionKey.NilfgaardianEmpire],
      },
    ],
  })
  await t.ctx.self.client.ready(t.ctx.game.id)
  await GamesPage.verify({
    games: [
      {
        created: t.ctx.game.created,
        owner: t.ctx.self.user.name,
        players: [t.ctx.self.user.name, t.ctx.opponent.user.name],
        status: GameStatus.Playing,
        factions: [FactionKey.NilfgaardianEmpire, FactionKey.NilfgaardianEmpire],
      },
    ],
  })
})

test('Games page updated with playing status if marked ready through API by opponent last', async (t) => {
  const selfDeck = await t.ctx.self.client.addDeck({
    faction: t.ctx.nilfgaard.faction,
    leaderName: t.ctx.nilfgaard.leader,
    name: `${t.ctx.scenario}-self-deck-${t.ctx.start}`,
    unitNames: t.ctx.nilfgaard.units,
  })
  const opponentDeck = await t.ctx.opponent.client.addDeck({
    faction: t.ctx.nilfgaard.faction,
    leaderName: t.ctx.nilfgaard.leader,
    name: `${t.ctx.scenario}-opponent-deck-${t.ctx.start}`,
    unitNames: t.ctx.nilfgaard.units,
  })
  await t.ctx.self.client.setDeck({
    deckId: selfDeck.id,
    gameId: t.ctx.game.id,
  })
  await t.ctx.opponent.client.setDeck({
    deckId: opponentDeck.id,
    gameId: t.ctx.game.id,
  })
  await t.ctx.self.client.ready(t.ctx.game.id)
  await LoginPage.login({
    username: t.ctx.self.user.name,
  })
  await GamesPage.verify({
    games: [
      {
        created: t.ctx.game.created,
        owner: t.ctx.self.user.name,
        players: [t.ctx.self.user.name, t.ctx.opponent.user.name],
        status: GameStatus.Redrawing,
        factions: [FactionKey.NilfgaardianEmpire, FactionKey.NilfgaardianEmpire],
      },
    ],
  })
  await t.ctx.opponent.client.ready(t.ctx.game.id)
  await GamesPage.verify({
    games: [
      {
        created: t.ctx.game.created,
        owner: t.ctx.self.user.name,
        players: [t.ctx.self.user.name, t.ctx.opponent.user.name],
        status: GameStatus.Playing,
        factions: [FactionKey.NilfgaardianEmpire, FactionKey.NilfgaardianEmpire],
      },
    ],
  })
})
