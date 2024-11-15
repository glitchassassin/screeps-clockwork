import { get_range } from '../../wasm/screeps_clockwork_core';

export function getRange(pos1: RoomPosition, pos2: RoomPosition) {
  return get_range(pos1.__packedPos, pos2.__packedPos);
}
