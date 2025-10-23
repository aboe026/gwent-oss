import ApiClient from '../util/api-client'
import { E2eCtx, getFixtureCtx, getScenario, getTestCtx } from '../util/e2e-ctx'
import { E2eHelper } from '../util/e2e-helper'
import { FactionKey, GamePlayer } from '@gwent/node-client'
import { FILTER_FIELD } from '@gwent/graphql-schema/games-filter'
import GamesPage, { GameInList } from '../page-objects/games-page'
import LoginPage from '../page-objects/login-page'

interface GamesFilterTestCtx extends E2eCtx {
  username1: string
  username2: string
  username3: string
  gameInList1: GameInList
  gameInList2: GameInList
  gameInList3: GameInList
  gameInList4: GameInList
  gameInList5: GameInList
}
const fixture = getFixtureCtx<E2eCtx, GamesFilterTestCtx>()
const test = getTestCtx<E2eCtx, GamesFilterTestCtx>()

fixture('Games Filter')
  .page(GamesPage.getUrl())
  .beforeEach(async (t) => {
    const scenario = getScenario(t)
    t.ctx.username1 = `${scenario}-user-1-${t.ctx.start}`
    t.ctx.username2 = `${scenario}-user-2-${t.ctx.start}`
    t.ctx.username3 = `${scenario}-user-3-${t.ctx.start}`
    await new ApiClient({}).addUser({
      name: t.ctx.username1,
    })
    await new ApiClient({}).addUser({
      name: t.ctx.username2,
    })
    await new ApiClient({}).addUser({
      name: t.ctx.username3,
    })
    const client1 = new ApiClient({
      username: t.ctx.username1,
    })
    const client2 = new ApiClient({
      username: t.ctx.username2,
    })
    const client3 = new ApiClient({
      username: t.ctx.username3,
    })
    const game1 = await client1.addGame([t.ctx.username2])
    const game2 = await client2.addGame([t.ctx.username1])
    const game3 = await client1.addGame([t.ctx.username3])
    const game4 = await client1.addGame([t.ctx.username2])
    const game5 = await client1.addGame([t.ctx.username2])
    const deck1 = await client1.addDeck({
      faction: FactionKey.Monsters,
      leaderName: 'Eredin Bringer of Death',
      name: `${scenario}-deck-1-${t.ctx.start}`,
      unitNames: await E2eHelper.getUnitsForDeck({
        client: client1,
        faction: FactionKey.Monsters,
      }),
    })
    const deck2 = await client2.addDeck({
      faction: FactionKey.Skellige,
      leaderName: 'King Bran',
      name: `${scenario}-deck-2-${t.ctx.start}`,
      unitNames: await E2eHelper.getUnitsForDeck({
        client: client2,
        faction: FactionKey.Skellige,
      }),
    })
    const deck3 = await client2.addDeck({
      faction: FactionKey.Monsters,
      leaderName: 'Eredin Bringer of Death',
      name: `${scenario}-deck-3-${t.ctx.start}`,
      unitNames: await E2eHelper.getUnitsForDeck({
        client: client2,
        faction: FactionKey.Monsters,
      }),
    })
    const deck4 = await client1.addDeck({
      faction: FactionKey.ScoiaTael,
      leaderName: 'Francesca Findabair Hope of the Aen Seidhe',
      name: `${scenario}-deck-4-${t.ctx.start}`,
      unitNames: await E2eHelper.getUnitsForDeck({
        client: client1,
        faction: FactionKey.ScoiaTael,
      }),
    })
    const deck5 = await client3.addDeck({
      faction: FactionKey.Skellige,
      leaderName: 'King Bran',
      name: `${scenario}-deck-5-${t.ctx.start}`,
      unitNames: await E2eHelper.getUnitsForDeck({
        client: client3,
        faction: FactionKey.Skellige,
      }),
    })
    await client1.setDeck({
      deckId: deck1.id,
      gameId: game2.id,
    })
    await client2.setDeck({
      deckId: deck2.id,
      gameId: game2.id,
    })
    await client1.setDeck({
      deckId: deck1.id,
      gameId: game3.id,
    })
    await client3.setDeck({
      deckId: deck5.id,
      gameId: game3.id,
    })
    await client1.ready(game2.id)
    await client2.ready(game2.id)
    await client1.setDeck({
      deckId: deck1.id,
      gameId: game4.id,
    })
    await client2.setDeck({
      deckId: deck3.id,
      gameId: game4.id,
    })
    await client1.ready(game4.id)
    await client2.ready(game4.id)
    await client1.setDeck({
      deckId: deck4.id,
      gameId: game5.id,
    })
    await client2.setDeck({
      deckId: deck3.id,
      gameId: game5.id,
    })
    const updatedGame1 = await client1.getGame(game1.id)
    const updatedGame2 = await client2.getGame(game2.id)
    const updatedGame3 = await client1.getGame(game3.id)
    const updatedGame4 = await client1.getGame(game4.id)
    const updatedGame5 = await client1.getGame(game5.id)
    await LoginPage.login({
      username: t.ctx.username1,
    })
    t.ctx.gameInList1 = {
      created: updatedGame1.created,
      owner: updatedGame1.creator.name,
      players: updatedGame1.players.map((player: GamePlayer) => player.user.name),
      status: updatedGame1.status,
    }
    t.ctx.gameInList2 = {
      created: updatedGame2.created,
      owner: updatedGame2.creator.name,
      players: updatedGame2.players.map((player: GamePlayer) => player.user.name),
      status: updatedGame2.status,
      factions: updatedGame2.players.map((player: GamePlayer) => player.faction?.key as FactionKey),
    }
    t.ctx.gameInList3 = {
      created: updatedGame3.created,
      owner: updatedGame3.creator.name,
      players: updatedGame3.players.map((player: GamePlayer) => player.user.name),
      status: updatedGame3.status,
      factions: updatedGame3.players.map((player: GamePlayer) => player.faction?.key as FactionKey),
    }
    t.ctx.gameInList4 = {
      created: updatedGame4.created,
      owner: updatedGame4.creator.name,
      players: updatedGame4.players.map((player: GamePlayer) => player.user.name),
      status: updatedGame4.status,
      factions: updatedGame4.players.map((player: GamePlayer) => player.faction?.key as FactionKey),
    }
    t.ctx.gameInList5 = {
      created: updatedGame5.created,
      owner: updatedGame5.creator.name,
      players: updatedGame5.players.map((player: GamePlayer) => player.user.name),
      status: updatedGame5.status,
      factions: updatedGame5.players.map((player: GamePlayer) => player.faction?.key as FactionKey),
    }

    await verifyAllShown(t.ctx)
  })

