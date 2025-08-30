import { CodegenConfig } from '@graphql-codegen/cli'
import { DIRECTIVES } from '@graphql-codegen/typescript-mongodb'
import fs from 'fs'
import { makeExecutableSchema } from '@graphql-tools/schema'
import path from 'path'
import { printSchema } from 'graphql/utilities'

const config: CodegenConfig = {
  schema: './src/schema.gql',
  generates: {
    // emit raw SDL for tools (like VSCode extension GraphQL.vscode-graphql)
    './generated/schema.graphql': {
      plugins: [
        'schema-ast',
        {
          add: {
            content: printSchema(
              makeExecutableSchema({
                typeDefs: [DIRECTIVES],
              })
            ),
          },
        },
      ],
      config: {
        includeDirectives: true,
      },
    },
    // emit typescript file for consumption by makeExecutableSchema in api
    './generated/schema.ts': {
      plugins: [
        {
          add: {
            content: "import gql from 'graphql-tag';\nexport const typeDefs = gql`",
          },
        },
        {
          add: {
            content: getSchemaWithoutDirectives(path.join(__dirname, 'src', 'schema.gql')),
          },
        },
        {
          add: {
            content: '`;',
          },
        },
      ],
    },
    // typings for types of objects stored in the database
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
    // typings for GraphQL types to return to end user
    './generated/resolver-typings.ts': {
      plugins: ['typescript', 'typescript-resolvers'],
      config: {
        contextType: '../src/context#Context',
      },
    },
    // typings for use by Apollo/React in the frontend browser code
    './generated/apollo/': {
      documents: ['./src/apollo/*.gql'],
      preset: 'client',
      presetConfig: {
        fragmentMasking: false,
      },
    },
  },
  hooks: {
    afterAllFileWrite: ['yarn add-graphql-to-apollo', 'yarn convert-eol'],
  },
}

/**
 * Gets the GraphQL schema in plaintext without any directives
 *
 * @param schemaFilePath The path to the .gql file containing the schema to strip directives of.
 * @returns The plaintext string of the GraphQL schema, with directives removed.
 */
function getSchemaWithoutDirectives(schemaFilePath: string): string {
  return fs
    .readFileSync(schemaFilePath, {
      encoding: 'utf-8',
    })
    .replaceAll(/@.*{/g, '{') // remove all "@directive {" but preserve {
    .replaceAll(/@.*\)/g, '') //remove all "@directive(....)"
    .replaceAll(/@.*/g, '') // remove all "@directive"
}

export default config
