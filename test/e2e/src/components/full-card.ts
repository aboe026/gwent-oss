import { Selector, t } from 'testcafe'

import { EffectKey, FactionKey, Unit } from '@gwent/graphql-schema/resolver-typings'
import { HTML_CLASSES, HTML_IDS, MAX_SPECIALS } from '@gwent/constants'
import { toTitleCase } from '@gwent/utils'

const container = Selector(`#${HTML_IDS.UnitFullCardContainer}`)

export default class FullCard {
  static elements = {
    Container: container,
    Image: container.find(`#${HTML_IDS.UnitFullCardImage}`),
    Username: container.find(`#${HTML_IDS.UnitFullCardUsername}`),
    Name: container.find(`#${HTML_IDS.UnitFullCardName}`),
    Quote: container.find(`#${HTML_IDS.UnitFullCardQuote}`),
    Faction: container.find(`#${HTML_IDS.UnitFullCardFaction}`),
    Strength: container.find(`#${HTML_IDS.UnitFullCardStrength}`),
    Combat: container.find(`#${HTML_IDS.UnitFullCardCombat}`),
    Hero: container.find(`#${HTML_IDS.UnitFullCardHero}`),
    Effects: container.find(`#${HTML_IDS.UnitFullCardEffects}`),
    Special: container.find(`#${HTML_IDS.UnitFullCardSpecial}`),
    Dlc: container.find(`#${HTML_IDS.UnitFullCardDlc}`),
    Art: container.find(`#${HTML_IDS.UnitFullCardArt}`),
    Close: container.find(`#${HTML_IDS.UnitFullCardClose}`),
    ArtPrevious: container.find(`#${HTML_IDS.UnitFullCardArtPrevious}`),
    ArtNext: container.find(`#${HTML_IDS.UnitFullCardArtNext}`),
    Next: container.find(`#${HTML_IDS.UnitFullCardNext}`),
    Previous: container.find(`#${HTML_IDS.UnitFullCardPrevious}`),
  }

  static async verifyImage({ unit, artStyle = 1 }: { unit: Unit; artStyle?: number }) {
    await t.expect(FullCard.elements.Image.exists).ok()
    await t.expect(FullCard.elements.Image.visible).ok()
    const image = await FullCard.elements.Image.getAttribute('src')
    if (image) {
      await t.expect(image).eql(unit.images[artStyle - 1])
    } else {
      throw Error(`Could not get image for unit "${JSON.stringify(unit)}"`)
    }
  }

  static async verifyName(unit: Unit) {
    await t.expect(FullCard.elements.Name.exists).ok()
    await t.expect(FullCard.elements.Name.visible).ok()
    await t.expect(FullCard.elements.Name.innerText).eql(unit.name)
  }

  static async verifyQuote(unit: Unit) {
    await t.expect(FullCard.elements.Quote.exists).ok()
    await t.expect(FullCard.elements.Quote.visible).ok()
    await t.expect(FullCard.elements.Quote.innerText).eql(unit.quote)
  }

  static async verifyFaction(unit: Unit) {
    await t.expect(FullCard.elements.Faction.exists).ok()
    await t.expect(FullCard.elements.Faction.visible).ok()
    await t
      .expect(FullCard.elements.Faction.innerText)
      .eql(
        `A member of the ${unit.faction.name} faction${
          unit.faction.key === FactionKey.Neutral ? ', which can be added to the deck of any faction.' : '.'
        }`
      )
  }

  static async verifyStrength({
    unit,
    effectiveStrength,
    effects,
  }: {
    unit: Unit
    effectiveStrength?: number
    effects?: ExpectedEffect[]
  }) {
    if (unit.strength === undefined || unit.strength === null) {
      await t.expect(FullCard.elements.Strength.exists).notOk()
    } else {
      const resolvedStrength = effectiveStrength || unit.strength
      await t.expect(FullCard.elements.Strength.exists).ok()
      await t.expect(FullCard.elements.Strength.visible).ok()
      await t
        .expect(FullCard.elements.Container.find(`.${HTML_CLASSES.StrengthCircleValue}`).innerText)
        .eql(resolvedStrength.toString())
      await t
        .expect(FullCard.elements.Strength.innerText)
        .eql(`Provides a strength of ${resolvedStrength} to the row placed in.`)

      const strengthReasonContainer = FullCard.elements.Container.find(
        `.${HTML_CLASSES.UnitFullCardStrengthReasonContainer}`
      )
      await t.expect(strengthReasonContainer.exists).eql(effects !== undefined)
      if (effects !== undefined) {
        await t.expect(strengthReasonContainer.visible).ok()
        const expectedEffects: string[] = [` | ${unit.strength} | Base strength`]
        for (let i = 0; i < effects.length; i++) {
          const effect = effects[i]
          expectedEffects.push(`${effect.operator} | ${effect.strength} | ${effect.reason}`)
        }
        const actualEffects: string[] = []
        const effectRows = strengthReasonContainer.find(`.${HTML_CLASSES.UnitFullCardStrengthReasonRow}`)
        const effectRowsCount = await effectRows.count
        for (let i = 0; i < effectRowsCount; i++) {
          const effectRow = effectRows.nth(i)
          const operator = await effectRow.find(`.${HTML_CLASSES.UnitFullCardStrengthReasonOperator}`).innerText
          const strength = await effectRow.find(`.${HTML_CLASSES.UnitFullCardStrengthReasonStrength}`).innerText
          const reason = await effectRow.find(`.${HTML_CLASSES.UnitFullCardStrengthReasonExplanation}`).innerText
          actualEffects.push(`${operator} | ${strength} | ${reason}`)
        }
        await t.expect(actualEffects).eql(expectedEffects)
      }
    }
  }

