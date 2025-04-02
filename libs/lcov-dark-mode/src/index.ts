import { access, copyFile, readdir, readFile, stat, writeFile } from 'fs/promises'
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
     * Purposefully do not await this so that jest can write out HTML files in parallel.
     * Apparently jest waits until all reporters have finished before writing the lcov HTML files,
     * so this isn't awaited here in order for jest to not be blocked and proceed to writing those lcov HTML files
     * which are needed by this method to modify them with the new dark-mode.css stylesheet in their heads.
     */
    addDarkMode({
      coverageDirectory: this._options?.coverageDirectory || this._globalConfig.coverageDirectory,
      waitMilliseconds: this._options?.waitMilliseconds || 0,
    })
  }
}

/**
 * Adds dark mode to all HTML files in the coverageDirectory.
 *
 * @param config The configuration required to add dark mode.
 * @param config.coverageDirectory The directory containing the lcov-report directory which contains the HTML coverage files.
 * @param config.waitMilliseconds An optional time (in milliseconds) to wait before modifying HTML files with dark mode. Useful if jest is slow in producing the HTML files.
 */
export async function addDarkMode({
  coverageDirectory,
  waitMilliseconds,
}: {
  coverageDirectory: string
  waitMilliseconds: number
}) {
  await sleep(waitMilliseconds)

  const lcovDir = path.join(coverageDirectory, 'lcov-report')
  try {
    await access(lcovDir)
  } catch (err: unknown) {
    throw Error(`Could not access LCOV directory "${lcovDir}": ${err}`)
  }
  const cssFileName = 'dark-mode.css'
  await copyFile(path.join(__dirname, cssFileName), path.join(lcovDir, cssFileName))

  const files = await getFilesRecursively({
    directory: lcovDir,
    extension: 'html',
  })

  await Promise.all(files.map((file) => addStylesheetLinkToHead(file)))
}

/**
 * Sleep/wait/pause the desired amount of time (in milliseconds).
 *
 * @param milliseconds The amount of time (in milliseconds) to sleep/wait/pause execution.
 */
async function sleep(milliseconds: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, milliseconds)
  })
}

/**
 * Gets all files in a directory recursively.
 *
 * @param config The configuration required to get the files.
 * @param config.directory The directory contiaining the files to retrieve recursively.
 * @param config.extension An optional extension to filter files to. If provided, only files which end in that extension will be returned.
 * @returns An array containing all the files in the directory recursively.
 */
async function getFilesRecursively({
  directory,
  extension,
}: {
  directory: string
  extension?: string
}): Promise<string[]> {
  const files: string[] = []

  const filesInDir = await readdir(directory)
  for (const fileInDir of filesInDir) {
    const filePath = path.join(directory, fileInDir)
    if (!extension || fileInDir.endsWith(`.${extension}`)) {
      files.push(filePath)
    }
    const stats = await stat(filePath)
    if (stats.isDirectory()) {
      const subFiles = await getFilesRecursively({
        directory: filePath,
        extension,
      })
      files.push(...subFiles)
    }
  }

  return files
}

/**
 * Add the dark-mode.css stylesheet to an HTML file, based off where the base.css stylesheet is.
 *
 * @param htmlFilePath The path to the HTML file which should be updated.
 */
async function addStylesheetLinkToHead(htmlFilePath: string) {
  const contents = await readFile(htmlFilePath, {
    encoding: 'utf-8',
  })
  const lines = contents.split(/\r\n|\r|\n/)
  let index = -1
  let whitespace = ''
  let relativePath = ''
  for (let i = 0; i < lines.length && index < 0; i++) {
    const line = lines[i]
    const matches = line.match(/(\s+)<link rel="stylesheet" href="(.*)base.css" \/>/)
    if (matches) {
      index = i
      whitespace = matches[1]
      relativePath = matches[2]
    }
  }
  if (index === -1) {
    throw Error(`Could not find base.css stylesheet link in HTML file "${htmlFilePath}"`)
  }
  lines.splice(index, 0, `${whitespace}<link rel="stylesheet" href="${relativePath}dark-mode.css" />`)
  await writeFile(htmlFilePath, lines.join('\n'))
}

/**
 * Configuration options to control the application of dark mode to lcov HTML files.
 */
interface LcovDarkModeOptions {
  /**
   * The directory containing the lcov-report directory which contains the HTML coverage files.
   */
  coverageDirectory?: string
  /**
   * An optional time (in milliseconds) to wait before modifying HTML files with dark mode. Useful if jest is slow in producing the HTML files.
   */
  waitMilliseconds?: number
}
