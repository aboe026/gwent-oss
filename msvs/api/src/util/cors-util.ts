import { getLogger } from 'log4js'

/**
 * A class to help with CORS (Cross-Origin Resource Sharing) functionality.
 */
export default class CorsUtil {
  private static logger = getLogger('CorsUtil')

  /**
   * Resolves the given CORS origin to be used to enforce CORS policy.
   *
   * @param corsOrigin The CORS origin to resolve to an appropriate URL for CORS policy enforcement.
   * @returns The CORS origin adjusted to properly enforce the CORS policy.
   */
  static resolveCorsOrigin(corsOrigin: string): string {
    const corsUrl = new URL(corsOrigin) // removes default ports 80/443 for HTTP/HTTPS respectively
    let resolvedCorsOrigin = corsUrl.toString()
    if (resolvedCorsOrigin.endsWith('/')) {
      resolvedCorsOrigin = resolvedCorsOrigin.substring(0, resolvedCorsOrigin.length - 1)
    }
    CorsUtil.logger.trace(`resolvedCorsOrigin: "${resolvedCorsOrigin}"`)
    return resolvedCorsOrigin
  }
}
