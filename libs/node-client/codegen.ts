import { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  schema: '../graphql-schema/src/schema.gql',
  generates: {
    './generated/node-sdk.ts': {
      documents: ['./generated/docs/*.gql'],
      plugins: ['typescript', 'typescript-operations', 'typescript-graphql-request'],
    },
  },
}

export default config
