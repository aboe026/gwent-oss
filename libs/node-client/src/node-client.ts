/* eslint-disable @typescript-eslint/no-explicit-any */
import { GraphQLClient } from 'graphql-request'

import { getSdk } from '../generated/node-sdk'

type Sdk = ReturnType<typeof getSdk>

export type GwentClient = {
  [K in keyof Sdk]: Sdk[K] extends (vars: infer V) => Promise<infer R>
    ? (vars: V) => Promise<Exclude<R[keyof R], undefined | 'Mutation' | 'Query'>>
    : never
}

/**
 * Configuration options for creating a GwentClient.
 */
export interface GwentClientOptions {
  /**
   * The URL to the GraphQL server for the Gwent instance.
   * For example: https://gwent.com/graphql
   */
  graphqlUrl: string

  /**
   * An optional username for authenticating against the server.
   * Required for some Queries/Mutations.
   */
  username?: string

  /**
   * An optional password for authenticating against the server.
   * Required for some Queries/Mutations.
   */
  password?: string
}

export interface GwentClientOptions {
  graphqlUrl: string
  username?: string
  password?: string
}

export * from '../generated/node-sdk'

/**
 * Creates an instance of a GwentClient, which can be used to interact with a Gwent GraphQL API.
 *
 * @param config The configuration used to create the GwentClient instance.
 * @param config.graphqlUrl The URL to the GraphQL server for the Gwent instance (for example: https://gwent.com/graphql).
 * @param config.username An optional username to use for authenticating against the server, required for some Queries/Mutations.
 * @param config.password An optional password to use for authenticating against the server, required for some Queries/Mutations.
 * @returns An instance of the GwentClient that can be used to interact with the Gwent GraphQL API.
 */
export function createGwentClient({ graphqlUrl, username, password }: GwentClientOptions) {
  const headers: Record<string, string> = {}

  if (username && password) {
    headers.Authorization = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64')
  }

  const client = new GraphQLClient(graphqlUrl, {
    headers,
  })

  const sdk = getSdk(client)

  /**
   * "lift up" response data, so when have response:
   *
   * const response = await client.addUser({ name: 'james', password: 'bond' })
   *
   * can access fields with just:
   *
   * response.name
   *
   * instead of:
   *
   * response.addUser.name
   */
  const wrapped = Object.fromEntries(
    Object.entries(sdk).map(([key, fn]) => [
      key,
      async (vars: any) => {
        const result = await (fn as any)(vars)
        const [rootKey] = Object.keys(result)
        return result[rootKey] as Exclude<(typeof result)[typeof rootKey], undefined | 'Mutation' | 'Query'>
      },
    ])
  )

  return wrapped as GwentClient
}

export default createGwentClient
