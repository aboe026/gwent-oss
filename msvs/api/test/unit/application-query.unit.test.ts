import { AppInfo } from '@gwent-oss/node-utils'
import ApplicationQuery from '../../src/graphql/resolvers/queries/application-query'
import { Context } from '@gwent-oss/graphql-schema/context'
import TestUtil from '../util/test-util'
import { version } from '../../package.json'

describe('application-query', () => {
  describe('application', () => {
    it('calls out to AppInfo to get build number', async () => {
      await testApplication({})
    })
    it('logs to trace if enabled', async () => {
      await testApplication({
        traceEnabled: true,
      })
    })
  })
})

async function testApplication({ traceEnabled }: { traceEnabled?: boolean }) {
  const build = 3
  const context: Context = {
    session: {
      user: TestUtil.getDbUser({}),
    },
  }
  const logPrefix = `application by "${context.session?.user?._id}"`
  const getBuildNumberSpy = jest.spyOn(AppInfo, 'getBuildNumber').mockResolvedValue(build)
  const traceSpy = jest.fn().mockImplementation()
  ApplicationQuery['logger'] = {
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  await expect(ApplicationQuery.application(context, null as any)).resolves.toEqual({
    build,
    version,
  })

  expect(getBuildNumberSpy.mock.calls).toEqual([['app-info.json']])
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [`${logPrefix} args: "{}"`],
          [`${logPrefix} requested fields: "[]"`],
          [`${logPrefix} requested arguments: "[]"`],
          [`${logPrefix} build: "${build}"`],
          [`${logPrefix} version: "${version}"`],
        ]
      : []
  )
}
