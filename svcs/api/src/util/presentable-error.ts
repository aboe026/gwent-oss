/**
 * A class representing an Error that is safe for the user to see.
 */
export default class PresentableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PresentableError'
    Error.captureStackTrace(this, PresentableError)
  }
}
