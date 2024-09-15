import { useEffect } from 'react'

/**
 * Set the Title of the browser Tab.
 *
 * @param title The Title the browser tab should have.
 */
export function useTitle(title: string) {
  useEffect(() => {
    const prevTitle = document.title
    document.title = title
    return () => {
      document.title = prevTitle
    }
  })
}
