import { useQuery } from '@apollo/client'

import { ApplicationDocument } from '@gwent/graphql-schema/apollo-typings'
import Centered from '../../components/Centered'
import { getApolloError } from '../../util/error-util'
import { HTML_CLASSES, HTML_IDS } from '@gwent/constants'
import LoadingSpinner from '../../components/LoadingSpinner'
import { useTitle } from '../../components/TabTitle'
import './About.css'

/**
 * The about page containing application information.
 *
 * @returns The application about page.
 */
export default function AboutPage() {
  useTitle('About | Gwent')
  const { loading, error, data } = useQuery(ApplicationDocument)
  const resolvedError = getApolloError(error)

  return (
    <Centered>
      <div id={HTML_IDS.AboutContainer}>
        {loading ? (
          <LoadingSpinner size="50px" />
        ) : error ? (
          <div className={HTML_CLASSES.ErrorText}>{`Error getting application information: ${resolvedError}`}</div>
        ) : (
          <table>
            <caption>About</caption>
            <tbody>
              <tr>
                <td>Version:</td>
                <td id={HTML_IDS.AboutVersion}>{data?.application.version}</td>
              </tr>
              <tr>
                <td>Build:</td>
                <td id={HTML_IDS.AboutBuild}>{data?.application.build}</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </Centered>
  )
}
