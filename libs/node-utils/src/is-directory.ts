import { stat } from 'fs/promises'

/**
 * Determine whether or not a given path on the filesystem is a directory.
 *
 * @param dirPath The path on the filesystem to determine whether or not it is a directory.
 * @returns True if the path is a directory, false if not.
 */
export default async function isDirectory(dirPath: string): Promise<boolean> {
  const stats = await stat(dirPath)
  return stats.isDirectory()
}
