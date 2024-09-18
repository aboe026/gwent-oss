import { t } from 'testcafe'

import ApiClient from '../util/api-client'
import { FactionKey, GamePlayer } from '@gwent/graphql-schema/resolver-typings'
import { FILTER_FIELD } from '@gwent/graphql-schema/games-filter'
import GamesPage, { GameInList } from '../page-objects/games-page'
import LoginPage from '../page-objects/login-page'

fixture('Games Filter')
  .page(GamesPage.getUrl())
  .beforeEach(async () => {
    const scenario = 'games-filter'
    const username1 = `${scenario}-user-1-${Date.now()}`
    const username2 = `${scenario}-user-2-${Date.now()}`
    const username3 = `${scenario}-user-3-${Date.now()}`
    await new ApiClient({}).addUser({
      name: username1,
    })
    await new ApiClient({}).addUser({
      name: username2,
    })
    await new ApiClient({}).addUser({
      name: username3,
    })
    const client1 = new ApiClient({
      username: username1,
    })
    const client2 = new ApiClient({
      username: username2,
    })
    const game1 = await client1.addGame([username2])
    const game2 = await client2.addGame([username1])
    const game3 = await client1.addGame([username3])
    const game4 = await client1.addGame([username2])
    const deck1 = await client1.addDeck({
      faction: FactionKey.Monsters,
      leaderName: 'Eredin Bringer of Death',
      name: `${scenario}-deck-1-${Date.now()}`,
      unitNames: [
        'Arachas',
        'Biting Frost',
        'Botchling',
        'Cirilla Fiona Elen Riannon',
        'Cockatrice',
        "Commander's Horn",
        'Crone Whispess',
        'Draug',
        'Fiend',
        'Frightener',
        "Gaunter O'Dimm",
        'Ghoul',
        'Grave Hag',
        'Imlerith',
        'Kayran',
        'Nekker',
        'Olgierd Von Everec',
        'Scorch',
        'Toad',
        'Triss Merigold',
        'Vampire: Fleder',
        'Villentretenmerth',
      ],
    })
    const deck2 = await client2.addDeck({
      faction: FactionKey.Skellige,
      leaderName: 'King Bran',
      name: `${scenario}-deck-2-${Date.now()}`,
      unitNames: [
        'Berserker',
        'Birna Bran',
        'Cerys',
        'Clan Dimun Pirate',
        'Draig Bon-Dhu',
        'Ermion',
        'Hjalmar',
        'Holger Blackhand',
        'Kambi',
        'Light Longship',
        'Light Longship',
        'Light Longship',
        'Mardroeme',
        'Mardroeme',
        'Mardroeme',
        'Olaf',
        'War Longship',
        'War Longship',
        'War Longship',
        'Young Berserker',
        'Young Berserker',
        'Young Berserker',
      ],
    })
    const deck3 = await client2.addDeck({
      faction: FactionKey.Monsters,
      leaderName: 'Eredin Bringer of Death',
      name: `${scenario}-deck-1-${Date.now()}`,
      unitNames: [
        'Arachas',
        'Biting Frost',
        'Botchling',
        'Cirilla Fiona Elen Riannon',
        'Cockatrice',
        "Commander's Horn",
        'Crone Whispess',
        'Draug',
        'Fiend',
        'Frightener',
        "Gaunter O'Dimm",
        'Ghoul',
        'Grave Hag',
        'Imlerith',
        'Kayran',
        'Nekker',
        'Olgierd Von Everec',
        'Scorch',
        'Toad',
        'Triss Merigold',
        'Vampire: Fleder',
        'Villentretenmerth',
      ],
    })
    await client1.setDeck({
      deckId: deck1.id,
      gameId: game2.id,
    })
    await client1.ready(game2.id)
    await client2.setDeck({
      deckId: deck2.id,
      gameId: game2.id,
    })
    await client2.ready(game2.id)
    await client1.setDeck({
      deckId: deck1.id,
      gameId: game4.id,
    })
    await client1.ready(game4.id)
    await client2.setDeck({
      deckId: deck3.id,
      gameId: game4.id,
    })
    await client2.ready(game4.id)
    const updatedGame1 = await client1.getGame(game1.id)
    const updatedGame2 = await client2.getGame(game2.id)
    const updatedGame4 = await client1.getGame(game4.id)
    await LoginPage.login({
      username: username1,
    })
    const gameInList1: GameInList = {
      created: updatedGame1.created,
      owner: updatedGame1.creator.name,
      players: updatedGame1.players.map((player: GamePlayer) => player.user.name),
      status: updatedGame1.status,
    }
    const gameInList2: GameInList = {
      created: updatedGame2.created,
      owner: updatedGame2.creator.name,
      players: updatedGame2.players.map((player: GamePlayer) => player.user.name),
      status: updatedGame2.status,
      factions: updatedGame2.players.map((player: GamePlayer) => player.faction?.name as string),
    }
    const gameInList3: GameInList = {
      created: game3.created,
      owner: game3.creator.name,
      players: game3.players.map((player: GamePlayer) => player.user.name),
      status: game3.status,
    }
    const gameInList4: GameInList = {
      created: updatedGame4.created,
      owner: updatedGame4.creator.name,
      players: updatedGame4.players.map((player: GamePlayer) => player.user.name),
      status: updatedGame4.status,
      factions: updatedGame4.players.map((player: GamePlayer) => player.faction?.name as string),
    }
    t.ctx.username1 = username1
    t.ctx.username2 = username2
    t.ctx.username3 = username3
    t.ctx.gameInList1 = gameInList1
    t.ctx.gameInList2 = gameInList2
    t.ctx.gameInList3 = gameInList3
    t.ctx.gameInList4 = gameInList4
    await GamesPage.verify({
      games: [gameInList4, gameInList2, gameInList3, gameInList1],
    })
  })

