import * as getFileContents from '../src/get-file-contents'
import getFileJson from '../src/get-file-json'

describe('get-file-json', () => {
  const filePath = 'file-path'
  it('returns undefined if file does not exist', async () => {
    await testGetFileJson({
      filePath,
      contents: undefined,
      expected: undefined,
    })
  })
  it('throws error if file exists with invalid json', async () => {
    await testGetFileJson({
      filePath,
      contents: 'invalid',
      expected: Error(`Cannot read file "${filePath}" as JSON`, {
        cause: Error('Unexpected token \'i\', "invalid" is not valid JSON'),
      }),
    })
  })
  it('returns contents as json if valid', async () => {
    const json = { hello: 'world' }
    await testGetFileJson({
      filePath,
      contents: JSON.stringify(json),
      expected: json,
    })
  })
})

async function testGetFileJson({
  filePath,
  contents,
  expected,
}: {
  filePath: string
  contents: string | undefined
  expected: any | undefined | Error
}) {
  const getContentsSpy = jest.spyOn(getFileContents, 'default').mockResolvedValue(contents)

  const promise = getFileJson(filePath)
  if (expected instanceof Error) {
    await expect(promise).rejects.toThrow(expected)
  } else {
    await expect(promise).resolves.toEqual(expected)
  }

  expect(getContentsSpy.mock.calls).toEqual([[filePath]])
}
