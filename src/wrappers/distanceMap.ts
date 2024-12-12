import { DistanceMap, flowField, js_path_to_distance_map_origin, monoFlowField } from '../wasm/screeps_clockwork';
import { ClockworkFlowField } from './flowField';
import { ClockworkMonoFlowField } from './monoFlowField';
import { Path } from './path';

/**
 * A distance map for a single room.
 */
export class ClockworkDistanceMap {
  constructor(private _map: DistanceMap) {}

  /**
   * Gets the distance value at a given position.
   */
  get(x: number, y: number): number {
    return this._map.get(x, y);
  }

  /**
   * Sets the distance value at a given position.
   */
  set(x: number, y: number, value: number) {
    this._map.set(x, y, value);
  }

  /**
   * Converts the distance map into a flat array of distances.
   */
  toArray(): Uint32Array {
    return this._map.toArray();
  }

  /**
   * Frees the memory allocated for this distance map.
   */
  free() {
    this._map.free();
  }

  /**
   * Path to the origin from a given position.
   */
  pathToOrigin(start: RoomPosition): Path {
    return new Path(js_path_to_distance_map_origin(start.__packedPos, this._map));
  }

  /**
   * Flow field for this distance map.
   */
  toFlowField(): ClockworkFlowField {
    return new ClockworkFlowField(flowField(this._map));
  }

  /**
   * Mono-directional flow field for this distance map.
   */
  toMonoFlowField(): ClockworkMonoFlowField {
    return new ClockworkMonoFlowField(monoFlowField(this._map));
  }
}
