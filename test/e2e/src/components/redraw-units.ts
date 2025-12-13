import { Selector, t } from 'testcafe'

import { E2eHelper } from '../util/e2e-helper'
import { HTML_CLASSES, HTML_IDS, MAX_REDRAWS } from '@gwent/constants'

const container = Selector(`#${HTML_IDS.GameRedrawContainer}`)

export default class RedrawUnits {
  static elements = {
    RedrawCard: container.find(`.${HTML_CLASSES.GameDeckRedrawCard}`),
    RedrawPair: container.find(`.${HTML_CLASSES.GameDeckRedrawPair}`),
    RedrawInstructions: container.find(`#${HTML_IDS.GameDeckRedrawInstructions}`),
  }

  static async verify({ redraws }: { redraws: RedrawPair[] }) {
    const expected: string[] = []
    let highlighted = false
    for (const redraw of redraws) {
      let rowText = 'from: '
      if (redraw.from.unitName) {
        rowText += redraw.from.unitName
      } else if (redraw.from.dotted) {
        rowText += 'This unit is no longer in your hand'
      } else if (redraw.from.highlighted) {
        rowText += 'Place here to redraw for a random unit from your Draw pile'
      }
      if (redraw.from.highlighted) {
        rowText += ' highlighted'
        highlighted = true
      }
      if (redraw.from.dotted) {
        rowText += ' dotted'
      }
      if (redraw.to) {
        rowText += `, to: ${redraw.to.unitName || 'This unit is no longer in your hand'}`
        if (redraw.to.highlighted) {
          rowText += ' highlighted'
          highlighted = true
        }
        if (redraw.to.dotted) {
          rowText += ' dotted'
        }
      }
      expected.push(rowText)
    }
    for (let i = expected.length; i < MAX_REDRAWS; i++) {
      expected.push(
        `from: ${highlighted ? 'Not available to redraw until other redraws made above' : 'Select card from hand to redraw'}`
      )
    }

    const actual: string[] = []
    const pairCount = await RedrawUnits.elements.RedrawPair.count
    for (let i = 0; i < pairCount; i++) {
      let rowText = 'from: '
      const pair = await RedrawUnits.elements.RedrawPair.nth(i)
      const from = await pair.find(`.${HTML_CLASSES.UnitGameCardContainer}`).nth(0)
      rowText += await from.getAttribute('title')
      if (await from.hasClass(HTML_CLASSES.ItemHighlighted)) {
        rowText += ' highlighted'
      }
      if (await E2eHelper.hasDottedBorder(from)) {
        rowText += ' dotted'
      }

      const to = await pair.find(`.${HTML_CLASSES.UnitGameCardContainer}`).nth(1)
      rowText += `, to: ${await to.getAttribute('title')}`
      if (await to.hasClass(HTML_CLASSES.ItemHighlighted)) {
        rowText += ' highlighted'
      }
      if (await E2eHelper.hasDottedBorder(to)) {
        rowText += ' dotted'
      }
      actual.push(rowText)
    }
    const availableCount = await RedrawUnits.elements.RedrawCard.count
    for (let i = 0; i < availableCount; i++) {
      const available = await RedrawUnits.elements.RedrawCard.nth(i)
      let rowText = `from: ${await available.getAttribute('title')}`
      if (await available.hasClass(HTML_CLASSES.ItemHighlighted)) {
        rowText += ' highlighted'
      }
      if (await E2eHelper.hasDottedBorder(available)) {
        rowText += ' dotted'
      }
      actual.push(rowText)
    }
    await t.expect(actual).eql(expected)

    const redrawnExpected = redraws.filter((redraw) => !!redraw.to)
    await t
      .expect(RedrawUnits.elements.RedrawInstructions.innerText)
      .eql(
        redrawnExpected.length === MAX_REDRAWS
          ? 'All allowed redraws made. To begin the game:'
          : `Optionally select up to ${MAX_REDRAWS - redrawnExpected.length} card${
              MAX_REDRAWS - redrawnExpected.length === 1 ? '' : 's'
            } from your hand to redraw. When satisfied with deck:`
      )
  }

  static async selectRedrawnCard({ pair, from }: { pair: number; from?: boolean }) {
    const row = await RedrawUnits.elements.RedrawPair.nth(pair - 1)
    const card = await row.find(`.${HTML_CLASSES.UnitGameCardContainer}`).nth(from ? 0 : 1)
    await t.click(card)
  }

  static async fullscreenRedrawnCard({ pair, from }: { pair: number; from?: boolean }) {
    const row = await RedrawUnits.elements.RedrawPair.nth(pair - 1)
    const card = await row.find(`.${HTML_CLASSES.UnitGameCardContainer}`).nth(from ? 0 : 1)
    await t.click(card.find(`.${HTML_CLASSES.UnitGameCardFullScreen}`))
  }
}

export interface RedrawCard {
  unitName?: string
  highlighted?: boolean
  dotted?: boolean
}

export interface RedrawPair {
  from: RedrawCard
  to?: RedrawCard
}
