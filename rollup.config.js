import resolve from '@rollup/plugin-node-resolve'
import dts from 'rollup-plugin-dts'
import excludeDependenciesFromBundle from 'rollup-plugin-exclude-dependencies-from-bundle'
import typescript from '@rollup/plugin-typescript'

const packageJson = require('./package.json')

export default [
  {
    input: 'src/index.ts',
    watch: {
      include: './src/**',
      clearScreen: false
    },
    output: [
      {
        file: packageJson.module,
        format: 'esm',
        sourcemap: true
      }
    ],
    plugins: [
      excludeDependenciesFromBundle(),
      resolve(),
      typescript({ tsconfig: './tsconfig.json' })
    ]
  },
  {
    input: 'dist/esm/types/index.d.ts',
    output: [{ file: 'dist/index.d.ts', format: 'esm' }],
    plugins: [dts()]
  }
]
