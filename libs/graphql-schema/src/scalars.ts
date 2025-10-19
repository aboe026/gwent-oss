import { GraphQLScalarType, Kind } from 'graphql'
import moment from 'moment'
import semver from 'semver'

import { DATE_TIME_FORMAT } from '@gwent/constants'

const semverUrl = 'https://semver.org'

const scalars: {
  [x: string]: GraphQLScalarType
} = {
  DateTime: new GraphQLScalarType({
    name: 'DateTime',
    description: 'The UTC ISO-8601 standard for time and duration display (YYYY-MM-DDTHH:mm:ss.SSSZ)',
    /**
     * Called when sending response to client.
     *
     * @param outputValue The value as retrieved from backend processes.
     * @returns The value sent to the client on responses.
     */
    serialize: (outputValue) => {
      return outputValue
    },
    /**
     * Parse the value a user passes when executing a query with variables.
     *
     * @param inputValue The value the user provided in a variable.
     * @returns The value if it is a valid SemVer.
     * @throws {Error} if the value is not a string.
     */
    parseValue: (inputValue) => {
      if (typeof inputValue === 'string') {
        return validateDateTime(inputValue)
      } else {
        throw Error(`Invalid DateTime "${String(inputValue)}", type "${typeof inputValue}" must be "string".`)
      }
    },
    /**
     * Parse the value a user passes when executing an inline query.
     *
     * @param valueNode The AST Node the user passed.
     * @param variables Any variables associated with the GraphQL call.
     * @returns The value if it is a valid SemVer.
     * @throws {Error} if the AST Node is not a String.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    parseLiteral: (valueNode, variables) => {
      if (valueNode.kind === Kind.STRING) {
        return validateDateTime(valueNode.value)
      } else {
        throw Error(`Invalid DateTime, kind "${valueNode.kind}" must be "String".`)
      }
    },
  }),
  SemVer: new GraphQLScalarType({
    name: 'SemVer',
    description: `A Semantic Version as defined by ${semverUrl}`,
    /**
     * Called when sending response to client.
     *
     * @param outputValue The value as retrieved from backend processes.
     * @returns The value sent to the client on responses.
     */
    serialize: (outputValue) => {
      return outputValue
    },
    /**
     * Parse the value a user passes when executing a query with variables.
     *
     * @param inputValue The value the user provided in a variable.
     * @returns The value if it is a valid SemVer.
     * @throws {Error} if the value is not a valid SemVer.
     */
    parseValue: (inputValue) => {
      if (typeof inputValue === 'string') {
        if (semver.valid(inputValue)) {
          return inputValue
        } else {
          throw Error(`Invalid SemVer "${inputValue}", must follow specifications found at "${semverUrl}".`)
        }
      } else {
        throw Error(`Invalid SemVer "${String(inputValue)}", type "${typeof inputValue}" must be "string".`)
      }
    },
    /**
     * Parse the value a user passes when executing an inline query.
     *
     * @param valueNode The AST Node the user passed.
     * @param variables Any variables associated with the GraphQL call.
     * @returns The value if it is a valid SemVer.
     * @throws {Error} if the AST Node is not a String.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    parseLiteral: (valueNode, variables) => {
      if (valueNode.kind === Kind.STRING) {
        return valueNode.value
      } else {
        throw Error(`Invalid SemVer, kind "${valueNode.kind}" must be "String".`)
      }
    },
  }),
}

/**
 * Returns a Date object if it matches the format "YYYY-MM-DDTHH:mm:ss.SSSZ".
 *
 * @param dateTime The string to turn into a Date if of the valid format.
 * @returns The Date representation of the dateTime string.
 * @throws {Error} if the string is not of the valid format "YYYY-MM-DDTHH:mm:ss.SSSZ".
 */
export function validateDateTime(dateTime: string): Date {
  if (!moment(dateTime, DATE_TIME_FORMAT, true).isValid()) {
    throw Error(`Invalid DateTime "${dateTime}", must be of format "${DATE_TIME_FORMAT}".`)
  }
  return moment(dateTime, DATE_TIME_FORMAT).toDate()
}

export default scalars
