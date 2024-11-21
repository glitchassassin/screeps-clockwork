import 'fastestsmallesttextencoderdecoder-encodeinto/EncoderDecoderTogether.min.js';

import {
  type InitOutput,
  ClockworkCostMatrix,
  DistanceMap,
  FlowField,
  MonoFlowField,
  initSync,
  version
} from '../wasm';
export { ClockworkCostMatrix, DistanceMap, FlowField, MonoFlowField };

export * from './wrappers/bfsDistanceMap';
export * from './wrappers/bfsFlowField';
export * from './wrappers/getRange';

declare namespace WebAssembly {
  class Module {
    constructor(bytes: Uint8Array);
  }
}

let wasm_bytes: Uint8Array;
let wasm_module: WebAssembly.Module;
let wasm_instance: InitOutput;
let initialized = false;
export function initialize(verbose = false) {
  if (!wasm_bytes) wasm_bytes = require('screeps_clockwork.wasm');
  if (verbose && !initialized) console.log('[clockwork] wasm_bytes loaded');
  if (!wasm_module) wasm_module = new WebAssembly.Module(wasm_bytes);
  if (verbose && !initialized) console.log('[clockwork] wasm_module loaded');
  if (!wasm_instance) wasm_instance = initSync({ module: wasm_module });
  if (verbose && !initialized) {
    console.log('[clockwork] wasm_instance loaded');
    console.log(`[clockwork] version ${version()} initialized`);
  }
  initialized = true;
}
