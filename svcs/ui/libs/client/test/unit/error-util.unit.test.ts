import { getApolloError } from '../../src/util/error-util'

describe('error-util', () => {
  describe('getApolloError', () => {
    it('returns empty string if undefined', () => {
      expect(getApolloError(undefined)).toEqual('')
    })
    it('returns message if error has message but no networkError', () => {
      const error = 'toast'
      expect(
        getApolloError({
          message: error,
        } as any)
      ).toEqual(error)
    })
    it('returns networkError results if one exists', () => {
      const error = 'toast'
      expect(
        getApolloError({
          networkError: {
            result: {
              errors: [
                {
                  message: error,
                },
              ],
            },
          },
          message: 'other error',
        } as any)
      ).toEqual(error)
    })
    it('returns networkError results if multiple exist', () => {
      const error1 = 'toast'
      const error2 = 'jelly'
      expect(
        getApolloError({
          networkError: {
            result: {
              errors: [
                {
                  message: error1,
                },
                {
                  message: error2,
                },
              ],
            },
          },
          message: 'other error',
        } as any)
      ).toEqual(`${error1}\n${error2}`)
    })
  })
})
