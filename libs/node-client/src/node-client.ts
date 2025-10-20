/* eslint-disable @typescript-eslint/no-explicit-any */
import { GraphQLClient } from 'graphql-request'

import { getSdk } from '../generated/node-sdk'

type Sdk = ReturnType<typeof getSdk>

export type GwentClient = {
  [K in keyof Sdk]: Sdk[K] extends (vars: infer V) => Promise<infer R>
    ? (vars: V) => Promise<Exclude<R[keyof R], undefined | 'Mutation' | 'Query'>>
    : never
}

export * from '../generated/node-sdk'

// TODO: change to function?
// TODO: add jsdocs
export const createClient = ({
  graphqlUrl,
  username,
  password,
}: {
  graphqlUrl: string
  username?: string
  password?: string
}) => {
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
