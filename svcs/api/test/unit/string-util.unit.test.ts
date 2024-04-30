import { prettyPrintList } from '../../src/util/string-util'

describe('string-util', () => {
  describe('prettyPrintList', () => {
    it('returns empty string if array empty', () => {
      expect(
        prettyPrintList({
          items: [],
        })
      ).toEqual('')
    })
    it('returns single item without label', () => {
      expect(
        prettyPrintList({
          items: ['red'],
        })
      ).toEqual('red')
    })
    it('returns single item with label', () => {
      expect(
        prettyPrintList({
          items: ['red'],
          labelPlural: 'colors',
          labelSingular: 'color',
        })
      ).toEqual('red color')
    })
    it('returns two items without labels', () => {
      expect(
        prettyPrintList({
          items: ['red', 'green'],
        })
      ).toEqual('red and green')
    })
    it('returns two items with labels', () => {
      expect(
        prettyPrintList({
          items: ['red', 'green'],
          labelPlural: 'colors',
          labelSingular: 'color',
        })
      ).toEqual('red and green colors')
    })
    it('returns three items without labels', () => {
      expect(
        prettyPrintList({
          items: ['red', 'green', 'blue'],
        })
      ).toEqual('red, green and blue')
    })
    it('returns three items without labels', () => {
      expect(
        prettyPrintList({
          items: ['red', 'green', 'blue'],
          labelPlural: 'colors',
          labelSingular: 'color',
        })
      ).toEqual('red, green and blue colors')
    })
  })
})
