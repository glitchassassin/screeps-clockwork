import { ClockworkCostMatrix, js_bfs_distance_map } from '../wasm/screeps_clockwork';
import { ClockworkDistanceMap } from './distanceMap';

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
