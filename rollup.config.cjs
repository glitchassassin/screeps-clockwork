const commonjs = require('@rollup/plugin-commonjs');
const resolve = require('@rollup/plugin-node-resolve');
const typescript = require('@rollup/plugin-typescript');
const wasm = require('@rollup/plugin-wasm');
const clear = require('rollup-plugin-clear');
const copy = require('rollup-plugin-copy');
const screeps = require('rollup-plugin-screeps');

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

module.exports = [
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
            src: 'src/wasm/screeps_clockwork_bg.wasm',
            dest: 'dist',
            rename: 'screeps_clockwork.wasm'
          },
          {
            src: 'src/wasm/screeps_clockwork.d.ts',
            dest: 'dist/src/wasm'
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
      include: ['src/**', 'src/wasm/**'],
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
            src: 'src/wasm/screeps_clockwork_bg.wasm',
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
      include: ['src/**', 'src/wasm/**', 'test/**'],
      clearScreen: false
    }
  }
];
