import { ROUTES } from '@gwent/constants'
import Centered from '../components/Centered'
import LoginDialog from '../components/LoginDialog'

/**
 * A page for the user to create an account
 *
 * @returns The application login page
 */
export default function SignupPage() {
  return (
    <Centered>
      <LoginDialog
        secondaryLinkLabel="Log In!"
        secondaryLinkPath={ROUTES.Login.path}
        secondaryText="Existing user?"
        submitLabel="Sign Up"
        title="Welcome!"
      />
    </Centered>
  )
}
