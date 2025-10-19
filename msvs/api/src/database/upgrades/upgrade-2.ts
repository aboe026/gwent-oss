import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import {
  Combat,
  DlcDbObject,
  DlcKey,
  EffectDbObject,
  EffectKey,
  FactionDbObject,
  FactionKey,
  UnitDbObject,
} from '@gwent/graphql-schema/database-typings'
import dlcs from './resources/dlcs.json'
import DlcStore, { AddDlcInput } from '../stores/dlc-store'
import effects from './resources/effects.json'
import EffectStore, { AddEffectInput } from '../stores/effect-store'
import factions from './resources/factions.json'
import FactionStore, { AddFactionInput } from '../stores/faction-store'
import { GetUnitStats } from '@gwent/utils'
import leaders from './resources/leaders.json'
import LeaderStore, { AddLeaderInput } from '../stores/leader-store'
import units from './resources/units.json'
import UnitStore, { AddUnitInput } from '../stores/unit-store'
import { Unit } from '@gwent/graphql-schema/resolver-typings'
import Upgrade from './upgrade'
import { validatePositiveInteger } from '@gwent/validators'

/**
 * Adds resources required to create decks.
 */
export default class Upgrade2 extends Upgrade {
  static logger = getLogger('Upgrade2')

  /**
   * Run these upgrade operations against the database.
   */
  async run() {
    const dlcMap = await this.createDlcs({
      dlcs,
    })
    const { effectDocs, effectMap } = await this.createEffects({
      effects,
    })
    const { factionDocs, factionMap } = await this.createFactions({
      factions,
      dlcMap,
    })

    await this.createLeaders({
      leaders,
      dlcMap,
      factionMap,
    })

    const factionUnits = await this.createUnits({
      units,
      dlcMap,
      effectMap,
      factionDocs,
      factionMap,
    })

    for (const factionId of Object.keys(factionUnits)) {
      await FactionStore.edit({
        id: factionId,
        stats: GetUnitStats.fromDeckUnits(
          factionUnits[factionId].map((unit) => {
            unit.effects = unit.effects?.map((effectId) =>
              effectDocs.find((effectDoc) => effectDoc._id.toString() === effectId.toString())
            ) as any // eslint-disable-line @typescript-eslint/no-explicit-any
            return {
              unit: unit as any as Unit, // eslint-disable-line @typescript-eslint/no-explicit-any
              artStyle: 1,
            }
          })
        ),
      })
    }
  }

  /**
   * Adds DLCs to the database based on their JSON representations.
   *
   * @param config The configuration used to add the DLCs to the database.
   * @param config.dlcs The JSON representation of the DLCs to add to the database.
   * @returns A map of DLCs keys to their respective IDs.
   */
  async createDlcs({ dlcs }: { dlcs: DlcJson[] }): Promise<KeyIdMap> {
    Upgrade2.logger.debug('Adding dlcs')

    if (Upgrade2.logger.isTraceEnabled()) {
      Upgrade2.logger.trace(`dlcs: "${JSON.stringify(dlcs)}"`)
    }
    const dlcDocs: DlcDbObject[] = []
    for (const dlc of dlcs) {
      dlcDocs.push(await DlcStore.add(this.normalizeDlc(dlc)))
    }
    if (Upgrade2.logger.isTraceEnabled()) {
      Upgrade2.logger.trace(`dlcDocs: "${JSON.stringify(dlcDocs)}"`)
    }
    const dlcMap: KeyIdMap = {}
    for (const createdDlc of dlcDocs) {
      dlcMap[createdDlc.name] = createdDlc._id
    }
    if (Upgrade2.logger.isTraceEnabled()) {
      Upgrade2.logger.trace(`dlcMap: "${JSON.stringify(dlcMap)}"`)
    }

    return dlcMap
  }

