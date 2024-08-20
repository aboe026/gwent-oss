import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import {
  CurrentUserDocument,
  CurrentUserQuery,
  useAddUserMutation,
  useLoginMutation,
} from '@gwent/graphql-schema/apollo-typings'
import { getApolloError } from '../util/error-util'
import { HTML_CLASSES, HTML_IDS, ROUTES } from '@gwent/constants'
import LoadingBar from '../components/LoadingBar'
import './LoginDialog.css'

/**
 * A dialog where the user can authenticate with the application
 *
 * @returns An application login dialog
 */
export default function LoginDialog({
  initialUsername,
  secondaryText,
  secondaryLinkLabel,
  secondaryLinkPath,
  submitLabel = 'Log In',
  title,
  usernameDisabled,
}: LoginDialogProps) {
  const [username, setUsername] = useState(initialUsername || '')
  const [password, setPassword] = useState('')
  const { pathname } = useLocation()
  const [login, { loading: loginLoading, error: loginError }] = useLoginMutation({
    update(cache, { data }) {
      if (data?.login?.id && data.login.name) {
        cache.writeQuery<CurrentUserQuery>({
          query: CurrentUserDocument,
          data: {
            currentUser: data.login,
          },
        })
      }
    },
  })
  const [addUser, { loading: addUserLoading, error: addUserError }] = useAddUserMutation()
  const loading = loginLoading || addUserLoading
  const resolvedError = getApolloError(loginError || addUserError)
  const newUser = pathname === ROUTES.Signup.path

  return (
    <form
      id={HTML_IDS.LoginDialogContainer}
      style={{ marginTop: loading ? '30px' : '0' }}
      onSubmit={async (event) => {
        event.preventDefault()
        const variables = {
          name: username,
          password,
        }
        if (newUser) {
          await addUser({ variables })
        }
        await login({ variables })
      }}
    >
      <div id={HTML_IDS.LoginDialogTitle}>
        <span>{title}</span>
      </div>
      <div id="loginDialogFields">
        <div className="login-dialog-field">
          <label htmlFor="username">
            Username
            <span className="required-field">*</span>
          </label>
          <input
            type="text"
            required
            autoFocus={!initialUsername}
            id={HTML_IDS.LoginDialogUsername}
            name="username"
            value={username}
            disabled={loading || usernameDisabled}
            onChange={(event) => setUsername(event.target.value)}
          />
        </div>
        <div className="login-dialog-field">
          <label htmlFor="password">
            Password
            <span className="required-field">*</span>
          </label>
          <input
            type="password"
            id={HTML_IDS.LoginDialogPassword}
            autoFocus={!!initialUsername}
            name="password"
            value={password}
            required
            disabled={loading}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
      </div>
      <div id="loginDialogLower">
        {resolvedError && (
          <span id={HTML_IDS.LoginDialogError} className={HTML_CLASSES.ErrorText}>
            {resolvedError}
          </span>
        )}
        <div id="loginDialogActions">
          {secondaryText && (
            <div id="loginDialogSwitch">
              <span>{secondaryText}</span>
              {secondaryLinkLabel && secondaryLinkPath && (
                <Link id={HTML_IDS.LoginDialogModeSwitch} to={secondaryLinkPath}>
                  {secondaryLinkLabel}
                </Link>
              )}
            </div>
          )}
          <button type="submit" disabled={loading} id={HTML_IDS.LoginDialogSubmit}>
            {submitLabel}
          </button>
        </div>
        {loading && <LoadingBar height="25px" />}
      </div>
    </form>
  )
}

interface LoginDialogProps {
  title: string
  initialUsername?: string
  usernameDisabled?: boolean
  submitLabel?: string
  secondaryText?: string
  secondaryLinkLabel?: string
  secondaryLinkPath?: string
}
