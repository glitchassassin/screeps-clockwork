import 'fastestsmallesttextencoderdecoder-encodeinto/EncoderDecoderTogether.min.js';

import {
  type InitOutput,
  ClockworkCostMatrix,
  DistanceMap,
  FlowField,
  MonoFlowField,
  initSync,
  version
} from './wasm/screeps_clockwork';
export { ClockworkCostMatrix, DistanceMap, FlowField, MonoFlowField };

export * from './wrappers/bfsDistanceMap';
export * from './wrappers/bfsFlowField';
export * from './wrappers/bfsMultiroomDistanceMap';
export * from './wrappers/dijkstraDistanceMap';
export * from './wrappers/dijkstraFlowField';
export * from './wrappers/getRange';
export * from './wrappers/path';
export * from './wrappers/pathtoDistanceMapOrigin';
export * from './wrappers/pathtoFlowFieldOrigin';
export * from './wrappers/pathtoMonoFlowFieldOrigin';

declare namespace WebAssembly {
  class Module {
    constructor(bytes: Uint8Array);
  }
}

let wasm_bytes: Uint8Array;
let wasm_module: WebAssembly.Module;
let wasm_instance: InitOutput;
let initialized = false;
/**
 * The `initialize` function should be called in your main loop before
 * using any other screeps-clockwork functions. Depending on available
 * CPU, it may not load the WASM module completely in the first tick,
 * but it will pick back up where it left off if the script times out.
 *
 * @param verbose - If true, will log the state of the WASM module as it loads.
 */
export function initialize(verbose = false) {
  // need to freshly override the fake console object each tick
  console.error = console_error;
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

// This provides the function `console.error` that wasm_bindgen sometimes expects to exist,
// especially with type checks in debug mode. An alternative is to have this be `function () {}`
// and let the exception handler log the thrown JS exceptions, but there is some additional
// information that wasm_bindgen only passes here.
//
// There is nothing special about this function and it may also be used by any JS/Rust code as a convenience.
function console_error() {
  const processedArgs = Array.from(arguments)
    .map(arg => {
      if (arg instanceof Error) {
        // On this version of Node, the `stack` property of errors contains
        // the message as well.
        return arg.stack;
      } else {
        return arg;
      }
    })
    .join(' ');
  console.log('ERROR:', processedArgs);
}
