import ApiClient from '../util/api-client'
import E2eUtil from '../util/e2e-util'
import env from '../util/env'
import HomePage from '../page-objects/home-page'
import SignupPage from '../page-objects/signup-page'

fixture('Signup').page(env.BASE_URL)

test('Logs in user after they sign up', async () => {
  const username = `new-user-${Date.now()}`
  await SignupPage.signUp({
    username,
  })
  await HomePage.verifyContent(username)
})

test('Shows error if signing up for user that already exists', async () => {
  const username = `duplicate-user-${Date.now()}`
  const password = 'password'
  await new ApiClient({}).addUser({
    name: username,
    password,
  })

  await SignupPage.signUp({
    username,
    password,
    verify: false,
  })

  await SignupPage.verifyNotLoggedIn({
    username,
    password,
    error: `User "${username}" already exists`,
  })
})

test('User session persists across refresh after sign up', async () => {
  const username = `sign-up-persistence-${Date.now()}`
  await SignupPage.signUp({
    username,
  })

  await E2eUtil.reload()

  await HomePage.verifyContent(username)
})
