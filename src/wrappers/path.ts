import { fromPacked } from '../utils/fromPacked';
import { Path as ClockworkPath } from '../wasm/screeps_clockwork';

export class Path {
  constructor(private readonly path: ClockworkPath) {}

  [Symbol.iterator]() {
    let index = 0;
    const length = this.length;

    return {
      next: () => {
        if (index < length - 1) {
          return { value: this.get(index++), done: false };
        } else {
          return { value: this.get(index++), done: true };
        }
      }
    };
  }

  /**
   * Iterate over the path in reverse order
   */
  *reversed() {
    let index = this.length - 1;

    return {
      next: () => {
        if (index > 0) {
          return { value: this.get(index--), done: false };
        } else {
          return { value: this.get(index--), done: true };
        }
      }
    };
  }

  get(index: number) {
    const packedPos = this.path.get(index);
    if (packedPos === undefined) {
      throw new Error('Index out of bounds');
    }
    return fromPacked(packedPos);
  }

  get length() {
    return this.path.len();
  }

  findNextIndex(index: number) {
    return this.path.find_next_index(index);
  }

  toArray() {
    const result: RoomPosition[] = [];
    for (const packedPos of this.path.to_array()) {
      result.push(fromPacked(packedPos));
    }
    return result;
  }

  toArrayReversed() {
    const result: RoomPosition[] = [];
    for (const packedPos of this.path.to_array_reversed()) {
      result.push(fromPacked(packedPos));
    }
    return result;
  }

  free() {
    this.path.free();
  }
}
