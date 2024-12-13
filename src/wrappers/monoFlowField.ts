import { js_path_to_mono_flow_field_origin, MonoFlowField } from '../wasm/screeps_clockwork';
import { ClockworkPath } from './path';

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

  /**
   * Free the memory allocated for this flow field.
   */
  free(): void {
    this._flowField.free();
  }

  /**
   * Given a monodirectional flow field (for a single room), find the path from a given position to
   * the origin. Never paths through other rooms.
   */
  pathToOrigin(start: RoomPosition): ClockworkPath {
    return new ClockworkPath(js_path_to_mono_flow_field_origin(start.__packedPos, this._flowField));
  }
}
