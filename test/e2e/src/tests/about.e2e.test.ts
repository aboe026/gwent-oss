import AboutPage from '../page-objects/about-page'
import ApiClient from '../util/api-client'
import Banner from '../components/banner'
import { E2eCtx, getFixtureCtx, getTestCtx } from '../util/e2e-ctx'
import E2eUtil from '../util/e2e-util'
import LoginPage from '../page-objects/login-page'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('About')

test('Shows about page without logging in', async () => {
  await E2eUtil.goTo(AboutPage.getUrl())
  await AboutPage.verify()
})

test('Shows about page when logged in', async (t) => {
  const username = `about-page-logged-in-${t.ctx.start}`
  await new ApiClient({}).addUser({
    name: username,
  })
  await E2eUtil.goTo(LoginPage.getUrl())
  await LoginPage.login({
    username,
  })
  await Banner.goTo(Banner.elements.MenuAbout)
  await AboutPage.verify()
})
