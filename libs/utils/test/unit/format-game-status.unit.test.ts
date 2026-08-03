import formatGameStatus from '../../src/format-game-status'
import { GameStatus } from '@gwent-oss/graphql-schema/resolver-typings'

describe('formatGameStatus', () => {
  it('returns Choosing Decks if status is DECKING', () => {
    expect(formatGameStatus(GameStatus.Decking)).toEqual('Choosing Decks')
  })
  it('returns Ordering if status is ORDERING', () => {
    expect(formatGameStatus(GameStatus.Ordering)).toEqual('Ordering')
  })
  it('returns Redrawing if status is REDRAWING', () => {
    expect(formatGameStatus(GameStatus.Redrawing)).toEqual('Redrawing')
  })
  it('returns Playing if status is PLAYING', () => {
    expect(formatGameStatus(GameStatus.Playing)).toEqual('Playing')
  })
  it('returns Finished if status is DONE', () => {
    expect(formatGameStatus(GameStatus.Done)).toEqual('Finished')
  })
  it('throws error if status is not valid GameStatus', () => {
    const status = 'invalid' as any
    expect(() => formatGameStatus(status)).toThrow(`Invalid game status "${status}"`)
  })
})
