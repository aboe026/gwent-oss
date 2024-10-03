/**
 * Determines if a given candidate is a valid positive integer.
 *
 * @param candidate The item under consideration for being a positive integer.
 * @param options The options to help determine if the candidate is a positive integer.
 * @param options.allowZero Whether or not 0 is a valid positive integer. Defaults to false.
 * @returns The integer Number if valid.
 * @throws Error if the candidate is not a valid positive integer.
 */
export default function validatePositiveInteger(
  candidate: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  options?: Options
) {
  const candidateType = typeof candidate
  const acceptedTypes = ['bigint', 'number', 'string']
  if (!acceptedTypes.includes(candidateType)) {
    throw Error(
      `Invalid positive integer "${candidate?.toString()}", type "${candidateType}" is not one of the accepted types: "${acceptedTypes.join(
        ', '
      )}"`
    )
  } else {
    const candidateString: string = candidate.toString()
    if (candidateString === '') {
      throw Error(`Invalid positive integer "${candidateString}", must contain numeric characters.`)
    } else if (candidateString.includes('.')) {
      throw Error(`Invalid positive integer "${candidateString}", cannot contain period.`)
    } else if (candidateString.includes('-')) {
      throw Error(`Invalid positive integer "${candidateString}", cannot contain negative symbol.`)
    } else if (!/^[0-9]+$/.test(candidateString)) {
      throw Error(`Invalid positive integer "${candidateString}", must only contain numeric digit characters.`)
    } else if (/^[0]+$/.test(candidateString)) {
      if (options?.allowZero) {
        return 0
      } else {
        throw Error(`Invalid positive integer "${candidateString}", zero is not positive.`)
      }
    } else {
      return Number(candidateString)
    }
  }
}

interface Options {
  allowZero?: boolean
}
