import { GraphQLResolveInfo, Kind } from 'graphql'
import RequestedFields from '../../src/requested-fields.mjs'

describe('RequestedFields', () => {
  describe('getFieldsRequested', () => {
    it('returns empty array if no fieldNodes', () => {
      expect(RequestedFields.getFieldsRequested({} as any as GraphQLResolveInfo)).toEqual([])
    })
    it('returns empty array if empty fieldNodes', () => {
      expect(
        RequestedFields.getFieldsRequested({
          fieldNodes: [],
        } as any as GraphQLResolveInfo)
      ).toEqual([])
    })
    describe('Field', () => {
      it('returns single item if single fieldNode', () => {
        expect(
          RequestedFields.getFieldsRequested({
            fieldNodes: [
              {
                kind: Kind.FIELD,
                name: {
                  value: 'pie',
                },
              },
            ],
          } as any as GraphQLResolveInfo)
        ).toEqual(['pie'])
      })
      it('returns multiple items if multiple fieldNodes', () => {
        expect(
          RequestedFields.getFieldsRequested({
            fieldNodes: [
              {
                kind: Kind.FIELD,
                name: {
                  value: 'pie',
                },
              },
              {
                kind: Kind.FIELD,
                name: {
                  value: 'cake',
                },
              },
            ],
          } as any as GraphQLResolveInfo)
        ).toEqual(['pie', 'cake'])
      })
      it('returns single period separated item if single node with single subnode', () => {
        expect(
          RequestedFields.getFieldsRequested({
            fieldNodes: [
              {
                kind: Kind.FIELD,
                name: {
                  value: 'pie',
                },
                selectionSet: {
                  selections: [
                    {
                      kind: Kind.FIELD,
                      name: {
                        value: 'filling',
                      },
                    },
                  ],
                },
              },
            ],
          } as any as GraphQLResolveInfo)
        ).toEqual(['pie.filling'])
      })
      it('returns multiple period separated item if single node with multiple subnodes', () => {
        expect(
          RequestedFields.getFieldsRequested({
            fieldNodes: [
              {
                kind: Kind.FIELD,
                name: {
                  value: 'pie',
                },
                selectionSet: {
                  selections: [
                    {
                      kind: Kind.FIELD,
                      name: {
                        value: 'filling',
                      },
                    },
                    {
                      kind: Kind.FIELD,
                      name: {
                        value: 'crust',
                      },
                    },
                  ],
                },
              },
            ],
          } as any as GraphQLResolveInfo)
        ).toEqual(['pie.filling', 'pie.crust'])
      })
      it('returns multiple period separated item if multiple nodes with single subnode', () => {
        expect(
          RequestedFields.getFieldsRequested({
            fieldNodes: [
              {
                kind: Kind.FIELD,
                name: {
                  value: 'pie',
                },
                selectionSet: {
                  selections: [
                    {
                      kind: Kind.FIELD,
                      name: {
                        value: 'filling',
                      },
                    },
                  ],
                },
              },
              {
                kind: Kind.FIELD,
                name: {
                  value: 'cake',
                },
                selectionSet: {
                  selections: [
                    {
                      kind: Kind.FIELD,
                      name: {
                        value: 'flavor',
                      },
                    },
                  ],
                },
              },
            ],
          } as any as GraphQLResolveInfo)
        ).toEqual(['pie.filling', 'cake.flavor'])
      })
      it('returns multiple period separated item if multiple nodes with multiple subnodes', () => {
        expect(
          RequestedFields.getFieldsRequested({
            fieldNodes: [
              {
                kind: Kind.FIELD,
                name: {
                  value: 'pie',
                },
                selectionSet: {
                  selections: [
                    {
                      kind: Kind.FIELD,
                      name: {
                        value: 'filling',
                      },
                    },
                    {
                      kind: Kind.FIELD,
                      name: {
                        value: 'crust',
                      },
                    },
                  ],
                },
              },
              {
                kind: Kind.FIELD,
                name: {
                  value: 'cake',
                },
                selectionSet: {
                  selections: [
                    {
                      kind: Kind.FIELD,
                      name: {
                        value: 'flavor',
                      },
                    },
                    {
                      kind: Kind.FIELD,
                      name: {
                        value: 'icing',
                      },
                    },
                  ],
                },
              },
            ],
          } as any as GraphQLResolveInfo)
        ).toEqual(['pie.filling', 'pie.crust', 'cake.flavor', 'cake.icing'])
      })
    })
    describe('FragmentSpread', () => {
      it('returns empty array if single fieldNode without fragment selections', () => {
        expect(
          RequestedFields.getFieldsRequested({
            fieldNodes: [
              {
                kind: Kind.FRAGMENT_SPREAD,
                name: {
                  value: 'PieFragment',
                },
              },
            ],
            fragments: {
              PieFragment: {
                selectionSet: {
                  selections: [],
                },
              },
            },
          } as any as GraphQLResolveInfo)
        ).toEqual([])
      })
      it('returns empty array if multiple fieldNodes without fragment selections', () => {
        expect(
          RequestedFields.getFieldsRequested({
            fieldNodes: [
              {
                kind: Kind.FRAGMENT_SPREAD,
                name: {
                  value: 'PieFragment',
                },
              },
              {
                kind: Kind.FRAGMENT_SPREAD,
                name: {
                  value: 'CakeFragment',
                },
              },
            ],
            fragments: {
              PieFragment: {
                selectionSet: {
                  selections: [],
                },
              },
              CakeFragment: {
                selectionSet: {
                  selections: [],
                },
              },
            },
          } as any as GraphQLResolveInfo)
        ).toEqual([])
      })
      it('returns single item if single node with single subnode', () => {
        expect(
          RequestedFields.getFieldsRequested({
            fieldNodes: [
              {
                kind: Kind.FRAGMENT_SPREAD,
                name: {
                  value: 'PieFragment',
                },
              },
            ],
            fragments: {
              PieFragment: {
                selectionSet: {
                  selections: [
                    {
                      kind: Kind.FIELD,
                      name: {
                        value: 'filling',
                      },
                    },
                  ],
                },
              },
            },
          } as any as GraphQLResolveInfo)
        ).toEqual(['filling'])
      })
      it('returns multiple items if single node with multiple subnodes', () => {
        expect(
          RequestedFields.getFieldsRequested({
            fieldNodes: [
              {
                kind: Kind.FRAGMENT_SPREAD,
                name: {
                  value: 'PieFragment',
                },
              },
            ],
            fragments: {
              PieFragment: {
                selectionSet: {
                  selections: [
                    {
                      kind: Kind.FIELD,
                      name: {
                        value: 'filling',
                      },
                    },
                    {
                      kind: Kind.FIELD,
                      name: {
                        value: 'crust',
                      },
                    },
                  ],
                },
              },
            },
          } as any as GraphQLResolveInfo)
        ).toEqual(['filling', 'crust'])
      })
      it('returns multiple items if multiple nodes with single subnode', () => {
        expect(
          RequestedFields.getFieldsRequested({
            fieldNodes: [
              {
                kind: Kind.FRAGMENT_SPREAD,
                name: {
                  value: 'PieFragment',
                },
              },
              {
                kind: Kind.FRAGMENT_SPREAD,
                name: {
                  value: 'CakeFragment',
                },
              },
            ],
            fragments: {
              PieFragment: {
                selectionSet: {
                  selections: [
                    {
                      kind: Kind.FIELD,
                      name: {
                        value: 'filling',
                      },
                    },
                  ],
                },
              },
              CakeFragment: {
                selectionSet: {
                  selections: [
                    {
                      kind: Kind.FIELD,
                      name: {
                        value: 'flavor',
                      },
                    },
                  ],
                },
              },
            },
          } as any as GraphQLResolveInfo)
        ).toEqual(['filling', 'flavor'])
      })
      it('returns multiple items if multiple nodes with multiple subnodes', () => {
        expect(
          RequestedFields.getFieldsRequested({
            fieldNodes: [
              {
                kind: Kind.FRAGMENT_SPREAD,
                name: {
                  value: 'PieFragment',
                },
              },
              {
                kind: Kind.FRAGMENT_SPREAD,
                name: {
                  value: 'CakeFragment',
                },
              },
            ],
            fragments: {
              PieFragment: {
                selectionSet: {
                  selections: [
                    {
                      kind: Kind.FIELD,
                      name: {
                        value: 'filling',
                      },
                    },
                    {
                      kind: Kind.FIELD,
                      name: {
                        value: 'crust',
                      },
                    },
                  ],
                },
              },
              CakeFragment: {
                selectionSet: {
                  selections: [
                    {
                      kind: Kind.FIELD,
                      name: {
                        value: 'flavor',
                      },
                    },
                    {
                      kind: Kind.FIELD,
                      name: {
                        value: 'icing',
                      },
                    },
                  ],
                },
              },
            },
          } as any as GraphQLResolveInfo)
        ).toEqual(['filling', 'crust', 'flavor', 'icing'])
      })
    })
    describe('mixed', () => {
      it('returns single period separated item if field node with single fragment spread subnode with single field', () => {
        expect(
          RequestedFields.getFieldsRequested({
            fieldNodes: [
              {
                kind: Kind.FIELD,
                name: {
                  value: 'pie',
                },
                selectionSet: {
                  selections: [
                    {
                      kind: Kind.FRAGMENT_SPREAD,
                      name: {
                        value: 'PieFragment',
                      },
                    },
                  ],
                },
              },
            ],
            fragments: {
              PieFragment: {
                selectionSet: {
                  selections: [
                    {
                      kind: Kind.FIELD,
                      name: {
                        value: 'filling',
                      },
                    },
                  ],
                },
              },
            },
          } as any as GraphQLResolveInfo)
        ).toEqual(['pie.filling'])
      })
      it('returns multiple period separated item if field node with multiple fragment spread subnodes with single fields', () => {
        expect(
          RequestedFields.getFieldsRequested({
            fieldNodes: [
              {
                kind: Kind.FIELD,
                name: {
                  value: 'pie',
                },
                selectionSet: {
                  selections: [
                    {
                      kind: Kind.FRAGMENT_SPREAD,
                      name: {
                        value: 'PieFragment',
                      },
                    },
                    {
                      kind: Kind.FRAGMENT_SPREAD,
                      name: {
                        value: 'DessertFragment',
                      },
                    },
                  ],
                },
              },
            ],
            fragments: {
              PieFragment: {
                selectionSet: {
                  selections: [
                    {
                      kind: Kind.FIELD,
                      name: {
                        value: 'filling',
                      },
                    },
                  ],
                },
              },
              DessertFragment: {
                selectionSet: {
                  selections: [
                    {
                      kind: Kind.FIELD,
                      name: {
                        value: 'sugar',
                      },
                    },
                  ],
                },
              },
            },
          } as any as GraphQLResolveInfo)
        ).toEqual(['pie.filling', 'pie.sugar'])
      })
      it('returns mulitple period separated items if field node with single fragment spread subnode with multiple fields', () => {
        expect(
          RequestedFields.getFieldsRequested({
            fieldNodes: [
              {
                kind: Kind.FIELD,
                name: {
                  value: 'pie',
                },
                selectionSet: {
                  selections: [
                    {
                      kind: Kind.FRAGMENT_SPREAD,
                      name: {
                        value: 'PieFragment',
                      },
                    },
                  ],
                },
              },
            ],
            fragments: {
              PieFragment: {
                selectionSet: {
                  selections: [
                    {
                      kind: Kind.FIELD,
                      name: {
                        value: 'filling',
                      },
                    },
                    {
                      kind: Kind.FIELD,
                      name: {
                        value: 'crust',
                      },
                    },
                  ],
                },
              },
            },
          } as any as GraphQLResolveInfo)
        ).toEqual(['pie.filling', 'pie.crust'])
      })
      it('returns multiple period separated items if multiple field nodes with single fragment spread subnode with single field', () => {
        expect(
          RequestedFields.getFieldsRequested({
            fieldNodes: [
              {
                kind: Kind.FIELD,
                name: {
                  value: 'pie',
                },
                selectionSet: {
                  selections: [
                    {
                      kind: Kind.FRAGMENT_SPREAD,
                      name: {
                        value: 'PieFragment',
                      },
                    },
                  ],
                },
              },
              {
                kind: Kind.FIELD,
                name: {
                  value: 'cake',
                },
                selectionSet: {
                  selections: [
                    {
                      kind: Kind.FRAGMENT_SPREAD,
                      name: {
                        value: 'CakeFragment',
                      },
                    },
                  ],
                },
              },
            ],
            fragments: {
              PieFragment: {
                selectionSet: {
                  selections: [
                    {
                      kind: Kind.FIELD,
                      name: {
                        value: 'filling',
                      },
                    },
                  ],
                },
              },
              CakeFragment: {
                selectionSet: {
                  selections: [
                    {
                      kind: Kind.FIELD,
                      name: {
                        value: 'flavor',
                      },
                    },
                  ],
                },
              },
            },
          } as any as GraphQLResolveInfo)
        ).toEqual(['pie.filling', 'cake.flavor'])
      })
      it('returns multiple period separated items if multiple field nodes with single fragment spread subnode with multiple fields', () => {
        expect(
          RequestedFields.getFieldsRequested({
            fieldNodes: [
              {
                kind: Kind.FIELD,
                name: {
                  value: 'pie',
                },
                selectionSet: {
                  selections: [
                    {
                      kind: Kind.FRAGMENT_SPREAD,
                      name: {
                        value: 'PieFragment',
                      },
                    },
                  ],
                },
              },
              {
                kind: Kind.FIELD,
                name: {
                  value: 'cake',
                },
                selectionSet: {
                  selections: [
                    {
                      kind: Kind.FRAGMENT_SPREAD,
                      name: {
                        value: 'CakeFragment',
                      },
                    },
                  ],
                },
              },
            ],
            fragments: {
              PieFragment: {
                selectionSet: {
                  selections: [
                    {
                      kind: Kind.FIELD,
                      name: {
                        value: 'filling',
                      },
                    },
                    {
                      kind: Kind.FIELD,
                      name: {
                        value: 'crust',
                      },
                    },
                  ],
                },
              },
              CakeFragment: {
                selectionSet: {
                  selections: [
                    {
                      kind: Kind.FIELD,
                      name: {
                        value: 'flavor',
                      },
                    },
                    {
                      kind: Kind.FIELD,
                      name: {
                        value: 'icing',
                      },
                    },
                  ],
                },
              },
            },
          } as any as GraphQLResolveInfo)
        ).toEqual(['pie.filling', 'pie.crust', 'cake.flavor', 'cake.icing'])
      })
    })
  })
  describe('isRequested', () => {
    describe('false', () => {
      it('returns false if fields requested is empty array', () => {
        jest.spyOn(RequestedFields, 'getFieldsRequested').mockReturnValue([])
        expect(RequestedFields.isRequested({} as GraphQLResolveInfo, 'pie')).toEqual(false)
      })
      it('returns false if fields requested does not contain field', () => {
        jest.spyOn(RequestedFields, 'getFieldsRequested').mockReturnValue(['cake'])
        expect(RequestedFields.isRequested({} as GraphQLResolveInfo, 'pie')).toEqual(false)
      })
      it('returns false if fields requested starts with field', () => {
        jest.spyOn(RequestedFields, 'getFieldsRequested').mockReturnValue(['pie'])
        expect(RequestedFields.isRequested({} as GraphQLResolveInfo, 'pie.crust')).toEqual(false)
      })
    })
    describe('true', () => {
      it('returns true if fields requested is field', () => {
        jest.spyOn(RequestedFields, 'getFieldsRequested').mockReturnValue(['pie'])
        expect(RequestedFields.isRequested({} as GraphQLResolveInfo, 'pie')).toEqual(true)
      })
      it('returns true if fields requested ends with field', () => {
        jest.spyOn(RequestedFields, 'getFieldsRequested').mockReturnValue(['pie.crust'])
        expect(RequestedFields.isRequested({} as GraphQLResolveInfo, 'crust')).toEqual(true)
      })
    })
  })
  describe('getArguments', () => {
    it('returns empty array if no arguments', () => {
      expect(RequestedFields.getArguments({} as any as GraphQLResolveInfo)).toEqual([])
    })
    it('returns empty array if empty fieldNodes', () => {
      expect(
        RequestedFields.getArguments({
          fieldNodes: [],
        } as any as GraphQLResolveInfo)
      ).toEqual([])
    })
    it('returns empty array if single node without arguments', () => {
      expect(
        RequestedFields.getArguments({
          fieldNodes: [
            {
              kind: Kind.FIELD,
              name: {
                value: 'pie',
              },
            },
          ],
        } as any as GraphQLResolveInfo)
      ).toEqual([])
    })
    describe('FieldNode', () => {
      describe('BooleanValue', () => {
        it('returns single item if single field node with true boolean argument', () => {
          expect(
            RequestedFields.getArguments({
              fieldNodes: [
                {
                  kind: Kind.FIELD,
                  name: {
                    value: 'pie',
                  },
                  arguments: [
                    {
                      kind: Kind.ARGUMENT,
                      name: {
                        kind: Kind.NAME,
                        value: 'top',
                      },
                      value: {
                        kind: Kind.BOOLEAN,
                        value: true,
                      },
                    },
                  ],
                },
              ],
            } as any as GraphQLResolveInfo)
          ).toEqual([
            {
              path: 'pie.top',
              value: true,
            },
          ])
        })
        it('returns single item if single field node with false boolean argument', () => {
          expect(
            RequestedFields.getArguments({
              fieldNodes: [
                {
                  kind: Kind.FIELD,
                  name: {
                    value: 'pie',
                  },
                  arguments: [
                    {
                      kind: Kind.ARGUMENT,
                      name: {
                        kind: Kind.NAME,
                        value: 'top',
                      },
                      value: {
                        kind: Kind.BOOLEAN,
                        value: false,
                      },
                    },
                  ],
                },
              ],
            } as any as GraphQLResolveInfo)
          ).toEqual([
            {
              path: 'pie.top',
              value: false,
            },
          ])
        })
        it('returns multiple items if multiple field nodes with true boolean argument', () => {
          expect(
            RequestedFields.getArguments({
              fieldNodes: [
                {
                  kind: Kind.FIELD,
                  name: {
                    value: 'pie',
                  },
                  arguments: [
                    {
                      kind: Kind.ARGUMENT,
                      name: {
                        kind: Kind.NAME,
                        value: 'top',
                      },
                      value: {
                        kind: Kind.BOOLEAN,
                        value: true,
                      },
                    },
                  ],
                },
                {
                  kind: Kind.FIELD,
                  name: {
                    value: 'cake',
                  },
                  arguments: [
                    {
                      kind: Kind.ARGUMENT,
                      name: {
                        kind: Kind.NAME,
                        value: 'gluten',
                      },
                      value: {
                        kind: Kind.BOOLEAN,
                        value: true,
                      },
                    },
                  ],
                },
              ],
            } as any as GraphQLResolveInfo)
          ).toEqual([
            {
              path: 'pie.top',
              value: true,
            },
            {
              path: 'cake.gluten',
              value: true,
            },
          ])
        })
        it('returns multiple items if multiple field nodes with false boolean argument', () => {
          expect(
            RequestedFields.getArguments({
              fieldNodes: [
                {
                  kind: Kind.FIELD,
                  name: {
                    value: 'pie',
                  },
                  arguments: [
                    {
                      kind: Kind.ARGUMENT,
                      name: {
                        kind: Kind.NAME,
                        value: 'top',
                      },
                      value: {
                        kind: Kind.BOOLEAN,
                        value: false,
                      },
                    },
                  ],
                },
                {
                  kind: Kind.FIELD,
                  name: {
                    value: 'cake',
                  },
                  arguments: [
                    {
                      kind: Kind.ARGUMENT,
                      name: {
                        kind: Kind.NAME,
                        value: 'gluten',
                      },
                      value: {
                        kind: Kind.BOOLEAN,
                        value: false,
                      },
                    },
                  ],
                },
              ],
            } as any as GraphQLResolveInfo)
          ).toEqual([
            {
              path: 'pie.top',
              value: false,
            },
            {
              path: 'cake.gluten',
              value: false,
            },
          ])
        })
        it('returns multiple items if multiple field nodes with mixed boolean arguments', () => {
          expect(
            RequestedFields.getArguments({
              fieldNodes: [
                {
                  kind: Kind.FIELD,
                  name: {
                    value: 'pie',
                  },
                  arguments: [
                    {
                      kind: Kind.ARGUMENT,
                      name: {
                        kind: Kind.NAME,
                        value: 'top',
                      },
                      value: {
                        kind: Kind.BOOLEAN,
                        value: true,
                      },
                    },
                  ],
                },
                {
                  kind: Kind.FIELD,
                  name: {
                    value: 'cake',
                  },
                  arguments: [
                    {
                      kind: Kind.ARGUMENT,
                      name: {
                        kind: Kind.NAME,
                        value: 'gluten',
                      },
                      value: {
                        kind: Kind.BOOLEAN,
                        value: false,
                      },
                    },
                  ],
                },
              ],
            } as any as GraphQLResolveInfo)
          ).toEqual([
            {
              path: 'pie.top',
              value: true,
            },
            {
              path: 'cake.gluten',
              value: false,
            },
          ])
        })
        it('returns multiple items if single field node with nested boolean arguments', () => {
          expect(
            RequestedFields.getArguments({
              fieldNodes: [
                {
                  kind: Kind.FIELD,
                  name: {
                    value: 'pie',
                  },
                  arguments: [
                    {
                      kind: Kind.ARGUMENT,
                      name: {
                        kind: Kind.NAME,
                        value: 'top',
                      },
                      value: {
                        kind: Kind.BOOLEAN,
                        value: true,
                      },
                    },
                  ],
                  selectionSet: {
                    selections: [
                      {
                        kind: Kind.FIELD,
                        name: {
                          value: 'filling',
                        },
                        arguments: [
                          {
                            kind: Kind.ARGUMENT,
                            name: {
                              kind: Kind.NAME,
                              value: 'fruit',
                            },
                            value: {
                              kind: Kind.BOOLEAN,
                              value: true,
                            },
                          },
                        ],
                      },
                    ],
                  },
                },
              ],
            } as any as GraphQLResolveInfo)
          ).toEqual([
            {
              path: 'pie.top',
              value: true,
            },
            {
              path: 'pie.filling.fruit',
              value: true,
            },
          ])
        })
      })
      describe('StringValue', () => {
        it('returns single item if single field node with string argument', () => {
          expect(
            RequestedFields.getArguments({
              fieldNodes: [
                {
                  kind: Kind.FIELD,
                  name: {
                    value: 'pie',
                  },
                  arguments: [
                    {
                      kind: Kind.ARGUMENT,
                      name: {
                        kind: Kind.NAME,
                        value: 'filling',
                      },
                      value: {
                        kind: Kind.STRING,
                        value: 'fruit',
                      },
                    },
                  ],
                },
              ],
            } as any as GraphQLResolveInfo)
          ).toEqual([
            {
              path: 'pie.filling',
              value: 'fruit',
            },
          ])
        })
        it('returns multiple items if multiple field nodes with string argument', () => {
          expect(
            RequestedFields.getArguments({
              fieldNodes: [
                {
                  kind: Kind.FIELD,
                  name: {
                    value: 'pie',
                  },
                  arguments: [
                    {
                      kind: Kind.ARGUMENT,
                      name: {
                        kind: Kind.NAME,
                        value: 'filling',
                      },
                      value: {
                        kind: Kind.STRING,
                        value: 'fruit',
                      },
                    },
                  ],
                },
                {
                  kind: Kind.FIELD,
                  name: {
                    value: 'cake',
                  },
                  arguments: [
                    {
                      kind: Kind.ARGUMENT,
                      name: {
                        kind: Kind.NAME,
                        value: 'flavor',
                      },
                      value: {
                        kind: Kind.STRING,
                        value: 'red velvet',
                      },
                    },
                  ],
                },
              ],
            } as any as GraphQLResolveInfo)
          ).toEqual([
            {
              path: 'pie.filling',
              value: 'fruit',
            },
            {
              path: 'cake.flavor',
              value: 'red velvet',
            },
          ])
        })
        it('returns multiple items if single field node with nested string arguments', () => {
          expect(
            RequestedFields.getArguments({
              fieldNodes: [
                {
                  kind: Kind.FIELD,
                  name: {
                    value: 'pie',
                  },
                  arguments: [
                    {
                      kind: Kind.ARGUMENT,
                      name: {
                        kind: Kind.NAME,
                        value: 'filling',
                      },
                      value: {
                        kind: Kind.STRING,
                        value: 'fruit',
                      },
                    },
                  ],
                  selectionSet: {
                    selections: [
                      {
                        kind: Kind.FIELD,
                        name: {
                          value: 'filling',
                        },
                        arguments: [
                          {
                            kind: Kind.ARGUMENT,
                            name: {
                              kind: Kind.NAME,
                              value: 'fruit',
                            },
                            value: {
                              kind: Kind.STRING,
                              value: 'apple',
                            },
                          },
                        ],
                      },
                    ],
                  },
                },
              ],
            } as any as GraphQLResolveInfo)
          ).toEqual([
            {
              path: 'pie.filling',
              value: 'fruit',
            },
            {
              path: 'pie.filling.fruit',
              value: 'apple',
            },
          ])
        })
      })
      describe('VariableValue', () => {
        it('returns single item if single field node with variable argument', () => {
          expect(
            RequestedFields.getArguments({
              fieldNodes: [
                {
                  kind: Kind.FIELD,
                  name: {
                    value: 'pie',
                  },
                  arguments: [
                    {
                      kind: Kind.ARGUMENT,
                      name: {
                        kind: Kind.NAME,
                        value: 'filling',
                      },
                      value: {
                        kind: Kind.VARIABLE,
                        name: {
                          value: 'filling',
                        },
                      },
                    },
                  ],
                },
              ],
              variableValues: {
                filling: 'fruit',
              },
            } as any as GraphQLResolveInfo)
          ).toEqual([
            {
              path: 'pie.filling',
              value: 'fruit',
            },
          ])
        })
        it('returns multiple items if multiple field nodes with variable argument', () => {
          expect(
            RequestedFields.getArguments({
              fieldNodes: [
                {
                  kind: Kind.FIELD,
                  name: {
                    value: 'pie',
                  },
                  arguments: [
                    {
                      kind: Kind.ARGUMENT,
                      name: {
                        kind: Kind.NAME,
                        value: 'filling',
                      },
                      value: {
                        kind: Kind.VARIABLE,
                        name: {
                          value: 'filling',
                        },
                      },
                    },
                  ],
                },
                {
                  kind: Kind.FIELD,
                  name: {
                    value: 'cake',
                  },
                  arguments: [
                    {
                      kind: Kind.ARGUMENT,
                      name: {
                        kind: Kind.NAME,
                        value: 'flavor',
                      },
                      value: {
                        kind: Kind.VARIABLE,
                        name: {
                          value: 'flavor',
                        },
                      },
                    },
                  ],
                },
              ],
              variableValues: {
                filling: 'fruit',
                flavor: 'red velvet',
              },
            } as any as GraphQLResolveInfo)
          ).toEqual([
            {
              path: 'pie.filling',
              value: 'fruit',
            },
            {
              path: 'cake.flavor',
              value: 'red velvet',
            },
          ])
        })
        it('returns multiple items if single field node with nested variable arguments', () => {
          expect(
            RequestedFields.getArguments({
              fieldNodes: [
                {
                  kind: Kind.FIELD,
                  name: {
                    value: 'pie',
                  },
                  arguments: [
                    {
                      kind: Kind.ARGUMENT,
                      name: {
                        kind: Kind.NAME,
                        value: 'filling',
                      },
                      value: {
                        kind: Kind.VARIABLE,
                        name: {
                          value: 'filling',
                        },
                      },
                    },
                  ],
                  selectionSet: {
                    selections: [
                      {
                        kind: Kind.FIELD,
                        name: {
                          value: 'filling',
                        },
                        arguments: [
                          {
                            kind: Kind.ARGUMENT,
                            name: {
                              kind: Kind.NAME,
                              value: 'fruit',
                            },
                            value: {
                              kind: Kind.VARIABLE,
                              name: {
                                value: 'fruit',
                              },
                            },
                          },
                        ],
                      },
                    ],
                  },
                },
              ],
              variableValues: {
                filling: 'fruit',
                fruit: 'apple',
              },
            } as any as GraphQLResolveInfo)
          ).toEqual([
            {
              path: 'pie.filling',
              value: 'fruit',
            },
            {
              path: 'pie.filling.fruit',
              value: 'apple',
            },
          ])
        })
      })
    })
    describe('FragmentSpreadNode', () => {
      describe('BooleanValue', () => {
        it('returns single item if single fragment node with true boolean argument', () => {
          expect(
            RequestedFields.getArguments({
              fieldNodes: [
                {
                  kind: Kind.FRAGMENT_SPREAD,
                  name: {
                    value: 'PieFragment',
                  },
                },
              ],
              fragments: {
                PieFragment: {
                  selectionSet: {
                    selections: [
                      {
                        kind: Kind.FIELD,
                        name: {
                          value: 'pie',
                        },
                        arguments: [
                          {
                            kind: Kind.ARGUMENT,
                            name: {
                              kind: Kind.NAME,
                              value: 'top',
                            },
                            value: {
                              kind: Kind.BOOLEAN,
                              value: true,
                            },
                          },
                        ],
                      },
                    ],
                  },
                },
              },
            } as any as GraphQLResolveInfo)
          ).toEqual([
            {
              path: 'pie.top',
              value: true,
            },
          ])
        })
        it('returns single item if single fragment node with false boolean argument', () => {
          expect(
            RequestedFields.getArguments({
              fieldNodes: [
                {
                  kind: Kind.FRAGMENT_SPREAD,
                  name: {
                    value: 'PieFragment',
                  },
                },
              ],
              fragments: {
                PieFragment: {
                  selectionSet: {
                    selections: [
                      {
                        kind: Kind.FIELD,
                        name: {
                          value: 'pie',
                        },
                        arguments: [
                          {
                            kind: Kind.ARGUMENT,
                            name: {
                              kind: Kind.NAME,
                              value: 'top',
                            },
                            value: {
                              kind: Kind.BOOLEAN,
                              value: false,
                            },
                          },
                        ],
                      },
                    ],
                  },
                },
              },
            } as any as GraphQLResolveInfo)
          ).toEqual([
            {
              path: 'pie.top',
              value: false,
            },
          ])
        })
        it('returns multiple items if multiple fragment nodes with true boolean argument', () => {
          expect(
            RequestedFields.getArguments({
              fieldNodes: [
                {
                  kind: Kind.FRAGMENT_SPREAD,
                  name: {
                    value: 'PieFragment',
                  },
                },
                {
                  kind: Kind.FRAGMENT_SPREAD,
                  name: {
                    value: 'CakeFragment',
                  },
                },
              ],
              fragments: {
                PieFragment: {
                  selectionSet: {
                    selections: [
                      {
                        kind: Kind.FIELD,
                        name: {
                          value: 'pie',
                        },
                        arguments: [
                          {
                            kind: Kind.ARGUMENT,
                            name: {
                              kind: Kind.NAME,
                              value: 'top',
                            },
                            value: {
                              kind: Kind.BOOLEAN,
                              value: true,
                            },
                          },
                        ],
                      },
                    ],
                  },
                },
                CakeFragment: {
                  selectionSet: {
                    selections: [
                      {
                        kind: Kind.FIELD,
                        name: {
                          value: 'cake',
                        },
                        arguments: [
                          {
                            kind: Kind.ARGUMENT,
                            name: {
                              kind: Kind.NAME,
                              value: 'gluten',
                            },
                            value: {
                              kind: Kind.BOOLEAN,
                              value: true,
                            },
                          },
                        ],
                      },
                    ],
                  },
                },
              },
            } as any as GraphQLResolveInfo)
          ).toEqual([
            {
              path: 'pie.top',
              value: true,
            },
            {
              path: 'cake.gluten',
              value: true,
            },
          ])
        })
        it('returns multiple items if multiple fragment nodes with false boolean argument', () => {
          expect(
            RequestedFields.getArguments({
              fieldNodes: [
                {
                  kind: Kind.FRAGMENT_SPREAD,
                  name: {
                    value: 'PieFragment',
                  },
                },
                {
                  kind: Kind.FRAGMENT_SPREAD,
                  name: {
                    value: 'CakeFragment',
                  },
                },
              ],
              fragments: {
                PieFragment: {
                  selectionSet: {
                    selections: [
                      {
                        kind: Kind.FIELD,
                        name: {
                          value: 'pie',
                        },
                        arguments: [
                          {
                            kind: Kind.ARGUMENT,
                            name: {
                              kind: Kind.NAME,
                              value: 'top',
                            },
                            value: {
                              kind: Kind.BOOLEAN,
                              value: false,
                            },
                          },
                        ],
                      },
                    ],
                  },
                },
                CakeFragment: {
                  selectionSet: {
                    selections: [
                      {
                        kind: Kind.FIELD,
                        name: {
                          value: 'cake',
                        },
                        arguments: [
                          {
                            kind: Kind.ARGUMENT,
                            name: {
                              kind: Kind.NAME,
                              value: 'gluten',
                            },
                            value: {
                              kind: Kind.BOOLEAN,
                              value: false,
                            },
                          },
                        ],
                      },
                    ],
                  },
                },
              },
            } as any as GraphQLResolveInfo)
          ).toEqual([
            {
              path: 'pie.top',
              value: false,
            },
            {
              path: 'cake.gluten',
              value: false,
            },
          ])
        })
        it('returns multiple items if multiple fragment nodes with false mixed arguments', () => {
          expect(
            RequestedFields.getArguments({
              fieldNodes: [
                {
                  kind: Kind.FRAGMENT_SPREAD,
                  name: {
                    value: 'PieFragment',
                  },
                },
                {
                  kind: Kind.FRAGMENT_SPREAD,
                  name: {
                    value: 'CakeFragment',
                  },
                },
              ],
              fragments: {
                PieFragment: {
                  selectionSet: {
                    selections: [
                      {
                        kind: Kind.FIELD,
                        name: {
                          value: 'pie',
                        },
                        arguments: [
                          {
                            kind: Kind.ARGUMENT,
                            name: {
                              kind: Kind.NAME,
                              value: 'top',
                            },
                            value: {
                              kind: Kind.BOOLEAN,
                              value: true,
                            },
                          },
                        ],
                      },
                    ],
                  },
                },
                CakeFragment: {
                  selectionSet: {
                    selections: [
                      {
                        kind: Kind.FIELD,
                        name: {
                          value: 'cake',
                        },
                        arguments: [
                          {
                            kind: Kind.ARGUMENT,
                            name: {
                              kind: Kind.NAME,
                              value: 'gluten',
                            },
                            value: {
                              kind: Kind.BOOLEAN,
                              value: false,
                            },
                          },
                        ],
                      },
                    ],
                  },
                },
              },
            } as any as GraphQLResolveInfo)
          ).toEqual([
            {
              path: 'pie.top',
              value: true,
            },
            {
              path: 'cake.gluten',
              value: false,
            },
          ])
        })
        it('returns single item if single fragment node with nested boolean arguments', () => {
          expect(
            RequestedFields.getArguments({
              fieldNodes: [
                {
                  kind: Kind.FRAGMENT_SPREAD,
                  name: {
                    value: 'PieFragment',
                  },
                },
              ],
              fragments: {
                PieFragment: {
                  selectionSet: {
                    selections: [
                      {
                        kind: Kind.FIELD,
                        name: {
                          value: 'pie',
                        },
                        selectionSet: {
                          selections: [
                            {
                              kind: Kind.FIELD,
                              name: {
                                value: 'filling',
                              },
                              arguments: [
                                {
                                  kind: Kind.ARGUMENT,
                                  name: {
                                    kind: Kind.NAME,
                                    value: 'fruit',
                                  },
                                  value: {
                                    kind: Kind.BOOLEAN,
                                    value: true,
                                  },
                                },
                              ],
                            },
                          ],
                        },
                        arguments: [
                          {
                            kind: Kind.ARGUMENT,
                            name: {
                              kind: Kind.NAME,
                              value: 'top',
                            },
                            value: {
                              kind: Kind.BOOLEAN,
                              value: true,
                            },
                          },
                        ],
                      },
                    ],
                  },
                },
              },
            } as any as GraphQLResolveInfo)
          ).toEqual([
            {
              path: 'pie.top',
              value: true,
            },
            {
              path: 'pie.filling.fruit',
              value: true,
            },
          ])
        })
      })
      describe('StringValue', () => {
        it('returns single item if single fragment node with string argument', () => {
          expect(
            RequestedFields.getArguments({
              fieldNodes: [
                {
                  kind: Kind.FRAGMENT_SPREAD,
                  name: {
                    value: 'PieFragment',
                  },
                },
              ],
              fragments: {
                PieFragment: {
                  selectionSet: {
                    selections: [
                      {
                        kind: Kind.FIELD,
                        name: {
                          value: 'pie',
                        },
                        arguments: [
                          {
                            kind: Kind.ARGUMENT,
                            name: {
                              kind: Kind.NAME,
                              value: 'filling',
                            },
                            value: {
                              kind: Kind.STRING,
                              value: 'fruit',
                            },
                          },
                        ],
                      },
                    ],
                  },
                },
              },
            } as any as GraphQLResolveInfo)
          ).toEqual([
            {
              path: 'pie.filling',
              value: 'fruit',
            },
          ])
        })
        it('returns multiple items if multiple fragment nodes with string argument', () => {
          expect(
            RequestedFields.getArguments({
              fieldNodes: [
                {
                  kind: Kind.FRAGMENT_SPREAD,
                  name: {
                    value: 'PieFragment',
                  },
                },
                {
                  kind: Kind.FRAGMENT_SPREAD,
                  name: {
                    value: 'CakeFragment',
                  },
                },
              ],
              fragments: {
                PieFragment: {
                  selectionSet: {
                    selections: [
                      {
                        kind: Kind.FIELD,
                        name: {
                          value: 'pie',
                        },
                        arguments: [
                          {
                            kind: Kind.ARGUMENT,
                            name: {
                              kind: Kind.NAME,
                              value: 'filling',
                            },
                            value: {
                              kind: Kind.STRING,
                              value: 'fruit',
                            },
                          },
                        ],
                      },
                    ],
                  },
                },
                CakeFragment: {
                  selectionSet: {
                    selections: [
                      {
                        kind: Kind.FIELD,
                        name: {
                          value: 'cake',
                        },
                        arguments: [
                          {
                            kind: Kind.ARGUMENT,
                            name: {
                              kind: Kind.NAME,
                              value: 'flavor',
                            },
                            value: {
                              kind: Kind.STRING,
                              value: 'red velvet',
                            },
                          },
                        ],
                      },
                    ],
                  },
                },
              },
            } as any as GraphQLResolveInfo)
          ).toEqual([
            {
              path: 'pie.filling',
              value: 'fruit',
            },
            {
              path: 'cake.flavor',
              value: 'red velvet',
            },
          ])
        })
        it('returns multiple items if single fragment node with multiple string arguments', () => {
          expect(
            RequestedFields.getArguments({
              fieldNodes: [
                {
                  kind: Kind.FRAGMENT_SPREAD,
                  name: {
                    value: 'PieFragment',
                  },
                },
              ],
              fragments: {
                PieFragment: {
                  selectionSet: {
                    selections: [
                      {
                        kind: Kind.FIELD,
                        name: {
                          value: 'pie',
                        },
                        arguments: [
                          {
                            kind: Kind.ARGUMENT,
                            name: {
                              kind: Kind.NAME,
                              value: 'filling',
                            },
                            value: {
                              kind: Kind.STRING,
                              value: 'fruit',
                            },
                          },
                          {
                            kind: Kind.ARGUMENT,
                            name: {
                              kind: Kind.NAME,
                              value: 'crust',
                            },
                            value: {
                              kind: Kind.STRING,
                              value: 'crumble',
                            },
                          },
                        ],
                      },
                    ],
                  },
                },
              },
            } as any as GraphQLResolveInfo)
          ).toEqual([
            {
              path: 'pie.filling',
              value: 'fruit',
            },
            {
              path: 'pie.crust',
              value: 'crumble',
            },
          ])
        })
      })
      describe('VariableValue', () => {
        it('returns single item if single fragment node with variable argument', () => {
          expect(
            RequestedFields.getArguments({
              fieldNodes: [
                {
                  kind: Kind.FRAGMENT_SPREAD,
                  name: {
                    value: 'PieFragment',
                  },
                },
              ],
              fragments: {
                PieFragment: {
                  selectionSet: {
                    selections: [
                      {
                        kind: Kind.FIELD,
                        name: {
                          value: 'pie',
                        },
                        arguments: [
                          {
                            kind: Kind.ARGUMENT,
                            name: {
                              kind: Kind.NAME,
                              value: 'filling',
                            },
                            value: {
                              kind: Kind.VARIABLE,
                              name: {
                                value: 'filling',
                              },
                            },
                          },
                        ],
                      },
                    ],
                  },
                },
              },
              variableValues: {
                filling: 'fruit',
              },
            } as any as GraphQLResolveInfo)
          ).toEqual([
            {
              path: 'pie.filling',
              value: 'fruit',
            },
          ])
        })
        it('returns multiple items if multiple fragment nodes with variable argument', () => {
          expect(
            RequestedFields.getArguments({
              fieldNodes: [
                {
                  kind: Kind.FRAGMENT_SPREAD,
                  name: {
                    value: 'PieFragment',
                  },
                },
                {
                  kind: Kind.FRAGMENT_SPREAD,
                  name: {
                    value: 'CakeFragment',
                  },
                },
              ],
              fragments: {
                PieFragment: {
                  selectionSet: {
                    selections: [
                      {
                        kind: Kind.FIELD,
                        name: {
                          value: 'pie',
                        },
                        arguments: [
                          {
                            kind: Kind.ARGUMENT,
                            name: {
                              kind: Kind.NAME,
                              value: 'filling',
                            },
                            value: {
                              kind: Kind.VARIABLE,
                              name: {
                                value: 'filling',
                              },
                            },
                          },
                        ],
                      },
                    ],
                  },
                },
                CakeFragment: {
                  selectionSet: {
                    selections: [
                      {
                        kind: Kind.FIELD,
                        name: {
                          value: 'cake',
                        },
                        arguments: [
                          {
                            kind: Kind.ARGUMENT,
                            name: {
                              kind: Kind.NAME,
                              value: 'flavor',
                            },
                            value: {
                              kind: Kind.VARIABLE,
                              name: {
                                value: 'flavor',
                              },
                            },
                          },
                        ],
                      },
                    ],
                  },
                },
              },
              variableValues: {
                filling: 'fruit',
                flavor: 'red velvet',
              },
            } as any as GraphQLResolveInfo)
          ).toEqual([
            {
              path: 'pie.filling',
              value: 'fruit',
            },
            {
              path: 'cake.flavor',
              value: 'red velvet',
            },
          ])
        })
        it('returns multiple items if single fragment node with multiple variable arguments', () => {
          expect(
            RequestedFields.getArguments({
              fieldNodes: [
                {
                  kind: Kind.FRAGMENT_SPREAD,
                  name: {
                    value: 'PieFragment',
                  },
                },
              ],
              fragments: {
                PieFragment: {
                  selectionSet: {
                    selections: [
                      {
                        kind: Kind.FIELD,
                        name: {
                          value: 'pie',
                        },
                        arguments: [
                          {
                            kind: Kind.ARGUMENT,
                            name: {
                              kind: Kind.NAME,
                              value: 'filling',
                            },
                            value: {
                              kind: Kind.VARIABLE,
                              name: {
                                value: 'filling',
                              },
                            },
                          },
                          {
                            kind: Kind.ARGUMENT,
                            name: {
                              kind: Kind.NAME,
                              value: 'crust',
                            },
                            value: {
                              kind: Kind.VARIABLE,
                              name: {
                                value: 'crust',
                              },
                            },
                          },
                        ],
                      },
                    ],
                  },
                },
              },
              variableValues: {
                filling: 'fruit',
                crust: 'crumble',
              },
            } as any as GraphQLResolveInfo)
          ).toEqual([
            {
              path: 'pie.filling',
              value: 'fruit',
            },
            {
              path: 'pie.crust',
              value: 'crumble',
            },
          ])
        })
      })
    })
    describe('mixed nodes', () => {
      describe('BooleanValue', () => {
        it('returns single item if field node with fragment subnode with true boolean argument', () => {
          expect(
            RequestedFields.getArguments({
              fieldNodes: [
                {
                  kind: Kind.FIELD,
                  name: {
                    value: 'dessert',
                  },
                  selectionSet: {
                    selections: [
                      {
                        kind: Kind.FRAGMENT_SPREAD,
                        name: {
                          value: 'PieFragment',
                        },
                      },
                    ],
                  },
                },
              ],
              fragments: {
                PieFragment: {
                  selectionSet: {
                    selections: [
                      {
                        kind: Kind.FIELD,
                        name: {
                          value: 'pie',
                        },
                        arguments: [
                          {
                            kind: Kind.ARGUMENT,
                            name: {
                              kind: Kind.NAME,
                              value: 'top',
                            },
                            value: {
                              kind: Kind.BOOLEAN,
                              value: true,
                            },
                          },
                        ],
                      },
                    ],
                  },
                },
              },
            } as any as GraphQLResolveInfo)
          ).toEqual([
            {
              path: 'dessert.pie.top',
              value: true,
            },
          ])
        })
        it('returns single item if field node with fragment subnode with false boolean argument', () => {
          expect(
            RequestedFields.getArguments({
              fieldNodes: [
                {
                  kind: Kind.FIELD,
                  name: {
                    value: 'dessert',
                  },
                  selectionSet: {
                    selections: [
                      {
                        kind: Kind.FRAGMENT_SPREAD,
                        name: {
                          value: 'PieFragment',
                        },
                      },
                    ],
                  },
                },
              ],
              fragments: {
                PieFragment: {
                  selectionSet: {
                    selections: [
                      {
                        kind: Kind.FIELD,
                        name: {
                          value: 'pie',
                        },
                        arguments: [
                          {
                            kind: Kind.ARGUMENT,
                            name: {
                              kind: Kind.NAME,
                              value: 'top',
                            },
                            value: {
                              kind: Kind.BOOLEAN,
                              value: false,
                            },
                          },
                        ],
                      },
                    ],
                  },
                },
              },
            } as any as GraphQLResolveInfo)
          ).toEqual([
            {
              path: 'dessert.pie.top',
              value: false,
            },
          ])
        })
      })
      describe('StringValue', () => {
        it('returns single item if field node with fragment subnode with string argument', () => {
          expect(
            RequestedFields.getArguments({
              fieldNodes: [
                {
                  kind: Kind.FIELD,
                  name: {
                    value: 'dessert',
                  },
                  selectionSet: {
                    selections: [
                      {
                        kind: Kind.FRAGMENT_SPREAD,
                        name: {
                          value: 'PieFragment',
                        },
                      },
                    ],
                  },
                },
              ],
              fragments: {
                PieFragment: {
                  selectionSet: {
                    selections: [
                      {
                        kind: Kind.FIELD,
                        name: {
                          value: 'pie',
                        },
                        arguments: [
                          {
                            kind: Kind.ARGUMENT,
                            name: {
                              kind: Kind.NAME,
                              value: 'filling',
                            },
                            value: {
                              kind: Kind.STRING,
                              value: 'fruit',
                            },
                          },
                        ],
                      },
                    ],
                  },
                },
              },
            } as any as GraphQLResolveInfo)
          ).toEqual([
            {
              path: 'dessert.pie.filling',
              value: 'fruit',
            },
          ])
        })
      })
    })
  })
  describe('getArgument', () => {
    it('returns undefined if no arguments', () => {
      jest.spyOn(RequestedFields, 'getArguments').mockReturnValue([])
      expect(RequestedFields.getArgument({} as any as GraphQLResolveInfo, 'pie.filling')).toEqual(undefined)
    })
    it('returns undefined if argument path does not match path', () => {
      jest.spyOn(RequestedFields, 'getArguments').mockReturnValue([
        {
          path: 'cake.flavor',
          value: 'red velvet',
        },
      ])
      expect(RequestedFields.getArgument({} as any as GraphQLResolveInfo, 'pie.filling')).toEqual(undefined)
    })
    describe('boolean', () => {
      it('returns value if argument path matches path', () => {
        jest.spyOn(RequestedFields, 'getArguments').mockReturnValue([
          {
            path: 'pie.top',
            value: true,
          },
        ])
        expect(RequestedFields.getArgument<boolean>({} as any as GraphQLResolveInfo, 'pie.top')).toEqual(true)
      })
      it('returns value if argument path ends in path', () => {
        jest.spyOn(RequestedFields, 'getArguments').mockReturnValue([
          {
            path: 'pie.top.holes',
            value: true,
          },
        ])
        expect(RequestedFields.getArgument<boolean>({} as any as GraphQLResolveInfo, 'top.holes')).toEqual(true)
      })
    })
    describe('string', () => {
      it('returns value if argument path matches path', () => {
        jest.spyOn(RequestedFields, 'getArguments').mockReturnValue([
          {
            path: 'pie.filling',
            value: 'fruit',
          },
        ])
        expect(RequestedFields.getArgument<string>({} as any as GraphQLResolveInfo, 'pie.filling')).toEqual('fruit')
      })
      it('returns value if argument path ends in path', () => {
        jest.spyOn(RequestedFields, 'getArguments').mockReturnValue([
          {
            path: 'pie.filling.fruit',
            value: 'apple',
          },
        ])
        expect(RequestedFields.getArgument<string>({} as any as GraphQLResolveInfo, 'filling.fruit')).toEqual('apple')
      })
    })
  })
})
