import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import { Combat, Effect, Unit } from '@gwent/graphql-schema/resolver-typings'
import {
  DlcDbObject,
  EffectDbObject,
  EffectKey,
  FactionDbObject,
  UnitDbObject,
} from '@gwent/graphql-schema/database-typings'
import DlcResolver from './dlc-resolver'
import DlcStore from '../../../database/stores/dlc-store'
import EffectResolver from './effect-resolver'
import EffectStore from '../../../database/stores/effect-store'
import FactionResolver from './faction-resolver'
import FactionStore from '../../../database/stores/faction-store'
import { getUniqueItems, toTitleCase } from '@gwent/utils'
import { prettyPrintList } from '../../../util/string-util'
import UnitStore from '../../../database/stores/unit-store'
import Verifier from '../../../util/verifier'

/**
 * A class to convert Unit database objects to their GraphQL equivalent.
 */
export default class UnitResolver {
  private static logger = getLogger('UnitResolver')

  /**
   * Converts a single Unit database object to a single Unit GraphQL object.
   *
   * @param config The configuration used to convert the Unit.
   * @param config.dlc The resolved DLC for the Unit.  If not provided, will be retrieved.
   * @param config.effects The resolved Effects for the Unit.  If not provided, will be retrieved.
   * @param config.faction The resolved Faction for the Unit. If not provided, will be retrieved.
   * @param config.unit The Unit database document to convert.
   * @returns The resolved Unit object matching its GraphQL schema definition.
   */
  static async fromObject({
    dlc,
    effects,
    faction,
    unit,
  }: {
    unit: UnitDbObject
    dlc?: DlcDbObject
    effects?: EffectDbObject[]
    faction?: FactionDbObject
  }): Promise<Unit> {
    const resolvedEffects = unit.effects
      ? effects
        ? effects.map((effect) => EffectResolver.fromObject(effect))
        : await EffectResolver.fromIds(unit.effects)
      : []
    return {
      combats: unit.combats as Combat[],
      created: unit.created,
      deckable: unit.deckable,
      dlc: unit.dlc && (dlc ? DlcResolver.fromObject(dlc) : await DlcResolver.fromId(unit.dlc)),
      effectPrefix: unit.effectPrefix,
      effects: UnitResolver.effectAbilities(unit, resolvedEffects),
      faction: faction
        ? await FactionResolver.fromObject({
            faction,
          })
        : await FactionResolver.fromId({
            id: unit.faction,
          }),
      hero: unit.hero,
      id: unit._id.toString(),
      images: unit.images,
      modifier: unit.modifier,
      name: unit.name,
      quote: unit.quote,
      scorchMin: unit.scorchMin,
      scorchScope: unit.scorchScope as Combat | undefined,
      special: unit.special,
      strength: unit.strength,
    }
  }

  /**
   * Retrieves a Unit with the given ID and converts it to the GraphQL object equivalent.
   *
   * @param config The configuration used to retrieve the Unit.
   * @param config.id The ObjectId of the Unit to convert.
   * @returns The resolved Unit object with the given ID.
   * @throws {Error} if a Unit with the given ID does not exist.
   */
  static async fromId({ id }: { id: ObjectId | string }): Promise<Unit> {
    const units = await UnitResolver.fromIds({
      ids: [id],
    })
    return units[0]
  }

  /**
   * Retrieves Units with the given IDs and converts them to their GraphQL object equivalents.
   *
   * @param config The configuration used to resolved the Units.
   * @param config.ids The ObjectIds of the Units to convert.
   * @param config.factions The pre-fetched Faction database objects for the Units.
   * @returns The resolved Units array for the given IDs.
   * @throws {Error} if a Unit with the given IDs does not exist.
   */
  static async fromIds({
    ids,
    factions,
  }: {
    ids: (ObjectId | string)[]
    factions?: FactionDbObject[]
  }): Promise<Unit[]> {
    if (ids.length === 0) {
      return []
    }

    const units = await UnitStore.get({
      ids: getUniqueItems(ids),
    })

    Verifier.checkObjects({
      expectedKeys: ids,
      objects: units,
      field: '_id',
      logger: UnitResolver.logger,
      label: 'units',
    })

    return UnitResolver.fromArray({
      units,
      factions,
    })
  }

