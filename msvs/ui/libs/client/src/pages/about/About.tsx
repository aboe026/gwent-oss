import { useQuery } from '@apollo/client/react'

import { ApplicationDocument } from '@gwent-oss/graphql-schema/apollo-typings'
import Centered from '../../components/Centered'
import { getErrorMessages } from '../../util/error-util'
import { HTML_CLASSES, HTML_IDS } from '@gwent-oss/constants'
import LoadingSpinner from '../../components/LoadingSpinner'
import { useTitle } from '../../components/TabTitle'
import './About.css'

/**
 * The about page containing application information.
 *
 * @returns The application about page.
 */
export default function AboutPage() {
  useTitle('About | gwent-oss')
  const { loading, error, data } = useQuery(ApplicationDocument)
  const errorMessages = getErrorMessages(error)

  return (
    <Centered>
      <div id={HTML_IDS.AboutContainer}>
        {loading ? (
          <LoadingSpinner size="50px" />
        ) : error ? (
          <div className={HTML_CLASSES.ErrorText}>{`Error getting application information: ${errorMessages}`}</div>
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
