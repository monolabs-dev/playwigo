import type { BufferedStep, TestCaseSelectorType } from '@/api/types'

export type ExtensionMessage =
  | { type: 'GET_STATE' }
  | { type: 'GET_AUTH' }
  | {
      type: 'SET_AUTH'
      apiKey: string
      apiUrl: string
    }
  | { type: 'CLEAR_AUTH' }
  | {
      type: 'START_CONNECT'
      apiUrl: string
    }
  | { type: 'CANCEL_CONNECT' }
  | { type: 'GET_CONNECT_STATUS' }
  | {
      type: 'LOAD_STEPS'
      testCaseId: string
      baseUrl: string | null
    }
  | { type: 'GET_SESSION' }
  | {
      type: 'SET_STEPS'
      steps: BufferedStep[]
      dirty?: boolean
    }
  | { type: 'START_RECORDING'; tabId?: number }
  | { type: 'STOP_RECORDING' }
  | {
      type: 'START_PICK'
      clientId: string
      tabId?: number
    }
  | { type: 'STOP_PICK' }
  | { type: 'SAVE_STEPS' }
  | { type: 'DISCARD_STEPS' }
  | {
      type: 'RECORDED_STEP'
      step: Omit<BufferedStep, 'clientId'> & { clientId?: string }
    }
  | {
      type: 'PICKED_ELEMENT'
      selectorType: TestCaseSelectorType
      selector: string
      action?: 'hover'
    }
  | { type: 'CONTENT_READY' }
  | { type: 'PING_CONTENT' }

/** Message sent from the Playwigo web app via chrome.runtime.sendMessage. */
export type ExternalAuthMessage = {
  type: 'EXTENSION_AUTH'
  state: string
  apiKey: string
  apiUrl: string
}

/** Broadcast from background → side panel after a successful handoff. */
export type AuthConnectedMessage = {
  type: 'AUTH_CONNECTED'
}

export type ExtensionResponse =
  | { ok: true; data?: unknown }
  | { ok: false; error: string; code?: string }

export type SessionSnapshot = {
  tabId: number | null
  testCaseId: string | null
  recording: boolean
  picking: boolean
  pickClientId: string | null
  steps: BufferedStep[]
  dirty: boolean
}

export function sendMessage<T = unknown>(
  message: ExtensionMessage,
): Promise<T> {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  return browser.runtime.sendMessage(message) as Promise<T>
}
