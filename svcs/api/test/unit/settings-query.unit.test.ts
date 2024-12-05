import { Context } from '@gwent/graphql-schema/context'
import * as env from '../../src/env'
import { SettingKey, SettingType } from '@gwent/graphql-schema/resolver-typings'
import SettingsQuery from '../../src/graphql/resolvers/queries/settings-query'
import TestUtil from '../test-util'

describe('settings-query', () => {
  describe('settings', () => {
    it('returns settings with values from env', () => {
      testSettings({})
    })
    it('logs to trace if enabled', () => {
      testSettings({
        traceEnabled: true,
      })
    })
  })
})

function testSettings({ traceEnabled }: { traceEnabled?: boolean }) {
  const context: Context = {
    session: {
      user: TestUtil.getDbUser({}),
    },
  }
  const logPrefix = `settings by "${context.session?.user?._id}"`
  const sessionTimeout = 30
  jest.spyOn(env, 'default').mockReturnValue({
    SESSION_TIMEOUT_SECONDS: sessionTimeout,
  } as any)
  const traceSpy = jest.fn().mockImplementation()
  SettingsQuery['logger'] = {
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  expect(SettingsQuery.settings(context, null as any)).toEqual([
    {
      key: SettingKey.SessionTimeoutSeconds,
      type: SettingType.Number,
      label: 'Session Timeout (seconds)',
      value: sessionTimeout.toString(),
    },
  ])

  expect(traceSpy.mock.calls).toEqual(
    traceEnabled ? [[`${logPrefix} requested fields: "[]"`], [`${logPrefix} requested arguments: "[]"`]] : []
  )
}
