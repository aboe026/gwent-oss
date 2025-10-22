/**
 * Generates a random number within a range.
 *
 * @param config The configuration used to generate the random number.
 * @param config.min The lowest value the generated number can be.
 * @param config.max The highest value the generated number can be.
 * @returns A random number within the range specified.
 */
export default function getRandomNumber({ min, max }: { min: number; max: number }): number {
  if (min > max) {
    throw new Error(`Min "${min}" must be less than or equal to Max "${max}"`)
  }
  return Math.floor(Math.random() * (max - min + 1)) + min
}
