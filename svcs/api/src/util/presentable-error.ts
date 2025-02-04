export default class PresentableError extends Error {
  code: number

  constructor({ message, code }: { message: string; code: number }) {
    super(message)
    this.name = 'PresentableError'
    this.code = code
    Error.captureStackTrace(this, PresentableError)
  }
}
