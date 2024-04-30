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
        mappers: {
          Deck: './database-typings#DeckDbObject',
          Dlc: './database-typings#DlcDbObject',
          Effect: './database-typings#EffectDbObject',
          Faction: './database-typings#FactionDbObject',
          Leader: './database-typings#LeaderDbObject',
          Unit: './database-typings#UnitDbObject',
          User: './database-typings#UserDbObject',
        },
      },
    },
    './generated/apollo-typings.tsx': {
      documents: ['./src/apollo/*.gql'],
      plugins: ['typescript', 'typescript-operations', 'typescript-react-apollo'],
    },
  },
}

export default config
