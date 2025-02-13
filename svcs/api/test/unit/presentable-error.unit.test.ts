import PresentableError from '../../src/util/presentable-error'

describe('presentable-error', () => {
  it('has correct name', () => {
    expect(new PresentableError('')).toHaveProperty('name', 'PresentableError')
  })
  it('has correct message', () => {
    expect(new PresentableError('toast')).toHaveProperty('message', 'toast')
  })
})
