import AppInfo from '../app-info'
import CardStore from '../database/card-store'
import { LeaderDbObject, UnitDbObject, UserDbObject } from '../database/generated-typings'
import { Resolvers } from './generated-typings'
import scalars from './scalars'
import UserStore from '../database/user-store'
import { version } from '../../package.json'

export const resolvers: Resolvers = {
  ...scalars,
  Leader: {
    // TODO: figure out how to do mapping in automated way. Is @map not working correctly?
    id: (card: LeaderDbObject) => {
      return card._id.toString()
    },
  },
  Unit: {
    // TODO: figure out how to do mapping in automated way. Is @map not working correctly?
    id: (card: UnitDbObject) => {
      return card._id.toString()
    },
  },
  User: {
    // TODO: figure out how to do mapping in automated way. Is @map not working correctly?
    id: (user: UserDbObject) => {
      return user._id.toString()
    },
  },
  Query: {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    leaders: async (parent, args, context, info) => {
      return CardStore.getLeaders()
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    units: async (parent, args, context, info) => {
      return CardStore.getUnits()
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getCurrentUser: (parent, args, context, info) => {
      const user = context?.session?.user
      if (!user) {
        throw Error('No user on session')
      }
      return user
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    version: (parent, args, context, info) => {
      return version
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    build: async (parent, args, context, info) => {
      return AppInfo.getBuildNumber()
    },
  },
  Mutation: {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    addUser: async (parent, args, context, info) => {
      let user: UserDbObject
      try {
        user = await UserStore.addUser(args.name, args.password)
      } catch (err: unknown) {
        if (err instanceof Error && err.message === `User "${args.name}" already exists`) {
          // return error so it won't get obfuscated by generic "Error!" if it were thrown instead
          return err as any // eslint-disable-line @typescript-eslint/no-explicit-any
        }
        throw err
      }
      return user
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    login: async (parent, args, context, info) => {
      let user: UserDbObject
      try {
        user = await UserStore.validateUser(args.name, args.password)
      } catch (err: unknown) {
        if (err instanceof Error && err.message === `Invalid credentials for user "${args.name}"`) {
          // return error so it won't get obfuscated by generic "Error!" if it were thrown instead
          return err as any // eslint-disable-line @typescript-eslint/no-explicit-any
        }
        throw err
      }
      if (!context) {
        context = {
          session: {
            user,
          },
        }
      } else if (!context.session) {
        context.session = {
          user,
        }
      } else {
        context.session.user = user
      }
      return user
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    logout: async (parent, args, context, info) => {
      if (context?.session?.user) {
        delete context.session.user
        return true
      }
      return false
    },
  },
}

export default resolvers
