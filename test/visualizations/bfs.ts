import { bfsDistanceMap, bfsFlowField, bfsMonoFlowField, ClockworkCostMatrix } from '../../src/index';

const UNREACHABLE = 0xffffffff;

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
    const distanceMapArray = distanceMap.toArray();
    distanceMap.free();

    const visual = Game.rooms[room].visual;
    distanceMapArray.forEach((distance, index) => {
      const y = index % 50;
      const x = Math.floor(index / 50);
      if (distance !== UNREACHABLE) {
        console.log(x, y, distance);
        visual.text(`${distance}`, x, y);
      }
    });
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
    const distanceMapArray = distanceMap.toArray();
    distanceMap.free();

    const visual = Game.rooms[room].visual;
    distanceMapArray.forEach((distance, index) => {
      const y = index % 50;
      const x = Math.floor(index / 50);
      if (distance !== UNREACHABLE && distance !== 0) {
        console.log(x, y, distance);
        visual.text(`${distance}`, x, y);
      }
    });
  }
}
