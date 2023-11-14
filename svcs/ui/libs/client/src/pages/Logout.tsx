import { useNavigate } from 'react-router-dom'

import Centered from '../components/Centered'
import { getApolloError } from '../util/error-util'
import { HTML_IDS } from '@gwent/constants'
import { ROUTES } from '@gwent/constants'
import Spinner from '../components/Spinner'
import { useUserContext } from '../App'
import { useLogoutMutation } from '../graphql/generated-typings'
import './Logout.css'

/**
 * A page to log the user out of the application
 *
 * @returns The application logout page
 */
export default function LogoutPage() {
  const { setUser } = useUserContext()
  const navigate = useNavigate()
  const [logout, { loading: logoutLoading, error: logoutError, data: logoutData }] = useLogoutMutation({
    onCompleted: async () => {
      setUser(undefined)
    },
  })

  if (!logoutLoading && !logoutData && !logoutError) {
    logout()
  }

  const message = logoutError ? `Error logging out: ${getApolloError(logoutError)}` : 'Successfully logged out!'

  return (
    <Centered>
      {logoutLoading ? (
        <Spinner size="200px" />
      ) : (
        <form
          id={HTML_IDS.LogoutForm}
          onSubmit={async (event) => {
            event.preventDefault()
            navigate(ROUTES.Login.path)
          }}
          onReset={async (event) => {
            event.preventDefault()
            logout()
          }}
        >
          <div className="logout-container">
            <span id={HTML_IDS.LogoutMessage}>{message}</span>
            {logoutError ? (
              <button type="reset" onClick={() => logout} autoFocus={true}>
                Retry
              </button>
            ) : (
              <button id={HTML_IDS.LogoutLogin} type="submit" autoFocus={true}>
                Log in
              </button>
            )}
          </div>
        </form>
      )}
    </Centered>
  )
}
