import ApiClient from '../util/api-client'
import Banner from '../components/banner'
import { E2eCtx, getFixtureCtx, getTestCtx } from '../util/e2e-ctx'
import GamePage from '../page-objects/game-page'
import GamesPage from '../page-objects/games-page'
import { GameStatus } from '@gwent-oss/node-client'
import LoginPage from '../page-objects/login-page'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Games View').page(GamesPage.getUrl())

test('Shows message if no games', async (t) => {
  const username = `games-none-${t.ctx.start}`
  await new ApiClient({}).addUser({
    name: username,
  })
  await LoginPage.login({
    username,
  })
  await GamesPage.verify({
    games: [],
  })
})

test('Displays single game', async (t) => {
  const scenario = 'games-single'
  const username = `${scenario}-user-${t.ctx.start}`
  const opponent = `${scenario}-opponent-${t.ctx.start}`
  await new ApiClient({}).addUser({
    name: username,
  })
  await new ApiClient({}).addUser({
    name: opponent,
  })
  const client = new ApiClient({
    username,
  })
  const game = await client.addGame([opponent])
  await LoginPage.login({
    username,
  })
  await GamesPage.verify({
    games: [
      {
        created: game.created,
        owner: username,
        players: [username, opponent],
        status: GameStatus.Decking,
      },
    ],
  })
})

test('Displays two games', async (t) => {
  const scenario = 'games-two'
  const username = `${scenario}-user-${t.ctx.start}`
  const opponent = `${scenario}-opponent-${t.ctx.start}`
  await new ApiClient({}).addUser({
    name: username,
  })
  await new ApiClient({}).addUser({
    name: opponent,
  })
  const client1 = new ApiClient({
    username,
  })
  const game1 = await client1.addGame([opponent])
  const client2 = new ApiClient({
    username: opponent,
  })
  const game2 = await client2.addGame([username])
  await LoginPage.login({
    username,
  })
  await GamesPage.verify({
    games: [
      {
        created: game2.created,
        owner: opponent,
        players: [opponent, username],
        status: GameStatus.Decking,
      },
      {
        created: game1.created,
        owner: username,
        players: [username, opponent],
        status: GameStatus.Decking,
      },
    ],
  })
})

test('List gets updated after game created', async (t) => {
  const scenario = 'games-single'
  const username = `${scenario}-user-${t.ctx.start}`
  const opponent = `${scenario}-opponent-${t.ctx.start}`
  await new ApiClient({}).addUser({
    name: username,
  })
  await new ApiClient({}).addUser({
    name: opponent,
  })
  await LoginPage.login({
    username,
  })
  await GamesPage.verify({
    games: [],
  })
  await GamesPage.clickCreateNone()
  await GamePage.createGame({
    creator: username,
    opponents: [opponent],
  })
  const id = await GamePage.getIdFromUrl()
  const game = await new ApiClient({
    username,
  }).getGame(id)
  await Banner.goTo(Banner.elements.MenuGames)
  await GamesPage.verify({
    games: [
      {
        created: game.created,
        owner: username,
        players: [username, opponent],
        status: GameStatus.Decking,
      },
    ],
  })
})

test('Shows game created by api after list refresh button clicked', async (t) => {
  const scenario = 'games-refresh'
  const username = `${scenario}-user-${t.ctx.start}`
  const opponent = `${scenario}-opponent-${t.ctx.start}`
  await new ApiClient({}).addUser({
    name: username,
  })
  await new ApiClient({}).addUser({
    name: opponent,
  })
  const client1 = new ApiClient({
    username,
  })
  const game1 = await client1.addGame([opponent])
  const client2 = new ApiClient({
    username: opponent,
  })

  await LoginPage.login({
    username,
  })
  await GamesPage.verify({
    games: [
      {
        created: game1.created,
        owner: username,
        players: [username, opponent],
        status: GameStatus.Decking,
      },
    ],
  })

  const game2 = await client2.addGame([username])

  await GamesPage.refresh()

  await GamesPage.verify({
    games: [
      {
        created: game2.created,
        owner: opponent,
        players: [opponent, username],
        status: GameStatus.Decking,
      },
      {
        created: game1.created,
        owner: username,
        players: [username, opponent],
        status: GameStatus.Decking,
      },
    ],
  })
})
