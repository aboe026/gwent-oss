import path from 'path'

import getEnv, { NODE_ENV, port, str, url } from '@gwent/env'

export default getEnv({
  dotEnvFilePath: process.env.NODE_ENV === NODE_ENV.Dev ? path.join(__dirname, '../.env') : '',
  specs: {
    API_URL: url({
      desc: 'The URL the Gwent GraphQL API is running on',
      default: 'http://localhost:4000/graphql',
    }),
    BASE_URL: url({
      desc: 'The URL the Gwent website is running on',
      default: 'http://localhost:3000',
    }),
    MONGO_DB: str({
      desc: 'The name of the MongoDB database to interact with',
      default: 'gwent-e2e',
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
