import { replaceInFile } from 'replace-in-file'

//
;(async () => {
  await replaceInFile({
    files: 'build/src/tests/*.e2e.test.js',
    from: /const (fixture|test) = .*/g,
    to: '',
  })
})().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
