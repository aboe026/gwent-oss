import { config } from 'dotenv'

import {
  bool,
  CleanedEnvAccessors,
  cleanEnv,
  CleanOptions,
  email,
  host,
  json,
  num,
  port,
  str,
  url,
  ValidatorSpec,
} from 'envalid'

export default function getEnv<T>({
  dotEnvFilePath,
  environment,
  specs,
  options,
}: {
  dotEnvFilePath?: string
  environment?: unknown
  specs: {
    [K in keyof T]: ValidatorSpec<T[K]>
  }
  options?: CleanOptions<T>
}): Readonly<T & CleanedEnvAccessors> {
  config({
    path: dotEnvFilePath || process.env.DOT_ENV_FILE_PATH || '.env',
  })
  return cleanEnv(environment || process.env, specs, options)
}

export enum NODE_ENV {
  Dev = 'development',
  Prod = 'production',
}

export { bool, email, host, json, num, port, str, url }
