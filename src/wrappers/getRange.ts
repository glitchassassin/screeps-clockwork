import { get_range } from '../../wasm';

/**
 * Get the global range between two positions. This is different
 * from the `getRange` method on `RoomPosition`, which gets the
 * range only within the same room.
 *
 * @param pos1 - The first position.
 * @param pos2 - The second position.
 * @returns The range between the two positions.
 */
export function getRange(pos1: RoomPosition, pos2: RoomPosition) {
  return get_range(pos1.__packedPos, pos2.__packedPos);
}
