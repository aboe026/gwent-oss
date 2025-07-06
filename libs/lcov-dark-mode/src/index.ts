import { access, appendFile, readFile } from 'fs/promises'
import type { AggregatedResult, Config, Reporter } from '@jest/reporters'
import path from 'path'

/**
 * A class defining a custom reporter for Jest in order to add dark mode to lcov HTML files.
 */
export default class LcovDarkMode implements Reporter {
  protected _globalConfig: Config.GlobalConfig
  protected _options?: LcovDarkModeOptions

  constructor(globalConfig: Config.GlobalConfig, options: LcovDarkModeOptions) {
    this._globalConfig = globalConfig
    this._options = options
  }

  /**
   * This function is run after code coverage calculations have completed.
   *
   * @param contexts The contexts about the code coverage run.
   * @param results The results containing the code coverage information.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onRunComplete(contexts: Set<unknown>, results: AggregatedResult): void {
    /**
     * Purposefully do not await this so that jest can write out lcov HTML files in parallel.
     * Apparently jest waits until all reporters have finished before writing the lcov HTML files,
     * so this isn't awaited here in order for jest to not be blocked and proceed to writing those lcov HTML files
     * which are needed (specifically the base.css) by this method to modify them with the new dark-mode.css.
     */
    addDarkMode({
      checkDurationMilliseconds: this._options?.checkDurationMilliseconds,
      coverageDirectory: this._options?.coverageDirectory || this._globalConfig.coverageDirectory,
      maxWaitMilliseconds: this._options?.waitMilliseconds,
    })
  }
}

/**
 * Adds dark mode to all HTML files in the coverageDirectory.
 *
 * @param config The configuration required to add dark mode.
 * @param config.checkDurationMilliseconds How often (in milliseconds) to check whether or not the file exists.
 * @param config.coverageDirectory The directory containing the lcov-report directory which contains the HTML coverage files.
 * @param config.maxWaitMilliseconds The maximum amount of time (in milliseconds) to wait for lcov to generate HTML files.
 */
export async function addDarkMode({
  checkDurationMilliseconds,
  coverageDirectory,
  maxWaitMilliseconds,
}: {
  checkDurationMilliseconds?: number
  coverageDirectory: string
  maxWaitMilliseconds?: number
}) {
  const baseCssPath = path.join(coverageDirectory, 'lcov-report', 'base.css')
  const darkModeCss = await readFile(path.join(__dirname, 'dark-mode.css'), {
    encoding: 'utf-8',
  })
  await waitForFileToExist({
    checkDurationMilliseconds,
    filePath: baseCssPath,
    timeoutMilliseconds: maxWaitMilliseconds,
  })
  await appendFile(baseCssPath, darkModeCss)
}

/**
 * Waits a maximum amount of time until a file exists. If file not found in that time limit, throw error.
 *
 * @param config The configuration for waiting on the file to exist.
 * @param config.filePath The path of the file to check for the existence of.
 * @param config.checkDurationMilliseconds How often (in milliseconds) to check whether or not the file exists.
 * @param config.timeoutMilliseconds The maximum amount of time (in milliseconds) to wait for the file to exist.
 * @throws Error if file does not exist after timeoutMilliseconds has elapsed.
 */
async function waitForFileToExist({
  filePath,
  checkDurationMilliseconds = 100,
  timeoutMilliseconds = 5000,
}: {
  filePath: string
  checkDurationMilliseconds?: number
  timeoutMilliseconds?: number
}) {
  const start = Date.now()
  let exists = false
  while (!exists && Date.now() - start < timeoutMilliseconds) {
    exists = await fileExists(filePath)
    if (!exists) {
      await sleep(checkDurationMilliseconds)
    }
  }
  if (!exists) {
    throw Error(`File "${filePath}" does not exist after "${timeoutMilliseconds}" milliseconds`)
  }
}

/**
 * Check to see if a file exists.
 *
 * @param filePath The path of the file to check the existence of.
 * @returns Returns true if the file exists, false otherwise.
 */
async function fileExists(filePath: string): Promise<boolean> {
  let exists = false

  try {
    await access(filePath)
    exists = true
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err: unknown) {
    // swallow
  }

  return exists
}

/**
 * Sleep/wait/pause the desired amount of time (in milliseconds).
 *
 * @param milliseconds The amount of time (in milliseconds) to sleep/wait/pause execution.
 *
 * @returns Nothing when the specified number of milliseconds have elapsed.
 */
async function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds)
  })
}

/**
 * Configuration options to control the application of dark mode to lcov HTML files.
 */
interface LcovDarkModeOptions {
  /**
   * How often (in milliseconds) to check whether or not the locv HTML files have been generated yet. Default is 100.
   */
  checkDurationMilliseconds?: number
  /**
   * The directory containing the lcov-report directory which contains the HTML coverage files.
   */
  coverageDirectory?: string
  /**
   * The maximum amount of time (in milliseconds) to wait for lcov to generate HTML files. Default 5000. Useful to extend if Jest is slow to generate lcov HTML files.
   */
  waitMilliseconds?: number
}
