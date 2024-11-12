import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import wasm from '@rollup/plugin-wasm';
import clear from 'rollup-plugin-clear';
import copy from 'rollup-plugin-copy';

export default [
	{
		input: 'src/index.ts',
		external: ['screeps_clockwork.wasm'],
		plugins: [
			clear({ targets: ['dist'] }),
			resolve({ rootDir: 'src' }),
			wasm(),
			copy({
			  targets: [{
				src: 'wasm/screeps_clockwork_core_bg.wasm',
				dest: 'dist',
				rename: 'screeps_clockwork.wasm',
			  }]
			}),
			commonjs(),
			typescript(),
		],
		output: {
			file: 'dist/index.js',
			format: 'cjs',
			sourcemap: true
		}
	},
];