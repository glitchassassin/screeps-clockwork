import { MAX_USIZE } from '../utils/constants';
import { fromPackedRoomName } from '../utils/fromPacked';
import { ClockworkCostMatrix, js_bfs_distance_map, js_bfs_multiroom_distance_map } from '../wasm/screeps_clockwork';
import { ClockworkDistanceMap } from './distanceMap';
import { ClockworkMultiroomDistanceMap } from './multiroomDistanceMap';

/**
 * Generate a [distance map](https://glitchassassin.github.io/screeps-clockwork/primitives/flowfield.html) for a set of positions
 * using a breadth-first search algorithm.
 *
 * The BFS algorithm doesn't include variable costs, and only considers
 * values of 255 (impassible) in the provided cost matrix. Any other
 * values are ignored.
 *
 * This might be useful for creeps with only MOVE parts and/or empty
 * CARRY parts, which don't generate fatigue.
 *
 * Note that the `roomName` on start positions is ignored - all positions
 * are assumed to be in the same room as the cost matrix.
 *
 * @param start - The starting positions.
 * @param costMatrix - The cost matrix to use for the flow field.
 * @returns The flow field.
 */
export function bfsDistanceMap(start: RoomPosition[], costMatrix: ClockworkCostMatrix) {
  const startPacked = new Uint32Array(start.map(pos => pos.__packedPos));
  const result = js_bfs_distance_map(startPacked, costMatrix);
  return new ClockworkDistanceMap(result);
}

/**
 * Create a distance map for the given start positions, using a breadth-first search.
 * This does not factor in terrain costs (treating anything less than 255 in the cost
 * matrix as passable), so it's faster but less useful than Dijkstra's algorithm.
 *
 * This calculates a distance map across multiple rooms, with a few configurable limits:
 * - `maxOps`: The maximum number of pathfinding operations to perform.
 * - `maxRooms`: The maximum number of rooms to explore.
 * - `maxPathCost`: Don't explore tiles with a greater path cost than this.
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
    maxOps = MAX_USIZE,
    maxRooms = MAX_USIZE,
    maxPathCost = MAX_USIZE,
    anyOfDestinations,
    allOfDestinations
  }: {
    costMatrixCallback: (room: string) => ClockworkCostMatrix | undefined;
    maxOps?: number;
    maxRooms?: number;
    maxPathCost?: number;
    anyOfDestinations?: RoomPosition[];
    allOfDestinations?: RoomPosition[];
  }
) {
  if ([maxOps, maxRooms, maxPathCost].every(n => n === MAX_USIZE) && !anyOfDestinations && !allOfDestinations) {
    throw new Error(
      'At least one of maxOps, maxRooms, maxRoomDistance, maxPathCost, anyOfDestinations, or allOfDestinations must be set'
    );
  }

  const startPacked = new Uint32Array(start.map(pos => pos.__packedPos));
  const result = js_bfs_multiroom_distance_map(
    startPacked,
    (room: number) => costMatrixCallback(fromPackedRoomName(room)),
    maxOps,
    maxRooms,
    maxPathCost,
    anyOfDestinations ? new Uint32Array(anyOfDestinations.map(pos => pos.__packedPos)) : undefined,
    allOfDestinations ? new Uint32Array(allOfDestinations.map(pos => pos.__packedPos)) : undefined
  );
  return new ClockworkMultiroomDistanceMap(result);
}
