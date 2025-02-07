export default class PresentableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PresentableError'
    Error.captureStackTrace(this, PresentableError)
  }
}
