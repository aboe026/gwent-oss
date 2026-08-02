import fs from 'fs-extra'
import path from 'path'
import { replaceInFile } from 'replace-in-file'

import execa from './execute-async'

const DENY_LIST: string[] = [
  '@graphql-codegen/add', // 7.0 switched to ESM, need to switch to ESM to be able to use
  '@graphql-codegen/cli',
  '@graphql-codegen/client-preset',
  '@graphql-codegen/fragment-matcher',
  '@graphql-codegen/schema-ast',
  '@graphql-codegen/typescript',
  '@graphql-codegen/typescript-mongodb',
  '@graphql-codegen/typescript-operations',
  '@graphql-codegen/typescript-resolvers',
  '@graphql-codegen/typescript-graphql-request',
  '@types/express', // 5.0.0 breaks, waiting for it to become compatible with express 5
  '@types/node', // manually keep in sync with Node.js version
  '@types/url-join', // 5.0 breaks and is not needed for url-join 5.0
  'cookie', // 2.0 switched to ESM, need to switch to ESM to be able to use
  'graphql', // 17 breaks codegen (need to upgrade codegen first, but can't since it's own upgrades requires ESM)
  'graphql-request', // 7.0.0 switched to ESM, need to switch to ESM to be able to use
  'open', // 9.0 switched to ESM, need to switch to ESM to be able to use\
  'react-router', // 8.0 switched to ESM, need to switch to ESM to be able to use\
  'replace-in-file', // 8.0.0 switched to ESM, need to switch to ESM to be able to use
  'typescript', // 7 breaks support for Yarn PnP (https://github.com/microsoft/typescript-go/pull/1966)
  'url-join', // 5.0 switched to ESM, need to switch to ESM to be able to use
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
