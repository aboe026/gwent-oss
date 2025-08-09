/**
 * A class representing an Error that is safe for the user to see.
 */
export default class PresentableError extends Error {
  /**
   * Create an instance of a PresentableError with a specific message.
   *
   * @param message The message the error should present to the user.
   */
  constructor(message: string) {
    super(message)
    this.name = 'PresentableError'
    Error.captureStackTrace(this, PresentableError)
  }
}
