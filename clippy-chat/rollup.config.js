import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

const production = process.env.NODE_ENV === 'production';

export default {
  input: 'src/index.js',
  output: [
    {
      file: 'dist/clippy-chat.js',
      format: 'iife',
      name: 'ClippyChatModule',
      sourcemap: true,
      extend: true,
    },
    {
      file: 'dist/clippy-chat.min.js',
      format: 'iife',
      name: 'ClippyChatModule',
      plugins: [terser()],
      sourcemap: true,
      extend: true,
    }
  ],
  plugins: [
    resolve({
      browser: true,
      // Don't bundle test dependencies
      preferBuiltins: false,
    }),
    commonjs({
      // Ignore test imports
      ignore: ['jsdom']
    }),
  ],
  // External dependencies that will be loaded separately
  external: ['jsdom'],
};
