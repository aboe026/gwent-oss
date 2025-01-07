import ApiClient from '../util/api-client'
import Banner from '../components/banner'
import { Combat, FactionKey, GameStatus } from '@gwent/graphql-schema/resolver-typings'
import DeckEditor from '../components/deck-editor'
import DeckList from '../components/deck-list'
import DeckPage from '../page-objects/deck-page'
import DecksPage from '../page-objects/decks-page'
import { E2eCtx, getFixtureCtx, getTestCtx } from '../util/e2e-ctx'
import { E2eHelper } from '../util/e2e-helper'
import env from '../util/env'
import GamePage, { GamePlayerExpected, HistoryMove, HistoryPass } from '../page-objects/game-page'
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

const nilfgaardUnits = [
  'Albrich',
  'Assire var Anahid',
  'Black Infantry Archer',
  'Cahir Mawr Dyffryn aep Ceallach',
  'Cynthia',
  'Emiel Regis Rohellec Terzieff',
  'Fringilla Vigo',
  'Heavy Zerrikanian Fire Scorpion',
  'Letho of Gulet',
  'Morteisen',
  'Morvran Voorhis',
  'Puttkammer',
  'Renuald aep Matsen',
  'Roach',
  'Siege Engineer',
  'Sweers',
  'Tibor Eggebracht',
  'Triss Merigold',
  'Vanhemar',
  'Vesemir',
  'Vreemde',
  'Zerrikanian Fire Scorpion',
]
const scoiataelUnits = [
  'Barclay Els',
  'Ciaran aep Easnillien',
  'Dennis Cranmer',
  'Dol Blathanna Archer',
  'Dol Blathanna Scout',
  'Eithne',
  'Emiel Regis Rohellec Terzieff',
  'Filavandrel aen Fidhail',
  'Ida Emean aep Sivney',
  'Iorveth',
  'Mahakaman Defender',
  'Mahakaman Defender',
  'Riordain',
  'Roach',
  'Saesenthessis',
  'Toruviel',
  'Triss Merigold',
  'Vesemir',
  'Vrihedd Brigade Recruit',
  'Vrihedd Brigade Veteran',
  'Yaevinn',
  'Zoltan Chivay',
]

