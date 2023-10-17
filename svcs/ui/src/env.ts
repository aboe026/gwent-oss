import getEnv, { port, str, url } from '@witcher-3-gwent/env'

export default getEnv({
  specs: {
    API_URL: url({
      desc: 'The URL to reach out to for API requests',
      default: 'http://localhost:4000/graphql',
    }),
    CLIENT_DIR: str({
      desc: 'Path to directory containing client files to server',
      default: 'client',
    }),
    PORT: port({
      desc: 'The port to run the WebServer server on',
      default: 3000,
    }),
  },
})
