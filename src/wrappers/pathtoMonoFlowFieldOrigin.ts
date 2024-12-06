import { MonoFlowField, js_path_to_mono_flow_field_origin } from '../wasm/screeps_clockwork';
import { Path } from './path';

/**
 * Given a monodirectional flow field (for a single room), find the path from a given position to
 * the origin. Never paths through other rooms.
 */
export function pathToMonoFlowFieldOrigin(start: RoomPosition, flowField: MonoFlowField): Path {
  return new Path(js_path_to_mono_flow_field_origin(start.__packedPos, flowField));
}
