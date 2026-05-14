import {
  DeckUnitFragment,
  EffectKey,
  FieldUnitFragment,
  GameUnitFragment,
  UnitEffectFragmentDoc,
  UnitFragmentDoc,
  useFragment,
  WeatherUnitFragment,
} from '@gwent/graphql-schema/apollo-typings'
import { Dispatch, SetStateAction, useLayoutEffect, useRef, useState } from 'react'
import { Rnd } from 'react-rnd'
import './ReviveDialog.css'
import WholeScreenDialog from '../../components/WholeScreenDialog'
import UnitGameCard from '../../components/UnitGameCard'
import { convertGameUnit, getUnitFromGameUnit } from '../../util/game-unit-util'
import { CgArrowLongRight } from 'react-icons/cg'
import { HTML_CLASSES, HTML_IDS } from '@gwent/constants'
import CloseButton from '../../components/CloseButton'
import { PlayUnitProps, UnitForPlayer } from './GameProps'
import { Key, useKeyDown } from '../../util/keyboard-listener'
import { retryCheckingAuth } from '../../util/error-util'
import { useUserContext } from '../../UserContext'

/**
 * Dialog for choosing which Units a Medic should revive.
 */
export default function ReviveDialog({
  gameId,
  medic,
  gameUnitsToRevive,
  setGameUnitsToRevive,
  discarded,
  open,
  playUnitProps,
  setCardSelected,
  setOpen,
}: {
  gameId: string
  medic: DeckUnitFragment | FieldUnitFragment | WeatherUnitFragment | undefined
  gameUnitsToRevive: GameUnitFragment[]
  discarded: GameUnitFragment[]
  open: boolean
  playUnitProps: PlayUnitProps
  setGameUnitsToRevive: Dispatch<SetStateAction<GameUnitFragment[]>>
  setCardSelected: Dispatch<SetStateAction<UnitForPlayer | undefined>>
  setOpen: Dispatch<SetStateAction<boolean>>
}) {
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null)
  const [discardSelected, setDiscardSelected] = useState<GameUnitFragment>()
  const { checkAuth } = useUserContext()
  const contentRef = useRef<HTMLDivElement | null>(null)

  useKeyDown([
    {
      key: Key.Escape,
      condition: () => open,
      onCondition: () => setOpen(false),
    },
  ])

  useLayoutEffect(() => {
    if (!open || !contentRef.current) return

    const rect = contentRef.current.getBoundingClientRect()

    const width = rect.width
    const height = rect.height

    setSize({ width, height })

    const x = window.innerWidth / 2 - width / 2
    const y = window.innerHeight / 2 - height / 2

    setPosition({ x, y })
  }, [open])

  if (open && medic) {
    const selectedUnit = getUnitFromGameUnit(discardSelected)

    return (
      <WholeScreenDialog>
        <Rnd
          position={position ?? undefined}
          size={size.width && size.height ? size : undefined}
          onDragStop={(_, data) => {
            setPosition({ x: data.x, y: data.y })
          }}
          onResizeStop={(_, __, ref, ___, pos) => {
            setSize({ width: ref.offsetWidth, height: ref.offsetHeight })
            setPosition(pos)
          }}
          enableResizing={false}
          style={{ zIndex: 101 }}
        >
          <div id={HTML_IDS.GameReviveDialog} ref={contentRef}>
            <div id="reviveHeader">
              <div style={{ width: '32px' }}></div>
              <div id="reviveTitle">Revive Lost Units with Medic</div>
              <CloseButton onClose={() => setOpen(false)} />
            </div>
            <div id="reviveMedics">
              <div className="revival-unit">
                <UnitGameCard gameUnit={medic} />
              </div>
              <CgArrowLongRight color="black" title="Reviving" />
              <div
                id={HTML_IDS.GameReviveEmpty}
                className={`revival-unit ${discardSelected ? HTML_CLASSES.ItemHighlighted : ''}`}
                title="Place Lost unit here to revive."
                style={{ cursor: selectedUnit ? 'pointer' : 'inherit' }}
                onClick={async () => {
                  if (discardSelected && selectedUnit && !playUnitProps.loading) {
                    const revivingAnotherMedic =
                      selectedUnit.effects &&
                      selectedUnit.effects.some(
                        (effect) => useFragment(UnitEffectFragmentDoc, effect).key === EffectKey.Medic
                      )
                    if (revivingAnotherMedic) {
                      setGameUnitsToRevive([...gameUnitsToRevive, discardSelected])
                    } else {
                      const targets: string[] = []
                      for (const gameUnitToRevive of gameUnitsToRevive) {
                        const unit = getUnitFromGameUnit(gameUnitToRevive)
                        if (unit) {
                          targets.push(unit.id)
                        }
                      }
                      targets.push(selectedUnit.id)
                      await retryCheckingAuth({
                        checkAuth,
                        method: async () => {
                          await playUnitProps.playUnit({
                            variables: {
                              game: gameId,
                              unit: useFragment(UnitFragmentDoc, medic.unit).id,
                              targets: targets,
                            },
                          })
                          setOpen(false)
                        },
                      })
                      setCardSelected(undefined)
                    }
                  }
                }}
              ></div>
            </div>
            <div>Select Lost unit to revive:</div>
            <div id={HTML_IDS.GameReviveUnits}>
              {discarded.map((discard, index) => {
                const selected = selectedUnit?.id === getUnitFromGameUnit(discard)?.id
                return (
                  <div className="revival-unit" key={index}>
                    <UnitGameCard
                      gameUnit={convertGameUnit(discard)}
                      onClick={() => {
                        if (!playUnitProps.loading) {
                          setDiscardSelected(selected ? undefined : discard)
                        }
                      }}
                      selected={selected}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </Rnd>
      </WholeScreenDialog>
    )
  }
}