  static async verifyCombat(unit: Unit) {
    const weatherEffect = unit.effects?.find((effect) => effect.key === EffectKey.Weather)
    if (weatherEffect || !unit.combats || unit.combats?.length === 0) {
      await t.expect(FullCard.elements.Combat.exists).notOk()
    } else {
      await t.expect(FullCard.elements.Combat.exists).ok()
      await t.expect(FullCard.elements.Combat.visible).ok()
      await t
        .expect(FullCard.elements.Combat.innerText)
        .eql(
          `Can be placed in the ${unit.combats.map((combat) => toTitleCase(combat)).join(' or ')} combat row${
            unit.combats.length > 1 ? 's' : ''
          }.`
        )
    }
  }

  static async verifyHero(unit: Unit) {
    if (unit.hero) {
      await t.expect(FullCard.elements.Hero.exists).ok()
      await t.expect(FullCard.elements.Hero.visible).ok()
      await t.expect(FullCard.elements.Hero.innerText).eql('Not affected by any special cards or abilities.')
    } else {
      await t.expect(FullCard.elements.Hero.exists).notOk()
    }
  }

  static async getEffects(): Promise<string[]> {
    const effects: string[] = []
    const effectRows = await FullCard.elements.Container.find(`.${HTML_CLASSES.UnitFullCardEffectAbility}`)
    const effectRowsCount = await effectRows.count
    for (let i = 0; i < effectRowsCount; i++) {
      const effectRow = effectRows.nth(i)
      const id = await effectRow.parent(`.${HTML_CLASSES.UnitFullCardInfoRow}`).getAttribute('id')
      if (!id) {
        throw Error('Could not determine id property for full card effect')
      }
      effects.push(id.replace('fullUnitEffect', '').toLowerCase())
    }
    return effects
  }

  static async verifyEffects(unit: Unit) {
    if (unit.effects && unit.effects.length > 0) {
      await t.expect(FullCard.elements.Effects.exists).ok()
      await t.expect(FullCard.elements.Effects.visible).ok()
      const actualEffects = await FullCard.getEffects()
      const expectedEffects = unit.effects.map((effect) => effect.key.toLowerCase())
      await t.expect(actualEffects).eql(expectedEffects)
    } else {
      await t.expect(FullCard.elements.Effects.exists).notOk()
    }
  }

  static async verifySpecial(unit: Unit) {
    if (unit.special) {
      await t.expect(FullCard.elements.Special.exists).ok()
      await t.expect(FullCard.elements.Special.visible).ok()
      await t
        .expect(FullCard.elements.Special.innerText)
        .eql(`Counts towards the special limit of ${MAX_SPECIALS} per deck.`)
    } else {
      await t.expect(FullCard.elements.Special.exists).notOk()
    }
  }

  static async verifyDlc(unit: Unit) {
    if (unit.dlc) {
      await t.expect(FullCard.elements.Dlc.exists).ok()
      await t.expect(FullCard.elements.Dlc.visible).ok()
      await t.expect(FullCard.elements.Dlc.innerText).eql(`Introduced in the ${unit.dlc.name} DLC.`)
    } else {
      await t.expect(FullCard.elements.Dlc.exists).notOk()
    }
  }

  static async verifyAltArt({ unit, artStyle = 1 }: { artStyle?: number; unit: Unit }) {
    if (unit.images.length > 1) {
      await t.expect(FullCard.elements.Art.exists).ok()
      await t.expect(FullCard.elements.Art.visible).ok()
      await t.expect(FullCard.elements.Art.innerText).eql(`Art style: ${artStyle}/${unit.images.length}`)
    } else {
      await t.expect(FullCard.elements.Art.exists).notOk()
    }
  }

  static async verifyUser({ username }: { username?: string }) {
    await t.expect(FullCard.elements.Username.exists).eql(!!username)
    if (username) {
      await t.expect(FullCard.elements.Username.innerText).eql(username)
    }
  }

  static async verify({
    artStyle = 1,
    unit,
    effectiveStrength,
    effects,
    username,
  }: {
    unit?: Unit | undefined
    artStyle?: number
    effectiveStrength?: number
    effects?: ExpectedEffect[]
    username?: string
  }) {
    if (unit) {
      await t.expect(FullCard.elements.Container.exists).ok()
      await t.expect(FullCard.elements.Container.visible).ok()
      await FullCard.verifyImage({
        unit,
        artStyle,
      })
      await FullCard.verifyUser({
        username,
      })
      await FullCard.verifyName(unit)
      await FullCard.verifyQuote(unit)
      await FullCard.verifyFaction(unit)
      await FullCard.verifyStrength({
        unit,
        effectiveStrength,
        effects,
      })
      await FullCard.verifyCombat(unit)
      await FullCard.verifyHero(unit)
      await FullCard.verifyEffects(unit)
      await FullCard.verifySpecial(unit)
      await FullCard.verifyDlc(unit)
      await FullCard.verifyAltArt({
        unit,
        artStyle,
      })
    } else {
      await t.expect(FullCard.elements.Container.exists).notOk()
    }
  }

  static async close() {
    await t.click(FullCard.elements.Close)
  }

  static async artStylePrevious() {
    await t.click(FullCard.elements.ArtPrevious)
  }

  static async artStyleNext() {
    await t.click(FullCard.elements.ArtNext)
  }

  static async next() {
    await t.click(FullCard.elements.Next)
  }

  static async previous() {
    await t.click(FullCard.elements.Previous)
  }

  static async select() {
    await t.click(FullCard.elements.Image)
  }
}

interface ExpectedEffect {
  operator: string
  strength: number
  reason: string
}
