import { GraphQLScalarType, Kind } from 'graphql'
import semver from 'semver'

const semverUrl = 'https://semver.org'

const scalars: {
  [x: string]: GraphQLScalarType
} = {
  SemVer: new GraphQLScalarType({
    name: 'SemVer',
    description: `A Semantic Version as defined by ${semverUrl}`,
    /**
     * Called when sending response to client
     *
     * @param outputValue The value as retrieved from backend processes
     * @returns The value sent to the client on respones
     */
    serialize: (outputValue) => {
      return outputValue
    },
    /**
     * Parse the value a user passes when executing a query with variables
     *
     * @param inputValue The value the user provided in a variable
     * @returns The value if it is a valid SemVer
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
     * Parse the value a user passes when executing an inline query
     *
     * @param valueNode The AST Node the user passed
     * @param variables Any variables associated with the GraphQL call
     * @returns The value if it is a valid SemVer
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

export default scalars
