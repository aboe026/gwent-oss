import env from '../../src/env'

describe('env', () => {
  it('exports a Window interface', () => {
    ;(Window as any).env = {} // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(env).toEqual(undefined) // after setting isolatedModules to true in the tsconfig.json, checking this doesn't work anymore
    expect((Window as any).env).not.toEqual(undefined) // eslint-disable-line @typescript-eslint/no-explicit-any
  })
})
