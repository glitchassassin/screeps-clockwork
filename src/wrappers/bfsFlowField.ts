import { ClockworkCostMatrix, js_bfs_flow_field, js_bfs_mono_flow_field } from '../../wasm';

export function bfsFlowField(start: RoomPosition[], costMatrix: ClockworkCostMatrix) {
  const startPacked = new Uint32Array(start.map(pos => pos.__packedPos));
  const result = js_bfs_flow_field(startPacked, costMatrix);
  return result;
}

export function bfsMonoFlowField(start: RoomPosition[], costMatrix: ClockworkCostMatrix) {
  const startPacked = new Uint32Array(start.map(pos => pos.__packedPos));
  const result = js_bfs_mono_flow_field(startPacked, costMatrix);
  return result;
}
