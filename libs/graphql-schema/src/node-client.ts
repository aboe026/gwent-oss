import { GraphQLClient } from 'graphql-request'

import { getSdk } from '../generated/node-sdk'

export class GwentClient {
  private sdk: ReturnType<typeof getSdk>
  private url: string
  private username: string
  private password: string

  constructor({ url, username, password }: { url: string; username: string; password: string }) {
    this.url = url
    this.username = username
    this.password = password
    this.sdk = this.buildSdk()
    this.bindSdkMethods()
  }

  private buildSdk(): ReturnType<typeof getSdk> {
    const client = new GraphQLClient(this.url, {
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${this.username}:${this.password}`).toString('base64'),
      },
    })
    return getSdk(client)
  }

  private bindSdkMethods() {
    Object.keys(this.sdk).forEach((key) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(this as any)[key] = (this.sdk as any)[key]
    })
  }

  authenticate({ username, password }: { username: string; password: string }) {
    this.username = username
    this.password = password
    this.sdk = this.buildSdk()
    this.bindSdkMethods()
  }
}
