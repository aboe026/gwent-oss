/**
 * Environment variables set on the client bundle that are available to the browser code.
 */
declare global {
  interface Window {
    env: {
      API_URL: string
    }
  }
}

export default Window
