import process from 'node:process';
import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

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
    })
  ]
});
