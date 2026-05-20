import { MAX_USIZE } from '../utils/constants';
import { fromPackedRoomNameCached } from '../utils/fromPacked';
import { packDestinations, packPositions } from '../utils/packedArrays';
import {
  ClockworkCostMatrix,
  js_bfs_multiroom_distance_map,
  js_bfs_portal_multiroom_distance_map
} from '../wasm/screeps_clockwork';
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
    anyOfDestinations?: { pos: RoomPosition; range: number }[];
    allOfDestinations?: { pos: RoomPosition; range: number }[];
  }
) {
  if ([maxOps, maxRooms, maxPathCost].every(n => n === MAX_USIZE) && !anyOfDestinations && !allOfDestinations) {
    throw new Error(
      'At least one of maxOps, maxRooms, maxPathCost, anyOfDestinations, or allOfDestinations must be set'
    );
  }

  const startPacked = packPositions(start);
  const result = js_bfs_multiroom_distance_map(
    startPacked,
    (room: number) => costMatrixCallback(fromPackedRoomNameCached(room)),
    maxOps,
    maxRooms,
    maxPathCost,
    packDestinations(anyOfDestinations),
    packDestinations(allOfDestinations)
  );

  return fromPackedSearchResult(result);
}

/**
 * Create a portal-aware distance map for the given start positions, using a breadth-first search.
 * This does not factor in terrain costs (treating anything less than 255 in the cost
 * matrix as passable), so it's faster but less useful than Dijkstra's algorithm.
 *
 * Portals configured with `initialize({ portals })` or `setPortals` are treated
 * like exits: stepping onto a portal entrance lands on its paired exit.
 *
 * This calculates a distance map across multiple rooms, with a few configurable limits:
 * - `maxOps`: The maximum number of pathfinding operations to perform.
 * - `maxRooms`: The maximum number of rooms to explore.
 * - `maxPathCost`: Don't explore tiles with a greater path cost than this.
 *
 * At least one of these limits or destination lists must be set.
 *
 * @param start - The starting positions.
 * @param options - The options for the distance map.
 * @returns A multi-room distance map.
 */
export function bfsPortalMultiroomDistanceMap(
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
    anyOfDestinations?: { pos: RoomPosition; range: number }[];
    allOfDestinations?: { pos: RoomPosition; range: number }[];
  }
) {
  if ([maxOps, maxRooms, maxPathCost].every(n => n === MAX_USIZE) && !anyOfDestinations && !allOfDestinations) {
    throw new Error(
      'At least one of maxOps, maxRooms, maxPathCost, anyOfDestinations, or allOfDestinations must be set'
    );
  }

  const startPacked = packPositions(start);
  const result = js_bfs_portal_multiroom_distance_map(
    startPacked,
    (room: number) => costMatrixCallback(fromPackedRoomNameCached(room)),
    maxOps,
    maxRooms,
    maxPathCost,
    packDestinations(anyOfDestinations),
    packDestinations(allOfDestinations)
  );

  return fromPackedSearchResult(result);
}
