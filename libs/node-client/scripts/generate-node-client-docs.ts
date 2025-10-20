import {
  buildSchema,
  graphql,
  getIntrospectionQuery,
  GraphQLObjectType,
  GraphQLType,
  getNamedType,
  isScalarType,
  isObjectType,
  isUnionType,
} from 'graphql'
import fs from 'fs/promises'
import path from 'path'

// TODO: add description
//
;(async () => {
  const schemaContents = await fs.readFile(path.join(__dirname, '../../graphql-schema/generated/complete-schema.gql'), {
    encoding: 'utf-8',
  })
  const schema = buildSchema(schemaContents)
  const introspectionResult = await graphql({
    schema,
    source: getIntrospectionQuery(),
  })
  if (!introspectionResult.data) {
    throw Error(`Failed to introspect schema: "${JSON.stringify(introspectionResult.errors)}"`)
  }

  const docOutputDir = path.join(__dirname, '../generated/docs')
  await fs.rm(docOutputDir, {
    recursive: true,
    force: true,
  })
  await fs.mkdir(docOutputDir, {
    recursive: true,
  })

  const queryType = schema.getQueryType()
  const mutationType = schema.getMutationType()
  if (queryType) {
    await generateOperations({
      rootType: queryType,
      operationType: 'query',
      outputDir: docOutputDir,
    })
  }
  if (mutationType) {
    await generateOperations({
      rootType: mutationType,
      operationType: 'mutation',
      outputDir: docOutputDir,
    })
  }
})().catch((err) => {
  console.error(err)
  process.exitCode = 1
})

async function generateOperations({
  rootType,
  operationType,
  outputDir,
}: {
  rootType: GraphQLObjectType
  operationType: 'query' | 'mutation'
  outputDir: string
}) {
  const fields = Object.values(rootType.getFields())

  for (const field of fields) {
    const args = field.args

    const variableDefs = args.map((arg) => `$${arg.name}: ${arg.type.toString()}`).join(', ')

    const argPass = args.map((arg) => `${arg.name}: $${arg.name}`).join(', ')

    const selection = buildSelectionSet({ type: field.type })

    const operationHeader = variableDefs
      ? `${operationType} ${field.name}(${variableDefs})`
      : `${operationType} ${field.name}`

    const fieldCall = argPass ? `${field.name}(${argPass})` : field.name

    const operation = `${operationHeader} {\n  ${fieldCall} ${selection}\n}`

    const filePath = path.join(outputDir, `${field.name}.gql`)
    await fs.writeFile(filePath, operation)
  }
}

function buildSelectionSet({ type, depth = 0 }: { type: GraphQLType; depth?: number }): string {
  const namedType = getNamedType(type)
  const indent = '  '.repeat(depth + 2)
  const blockIndent = '  '.repeat(depth + 1)

  if (isScalarType(namedType)) return ''

  if (isObjectType(namedType)) {
    const fields = Object.values(namedType.getFields()).map((field) => {
      const fieldType = getNamedType(field.type)
      if (isScalarType(fieldType)) return `${indent}${field.name}`
      const nested = buildSelectionSet({ type: field.type, depth: depth + 1 })
      return `${indent}${field.name} ${nested}`
    })
    return `{\n${fields.join('\n')}\n${blockIndent}}`
  }

  if (isUnionType(namedType)) {
    const unionSelections = namedType.getTypes().map((member) => {
      const nested = buildSelectionSet({ type: member, depth: depth + 1 })
      return `${indent}... on ${member.name} ${nested}`
    })
    return `{\n${unionSelections.join('\n')}\n${blockIndent}}`
  }

  return ''
}
