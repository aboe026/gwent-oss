import AddDeckMutation from '../../src/graphql/resolvers/mutations/add-deck-mutation'
import AddGameMutation from '../../src/graphql/resolvers/mutations/add-game-mutation'
import AddUserMutation from '../../src/graphql/resolvers/mutations/add-user-mutation'
import ApplicationQuery from '../../src/graphql/resolvers/queries/application-query'
import CurrentUserQuery from '../../src/graphql/resolvers/queries/current-user-query'
import DecksQuery from '../../src/graphql/resolvers/queries/decks-query'
import FactionsQuery from '../../src/graphql/resolvers/queries/factions-query'
import GameDeckQuery from '../../src/graphql/resolvers/queries/game-deck-query'
import GameQuery from '../../src/graphql/resolvers/queries/game-query'
import GamesQuery from '../../src/graphql/resolvers/queries/games-query'
import LeadersQuery from '../../src/graphql/resolvers/queries/leaders-query'
import LoginMutation from '../../src/graphql/resolvers/mutations/login-mutation'
import LogoutMutation from '../../src/graphql/resolvers/mutations/logout-mutation'
import PlayPassMutation from '../../src/graphql/resolvers/mutations/play-pass-mutation'
import PlayUnitMutation from '../../src/graphql/resolvers/mutations/play-unit-mutation'
import ReadyMutation from '../../src/graphql/resolvers/mutations/ready-mutation'
import RedrawMutation from '../../src/graphql/resolvers/mutations/redraw-mutation'
import resolvers from '../../src/graphql/resolvers/resolvers'
import SetDeckMutation from '../../src/graphql/resolvers/mutations/set-deck-mutation'
import SetOrderMutation from '../../src/graphql/resolvers/mutations/set-order-mutation'
import SettingsQuery from '../../src/graphql/resolvers/queries/settings-query'
import UnitsQuery from '../../src/graphql/resolvers/queries/units-query'

describe('resolvers', () => {
  it('calls queries and mutations', async () => {
    const addDeckSpy = jest.spyOn(AddDeckMutation, 'addDeck').mockImplementation()
    const addGameSpy = jest.spyOn(AddGameMutation, 'addGame').mockImplementation()
    const addUserSpy = jest.spyOn(AddUserMutation, 'addUser').mockImplementation()
    const loginSpy = jest.spyOn(LoginMutation, 'login').mockImplementation()
    const logoutSpy = jest.spyOn(LogoutMutation, 'logout').mockImplementation()
    const playPassSpy = jest.spyOn(PlayPassMutation, 'playPass').mockImplementation()
    const playUnitSpy = jest.spyOn(PlayUnitMutation, 'playUnit').mockImplementation()
    const readySpy = jest.spyOn(ReadyMutation, 'ready').mockImplementation()
    const redrawSpy = jest.spyOn(RedrawMutation, 'redraw').mockImplementation()
    const setDeckSpy = jest.spyOn(SetDeckMutation, 'setDeck').mockImplementation()
    const setOrderSpy = jest.spyOn(SetOrderMutation, 'setOrder').mockImplementation()
    const applicationSpy = jest.spyOn(ApplicationQuery, 'application').mockImplementation()
    const currentUserSpy = jest.spyOn(CurrentUserQuery, 'currentUser').mockImplementation()
    const decksSpy = jest.spyOn(DecksQuery, 'decks').mockImplementation()
    const factionsSpy = jest.spyOn(FactionsQuery, 'factions').mockImplementation()
    const gameSpy = jest.spyOn(GameQuery, 'game').mockImplementation()
    const gameDeckSpy = jest.spyOn(GameDeckQuery, 'gameDeck').mockImplementation()
    const gamesSpy = jest.spyOn(GamesQuery, 'games').mockImplementation()
    const leadersSpy = jest.spyOn(LeadersQuery, 'leaders').mockImplementation()
    const settingsSpy = jest.spyOn(SettingsQuery, 'settings').mockImplementation()
    const unitsSpy = jest.spyOn(UnitsQuery, 'units').mockImplementation()

    await verifyOperation(resolvers.Mutation?.addDeck, addDeckSpy)
    await verifyOperation(resolvers.Mutation?.addGame, addGameSpy)
    await verifyOperation(resolvers.Mutation?.addUser, addUserSpy)
    await verifyOperation(resolvers.Mutation?.login, loginSpy)
    await verifyOperation(resolvers.Mutation?.logout, logoutSpy)
    await verifyOperation(resolvers.Mutation?.playPass, playPassSpy)
    await verifyOperation(resolvers.Mutation?.playUnit, playUnitSpy)
    await verifyOperation(resolvers.Mutation?.ready, readySpy)
    await verifyOperation(resolvers.Mutation?.redraw, redrawSpy)
    await verifyOperation(resolvers.Mutation?.setDeck, setDeckSpy)
    await verifyOperation(resolvers.Mutation?.setOrder, setOrderSpy)
    await verifyOperation(resolvers.Query?.application, applicationSpy)
    await verifyOperation(resolvers.Query?.currentUser, currentUserSpy)
    await verifyOperation(resolvers.Query?.decks, decksSpy)
    await verifyOperation(resolvers.Query?.factions, factionsSpy)
    await verifyOperation(resolvers.Query?.game, gameSpy)
    await verifyOperation(resolvers.Query?.gameDeck, gameDeckSpy)
    await verifyOperation(resolvers.Query?.games, gamesSpy)
    await verifyOperation(resolvers.Query?.leaders, leadersSpy)
    await verifyOperation(resolvers.Query?.settings, settingsSpy)
    await verifyOperation(resolvers.Query?.units, unitsSpy)
  })
})

async function verifyOperation(queryOrMutation: any, spy: any) {
  if (queryOrMutation) {
    await expect(queryOrMutation()).resolves.toEqual(undefined)
  } else {
    expect(queryOrMutation).not.toEqual(undefined)
  }
  expect(spy.mock.calls).toEqual([[]])
}
