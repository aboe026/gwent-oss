import { graphql } from 'graphql'
import { ObjectId } from 'mongodb'

import env from '../../src/env'
import schema from '../../src/graphql/executable-schema'
import { SettingKey, SettingType } from '@gwent/graphql-schema/resolver-typings'

describe('settings', () => {
  it('returns session timeout', async () => {
    await expect(
      graphql({
        schema,
        source: `{
          settings {
            key
            label
            type
            value
          }
        }`,
        contextValue: {
          session: {
            user: {
              _id: new ObjectId(),
            },
          },
        },
      })
    ).resolves.toEqual({
      data: {
        settings: [
          {
            key: SettingKey.SessionTimeoutSeconds,
            type: SettingType.Number,
            label: 'Session Timeout (seconds)',
            value: env().SESSION_TIMEOUT_SECONDS.toString(),
          },
        ],
      },
    })
  })
})
