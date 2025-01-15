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
  {
    costMatrixCallback,
    maxRooms = MAX_USIZE,
    maxTiles = MAX_USIZE,
    maxTileDistance = MAX_USIZE,
    anyOfDestinations,
    allOfDestinations
  }: {
    costMatrixCallback: (room: string) => ClockworkCostMatrix | undefined;
    maxRooms?: number;
    maxTiles?: number;
    maxTileDistance?: number;
    anyOfDestinations?: RoomPosition[];
    allOfDestinations?: RoomPosition[];
  }
) {
  if ([maxRooms, maxTiles, maxTileDistance].every(n => n === MAX_USIZE) && !anyOfDestinations && !allOfDestinations) {
    throw new Error(
      'At least one of maxRooms, maxTiles, maxTileDistance, anyOfDestinations, or allOfDestinations must be set'
    );
  }

  const startPacked = new Uint32Array(start.map(pos => pos.__packedPos));
  const result = js_astar_multiroom_distance_map(
    startPacked,
    (room: number) => costMatrixCallback(fromPackedRoomName(room)),
    maxRooms,
    maxTiles,
    maxTileDistance,
    anyOfDestinations ? new Uint32Array(anyOfDestinations.map(pos => pos.__packedPos)) : undefined,
    allOfDestinations ? new Uint32Array(allOfDestinations.map(pos => pos.__packedPos)) : undefined
  );
  return new ClockworkMultiroomDistanceMap(result);
}
