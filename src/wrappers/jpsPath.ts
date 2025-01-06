import { fromPacked } from '../utils/fromPacked';
import { js_pathfinder } from '../wasm/screeps_clockwork';

/**
 * Create a distance map for the given start positions, using JPS.
 *
 * This calculates a distance map across multiple rooms, with a few configurable limits:
 * - `maxTiles`: The maximum number of tiles to explore.
 * - `maxTileDistance`: Don't explore tiles further (in Chebyshev distance) than this.
 *
 * At least one of these limits must be set.
 *
 * @param start - The starting positions.
 * @param options - The options for the distance map.
 * @returns A multi-room distance map.
 */
export function jpsPath(start: RoomPosition, destinations: RoomPosition[]) {
  if (!destinations?.length) {
    throw new Error('At least one destination must be set');
  }

  const startPacked = start.__packedPos;
  const destinationsPacked = new Uint32Array(destinations.map(pos => pos.__packedPos));
  const result = js_pathfinder(startPacked, destinationsPacked);

  const path = [];
  for (const pos of result) {
    path.push(fromPacked(pos));
  }

  return path;
}
