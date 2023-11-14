import { GraphQLClient, gql } from 'graphql-request'

import env from '../util/env'
import { MutationAddUserArgs, User } from './resolver/generated-typings'

export default class ApiClient {
  private static client = new GraphQLClient(env.API_URL)

  static async addUser({ name, password }: MutationAddUserArgs): Promise<User> {
    const response: any = await ApiClient.client.request(
      gql`
        mutation AddUser($name: String!, $password: String!) {
          addUser(name: $name, password: $password) {
            id
            name
          }
        }
      `,
      {
        name,
        password,
      }
    )
    return response.addUser
  }
}
