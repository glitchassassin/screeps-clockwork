import { DistanceMap } from '../wasm/screeps_clockwork';
import { assertNotFreed, freeHandle } from './freeable';

/**
 * A distance map for a single room.
 */
export class ClockworkDistanceMap {
  private _map: DistanceMap | undefined;

  constructor(map: DistanceMap) {
    this._map = map;
  }

  /**
   * Frees the underlying WASM distance map allocation.
   */
  free(): void {
    this._map = freeHandle(this._map);
  }

  /**
   * Gets the distance value at a given position.
   */
  get(x: number, y: number): number {
    return assertNotFreed(this._map, 'ClockworkDistanceMap').get(x, y);
  }

  /**
   * Sets the distance value at a given position.
   */
  set(x: number, y: number, value: number) {
    assertNotFreed(this._map, 'ClockworkDistanceMap').set(x, y, value);
  }

  /**
   * Converts the distance map into a flat array of distances.
   */
  toArray(): Uint32Array {
    return assertNotFreed(this._map, 'ClockworkDistanceMap').toArray();
  }
}
