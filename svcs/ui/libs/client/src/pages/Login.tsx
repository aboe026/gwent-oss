import Centered from '../components/Centered'
import LoginDialog from '../components/LoginDialog'
import { ROUTES } from '@gwent/constants'

/**
 * A page for the user to either log in or create a user.
 *
 * @returns The application login page.
 */
export default function LoginPage() {
  return (
    <Centered>
      <LoginDialog
        secondaryLinkLabel="Sign Up!"
        secondaryLinkPath={ROUTES.Signup.path}
        secondaryText="New User?"
        title="Welcome Back!"
      />
    </Centered>
  )
}
