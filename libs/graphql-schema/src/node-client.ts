import { GraphQLClient } from 'graphql-request'

import { getSdk } from '../generated/node-sdk'

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

  return getSdk(client)
}
