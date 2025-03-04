import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: true,
  format: ['cjs', 'esm'],
  esbuildOptions(options) {
    options.external = [
        './src/vendor/foliate-js/vendor/*',
        './src/vendor/foliate-js/pdf.js',
        './src/vendor/foliate-js/mobi.js',
        './src/vendor/foliate-js/comic-book.js',
        './src/vendor/foliate-js/fb2.js',
    ]
  },
})