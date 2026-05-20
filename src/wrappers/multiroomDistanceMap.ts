import { fromPackedRoomName, packRoomName } from '../utils/fromPacked';
import {
  DirectionOrder,
  js_path_to_multiroom_distance_map_origin,
  js_path_to_multiroom_distance_map_origin_with_portals,
  MultiroomDistanceMap,
  multiroomFlowField,
  multiroomMonoFlowField,
  multiroomPortalFlowField,
  multiroomPortalMonoFlowField
} from '../wasm/screeps_clockwork';
import { ClockworkDistanceMap } from './distanceMap';
import { ClockworkMultiroomFlowField } from './multiroomFlowField';
import { ClockworkMultiroomMonoFlowField } from './multiroomMonoFlowField';
import { ClockworkPath } from './path';
import { assertNotFreed, freeHandle } from './freeable';

export interface DirectionOrderOptions {
  directionOrder?: DirectionOrder;
}

const DEFAULT_DIRECTION_ORDER = DirectionOrder.CardinalFirst;

/**
 * A distance map that covers multiple rooms. Typically returned by a function
 * like `bfsMultiroomDistanceMap` rather than created directly.
 */
export class ClockworkMultiroomDistanceMap {
  private _map: MultiroomDistanceMap | undefined;

  constructor(map: MultiroomDistanceMap) {
    this._map = map;
  }

  /**
   * Frees the underlying WASM multiroom distance map allocation.
   */
  free(): void {
    this._map = freeHandle(this._map);
  }

  /**
   * Get the stored value for a given position.
   */
  get(pos: RoomPosition): number {
    return assertNotFreed(this._map, 'ClockworkMultiroomDistanceMap').get(pos.__packedPos);
  }

  /**
   * Set the stored value for a given position.
   */
  set(pos: RoomPosition, value: number) {
    assertNotFreed(this._map, 'ClockworkMultiroomDistanceMap').set(pos.__packedPos, value);
  }

  /**
   * Get the DistanceMap for a given room.
   */
  getRoom(room: string): ClockworkDistanceMap | undefined {
    const map = assertNotFreed(this._map, 'ClockworkMultiroomDistanceMap').get_room(packRoomName(room));
    return map ? new ClockworkDistanceMap(map) : undefined;
  }

  /**
   * List all the rooms covered by this distance map.
   */
  getRooms(): string[] {
    return [...assertNotFreed(this._map, 'ClockworkMultiroomDistanceMap').get_rooms()].map(room =>
      fromPackedRoomName(room)
    );
  }

  /**
   * Path to the origin from a given position.
   * Pass `DirectionOrder.DiagonalFirst` to prefer diagonal steps when multiple neighbors are equally close.
   */
  pathToOrigin(start: RoomPosition, options: DirectionOrderOptions = {}): ClockworkPath {
    return new ClockworkPath(
      js_path_to_multiroom_distance_map_origin(
        start.__packedPos,
        assertNotFreed(this._map, 'ClockworkMultiroomDistanceMap'),
        options.directionOrder ?? DEFAULT_DIRECTION_ORDER
      )
    );
  }

  /**
   * Portal-aware path to the origin from a given position.
   * Pass `DirectionOrder.DiagonalFirst` to prefer diagonal steps when multiple neighbors are equally close.
   */
  pathToOriginWithPortals(start: RoomPosition, options: DirectionOrderOptions = {}): ClockworkPath {
    return new ClockworkPath(
      js_path_to_multiroom_distance_map_origin_with_portals(
        start.__packedPos,
        assertNotFreed(this._map, 'ClockworkMultiroomDistanceMap'),
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
      multiroomFlowField(
        assertNotFreed(this._map, 'ClockworkMultiroomDistanceMap'),
        options.directionOrder ?? DEFAULT_DIRECTION_ORDER
      )
    );
  }

  /**
   * Portal-aware flow field for this distance map.
   * Pass `DirectionOrder.DiagonalFirst` to prefer diagonal directions when multiple neighbors are equally close.
   */
  toFlowFieldWithPortals(options: DirectionOrderOptions = {}): ClockworkMultiroomFlowField {
    return new ClockworkMultiroomFlowField(
      multiroomPortalFlowField(
        assertNotFreed(this._map, 'ClockworkMultiroomDistanceMap'),
        options.directionOrder ?? DEFAULT_DIRECTION_ORDER
      )
    );
  }

  /**
   * Mono-directional flow field for this distance map.
   * Pass `DirectionOrder.DiagonalFirst` to prefer diagonal directions when multiple neighbors are equally close.
   */
  toMonoFlowField(options: DirectionOrderOptions = {}): ClockworkMultiroomMonoFlowField {
    return new ClockworkMultiroomMonoFlowField(
      multiroomMonoFlowField(
        assertNotFreed(this._map, 'ClockworkMultiroomDistanceMap'),
        options.directionOrder ?? DEFAULT_DIRECTION_ORDER
      )
    );
  }

  /**
   * Portal-aware monodirectional flow field for this distance map.
   * Pass `DirectionOrder.DiagonalFirst` to prefer diagonal directions when multiple neighbors are equally close.
   */
  toMonoFlowFieldWithPortals(options: DirectionOrderOptions = {}): ClockworkMultiroomMonoFlowField {
    return new ClockworkMultiroomMonoFlowField(
      multiroomPortalMonoFlowField(
        assertNotFreed(this._map, 'ClockworkMultiroomDistanceMap'),
        options.directionOrder ?? DEFAULT_DIRECTION_ORDER
      )
    );
  }
}
