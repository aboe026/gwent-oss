import { GraphQLClient, gql } from 'graphql-request'

import env from './env'

export default class ApiClient {
  private static client = new GraphQLClient(env.API_URL)

  static async getLeaders() {
    const response: any = await ApiClient.client.request(
      gql`
        query {
          leaders {
            id
            name
            faction
            dlc
          }
        }
      `
    )
    return response.leaders
  }

  static async getUnits() {
    const response: any = await ApiClient.client.request(
      gql`
        query {
          units {
            id
            name
            occurrences
            faction
            dlc
            hero
            combats
            strength
            effects
            scorchScope
            scorchMin
            musterPrefix
          }
        }
      `
    )
    return response.units
  }
}
