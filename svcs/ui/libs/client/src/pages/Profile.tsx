import { useNavigate } from 'react-router-dom'

import { getApolloError } from '../util/error-util'
import { HTML_IDS } from '@gwent/constants'
import { useLogoutMutation } from '../graphql/generated-typings'
import { useUserContext } from '../App'

import './Profile.css'

/**
 * The home page of the application
 *
 * @returns The application home page
 */
export default function ProfilePage() {
  const { user, setUser } = useUserContext()
  const navigate = useNavigate()
  const [logout, { loading: logoutLoading, error: logoutError }] = useLogoutMutation({
    onCompleted: async () => {
      setUser(undefined)
      navigate('/')
    },
    update(cache, {}) {
      cache.modify({
        fields: {
          getCurrentUser() {
            return undefined
          },
        },
      })
    },
  })

  return (
    <div id={HTML_IDS.Profile}>
      <div id="usernameContainer">
        <div>Username:</div>
        <div id={HTML_IDS.ProfileUsername}>{user?.name}</div>
      </div>
      <button type="button" id={HTML_IDS.ProfileLogout} disabled={logoutLoading} onClick={() => logout()}>
        Logout
      </button>
      {logoutError && <div id={HTML_IDS.ProfileLogoutError}>{`Error logging out: ${getApolloError(logoutError)}`}</div>}
    </div>
  )
}