  /**
   * Adds Effects to the database based on their JSON representations.
   *
   * @param config The configuration used to add the Effects to the database.
   * @param config.effects The JSON representation of the Effects to add to the database.
   * @returns All inserted Effect database documents and a map of Effect keys to their respective IDs.
   */
  async createEffects({ effects }: { effects: EffectJson[] }): Promise<{
    effectDocs: EffectDbObject[]
    effectMap: KeyIdMap
  }> {
    Upgrade2.logger.debug('Adding effects')
    if (Upgrade2.logger.isTraceEnabled()) {
      Upgrade2.logger.trace(`effects: "${JSON.stringify(effects)}"`)
    }
    const effectDocs: EffectDbObject[] = []
    for (const effect of effects) {
      effectDocs.push(await EffectStore.add(this.normalizeEffect(effect)))
    }
    if (Upgrade2.logger.isTraceEnabled()) {
      Upgrade2.logger.trace(`effectDocs: "${JSON.stringify(effectDocs)}"`)
    }
    const effectMap: KeyIdMap = {}
    for (const createdEffect of effectDocs) {
      effectMap[createdEffect.name] = createdEffect._id
    }
    if (Upgrade2.logger.isTraceEnabled()) {
      Upgrade2.logger.trace(`effectMap: "${JSON.stringify(effectMap)}"`)
    }

    return {
      effectDocs,
      effectMap,
    }
  }

  /**
   * Adds Factions to the database based on their JSON representations.
   *
   * @param config The configuration used to add the Factions to the database.
   * @param config.factions The JSON representation of the Factions to add to the database.
   * @param config.dlcMap A map of DLC keys to database IDs.
   * @returns All inserted Faction database documents and a map of Faction keys to their respective IDs.
   */
  async createFactions({ factions, dlcMap }: { factions: FactionJson[]; dlcMap: KeyIdMap }): Promise<{
    factionDocs: FactionDbObject[]
    factionMap: KeyIdMap
  }> {
    Upgrade2.logger.debug('Adding factions')
    if (Upgrade2.logger.isTraceEnabled()) {
      Upgrade2.logger.trace(`factions: "${JSON.stringify(factions)}"`)
    }
    const factionDocs: FactionDbObject[] = []
    for (const faction of factions) {
      factionDocs.push(
        await FactionStore.add(
          this.normalizeFaction({
            dlcMap,
            faction,
          })
        )
      )
    }
    if (Upgrade2.logger.isTraceEnabled()) {
      Upgrade2.logger.trace(`factionDocs: "${JSON.stringify(factionDocs)}"`)
    }
    const factionMap: KeyIdMap = {}
    for (const createdFaction of factionDocs) {
      factionMap[createdFaction.name] = createdFaction._id
    }
    if (Upgrade2.logger.isTraceEnabled()) {
      Upgrade2.logger.trace(`factionMap: "${JSON.stringify(factionMap)}"`)
    }

    return {
      factionDocs,
      factionMap,
    }
  }

  /**
   * Adds Leaders to the database based on their JSON representations.
   *
   * @param config The configuration used to add the Leaders to the database.
   * @param config.leaders The JSON representation of the Leaders to add to the database.
   * @param config.dlcMap A map of DLC keys to database IDs.
   * @param config.factionMap A map of Faction keys to database IDs.
   */
  async createLeaders({
    leaders,
    dlcMap,
    factionMap,
  }: {
    leaders: LeaderJson[]
    dlcMap: KeyIdMap
    factionMap: KeyIdMap
  }) {
    Upgrade2.logger.debug('Adding leaders')
    if (Upgrade2.logger.isTraceEnabled()) {
      Upgrade2.logger.trace(`leaders: "${JSON.stringify(leaders)}"`)
    }
    for (const leader of leaders) {
      Upgrade2.logger.debug(`Adding leader "${leader.Name}"`)
      await LeaderStore.add(
        this.normalizeLeader({
          leader,
          dlcMap,
          factionMap,
        })
      )
    }
  }

