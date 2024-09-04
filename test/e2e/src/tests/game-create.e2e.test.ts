import { t } from 'testcafe'

import ApiClient from '../util/api-client'
import LoginPage from '../page-objects/login-page'
import GamePage from '../page-objects/game-page'
import E2eUtil from '../util/e2e-util'
import { ObjectId } from 'mongodb'
import GamesPage from '../page-objects/games-page'

fixture('Game Create').page(GamePage.getUrl())

test('Errors if opponent does not exist', async () => {
  const username = `game-create-opponent-dne-${Date.now()}`
  const opponent = 'does-not-exist'
  await new ApiClient({}).addUser({
    name: username,
  })
  await LoginPage.login({
    username,
  })

  await GamePage.createGame({
    creator: username,
    opponents: [opponent],
    error: `Error adding game: User with name "${opponent}" does not exist.`,
  })
})

test('Create game with valid opponent', async () => {
  const username = `game-create-1-${Date.now()}`
  const opponent = `game-create-2-${Date.now()}`
  await new ApiClient({}).addUser({
    name: username,
  })
  await new ApiClient({}).addUser({
    name: opponent,
  })
  await LoginPage.login({
    username,
  })

  await GamePage.createGame({
    creator: username,
    opponents: [opponent],
  })
  const client = new ApiClient({
    username,
  })
  const games = await client.getGames()
  await t.expect(games.length).eql(1)
  await t.expect(ObjectId.isValid(games[0].id)).ok()
  await E2eUtil.verifyCurrentUrl(GamePage.getUrl(games[0].id))
  await GamePage.verify({
    self: {
      name: username,
    },
    opponent: {
      name: opponent,
    },
  })
})

test('Cancel brings user to games list', async () => {
  const username = `game-create-cancel-${Date.now()}`
  await new ApiClient({}).addUser({
    name: username,
  })
  await LoginPage.login({
    username,
  })

  await GamePage.verifyNew({
    creator: username,
    opponents: [],
  })

  await GamePage.clickNewCancel()

  await E2eUtil.verifyCurrentUrl(GamesPage.getUrl())
})
