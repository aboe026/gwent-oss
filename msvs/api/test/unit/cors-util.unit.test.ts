import CorsUtil from '../../src/util/cors-util'

describe('cors-util', () => {
  describe('resolveCorsOrigin', () => {
    it('returns original corsOrigin if not HTTP or HTTPS protocol and not default port', () => {
      testTesolveCorsOrigin({
        corsOrigin: 'mongodb://localhost:27017',
        expected: 'mongodb://localhost:27017',
      })
    })
    it('returns original corsOrigin if HTTP protocol and not default port', () => {
      testTesolveCorsOrigin({
        corsOrigin: 'http://localhost:443',
        expected: 'http://localhost:443',
      })
    })
    it('returns original corsOrigin if HTTPS protocol and not default port', () => {
      testTesolveCorsOrigin({
        corsOrigin: 'https://localhost:80',
        expected: 'https://localhost:80',
      })
    })
    it('returns original corsOrigin if not HTTP or HTTPS protocol and default port', () => {
      testTesolveCorsOrigin({
        corsOrigin: 'mongodb://localhost:443',
        expected: 'mongodb://localhost:443',
      })
    })
    it('removes 80 if HTTP protocol and default port', () => {
      testTesolveCorsOrigin({
        corsOrigin: 'http://localhost:80',
        expected: 'http://localhost',
        debugCalls: [['Removing explicit HTTP default port 80']],
      })
    })
    it('removes 443 if HTTPS protocol and default port', () => {
      testTesolveCorsOrigin({
        corsOrigin: 'https://localhost:443',
        expected: 'https://localhost',
        debugCalls: [['Removing explicit HTTPS default port 443']],
      })
    })
    it('removes trailing forward slash if present', () => {
      testTesolveCorsOrigin({
        corsOrigin: 'https://localhost/',
        expected: 'https://localhost',
      })
    })
  })
})

function testTesolveCorsOrigin({
  corsOrigin,
  expected,
}: {
  corsOrigin: string
  expected: string
  debugCalls?: string[][]
}) {
  const traceSpy = jest.fn().mockImplementation()
  CorsUtil['logger'] = {
    trace: traceSpy,
  } as any

  expect(CorsUtil.resolveCorsOrigin(corsOrigin)).toEqual(expected)

  expect(traceSpy.mock.calls).toEqual([[`resolvedCorsOrigin: "${expected}"`]])
}
