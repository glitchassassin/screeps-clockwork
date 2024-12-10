import { fromPackedRoomName } from '../utils/fromPacked';
import {
  ClockworkCostMatrix,
  js_bfs_flow_field,
  js_bfs_mono_flow_field,
  js_bfs_multiroom_flow_field,
  js_bfs_multiroom_mono_flow_field
} from '../wasm/screeps_clockwork';
import { ClockworkFlowField } from './flowField';
import { ClockworkMonoFlowField } from './monoFlowField';
import { ClockworkMultiroomFlowField } from './multiroomFlowField';
import { ClockworkMultiroomMonoFlowField } from './multiroomMonoFlowField';

const MAX_USIZE = 0xffffffff;

/**
 * Generate a [flow field](https://glitchassassin.github.io/screeps-clockwork/primitives/flowfield.html) for a set of positions
 * using a breadth-first search algorithm.
 *
 * The BFS algorithm doesn't include variable costs, and only considers
 * values of 255 (impassible) in the provided cost matrix. Any other
 * values are ignored.
 *
 * This might be useful for creeps with only MOVE parts and/or empty
 * CARRY parts, which don't generate fatigue.
 *
 * @param start - The starting positions.
 * @param costMatrix - The cost matrix to use for the flow field.
 * @returns The flow field.
 */
export function bfsFlowField(start: RoomPosition[], costMatrix: ClockworkCostMatrix) {
  const startPacked = new Uint32Array(start.map(pos => pos.__packedPos));
  const result = js_bfs_flow_field(startPacked, costMatrix);
  return new ClockworkFlowField(result);
}

/**
 * Generate a [mono-directional flow field](https://glitchassassin.github.io/screeps-clockwork/primitives/flowfield.html)
 * for a set of positions using a breadth-first search algorithm.
 *
 * The BFS algorithm doesn't include variable costs, and only considers
 * values of 255 (impassible) in the provided cost matrix. Any other
 * values are ignored.
 *
 * This might be useful for creeps with only MOVE parts and/or empty
 * CARRY parts, which don't generate fatigue.
 *
 * Note that the `roomName` on start positions is ignored - all positions
 * are assumed to be in the same room as the cost matrix.
 *
 * @param start - The starting positions.
 * @param costMatrix - The cost matrix to use for the flow field.
 * @returns The flow field.
 */
export function bfsMonoFlowField(start: RoomPosition[], costMatrix: ClockworkCostMatrix) {
  const startPacked = new Uint32Array(start.map(pos => pos.__packedPos));
  const result = js_bfs_mono_flow_field(startPacked, costMatrix);
  return new ClockworkMonoFlowField(result);
}

/**
 * Generate a multiroom flow field for a set of positions using a breadth-first search algorithm.
 *
 * The BFS algorithm doesn't include variable costs, and only considers
 * values of 255 (impassible) in the provided cost matrix. Any other
 * values are ignored.
 *
 * This might be useful for creeps with only MOVE parts and/or empty
 * CARRY parts, which don't generate fatigue.
 *
 * @param start - The starting positions.
 * @param costMatrixCallback - A function that returns a cost matrix for a given room name.
 * @param options - Options for the flow field generation.
 * @returns The flow field.
 */
export function bfsMultiroomFlowField(
  start: RoomPosition[],
  {
    costMatrixCallback,
    maxTiles = MAX_USIZE,
    maxRooms = MAX_USIZE,
    maxRoomDistance = MAX_USIZE,
    maxTileDistance = MAX_USIZE
  }: {
    costMatrixCallback: (roomName: string) => ClockworkCostMatrix | undefined;
    maxTiles?: number;
    maxRooms?: number;
    maxRoomDistance?: number;
    maxTileDistance?: number;
  }
) {
  if ([maxTiles, maxRooms, maxRoomDistance, maxTileDistance].every(n => n === MAX_USIZE)) {
    throw new Error('At least one of maxTiles, maxRooms, maxRoomDistance, or maxTileDistance must be set');
  }

  const startPacked = new Uint32Array(start.map(pos => pos.__packedPos));
  const result = js_bfs_multiroom_flow_field(
    startPacked,
    (packedRoomName: number) => {
      const roomName = fromPackedRoomName(packedRoomName);
      return costMatrixCallback(roomName);
    },
    maxTiles,
    maxRooms,
    maxRoomDistance,
    maxTileDistance
  );
  return new ClockworkMultiroomFlowField(result);
}

/**
 * Generate a multiroom mono-directional flow field for a set of positions using a breadth-first search algorithm.
 *
 * The BFS algorithm doesn't include variable costs, and only considers
 * values of 255 (impassible) in the provided cost matrix. Any other
 * values are ignored.
 *
 * This might be useful for creeps with only MOVE parts and/or empty
 * CARRY parts, which don't generate fatigue.
 *
 * @param start - The starting positions.
 * @param getCostMatrix - A function that returns a cost matrix for a given room name.
 * @param options - Options for the flow field generation.
 * @returns The flow field.
 */
export function bfsMultiroomMonoFlowField(
  start: RoomPosition[],
  {
    costMatrixCallback,
    maxTiles = MAX_USIZE,
    maxRooms = MAX_USIZE,
    maxRoomDistance = MAX_USIZE,
    maxTileDistance = MAX_USIZE
  }: {
    costMatrixCallback: (roomName: string) => ClockworkCostMatrix | undefined;
    maxTiles?: number;
    maxRooms?: number;
    maxRoomDistance?: number;
    maxTileDistance?: number;
  }
) {
  if ([maxTiles, maxRooms, maxRoomDistance, maxTileDistance].every(n => n === MAX_USIZE)) {
    throw new Error('At least one of maxTiles, maxRooms, maxRoomDistance, or maxTileDistance must be set');
  }

  const startPacked = new Uint32Array(start.map(pos => pos.__packedPos));
  const result = js_bfs_multiroom_mono_flow_field(
    startPacked,
    (packedRoomName: number) => {
      const roomName = fromPackedRoomName(packedRoomName);
      return costMatrixCallback(roomName);
    },
    maxTiles,
    maxRooms,
    maxRoomDistance,
    maxTileDistance
  );
  return new ClockworkMultiroomMonoFlowField(result);
}
