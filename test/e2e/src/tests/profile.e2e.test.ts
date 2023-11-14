import env from '../util/env'
import E2eUtil from '../util/e2e-util'
import LoginPage from '../page-objects/login-page'
import LogoutPage from '../page-objects/logout-page'
import ProfilePage from '../page-objects/profile-page'
import { ROUTES } from '@gwent/constants'

fixture('Profile').page(env.BASE_URL)

test('User redirected to profile page after login', async () => {
  const username = `profile-redirect-${Date.now()}`
  await E2eUtil.goToPath(ROUTES.Profile.path)
  await LoginPage.signUp({
    username,
  })
  await ProfilePage.verifyContent({
    username,
  })
})

test('Page refresh keeps user on profile page', async () => {
  const username = `profile-refresh-${Date.now()}`
  await LoginPage.signUp({
    username,
  })
  await E2eUtil.goToPath(ROUTES.Profile.path)
  await ProfilePage.verifyContent({
    username,
  })
  await E2eUtil.reload()
  await ProfilePage.verifyContent({
    username,
  })
})

test('Logout button redirects to logout page', async () => {
  const username = `profile-logout-${Date.now()}`
  await LoginPage.signUp({
    username,
  })
  await E2eUtil.goToPath(ROUTES.Profile.path)
  await ProfilePage.verifyContent({
    username,
  })
  await ProfilePage.logout()
  await LogoutPage.verifyContent()
})
