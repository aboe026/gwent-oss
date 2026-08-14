import 'testcafe'

import { USERNAME_REQUIREMENTS } from '@gwent-oss/constants'

export interface E2eCtx {
  start: number
}

// @ts-expect-error Overriding context type
export interface E2ETestController<FixtureCtxType, TestCtxType> extends TestController {
  ctx: TestCtxType
  fixtureCtx: FixtureCtxType
}

// @ts-expect-error Used to override the default TestController with E2eTestController
interface E2eTest<FixtureCtxType, TestCtxType> extends TestFn {
  (
    name: string,
    fn: (t: E2ETestController<FixtureCtxType, TestCtxType>) => Promise<any>
  ): E2eTest<FixtureCtxType, TestCtxType>
  page(url: string): this
  httpAuth(credentials: HTTPAuthCredentials): this
  before(fn: (t: E2ETestController<FixtureCtxType, TestCtxType>) => Promise<any>): this
  after(fn: (t: E2ETestController<FixtureCtxType, TestCtxType>) => Promise<any>): this
  skip: this
  only: this
  disablePageCaching: this
  disablePageReloads: this
  meta(key: string, value: unknown): this
  meta(data: Metadata): this
  requestHooks(...hooks: object[]): this
  clientScripts(scripts: ClientScript | ClientScript[]): this
  timeouts(testTimeouts: TestTimeouts): this
  skipJsErrors(
    options?: boolean | SkipJsErrorsOptionsObject | SkipJsErrorsCallback | SkipJsErrorsCallbackWithOptionsObject
  ): this
}

// @ts-expect-error Used to override the default TestController with E2eTestController
interface E2EFixture<FixtureCtxType, TestCtxType> extends FixtureFn {
  (name: string | TemplateStringsArray, ...tagArgs: any[]): this
  page(url: string | TemplateStringsArray, ...tagArgs: any[]): this
  httpAuth(credentials: HTTPAuthCredentials): this
  before(fn: (ctx: FixtureCtxType, info: FixtureInfo) => Promise<any>): this
  after(fn: (ctx: FixtureCtxType, info: FixtureInfo) => Promise<any>): this
  beforeEach(fn: (t: E2ETestController<FixtureCtxType, TestCtxType>) => Promise<any>): this
  afterEach(fn: (t: E2ETestController<FixtureCtxType, TestCtxType>) => Promise<any>): this
  skip: this
  only: this
  disablePageCaching: this
  disablePageReloads: this
  disableConcurrency: this
  meta(key: string, value: unknown): this
  meta(data: Metadata): this
  requestHooks(...hooks: object[]): this
  clientScripts(scripts: ClientScript | ClientScript[]): this
  skipJsErrors(
    options?: boolean | SkipJsErrorsOptionsObject | SkipJsErrorsCallback | SkipJsErrorsCallbackWithOptionsObject
  ): this
}

export function getFixtureCtx<FixtureCtxType, TestCtxType>() {
  return fixture as E2EFixture<FixtureCtxType, TestCtxType>
}

export function getTestCtx<FixtureCtxType, TestCtxType>() {
  return test as E2eTest<FixtureCtxType, TestCtxType>
}

export function getScenario(t: E2ETestController<E2eCtx, E2eCtx>, trim = true): string {
  const scenario: string = (t as any).testRun.test.fixture.name.replace(/ /g, '-').toLowerCase()
  return trim ? scenario.substring(0, USERNAME_REQUIREMENTS.Max / 2) : scenario
}
