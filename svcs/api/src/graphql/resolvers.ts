import AppInfo from '../app-info'
import CardStore from '../database/card-store'
import { LeaderDbObject, UnitDbObject } from '../database/generated-typings'
import { Resolvers } from './generated-typings'
import scalars from './scalars'
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
    version: (parent, args, context, info) => {
      return version
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    build: async (parent, args, context, info) => {
      return AppInfo.getBuildNumber()
    },
  },
}

export default resolvers