  /**
   * Adds Units to the database based on their JSON representations.
   *
   * @param config The configuration used to add the Units to the database.
   * @param config.units The JSON representation of the Units to add to the database.
   * @param config.dlcMap A map of DLC keys to database IDs.
   * @param config.effectMap A map of Effect keys to database IDs.
   * @param config.factionDocs A list of all Faction database objects.
   * @param config.factionMap A map of Faction keys to database IDs.
   * @returns A list of all inserted database documents.
   */
  async createUnits({
    units,
    dlcMap,
    effectMap,
    factionDocs,
    factionMap,
  }: {
    units: UnitJson[]
    dlcMap: KeyIdMap
    effectMap: KeyIdMap
    factionDocs: FactionDbObject[]
    factionMap: KeyIdMap
  }): Promise<FactionUnits> {
    Upgrade2.logger.debug('Adding units')
    if (Upgrade2.logger.isTraceEnabled()) {
      Upgrade2.logger.trace(`units: "${JSON.stringify(units)}"`)
    }

    const factionUnits: FactionUnits = {}
    for (const faction of factionDocs) {
      factionUnits[faction._id.toString()] = []
    }

    for (const unit of units) {
      let occurrences = 0
      try {
        occurrences = validatePositiveInteger(unit.Occurrences, {
          allowZero: false,
        })
      } catch (err) {
        throw Error(`Unit "${unit.Name}" has invalid "Occurrences": ${err}`)
      }
      for (let i = 0; i < occurrences; i++) {
        Upgrade2.logger.debug(`Adding unit "${unit.Name}" ${i + 1}/${occurrences}`)
        const unitDoc = await UnitStore.add(
          this.normalizeUnit({
            unit,
            dlcMap,
            effectMap,
            factionMap,
          })
        )
        factionUnits[unitDoc.faction.toString()].push(unitDoc)
      }
    }

    return factionUnits
  }

  /**
   * Get the data necessary to add the DLC to the database.
   *
   * @param dlc The JSON representation of the DLC.
   * @returns The inputs used to add the DLC to the database.
   */
  normalizeDlc(dlc: DlcJson): AddDlcInput {
    if (!dlc.Name) {
      throw Error(`Invalid dlc "${JSON.stringify(dlc)}": Must have "Name".`)
    }
    return {
      image: this.normalizeImage(dlc, ImageType.Dlc),
      key: this.normalizeDlcKey(dlc),
      name: dlc.Name,
    }
  }

  /**
   * Get the key for a DLC given its JSON.
   *
   * @param dlc The JSON representation of the DLC.
   * @returns The Key for the corresponding DLC.
   * @throws Error if DLC JSON does not match valid keys.
   */
  normalizeDlcKey(dlc: DlcJson): DlcKey {
    if (dlc.Name === 'Blood and Wine') {
      return DlcKey.BloodAndWine
    } else if (dlc.Name === 'Gwent: The Witcher Card Game') {
      return DlcKey.GwentTheWitcherCardGame
    } else if (dlc.Name === 'Hearts of Stone') {
      return DlcKey.HeartsOfStone
    }
    throw Error(`Invalid Dlc "${dlc.Name}"`)
  }

  /**
   * Get the data necessary to add the Effect to the database.
   *
   * @param effect The JSON representation of the Effect.
   * @returns The inputs used to add the Effect to the database.
   */
  normalizeEffect(effect: EffectJson): AddEffectInput {
    if (!effect.Name) {
      throw Error(`Invalid effect "${JSON.stringify(effect)}": Must have "Name".`)
    }
    if (!effect.Ability) {
      throw Error(`Invalid effect "${effect.Name}": Must have "Ability".`)
    }
    return {
      ability: effect.Ability,
      image: this.normalizeImage(effect, ImageType.Effect),
      key: this.normalizeEffectKey(effect),
      name: effect.Name,
    }
  }

  /**
   * Get the data necessary to add the Faction to the database.
   *
   * @param config The configuration used to get the data for insertion into the database.
   * @param config.faction The JSON representation of the Faction.
   * @param config.dlcMap A map of DLC keys to database IDs.
   * @returns The inputs used to add the Faction to the database.
   */
  normalizeFaction({ faction, dlcMap }: { faction: FactionJson; dlcMap: KeyIdMap }): AddFactionInput {
    if (!faction.Name) {
      throw Error(`Invalid faction "${JSON.stringify(faction)}": Must have "Name".`)
    }
    return {
      ability: faction.Ability || null,
      dlc: this.normalizeUnitDlc(faction, dlcMap),
      image: this.normalizeImage(faction, ImageType.Faction),
      key: this.normalizeFactionKey(faction),
      name: faction.Name,
    }
  }