test('Filters by user', async () => {
  await GamesPage.filterUser(t.ctx.username3)
  await GamesPage.verify({
    games: [t.ctx.gameInList3],
  })
  await GamesPage.filterUser('invalid')
  await GamesPage.verifyNoFilterResults()
  await GamesPage.clearFilterNoneFound()
  await GamesPage.verify({
    games: [t.ctx.gameInList4, t.ctx.gameInList2, t.ctx.gameInList3, t.ctx.gameInList1],
  })
})

test('Filters by faction', async () => {
  await GamesPage.toggleAdvancedFiltersExpanded()
  await GamesPage.toggleAdvancedFilter(FILTER_FIELD.Monsters)
  await GamesPage.verify({
    games: [t.ctx.gameInList4, t.ctx.gameInList2],
  })
  await GamesPage.toggleAdvancedFilter(FILTER_FIELD.Monsters)
  await GamesPage.toggleAdvancedFilter(FILTER_FIELD.NorthernRealms)
  await GamesPage.verifyNoFilterResults()
  await GamesPage.clearFilterNoneFound()
  await GamesPage.verify({
    games: [t.ctx.gameInList4, t.ctx.gameInList2, t.ctx.gameInList3, t.ctx.gameInList1],
  })
})

test('Filters by status', async () => {
  await GamesPage.toggleAdvancedFiltersExpanded()
  await GamesPage.toggleAdvancedFilter(FILTER_FIELD.Decking)
  await GamesPage.verify({
    games: [t.ctx.gameInList3, t.ctx.gameInList1],
  })
  await GamesPage.toggleAdvancedFilter(FILTER_FIELD.Decking)
  await GamesPage.toggleAdvancedFilter(FILTER_FIELD.Done)
  await GamesPage.verifyNoFilterResults()
  await GamesPage.clearFilterNoneFound()
  await GamesPage.verify({
    games: [t.ctx.gameInList4, t.ctx.gameInList2, t.ctx.gameInList3, t.ctx.gameInList1],
  })
})

test('Filters by user faction and status', async () => {
  await GamesPage.filterUser(t.ctx.username1)
  await GamesPage.verify({
    games: [t.ctx.gameInList4, t.ctx.gameInList2, t.ctx.gameInList3, t.ctx.gameInList1],
  })
  await GamesPage.toggleAdvancedFiltersExpanded()
  await GamesPage.toggleAdvancedFilter(FILTER_FIELD.Playing)
  await GamesPage.verify({
    games: [t.ctx.gameInList4, t.ctx.gameInList2],
  })
  await GamesPage.toggleAdvancedFilter(FILTER_FIELD.Monsters)
  await GamesPage.verify({
    games: [t.ctx.gameInList4],
  })
})
