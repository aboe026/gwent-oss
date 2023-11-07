import { createContext, useContext, useState } from 'react'
import { Outlet, useLocation, Navigate } from 'react-router-dom'

import Banner from './components/Banner'
import insecureRoutes from './insecure-routes'
import { getApolloError } from './util/error-util'
import { NOT_AUTHENTICATED_MESSAGE } from '@gwent/constants'
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
  const {
    data: getCurrentUserData,
    error: getCurrentUserError,
    loading: getCurrentUserLoading,
  } = useGetCurrentUserQuery({
    notifyOnNetworkStatusChange: true,
  })

  if (getCurrentUserLoading) {
    return <div>Loading...</div>
  }

  const getCurrentUserErrors = getApolloError(getCurrentUserError)

  const needsLogin =
    !user &&
    getCurrentUserErrors === NOT_AUTHENTICATED_MESSAGE &&
    !insecureRoutes.includes(pathname) &&
    pathname !== '/login'

  if (needsLogin) {
    return <Navigate to="/login" replace />
  }

  if (!user && getCurrentUserData?.getCurrentUser) {
    setUser({
      id: getCurrentUserData.getCurrentUser?.id,
      name: getCurrentUserData.getCurrentUser?.name,
      created: getCurrentUserData.getCurrentUser?.created,
    })
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
