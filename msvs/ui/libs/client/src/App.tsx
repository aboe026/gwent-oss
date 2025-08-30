import { createContext, useContext, useEffect, useState } from 'react'
import { IconContext } from 'react-icons'
import { Outlet, useLocation, Navigate } from 'react-router'
import { useQuery, useApolloClient } from '@apollo/client/react'

import Banner from './components/Banner'
import Centered from './components/Centered'
import { CheckAuth, getApolloError } from './util/error-util'
import { CurrentUserDocument, CurrentUserQuery, User } from '@gwent/graphql-schema/apollo-typings'
import { getRouteFromPath } from './util/route-util'
import LoadingSpinner from './components/LoadingSpinner'
import LoginDialog from './components/LoginDialog'
import { NOT_AUTHENTICATED_MESSAGE, ROUTES } from '@gwent/constants'
import WholeScreenDialog from './components/WholeScreenDialog'
import ConnectionStatus from './ConnectionStatus'
import Subscriptions from './Subscriptions'

const AUTH_TIMEOUT_ID = 'AUTH_TIMEOUT_ID'

const UserContext = createContext<UserContextType>({
  user: undefined,
  checkAuth: () => undefined,
})

const useUserContext = () => useContext(UserContext)

export { useUserContext }

/**
 * The main component of the Application, under which everything else is rendered.
 *
 * @returns The main application component.
 */
export default function App() {
  const client = useApolloClient()
  const { pathname } = useLocation()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  const [reAuthFuncs, setReAuthFuncs] = useState<Function[]>([])
  const [preLoginPath, setPreLoginPath] = useState(pathname === ROUTES.Logout.path ? ROUTES.Home.path : pathname)
  const { loading: currentUserLoading, data: currentUserData } = useQuery(CurrentUserDocument, {
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
  const justLoggedOut = !user?.id && user?.name

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
    client.resetStore()
    if (justLoggedOut) {
      setPreLoginPath('')
    }
    return <Navigate to={ROUTES.Login.path} replace />
  }

  /**
   * Verifies the user is still authenticated. If not, present dialog for them to re-authenticate.
   *
   * @param error The error thrown by the request.
   * @param callbackAfterReauth The functions to re-perform if user re-authenticates.
   */
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  function checkAuth(error: unknown, callbackAfterReauth?: Function) {
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
        <ConnectionStatus>
          <Subscriptions>
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
          </Subscriptions>
        </ConnectionStatus>
      </IconContext.Provider>
    </UserContext.Provider>
  )
}

type UserContextType = {
  user: User | undefined | null
  checkAuth: CheckAuth
}
