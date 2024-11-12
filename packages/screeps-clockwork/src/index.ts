import 'fastestsmallesttextencoderdecoder-encodeinto/EncoderDecoderTogether.min.js';

import * as clockwork from '../wasm';
export { clockwork };

declare namespace WebAssembly {
  class Module {
    constructor(bytes: Uint8Array);
  }
}

let wasm_bytes: Uint8Array;
let wasm_module: WebAssembly.Module;
let wasm_instance: clockwork.InitOutput;
export function initialize() {
  if (!wasm_bytes) wasm_bytes = require('screeps_clockwork.wasm');
  if (!wasm_module) wasm_module = new WebAssembly.Module(wasm_bytes);
  if (!wasm_instance) wasm_instance = clockwork.initSync({ module: wasm_module });
}
