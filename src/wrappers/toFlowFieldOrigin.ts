import { FlowField, js_to_flow_field_origin, Path } from '../wasm/screeps_clockwork';

export function pathToFlowFieldOrigin(start: RoomPosition, flowField: FlowField): Path {
  return js_to_flow_field_origin(start.__packedPos, flowField);
}