  /**
   * Converts an array of Unit database objects to an array of Unit GraphQL objects.
   *
   * @param config The configuration used to convert the array.
   * @param config.factions The resolved Factions for the Units. If not provided, will be retrieved.
   * @param config.units The array of Unit database objects to convert.
   * @returns The resolved Unit array matching the GraphQL schema definition.
   */
  static async fromArray({
    factions,
    units,
  }: {
    factions?: FactionDbObject[]
    units: UnitDbObject[]
  }): Promise<Unit[]> {
    const factionIds = getUniqueItems<ObjectId>(units.map((unit) => unit.faction))
    let resolvedFactionIds: string[] = []
    if (factions) {
      resolvedFactionIds = getUniqueItems<string>(factions.map((faction) => faction._id.toString()))
    }
    const factionIdsToResolve: ObjectId[] = []
    for (const factionId of factionIds) {
      if (!resolvedFactionIds.includes(factionId.toString())) {
        factionIdsToResolve.push(factionId)
      }
    }

    const effectIds: string[] = []
    for (const unit of units) {
      if (unit.effects) {
        for (const effect of unit.effects) {
          if (!effectIds.includes(effect.toString())) {
            effectIds.push(effect.toString())
          }
        }
      }
    }

    const dlcs = await DlcStore.get({
      ids: getUniqueItems<ObjectId>(units.map((unit) => unit.dlc)),
    })
    const effects = await EffectStore.get({
      ids: effectIds,
    })
    const dbFactions: FactionDbObject[] = []
    if (factions) {
      dbFactions.push(...factions)
    }
    if (factionIdsToResolve.length > 0) {
      dbFactions.push(
        ...(await FactionStore.get({
          ids: factionIdsToResolve,
        }))
      )
    }

    const resolvedUnits: Unit[] = []
    for (const unit of units) {
      resolvedUnits.push(
        await UnitResolver.fromObject({
          unit,
          dlc: unit.dlc && dlcs.find((dlc) => dlc._id.toString() === unit.dlc?.toString()),
          effects:
            unit.effects &&
            unit.effects.map(
              (unitEffect) =>
                effects.find((effect) => effect._id.toString() === unitEffect.toString()) as EffectDbObject
            ),
          faction: dbFactions.find((faction) => faction._id.toString() === unit.faction.toString()),
        })
      )
    }

    return resolvedUnits
  }

  /**
   * Resolve abilities on Effects a Unit may have. Replaces generic text with specific info for the Unit in question. Does not modify original Unit.
   *
   * @param unit The Unit database object to resolve Effect abilities for.
   * @param effects The resolved Effects for the Unit.
   * @returns The resolved Effects with their abilities resolved to be more specific to the particular Unit.
   */
  static effectAbilities(unit: UnitDbObject, effects: Effect[] | null): Effect[] | null {
    if (effects) {
      return effects.map((effect) => {
        let ability = effect.ability
        if (effect.key === EffectKey.Weather) {
          if (unit.combats && unit.combats.length > 0) {
            ability = effect.ability.replace(
              'given row(s)',
              prettyPrintList({
                items: unit.combats.map((combat) => toTitleCase(combat)),
                labelPlural: 'rows',
                labelSingular: 'row',
              })
            )
          } else {
            ability = 'Remove all weather effects which are active on the battlefield, including your own.'
          }
        } else if (effect.key === EffectKey.Muster && unit.effectPrefix) {
          ability = effect.ability.replace('same name', `"${unit.effectPrefix}" prefix`)
        } else if (effect.key === EffectKey.Scorch) {
          if (unit.scorchScope) {
            const combat = toTitleCase(unit.scorchScope)
            ability = `Destroys your enemy's strongest ${combat} Combat unit(s)`
            if (unit.scorchMin) {
              ability += ` if the combined strength of all their ${combat} Combat units is ${unit.scorchMin} or more`
            }
            ability += '.'
          }
        }
        return {
          ...effect,
          ability,
        }
      })
    } else {
      return null
    }
  }
}
