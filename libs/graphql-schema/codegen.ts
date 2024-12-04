import { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  schema: './src/schema.ts',
  generates: {
    './generated/database-typings.ts': {
      plugins: ['typescript', 'typescript-mongodb'],
    },
    './generated/resolver-typings.ts': {
      plugins: ['typescript', 'typescript-resolvers'],
      config: {
        contextType: '../src/context#Context',
      },
    },
    './generated/apollo-typings.tsx': {
      documents: ['./src/apollo/*.gql'],
      plugins: ['typescript', 'typescript-operations', 'typescript-react-apollo'],
    },
  },
  hooks: {
    afterAllFileWrite: ['yarn convert-eol'],
  },
}

export default config
