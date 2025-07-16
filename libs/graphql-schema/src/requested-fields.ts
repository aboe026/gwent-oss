import { GraphQLResolveInfo, SelectionNode, Kind } from 'graphql'

/**
 * A class to help determine which GraphQL fields
 * a user is requesting on an operation
 */
export default class RequestedFields {
  /**
   * Get all fields a user is requesting.
   *
   * @param info The info passed to the operation.
   * @param node The node to inspect, used for recursion.
   * @returns An array of all fields requested by the user on the operation.
   */
  static getFieldsRequested(info: GraphQLResolveInfo | undefined, node?: SelectionNode): string[] {
    const fields: string[] = []
    const nodes: SelectionNode[] = []
    if (node) {
      nodes.push(node)
    } else if (info?.fieldNodes) {
      nodes.push(...info.fieldNodes)
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

  /**
   * Whether or not a field was requested by a user.
   *
   * @param info The info passed to the operation.
   * @param field The field to check if it was requested.
   * @returns True if the field was requested, false if not.
   */
  static isRequested(info: GraphQLResolveInfo | undefined, field: string): boolean {
    const fieldsRequsted = RequestedFields.getFieldsRequested(info)
    for (const fieldRequested of fieldsRequsted) {
      if (fieldRequested.endsWith(field)) {
        return true
      }
    }
    return false
  }

  /**
   * Returns all arguments requested by a user.
   *
   * @param info The info passed to the operation.
   * @param node The node to inspect, used for recursion.
   * @returns An array of all field arguments requested by a user.
   */
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

  /**
   * The value of a specific argument a user could request.
   *
   * @param info The info passed to the operation.
   * @param path The path of the argument to get the potential value of.
   * @returns The value of the specific argument if a user specified one, undefined otherwise.
   */
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
