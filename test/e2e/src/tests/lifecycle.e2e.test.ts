import ApiClient from '../util/api-client'
import Banner from '../components/banner'
import { Combat, FactionKey, GameStatus } from '@gwent-oss/node-client'
import DeckEditor from '../components/deck-editor'
import DeckList from '../components/deck-list'
import DeckPage from '../page-objects/deck-page'
import DecksPage from '../page-objects/decks-page'
import { E2eCtx, getFixtureCtx, getScenario, getTestCtx } from '../util/e2e-ctx'
import { ensureUnitsInHand } from '@gwent-oss/test-utils'
import env from '../util/e2e-env'
import { GameManager } from '../util/game-manager'
import GamePage, { GamePlayerExpected } from '../page-objects/game-page'
import GamesPage from '../page-objects/games-page'
import HomePage from '../page-objects/home-page'
import LoginPage from '../page-objects/login-page'
import { PlayerTurn } from '../components/game-player-info'
import ProfilePage from '../page-objects/profile-page'
import SignupPage from '../page-objects/signup-page'
import { STARTING_HAND_SIZE } from '@gwent-oss/constants'

const fixture = getFixtureCtx<E2eCtx, E2eCtx>()
const test = getTestCtx<E2eCtx, E2eCtx>()

fixture('Lifecycle').page(env.BASE_URL)

