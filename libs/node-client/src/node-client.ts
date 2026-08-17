/* eslint-disable @typescript-eslint/no-explicit-any */
import { GraphQLClient } from 'graphql-request'

import { getSdk } from '../generated/node-sdk'
import { sleep } from '@gwent-oss/utils'

type Sdk = ReturnType<typeof getSdk>

export type GwentOssClient = {
  [K in keyof Sdk]: Sdk[K] extends (vars: infer V) => Promise<infer R>
    ? (vars: V) => Promise<Exclude<R[keyof R], undefined | 'Mutation' | 'Query'>>
    : never
}

/**
 * Configuration options for creating a GwentOssClient.
 */
export interface GwentOssClientOptions {
  /**
   * The URL to the GraphQL server for the gwent-oss instance.
   * For example: https://gwent-oss.com/graphql
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

export interface GwentOssClientOptions {
  graphqlUrl: string
  username?: string
  password?: string
  waitMs?: number
}

export * from '../generated/node-sdk'

/**
 * Creates an instance of a GwentOssClient, which can be used to interact with a gwent-oss GraphQL API.
 *
 * @param config The configuration used to create the GwentOssClient instance.
 * @param config.graphqlUrl The URL to the GraphQL server for the gwent-oss instance (for example: https://gwent-oss.com/graphql).
 * @param config.username An optional username to use for authenticating against the server, required for some Queries/Mutations.
 * @param config.password An optional password to use for authenticating against the server, required for some Queries/Mutations.
 * @param config.waitMs An optional amount of time (in milliseconds) to wait before making each request. Useful to avoid rate-limiting errors.
 * @returns An instance of the GwentOssClient that can be used to interact with the gwent-oss GraphQL API.
 */
export function createGwentOssClient({ graphqlUrl, username, password, waitMs }: GwentOssClientOptions) {
  const headers: Record<string, string> = {}

  if (username && password) {
    headers.Authorization = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64')
  }

  const client = new GraphQLClient(graphqlUrl, {
    headers,
    requestMiddleware: async (request) => {
      if (waitMs) {
        await sleep(waitMs / 1000)
      }
      return request
    },
  })

  const sdk = getSdk(client)

  /**
   * "lift up" response data, so when have response:
   *
   * const response = await client.addUser({ name: 'james-bond', password: '007' })
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

  return wrapped as GwentOssClient
}

export default createGwentOssClient
