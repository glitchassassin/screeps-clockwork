import { MonoFlowField } from '../wasm/screeps_clockwork';
import { assertNotFreed, freeHandle } from './freeable';

/**
 * A flow field for a single room that stores one direction per tile.
 */
export class ClockworkMonoFlowField {
  private _flowField: MonoFlowField | undefined;

  constructor(flowField: MonoFlowField) {
    this._flowField = flowField;
  }

  /**
   * Frees the underlying WASM flow field allocation.
   */
  free(): void {
    this._flowField = freeHandle(this._flowField);
  }

  /**
   * Get the direction for a given coordinate.
   */
  get(x: number, y: number): DirectionConstant | undefined {
    return assertNotFreed(this._flowField, 'ClockworkMonoFlowField').get(x, y);
  }

  /**
   * Set the direction for a given coordinate.
   */
  set(x: number, y: number, value?: DirectionConstant): void {
    assertNotFreed(this._flowField, 'ClockworkMonoFlowField').set(x, y, value);
  }
}