test('Speed Run', async (t) => {
  // user 1 sign up
  const username1 = `${getScenario(t)}-user-1-${t.ctx.start}`
  const deckName1 = `${getScenario(t)}-deck-1-${t.ctx.start}`
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

  // user 2 sign up, create game and set deck
  const username2 = `${getScenario(t)}-user-2-${t.ctx.start}`
  const deckName2 = `${getScenario(t)}-deck-2-${t.ctx.start}`
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
  const handUnitNames2 = [
    'Albrich',
    'Assire var Anahid',
    'Cahir Mawr Dyffryn aep Ceallach',
    'Cynthia',
    'Fringilla Vigo',
    'Heavy Zerrikanian Fire Scorpion',
    'Morteisen',
    'Puttkammer',
    'Rainfarn',
    'Vreemde',
  ]
  const drawUnitNames2 = [
    'Emiel Regis Rohellec Terzieff',
    'Renuald aep Matsen',
    'Roach',
    'Rotten Mangonel',
    'Siege Engineer',
    'Sweers',
    'Vanhemar',
    'Vesemir',
    'Young Emissary',
    'Young Emissary',
    'Zerrikanian Fire Scorpion',
    'Zoltan Chivay',
  ]
  await DeckEditor.createDeck({
    faction: faction2,
    leader: leader2,
    name: deckName2,
    units: [...handUnitNames2, ...drawUnitNames2].sort(),
    verifyRedirect: false,
  })
  const gameId = await GamePage.getIdFromUrl()
  let gameDeck2 = await client2.getGameDeck(gameId)
  const gamePlayer2: GamePlayerExpected = {
    name: username2,
    discard: 0,
    faction: faction2,
    hand: STARTING_HAND_SIZE,
    leader: leader2,
    losses: 0,
    undrawn: gameDeck2.undrawn.length,
    from: gameDeck2.from,
    score: 0,
  }
  await GamePage.verify({
    self: gamePlayer2,
    opponent: {
      name: username1,
    },
    hand: gameDeck2.hand,
  })
  await ensureUnitsInHand({
    gameId,
    mongoConnectionString: env.MONGO_URL,
    mongoDatabaseName: env.MONGO_DB,
    userId: (await client2.currentUser()).id,
    unitNames: handUnitNames2,
  })
  gameDeck2 = await client2.getGameDeck(gameId)

  await Banner.goTo(Banner.elements.MenuProfile)
  await ProfilePage.verify({
    username: username2,
  })
  await ProfilePage.logout()
  await LoginPage.verifyNotLoggedIn({})

  // user 1 set deck, order and ready
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
  const handUnitNames1 = [
    'Barclay Els',
    'Ciaran aep Easnillien',
    'Dennis Cranmer',
    'Dol Blathanna Archer',
    'Emiel Regis Rohellec Terzieff',
    'Filavandrel aen Fidhail',
    'Ida Emean aep Sivney',
    'Riordain',
    'Toruviel',
    'Yaevinn',
  ]
  const drawUnitNames1 = [
    'Dol Blathanna Scout',
    'Dol Blathanna Scout',
    'Dol Blathanna Scout',
    'Mahakaman Defender',
    'Mahakaman Defender',
    'Mahakaman Defender',
    'Mahakaman Defender',
    'Mahakaman Defender',
    'Roach',
    'Vesemir',
    'Vrihedd Brigade Recruit',
    'Zoltan Chivay',
  ]
  await DeckEditor.createDeck({
    faction: faction1,
    leader: leader1,
    name: deckName1,
    units: [...handUnitNames1, ...drawUnitNames1].sort(),
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
    score: 0,
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
  await ensureUnitsInHand({
    gameId,
    mongoConnectionString: env.MONGO_URL,
    mongoDatabaseName: env.MONGO_DB,
    userId: (await client1.currentUser()).id,
    unitNames: handUnitNames1,
  })

  await Banner.goTo(Banner.elements.MenuProfile)
  await ProfilePage.verify({
    username: username1,
  })
  await ProfilePage.logout()
  await LoginPage.verifyNotLoggedIn({})

  // user 2 ready and play unit
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

  const gameManager = await new GameManager({
    gameId,
    self: {
      client: client2,
      deck: await client2.getGameDeck(gameId),
      gamePlayer: gamePlayer2,
    },
    opponent: {
      client: client1,
      deck: await client1.getGameDeck(gameId),
      gamePlayer: gamePlayer1,
    },
    apiDriven: false,
    verify: true,
  })
  await gameManager.verify({})
  const unitName1 = 'Rainfarn'
  await gameManager.deploy({ unitName: unitName1 })

  // user 1 pass
  await switchTurns(gameManager)
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

  gameManager.self.gamePlayer.passed = false
  gameManager.opponent.gamePlayer.passed = undefined
  await gameManager.verify({})
  await gameManager.pass({})

  // user 2 pass twice
  await switchTurns(gameManager)
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
  gameManager.self.gamePlayer.passed = false
  await gameManager.verify({})
  await gameManager.pass({
    switchTurnsWith: gameManager.self.gamePlayer,
  })
  await gameManager.pass({})

  // user 1 pass in defeat
  await switchTurns(gameManager)
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

  gameManager.self.gamePlayer.passed = false
  await gameManager.verify({})
  await gameManager.pass({
    victors: [username2],
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
  // user 1 signup and create deck
  const username1 = `${getScenario(t)}-user-1-${t.ctx.start}`
  const deckName1 = `${getScenario(t)}-deck-1-${t.ctx.start}`
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
  const handUnitNames1 = [
    'Albrich',
    'Assire var Anahid',
    'Cahir Mawr Dyffryn aep Ceallach',
    'Cynthia',
    'Fringilla Vigo',
    'Heavy Zerrikanian Fire Scorpion',
    'Morteisen',
    'Puttkammer',
    'Rainfarn',
    'Vreemde',
  ]
  const drawUnitNames1 = [
    'Emiel Regis Rohellec Terzieff',
    'Renuald aep Matsen',
    'Roach',
    'Rotten Mangonel',
    'Siege Engineer',
    'Sweers',
    'Vanhemar',
    'Vesemir',
    'Young Emissary',
    'Young Emissary',
    'Zerrikanian Fire Scorpion',
    'Zoltan Chivay',
  ]
  await DeckPage.createDeck({
    faction: faction1,
    leader: leader1,
    name: deckName1,
    units: [...handUnitNames1, ...drawUnitNames1].sort(),
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

  // user 2 signup, create deck, game and set deck
  const username2 = `${getScenario(t)}-user-2-${t.ctx.start}`
  const deckName2 = `${getScenario(t)}-deck-2-${t.ctx.start}`
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
  const handUnitNames2 = [
    'Barclay Els',
    'Ciaran aep Easnillien',
    'Dennis Cranmer',
    'Dol Blathanna Archer',
    'Emiel Regis Rohellec Terzieff',
    'Filavandrel aen Fidhail',
    'Ida Emean aep Sivney',
    'Riordain',
    'Toruviel',
    'Yaevinn',
  ]
  const drawUnitNames2 = [
    'Dol Blathanna Scout',
    'Dol Blathanna Scout',
    'Dol Blathanna Scout',
    'Mahakaman Defender',
    'Mahakaman Defender',
    'Mahakaman Defender',
    'Mahakaman Defender',
    'Mahakaman Defender',
    'Roach',
    'Vesemir',
    'Vrihedd Brigade Recruit',
    'Zoltan Chivay',
  ]
  await DeckPage.createDeck({
    faction: faction2,
    leader: leader2,
    name: deckName2,
    units: [...handUnitNames2, ...drawUnitNames2].sort(),
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
  let gameDeck2 = await client2.getGameDeck(gameId)
  const gamePlayer2: GamePlayerExpected = {
    name: username2,
    faction: faction2,
    leader: leader2,
    discard: 0,
    hand: STARTING_HAND_SIZE,
    undrawn: deck2.units.length - STARTING_HAND_SIZE,
    from: gameDeck2.from,
    score: 0,
  }
  await GamePage.verify({
    self: gamePlayer2,
    opponent: {
      name: username1,
    },
    hand: gameDeck2.hand,
  })
  await ensureUnitsInHand({
    gameId,
    mongoConnectionString: env.MONGO_URL,
    mongoDatabaseName: env.MONGO_DB,
    userId: (await client2.currentUser()).id,
    unitNames: handUnitNames2,
  })
  gameDeck2 = await client2.getGameDeck(gameId)

  // user 1 set deck
  await changePlayers({
    from: username2,
    to: username1,
  })
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
  let gameDeck1 = await client1.getGameDeck(gameId)
  const gamePlayer1: GamePlayerExpected = {
    name: username1,
    faction: faction1,
    leader: leader1,
    discard: 0,
    hand: STARTING_HAND_SIZE,
    undrawn: deck1.units.length - STARTING_HAND_SIZE,
    from: gameDeck1.from,
    score: 0,
  }
  await GamePage.verify({
    self: gamePlayer1,
    opponent: gamePlayer2,
    hand: gameDeck1.hand,
    turnOrder: [],
  })
  await ensureUnitsInHand({
    gameId,
    mongoConnectionString: env.MONGO_URL,
    mongoDatabaseName: env.MONGO_DB,
    userId: (await client1.currentUser()).id,
    unitNames: handUnitNames1,
  })
  gameDeck1 = await client1.getGameDeck(gameId)

  // user 2 set order and redraw 2
  await changePlayers({
    from: username1,
    to: username2,
  })
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
  const redraw1 = 'Barclay Els'
  await GamePage.redraw(redraw1)
  const redraw1GameDeck2 = await client2.getGameDeck(gameId)
  await GamePage.verify({
    self: gamePlayer2,
    opponent: gamePlayer1,
    hand: redraw1GameDeck2.hand,
    redraws: [
      {
        from: {
          unitName: redraw1,
        },
        to: {
          unitName: redraw1GameDeck2.redraws[0].to.unit.name,
        },
      },
    ],
  })
  const redraw2 = 'Dennis Cranmer'
  await GamePage.redraw(redraw2)
  const redraw2GameDeck2 = await client2.getGameDeck(gameId)
  await GamePage.verify({
    self: gamePlayer2,
    opponent: gamePlayer1,
    hand: redraw2GameDeck2.hand,
    redraws: [
      {
        from: {
          unitName: redraw1,
        },
        to: {
          unitName: redraw1GameDeck2.redraws[0].to.unit.name,
        },
      },
      {
        from: {
          unitName: redraw2,
        },
        to: {
          unitName: redraw2GameDeck2.redraws[1].to.unit.name,
        },
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
        from: {
          unitName: redraw1,
        },
        to: {
          unitName: redraw1GameDeck2.redraws[0].to.unit.name,
        },
      },
      {
        from: {
          unitName: redraw2,
        },
        to: {
          unitName: redraw2GameDeck2.redraws[1].to.unit.name,
        },
      },
    ],
  })

  // user 1 redraw 2 and play unit for round 1
  await changePlayers({
    from: username2,
    to: username1,
  })
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

  const redraw3 = 'Morteisen'
  await GamePage.redraw(redraw3)
  const redraw3GameDeck1 = await client1.getGameDeck(gameId)
  await GamePage.verify({
    self: gamePlayer1,
    opponent: gamePlayer2,
    hand: redraw3GameDeck1.hand,
    redraws: [
      {
        from: {
          unitName: redraw3,
        },
        to: {
          unitName: redraw3GameDeck1.redraws[0].to.unit.name,
        },
      },
    ],
  })
  const redraw4 = 'Rainfarn'
  await GamePage.redraw(redraw4)
  const redraw4GameDeck1 = await client1.getGameDeck(gameId)
  await GamePage.verify({
    self: gamePlayer1,
    opponent: gamePlayer2,
    hand: redraw4GameDeck1.hand,
    redraws: [
      {
        from: {
          unitName: redraw3,
        },
        to: {
          unitName: redraw3GameDeck1.redraws[0].to.unit.name,
        },
      },
      {
        from: {
          unitName: redraw4,
        },
        to: {
          unitName: redraw4GameDeck1.redraws[1].to.unit.name,
        },
      },
    ],
  })
  await GamePage.ready()
  gamePlayer1.ready = true
  gamePlayer1.passed = false
  gamePlayer1.turn = PlayerTurn.Current

  const gameManager = new GameManager({
    gameId,
    self: {
      client: client1,
      deck: await client1.getGameDeck(gameId),
      gamePlayer: gamePlayer1,
    },
    opponent: {
      client: client2,
      deck: await client2.getGameDeck(gameId),
      gamePlayer: gamePlayer2,
    },
  })
  await gameManager.initialize({})

  await gameManager.deploy({ unitName: 'Vreemde' })

  // user 2 play unit for round 1
  await switchTurns(gameManager)
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
  await gameManager.verify({})
  await gameManager.deploy({ unitName: 'Ida Emean aep Sivney', combat: Combat.Ranged })

  // user 1 pass round 1
  await switchTurns(gameManager)
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
  await gameManager.pass({})

  // user 2 pass round 1
  await switchTurns(gameManager)
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
  await gameManager.pass({
    switchTurnsWith: gameManager.self.gamePlayer,
  })
  await gameManager.deploy({ unitName: 'Riordain', combat: Combat.Ranged })

  // user 1 play unit for round 2
  await switchTurns(gameManager)
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
  await gameManager.deploy({ unitName: 'Cahir Mawr Dyffryn aep Ceallach' })

  // user 2 pass for round 2
  await switchTurns(gameManager)
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
  await gameManager.pass({})

  // user 1 pass for round 2 and round 3
  await switchTurns(gameManager)
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
  await gameManager.pass({
    switchTurnsWith: gamePlayer1,
  })
  await gameManager.pass({})

  // user 2 pass for round 3 to end game
  await switchTurns(gameManager)
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
  gamePlayer1.passed = true
  gamePlayer2.passed = false
  const victors = [gamePlayer2.name, gamePlayer1.name]
  await gameManager.pass({
    victors,
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
        victors,
      },
    ],
  })

  // user 1 verifies game summary
  await switchTurns(gameManager)
  await GamesPage.verify({
    games: [
      {
        created: game.created,
        owner: username2,
        players: [username2, username1],
        status: GameStatus.Done,
        factions: [FactionKey.ScoiaTael, FactionKey.NilfgaardianEmpire],
        victors,
      },
    ],
  })
  await GamesPage.selectGame(0)
  await gameManager.verify({})
})

async function switchTurns(gameManager: GameManager) {
  await Banner.goTo(Banner.elements.MenuProfile)
  await ProfilePage.verify({
    username: gameManager.self.gamePlayer.name,
  })
  await ProfilePage.logout()
  await LoginPage.verifyNotLoggedIn({})

  gameManager.switchPlayers()

  await LoginPage.login({
    username: gameManager.self.gamePlayer.name,
  })
  await Banner.verify(gameManager.self.gamePlayer.name)
  await HomePage.verify(gameManager.self.gamePlayer.name)

  await HomePage.goTo(HomePage.elements.ViewGames)
}

async function changePlayers({ from, to }: { from: string; to: string }) {
  await Banner.goTo(Banner.elements.MenuProfile)
  await ProfilePage.verify({
    username: from,
  })
  await ProfilePage.logout()
  await LoginPage.verifyNotLoggedIn({})

  await LoginPage.login({
    username: to,
  })
  await Banner.verify(to)
  await HomePage.verify(to)

  await HomePage.goTo(HomePage.elements.ViewGames)
}
