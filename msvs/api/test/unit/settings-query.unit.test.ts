import { Context } from '@gwent-oss/graphql-schema/context'
import * as env from '../../src/env'
import Permissions from '../../src/graphql/permissions'
import { SettingKey, SettingType } from '@gwent-oss/graphql-schema/resolver-typings'
import SettingsQuery from '../../src/graphql/resolvers/queries/settings-query'
import TestUtil from '../util/test-util'
import { UserDbObject } from '@gwent-oss/graphql-schema/database-typings'

describe('settings-query', () => {
  describe('settings', () => {
    it('throws error if isAuthenticated throws error', async () => {
      await testSettings({
        isAuthenticatedResponse: Error('isAuthenticated error'),
      })
    })
    it('returns settings with values from env', () => {
      testSettings({
        isAuthenticatedResponse: TestUtil.getDbUser({}),
      })
    })
    it('logs to trace if enabled', () => {
      testSettings({
        isAuthenticatedResponse: TestUtil.getDbUser({}),
        traceEnabled: true,
      })
    })
  })
})

function testSettings({
  isAuthenticatedResponse,
  traceEnabled,
}: {
  isAuthenticatedResponse: UserDbObject | Error
  traceEnabled?: boolean
}) {
  const context: Context = {
    session: {
      user: isAuthenticatedResponse instanceof Error ? undefined : isAuthenticatedResponse,
    },
  }
  const logPrefix = `settings by "${context.session?.user?._id}"`
  const sessionTimeout = 30
  const isAuthenticatedSpy = jest.spyOn(Permissions, 'isAuthenticated').mockImplementation(() => {
    if (isAuthenticatedResponse instanceof Error) {
      throw isAuthenticatedResponse
    } else {
      return isAuthenticatedResponse
    }
  })
  jest.spyOn(env, 'default').mockReturnValue({
    SESSION_TIMEOUT_SECONDS: sessionTimeout,
  } as any)
  const traceSpy = jest.fn().mockImplementation()
  SettingsQuery['logger'] = {
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  if (isAuthenticatedResponse instanceof Error) {
    expect(() => SettingsQuery.settings(context, null as any)).toThrow(isAuthenticatedResponse)
  } else {
    expect(SettingsQuery.settings(context, null as any)).toEqual([
      {
        key: SettingKey.SessionTimeoutSeconds,
        type: SettingType.Number,
        label: 'Session Timeout (seconds)',
        value: sessionTimeout.toString(),
      },
    ])
  }

  expect(isAuthenticatedSpy.mock.calls).toEqual([
    [
      {
        context,
        label: 'settings query',
      },
    ],
  ])
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [`${logPrefix} args: "{}"`],
          [`${logPrefix} requested fields: "[]"`],
          [`${logPrefix} requested arguments: "[]"`],
        ]
      : []
  )
}
