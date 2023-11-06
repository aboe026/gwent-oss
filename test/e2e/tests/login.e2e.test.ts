import ApiClient from '../util/api-client'
import Banner from '../components/banner'
import E2eUtil from '../util/e2e-util'
import env from '../util/env'
import HomePage from '../page-objects/home-page'
import LoginPage from '../page-objects/login-page'

fixture('Login').page(env.BASE_URL)

test('Shows error for nonexistent user', async () => {
  const username = `nonexistent-user-${Date.now()}`
  await verifyNotLoggedIn()

  await LoginPage.login(username, 'password')

  await LoginPage.verifyError(`Invalid credentials for user "${username}"`)
  await verifyNotLoggedIn()
})

test('Shows error for wrong password', async () => {
  const username = `invalid-credentials-${Date.now()}`
  await ApiClient.addUser(username, 'password')
  await verifyNotLoggedIn()

  await LoginPage.login(username, 'invalid')

  await LoginPage.verifyError(`Invalid credentials for user "${username}"`)
  await verifyNotLoggedIn()
})

test('Logs in user after they sign up', async () => {
  const username = `new-user-${Date.now()}`
  await verifyNotLoggedIn()

  await LoginPage.signUp(username, 'password')

  await verifyLoggedIn(username)
})

test('Logs in existing user', async () => {
  const username = `existing-user-${Date.now()}`
  const password = 'password'
  await ApiClient.addUser(username, password)
  await verifyNotLoggedIn()

  await LoginPage.login(username, password)

  await verifyLoggedIn(username)
})

test('Shows error if signing up for user that already exists', async () => {
  const username = `duplicate-user-${Date.now()}`
  const password = 'password'
  await ApiClient.addUser(username, password)
  await verifyNotLoggedIn()

  await LoginPage.signUp(username, password)

  await LoginPage.verifyError(`User "${username}" already exists`)
  await verifyNotLoggedIn()
})

test('User session persists across refresh after sign up', async () => {
  const username = `new-user-${Date.now()}`
  await verifyNotLoggedIn()
  await LoginPage.signUp(username, 'password')
  await verifyLoggedIn(username)

  await E2eUtil.reload()

  await verifyLoggedIn(username)
})

test('User session persists across refresh after login', async () => {
  const username = `new-user-${Date.now()}`
  const password = 'password'
  await ApiClient.addUser(username, password)
  await verifyNotLoggedIn()
  await LoginPage.login(username, password)
  await verifyLoggedIn(username)

  await E2eUtil.reload()

  await verifyLoggedIn(username)
})

export async function verifyNotLoggedIn() {
  await E2eUtil.verifyCurrentUrl('login')
  await HomePage.verifyContent(false)
  await Banner.verifyUsername('')
}

export async function verifyLoggedIn(username: string) {
  await E2eUtil.verifyCurrentUrl('')
  await Banner.verifyUsername(username)
  await HomePage.verifyContent()
}
