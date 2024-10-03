import toTitleCase from '../../src/to-title-case.mjs'

describe('toTitleCase', () => {
  it('returns empty string if given empty string', () => {
    expect(toTitleCase('')).toEqual('')
  })
  it('returns uppercase letter if given uppercase letter', () => {
    expect(toTitleCase('A')).toEqual('A')
  })
  it('returns uppercase letter if given lowercase letter', () => {
    expect(toTitleCase('a')).toEqual('A')
  })
  it('returns word with uppercase first character if given uppercase word', () => {
    expect(toTitleCase('HELLO')).toEqual('Hello')
  })
  it('returns word with uppercase first character if given lowercase word', () => {
    expect(toTitleCase('hello')).toEqual('Hello')
  })
  it('returns word with uppercase first character if given mixed case word', () => {
    expect(toTitleCase('HeLlO')).toEqual('Hello')
  })
  it('returns sentence with uppercase first characters for words if given uppercase sentence', () => {
    expect(toTitleCase('HELLO WORLD.')).toEqual('Hello World.')
  })
  it('returns sentence with uppercase first characters for words if given lowercase sentence', () => {
    expect(toTitleCase('hello world.')).toEqual('Hello World.')
  })
  it('returns sentence with uppercase first characters for words if given mixed sentence', () => {
    expect(toTitleCase('hElLo WoRlD.')).toEqual('Hello World.')
  })
})
