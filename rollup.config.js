import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import dts from 'rollup-plugin-dts';
import postcss from 'rollup-plugin-postcss';
import excludeDependenciesFromBundle from 'rollup-plugin-exclude-dependencies-from-bundle';
import typescriptRollupPlugin from 'rollup-plugin-ts';

const packageJson = require('./package.json');

export default [
  {
    input: 'src/index.ts',
    watch: {
      include: './src/**',
      clearScreen: false,
    },
    output: [
      {
        file: packageJson.main,
        format: 'cjs',
        sourcemap: true,
      },
      {
        file: packageJson.module,
        format: 'esm',
        sourcemap: true,
      },
    ],
    plugins: [
      excludeDependenciesFromBundle(),
      resolve(),
      commonjs(),
      typescriptRollupPlugin({ tsconfig: './tsconfig.json' }),
      postcss({
        extract: true,
      }),
    ],
  },
  {
    input: 'dist/esm/index.d.ts',
    output: [{ file: 'dist/index.d.ts', format: 'esm' }],
    plugins: [dts()],
    external: [/\.(css|less|sass|scss)$/],
  },
];
