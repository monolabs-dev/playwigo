/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import {
  ApiError,
  createClient,
  listProjects,
  listSteps,
  replaceSteps,
  webAppUrl

} from '@/api/client'
import type {ApiClientOptions} from '@/api/client';
import { DEFAULT_API_URL  } from '@/api/types'
import type {BufferedStep} from '@/api/types';
import type {
  ExtensionMessage,
  ExtensionResponse,
  ExternalAuthMessage,
  SessionSnapshot,
} from '@/lib/messaging'
import {
  clearAuth,
  getAuth,
  pendingConnectStorage,
  sessionStorage,
  setAuth

} from '@/lib/storage'
import type {RecordingSession} from '@/lib/storage';
import { newClientId } from '@/lib/utils'
import { toBufferedSteps, toStepInputs, validateBufferedSteps } from '@/lib/validate-steps'
import { stepFromGoto } from '@/recorder/events'

export default defineBackground(() => {
  let memorySession: RecordingSession | null = null

  void browser.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch(() => {
      // Firefox / older Chromium without sidePanel.
    })

  async function loadSession(): Promise<RecordingSession | null> {
    if (memorySession) return memorySession
    memorySession = await sessionStorage.getValue()
    return memorySession
  }

  async function saveSession(session: RecordingSession | null) {
    memorySession = session
    await sessionStorage.setValue(session)
  }

  function snapshot(session: RecordingSession | null): SessionSnapshot {
    return {
      tabId: session?.tabId ?? null,
      testCaseId: session?.testCaseId ?? null,
      recording: session?.recording ?? false,
      picking: session?.picking ?? false,
      pickClientId: session?.pickClientId ?? null,
      steps: session?.steps ?? [],
      dirty: session?.dirty ?? false,
    }
  }

  async function getClient(): Promise<ApiClientOptions> {
    const auth = await getAuth()
    if (!auth?.apiKey) {
      throw new ApiError('Not signed in', 'unauthorized', 401)
    }
    return createClient(auth.apiKey, auth.apiUrl)
  }

  async function sendToTab(tabId: number, message: ExtensionMessage) {
    try {
      return await browser.tabs.sendMessage(tabId, message)
    } catch {
      // Content script may not be injected yet (e.g. chrome:// pages, or tab
      // opened before the extension loaded). Retry after a short wait once.
      await new Promise((r) => setTimeout(r, 150))
      try {
        return await browser.tabs.sendMessage(tabId, message)
      } catch (error) {
        const msg =
          error instanceof Error ? error.message : 'Tab messaging failed'
        throw new Error(
          `${msg}. Open a normal http(s) page and try again.`,
        )
      }
    }
  }

  async function activeTabId() {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true })
    return tabs[0]?.id ?? null
  }

  function appendStep(session: RecordingSession, step: BufferedStep) {
    const steps = [...session.steps]

    // Collapse successive fill on the same selector.
    const last = steps[steps.length - 1]
    if (
      last &&
      last.action === 'fill' &&
      step.action === 'fill' &&
      last.selector === step.selector
    ) {
      steps[steps.length - 1] = { ...last, value: step.value, warning: step.warning }
    } else {
      steps.push(step)
    }

    return { ...session, steps, dirty: true }
  }

  browser.webNavigation.onCommitted.addListener(async (details) => {
    if (details.frameId !== 0) return
    if (details.transitionType === 'auto_subframe') return

    const session = await loadSession()
    if (!session?.recording || session.tabId !== details.tabId) return

    // Skip pure reloads / history restores that aren't useful as goto steps.
    if (
      details.transitionType === 'reload' ||
      details.transitionQualifiers?.includes('forward_back')
    ) {
      return
    }

    const next = appendStep(session, {
      ...stepFromGoto(details.url),
      clientId: newClientId(),
    })

    // If the previous step was a click within the suppress window, drop it —
    // the navigation came from that anchor click.
    const prev = next.steps[next.steps.length - 2]
    if (
      prev?.action === 'click' &&
      Date.now() < session.suppressClickUntil
    ) {
      next.steps.splice(next.steps.length - 2, 1)
    }

    await saveSession(next)
    void browser.runtime.sendMessage({ type: 'SESSION_UPDATED' }).catch(() => {})
  })

  // Full navigations destroy the content script. Once the new document is ready,
  // re-arm recording so click/fill keep working on the next page.
  browser.webNavigation.onCompleted.addListener(async (details) => {
    if (details.frameId !== 0) return
    const session = await loadSession()
    if (!session?.recording || session.tabId !== details.tabId) return
    await sendToTab(details.tabId, { type: 'START_RECORDING' }).catch(
      () => undefined,
    )
  })

  browser.runtime.onMessage.addListener(
    (message: ExtensionMessage | { type: 'SESSION_UPDATED' }, sender) => {
      return handleMessage(message as ExtensionMessage, sender)
    },
  )

  browser.runtime.onMessageExternal.addListener(
    (message: ExternalAuthMessage, _sender, sendResponse) => {
      void (async () => {
        try {
          if (message?.type !== 'EXTENSION_AUTH') {
            sendResponse({ ok: false, error: 'Unknown message' })
            return
          }

          const pending = await pendingConnectStorage.getValue()
          if (!pending?.state || pending.state !== message.state) {
            sendResponse({
              ok: false,
              error: 'This connect request expired. Start again from the extension.',
            })
            return
          }

          const apiKey = message.apiKey?.trim()
          if (!apiKey?.startsWith('sk-pwg-')) {
            sendResponse({ ok: false, error: 'Invalid API key' })
            return
          }

          const apiUrl = (message.apiUrl || pending.apiUrl || DEFAULT_API_URL)
            .replace(/\/+$/, '')

          // Validate the key before storing.
          await listProjects(createClient(apiKey, apiUrl))
          await setAuth({ apiKey, apiUrl })
          await pendingConnectStorage.setValue(null)

          void browser.runtime
            .sendMessage({ type: 'AUTH_CONNECTED' })
            .catch(() => {})

          sendResponse({ ok: true })
        } catch (error) {
          sendResponse({
            ok: false,
            error:
              error instanceof Error
                ? error.message
                : 'Unable to complete connection',
          })
        }
      })()
      return true
    },
  )

  async function handleMessage(
    message: ExtensionMessage,
    sender: Parameters<
      Parameters<typeof browser.runtime.onMessage.addListener>[0]
    >[1],
  ): Promise<ExtensionResponse | SessionSnapshot | { ok: true; auth: unknown }> {
    try {
      switch (message.type) {
        case 'GET_AUTH': {
          const auth = await getAuth()
          return { ok: true, auth }
        }

        case 'SET_AUTH': {
          await setAuth({ apiKey: message.apiKey, apiUrl: message.apiUrl })
          await pendingConnectStorage.setValue(null)
          return { ok: true }
        }

        case 'CLEAR_AUTH': {
          await clearAuth()
          await pendingConnectStorage.setValue(null)
          await saveSession(null)
          return { ok: true }
        }

        case 'START_CONNECT': {
          const apiUrl = (message.apiUrl || DEFAULT_API_URL).replace(/\/+$/, '')
          const state = crypto.randomUUID()
          await pendingConnectStorage.setValue({
            state,
            apiUrl,
            createdAt: Date.now(),
          })

          const url = new URL(webAppUrl(apiUrl, '/extension/connect'))
          url.searchParams.set('state', state)
          url.searchParams.set('extensionId', browser.runtime.id)

          await browser.tabs.create({ url: url.toString() })
          return { ok: true, data: { state } }
        }

        case 'CANCEL_CONNECT': {
          await pendingConnectStorage.setValue(null)
          return { ok: true }
        }

        case 'GET_CONNECT_STATUS': {
          const pending = await pendingConnectStorage.getValue()
          const fresh =
            pending != null && Date.now() - pending.createdAt < 15 * 60 * 1000
          if (pending && !fresh) {
            await pendingConnectStorage.setValue(null)
          }
          return { ok: true, data: { pending: Boolean(fresh) } }
        }

        case 'GET_SESSION': {
          return snapshot(await loadSession())
        }

        case 'LOAD_STEPS': {
          const client = await getClient()
          const payload = await listSteps(client, message.testCaseId)
          let steps = toBufferedSteps(payload.steps)

          if (steps.length === 0 && message.baseUrl) {
            steps = [
              {
                ...stepFromGoto(message.baseUrl),
                clientId: newClientId(),
              },
            ]
          }

          const tabId = (await activeTabId()) ?? -1
          const session: RecordingSession = {
            tabId,
            testCaseId: message.testCaseId,
            recording: false,
            picking: false,
            pickClientId: null,
            steps,
            dirty: steps.length === 1 && !payload.steps.length && Boolean(message.baseUrl),
            suppressClickUntil: 0,
          }
          await saveSession(session)
          return {
            ok: true,
            data: { ...snapshot(session), loginPrelude: payload.loginPrelude },
          }
        }

        case 'SET_STEPS': {
          const session = await loadSession()
          if (!session) {
            return { ok: false, error: 'No active session' }
          }
          await saveSession({
            ...session,
            steps: message.steps,
            dirty: message.dirty ?? true,
          })
          return { ok: true, data: snapshot(await loadSession()) }
        }

        case 'START_RECORDING': {
          const session = await loadSession()
          if (!session) return { ok: false, error: 'Load a test case first' }
          const tabId = message.tabId ?? (await activeTabId())
          if (tabId == null) return { ok: false, error: 'No active tab' }

          await sendToTab(tabId, { type: 'START_RECORDING' })
          await saveSession({
            ...session,
            tabId,
            recording: true,
            picking: false,
            pickClientId: null,
          })
          return { ok: true, data: snapshot(await loadSession()) }
        }

        case 'STOP_RECORDING': {
          const session = await loadSession()
          if (session?.tabId != null && session.tabId >= 0) {
            await sendToTab(session.tabId, { type: 'STOP_RECORDING' }).catch(
              () => undefined,
            )
          }
          if (session) {
            await saveSession({
              ...session,
              recording: false,
              picking: false,
              pickClientId: null,
            })
          }
          return { ok: true, data: snapshot(await loadSession()) }
        }

        case 'START_PICK': {
          const session = await loadSession()
          if (!session) return { ok: false, error: 'Load a test case first' }
          const tabId = message.tabId ?? session.tabId ?? (await activeTabId())
          if (tabId == null) return { ok: false, error: 'No active tab' }

          await sendToTab(tabId, { type: 'START_PICK', clientId: message.clientId })
          await saveSession({
            ...session,
            tabId,
            picking: true,
            pickClientId: message.clientId,
          })
          return { ok: true, data: snapshot(await loadSession()) }
        }

        case 'STOP_PICK': {
          const session = await loadSession()
          if (session?.tabId != null && session.tabId >= 0) {
            await sendToTab(session.tabId, { type: 'STOP_PICK' }).catch(
              () => undefined,
            )
          }
          if (session) {
            await saveSession({
              ...session,
              picking: false,
              pickClientId: null,
            })
          }
          return { ok: true, data: snapshot(await loadSession()) }
        }

        case 'RECORDED_STEP': {
          const session = await loadSession()
          if (!session?.recording) return { ok: true }

          const senderTabId = sender.tab?.id
          if (senderTabId != null && session.tabId !== senderTabId) {
            // Ignore events from other tabs.
            return { ok: true }
          }

          const step: BufferedStep = {
            clientId: message.step.clientId ?? newClientId(),
            action: message.step.action,
            selectorType: message.step.selectorType,
            selector: message.step.selector,
            value: message.step.value,
            outputVariable: message.step.outputVariable,
            config: message.step.config,
            warning: message.step.warning ?? null,
            id: message.step.id,
          }

          let next = session
          if (step.action === 'click') {
            next = {
              ...session,
              suppressClickUntil: Date.now() + 800,
            }
          }

          next = appendStep(next, step)
          await saveSession(next)
          void browser.runtime
            .sendMessage({ type: 'SESSION_UPDATED' })
            .catch(() => {})
          return { ok: true, data: snapshot(next) }
        }

        case 'PICKED_ELEMENT': {
          const session = await loadSession()
          if (!session?.pickClientId) return { ok: true }

          const steps = session.steps.map((step) =>
            step.clientId === session.pickClientId
              ? {
                  ...step,
                  ...(message.action === 'hover'
                    ? { action: 'hover' as const }
                    : {}),
                  selectorType: message.selectorType,
                  selector: message.selector,
                }
              : step,
          )

          await saveSession({
            ...session,
            steps,
            dirty: true,
            picking: false,
            pickClientId: null,
          })
          void browser.runtime
            .sendMessage({ type: 'SESSION_UPDATED' })
            .catch(() => {})
          return { ok: true, data: snapshot(await loadSession()) }
        }

        case 'SAVE_STEPS': {
          const session = await loadSession()
          if (!session?.testCaseId) {
            return { ok: false, error: 'No test case loaded' }
          }

          const issues = validateBufferedSteps(session.steps)
          if (issues.length > 0) {
            return {
              ok: false,
              error: issues[0]?.message ?? 'Invalid steps',
              code: 'validation_error',
            }
          }

          const client = await getClient()
          const result = await replaceSteps(
            client,
            session.testCaseId,
            toStepInputs(session.steps),
          )

          const steps = toBufferedSteps(result.steps)
          await saveSession({
            ...session,
            steps,
            dirty: false,
            recording: false,
            picking: false,
            pickClientId: null,
          })

          if (session.tabId >= 0) {
            await sendToTab(session.tabId, { type: 'STOP_RECORDING' }).catch(
              () => undefined,
            )
          }

          return { ok: true, data: snapshot(await loadSession()) }
        }

        case 'DISCARD_STEPS': {
          const session = await loadSession()
          if (!session?.testCaseId) {
            await saveSession(null)
            return { ok: true }
          }
          const client = await getClient()
          const payload = await listSteps(client, session.testCaseId)
          await saveSession({
            ...session,
            steps: toBufferedSteps(payload.steps),
            dirty: false,
            recording: false,
            picking: false,
            pickClientId: null,
          })
          if (session.tabId >= 0) {
            await sendToTab(session.tabId, { type: 'STOP_RECORDING' }).catch(
              () => undefined,
            )
          }
          return { ok: true, data: snapshot(await loadSession()) }
        }

        case 'CONTENT_READY': {
          const tabId = sender.tab?.id
          const session = await loadSession()
          const shouldRecord =
            Boolean(session?.recording) &&
            tabId != null &&
            session?.tabId === tabId

          // Keep session.tabId in sync if the user recorded across a same-tab
          // navigation (tabId is unchanged) — already matched above.
          if (shouldRecord && tabId != null) {
            // Fire-and-forget backup in case the response is ignored.
            void sendToTab(tabId, { type: 'START_RECORDING' }).catch(
              () => undefined,
            )
          }

          return { ok: true, recording: shouldRecord }
        }

        case 'PING_CONTENT':
        case 'GET_STATE':
          return { ok: true }

        default:
          return { ok: false, error: 'Unknown message' }
      }
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.isUnauthorized) {
          await clearAuth()
        }
        return {
          ok: false,
          error: error.message,
          code: error.code,
        }
      }
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
})
