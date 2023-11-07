import { isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { Link } from 'react-router-dom'

import { HTML_IDS } from '@gwent/constants'

export default function ErrorPage() {
  const error = useRouteError()
  console.error(error)

  let message = ''
  if (isRouteErrorResponse(error)) {
    message = error.statusText || error.data?.message
  } else if (error instanceof Error) {
    message = error.message
  }

  return (
    <div id={HTML_IDS.NotFound}>
      <h1>Page Not Found</h1>
      <p>It appears the page you are trying to access does not exist.</p>
      <p>
        <i>{message}</i>
      </p>
      <Link to={'/'} id={HTML_IDS.NotFoundHomeLink}>
        Home
      </Link>
    </div>
  )
}
