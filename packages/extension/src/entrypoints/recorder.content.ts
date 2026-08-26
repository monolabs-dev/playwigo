/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import type { ExtensionMessage } from '@/lib/messaging'
import {
  isSameFillTarget,
  stepFromClick,
  stepFromInput,
  stepFromKeydown,
  stepFromSelect

} from '@/recorder/events'
import type {RecordedPayload} from '@/recorder/events';
import {
  isPickerActive,
  isPlaywigoIgnoreTarget,
  startPicker,
  stopPicker,
} from '@/recorder/picker'

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',
  allFrames: false,
  main() {
    let recording = false
    let listenersAttached = false
    let fillTimer: ReturnType<typeof setTimeout> | null = null
    let pendingFill: RecordedPayload | null = null
    let lastClickAt = 0
    let lastClickHref: string | null = null

    function post(message: ExtensionMessage) {
      return browser.runtime.sendMessage(message)
    }

    function flushFill() {
      if (!pendingFill) return
      const step = pendingFill
      pendingFill = null
      void post({ type: 'RECORDED_STEP', step })
    }

    function queueFill(step: RecordedPayload) {
      if (
        pendingFill &&
        isSameFillTarget(
          { action: pendingFill.action, selector: pendingFill.selector },
          step,
        )
      ) {
        pendingFill = step
      } else {
        flushFill()
        pendingFill = step
      }
      if (fillTimer) clearTimeout(fillTimer)
      fillTimer = setTimeout(() => {
        fillTimer = null
        flushFill()
      }, 400)
    }

    function emit(step: RecordedPayload) {
      if (!recording || isPickerActive()) return
      if (step.action === 'fill') {
        queueFill(step)
        return
      }
      flushFill()
      void post({ type: 'RECORDED_STEP', step })
    }

    function onClick(event: MouseEvent) {
      if (!recording || isPickerActive()) return
      if (isPlaywigoIgnoreTarget(event.target)) return
      const target = event.target
      if (!(target instanceof Element)) return

      // Alt/⌥ + click records hover without activating the element.
      if (event.altKey) {
        event.preventDefault()
        event.stopPropagation()
        event.stopImmediatePropagation()
        const step = stepFromClick(target, { hover: true })
        if (step) emit(step)
        return
      }

      const anchor = target.closest('a[href]') as HTMLAnchorElement | null
      if (anchor?.href) {
        lastClickAt = Date.now()
        lastClickHref = anchor.href
      }

      const step = stepFromClick(target)
      if (step) emit(step)
    }

    function onInput(event: Event) {
      if (!recording || isPickerActive()) return
      if (isPlaywigoIgnoreTarget(event.target)) return
      const target = event.target
      if (!(target instanceof Element)) return
      const step = stepFromInput(target)
      if (step) emit(step)
    }

    function onChange(event: Event) {
      if (!recording || isPickerActive()) return
      if (isPlaywigoIgnoreTarget(event.target)) return
      const target = event.target
      if (!(target instanceof Element)) return

      if (target instanceof HTMLSelectElement) {
        const step = stepFromSelect(target)
        if (step) emit(step)
        return
      }

      const step = stepFromInput(target)
      if (step) emit(step)
    }

    function onKeydown(event: KeyboardEvent) {
      if (!recording || isPickerActive()) return
      if (isPlaywigoIgnoreTarget(event.target)) return
      const step = stepFromKeydown(event)
      if (step) emit(step)
    }

    function attach() {
      if (listenersAttached) return
      document.addEventListener('click', onClick, true)
      document.addEventListener('input', onInput, true)
      document.addEventListener('change', onChange, true)
      document.addEventListener('keydown', onKeydown, true)
      listenersAttached = true
    }

    function detach() {
      if (!listenersAttached) return
      document.removeEventListener('click', onClick, true)
      document.removeEventListener('input', onInput, true)
      document.removeEventListener('change', onChange, true)
      document.removeEventListener('keydown', onKeydown, true)
      listenersAttached = false
      if (fillTimer) clearTimeout(fillTimer)
      flushFill()
    }

    function startRecording() {
      recording = true
      attach()
    }

    function stopRecording() {
      recording = false
      detach()
      stopPicker()
    }

    browser.runtime.onMessage.addListener((message: ExtensionMessage) => {
      if (message.type === 'PING_CONTENT') {
        return Promise.resolve({ ok: true, recording })
      }

      if (message.type === 'START_RECORDING') {
        startRecording()
        return Promise.resolve({ ok: true })
      }

      if (message.type === 'STOP_RECORDING') {
        stopRecording()
        return Promise.resolve({ ok: true })
      }

      if (message.type === 'START_PICK') {
        startPicker({
          onPick: (picked) => {
            void post({
              type: 'PICKED_ELEMENT',
              selectorType: picked.selectorType,
              selector: picked.selector,
              ...(picked.action === 'hover' ? { action: 'hover' as const } : {}),
            })
          },
          onCancel: () => {
            void post({ type: 'STOP_PICK' })
          },
        })
        return Promise.resolve({ ok: true })
      }

      if (message.type === 'STOP_PICK') {
        stopPicker()
        return Promise.resolve({ ok: true })
      }

      return undefined
    })

    // Expose last click info for navigation suppression via storage on the window.
    ;(
      window as unknown as {
        __playwigoLastNavClick?: () => { at: number; href: string | null }
      }
    ).__playwigoLastNavClick = () => ({ at: lastClickAt, href: lastClickHref })

    // After a full page load the content script is a fresh instance with
    // recording=false. Ask the background whether this tab should keep recording.
    void post({ type: 'CONTENT_READY' }).then(
      (response: { ok?: boolean; recording?: boolean } | undefined) => {
        if (response?.recording) {
          startRecording()
        }
      },
    )
  },
})
