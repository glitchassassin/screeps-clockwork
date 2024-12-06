import { fromPackedRoomName, packRoomName } from '../utils/fromPacked';
import { DistanceMap, MultiroomDistanceMap } from '../wasm/screeps_clockwork';

export class ClockworkMultiroomDistanceMap {
  constructor(private map: MultiroomDistanceMap) {}

  get(pos: RoomPosition): number {
    return this.map.get(pos.__packedPos);
  }

  set(pos: RoomPosition, value: number) {
    this.map.set(pos.__packedPos, value);
  }

  getRoom(room: string): DistanceMap | undefined {
    return this.map.get_room(packRoomName(room));
  }

  getRooms(): string[] {
    return [...this.map.get_rooms()].map(room => fromPackedRoomName(room));
  }

  free() {
    this.map.free();
  }
}
