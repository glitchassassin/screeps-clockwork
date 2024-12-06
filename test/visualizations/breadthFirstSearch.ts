import {
  bfsDistanceMap,
  bfsFlowField,
  bfsMonoFlowField,
  bfsMultiroomDistanceMap,
  ClockworkCostMatrix,
  pathToDistanceMapOrigin,
  pathToFlowFieldOrigin,
  pathToMonoFlowFieldOrigin
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
    color1: COLOR_RED,
    color2: COLOR_RED,
    /**
     * Visualization of a distance map, where each cell tracks the distance to
     * the nearest flag.
     */
    run(rooms) {
      for (const room in rooms) {
        const flags = rooms[room];
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
    color1: COLOR_RED,
    color2: COLOR_PURPLE,
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
    color1: COLOR_RED,
    color2: COLOR_BLUE,
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
    color1: COLOR_RED,
    color2: COLOR_CYAN,
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
    name: 'BFS Flow Field Path',
    color1: COLOR_RED,
    color2: COLOR_GREEN,
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
        const path = pathToFlowFieldOrigin(originFlag.pos, flowField);
        visualizePath(path);
        path.free();
      }
    }
  },
  {
    name: 'BFS Distance Map Path',
    color1: COLOR_RED,
    color2: COLOR_YELLOW,
    /**
     * Visualization of a BFS distance map-based path.
     */
    run(rooms) {
      for (const room in rooms) {
        const [originFlag, ...targetFlags] = rooms[room];
        if (!originFlag || targetFlags.length === 0) {
          continue;
        }
        const costMatrix = getTerrainCostMatrix(room);
        const distanceMap = bfsDistanceMap(
          targetFlags.map(flag => flag.pos),
          costMatrix
        );
        const path = pathToDistanceMapOrigin(originFlag.pos, distanceMap);
        visualizePath(path);
        path.free();
      }
    }
  },
  {
    name: 'BFS Mono Flow Field Path',
    color1: COLOR_RED,
    color2: COLOR_ORANGE,
    /**
     * Visualization of a BFS mono flow field-based path.
     */
    run(rooms) {
      for (const room in rooms) {
        const [originFlag, ...targetFlags] = rooms[room];
        if (!originFlag || targetFlags.length === 0) {
          continue;
        }
        const costMatrix = getTerrainCostMatrix(room);
        const flowField = bfsMonoFlowField(
          targetFlags.map(flag => flag.pos),
          costMatrix
        );
        const path = pathToMonoFlowFieldOrigin(originFlag.pos, flowField);
        visualizePath(path);
        path.free();
      }
    }
  },
  {
    name: 'BFS Multiroom Distance Map',
    color1: COLOR_RED,
    color2: COLOR_BROWN,
    run(rooms) {
      for (const room in rooms) {
        const start = rooms[room].map(flag => flag.pos);
        const distanceMap = bfsMultiroomDistanceMap(start, {
          costMatrixCallback: room => {
            // TODO: Need to free these cost matrices when we're done with them
            const cm = getTerrainCostMatrix(room);
            return cm;
          },
          maxRoomDistance: 1,
          maxTileDistance: 10
        });
        for (const room of distanceMap.getRooms()) {
          visualizeDistanceMap(room, distanceMap.getRoom(room)!);
        }
        distanceMap.free();
      }
    }
  }
] satisfies FlagVisualizer[];
