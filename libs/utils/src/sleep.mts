/**
 * Sleep/wait/pause execution for a specified number of seconds.
 *
 * @param seconds The number of seconds to wait.
 */
export default async function sleep(seconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, seconds * 1000)
  })
}
