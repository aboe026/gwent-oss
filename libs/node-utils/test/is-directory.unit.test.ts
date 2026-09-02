import fs from 'fs/promises'

import isDirectory from '../src/is-directory'

describe('is-directory', () => {
  it('returns false if not directory', async () => {
    await testIsDirectory({
      statsIsDirectory: false,
      expected: false,
    })
  })
  it('returns true if directory', async () => {
    await testIsDirectory({
      statsIsDirectory: false,
      expected: false,
    })
  })
})

async function testIsDirectory({ statsIsDirectory, expected }: { statsIsDirectory: boolean; expected: boolean }) {
  const dirPath = 'dir/path'
  const isDirectorySpy = jest.fn().mockReturnValue(statsIsDirectory)
  const statSpy = jest.spyOn(fs, 'stat').mockResolvedValue({
    isDirectory: isDirectorySpy,
  } as any)

  await expect(isDirectory(dirPath)).resolves.toEqual(expected)

  expect(statSpy.mock.calls).toEqual([[dirPath]])
  expect(isDirectorySpy.mock.calls).toEqual([[]])
}