  /**
   * Get the key for a Faction given its JSON.
   *
   * @param faction The JSON representation of the Faction.
   * @returns The Key for the corresponding faction.
   * @throws Error if faction JSON does not match valid keys.
   */
  normalizeFactionKey(faction: FactionJson): FactionKey {
    if (faction.Name === 'Monsters') {
      return FactionKey.Monsters
    } else if (faction.Name === 'Neutral') {
      return FactionKey.Neutral
    } else if (faction.Name === 'Nilfgaardian Empire') {
      return FactionKey.NilfgaardianEmpire
    } else if (faction.Name === 'Northern Realms') {
      return FactionKey.NorthernRealms
    } else if (faction.Name === "Scoia'tael") {
      return FactionKey.ScoiaTael
    } else if (faction.Name === 'Skellige') {
      return FactionKey.Skellige
    }
    throw Error(`Invalid Faction "${faction.Name}"`)
  }

  /**
   * Get the data necessary to add the Leader to the database.
   *
   * @param config The configuration used to get the data for insertion into the database.
   * @param config.leader The JSON representation of the Leader.
   * @param config.dlcMap A map of DLC keys to database IDs.
   * @param config.factionMap A map of Faction keys to database IDs.
   * @returns The inputs used to add the Leader to the database.
   */
  normalizeLeader({
    leader,
    dlcMap,
    factionMap,
  }: {
    leader: LeaderJson
    dlcMap: KeyIdMap
    factionMap: KeyIdMap
  }): AddLeaderInput {
    return {
      ability: leader.Ability,
      dlc: this.normalizeUnitDlc(leader, dlcMap),
      faction: this.normalizeUnitFaction(leader, factionMap),
      image: this.normalizeImage(leader, ImageType.Leader),
      name: leader.Name,
      quote: leader.Quote,
    }
  }

  /**
   * Get the data necessary to add the Unit to the database.
   *
   * @param config The configuration used to get the data for insertion into the database.
   * @param config.unit The JSON representation of the Unit.
   * @param config.dlcMap A map of DLC keys to database IDs.
   * @param config.effectMap A map of Effect keys to database IDs.
   * @param config.factionMap A map of Faction keys to database IDs.
   * @returns The inputs used to add the Unit to the database.
   */
  normalizeUnit({
    unit,
    dlcMap,
    effectMap,
    factionMap,
  }: {
    unit: UnitJson
    dlcMap: KeyIdMap
    effectMap: KeyIdMap
    factionMap: KeyIdMap
  }): AddUnitInput {
    if (!unit.Name) {
      throw Error(`Invalid unit "${JSON.stringify(unit)}": Must have "Name".`)
    }
    if (!unit.Quote) {
      throw Error(`Invalid unit "${unit.Name}": Must have "Quote".`)
    }
    return {
      combats: this.normalizeCombats(unit),
      deckable: this.normalizeDeckable(unit),
      dlc: this.normalizeUnitDlc(unit, dlcMap),
      effectPrefix: unit['Effect Prefix'] || null,
      effects: this.normalizeUnitEffects(unit, effectMap),
      faction: this.normalizeUnitFaction(unit, factionMap),
      hero: this.normalizeHero(unit),
      images: this.normalizeImages(unit, ImageType.Unit),
      modifier: this.normalizeModifier(unit),
      name: unit.Name,
      quote: unit.Quote,
      scorchMin: unit['Scorch Minimum Strength'] || null,
      scorchScope: this.normalizeScorchScope(unit),
      special: this.normalizeSpecial(unit),
      strength: this.normalizeStrength(unit),
    }
  }

  /**
   * Get the ID of the faction for the Unit or Leader.
   *
   * @param unitOrLeader The Unit or Leader to get the faction ID for.
   * @param factionMap The map of Faction keys to IDs.
   * @returns The ID of the Unit or Leader.
   * @throws Error if faction not found in factionMap.
   */
  normalizeUnitFaction(unitOrLeader: UnitJson | LeaderJson, factionMap: KeyIdMap): ObjectId {
    const faction = factionMap[unitOrLeader.Faction]
    if (!faction) {
      const isLeader = (unitOrLeader as any).Ability // eslint-disable-line @typescript-eslint/no-explicit-any
      throw Error(
        `Invalid Faction "${unitOrLeader.Faction}" for ${isLeader ? 'Leader' : 'Unit'} "${unitOrLeader.Name}"`
      )
    }
    return faction
  }

