import E2eUtil from '../util/e2e-util'
import env from '../util/env'
import NotFoundPage from '../page-objects/not-found-page'
import { verifyNotLoggedIn } from './login.e2e.test'

fixture('Not Found').page(env.BASE_URL)

test('Displays not found page with home link if user navigates to unknown page', async () => {
  const unknownPath = 'toast'
  await verifyNotLoggedIn()
  await NotFoundPage.verifyContent(false)
  await E2eUtil.goToPath(unknownPath)
  await NotFoundPage.verifyContent(true)
  await E2eUtil.verifyCurrentUrl(unknownPath)
  await NotFoundPage.clickHomeLInk()
  await verifyNotLoggedIn()
})
