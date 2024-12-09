import { fromPackedRoomName } from '../utils/fromPacked';
import { ClockworkCostMatrix, js_bfs_multiroom_distance_map } from '../wasm/screeps_clockwork';
import { ClockworkMultiroomDistanceMap } from './multiroomDistanceMap';

const MAX_USIZE = 0xffffffff;

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
export function bfsMultiroomDistanceMap(
  start: RoomPosition[],
  {
    costMatrixCallback,
    maxTiles = MAX_USIZE,
    maxRooms = MAX_USIZE,
    maxRoomDistance = MAX_USIZE,
    maxTileDistance = MAX_USIZE
  }: {
    costMatrixCallback: (room: string) => ClockworkCostMatrix | undefined;
    maxTiles?: number;
    maxRooms?: number;
    maxRoomDistance?: number;
    maxTileDistance?: number;
  }
) {
  if ([maxTiles, maxRooms, maxRoomDistance, maxTileDistance].every(n => n === MAX_USIZE)) {
    throw new Error('At least one of maxTiles, maxRooms, maxRoomDistance, or maxTileDistance must be set');
  }

  const startPacked = new Uint32Array(start.map(pos => pos.__packedPos));
  const result = js_bfs_multiroom_distance_map(
    startPacked,
    (room: number) => costMatrixCallback(fromPackedRoomName(room)),
    maxTiles,
    maxRooms,
    maxRoomDistance,
    maxTileDistance
  );
  return new ClockworkMultiroomDistanceMap(result);
}
