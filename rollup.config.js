import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import wasm from '@rollup/plugin-wasm';
import clear from 'rollup-plugin-clear';
import copy from 'rollup-plugin-copy';
import screeps from 'rollup-plugin-screeps';

let cfg;
const dest = process.env.DEST;
const config = process.env.SCREEPS_CONFIG;
if (config) {
  console.log('Loading config from environment variable');
  cfg = JSON.parse(config);
} else if (!dest) {
  console.log('No destination specified - code will be compiled but not uploaded');
} else if ((cfg = require('./screeps.json')[dest]) == null) {
  throw new Error('Invalid upload destination');
}

export default [
  {
    input: 'src/index.ts',
    external: ['screeps_clockwork.wasm'],
    plugins: [
      clear({ targets: ['dist'] }),
      resolve({ rootDir: 'src' }),
      wasm(),
      copy({
        targets: [
          {
            src: 'wasm/screeps_clockwork_core_bg.wasm',
            dest: 'dist',
            rename: 'screeps_clockwork.wasm'
          }
        ]
      }),
      commonjs(),
      typescript({ tsconfig: './tsconfig.json' })
    ],
    output: {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true
    },
    watch: {
      include: ['src/**', 'wasm/**'],
      clearScreen: false
    }
  },
  {
    input: 'test/main.ts',
    external: ['screeps_clockwork.wasm'],
    plugins: [
      clear({ targets: ['dist_test'] }),
      resolve({ rootDir: 'test' }),
      wasm(),
      copy({
        targets: [
          {
            src: 'wasm/screeps_clockwork_core_bg.wasm',
            dest: 'dist_test',
            rename: 'screeps_clockwork.wasm'
          }
        ]
      }),
      commonjs(),
      typescript({ tsconfig: './tsconfig.test.json' }),
      screeps({ config: cfg, dryRun: cfg == null })
    ],
    output: {
      file: 'dist_test/main.js',
      format: 'cjs',
      sourcemap: true
    },
    watch: {
      include: ['src/**', 'wasm/**', 'test/**'],
      clearScreen: false
    }
  }
];
