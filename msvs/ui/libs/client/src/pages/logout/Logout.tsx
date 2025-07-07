import { useNavigate } from 'react-router'

import Centered from '../../components/Centered'
import { CurrentUserDocument, CurrentUserQuery, useLogoutMutation, User } from '@gwent/graphql-schema/apollo-typings'
import { getApolloError } from '../../util/error-util'
import { HTML_CLASSES, HTML_IDS } from '@gwent/constants'
import LoadingSpinner from '../../components/LoadingSpinner'
import { ROUTES } from '@gwent/constants'
import './Logout.css'

/**
 * A page to log the user out of the application.
 *
 * @returns The application logout page.
 */
export default function LogoutPage() {
  const navigate = useNavigate()
  const [logout, { loading: logoutLoading, error: logoutError, data: logoutData }] = useLogoutMutation({
    // eslint-disable-next-line no-empty-pattern
    update(cache, {}) {
      const existingUser = cache.readQuery<CurrentUserQuery>({ query: CurrentUserDocument })
      if (existingUser?.currentUser) {
        cache.updateQuery<CurrentUserQuery>(
          {
            query: CurrentUserDocument,
            broadcast: true,
          },
          (previous) => ({
            currentUser: {
              ...(previous?.currentUser as User),
              id: '',
            },
          })
        )
      }
    },
  })

  if (!logoutLoading && !logoutData && !logoutError) {
    logout()
  }

  return (
    <Centered>
      {logoutLoading ? (
        <LoadingSpinner size="200px" />
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
          <div id="logoutContainer">
            <span id={HTML_IDS.LogoutMessage} className={logoutError ? HTML_CLASSES.ErrorText : ''}>
              {`Error logging out: ${getApolloError(logoutError)}`}
            </span>
            <button id="logoutRetry" type="reset" onClick={() => logout} autoFocus={true}>
              Retry
            </button>
          </div>
        </form>
      )}
    </Centered>
  )
}
