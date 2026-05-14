import { CgArrowLongRight } from 'react-icons/cg'
import { Dispatch, SetStateAction, useLayoutEffect, useRef, useState } from 'react'
import { Rnd } from 'react-rnd'

import CloseButton from '../../components/CloseButton'
import { convertGameUnit, getUnitFromGameUnit } from '../../util/game-unit-util'
import {
  DeckUnitFragment,
  EffectKey,
  FieldUnitFragment,
  FieldUnitFragmentDoc,
  GameUnitFragment,
  UnitEffectFragmentDoc,
  UnitFragmentDoc,
  useFragment,
  WeatherUnitFragment,
} from '@gwent/graphql-schema/apollo-typings'
import { HTML_CLASSES, HTML_IDS } from '@gwent/constants'
import { Key, useKeyDown } from '../../util/keyboard-listener'
import { PlayUnitProps, UnitForPlayer } from './GameProps'
import { retryCheckingAuth } from '../../util/error-util'
import UnitGameCard from '../../components/UnitGameCard'
import { useUserContext } from '../../UserContext'
import WholeScreenDialog from '../../components/WholeScreenDialog'
import './ReviveDialog.css'

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
      onCondition: () => {
        setOpen(false)
        setDiscardSelected(undefined)
        setGameUnitsToRevive([])
      },
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
    const medics: (DeckUnitFragment | FieldUnitFragment | WeatherUnitFragment)[] = [medic]
    for (const gameUnitToRevive of gameUnitsToRevive) {
      if (gameUnitToRevive.__typename === 'FieldUnit') {
        const unitEffects = useFragment(
          UnitFragmentDoc,
          useFragment(FieldUnitFragmentDoc, gameUnitToRevive).unit
        ).effects
        if (
          unitEffects &&
          unitEffects.some((effect) => useFragment(UnitEffectFragmentDoc, effect).key === EffectKey.Medic)
        ) {
          medics.push(convertGameUnit(gameUnitToRevive))
        }
      }
    }
    const discardsEligible = discarded.filter((discard) => {
      const discardUnit = getUnitFromGameUnit(discard)
      return (
        !discardUnit?.hero &&
        !discardUnit?.special &&
        !gameUnitsToRevive.map((gameUnit) => getUnitFromGameUnit(gameUnit)?.id).includes(discardUnit?.id)
      )
    })

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
              <CloseButton
                onClose={() => {
                  setOpen(false)
                  setDiscardSelected(undefined)
                  setGameUnitsToRevive([])
                }}
              />
            </div>
            <div id="reviveMedics">
              {medics.map((potentialMedic, index) => (
                <div className="revive-medic-pair" key={index}>
                  <div className="revival-unit">
                    <UnitGameCard gameUnit={potentialMedic} />
                  </div>
                  <CgArrowLongRight color="black" title="Reviving" />
                </div>
              ))}
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
                    console.log(`TEST revivingAnotherMedic: "${revivingAnotherMedic}"`)
                    if (revivingAnotherMedic) {
                      console.log('TEST 0')
                      setGameUnitsToRevive([...gameUnitsToRevive, discardSelected])
                      setDiscardSelected(undefined)
                      const newPairWidth = 150
                      // TODO: make sure don't extend width beyond screen width
                      setSize({ width: size.width + newPairWidth, height: size.height })
                      if (position) {
                        setPosition({
                          x: position.x - newPairWidth / 2,
                          y: position.y,
                        })
                      }
                    } else {
                      console.log('TEST 1')
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
              {discardsEligible.map((discard, index) => {
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
