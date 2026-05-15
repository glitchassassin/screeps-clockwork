import { MonoFlowField } from '../wasm/screeps_clockwork';

/**
 * A flow field for a single room that stores one direction per tile.
 */
export class ClockworkMonoFlowField {
  constructor(private _flowField: MonoFlowField) {}

  /**
   * Get the direction for a given coordinate.
   */
  get(x: number, y: number): DirectionConstant | undefined {
    return this._flowField.get(x, y);
  }

  /**
   * Set the direction for a given coordinate.
   */
  set(x: number, y: number, value?: DirectionConstant): void {
    this._flowField.set(x, y, value);
  }
}
