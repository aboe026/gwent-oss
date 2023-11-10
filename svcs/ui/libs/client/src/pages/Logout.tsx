import { useNavigate } from 'react-router-dom'

import Centered from '../components/Centered'
import { getApolloError } from '../util/error-util'
import { HTML_IDS } from '@gwent/constants'
import routes from '../routes'
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

  return (
    <Centered>
      {logoutLoading ? (
        <Spinner size="200px" />
      ) : (
        <form
          onSubmit={async (event) => {
            event.preventDefault()
            navigate(routes.Login.path)
          }}
          onReset={async (event) => {
            event.preventDefault()
            logout()
          }}
        >
          {logoutError ? (
            <div id={HTML_IDS.ProfileLogoutError} className="logout-message">
              <span id="logoutError">{`Error logging out: ${getApolloError(logoutError)}`}</span>
              <button type="reset" onClick={() => logout} autoFocus={true}>
                Retry
              </button>
            </div>
          ) : (
            <div id={HTML_IDS.ProfileLogoutSuccess} className="logout-message">
              <span>Successfully logged out!</span>
              <button type="submit" autoFocus={true}>
                Log in
              </button>
            </div>
          )}
        </form>
      )}
    </Centered>
  )
}
