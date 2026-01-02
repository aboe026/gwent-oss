import { CSSProperties, Dispatch, SetStateAction } from 'react'

import { CheckAuth, retryCheckingAuth } from '../../util/error-util'
import {
  Combat,
  DeckUnitFragment,
  EffectKey,
  FragmentType,
  GamePlayerFragment,
  GameUnitFragment,
  GameUnitFragmentDoc,
  UnitEffectFragmentDoc,
  UnitFragment,
  UnitFragmentDoc,
  useFragment,
} from '@gwent/graphql-schema/apollo-typings'
import { FullUnitCards, PlayUnitProps, UnitForPlayer } from './GameProps'
import UnitGameCard from '../../components/UnitGameCard'
import isGameUnit from '../../util/is-game-unit'

/**
 * A game unit on the battlefield.
 */
export default function GameRowUnit({
  fullUnit,
  fullUnitFragment,
  gameUnitFragment,
  combat,
  cardSelected,
  player,
  selectedCardInHand,
  scrollHistoryIntoView,
  setCardSelected,
  setFullUnits,
  isTurn,
  index,
  sortedUnits,
  style,
  title,
  cursor,
  isSelf,
  playUnitProps,
  checkAuth,
  gameId,
}: {
  cardSelected: UnitForPlayer | undefined
  fullUnit: UnitFragment | undefined
  fullUnitFragment: UnitForPlayer | undefined
  combat: Combat
  isTurn?: boolean
  player: GamePlayerFragment
  selectedCardInHand: boolean
  scrollHistoryIntoView: (selected: UnitForPlayer) => void
  setCardSelected: Dispatch<SetStateAction<UnitForPlayer | undefined>>
  setFullUnits: Dispatch<SetStateAction<FullUnitCards | undefined>>
  gameUnitFragment: GameUnitFragment | DeckUnitFragment
  index: number
  sortedUnits: FragmentType<typeof GameUnitFragmentDoc>[]
  style?: CSSProperties
  title?: string
  cursor?: string
  isSelf?: boolean
  playUnitProps?: PlayUnitProps
  checkAuth?: CheckAuth
  gameId?: string
}) {
  const unit = useFragment(UnitFragmentDoc, gameUnitFragment.unit)
  const cardSelectedUnit = useFragment(UnitFragmentDoc, cardSelected?.unitFragment.unit)
  const selectedAsFullCard =
    fullUnitFragment && fullUnit && fullUnit.id === unit.id && fullUnitFragment.playerName === player.user.name
  const selected = cardSelectedUnit?.id === unit.id && cardSelected?.playerName === player.user.name
  const decoySelected =
    cardSelectedUnit &&
    cardSelectedUnit.effects &&
    cardSelectedUnit.effects.some((effect) => useFragment(UnitEffectFragmentDoc, effect).key === EffectKey.Decoy)
  const highlightedForDecoy = !!decoySelected && isSelf && !unit.hero && !unit.special

  return (
    <div
      className="game-combat-card-wrapper"
      style={style}
      key={unit.id}
      onClick={() => {
        const cardBeingPlayed =
          isTurn &&
          selectedCardInHand &&
          cardSelectedUnit &&
          (!cardSelectedUnit.combats || cardSelectedUnit.combats.includes(combat)) &&
          !highlightedForDecoy
        if (!cardBeingPlayed) {
          const newCardSelected: UnitForPlayer | undefined = selected
            ? undefined
            : {
                unitFragment: gameUnitFragment,
                playerName: player.user.name,
              }
          setCardSelected(newCardSelected)
          if (newCardSelected) {
            scrollHistoryIntoView(newCardSelected)
          }
        }
      }}
    >
      <UnitGameCard
        deckUnit={{
          artStyle: gameUnitFragment.artStyle,
          unit: gameUnitFragment.unit,
        }}
        title={highlightedForDecoy ? `Select to decoy ${unit.name} back into hand` : title}
        cursor={cursor}
        effectiveStrength={isGameUnit(gameUnitFragment) ? gameUnitFragment.effectiveStrength : undefined}
        selected={selectedAsFullCard || selected || highlightedForDecoy}
        dotted={!isTurn && !selected}
        onFullscreen={() => {
          setFullUnits({
            currentIndex: index,
            units: sortedUnits.map((deckUnit) => {
              return {
                playerName: player.user.name,
                unitFragment: useFragment(GameUnitFragmentDoc, deckUnit),
              }
            }),
          })
          setCardSelected(
            selected
              ? undefined
              : {
                  unitFragment: gameUnitFragment,
                  playerName: player.user.name,
                }
          )
        }}
        onClick={async ({ event }) => {
          if (highlightedForDecoy && playUnitProps && !playUnitProps.loading && gameId && checkAuth) {
            event.preventDefault()
            event.stopPropagation()
            await retryCheckingAuth({
              checkAuth,
              method: async () => {
                await playUnitProps.playUnit({
                  variables: {
                    game: gameId,
                    combat: combat,
                    unit: cardSelectedUnit.id,
                    target: unit.id,
                  },
                })
                setCardSelected(undefined)
              },
            })
          }
        }}
      />
    </div>
  )
}
