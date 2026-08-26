import { defineConfig } from 'wxt'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  srcDir: 'src',
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    name: 'Playwigo Recorder',
    description:
      'Record Playwright test case steps into Playwigo from the browser side panel.',
    permissions: [
      'storage',
      'sidePanel',
      'activeTab',
      'scripting',
      'tabs',
      'webNavigation',
    ],
    host_permissions: [
      'https://playwigo.monolabs.workers.dev/*',
      'http://localhost:3000/*',
      '<all_urls>',
    ],
    externally_connectable: {
      matches: [
        'https://playwigo.monolabs.workers.dev/*',
        'http://localhost:3000/*',
      ],
    },
    action: {
      default_title: 'Open Playwigo',
    },
  },
})
