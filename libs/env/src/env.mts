import { bool, CleanedEnv, cleanEnv, CleanOptions, email, host, json, num, port, str, url } from 'envalid'
import { config } from 'dotenv'

/**
 * Get environment variables while enforcing how values should be parsed.
 *
 * @param {Object} config Configuration for how the environment variables should be parsed.
 * @param config.dotEnvFilePath The path on the filesystem to check for an existing ".env" file containing key=value environment variable pairs. Defaults to ".env", can be overwritten with the "DOT_ENV_FILE_PATH" environment variable.
 * @param config.environment The environment variables to parse. Defaults to "process.env".
 * @param config.specs The specifications for what environment variables to parse and how they should be parsed.
 * @param config.options Additional options to control how environment variables should be parsed.
 * @returns An object containing environment variables as defined in the specs input parameter.
 */
export default function getEnv<T>({
  dotEnvFilePath,
  environment,
  specs,
  options,
}: {
  dotEnvFilePath?: string
  environment?: unknown
  specs: T
  options?: CleanOptions<T>
}): CleanedEnv<T> {
  config({
    path: process.env.DOT_ENV_FILE_PATH || dotEnvFilePath || '.env',
  })
  return cleanEnv<T>(environment || process.env, specs, options)
}

export enum NODE_ENV {
  Dev = 'development',
  Prod = 'production',
  Test = 'test',
}

export { bool, email, host, json, num, port, str, url }
