import { FlowField, js_path_to_flow_field_origin } from '../wasm/screeps_clockwork';
import { Path } from './path';

export function pathToFlowFieldOrigin(start: RoomPosition, flowField: FlowField): Path {
  return new Path(js_path_to_flow_field_origin(start.__packedPos, flowField));
}
