import { fromPackedRoomName, packRoomName } from '../utils/fromPacked';
import { MultiroomFlowField, js_path_to_multiroom_flow_field_origin } from '../wasm/screeps_clockwork';
import { ClockworkFlowField } from './flowField';
import { ClockworkPath } from './path';

/**
 * A flow field that spans multiple rooms, storing multiple directions per tile.
 */
export class ClockworkMultiroomFlowField {
  constructor(private _flowField: MultiroomFlowField) {}

  /**
   * Get the flow field value at a given position.
   */
  get(pos: RoomPosition): number {
    return this._flowField.get(pos.__packedPos);
  }

  /**
   * Set the flow field value at a given position.
   */
  set(pos: RoomPosition, value: number): void {
    this._flowField.set(pos.__packedPos, value);
  }

  /**
   * Get the list of valid directions at a given position.
   */
  getDirections(pos: RoomPosition): DirectionConstant[] {
    return this._flowField.getDirections(pos.__packedPos);
  }

  /**
   * Set the list of valid directions at a given position.
   */
  setDirections(pos: RoomPosition, directions: DirectionConstant[]): void {
    this._flowField.setDirections(pos.__packedPos, directions);
  }

  /**
   * Add a direction to the list of valid directions at a given position.
   */
  addDirection(pos: RoomPosition, direction: DirectionConstant): void {
    this._flowField.addDirection(pos.__packedPos, direction);
  }

  /**
   * Get the list of rooms in the flow field.
   */
  getRooms(): string[] {
    const rooms = [];
    for (const packedRoomName of this._flowField.getRooms()) {
      rooms.push(fromPackedRoomName(packedRoomName));
    }
    return rooms;
  }

  /**
   * Get the flow field for a given room.
   */
  getRoom(roomName: string): ClockworkFlowField | null {
    const flowField = this._flowField.getRoom(packRoomName(roomName));
    return flowField ? new ClockworkFlowField(flowField) : null;
  }

  /**
   * Find a path from a given position to the origin of the flow field.
   */
  pathToOrigin(start: RoomPosition): ClockworkPath {
    return new ClockworkPath(js_path_to_multiroom_flow_field_origin(start.__packedPos, this._flowField));
  }

  /**
   * Free the memory allocated for this flow field.
   */
  free(): void {
    this._flowField.free();
  }
}
