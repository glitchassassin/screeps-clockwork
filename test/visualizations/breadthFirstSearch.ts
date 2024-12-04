import {
  bfsDistanceMap,
  bfsFlowField,
  bfsMonoFlowField,
  ClockworkCostMatrix,
  pathToArray,
  pathToFlowFieldOrigin
} from '../../src/index';
import { getFlagPositionsByRoom } from './helpers/getFlagPositionsByRoom';
import { visualizeDistanceMap } from './helpers/visualizeDistanceMap';
import { visualizeFlowField } from './helpers/visualizeFlowField';
import { visualizeMonoFlowField } from './helpers/visualizeMonoFlowField';
import { visualizePath } from './helpers/visualizePath';

function getTerrainCostMatrix(room: string) {
  const costMatrix = new ClockworkCostMatrix();
  const terrain = Game.map.getRoomTerrain(room);
  for (let x = 0; x < 50; x++) {
    for (let y = 0; y < 50; y++) {
      costMatrix.set(x, y, terrain.get(x, y) === TERRAIN_MASK_WALL ? 255 : 0);
    }
  }
  return costMatrix;
}

/**
 * Visualization of a distance map, where each cell tracks the distance to
 * the nearest flag.
 *
 * Place a BLUE/BLUE flag in a room to trigger this visualization.
 */
export function visualizeBfsDistanceMap() {
  const rooms = Object.values(Game.flags).reduce(
    (acc, flag) => {
      if (flag.color === COLOR_BLUE && flag.secondaryColor === COLOR_BLUE) {
        acc[flag.pos.roomName] ??= [];
        acc[flag.pos.roomName].push(flag.pos);
      }
      return acc;
    },
    {} as Record<string, RoomPosition[]>
  );
  for (const room in rooms) {
    const flagPositions = rooms[room];
    console.log(flagPositions);
    const costMatrix = getTerrainCostMatrix(room);
    const distanceMap = bfsDistanceMap(flagPositions, costMatrix);
    visualizeDistanceMap(room, distanceMap);
    distanceMap.free();
  }
}

/**
 * Visualization of a flow field, where each cell may have zero to eight
 * viable directions.
 *
 * Place a BLUE/CYAN flag in a room to trigger this visualization.
 */
export function visualizeBfsFlowField() {
  const rooms = Object.values(Game.flags).reduce(
    (acc, flag) => {
      if (flag.color === COLOR_BLUE && flag.secondaryColor === COLOR_CYAN) {
        acc[flag.pos.roomName] ??= [];
        acc[flag.pos.roomName].push(flag.pos);
      }
      return acc;
    },
    {} as Record<string, RoomPosition[]>
  );
  for (const room in rooms) {
    const flagPositions = rooms[room];
    const costMatrix = getTerrainCostMatrix(room);
    const flowField = bfsFlowField(flagPositions, costMatrix);
    visualizeFlowField(room, flowField);
    flowField.free();
  }
}

/**
 * Visualization of a mono-directional flow field, where each cell has a
 * single direction.
 *
 * Place a BLUE/WHITE flag in a room to trigger this visualization.
 */
export function visualizeBfsMonoFlowField() {
  const rooms = Object.values(Game.flags).reduce(
    (acc, flag) => {
      if (flag.color === COLOR_BLUE && flag.secondaryColor === COLOR_WHITE) {
        acc[flag.pos.roomName] ??= [];
        acc[flag.pos.roomName].push(flag.pos);
      }
      return acc;
    },
    {} as Record<string, RoomPosition[]>
  );
  for (const room in rooms) {
    const flagPositions = rooms[room];
    const costMatrix = getTerrainCostMatrix(room);
    const flowField = bfsMonoFlowField(flagPositions, costMatrix);
    visualizeMonoFlowField(room, flowField);
    flowField.free();
  }
}

/**
 * Visualization of "basins," areas that are furthest from terrain walls.
 *
 * Place a BLUE/RED flag in a room to trigger this visualization.
 */
export function visualizeBfsDistanceMapBasin() {
  const rooms = Object.values(Game.flags).reduce(
    (acc, flag) => {
      if (flag.color === COLOR_BLUE && flag.secondaryColor === COLOR_RED) {
        acc[flag.pos.roomName] ??= [];
        acc[flag.pos.roomName].push(flag.pos);
      }
      return acc;
    },
    {} as Record<string, RoomPosition[]>
  );
  for (const room in rooms) {
    const costMatrix = new ClockworkCostMatrix();
    const walls: RoomPosition[] = [];
    const terrain = Game.map.getRoomTerrain(room);
    for (let x = 0; x < 50; x++) {
      for (let y = 0; y < 50; y++) {
        if (terrain.get(x, y) === TERRAIN_MASK_WALL) {
          walls.push(new RoomPosition(x, y, room));
          costMatrix.set(x, y, 255);
        } else {
          costMatrix.set(x, y, 0);
        }
      }
    }

    const distanceMap = bfsDistanceMap(walls, costMatrix);
    visualizeDistanceMap(room, distanceMap);
    distanceMap.free();
  }
}

/**
 * Visualization of a BFS path
 *
 * Place a BLUE/BROWN flag and a BLUE/GREY flag in a room to trigger this visualization.
 */
export function visualizeBfsPath() {
  const originFlags = getFlagPositionsByRoom(COLOR_BLUE, COLOR_BROWN);
  const targetFlags = getFlagPositionsByRoom(COLOR_BLUE, COLOR_GREY);

  for (const room in originFlags) {
    if (!(room in targetFlags)) continue;
    const costMatrix = new ClockworkCostMatrix();
    const terrain = Game.map.getRoomTerrain(room);
    for (let x = 0; x < 50; x++) {
      for (let y = 0; y < 50; y++) {
        if (terrain.get(x, y) === TERRAIN_MASK_WALL) {
          costMatrix.set(x, y, 255);
        } else {
          costMatrix.set(x, y, 0);
        }
      }
    }

    const [targetPosition] = targetFlags[room];
    const flowField = bfsFlowField([targetPosition], costMatrix);
    for (const originPosition of originFlags[room]) {
      const clockworkPath = pathToFlowFieldOrigin(originPosition, flowField);
      const path = pathToArray(clockworkPath);
      visualizePath(path);
      clockworkPath.free();
    }
    flowField.free();
  }
}
