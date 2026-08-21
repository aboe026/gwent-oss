import fs from 'fs/promises'

import fileExists from '../src/file-exists'

describe('file-exists', () => {
  it('returns false if access throws error', async () => {
    await testFileExists({
      accessResponse: Error('does not exist'),
      expected: false,
    })
  })
  it('returns true if access does not throw error', async () => {
    await testFileExists({
      accessResponse: undefined,
      expected: true,
    })
  })
})

async function testFileExists({ accessResponse, expected }: { accessResponse: Error | undefined; expected: boolean }) {
  const filePath = 'file-path'
  const accessSpy = jest.spyOn(fs, 'access')
  if (accessResponse instanceof Error) {
    accessSpy.mockRejectedValue(accessResponse)
  } else {
    accessSpy.mockResolvedValue(accessResponse)
  }

  await expect(fileExists(filePath)).resolves.toEqual(expected)

  expect(accessSpy.mock.calls).toEqual([[filePath]])
}
