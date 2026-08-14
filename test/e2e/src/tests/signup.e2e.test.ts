import ApiClient from '../util/api-client'
import { E2eCtx, getFixtureCtx, getTestCtx } from '../util/e2e-ctx'
import E2eUtil from '../util/e2e-util'
import env from '../util/e2e-env'
import HomePage from '../page-objects/home-page'
import LoginForm from '../components/login-form'
import LoginPage from '../page-objects/login-page'
import { PASSWORD } from '../util/e2e-constants'
import SignupPage from '../page-objects/signup-page'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Signup').page(env.BASE_URL)

test('Alerts user and prevents login if username too short', async () => {
  await SignupPage.signUp({
    username: 'hi',
    verify: false,
  })
  await LoginForm.verifyUsernameAvailable()
  await LoginForm.verifyUsernameErrors({
    tooShort: true,
  })
  await LoginForm.verifySubmit({
    enabled: false,
    title: 'Invalid username',
  })
})

test('Alerts user and prevents login if username too long', async () => {
  await SignupPage.signUp({
    username: '012345678901234567890123456789012345678901234567890',
    verify: false,
  })
  await LoginForm.verifyUsernameAvailable()
  await LoginForm.verifyUsernameErrors({
    tooLong: true,
  })
  await LoginForm.verifySubmit({
    enabled: false,
    title: 'Invalid username',
  })
})

test('Alerts user and prevents login if username contains space', async () => {
  await SignupPage.signUp({
    username: 'sp ace',
    verify: false,
  })
  await LoginForm.verifyUsernameAvailable()
  await LoginForm.verifyUsernameErrors({
    spaces: true,
  })
  await LoginForm.verifySubmit({
    enabled: false,
    title: 'Invalid username',
  })
})

test('Alerts user and prevents login if username contains invalid special character', async () => {
  await SignupPage.signUp({
    username: 'period.',
    verify: false,
  })
  await LoginForm.verifyUsernameAvailable()
  await LoginForm.verifyUsernameErrors({
    badSpecials: new Set(['.']),
  })
  await LoginForm.verifySubmit({
    enabled: false,
    title: 'Invalid username',
  })
})

test('Alerts user and prevents login if username already taken', async (t) => {
  const username = `username-taken-${t.ctx.start}`
  await new ApiClient({}).addUser({
    name: username,
  })
  await SignupPage.signUp({
    username,
    verify: false,
  })
  await LoginForm.verifyUsernameAvailable(false)
  await LoginForm.verifyUsernameErrors({})
  await LoginForm.verifySubmit({
    enabled: false,
    title: 'Invalid username',
  })
})

test('Alerts user and prevents login if password too short', async (t) => {
  await SignupPage.signUp({
    username: `signup-bad-password-${t.ctx.start}`,
    password: 'p@ssW0r',
    verify: false,
  })
  await LoginForm.verifyUsernameAvailable(true)
  await LoginForm.verifyUsernameErrors({})
  await LoginForm.verifyPasswordErrors({
    tooShort: true,
  })
  await LoginForm.verifySubmit({
    enabled: false,
    title: 'Invalid password',
  })
})

test('Alerts user and prevents login if password too long', async (t) => {
  await SignupPage.signUp({
    username: `signup-bad-password-${t.ctx.start}`,
    password: 'p@ssW0rd1201234567890123456789012345678901234567890',
    verify: false,
  })
  await LoginForm.verifyUsernameAvailable(true)
  await LoginForm.verifyUsernameErrors({})
  await LoginForm.verifyPasswordErrors({
    tooLong: true,
  })
  await LoginForm.verifySubmit({
    enabled: false,
    title: 'Invalid password',
  })
})

test('Alerts user and prevents login if password has space', async (t) => {
  await SignupPage.signUp({
    username: `signup-bad-password-${t.ctx.start}`,
    password: 'p@ss W0rd',
    verify: false,
  })
  await LoginForm.verifyUsernameAvailable(true)
  await LoginForm.verifyUsernameErrors({})
  await LoginForm.verifyPasswordErrors({
    spaces: true,
  })
  await LoginForm.verifySubmit({
    enabled: false,
    title: 'Invalid password',
  })
})

