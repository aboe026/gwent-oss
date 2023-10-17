describe('upgrade-2', () => {
  describe('default', () => {
    it('calls to create card collection and indexes', async () => {
      const debugSpy = jest.fn().mockImplementation()
      jest.mock('log4js', () => ({
        getLogger: jest.fn().mockReturnValue({
          debug: debugSpy,
          isTraceEnabled: jest.fn().mockReturnValue(false),
        }),
      }))
      const upgrade2 = require('../../src/database/upgrades/upgrade-2').default // eslint-disable-line @typescript-eslint/no-var-requires
      const CardStore = require('../../src/database/card-store').default // eslint-disable-line @typescript-eslint/no-var-requires
      const addLeaderSpy = jest.spyOn(CardStore, 'addLeader').mockImplementation()
      const addUnitSpy = jest.spyOn(CardStore, 'addUnit').mockImplementation()

      await expect(upgrade2()).resolves.toEqual(undefined)

      expect(debugSpy).toHaveBeenCalledTimes(182)
      expect(debugSpy.mock.calls.filter((call) => call[0].startsWith('Adding leader card "'))).toHaveLength(22)
      expect(debugSpy.mock.calls.filter((call) => call[0].startsWith('Adding unit card "'))).toHaveLength(160)
      expect(addLeaderSpy).toHaveBeenCalledTimes(22)
      expect(addUnitSpy).toHaveBeenCalledTimes(160)
    })
    it('logs out if trace enabled', async () => {
      const debugSpy = jest.fn().mockImplementation()
      const traceSpy = jest.fn().mockImplementation()
      jest.mock('log4js', () => ({
        getLogger: jest.fn().mockReturnValue({
          debug: debugSpy,
          isTraceEnabled: jest.fn().mockReturnValue(true),
          trace: traceSpy,
        }),
      }))
      const upgrade2 = require('../../src/database/upgrades/upgrade-2').default // eslint-disable-line @typescript-eslint/no-var-requires
      const cards = require('../../src/database/upgrades/cards.json') // eslint-disable-line @typescript-eslint/no-var-requires
      const CardStore = require('../../src/database/card-store').default // eslint-disable-line @typescript-eslint/no-var-requires
      const addLeaderSpy = jest.spyOn(CardStore, 'addLeader').mockImplementation()
      const addUnitSpy = jest.spyOn(CardStore, 'addUnit').mockImplementation()

      await expect(upgrade2()).resolves.toEqual(undefined)

      expect(debugSpy).toHaveBeenCalledTimes(182)
      expect(debugSpy.mock.calls.filter((call) => call[0].startsWith('Adding leader card "'))).toHaveLength(22)
      expect(debugSpy.mock.calls.filter((call) => call[0].startsWith('Adding unit card "'))).toHaveLength(160)
      expect(traceSpy.mock.calls).toEqual([[`cards: "${JSON.stringify(cards)}"`]])
      expect(addLeaderSpy).toHaveBeenCalledTimes(22)
      expect(addUnitSpy).toHaveBeenCalledTimes(160)
    })
  })
  describe('normalizeLeader', () => {
    it('returns leader with normalized field names and values', () => {
      const { normalizeLeader } = require('../../src/database/upgrades/upgrade-2') // eslint-disable-line @typescript-eslint/no-var-requires

      expect(
        normalizeLeader({
          Name: 'Crach an Craite',
          Faction: 'Skellige',
          DLC: 'Blood and Wine',
        })
      ).toEqual({
        name: 'Crach an Craite',
        faction: 'SKELLIGE',
        dlc: 'BLOOD_AND_WINE',
      })
    })
  })
  describe('normalizeUnit', () => {
    it('throws error if occurrences is undefined', () => {
      const { normalizeUnit } = require('../../src/database/upgrades/upgrade-2') // eslint-disable-line @typescript-eslint/no-var-requires

      const name = 'without-unit'
      expect(() =>
        normalizeUnit({
          Name: name,
        })
      ).toThrow(`Card "${name}" has "occurrences" set to "undefined": Must be a positive integer.`)
    })
    it('returns unit with normalized field names and values with required fields', () => {
      const { normalizeUnit } = require('../../src/database/upgrades/upgrade-2') // eslint-disable-line @typescript-eslint/no-var-requires

      expect(
        normalizeUnit({
          Name: 'Olaf',
          Faction: 'Skellige',
          Occurrences: 1,
          ['Combat 1']: 'Close',
        })
      ).toEqual({
        name: 'Olaf',
        faction: 'SKELLIGE',
        occurrences: 1,
        dlc: null,
        combats: ['CLOSE'],
        hero: false,
        strength: null,
        effects: [],
        scorchScope: null,
        scorchMin: null,
        musterPrefix: null,
      })
    })
    it('returns unit with normalized field names and values with optional fields', () => {
      const { normalizeUnit } = require('../../src/database/upgrades/upgrade-2') // eslint-disable-line @typescript-eslint/no-var-requires

      expect(
        normalizeUnit({
          Name: 'Olaf',
          Faction: 'Skellige',
          Occurrences: 1,
          DLC: 'Blood and Wine',
          ['Combat 1']: 'Close',
          ['Combat 2']: 'Ranged',
          Strength: 12,
          ['Effect 1']: 'Agile',
          ['Effect 2']: 'Morale',
          ['Scorch Scope']: 'Ranged',
          ['Scorch Minimum Strength']: 10,
          ['Muster Prefix']: 'crach',
        })
      ).toEqual({
        name: 'Olaf',
        faction: 'SKELLIGE',
        occurrences: 1,
        dlc: 'BLOOD_AND_WINE',
        combats: ['CLOSE', 'RANGED'],
        hero: false,
        strength: 12,
        effects: ['AGILE', 'MORALE'],
        scorchScope: 'RANGED',
        scorchMin: 10,
        musterPrefix: 'crach',
      })
    })
  })
  describe('normalizeFaction', () => {
    it('throws error on invalid faction', () => {
      const { normalizeFaction } = require('../../src/database/upgrades/upgrade-2') // eslint-disable-line @typescript-eslint/no-var-requires

      const faction = 'Toussaint'
      expect(() =>
        normalizeFaction({
          Faction: faction,
        })
      ).toThrow(`Invalid Faction "${faction}"`)
    })
    it('returns MONSTERS for Monsters', () => {
      const { normalizeFaction } = require('../../src/database/upgrades/upgrade-2') // eslint-disable-line @typescript-eslint/no-var-requires

      expect(
        normalizeFaction({
          Faction: 'Monsters',
        })
      ).toEqual('MONSTERS')
    })
    it('returns NEUTRAL for Neutral', () => {
      const { normalizeFaction } = require('../../src/database/upgrades/upgrade-2') // eslint-disable-line @typescript-eslint/no-var-requires

      expect(
        normalizeFaction({
          Faction: 'Neutral',
        })
      ).toEqual('NEUTRAL')
    })
    it('returns NILFGAARDIAN_EMPIRE for Nilfgaardian Empire', () => {
      const { normalizeFaction } = require('../../src/database/upgrades/upgrade-2') // eslint-disable-line @typescript-eslint/no-var-requires

      expect(
        normalizeFaction({
          Faction: 'Nilfgaardian Empire',
        })
      ).toEqual('NILFGAARDIAN_EMPIRE')
    })
    it('returns NORTHERN_REALMS for Northern Realms', () => {
      const { normalizeFaction } = require('../../src/database/upgrades/upgrade-2') // eslint-disable-line @typescript-eslint/no-var-requires

      expect(
        normalizeFaction({
          Faction: 'Northern Realms',
        })
      ).toEqual('NORTHERN_REALMS')
    })
    it("returns SCOIA_TAEL for Scoia'tael", () => {
      const { normalizeFaction } = require('../../src/database/upgrades/upgrade-2') // eslint-disable-line @typescript-eslint/no-var-requires

      expect(
        normalizeFaction({
          Faction: "Scoia'tael",
        })
      ).toEqual('SCOIA_TAEL')
    })
    it('returns SKELLIGE for Skellige', () => {
      const { normalizeFaction } = require('../../src/database/upgrades/upgrade-2') // eslint-disable-line @typescript-eslint/no-var-requires

      expect(
        normalizeFaction({
          Faction: 'Skellige',
        })
      ).toEqual('SKELLIGE')
    })
  })
  describe('normalizeDlc', () => {
    it('throws error on invalid dlc', () => {
      const { normalizeDlc } = require('../../src/database/upgrades/upgrade-2') // eslint-disable-line @typescript-eslint/no-var-requires

      const dlc = 'Horse Armor'
      expect(() =>
        normalizeDlc({
          DLC: dlc,
        })
      ).toThrow(`Invalid DLC "${dlc}"`)
    })
    it('returns null for undefined', () => {
      const { normalizeDlc } = require('../../src/database/upgrades/upgrade-2') // eslint-disable-line @typescript-eslint/no-var-requires

      expect(
        normalizeDlc({
          DLC: undefined,
        })
      ).toEqual(null)
    })
    it('returns HEARTS_OF_STONE for Hearts of Stone', () => {
      const { normalizeDlc } = require('../../src/database/upgrades/upgrade-2') // eslint-disable-line @typescript-eslint/no-var-requires

      expect(
        normalizeDlc({
          DLC: 'Hearts of Stone',
        })
      ).toEqual('HEARTS_OF_STONE')
    })
    it('returns BLOOD_AND_WINE for Blood and Wine', () => {
      const { normalizeDlc } = require('../../src/database/upgrades/upgrade-2') // eslint-disable-line @typescript-eslint/no-var-requires

      expect(
        normalizeDlc({
          DLC: 'Blood and Wine',
        })
      ).toEqual('BLOOD_AND_WINE')
    })
    it('returns GWENT_THE_WITCHER_CARD_GAME for Gwent: The Witcher Card Game', () => {
      const { normalizeDlc } = require('../../src/database/upgrades/upgrade-2') // eslint-disable-line @typescript-eslint/no-var-requires

      expect(
        normalizeDlc({
          DLC: 'Gwent: The Witcher Card Game',
        })
      ).toEqual('GWENT_THE_WITCHER_CARD_GAME')
    })
  })
  describe('normalizeCombats', () => {
    it('throws error on invalid combat 1', () => {
      const { normalizeCombats } = require('../../src/database/upgrades/upgrade-2') // eslint-disable-line @typescript-eslint/no-var-requires

      const combat = 'close'
      expect(() =>
        normalizeCombats({
          ['Combat 1']: combat,
        })
      ).toThrow(`Invalid Combat "${combat}"`)
    })
    it('throws error on invalid combat 2', () => {
      const { normalizeCombats } = require('../../src/database/upgrades/upgrade-2') // eslint-disable-line @typescript-eslint/no-var-requires

      const combat = 'close'
      expect(() =>
        normalizeCombats({
          ['Combat 2']: combat,
        })
      ).toThrow(`Invalid Combat "${combat}"`)
    })
    it('returns empty array if no combats', () => {
      const { normalizeCombats } = require('../../src/database/upgrades/upgrade-2') // eslint-disable-line @typescript-eslint/no-var-requires

      expect(normalizeCombats({})).toEqual([])
    })
    it('returns single combat', () => {
      const { normalizeCombats } = require('../../src/database/upgrades/upgrade-2') // eslint-disable-line @typescript-eslint/no-var-requires

      expect(
        normalizeCombats({
          ['Combat 1']: 'Close',
        })
      ).toEqual(['CLOSE'])
    })
    it('returns multiple combats', () => {
      const { normalizeCombats } = require('../../src/database/upgrades/upgrade-2') // eslint-disable-line @typescript-eslint/no-var-requires

      expect(
        normalizeCombats({
          ['Combat 1']: 'Close',
          ['Combat 2']: 'Ranged',
        })
      ).toEqual(['CLOSE', 'RANGED'])
    })
  })
  describe('normalizeCombat', () => {
    it('throws error if invalid', () => {
      const { normalizeCombat } = require('../../src/database/upgrades/upgrade-2') // eslint-disable-line @typescript-eslint/no-var-requires

      const combat = 'close'
      expect(() => normalizeCombat(combat)).toThrow(`Invalid Combat "${combat}"`)
    })
    it('returns CLOSE for Close', () => {
      const { normalizeCombat } = require('../../src/database/upgrades/upgrade-2') // eslint-disable-line @typescript-eslint/no-var-requires

      expect(normalizeCombat('Close')).toEqual('CLOSE')
    })
    it('returns RANGED for Ranged', () => {
      const { normalizeCombat } = require('../../src/database/upgrades/upgrade-2') // eslint-disable-line @typescript-eslint/no-var-requires

      expect(normalizeCombat('Ranged')).toEqual('RANGED')
    })
    it('returns SIEGE for Siege', () => {
      const { normalizeCombat } = require('../../src/database/upgrades/upgrade-2') // eslint-disable-line @typescript-eslint/no-var-requires

      expect(normalizeCombat('Siege')).toEqual('SIEGE')
    })
  })
  describe('normalizeEffects', () => {
    it('throws error if Effect 1 invalid', () => {
      const { normalizeEffects } = require('../../src/database/upgrades/upgrade-2') // eslint-disable-line @typescript-eslint/no-var-requires

      const effect = 'agile'
      expect(() =>
        normalizeEffects({
          ['Effect 1']: effect,
        })
      ).toThrow(`Invalid Effect "${effect}"`)
    })
    it('throws error if Effect 2 invalid', () => {
      const { normalizeEffects } = require('../../src/database/upgrades/upgrade-2') // eslint-disable-line @typescript-eslint/no-var-requires

      const effect = 'agile'
      expect(() =>
        normalizeEffects({
          ['Effect 2']: effect,
        })
      ).toThrow(`Invalid Effect "${effect}"`)
    })
    it('returns empty array if no effects', () => {
      const { normalizeEffects } = require('../../src/database/upgrades/upgrade-2') // eslint-disable-line @typescript-eslint/no-var-requires

      expect(normalizeEffects({})).toEqual([])
    })
    it('normalizes single effect', () => {
      const { normalizeEffects } = require('../../src/database/upgrades/upgrade-2') // eslint-disable-line @typescript-eslint/no-var-requires

      expect(
        normalizeEffects({
          ['Effect 1']: 'Agile',
        })
      ).toEqual(['AGILE'])
    })
    it('normalizes multiple effects', () => {
      const { normalizeEffects } = require('../../src/database/upgrades/upgrade-2') // eslint-disable-line @typescript-eslint/no-var-requires

      expect(
        normalizeEffects({
          ['Effect 1']: 'Agile',
          ['Effect 2']: 'Morale',
        })
      ).toEqual(['AGILE', 'MORALE'])
    })
  })
  describe('normalizeEffect', () => {
    it('throws error if invalid', () => {
      const { normalizeEffect } = require('../../src/database/upgrades/upgrade-2') // eslint-disable-line @typescript-eslint/no-var-requires

      const effect = 'bond'
      expect(() => normalizeEffect(effect)).toThrow(`Invalid Effect "${effect}"`)
    })
    it('returns AGILE for Agile', () => {
      const { normalizeEffect } = require('../../src/database/upgrades/upgrade-2') // eslint-disable-line @typescript-eslint/no-var-requires

      expect(normalizeEffect('Agile')).toEqual('AGILE')
    })
    it('returns AVENGER for Avenger', () => {
      const { normalizeEffect } = require('../../src/database/upgrades/upgrade-2') // eslint-disable-line @typescript-eslint/no-var-requires

      expect(normalizeEffect('Avenger')).toEqual('AVENGER')
    })
    it('returns BERSERKER for Berserker', () => {
      const { normalizeEffect } = require('../../src/database/upgrades/upgrade-2') // eslint-disable-line @typescript-eslint/no-var-requires

      expect(normalizeEffect('Berserker')).toEqual('BERSERKER')
    })
    it('returns BOND for Bond', () => {
      const { normalizeEffect } = require('../../src/database/upgrades/upgrade-2') // eslint-disable-line @typescript-eslint/no-var-requires

      expect(normalizeEffect('Bond')).toEqual('BOND')
    })
    it('returns DECOY for Decoy', () => {
      const { normalizeEffect } = require('../../src/database/upgrades/upgrade-2') // eslint-disable-line @typescript-eslint/no-var-requires

      expect(normalizeEffect('Decoy')).toEqual('DECOY')
    })
    it('returns HORN for Horn', () => {
      const { normalizeEffect } = require('../../src/database/upgrades/upgrade-2') // eslint-disable-line @typescript-eslint/no-var-requires

      expect(normalizeEffect('Horn')).toEqual('HORN')
    })
    it('returns MARDROEME for Mardroeme', () => {
      const { normalizeEffect } = require('../../src/database/upgrades/upgrade-2') // eslint-disable-line @typescript-eslint/no-var-requires

      expect(normalizeEffect('Mardroeme')).toEqual('MARDROEME')
    })
    it('returns MEDIC for Medic', () => {
      const { normalizeEffect } = require('../../src/database/upgrades/upgrade-2') // eslint-disable-line @typescript-eslint/no-var-requires

      expect(normalizeEffect('Medic')).toEqual('MEDIC')
    })
    it('returns MORALE for Morale', () => {
      const { normalizeEffect } = require('../../src/database/upgrades/upgrade-2') // eslint-disable-line @typescript-eslint/no-var-requires

      expect(normalizeEffect('Morale')).toEqual('MORALE')
    })
    it('returns MUSTER for Muster', () => {
      const { normalizeEffect } = require('../../src/database/upgrades/upgrade-2') // eslint-disable-line @typescript-eslint/no-var-requires

      expect(normalizeEffect('Muster')).toEqual('MUSTER')
    })
    it('returns SCORCH for Scorch', () => {
      const { normalizeEffect } = require('../../src/database/upgrades/upgrade-2') // eslint-disable-line @typescript-eslint/no-var-requires

      expect(normalizeEffect('Scorch')).toEqual('SCORCH')
    })
    it('returns SPY for Spy', () => {
      const { normalizeEffect } = require('../../src/database/upgrades/upgrade-2') // eslint-disable-line @typescript-eslint/no-var-requires

      expect(normalizeEffect('Spy')).toEqual('SPY')
    })
    it('returns WEATHER for Weather', () => {
      const { normalizeEffect } = require('../../src/database/upgrades/upgrade-2') // eslint-disable-line @typescript-eslint/no-var-requires

      expect(normalizeEffect('Weather')).toEqual('WEATHER')
    })
  })
  describe('normalizeScorchScope', () => {
    it('returns null if no Scorch Scope', () => {
      const { normalizeScorchScope } = require('../../src/database/upgrades/upgrade-2') // eslint-disable-line @typescript-eslint/no-var-requires

      expect(normalizeScorchScope({})).toEqual(null)
    })
    it('returns normalized combat if present', () => {
      const { normalizeScorchScope } = require('../../src/database/upgrades/upgrade-2') // eslint-disable-line @typescript-eslint/no-var-requires

      expect(
        normalizeScorchScope({
          ['Scorch Scope']: 'Close',
        })
      ).toEqual('CLOSE')
    })
  })
})
