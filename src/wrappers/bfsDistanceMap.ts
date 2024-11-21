import { ClockworkCostMatrix, js_bfs_distance_map } from '../../wasm';

export function bfsDistanceMap(start: RoomPosition[], costMatrix: ClockworkCostMatrix) {
  const startPacked = new Uint32Array(start.map(pos => pos.__packedPos));
  const result = js_bfs_distance_map(startPacked, costMatrix);
  return result;
}
