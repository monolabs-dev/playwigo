import { storage } from '@wxt-dev/storage'

import { DEFAULT_API_URL } from '@/api/types'
import type { BufferedStep } from '@/api/types'

export type AuthState = {
  apiKey: string
  apiUrl: string
}

export type NavState = {
  projectId: string | null
  projectName: string | null
  featureId: string | null
  featureName: string | null
  testCaseId: string | null
  testCaseName: string | null
  testCaseBaseUrl: string | null
}

export type RecordingSession = {
  tabId: number
  testCaseId: string
  recording: boolean
  picking: boolean
  pickClientId: string | null
  steps: BufferedStep[]
  dirty: boolean
  suppressClickUntil: number
}

export const authStorage = storage.defineItem<AuthState | null>(
  'local:auth',
  { fallback: null },
)

export const navStorage = storage.defineItem<NavState>('local:nav', {
  fallback: {
    projectId: null,
    projectName: null,
    featureId: null,
    featureName: null,
    testCaseId: null,
    testCaseName: null,
    testCaseBaseUrl: null,
  },
})

/** Survives service-worker eviction for the active recording session. */
export const sessionStorage = storage.defineItem<RecordingSession | null>(
  'session:recording',
  { fallback: null },
)

export type PendingConnect = {
  state: string
  apiUrl: string
  createdAt: number
}

export const pendingConnectStorage = storage.defineItem<PendingConnect | null>(
  'session:pendingConnect',
  { fallback: null },
)

export async function getAuth(): Promise<AuthState | null> {
  const auth = await authStorage.getValue()
  if (!auth?.apiKey) return null
  return {
    apiKey: auth.apiKey,
    apiUrl: auth.apiUrl || DEFAULT_API_URL,
  }
}

export async function setAuth(auth: AuthState) {
  await authStorage.setValue({
    apiKey: auth.apiKey.trim(),
    apiUrl: (auth.apiUrl || DEFAULT_API_URL).replace(/\/+$/, ''),
  })
}

export async function clearAuth() {
  await authStorage.setValue(null)
}
