import { fromPackedRoomName } from '../utils/fromPacked';
import { ClockworkCostMatrix, js_bfs_multiroom_distance_map } from '../wasm/screeps_clockwork';
import { ClockworkMultiroomDistanceMap } from './multiroomDistanceMap';

export function bfsMultiroomDistanceMap(
  start: RoomPosition[],
  {
    costMatrixCallback,
    maxTiles = 1500,
    maxRooms = 1
  }: {
    costMatrixCallback: (room: string) => ClockworkCostMatrix | undefined;
    maxTiles?: number;
    maxRooms?: number;
  }
) {
  const startPacked = new Uint32Array(start.map(pos => pos.__packedPos));
  const result = js_bfs_multiroom_distance_map(
    startPacked,
    (room: number) => costMatrixCallback(fromPackedRoomName(room)),
    maxTiles,
    maxRooms
  );
  return new ClockworkMultiroomDistanceMap(result);
}
