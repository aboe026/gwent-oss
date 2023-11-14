import { CodegenConfig } from '@graphql-codegen/cli'
import { TypeScriptResolversPluginConfig } from '@graphql-codegen/typescript-resolvers'

const resolverConfig: TypeScriptResolversPluginConfig = {
  mappers: {
    Leader: '../database/generated-typings#LeaderDbObject',
    Unit: '../database/generated-typings#UnitDbObject',
    User: '../database/generated-typings#UserDbObject',
  },
}

const config: CodegenConfig = {
  schema: '../../svcs/api/src/graphql/schema.ts',
  generates: {
    '../../svcs/api/src/graphql/generated-typings.ts': {
      plugins: ['typescript', 'typescript-resolvers'],
      config: resolverConfig,
    },
    '../../test/e2e/src/graphql/resolver/generated-typings.ts': {
      plugins: ['typescript', 'typescript-resolvers'],
      config: resolverConfig,
    },
    '../../svcs/api/src/database/generated-typings.ts': {
      plugins: ['typescript', 'typescript-mongodb'],
    },
    '../../test/e2e/src/graphql/database/generated-typings.ts': {
      plugins: ['typescript', 'typescript-mongodb'],
    },
    '../../svcs/ui/libs/client/src/graphql/generated-typings.tsx': {
      documents: ['../../svcs/ui/libs/client/src/graphql/*.gql'],
      plugins: ['typescript', 'typescript-operations', 'typescript-react-apollo'],
    },
  },
}

export default config
