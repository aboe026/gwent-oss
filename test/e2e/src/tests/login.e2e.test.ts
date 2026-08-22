import AboutPage from '../page-objects/about-page'
import ApiClient from '../util/api-client'
import { E2eCtx, getFixtureCtx, getTestCtx } from '../util/e2e-ctx'
import E2eUtil from '../util/e2e-util'
import HomePage from '../page-objects/home-page'
import LoginForm from '../components/login-form'
import LoginPage from '../page-objects/login-page'
import { PASSWORD } from '../util/e2e-constants'
import SignupPage from '../page-objects/signup-page'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Login').page(LoginPage.getUrl())

test('Shows error for nonexistent user', async (t) => {
  const username = `nonexistent-user-${t.ctx.start}`
  await LoginPage.verifyNotLoggedIn({})

  await LoginPage.login({
    username,
    verify: false,
  })

  await LoginPage.verifyNotLoggedIn({
    username,
    password: PASSWORD,
    error: `Invalid credentials for user "${username}".`,
  })
})

test('Shows error for wrong password', async (t) => {
  const username = `invalid-credentials-${t.ctx.start}`
  const password = 'invalid'
  await new ApiClient({}).addUser({
    name: username,
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

test('Logs in existing user', async (t) => {
  const username = `existing-user-${t.ctx.start}`
  await new ApiClient({}).addUser({
    name: username,
  })

  await LoginPage.login({
    username,
  })

  await HomePage.verify(username)
})

test('User session persists across refresh after login', async (t) => {
  const username = `login-persistence-${t.ctx.start}`
  await new ApiClient({}).addUser({
    name: username,
  })
  await LoginPage.login({
    username,
  })

  await E2eUtil.reload()

  await LoginPage.verifyLoggedIn()
  await HomePage.verify(username)
})

test('Logs in after navigating to startup page', async (t) => {
  const username = `existing-user-${t.ctx.start}`
  await new ApiClient({}).addUser({
    name: username,
  })

  await E2eUtil.goTo(SignupPage.getUrl())
  await LoginForm.fillIn({
    username,
    submit: false,
    verify: false,
  })
  await SignupPage.switchToLogin()
  await t.click(LoginForm.elements.Submit)

  await HomePage.verify(username)
})

test('redirects to about page when info icon clicked', async (t) => {
  const username = `existing-user-${t.ctx.start}`
  await new ApiClient({}).addUser({
    name: username,
  })

  await E2eUtil.goTo(SignupPage.getUrl())
  await t.click(SignupPage.elements.info)
  await t.expect(E2eUtil.getCurrentUrl()).eql(AboutPage.getUrl())
})
