import { useNavigate } from 'react-router'

import Centered from '../../components/Centered'
import { HTML_IDS } from '@gwent-oss/constants'
import { ROUTES } from '@gwent-oss/constants'
import { useTitle } from '../../components/TabTitle'
import { useUserContext } from '../../UserContext'
import './Profile.css'

/**
 * A page containing information about the authenticated user.
 *
 * @returns The users profile page.
 */
export default function ProfilePage() {
  const { user } = useUserContext()
  const navigate = useNavigate()
  useTitle('Profile | gwent-oss')

  let created = ''
  if (user?.created) {
    created = new Date(user.created).toLocaleDateString('en-us', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <Centered>
      <div id={HTML_IDS.ProfileContainer}>
        <table>
          <caption>Profile</caption>
          <tbody>
            <tr>
              <td>Username:</td>
              <td id={HTML_IDS.ProfileUsername}>{user?.name}</td>
            </tr>
            <tr>
              <td>Created:</td>
              <td id={HTML_IDS.ProfileCreated}>{created}</td>
            </tr>
          </tbody>
        </table>
        <button
          type="button"
          id={HTML_IDS.ProfileLogout}
          onClick={() => {
            navigate(ROUTES.Logout.path)
          }}
        >
          Logout
        </button>
      </div>
    </Centered>
  )
}
