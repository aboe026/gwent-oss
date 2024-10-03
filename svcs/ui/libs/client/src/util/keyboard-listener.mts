import { useEffect } from 'react'

// TODO: change this file to .tsx?

/**
 * Execute functions when specific keys are pressed by the user.
 *
 * @param keyCallbackMap The map of keys to listen for and what functions should be run when they are pressed.
 */
export const useKeyDown = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  keyCallbackMap: { key: Key; ctrl?: boolean; condition: (T?: any) => boolean; onCondition: (T?: any) => void }[]
) => {
  const onKeyDown = (event: KeyboardEvent) => {
    const match = keyCallbackMap.find(
      (keyCallback) => keyCallback.key === event.key && (keyCallback.ctrl || false) === event.ctrlKey
    )
    if (match) {
      const condition = match.condition()
      if (condition) {
        event.preventDefault()
        event.stopPropagation()
        match.onCondition()
      }
    }
  }
  useEffect(() => {
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [onKeyDown])
}

export enum Key {
  Enter = 'Enter',
  Escape = 'Escape',
  Left = 'ArrowLeft',
  Right = 'ArrowRight',
}

export enum Button {
  Wheel = 1,
}
