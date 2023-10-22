import path from 'path'

import getEnv, { NODE_ENV, port, str, url } from '@gwent/env'

export default function env() {
  return getEnv({
    dotEnvFilePath: process.env.NODE_ENV === NODE_ENV.Dev ? path.join(__dirname, '../.env') : '',
    specs: {
      API_URL: url({
        desc: 'The URL to reach out to for API requests',
        default: 'http://localhost:4000/graphql',
      }),
      CLIENT_DIR: str({
        desc: 'Path to directory containing client files to server',
        default: 'client',
      }),
      LOG_LEVEL: str({
        desc: 'The minimum granularity level of log messages should be output.',
        choices: ['OFF', 'FATAL', 'ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE', 'ALL'],
        default: 'INFO',
      }),
      PORT: port({
        desc: 'The port to run the WebServer server on',
        default: 3000,
      }),
    },
  })
}
