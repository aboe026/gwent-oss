import env from '../../src/env'

describe('env', () => {
  it('exports a Window interface', () => {
    expect(env).not.toEqual(undefined)
  })
})
