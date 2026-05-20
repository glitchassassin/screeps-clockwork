import { fromPackedRoomName, packRoomName } from '../utils/fromPacked';
import {
  MultiroomMonoFlowField,
  js_path_to_multiroom_mono_flow_field_origin,
  js_path_to_multiroom_mono_flow_field_origin_with_portals
} from '../wasm/screeps_clockwork';
import { assertNotFreed, freeHandle } from './freeable';
import { ClockworkMonoFlowField } from './monoFlowField';
import { ClockworkPath } from './path';

/**
 * A flow field that spans multiple rooms, storing a single direction per tile.
 */
export class ClockworkMultiroomMonoFlowField {
  private _flowField: MultiroomMonoFlowField | undefined;

  constructor(flowField: MultiroomMonoFlowField) {
    this._flowField = flowField;
  }

  /**
   * Frees the underlying WASM multiroom flow field allocation.
   */
  free(): void {
    this._flowField = freeHandle(this._flowField);
  }

  /**
   * Get the direction at a given position.
   */
  get(pos: RoomPosition): DirectionConstant | null {
    return assertNotFreed(this._flowField, 'ClockworkMultiroomMonoFlowField').get(pos.__packedPos) ?? null;
  }

  /**
   * Set the direction at a given position.
   */
  set(pos: RoomPosition, direction: DirectionConstant | null): void {
    assertNotFreed(this._flowField, 'ClockworkMultiroomMonoFlowField').set(pos.__packedPos, direction ?? undefined);
  }

  /**
   * Get the list of rooms in the flow field.
   */
  getRooms(): string[] {
    const rooms = [];
    for (const packedRoomName of assertNotFreed(this._flowField, 'ClockworkMultiroomMonoFlowField').getRooms()) {
      rooms.push(fromPackedRoomName(packedRoomName));
    }
    return rooms;
  }

  /**
   * Get the flow field for a given room.
   */
  getRoom(roomName: string): ClockworkMonoFlowField | null {
    const flowField = assertNotFreed(this._flowField, 'ClockworkMultiroomMonoFlowField').getRoom(
      packRoomName(roomName)
    );
    return flowField ? new ClockworkMonoFlowField(flowField) : null;
  }

  /**
   * Find a path from a given position to the origin of the flow field.
   */
  pathToOrigin(start: RoomPosition): ClockworkPath {
    return new ClockworkPath(
      js_path_to_multiroom_mono_flow_field_origin(
        start.__packedPos,
        assertNotFreed(this._flowField, 'ClockworkMultiroomMonoFlowField')
      )
    );
  }

  /**
   * Find a portal-aware path from a given position to the origin of the flow field.
   */
  pathToOriginWithPortals(start: RoomPosition): ClockworkPath {
    return new ClockworkPath(
      js_path_to_multiroom_mono_flow_field_origin_with_portals(
        start.__packedPos,
        assertNotFreed(this._flowField, 'ClockworkMultiroomMonoFlowField')
      )
    );
  }
}
