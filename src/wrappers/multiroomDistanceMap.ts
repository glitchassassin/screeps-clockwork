import { fromPackedRoomName, packRoomName } from '../utils/fromPacked';
import {
  DistanceMap,
  DirectionOrder,
  js_path_to_multiroom_distance_map_origin,
  MultiroomDistanceMap,
  multiroomFlowField,
  multiroomMonoFlowField
} from '../wasm/screeps_clockwork';
import { ClockworkMultiroomFlowField } from './multiroomFlowField';
import { ClockworkMultiroomMonoFlowField } from './multiroomMonoFlowField';
import { ClockworkPath } from './path';

export interface DirectionOrderOptions {
  directionOrder?: DirectionOrder;
}

const DEFAULT_DIRECTION_ORDER = DirectionOrder.CardinalFirst;

/**
 * A distance map that covers multiple rooms. Typically returned by a function
 * like `bfsMultiroomDistanceMap` rather than created directly.
 */
export class ClockworkMultiroomDistanceMap {
  constructor(private _map: MultiroomDistanceMap) {}

  /**
   * Get the stored value for a given position.
   */
  get(pos: RoomPosition): number {
    return this._map.get(pos.__packedPos);
  }

  /**
   * Set the stored value for a given position.
   */
  set(pos: RoomPosition, value: number) {
    this._map.set(pos.__packedPos, value);
  }

  /**
   * Get the DistanceMap for a given room.
   */
  getRoom(room: string): DistanceMap | undefined {
    return this._map.get_room(packRoomName(room));
  }

  /**
   * List all the rooms covered by this distance map.
   */
  getRooms(): string[] {
    return [...this._map.get_rooms()].map(room => fromPackedRoomName(room));
  }

  /**
   * Free the memory allocated for this distance map.
   */
  free() {
    this._map.free();
  }

  /**
   * Path to the origin from a given position.
   * Pass `DirectionOrder.DiagonalFirst` to prefer diagonal steps when multiple neighbors are equally close.
   */
  pathToOrigin(start: RoomPosition, options: DirectionOrderOptions = {}): ClockworkPath {
    return new ClockworkPath(
      js_path_to_multiroom_distance_map_origin(
        start.__packedPos,
        this._map,
        options.directionOrder ?? DEFAULT_DIRECTION_ORDER
      )
    );
  }

  /**
   * Flow field for this distance map.
   * Pass `DirectionOrder.DiagonalFirst` to prefer diagonal directions when multiple neighbors are equally close.
   */
  toFlowField(options: DirectionOrderOptions = {}): ClockworkMultiroomFlowField {
    return new ClockworkMultiroomFlowField(
      multiroomFlowField(this._map, options.directionOrder ?? DEFAULT_DIRECTION_ORDER)
    );
  }

  /**
   * Mono-directional flow field for this distance map.
   * Pass `DirectionOrder.DiagonalFirst` to prefer diagonal directions when multiple neighbors are equally close.
   */
  toMonoFlowField(options: DirectionOrderOptions = {}): ClockworkMultiroomMonoFlowField {
    return new ClockworkMultiroomMonoFlowField(
      multiroomMonoFlowField(this._map, options.directionOrder ?? DEFAULT_DIRECTION_ORDER)
    );
  }
}
