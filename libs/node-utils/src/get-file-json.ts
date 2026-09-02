import getFileContents from './get-file-contents'

/**
 * Gets the contents of a file as JSON.
 *
 * @param filePath The path on the system for the file to read contents of.
 * @returns The contents of the file as JSON, or undefined if the file does not exist or cannot access.
 */
export default async function getFileJson<T>(filePath: string): Promise<T | undefined> {
  const contents = await getFileContents(filePath)
  if (contents) {
    try {
      const json = JSON.parse(contents)
      return json as T
    } catch (err: unknown) {
      throw Error(`Cannot read file "${filePath}" as JSON`, {
        cause: err,
      })
    }
  }
}
