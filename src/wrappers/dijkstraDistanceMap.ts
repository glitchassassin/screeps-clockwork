import { ClockworkCostMatrix, js_dijkstra_distance_map } from '../wasm/screeps_clockwork';
import { ClockworkDistanceMap } from './distanceMap';

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
