import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

import {
  AddUserMutationVariables,
  LoginMutation,
  useAddUserMutation,
  useLoginMutation,
} from '../graphql/generated-typings'
import Form from '../components/Form'
import { HTML_IDS } from '@gwent/constants'
import { useUserContext } from '../App'

/**
 * A page for the user to either log in or create a user
 *
 * @returns The application login page
 */
export default function LoginPage() {
  const [mode, setMode] = useState(Mode.LOG_IN)
  const navigate = useNavigate()
  const { setUser } = useUserContext()
  const [login, { loading: loginLoading, error: loginError }] = useLoginMutation({
    onCompleted: async (data: LoginMutation) => {
      if (!data?.login?.name || !data?.login?.id) {
        console.error(`Invalid data returned from login mutation: "${JSON.stringify(data)}"`)
      } else {
        setUser({
          name: data.login.name,
          id: data.login.id,
        })
        navigate('/')
      }
    },
    update(cache, { data }) {
      cache.modify({
        fields: {
          getCurrentUser() {
            return data?.login
          },
        },
      })
    },
  })
  const [addUser, { loading: addUserLoading, error: addUserError }] = useAddUserMutation()
  const addUserAndLogin = async ({ variables }: { variables: AddUserMutationVariables }) => {
    await addUser({
      variables,
    })
    await login({
      variables,
    })
  }

  return (
    <Form
      title={mode === Mode.LOG_IN ? 'Log In' : 'Sign Up'}
      id={HTML_IDS.LoginForm}
      cancelLabel={mode === Mode.LOG_IN ? 'New user? Sign up!' : 'Existing user? Log in!'}
      submitLabel={mode === Mode.LOG_IN ? 'Log in' : 'Sign up'}
      onSubmit={mode === Mode.LOG_IN ? login : addUserAndLogin}
      loading={loginLoading || addUserLoading}
      error={loginError || addUserError}
      onClose={setMode}
      closeParams={mode === Mode.LOG_IN ? Mode.SIGN_UP : Mode.LOG_IN}
      fields={[
        {
          key: HTML_IDS.LoginUsername,
          label: 'Username',
          type: 'text',
          required: true,
        },
        {
          key: HTML_IDS.LoginPassword,
          label: 'Password',
          type: 'password',
          required: true,
        },
      ]}
    />
  )
}

enum Mode {
  LOG_IN = 'log-in',
  SIGN_UP = 'sign-up',
}
