import { MAX_USIZE } from '../utils/constants';
import { fromPackedRoomName } from '../utils/fromPacked';
import { ClockworkCostMatrix, js_astar_multiroom_distance_map } from '../wasm/screeps_clockwork';
import { fromPackedSearchResult } from './searchResult';

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
export function astarMultiroomDistanceMap(
  start: RoomPosition[],
  {
    costMatrixCallback,
    maxRooms = MAX_USIZE,
    maxOps = MAX_USIZE,
    maxPathCost = MAX_USIZE,
    anyOfDestinations,
    allOfDestinations
  }: {
    costMatrixCallback: (room: string) => ClockworkCostMatrix | undefined;
    maxRooms?: number;
    maxOps?: number;
    maxPathCost?: number;
    anyOfDestinations?: { pos: RoomPosition; range: number }[];
    allOfDestinations?: { pos: RoomPosition; range: number }[];
  }
) {
  if ([maxRooms, maxOps, maxPathCost].every(n => n === MAX_USIZE) && !anyOfDestinations && !allOfDestinations) {
    throw new Error(
      'At least one of maxRooms, maxOps, maxPathCost, anyOfDestinations, or allOfDestinations must be set'
    );
  }

  const startPacked = new Uint32Array(start.map(pos => pos.__packedPos));
  const result = js_astar_multiroom_distance_map(
    startPacked,
    (room: number) => costMatrixCallback(fromPackedRoomName(room)),
    maxRooms,
    maxOps,
    maxPathCost,
    anyOfDestinations
      ? new Uint32Array(
          anyOfDestinations.reduce((acc, { pos, range }) => {
            acc.push(pos.__packedPos, range);
            return acc;
          }, [] as number[])
        )
      : undefined,
    allOfDestinations
      ? new Uint32Array(
          allOfDestinations.reduce((acc, { pos, range }) => {
            acc.push(pos.__packedPos, range);
            return acc;
          }, [] as number[])
        )
      : undefined
  );

  return fromPackedSearchResult(result);
}
