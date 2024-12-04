import {
  bfsDistanceMap,
  bfsFlowField,
  bfsMonoFlowField,
  ClockworkCostMatrix,
  pathToArray,
  pathToFlowFieldOrigin
} from '../../src/index';
import { FlagVisualizer } from './helpers/FlagVisualizer';
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

export default [
  {
    name: 'BFS Distance Map',
    color1: COLOR_BLUE,
    color2: COLOR_BLUE,
    /**
     * Visualization of a distance map, where each cell tracks the distance to
     * the nearest flag.
     */
    run(rooms) {
      for (const room in rooms) {
        const flags = rooms[room];
        console.log(flags);
        const costMatrix = getTerrainCostMatrix(room);
        const distanceMap = bfsDistanceMap(
          flags.map(flag => flag.pos),
          costMatrix
        );
        visualizeDistanceMap(room, distanceMap);
        distanceMap.free();
      }
    }
  },
  {
    name: 'BFS Flow Field',
    color1: COLOR_BLUE,
    color2: COLOR_CYAN,
    /**
     * Visualization of a flow field, where each cell may have zero to eight
     * viable directions.
     */
    run(rooms) {
      for (const room in rooms) {
        const flags = rooms[room];
        const costMatrix = getTerrainCostMatrix(room);
        const flowField = bfsFlowField(
          flags.map(flag => flag.pos),
          costMatrix
        );
        visualizeFlowField(room, flowField);
        flowField.free();
      }
    }
  },
  {
    name: 'BFS Mono Flow Field',
    color1: COLOR_BLUE,
    color2: COLOR_WHITE,
    /**
     * Visualization of a mono-directional flow field, where each cell has a
     * single direction.
     */
    run(rooms) {
      for (const room in rooms) {
        const flags = rooms[room];
        const costMatrix = getTerrainCostMatrix(room);
        const flowField = bfsMonoFlowField(
          flags.map(flag => flag.pos),
          costMatrix
        );
        visualizeMonoFlowField(room, flowField);
        flowField.free();
      }
    }
  },
  {
    name: 'BFS Distance Map Basin',
    color1: COLOR_BLUE,
    color2: COLOR_RED,
    /**
     * Visualization of "basins," areas that are furthest from terrain walls.
     */
    run(rooms) {
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
  },
  {
    name: 'BFS Path',
    color1: COLOR_BLUE,
    color2: COLOR_BROWN,
    /**
     * Visualization of a BFS path.
     */
    run(rooms) {
      for (const room in rooms) {
        const [originFlag, ...targetFlags] = rooms[room];
        if (!originFlag || targetFlags.length === 0) {
          continue;
        }
        const costMatrix = getTerrainCostMatrix(room);
        const flowField = bfsFlowField(
          targetFlags.map(flag => flag.pos),
          costMatrix
        );
        const clockworkPath = pathToFlowFieldOrigin(originFlag.pos, flowField);
        const path = pathToArray(clockworkPath);
        visualizePath(path);
        clockworkPath.free();
      }
    }
  }
] satisfies FlagVisualizer[];
