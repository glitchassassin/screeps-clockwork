import { fromPacked } from '../utils/fromPacked';
import { Path } from '../wasm/screeps_clockwork';
import { assertNotFreed, freeHandle } from './freeable';

/**
 * A path from a start position to an end position. Typically returned by a
 * function like `ClockworkMultiroomFlowField.pathToOrigin` rather than created directly.
 */
export class ClockworkPath {
  private path: Path | undefined;

  constructor(path: Path) {
    this.path = path;
  }

  /**
   * Frees the underlying WASM path allocation.
   */
  free(): void {
    this.path = freeHandle(this.path);
  }

  /**
   * Iterate over the path.
   *
   * @example
   * ```typescript
   * for (const pos of path) {
   *   console.logUnsafe(pos);
   * }
   * ```
   */
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
   * Iterate over the path in reverse order.
   *
   * @example
   * ```typescript
   * for (const pos of path.reversed()) {
   *   console.logUnsafe(pos);
   * }
   * ```
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

  /**
   * Get the position at a given index.
   */
  get(index: number) {
    const packedPos = assertNotFreed(this.path, 'ClockworkPath').get(index);
    if (packedPos === undefined) {
      throw new Error('Index out of bounds');
    }
    return fromPacked(packedPos);
  }

  /**
   * Get the length of the path.
   */
  get length() {
    return assertNotFreed(this.path, 'ClockworkPath').len();
  }

  /**
   * Given a current position, find the index of the next position in the path.
   */
  findNextIndex(pos: RoomPosition) {
    return assertNotFreed(this.path, 'ClockworkPath').find_next_index(pos.__packedPos);
  }

  /**
   * Convert the path to an array of positions.
   */
  toArray() {
    const result: RoomPosition[] = [];
    for (const packedPos of assertNotFreed(this.path, 'ClockworkPath').to_array()) {
      result.push(fromPacked(packedPos));
    }
    return result;
  }

  /**
   * Convert the path to an array of positions in reverse order.
   */
  toArrayReversed() {
    const result: RoomPosition[] = [];
    for (const packedPos of assertNotFreed(this.path, 'ClockworkPath').to_array_reversed()) {
      result.push(fromPacked(packedPos));
    }
    return result;
  }
}
