import path from 'path'

import getEnv, { NODE_ENV, num, port, str, url } from '@gwent/env'

/**
 * Gets the environment variables that relate to how the UI server operates.
 *
 * @returns Environment variables that control how the UI server operates.
 */
export default function env() {
  return getEnv({
    dotEnvFilePath: process.env.NODE_ENV === NODE_ENV.Dev ? path.join(__dirname, '..', '.env') : '',
    specs: {
      API_BASE_URL: url({
        desc: 'The base URL the Gwent API is running on (should contain /graphl and /subscribe endpoints)',
        default: 'http://localhost:4000',
      }),
      CLIENT_DIR: str({
        desc: 'Path to directory containing client files to serve',
        default: '../libs/client/build',
      }),
      IMAGES_DIR: str({
        desc: 'Path on filesystem to directory containing asset images to serve',
        default: '../images',
      }),
      LOG_LEVEL: str({
        desc: 'The minimum granularity level of log messages should be output. OFF < FATAL < ERROR < WARN < INFO < DEBUG < TRACE < ALL.',
        choices: ['OFF', 'FATAL', 'ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE', 'ALL'],
        default: 'INFO',
      }),
      NODE_ENV: str({
        desc: 'What environment the application is running in',
        choices: [NODE_ENV.Dev, NODE_ENV.Prod, NODE_ENV.Test],
        default: NODE_ENV.Dev,
      }),
      PORT: port({
        desc: 'The port to run the WebServer server on',
        default: 3000,
      }),
      WEB_SOCKET_PING_INTERVAL_SECONDS: num({
        desc: 'The interval (in seconds) that the client reaches out to the server to verify the WebSocket connection.',
        default: 5,
      }),
    },
  })
}