test('Speed Run', async (t) => {
  const scenario = 'lifecycle-speed-run'
  // user1 sign up
  const username1 = `${scenario}-user-1-${t.ctx.start}`
  const deckName1 = `${scenario}-deck-1-${t.ctx.start}`
  await SignupPage.signUp({
    username: username1,
  })
  await Banner.verify(username1)
  await HomePage.verify(username1)
  const client1 = new ApiClient({ username: username1 })
  const faction1 = await client1.getFaction({
    key: FactionKey.ScoiaTael,
  })
  const leader1 = await client1.getLeader({
    faction: faction1.key,
    name: 'Francesca Findabair Hope of the Aen Seidhe',
  })

  await Banner.goTo(Banner.elements.MenuProfile)
  await ProfilePage.verify({
    username: username1,
  })
  await ProfilePage.logout()
  await LoginPage.verifyNotLoggedIn({})

  // user2 sign up, create game and set deck
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
    units: nilfgaardUnits,
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

  // user1 set deck, order and ready
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
    units: scoiataelUnits,
    verifyRedirect: false,
  })
  const gameDeck1 = await client1.getGameDeck(gameId)
  const gamePlayer1: GamePlayerExpected = {
    name: username1,
    discard: 0,
    faction: faction1,
    hand: STARTING_HAND_SIZE,
    leader: leader1,
    losses: 0,
    undrawn: gameDeck1.undrawn.length,
    from: gameDeck1.from,
  }
  await GamePage.verify({
    self: gamePlayer1,
    opponent: gamePlayer2,
    hand: gameDeck1.hand,
    turnOrder: [username2, username1],
  })
  await GamePage.setOrder()
  await GamePage.verifyCoinToss({
    won: false,
  })

  gamePlayer1.turn = undefined
  gamePlayer2.turn = PlayerTurn.Future
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

  // user2 ready and play unit
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
        factions: [FactionKey.NilfgaardianEmpire, FactionKey.ScoiaTael],
      },
    ],
  })
  await GamesPage.selectGame(0)
  await GamePage.verifyCoinToss({
    won: true,
  })
  await GamePage.verify({
    self: gamePlayer2,
    opponent: gamePlayer1,
    hand: gameDeck2.hand,
    redraws: [],
  })
  await GamePage.ready()
  gamePlayer2.ready = true
  gamePlayer2.passed = false
  gamePlayer2.turn = PlayerTurn.Current
  const moves1: (HistoryMove | HistoryPass)[] = []
  const moves2: (HistoryMove | HistoryPass)[] = []
  await GamePage.verify({
    self: gamePlayer2,
    opponent: gamePlayer1,
    hand: gameDeck2.hand,
    moves: [moves1],
  })
  const sortedHand2 = sortObjectArray({
    array: gameDeck2.hand,
    sortProperties: ['unit.strength', 'unit.id'],
    reverse: true,
  })
  const unit2 = sortedHand2[0]
  const combat2 = unit2.unit.combats ? unit2.unit.combats[0] : Combat.Close
  await GamePage.moveUnit({
    unitName: unit2.unit.name,
    row: combat2,
  })
  gamePlayer1.turn = PlayerTurn.Current
  gamePlayer2.turn = undefined
  E2eHelper.playUnit({
    player: gamePlayer2,
    deckUnit: unit2,
    gameDeck: gameDeck2,
    moves: moves1,
  })
  await GamePage.verify({
    self: gamePlayer2,
    opponent: gamePlayer1,
    hand: gameDeck2.hand,
    moves: [moves1],
  })

  await Banner.goTo(Banner.elements.MenuProfile)
  await ProfilePage.verify({
    username: username2,
  })
  await ProfilePage.logout()
  await LoginPage.verifyNotLoggedIn({})

  // user1 pass
  await LoginPage.login({
    username: username1,
  })
  await Banner.verify(username1)
  await HomePage.verify(username1)

  await HomePage.goTo(HomePage.elements.ViewGames)
  await GamesPage.verify({
    games: [
      {
        created: game.created,
        owner: username2,
        players: [username2, username1],
        status: GameStatus.Playing,
        factions: [FactionKey.NilfgaardianEmpire, FactionKey.ScoiaTael],
      },
    ],
  })
  await GamesPage.selectGame(0)

  gamePlayer1.passed = false
  gamePlayer2.passed = undefined
  await GamePage.verify({
    self: gamePlayer1,
    opponent: gamePlayer2,
    hand: gameDeck1.hand,
    moves: [moves1],
  })
  await GamePage.pass({})
  moves1.push({
    userName: username1,
    round: 1,
  })
  gamePlayer1.passed = true
  gamePlayer1.turn = undefined
  gamePlayer2.turn = PlayerTurn.Current
  await GamePage.verify({
    self: gamePlayer1,
    opponent: gamePlayer2,
    hand: gameDeck1.hand,
    moves: [moves1],
  })

  await Banner.goTo(Banner.elements.MenuProfile)
  await ProfilePage.verify({
    username: username1,
  })
  await ProfilePage.logout()
  await LoginPage.verifyNotLoggedIn({})

  // user2 pass twice
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
        status: GameStatus.Playing,
        factions: [FactionKey.NilfgaardianEmpire, FactionKey.ScoiaTael],
      },
    ],
  })
  await GamesPage.selectGame(0)
  gamePlayer2.passed = false
  await GamePage.verify({
    self: gamePlayer2,
    opponent: gamePlayer1,
    hand: gameDeck2.hand,
    moves: [moves1],
  })

  await GamePage.pass({})
  gamePlayer1.losses = 1
  gamePlayer1.passed = undefined
  gamePlayer2.score = 0
  gamePlayer2.discard = 1
  E2eHelper.resetPlayerCombatRow({
    player: gamePlayer2,
    row: combat2,
  })
  moves1.push({
    userName: username2,
    round: 1,
  })
  await GamePage.verify({
    self: gamePlayer2,
    opponent: gamePlayer1,
    hand: gameDeck2.hand,
    round: 2,
    moves: [moves1, moves2],
  })

  await GamePage.pass({})
  gamePlayer1.turn = PlayerTurn.Current
  gamePlayer2.passed = true
  gamePlayer2.turn = undefined
  moves2.push({
    userName: username2,
    round: 2,
  })
  await GamePage.verify({
    self: gamePlayer2,
    opponent: gamePlayer1,
    hand: gameDeck2.hand,
    round: 2,
    moves: [moves1, moves2],
  })

  await Banner.goTo(Banner.elements.MenuProfile)
  await ProfilePage.verify({
    username: username2,
  })
  await ProfilePage.logout()
  await LoginPage.verifyNotLoggedIn({})

  // user1 pass in defeat
  await LoginPage.login({
    username: username1,
  })
  await Banner.verify(username1)
  await HomePage.verify(username1)

  await HomePage.goTo(HomePage.elements.ViewGames)
  await GamesPage.verify({
    games: [
      {
        created: game.created,
        owner: username2,
        players: [username2, username1],
        status: GameStatus.Playing,
        factions: [FactionKey.NilfgaardianEmpire, FactionKey.ScoiaTael],
      },
    ],
  })
  await GamesPage.selectGame(0)

  gamePlayer1.passed = false
  await GamePage.verify({
    self: gamePlayer1,
    opponent: gamePlayer2,
    hand: gameDeck1.hand,
    round: 2,
    moves: [moves1, moves2],
  })

  await GamePage.pass({})
  gamePlayer1.turn = undefined
  gamePlayer1.passed = true
  gamePlayer1.losses = 2
  gamePlayer2.losses = 1
  moves2.push({
    userName: username1,
    round: 2,
  })
  await GamePage.verify({
    self: gamePlayer1,
    opponent: gamePlayer2,
    hand: gameDeck1.hand,
    round: 2,
    moves: [moves1, moves2],
    victors: [username2],
    rounds: [
      {
        creator: unit2.unit.strength || 0,
        opponent: 0,
      },
      {
        creator: 0,
        opponent: 0,
      },
    ],
  })

  await GamePage.summaryGoToGames()
  await GamesPage.verify({
    games: [
      {
        created: game.created,
        owner: username2,
        players: [username2, username1],
        status: GameStatus.Done,
        factions: [FactionKey.NilfgaardianEmpire, FactionKey.ScoiaTael],
        victors: [username2],
      },
    ],
  })
})

