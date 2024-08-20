import { GraphQLResolveInfo, SelectionNode, Kind } from 'graphql'

export default class RequestedFields {
  static getFieldsRequested(info: GraphQLResolveInfo | undefined, node?: SelectionNode): string[] {
    const fields: string[] = []
    const nodes: SelectionNode[] = []
    if (node) {
      nodes.push(node)
    } else if (info?.fieldNodes) {
      const fieldNodes = info.fieldNodes as SelectionNode[]
      if (fieldNodes) {
        nodes.push(...fieldNodes)
      }
    }
    for (const node of nodes) {
      if (node.kind === Kind.FIELD && node.name.value) {
        let hasSubfields = false
        if (node.selectionSet?.selections) {
          for (const subNode of node.selectionSet.selections) {
            const nestedFields = RequestedFields.getFieldsRequested(info, subNode)
            for (const nestedField of nestedFields) {
              hasSubfields = true
              fields.push(`${node.name.value}.${nestedField}`)
            }
          }
        }
        if (!hasSubfields) {
          fields.push(node.name.value)
        }
      } else if (node.kind === Kind.FRAGMENT_SPREAD) {
        const fragment = (info as GraphQLResolveInfo).fragments[node.name.value]
        if (fragment.selectionSet.selections) {
          for (const subNode of fragment.selectionSet.selections) {
            const nestedFields = RequestedFields.getFieldsRequested(info, subNode)
            for (const nestedField of nestedFields) {
              fields.push(nestedField)
            }
          }
        }
      }
      // support InlineFragmentNode (for unions)
    }
    return fields
  }

  static isRequested(info: GraphQLResolveInfo | undefined, field: string): boolean {
    const fieldsRequsted = RequestedFields.getFieldsRequested(info)
    for (const fieldRequested of fieldsRequsted) {
      if (fieldRequested.endsWith(field)) {
        return true
      }
    }
    return false
  }

  static getArguments(info: GraphQLResolveInfo | undefined, node?: SelectionNode): FieldArguments[] {
    const args: FieldArguments[] = []
    const nodes: SelectionNode[] = []
    if (node) {
      nodes.push(node)
    } else if (info?.fieldNodes) {
      nodes.push(...info.fieldNodes)
    }
    const variables = info?.variableValues
    for (const node of nodes) {
      if (node.kind === Kind.FIELD && node.name.value) {
        if (node.arguments) {
          for (const argument of node.arguments) {
            if (argument.value.kind === Kind.BOOLEAN || argument.value.kind === Kind.STRING) {
              args.push({
                path: `${node.name.value}.${argument.name.value}`,
                value: argument.value.value,
              })
            } else if (argument.value.kind === Kind.VARIABLE && variables) {
              args.push({
                path: `${node.name.value}.${argument.name.value}`,
                value: variables[argument.value.name.value],
              })
            }
          }
        }
        if (node.selectionSet?.selections) {
          for (const subNode of node.selectionSet.selections) {
            const nestedArguments = RequestedFields.getArguments(info, subNode)
            for (const nestedArgument of nestedArguments) {
              args.push({
                path: `${node.name.value}.${nestedArgument.path}`,
                value: nestedArgument.value,
              })
            }
          }
        }
      } else if (node.kind === Kind.FRAGMENT_SPREAD) {
        const fragment = info?.fragments[node.name.value]
        if (fragment) {
          for (const subNode of fragment.selectionSet.selections) {
            const nestedArgs = RequestedFields.getArguments(info, subNode)
            for (const nestedArg of nestedArgs) {
              args.push({
                path: nestedArg.path,
                value: nestedArg.value,
              })
            }
          }
        }
      }
      // support InlineFragmentNode (for unions)
    }
    return args
  }

  static getArgument<T>(info: GraphQLResolveInfo | undefined, path: string): T | undefined {
    const requestedArgs = RequestedFields.getArguments(info)
    for (const argument of requestedArgs) {
      if (argument.path.endsWith(path)) {
        return argument.value as T
      }
    }
  }
}

interface FieldArguments {
  path: string
  value: any // eslint-disable-line @typescript-eslint/no-explicit-any
}
