import fs from 'fs/promises'

import fileExists from './file-exists'
import isDirectory from './is-directory'

/**
 * Gets the contents of a file as a string.
 *
 * @param filePath The path on the system for the file to read contents of.
 * @returns The contents of the file as a string, or undefined if the file does not exist or cannot access.
 */
export default async function getFileContents(filePath: string | undefined): Promise<string | undefined> {
  if (filePath && (await fileExists(filePath)) && !(await isDirectory(filePath))) {
    return fs.readFile(filePath, {
      encoding: 'utf-8',
    })
  }
}
