import { exec, ExecOptions } from 'child_process'

export default function executeAsync({
  command,
  options,
  streamOutput,
  rejectStdErr,
}: {
  command: string
  options?: ExecOptions
  streamOutput?: boolean
  rejectStdErr?: boolean
}): Promise<ExecResponse> {
  return new Promise((resolve, reject) => {
    const proc = exec(command, options, (error, stdout, stderr) => {
      if (error || (rejectStdErr && stderr)) {
        reject(error || stderr)
      } else {
        resolve({
          stdout: stdout.toString(),
          stderr: stderr.toString(),
        })
      }
    })
    if (streamOutput) {
      proc.stdout?.pipe(process.stdout)
      proc.stderr?.pipe(process.stderr)
    }
  })
}

interface ExecResponse {
  stdout: string
  stderr: string
}
