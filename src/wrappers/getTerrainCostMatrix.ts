import { packRoomName } from '../utils/fromPacked';
import { ClockworkCostMatrix, get_terrain_cost_matrix } from '../wasm/screeps_clockwork';

export function getTerrainCostMatrix(
  roomName: string,
  { plainCost, swampCost, wallCost }: { plainCost?: number; swampCost?: number; wallCost?: number } = {}
): ClockworkCostMatrix {
  return get_terrain_cost_matrix(packRoomName(roomName), plainCost, swampCost, wallCost);
}
