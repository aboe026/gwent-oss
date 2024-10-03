import Centered from '../components/Centered.jsx'
import LoginDialog from '../components/LoginDialog.jsx'
import { ROUTES } from '@gwent/constants'

/**
 * A page for the user to create an account.
 *
 * @returns The application sign-up page.
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
