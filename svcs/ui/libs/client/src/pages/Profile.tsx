import moment from 'moment'
import { useNavigate } from 'react-router-dom'

import Centered from '../components/Centered'
import { HTML_IDS } from '@gwent/constants'
import routes from '../routes'
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

  return (
    <Centered>
      <div id={HTML_IDS.Profile}>
        <table>
          <tbody>
            <tr>
              <td>Username:</td>
              <td id={HTML_IDS.ProfileUsername}>{user?.name}</td>
            </tr>
            <tr>
              <td>Created:</td>
              <td id={HTML_IDS.ProfileCreated}>{moment(user?.created).format('MMMM Do, YYYY')}</td>
            </tr>
          </tbody>
        </table>
        <button
          type="button"
          id={HTML_IDS.ProfileLogout}
          onClick={() => {
            navigate(routes.Logout.path)
          }}
        >
          Logout
        </button>
      </div>
    </Centered>
  )
}
