/// <reference types="../types.d.ts" />
import 'fastestsmallesttextencoderdecoder-encodeinto/EncoderDecoderTogether.min.js';

import {
  type InitOutput,
  clear_portals,
  ClockworkCostMatrix,
  debug_portal_index,
  DirectionOrder,
  initSync,
  set_portal_distance_cache_room_limit,
  set_portals,
  version
} from './wasm/screeps_clockwork';
import { packPortalPairs, type PortalPair } from './utils/packedArrays';
export { ClockworkCostMatrix, DirectionOrder };
export type { PortalPair };

export * from './wrappers/astarDistanceMap';
export * from './wrappers/bfsDistanceMap';
export * from './wrappers/dijkstraDistanceMap';
export * from './wrappers/flowField';
export * from './wrappers/getRange';
export * from './wrappers/getTerrainCostMatrix';
export * from './wrappers/monoFlowField';
export * from './wrappers/multiroomFlowField';
export * from './wrappers/multiroomMonoFlowField';
export * from './wrappers/path';
export type { ClockworkDistanceMap } from './wrappers/distanceMap';
export type { ClockworkMultiroomDistanceMap } from './wrappers/multiroomDistanceMap';

declare namespace WebAssembly {
  class Module {
    constructor(bytes: Uint8Array);
  }
}

let wasm_bytes: Uint8Array;
let wasm_module: WebAssembly.Module;
let wasm_instance: InitOutput;
let initialized = false;
let initializeOptionsApplied = false;
let pendingInitializeOptions: ClockworkInitializeOptions | undefined;
let configuredPortalList: readonly PortalPair[] | undefined;
let configuredPortalDistanceCacheRoomLimit: number | undefined;

export interface ClockworkInitializeOptions {
  verbose?: boolean;
  portals?: readonly PortalPair[];
  portalDistanceCacheRoomLimit?: number;
}

export interface PortalIndexDebugInfo {
  cachedDistanceMaps: number;
  maxCachedDistanceMaps: number;
  cachedPortals: number;
  portalRoomSummaries: number;
  totalSizeBytes: number;
  totalSize: string;
}

/**
 * The `initialize` function initializes the WASM module and applies global
 * setup options. Call it in your main loop before using any other
 * screeps-clockwork functions. Depending on available CPU, it may not load the
 * WASM module completely in the first tick, but it will pick back up where it
 * left off if the script times out.
 *
 * It is safe to call this function repeatedly, but setup options such as
 * portals and portal cache sizing are applied only once, after WASM
 * initialization has completed. Use `setPortals` when you intentionally need
 * to reconfigure portals later.
 *
 * @param options - Pass `true` or `{ verbose: true }` to log WASM loading;
 * provide portals and cache sizing to apply them once after WASM initialization.
 */
export function initialize(options: boolean | ClockworkInitializeOptions = false) {
  const verbose = typeof options === 'boolean' ? options : (options.verbose ?? false);
  if (typeof options !== 'boolean') {
    recordInitializeOptions(options);
  }

  // need to freshly override the fake console object each tick
  console.error = console_error;
  const start = Game.cpu.getUsed();
  if (!wasm_bytes) wasm_bytes = require('screeps_clockwork.wasm');
  if (verbose && !initialized) console.logUnsafe('[clockwork] wasm_bytes loaded');
  if (!wasm_module) wasm_module = new WebAssembly.Module(wasm_bytes);
  if (verbose && !initialized) console.logUnsafe('[clockwork] wasm_module loaded');
  if (!wasm_instance) wasm_instance = initSync({ module: wasm_module });
  if (verbose && !initialized) {
    console.logUnsafe('[clockwork] wasm_instance loaded');
    console.logUnsafe(
      `[clockwork] version ${version()} initialized with ${(Game.cpu.getUsed() - start).toFixed(2)} CPU`
    );
  }
  initialized = true;

  applyInitializeOptions();
}

function recordInitializeOptions(options: ClockworkInitializeOptions): void {
  if (options.portalDistanceCacheRoomLimit === undefined && options.portals === undefined) {
    return;
  }

  pendingInitializeOptions = {
    portals: options.portals ?? pendingInitializeOptions?.portals,
    portalDistanceCacheRoomLimit:
      options.portalDistanceCacheRoomLimit ?? pendingInitializeOptions?.portalDistanceCacheRoomLimit
  };
}

function applyInitializeOptions(): void {
  if (!initialized || initializeOptionsApplied || !pendingInitializeOptions) {
    return;
  }

  const options = pendingInitializeOptions;

  if (options.portalDistanceCacheRoomLimit !== undefined || options.portals !== undefined) {
    if (
      options.portalDistanceCacheRoomLimit !== undefined &&
      options.portalDistanceCacheRoomLimit !== configuredPortalDistanceCacheRoomLimit
    ) {
      applyPortalDistanceCacheRoomLimit(options.portalDistanceCacheRoomLimit);
    }

    if (options.portals && options.portals !== configuredPortalList) {
      setPortals(options.portals);
    }

    initializeOptionsApplied = true;
  }
}

/**
 * Configure the portal pairs used by portal-aware pathfinding functions.
 * Each pair is installed bidirectionally.
 */
export function setPortals(portals: readonly PortalPair[]): void {
  set_portals(packPortalPairs(portals));
  configuredPortalList = portals;
}

function applyPortalDistanceCacheRoomLimit(roomLimit: number): void {
  if (!Number.isFinite(roomLimit) || roomLimit < 0 || Math.floor(roomLimit) !== roomLimit) {
    throw new Error('Portal distance cache room limit must be a non-negative integer');
  }

  set_portal_distance_cache_room_limit(roomLimit);
  configuredPortalDistanceCacheRoomLimit = roomLimit;
}

/**
 * Remove all configured portal pairs while preserving the initialize-time cache limit.
 */
export function clearPortals(): void {
  clear_portals();
  configuredPortalList = undefined;
}

/**
 * Return debug counters for the configured portal index and its nearest-portal cache.
 * `totalSize` is an approximate in-memory size formatted for logs; `totalSizeBytes`
 * preserves the raw byte estimate.
 */
export function debugPortalIndex(): PortalIndexDebugInfo {
  const info = debug_portal_index() as Omit<PortalIndexDebugInfo, 'totalSize'>;
  return {
    ...info,
    totalSize: formatBytes(info.totalSizeBytes)
  };
}

function formatBytes(bytes: number): string {
  const units = ['B', 'KiB', 'MiB', 'GiB'];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  if (unitIndex === 0) {
    return `${bytes} B`;
  }

  return `${value.toFixed(2)} ${units[unitIndex]}`;
}

// This provides the function `console.error` that wasm_bindgen sometimes expects to exist,
// especially with type checks in debug mode. An alternative is to have this be `function () {}`
// and let the exception handler log the thrown JS exceptions, but there is some additional
// information that wasm_bindgen only passes here.
//
// There is nothing special about this function and it may also be used by any JS/Rust code as a convenience.
function console_error(...args: unknown[]) {
  const processedArgs = args
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
  console.logUnsafe('ERROR:', processedArgs);
}
