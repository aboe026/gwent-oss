import ApplicationQuery from '../../src/graphql/resolvers/queries/application-query'
import CurrentUserQuery from '../../src/graphql/resolvers/queries/current-user-query'
import DecksQuery from '../../src/graphql/resolvers/queries/decks-query'
import FactionsQuery from '../../src/graphql/resolvers/queries/factions-query'
import GameDeckQuery from '../../src/graphql/resolvers/queries/game-deck-query'
import GameQuery from '../../src/graphql/resolvers/queries/game-query'
import GamesQuery from '../../src/graphql/resolvers/queries/games-query'
import LeadersQuery from '../../src/graphql/resolvers/queries/leaders-query'
import resolvers from '../../src/graphql/resolvers/resolvers'
import SettingsQuery from '../../src/graphql/resolvers/queries/settings-query'
import UnitsQuery from '../../src/graphql/resolvers/queries/units-query'
import UsernameAvailableQuery from '../../src/graphql/resolvers/queries/username-available'

describe('queries', () => {
  describe('getQueries', () => {
    it('calls queries and mutations', async () => {
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
      const usernameAvailableSpy = jest.spyOn(UsernameAvailableQuery, 'usernameAvailable').mockImplementation()

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
      await verifyOperation(resolvers.Query?.usernameAvailable, usernameAvailableSpy)
    })
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
