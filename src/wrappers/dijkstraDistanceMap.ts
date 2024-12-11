import { MAX_USIZE } from '../utils/constants';
import { fromPackedRoomName } from '../utils/fromPacked';
import {
  ClockworkCostMatrix,
  js_dijkstra_distance_map,
  js_dijkstra_multiroom_distance_map
} from '../wasm/screeps_clockwork';
import { ClockworkDistanceMap } from './distanceMap';
import { ClockworkMultiroomDistanceMap } from './multiroomDistanceMap';

/**
 * Generate a [distance map](https://glitchassassin.github.io/screeps-clockwork/primitives/flowfield.html) for a set of positions
 * using Dijkstra's algorithm.
 *
 * Dijkstra's algorithm includes variable costs to account for terrain or other cost functions.
 *
 * Note that values of 0 in the cost matrix may have unexpected behavior. You probably want
 * a cost matrix with a default value of at least 1.
 *
 * Note that the `roomName` on start positions is ignored - all positions
 * are assumed to be in the same room as the cost matrix.
 *
 * @param start - The starting positions.
 * @param costMatrix - The cost matrix to use for the flow field.
 * @returns The flow field.
 */
export function dijkstraDistanceMap(start: RoomPosition[], costMatrix: ClockworkCostMatrix) {
  const startPacked = new Uint32Array(start.map(pos => pos.__packedPos));
  const result = js_dijkstra_distance_map(startPacked, costMatrix);
  return new ClockworkDistanceMap(result);
}

/**
 * Create a distance map for the given start positions, using Dijkstra's algorithm to
 * factor in terrain costs (0-255, where 255 is impassable).
 *
 * This calculates a distance map across multiple rooms, with a few configurable limits:
 * - `maxTiles`: The maximum number of tiles to explore.
 * - `maxRooms`: The maximum number of rooms to explore.
 * - `maxRoomDistance`: Don't explore rooms further (in Manhattan distance) than this.
 * - `maxTileDistance`: Don't explore tiles further (in accumulated cost) than this.
 *
 * At least one of these limits must be set.
 *
 * @param start - The starting positions.
 * @param options - The options for the distance map.
 * @returns A multi-room distance map.
 */
export function dijkstraMultiroomDistanceMap(
  start: RoomPosition[],
  {
    costMatrixCallback,
    maxTiles = MAX_USIZE,
    maxRooms = MAX_USIZE,
    maxRoomDistance = MAX_USIZE,
    maxTileDistance = MAX_USIZE,
    anyOfDestinations,
    allOfDestinations
  }: {
    costMatrixCallback: (room: string) => ClockworkCostMatrix | undefined;
    maxTiles?: number;
    maxRooms?: number;
    maxRoomDistance?: number;
    maxTileDistance?: number;
    anyOfDestinations?: RoomPosition[];
    allOfDestinations?: RoomPosition[];
  }
) {
  if (
    [maxTiles, maxRooms, maxRoomDistance, maxTileDistance].every(n => n === MAX_USIZE) &&
    !anyOfDestinations &&
    !allOfDestinations
  ) {
    throw new Error(
      'At least one of maxTiles, maxRooms, maxRoomDistance, maxTileDistance, anyOfDestinations, or allOfDestinations must be set'
    );
  }

  const startPacked = new Uint32Array(start.map(pos => pos.__packedPos));
  const result = js_dijkstra_multiroom_distance_map(
    startPacked,
    (room: number) => costMatrixCallback(fromPackedRoomName(room)),
    maxTiles,
    maxRooms,
    maxRoomDistance,
    maxTileDistance,
    anyOfDestinations ? new Uint32Array(anyOfDestinations.map(pos => pos.__packedPos)) : undefined,
    allOfDestinations ? new Uint32Array(allOfDestinations.map(pos => pos.__packedPos)) : undefined
  );
  return new ClockworkMultiroomDistanceMap(result);
}
