import env from '../../src/env'

describe('env', () => {
  it('exports a Window interface', () => {
    ;(Window as any).env = {}
    expect(env).toEqual(undefined) // after setting isolatedModules to true in the tsconfig.json, checking this doesn't work anymore
    expect((Window as any).env).not.toEqual(undefined)
  })
})
