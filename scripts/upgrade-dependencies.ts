import fs from 'fs-extra'
import path from 'path'
import { replaceInFile } from 'replace-in-file'

import execa from './execute-async'

const DENY_LIST: string[] = [
  '@types/express', // 5.0.0 breaks typing with error Argument of type 'RequestHandler<ParamsDictionary, any, any, ParsedQs, Record<string, any>>' is not assignable to parameter of type 'PathParams'
  'eslint', // 9.0 breaks with TypeError: [ERR_IMPORT_ASSERTION_TYPE_MISSING]: Module "file:///.eslintrc.json?mtime=1714512618315" needs an import assertion of type "json"
  'eslint-plugin-prettier', // 5.0 breaks if using 2.0 of prettier (TypeError: prettier.resolveConfig is not a function)
  'graphql-request', // 7.0.0 switched to ESM, need to switch to ESM to be able to use
  'npm-groovy-lint', // 15.0.1 breaks imports (NglParseError)
  'open', // 9.0 switched to ESM, need to switch to ESM to be able to use
  'prettier', // 3.0 broke auto pretty on save (TypeError: Invalid host defined options)
  'replace-in-file', // 8.0.0 switched to ESM, need to switch to ESM to be able to use
  'url-join', // 5.0 switched to ESM, need to switch to ESM to be able to use
  '@types/url-join', // 5.0 breaks and is not needed for url-join 5.0
]

//
;(async () => {
  try {
    const { stdout } = await execa({
      command: 'yarn workspaces list --recursive --json',
    })
    for (const line of stdout.trim().split(/\r?\n/g)) {
      const workspace: YarnWorkspace = JSON.parse(line)
      await upgradeDependencies(path.join(__dirname, '..', workspace.location, 'package.json'))
    }
    console.log('Dependencies updated! Run "yarn install" to install new dependencies.')
  } catch (err) {
    console.error(err)
    process.exitCode = 1
  }
})()

async function upgradeDependencies(packageJsonFile: string): Promise<void> {
  const packageJson = (await fs.readJson(packageJsonFile)) as PackageJson
  await upgradePackages(packageJsonFile, packageJson, 'dependencies')
  await upgradePackages(packageJsonFile, packageJson, 'devDependencies')
}

async function upgradePackages(
  packageJsonFile: string,
  packageJson: PackageJson,
  key: keyof PackageJson
): Promise<void> {
  console.log(`Checking ${packageJson.name} ${key}...`)
  if (packageJson[key]) {
    for (const [packageName, packageversion] of Object.entries(packageJson[key] as object)) {
      if (!DENY_LIST.includes(packageName)) {
        if (packageversion != 'workspace:*') {
          const { stdout } = await execa({
            command: `npm show ${packageName} version`,
          })
          const latestVersion = stdout.trim()
          const currentMajorVersion = packageversion.split('.')[0]
          const latestMajorVersion = latestVersion.split('.')[0]
          if (currentMajorVersion !== latestMajorVersion) {
            console.warn(`Major version bump for "${packageName}" - "${packageversion}" to "${latestVersion}"`)
          }
          if (packageversion !== latestVersion) {
            await replaceInFile({
              files: packageJsonFile,
              from: `"${packageName}": "${packageversion}"`,
              to: `"${packageName}": "${latestVersion}"`,
              disableGlobs: true,
            })
          }
        }
      } else {
        console.log(`Skipping "${packageName}" due to deny list`)
      }
    }
  } else {
    console.log(`Package JSON for "${packageJson.name}" does not have "${key}"`)
  }
}

interface YarnWorkspace {
  location: string
  name: string
}

interface PackageJson {
  name: string
  dependencies?: Packages
  devDependencies?: Packages
}

interface Packages {
  [key: string]: string
}
