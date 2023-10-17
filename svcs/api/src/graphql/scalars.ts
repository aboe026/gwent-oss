import { GraphQLScalarType, Kind } from 'graphql'
import semver from 'semver'

const scalars: {
  [x: string]: GraphQLScalarType
} = {
  SemVer: new GraphQLScalarType({
    name: 'SemVer',
    description: 'A Semantic Version as defined by https://semver.org',
    serialize: (outputValue) => {
      return outputValue
    },
    parseValue: (inputValue) => {
      if (typeof inputValue === 'string') {
        if (semver.valid(inputValue)) {
          return inputValue
        } else {
          throw Error(`Invalid SemVer "${inputValue}", must follow specifications found at "https://semver.org/".`)
        }
      } else {
        throw Error(`Invalid SemVer "${String(inputValue)}", type "${typeof inputValue}" must be "string".`)
      }
    },
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
