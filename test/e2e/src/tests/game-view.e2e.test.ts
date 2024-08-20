import { ObjectId } from 'mongodb'

import ApiClient from '../util/api-client'
import LoginPage from '../page-objects/login-page'
import GamePage from '../page-objects/game-page'
import E2eUtil from '../util/e2e-util'
import GamesPage from '../page-objects/games-page'

fixture('Game View').page(GamePage.getUrl())

test('Show not authorized if invalid ID', async () => {
  const username = `game-view-invalid-${Date.now()}`
  await new ApiClient({}).addUser({
    name: username,
  })
  await LoginPage.login({
    username,
  })

  await E2eUtil.goTo(GamePage.getUrl('invalid'))

  await GamePage.verifyAuthError()
  await GamePage.viewGames()
  await GamesPage.verify({
    games: [],
  })
})

test('Show not authorized if game does not exist', async () => {
  const username = `game-view-dne-${Date.now()}`
  await new ApiClient({}).addUser({
    name: username,
  })
  await LoginPage.login({
    username,
  })

  await E2eUtil.goTo(GamePage.getUrl(new ObjectId().toString()))

  await GamePage.verifyAuthError()
  await GamePage.viewGames()
  await GamesPage.verify({
    games: [],
  })
})

test('Show not authorized if not participant of game', async () => {
  const username1 = `game-view-not-participant-${Date.now()}`
  const username2 = `game-view-participant-1-${Date.now()}`
  const username3 = `game-view-participant-2-${Date.now()}`
  await new ApiClient({}).addUser({
    name: username1,
  })
  await new ApiClient({}).addUser({
    name: username2,
  })
  await new ApiClient({}).addUser({
    name: username3,
  })
  const client = new ApiClient({
    username: username2,
  })
  const game = await client.addGame([username3])
  await LoginPage.login({
    username: username1,
  })

  await E2eUtil.goTo(GamePage.getUrl(game.id))

  await GamePage.verifyAuthError()
  await GamePage.viewGames()
  await GamesPage.verify({
    games: [],
  })
})
