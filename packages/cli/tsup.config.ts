import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  clean: true,
  // Required so npm/npx can execute the bin without a Node wrapper failing as shell
  banner: {
    js: '#!/usr/bin/env node',
  },
})
