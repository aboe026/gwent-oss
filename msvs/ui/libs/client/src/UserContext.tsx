import { CheckAuth } from './util/error-util'
import { createContext, useContext } from 'react'
import { User } from '@gwent/graphql-schema/apollo-typings'

type UserContextType = {
  user: User | undefined | null
  checkAuth: CheckAuth
}

const UserContext = createContext<UserContextType>({
  user: undefined,
  checkAuth: () => undefined,
})

const useUserContext = () => useContext(UserContext)

export { UserContext, useUserContext }
