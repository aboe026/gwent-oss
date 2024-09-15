import DeckPage from '../page-objects/deck-page'
import E2eUtil from '../util/e2e-util'
import env from '../util/env'
import HomePage from '../page-objects/home-page'
import ProfilePage from '../page-objects/profile-page'
import SignupPage from '../page-objects/signup-page'

fixture('Home').page(env.BASE_URL)

test('Home page displays correctly', async () => {
  const username = `homepage-disaplys-${Date.now()}`
  await SignupPage.signUp({
    username,
  })
  await HomePage.verify(username)
})

test('Navigate to profile', async () => {
  const username = `homepage-navigate-new-deck-${Date.now()}`
  await SignupPage.signUp({
    username,
  })
  await HomePage.verify(username)
  await HomePage.goTo(HomePage.elements.ViewProfile)
  await E2eUtil.verifyCurrentUrl(ProfilePage.getUrl())
})

test('Navigate to new deck', async () => {
  const username = `homepage-navigate-new-deck-${Date.now()}`
  await SignupPage.signUp({
    username,
  })
  await HomePage.verify(username)
  await HomePage.goTo(HomePage.elements.CreateDeck)
  await E2eUtil.verifyCurrentUrl(DeckPage.getUrl())
})
