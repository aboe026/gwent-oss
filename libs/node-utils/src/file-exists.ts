import fs from 'fs/promises'

/**
 * Check to see if a file exists.
 *
 * @param filePath The path of the file to check the existence of.
 * @returns Returns true if the file exists, false otherwise.
 */
export default async function fileExists(filePath: string): Promise<boolean> {
  let exists = false

  try {
    await fs.access(filePath)
    exists = true
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err: unknown) {
    // swallow
  }

  return exists
}
