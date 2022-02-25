import typescript from 'rollup-plugin-typescript2'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import { terser } from "rollup-plugin-terser"

export default [
  // browser umd
  {
    input: './src/index.ts',
    output: {
      file: './dist/ahttp.global.js',
      format: 'umd',
      name: 'ahttp',
      exports: 'named',
      sourcemap: true,
    },
    treeshake: 'smallest',
    plugins: [typescript({ useTsconfigDeclarationDir: true }), nodeResolve({ dedupe: ['libsugar'] }), commonjs()],
  },
  // browser umd min
  {
    input: './src/index.ts',
    output: {
      file: './dist/ahttp.global.prod.js',
      format: 'umd',
      name: 'ahttp',
      exports: 'named',
      sourcemap: true,
    },
    treeshake: 'smallest',
    plugins: [typescript({ useTsconfigDeclarationDir: true }), nodeResolve({ dedupe: ['libsugar'] }), commonjs(), terser()],
  },
  // esm
  {
    input: './src/index.ts',
    output: {
      file: './dist/ahttp.esm-bundler.mjs',
      format: 'esm',
      name: 'ahttp',
      exports: 'named',
      sourcemap: true,
    },
    treeshake: 'smallest',
    plugins: [typescript({ useTsconfigDeclarationDir: true }), nodeResolve({ dedupe: ['libsugar'] }), commonjs()],
  },
  // esm min
  {
    input: './src/index.ts',
    output: {
      file: './dist/ahttp.esm-bundler.prod.mjs',
      format: 'esm',
      name: 'ahttp',
      exports: 'named',
      sourcemap: true,
    },
    treeshake: 'smallest',
    plugins: [typescript({ useTsconfigDeclarationDir: true }), nodeResolve({ dedupe: ['libsugar'] }), commonjs(), terser()],
  },
]
