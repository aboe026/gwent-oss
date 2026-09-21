/**
 * Gets the cardinal position of a number.
 *
 * @param num The number to turn into a cardinal position.
 * @returns The number in cardinal notation.
 */
export default function ordinalizeNumber(num: number): string {
  let cardinal = `${num}`

  if (cardinal.endsWith('1') && !cardinal.endsWith('11')) {
    cardinal += 'st'
  }
  if (cardinal.endsWith('2') && !cardinal.endsWith('12')) {
    cardinal += 'nd'
  }
  if (cardinal.endsWith('3') && !cardinal.endsWith('13')) {
    cardinal += 'rd'
  }

  return cardinal
}
