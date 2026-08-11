import { CgCheckO, CgUnavailable } from 'react-icons/cg'
import { Link, useLocation } from 'react-router'
import { useEffect, useState } from 'react'
import { useLazyQuery, useMutation } from '@apollo/client/react'

import {
  AddUserDocument,
  CurrentUserDocument,
  CurrentUserQuery,
  LoginDocument,
  UsernameAvailableDocument,
} from '@gwent-oss/graphql-schema/apollo-typings'
import { getErrorMessages } from '../util/error-util'
import {
  HTML_CLASSES,
  HTML_IDS,
  LOCAL_STORAGE,
  PASSWORD_REQUIREMENTS,
  ROUTES,
  USERNAME_REQUIREMENTS,
} from '@gwent-oss/constants'
import LoadingBar from '../components/LoadingBar'
import { validatePassword, validateUsername } from '@gwent-oss/validators'
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
  const [waitingToCheckUsername, setWaitingToCheckUsername] = useState(false)
  const { pathname } = useLocation()
  const [login, { loading: loginLoading, error: loginError }] = useMutation(LoginDocument, {
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
  const [
    usernameAvailable,
    { loading: usernameAvailableLoading, error: usernameAvailableError, data: usernameAvailableData },
  ] = useLazyQuery(UsernameAvailableDocument)
  const [addUser, { loading: addUserLoading, error: addUserError }] = useMutation(AddUserDocument)
  const loading = loginLoading || addUserLoading
  const errorMessages = getErrorMessages(loginError || addUserError)
  const usernameAvailableErrorMessages = getErrorMessages(usernameAvailableError)
  const usernameValidation = validateUsername(username)
  const passwordValidation = validatePassword(password)
  const newUser = pathname === ROUTES.Signup.path
  let submitTitle = loading ? 'Loading...' : submitLabel
  if (newUser && (!usernameValidation.valid || (usernameAvailableData && !usernameAvailableData.usernameAvailable))) {
    submitTitle = 'Invalid username'
  } else if (newUser && !passwordValidation.valid) {
    submitTitle = 'Invalid password'
  }

  useEffect(() => {
    if (!newUser || !username || !usernameValidation.valid) return

    setWaitingToCheckUsername(true)
    const handle = setTimeout(() => {
      usernameAvailable({
        variables: {
          name: username,
        },
      })
      setWaitingToCheckUsername(false)
    }, 1000)

    return () => clearTimeout(handle)
  }, [username, newUser])

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
        localStorage.setItem(LOCAL_STORAGE.Username, username)
      }}
    >
      <div id={HTML_IDS.LoginDialogTitle}>
        <span>{title}</span>
      </div>
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
        {newUser &&
          username !== '' &&
          (usernameValidation.valid ? (
            <div id={HTML_IDS.LoginUsernameAvailableContainer}>
              {usernameAvailableLoading || waitingToCheckUsername ? (
                <LoadingBar height="15px" width="100%" />
              ) : usernameAvailableErrorMessages ? (
                <div>Error checking availability: {usernameAvailableErrorMessages}</div>
              ) : (
                usernameAvailableData !== undefined && (
                  <div className="login-username-validation-field">
                    {usernameAvailableData.usernameAvailable ? (
                      <CgCheckO color="green" size={'13px'} style={{ marginLeft: '2px' }} />
                    ) : (
                      <CgUnavailable color="red" size={'15px'} />
                    )}
                    {usernameAvailableData.usernameAvailable === true ? 'Available to use' : 'Already taken'}
                  </div>
                )
              )}
            </div>
          ) : (
            <div>
              {usernameValidation.tooShort && (
                <div id={HTML_IDS.LoginUsernameShort} className="login-username-validation-field">
                  <CgUnavailable color="red" size={'15px'} />
                  Minimum length: {USERNAME_REQUIREMENTS.Min}
                </div>
              )}
              {usernameValidation.tooLong && (
                <div id={HTML_IDS.LoginUsernameLong} className="login-username-validation-field">
                  <CgUnavailable color="red" size={'15px'} />
                  Maximum length: {USERNAME_REQUIREMENTS.Max}
                </div>
              )}
              {usernameValidation.spaces && (
                <div id={HTML_IDS.LoginUsernameSpaces} className="login-username-validation-field">
                  <CgUnavailable color="red" size={'15px'} />
                  No spaces
                </div>
              )}
              {usernameValidation.badSpecials.size > 0 && (
                <div id={HTML_IDS.LoginUsernameSpecials} className="login-username-validation-field">
                  <CgUnavailable color="red" size={'15px'} />
                  Invalid character{usernameValidation.badSpecials.size > 1 ? 's' : ''}:{' '}
                  {[...usernameValidation.badSpecials].join('')}
                </div>
              )}
            </div>
          ))}
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
        {newUser && password !== '' && !passwordValidation.valid && (
          <div>
            {passwordValidation.tooShort && (
              <div id={HTML_IDS.LoginPasswordShort} className="login-username-validation-field">
                <CgUnavailable color="red" size={'15px'} />
                Minimum length: {USERNAME_REQUIREMENTS.Min}
              </div>
            )}
            {passwordValidation.tooLong && (
              <div id={HTML_IDS.LoginPasswordLong} className="login-username-validation-field">
                <CgUnavailable color="red" size={'15px'} />
                Maximum length: {USERNAME_REQUIREMENTS.Max}
              </div>
            )}
            {passwordValidation.spaces && (
              <div id={HTML_IDS.LoginPasswordSpaces} className="login-username-validation-field">
                <CgUnavailable color="red" size={'15px'} />
                No spaces
              </div>
            )}
            {passwordValidation.noUppercase && (
              <div id={HTML_IDS.LoginPasswordUppercase} className="login-username-validation-field">
                <CgUnavailable color="red" size={'15px'} />
                No uppercase
              </div>
            )}
            {passwordValidation.noLowercase && (
              <div id={HTML_IDS.LoginPasswordLowercase} className="login-username-validation-field">
                <CgUnavailable color="red" size={'15px'} />
                No lowercase
              </div>
            )}
            {passwordValidation.noNumber && (
              <div id={HTML_IDS.LoginPasswordNumbers} className="login-username-validation-field">
                <CgUnavailable color="red" size={'15px'} />
                No number
              </div>
            )}
            {passwordValidation.noSpecial && (
              <div id={HTML_IDS.LoginPasswordNoSpecials} className="login-username-validation-field">
                <CgUnavailable color="red" size={'15px'} />
                No special characters: <br></br>
                {PASSWORD_REQUIREMENTS.Specials.join('')}
              </div>
            )}
            {passwordValidation.badSpecials.size > 0 && (
              <div id={HTML_IDS.LoginPasswordBadSpecials} className="login-username-validation-field">
                <CgUnavailable color="red" size={'15px'} />
                Invalid character{passwordValidation.badSpecials.size > 1 ? 's' : ''}:{' '}
                {[...passwordValidation.badSpecials].join('')}
              </div>
            )}
          </div>
        )}
      </div>
      <div id="loginDialogLower">
        {errorMessages && (
          <span id={HTML_IDS.LoginDialogError} className={HTML_CLASSES.ErrorText}>
            {errorMessages}
          </span>
        )}
        <div id="loginDialogActions">
          <button
            type="submit"
            disabled={
              loading ||
              (newUser && !usernameValidation.valid) ||
              (newUser && !passwordValidation.valid) ||
              (newUser && !usernameAvailableData?.usernameAvailable)
            }
            id={HTML_IDS.LoginDialogSubmit}
            title={submitTitle}
          >
            {submitLabel}
          </button>
        </div>
        {loading && <LoadingBar height="25px" />}
      </div>
    </form>
  )
}

interface LoginDialogProps {
  initialUsername?: string | null | undefined
  secondaryLinkLabel?: string
  secondaryLinkPath?: string
  secondaryText?: string
  submitLabel?: string
  title: string
  usernameDisabled?: boolean
  newUser?: boolean
}
