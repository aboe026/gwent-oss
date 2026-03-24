import setNestedProperty from '../../src/set-nested-property'

describe('setNestedProperty', () => {
  describe('string value', () => {
    it('does not modify object if path is empty', () => {
      const obj = {}

      setNestedProperty({
        obj,
        path: '',
        value: 'bar',
      })

      expect(obj).toEqual({})
    })
    it('sets value for root level property that does not exist', () => {
      const obj = {}

      setNestedProperty({
        obj,
        path: 'foo',
        value: 'bar',
      })

      expect(obj).toEqual({
        foo: 'bar',
      })
    })
    it('overwrites value for root level property that already exists', () => {
      const obj = {
        foo: 'world',
      }

      setNestedProperty({
        obj,
        path: 'foo',
        value: 'bar',
      })

      expect(obj).toEqual({
        foo: 'bar',
      })
    })
    it('sets value for nested property that does not exist', () => {
      const obj = {}

      setNestedProperty({
        obj,
        path: 'foo.fizz',
        value: 'bar',
      })

      expect(obj).toEqual({
        foo: {
          fizz: 'bar',
        },
      })
    })
    it('overwrites value for nested property that already exists', () => {
      const obj = {
        foo: {
          fizz: 'world',
        },
      }

      setNestedProperty({
        obj,
        path: 'foo.fizz',
        value: 'bar',
      })

      expect(obj).toEqual({
        foo: {
          fizz: 'bar',
        },
      })
    })
    it('sets value for deeply nested property that does not exist', () => {
      const obj = {}

      setNestedProperty({
        obj,
        path: 'foo.fizz.buzz',
        value: 'bar',
      })

      expect(obj).toEqual({
        foo: {
          fizz: {
            buzz: 'bar',
          },
        },
      })
    })
  })
  describe('numeric value', () => {
    it('does not modify object if path is empty', () => {
      const obj = {}

      setNestedProperty({
        obj,
        path: '',
        value: 1,
      })

      expect(obj).toEqual({})
    })
    it('sets value for root level property that does not exist', () => {
      const obj = {}

      setNestedProperty({
        obj,
        path: 'foo',
        value: 1,
      })

      expect(obj).toEqual({
        foo: 1,
      })
    })
    it('overwrites value for root level property that already exists', () => {
      const obj = {
        foo: 'world',
      }

      setNestedProperty({
        obj,
        path: 'foo',
        value: 1,
      })

      expect(obj).toEqual({
        foo: 1,
      })
    })
    it('sets value for nested property that does not exist', () => {
      const obj = {}

      setNestedProperty({
        obj,
        path: 'foo.fizz',
        value: 1,
      })

      expect(obj).toEqual({
        foo: {
          fizz: 1,
        },
      })
    })
    it('overwrites value for nested property that already exists', () => {
      const obj = {
        foo: {
          fizz: 'world',
        },
      }

      setNestedProperty({
        obj,
        path: 'foo.fizz',
        value: 1,
      })

      expect(obj).toEqual({
        foo: {
          fizz: 1,
        },
      })
    })
    it('sets value for deeply nested property that does not exist', () => {
      const obj = {}

      setNestedProperty({
        obj,
        path: 'foo.fizz.buzz',
        value: 1,
      })

      expect(obj).toEqual({
        foo: {
          fizz: {
            buzz: 1,
          },
        },
      })
    })
  })
  describe('boolean true value', () => {
    it('does not modify object if path is empty', () => {
      const obj = {}

      setNestedProperty({
        obj,
        path: '',
        value: true,
      })

      expect(obj).toEqual({})
    })
    it('sets value for root level property that does not exist', () => {
      const obj = {}

      setNestedProperty({
        obj,
        path: 'foo',
        value: true,
      })

      expect(obj).toEqual({
        foo: true,
      })
    })
    it('overwrites value for root level property that already exists', () => {
      const obj = {
        foo: 'world',
      }

      setNestedProperty({
        obj,
        path: 'foo',
        value: true,
      })

      expect(obj).toEqual({
        foo: true,
      })
    })
    it('sets value for nested property that does not exist', () => {
      const obj = {}

      setNestedProperty({
        obj,
        path: 'foo.fizz',
        value: true,
      })

      expect(obj).toEqual({
        foo: {
          fizz: true,
        },
      })
    })
    it('overwrites value for nested property that already exists', () => {
      const obj = {
        foo: {
          fizz: 'world',
        },
      }

      setNestedProperty({
        obj,
        path: 'foo.fizz',
        value: true,
      })

      expect(obj).toEqual({
        foo: {
          fizz: true,
        },
      })
    })
    it('sets value for deeply nested property that does not exist', () => {
      const obj = {}

      setNestedProperty({
        obj,
        path: 'foo.fizz.buzz',
        value: true,
      })

      expect(obj).toEqual({
        foo: {
          fizz: {
            buzz: true,
          },
        },
      })
    })
  })
  describe('boolean false value', () => {
    it('does not modify object if path is empty', () => {
      const obj = {}

      setNestedProperty({
        obj,
        path: '',
        value: false,
      })

      expect(obj).toEqual({})
    })
    it('sets value for root level property that does not exist', () => {
      const obj = {}

      setNestedProperty({
        obj,
        path: 'foo',
        value: false,
      })

      expect(obj).toEqual({
        foo: false,
      })
    })
    it('overwrites value for root level property that already exists', () => {
      const obj = {
        foo: 'world',
      }

      setNestedProperty({
        obj,
        path: 'foo',
        value: false,
      })

      expect(obj).toEqual({
        foo: false,
      })
    })
    it('sets value for nested property that does not exist', () => {
      const obj = {}

      setNestedProperty({
        obj,
        path: 'foo.fizz',
        value: false,
      })

      expect(obj).toEqual({
        foo: {
          fizz: false,
        },
      })
    })
    it('overwrites value for nested property that already exists', () => {
      const obj = {
        foo: {
          fizz: 'world',
        },
      }

      setNestedProperty({
        obj,
        path: 'foo.fizz',
        value: false,
      })

      expect(obj).toEqual({
        foo: {
          fizz: false,
        },
      })
    })
    it('sets value for deeply nested property that does not exist', () => {
      const obj = {}

      setNestedProperty({
        obj,
        path: 'foo.fizz.buzz',
        value: false,
      })

      expect(obj).toEqual({
        foo: {
          fizz: {
            buzz: false,
          },
        },
      })
    })
  })
})
