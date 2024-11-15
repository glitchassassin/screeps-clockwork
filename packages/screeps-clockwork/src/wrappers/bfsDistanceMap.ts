import { ClockworkCostMatrix, js_bfs_distance_map } from '../../wasm/screeps_clockwork_core';

export function bfsDistanceMap(start: RoomPosition[], costMatrix: ClockworkCostMatrix) {
  const startPacked = start.map(pos => pos.__packedPos);
  const result = js_bfs_distance_map(startPacked, costMatrix);
  return result;
}
