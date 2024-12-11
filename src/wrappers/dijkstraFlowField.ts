import { MAX_USIZE } from '../utils/constants';
import { fromPackedRoomName } from '../utils/fromPacked';
import {
  ClockworkCostMatrix,
  js_dijkstra_flow_field,
  js_dijkstra_mono_flow_field,
  js_dijkstra_multiroom_flow_field,
  js_dijkstra_multiroom_mono_flow_field
} from '../wasm/screeps_clockwork';
import { ClockworkFlowField } from './flowField';
import { ClockworkMonoFlowField } from './monoFlowField';
import { ClockworkMultiroomFlowField } from './multiroomFlowField';
import { ClockworkMultiroomMonoFlowField } from './multiroomMonoFlowField';

/**
 * Generate a [flow field](https://glitchassassin.github.io/screeps-clockwork/primitives/flowfield.html) for a set of positions
 * using Dijkstra's algorithm.
 *
 * Dijkstra's algorithm includes variable costs to account for terrain or other cost functions.
 *
 * Note that values of 0 in the cost matrix may have unexpected behavior. You probably want
 * a cost matrix with a default value of at least 1.
 *
 * @param start - The starting positions.
 * @param costMatrix - The cost matrix to use for the flow field.
 * @returns The flow field.
 */
export function dijkstraFlowField(start: RoomPosition[], costMatrix: ClockworkCostMatrix) {
  const startPacked = new Uint32Array(start.map(pos => pos.__packedPos));
  const result = js_dijkstra_flow_field(startPacked, costMatrix);
  return new ClockworkFlowField(result);
}

/**
 * Generate a [mono-directional flow field](https://glitchassassin.github.io/screeps-clockwork/primitives/flowfield.html)
 * for a set of positions using Dijkstra's algorithm.
 *
 * Dijkstra's algorithm includes variable costs to account for terrain or other cost functions.
 *
 * Note that values of 0 in the cost matrix may have unexpected behavior. You probably want
 * a cost matrix with a default value of at least 1.
 *
 * Note that the `roomName` on start positions is ignored - all positions
 * are assumed to be in the same room as the cost matrix.
 *
 * @param start - The starting positions.
 * @param costMatrix - The cost matrix to use for the flow field.
 * @returns The flow field.
 */
export function dijkstraMonoFlowField(start: RoomPosition[], costMatrix: ClockworkCostMatrix) {
  const startPacked = new Uint32Array(start.map(pos => pos.__packedPos));
  const result = js_dijkstra_mono_flow_field(startPacked, costMatrix);
  return new ClockworkMonoFlowField(result);
}

/**
 * Generate a multiroom flow field for a set of positions using Dijkstra's algorithm.
 *
 * Dijkstra's algorithm includes variable costs to account for terrain or other cost functions.
 *
 * Note that values of 0 in the cost matrix may have unexpected behavior. You probably want
 * a cost matrix with a default value of at least 1.
 *
 * @param start - The starting positions.
 * @param costMatrixCallback - A function that returns a cost matrix for a given room name.
 * @param options - Options for the flow field generation.
 * @returns The flow field.
 */
export function dijkstraMultiroomFlowField(
  start: RoomPosition[],
  {
    costMatrixCallback,
    maxTiles = MAX_USIZE,
    maxRooms = MAX_USIZE,
    maxRoomDistance = MAX_USIZE,
    maxTileDistance = MAX_USIZE,
    anyOfDestinations,
    allOfDestinations
  }: {
    costMatrixCallback: (roomName: string) => ClockworkCostMatrix | undefined;
    maxTiles?: number;
    maxRooms?: number;
    maxRoomDistance?: number;
    maxTileDistance?: number;
    anyOfDestinations?: RoomPosition[];
    allOfDestinations?: RoomPosition[];
  }
) {
  if (
    [maxTiles, maxRooms, maxRoomDistance, maxTileDistance].every(n => n === MAX_USIZE) &&
    !anyOfDestinations &&
    !allOfDestinations
  ) {
    throw new Error(
      'At least one of maxTiles, maxRooms, maxRoomDistance, maxTileDistance, anyOfDestinations, or allOfDestinations must be set'
    );
  }

  const startPacked = new Uint32Array(start.map(pos => pos.__packedPos));
  const result = js_dijkstra_multiroom_flow_field(
    startPacked,
    (packedRoomName: number) => {
      const roomName = fromPackedRoomName(packedRoomName);
      return costMatrixCallback(roomName);
    },
    maxTiles,
    maxRooms,
    maxRoomDistance,
    maxTileDistance,
    anyOfDestinations ? new Uint32Array(anyOfDestinations.map(pos => pos.__packedPos)) : undefined,
    allOfDestinations ? new Uint32Array(allOfDestinations.map(pos => pos.__packedPos)) : undefined
  );
  return new ClockworkMultiroomFlowField(result);
}

/**
 * Generate a multiroom mono-directional flow field for a set of positions using Dijkstra's algorithm.
 *
 * Dijkstra's algorithm includes variable costs to account for terrain or other cost functions.
 *
 * Note that values of 0 in the cost matrix may have unexpected behavior. You probably want
 * a cost matrix with a default value of at least 1.
 *
 * @param start - The starting positions.
 * @param costMatrixCallback - A function that returns a cost matrix for a given room name.
 * @param options - Options for the flow field generation.
 * @returns The flow field.
 */
export function dijkstraMultiroomMonoFlowField(
  start: RoomPosition[],
  {
    costMatrixCallback,
    maxTiles = MAX_USIZE,
    maxRooms = MAX_USIZE,
    maxRoomDistance = MAX_USIZE,
    maxTileDistance = MAX_USIZE,
    anyOfDestinations,
    allOfDestinations
  }: {
    costMatrixCallback: (roomName: string) => ClockworkCostMatrix | undefined;
    maxTiles?: number;
    maxRooms?: number;
    maxRoomDistance?: number;
    maxTileDistance?: number;
    anyOfDestinations?: RoomPosition[];
    allOfDestinations?: RoomPosition[];
  }
) {
  if (
    [maxTiles, maxRooms, maxRoomDistance, maxTileDistance].every(n => n === MAX_USIZE) &&
    !anyOfDestinations &&
    !allOfDestinations
  ) {
    throw new Error(
      'At least one of maxTiles, maxRooms, maxRoomDistance, maxTileDistance, anyOfDestinations, or allOfDestinations must be set'
    );
  }

  const startPacked = new Uint32Array(start.map(pos => pos.__packedPos));
  const result = js_dijkstra_multiroom_mono_flow_field(
    startPacked,
    (packedRoomName: number) => {
      const roomName = fromPackedRoomName(packedRoomName);
      return costMatrixCallback(roomName);
    },
    maxTiles,
    maxRooms,
    maxRoomDistance,
    maxTileDistance,
    anyOfDestinations ? new Uint32Array(anyOfDestinations.map(pos => pos.__packedPos)) : undefined,
    allOfDestinations ? new Uint32Array(allOfDestinations.map(pos => pos.__packedPos)) : undefined
  );
  return new ClockworkMultiroomMonoFlowField(result);
}
