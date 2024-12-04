import { fromPacked } from '../utils/fromPacked';
import { Path } from '../wasm/screeps_clockwork';

export function pathToArray(path: Path): RoomPosition[] {
  const result: RoomPosition[] = [];
  for (let i = 0; i < path.len(); i++) {
    const packedPos = path.get(i);
    if (packedPos === undefined) {
      throw new Error('Path is invalid');
    }
    result.push(fromPacked(packedPos));
  }
  return result;
}
