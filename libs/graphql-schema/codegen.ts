import { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  schema: './src/schema.ts',
  generates: {
    './generated/database-typings.ts': {
      plugins: [
        'typescript',
        'typescript-mongodb',
        {
          add: {
            content: [
              `import { MoveType } from '../src/move-type'`,
              `import { EffectReasonType } from '../src/effect-reason-type'`,
            ].join('\n'),
          },
        },
      ],
    },
    './generated/resolver-typings.ts': {
      plugins: ['typescript', 'typescript-resolvers'],
      config: {
        contextType: '../src/context#Context',
      },
    },
    './generated/apollo/': {
      documents: ['./src/apollo/*.gql'],
      preset: 'client',
    },
  },
  hooks: {
    afterAllFileWrite: ['yarn convert-eol'],
  },
}

export default config
