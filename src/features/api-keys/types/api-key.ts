export type ApiKeySummary = {
  id: string
  name: string | null
  start: string | null
  prefix: string | null
  enabled: boolean | null
  createdAt: string | Date
  expiresAt: string | Date | null
  lastRequest: string | Date | null
}

export type CreatedApiKey = ApiKeySummary & {
  key: string
}
