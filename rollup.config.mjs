import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

export default [
  // ESM build
  {
    input: 'src/index.js',
    output: {
      file: 'dist/index.esm.js',
      format: 'es',
      sourcemap: true
    },
    plugins: [resolve(), commonjs()]
  },
  // CommonJS build
  {
    input: 'src/index.js',
    output: {
      file: 'dist/index.cjs',
      format: 'cjs',
      sourcemap: true,
      exports: 'named'
    },
    plugins: [resolve(), commonjs()]
  },
  // Minified ESM build
  {
    input: 'src/index.js',
    output: {
      file: 'dist/index.esm.min.js',
      format: 'es',
      sourcemap: true
    },
    plugins: [resolve(), commonjs(), terser()]
  }
];