test('Filters by user', async (t) => {
  await GamesPage.filterUser(t.ctx.username3)
  await GamesPage.verify({
    games: [t.ctx.gameInList3],
  })
  await GamesPage.filterUser('invalid')
  await GamesPage.verifyNoFilterResults()
  await GamesPage.clearFilterNoneFound()
  await verifyAllShown(t.ctx)
})

test('Filters by faction', async (t) => {
  await GamesPage.toggleAdvancedFiltersExpanded()
  await GamesPage.toggleAdvancedFilter(FILTER_FIELD.Monsters)
  await GamesPage.verify({
    games: [t.ctx.gameInList5, t.ctx.gameInList4, t.ctx.gameInList2, t.ctx.gameInList3],
  })
  await GamesPage.toggleAdvancedFilter(FILTER_FIELD.Monsters)
  await GamesPage.toggleAdvancedFilter(FILTER_FIELD.NorthernRealms)
  await GamesPage.verifyNoFilterResults()
  await GamesPage.clearFilterNoneFound()
  await verifyAllShown(t.ctx)
})

test('Filters by status', async (t) => {
  await GamesPage.toggleAdvancedFiltersExpanded()
  await GamesPage.toggleAdvancedFilter(FILTER_FIELD.Decking)
  await GamesPage.verify({
    games: [t.ctx.gameInList1],
  })
  await GamesPage.toggleAdvancedFilter(FILTER_FIELD.Decking)
  await verifyAllShown(t.ctx)
  await GamesPage.toggleAdvancedFilter(FILTER_FIELD.Ordering)
  await GamesPage.verify({
    games: [t.ctx.gameInList5],
  })
  await GamesPage.toggleAdvancedFilter(FILTER_FIELD.Ordering)
  await verifyAllShown(t.ctx)
  await GamesPage.toggleAdvancedFilter(FILTER_FIELD.Redrawing)
  await GamesPage.verify({
    games: [t.ctx.gameInList3],
  })
  await GamesPage.toggleAdvancedFilter(FILTER_FIELD.Redrawing)
  await verifyAllShown(t.ctx)
  await GamesPage.toggleAdvancedFilter(FILTER_FIELD.Playing)
  await GamesPage.verify({
    games: [t.ctx.gameInList4, t.ctx.gameInList2],
  })
  await GamesPage.toggleAdvancedFilter(FILTER_FIELD.Playing)
  await verifyAllShown(t.ctx)
  await GamesPage.toggleAdvancedFilter(FILTER_FIELD.Done)
  await GamesPage.verifyNoFilterResults()
  await GamesPage.clearFilterNoneFound()
  await verifyAllShown(t.ctx)
})

test('Filters by user faction and status', async (t) => {
  await GamesPage.filterUser(t.ctx.username1)
  await GamesPage.verify({
    games: [t.ctx.gameInList5, t.ctx.gameInList4, t.ctx.gameInList2, t.ctx.gameInList3, t.ctx.gameInList1],
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

async function verifyAllShown(ctx: GamesFilterTestCtx) {
  await GamesPage.verify({
    games: [ctx.gameInList5, ctx.gameInList4, ctx.gameInList2, ctx.gameInList3, ctx.gameInList1],
  })
}
