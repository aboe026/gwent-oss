import { ApolloClient, ApolloConsumer, ApolloError } from '@apollo/client'
import { createContext, useContext, useEffect, useState } from 'react'
import { IconContext } from 'react-icons'
import { Outlet, useLocation, Navigate } from 'react-router-dom'

import Banner from './components/Banner'
import Centered from './components/Centered'
import { CurrentUserDocument, CurrentUserQuery, useCurrentUserQuery, User } from '@gwent/graphql-schema/apollo-typings'
import { getApolloError } from './util/error-util'
import { getRouteFromPath } from './util/route-util'
import LoadingSpinner from './components/LoadingSpinner'
import LoginDialog from './components/LoginDialog'
import { NOT_AUTHENTICATED_MESSAGE, ROUTES } from '@gwent/constants'
import WholeScreenDialog from './components/WholeScreenDialog'

const AUTH_TIMEOUT_ID = 'AUTH_TIMEOUT_ID'

const UserContext = createContext<UserContextType>({
  user: undefined,
  checkAuth: () => undefined,
})

const useUserContext = () => useContext(UserContext)

export { useUserContext }

export default function App() {
  const { pathname } = useLocation()
  // eslint-disable-next-line @typescript-eslint/ban-types
  const [reAuthFuncs, setReAuthFuncs] = useState<Function[]>([])
  const [preLoginPath] = useState(pathname === ROUTES.Logout.path ? ROUTES.Home.path : pathname)
  const { loading: currentUserLoading, data: currentUserData } = useCurrentUserQuery({
    notifyOnNetworkStatusChange: true, // makes sure "currentUserData" gets set to "undefined" when cache changed
    nextFetchPolicy: 'cache-only', // makes sure the query does not immediately run after cache changed
  })

  useEffect(() => {
    if (currentUserData?.currentUser?.id !== AUTH_TIMEOUT_ID) {
      for (const reAuthFunc of reAuthFuncs) {
        reAuthFunc()
      }
      setReAuthFuncs([])
    }
  }, [currentUserData])

  const user = currentUserData?.currentUser
  const authTimedOut = user?.id === AUTH_TIMEOUT_ID
  const loggedIn = !!user?.id && !authTimedOut
  const loginOrSignup = [ROUTES.Login.path, ROUTES.Signup.path].includes(pathname)

  if (currentUserLoading) {
    return (
      <Centered>
        <LoadingSpinner size="200px" />
      </Centered>
    )
  }

  const route = getRouteFromPath(pathname)
  const needsLogin = !loggedIn && !currentUserLoading && !authTimedOut && route?.secure && !loginOrSignup
  const needsHome = loggedIn && loginOrSignup

  if (needsHome) {
    return (
      <Navigate
        to={
          !preLoginPath || preLoginPath === ROUTES.Login.path || preLoginPath === ROUTES.Signup.path
            ? ROUTES.Home.path
            : preLoginPath
        }
        replace
      />
    )
  } else if (needsLogin) {
    return (
      <ApolloConsumer>
        {(client: ApolloClient<object>) => {
          client.resetStore()
          return <Navigate to={ROUTES.Login.path} replace />
        }}
      </ApolloConsumer>
    )
  }

  return (
    <ApolloConsumer>
      {(client: ApolloClient<object>) => {
        // eslint-disable-next-line @typescript-eslint/ban-types
        function checkAuth(error: ApolloError | undefined, callbackAfterReauth?: Function) {
          const resolvedError = getApolloError(error)
          if (resolvedError.includes(NOT_AUTHENTICATED_MESSAGE)) {
            if (callbackAfterReauth) {
              setReAuthFuncs((previous) => [...previous, callbackAfterReauth])
            }
            const existingUser = client.readQuery<CurrentUserQuery>({ query: CurrentUserDocument })
            if (existingUser?.currentUser) {
              client.writeQuery<CurrentUserQuery>({
                query: CurrentUserDocument,
                data: {
                  currentUser: {
                    ...existingUser.currentUser,
                    id: AUTH_TIMEOUT_ID,
                  },
                },
                broadcast: true,
              })
            }
          }
          throw Error(resolvedError)
        }

        return (
          <UserContext.Provider value={{ user: loggedIn || authTimedOut ? user : undefined, checkAuth }}>
            <IconContext.Provider value={{ color: 'white' }}>
              <Banner />
              {authTimedOut && (
                <WholeScreenDialog style={{ zIndex: 200 }}>
                  <Centered>
                    <LoginDialog
                      initialUsername={user?.name}
                      secondaryLinkLabel="Change User"
                      secondaryLinkPath={ROUTES.Logout.path}
                      secondaryText="Not You?"
                      title="Session Timed Out"
                      usernameDisabled={true}
                    />
                  </Centered>
                </WholeScreenDialog>
              )}
              <Outlet />
            </IconContext.Provider>
          </UserContext.Provider>
        )
      }}
    </ApolloConsumer>
  )
}

type UserContextType = {
  user: User | undefined | null
  // eslint-disable-next-line @typescript-eslint/ban-types
  checkAuth: (error: ApolloError | undefined, callbackAfterReauth: Function) => void
}
