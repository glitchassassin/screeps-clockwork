import { MonoFlowField, js_path_to_mono_flow_field_origin } from '../wasm/screeps_clockwork';
import { Path } from './path';

export function pathToMonoFlowFieldOrigin(start: RoomPosition, flowField: MonoFlowField): Path {
  return new Path(js_path_to_mono_flow_field_origin(start.__packedPos, flowField));
}
