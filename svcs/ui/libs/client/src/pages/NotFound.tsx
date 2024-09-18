import { isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { Link } from 'react-router-dom'

import { HTML_IDS } from '@gwent/constants'
import { ROUTES } from '@gwent/constants'

/**
 * A page to display when a user attempts to access a URL that has no defined page.
 *
 * @returns A page to redirect the user to a URL that has a defined page for it.
 */
export default function NotFoundPage() {
  const error = useRouteError()
  console.error(error)

  let message = ''
  if (isRouteErrorResponse(error)) {
    message = error.statusText || error.data?.message
  } else if (error instanceof Error) {
    message = error.message
  }

  return (
    <div id={HTML_IDS.NotFoundContainer}>
      <h1>Page Not Found</h1>
      <p>It appears the page you are trying to access does not exist.</p>
      <p>
        <i>{message}</i>
      </p>
      <Link to={ROUTES.Home.path} id={HTML_IDS.NotFoundHomeLink}>
        Home
      </Link>
    </div>
  )
}
