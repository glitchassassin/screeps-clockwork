import { FlowField } from '../wasm/screeps_clockwork';

/**
 * A flow field for a single room that stores multiple directions per tile.
 */
export class ClockworkFlowField {
  constructor(private _flowField: FlowField) {}

  /**
   * Get the internal value for a given coordinate.
   */
  get(x: number, y: number): number {
    return this._flowField.get(x, y);
  }

  /**
   * Set the internal value for a given coordinate.
   */
  set(x: number, y: number, value: number): void {
    this._flowField.set(x, y, value);
  }

  /**
   * Get the list of valid directions for a given coordinate.
   */
  getDirections(x: number, y: number): DirectionConstant[] {
    return this._flowField.getDirections(x, y);
  }

  /**
   * Set the list of valid directions for a given coordinate.
   */
  setDirections(x: number, y: number, directions: DirectionConstant[]): void {
    this._flowField.setDirections(x, y, directions);
  }

  /**
   * Add a direction to the list of valid directions for a given coordinate.
   */
  addDirection(x: number, y: number, direction: DirectionConstant): void {
    this._flowField.addDirection(x, y, direction);
  }

  /**
   * Free the memory allocated for this flow field.
   */
  free(): void {
    this._flowField.free();
  }
}
