import { DistanceMap, js_path_to_distance_map_origin } from '../wasm/screeps_clockwork';
import { Path } from './path';
export function pathToDistanceMapOrigin(start: RoomPosition, distanceMap: DistanceMap): Path {
  return new Path(js_path_to_distance_map_origin(start.__packedPos, distanceMap));
}
