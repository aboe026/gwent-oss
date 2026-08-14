import { E2eCtx, getFixtureCtx, getTestCtx } from '../util/e2e-ctx'
import E2eUtil from '../util/e2e-util'
import env from '../util/e2e-env'
import HomePage from '../page-objects/home-page'
import NotFoundPage from '../page-objects/not-found-page'
import SignupPage from '../page-objects/signup-page'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Not Found').page(env.BASE_URL)

test('Displays not found page with home link if user navigates to unknown page without loggin in', async () => {
  const unknownPath = 'toast'
  await SignupPage.verifyNotLoggedIn({})
  await NotFoundPage.verify(false)
  await E2eUtil.goTo(unknownPath)
  await NotFoundPage.verify(true)
  await E2eUtil.verifyCurrentUrl(unknownPath)
  await NotFoundPage.clickHomeLInk()
  await SignupPage.verifyNotLoggedIn({})
})

test('Displays not found page with home link if user navigates to unknown page after login', async (t) => {
  const unknownPath = 'toast'
  const username = `not-found-after-login-${t.ctx.start}`
  await SignupPage.signUp({
    username,
  })
  await NotFoundPage.verify(false)
  await E2eUtil.goTo(unknownPath)
  await NotFoundPage.verify(true)
  await E2eUtil.verifyCurrentUrl(unknownPath)
  await NotFoundPage.clickHomeLInk()
  await HomePage.verify(username)
})
