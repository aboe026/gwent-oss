import { graphql } from 'graphql'

import schema from '../../src/graphql/executable-schema'
import { version } from '../../package.json'

describe('application', () => {
  describe('build', () => {
    it('returns integer', async () => {
      await expect(
        graphql({
          schema,
          source: `{
            application {
              build
            }
          }`,
        })
      ).resolves.toEqual({
        data: {
          application: {
            build: expect.any(Number),
          },
        },
      })
    })
  })
  describe('version', () => {
    it('returns package json version', async () => {
      await expect(
        graphql({
          schema,
          source: `{
            application {
              version
            }
          }`,
        })
      ).resolves.toEqual({
        data: {
          application: {
            version,
          },
        },
      })
    })
  })
})
