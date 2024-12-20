import { MAX_USIZE } from '../utils/constants';
import { fromPackedRoomName } from '../utils/fromPacked';
import { ClockworkCostMatrix, js_jps_path } from '../wasm/screeps_clockwork';
import { ClockworkPath } from './path';

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
export function jpsPath(
  start: RoomPosition[],
  destinations: RoomPosition[],
  {
    costMatrixCallback,
    maxOps = MAX_USIZE
  }: {
    costMatrixCallback: (room: string) => ClockworkCostMatrix | undefined;
    maxOps?: number;
  }
) {
  if (!destinations?.length) {
    throw new Error('At least one destination must be set');
  }

  const startPacked = new Uint32Array(start.map(pos => pos.__packedPos));
  const result = js_jps_path(
    startPacked,
    (room: number) => costMatrixCallback(fromPackedRoomName(room)),
    maxOps,
    new Uint32Array(destinations.map(pos => pos.__packedPos))
  );
  return new ClockworkPath(result);
}
