import {
  ClockworkCostMatrix,
  dijkstraDistanceMap,
  dijkstraFlowField,
  dijkstraMonoFlowField,
  pathToArray,
  pathToFlowFieldOrigin
} from '../../src/index';
import { FlagVisualizer } from './helpers/FlagVisualizer';
import { visualizeDistanceMap } from './helpers/visualizeDistanceMap';
import { visualizePath } from './helpers/visualizePath';

const UNREACHABLE = 0xffffffff;

function getTerrainCostMatrix(room: string) {
  const costMatrix = new ClockworkCostMatrix();
  const terrain = Game.map.getRoomTerrain(room);
  for (let x = 0; x < 50; x++) {
    for (let y = 0; y < 50; y++) {
      switch (terrain.get(x, y)) {
        case TERRAIN_MASK_WALL:
          costMatrix.set(x, y, 255);
          break;
        case TERRAIN_MASK_SWAMP:
          costMatrix.set(x, y, 5);
          break;
        default:
          costMatrix.set(x, y, 1);
      }
    }
  }
  return costMatrix;
}

const DIRECTION_OFFSET = {
  [TOP]: { x: 0, y: -0.5 },
  [TOP_RIGHT]: { x: 0.5, y: -0.5 },
  [RIGHT]: { x: 0.5, y: 0 },
  [BOTTOM_RIGHT]: { x: 0.5, y: 0.5 },
  [BOTTOM]: { x: 0, y: 0.5 },
  [BOTTOM_LEFT]: { x: -0.5, y: 0.5 },
  [LEFT]: { x: -0.5, y: 0 },
  [TOP_LEFT]: { x: -0.5, y: -0.5 }
};

const DIRECTION_ARROWS = {
  [TOP]: '↑',
  [TOP_RIGHT]: '↗',
  [RIGHT]: '→',
  [BOTTOM_RIGHT]: '↘',
  [BOTTOM]: '↓',
  [BOTTOM_LEFT]: '↙',
  [LEFT]: '←',
  [TOP_LEFT]: '↖'
};

export default [
  {
    name: 'Dijkstra Distance Map',
    color1: COLOR_GREEN,
    color2: COLOR_BLUE,
    /**
     * Visualization of a distance map, where each cell tracks the distance to
     * the nearest flag.
     */
    run(rooms) {
      for (const room in rooms) {
        const flags = rooms[room];
        const costMatrix = getTerrainCostMatrix(room);
        const distanceMap = dijkstraDistanceMap(
          flags.map(flag => flag.pos),
          costMatrix
        );
        visualizeDistanceMap(room, distanceMap);
        distanceMap.free();
      }
    }
  },
  {
    name: 'Dijkstra Flow Field',
    color1: COLOR_GREEN,
    color2: COLOR_CYAN,
    /**
     * Visualization of a flow field, where each cell may have zero to eight
     * viable directions.
     */
    run(rooms) {
      for (const room in rooms) {
        const flags = rooms[room];
        const costMatrix = getTerrainCostMatrix(room);
        const flowField = dijkstraFlowField(
          flags.map(flag => flag.pos),
          costMatrix
        );

        const visual = Game.rooms[room].visual;
        for (let x = 0; x < 50; x++) {
          for (let y = 0; y < 50; y++) {
            const directions = flowField.getDirections(x, y) as DirectionConstant[];
            for (const direction of directions) {
              const offset = DIRECTION_OFFSET[direction];
              visual.line(x, y, x + offset.x, y + offset.y);
            }
          }
        }
        flowField.free();
      }
    }
  },
  {
    name: 'Dijkstra Mono Flow Field',
    color1: COLOR_GREEN,
    color2: COLOR_WHITE,
    /**
     * Visualization of a mono-directional flow field, where each cell has a
     * single direction.
     */
    run(rooms) {
      for (const room in rooms) {
        const flags = rooms[room];
        const costMatrix = getTerrainCostMatrix(room);
        const flowField = dijkstraMonoFlowField(
          flags.map(flag => flag.pos),
          costMatrix
        );

        const visual = Game.rooms[room].visual;
        for (let x = 0; x < 50; x++) {
          for (let y = 0; y < 50; y++) {
            const direction = flowField.get(x, y);
            if (direction) {
              visual.text(DIRECTION_ARROWS[direction], x, y);
            }
          }
        }
        flowField.free();
      }
    }
  },
  {
    name: 'Dijkstra Distance Map Basin',
    color1: COLOR_GREEN,
    color2: COLOR_RED,
    run(rooms) {
      for (const room in rooms) {
        const costMatrix = new ClockworkCostMatrix();
        const walls: RoomPosition[] = [];
        const terrain = Game.map.getRoomTerrain(room);
        for (let x = 0; x < 50; x++) {
          for (let y = 0; y < 50; y++) {
            switch (terrain.get(x, y)) {
              case TERRAIN_MASK_WALL:
                walls.push(new RoomPosition(x, y, room));
                costMatrix.set(x, y, 255);
                break;
              case TERRAIN_MASK_SWAMP:
                costMatrix.set(x, y, 5);
                break;
              default:
                costMatrix.set(x, y, 1);
            }
          }
        }

        const distanceMap = dijkstraDistanceMap(walls, costMatrix);
        visualizeDistanceMap(room, distanceMap);
        distanceMap.free();
      }
    }
  },
  {
    name: 'Dijkstra Path',
    color1: COLOR_GREEN,
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
        const flowField = dijkstraFlowField(
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
