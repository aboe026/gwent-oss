/**
 * Environment variables set on the client bundle that are available to the browser code.
 */
declare global {
  interface Window {
    env: {
      API_BASE_URL: string
      EMAIL_ADDRESS: string
      GITHUB_LINK: string
      WEB_SOCKET_PING_INTERVAL_SECONDS: string
    }
  }
}

export default Window
