import E2eUtil from '../util/e2e-util'
import env from '../util/env'
import HomePage from '../page-objects/home-page'
import LoginPage from '../page-objects/login-page'
import NotFoundPage from '../page-objects/not-found-page'

fixture('Not Found').page(env.BASE_URL)

test('Displays not found page with home link if user navigates to unknown page without loggin in', async () => {
  const unknownPath = 'toast'
  await LoginPage.verifyNotLoggedIn({})
  await NotFoundPage.verifyContent(false)
  await E2eUtil.goToPath(unknownPath)
  await NotFoundPage.verifyContent(true)
  await E2eUtil.verifyCurrentUrl(unknownPath)
  await NotFoundPage.clickHomeLInk()
  await LoginPage.verifyNotLoggedIn({})
})

test('Displays not found page with home link if user navigates to unknown page after login', async () => {
  const unknownPath = 'toast'
  await LoginPage.signUp({
    username: `not-found-after-login-${Date.now()}`,
  })
  await NotFoundPage.verifyContent(false)
  await E2eUtil.goToPath(unknownPath)
  await NotFoundPage.verifyContent(true)
  await E2eUtil.verifyCurrentUrl(unknownPath)
  await NotFoundPage.clickHomeLInk()
  await HomePage.verifyContent()
})
