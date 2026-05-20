import { fromPackedRoomName, packRoomName } from '../utils/fromPacked';
import {
  MultiroomFlowField,
  js_path_to_multiroom_flow_field_origin,
  js_path_to_multiroom_flow_field_origin_with_portals
} from '../wasm/screeps_clockwork';
import { ClockworkFlowField } from './flowField';
import { assertNotFreed, freeHandle } from './freeable';
import { ClockworkPath } from './path';

/**
 * A flow field that spans multiple rooms, storing multiple directions per tile.
 */
export class ClockworkMultiroomFlowField {
  private _flowField: MultiroomFlowField | undefined;

  constructor(flowField: MultiroomFlowField) {
    this._flowField = flowField;
  }

  /**
   * Frees the underlying WASM multiroom flow field allocation.
   */
  free(): void {
    this._flowField = freeHandle(this._flowField);
  }

  /**
   * Get the flow field value at a given position.
   */
  get(pos: RoomPosition): number {
    return assertNotFreed(this._flowField, 'ClockworkMultiroomFlowField').get(pos.__packedPos);
  }

  /**
   * Set the flow field value at a given position.
   */
  set(pos: RoomPosition, value: number): void {
    assertNotFreed(this._flowField, 'ClockworkMultiroomFlowField').set(pos.__packedPos, value);
  }

  /**
   * Get the list of valid directions at a given position.
   */
  getDirections(pos: RoomPosition): DirectionConstant[] {
    return assertNotFreed(this._flowField, 'ClockworkMultiroomFlowField').getDirections(pos.__packedPos);
  }

  /**
   * Set the list of valid directions at a given position.
   */
  setDirections(pos: RoomPosition, directions: DirectionConstant[]): void {
    assertNotFreed(this._flowField, 'ClockworkMultiroomFlowField').setDirections(pos.__packedPos, directions);
  }

  /**
   * Add a direction to the list of valid directions at a given position.
   */
  addDirection(pos: RoomPosition, direction: DirectionConstant): void {
    assertNotFreed(this._flowField, 'ClockworkMultiroomFlowField').addDirection(pos.__packedPos, direction);
  }

  /**
   * Get the list of rooms in the flow field.
   */
  getRooms(): string[] {
    const rooms = [];
    for (const packedRoomName of assertNotFreed(this._flowField, 'ClockworkMultiroomFlowField').getRooms()) {
      rooms.push(fromPackedRoomName(packedRoomName));
    }
    return rooms;
  }

  /**
   * Get the flow field for a given room.
   */
  getRoom(roomName: string): ClockworkFlowField | null {
    const flowField = assertNotFreed(this._flowField, 'ClockworkMultiroomFlowField').getRoom(packRoomName(roomName));
    return flowField ? new ClockworkFlowField(flowField) : null;
  }

  /**
   * Find a path from a given position to the origin of the flow field.
   */
  pathToOrigin(start: RoomPosition): ClockworkPath {
    return new ClockworkPath(
      js_path_to_multiroom_flow_field_origin(
        start.__packedPos,
        assertNotFreed(this._flowField, 'ClockworkMultiroomFlowField')
      )
    );
  }

  /**
   * Find a portal-aware path from a given position to the origin of the flow field.
   */
  pathToOriginWithPortals(start: RoomPosition): ClockworkPath {
    return new ClockworkPath(
      js_path_to_multiroom_flow_field_origin_with_portals(
        start.__packedPos,
        assertNotFreed(this._flowField, 'ClockworkMultiroomFlowField')
      )
    );
  }
}
