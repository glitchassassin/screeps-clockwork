import { FlowField } from '../wasm/screeps_clockwork';
import { assertNotFreed, freeHandle } from './freeable';

/**
 * A flow field for a single room that stores multiple directions per tile.
 */
export class ClockworkFlowField {
  private _flowField: FlowField | undefined;

  constructor(flowField: FlowField) {
    this._flowField = flowField;
  }

  /**
   * Frees the underlying WASM flow field allocation.
   */
  free(): void {
    this._flowField = freeHandle(this._flowField);
  }

  /**
   * Get the internal value for a given coordinate.
   */
  get(x: number, y: number): number {
    return assertNotFreed(this._flowField, 'ClockworkFlowField').get(x, y);
  }

  /**
   * Set the internal value for a given coordinate.
   */
  set(x: number, y: number, value: number): void {
    assertNotFreed(this._flowField, 'ClockworkFlowField').set(x, y, value);
  }

  /**
   * Get the list of valid directions for a given coordinate.
   */
  getDirections(x: number, y: number): DirectionConstant[] {
    return assertNotFreed(this._flowField, 'ClockworkFlowField').getDirections(x, y);
  }

  /**
   * Set the list of valid directions for a given coordinate.
   */
  setDirections(x: number, y: number, directions: DirectionConstant[]): void {
    assertNotFreed(this._flowField, 'ClockworkFlowField').setDirections(x, y, directions);
  }

  /**
   * Add a direction to the list of valid directions for a given coordinate.
   */
  addDirection(x: number, y: number, direction: DirectionConstant): void {
    assertNotFreed(this._flowField, 'ClockworkFlowField').addDirection(x, y, direction);
  }
}
