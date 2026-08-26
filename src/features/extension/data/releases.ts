export type ExtensionRelease = {
  version: string
  releasedAt: string
  downloadUrl: string
  fileName: string
  notes?: string
}

/** Newest first. Add new releases at the top when publishing. */
export const extensionReleases: readonly ExtensionRelease[] = [
  {
    version: '0.1.1',
    releasedAt: '2026-08-26',
    downloadUrl:
      'https://go-work-web.storage.googleapis.com/playwigo/playwigoextension-0.1.1-chrome.zip',
    fileName: 'playwigoextension-0.1.1-chrome.zip',
    notes: 'Numbered test case steps so order is easier to follow.',
  },
  {
    version: '0.1.0',
    releasedAt: '2026-08-26',
    downloadUrl:
      'https://go-work-web.storage.googleapis.com/playwigo/playwigoextension-0.1.0-chrome.zip',
    fileName: 'playwigoextension-0.1.0-chrome.zip',
    notes: 'Initial release — record test case steps from the side panel.',
  },
] as const

export function getLatestExtensionRelease(): ExtensionRelease {
  return extensionReleases[0]
}
