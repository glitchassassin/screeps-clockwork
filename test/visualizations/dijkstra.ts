import { ClockworkCostMatrix, dijkstraDistanceMap, dijkstraFlowField, dijkstraMonoFlowField } from '../../src/index';
import { visualizeDistanceMap } from './helpers/visualizeDistanceMap';

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

/**
 * Visualization of a distance map, where each cell tracks the distance to
 * the nearest flag.
 *
 * Place a GREEN/BLUE flag in a room to trigger this visualization.
 */
export function visualizeDijkstraDistanceMap() {
  const rooms = Object.values(Game.flags).reduce(
    (acc, flag) => {
      if (flag.color === COLOR_GREEN && flag.secondaryColor === COLOR_BLUE) {
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
    const distanceMap = dijkstraDistanceMap(flagPositions, costMatrix);
    visualizeDistanceMap(room, distanceMap);
    distanceMap.free();
  }
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

/**
 * Visualization of a flow field, where each cell may have zero to eight
 * viable directions.
 *
 * Place a GREEN/CYAN flag in a room to trigger this visualization.
 */
export function visualizeDijkstraFlowField() {
  const rooms = Object.values(Game.flags).reduce(
    (acc, flag) => {
      if (flag.color === COLOR_GREEN && flag.secondaryColor === COLOR_CYAN) {
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
    const flowField = dijkstraFlowField(flagPositions, costMatrix);

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

/**
 * Visualization of a mono-directional flow field, where each cell has a
 * single direction.
 *
 * Place a GREEN/WHITE flag in a room to trigger this visualization.
 */
export function visualizeDijkstraMonoFlowField() {
  const rooms = Object.values(Game.flags).reduce(
    (acc, flag) => {
      if (flag.color === COLOR_GREEN && flag.secondaryColor === COLOR_WHITE) {
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
    const flowField = dijkstraMonoFlowField(flagPositions, costMatrix);

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

/**
 * Visualization of "basins," areas that are furthest from terrain walls.
 *
 * Place a GREEN/RED flag in a room to trigger this visualization.
 */
export function visualizeDijkstraDistanceMapBasin() {
  const rooms = Object.values(Game.flags).reduce(
    (acc, flag) => {
      if (flag.color === COLOR_GREEN && flag.secondaryColor === COLOR_RED) {
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
