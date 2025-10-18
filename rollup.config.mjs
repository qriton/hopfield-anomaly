import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

export default [
  // CommonJS (for Node.js)
  {
    input: 'src/index.js',
    output: {
      file: 'dist/index.js',
      format: 'cjs',
      exports: 'named',
      sourcemap: true
    },
    plugins: [resolve(), commonjs(), terser()],
    external: ['events']
  },
  // ESM (for modern bundlers)
  {
    input: 'src/index.js',
    output: {
      file: 'dist/index.esm.js',
      format: 'es',
      sourcemap: true
    },
    plugins: [resolve(), commonjs(), terser()],
    external: ['events']
  }
];