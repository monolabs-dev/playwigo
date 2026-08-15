interface Env {
  BROWSER: Fetcher
  SCREENSHOTS: R2Bucket
  HYPERDRIVE: Hyperdrive
}

declare module 'cloudflare:workers' {
  export const env: Env
}
