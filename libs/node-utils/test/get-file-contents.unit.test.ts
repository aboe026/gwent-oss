import fs from 'fs/promises'

import * as fileExists from '../src/file-exists'
import getFileContents from '../src/get-file-contents'

describe('get-file-contents', () => {
  it('returns undefined if file does not exist', async () => {
    await testGetFileContents({
      fileExistsResponse: false,
      expected: undefined,
    })
  })
  it('returns file contents if it exists', async () => {
    const contents = 'file-contents'
    await testGetFileContents({
      fileExistsResponse: true,
      readResponse: contents,
      expected: contents,
    })
  })
})

async function testGetFileContents({
  fileExistsResponse,
  readResponse,
  expected,
}: {
  fileExistsResponse: boolean
  readResponse?: string
  expected: string | undefined
}) {
  const filePath = 'file-path'
  const fileExistsSpy = jest.spyOn(fileExists, 'default').mockResolvedValue(fileExistsResponse)
  const readSpy = jest.spyOn(fs, 'readFile')
  if (readResponse) {
    readSpy.mockResolvedValue(readResponse)
  }

  await expect(getFileContents(filePath)).resolves.toEqual(expected)

  expect(fileExistsSpy.mock.calls).toEqual([[filePath]])
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
