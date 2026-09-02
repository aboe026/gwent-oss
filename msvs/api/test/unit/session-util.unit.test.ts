import * as env from '../../src/env'
import * as nodeUtils from '@gwent-oss/node-utils'
import SessionUtil from '../../src/util/session-util'

describe('session-util', () => {
  describe('getSessionSecret', () => {
    it('returns environment variable if no file contents', async () => {
      await testGetSessionSecret({
        envResponse: 'sessionSecretFromEnv',
        getFileContentsResponse: undefined,
        expected: 'sessionSecretFromEnv',
        envCalls: [[], []],
      })
    })
    it('returns file contents over environment variable', async () => {
      await testGetSessionSecret({
        envResponse: 'sessionSecretFromEnv',
        getFileContentsResponse: 'sessionSecretFromFile',
        expected: 'sessionSecretFromFile',
        envCalls: [[]],
      })
    })
  })
})

async function testGetSessionSecret({
  envResponse,
  getFileContentsResponse,
  expected,
  envCalls,
}: {
  envResponse: string
  getFileContentsResponse: string | undefined
  expected: string
  envCalls: any[][]
}) {
  const sessionSecretFile = 'session-secret-file.txt'
  const envSpy = jest.spyOn(env, 'default').mockReturnValue({
    SESSION_SECRET: envResponse,
    SESSION_SECRET_FILE: sessionSecretFile,
  } as any)
  const getFileContentsSpy = jest.spyOn(nodeUtils, 'getFileContents').mockResolvedValue(getFileContentsResponse)
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  SessionUtil['logger'] = {
    debug: debugSpy,
    trace: traceSpy,
  } as any

  await expect(SessionUtil.getSessionSecret()).resolves.toEqual(expected)

  expect(envSpy.mock.calls).toEqual(envCalls)
  expect(getFileContentsSpy.mock.calls).toEqual([[sessionSecretFile]])
  expect(debugSpy.mock.calls).toEqual([
    [`Using session secret from ${getFileContentsResponse ? 'file' : 'environment variable'}`],
  ])
  expect(traceSpy.mock.calls).toEqual([[`SESSION_SECRET_FILE: "${sessionSecretFile}"`]])
}
