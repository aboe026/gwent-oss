import DeckPage from '../page-objects/deck-page'
import { E2eCtx, getFixtureCtx, getTestCtx } from '../util/e2e-ctx'
import E2eUtil from '../util/e2e-util'
import env from '../util/env'
import HomePage from '../page-objects/home-page'
import ProfilePage from '../page-objects/profile-page'
import SignupPage from '../page-objects/signup-page'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Home').page(env.BASE_URL)

test('Home page displays correctly', async (t) => {
  const username = `homepage-disaplys-${t.ctx.start}`
  await SignupPage.signUp({
    username,
  })
  await HomePage.verify(username)
})

test('Navigate to profile', async (t) => {
  const username = `homepage-navigate-new-deck-${t.ctx.start}`
  await SignupPage.signUp({
    username,
  })
  await HomePage.verify(username)
  await HomePage.goTo(HomePage.elements.ViewProfile)
  await E2eUtil.verifyCurrentUrl(ProfilePage.getUrl())
})

test('Navigate to new deck', async (t) => {
  const username = `homepage-navigate-new-deck-${t.ctx.start}`
  await SignupPage.signUp({
    username,
  })
  await HomePage.verify(username)
  await HomePage.goTo(HomePage.elements.CreateDeck)
  await E2eUtil.verifyCurrentUrl(DeckPage.getUrl())
})
