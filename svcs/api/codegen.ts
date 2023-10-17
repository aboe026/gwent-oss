import { CodegenConfig } from '@graphql-codegen/cli'
import { TypeScriptResolversPluginConfig } from '@graphql-codegen/typescript-resolvers'

const resolverConfig: TypeScriptResolversPluginConfig = {
  mappers: {
    Leader: '../database/generated-typings#LeaderDbObject',
    Unit: '../database/generated-typings#UnitDbObject',
  },
}

const config: CodegenConfig = {
  schema: 'src/graphql/schema.ts',
  generates: {
    'src/graphql/generated-typings.ts': {
      plugins: ['typescript', 'typescript-resolvers'],
      config: resolverConfig,
    },
    'src/database/generated-typings.ts': {
      plugins: ['typescript', 'typescript-mongodb'],
    },
    '../ui/libs/client/src/graphql/generated-typings.tsx': {
      documents: ['../ui/libs/client/src/graphql/*.gql'],
      plugins: ['typescript', 'typescript-operations', 'typescript-react-apollo'],
    },
  },
}

export default config