  /**
   * Get the ID of the DLC the Unit was introduced in, if any.
   *
   * @param item The unit to get the DLC ID for.
   * @param dlcMap The map of DLC keys to IDs.
   * @returns The ID of the DLC for the Unit if it has one, null otherwise.
   */
  normalizeUnitDlc(item: UnitJson | LeaderJson | FactionJson, dlcMap: KeyIdMap): ObjectId | null {
    const itemDlc = item.DLC
    if (itemDlc === undefined) {
      return null
    }
    const dlc = dlcMap[itemDlc]
    if (!dlc) {
      throw Error(`Invalid DLC "${itemDlc}" for item "${item.Name}"`)
    }
    return dlc
  }

  /**
   * Gets the Combat rows a unit is eligible for.
   *
   * @param unit The unit to get combat rows for.
   * @returns The Combat rows the unit is eligible for.
   */
  normalizeCombats(unit: UnitJson): Combat[] {
    const combats: Combat[] = []
    if (unit['Combat 1']) {
      combats.push(this.normalizeCombat(unit['Combat 1']))
    }
    if (unit['Combat 2']) {
      combats.push(this.normalizeCombat(unit['Combat 2']))
    }
    if (unit['Combat 3']) {
      combats.push(this.normalizeCombat(unit['Combat 3']))
    }
    return combats
  }

  /**
   * Get the Combat from a given string.
   *
   * @param combat The string representation of the combat.
   * @returns The Combat the string represents.
   * @throws Error if the string does not have an equivalent Combat representation.
   */
  normalizeCombat(combat: string | undefined): Combat {
    if (combat === 'Close') {
      return Combat.Close
    } else if (combat === 'Ranged') {
      return Combat.Ranged
    } else if (combat === 'Siege') {
      return Combat.Siege
    }
    throw Error(`Invalid Combat "${combat}"`)
  }

  /**
   * Get the IDs of the effects the Unit has.
   *
   * @param unit The unit to get the effect IDs for.
   * @param effectMap The map of effect keys to IDs.
   * @returns The IDs of the effects for the Unit.
   */
  normalizeUnitEffects(unit: UnitJson, effectMap: KeyIdMap): ObjectId[] {
    const effects: ObjectId[] = []

    for (const effect of [unit['Effect 1'], unit['Effect 2']]) {
      if (effect) {
        const effectId = effectMap[effect]
        if (!effectId) {
          throw Error(`Invalid Effect "${effect}" for unit "${unit.Name}"`)
        }
        effects.push(effectId)
      }
    }
    return effects
  }

  /**
   * Get the key that corresponds to the given effect.
   *
   * @param effect The effect to get the key of.
   * @returns The key for the given effect.
   */
  normalizeEffectKey(effect: EffectJson): EffectKey {
    if (effect.Name === 'Agile') {
      return EffectKey.Agile
    } else if (effect.Name === 'Avenger') {
      return EffectKey.Avenger
    } else if (effect.Name === 'Berserker') {
      return EffectKey.Berserker
    } else if (effect.Name === 'Bond') {
      return EffectKey.Bond
    } else if (effect.Name === 'Decoy') {
      return EffectKey.Decoy
    } else if (effect.Name === 'Horn') {
      return EffectKey.Horn
    } else if (effect.Name === 'Mardroeme') {
      return EffectKey.Mardroeme
    } else if (effect.Name === 'Medic') {
      return EffectKey.Medic
    } else if (effect.Name === 'Morale') {
      return EffectKey.Morale
    } else if (effect.Name === 'Muster') {
      return EffectKey.Muster
    } else if (effect.Name === 'Scorch') {
      return EffectKey.Scorch
    } else if (effect.Name === 'Spy') {
      return EffectKey.Spy
    } else if (effect.Name === 'Weather') {
      return EffectKey.Weather
    }
    throw Error(`Invalid Effect "${JSON.stringify(effect)}"`)
  }

  /**
   * Get the potential scope the scorch should be limited to.
   *
   * @param unit The unit to get the sorch scope for.
   * @returns The scope the scorch should be limited to, otherwise null.
   */
  normalizeScorchScope(unit: UnitJson): Combat | null {
    if (unit['Scorch Scope']) {
      return this.normalizeCombat(unit['Scorch Scope'])
    }
    return null
  }

  /**
   * Gets the image path for the resource.
   *
   * @param item The resource item to get the image path for.
   * @param type The type of the resource.
   * @returns The image path for the resource.
   */
  normalizeImage(item: UnitJson | LeaderJson | EffectJson | FactionJson | DlcJson, type: ImageType): string {
    return this.normalizeImages(item, type)[0]
  }

