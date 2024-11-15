import 'fastestsmallesttextencoderdecoder-encodeinto/EncoderDecoderTogether.min.js';

import * as clockwork from '../wasm';

export function getRange(pos1: RoomPosition, pos2: RoomPosition) {
  return clockwork.get_range(pos1.__packedPos, pos2.__packedPos);
}

export function bfsDistanceMap(start: RoomPosition[], costMatrix: CostMatrix) {
  return clockwork.bfs_distance_map(new Uint32Array(start.map(pos => pos.__packedPos)), costMatrix);
}

declare namespace WebAssembly {
  class Module {
    constructor(bytes: Uint8Array);
  }
}

let wasm_bytes: Uint8Array;
let wasm_module: WebAssembly.Module;
let wasm_instance: clockwork.InitOutput;
let initialized = false;
export function initialize(verbose = false) {
  if (!wasm_bytes) wasm_bytes = require('screeps_clockwork.wasm');
  if (verbose && !initialized) console.log('[clockwork] wasm_bytes loaded');
  if (!wasm_module) wasm_module = new WebAssembly.Module(wasm_bytes);
  if (verbose && !initialized) console.log('[clockwork] wasm_module loaded');
  if (!wasm_instance) wasm_instance = clockwork.initSync({ module: wasm_module });
  if (verbose && !initialized) {
    console.log('[clockwork] wasm_instance loaded');
    console.log(`[clockwork] version ${clockwork.version()} initialized`);
  }
  initialized = true;
}
