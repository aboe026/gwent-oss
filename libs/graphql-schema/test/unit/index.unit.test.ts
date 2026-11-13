import * as index from '../../src/index'
import { EffectReasonType } from '../../src/effect-reason-type'
import { GameUnitType } from '../../src/game-unit-type'
import { MoveType } from '../../src/move-type'
import RequestedFields from '../../src/requested-fields'
import scalars from '../../src/scalars'
import { typeDefs } from '../../generated/typeDefs'

describe('index', () => {
  it('index exposes correct properties', () => {
    expect(index).toEqual({
      EffectReasonType,
      GameUnitType,
      MoveType,
      RequestedFields,
      typeDefs,
      scalars,
    })
  })
})
