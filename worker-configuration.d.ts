interface Env {
  BROWSER: Fetcher
  SCREENSHOTS: R2Bucket
}

declare module 'cloudflare:workers' {
  export const env: Env
}
