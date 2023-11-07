import { createContext, useContext, useState } from 'react'
import { Outlet, useLocation, Navigate } from 'react-router-dom'

import Banner from './components/Banner'
import insecureRoutes from './insecure-routes'
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
  const { loading: getCurrentUserLoading } = useGetCurrentUserQuery({
    notifyOnNetworkStatusChange: true,
    onCompleted(data) {
      if (data.getCurrentUser) {
        setUser(data.getCurrentUser)
      }
    },
  })

  if (getCurrentUserLoading) {
    return <div>Loading...</div>
  }

  const needsLogin = !user && !getCurrentUserLoading && !insecureRoutes.includes(pathname) && pathname !== '/login'
  const needsHome = user && pathname === '/login'

  if (needsHome) {
    return <Navigate to="/" replace />
  } else if (needsLogin) {
    return <Navigate to="/login" replace />
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
