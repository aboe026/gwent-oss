import env from '../../src/env.mjs'

describe('env', () => {
  it('exports a Window interface', () => {
    expect(env).not.toEqual(undefined)
  })
})
