import { CgMail } from 'react-icons/cg'
import { SiGithub } from 'react-icons/si'
import urljoin from 'url-join'
import { useLocation } from 'react-router'

import Centered from '../../components/Centered'
import LoginDialog from '../../components/LoginDialog'
import { ROUTES } from '@gwent-oss/constants'
import './Login.css'

/**
 * A page for the user to either log in or create a user.
 *
 * @returns The application login page.
 */
export default function LoginPage() {
  const { pathname } = useLocation()
  const newUser = pathname.startsWith(ROUTES.Signup.path)

  return (
    <div id="loginContainer">
      <div id="loginFields">
        <Centered>
          <LoginDialog
            secondaryLinkLabel={newUser ? 'Log In!' : 'Sign Up!'}
            secondaryLinkPath={newUser ? ROUTES.Login.path : ROUTES.Signup.path}
            secondaryText={newUser ? 'Existing user?' : 'New user?'}
            title={newUser ? 'Sign Up!' : 'Welcome Back!'}
            submitLabel={newUser ? 'Sign Up' : 'Log In'}
            newUser={newUser}
          />
        </Centered>
      </div>
      <div id="loginInfo">
        <div id="loginSiteTitle">gwent-oss</div>
        <div id="loginIcons">
          <a href={window.env.GITHUB_LINK} target="_">
            <SiGithub color="black" />
          </a>
          <a href={`mailto:${window.env.EMAIL_ADDRESS}`}>
            <CgMail color="black" />
          </a>
        </div>
        <div id="loginSiteDescription">An open-source recreation of the card game Gwent with online multiplayer.</div>
        <div id="loginAlert">
          <div id="loginAlertTitle">**Alpha Warning**</div>
          <div id="loginAlertDescription">
            This website is currently in an "alpha" state, meaning it is in a technically playable state but is missing
            some features (mainly Faction and Leader abilities). Please communicate any issues you come across or ideas
            you have as{' '}
            <a href={`${urljoin(window.env.GITHUB_LINK, 'issues')}`} target="_">
              GitHub Issues
            </a>{' '}
            or email us at <a href={`mailto:${window.env.EMAIL_ADDRESS}`}>{window.env.EMAIL_ADDRESS}</a>
          </div>
        </div>
      </div>
    </div>
  )
}
