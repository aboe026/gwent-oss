import { useNavigate } from 'react-router-dom'

import Centered from '../components/Centered'
import { HTML_IDS } from '@gwent/constants'
import { ROUTES } from '@gwent/constants'
import { useTitle } from '../components/TabTitle'
import { useUserContext } from '../App'

import './Profile.css'

/**
 * The home page of the application
 *
 * @returns The application home page
 */
export default function ProfilePage() {
  const { user } = useUserContext()
  const navigate = useNavigate()
  useTitle('Profile | Gwent')

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
      <div id={HTML_IDS.Profile}>
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
          className="pointable"
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
