import ApiClient from '../util/api-client'
import Banner from '../components/banner'
import DeckEditor from '../components/deck-editor'
import DeckList from '../components/deck-list'
import DeckPage from '../page-objects/deck-page'
import DecksPage from '../page-objects/decks-page'
import { E2eCtx, getFixtureCtx, getTestCtx } from '../util/e2e-ctx'
import env from '../util/env'
import { FactionKey, GameStatus } from '@gwent/graphql-schema/resolver-typings'
import GamePage, { GamePlayerExpected } from '../page-objects/game-page'
import GamesPage from '../page-objects/games-page'
import HomePage from '../page-objects/home-page'
import LoginPage from '../page-objects/login-page'
import { PlayerTurn } from '../components/game-player-info'
import ProfilePage from '../page-objects/profile-page'
import SignupPage from '../page-objects/signup-page'
import { sortObjectArray } from '@gwent/utils'
import { STARTING_HAND_SIZE } from '@gwent/constants'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Lifecycle').page(env.BASE_URL)

const units1 = [
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
const units2 = [
  'Assire var Anahid',
  'Black Infantry Archer',
  'Black Infantry Archer',
  'Cahir Mawr Dyffryn aep Ceallach',
  'Cirilla Fiona Elen Riannon',
  'Decoy',
  'Etolian Auxiliary Archers',
  'Fringilla Vigo',
  'Geralt of Rivia',
  'Heavy Zerrikanian Fire Scorpion',
  'Impera Brigade Guard',
  'Impera Brigade Guard',
  'Impera Brigade Guard',
  'Impera Brigade Guard',
  'Letho of Gulet',
  'Menno Coehoorn',
  'Morvran Voorhis',
  'Nausicaa Cavalry Rider',
  'Nausicaa Cavalry Rider',
  'Nausicaa Cavalry Rider',
  'Rainfarn',
  'Zerrikanian Fire Scorpion',
]

test('Speed Run', async (t) => {
  const scenario = 'lifecycle-speed-run'
  const username1 = `${scenario}-user-1-${t.ctx.start}`
  const deckName1 = `${scenario}-deck-1-${t.ctx.start}`
  await SignupPage.signUp({
    username: username1,
  })
  await Banner.verify(username1)
  await HomePage.verify(username1)
  const client1 = new ApiClient({ username: username1 })
  const faction1 = await client1.getFaction({
    key: FactionKey.Skellige,
    neutrals: true,
  })
  const leader1 = await client1.getLeader({
    faction: faction1.key,
    name: 'Crach an Craite',
  })

  await Banner.goTo(Banner.elements.MenuProfile)
  await ProfilePage.verify({
    username: username1,
  })
  await ProfilePage.logout()
  await LoginPage.verifyNotLoggedIn({})

  const username2 = `${scenario}-user-2-${t.ctx.start}`
  const deckName2 = `${scenario}-deck-2-${t.ctx.start}`
  await SignupPage.signUp({
    username: username2,
  })
  await Banner.verify(username2)
  await HomePage.verify(username2)
  const client2 = new ApiClient({ username: username2 })
  const faction2 = await client2.getFaction({
    key: FactionKey.NilfgaardianEmpire,
    neutrals: true,
  })
  const leader2 = await client2.getLeader({
    faction: faction2.key,
    name: 'Emhyr var Emreis Invader of the North',
  })

  await HomePage.goTo(HomePage.elements.CreateGame)
  await GamePage.createGame({
    creator: username2,
    opponents: [username1],
  })

  await GamePage.verify({
    self: {
      name: username2,
    },
    opponent: {
      name: username1,
    },
  })
  await GamePage.clickSetDeck()
  await DeckList.verify({
    decks: [],
  })
  await DeckList.clickCreateNone()
  await DeckEditor.verify({})
  await DeckEditor.createDeck({
    faction: faction2,
    leader: leader2,
    name: deckName2,
    units: units2,
    verifyRedirect: false,
  })
  const gameId = await GamePage.getIdFromUrl()
  const gameDeck2 = await client2.getGameDeck(gameId)
  const gamePlayer2: GamePlayerExpected = {
    name: username2,
    discard: 0,
    faction: faction2,
    hand: STARTING_HAND_SIZE,
    leader: leader2,
    losses: 0,
    undrawn: gameDeck2.undrawn.length,
    from: gameDeck2.from,
  }
  await GamePage.verify({
    self: gamePlayer2,
    opponent: {
      name: username1,
    },
    hand: gameDeck2.hand,
  })

  await Banner.goTo(Banner.elements.MenuProfile)
  await ProfilePage.verify({
    username: username2,
  })
  await ProfilePage.logout()
  await LoginPage.verifyNotLoggedIn({})

  await LoginPage.login({
    username: username1,
  })
  await Banner.verify(username1)
  await HomePage.verify(username1)

  await HomePage.goTo(HomePage.elements.ViewGames)
  const game = await client2.getGame(gameId)
  await GamesPage.verify({
    games: [
      {
        created: game.created,
        owner: username2,
        players: [username2, username1],
        status: GameStatus.Decking,
      },
    ],
  })
  await GamesPage.selectGame(0)
  await GamePage.verify({
    self: {
      name: username1,
    },
    opponent: {
      name: username2,
    },
  })
  await GamePage.clickSetDeck()
  await DeckList.clickCreateNone()
  await DeckEditor.createDeck({
    faction: faction1,
    leader: leader1,
    name: deckName1,
    units: units1,
    verifyRedirect: false,
  })
  const gameDeck1 = await client1.getGameDeck(gameId)
  const updatedGame = await client1.getGame(gameId)
  await GamePage.verifyCoinToss({
    won: updatedGame.turn?.user.name === username1,
  })
  const gamePlayer1: GamePlayerExpected = {
    name: username1,
    discard: 0,
    faction: faction1,
    hand: STARTING_HAND_SIZE,
    leader: leader1,
    losses: 0,
    undrawn: gameDeck1.undrawn.length,
    from: gameDeck1.from,
    turn: updatedGame.turn?.user.name === username1 ? PlayerTurn.Future : undefined,
  }
  gamePlayer2.turn = updatedGame.turn?.user.name === username2 ? PlayerTurn.Future : undefined
  await GamePage.verify({
    self: gamePlayer1,
    opponent: gamePlayer2,
    hand: gameDeck1.hand,
    redraws: [],
  })
  await GamePage.ready()
  gamePlayer1.ready = true
  await GamePage.verify({
    self: gamePlayer1,
    opponent: gamePlayer2,
    hand: gameDeck1.hand,
    redraws: [],
  })

  await Banner.goTo(Banner.elements.MenuProfile)
  await ProfilePage.verify({
    username: username1,
  })
  await ProfilePage.logout()
  await LoginPage.verifyNotLoggedIn({})

  await LoginPage.login({
    username: username2,
  })
  await Banner.verify(username2)
  await HomePage.verify(username2)

  await HomePage.goTo(HomePage.elements.ViewGames)
  await GamesPage.verify({
    games: [
      {
        created: game.created,
        owner: username2,
        players: [username2, username1],
        status: GameStatus.Redrawing,
        factions: ['Nilfgaardian Empire', 'Skellige'],
      },
    ],
  })
  await GamesPage.selectGame(0)
  await GamePage.verifyCoinToss({
    won: updatedGame.turn?.user.name === username2,
  })
  await GamePage.verify({
    self: gamePlayer2,
    opponent: gamePlayer1,
    hand: gameDeck2.hand,
    redraws: [],
  })
  await GamePage.ready()
  gamePlayer2.ready = true
  gamePlayer2.turn = updatedGame.turn?.user.name === username2 ? PlayerTurn.Current : undefined
  gamePlayer1.turn = updatedGame.turn?.user.name === username1 ? PlayerTurn.Current : undefined
  await GamePage.verify({
    self: gamePlayer2,
    opponent: gamePlayer1,
    hand: gameDeck2.hand,
    redraws: [],
  })
})

test('Scenic Route', async (t) => {
  const scenario = 'lifecycle-scenic-route'
  const username1 = `${scenario}-user-1-${t.ctx.start}`
  const deckName1 = `${scenario}-deck-1-${t.ctx.start}`
  await SignupPage.signUp({
    username: username1,
  })
  await Banner.verify(username1)
  await HomePage.verify(username1)

  await Banner.goTo(Banner.elements.MenuDecks)
  await DecksPage.verify({
    decks: [],
  })
  await DecksPage.clickCreateNone()
  const client1 = new ApiClient({ username: username1 })
  const factionKey1 = FactionKey.Skellige
  const faction1 = await client1.getFaction({
    key: factionKey1,
    neutrals: true,
  })
  const leader1 = await client1.getLeader({
    faction: factionKey1,
    name: 'Crach an Craite',
  })
  await DeckPage.createDeck({
    faction: faction1,
    leader: leader1,
    name: deckName1,
    units: units1,
    pickers: true,
  })
  const deck1 = await client1.getDeck(deckName1)
  await DecksPage.verify({
    decks: [
      {
        created: deck1.created,
        faction: faction1,
        leader: leader1,
        name: deckName1,
        stats: deck1.stats,
      },
    ],
  })

  await Banner.goTo(Banner.elements.MenuProfile)
  await ProfilePage.verify({
    username: username1,
  })
  await ProfilePage.logout()
  await LoginPage.verifyNotLoggedIn({})

  const username2 = `${scenario}-user-2-${t.ctx.start}`
  const deckName2 = `${scenario}-deck-2-${t.ctx.start}`
  await SignupPage.signUp({
    username: username2,
  })
  await Banner.verify(username2)
  await HomePage.verify(username2)

  await Banner.goTo(Banner.elements.MenuDecks)
  await DecksPage.verify({
    decks: [],
  })
  await DecksPage.clickCreateNone()
  const client2 = new ApiClient({ username: username2 })
  const factionKey2 = FactionKey.NilfgaardianEmpire
  const faction2 = await client2.getFaction({
    key: factionKey2,
    neutrals: true,
  })
  const leader2 = await client2.getLeader({
    faction: factionKey2,
    name: 'Emhyr var Emreis Invader of the North',
  })
  await DeckPage.createDeck({
    faction: faction2,
    leader: leader2,
    name: deckName2,
    units: units2,
    pickers: true,
  })
  const deck2 = await client2.getDeck(deckName2)
  await DecksPage.verify({
    decks: [
      {
        created: new Date(deck1.created),
        faction: faction2,
        leader: leader2,
        name: deckName2,
        stats: deck2.stats,
      },
    ],
  })

  await Banner.goTo(Banner.elements.MenuGames)
  await GamesPage.verify({
    games: [],
  })
  await GamesPage.clickCreateNone()
  await GamePage.verifyNew({
    creator: username2,
    opponents: [],
  })
  await GamePage.createGame({
    creator: username2,
    opponents: [username1],
  })
  await GamePage.verify({
    self: {
      name: username2,
    },
    opponent: {
      name: username1,
    },
  })
  await GamePage.setDeck({
    created: new Date(deck2.created),
    faction: faction2,
    leader: leader2,
    name: deck2.name,
    stats: deck2.stats,
  })
  const gameId = await GamePage.getIdFromUrl()
  const gameDeck2 = await client2.getGameDeck(gameId)
  await GamePage.verify({
    self: {
      name: username2,
      faction: faction2,
      leader: leader2,
      discard: 0,
      hand: STARTING_HAND_SIZE,
      undrawn: deck2.units.length - STARTING_HAND_SIZE,
      from: gameDeck2.from,
    },
    opponent: {
      name: username1,
    },
    hand: sortObjectArray({
      sortProperties: ['unit.strength', 'unit.id'],
      array: gameDeck2.hand,
    }).map((deckUnit) => deckUnit.unit.name),
  })
  const redraw1 = gameDeck2.hand[0].unit.name
  await GamePage.redraw(redraw1)
  const redraw1GameDeck2 = await client2.getGameDeck(gameId)
  await GamePage.verify({
    self: {
      name: username2,
      faction: faction2,
      leader: leader2,
      discard: 0,
      hand: STARTING_HAND_SIZE,
      undrawn: deck2.units.length - STARTING_HAND_SIZE,
      from: gameDeck2.from,
    },
    opponent: {
      name: username1,
    },
    hand: sortObjectArray({
      sortProperties: ['unit.strength', 'unit.id'],
      array: redraw1GameDeck2.hand,
    }).map((deckUnit) => deckUnit.unit.name),
    redraws: [
      {
        from: redraw1,
        to: redraw1GameDeck2.redraws[0].to.unit.name,
      },
    ],
  })
  const redraw2 = gameDeck2.hand[gameDeck2.hand.length - 1].unit.name
  await GamePage.redraw(redraw2)
  const redraw2GameDeck2 = await client2.getGameDeck(gameId)
  await GamePage.verify({
    self: {
      name: username2,
      faction: faction2,
      leader: leader2,
      discard: 0,
      hand: STARTING_HAND_SIZE,
      undrawn: deck2.units.length - STARTING_HAND_SIZE,
      from: gameDeck2.from,
    },
    opponent: {
      name: username1,
    },
    hand: sortObjectArray({
      sortProperties: ['unit.strength', 'unit.id'],
      array: redraw2GameDeck2.hand,
    }).map((deckUnit) => deckUnit.unit.name),
    redraws: [
      {
        from: redraw1,
        to: redraw1GameDeck2.redraws[0].to.unit.name,
      },
      {
        from: redraw2,
        to: redraw2GameDeck2.redraws[1].to.unit.name,
      },
    ],
  })
  await GamePage.ready()
  await GamePage.verify({
    self: {
      name: username2,
      faction: faction2,
      leader: leader2,
      discard: 0,
      hand: STARTING_HAND_SIZE,
      undrawn: deck2.units.length - STARTING_HAND_SIZE,
      ready: true,
      from: gameDeck2.from,
    },
    opponent: {
      name: username1,
    },
    hand: sortObjectArray({
      sortProperties: ['unit.strength', 'unit.id'],
      array: redraw2GameDeck2.hand,
    }).map((deckUnit) => deckUnit.unit.name),
  })

  await Banner.goTo(Banner.elements.MenuProfile)
  await ProfilePage.verify({
    username: username2,
  })
  await ProfilePage.logout()
  await LoginPage.verifyNotLoggedIn({})

  await LoginPage.login({
    username: username1,
  })
  await Banner.verify(username1)
  await HomePage.verify(username1)

  await Banner.goTo(Banner.elements.MenuGames)
  const game = await client1.getGame(gameId)
  await GamesPage.verify({
    games: [
      {
        created: game.created,
        owner: username2,
        players: [username2, username1],
        status: GameStatus.Decking,
      },
    ],
  })
  await GamesPage.selectGame(0)
  await GamePage.verify({
    self: {
      name: username1,
    },
    opponent: {
      name: username2,
    },
  })
  await GamePage.setDeck({
    created: new Date(deck1.created),
    faction: faction1,
    leader: leader1,
    name: deck1.name,
    stats: deck1.stats,
  })
  const gameDeck1 = await client1.getGameDeck(gameId)
  await GamePage.verify({
    self: {
      name: username1,
      faction: faction1,
      leader: leader1,
      discard: 0,
      hand: STARTING_HAND_SIZE,
      undrawn: deck1.units.length - STARTING_HAND_SIZE,
      from: gameDeck1.from,
    },
    opponent: {
      name: username2,
    },
    hand: sortObjectArray({
      sortProperties: ['unit.strength', 'unit.id'],
      array: gameDeck1.hand,
    }).map((deckUnit) => deckUnit.unit.name),
  })
  const redraw3 = gameDeck1.hand[0].unit.name
  await GamePage.redraw(redraw3)
  const redraw1GameDeck1 = await client1.getGameDeck(gameId)
  await GamePage.verify({
    self: {
      name: username1,
      faction: faction1,
      leader: leader1,
      discard: 0,
      hand: STARTING_HAND_SIZE,
      undrawn: deck1.units.length - STARTING_HAND_SIZE,
      from: gameDeck1.from,
    },
    opponent: {
      name: username2,
    },
    hand: sortObjectArray({
      sortProperties: ['unit.strength', 'unit.id'],
      array: redraw1GameDeck1.hand,
    }).map((deckUnit) => deckUnit.unit.name),
    redraws: [
      {
        from: redraw3,
        to: redraw1GameDeck1.redraws[0].to.unit.name,
      },
    ],
  })
  const redraw4 = gameDeck1.hand[gameDeck1.hand.length - 1].unit.name
  await GamePage.redraw(redraw4)
  const redraw2GameDeck1 = await client1.getGameDeck(gameId)
  await GamePage.verify({
    self: {
      name: username1,
      faction: faction1,
      leader: leader1,
      discard: 0,
      hand: STARTING_HAND_SIZE,
      undrawn: deck1.units.length - STARTING_HAND_SIZE,
      from: gameDeck1.from,
    },
    opponent: {
      name: username2,
    },
    hand: sortObjectArray({
      sortProperties: ['unit.strength', 'unit.id'],
      array: redraw2GameDeck1.hand,
    }).map((deckUnit) => deckUnit.unit.name),
    redraws: [
      {
        from: redraw3,
        to: redraw1GameDeck1.redraws[0].to.unit.name,
      },
      {
        from: redraw4,
        to: redraw2GameDeck1.redraws[1].to.unit.name,
      },
    ],
  })
  await GamePage.ready()
  await GamePage.verify({
    self: {
      name: username1,
      faction: faction1,
      leader: leader1,
      discard: 0,
      hand: STARTING_HAND_SIZE,
      undrawn: deck1.units.length - STARTING_HAND_SIZE,
      ready: true,
      from: gameDeck1.from,
    },
    opponent: {
      name: username2,
      faction: faction2,
      leader: leader2,
      discard: 0,
      hand: STARTING_HAND_SIZE,
      undrawn: deck2.units.length - STARTING_HAND_SIZE,
      ready: true,
    },
    hand: sortObjectArray({
      sortProperties: ['unit.strength', 'unit.id'],
      array: redraw2GameDeck1.hand,
    }).map((deckUnit) => deckUnit.unit.name),
  })
})
