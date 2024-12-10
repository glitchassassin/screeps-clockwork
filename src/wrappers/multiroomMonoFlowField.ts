import { fromPackedRoomName, packRoomName } from '../utils/fromPacked';
import { MultiroomMonoFlowField, js_path_to_multiroom_mono_flow_field_origin } from '../wasm/screeps_clockwork';
import { ClockworkMonoFlowField } from './monoFlowField';
import { Path } from './path';

/**
 * A flow field that spans multiple rooms, storing a single direction per tile.
 */
export class ClockworkMultiroomMonoFlowField {
  constructor(private _flowField: MultiroomMonoFlowField) {}

  /**
   * Get the direction at a given position.
   */
  get(pos: RoomPosition): DirectionConstant | null {
    return this._flowField.get(pos.__packedPos) ?? null;
  }

  /**
   * Set the direction at a given position.
   */
  set(pos: RoomPosition, direction: DirectionConstant | null): void {
    this._flowField.set(pos.__packedPos, direction ?? undefined);
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
  getRoom(roomName: string): ClockworkMonoFlowField | null {
    const flowField = this._flowField.getRoom(packRoomName(roomName));
    return flowField ? new ClockworkMonoFlowField(flowField) : null;
  }

  /**
   * Find a path from a given position to the origin of the flow field.
   */
  pathToOrigin(start: RoomPosition): Path {
    return new Path(js_path_to_multiroom_mono_flow_field_origin(start.__packedPos, this._flowField));
  }

  /**
   * Free the memory allocated for this flow field.
   */
  free(): void {
    this._flowField.free();
  }
}