test('Scenic Route', async (t) => {
  const scenario = 'lifecycle-scenic-route'

  // user1 signup and create deck
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
  const factionKey1 = FactionKey.NilfgaardianEmpire
  const faction1 = await client1.getFaction({
    key: factionKey1,
  })
  const leader1 = await client1.getLeader({
    faction: factionKey1,
    name: 'Emhyr var Emreis Invader of the North',
  })
  await DeckPage.createDeck({
    faction: faction1,
    leader: leader1,
    name: deckName1,
    units: nilfgaardUnits,
    pickers: true,
  })
  const deck1 = await client1.getDeck(deckName1)
  const neutralFaction = await client1.getFaction({ key: FactionKey.Neutral })
  await DecksPage.verify({
    decks: [
      {
        created: deck1.created,
        faction: faction1,
        leader: leader1,
        name: deckName1,
        stats: deck1.stats,
        neutralFaction,
      },
    ],
  })

  await Banner.goTo(Banner.elements.MenuProfile)
  await ProfilePage.verify({
    username: username1,
  })
  await ProfilePage.logout()
  await LoginPage.verifyNotLoggedIn({})

  // user2 signup, create deck, game and set deck
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
  const factionKey2 = FactionKey.ScoiaTael
  const faction2 = await client2.getFaction({
    key: factionKey2,
  })
  const leader2 = await client2.getLeader({
    faction: factionKey2,
    name: 'Francesca Findabair Hope of the Aen Seidhe',
  })
  await DeckPage.createDeck({
    faction: faction2,
    leader: leader2,
    name: deckName2,
    units: scoiataelUnits,
    pickers: true,
  })
  const deck2 = await client2.getDeck(deckName2)
  await DecksPage.verify({
    decks: [
      {
        created: deck1.created,
        faction: faction2,
        leader: leader2,
        name: deckName2,
        stats: deck2.stats,
        neutralFaction,
      },
    ],
  })

  await Banner.goTo(Banner.elements.MenuGames)
  await GamesPage.verify({
    games: [],
  })
  await GamesPage.clickCreateNone()
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
    neutralFaction,
  })
  const gameId = await GamePage.getIdFromUrl()
  const gameDeck2 = await client2.getGameDeck(gameId)
  const gamePlayer2: GamePlayerExpected = {
    name: username2,
    faction: faction2,
    leader: leader2,
    discard: 0,
    hand: STARTING_HAND_SIZE,
    undrawn: deck2.units.length - STARTING_HAND_SIZE,
    from: gameDeck2.from,
  }
  await GamePage.verify({
    self: gamePlayer2,
    opponent: {
      name: username1,
    },
    hand: gameDeck2.hand,
  })

  // user1 set deck
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

  const game = await client1.getGame(gameId)
  await Banner.goTo(Banner.elements.MenuGames)
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
    verifyCloses: false,
    neutralFaction,
  })
  const gameDeck1 = await client1.getGameDeck(gameId)
  const gamePlayer1: GamePlayerExpected = {
    name: username1,
    faction: faction1,
    leader: leader1,
    discard: 0,
    hand: STARTING_HAND_SIZE,
    undrawn: deck1.units.length - STARTING_HAND_SIZE,
    from: gameDeck1.from,
  }
  await GamePage.verify({
    self: gamePlayer1,
    opponent: gamePlayer2,
    hand: gameDeck1.hand,
    turnOrder: [],
  })

  // user2 set order and redraw 2
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
  await Banner.goTo(Banner.elements.MenuGames)
  await GamesPage.verify({
    games: [
      {
        created: game.created,
        owner: username2,
        players: [username2, username1],
        status: GameStatus.Ordering,
        factions: [FactionKey.ScoiaTael, FactionKey.NilfgaardianEmpire],
      },
    ],
  })
  await GamesPage.selectGame(0)
  await GamePage.verify({
    self: gamePlayer2,
    opponent: gamePlayer1,
    hand: gameDeck2.hand,
    turnOrder: [username2, username1],
  })
  await GamePage.moveTurnOrderLater(username2)
  await GamePage.verify({
    self: gamePlayer2,
    opponent: gamePlayer1,
    hand: gameDeck2.hand,
    turnOrder: [username1, username2],
  })
  await GamePage.setOrder()
  await GamePage.verifyCoinToss({
    won: false,
    wait: true,
  })
  gamePlayer1.turn = PlayerTurn.Future
  gamePlayer2.turn = undefined
  await GamePage.verify({
    self: gamePlayer2,
    opponent: gamePlayer1,
    hand: gameDeck2.hand,
    redraws: [],
  })
  const redraw1 = gameDeck2.hand[0].unit.name
  await GamePage.redraw(redraw1)
  const redraw1GameDeck2 = await client2.getGameDeck(gameId)
  await GamePage.verify({
    self: gamePlayer2,
    opponent: gamePlayer1,
    hand: redraw1GameDeck2.hand,
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
    self: gamePlayer2,
    opponent: gamePlayer1,
    hand: redraw2GameDeck2.hand,
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
  gamePlayer2.ready = true
  await GamePage.verify({
    self: gamePlayer2,
    opponent: gamePlayer1,
    hand: redraw2GameDeck2.hand,
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

  // user1 redraw 2 and play unit for round 1
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
  await GamesPage.verify({
    games: [
      {
        created: game.created,
        owner: username2,
        players: [username2, username1],
        status: GameStatus.Redrawing,
        factions: [FactionKey.ScoiaTael, FactionKey.NilfgaardianEmpire],
      },
    ],
  })
  await GamesPage.selectGame(0)
  await GamePage.verifyCoinToss({
    won: true,
    wait: true,
  })
  await GamePage.verify({
    self: gamePlayer1,
    opponent: gamePlayer2,
    hand: gameDeck1.hand,
    redraws: [],
  })

  const redraw3 = gameDeck1.hand[0].unit.name
  await GamePage.redraw(redraw3)
  const redraw3GameDeck1 = await client1.getGameDeck(gameId)
  await GamePage.verify({
    self: gamePlayer1,
    opponent: gamePlayer2,
    hand: redraw3GameDeck1.hand,
    redraws: [
      {
        from: redraw3,
        to: redraw3GameDeck1.redraws[0].to.unit.name,
      },
    ],
  })
  const redraw4 = gameDeck1.hand[gameDeck1.hand.length - 1].unit.name
  await GamePage.redraw(redraw4)
  const redraw4GameDeck1 = await client1.getGameDeck(gameId)
  await GamePage.verify({
    self: gamePlayer1,
    opponent: gamePlayer2,
    hand: redraw4GameDeck1.hand,
    redraws: [
      {
        from: redraw3,
        to: redraw3GameDeck1.redraws[0].to.unit.name,
      },
      {
        from: redraw4,
        to: redraw4GameDeck1.redraws[1].to.unit.name,
      },
    ],
  })
  await GamePage.ready()
  gamePlayer1.ready = true
  gamePlayer1.passed = false
  gamePlayer1.turn = PlayerTurn.Current
  const moves1: (HistoryMove | HistoryPass)[] = []
  const moves2: (HistoryMove | HistoryPass)[] = []
  const moves3: (HistoryMove | HistoryPass)[] = []
  await GamePage.verify({
    self: gamePlayer1,
    opponent: gamePlayer2,
    hand: redraw4GameDeck1.hand,
    moves: [moves1],
  })

  const sortedHandSelf = sortObjectArray({
    array: redraw4GameDeck1.hand,
    sortProperties: ['unit.strength', 'unit.id'],
    reverse: true,
  })
  const unit1Self = sortedHandSelf[0]
  const combat1Self = unit1Self.unit.combats ? unit1Self.unit.combats[0] : Combat.Close
  await GamePage.moveUnit({
    unitName: unit1Self.unit.name,
    row: combat1Self,
  })
  E2eHelper.playUnit({
    player: gamePlayer1,
    gameDeck: redraw4GameDeck1,
    deckUnit: unit1Self,
    moves: moves1,
    row: combat1Self,
  })
  gamePlayer1.turn = undefined
  gamePlayer2.turn = PlayerTurn.Current
  await GamePage.verify({
    self: gamePlayer1,
    opponent: gamePlayer2,
    hand: redraw4GameDeck1.hand,
    moves: [moves1],
  })

  // user2 play unit for round 1
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

  await Banner.goTo(Banner.elements.MenuGames)
  await GamesPage.verify({
    games: [
      {
        created: game.created,
        owner: username2,
        players: [username2, username1],
        status: GameStatus.Playing,
        factions: [FactionKey.ScoiaTael, FactionKey.NilfgaardianEmpire],
      },
    ],
  })
  await GamesPage.selectGame(0)
  gamePlayer1.passed = undefined
  gamePlayer2.passed = false
  await GamePage.verify({
    self: gamePlayer2,
    opponent: gamePlayer1,
    hand: redraw2GameDeck2.hand,
    moves: [moves1],
  })

  const sortedHandOpponent = sortObjectArray({
    array: redraw2GameDeck2.hand,
    sortProperties: ['unit.strength', 'unit.id'],
    reverse: true,
  })
  const unit1Opponent = sortedHandOpponent[sortedHandOpponent.length - 1]
  const combat1Opponent = unit1Opponent.unit.combats ? unit1Opponent.unit.combats[0] : Combat.Close
  await GamePage.moveUnit({
    unitName: unit1Opponent.unit.name,
    row: combat1Opponent,
  })
  E2eHelper.playUnit({
    player: gamePlayer2,
    gameDeck: redraw2GameDeck2,
    deckUnit: unit1Opponent,
    moves: moves1,
    row: combat1Opponent,
  })
  gamePlayer2.turn = undefined
  gamePlayer1.turn = PlayerTurn.Current
  await GamePage.verify({
    self: gamePlayer2,
    opponent: gamePlayer1,
    hand: redraw2GameDeck2.hand,
    moves: [moves1],
  })

  // user1 pass round 1
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
  await GamesPage.verify({
    games: [
      {
        created: game.created,
        owner: username2,
        players: [username2, username1],
        status: GameStatus.Playing,
        factions: [FactionKey.ScoiaTael, FactionKey.NilfgaardianEmpire],
      },
    ],
  })
  await GamesPage.selectGame(0)
  gamePlayer1.passed = false
  gamePlayer2.passed = undefined
  await GamePage.verify({
    self: gamePlayer1,
    opponent: gamePlayer2,
    hand: redraw4GameDeck1.hand,
    moves: [moves1],
  })

  await GamePage.pass({})
  gamePlayer1.passed = true
  gamePlayer1.turn = undefined
  gamePlayer2.turn = PlayerTurn.Current
  moves1.push({
    userName: gamePlayer1.name,
    round: 1,
  })
  await GamePage.verify({
    self: gamePlayer1,
    opponent: gamePlayer2,
    hand: redraw4GameDeck1.hand,
    moves: [moves1],
  })

  // user 2 pass round 1
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

  await Banner.goTo(Banner.elements.MenuGames)
  await GamesPage.verify({
    games: [
      {
        created: game.created,
        owner: username2,
        players: [username2, username1],
        status: GameStatus.Playing,
        factions: [FactionKey.ScoiaTael, FactionKey.NilfgaardianEmpire],
      },
    ],
  })
  await GamesPage.selectGame(0)
  gamePlayer2.passed = false
  await GamePage.verify({
    self: gamePlayer2,
    opponent: gamePlayer1,
    hand: redraw2GameDeck2.hand,
    moves: [moves1],
  })

  await GamePage.pass({})
  gamePlayer1.passed = undefined
  gamePlayer1.turn = PlayerTurn.Current
  gamePlayer2.losses = 1
  gamePlayer2.passed = false
  gamePlayer2.turn = undefined
  moves1.push({
    userName: gamePlayer2.name,
    round: 1,
  })
  E2eHelper.endRound({
    creator: gamePlayer2,
    opponent: gamePlayer1,
  })
  await GamePage.verify({
    self: gamePlayer2,
    opponent: gamePlayer1,
    hand: redraw2GameDeck2.hand,
    round: 2,
    moves: [moves1, moves2],
  })

  // user 1 play unit for round 2
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
  await GamesPage.verify({
    games: [
      {
        created: game.created,
        owner: username2,
        players: [username2, username1],
        status: GameStatus.Playing,
        factions: [FactionKey.ScoiaTael, FactionKey.NilfgaardianEmpire],
      },
    ],
  })
  await GamesPage.selectGame(0)
  gamePlayer1.passed = false
  gamePlayer2.passed = undefined
  await GamePage.verify({
    self: gamePlayer1,
    opponent: gamePlayer2,
    hand: redraw4GameDeck1.hand,
    round: 2,
    moves: [moves1, moves2],
  })

  const unit2Self = sortedHandSelf[sortedHandSelf.length - 1]
  const combat2Self = unit2Self.unit.combats ? unit2Self.unit.combats[0] : Combat.Close
  await GamePage.moveUnit({
    unitName: unit2Self.unit.name,
    row: combat2Self,
  })
  E2eHelper.playUnit({
    player: gamePlayer1,
    gameDeck: redraw4GameDeck1,
    deckUnit: unit2Self,
    moves: moves2,
    row: combat2Self,
  })
  gamePlayer1.turn = undefined
  gamePlayer2.turn = PlayerTurn.Current
  await GamePage.verify({
    self: gamePlayer1,
    opponent: gamePlayer2,
    hand: redraw4GameDeck1.hand,
    round: 2,
    moves: [moves1, moves2],
  })

  // user 2 play unit for round 2
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

  await Banner.goTo(Banner.elements.MenuGames)
  await GamesPage.verify({
    games: [
      {
        created: game.created,
        owner: username2,
        players: [username2, username1],
        status: GameStatus.Playing,
        factions: [FactionKey.ScoiaTael, FactionKey.NilfgaardianEmpire],
      },
    ],
  })
  await GamesPage.selectGame(0)
  gamePlayer1.passed = undefined
  gamePlayer2.passed = false
  await GamePage.verify({
    self: gamePlayer2,
    opponent: gamePlayer1,
    hand: redraw2GameDeck2.hand,
    round: 2,
    moves: [moves1, moves2],
  })

  const unit2Opponent = sortedHandOpponent[0]
  const combat2Opponent = unit2Opponent.unit.combats ? unit2Opponent.unit.combats[0] : Combat.Close
  await GamePage.moveUnit({
    unitName: unit2Opponent.unit.name,
    row: combat2Opponent,
  })
  E2eHelper.playUnit({
    player: gamePlayer2,
    gameDeck: redraw2GameDeck2,
    deckUnit: unit2Opponent,
    moves: moves2,
    row: combat2Opponent,
  })
  gamePlayer1.turn = PlayerTurn.Current
  gamePlayer2.turn = undefined
  await GamePage.verify({
    self: gamePlayer2,
    opponent: gamePlayer1,
    hand: redraw2GameDeck2.hand,
    round: 2,
    moves: [moves1, moves2],
  })

  // user 1 pass for round 2
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
  await GamesPage.verify({
    games: [
      {
        created: game.created,
        owner: username2,
        players: [username2, username1],
        status: GameStatus.Playing,
        factions: [FactionKey.ScoiaTael, FactionKey.NilfgaardianEmpire],
      },
    ],
  })
  await GamesPage.selectGame(0)
  gamePlayer1.passed = false
  gamePlayer2.passed = undefined
  await GamePage.verify({
    self: gamePlayer1,
    opponent: gamePlayer2,
    hand: redraw4GameDeck1.hand,
    round: 2,
    moves: [moves1, moves2],
  })

  await GamePage.pass({})
  gamePlayer1.passed = true
  gamePlayer1.turn = undefined
  gamePlayer2.turn = PlayerTurn.Current
  moves2.push({
    userName: gamePlayer1.name,
    round: 2,
  })
  await GamePage.verify({
    self: gamePlayer1,
    opponent: gamePlayer2,
    hand: redraw4GameDeck1.hand,
    round: 2,
    moves: [moves1, moves2],
  })

  // user 2 pass for round 2 and round 3
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

  await Banner.goTo(Banner.elements.MenuGames)
  await GamesPage.verify({
    games: [
      {
        created: game.created,
        owner: username2,
        players: [username2, username1],
        status: GameStatus.Playing,
        factions: [FactionKey.ScoiaTael, FactionKey.NilfgaardianEmpire],
      },
    ],
  })
  await GamesPage.selectGame(0)
  gamePlayer2.passed = false
  await GamePage.verify({
    self: gamePlayer2,
    opponent: gamePlayer1,
    hand: redraw2GameDeck2.hand,
    round: 2,
    moves: [moves1, moves2],
  })

  await GamePage.pass({})
  gamePlayer1.passed = undefined
  gamePlayer1.losses = 1
  moves2.push({
    userName: gamePlayer2.name,
    round: 2,
  })
  E2eHelper.endRound({
    creator: gamePlayer2,
    opponent: gamePlayer1,
  })
  await GamePage.verify({
    self: gamePlayer2,
    opponent: gamePlayer1,
    hand: redraw2GameDeck2.hand,
    round: 3,
    moves: [moves1, moves2, moves3],
  })

  await GamePage.pass({})
  gamePlayer1.turn = PlayerTurn.Current
  gamePlayer2.passed = true
  gamePlayer2.turn = undefined
  moves3.push({
    userName: gamePlayer2.name,
    round: 3,
  })
  await GamePage.verify({
    self: gamePlayer2,
    opponent: gamePlayer1,
    hand: redraw2GameDeck2.hand,
    round: 3,
    moves: [moves1, moves2, moves3],
  })

  // user 1 pass for round 3 to end game
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
  await GamesPage.verify({
    games: [
      {
        created: game.created,
        owner: username2,
        players: [username2, username1],
        status: GameStatus.Playing,
        factions: [FactionKey.ScoiaTael, FactionKey.NilfgaardianEmpire],
      },
    ],
  })
  await GamesPage.selectGame(0)
  gamePlayer1.passed = false
  gamePlayer2.passed = true
  await GamePage.verify({
    self: gamePlayer1,
    opponent: gamePlayer2,
    hand: redraw4GameDeck1.hand,
    round: 3,
    moves: [moves1, moves2, moves3],
  })

  await GamePage.pass({})
  gamePlayer1.passed = true
  gamePlayer1.losses = 2
  gamePlayer1.turn = undefined
  gamePlayer2.losses = 2
  moves3.push({
    userName: gamePlayer1.name,
    round: 3,
  })
  E2eHelper.endRound({
    creator: gamePlayer2,
    opponent: gamePlayer1,
  })
  await GamePage.verify({
    self: gamePlayer1,
    opponent: gamePlayer2,
    hand: redraw4GameDeck1.hand,
    round: 3,
    moves: [moves1, moves2, moves3],
    victors: [gamePlayer2.name, gamePlayer1.name],
    rounds: [
      {
        creator: unit1Opponent.unit.strength || 0,
        opponent: unit1Self.unit.strength || 0,
      },
      {
        creator: unit2Opponent.unit.strength || 0,
        opponent: unit2Self.unit.strength || 0,
      },
      {
        creator: 0,
        opponent: 0,
      },
    ],
  })

  await GamePage.summaryGoToGames()
  await GamesPage.verify({
    games: [
      {
        created: game.created,
        owner: username2,
        players: [username2, username1],
        status: GameStatus.Done,
        factions: [FactionKey.ScoiaTael, FactionKey.NilfgaardianEmpire],
        victors: [gamePlayer2.name, gamePlayer1.name],
      },
    ],
  })

  // user 2 verifies game summary
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

  await Banner.goTo(Banner.elements.MenuGames)
  await GamesPage.verify({
    games: [
      {
        created: game.created,
        owner: username2,
        players: [username2, username1],
        status: GameStatus.Done,
        factions: [FactionKey.ScoiaTael, FactionKey.NilfgaardianEmpire],
        victors: [gamePlayer2.name, gamePlayer1.name],
      },
    ],
  })
  await GamesPage.selectGame(0)
  await GamePage.verify({
    self: gamePlayer2,
    opponent: gamePlayer1,
    hand: redraw2GameDeck2.hand,
    round: 3,
    moves: [moves1, moves2, moves3],
    victors: [gamePlayer2.name, gamePlayer1.name],
    rounds: [
      {
        creator: unit1Opponent.unit.strength || 0,
        opponent: unit1Self.unit.strength || 0,
      },
      {
        creator: unit2Opponent.unit.strength || 0,
        opponent: unit2Self.unit.strength || 0,
      },
      {
        creator: 0,
        opponent: 0,
      },
    ],
  })
})
