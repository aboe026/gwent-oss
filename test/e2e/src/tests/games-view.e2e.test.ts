import ApiClient from '../util/api-client'
import LoginPage from '../page-objects/login-page'
import GamesPage from '../page-objects/games-page'
import { GameStatus } from '@gwent/graphql-schema/resolver-typings'
import GamePage from '../page-objects/game-page'
import Banner from '../components/banner'

fixture('Games View').page(GamesPage.getUrl())

test('Shows message if no games', async () => {
  const username = `games-none-${Date.now()}`
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

test('Displays single game', async () => {
  const scenario = 'games-single'
  const username = `${scenario}-user-${Date.now()}`
  const opponent = `${scenario}-opponent-${Date.now()}`
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

test('Displays two games', async () => {
  const scenario = 'games-two'
  const username = `${scenario}-user-${Date.now()}`
  const opponent = `${scenario}-opponent-${Date.now()}`
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

test('List gets updated after game created', async () => {
  const scenario = 'games-single'
  const username = `${scenario}-user-${Date.now()}`
  const opponent = `${scenario}-opponent-${Date.now()}`
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
  await Banner.goTo(Banner.elements.MenuGames)
  await GamesPage.verify({
    games: [
      {
        created: new Date().toISOString(),
        owner: username,
        players: [username, opponent],
        status: GameStatus.Decking,
      },
    ],
  })
})
