import { t } from 'testcafe'

import ApiClient from '../util/api-client'
import E2eUtil from '../util/e2e-util'
import env from '../util/env'
import HomePage from '../page-objects/home-page'
import LoginPage from '../page-objects/login-page'

fixture('Login').page(env.BASE_URL)

test('Shows error for nonexistent user', async () => {
  const username = `nonexistent-user-${t.ctx.start}`
  const password = 'password'
  await LoginPage.verifyNotLoggedIn({})

  await LoginPage.login({
    username,
    password,
    verify: false,
  })

  await LoginPage.verifyNotLoggedIn({
    username,
    password,
    error: `Invalid credentials for user "${username}".`,
  })
})

test('Shows error for wrong password', async () => {
  const username = `invalid-credentials-${t.ctx.start}`
  const password = 'invalid'
  await new ApiClient({}).addUser({
    name: username,
    password: 'password',
  })
  await LoginPage.verifyNotLoggedIn({})

  await LoginPage.login({
    username,
    password,
    verify: false,
  })

  await LoginPage.verifyNotLoggedIn({
    username,
    password,
    error: `Invalid credentials for user "${username}".`,
  })
})

test('Logs in existing user', async () => {
  const username = `existing-user-${t.ctx.start}`
  const password = 'password'
  await new ApiClient({}).addUser({
    name: username,
    password,
  })

  await LoginPage.login({
    username,
    password,
  })

  await HomePage.verify(username)
})

test('User session persists across refresh after login', async () => {
  const username = `login-persistence-${t.ctx.start}`
  const password = 'password'
  await new ApiClient({}).addUser({
    name: username,
    password,
  })
  await LoginPage.login({
    username,
    password,
  })

  await E2eUtil.reload()

  await LoginPage.verifyLoggedIn()
  await HomePage.verify(username)
})
