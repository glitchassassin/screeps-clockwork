import { fromPackedRoomName, packRoomName } from '../utils/fromPacked';
import { DistanceMap, MultiroomDistanceMap } from '../wasm/screeps_clockwork';

/**
 * A distance map that covers multiple rooms. Typically returned by a function
 * like `bfsMultiroomDistanceMap` rather than created directly.
 */
export class ClockworkMultiroomDistanceMap {
  constructor(private map: MultiroomDistanceMap) {}

  /**
   * Get the stored value for a given position.
   */
  get(pos: RoomPosition): number {
    return this.map.get(pos.__packedPos);
  }

  /**
   * Set the stored value for a given position.
   */
  set(pos: RoomPosition, value: number) {
    this.map.set(pos.__packedPos, value);
  }

  /**
   * Get the DistanceMap for a given room.
   */
  getRoom(room: string): DistanceMap | undefined {
    return this.map.get_room(packRoomName(room));
  }

  /**
   * List all the rooms covered by this distance map.
   */
  getRooms(): string[] {
    return [...this.map.get_rooms()].map(room => fromPackedRoomName(room));
  }

  /**
   * Free the memory allocated for this distance map.
   */
  free() {
    this.map.free();
  }
}
