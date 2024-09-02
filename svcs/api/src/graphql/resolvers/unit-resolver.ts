import {
  DlcDbObject,
  EffectDbObject,
  EffectKey,
  FactionDbObject,
  FactionKey,
  UnitDbObject,
} from '@gwent/graphql-schema/database-typings'
import { Combat, Effect, Unit } from '@gwent/graphql-schema/resolver-typings'
import FactionResolver from './faction-resolver'
import DlcResolver from './dlc-resolver'
import EffectResolver from './effect-resolver'
import { ObjectId } from 'mongodb'
import UnitStore from '../../database/stores/unit-store'
import DlcStore from '../../database/stores/dlc-store'
import EffectStore from '../../database/stores/effect-store'
import FactionStore from '../../database/stores/faction-store'
import { prettyPrintList } from '../../util/string-util'
import { getUniqueItems, toTitleCase } from '@gwent/utils'
import { getLogger } from 'log4js'

export default class UnitResolver {
  private static logger = getLogger('unit-resolver')

  static async resolveFromObject({
    dlc,
    effects,
    faction,
    unit,
    neutral,
    neutralStats,
  }: {
    unit: UnitDbObject
    dlc?: DlcDbObject
    effects?: EffectDbObject[]
    faction?: FactionDbObject
    neutral?: FactionDbObject
    neutralStats?: boolean
  }): Promise<Unit> {
    const resolvedDlc = dlc ? DlcResolver.resolveFromObject(dlc) : await DlcResolver.resolveFromId(unit.dlc)
    const resolvedEffects = effects
      ? effects.map((effect) => EffectResolver.resolveFromObject(effect))
      : await EffectResolver.resolveFromIds(unit.effects)
    const resolvedFaction = faction
      ? await FactionResolver.resolveFromObject({
          faction,
          neutral,
          neutralStats,
        })
      : await FactionResolver.resolveFromId({
          id: unit.faction,
          neutrals: neutralStats,
        })
    if (!resolvedFaction) {
      const message = `Could not resolve faction "${unit.faction}" on unit "${unit._id}".`
      UnitResolver.logger.error(message)
      throw Error(message)
    }
    return {
      combats: unit.combats as Combat[],
      created: unit.created,
      deckable: unit.deckable,
      dlc: resolvedDlc,
      effectPrefix: unit.effectPrefix,
      effects: UnitResolver.resolveEffectAbilities(unit, resolvedEffects),
      faction: resolvedFaction,
      hero: unit.hero,
      id: unit._id.toString(),
      images: unit.images,
      name: unit.name,
      quote: unit.quote,
      scorchMin: unit.scorchMin,
      scorchScope: unit.scorchScope as Combat | undefined,
      special: unit.special,
      strength: unit.strength,
    }
  }

  static async resolveFromId({
    id,
    neutralStats,
  }: {
    id: ObjectId | string
    neutralStats?: boolean
  }): Promise<Unit | undefined> {
    const units = await UnitResolver.resolveFromIds({
      ids: [id],
      neutralStats,
    })
    if (units.length > 1) {
      const message = `More than one unit resolved for "${id}".`
      UnitResolver.logger.error(message)
      throw Error(message)
    } else if (units.length === 1) {
      return units[0]
    }
  }

  static async resolveFromIds({
    ids,
    factions,
    neutralStats,
  }: {
    ids: (ObjectId | string)[]
    factions?: FactionDbObject[]
    neutralStats?: boolean
  }): Promise<Unit[]> {
    if (ids.length === 0) {
      return []
    }
    const units = await UnitStore.get({
      ids: getUniqueItems(ids),
    })
    const missingUnits: string[] = []
    for (const id of ids) {
      if (!units.find((unit) => unit._id.toString() === id.toString())) {
        missingUnits.push(id.toString())
      }
    }
    if (missingUnits.length > 0) {
      const message = `Could not resolved units "${missingUnits.join(',')}".`
      UnitResolver.logger.error(message)
      throw Error(message)
    }
    if (units.length !== ids.length) {
      const extraIds = units.map((unit) => unit._id.toString())
      for (const id of ids) {
        const index = extraIds.indexOf(id.toString())
        if (index >= 0) {
          extraIds.splice(index, 1)
        }
      }
      const message = `Received more units "${extraIds.join(',')}" than ids to resolve: "${ids.join(',')}".`
      UnitResolver.logger.error(message)
      throw Error(message)
    }
    return UnitResolver.resolveFromArray({
      units,
      factions,
      neutralStats,
    })
  }

  static async resolveFromArray({
    factions,
    units,
    neutralStats,
  }: {
    factions?: FactionDbObject[]
    units: UnitDbObject[]
    neutralStats?: boolean
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
    let neutralFaction: FactionDbObject | undefined = undefined
    if (neutralStats) {
      neutralFaction = dbFactions.find((faction) => faction.key === FactionKey.Neutral)
      if (!neutralFaction) {
        const neutralFactions = await FactionStore.get({
          keys: [FactionKey.Neutral],
        })
        if (neutralFactions.length === 0) {
          const message = `Could not resolve neutral faction "${FactionKey.Neutral}" for units in array.`
          UnitResolver.logger.error(message)
          throw Error(message)
        } else if (neutralFactions.length > 1) {
          const message = `More than 1 neutral faction for units in array: "${JSON.stringify(neutralFactions)}".`
          UnitResolver.logger.error(message)
          throw Error(message)
        }
        neutralFaction = neutralFactions[0]
      }
    }

    for (const unit of units) {
      const unitFaction = dbFactions.find((faction) => faction._id.toString() === unit.faction.toString())
      if (!unitFaction) {
        const message = `Could not resolve faction "${unit.faction}" for unit "${unit._id}" in array.`
        UnitResolver.logger.error(message)
        throw Error(message)
      }

      let unitDlc: DlcDbObject | undefined = undefined
      if (unit.dlc) {
        unitDlc = dlcs.find((dlc) => dlc._id.toString() === unit.dlc?.toString())
        if (!unitDlc) {
          const message = `Could not resolve dlc "${unit.dlc}" for unit "${unit._id}" in array.`
          UnitResolver.logger.error(message)
          throw Error(message)
        }
      }

      const unitEffects: EffectDbObject[] = []
      if (unit.effects) {
        for (const unitEffect of unit.effects) {
          const matchedEffect = effects.find((effect) => effect._id.toString() === unitEffect.toString())
          if (!matchedEffect) {
            const message = `Could not resolve effect "${unitEffect}" for unit "${unit._id}" in array.`
            UnitResolver.logger.error(message)
            throw Error(message)
          }
          unitEffects.push(matchedEffect)
        }
      }

      resolvedUnits.push(
        await UnitResolver.resolveFromObject({
          unit,
          dlc: unitDlc,
          effects: unitEffects,
          faction: unitFaction,
          neutral: neutralFaction,
          neutralStats,
        })
      )
    }

    return resolvedUnits
  }

  static resolveEffectAbilities(unit: UnitDbObject, effects: Effect[] | null): Effect[] | null {
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
