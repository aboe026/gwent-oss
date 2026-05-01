import { ObjectId } from 'mongodb'
import mergeImpacts from '../../src/graphql/resolvers/mutations/play-unit/merge-impacts'
import TestUtil from '../util/test-util'

describe('merge-impacts', () => {
  describe('single', () => {
    it('returns empty object', () => {
      expect(mergeImpacts({})).toEqual({})
    })
    it('returns empty impact', () => {
      const id = new ObjectId().toString()
      expect(
        mergeImpacts({
          [id]: [],
        })
      ).toEqual({
        [id]: [],
      })
    })
    it('returns single impact', () => {
      const id = new ObjectId().toString()
      const impact = TestUtil.getDbImpact({})
      expect(
        mergeImpacts({
          [id]: [impact],
        })
      ).toEqual({
        [id]: [impact],
      })
    })
    it('returns multiple impacts', () => {
      const id = new ObjectId().toString()
      const impact1 = TestUtil.getDbImpact({})
      const impact2 = TestUtil.getDbImpact({})
      expect(
        mergeImpacts({
          [id]: [impact1, impact2],
        })
      ).toEqual({
        [id]: [impact1, impact2],
      })
    })
  })
  describe('multiple', () => {
    it('returns empty object', () => {
      expect(mergeImpacts({}, {})).toEqual({})
    })
    it('returns empty impact', () => {
      const id1 = new ObjectId().toString()
      const id2 = new ObjectId().toString()
      expect(
        mergeImpacts(
          {
            [id1]: [],
          },
          {
            [id2]: [],
          }
        )
      ).toEqual({
        [id1]: [],
        [id2]: [],
      })
    })
    it('returns single separate impact', () => {
      const id1 = new ObjectId().toString()
      const id2 = new ObjectId().toString()
      const impact1 = TestUtil.getDbImpact({})
      const impact2 = TestUtil.getDbImpact({})
      expect(
        mergeImpacts(
          {
            [id1]: [impact1],
          },
          {
            [id2]: [impact2],
          }
        )
      ).toEqual({
        [id1]: [impact1],
        [id2]: [impact2],
      })
    })
    it('returns single similar impact', () => {
      const id = new ObjectId().toString()
      const impact1 = TestUtil.getDbImpact({})
      const impact2 = TestUtil.getDbImpact({})
      expect(
        mergeImpacts(
          {
            [id]: [impact1],
          },
          {
            [id]: [impact2],
          }
        )
      ).toEqual({
        [id]: [impact1, impact2],
      })
    })
    it('returns multiple separate impacts', () => {
      const id1 = new ObjectId().toString()
      const id2 = new ObjectId().toString()
      const impact1 = TestUtil.getDbImpact({})
      const impact2 = TestUtil.getDbImpact({})
      const impact3 = TestUtil.getDbImpact({})
      const impact4 = TestUtil.getDbImpact({})
      expect(
        mergeImpacts(
          {
            [id1]: [impact1, impact2],
          },
          {
            [id2]: [impact3, impact4],
          }
        )
      ).toEqual({
        [id1]: [impact1, impact2],
        [id2]: [impact3, impact4],
      })
    })
    it('returns multiple similar impacts', () => {
      const id = new ObjectId().toString()
      const impact1 = TestUtil.getDbImpact({})
      const impact2 = TestUtil.getDbImpact({})
      const impact3 = TestUtil.getDbImpact({})
      const impact4 = TestUtil.getDbImpact({})
      expect(
        mergeImpacts(
          {
            [id]: [impact1, impact2],
          },
          {
            [id]: [impact3, impact4],
          }
        )
      ).toEqual({
        [id]: [impact1, impact2, impact3, impact4],
      })
    })
  })
})
