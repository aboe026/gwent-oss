import Banner from '../components/banner'
import env from '../util/env'
import LoginPage from '../page-objects/login-page'
import ProfilePage from '../page-objects/profile-page'
import DeckPage from '../page-objects/deck-page'
import ApiClient from '../util/api-client'
import { FactionKey } from '@gwent/graphql-schema/resolver-typings'
import DecksPage from '../page-objects/decks-page'
import HomePage from '../page-objects/home-page'
import SignupPage from '../page-objects/signup-page'

fixture('Lifecycle').page(env.BASE_URL)

test('Create user and deck and logout', async () => {
  const username = `lifecycle-single-user-${Date.now()}`
  await SignupPage.signUp({
    username,
  })
  await Banner.verifyContent(username)
  await HomePage.verifyContent(username)

  await HomePage.goTo(HomePage.elements.CreateDeck)
  const client = new ApiClient({ username })
  const name = 'lifecycle-single-user-deck'
  const factionKey = FactionKey.Skellige
  const faction = await client.getFaction({
    key: factionKey,
    neutrals: true,
  })
  const leader = await client.getLeader({
    faction: factionKey,
    name: 'Crach an Craite',
  })
  const units = [
    'Clan an Craite Warrior',
    'Clan an Craite Warrior',
    'Clan an Craite Warrior',
    'Clan Brokvar Archer',
    'Clan Brokvar Archer',
    'Clan Brokvar Archer',
    'Clan Drummond Shield Maiden',
    'Clan Drummond Shield Maiden',
    'Clan Drummond Shield Maiden',
    'Light Longship',
    'Light Longship',
    'Mardroeme',
    'Mardroeme',
    'Mardroeme',
    'Skellige Storm',
    'Skellige Storm',
    'Skellige Storm',
    'War Longship',
    'War Longship',
    'War Longship',
    'Young Berserker',
    'Young Berserker',
    'Young Berserker',
  ]
  await DeckPage.createDeck({
    faction,
    leader,
    name,
    units,
  })
  const deck = await client.getDeck(name)
  await DecksPage.verifyContent({
    decks: [
      {
        created: new Date(),
        faction,
        leader,
        name,
        stats: deck.stats,
      },
    ],
  })

  await Banner.goTo(Banner.elements.MenuProfile)
  await ProfilePage.verifyContent({
    username,
  })
  await ProfilePage.logout()
  await LoginPage.verifyNotLoggedIn({})
})

test('Logging in as different user shows different users data', async () => {
  const username1 = `lifecycle-different-user-1-${Date.now()}`
  const username2 = `lifecycle-different-user-2-${Date.now()}`
  await SignupPage.signUp({
    username: username1,
  })
  await Banner.verifyContent(username1)

  await HomePage.goTo(HomePage.elements.CreateDeck)
  const client = new ApiClient({ username: username1 })
  const name = 'lifecycle-different-user-1-deck'
  const factionKey = FactionKey.Monsters
  const faction = await client.getFaction({
    key: factionKey,
    neutrals: true,
  })
  const leader = await client.getLeader({
    faction: factionKey,
    name: 'Eredin Commander of the Red Riders',
  })
  const units = [
    'Arachas',
    'Arachas',
    'Arachas',
    'Decoy',
    'Decoy',
    'Decoy',
    "Gaunter O'Dimm Darkness",
    "Gaunter O'Dimm Darkness",
    "Gaunter O'Dimm Darkness",
    'Ghoul',
    'Ghoul',
    'Ghoul',
    'Imlerith',
    'Impenetrable Fog',
    'Impenetrable Fog',
    'Impenetrable Fog',
    'Nekker',
    'Nekker',
    'Nekker',
    'Scorch',
    'Scorch',
    'Scorch',
  ]
  await DeckPage.createDeck({
    faction,
    leader,
    name,
    units,
  })
  const deck = await client.getDeck(name)
  await DecksPage.verifyContent({
    decks: [
      {
        created: new Date(),
        faction,
        leader,
        name,
        stats: deck.stats,
      },
    ],
  })

  await Banner.goTo(Banner.elements.MenuProfile)
  await ProfilePage.verifyContent({
    username: username1,
  })
  await ProfilePage.logout()
  await LoginPage.verifyNotLoggedIn({})

  await SignupPage.signUp({
    username: username2,
  })
  await Banner.verifyContent(username2)

  await HomePage.goTo(HomePage.elements.ViewDecks)
  await DecksPage.verifyContent({
    decks: [],
  })

  await Banner.goTo(Banner.elements.MenuProfile)
  await ProfilePage.verifyContent({
    username: username2,
  })
  await ProfilePage.logout()
  await LoginPage.verifyNotLoggedIn({})
})
