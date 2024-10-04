import execa from './execute-async'

//
;(async () => {
  const dirs = process.argv.slice(2)
  const { stdout } = await execa({
    command: 'yarn workspaces list --recursive --json',
  })
  const wsToBuild: string[] = []
  for (const line of stdout.trim().split(/\r?\n/g)) {
    const workspace: YarnWorkspace = JSON.parse(line)
    let match = false
    for (const dir of dirs) {
      if (workspace.location.startsWith(dir)) {
        match = true
      }
    }
    if (match) {
      wsToBuild.push(workspace.location)
    }
  }
  console.log(`Building workspaces: "${JSON.stringify(wsToBuild)}"`)
  await Promise.all(
    wsToBuild.map((workspace) => {
      return new Promise(async (resolve, reject) => {
        try {
          await execa({
            command: 'yarn build',
            options: {
              cwd: workspace,
            },
          })
          console.log(`Build complete for "${workspace}"`)
          resolve('')
        } catch (err: unknown) {
          reject(`Build failed for workspace "${workspace}": ${err}`)
        }
      })
    })
  )
})().catch((err) => {
  console.error(err)
  process.exitCode = 1
})

interface YarnWorkspace {
  location: string
  name: string
}
