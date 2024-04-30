import { useNavigate } from 'react-router-dom'

import Centered from '../components/Centered'
import { CurrentUserDocument, CurrentUserQuery, useLogoutMutation } from '@gwent/graphql-schema/apollo-typings'
import { getApolloError } from '../util/error-util'
import { HTML_CLASSES, HTML_IDS } from '@gwent/constants'
import LoadingSpinner from '../components/LoadingSpinner'
import { ROUTES } from '@gwent/constants'
import './Logout.css'

/**
 * A page to log the user out of the application
 *
 * @returns The application logout page
 */
export default function LogoutPage() {
  const navigate = useNavigate()
  const [logout, { loading: logoutLoading, error: logoutError, data: logoutData }] = useLogoutMutation({
    update(cache, {}) {
      const existingUser = cache.readQuery<CurrentUserQuery>({ query: CurrentUserDocument })
      if (existingUser?.currentUser) {
        cache.writeQuery<CurrentUserQuery>({
          query: CurrentUserDocument,
          data: {
            currentUser: {
              ...existingUser.currentUser,
              id: '',
            },
          },
          broadcast: true,
        })
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
          <div className="logout-container">
            <span id={HTML_IDS.LogoutMessage} className={logoutError ? HTML_CLASSES.ErrorText : ''}>
              {`Error logging out: ${getApolloError(logoutError)}`}
            </span>
            <button className="pointable" type="reset" onClick={() => logout} autoFocus={true}>
              Retry
            </button>
          </div>
        </form>
      )}
    </Centered>
  )
}
