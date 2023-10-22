import log4js from 'log4js'

import cards from '../../src/database/upgrades/cards.json'
import CardStore from '../../src/database/card-store'
import upgrade2, {
  normalizeCombat,
  normalizeCombats,
  normalizeDlc,
  normalizeEffect,
  normalizeEffects,
  normalizeFaction,
  normalizeLeader,
  normalizeScorchScope,
  normalizeUnit,
} from '../../src/database/upgrades/upgrade-2'

describe('upgrade-2', () => {
  describe('default', () => {
    it('calls to create card collection and indexes', async () => {
      const debugSpy = jest.fn().mockImplementation()
      jest.spyOn(log4js, 'getLogger').mockReturnValue({
        debug: debugSpy,
        isTraceEnabled: jest.fn().mockReturnValue(false),
      } as any)
      const addLeaderSpy = jest.spyOn(CardStore, 'addLeader').mockResolvedValue(undefined as any)
      const addUnitSpy = jest.spyOn(CardStore, 'addUnit').mockResolvedValue(undefined as any)

      await expect(upgrade2()).resolves.toEqual(undefined)

      expect(addLeaderSpy).toHaveBeenCalledTimes(22)
      expect(addUnitSpy).toHaveBeenCalledTimes(160)
      expect(debugSpy).toHaveBeenCalledTimes(182)
      expect(debugSpy.mock.calls.filter((call) => call[0].startsWith('Adding leader card "'))).toHaveLength(22)
      expect(debugSpy.mock.calls.filter((call) => call[0].startsWith('Adding unit card "'))).toHaveLength(160)
    })
    it('logs out if trace enabled', async () => {
      const debugSpy = jest.fn().mockImplementation()
      const traceSpy = jest.fn().mockImplementation()
      jest.spyOn(log4js, 'getLogger').mockReturnValue({
        debug: debugSpy,
        isTraceEnabled: jest.fn().mockReturnValue(true),
        trace: traceSpy,
      } as any)
      const addLeaderSpy = jest.spyOn(CardStore, 'addLeader').mockResolvedValue(undefined as any)
      const addUnitSpy = jest.spyOn(CardStore, 'addUnit').mockResolvedValue(undefined as any)

      await expect(upgrade2()).resolves.toEqual(undefined)

      expect(addLeaderSpy).toHaveBeenCalledTimes(22)
      expect(addUnitSpy).toHaveBeenCalledTimes(160)
      expect(debugSpy).toHaveBeenCalledTimes(182)
      expect(debugSpy.mock.calls.filter((call) => call[0].startsWith('Adding leader card "'))).toHaveLength(22)
      expect(debugSpy.mock.calls.filter((call) => call[0].startsWith('Adding unit card "'))).toHaveLength(160)
      expect(traceSpy.mock.calls).toEqual([[`cards: "${JSON.stringify(cards)}"`]])
    })
  })
  describe('normalizeLeader', () => {
    it('returns leader with normalized field names and values', () => {
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
      const name = 'without-unit'
      expect(() =>
        normalizeUnit({
          Name: name,
        })
      ).toThrow(`Card "${name}" has "occurrences" set to "undefined": Must be a positive integer.`)
    })
    it('returns unit with normalized field names and values with required fields', () => {
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
      const faction = 'Toussaint'
      expect(() =>
        normalizeFaction({
          Faction: faction,
        })
      ).toThrow(`Invalid Faction "${faction}"`)
    })
    it('returns MONSTERS for Monsters', () => {
      expect(
        normalizeFaction({
          Faction: 'Monsters',
        })
      ).toEqual('MONSTERS')
    })
    it('returns NEUTRAL for Neutral', () => {
      expect(
        normalizeFaction({
          Faction: 'Neutral',
        })
      ).toEqual('NEUTRAL')
    })
    it('returns NILFGAARDIAN_EMPIRE for Nilfgaardian Empire', () => {
      expect(
        normalizeFaction({
          Faction: 'Nilfgaardian Empire',
        })
      ).toEqual('NILFGAARDIAN_EMPIRE')
    })
    it('returns NORTHERN_REALMS for Northern Realms', () => {
      expect(
        normalizeFaction({
          Faction: 'Northern Realms',
        })
      ).toEqual('NORTHERN_REALMS')
    })
    it("returns SCOIA_TAEL for Scoia'tael", () => {
      expect(
        normalizeFaction({
          Faction: "Scoia'tael",
        })
      ).toEqual('SCOIA_TAEL')
    })
    it('returns SKELLIGE for Skellige', () => {
      expect(
        normalizeFaction({
          Faction: 'Skellige',
        })
      ).toEqual('SKELLIGE')
    })
  })
  describe('normalizeDlc', () => {
    it('throws error on invalid dlc', () => {
      const dlc = 'Horse Armor'
      expect(() =>
        normalizeDlc({
          DLC: dlc,
        })
      ).toThrow(`Invalid DLC "${dlc}"`)
    })
    it('returns null for undefined', () => {
      expect(
        normalizeDlc({
          DLC: undefined,
        })
      ).toEqual(null)
    })
    it('returns HEARTS_OF_STONE for Hearts of Stone', () => {
      expect(
        normalizeDlc({
          DLC: 'Hearts of Stone',
        })
      ).toEqual('HEARTS_OF_STONE')
    })
    it('returns BLOOD_AND_WINE for Blood and Wine', () => {
      expect(
        normalizeDlc({
          DLC: 'Blood and Wine',
        })
      ).toEqual('BLOOD_AND_WINE')
    })
    it('returns GWENT_THE_WITCHER_CARD_GAME for Gwent: The Witcher Card Game', () => {
      expect(
        normalizeDlc({
          DLC: 'Gwent: The Witcher Card Game',
        })
      ).toEqual('GWENT_THE_WITCHER_CARD_GAME')
    })
  })
  describe('normalizeCombats', () => {
    it('throws error on invalid combat 1', () => {
      const combat = 'close'
      expect(() =>
        normalizeCombats({
          ['Combat 1']: combat,
        })
      ).toThrow(`Invalid Combat "${combat}"`)
    })
    it('throws error on invalid combat 2', () => {
      const combat = 'close'
      expect(() =>
        normalizeCombats({
          ['Combat 2']: combat,
        })
      ).toThrow(`Invalid Combat "${combat}"`)
    })
    it('returns empty array if no combats', () => {
      expect(normalizeCombats({})).toEqual([])
    })
    it('returns single combat', () => {
      expect(
        normalizeCombats({
          ['Combat 1']: 'Close',
        })
      ).toEqual(['CLOSE'])
    })
    it('returns multiple combats', () => {
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
      const combat = 'close'
      expect(() => normalizeCombat(combat)).toThrow(`Invalid Combat "${combat}"`)
    })
    it('returns CLOSE for Close', () => {
      expect(normalizeCombat('Close')).toEqual('CLOSE')
    })
    it('returns RANGED for Ranged', () => {
      expect(normalizeCombat('Ranged')).toEqual('RANGED')
    })
    it('returns SIEGE for Siege', () => {
      expect(normalizeCombat('Siege')).toEqual('SIEGE')
    })
  })
  describe('normalizeEffects', () => {
    it('throws error if Effect 1 invalid', () => {
      const effect = 'agile'
      expect(() =>
        normalizeEffects({
          ['Effect 1']: effect,
        })
      ).toThrow(`Invalid Effect "${effect}"`)
    })
    it('throws error if Effect 2 invalid', () => {
      const effect = 'agile'
      expect(() =>
        normalizeEffects({
          ['Effect 2']: effect,
        })
      ).toThrow(`Invalid Effect "${effect}"`)
    })
    it('returns empty array if no effects', () => {
      expect(normalizeEffects({})).toEqual([])
    })
    it('normalizes single effect', () => {
      expect(
        normalizeEffects({
          ['Effect 1']: 'Agile',
        })
      ).toEqual(['AGILE'])
    })
    it('normalizes multiple effects', () => {
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
      const effect = 'bond'
      expect(() => normalizeEffect(effect)).toThrow(`Invalid Effect "${effect}"`)
    })
    it('returns AGILE for Agile', () => {
      expect(normalizeEffect('Agile')).toEqual('AGILE')
    })
    it('returns AVENGER for Avenger', () => {
      expect(normalizeEffect('Avenger')).toEqual('AVENGER')
    })
    it('returns BERSERKER for Berserker', () => {
      expect(normalizeEffect('Berserker')).toEqual('BERSERKER')
    })
    it('returns BOND for Bond', () => {
      expect(normalizeEffect('Bond')).toEqual('BOND')
    })
    it('returns DECOY for Decoy', () => {
      expect(normalizeEffect('Decoy')).toEqual('DECOY')
    })
    it('returns HORN for Horn', () => {
      expect(normalizeEffect('Horn')).toEqual('HORN')
    })
    it('returns MARDROEME for Mardroeme', () => {
      expect(normalizeEffect('Mardroeme')).toEqual('MARDROEME')
    })
    it('returns MEDIC for Medic', () => {
      expect(normalizeEffect('Medic')).toEqual('MEDIC')
    })
    it('returns MORALE for Morale', () => {
      expect(normalizeEffect('Morale')).toEqual('MORALE')
    })
    it('returns MUSTER for Muster', () => {
      expect(normalizeEffect('Muster')).toEqual('MUSTER')
    })
    it('returns SCORCH for Scorch', () => {
      expect(normalizeEffect('Scorch')).toEqual('SCORCH')
    })
    it('returns SPY for Spy', () => {
      expect(normalizeEffect('Spy')).toEqual('SPY')
    })
    it('returns WEATHER for Weather', () => {
      expect(normalizeEffect('Weather')).toEqual('WEATHER')
    })
  })
  describe('normalizeScorchScope', () => {
    it('returns null if no Scorch Scope', () => {
      expect(normalizeScorchScope({})).toEqual(null)
    })
    it('returns normalized combat if present', () => {
      expect(
        normalizeScorchScope({
          ['Scorch Scope']: 'Close',
        })
      ).toEqual('CLOSE')
    })
  })
})
