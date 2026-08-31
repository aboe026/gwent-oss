import fs from 'fs/promises'

import * as fileExists from '../src/file-exists'
import getFileContents from '../src/get-file-contents'
import * as isDirectory from '../src/is-directory'

describe('get-file-contents', () => {
  it('returns undefined if filePath is undefined', async () => {
    await testGetFileContents({
      filePath: undefined,
      fileExistsResponse: false,
      expected: undefined,
    })
  })
  it('returns undefined if file does not exist', async () => {
    await testGetFileContents({
      filePath: 'file-path',
      fileExistsResponse: false,
      expected: undefined,
    })
  })
  it('returns undefined if file exists but is directory', async () => {
    await testGetFileContents({
      filePath: 'file-path',
      fileExistsResponse: true,
      isDirectoryResponse: true,
      expected: undefined,
    })
  })
  it('returns file contents if it exists', async () => {
    const contents = 'file-contents'
    await testGetFileContents({
      filePath: 'file-path',
      fileExistsResponse: true,
      isDirectoryResponse: false,
      readResponse: contents,
      expected: contents,
    })
  })
})

async function testGetFileContents({
  filePath,
  fileExistsResponse,
  isDirectoryResponse,
  readResponse,
  expected,
}: {
  filePath: string | undefined
  fileExistsResponse: boolean
  isDirectoryResponse?: boolean
  readResponse?: string
  expected: string | undefined
}) {
  const fileExistsSpy = jest.spyOn(fileExists, 'default').mockResolvedValue(fileExistsResponse)
  const isDirectorySpy = jest.spyOn(isDirectory, 'default')
  if (isDirectoryResponse !== undefined) {
    isDirectorySpy.mockResolvedValue(isDirectoryResponse)
  }
  const readSpy = jest.spyOn(fs, 'readFile')
  if (readResponse) {
    readSpy.mockResolvedValue(readResponse)
  }

  await expect(getFileContents(filePath)).resolves.toEqual(expected)

  expect(fileExistsSpy.mock.calls).toEqual(filePath ? [[filePath]] : [])
  expect(isDirectorySpy.mock.calls).toEqual(isDirectoryResponse === undefined ? [] : [[filePath]])
  expect(readSpy.mock.calls).toEqual(
    readResponse
      ? [
          [
            filePath,
            {
              encoding: 'utf-8',
            },
          ],
        ]
      : []
  )
}
