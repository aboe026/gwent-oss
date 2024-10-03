import { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  schema: './src/schema.mts',
  generates: {
    './generated/database-typings.ts': {
      plugins: ['typescript', 'typescript-mongodb'],
    },
    './generated/resolver-typings.ts': {
      plugins: ['typescript', 'typescript-resolvers'],
    },
    './generated/apollo-typings.tsx': {
      documents: ['./src/apollo/*.gql'],
      plugins: ['typescript', 'typescript-operations', 'typescript-react-apollo'],
    },
  },
  emitLegacyCommonJSImports: false,
  hooks: {
    afterAllFileWrite: ['yarn convert-eol', 'yarn rename-ts-to-mts'],
  },
}

export default config