  /**
   * Gets image paths for the resource.
   *
   * @param item The resource item to get image paths for.
   * @param type The type of the resource.
   * @returns The image paths for the resource.
   */
  normalizeImages(item: UnitJson | LeaderJson | EffectJson | FactionJson | DlcJson, type: ImageType): string[] {
    const name: string = item.Name
    const images: string[] = []
    const styles: number = type === ImageType.Unit ? (item as UnitJson)['Art Styles'] : 1
    if (type === ImageType.Unit && !styles) {
      throw Error(`No "Art Styles" found for unit "${JSON.stringify(item)}"`)
    }
    for (let i = 1; i <= styles; i++) {
      images.push(
        this.normalizeImagePath({
          name,
          type,
          suffix: styles > 1 ? `--${i}` : '',
        })
      )
    }
    return images
  }

  /**
   * Gets the path for an image of a resource.
   *
   * @param config The configuration used to get the image path.
   * @param config.name The name of the resource.
   * @param config.type The type of the resourc.e
   * @param config.suffix A potential suffix to prepend to the image path.
   * @returns The path of an image for a resource.
   */
  normalizeImagePath({ name, type, suffix = '' }: { type: ImageType; name: string; suffix?: string }) {
    return `images/${type}/${name.toLowerCase().replaceAll(/ /g, '_').replaceAll(/:/g, '')}${suffix}.png`
  }

  /**
   * Determine if a unit is special or not.
   *
   * @param unit The unit to determine if it is special.
   * @returns True if the unit is considered special, false if not.
   */
  normalizeSpecial(unit: UnitJson): boolean {
    return (
      ["Commander's Horn", 'Decoy', 'Mardroeme', 'Scorch'].includes(unit.Name) ||
      [unit['Effect 1'], unit['Effect 2']].includes('Weather')
    )
  }

  /**
   * Determine if a unit is a row modifier or not.
   *
   * @param unit The unit to determine if it is a modifier.
   * @returns True if the unit is a row modifier, false if not.
   */
  normalizeModifier(unit: UnitJson): boolean {
    return ["Commander's Horn", 'Mardroeme'].includes(unit.Name)
  }

  /**
   * Get the numeric strength of a unit if it has one.
   *
   * @param unit The unit to get the strength for.
   * @returns The strength if a unit has one, otherwise null
   */
  normalizeStrength(unit: UnitJson): number | null {
    return unit.Strength !== undefined ? Number(unit.Strength) : null
  }

  /**
   * Determine if a unit is deckable or not.
   *
   * @param unit The unit to determine whether or not it is deckable.
   * @returns True if the unit is deckable, false if not.
   */
  normalizeDeckable(unit: UnitJson): boolean {
    return unit.Deckable !== 'No'
  }

  /**
   * Determine if a unit is a Hero or not.
   *
   * @param unit The Unit to determine whether or not it is a hero.
   * @returns True if the unit is a hero, false if not.
   */
  normalizeHero(unit: UnitJson): boolean {
    return unit.Hero === 'Yes'
  }
}

export interface DlcJson {
  Name: string
}

export interface EffectJson {
  Name: string
  Ability: string
}

export interface FactionJson {
  Name: string
  DLC?: string
  Ability?: string
}

export interface LeaderJson {
  Name: string
  Faction: string
  DLC?: string
  Ability: string
  Quote: string
}

export interface UnitJson {
  Name: string
  Occurrences: number
  Deckable: string
  Faction: string
  Hero: string
  'Combat 1'?: string
  'Combat 2'?: string
  'Combat 3'?: string
  Strength?: number
  'Effect 1'?: string
  'Effect 2'?: string
  DLC?: string
  'Scorch Scope'?: string
  'Scorch Minimum Strength'?: number
  'Effect Prefix'?: string
  'Art Styles': number
  Quote: string
}

export interface KeyIdMap {
  [name: string]: ObjectId
}

export interface FactionUnits {
  [x: string]: UnitDbObject[]
}

export enum ImageType {
  Combat = 'combats',
  Dlc = 'dlcs',
  Effect = 'effects',
  Faction = 'factions',
  Leader = 'leaders',
  Unit = 'units',
}
