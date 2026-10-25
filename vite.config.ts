import process from 'node:process';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit({
      compilerOptions: {
        // Force runes mode for the project, except for libraries. Can be removed in svelte 6.
        runes: ({ filename }) =>
          filename.split(/[/\\]/).includes('node_modules') ? undefined : true
      },
      // SPA mode: every non-prerendered URL is served by this fallback page.
      // GitHub Pages serves 404.html for unknown paths; see https://svelte.dev/docs/kit/adapter-static
      adapter: adapter({ fallback: '404.html' }),
      // Served from /<repo>/ on GitHub Pages; the deploy workflow sets BASE_PATH.
      paths: {
        base: process.argv.includes('dev')
          ? ''
          : ((process.env.BASE_PATH ?? '') as '' | `/${string}`)
      }
    }),

    // Client-side only (the app is an SPA): the saved choice, then the browser's, then Portuguese.
    paraglideVitePlugin({
      project: './project.inlang',
      outdir: './src/lib/paraglide',
      emitTsDeclarations: true,
      strategy: ['localStorage', 'preferredLanguage', 'baseLocale']
    })
  ],
  test: {
    expect: { requireAssertions: true },
    // Unit tests of the pure modules, in Node. End-to-end tests are Playwright's (e2e/).
    include: ['src/**/*.test.ts'],
    environment: 'node'
  }
});
