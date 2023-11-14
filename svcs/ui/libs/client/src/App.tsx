import { createContext, useContext, useState } from 'react'
import { Outlet, useLocation, Navigate } from 'react-router-dom'

import Banner from './components/Banner'
import Centered from './components/Centered'
import { getRouteFromPath } from './util/route-util'
import { ROUTES } from '@gwent/constants'
import Spinner from './components/Spinner'
import { useGetCurrentUserQuery, User } from './graphql/generated-typings'

const UserContext = createContext<UserContextType>({
  user: undefined,
  setUser: () => undefined,
})

const useUserContext = () => useContext(UserContext)

export { useUserContext }

export default function App() {
  const { pathname } = useLocation()
  const [user, setUser] = useState<User | undefined>()
  const [preLoginPath] = useState(pathname === ROUTES.Logout.path ? ROUTES.Home.path : pathname)
  const [previousSessionChecked, setPreviousSessionChecked] = useState(false)
  const { loading: getCurrentUserLoading, data: getCurrentUserData } = useGetCurrentUserQuery()

  // page is initially loading and has previous session still valid
  // ensures when user performs "logout" they get properly redirected to "login"
  const previousSessionValid = !previousSessionChecked && !user && getCurrentUserData?.getCurrentUser

  if (getCurrentUserLoading || previousSessionValid) {
    if (previousSessionValid && getCurrentUserData.getCurrentUser) {
      setUser(getCurrentUserData?.getCurrentUser)
      setPreviousSessionChecked(true)
    }
    return (
      <Centered>
        <Spinner size="200px" />
      </Centered>
    )
  }

  const route = getRouteFromPath(pathname)
  const needsLogin = !user && !getCurrentUserLoading && route?.secure && route?.path !== ROUTES.Login.path
  const needsHome = user && route?.path === ROUTES.Login.path

  if (needsHome) {
    return <Navigate to={preLoginPath || ROUTES.Home.path} replace />
  } else if (needsLogin) {
    return <Navigate to={ROUTES.Login.path} replace />
  }

  return (
    <UserContext.Provider value={{ user, setUser }}>
      <Banner />
      <Outlet />
    </UserContext.Provider>
  )
}

type UserContextType = {
  user: User | undefined
  setUser: (user: User | undefined) => void
}
