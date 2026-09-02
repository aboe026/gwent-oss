import path from 'path'

import getEnv, { NODE_ENV, num, port, str, url } from '@gwent-oss/env'

/**
 * Gets the environment variables that relate to how the API operates.
 *
 * @returns Environment variables that control how the API operates.
 */
export default function env() {
  return getEnv({
    dotEnvFilePath: process.env.NODE_ENV === NODE_ENV.Dev ? path.join(__dirname, '..', '.env') : '',
    specs: {
      APP_INFO_FILE_PATH: str({
        desc: 'The path to the file containing information for the application to ingest',
        default: 'app-info.json',
      }),
      CORS_ORIGIN: url({
        desc: 'The URL to validate against Cross-Origin Resource Sharing (CORS)',
        default: 'http://localhost:3000',
      }),
      GRAPHQL_PATH: str({
        desc: 'The URL path where the GraphQL server Queries and Mutations can be accessed.',
        default: 'graphql',
      }),
      JSON_UPLOAD_LIMIT: str({
        desc: 'The maximum size of JSON payload allowed for requests.',
        default: '1mb',
      }),
      LOG_LEVEL: str({
        desc: 'The minimum granularity level of log messages should be output. OFF < FATAL < ERROR < WARN < INFO < DEBUG < TRACE < ALL.',
        choices: ['OFF', 'FATAL', 'ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE', 'ALL'],
        default: 'INFO',
      }),
      MONGO_DB: str({
        desc: 'The name of the MongoDB database to interact with',
        default: 'gwent-oss',
      }),
      MONGO_PASSWORD_FILE: str({
        desc: 'The path to a file containing the MongoDB password for authentication.',
        default: '',
      }),
      MONGO_URL: url({
        desc: 'Connection string for MongoDB instance',
        default: 'mongodb://localhost',
      }),
      MONGO_USERNAME_FILE: str({
        desc: 'The path to a file containing the MongoDB username for authentication.',
        default: '',
      }),
      NODE_ENV: str({
        desc: 'What environment the application is running in',
        choices: [NODE_ENV.Dev, NODE_ENV.Prod, NODE_ENV.Test],
        default: NODE_ENV.Dev,
      }),
      PORT: port({
        desc: 'The port to run the GraphQL server on',
        default: 4000,
      }),
      SESSION_COOKIE_NAME: str({
        desc: 'The name of the Cookie for the user session.',
        default: 'gwent-oss.sid',
      }),
      SESSION_SECRET: str({
        desc: 'The secret to use for securing user sessions',
        default: 'youshouldreallychangethisforproductionusage',
      }),
      SESSION_SECRET_FILE: str({
        desc: 'The path to a file containing the secret to use for securing user sessions. Takes precedence over SESSION_SECRET.',
        default: '',
      }),
      SESSION_TIMEOUT_SECONDS: num({
        desc: 'The time in seconds after which the session for a user expires',
        default: 30 * 60, // 30 minutes
      }),
      SUBSCRIPTION_PATH: str({
        desc: 'The URL path where the GraphQL server Subscriptions can be accessed.',
        default: 'subscribe',
      }),
    },
  })
}
