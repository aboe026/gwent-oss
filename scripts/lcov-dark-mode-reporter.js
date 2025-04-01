/* eslint-disable @typescript-eslint/no-require-imports */
const { appendFile, readFile } = require('fs')
const path = require('path')

class LcovDarkModeReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig
    this._options = options
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onRunComplete(contexts, results) {
    readFile(
      path.join(process.env.PROJECT_CWD, 'scripts', 'lcov-dark-mode.css'),
      {
        encoding: 'utf-8',
      },
      (err, data) => {
        if (err) {
          throw Error(err)
        } else {
          appendFile(path.join(this._globalConfig.coverageDirectory, 'lcov-report', 'base.css'), data)
        }
      }
    )
  }
}

module.exports = LcovDarkModeReporter