test('Alerts user and prevents login if password has no special', async (t) => {
  await SignupPage.signUp({
    username: `signup-bad-password-${t.ctx.start}`,
    password: 'passW0rd',
    verify: false,
  })
  await LoginForm.verifyUsernameAvailable(true)
  await LoginForm.verifyUsernameErrors({})
  await LoginForm.verifyPasswordErrors({
    specials: true,
  })
  await LoginForm.verifySubmit({
    enabled: false,
    title: 'Invalid password',
  })
})

test('Alerts user and prevents login if password has no number', async (t) => {
  await SignupPage.signUp({
    username: `signup-bad-password-${t.ctx.start}`,
    password: 'p@ssWord',
    verify: false,
  })
  await LoginForm.verifyUsernameAvailable(true)
  await LoginForm.verifyUsernameErrors({})
  await LoginForm.verifyPasswordErrors({
    numbers: true,
  })
  await LoginForm.verifySubmit({
    enabled: false,
    title: 'Invalid password',
  })
})

test('Alerts user and prevents login if password has no lowercase', async (t) => {
  await SignupPage.signUp({
    username: `signup-bad-password-${t.ctx.start}`,
    password: 'P@SSW0RD',
    verify: false,
  })
  await LoginForm.verifyUsernameAvailable(true)
  await LoginForm.verifyUsernameErrors({})
  await LoginForm.verifyPasswordErrors({
    lowercase: true,
  })
  await LoginForm.verifySubmit({
    enabled: false,
    title: 'Invalid password',
  })
})

test('Alerts user and prevents login if password has no uppercase', async (t) => {
  await SignupPage.signUp({
    username: `signup-bad-password-${t.ctx.start}`,
    password: 'p@ssw0rd',
    verify: false,
  })
  await LoginForm.verifyUsernameAvailable(true)
  await LoginForm.verifyUsernameErrors({})
  await LoginForm.verifyPasswordErrors({
    uppercase: true,
  })
  await LoginForm.verifySubmit({
    enabled: false,
    title: 'Invalid password',
  })
})

test('Alerts user and prevents login if password has bad special', async (t) => {
  await SignupPage.signUp({
    username: `signup-bad-password-${t.ctx.start}`,
    password: 'p@ssW0rd$',
    verify: false,
  })
  await LoginForm.verifyUsernameAvailable(true)
  await LoginForm.verifyUsernameErrors({})
  await LoginForm.verifyPasswordErrors({
    badSpecials: new Set(['$']),
  })
  await LoginForm.verifySubmit({
    enabled: false,
    title: 'Invalid password',
  })
})

test('Shows error if signing up for user that already exists', async (t) => {
  const username = `duplicate-user-${t.ctx.start}`

  await SignupPage.signUp({
    username,
    submit: false,
    verify: false,
  })
  await LoginForm.verifyUsernameAvailable(true)
  await new ApiClient({}).addUser({
    name: username,
  })
  await t.click(LoginForm.elements.Submit)

  await SignupPage.verifyNotLoggedIn({
    username,
    password: PASSWORD,
    error: `User with name "${username}" already exists.`,
  })
})

test('Lands on signup page if new user', async (t) => {
  await t.expect(E2eUtil.getCurrentUrl()).eql(SignupPage.getUrl())
})

test('Logs in user after they sign up', async (t) => {
  const username = `new-user-${t.ctx.start}`
  await SignupPage.signUp({
    username,
  })
  await HomePage.verify(username)
})

test('User session persists across refresh after sign up', async (t) => {
  const username = `sign-up-persistence-${t.ctx.start}`
  await SignupPage.signUp({
    username,
  })

  await E2eUtil.reload()

  await HomePage.verify(username)
})

test('Can sign up after switching mode from login', async (t) => {
  const username = `new-user-${t.ctx.start}`
  await E2eUtil.goTo(LoginPage.getUrl())
  await LoginForm.fillIn({
    username,
    submit: false,
    verify: false,
  })
  await LoginPage.switchToSignup()
  await LoginForm.verifySubmit({
    enabled: true,
  })
  await t.click(LoginForm.elements.Submit)
  await HomePage.verify(username)
})
