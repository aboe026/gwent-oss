import path from 'path'

import getEnv, { NODE_ENV, port, str, url } from '@gwent/env'

export default function env() {
  return getEnv({
    dotEnvFilePath: process.env.NODE_ENV === NODE_ENV.Dev ? path.join(__dirname, '../.env') : '',
    specs: {
      APP_INFO_FILE_PATH: str({
        desc: 'The path to the file containing information for the application to ingest',
        default: '../../app-info.json',
      }),
      CORS_ORIGIN: url({
        desc: 'The URL to validate against Cross-Origin Resource Sharing (CORS)',
        default: 'http://localhost:3000',
      }),
      GRAPHQL_PATH: str({
        desc: 'The URL path the GraphQL server can be accessed',
        default: 'graphql',
      }),
      LOG_LEVEL: str({
        desc: 'The minimum granularity level of log messages should be output.',
        choices: ['OFF', 'FATAL', 'ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE', 'ALL'],
        default: 'INFO',
      }),
      MONGO_DB: str({
        desc: 'The name of the MongoDB database to interact with',
        default: 'gwent',
      }),
      MONGO_URL: url({
        desc: 'Connection string for MongoDB instance',
        default: 'mongodb://localhost',
      }),
      PORT: port({
        desc: 'The port to run the GraphQL server on',
        default: 4000,
      }),
    },
  })
}
