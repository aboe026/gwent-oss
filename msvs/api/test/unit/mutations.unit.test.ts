import AddDeckMutation from '../../src/graphql/resolvers/mutations/add-deck/add-deck-mutation'
import AddGameMutation from '../../src/graphql/resolvers/mutations/add-game/add-game-mutation'
import AddUserMutation from '../../src/graphql/resolvers/mutations/add-user/add-user-mutation'
import LoginMutation from '../../src/graphql/resolvers/mutations/login/login-mutation'
import LogoutMutation from '../../src/graphql/resolvers/mutations/logout/logout-mutation'
import PlayPassMutation from '../../src/graphql/resolvers/mutations/play-pass/play-pass-mutation'
import PlayUnitMutation from '../../src/graphql/resolvers/mutations/play-unit/play-unit-mutation'
import ReadyMutation from '../../src/graphql/resolvers/mutations/ready/ready-mutation'
import RedrawMutation from '../../src/graphql/resolvers/mutations/redraw/redraw-mutation'
import resolvers from '../../src/graphql/resolvers/resolvers'
import SetDeckMutation from '../../src/graphql/resolvers/mutations/set-deck/set-deck-mutation'
import SetOrderMutation from '../../src/graphql/resolvers/mutations/set-order/set-order-mutation'

describe('mutations', () => {
  describe('getMutations', () => {
    it('calls mutation functions', async () => {
      const addDeckSpy = jest.spyOn(AddDeckMutation, 'addDeckMutation').mockImplementation()
      const addGameSpy = jest.spyOn(AddGameMutation, 'addGameMutation').mockImplementation()
      const addUserSpy = jest.spyOn(AddUserMutation, 'addUserMutation').mockImplementation()
      const loginSpy = jest.spyOn(LoginMutation, 'loginMutation').mockImplementation()
      const logoutSpy = jest.spyOn(LogoutMutation, 'logoutMutation').mockImplementation()
      const playPassSpy = jest.spyOn(PlayPassMutation, 'playPassMutation').mockImplementation()
      const playUnitSpy = jest.spyOn(PlayUnitMutation, 'playUnitMutation').mockImplementation()
      const readySpy = jest.spyOn(ReadyMutation, 'readyMutation').mockImplementation()
      const redrawSpy = jest.spyOn(RedrawMutation, 'redrawMutation').mockImplementation()
      const setDeckSpy = jest.spyOn(SetDeckMutation, 'setDeckMutation').mockImplementation()
      const setOrderSpy = jest.spyOn(SetOrderMutation, 'setOrderMutation').mockImplementation()

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
