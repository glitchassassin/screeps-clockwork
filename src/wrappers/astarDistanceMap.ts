import { MAX_USIZE } from '../utils/constants';
import { fromPackedRoomName } from '../utils/fromPacked';
import { ClockworkCostMatrix, js_astar_multiroom_distance_map } from '../wasm/screeps_clockwork';
import { ClockworkMultiroomDistanceMap } from './multiroomDistanceMap';

/**
 * Create a distance map for the given start positions, using a breadth-first search.
 * This does not factor in terrain costs (treating anything less than 255 in the cost
 * matrix as passable), so it's faster but less useful than Dijkstra's algorithm.
 *
 * This calculates a distance map across multiple rooms, with a few configurable limits:
 * - `maxTiles`: The maximum number of tiles to explore.
 * - `maxRooms`: The maximum number of rooms to explore.
 * - `maxRoomDistance`: Don't explore rooms further (in Manhattan distance) than this.
 * - `maxTileDistance`: Don't explore tiles further (in Chebyshev distance) than this.
 *
 * At least one of these limits must be set.
 *
 * @param start - The starting positions.
 * @param options - The options for the distance map.
 * @returns A multi-room distance map.
 */
export function astarMultiroomDistanceMap(
  start: RoomPosition[],
  destinations: RoomPosition[],
  {
    costMatrixCallback,
    maxTiles = MAX_USIZE,
    maxTileDistance = MAX_USIZE
  }: {
    costMatrixCallback: (room: string) => ClockworkCostMatrix | undefined;
    maxTiles?: number;
    maxTileDistance?: number;
  }
) {
  if (!destinations?.length) {
    throw new Error('At least one destination must be set');
  }

  const startPacked = new Uint32Array(start.map(pos => pos.__packedPos));
  const result = js_astar_multiroom_distance_map(
    startPacked,
    (room: number) => costMatrixCallback(fromPackedRoomName(room)),
    maxTiles,
    maxTileDistance,
    new Uint32Array(destinations.map(pos => pos.__packedPos))
  );
  return new ClockworkMultiroomDistanceMap(result);
}
