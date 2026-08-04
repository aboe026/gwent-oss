import path from 'path'

import getEnv, { NODE_ENV, str, url } from '@gwent-oss/env'

export default getEnv({
  dotEnvFilePath: process.env.NODE_ENV === NODE_ENV.Dev ? path.join(__dirname, '..', '.env') : '',
  specs: {
    MONGO_DB: str({
      desc: 'The name of the MongoDB database to interact with',
      default: 'gwent-oss-func',
    }),
    MONGO_URL: url({
      desc: 'Connection string for MongoDB instance',
      default: 'mongodb://localhost',
    }),
  },
})
