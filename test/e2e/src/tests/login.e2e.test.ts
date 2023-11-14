import ApiClient from '../graphql/api-client'
import E2eUtil from '../util/e2e-util'
import env from '../util/env'
import HomePage from '../page-objects/home-page'
import LoginPage from '../page-objects/login-page'

fixture('Login').page(env.BASE_URL)

test('Shows error for nonexistent user', async () => {
  const username = `nonexistent-user-${Date.now()}`
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
    error: `Invalid credentials for user "${username}"`,
  })
})

test('Shows error for wrong password', async () => {
  const username = `invalid-credentials-${Date.now()}`
  const password = 'invalid'
  await ApiClient.addUser({
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
    error: `Invalid credentials for user "${username}"`,
  })
})

test('Logs in user after they sign up', async () => {
  await LoginPage.signUp({
    username: `new-user-${Date.now()}`,
  })
  await HomePage.verifyContent()
})

test('Logs in existing user', async () => {
  const username = `existing-user-${Date.now()}`
  const password = 'password'
  await ApiClient.addUser({
    name: username,
    password,
  })

  await LoginPage.login({
    username,
    password,
  })

  await HomePage.verifyContent()
})

test('Shows error if signing up for user that already exists', async () => {
  const username = `duplicate-user-${Date.now()}`
  const password = 'password'
  await ApiClient.addUser({
    name: username,
    password,
  })
  await LoginPage.verifyNotLoggedIn({})

  await LoginPage.signUp({
    username,
    password,
    verify: false,
  })

  await LoginPage.verifyNotLoggedIn({
    username,
    password,
    error: `User "${username}" already exists`,
  })
})

test('User session persists across refresh after sign up', async () => {
  await LoginPage.signUp({
    username: `sign-up-persistence-${Date.now()}`,
  })

  await E2eUtil.reload()

  await HomePage.verifyContent()
})

test('User session persists across refresh after login', async () => {
  const username = `login-persistence-${Date.now()}`
  const password = 'password'
  await ApiClient.addUser({
    name: username,
    password,
  })
  await LoginPage.login({
    username,
    password,
  })

  await E2eUtil.reload()

  await LoginPage.verifyLoggedIn()
  await HomePage.verifyContent()
})
